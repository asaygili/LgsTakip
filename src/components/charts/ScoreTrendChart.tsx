"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Label,
} from "recharts";
import { SERIES, CHART_INK, axisProps, tooltipStyle } from "@/lib/chart";

export type ScorePoint = { label: string; puan: number };

export default function ScoreTrendChart({
  data,
  targetScore,
  targetLabel,
}: {
  data: ScorePoint[];
  targetScore?: number | null;
  targetLabel?: string;
}) {
  const values = data.map((d) => d.puan);
  if (targetScore) values.push(targetScore);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(10, (max - min) * 0.15);
  // Eksende 397 gibi rastgele sayılar yerine 25'in katları dursun.
  const lower = Math.floor((min - pad) / 25) * 25;
  const upper = Math.ceil((max + pad) / 25) * 25;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis
            {...axisProps}
            domain={[lower, upper]}
            width={44}
            allowDecimals={false}
          />
          <Tooltip {...tooltipStyle} formatter={(v: number) => [v.toFixed(1), "Tahmini puan"]} />
          {targetScore ? (
            <ReferenceLine y={targetScore} stroke={CHART_INK.reference} strokeWidth={1}>
              <Label
                value={`Hedef: ${targetLabel ?? ""} (${targetScore.toFixed(1)})`}
                position="insideTopRight"
                fill={CHART_INK.reference}
                fontSize={11}
              />
            </ReferenceLine>
          ) : null}
          <Line
            type="monotone"
            dataKey="puan"
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
