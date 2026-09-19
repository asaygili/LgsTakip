"use client";

import { useState } from "react";

type TableData = {
  columns: string[];
  rows: (string | number)[][];
};

// Her grafiğin bir de tablo karşılığı olur: renk ayrımının yetmediği durumlarda
// (renk körlüğü, düşük kontrastlı seriler, yazdırma) değerler yine okunabilir.
export default function ChartCard({
  title,
  description,
  table,
  children,
}: {
  title: string;
  description?: string;
  table?: TableData;
  children: React.ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className="card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="shrink-0 text-xs font-medium text-brand-700 hover:underline"
          >
            {showTable ? "Grafik" : "Tablo"}
          </button>
        )}
      </div>

      {showTable && table ? (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                {table.columns.map((c) => (
                  <th key={c} className="px-1 py-1.5 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`px-1 py-1.5 text-gray-700 ${
                        j === 0 ? "" : "tabular-nums"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
