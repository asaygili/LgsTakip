"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import { SERIES, CHART_INK, axisProps, tooltipStyle } from "@/lib/chart";

export type BarPoint = { label: string; value: number };

// Uzun konu adları eksende üç satıra sarılıp birbirine giriyordu; tek satıra
// kısaltıyoruz. Tam ad ipucunda ve tablo görünümünde zaten duruyor.
const MAX_LABEL = 20;
function shortLabel(value: string) {
  return value.length > MAX_LABEL ? `${value.slice(0, MAX_LABEL - 1)}…` : value;
}

export default function HorizontalBarChart({
  data,
  valueName,
  height = 240,
  decimals = 0,
}: {
  data: BarPoint[];
  valueName: string;
  height?: number;
  decimals?: number;
}) {
  const format = (v: number) => v.toFixed(decimals);
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 0, bottom: 0 }}
          barCategoryGap={6}
        >
          <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
          <XAxis type="number" {...axisProps} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            {...axisProps}
            width={128}
            interval={0}
            tickFormatter={shortLabel}
          />
          <Tooltip
            {...tooltipStyle}
            cursor={{ fill: "rgba(11,11,11,0.04)" }}
            formatter={(v: number) => [format(v), valueName]}
          />
          <Bar dataKey="value" fill={SERIES[0]} radius={[0, 4, 4, 0]} barSize={16}>
            <LabelList
              dataKey="value"
              position="right"
              fontSize={11}
              fill={CHART_INK.reference}
              formatter={(v: number) => format(v)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
