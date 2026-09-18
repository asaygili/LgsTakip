"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { updateHomeworkStatus, deleteHomework, deleteHomeworkPhoto } from "./actions";
import AddPhotoButton from "./AddPhotoButton";
import { HOMEWORK_STATUS_LABELS, HOMEWORK_STATUS_COLORS } from "@/lib/labels";

type Photo = { id: string; filePath: string };

type HomeworkItem = {
  id: string;
  title: string;
  description: string | null;
  pages: string | null;
  status: string;
  assignedDate: string;
  dueDate: string | null;
  subject: { name: string };
  topic: { name: string } | null;
  photos: Photo[];
};

export default function HomeworkList({ items }: { items: HomeworkItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Henüz ödev eklenmedi.</p>;
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
                {hw.pages ? ` · Sayfa: ${hw.pages}` : ""}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Verildi: {new Date(hw.assignedDate).toLocaleDateString("tr-TR")}
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

          {hw.photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hw.photos.map((photo) => (
                <div key={photo.id} className="group relative h-16 w-16 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLightbox(photo.filePath)}
                    className="block h-16 w-16 overflow-hidden rounded-lg ring-1 ring-black/10"
                  >
                    <Image
                      src={photo.filePath}
                      alt="Ödev fotoğrafı"
                      width={64}
                      height={64}
                      className="h-16 w-16 object-cover"
                      unoptimized
                    />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startTransition(() => deleteHomeworkPhoto(photo.id))}
                    className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-gray-900/80 text-xs text-white group-hover:flex"
                    title="Fotoğrafı sil"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5">
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
            <AddPhotoButton homeworkId={hw.id} />
          </div>
        </li>
      ))}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Ödev fotoğrafı büyük görünüm"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </ul>
  );
}
