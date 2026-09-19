"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { resolveSubjectAndTopic } from "@/lib/refs";

export async function createMistake(formData: FormData) {
  const session = await requireSession();

  const subjectId = String(formData.get("subjectId") || "");
  const topicId = String(formData.get("topicId") || "") || null;
  const reason = String(formData.get("reason") || "");
  const description = String(formData.get("description") || "").trim() || null;

  if (!subjectId || !reason) return;

  const refs = await resolveSubjectAndTopic(subjectId, topicId);
  if (!refs) return;

  await prisma.mistake.create({
    data: {
      subjectId: refs.subjectId,
      topicId: refs.topicId,
      reason: reason as
        | "BILGI_EKSIGI"
        | "DIKKATSIZLIK"
        | "ZAMAN_YETERSIZLIGI"
        | "SORUYU_YANLIS_ANLAMA"
        | "ISLEM_HATASI"
        | "DIGER",
      description,
      userId: session.user.id,
    },
  });

  revalidatePath("/hatalar");
  revalidatePath("/");
}

export async function toggleMistakeResolved(id: string, resolved: boolean) {
  await requireSession();
  await prisma.mistake.update({ where: { id }, data: { resolved } });
  revalidatePath("/hatalar");
  revalidatePath("/");
}

export async function deleteMistake(id: string) {
  await requireSession();
  await prisma.mistake.delete({ where: { id } });
  revalidatePath("/hatalar");
  revalidatePath("/");
}
