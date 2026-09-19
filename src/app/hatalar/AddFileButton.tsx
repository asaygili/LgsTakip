"use client";

import { useRef, useState, useTransition } from "react";
import { addMistakeFiles } from "./actions";
import { compressImage, isImage, MAX_UPLOAD_BYTES, formatBytes } from "@/lib/compress";

/** Karttan dosya ekler. Fotoğraflar gönderilmeden önce tarayıcıda küçültülür. */
export default function AddFileButton({ mistakeId }: { mistakeId: string }) {
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files ?? []);
    if (chosen.length === 0) return;

    setBusy(true);
    setError(null);
    const formData = new FormData();
    let skipped = 0;

    for (const file of chosen) {
      const out = isImage(file) ? await compressImage(file) : file;
      if (out.size > MAX_UPLOAD_BYTES) {
        skipped += 1;
        continue;
      }
      formData.append("files", out);
    }
    setBusy(false);

    if (skipped > 0) {
      setError(
        `${skipped} dosya ${formatBytes(MAX_UPLOAD_BYTES)} sınırını aştığı için eklenmedi.`
      );
    }
    if (!formData.has("files")) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    startTransition(async () => {
      await addMistakeFiles(mistakeId, formData);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="text-right">
      <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          disabled={isPending || busy}
          onChange={handleChange}
        />
        {busy ? "Küçültülüyor..." : isPending ? "Yükleniyor..." : "+ Dosya ekle"}
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
