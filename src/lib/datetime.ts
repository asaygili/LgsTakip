import { APP_TIME_ZONE } from "./week";

/**
 * "19.09.2026 14:32" — saat dilimi açıkça verilir. Sunucu UTC çalıştığı için
 * bunu tarayıcıya bırakırsak sunucu ve istemci farklı metin üretir ve React
 * hydration uyarısı verir.
 */
export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  });
}
