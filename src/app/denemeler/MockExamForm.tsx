"use client";

import { useActionState, useEffect, useRef } from "react";
import { createMockExam, updateMockExam, type MockExamState } from "./actions";
import { EXAM_TYPE_LABELS } from "@/lib/labels";

const initialState: MockExamState = {};

export type Subject = { id: string; name: string };

export type ExamDraft = {
  id: string;
  name: string;
  /** ISO tarih; <input type="date"> için ilk 10 karakteri kullanılır. */
  date: string;
  type: string;
  estimatedPercentile: number | null;
  results: { subjectId: string; correct: number; wrong: number; blank: number }[];
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function MockExamForm({
  subjects,
  exam,
  onDone,
}: {
  subjects: Subject[];
  /** Verilirse form güncelleme kipinde açılır. */
  exam?: ExamDraft;
  onDone?: () => void;
}) {
  const isEdit = Boolean(exam);
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateMockExam : createMockExam,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.success) return;
    if (isEdit) onDone?.();
    else formRef.current?.reset();
  }, [state.success, isEdit, onDone]);

  const resultFor = (subjectId: string) =>
    exam?.results.find((r) => r.subjectId === subjectId);

  return (
    <form ref={formRef} action={formAction} className="card space-y-4">
      {exam && <input type="hidden" name="id" value={exam.id} />}
      {isEdit && <h3 className="font-semibold text-gray-900">Denemeyi Güncelle</h3>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Deneme adı</label>
          <input
            name="name"
            className="input"
            placeholder="Örn: 3. Deneme"
            defaultValue={exam?.name ?? ""}
            required
          />
        </div>
        <div>
          <label className="label">Tarih</label>
          <input
            type="date"
            name="date"
            className="input"
            defaultValue={exam ? exam.date.slice(0, 10) : todayStr()}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tür</label>
          <select name="type" className="input" defaultValue={exam?.type ?? "GENEL"}>
            {Object.entries(EXAM_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tahmini yüzdelik dilim (opsiyonel)</label>
          <input
            type="number"
            name="estimatedPercentile"
            className="input"
            min={0}
            max={100}
            step={0.01}
            placeholder="Örn: 1.25"
            defaultValue={exam?.estimatedPercentile ?? ""}
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Yüzdelik dilim, kullandığınız deneme sonuç sisteminin verdiği tahmini sıralama yüzdesidir
        (küçük değer = daha iyi sıralama). Hedef Okullar sayfasındaki karşılaştırma için kullanılır.
      </p>

      <div className="space-y-2">
        <label className="label">Ders sonuçları</label>
        <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500">
          <span>Ders</span>
          <span>Doğru</span>
          <span>Yanlış</span>
          <span>Boş</span>
        </div>
        {subjects.map((s) => {
          const r = resultFor(s.id);
          return (
            <div key={s.id} className="grid grid-cols-4 items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm text-gray-700">
                <input type="hidden" name="subjectIds" value={s.id} />
                {s.name}
              </label>
              <input
                type="number"
                min={0}
                name={`correct_${s.id}`}
                className="input"
                defaultValue={r?.correct ?? 0}
              />
              <input
                type="number"
                min={0}
                name={`wrong_${s.id}`}
                className="input"
                defaultValue={r?.wrong ?? 0}
              />
              <input
                type="number"
                min={0}
                name={`blank_${s.id}`}
                className="input"
                defaultValue={r?.blank ?? 0}
              />
            </div>
          );
        })}
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && !isEdit && (
        <p className="text-sm text-emerald-600">{state.success}</p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending
            ? "Kaydediliyor..."
            : isEdit
              ? "Değişiklikleri Kaydet"
              : "Deneme Sonucunu Kaydet"}
        </button>
        {isEdit && (
          <button type="button" onClick={onDone} className="btn-secondary">
            Vazgeç
          </button>
        )}
      </div>
    </form>
  );
}
