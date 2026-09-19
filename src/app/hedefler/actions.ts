"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { SCHOOL_TYPE_LABELS } from "@/lib/labels";

export type TargetSchoolState = { error?: string; success?: string };

type ParsedSchoolForm = {
  name: string;
  location: string | null;
  schoolType: string | null;
  quota: number | null;
  targetPercentile: number;
  cutoffScore: number | null;
  note: string | null;
};

/** Form alanlarını okur; eksik/geçersizse hata mesajı döndürür. */
function parseSchoolForm(formData: FormData): ParsedSchoolForm | string {
  const name = String(formData.get("name") || "").trim();
  const location = String(formData.get("location") || "").trim() || null;
  const typeRaw = String(formData.get("schoolType") || "");
  const quotaRaw = String(formData.get("quota") || "").trim();
  const percentileRaw = String(formData.get("targetPercentile") || "").replace(",", ".");
  const cutoffScoreRaw = String(formData.get("cutoffScore") || "").replace(",", ".");
  const note = String(formData.get("note") || "").trim() || null;

  if (!name) return "Okul adı gerekli.";

  const targetPercentile = Number(percentileRaw);
  if (
    !percentileRaw ||
    Number.isNaN(targetPercentile) ||
    targetPercentile <= 0 ||
    targetPercentile > 100
  ) {
    return "Hedef yüzdelik dilim 0 ile 100 arasında bir sayı olmalı.";
  }

  let quota: number | null = null;
  if (quotaRaw) {
    const n = Number(quotaRaw);
    if (Number.isNaN(n) || n < 0 || !Number.isInteger(n)) {
      return "Kontenjan 0 veya daha büyük bir tam sayı olmalı.";
    }
    quota = n;
  }

  const cutoffScore =
    cutoffScoreRaw && !Number.isNaN(Number(cutoffScoreRaw)) ? Number(cutoffScoreRaw) : null;

  return {
    name,
    location,
    schoolType: typeRaw in SCHOOL_TYPE_LABELS ? typeRaw : null,
    quota,
    targetPercentile,
    cutoffScore,
    note,
  };
}

export async function createTargetSchool(
  _prevState: TargetSchoolState,
  formData: FormData
): Promise<TargetSchoolState> {
  const session = await requireSession();

  const parsed = parseSchoolForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  await prisma.targetSchool.create({ data: { ...parsed, userId: session.user.id } });

  revalidatePath("/hedefler");
  revalidatePath("/analiz");
  return { success: "Okul eklendi." };
}

export async function updateTargetSchool(
  _prevState: TargetSchoolState,
  formData: FormData
): Promise<TargetSchoolState> {
  await requireSession();

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Güncellenecek okul bulunamadı." };

  const existing = await prisma.targetSchool.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "Bu okul silinmiş görünüyor." };

  const parsed = parseSchoolForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  await prisma.targetSchool.update({ where: { id }, data: parsed });

  revalidatePath("/hedefler");
  revalidatePath("/analiz");
  return { success: "Okul güncellendi." };
}

export async function deleteTargetSchool(id: string) {
  await requireSession();
  await prisma.targetSchool.delete({ where: { id } });
  revalidatePath("/hedefler");
  revalidatePath("/analiz");
}

export type BulkImportState = {
  added?: number;
  skipped?: number;
  skippedLines?: string[];
  error?: string;
};

type ParsedSchool = {
  name: string;
  location: string | null;
  quota: number | null;
  cutoffScore: number | null;
  targetPercentile: number;
  note: string | null;
};

function toNumber(raw: string): number | null {
  const n = Number(raw.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function parseLine(line: string): ParsedSchool | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const fields = (trimmed.includes("\t") ? trimmed.split("\t") : trimmed.split(/ {2,}/)).map((f) =>
    f.trim()
  );

  // Resmi tablo formatı: Sıra, İl/İlçe, Okul Adı, Kont., Taban Puanı, Yüzdelik Dilim
  if (fields.length >= 6) {
    const location = fields[1] || null;
    const name = fields[2];
    const quota = toNumber(fields[3]);
    const cutoffScore = toNumber(fields[4]);
    const targetPercentile = toNumber(fields[5]);
    if (
      name &&
      /[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(name) &&
      targetPercentile !== null &&
      targetPercentile > 0 &&
      targetPercentile <= 100
    ) {
      return {
        name,
        location,
        quota: quota !== null ? Math.round(quota) : null,
        cutoffScore,
        targetPercentile,
        note: null,
      };
    }
  }

  // Basit format: Okul Adı, Hedef Yüzdelik Dilim, Not (opsiyonel)
  if (fields.length >= 2) {
    const name = fields[0];
    const targetPercentile = toNumber(fields[1]);
    const note = fields[2]?.trim() || null;
    if (name && targetPercentile !== null && targetPercentile > 0 && targetPercentile <= 100) {
      return { name, location: null, quota: null, cutoffScore: null, targetPercentile, note };
    }
  }

  return null;
}

export async function bulkCreateTargetSchools(
  _prevState: BulkImportState,
  formData: FormData
): Promise<BulkImportState> {
  const session = await requireSession();

  const text = String(formData.get("bulkText") || "");
  // Resmi tablolarda devlet/özel sütunu yok; listenin tamamı için tek seçim.
  const typeRaw = String(formData.get("schoolType") || "");
  const schoolType = typeRaw in SCHOOL_TYPE_LABELS ? typeRaw : null;
  const lines = text.split("\n");

  const valid: ParsedSchool[] = [];
  const skippedLines: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parsed = parseLine(line);
    if (parsed) {
      valid.push(parsed);
    } else {
      skippedLines.push(line.trim());
    }
  }

  if (valid.length === 0) {
    return {
      added: 0,
      skipped: skippedLines.length,
      skippedLines: skippedLines.slice(0, 5),
      error:
        skippedLines.length > 0
          ? "Hiçbir satır anlaşılamadı. Resmi tablo formatını (Sıra, İl/İlçe, Okul Adı, Kont., Taban Puanı, Yüzdelik Dilim) veya basit format (Okul Adı [TAB] Yüzdelik Dilim) kullanın."
          : "Metin boş görünüyor.",
    };
  }

  await prisma.targetSchool.createMany({
    data: valid.map((v) => ({
      name: v.name,
      location: v.location,
      schoolType,
      quota: v.quota,
      cutoffScore: v.cutoffScore,
      targetPercentile: v.targetPercentile,
      note: v.note,
      userId: session.user.id,
    })),
  });

  revalidatePath("/hedefler");

  return {
    added: valid.length,
    skipped: skippedLines.length,
    skippedLines: skippedLines.slice(0, 5),
  };
}
