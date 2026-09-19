"use client";

import { useRef, useState } from "react";
import {
  compressImage,
  formatBytes,
  isImage,
  MAX_FILES,
  MAX_UPLOAD_BYTES,
} from "@/lib/compress";

type Picked = { name: string; before: number; after: number; tooBig: boolean };

/**
 * Dosya seçici. Seçilen fotoğraflar yüklenmeden önce tarayıcıda küçültülür ve
 * kullanıcıya "3.9 MB → 260 KB" şeklinde kazanç gösterilir. Sıkıştırılmış
 * dosyalar DataTransfer ile input'a geri yazılır; forma giden budur.
 */
export default function AttachmentPicker({
  name,
  label,
  accept = "image/*",
  allowPdf = false,
}: {
  /** Form alanı adı; sunucu bu adla okur. */
  name: string;
  label: string;
  accept?: string;
  allowPdf?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const chosen = Array.from(input.files ?? []);
    if (chosen.length === 0) {
      setPicked([]);
      return;
    }

    setBusy(true);
    const limited = chosen.slice(0, MAX_FILES);
    const processed: File[] = [];
    const summary: Picked[] = [];

    for (const file of limited) {
      const out = isImage(file) ? await compressImage(file) : file;
      const tooBig = out.size > MAX_UPLOAD_BYTES;
      summary.push({ name: out.name, before: file.size, after: out.size, tooBig });
      if (!tooBig) processed.push(out);
    }

    // Sıkıştırılmış dosyaları input'a geri yaz; form bunları gönderir.
    const transfer = new DataTransfer();
    processed.forEach((f) => transfer.items.add(f));
    input.files = transfer.files;

    setPicked(summary);
    setBusy(false);
  }

  const total = picked.filter((p) => !p.tooBig).reduce((s, p) => s + p.after, 0);

  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        ref={inputRef}
        type="file"
        name={name}
        accept={allowPdf ? `${accept},application/pdf` : accept}
        multiple
        onChange={handleChange}
        className="input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-700"
      />
      <p className="mt-1 text-xs text-gray-400">
        Fotoğraflar yüklenmeden önce küçültülür. En fazla {MAX_FILES} dosya, dosya
        başına {formatBytes(MAX_UPLOAD_BYTES)}
        {allowPdf ? " (PDF de yüklenebilir)" : ""}.
      </p>

      {busy && <p className="mt-1 text-xs text-gray-500">Fotoğraf küçültülüyor...</p>}

      {picked.length > 0 && !busy && (
        <ul className="mt-2 space-y-1">
          {picked.map((p, i) => (
            <li key={i} className="text-xs">
              {p.tooBig ? (
                <span className="text-red-600">
                  {p.name} · {formatBytes(p.after)} — çok büyük, eklenmedi
                </span>
              ) : (
                <span className="text-gray-500">
                  {p.name} ·{" "}
                  {p.after < p.before ? (
                    <>
                      <span className="line-through">{formatBytes(p.before)}</span>{" "}
                      <span className="font-medium text-emerald-600">
                        {formatBytes(p.after)}
                      </span>
                    </>
                  ) : (
                    formatBytes(p.after)
                  )}
                </span>
              )}
            </li>
          ))}
          {picked.filter((p) => !p.tooBig).length > 1 && (
            <li className="text-xs text-gray-400">Toplam: {formatBytes(total)}</li>
          )}
        </ul>
      )}
    </div>
  );
}
