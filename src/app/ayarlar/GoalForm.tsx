"use client";

import { useActionState } from "react";
import { updateGoal, type GoalState } from "./actions";

const initialState: GoalState = {};

export default function GoalForm({
  weeklyQuestions,
  weeklyMinutes,
}: {
  weeklyQuestions: number | null;
  weeklyMinutes: number | null;
}) {
  const [state, formAction, isPending] = useActionState(updateGoal, initialState);

  return (
    <form action={formAction} className="card max-w-sm space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Haftalık Hedef</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Panelde bu hedefe göre ilerleme çubuğu gösterilir. Boş bırakırsanız gösterilmez.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="weeklyQuestions">
          Haftalık soru hedefi
        </label>
        <input
          id="weeklyQuestions"
          type="number"
          name="weeklyQuestions"
          className="input"
          min={0}
          placeholder="Örn: 500"
          defaultValue={weeklyQuestions ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor="weeklyMinutes">
          Haftalık çalışma süresi hedefi (dakika)
        </label>
        <input
          id="weeklyMinutes"
          type="number"
          name="weeklyMinutes"
          className="input"
          min={0}
          placeholder="Örn: 600"
          defaultValue={weeklyMinutes ?? ""}
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? "Kaydediliyor..." : "Hedefi Kaydet"}
      </button>
    </form>
  );
}
