import { MathBlock } from "@/components/math-block";
import { SingleFigure } from "@/components/figure-gallery";
import { getBaseline, formatNumberFull } from "@/lib/data";

export const metadata = {
  title: "Methodology | GitHub Census",
};

const STRATA = [
  { id: "F1", range: "1 – 10M",     size: "10M",    desc: "Earliest accounts",       dot: "#639BE6", bg: "rgba(99,155,230,0.08)",   border: "rgba(99,155,230,0.2)"  },
  { id: "F2", range: "10M – 50M",   size: "40M",    desc: "2012–2015 growth era",    dot: "#34D399", bg: "rgba(52,211,153,0.07)",   border: "rgba(52,211,153,0.18)" },
  { id: "F3", range: "50M – 100M",  size: "50M",    desc: "2016–2018 expansion",     dot: "#FBBF24", bg: "rgba(251,191,36,0.07)",   border: "rgba(251,191,36,0.18)" },
  { id: "F4", range: "100M – 150M", size: "50M",    desc: "2019–2020 boom",          dot: "#F472B6", bg: "rgba(244,114,182,0.07)",  border: "rgba(244,114,182,0.18)"},
  { id: "F5", range: "150M – 200M", size: "50M",    desc: "2021–2022 growth",        dot: "#A78BFA", bg: "rgba(167,139,250,0.07)",  border: "rgba(167,139,250,0.18)"},
  { id: "F6", range: "200M – 250M", size: "50M",    desc: "2023–2024 era",           dot: "#FB923C", bg: "rgba(251,146,60,0.07)",   border: "rgba(251,146,60,0.18)" },
  { id: "F7", range: "250M – now",  size: "live ↗", desc: "Latest accounts (2025+)", dot: "#34D399", bg: "rgba(52,211,153,0.1)",    border: "rgba(52,211,153,0.25)", live: true },
];

const FORMULAS = [
  {
    title: "Stratified Estimator",
    desc: "Total valid users = each stratum's estimated count, summed:",
    math: "\\hat{N} = \\sum_{h=1}^{H} M_h \\cdot \\hat{p}_h",
    note: "M_h = stratum size · p̂_h = validity rate in stratum h",
    dot: "#639BE6", bg: "rgba(99,155,230,0.07)", border: "rgba(99,155,230,0.18)",
  },
  {
    title: "Variance",
    desc: "Analytical variance of the stratified estimator:",
    math: "\\text{Var}(\\hat{N}) = \\sum_{h=1}^{H} M_h^2 \\cdot \\frac{\\hat{p}_h (1 - \\hat{p}_h)}{n_h}",
    dot: "#FBBF24", bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.18)",
  },
  {
    title: "Proportional Allocation",
    desc: "Each stratum's sample size is proportional to its share of the total ID space:",
    math: "n_h = \\left\\lfloor n \\cdot \\frac{M_h}{M} \\right\\rfloor",
    dot: "#34D399", bg: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.18)",
  },
  {
    title: "Bootstrap 95% CI",
    desc: "Resample 1,000× within each stratum. CI = [2.5th, 97.5th] percentile of bootstrap distribution:",
    math: "CI_{95\\%} = \\left[\\hat{N}^{*(0.025)},\\, \\hat{N}^{*(0.975)}\\right]",
    dot: "#A78BFA", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.18)",
  },
  {
    title: "Unbiasedness",
    desc: "The sample proportion is an unbiased estimator of the true proportion, so the composite estimator is unbiased:",
    math: "E[\\hat{p}_h] = p_h \\implies E[\\hat{N}] = \\sum_h M_h \\cdot p_h = N",
    dot: "#F472B6", bg: "rgba(244,114,182,0.07)", border: "rgba(244,114,182,0.18)",
  },
];

