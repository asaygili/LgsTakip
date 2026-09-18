"use client";

import { useActionState, useRef, useEffect } from "react";
import { changePassword, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = {};

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="card max-w-sm space-y-4">
      <div>
        <label className="label" htmlFor="currentPassword">
          Mevcut şifre
        </label>
        <input
          id="currentPassword"
          type="password"
          name="currentPassword"
          className="input"
          autoComplete="current-password"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="newPassword">
          Yeni şifre
        </label>
        <input
          id="newPassword"
          type="password"
          name="newPassword"
          className="input"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">
          Yeni şifre (tekrar)
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          className="input"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? "Güncelleniyor..." : "Şifreyi Güncelle"}
      </button>
    </form>
  );
}
