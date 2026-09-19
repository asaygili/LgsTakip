"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTargetSchool, updateTargetSchool, type TargetSchoolState } from "./actions";

const initialState: TargetSchoolState = {};

export type SchoolDraft = {
  id: string;
  name: string;
  location: string | null;
  targetPercentile: number | null;
  cutoffScore: number | null;
  note: string | null;
};

export default function TargetSchoolForm({
  school,
  onDone,
}: {
  /** Verilirse form güncelleme kipinde açılır. */
  school?: SchoolDraft;
  onDone?: () => void;
}) {
  const isEdit = Boolean(school);
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateTargetSchool : createTargetSchool,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.success) return;
    if (isEdit) onDone?.();
    else formRef.current?.reset();
  }, [state.success, isEdit, onDone]);

  return (
    <form ref={formRef} action={formAction} className="card space-y-3">
      {school && <input type="hidden" name="id" value={school.id} />}
      <h2 className="font-semibold text-gray-900">
        {isEdit ? "Okulu Güncelle" : "Tek Okul Ekle"}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Okul adı</label>
          <input
            name="name"
            className="input"
            placeholder="Örn: Ankara Fen Lisesi"
            defaultValue={school?.name ?? ""}
            required
          />
        </div>
        <div>
          <label className="label">İl / İlçe (opsiyonel)</label>
          <input
            name="location"
            className="input"
            placeholder="Örn: Ankara / Çankaya"
            defaultValue={school?.location ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Hedef yüzdelik dilim</label>
          <input
            type="number"
            name="targetPercentile"
            className="input"
            min={0.01}
            max={100}
            step={0.01}
            placeholder="Örn: 0.09"
            defaultValue={school?.targetPercentile ?? ""}
            required
          />
        </div>
        <div>
          <label className="label">Taban puanı (opsiyonel)</label>
          <input
            type="number"
            name="cutoffScore"
            className="input"
            step={0.0001}
            placeholder="Örn: 494.42"
            defaultValue={school?.cutoffScore ?? ""}
          />
        </div>
      </div>
      <div>
        <label className="label">Not (opsiyonel)</label>
        <input
          name="note"
          className="input"
          placeholder="Örn: 2025 verisi"
          defaultValue={school?.note ?? ""}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && !isEdit && <p className="text-sm text-emerald-600">{state.success}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Kaydediliyor..." : isEdit ? "Değişiklikleri Kaydet" : "Okul Ekle"}
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
