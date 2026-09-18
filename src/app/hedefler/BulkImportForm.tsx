"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { bulkCreateTargetSchools, type BulkImportState } from "./actions";

const initialState: BulkImportState = {};

export default function BulkImportForm() {
  const [state, formAction, isPending] = useActionState(bulkCreateTargetSchools, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.added && state.added > 0) {
      formRef.current?.reset();
    }
  }, [state.added]);

  return (
    <div className="card space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left font-semibold text-gray-900"
      >
        <span>Toplu Okul Ekle (yapıştır)</span>
        <span className="text-sm text-gray-400">{open ? "Gizle" : "Göster"}</span>
      </button>

      {open && (
        <>
          <p className="text-xs text-gray-500">
            Her satıra bir okul yazın: <strong>Okul Adı</strong> ardından TAB (veya çift boşluk)
            ile ayrılmış <strong>Hedef Net</strong> (0-90 arası), isterseniz üçüncü sütun olarak
            bir not. Örnek:
          </p>
          <pre className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
{`Ankara Fen Lisesi\t85\t2025 taban puanı
Kadıköy Anadolu Lisesi\t78`}
          </pre>
          <form ref={formRef} action={formAction} className="space-y-3">
            <textarea
              name="bulkText"
              className="input font-mono text-xs"
              rows={6}
              placeholder="Okul Adı[TAB]Hedef Net[TAB]Not (opsiyonel)"
              required
            />
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            {state.added !== undefined && state.added > 0 && (
              <p className="text-sm text-emerald-600">
                {state.added} okul eklendi.
                {state.skipped ? ` ${state.skipped} satır anlaşılamadığı için atlandı.` : ""}
              </p>
            )}
            {state.skippedLines && state.skippedLines.length > 0 && (
              <div className="text-xs text-gray-400">
                Anlaşılamayan örnekler: {state.skippedLines.join(" · ")}
              </div>
            )}
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Ekleniyor..." : "Listeyi Ekle"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
