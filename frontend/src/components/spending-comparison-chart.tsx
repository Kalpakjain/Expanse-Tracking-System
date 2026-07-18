"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ComparisonBucket = { label: string; current: number; previous: number };
type Props = { data: ComparisonBucket[]; periodLabel: string };

function formatCompactINR(value: number): string {
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `Rs ${(value / 1000).toFixed(1)}k`;
  return `Rs ${Math.round(value)}`;
}

function ComparisonTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const current = payload.find((p: any) => p.dataKey === "current")?.value ?? 0;
  const previous = payload.find((p: any) => p.dataKey === "previous")?.value ?? 0;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div>This: {formatCompactINR(current)}</div>
      <div>Last: {formatCompactINR(previous)}</div>
    </div>
  );
}

export function SpendingComparisonChart({ data, periodLabel }: Props) {
  if (!data.length || data.every((d) => d.current === 0 && d.previous === 0)) {
    return <div className="chart-empty-state">No spending recorded for this range yet.</div>;
  }

  const avgCurrent = data.reduce((sum, d) => sum + d.current, 0) / data.length;
  const peakIndex = data.reduce(
    (best, d, i) => (d.current > data[best].current ? i : best),
    0
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
        barGap={4}
        barCategoryGap="30%"
        accessibilityLayer
        aria-label={`Spending comparison by ${periodLabel}`}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#dfd5c7" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "#6a4c56", fontSize: 12 }} axisLine={{ stroke: "#dfd5c7" }} tickLine={false} />
        <YAxis tick={{ fill: "#6a4c56", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatCompactINR} />
        <Tooltip content={<ComparisonTooltip />} cursor={{ fill: "rgba(176,48,92,0.06)" }} />
        <ReferenceLine y={avgCurrent} stroke="#a89a82" strokeDasharray="4 4" />
        <Bar dataKey="previous" radius={[6, 6, 0, 0]} fill="#c9bda9" maxBarSize={22} />
        <Bar dataKey="current" radius={[6, 6, 0, 0]} maxBarSize={22}>
          {data.map((entry, index) => (
            <Cell key={entry.label} fill={index === peakIndex ? "#8f2450" : "#b0305c"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
