"use client";

import { useTransition } from "react";
import { deleteTargetSchool } from "./actions";

type TargetSchoolItem = {
  id: string;
  name: string;
  location: string | null;
  quota: number | null;
  cutoffScore: number | null;
  targetPercentile: number | null;
  note: string | null;
};

// Yüzdelik dilimde küçük değer daha iyi sıralama demektir.
function statusFor(studentPercentile: number | null, targetPercentile: number | null) {
  if (targetPercentile === null) {
    return { label: "Hedef yüzdelik dilim yok", color: "bg-gray-100 text-gray-500" };
  }
  if (studentPercentile === null) {
    return { label: "Yüzdelik dilim girilmedi", color: "bg-gray-100 text-gray-500" };
  }
  const diff = targetPercentile - studentPercentile;
  const margin = Math.max(targetPercentile * 0.2, 0.5);

  if (diff >= 0) {
    return { label: `Sıralama yeterli (+${diff.toFixed(2)})`, color: "bg-emerald-100 text-emerald-700" };
  }
  if (diff >= -margin) {
    return { label: `Yakın (${diff.toFixed(2)})`, color: "bg-amber-100 text-amber-700" };
  }
  return { label: `Sıralama yetersiz (${diff.toFixed(2)})`, color: "bg-red-100 text-red-700" };
}

export default function TargetSchoolList({
  items,
  studentPercentile,
}: {
  items: TargetSchoolItem[];
  studentPercentile: number | null;
}) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Henüz hedef okul eklenmedi.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((school) => {
        const status = statusFor(studentPercentile, school.targetPercentile);
        return (
          <li key={school.id} className="card flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-medium text-gray-900">{school.name}</h3>
              <p className="text-xs text-gray-500">
                {school.location ? `${school.location} · ` : ""}
                Yüzdelik dilim: {school.targetPercentile ?? "-"}
                {school.cutoffScore ? ` · Puan: ${school.cutoffScore}` : ""}
                {school.quota ? ` · Kontenjan: ${school.quota}` : ""}
              </p>
              {school.note && <p className="text-xs text-gray-400">{school.note}</p>}
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
