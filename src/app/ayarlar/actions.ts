"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type ChangePasswordState = {
  error?: string;
  success?: string;
};

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await requireSession();

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Tüm alanları doldurun." };
  }
  if (newPassword.length < 6) {
    return { error: "Yeni şifre en az 6 karakter olmalı." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Yeni şifreler birbiriyle eşleşmiyor." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: "Kullanıcı bulunamadı." };
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Mevcut şifre yanlış." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: "Şifreniz güncellendi." };
}

export type GoalState = { error?: string; success?: string };

export async function updateGoal(
  _prevState: GoalState,
  formData: FormData
): Promise<GoalState> {
  await requireSession();

  const questionsRaw = String(formData.get("weeklyQuestions") || "").trim();
  const minutesRaw = String(formData.get("weeklyMinutes") || "").trim();

  const weeklyQuestions = questionsRaw ? Number(questionsRaw) : null;
  const weeklyMinutes = minutesRaw ? Number(minutesRaw) : null;

  if (
    (weeklyQuestions !== null && (Number.isNaN(weeklyQuestions) || weeklyQuestions < 0)) ||
    (weeklyMinutes !== null && (Number.isNaN(weeklyMinutes) || weeklyMinutes < 0))
  ) {
    return { error: "Hedefler 0 veya daha büyük bir sayı olmalı." };
  }

  await prisma.goal.upsert({
    where: { id: "default" },
    update: { weeklyQuestions, weeklyMinutes },
    create: { id: "default", weeklyQuestions, weeklyMinutes },
  });

  revalidatePath("/ayarlar");
  revalidatePath("/");

  return { success: "Haftalık hedefiniz kaydedildi." };
}
