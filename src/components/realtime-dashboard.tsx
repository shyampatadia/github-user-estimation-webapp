"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathBlock } from "@/components/math-block";
import { getHistory } from "@/lib/data";

interface ProbeResult {
  id: number;
  exists: boolean;
  user: {
    id: number;
    login: string;
    type: string;
    created_at: string;
  } | null;
}

interface ScanResult {
  mode: string;
  frontier_id: number;
  frontier_user: {
    id: number;
    login: string;
    type: string;
    created_at: string;
  } | null;
  estimated_total: number;
  probes_count: number;
  probes: ProbeResult[];
  probe_ms: number;
  timestamp: string;
}

interface HistoryPoint {
  time: string;
  frontier: number;
  estimate: number;
}

// Seed value - latest known from history.json
function getInitialFrontier() {
  const h = getHistory();
  return h[h.length - 1]?.frontier_id || 262_206_000;
}

// Derive a baseline hourly growth rate from history.json entries.
// Each entry's daily_new_ids = IDs added since previous day's entry (≈24h gap).
// Average the last 7 entries for stability.
function getBaselineGrowthRate(): number {
  const h = getHistory();
  const recent = h.slice(-7).filter((e) => e.daily_new_ids > 0);
  if (recent.length === 0) return 0;
  const avgDaily = recent.reduce((sum, e) => sum + e.daily_new_ids, 0) / recent.length;
  return Math.round(avgDaily / 24); // → IDs per hour
}

const LS_KEY = "realtime-session";

interface SessionCache {
  lastScanMs: number;
  scanCount: number;
  lastScanTime: string;
  growthRate: number;
}

function loadSession(): SessionCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SessionCache) : null;
  } catch {
    return null;
  }
}

function saveSession(s: SessionCache) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    // ignore quota errors
  }
}

// Live CI computation using analytical variance formula.
// F1-F6 variance contribution is fixed from baseline study.
// F7 variance grows as frontier expands: Var_F7 = M7^2 * p7*(1-p7) / n7
// F1_F6_VAR derived from: baseline analytical_se^2 - Var_F7_original
//   = 791354^2 - (11712000^2 * 0.864525 * 0.135475 / 716) ≈ 6.038e11
const F1_F6_VAR = 6.038e11;
const F7_VAR_COEFF = (0.864525 * 0.135475) / 716; // p*(1-p)/n for F7

function computeLiveCI(frontier: number, estimate: number) {
  const m7 = frontier - 250_000_000;
  const se = Math.sqrt(F1_F6_VAR + m7 * m7 * F7_VAR_COEFF);
  const margin = 1.96 * se;
  const relWidth = (2 * margin) / estimate;
  return {
    lower: Math.round(estimate - margin),
    upper: Math.round(estimate + margin),
    se: Math.round(se),
    relWidth,
  };
}

