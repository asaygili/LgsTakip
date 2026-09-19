"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type MockExamState = { error?: string; success?: string };

type ParsedExam = {
  name: string;
  date: Date;
  type: "GENEL" | "BRANS";
  estimatedPercentile: number | null;
  results: { subjectId: string; correct: number; wrong: number; blank: number }[];
};

function revalidateExamPages() {
  revalidatePath("/denemeler");
  revalidatePath("/hedefler");
  revalidatePath("/");
  revalidatePath("/analiz");
}

/** Form alanlarını okur; eksik/geçersizse hata mesajı döndürür. */
async function parseExamForm(formData: FormData): Promise<ParsedExam | string> {
  const name = String(formData.get("name") || "").trim();
  const dateRaw = String(formData.get("date") || "");
  const type = String(formData.get("type") || "GENEL");
  const subjectIds = formData.getAll("subjectIds") as string[];
  const percentileRaw = String(formData.get("estimatedPercentile") || "").replace(",", ".");
  const estimatedPercentile =
    percentileRaw && !Number.isNaN(Number(percentileRaw)) ? Number(percentileRaw) : null;

  if (!name) return "Deneme adı gerekli.";
  if (!dateRaw) return "Tarih gerekli.";
  if (subjectIds.length === 0) return "En az bir ders gerekli.";

  // Eski bir sayfadan gelmiş, artık var olmayan ders kimliklerini ele
  const knownSubjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    select: { id: true },
  });
  const knownIds = new Set(knownSubjects.map((s) => s.id));

  const results = subjectIds
    .filter((subjectId) => knownIds.has(subjectId))
    .map((subjectId) => ({
      subjectId,
      correct: Math.max(0, Number(formData.get(`correct_${subjectId}`) || 0)),
      wrong: Math.max(0, Number(formData.get(`wrong_${subjectId}`) || 0)),
      blank: Math.max(0, Number(formData.get(`blank_${subjectId}`) || 0)),
    }))
    .filter((r) => r.correct || r.wrong || r.blank);

  if (results.length === 0) {
    return "En az bir derse doğru/yanlış/boş sayısı girin.";
  }

  return {
    name,
    date: new Date(dateRaw),
    type: type === "BRANS" ? "BRANS" : "GENEL",
    estimatedPercentile,
    results,
  };
}

export async function createMockExam(
  _prevState: MockExamState,
  formData: FormData
): Promise<MockExamState> {
  const session = await requireSession();

  const parsed = await parseExamForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  await prisma.mockExam.create({
    data: {
      name: parsed.name,
      date: parsed.date,
      type: parsed.type,
      estimatedPercentile: parsed.estimatedPercentile,
      userId: session.user.id,
      results: { create: parsed.results },
    },
  });

  revalidateExamPages();
  return { success: "Deneme sonucu kaydedildi." };
}

export async function updateMockExam(
  _prevState: MockExamState,
  formData: FormData
): Promise<MockExamState> {
  await requireSession();

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Güncellenecek deneme bulunamadı." };

  const existing = await prisma.mockExam.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "Bu deneme silinmiş görünüyor." };

  const parsed = await parseExamForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  // Ders sonuçları tamamen yenilenir: kaldırılan ders kaydı da silinsin.
  await prisma.$transaction([
    prisma.mockExamResult.deleteMany({ where: { mockExamId: id } }),
    prisma.mockExam.update({
      where: { id },
      data: {
        name: parsed.name,
        date: parsed.date,
        type: parsed.type,
        estimatedPercentile: parsed.estimatedPercentile,
        results: { create: parsed.results },
      },
    }),
  ]);

  revalidateExamPages();
  return { success: "Deneme güncellendi." };
}

export async function deleteMockExam(id: string) {
  await requireSession();
  await prisma.mockExam.delete({ where: { id } });
  revalidateExamPages();
}
