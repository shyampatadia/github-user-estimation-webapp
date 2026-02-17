import { Card, CardContent } from "@/components/ui/card";
import { getBaseline, getLatestHistory, formatNumber, formatNumberFull, formatDateEST } from "@/lib/data";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  accent?: string;
}

function StatCard({ label, value, subtext, icon, accent = "text-primary" }: StatCardProps) {
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className={`text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            )}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const data = getBaseline();
  const latest = getLatestHistory();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Valid Users"
        value={`~${formatNumber(latest.estimated_total)}`}
        subtext={`CI: [${formatNumber(data.estimate.ci_lower)} - ${formatNumber(data.estimate.ci_upper)}]`}
        accent="text-green-400"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      />
      <StatCard
        label="Validity Rate"
        value={`${(data.estimate.validity_rate * 100).toFixed(1)}%`}
        subtext={`${formatNumberFull(data.invalid_analysis.valid)} of ${formatNumberFull(data.invalid_analysis.total_sampled)} sampled`}
        accent="text-blue-400"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <StatCard
        label="User / Org Split"
        value={`${data.population.user_pct}%`}
        subtext={`${data.population.org_pct}% organizations`}
        accent="text-purple-400"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />
      <StatCard
        label="Frontier ID"
        value={formatNumber(latest.frontier_id)}
        subtext={`As of ${formatDateEST(latest.date)}`}
        accent="text-orange-400"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />
    </div>
  );
}
