"use client";

import { useState } from "react";
import { deleteTargetSchool } from "./actions";
import TargetSchoolForm, { type SchoolDraft } from "./TargetSchoolForm";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { SCHOOL_TYPE_LABELS } from "@/lib/labels";

type TargetSchoolItem = {
  id: string;
  name: string;
  location: string | null;
  schoolType: string | null;
  quota: number | null;
  cutoffScore: number | null;
  targetPercentile: number | null;
  note: string | null;
};

const PUAN_MARGIN = 10;

function statusFor(
  studentPuan: number | null,
  studentPercentile: number | null,
  school: TargetSchoolItem
) {
  // Puan mevcutsa onu kullan (otomatik hesaplanır, daha güvenilir): büyük değer daha iyi.
  if (studentPuan !== null && school.cutoffScore !== null) {
    const diff = studentPuan - school.cutoffScore;
    if (diff >= 0) {
      return {
        label: `Puan yeterli (+${diff.toFixed(1)})`,
        color: "bg-emerald-100 text-emerald-700",
      };
    }
    if (diff >= -PUAN_MARGIN) {
      return { label: `Yakın (${diff.toFixed(1)} puan)`, color: "bg-amber-100 text-amber-700" };
    }
    return { label: `Puan yetersiz (${diff.toFixed(1)})`, color: "bg-red-100 text-red-700" };
  }

  // Yoksa yüzdelik dilime düş: küçük değer daha iyi.
  if (studentPercentile !== null && school.targetPercentile !== null) {
    const diff = school.targetPercentile - studentPercentile;
    const margin = Math.max(school.targetPercentile * 0.2, 0.5);
    if (diff >= 0) {
      return {
        label: `Sıralama yeterli (+${diff.toFixed(2)})`,
        color: "bg-emerald-100 text-emerald-700",
      };
    }
    if (diff >= -margin) {
      return { label: `Yakın (${diff.toFixed(2)})`, color: "bg-amber-100 text-amber-700" };
    }
    return { label: `Sıralama yetersiz (${diff.toFixed(2)})`, color: "bg-red-100 text-red-700" };
  }

  return { label: "Karşılaştırma için veri eksik", color: "bg-gray-100 text-gray-500" };
}

export default function TargetSchoolList({
  items,
  studentPuan,
  studentPercentile,
}: {
  items: TargetSchoolItem[];
  studentPuan: number | null;
  studentPercentile: number | null;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Henüz hedef okul eklenmedi.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((school) => {
        if (editingId === school.id) {
          return (
            <li key={school.id}>
              <TargetSchoolForm
                school={
                  {
                    id: school.id,
                    name: school.name,
                    location: school.location,
                    schoolType: school.schoolType,
                    quota: school.quota,
                    targetPercentile: school.targetPercentile,
                    cutoffScore: school.cutoffScore,
                    note: school.note,
                  } satisfies SchoolDraft
                }
                onDone={() => setEditingId(null)}
              />
            </li>
          );
        }

        const status = statusFor(studentPuan, studentPercentile, school);
        return (
          <li key={school.id} className="card flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-gray-900">{school.name}</h3>
                {school.schoolType && (
                  <span className="badge bg-gray-100 text-gray-600">
                    {SCHOOL_TYPE_LABELS[school.schoolType]}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {school.location ? `${school.location} \u00b7 ` : ""}
                {school.targetPercentile !== null && `Yüzdelik dilim: ${school.targetPercentile}`}
                {school.cutoffScore ? ` \u00b7 Puan: ${school.cutoffScore}` : ""}
                {school.quota ? ` \u00b7 Kontenjan: ${school.quota}` : ""}
              </p>
              {school.note && <p className="text-xs text-gray-400">{school.note}</p>}
              <span className={`badge mt-1.5 ${status.color}`}>{status.label}</span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <button
                onClick={() => setEditingId(school.id)}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Düzenle
              </button>
              <ConfirmDeleteButton
                title="Bu hedef okul silinsin mi?"
                description={`${school.name}${school.location ? ` · ${school.location}` : ""}`}
                onConfirm={() => deleteTargetSchool(school.id)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
