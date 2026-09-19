"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Label,
} from "recharts";
import { SERIES, CHART_INK, axisProps, tooltipStyle } from "@/lib/chart";

export default function MultiLineChart({
  data,
  series,
  unit,
  domain,
  referenceY,
  referenceLabel,
  height = 288,
}: {
  data: Record<string, string | number>[];
  series: string[];
  unit?: string;
  domain?: [number, number];
  referenceY?: number;
  referenceLabel?: string;
  height?: number;
}) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} unit={unit} domain={domain} width={44} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number, name: string) => [`${v}${unit ?? ""}`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="plainline"
            iconSize={14}
          />
          {referenceY !== undefined ? (
            <ReferenceLine
              y={referenceY}
              stroke={CHART_INK.reference}
              strokeWidth={1}
              strokeDasharray="4 4"
            >
              {referenceLabel ? (
                <Label
                  value={referenceLabel}
                  position="insideTopRight"
                  fill={CHART_INK.reference}
                  fontSize={11}
                />
              ) : null}
            </ReferenceLine>
          ) : null}
          {series.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={SERIES[i % SERIES.length]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: SERIES[i % SERIES.length] }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
