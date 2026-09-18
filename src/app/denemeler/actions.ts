"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function createMockExam(formData: FormData) {
  const session = await requireSession();

  const name = String(formData.get("name") || "").trim();
  const dateRaw = String(formData.get("date") || "");
  const type = String(formData.get("type") || "GENEL");
  const subjectIds = formData.getAll("subjectIds") as string[];

  if (!name || !dateRaw || subjectIds.length === 0) return;

  const results = subjectIds
    .map((subjectId) => ({
      subjectId,
      correct: Number(formData.get(`correct_${subjectId}`) || 0),
      wrong: Number(formData.get(`wrong_${subjectId}`) || 0),
      blank: Number(formData.get(`blank_${subjectId}`) || 0),
    }))
    .filter((r) => r.correct || r.wrong || r.blank);

  if (results.length === 0) return;

  await prisma.mockExam.create({
    data: {
      name,
      date: new Date(dateRaw),
      type: type as "GENEL" | "BRANS",
      userId: session.user.id,
      results: {
        create: results.map((r) => ({
          subjectId: r.subjectId,
          correct: Math.max(0, r.correct),
          wrong: Math.max(0, r.wrong),
          blank: Math.max(0, r.blank),
        })),
      },
    },
  });

  revalidatePath("/denemeler");
  revalidatePath("/");
}

export async function deleteMockExam(id: string) {
  await requireSession();
  await prisma.mockExam.delete({ where: { id } });
  revalidatePath("/denemeler");
  revalidatePath("/");
}
