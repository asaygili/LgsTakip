"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function createHomework(formData: FormData) {
  const session = await requireSession();

  const title = String(formData.get("title") || "").trim();
  const subjectId = String(formData.get("subjectId") || "");
  const topicId = String(formData.get("topicId") || "") || null;
  const description = String(formData.get("description") || "").trim() || null;
  const dueDateRaw = String(formData.get("dueDate") || "");

  if (!title || !subjectId) return;

  await prisma.homework.create({
    data: {
      title,
      description,
      subjectId,
      topicId,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      createdById: session.user.id,
    },
  });

  revalidatePath("/odevler");
  revalidatePath("/");
}

export async function updateHomeworkStatus(id: string, status: string) {
  await requireSession();
  await prisma.homework.update({
    where: { id },
    data: { status: status as "BEKLIYOR" | "DEVAM_EDIYOR" | "TAMAMLANDI" },
  });
  revalidatePath("/odevler");
  revalidatePath("/");
}

export async function deleteHomework(id: string) {
  await requireSession();
  await prisma.homework.delete({ where: { id } });
  revalidatePath("/odevler");
  revalidatePath("/");
}
