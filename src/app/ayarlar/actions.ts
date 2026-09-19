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

  const read = (name: string) => {
    const raw = String(formData.get(name) || "").trim();
    return raw ? Number(raw) : null;
  };

  const weeklyQuestions = read("weeklyQuestions");
  const weeklyMinutes = read("weeklyMinutes");
  const weeklyExams = read("weeklyExams");

  const invalid = [weeklyQuestions, weeklyMinutes, weeklyExams].some(
    (v) => v !== null && (Number.isNaN(v) || v < 0 || !Number.isInteger(v))
  );
  if (invalid) {
    return { error: "Hedefler 0 veya daha büyük bir tam sayı olmalı." };
  }

  await prisma.goal.upsert({
    where: { id: "default" },
    update: { weeklyQuestions, weeklyMinutes, weeklyExams },
    create: { id: "default", weeklyQuestions, weeklyMinutes, weeklyExams },
  });

  revalidatePath("/ayarlar");
  revalidatePath("/");
  revalidatePath("/analiz");

  return { success: "Haftalık hedefiniz kaydedildi." };
}
