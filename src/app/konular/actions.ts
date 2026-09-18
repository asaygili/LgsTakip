"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function updateTopicStatus(id: string, status: string) {
  await requireSession();
  await prisma.topic.update({
    where: { id },
    data: { status: status as "BASLANMADI" | "OGRENILIYOR" | "TEKRAR_GEREKLI" | "OGRENILDI" },
  });
  revalidatePath("/konular");
  revalidatePath("/");
}
