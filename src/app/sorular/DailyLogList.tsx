"use client";

import { useTransition } from "react";
import { deleteDailyLog } from "./actions";

type LogItem = {
  id: string;
  date: string;
  questionsCorrect: number;
  questionsWrong: number;
  questionsBlank: number;
  durationMinutes: number | null;
  notes: string | null;
  subject: { name: string };
  topic: { name: string } | null;
};

export default function DailyLogList({ items }: { items: LogItem[] }) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Henüz kayıt eklenmedi.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((log) => {
        const total = log.questionsCorrect + log.questionsWrong + log.questionsBlank;
        const net = log.questionsCorrect - log.questionsWrong * 0.25;
        return (
          <li key={log.id} className="card flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-gray-900">{log.subject.name}</span>
                {log.topic && <span className="text-gray-500">· {log.topic.name}</span>}
                <span className="text-xs text-gray-400">
                  {new Date(log.date).toLocaleDateString("tr-TR")}
                </span>
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
            <button
              disabled={isPending}
              onClick={() => startTransition(() => deleteDailyLog(log.id))}
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
