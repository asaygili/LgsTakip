"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import SubjectTopicSelect from "@/components/SubjectTopicSelect";
import { createDailyLog, updateDailyLog, type DailyLogState } from "./actions";

const initialState: DailyLogState = {};

type Topic = { id: string; name: string };
export type Subject = { id: string; name: string; topics: Topic[] };

export type LogDraft = {
  id: string;
  subjectId: string;
  topicId: string | null;
  isMixed: boolean;
  /** ISO tarih; <input type="date"> için ilk 10 karakteri kullanılır. */
  date: string;
  questionsCorrect: number;
  questionsWrong: number;
  questionsBlank: number;
  durationMinutes: number | null;
  notes: string | null;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyLogForm({
  subjects,
  log,
  onDone,
}: {
  subjects: Subject[];
  /** Verilirse form güncelleme kipinde açılır. */
  log?: LogDraft;
  onDone?: () => void;
}) {
  const isEdit = Boolean(log);
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateDailyLog : createDailyLog,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [isMixed, setIsMixed] = useState(log?.isMixed ?? false);

  useEffect(() => {
    if (!state.success) return;
    if (isEdit) {
      onDone?.();
    } else {
      formRef.current?.reset();
      setIsMixed(false);
    }
  }, [state.success, isEdit, onDone]);

  return (
    <form ref={formRef} action={formAction} className="card space-y-3">
      {log && <input type="hidden" name="id" value={log.id} />}
      {isEdit && <h3 className="font-semibold text-gray-900">Kaydı Güncelle</h3>}

      <SubjectTopicSelect
        key={log?.id ?? "new"}
        subjects={subjects}
        defaultSubjectId={log?.subjectId}
        defaultTopicId={log?.topicId}
        topicDisabled={isMixed}
        topicDisabledHint="Karma test"
      />
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="isMixed"
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600"
          checked={isMixed}
          onChange={(e) => setIsMixed(e.target.checked)}
        />
        <span>
          Karma test (birden fazla konu)
          <span className="block text-xs text-gray-500">
            Tek konuya bağlanmadığı için konu bazlı analizlere girmez. Yanlışların
            hangi konudan olduğunu Hatalar sayfasına girerseniz zayıf konu radarına
            yansır.
          </span>
        </span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tarih</label>
          <input
            type="date"
            name="date"
            className="input"
            defaultValue={log ? log.date.slice(0, 10) : todayStr()}
            required
          />
        </div>
        <div>
          <label className="label">Süre (dk, opsiyonel)</label>
          <input
            type="number"
            min={0}
            name="duration"
            className="input"
            defaultValue={log?.durationMinutes ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Doğru</label>
          <input
            type="number"
            min={0}
            name="correct"
            className="input"
            defaultValue={log?.questionsCorrect ?? 0}
            required
          />
        </div>
        <div>
          <label className="label">Yanlış</label>
          <input
            type="number"
            min={0}
            name="wrong"
            className="input"
            defaultValue={log?.questionsWrong ?? 0}
            required
          />
        </div>
        <div>
          <label className="label">Boş</label>
          <input
            type="number"
            min={0}
            name="blank"
            className="input"
            defaultValue={log?.questionsBlank ?? 0}
            required
          />
        </div>
      </div>
      <div>
        <label className="label">Not (opsiyonel)</label>
        <textarea name="notes" className="input" rows={2} defaultValue={log?.notes ?? ""} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && !isEdit && <p className="text-sm text-emerald-600">{state.success}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Kaydediliyor..." : isEdit ? "Değişiklikleri Kaydet" : "Kaydet"}
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
