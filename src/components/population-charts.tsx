"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBaseline } from "@/lib/data";

const COLORS = {
  primary: "hsl(212, 92%, 45%)",
  green: "hsl(140, 71%, 45%)",
  purple: "hsl(280, 65%, 60%)",
  orange: "hsl(38, 92%, 50%)",
  muted: "hsl(215, 18%, 68%)",
  border: "hsl(220, 13%, 16%)",
  cardBg: "hsl(220, 13%, 7%)",
  text: "hsl(210, 17%, 90%)",
  textMuted: "hsl(215, 18%, 68%)",
};

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          {p.name}: <span className="font-mono text-foreground">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export function AccountTypePie() {
  const data = getBaseline();
  const pieData = [
    { name: "Users", value: data.population.user_pct, color: COLORS.primary },
    { name: "Organizations", value: data.population.org_pct, color: COLORS.purple },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Account Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0];
                  return (
                    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
                      <p className="text-foreground font-medium">{d.name}: {d.value}%</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          {pieData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-mono font-medium text-foreground">{d.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CreationYearChart() {
  const data = getBaseline();
  const chartData = Object.entries(data.temporal.creation_by_year).map(([year, count]) => ({
    year,
    accounts: count,
  }));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Account Creation by Year</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: COLORS.textMuted }}
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 10, fill: COLORS.textMuted }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="accounts" name="Accounts" fill={COLORS.primary} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function DormancyChart() {
  const data = getBaseline();
  const dormancy = data.temporal.dormancy;
  const chartData = [
    { label: "Active (<1yr)", count: dormancy.active_1yr.count, pct: dormancy.active_1yr.pct, color: COLORS.green },
    { label: "1-2 years", count: dormancy.dormant_1_2yr.count, pct: dormancy.dormant_1_2yr.pct, color: COLORS.primary },
    { label: "2-3 years", count: dormancy.dormant_2_3yr.count, pct: dormancy.dormant_2_3yr.pct, color: COLORS.orange },
    { label: "3+ years", count: dormancy.dormant_3yr_plus.count, pct: dormancy.dormant_3yr_plus.pct, color: COLORS.purple },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Dormancy Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {chartData.map((d) => (
            <div key={d.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-mono text-foreground">{d.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReposDistribution() {
  const data = getBaseline();
  const repos = data.population.repos;
  const distData = [
    { label: "0 repos", pct: repos.zero_pct },
    { label: "1+ repos", pct: repos.with_repos_pct },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Repository Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 rounded-md bg-secondary/50">
            <p className="text-2xl font-bold text-foreground">{repos.mean}</p>
            <p className="text-xs text-muted-foreground">Mean repos</p>
          </div>
          <div className="text-center p-3 rounded-md bg-secondary/50">
            <p className="text-2xl font-bold text-foreground">{repos.median}</p>
            <p className="text-xs text-muted-foreground">Median repos</p>
          </div>
        </div>
        <div className="space-y-2">
          {distData.map((d) => (
            <div key={d.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-mono text-foreground">{d.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { label: "P75", value: repos.p75 },
            { label: "P90", value: repos.p90 },
            { label: "P95", value: repos.p95 },
            { label: "P99", value: repos.p99 },
          ].map((p) => (
            <div key={p.label} className="text-center p-2 rounded-md bg-secondary/30">
              <p className="text-sm font-bold font-mono text-foreground">{p.value}</p>
              <p className="text-xs text-muted-foreground">{p.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
