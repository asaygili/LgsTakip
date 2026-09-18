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
            MEB/e-okul taban puan tablosunu (Sıra, İl/İlçe, Okul Adı, Kont., Taban Puanı, Yüzdelik
            Dilim sütunlarıyla) kopyalayıp <strong>olduğu gibi</strong> aşağıya yapıştırabilirsiniz.
            İsterseniz kendi kısa listenizi de <strong>Okul Adı [TAB] Yüzdelik Dilim</strong>{" "}
            formatında yazabilirsiniz. Örnek:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
{`1\tAnkara / Çankaya\tAnkara Fen Lisesi\t120\t494,4243\t0,09
Kadıköy Anadolu Lisesi\t2,5\tKardeşimin okulu`}
          </pre>
          <form ref={formRef} action={formAction} className="space-y-3">
            <textarea
              name="bulkText"
              className="input font-mono text-xs"
              rows={8}
              placeholder="Tabloyu buraya yapıştırın"
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
