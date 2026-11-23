"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export type ActionState = { ok?: string; error?: string; fields?: Record<string, string>; ts?: number };
type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

const PendingContext = createContext(false);

/**
 * Formulario del panel que llama a una server action y muestra el resultado.
 * Se envía con onSubmit (y no con la prop `action`) para que, si hay un error de validación,
 * NO se borre lo que el administrador ha escrito.
 */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  confirm,
  onSuccess,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.ok) return;
    if (resetOnSuccess) ref.current?.reset();
    onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        if (confirm && !window.confirm(confirm)) return;
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
        const fd = new FormData(e.currentTarget, submitter);
        startTransition(() => formAction(fd));
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
      {state.error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{state.error}</p>}
      {state.ok && !pending && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.ok}</p>}
    </form>
  );
}

export function SubmitButton({ children, className = "btn-primary", name, value }: { children: React.ReactNode; className?: string; name?: string; value?: string }) {
  const pending = useContext(PendingContext);
  return (
    <button type="submit" disabled={pending} className={className} name={name} value={value}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
