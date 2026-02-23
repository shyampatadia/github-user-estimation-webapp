"use client";

import { useRef } from "react";
import {
  getBaseline,
  getLatestHistory,
  formatNumber,
  formatNumberFull,
  formatDateEST,
} from "@/lib/data";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  valueColor?: string;
  stagger?: number;
  primary?: boolean;
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  valueColor = "rgba(255,255,255,0.92)",
  stagger = 1,
  primary = false,
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    ref.current?.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    ref.current?.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      className={`animate-in stagger-${stagger} spotlight-card relative rounded-xl p-5 transition-all duration-200`}
      onMouseMove={handleMouseMove}
      style={{
        background: "rgba(255,255,255,0.025)",
        border: primary
          ? "1px solid rgba(99,155,230,0.2)"
          : "1px solid rgba(255,255,255,0.06)",
        borderLeft: primary ? "1.5px solid rgba(99,155,230,0.45)" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            {label}
          </p>
          <p
            className="text-[1.6rem] font-bold tabular-nums font-mono leading-none tracking-tight"
            style={{ color: valueColor }}
          >
            {value}
          </p>
          {subtext && (
            <p
              className="mt-2 text-[11px] font-mono leading-snug"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {subtext}
            </p>
          )}
        </div>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ── Icons ── */
const UserIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);
const CheckIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const GroupIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);
const TrendIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);

export function StatsCards() {
  const data = getBaseline();
  const latest = getLatestHistory();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Valid Users"
        value={`~${formatNumber(latest.estimated_total)}`}
        subtext={`95% CI: [${formatNumber(data.estimate.ci_lower)} – ${formatNumber(data.estimate.ci_upper)}]`}
        valueColor="rgba(52,211,153,0.9)"
        stagger={1}
        primary
        icon={<UserIcon />}
      />
      <StatCard
        label="Validity Rate"
        value={`${(data.estimate.validity_rate * 100).toFixed(1)}%`}
        subtext={`${formatNumberFull(data.invalid_analysis.valid)} of ${formatNumberFull(data.invalid_analysis.total_sampled)} sampled`}
        valueColor="rgba(99,155,230,0.9)"
        stagger={2}
        icon={<CheckIcon />}
      />
      <StatCard
        label="User / Org Split"
        value={`${data.population.user_pct}%`}
        subtext={`${data.population.org_pct}% organizations`}
        valueColor="rgba(167,139,250,0.9)"
        stagger={3}
        icon={<GroupIcon />}
      />
      <StatCard
        label="Frontier ID"
        value={formatNumber(latest.frontier_id)}
        subtext={`As of ${formatDateEST(latest.date)}`}
        valueColor="rgba(251,191,36,0.88)"
        stagger={4}
        icon={<TrendIcon />}
      />
    </div>
  );
}
