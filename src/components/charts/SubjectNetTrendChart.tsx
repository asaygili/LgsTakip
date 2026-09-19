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
} from "recharts";
import { SERIES, CHART_INK, axisProps, tooltipStyle } from "@/lib/chart";

export default function SubjectNetTrendChart({
  data,
  subjects,
}: {
  data: Record<string, string | number>[];
  subjects: string[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} />
          <Tooltip {...tooltipStyle} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="plainline"
            iconSize={14}
          />
          {subjects.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={SERIES[i % SERIES.length]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: SERIES[i % SERIES.length] }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#ffffff" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
