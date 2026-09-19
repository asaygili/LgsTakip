"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toggleMistakeResolved, deleteMistake, deleteMistakeFile } from "./actions";
import AddFileButton from "./AddFileButton";
import { formatBytes } from "@/lib/compress";
import MistakeForm, { type MistakeDraft, type Subject } from "./MistakeForm";
import { MISTAKE_REASON_LABELS } from "@/lib/labels";
import AuthorBadge, { type Author } from "@/components/AuthorBadge";
import CreatedAt from "@/components/CreatedAt";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";

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
  files: MistakeFileItem[];
};

type MistakeFileItem = {
  id: string;
  mimeType: string;
  fileName: string;
  size: number;
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
  const [lightbox, setLightbox] = useState<string | null>(null);

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
              <CreatedAt value={m.createdAt} />

              {m.files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.files.map((file) =>
                    file.mimeType.startsWith("image/") ? (
                      <div key={file.id} className="group relative h-16 w-16 shrink-0">
                        <button
                          type="button"
                          onClick={() => setLightbox(`/api/hata-dosyalari/${file.id}`)}
                          className="block h-16 w-16 overflow-hidden rounded-lg ring-1 ring-black/10"
                        >
                          <Image
                            src={`/api/hata-dosyalari/${file.id}`}
                            alt={file.fileName}
                            width={64}
                            height={64}
                            className="h-16 w-16 object-cover"
                            unoptimized
                          />
                        </button>
                        <ConfirmDeleteButton
                          label="×"
                          ariaLabel="Dosyayı sil"
                          title="Bu dosya silinsin mi?"
                          description={`${file.fileName} · ${formatBytes(file.size)}`}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/80 text-xs text-white"
                          onConfirm={() => deleteMistakeFile(file.id)}
                        />
                      </div>
                    ) : (
                      <div
                        key={file.id}
                        className="group relative flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 pr-6 ring-1 ring-black/5"
                      >
                        <a
                          href={`/api/hata-dosyalari/${file.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 text-xs font-medium text-brand-700 hover:underline"
                        >
                          <span className="block max-w-[10rem] truncate">
                            {file.fileName}
                          </span>
                          <span className="font-normal text-gray-400">
                            {formatBytes(file.size)}
                          </span>
                        </a>
                        <ConfirmDeleteButton
                          label="×"
                          ariaLabel="Dosyayı sil"
                          title="Bu dosya silinsin mi?"
                          description={`${file.fileName} · ${formatBytes(file.size)}`}
                          className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 text-[10px] text-white hover:bg-red-600"
                          onConfirm={() => deleteMistakeFile(file.id)}
                        />
                      </div>
                    )
                  )}
                </div>
              )}
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
              <AddFileButton mistakeId={m.id} />
              <ConfirmDeleteButton
                title="Bu hata kaydı silinsin mi?"
                description={`${m.subject.name}${m.topic ? ` · ${m.topic.name}` : ""} · ${
                  MISTAKE_REASON_LABELS[m.reason] ?? m.reason
                }`}
                onConfirm={() => deleteMistake(m.id)}
              />
            </div>
          </div>
        </li>
        )
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Soru fotoğrafı büyük görünüm"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </ul>
  );
}
