"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function createDailyLog(formData: FormData) {
  const session = await requireSession();

  const subjectId = String(formData.get("subjectId") || "");
  const topicId = String(formData.get("topicId") || "") || null;
  const dateRaw = String(formData.get("date") || "");
  const correct = Number(formData.get("correct") || 0);
  const wrong = Number(formData.get("wrong") || 0);
  const blank = Number(formData.get("blank") || 0);
  const durationRaw = String(formData.get("duration") || "");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!subjectId || !dateRaw) return;

  await prisma.dailyLog.create({
    data: {
      subjectId,
      topicId,
      date: new Date(dateRaw),
      questionsCorrect: Math.max(0, correct),
      questionsWrong: Math.max(0, wrong),
      questionsBlank: Math.max(0, blank),
      durationMinutes: durationRaw ? Number(durationRaw) : null,
      notes,
      userId: session.user.id,
    },
  });

  revalidatePath("/sorular");
  revalidatePath("/");
}

export async function deleteDailyLog(id: string) {
  await requireSession();
  await prisma.dailyLog.delete({ where: { id } });
  revalidatePath("/sorular");
  revalidatePath("/");
}