export function RealtimeDashboard() {
  const initialFrontier = getInitialFrontier();
  const baselineGrowthRate = getBaselineGrowthRate();

  const [isLive, setIsLive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [currentFrontier, setCurrentFrontier] = useState(initialFrontier);
  const [currentEstimate, setCurrentEstimate] = useState(0);
  const [latestUser, setLatestUser] = useState<ScanResult["frontier_user"]>(null);
  const [liveHistory, setLiveHistory] = useState<HistoryPoint[]>([]);
  const [recentProbes, setRecentProbes] = useState<ProbeResult[]>([]);
  // Seed growth rate from history; will be refined by live scans
  const [growthRate, setGrowthRate] = useState(baselineGrowthRate);
  const [lastScanMs, setLastScanMs] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"history" | "live">("history");
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevScanTime = useRef<number>(0);
  const prevFrontier = useRef<number>(initialFrontier);

  // Compute initial estimate from frontier
  useEffect(() => {
    const f1f6 = 7725041 + 32000000 + 45027805 + 41887471 + 37814851 + 39548577;
    const f7 = (currentFrontier - 250000000) * 0.864525;
    setCurrentEstimate(Math.round(f1f6 + f7));
  }, [currentFrontier]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      if (session.lastScanMs > 0) setLastScanMs(session.lastScanMs);
      if (session.scanCount > 0) setScanCount(session.scanCount);
      if (session.lastScanTime) setLastScanTime(session.lastScanTime);
      // Only override history-derived rate if session has a live-measured rate
      if (session.growthRate > 0) {
        setGrowthRate(session.growthRate);
        setDataSource("live");
      }
    }
  }, []);

  const formatESTFull = (date: Date) =>
    date.toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }) + " EST";

  const performScan = useCallback(async () => {
    if (isScanning) return;
    setIsScanning(true);
    setError(null);

    try {
      const res = await fetch(`/api/probe?last=${currentFrontier}&mode=scan`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ScanResult = await res.json();

      const now = Date.now();
      const timeDiffHours = prevScanTime.current > 0
        ? (now - prevScanTime.current) / (1000 * 60 * 60)
        : 0;
      const idDiff = data.frontier_id - prevFrontier.current;

      if (timeDiffHours > 0 && idDiff > 0) {
        setGrowthRate(Math.round(idDiff / timeDiffHours));
      }

      prevScanTime.current = now;
      prevFrontier.current = data.frontier_id;

      setCurrentFrontier(data.frontier_id);
      setCurrentEstimate(data.estimated_total);
      setLatestUser(data.frontier_user);
      setLastScanMs(data.probe_ms);
      const newScanCount = scanCount + 1;
      setScanCount(newScanCount);
      const scanTimeStr = formatESTFull(new Date());
      setLastScanTime(scanTimeStr);

      // Persist session so values survive page refresh
      saveSession({
        lastScanMs: data.probe_ms,
        scanCount: newScanCount,
        lastScanTime: scanTimeStr,
        growthRate: timeDiffHours > 0 && idDiff > 0
          ? Math.round(idDiff / timeDiffHours)
          : growthRate,
      });

      if (timeDiffHours > 0 && idDiff > 0) setDataSource("live");

      setRecentProbes((prev) => {
        const newProbes = [...data.probes.filter((p) => p.exists), ...prev];
        return newProbes.slice(0, 50);
      });

      const timeStr = new Date().toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setLiveHistory((prev) => {
        const next = [
          ...prev,
          { time: timeStr, frontier: data.frontier_id, estimate: data.estimated_total },
        ];
        return next.slice(-60);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setIsScanning(false);
    }
  }, [currentFrontier, isScanning, scanCount, growthRate]);

  useEffect(() => {
    if (isLive) {
      performScan();
      intervalRef.current = setInterval(performScan, 30000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLive]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (n: number) => n.toLocaleString("en-US");
  const fmtBig = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    return fmt(n);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  };

  const createdAtEST = (iso: string) => {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) + " EST";
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsLive(!isLive)}
            variant={isLive ? "default" : "outline"}
            className={isLive ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          >
            <span className={`inline-block h-2 w-2 rounded-full mr-2 ${isLive ? "bg-white animate-pulse" : "bg-muted-foreground"}`} />
            {isLive ? "LIVE" : "Start Live"}
          </Button>
          <Button onClick={performScan} variant="outline" disabled={isScanning}>
            {isScanning ? (
              <>
                <svg className="h-4 w-4 mr-2 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Scanning...
              </>
            ) : (
              "Manual Scan"
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {lastScanTime && (
            <Badge variant="secondary" className="font-mono text-xs">
              Last scan: {lastScanTime}
            </Badge>
          )}
          {scanCount > 0 && (
            <Badge variant="secondary" className="font-mono text-xs">
              {scanCount} scans | {lastScanMs}ms
            </Badge>
          )}
          {isLive && (
            <Badge variant="secondary" className="font-mono text-xs">
              Auto-refresh: 30s
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Hero Numbers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border gradient-border overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-3 right-3">
              {isLive && (
                <span className="flex items-center gap-1.5 text-xs text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Current Frontier ID
            </p>
            <p className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-foreground tracking-tight">
              {fmt(currentFrontier)}
            </p>
            {latestUser && (
              <div className="mt-3 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    @{latestUser.login}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${latestUser.type === "User" ? "text-blue-400" : latestUser.type === "Organization" ? "text-purple-400" : "text-orange-400"}`}
                  >
                    {latestUser.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Created: {createdAtEST(latestUser.created_at)} ({timeAgo(latestUser.created_at)})
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border gradient-border overflow-hidden">
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Estimated Valid Users
            </p>
            <p className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-green-400 tracking-tight glow-text">
              ~{fmtBig(currentEstimate)}
            </p>
            {currentEstimate > 0 && (() => {
              const ci = computeLiveCI(currentFrontier, currentEstimate);
              return (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    95% CI:{" "}
                    <span className="font-mono text-foreground">
                      [{fmtBig(ci.lower)}, {fmtBig(ci.upper)}]
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SE: <span className="font-mono text-foreground">{fmt(ci.se)}</span>
                    {" · "}
                    Rel. width: <span className="font-mono text-foreground">{(ci.relWidth * 100).toFixed(2)}%</span>
                  </p>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Growth Rate</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${dataSource === "live" ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                {dataSource === "live" ? "live" : "history"}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-400 font-mono tabular-nums">
              {fmt(growthRate)}/hr
            </p>
            <p className="text-xs text-muted-foreground mt-1">IDs allocated per hour</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">New Users/Hr</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${dataSource === "live" ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                {dataSource === "live" ? "live" : "history"}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-400 font-mono tabular-nums">
              ~{fmt(Math.round(growthRate * 0.8182))}/hr
            </p>
            <p className="text-xs text-muted-foreground mt-1">At 81.82% validity</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Daily Rate</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${dataSource === "live" ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                {dataSource === "live" ? "live" : "history"}
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-400 font-mono tabular-nums">
              ~{fmtBig(growthRate * 24)}/day
            </p>
            <p className="text-xs text-muted-foreground mt-1">Extrapolated 24h</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Scan Latency</p>
              {lastScanMs > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                  {scanCount} scans
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-purple-400 font-mono tabular-nums">
              {lastScanMs > 0 ? `${lastScanMs}ms` : "--"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lastScanMs > 0 ? `${recentProbes.length} probes this session` : "Run a scan to measure"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Chart */}
      {liveHistory.length > 1 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live Frontier Tracking (Session)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveHistory} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "hsl(215, 18%, 68%)" }}
                    axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(215, 18%, 68%)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => fmtBig(v)}
                    width={55}
                    domain={["dataMin - 1000", "dataMax + 1000"]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
                          <p className="font-medium text-foreground mb-1">{label} EST</p>
                          {payload.map((p, i) => (
                            <p key={i} className="text-muted-foreground">
                              {p.name}: <span className="font-mono text-foreground">{fmt(Number(p.value))}</span>
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="frontier"
                    name="Frontier ID"
                    stroke="hsl(212, 92%, 45%)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(212, 92%, 45%)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Discoveries Timeline */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent Discoveries</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProbes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No probes yet. Hit &quot;Manual Scan&quot; or enable Live mode to start tracking.
            </p>
          ) : (
            <div className="space-y-0 max-h-[400px] overflow-y-auto">
              {recentProbes.map((probe, i) => (
                <div
                  key={`${probe.id}-${i}`}
                  className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
                >
                  <div className="relative flex-shrink-0">
                    <div className={`h-2 w-2 rounded-full ${i === 0 ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                    {i === 0 && (
                      <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping" />
                    )}
                  </div>
                  <span className="font-mono text-sm font-medium text-foreground tabular-nums w-28 flex-shrink-0">
                    {fmt(probe.id)}
                  </span>
                  {probe.user && (
                    <>
                      <span className="font-mono text-sm text-primary truncate max-w-[140px]">
                        @{probe.user.login}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs flex-shrink-0 ${
                          probe.user.type === "User"
                            ? "text-blue-400"
                            : probe.user.type === "Organization"
                            ? "text-purple-400"
                            : "text-orange-400"
                        }`}
                      >
                        {probe.user.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto flex-shrink-0 font-mono">
                        {createdAtEST(probe.user.created_at)}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projections link */}
      <div className="flex items-center gap-2 rounded-md border border-border/50 bg-secondary/20 px-4 py-3">
        <svg className="h-4 w-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
        <p className="text-sm text-muted-foreground">
          Growth projections (30d, 90d, 1yr) are available on the{" "}
          <a href="/" className="text-primary hover:underline font-medium">Dashboard</a>.
        </p>
      </div>

      {/* How Scanning Works */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">How Scanning Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Live Mode */}
            <div className="rounded-md border border-red-500/20 bg-red-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-foreground">Live Mode</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Automatically re-runs a scan every <span className="text-foreground font-medium">30 seconds</span>.
                Each scan makes ~12 GitHub API calls to locate the current frontier and recomputes the population estimate.
                Use this to watch the frontier advance in real time.
              </p>
            </div>
            {/* Manual Scan */}
            <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
                </svg>
                <span className="text-sm font-semibold text-foreground">Manual Scan</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Runs a <span className="text-foreground font-medium">single on-demand scan</span> using the same algorithm.
                Useful for checking the current frontier without continuous polling.
              </p>
            </div>
          </div>

          {/* Algorithm */}
          <div className="rounded-md bg-secondary/40 p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Scan Algorithm (~12 API calls per scan)</p>
            <ol className="space-y-2 text-sm text-muted-foreground list-none">
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mt-0.5">1</span>
                <span><span className="text-foreground font-medium">Exponential forward scan</span> — probes at +1K, +2K, +4K, +8K, +16K, +32K from last known frontier until a 404 is hit. Finds the overshoot boundary in O(log gap) calls.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mt-0.5">2</span>
                <span><span className="text-foreground font-medium">Binary search</span> — narrows the gap between the last valid ID and the overshoot to ~200 ID precision in ~4 calls.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mt-0.5">3</span>
                <span><span className="text-foreground font-medium">Fine forward scan</span> — probes +100 steps from the refined frontier to push it as far forward as possible before committing.</span>
              </li>
            </ol>
          </div>

          {/* Estimate formula — step-by-step derivation */}
          <div className="rounded-md bg-secondary/40 p-4 space-y-4">
            <p className="text-sm font-semibold text-foreground">Where does the estimate come from?</p>

            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold mt-0.5">1</span>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-foreground">Measure validity rate in each ID range (stratum)</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We randomly sampled IDs from 7 ranges (strata) and called the GitHub API on each one.
                  An ID is <span className="text-green-400 font-medium">valid</span> if GitHub returns a user/org,{" "}
                  <span className="text-red-400 font-medium">invalid</span> (deleted/never assigned) if it returns 404.
                  This gives us <span className="font-mono text-foreground">p̂ₕ</span> — the fraction of valid IDs in stratum h.
                </p>
                <div className="font-mono text-sm text-muted-foreground bg-secondary/60 rounded px-3 py-1.5">
                  e.g. F3 (50M–100M): 2,753 valid / 3,057 sampled → p̂₃ = <span className="text-foreground font-semibold">0.9006</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold mt-0.5">2</span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Scale up to the full stratum size</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each stratum has a known total number of IDs (<span className="font-mono text-foreground">Mₕ</span>).
                  Multiplying gives the estimated valid accounts in that stratum:
                </p>
                <div className="overflow-x-auto pt-1">
                  <MathBlock math="\hat{N}_h = M_h \times \hat{p}_h" display={false} />
                </div>
                <div className="font-mono text-sm text-muted-foreground bg-secondary/60 rounded px-3 py-1.5">
                  e.g. F3: 50,000,000 × 0.9006 = <span className="text-foreground font-semibold">45,027,805</span> valid accounts
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold mt-0.5">3</span>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-foreground">Sum across all strata</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  F1–F6 have fixed sizes (their ID ranges are fully defined). Their contributions are computed once from the baseline study.
                </p>
                <div className="overflow-x-auto pt-1">
                  <MathBlock math="\hat{N} = \sum_{h=1}^{7} M_h \cdot \hat{p}_h" display={false} />
                </div>
              </div>
            </div>

            {/* Step 4 — Live part */}
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-xs font-bold mt-0.5">4</span>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-foreground">F7 is the only live part</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Stratum F7 starts at ID 250,000,001 and its upper bound grows daily as GitHub creates new accounts.
                  Each scan finds the current frontier ID, making{" "}
                  <span className="font-mono text-foreground">M₇ = frontier − 250M</span>.
                  The validity rate <span className="font-mono text-foreground">p̂₇ = 0.8645</span> stays fixed from the study.
                </p>
                <div className="overflow-x-auto pt-1">
                  <MathBlock math="\hat{N} = \underbrace{203{,}993{,}745}_{\text{F1–F6 (fixed)}} + \underbrace{(F_{\text{frontier}} - 250\text{M}) \times 0.8645}_{\text{F7 (live)}}" display={false} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
