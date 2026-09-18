import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
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
      where: { estimatedPercentile: { not: null } },
    }),
  ]);

  const studentPercentile = latestExam?.estimatedPercentile ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hedef Okullar</h1>
        <p className="text-sm text-gray-500">
          İlgilendiğiniz okulları taban yüzdelik dilimleriyle ekleyin, deneme sonuçlarınızdaki
          tahmini yüzdelik dilimle karşılaştırın.
        </p>
      </div>

      <div className="card bg-brand-50">
        {studentPercentile !== null ? (
          <>
            <p className="text-sm text-gray-700">
              Son deneme yüzdelik dilimi:{" "}
              <span className="font-semibold text-brand-700">{studentPercentile}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Karşılaştırmalar bu değere göre yapılır (küçük değer = daha iyi sıralama).
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Henüz tahmini yüzdelik dilim içeren bir deneme sonucu yok. Karşılaştırma
            görebilmek için{" "}
            <a href="/denemeler" className="font-medium text-brand-700 underline">
              Denemeler
            </a>{" "}
            sayfasından bir sonuç girerken "Tahmini yüzdelik dilim" alanını da doldurun.
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Not: Bu karşılaştırma, girdiğiniz hedef yüzdelik dilim ile deneme sonucunuzdaki tahmini
        yüzdelik dilimin basit bir kıyaslamasıdır. Okulların taban puanları/yüzdelik dilimleri ve
        kontenjanları her yıl değişir; kesin bir yerleşim garantisi vermez. Güncel verileri
        MEB/e-okul gibi resmi kaynaklardan teyit etmenizi öneririz.
      </p>

      <TargetSchoolForm />
      <BulkImportForm />

      <TargetSchoolList items={schools} studentPercentile={studentPercentile} />
    </div>
  );
}
