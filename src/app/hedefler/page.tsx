import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { calculateLgsPuan } from "@/lib/lgs";
import TargetSchoolForm from "./TargetSchoolForm";
import BulkImportForm from "./BulkImportForm";
import TargetSchoolList from "./TargetSchoolList";

export default async function HedeflerPage() {
  await requireSession();

  const [schools, latestExam] = await Promise.all([
    prisma.targetSchool.findMany({
      orderBy: { targetPercentile: "asc" },
    }),
    prisma.mockExam.findFirst({
      orderBy: { date: "desc" },
      include: { results: { include: { subject: true } } },
    }),
  ]);

  const studentPercentile = latestExam?.estimatedPercentile ?? null;
  const studentPuan = latestExam
    ? calculateLgsPuan(
        latestExam.results.map((r) => ({
          subjectName: r.subject.name,
          correct: r.correct,
          wrong: r.wrong,
        }))
      )
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hedef Okullar</h1>
        <p className="text-sm text-gray-500">
          İlgilendiğiniz okulları taban puanı/yüzdelik dilimiyle ekleyin, deneme
          sonuçlarınızla otomatik karşılaştırın.
        </p>
      </div>

      <div className="card bg-brand-50">
        {studentPuan !== null || studentPercentile !== null ? (
          <>
            <p className="text-sm text-gray-700">
              Son deneme ({latestExam?.name}):{" "}
              {studentPuan !== null && (
                <>
                  Tahmini puan:{" "}
                  <span className="font-semibold text-brand-700">{studentPuan.toFixed(2)}</span>
                </>
              )}
              {studentPuan !== null && studentPercentile !== null && " · "}
              {studentPercentile !== null && (
                <>
                  Yüzdelik dilim:{" "}
                  <span className="font-semibold text-brand-700">{studentPercentile}</span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Tahmini puan, deneme sonucunuzdaki doğru/yanlış sayılarından MEB katsayılarıyla
              otomatik hesaplanır (6 dersin tamamı girilmişse). Puanda büyük değer, yüzdelik
              dilimde küçük değer daha iyi sıralama demektir.
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Henüz karşılaştırma yapılamıyor.{" "}
            <a href="/denemeler" className="font-medium text-brand-700 underline">
              Denemeler
            </a>{" "}
            sayfasından bir sonuç girin (tahmini puan için derslerin tamamını doldurun; isterseniz
            ek olarak "tahmini yüzdelik dilim" alanını da girin).
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Not: Tahmini puan, resmi olmayan yaygın bir katsayı formülüyle hesaplanır; MEB'in gerçek
        standart puan dönüşümü yıla göre değişir ve dışarıdan tam olarak bilinemez. Okulların
        taban puanları/yüzdelik dilimleri ve kontenjanları da her yıl değişir. Bu karşılaştırma
        kesin bir yerleşim garantisi vermez; güncel verileri MEB/e-okul gibi resmi kaynaklardan
        teyit etmenizi öneririz.
      </p>

      <TargetSchoolForm />
      <BulkImportForm />

      <TargetSchoolList
        items={schools}
        studentPuan={studentPuan}
        studentPercentile={studentPercentile}
      />
    </div>
  );
}
