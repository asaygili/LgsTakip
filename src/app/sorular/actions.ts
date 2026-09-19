"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { resolveSubjectAndTopic } from "@/lib/refs";

export type DailyLogState = { error?: string; success?: string };

type ParsedLog = {
  subjectId: string;
  topicId: string | null;
  date: Date;
  questionsCorrect: number;
  questionsWrong: number;
  questionsBlank: number;
  durationMinutes: number | null;
  notes: string | null;
};

function revalidateLogPages() {
  revalidatePath("/sorular");
  revalidatePath("/");
  revalidatePath("/analiz");
}

/** Form alanlarını okur; eksik/geçersizse hata mesajı döndürür. */
async function parseLogForm(formData: FormData): Promise<ParsedLog | string> {
  const subjectId = String(formData.get("subjectId") || "");
  const topicId = String(formData.get("topicId") || "") || null;
  const dateRaw = String(formData.get("date") || "");
  const correct = Number(formData.get("correct") || 0);
  const wrong = Number(formData.get("wrong") || 0);
  const blank = Number(formData.get("blank") || 0);
  const durationRaw = String(formData.get("duration") || "");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!subjectId) return "Ders seçin.";
  if (!dateRaw) return "Tarih gerekli.";
  if (correct + wrong + blank <= 0) {
    return "Doğru, yanlış veya boş sayılarından en az biri 0'dan büyük olmalı.";
  }

  // Sayfa uzun süre açık kaldıysa ders/konu silinmiş olabilir.
  const refs = await resolveSubjectAndTopic(subjectId, topicId);
  if (!refs) return "Seçtiğiniz ders veya konu artık yok, sayfayı yenileyin.";

  return {
    subjectId: refs.subjectId,
    topicId: refs.topicId,
    date: new Date(dateRaw),
    questionsCorrect: Math.max(0, correct),
    questionsWrong: Math.max(0, wrong),
    questionsBlank: Math.max(0, blank),
    durationMinutes: durationRaw ? Math.max(0, Number(durationRaw)) : null,
    notes,
  };
}

export async function createDailyLog(
  _prevState: DailyLogState,
  formData: FormData
): Promise<DailyLogState> {
  const session = await requireSession();

  const parsed = await parseLogForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  await prisma.dailyLog.create({ data: { ...parsed, userId: session.user.id } });

  revalidateLogPages();
  return { success: "Kayıt eklendi." };
}

export async function updateDailyLog(
  _prevState: DailyLogState,
  formData: FormData
): Promise<DailyLogState> {
  await requireSession();

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Güncellenecek kayıt bulunamadı." };

  const existing = await prisma.dailyLog.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "Bu kayıt silinmiş görünüyor." };

  const parsed = await parseLogForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  await prisma.dailyLog.update({ where: { id }, data: parsed });

  revalidateLogPages();
  return { success: "Kayıt güncellendi." };
}

export async function deleteDailyLog(id: string) {
  await requireSession();
  await prisma.dailyLog.delete({ where: { id } });
  revalidateLogPages();
}
