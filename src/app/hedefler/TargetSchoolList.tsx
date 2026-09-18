"use client";

import { useTransition } from "react";
import { deleteTargetSchool } from "./actions";

type TargetSchoolItem = {
  id: string;
  name: string;
  targetNet: number;
  note: string | null;
};

function statusFor(currentNet: number | null, targetNet: number) {
  if (currentNet === null) {
    return { label: "Deneme sonucu yok", color: "bg-gray-100 text-gray-500" };
  }
  const diff = currentNet - targetNet;
  if (diff >= 0) {
    return { label: `+${diff.toFixed(1)} net üstünde`, color: "bg-emerald-100 text-emerald-700" };
  }
  if (diff >= -5) {
    return { label: `${diff.toFixed(1)} net (yakın)`, color: "bg-amber-100 text-amber-700" };
  }
  return { label: `${diff.toFixed(1)} net eksik`, color: "bg-red-100 text-red-700" };
}

export default function TargetSchoolList({
  items,
  currentNet,
}: {
  items: TargetSchoolItem[];
  currentNet: number | null;
}) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Henüz hedef okul eklenmedi.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((school) => {
        const status = statusFor(currentNet, school.targetNet);
        return (
          <li key={school.id} className="card flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-medium text-gray-900">{school.name}</h3>
              <p className="text-xs text-gray-500">
                Hedef net: {school.targetNet}
                {school.note ? ` · ${school.note}` : ""}
              </p>
              <span className={`badge mt-1.5 ${status.color}`}>{status.label}</span>
            </div>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => deleteTargetSchool(school.id))}
              className="shrink-0 text-xs text-gray-400 hover:text-red-600"
            >
              Sil
            </button>
          </li>
        );
      })}
    </ul>
  );
}
