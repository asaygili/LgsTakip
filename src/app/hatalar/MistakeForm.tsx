"use client";

import { useActionState, useEffect, useRef } from "react";
import SubjectTopicSelect from "@/components/SubjectTopicSelect";
import { createMistake, updateMistake, type MistakeState } from "./actions";
import { MISTAKE_REASON_LABELS } from "@/lib/labels";

const initialState: MistakeState = {};

type Topic = { id: string; name: string };
export type Subject = { id: string; name: string; topics: Topic[] };

export type MistakeDraft = {
  id: string;
  subjectId: string;
  topicId: string | null;
  reason: string;
  description: string | null;
};

export default function MistakeForm({
  subjects,
  mistake,
  onDone,
}: {
  subjects: Subject[];
  /** Verilirse form güncelleme kipinde açılır. */
  mistake?: MistakeDraft;
  onDone?: () => void;
}) {
  const isEdit = Boolean(mistake);
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateMistake : createMistake,
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
      {mistake && <input type="hidden" name="id" value={mistake.id} />}
      {isEdit && <h3 className="font-semibold text-gray-900">Hatayı Güncelle</h3>}

      <SubjectTopicSelect
        key={mistake?.id ?? "new"}
        subjects={subjects}
        defaultSubjectId={mistake?.subjectId}
        defaultTopicId={mistake?.topicId}
      />
      <div>
        <label className="label">Hata nedeni</label>
        <select name="reason" className="input" required defaultValue={mistake?.reason ?? ""}>
          <option value="" disabled>
            Seçin
          </option>
          {Object.entries(MISTAKE_REASON_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Açıklama (opsiyonel)</label>
        <textarea
          name="description"
          className="input"
          rows={2}
          placeholder="Örn: Ondalık sayılarda virgülü kaydırmayı unuttu"
          defaultValue={mistake?.description ?? ""}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && !isEdit && <p className="text-sm text-emerald-600">{state.success}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Kaydediliyor..." : isEdit ? "Değişiklikleri Kaydet" : "Hata Ekle"}
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
