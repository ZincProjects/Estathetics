"use client";

import { useActionState } from "react";
import { signIn } from "@/app/(auth)/actions";
import { Field, FormMessage } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import type { FormState } from "@/lib/forms";

export function LoginForm({ next, error }: { next?: string; error?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, { message: error });
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormMessage message={state.message} ok={state.ok} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        defaultValue={(state.values?.email as string) ?? ""}
        error={state.fieldErrors?.email}
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
        required
      />
      <SubmitButton className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
