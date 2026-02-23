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

// Derive a baseline hourly growth rate from history.json.
// Computes actual frontier diff / actual day diff between consecutive dated entries
// so it's robust to variable cron intervals and multi-day gaps.
const MAX_REALISTIC_HOURLY = 60_000; // sanity cap: >60K IDs/hr is implausible

function getBaselineGrowthRate(): number {
  const h = getHistory();
  if (h.length < 2) return 0;

  const rates: number[] = [];
  for (let i = 1; i < h.length; i++) {
    const dayDiff =
      (new Date(h[i].date).getTime() - new Date(h[i - 1].date).getTime()) /
      (1000 * 60 * 60 * 24);
    const idDiff = h[i].frontier_id - h[i - 1].frontier_id;
    // Only use pairs where dates differ and the gap is ≤ 7 days (ignore stale jumps)
    if (dayDiff >= 1 && dayDiff <= 7 && idDiff > 0) {
      rates.push(idDiff / dayDiff / 24); // → IDs per hour
    }
  }

  if (rates.length === 0) return 0;
  const recent = rates.slice(-7);
  const avg = recent.reduce((sum, r) => sum + r, 0) / recent.length;
  return Math.round(Math.min(avg, MAX_REALISTIC_HOURLY));
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
    // Purge any previously-saved session that has an implausible growth rate
    // (could have been saved by an earlier bug where close-together scans gave huge rates)
    const raw = loadSession();
    if (raw && raw.growthRate > MAX_REALISTIC_HOURLY) {
      saveSession({ ...raw, growthRate: 0 });
    }
    const session = loadSession();
    if (session) {
      if (session.lastScanMs > 0) setLastScanMs(session.lastScanMs);
      if (session.scanCount > 0) setScanCount(session.scanCount);
      if (session.lastScanTime) setLastScanTime(session.lastScanTime);
      // Only override history-derived rate if session has a plausible live-measured rate
      if (session.growthRate > 0 && session.growthRate <= MAX_REALISTIC_HOURLY) {
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

      // Only update live rate when scans are ≥5 min apart (prevents div-by-tiny-number)
      // and the result is within a realistic range
      const MIN_GAP_HRS = 5 / 60;
      if (timeDiffHours >= MIN_GAP_HRS && idDiff > 0) {
        const liveRate = Math.round(idDiff / timeDiffHours);
        if (liveRate <= MAX_REALISTIC_HOURLY) {
          setGrowthRate(liveRate);
        }
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
      // Only save a live-computed rate if it was valid (≥5 min gap, within realistic range)
      const computedLiveRate = timeDiffHours >= MIN_GAP_HRS && idDiff > 0
        ? Math.round(idDiff / timeDiffHours)
        : null;
      const rateToSave = (computedLiveRate !== null && computedLiveRate <= MAX_REALISTIC_HOURLY)
        ? computedLiveRate
        : growthRate;
      saveSession({
        lastScanMs: data.probe_ms,
        scanCount: newScanCount,
        lastScanTime: scanTimeStr,
        growthRate: rateToSave,
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
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Hero Numbers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-xl bg-card border-border gradient-border overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-3 right-3">
              {isLive && (
                <span className="flex items-center gap-1.5 text-xs text-red-400">
                  <span className="data-pulse h-1.5 w-1.5 rounded-full bg-red-500" />
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

        <Card className="rounded-xl bg-card border-border gradient-border overflow-hidden">
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Estimated Valid Users
            </p>
            <p className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-emerald-400 tracking-tight">
              ~{fmtBig(currentEstimate)}
            </p>
            {currentEstimate > 0 && (() => {
              const ci = computeLiveCI(currentFrontier, currentEstimate);
              return (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div
                    className="rounded-lg p-3"
                    style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)" }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "rgba(52,211,153,0.7)" }}>
                      95% Confidence Range
                    </p>
                    <p className="font-mono text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
                      {fmtBig(ci.lower)} – {fmtBig(ci.upper)}
                    </p>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Margin of Error
                    </p>
                    <p className="font-mono text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
                      ±{(ci.relWidth * 50).toFixed(2)}%
                    </p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-xl bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Growth Rate</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${dataSource === "live" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                {dataSource === "live" ? "live" : "est."}
              </span>
            </div>
            <p className="text-2xl font-bold text-primary font-mono tabular-nums">
              {fmt(growthRate)}/hr
            </p>
            <p className="text-[12px] mt-1.5" style={{ color: "rgba(255,255,255,0.58)" }}>New IDs per hour</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>New Users/Hr</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${dataSource === "live" ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground"}`}>
                {dataSource === "live" ? "live" : "est."}
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              ~{fmt(Math.round(growthRate * 0.8182))}/hr
            </p>
            <p className="text-[12px] mt-1.5" style={{ color: "rgba(255,255,255,0.58)" }}>At 81.8% validity rate</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Daily Rate</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${dataSource === "live" ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground"}`}>
                {dataSource === "live" ? "live" : "est."}
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
              ~{fmtBig(growthRate * 24)}/day
            </p>
            <p className="text-[12px] mt-1.5" style={{ color: "rgba(255,255,255,0.58)" }}>Extrapolated 24 hours</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Scan Latency</p>
              {lastScanMs > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                  {scanCount} scans
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-violet-400 font-mono tabular-nums">
              {lastScanMs > 0 ? `${lastScanMs}ms` : "--"}
            </p>
            <p className="text-[12px] mt-1.5" style={{ color: "rgba(255,255,255,0.58)" }}>
              {lastScanMs > 0 ? `${recentProbes.length} probes this session` : "Run a scan to measure"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Chart */}
      {liveHistory.length > 1 && (
        <Card className="rounded-xl bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="data-pulse h-2 w-2 rounded-full bg-emerald-500" />
              Live Frontier Tracking (Session)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveHistory} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 18%)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "hsl(215, 18%, 68%)" }}
                    axisLine={{ stroke: "hsl(220, 13%, 18%)" }}
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
                    stroke="hsl(212, 72%, 58%)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(212, 72%, 58%)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Discoveries Timeline */}
      <Card className="rounded-xl bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent Discoveries</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProbes.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.62)" }}>
                No probes yet. Hit &quot;Manual Scan&quot; or enable Live mode to start tracking.
              </p>
            </div>
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
      <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "rgba(99,155,230,0.07)", border: "1px solid rgba(99,155,230,0.18)" }}>
        <svg className="h-4 w-4 shrink-0" style={{ color: "rgba(99,155,230,0.85)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
        <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.75)" }}>
          Growth projections (30d, 90d, 1yr) are available on the{" "}
          <a href="/" className="font-semibold hover:underline" style={{ color: "rgba(99,155,230,0.95)" }}>Dashboard</a>.
        </p>
      </div>

      {/* How Scanning Works */}
      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>How Scanning Works</h2>
        </div>
        <div className="p-6 space-y-6">

          {/* Mode cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl p-5 space-y-3" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)" }}>
              <div className="flex items-center gap-2.5">
                <span className="data-pulse h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                <span className="text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>Live Mode</span>
              </div>
              <p className="text-[15px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.75)" }}>
                Automatically re-runs a scan every{" "}
                <span style={{ color: "#f87171" }} className="font-semibold">30 seconds</span>.
                Each scan probes the GitHub API to locate the current frontier and recompute the
                population estimate.
              </p>
            </div>
            <div className="rounded-xl p-5 space-y-3" style={{ background: "rgba(99,155,230,0.07)", border: "1px solid rgba(99,155,230,0.22)" }}>
              <div className="flex items-center gap-2.5">
                <svg className="h-4 w-4 shrink-0" style={{ color: "rgba(99,155,230,0.9)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
                </svg>
                <span className="text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>Manual Scan</span>
              </div>
              <p className="text-[15px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.75)" }}>
                Runs a{" "}
                <span style={{ color: "rgba(99,155,230,0.9)" }} className="font-semibold">single on-demand scan</span>{" "}
                using the same algorithm. Useful for checking the frontier without continuous polling.
              </p>
            </div>
          </div>

          {/* Algorithm steps */}
          <div className="rounded-xl p-6 space-y-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
              Scan Algorithm
            </p>
            <ol className="space-y-5 list-none">
              {[
                { n: "1", title: "Exponential scan", body: "Probes IDs at +1K, +2K, +4K, +8K, +16K, +32K ahead of the last known frontier until a missing account is found. Locates the boundary in just a few calls.", color: "#639BE6", bg: "rgba(99,155,230,0.18)" },
                { n: "2", title: "Binary search", body: "Narrows the exact boundary between the last valid ID and the first missing one — down to roughly 200-ID precision in about 4 calls.", color: "#FBBF24", bg: "rgba(251,191,36,0.18)" },
                { n: "3", title: "Fine scan", body: "Advances forward in small +100 steps from the refined position to push the frontier as far ahead as possible before recording.", color: "#34D399", bg: "rgba(52,211,153,0.18)" },
              ].map((step) => (
                <li key={step.n} className="flex items-start gap-4">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold font-mono mt-0.5"
                    style={{ background: step.bg, color: step.color }}
                  >
                    {step.n}
                  </span>
                  <div>
                    <span className="text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>{step.title} — </span>
                    <span className="text-[15px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.75)" }}>{step.body}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Estimate derivation */}
          <div className="rounded-xl p-6 space-y-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
              Where does the estimate come from?
            </p>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold font-mono mt-0.5" style={{ background: "rgba(99,155,230,0.18)", color: "#639BE6" }}>1</span>
                <div className="space-y-2 flex-1">
                  <p className="text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>
                    Measure how many IDs are valid in each range
                  </p>
                  <p className="text-[15px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.75)" }}>
                    We randomly sampled IDs from 7 ranges and called GitHub's API on each one.
                    An ID is <span style={{ color: "#4ade80" }} className="font-semibold">valid</span> if it returns a real user or org,{" "}
                    <span style={{ color: "#f87171" }} className="font-semibold">invalid</span> if it returns "not found".
                    This gives the validity rate for each range.
                  </p>
                  <div className="rounded-lg px-4 py-3 mt-1" style={{ background: "rgba(99,155,230,0.1)", border: "1px solid rgba(99,155,230,0.2)" }}>
                    <span className="text-[14px] font-mono" style={{ color: "rgba(255,255,255,0.85)" }}>
                      Range F3 (50M–100M): 2,753 valid out of 3,057 sampled = <span style={{ color: "#639BE6" }} className="font-bold">90.1% validity</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold font-mono mt-0.5" style={{ background: "rgba(251,191,36,0.18)", color: "#FBBF24" }}>2</span>
                <div className="space-y-2 flex-1">
                  <p className="text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>
                    Scale up to the full range size
                  </p>
                  <p className="text-[15px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.75)" }}>
                    Each range spans a known number of IDs. Multiplying the range size by its validity
                    rate gives the estimated number of real accounts in that range.
                  </p>
                  <div className="rounded-lg px-4 py-3 mt-1" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.18)" }}>
                    <span className="text-[14px] font-mono" style={{ color: "rgba(255,255,255,0.85)" }}>
                      F3: 50,000,000 IDs × 90.1% = <span style={{ color: "#FBBF24" }} className="font-bold">45,027,805 real accounts</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold font-mono mt-0.5" style={{ background: "rgba(167,139,250,0.18)", color: "#A78BFA" }}>3</span>
                <div className="space-y-2 flex-1">
                  <p className="text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>
                    Add up all ranges
                  </p>
                  <p className="text-[15px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.75)" }}>
                    Ranges F1–F6 have fixed boundaries, so their counts are computed once and stay constant.
                    Together they contribute <span className="font-mono font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>203,993,745</span> accounts.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold font-mono mt-0.5" style={{ background: "rgba(52,211,153,0.18)", color: "#34D399" }}>4</span>
                <div className="space-y-2 flex-1">
                  <p className="text-[16px] font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>
                    Range F7 grows live
                  </p>
                  <p className="text-[15px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.75)" }}>
                    The final range starts at ID 250,000,001 and its upper bound moves forward every day.
                    Each scan finds today's frontier, so{" "}
                    <span className="font-mono font-semibold" style={{ color: "#34D399" }}>F7 size = frontier − 250M</span>.
                    The 86.45% validity rate stays fixed from the original study.
                  </p>
                </div>
              </div>
            </div>

            {/* Final formula */}
            <div
              className="rounded-xl p-4 overflow-x-auto"
              style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <MathBlock math="\hat{N} = \underbrace{203{,}993{,}745}_{\text{ranges F1–F6 (fixed)}} + \underbrace{(F_{\text{frontier}} - 250\text{M}) \times 0.8645}_{\text{range F7 (updates live)}}" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
