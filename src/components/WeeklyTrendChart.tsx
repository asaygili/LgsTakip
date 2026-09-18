"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type DayPoint = { label: string; Doğru: number; Yanlış: number; Boş: number };

export default function WeeklyTrendChart({ data }: { data: DayPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="Doğru" stackId="a" fill="#3280ff" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Yanlış" stackId="a" fill="#f87171" />
          <Bar dataKey="Boş" stackId="a" fill="#d1d5db" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
