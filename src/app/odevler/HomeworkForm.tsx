"use client";

import { useActionState, useEffect, useRef } from "react";
import SubjectTopicSelect from "@/components/SubjectTopicSelect";
import { createHomework, updateHomework, type HomeworkState } from "./actions";

const initialState: HomeworkState = {};

type Topic = { id: string; name: string };
export type Subject = { id: string; name: string; topics: Topic[] };

export type HomeworkDraft = {
  id: string;
  title: string;
  subjectId: string;
  topicId: string | null;
  pages: string | null;
  description: string | null;
  /** ISO tarih; <input type="date"> için ilk 10 karakteri kullanılır. */
  assignedDate: string;
  dueDate: string | null;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeworkForm({
  subjects,
  homework,
  onDone,
}: {
  subjects: Subject[];
  /** Verilirse form güncelleme kipinde açılır. */
  homework?: HomeworkDraft;
  onDone?: () => void;
}) {
  const isEdit = Boolean(homework);
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateHomework : createHomework,
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
      {homework && <input type="hidden" name="id" value={homework.id} />}
      {isEdit && <h3 className="font-semibold text-gray-900">Ödevi Güncelle</h3>}

      <div>
        <label className="label">Ödev başlığı</label>
        <input
          name="title"
          className="input"
          placeholder="Örn: Test kitabı testleri"
          defaultValue={homework?.title ?? ""}
          required
        />
      </div>
      <SubjectTopicSelect
        key={homework?.id ?? "new"}
        subjects={subjects}
        defaultSubjectId={homework?.subjectId}
        defaultTopicId={homework?.topicId}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Sayfa aralığı (opsiyonel)</label>
          <input
            name="pages"
            className="input"
            placeholder="Örn: 45-48"
            defaultValue={homework?.pages ?? ""}
          />
        </div>
        <div>
          <label className="label">Son tarih (opsiyonel)</label>
          <input
            type="date"
            name="dueDate"
            className="input"
            defaultValue={homework?.dueDate ? homework.dueDate.slice(0, 10) : ""}
          />
        </div>
      </div>
      <div>
        <label className="label">Verildiği tarih</label>
        <input
          type="date"
          name="assignedDate"
          className="input"
          defaultValue={homework ? homework.assignedDate.slice(0, 10) : todayStr()}
          required
        />
      </div>
      <div>
        <label className="label">Açıklama (opsiyonel)</label>
        <textarea
          name="description"
          className="input"
          rows={2}
          defaultValue={homework?.description ?? ""}
        />
      </div>
      {isEdit ? (
        <p className="text-xs text-gray-400">
          Fotoğrafları ödev kartındaki &quot;Fotoğraf ekle&quot; düğmesiyle
          yönetebilirsiniz.
        </p>
      ) : (
        <div>
          <label className="label">Ders fotoğrafı (opsiyonel, birden fazla seçilebilir)</label>
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            className="input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-700"
          />
        </div>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && !isEdit && <p className="text-sm text-emerald-600">{state.success}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Kaydediliyor..." : isEdit ? "Değişiklikleri Kaydet" : "Ödev Ekle"}
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
