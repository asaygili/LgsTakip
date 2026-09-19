// Grafik renkleri ve ortak stiller.
// Palet, uygulamanın gerçek yüzey rengine (beyaz kart) karşı doğrulandı:
// lightness bandı, chroma tabanı, renk körlüğü ayrımı ve normal görüş tabanı
// kontrollerinin tamamı geçti. Sıralama rastgele değildir; komşu seriler
// arasındaki ayrımı garanti eder, bu yüzden slotlar sırayla kullanılmalıdır.
export const SERIES = [
  "#2a78d6", // 1 mavi
  "#eb6834", // 2 turuncu
  "#1baf7a", // 3 turkuaz
  "#eda100", // 4 sarı
  "#e87ba4", // 5 magenta
  "#008300", // 6 yeşil
] as const;

// Konu öğrenme durumu renkleri. Sıra bilinçlidir: yan yana gelen renkler
// (yeşil-mavi, mavi-sarı, sarı-gri) renk körlüğü testinde en iyi ayrımı verir.
// "Başlanmadı" kasten nötr gridir — bir seri değil, "henüz yok" demektir.
export const TOPIC_STATUS_ORDER = [
  "OGRENILDI",
  "OGRENILIYOR",
  "TEKRAR_GEREKLI",
  "BASLANMADI",
] as const;

export const TOPIC_STATUS_FILL: Record<string, string> = {
  OGRENILDI: "#1baf7a",
  OGRENILIYOR: "#2a78d6",
  TEKRAR_GEREKLI: "#eda100",
  BASLANMADI: "#8a887f",
};

export const CHART_INK = {
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  muted: "#898781",
  reference: "#52514e",
};

export const axisProps = {
  tick: { fontSize: 11, fill: CHART_INK.muted },
  stroke: CHART_INK.axis,
  tickLine: false,
} as const;

export const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: `1px solid ${CHART_INK.grid}`,
    fontSize: 12,
    boxShadow: "0 4px 12px rgba(11,11,11,0.08)",
  },
  labelStyle: { fontWeight: 600, marginBottom: 4 },
} as const;
