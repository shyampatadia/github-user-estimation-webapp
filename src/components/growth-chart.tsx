"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getHistory, formatNumber } from "@/lib/data";

const COLORS = {
  primary: "hsl(212, 92%, 45%)",
  green: "hsl(140, 71%, 45%)",
  border: "hsl(220, 13%, 16%)",
  textMuted: "hsl(215, 14%, 55%)",
};

interface GrowthChartProps {
  compact?: boolean;
}

export function GrowthChart({ compact = false }: GrowthChartProps) {
  const history = getHistory();

  const chartData = history.map((entry) => ({
    date: entry.date,
    frontier: entry.frontier_id,
    estimate: entry.estimated_total,
  }));

  return (
    <div className={compact ? "h-48" : "h-80"}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: compact ? 0 : 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: compact ? 9 : 11, fill: COLORS.textMuted }}
            axisLine={{ stroke: COLORS.border }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: compact ? 9 : 11, fill: COLORS.textMuted }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatNumber(v)}
            width={compact ? 45 : 55}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
                  <p className="font-medium text-foreground mb-1">{label}</p>
                  {payload.map((p, i) => (
                    <p key={i} className="text-muted-foreground">
                      {p.name}: <span className="font-mono text-foreground">{Number(p.value).toLocaleString()}</span>
                    </p>
                  ))}
                </div>
              );
            }}
          />
          {!compact && <Legend wrapperStyle={{ fontSize: 11, color: COLORS.textMuted }} />}
          <Line
            type="monotone"
            dataKey="frontier"
            name="Frontier ID"
            stroke={COLORS.primary}
            strokeWidth={2}
            dot={{ r: 3, fill: COLORS.primary }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="estimate"
            name="Estimated Users"
            stroke={COLORS.green}
            strokeWidth={2}
            dot={{ r: 3, fill: COLORS.green }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
