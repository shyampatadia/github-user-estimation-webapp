"use client";

import { useEffect, useState } from "react";
import { getBaseline, getLatestHistory, formatNumber, formatNumberFull, formatDateEST } from "@/lib/data";

/** Split "215.5M" → { num: "215.5", unit: "M" } */
function splitFormatted(s: string): { num: string; unit: string } {
  const m = s.match(/^(~?[\d.,]+)([KMBT]?)$/);
  if (m) return { num: m[1], unit: m[2] };
  return { num: s, unit: "" };
}

const STAT_COLORS = [
  "#639BE6",
  "#34D399",
  "#FBBF24",
  "#A78BFA",
  "#FB923C",
];

export function HeroStats() {
  const data   = getBaseline();
  const latest = getLatestHistory();
  const target = latest.estimated_total;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const steps = 60;
    const inc   = target / steps;
    let   step  = 0;
    const timer = setInterval(() => {
      step++;
      setCount(Math.min(target, Math.round(inc * step)));
      if (step >= steps) clearInterval(timer);
    }, 2200 / steps);
    return () => clearInterval(timer);
  }, [target]);

  const { num, unit } = splitFormatted(formatNumber(count));

  const STATS = [
    { label: "Random Samples",  value: "16,000" },
    { label: "Validity Rate",   value: `${(data.estimate.validity_rate * 100).toFixed(1)}%` },
    { label: "ID Strata",       value: "7" },
    { label: "Confidence",      value: "95%" },
    { label: "Frontier ID",     value: formatNumberFull(latest.frontier_id) },
  ];

  return (
    <section className="py-10 sm:py-16 text-center">

      {/* ── Research badge ── */}
      <div
        className="animate-in stagger-1 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-semibold mb-8"
        style={{
          background: "rgba(99,155,230,0.08)",
          border: "1px solid rgba(99,155,230,0.25)",
          color: "rgba(99,155,230,0.92)",
          letterSpacing: "0.04em",
        }}
      >
        <span className="data-pulse h-[5px] w-[5px] rounded-full shrink-0" style={{ background: "rgba(99,155,230,0.85)" }} />
        Research Dashboard · Stratified Sampling · Updated Daily
      </div>

      {/* ── Main headline ── */}
      <h1
        className="animate-in stagger-2 mx-auto leading-[1.06] font-bold"
        style={{
          fontSize: "clamp(2.6rem, 5.5vw, 4.8rem)",
          color: "rgba(255,255,255,0.97)",
          letterSpacing: "-0.03em",
          maxWidth: "20ch",
        }}
      >
        How Many Real GitHub Users Actually Exist?
      </h1>

      {/* ── Sub-headline ── */}
      <p
        className="animate-in stagger-3 mt-5 mx-auto leading-relaxed"
        style={{
          fontSize: "clamp(1rem, 2vw, 1.18rem)",
          color: "rgba(255,255,255,0.72)",
          maxWidth: "54ch",
        }}
      >
        We used stratified random sampling across GitHub&apos;s full numeric ID space
        to estimate the true population — with a 95% confidence interval.
      </p>

      {/* ── The answer ── */}
      <div className="animate-in stagger-4 mt-14">
        <p
          className="text-[12px] font-semibold uppercase tracking-[0.18em] mb-5"
          style={{ color: "rgba(255,255,255,0.58)" }}
        >
          Our estimate, as of {formatDateEST(latest.date)}
        </p>

        {/* Big number — split to avoid tabular-nums period gap bug */}
        <div className="relative inline-block">
          {/* Glow behind number */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,155,230,0.1) 0%, transparent 75%)",
              transform: "scale(2)",
              filter: "blur(20px)",
            }}
          />
          <div
            className="relative inline-flex items-baseline font-bold leading-none"
            style={{ letterSpacing: "-0.025em" }}
          >
            <span
              style={{
                fontSize: "clamp(4rem, 11vw, 7.5rem)",
                color: "rgba(255,255,255,0.97)",
              }}
            >
              ~{num}
            </span>
            <span
              style={{
                fontSize: "clamp(2.2rem, 6vw, 4.2rem)",
                color: "rgba(99,155,230,0.9)",
                marginLeft: "0.04em",
              }}
            >
              {unit}
            </span>
          </div>
        </div>

        {/* CI line */}
        <p
          className="mt-4 font-mono tabular-nums text-[16px]"
          style={{ color: "rgba(255,255,255,0.72)" }}
        >
          95% confidence &nbsp;
          <span style={{ color: "rgba(255,255,255,0.92)" }}>
            [{formatNumber(data.estimate.ci_lower)}&thinsp;&ndash;&thinsp;{formatNumber(data.estimate.ci_upper)}]
          </span>
        </p>
      </div>

      {/* ── Credibility stat bar ── */}
      <div
        className="animate-in stagger-5 mt-12 inline-flex flex-wrap items-center justify-center gap-0 rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(255,255,255,0.09)",
          background: "rgba(255,255,255,0.025)",
        }}
      >
        {STATS.map((stat, i, arr) => (
          <div
            key={stat.label}
            className="flex flex-col items-center px-7 py-5"
            style={{
              borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}
          >
            {/* Colored accent bar */}
            <div
              className="h-[2px] w-6 rounded-full mb-3"
              style={{ background: STAT_COLORS[i] }}
            />
            <span
              className="font-mono tabular-nums font-bold text-[17px]"
              style={{ color: "rgba(255,255,255,0.95)" }}
            >
              {stat.value}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.12em] mt-1.5"
              style={{ color: "rgba(255,255,255,0.62)" }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

    </section>
  );
}
