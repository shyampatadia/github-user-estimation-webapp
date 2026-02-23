import { HeroStats } from "@/components/hero-stats";
import { StatsCards } from "@/components/stats-cards";
import { GrowthChart } from "@/components/growth-chart";
import { ProjectionsCard } from "@/components/projections-card";

/* ── Centered section divider label ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.18em] shrink-0"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

const QUICK_LINKS = [
  {
    href: "/methodology",
    title: "Methodology",
    description: "How we built the estimator — stratified sampling, strata design, bootstrap CI, and unbiasedness proofs.",
    tag: "24K API calls",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    href: "/results",
    title: "Results",
    description: "Interactive charts, per-stratum breakdowns, partition analysis, and unbiasedness verification.",
    tag: "16K samples",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    href: "/realtime",
    title: "Realtime Monitor",
    description: "Live GitHub ID frontier tracking via binary search. Watch new accounts appear in real time.",
    tag: "LIVE",
    live: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    href: "/report",
    title: "Full Report",
    description: "The complete PDF research report — statistical methods, validation figures, and full analysis.",
    tag: "PDF",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-10">

      {/* ── Hero: what this site is, immediately ── */}
      <HeroStats />

      {/* ── Key metrics ── */}
      <div>
        <SectionLabel>Key Metrics</SectionLabel>
        <StatsCards />
      </div>

      {/* ── Frontier trend chart ── */}
      <div className="rounded-xl overflow-hidden surface-card">
        <div
          className="flex items-center gap-2.5 px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span
            className="data-pulse h-[6px] w-[6px] rounded-full shrink-0"
            style={{ background: "rgba(52,211,153,0.8)" }}
          />
          <h2
            className="text-[13px] font-semibold"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            Frontier &amp; Estimate Trend
          </h2>
          <span
            className="ml-auto font-mono text-[11px]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Updated daily via GitHub Actions
          </span>
        </div>
        <div className="p-5">
          <GrowthChart compact />
        </div>
      </div>

      {/* ── Projections ── */}
      <ProjectionsCard />

      {/* ── Explore ── */}
      <div>
        <SectionLabel>Explore the Research</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className={`explore-card group animate-in stagger-${i + 1} flex items-start gap-4 rounded-xl p-5`}
            >
              {/* Icon container */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {link.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    {link.title}
                  </span>
                  {link.live ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "rgba(248,113,113,0.9)",
                      }}
                    >
                      <span className="data-pulse h-[4px] w-[4px] rounded-full bg-red-400" />
                      LIVE
                    </span>
                  ) : (
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-mono"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      {link.tag}
                    </span>
                  )}
                </div>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                >
                  {link.description}
                </p>
              </div>

              {/* Arrow */}
              <svg
                className="h-4 w-4 shrink-0 mt-0.5 transition-transform duration-150 group-hover:translate-x-0.5"
                style={{ color: "rgba(255,255,255,0.2)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
