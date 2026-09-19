import { formatDateTime } from "@/lib/datetime";

/** Kaydın ne zaman girildiği. Kayıt tarihinden (ör. ödevin verildiği gün) ayrıdır. */
export default function CreatedAt({ value }: { value: string }) {
  return (
    <p className="mt-0.5 text-xs text-gray-400">Eklendi: {formatDateTime(value)}</p>
  );
}
