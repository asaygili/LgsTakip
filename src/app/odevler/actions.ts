"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { readPhotoFiles } from "@/lib/uploads";
import { resolveSubjectAndTopic } from "@/lib/refs";

export type HomeworkState = { error?: string; success?: string };

type ParsedHomework = {
  title: string;
  description: string | null;
  pages: string | null;
  subjectId: string;
  topicId: string | null;
  assignedDate: Date;
  dueDate: Date | null;
};

function revalidateHomeworkPages() {
  revalidatePath("/odevler");
  revalidatePath("/");
}

/** Form alanlarını okur; eksik/geçersizse hata mesajı döndürür. */
async function parseHomeworkForm(formData: FormData): Promise<ParsedHomework | string> {
  const title = String(formData.get("title") || "").trim();
  const subjectId = String(formData.get("subjectId") || "");
  const topicId = String(formData.get("topicId") || "") || null;
  const description = String(formData.get("description") || "").trim() || null;
  const pages = String(formData.get("pages") || "").trim() || null;
  const assignedDateRaw = String(formData.get("assignedDate") || "");
  const dueDateRaw = String(formData.get("dueDate") || "");

  if (!title) return "Ödev başlığı gerekli.";
  if (!subjectId) return "Ders seçin.";

  // Sayfa uzun süre açık kaldıysa ders/konu silinmiş olabilir.
  const refs = await resolveSubjectAndTopic(subjectId, topicId);
  if (!refs) return "Seçtiğiniz ders veya konu artık yok, sayfayı yenileyin.";

  return {
    title,
    description,
    pages,
    subjectId: refs.subjectId,
    topicId: refs.topicId,
    assignedDate: assignedDateRaw ? new Date(assignedDateRaw) : new Date(),
    dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
  };
}

export async function createHomework(
  _prevState: HomeworkState,
  formData: FormData
): Promise<HomeworkState> {
  const session = await requireSession();

  const parsed = await parseHomeworkForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File);
  const photos = await readPhotoFiles(photoFiles);

  await prisma.homework.create({
    data: {
      ...parsed,
      createdById: session.user.id,
      photos: { create: photos },
    },
  });

  revalidateHomeworkPages();
  return { success: "Ödev eklendi." };
}

/** Fotoğraflar ayrı yönetildiği için burada sadece metin/tarih alanları güncellenir. */
export async function updateHomework(
  _prevState: HomeworkState,
  formData: FormData
): Promise<HomeworkState> {
  await requireSession();

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Güncellenecek ödev bulunamadı." };

  const existing = await prisma.homework.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "Bu ödev silinmiş görünüyor." };

  const parsed = await parseHomeworkForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  await prisma.homework.update({ where: { id }, data: parsed });

  revalidateHomeworkPages();
  return { success: "Ödev güncellendi." };
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
  revalidateHomeworkPages();
}

export async function deleteHomework(id: string) {
  await requireSession();
  await prisma.homework.delete({ where: { id } });
  revalidateHomeworkPages();
}
