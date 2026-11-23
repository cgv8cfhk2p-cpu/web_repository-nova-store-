"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction, type LoginState } from "../_actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="label">Email</span>
        <input key={state.email} name="email" type="email" autoComplete="username" defaultValue={state.email} required className="input" />
      </label>
      <label className="block">
        <span className="label">Contraseña</span>
        <input name="password" type="password" autoComplete="current-password" required className="input" />
      </label>
      {state.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
      </button>
    </form>
  );
}
