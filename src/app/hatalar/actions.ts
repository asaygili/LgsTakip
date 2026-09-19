"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { resolveSubjectAndTopic } from "@/lib/refs";
import { MISTAKE_REASON_LABELS } from "@/lib/labels";
import { readUploadFiles, MAX_FILES_PER_RECORD } from "@/lib/uploads";

export type MistakeState = { error?: string; success?: string };

type ParsedMistake = {
  subjectId: string;
  topicId: string | null;
  reason: string;
  description: string | null;
};

function revalidateMistakePages() {
  revalidatePath("/hatalar");
  revalidatePath("/");
  revalidatePath("/analiz");
}

/** Form alanlarını okur; eksik/geçersizse hata mesajı döndürür. */
async function parseMistakeForm(formData: FormData): Promise<ParsedMistake | string> {
  const subjectId = String(formData.get("subjectId") || "");
  const topicId = String(formData.get("topicId") || "") || null;
  const reason = String(formData.get("reason") || "");
  const description = String(formData.get("description") || "").trim() || null;

  if (!subjectId) return "Ders seçin.";
  if (!reason || !(reason in MISTAKE_REASON_LABELS)) return "Hata nedeni seçin.";

  // Sayfa uzun süre açık kaldıysa ders/konu silinmiş olabilir.
  const refs = await resolveSubjectAndTopic(subjectId, topicId);
  if (!refs) return "Seçtiğiniz ders veya konu artık yok, sayfayı yenileyin.";

  return {
    subjectId: refs.subjectId,
    topicId: refs.topicId,
    reason,
    description,
  };
}

export async function createMistake(
  _prevState: MistakeState,
  formData: FormData
): Promise<MistakeState> {
  const session = await requireSession();

  const parsed = await parseMistakeForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  const uploaded = formData.getAll("files").filter((f): f is File => f instanceof File);
  const files = await readUploadFiles(uploaded, { allowPdf: true });

  await prisma.mistake.create({
    data: { ...parsed, userId: session.user.id, files: { create: files } },
  });

  revalidateMistakePages();
  return { success: "Hata kaydı eklendi." };
}

/** Karttan dosya ekleme. Düzenleme formu yalnızca metin alanlarını kapsar. */
export async function addMistakeFiles(id: string, formData: FormData) {
  await requireSession();

  const existing = await prisma.mistake.findUnique({
    where: { id },
    select: { _count: { select: { files: true } } },
  });
  if (!existing) return;

  const room = MAX_FILES_PER_RECORD - existing._count.files;
  if (room <= 0) return;

  const uploaded = formData.getAll("files").filter((f): f is File => f instanceof File);
  const files = (await readUploadFiles(uploaded, { allowPdf: true })).slice(0, room);
  if (files.length === 0) return;

  await prisma.mistake.update({ where: { id }, data: { files: { create: files } } });

  revalidateMistakePages();
}

export async function deleteMistakeFile(fileId: string) {
  await requireSession();
  await prisma.mistakeFile.delete({ where: { id: fileId } });
  revalidateMistakePages();
}

export async function updateMistake(
  _prevState: MistakeState,
  formData: FormData
): Promise<MistakeState> {
  await requireSession();

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Güncellenecek hata kaydı bulunamadı." };

  const existing = await prisma.mistake.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "Bu kayıt silinmiş görünüyor." };

  const parsed = await parseMistakeForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  await prisma.mistake.update({ where: { id }, data: parsed });

  revalidateMistakePages();
  return { success: "Hata kaydı güncellendi." };
}

export async function toggleMistakeResolved(id: string, resolved: boolean) {
  await requireSession();
  await prisma.mistake.update({ where: { id }, data: { resolved } });
  revalidateMistakePages();
}

export async function deleteMistake(id: string) {
  await requireSession();
  await prisma.mistake.delete({ where: { id } });
  revalidateMistakePages();
}
