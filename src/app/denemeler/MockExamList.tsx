"use client";

import { useState } from "react";
import { deleteMockExam } from "./actions";
import MockExamForm, { type ExamDraft, type Subject } from "./MockExamForm";
import AuthorBadge, { type Author } from "@/components/AuthorBadge";
import CreatedAt from "@/components/CreatedAt";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { EXAM_TYPE_LABELS } from "@/lib/labels";
import { netOf, calculateLgsPuan } from "@/lib/lgs";

type ResultItem = {
  id: string;
  subjectId: string;
  correct: number;
  wrong: number;
  blank: number;
  subject: { name: string };
};

type ExamItem = {
  id: string;
  name: string;
  date: string;
  type: string;
  estimatedPercentile: number | null;
  createdAt: string;
  results: ResultItem[];
  user: Author;
};

export default function MockExamList({
  items,
  subjects,
}: {
  items: ExamItem[];
  subjects: Subject[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Henüz deneme sonucu eklenmedi.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((exam) => {
        if (editingId === exam.id) {
          const draft: ExamDraft = {
            id: exam.id,
            name: exam.name,
            date: exam.date,
            type: exam.type,
            estimatedPercentile: exam.estimatedPercentile,
            results: exam.results.map((r) => ({
              subjectId: r.subjectId,
              correct: r.correct,
              wrong: r.wrong,
              blank: r.blank,
            })),
          };
          return (
            <li key={exam.id}>
              <MockExamForm
                subjects={subjects}
                exam={draft}
                onDone={() => setEditingId(null)}
              />
            </li>
          );
        }

        const totalNet = exam.results.reduce((sum, r) => sum + netOf(r), 0);
        const puan = calculateLgsPuan(
          exam.results.map((r) => ({
            subjectName: r.subject.name,
            correct: r.correct,
            wrong: r.wrong,
          }))
        );
        return (
          <li key={exam.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-gray-900">{exam.name}</h3>
                  <span className="badge bg-brand-50 text-brand-700">
                    {EXAM_TYPE_LABELS[exam.type]}
                  </span>
                  <AuthorBadge user={exam.user} />
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(exam.date).toLocaleDateString("tr-TR")} · Toplam Net:{" "}
                  <span className="font-semibold text-brand-700">{totalNet.toFixed(2)}</span>
                  {puan !== null && (
                    <>
                      {" "}
                      · Tahmini Puan:{" "}
                      <span className="font-semibold text-brand-700">{puan.toFixed(2)}</span>
                    </>
                  )}
                  {exam.estimatedPercentile !== null && (
                    <>
                      {" "}
                      · Yüzdelik dilim:{" "}
                      <span className="font-semibold text-brand-700">
                        {exam.estimatedPercentile}
                      </span>
                    </>
                  )}
                </p>
                <CreatedAt value={exam.createdAt} />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  onClick={() => setEditingId(exam.id)}
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  Düzenle
                </button>
                <ConfirmDeleteButton
                  title="Bu deneme silinsin mi?"
                  description={`${exam.name} · ${new Date(exam.date).toLocaleDateString(
                    "tr-TR"
                  )} · ${exam.results.length} ders sonucu`}
                  onConfirm={() => deleteMockExam(exam.id)}
                />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {exam.results.map((r) => (
                <div key={r.id} className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs">
                  <div className="font-medium text-gray-700">{r.subject.name}</div>
                  <div className="text-gray-500">
                    D:{r.correct} Y:{r.wrong} B:{r.blank} ·{" "}
                    <span className="font-medium text-brand-700">
                      Net {netOf(r).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
