"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBaseline, getHistory, formatNumberFull } from "@/lib/data";

export function ProjectionsCard() {
  const baseline = getBaseline();
  const history = getHistory();

  const latest = history[history.length - 1];
  const currentFrontier = latest.frontier_id;
  const currentEstimate = latest.estimated_total;
  const validityRate = baseline.estimate.validity_rate;

  // Compute average daily growth from history
  const avgDailyGrowth =
    history.length >= 2
      ? (history[history.length - 1].frontier_id - history[0].frontier_id) /
        Math.max(history.length - 1, 1)
      : 400_000;

  const avgDailyUsers = Math.round(avgDailyGrowth * validityRate);

  const fmtBig = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    return n.toLocaleString("en-US");
  };

  const fmt = (n: number) => n.toLocaleString("en-US");

  const projections = [
    { days: 30, label: "30 Days", color: "blue" },
    { days: 90, label: "90 Days", color: "purple" },
    { days: 365, label: "1 Year", color: "orange" },
  ].map((p) => {
    const projFrontier = currentFrontier + Math.round(avgDailyGrowth * p.days);
    const projUsers = Math.round(projFrontier * validityRate);
    const growth = projUsers - currentEstimate;
    const growthPct = ((growth / currentEstimate) * 100).toFixed(1);
    return { ...p, projFrontier, projUsers, growth, growthPct };
  });

  // Milestones
  const nextMilestone = 225_000_000;
  const daysToMilestone =
    avgDailyUsers > 0
      ? Math.ceil((nextMilestone - currentEstimate) / avgDailyUsers)
      : null;

  return (
    <Card className="bg-card border-border rounded-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
              />
            </svg>
            Growth Projections
          </CardTitle>
          <span className="text-xs text-muted-foreground font-mono">
            ~{fmt(Math.round(avgDailyGrowth))} IDs/day | {(validityRate * 100).toFixed(1)}% validity
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current baseline */}
        <div className="flex items-center gap-3 rounded-md bg-secondary/40 border border-border/50 px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Now</p>
            <p className="text-lg font-bold font-mono tabular-nums text-green-400">
              ~{fmtBig(currentEstimate)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Frontier</p>
            <p className="text-sm font-mono tabular-nums text-muted-foreground">
              {fmtBig(currentFrontier)}
            </p>
          </div>
        </div>

        {/* Projection cards - asymmetric: 2-col first two, 1 col third */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr] gap-3">
          {projections.map((p) => {
            const colorMap: Record<string, { dot: string; text: string; bar: string; badge: string }> = {
              blue: { dot: "bg-blue-500", text: "text-blue-400", bar: "bg-blue-500/30", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
              purple: { dot: "bg-purple-500", text: "text-purple-400", bar: "bg-purple-500/30", badge: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
              orange: { dot: "bg-orange-500", text: "text-orange-400", bar: "bg-orange-500/30", badge: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
            };
            const c = colorMap[p.color];

            // Progress bar: how far this projection is toward 250M
            const progressTarget = 250_000_000;
            const barWidth = Math.min(100, (p.projUsers / progressTarget) * 100);

            return (
              <div
                key={p.days}
                className="rounded-lg border border-border bg-secondary/20 p-4 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${c.dot}`} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {p.label}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${c.badge}`}
                  >
                    +{p.growthPct}%
                  </span>
                </div>

                <p className={`text-2xl font-bold font-mono tabular-nums ${c.text} mb-1`}>
                  ~{fmtBig(p.projUsers)}
                </p>

                <p className="text-xs text-muted-foreground font-mono mb-3">
                  +{fmtBig(p.growth)} users
                </p>

                {/* Mini progress bar */}
                <div className="mt-auto">
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.bar} transition-all`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-muted-foreground font-mono">
                      Frontier: ~{fmtBig(p.projFrontier)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestone tracker */}
        {daysToMilestone !== null && daysToMilestone > 0 && (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-border/70 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-yellow-500/10 text-yellow-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Next milestone: {fmtBig(nextMilestone)} users
              </p>
              <p className="text-xs text-muted-foreground">
                ~{formatNumberFull(daysToMilestone)} days at current growth rate ({fmt(avgDailyUsers)} new users/day)
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-mono">
                {fmtBig(nextMilestone - currentEstimate)} to go
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Linear extrapolation assuming constant ID allocation rate and fixed validity rates from baseline study. Updated daily via GitHub Actions.
        </p>
      </CardContent>
    </Card>
  );
}
