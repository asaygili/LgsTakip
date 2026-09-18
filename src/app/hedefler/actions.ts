"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function createTargetSchool(formData: FormData) {
  const session = await requireSession();

  const name = String(formData.get("name") || "").trim();
  const targetNetRaw = String(formData.get("targetNet") || "");
  const note = String(formData.get("note") || "").trim() || null;

  const targetNet = Number(targetNetRaw);
  if (!name || !targetNetRaw || Number.isNaN(targetNet) || targetNet <= 0) return;

  await prisma.targetSchool.create({
    data: {
      name,
      targetNet,
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

const MAX_LGS_NET = 90;

function parseLine(line: string): { name: string; targetNet: number; note: string | null } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const fields = trimmed.includes("\t")
    ? trimmed.split("\t").map((f) => f.trim())
    : trimmed.split(/ {2,}/).map((f) => f.trim());

  if (fields.length < 2) return null;

  const name = fields[0];
  const targetNet = Number(fields[1].replace(",", "."));
  const note = fields[2]?.trim() || null;

  if (!name || Number.isNaN(targetNet) || targetNet <= 0 || targetNet > MAX_LGS_NET) {
    return null;
  }

  return { name, targetNet, note };
}

export async function bulkCreateTargetSchools(
  _prevState: BulkImportState,
  formData: FormData
): Promise<BulkImportState> {
  const session = await requireSession();

  const text = String(formData.get("bulkText") || "");
  const lines = text.split("\n");

  const valid: { name: string; targetNet: number; note: string | null }[] = [];
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
          ? "Hiçbir satır anlaşılamadı. Format: Okul Adı [TAB] Hedef Net (0-90 arası)"
          : "Metin boş görünüyor.",
    };
  }

  await prisma.targetSchool.createMany({
    data: valid.map((v) => ({
      name: v.name,
      targetNet: v.targetNet,
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
