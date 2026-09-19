"use client";

import { useState, useTransition } from "react";
import { toggleMistakeResolved, deleteMistake } from "./actions";
import MistakeForm, { type MistakeDraft, type Subject } from "./MistakeForm";
import { MISTAKE_REASON_LABELS } from "@/lib/labels";
import AuthorBadge, { type Author } from "@/components/AuthorBadge";

type MistakeItem = {
  id: string;
  description: string | null;
  reason: string;
  resolved: boolean;
  createdAt: string;
  subjectId: string;
  topicId: string | null;
  subject: { name: string };
  topic: { name: string } | null;
  user: Author;
};

export default function MistakeList({
  items,
  subjects,
}: {
  items: MistakeItem[];
  subjects: Subject[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Henüz hata kaydı eklenmedi.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((m) =>
        editingId === m.id ? (
          <li key={m.id}>
            <MistakeForm
              subjects={subjects}
              mistake={
                {
                  id: m.id,
                  subjectId: m.subjectId,
                  topicId: m.topicId,
                  reason: m.reason,
                  description: m.description,
                } satisfies MistakeDraft
              }
              onDone={() => setEditingId(null)}
            />
          </li>
        ) : (
        <li key={m.id} className={`card ${m.resolved ? "opacity-60" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-gray-900">{m.subject.name}</span>
                {m.topic && <span className="text-gray-500">· {m.topic.name}</span>}
                <span className="badge bg-red-50 text-red-600">
                  {MISTAKE_REASON_LABELS[m.reason]}
                </span>
                {m.resolved && (
                  <span className="badge bg-emerald-100 text-emerald-700">Giderildi</span>
                )}
                <AuthorBadge user={m.user} />
              </div>
              {m.description && (
                <p className="mt-1 text-sm text-gray-600">{m.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {new Date(m.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(() => toggleMistakeResolved(m.id, !m.resolved))
                }
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                {m.resolved ? "Geri al" : "Giderildi işaretle"}
              </button>
              <button
                onClick={() => setEditingId(m.id)}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Düzenle
              </button>
              <button
                disabled={isPending}
                onClick={() => startTransition(() => deleteMistake(m.id))}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                Sil
              </button>
            </div>
          </div>
        </li>
        )
      )}
    </ul>
  );
}
