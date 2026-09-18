"use client";

import { useTransition } from "react";
import { deleteMockExam } from "./actions";
import { EXAM_TYPE_LABELS } from "@/lib/labels";

type ResultItem = {
  id: string;
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
  results: ResultItem[];
};

function netOf(r: { correct: number; wrong: number }) {
  return r.correct - r.wrong * 0.25;
}

export default function MockExamList({ items }: { items: ExamItem[] }) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Henüz deneme sonucu eklenmedi.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((exam) => {
        const totalNet = exam.results.reduce((sum, r) => sum + netOf(r), 0);
        return (
          <li key={exam.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-gray-900">{exam.name}</h3>
                  <span className="badge bg-brand-50 text-brand-700">
                    {EXAM_TYPE_LABELS[exam.type]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(exam.date).toLocaleDateString("tr-TR")} · Toplam Net:{" "}
                  <span className="font-semibold text-brand-700">{totalNet.toFixed(2)}</span>
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
              </div>
              <button
                disabled={isPending}
                onClick={() => startTransition(() => deleteMockExam(exam.id))}
                className="shrink-0 text-xs text-gray-400 hover:text-red-600"
              >
                Sil
              </button>
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
