"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CategoryReportItem } from "@/lib/types";

type Props = { breakdown: CategoryReportItem[] };

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0].payload.spent_amount;
  return (
    <div className="chart-tooltip">
      {new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value)}
    </div>
  );
}

function TrackedBar(props: any) {
  const { x, y, width, height, background, fill } = props;
  const trackTop = background?.y ?? 0;
  const trackHeight = background?.height ?? height;
  return (
    <g>
      <rect x={x} y={trackTop} width={width} height={trackHeight} rx={6} fill="#e3d9c8" />
      <rect x={x} y={y} width={width} height={height} rx={6} fill={fill} />
    </g>
  );
}

export function CategorySpendChart({ breakdown }: Props) {
  const data = breakdown.filter((item) => item.spent_amount > 0);
  const maxCategory = data.reduce(
    (max, item) => (item.spent_amount > max.spent_amount ? item : max),
    data[0] ?? { category_id: "", spent_amount: 0 }
  );

  if (data.length === 0) {
    return <div className="chart-empty-state">No category spending recorded yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#dfd5c7" vertical={false} />
        <XAxis
          dataKey="category_name"
          tick={{ fill: "#6a4c56", fontSize: 12 }}
          axisLine={{ stroke: "#dfd5c7" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6a4c56", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
        />
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Bar
          dataKey="spent_amount"
          shape={(barProps: any) => (
            <TrackedBar
              {...barProps}
              background={{ y: 24, height: 280 - 24 - 24 }}
              fill={barProps.payload.category_id === maxCategory.category_id ? "#8f2450" : "#b0305c"}
            />
          )}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
