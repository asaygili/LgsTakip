"use client";

import { useTransition } from "react";
import { updateHomeworkStatus, deleteHomework } from "./actions";
import { HOMEWORK_STATUS_LABELS, HOMEWORK_STATUS_COLORS } from "@/lib/labels";

type HomeworkItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  subject: { name: string };
  topic: { name: string } | null;
};

export default function HomeworkList({ items }: { items: HomeworkItem[] }) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500">Henüz ödev eklenmedi.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((hw) => (
        <li key={hw.id} className="card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-gray-900">{hw.title}</h3>
                <span className={`badge ${HOMEWORK_STATUS_COLORS[hw.status]}`}>
                  {HOMEWORK_STATUS_LABELS[hw.status]}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {hw.subject.name}
                {hw.topic ? ` · ${hw.topic.name}` : ""}
                {hw.dueDate
                  ? ` · Son tarih: ${new Date(hw.dueDate).toLocaleDateString("tr-TR")}`
                  : ""}
              </p>
              {hw.description && (
                <p className="mt-1 text-sm text-gray-600">{hw.description}</p>
              )}
            </div>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => deleteHomework(hw.id))}
              className="shrink-0 text-xs text-gray-400 hover:text-red-600"
            >
              Sil
            </button>
          </div>
          <div className="mt-3 flex gap-1.5">
            {Object.entries(HOMEWORK_STATUS_LABELS).map(([value, label]) => (
              <button
                key={value}
                disabled={isPending || hw.status === value}
                onClick={() =>
                  startTransition(() => updateHomeworkStatus(hw.id, value))
                }
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  hw.status === value
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
