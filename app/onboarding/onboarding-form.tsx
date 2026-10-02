"use client";

import { useActionState, useState } from "react";
import { RolePicker, type SignupRole } from "@/app/(auth)/signup/signup-form";
import { Field, FieldMessage, FormMessage, TextareaField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import type { FormState } from "@/lib/forms";
import { DESIGN_SPECIALTIES } from "@/lib/schemas/profile";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "./actions";

type Defaults = {
  role: SignupRole | null;
  fullName: string;
  phone: string;
  firmName: string;
  agencyName: string;
  ceaNumber: string;
  bio?: string;
  specialties?: string[];
  portfolioUrls?: string[];
};

export function OnboardingForm({
  defaults,
  action: serverAction = completeOnboarding,
  submitLabel = "Continue to my studio",
}: {
  defaults: Defaults;
  action?: (prev: FormState, fd: FormData) => Promise<FormState>;
  submitLabel?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(serverAction, {});
  const [role, setRole] = useState<SignupRole>(defaults.role ?? "interior_designer");
  const v = (k: string, fallback = "") => (state.values?.[k] as string | undefined) ?? fallback;
  const chosen = new Set((state.values?.specialties as string[] | undefined) ?? defaults.specialties ?? []);

  return (
    <form action={action} className="space-y-6" noValidate>
      {!defaults.role && <RolePicker role={role} onChange={setRole} error={state.fieldErrors?.role} />}
      <input type="hidden" name="role" value={role} />
      <FormMessage message={state.message} ok={state.ok} />

      <section className="space-y-4">
        <Field label="Full name" name="fullName" autoComplete="name" defaultValue={v("fullName", defaults.fullName)} error={state.fieldErrors?.fullName} />
        <Field
          label="Mobile (optional)"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+65 9123 4567"
          defaultValue={v("phone", defaults.phone)}
          error={state.fieldErrors?.phone}
        />
      </section>

      {role === "interior_designer" ? (
        <section className="space-y-4">
          <Field label="Firm or studio" name="firmName" defaultValue={v("firmName", defaults.firmName)} error={state.fieldErrors?.firmName} />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Specialties</legend>
            <div className="flex flex-wrap gap-2">
              {DESIGN_SPECIALTIES.map((s) => (
                <label
                  key={s}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors has-checked:border-brand has-checked:bg-accent/70 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  )}
                >
                  <input type="checkbox" name="specialties" value={s} defaultChecked={chosen.has(s)} className="sr-only" />
                  {s}
                </label>
              ))}
            </div>
            <FieldMessage id="specialties-error" error={state.fieldErrors?.specialties} />
          </fieldset>
          <TextareaField
            label="Portfolio links (optional)"
            name="portfolioUrls"
            rows={3}
            placeholder={"https://instagram.com/yourstudio\nhttps://yourstudio.sg"}
            hint="One per line. Shown on your public designer profile."
            defaultValue={v("portfolioUrls", defaults.portfolioUrls?.join("
") ?? "")}
            error={state.fieldErrors?.portfolioUrls}
          />
        </section>
      ) : (
        <section className="space-y-4">
          <Field label="Agency" name="agencyName" placeholder="e.g. PropNex, ERA, Huttons" defaultValue={v("agencyName", defaults.agencyName)} error={state.fieldErrors?.agencyName} />
          <Field
            label="CEA registration number"
            name="ceaNumber"
            autoCapitalize="characters"
            placeholder="R123456A"
            hint="Required. It is displayed on every listing you publish, as CEA requires."
            defaultValue={v("ceaNumber", defaults.ceaNumber)}
            error={state.fieldErrors?.ceaNumber}
          />
        </section>
      )}

      <TextareaField label="Short bio (optional)" name="bio" rows={3} maxLength={600} defaultValue={v("bio", defaults.bio ?? "")} error={state.fieldErrors?.bio} />

      <SubmitButton className="w-full" pendingLabel="Saving…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
