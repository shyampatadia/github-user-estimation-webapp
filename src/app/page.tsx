import { HeroStats } from "@/components/hero-stats";
import { StatsCards } from "@/components/stats-cards";
import { GrowthChart } from "@/components/growth-chart";
import { ProjectionsCard } from "@/components/projections-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_LINKS = [
  {
    href: "/methodology",
    title: "Methodology",
    description: "Stratified sampling approach, formulas, and unbiasedness proofs",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    href: "/results",
    title: "Results",
    description: "Interactive tables, charts, and population analysis",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    href: "/realtime",
    title: "Realtime Monitor",
    description: "Live frontier tracking, growth rates, and projections",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    href: "/report",
    title: "Full Report",
    description: "Download or view the complete PDF research report",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <HeroStats />
      <StatsCards />

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Frontier &amp; Estimate Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GrowthChart compact />
        </CardContent>
      </Card>

      <ProjectionsCard />

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Explore
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              <Card className="bg-card border-border hover:border-primary/30 hover:bg-secondary/30 transition-all cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary mb-3">
                    {link.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{link.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{link.description}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-400 mt-0.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">How was this estimated?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We used <strong className="text-foreground">stratified random sampling</strong> across GitHub&apos;s numeric ID space
                [1, 261.7M]. 16,000 random IDs were sampled across 7 strata, plus 8,000 ground truth IDs
                for validation. The estimator is proven unbiased with a 95% bootstrap CI width of just 1.48%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
