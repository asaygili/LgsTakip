"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { SERIES, CHART_INK, axisProps, tooltipStyle } from "@/lib/chart";

export type AccuracyPoint = { label: string; oran: number; soru: number };

export default function AccuracyTrendChart({ data }: { data: AccuracyPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} domain={[0, 100]} unit="%" width={44} ticks={[0, 25, 50, 75, 100]} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number, _n, item) => [
              `%${v.toFixed(0)} · ${item.payload.soru} soru`,
              "Doğruluk",
            ]}
          />
          <Line
            type="monotone"
            dataKey="oran"
            stroke={SERIES[0]}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 0, fill: SERIES[0] }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
