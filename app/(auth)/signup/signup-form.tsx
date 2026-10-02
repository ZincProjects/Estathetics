"use client";

import { Brush, Building2 } from "lucide-react";
import { useActionState, useState } from "react";
import { signUp } from "@/app/(auth)/actions";
import { Field, FieldMessage, FormMessage } from "@/components/forms/field";
import { GoogleButton } from "@/components/forms/google-button";
import { SubmitButton } from "@/components/forms/submit-button";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "interior_designer", label: "Interior designer", icon: Brush, blurb: "Scan rooms and create AI redesigns" },
  { value: "agent", label: "Property agent", icon: Building2, blurb: "Build listings that sell the lifestyle" },
] as const;

export type SignupRole = (typeof ROLES)[number]["value"];

export function RolePicker({ role, onChange, error }: { role: string; onChange: (r: SignupRole) => void; error?: string[] }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">I am a…</legend>
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map(({ value, label, icon: Icon, blurb }) => (
          <label
            key={value}
            className={cn(
              "flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              role === value ? "border-brand bg-accent/60" : "border-border hover:bg-muted",
            )}
          >
            <input
              type="radio"
              name="role-picker"
              value={value}
              checked={role === value}
              onChange={() => onChange(value)}
              className="sr-only"
            />
            <Icon className="size-5 text-brand" />
            <span className="font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">{blurb}</span>
          </label>
        ))}
      </div>
      <FieldMessage id="role-error" error={error} />
    </fieldset>
  );
}

export function SignupForm({ role }: { role: SignupRole }) {
  const [state, action] = useActionState<FormState, FormData>(signUp, {});

  if (state.ok) return <FormMessage message={state.message} ok />;

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="role" value={role} />
      <FormMessage message={state.message} ok={state.ok} />
      <Field
        label="Full name"
        name="fullName"
        autoComplete="name"
        defaultValue={(state.values?.fullName as string) ?? ""}
        error={state.fieldErrors?.fullName}
        required
      />
      <Field
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        defaultValue={(state.values?.email as string) ?? ""}
        error={state.fieldErrors?.email}
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        error={state.fieldErrors?.password}
        required
      />
      <SubmitButton className="w-full" pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}

export function SignupFlow({ initialRole }: { initialRole?: string }) {
  const [role, setRole] = useState<SignupRole>(
    ROLES.find((r) => r.value === initialRole)?.value ?? "interior_designer",
  );
  return (
    <div className="space-y-6">
      <RolePicker role={role} onChange={setRole} />
      <SignupForm role={role} />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton role={role} next="/onboarding" label="Sign up with Google" />
    </div>
  );
}
