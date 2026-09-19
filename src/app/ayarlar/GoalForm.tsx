"use client";

import { useActionState } from "react";
import { updateGoal, type GoalState } from "./actions";

const initialState: GoalState = {};

const FIELDS = [
  {
    name: "weeklyQuestions",
    label: "Haftalık soru hedefi",
    placeholder: "Örn: 500",
  },
  {
    name: "weeklyMinutes",
    label: "Haftalık çalışma süresi hedefi (dakika)",
    placeholder: "Örn: 600",
  },
  {
    name: "weeklyExams",
    label: "Haftalık deneme hedefi (adet)",
    placeholder: "Örn: 2",
  },
] as const;

export default function GoalForm({
  weeklyQuestions,
  weeklyMinutes,
  weeklyExams,
}: {
  weeklyQuestions: number | null;
  weeklyMinutes: number | null;
  weeklyExams: number | null;
}) {
  const [state, formAction, isPending] = useActionState(updateGoal, initialState);
  const defaults: Record<string, number | null> = {
    weeklyQuestions,
    weeklyMinutes,
    weeklyExams,
  };

  return (
    <form action={formAction} className="card max-w-sm space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Haftalık Hedef</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Hafta pazartesi başlar, pazar 23:59&apos;da biter ve sayaçlar sıfırlanır.
          Boş bıraktığınız hedef hiç gösterilmez.
        </p>
      </div>
      {FIELDS.map((f) => (
        <div key={f.name}>
          <label className="label" htmlFor={f.name}>
            {f.label}
          </label>
          <input
            id={f.name}
            type="number"
            name={f.name}
            className="input"
            min={0}
            step={1}
            placeholder={f.placeholder}
            defaultValue={defaults[f.name] ?? ""}
          />
        </div>
      ))}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? "Kaydediliyor..." : "Hedefi Kaydet"}
      </button>
    </form>
  );
}
