// Hafta sınırları. Uygulama Türkiye'deki bir aile için; sunucu (Railway) UTC
// çalıştığı için haftanın pazartesi 00:00'da başlayıp pazar 23:59'da bitmesini
// sunucu saatine bırakamayız. Bu yüzden "bugün"ü İstanbul saatine göre bulup,
// sınırları o günün UTC gece yarısı olarak kuruyoruz — kayıtların tarihi de
// (<input type="date"> -> new Date("2026-09-19")) UTC gece yarısı olarak
// saklandığı için ikisi birebir örtüşüyor.
export const APP_TIME_ZONE = "Europe/Istanbul";

function localYmd(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** İstanbul'da içinde bulunduğumuz günün UTC gece yarısı karşılığı. */
export function startOfToday(now: Date = new Date()) {
  const { year, month, day } = localYmd(now);
  return new Date(Date.UTC(year, month - 1, day));
}

/** İçinde bulunduğumuz haftanın pazartesi 00:00'ı. */
export function startOfWeek(now: Date = new Date()) {
  const d = startOfToday(now);
  const mondayBased = (d.getUTCDay() + 6) % 7; // pazartesi = 0
  d.setUTCDate(d.getUTCDate() - mondayBased);
  return d;
}

/**
 * Haftanın üst sınırı: bir sonraki pazartesi 00:00 (bu değer dahil değildir).
 * Pazar 23:59'dan sonra hafta otomatik olarak başa döner.
 */
export function endOfWeek(now: Date = new Date()) {
  return addWeeks(startOfWeek(now), 1);
}

export function addWeeks(date: Date, count: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + count * 7);
  return d;
}

export function addDays(date: Date, count: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + count);
  return d;
}

/** "22 Eyl" gibi kısa etiket. */
export function shortDate(d: Date) {
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Pazartesi–pazar aralığını "22–28 Eyl" biçiminde yazar. */
export function weekRangeLabel(weekStart: Date) {
  const end = addDays(weekStart, 6);
  return `${shortDate(weekStart)} – ${shortDate(end)}`;
}
