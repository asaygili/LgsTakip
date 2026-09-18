import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import TargetSchoolForm from "./TargetSchoolForm";
import BulkImportForm from "./BulkImportForm";
import TargetSchoolList from "./TargetSchoolList";

function netOf(r: { correct: number; wrong: number }) {
  return r.correct - r.wrong * 0.25;
}

export default async function HedeflerPage() {
  await requireSession();

  const [schools, recentExams] = await Promise.all([
    prisma.targetSchool.findMany({
      orderBy: { targetNet: "desc" },
    }),
    prisma.mockExam.findMany({
      orderBy: { date: "desc" },
      take: 3,
      include: { results: true },
    }),
  ]);

  const examNets = recentExams.map((exam) =>
    exam.results.reduce((sum, r) => sum + netOf(r), 0)
  );
  const latestNet = examNets.length > 0 ? examNets[0] : null;
  const avgNet =
    examNets.length > 0 ? examNets.reduce((s, n) => s + n, 0) / examNets.length : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hedef Okullar</h1>
        <p className="text-sm text-gray-500">
          İlgilendiğiniz okulları hedef net değerleriyle ekleyin, deneme sonuçlarınızla
          karşılaştırın.
        </p>
      </div>

      <div className="card bg-brand-50">
        {latestNet !== null ? (
          <>
            <p className="text-sm text-gray-700">
              Son deneme neti: <span className="font-semibold text-brand-700">{latestNet.toFixed(1)}</span>
              {avgNet !== null && examNets.length > 1 && (
                <>
                  {" "}
                  · Son {examNets.length} deneme ortalaması:{" "}
                  <span className="font-semibold text-brand-700">{avgNet.toFixed(1)}</span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Karşılaştırmalar son deneme netine göre yapılır.
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Henüz deneme sonucu eklenmedi. Karşılaştırma görebilmek için önce{" "}
            <a href="/denemeler" className="font-medium text-brand-700 underline">
              Denemeler
            </a>{" "}
            sayfasından bir sonuç girin.
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Not: Bu karşılaştırma yalnızca girdiğiniz hedef net değerine göre basit bir kıyaslamadır.
        Gerçek LGS puanı ve okulların taban puanları/kontenjanları her yıl değişir; kesin bir
        yerleşim garantisi vermez. Güncel taban puanlarını MEB/e-okul gibi resmi kaynaklardan
        teyit etmenizi öneririz.
      </p>

      <TargetSchoolForm />
      <BulkImportForm />

      <TargetSchoolList items={schools} currentNet={latestNet} />
    </div>
  );
}
