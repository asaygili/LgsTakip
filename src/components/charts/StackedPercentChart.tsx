"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_INK, axisProps, tooltipStyle } from "@/lib/chart";

const MAX_LABEL = 18;
function shortLabel(value: string) {
  return value.length > MAX_LABEL ? `${value.slice(0, MAX_LABEL - 1)}…` : value;
}

// Satır başına toplam %100 olan yatay yığılmış bar. Her dilimin yüzdesi
// `<anahtar>` alanında, ham adedi `<anahtar>__n` alanında beklenir.
export type StackedRow = Record<string, string | number>;

export default function StackedPercentChart({
  data,
  keys,
  colors,
  countUnit,
  height = 260,
  labelWidth = 104,
}: {
  data: StackedRow[];
  keys: string[];
  colors: string[];
  countUnit: string;
  height?: number;
  labelWidth?: number;
}) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
          barCategoryGap={8}
        >
          <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            unit="%"
            {...axisProps}
          />
          <YAxis
            type="category"
            dataKey="label"
            {...axisProps}
            width={labelWidth}
            interval={0}
            tickFormatter={shortLabel}
          />
          <Tooltip
            {...tooltipStyle}
            cursor={{ fill: "rgba(11,11,11,0.04)" }}
            formatter={(value: number, name: string, item) => [
              `%${Math.round(value)} · ${item.payload[`${name}__n`]} ${countUnit}`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={colors[i]}
              // Beyaz kontur, bitişik dilimleri birbirinden ayıran boşluğu verir.
              stroke="#ffffff"
              strokeWidth={2}
              barSize={18}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
