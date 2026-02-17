import baseline from "@/data/baseline.json";
import history from "@/data/history.json";

export type Baseline = typeof baseline;
export type HistoryEntry = (typeof history)[number];

export function getBaseline(): Baseline {
  return baseline;
}

export function getHistory(): HistoryEntry[] {
  return history;
}

export function getLatestHistory(): HistoryEntry {
  return history[history.length - 1];
}

/** Latest estimate from history.json (updated daily by GitHub Action) */
export function getLatestEstimate(): number {
  return history[history.length - 1].estimated_total;
}

/** Latest frontier from history.json */
export function getLatestFrontier(): number {
  return history[history.length - 1].frontier_id;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatNumberFull(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatPercent(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

/** Format date string as EST timezone */
export function formatDateEST(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Get current time in EST */
export function nowEST(): string {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
