import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import ChangePasswordForm from "./ChangePasswordForm";
import GoalForm from "./GoalForm";

export default async function AyarlarPage() {
  const session = await requireSession();
  const goal = await prisma.goal.findUnique({ where: { id: "default" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-sm text-gray-500">
          {session.user.name} hesabının şifresini ve haftalık hedefinizi buradan
          yönetebilirsiniz.
        </p>
      </div>

      <GoalForm
        weeklyQuestions={goal?.weeklyQuestions ?? null}
        weeklyMinutes={goal?.weeklyMinutes ?? null}
      />

      <ChangePasswordForm />
    </div>
  );
}
