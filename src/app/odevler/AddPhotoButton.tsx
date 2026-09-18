"use client";

import { useRef, useTransition } from "react";
import { addHomeworkPhotos } from "./actions";

export default function AddPhotoButton({ homeworkId }: { homeworkId: string }) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("photos", f));

    startTransition(async () => {
      await addHomeworkPhotos(homeworkId, formData);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        disabled={isPending}
        onChange={handleChange}
      />
      {isPending ? "Yükleniyor..." : "+ Fotoğraf ekle"}
    </label>
  );
}
