"use client";

import { useState, useTransition } from "react";
import { deleteDailyLog } from "./actions";
import DailyLogForm, { type LogDraft, type Subject } from "./DailyLogForm";
import { netOf } from "@/lib/lgs";
import AuthorBadge, { type Author } from "@/components/AuthorBadge";

type LogItem = {
  id: string;
  subjectId: string;
  topicId: string | null;
  date: string;
  questionsCorrect: number;
  questionsWrong: number;
  questionsBlank: number;
  durationMinutes: number | null;
  notes: string | null;
  subject: { name: string };
  topic: { name: string } | null;
  user: Author;
};

export default function DailyLogList({
  items,
  subjects,
}: {
  items: LogItem[];
  subjects: Subject[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Henüz kayıt eklenmedi.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((log) => {
        if (editingId === log.id) {
          const draft: LogDraft = {
            id: log.id,
            subjectId: log.subjectId,
            topicId: log.topicId,
            date: log.date,
            questionsCorrect: log.questionsCorrect,
            questionsWrong: log.questionsWrong,
            questionsBlank: log.questionsBlank,
            durationMinutes: log.durationMinutes,
            notes: log.notes,
          };
          return (
            <li key={log.id}>
              <DailyLogForm
                subjects={subjects}
                log={draft}
                onDone={() => setEditingId(null)}
              />
            </li>
          );
        }

        const total = log.questionsCorrect + log.questionsWrong + log.questionsBlank;
        const net = netOf({ correct: log.questionsCorrect, wrong: log.questionsWrong });
        return (
          <li key={log.id} className="card flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-gray-900">{log.subject.name}</span>
                {log.topic && <span className="text-gray-500">· {log.topic.name}</span>}
                <span className="text-xs text-gray-400">
                  {new Date(log.date).toLocaleDateString("tr-TR")}
                </span>
                <AuthorBadge user={log.user} />
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-600">
                <span>Toplam: {total}</span>
                <span className="text-emerald-600">Doğru: {log.questionsCorrect}</span>
                <span className="text-red-500">Yanlış: {log.questionsWrong}</span>
                <span className="text-gray-400">Boş: {log.questionsBlank}</span>
                <span className="font-medium text-brand-700">Net: {net.toFixed(2)}</span>
                {log.durationMinutes && <span>Süre: {log.durationMinutes} dk</span>}
              </div>
              {log.notes && <p className="mt-1 text-sm text-gray-600">{log.notes}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <button
                onClick={() => setEditingId(log.id)}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Düzenle
              </button>
              <button
                disabled={isPending}
                onClick={() => startTransition(() => deleteDailyLog(log.id))}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                Sil
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
