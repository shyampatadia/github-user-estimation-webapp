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
import { getBaseline, getHistory } from "@/lib/data";

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

export function RealtimeDashboard() {
  const baseline = getBaseline();
  const dailyHistory = getHistory();
  const initialFrontier = getInitialFrontier();

  const [isLive, setIsLive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [currentFrontier, setCurrentFrontier] = useState(initialFrontier);
  const [currentEstimate, setCurrentEstimate] = useState(0);
  const [latestUser, setLatestUser] = useState<ScanResult["frontier_user"]>(null);
  const [liveHistory, setLiveHistory] = useState<HistoryPoint[]>([]);
  const [recentProbes, setRecentProbes] = useState<ProbeResult[]>([]);
  const [growthRate, setGrowthRate] = useState(0);
  const [lastScanMs, setLastScanMs] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
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
      setScanCount((c) => c + 1);
      setLastScanTime(formatESTFull(new Date()));

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
  }, [currentFrontier, isScanning]);

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

  // Projections using average daily growth
  const avgDailyGrowth = dailyHistory.length >= 2
    ? (dailyHistory[dailyHistory.length - 1].frontier_id - dailyHistory[0].frontier_id) / Math.max(dailyHistory.length - 1, 1)
    : 400000;

  const projections = [30, 90, 365].map((days) => {
    const projFrontier = currentFrontier + Math.round(avgDailyGrowth * days);
    const projUsers = Math.round(projFrontier * baseline.estimate.validity_rate);
    return { days, label: days === 365 ? "1 Year" : `${days} Days`, projFrontier, projUsers };
  });

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
            <div className="mt-3">
              <MathBlock
                math="\hat{N} = \sum_{h=1}^{7} M_h \cdot \hat{p}_h"
                display={false}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Growth Rate</p>
            <p className="text-xl font-bold text-blue-400 font-mono tabular-nums">
              {growthRate > 0 ? `${fmt(growthRate)}/hr` : "--"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">IDs allocated per hour</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">New Users/Hr</p>
            <p className="text-xl font-bold text-green-400 font-mono tabular-nums">
              {growthRate > 0 ? `~${fmt(Math.round(growthRate * 0.8182))}/hr` : "--"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">At 81.82% validity</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Daily Rate</p>
            <p className="text-xl font-bold text-orange-400 font-mono tabular-nums">
              {growthRate > 0 ? `~${fmtBig(growthRate * 24)}/day` : "--"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Extrapolated</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Scan Latency</p>
            <p className="text-xl font-bold text-purple-400 font-mono tabular-nums">
              {lastScanMs > 0 ? `${lastScanMs}ms` : "--"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{scanCount} scans, {recentProbes.length} probes</p>
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
                    tick={{ fontSize: 10, fill: "hsl(215, 14%, 55%)" }}
                    axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(215, 14%, 55%)" }}
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
                        className={`text-[10px] flex-shrink-0 ${
                          probe.user.type === "User"
                            ? "text-blue-400"
                            : probe.user.type === "Organization"
                            ? "text-purple-400"
                            : "text-orange-400"
                        }`}
                      >
                        {probe.user.type}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground ml-auto flex-shrink-0 font-mono">
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

      {/* Projections */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Linear Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Based on ~{fmt(Math.round(avgDailyGrowth))} new IDs/day and {(baseline.estimate.validity_rate * 100).toFixed(1)}% validity rate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {projections.map((p) => (
              <div key={p.days} className="rounded-lg border border-border p-4 bg-secondary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{p.label}</p>
                <p className="text-xl font-bold text-foreground font-mono tabular-nums">
                  ~{fmtBig(p.projUsers)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Frontier: ~{fmtBig(p.projFrontier)}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4">
            Linear extrapolations assuming constant growth and validity rates.
          </p>
        </CardContent>
      </Card>

      {/* Estimation Formula */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Live Estimation Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The estimate is recomputed by extending stratum F7 to the live frontier,
            keeping all validity rates fixed from our baseline study of 16,000 samples.
          </p>

          <div className="rounded-md bg-secondary/50 p-4 overflow-x-auto">
            <MathBlock math="\hat{N} = \sum_{h=1}^{7} M_h \cdot \hat{p}_h" />
          </div>

          <div className="rounded-md bg-secondary/50 p-4 font-mono text-xs leading-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-muted-foreground border-b border-border/50">
                  <th className="text-left pb-2 pr-4">Stratum</th>
                  <th className="text-left pb-2 pr-4">Range</th>
                  <th className="text-right pb-2 pr-4">M_h</th>
                  <th className="text-right pb-2 pr-4">p&#770;_h</th>
                  <th className="text-right pb-2">Contribution</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "F1", range: "1 - 10M", size: "10,000,000", p: "0.7725", val: "7,725,041" },
                  { id: "F2", range: "10M - 50M", size: "40,000,000", p: "0.8000", val: "32,000,000" },
                  { id: "F3", range: "50M - 100M", size: "50,000,000", p: "0.9006", val: "45,027,805" },
                  { id: "F4", range: "100M - 150M", size: "50,000,000", p: "0.8377", val: "41,887,471" },
                  { id: "F5", range: "150M - 200M", size: "50,000,000", p: "0.7563", val: "37,814,851" },
                  { id: "F6", range: "200M - 250M", size: "50,000,000", p: "0.7910", val: "39,548,577" },
                ].map((row) => (
                  <tr key={row.id} className="border-b border-border/30">
                    <td className="py-1.5 pr-4 text-blue-400">{row.id}</td>
                    <td className="py-1.5 pr-4 text-muted-foreground">{row.range}</td>
                    <td className="py-1.5 pr-4 text-right">{row.size}</td>
                    <td className="py-1.5 pr-4 text-right">{row.p}</td>
                    <td className="py-1.5 text-right text-foreground">{row.val}</td>
                  </tr>
                ))}
                <tr className="border-b border-border/30">
                  <td className="py-1.5 pr-4 text-green-400 font-semibold">F7</td>
                  <td className="py-1.5 pr-4 text-green-400">250M - {fmtBig(currentFrontier)}</td>
                  <td className="py-1.5 pr-4 text-right text-green-400">{fmt(currentFrontier - 250_000_000)}</td>
                  <td className="py-1.5 pr-4 text-right text-green-400">0.8645</td>
                  <td className="py-1.5 text-right text-green-400 font-semibold">{fmt(Math.round((currentFrontier - 250_000_000) * 0.864525))}</td>
                </tr>
                <tr className="font-semibold">
                  <td colSpan={4} className="py-2 pr-4 text-foreground">Total</td>
                  <td className="py-2 text-right text-green-400 text-sm">{fmt(currentEstimate)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* How tracking works */}
          <div className="flex items-start gap-3 pt-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-400 mt-0.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">How does this work?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Each scan probes the GitHub API via binary search to find the maximum valid user ID (frontier).
                The estimate is recomputed by extending F7 to the new frontier while keeping observed validity
                rates fixed. A daily GitHub Action also updates the baseline automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
