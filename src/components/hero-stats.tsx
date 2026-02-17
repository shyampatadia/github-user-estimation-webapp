"use client";

import { useEffect, useState } from "react";
import { getBaseline, getLatestHistory, formatNumber, formatNumberFull, formatDateEST } from "@/lib/data";

export function HeroStats() {
  const data = getBaseline();
  const latest = getLatestHistory();
  // Use the latest estimate from history.json (updated daily by GitHub Action)
  const target = latest.estimated_total;
  const frontier = latest.frontier_id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setCount(Math.min(target, Math.round(increment * step)));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-8 sm:p-12 text-center gradient-border">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(212 92% 45%) 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }} />

      <div className="relative">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Estimated Valid GitHub Users
        </p>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-foreground glow-text tabular-nums">
          ~{formatNumber(count)}
        </h1>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-primary font-medium">
            95% CI
          </span>
          <span className="font-mono tabular-nums">
            [{formatNumber(data.estimate.ci_lower)} &ndash; {formatNumber(data.estimate.ci_upper)}]
          </span>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">
              Validity rate: <span className="text-foreground font-medium">{(data.estimate.validity_rate * 100).toFixed(1)}%</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">
              Frontier: <span className="text-foreground font-medium font-mono">{formatNumberFull(frontier)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            <span className="text-muted-foreground">
              Updated: <span className="text-foreground font-medium">{formatDateEST(latest.date)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
