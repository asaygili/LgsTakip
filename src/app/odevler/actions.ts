"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { readPhotoFiles } from "@/lib/uploads";
import { resolveSubjectAndTopic } from "@/lib/refs";

export async function createHomework(formData: FormData) {
  const session = await requireSession();

  const title = String(formData.get("title") || "").trim();
  const subjectId = String(formData.get("subjectId") || "");
  const topicId = String(formData.get("topicId") || "") || null;
  const description = String(formData.get("description") || "").trim() || null;
  const pages = String(formData.get("pages") || "").trim() || null;
  const assignedDateRaw = String(formData.get("assignedDate") || "");
  const dueDateRaw = String(formData.get("dueDate") || "");
  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File);

  if (!title || !subjectId) return;

  const refs = await resolveSubjectAndTopic(subjectId, topicId);
  if (!refs) return;

  const photos = await readPhotoFiles(photoFiles);

  await prisma.homework.create({
    data: {
      title,
      description,
      pages,
      subjectId: refs.subjectId,
      topicId: refs.topicId,
      assignedDate: assignedDateRaw ? new Date(assignedDateRaw) : new Date(),
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      createdById: session.user.id,
      photos: {
        create: photos,
      },
    },
  });

  revalidatePath("/odevler");
  revalidatePath("/");
}

export async function addHomeworkPhotos(id: string, formData: FormData) {
  await requireSession();

  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File);
  const photos = await readPhotoFiles(photoFiles);
  if (photos.length === 0) return;

  await prisma.homework.update({
    where: { id },
    data: {
      photos: {
        create: photos,
      },
    },
  });

  revalidatePath("/odevler");
}

export async function deleteHomeworkPhoto(photoId: string) {
  await requireSession();
  await prisma.homeworkPhoto.delete({ where: { id: photoId } });
  revalidatePath("/odevler");
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