export default function MethodologyPage() {
  const data = getBaseline();

  return (
    <div className="space-y-12">

      {/* ── Page header ── */}
      <div className="space-y-4 max-w-3xl">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{
            background: "rgba(99,155,230,0.08)",
            border: "1px solid rgba(99,155,230,0.22)",
            color: "rgba(99,155,230,0.9)",
          }}
        >
          <span className="h-[5px] w-[5px] rounded-full" style={{ background: "rgba(99,155,230,0.85)" }} />
          Research Methodology
        </div>
        <h1
          className="font-bold tracking-tight leading-tight"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "rgba(255,255,255,0.97)", letterSpacing: "-0.025em" }}
        >
          How We Counted GitHub Users
        </h1>
        <p
          className="text-lg leading-relaxed"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          Stratified random sampling across GitHub&apos;s full numeric ID space —
          7 strata, bootstrap confidence intervals, unbiasedness verified.
        </p>
      </div>

      {/* ── Sampling Approach ── */}
      <div
        className="rounded-2xl p-7 sm:p-9"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.09)" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.015em" }}
            >
              Sampling Approach
            </h2>
            <div className="space-y-4 text-[16px] leading-[1.8]" style={{ color: "rgba(255,255,255,0.72)" }}>
              <p>
                GitHub assigns{" "}
                <strong style={{ color: "rgba(255,255,255,0.95)" }}>sequential numeric IDs</strong>{" "}
                to every user and organization. As of February 2026, the maximum observed ID
                (frontier) is{" "}
                <strong className="font-mono" style={{ color: "rgba(99,155,230,0.95)" }}>
                  {formatNumberFull(data.frontier_m)}
                </strong>
                . Not all IDs are valid — some accounts have been deleted, suspended, or were
                never assigned.
              </p>
              <p>
                We divide the ID space into{" "}
                <strong style={{ color: "rgba(255,255,255,0.95)" }}>7 strata</strong> and
                randomly sample within each, checking via the GitHub API whether each ID
                resolves to a real account. The validity rate per stratum estimates the total
                valid population.
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 content-start">
            {[
              { value: formatNumberFull(data.methodology.sample_pool_calls), label: "Random Samples", dot: "#639BE6" },
              { value: `${(data.estimate.validity_rate * 100).toFixed(1)}%`,  label: "Validity Rate",  dot: "#34D399" },
              { value: formatNumberFull(data.methodology.ground_truth_calls), label: "Ground Truth IDs", dot: "#FBBF24" },
              { value: String(data.methodology.bootstrap_iterations),         label: "Bootstrap Iters", dot: "#A78BFA" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-5 flex flex-col justify-between"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="h-1.5 w-6 rounded-full mb-4" style={{ background: stat.dot }} />
                <div className="font-mono text-2xl font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.95)" }}>
                  {stat.value}
                </div>
                <div className="text-[12px] uppercase tracking-widest mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Strata ── */}
      <div className="space-y-5">
        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.015em" }}
          >
            Strata Definitions
          </h2>
          <p className="mt-2 text-[16px]" style={{ color: "rgba(255,255,255,0.62)" }}>
            The ID space is partitioned into 7 independent ranges, sampled in proportion to their size.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {STRATA.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 rounded-xl p-4"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-mono font-bold text-[13px]"
                style={{ background: `${s.dot}22`, color: s.dot, border: `1px solid ${s.dot}40` }}
              >
                {s.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
                    {s.range}
                  </span>
                  {s.live && (
                    <span className="data-pulse inline-block h-[5px] w-[5px] rounded-full" style={{ background: s.dot }} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[13px] font-semibold" style={{ color: s.dot }}>
                    {s.size}
                  </span>
                  <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                    · {s.desc}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mathematical Framework — 2-column grid ── */}
      <div className="space-y-5">
        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.015em" }}
          >
            Mathematical Framework
          </h2>
          <p className="mt-2 text-[16px]" style={{ color: "rgba(255,255,255,0.62)" }}>
            Five equations — from estimator design to confidence interval to unbiasedness proof.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {FORMULAS.map((f, i) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: f.bg, border: `1px solid ${f.border}` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold font-mono"
                  style={{ background: `${f.dot}28`, color: f.dot }}
                >
                  {i + 1}
                </span>
                <h3 className="text-[17px] font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>
                  {f.title}
                </h3>
              </div>
              <p className="text-[15px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.7)" }}>
                {f.desc}
              </p>
              <div
                className="rounded-xl p-4 overflow-x-auto"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <MathBlock math={f.math} />
              </div>
              {f.note && (
                <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {f.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Estimator Properties (figures) ── */}
      <div className="space-y-5">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.015em" }}
        >
          Estimator Properties
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SingleFigure figKey="fig1_unbiasedness" src="/figures/fig1_unbiasedness.png" />
          <SingleFigure figKey="fig2_correctness" src="/figures/fig2_correctness.png" />
        </div>
      </div>

    </div>
  );
}
