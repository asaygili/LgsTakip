"use client";

import { useEffect, useState, useTransition } from "react";

/**
 * Silme her zaman iki adımdır: düğmeye basınca ekranın ortasında bir onay
 * penceresi açılır. Onay düğmesi listedeki "Sil" düğmesinden bambaşka bir
 * yerde çıkar, böylece yanlışlıkla değen parmak kaydı silemez.
 */
export default function ConfirmDeleteButton({
  onConfirm,
  title,
  description,
  label = "Sil",
  confirmLabel = "Evet, sil",
  className = "text-xs text-gray-400 hover:text-red-600",
  ariaLabel,
}: {
  onConfirm: () => void;
  /** Onay penceresinin başlığı, ör. "Bu soru kaydı silinsin mi?" */
  title: string;
  /** Neyin silineceğini yazan satır, ör. "Matematik · 19.09.2026 · 20 soru" */
  description?: string;
  label?: string;
  confirmLabel?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        aria-label={ariaLabel}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-gray-900">{title}</h2>
            {description && (
              <p className="mt-1 break-words text-sm text-gray-500">{description}</p>
            )}
            <p className="mt-2 text-xs text-gray-400">Bu işlem geri alınamaz.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="btn-secondary flex-1"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => {
                    onConfirm();
                    setOpen(false);
                  })
                }
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isPending ? "Siliniyor..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
