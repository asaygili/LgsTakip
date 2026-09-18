"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function createTargetSchool(formData: FormData) {
  const session = await requireSession();

  const name = String(formData.get("name") || "").trim();
  const location = String(formData.get("location") || "").trim() || null;
  const percentileRaw = String(formData.get("targetPercentile") || "").replace(",", ".");
  const cutoffScoreRaw = String(formData.get("cutoffScore") || "").replace(",", ".");
  const note = String(formData.get("note") || "").trim() || null;

  const targetPercentile = Number(percentileRaw);
  if (!name || !percentileRaw || Number.isNaN(targetPercentile) || targetPercentile <= 0 || targetPercentile > 100) {
    return;
  }
  const cutoffScore =
    cutoffScoreRaw && !Number.isNaN(Number(cutoffScoreRaw)) ? Number(cutoffScoreRaw) : null;

  await prisma.targetSchool.create({
    data: {
      name,
      location,
      targetPercentile,
      cutoffScore,
      note,
      userId: session.user.id,
    },
  });

  revalidatePath("/hedefler");
}

export async function deleteTargetSchool(id: string) {
  await requireSession();
  await prisma.targetSchool.delete({ where: { id } });
  revalidatePath("/hedefler");
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
