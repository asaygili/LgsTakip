// LGS 4 şıklı sorulardan oluştuğu için net hesabında 3 yanlış 1 doğruyu götürür:
// Net = Doğru - (Yanlış / 3)
export function netOf(r: { correct: number; wrong: number }): number {
  return r.correct - r.wrong / 3;
}

// MEB'in güncel LGS katsayı sistemine yakın, yaygın kullanılan tahmini puan formülü.
// Kaynak: özel dershane/yayınların kullandığı katsayılar (ör. inekle.com puan hesaplama).
// Bu resmi, kesin bir formül değildir; yıldan yıla küçük sapmalar olabilir.
const PUAN_COEFFICIENTS: Record<string, number> = {
  "Türkçe": 4.348,
  "T.C. İnkılap Tarihi ve Atatürkçülük": 1.666,
  "Din Kültürü ve Ahlak Bilgisi": 1.899,
  "İngilizce": 1.5075,
  "Matematik": 4.2538,
  "Fen Bilimleri": 4.1230,
};
const PUAN_BASE = 194.752082;

export function calculateLgsPuan(
  results: { subjectName: string; correct: number; wrong: number }[]
): number | null {
  let total = PUAN_BASE;
  let matched = 0;

  for (const r of results) {
    const coef = PUAN_COEFFICIENTS[r.subjectName];
    if (coef === undefined) continue;
    total += netOf(r) * coef;
    matched++;
  }

  // Tahmini puan yalnızca 6 dersin tamamı girildiğinde anlamlıdır.
  return matched === Object.keys(PUAN_COEFFICIENTS).length ? total : null;
}
