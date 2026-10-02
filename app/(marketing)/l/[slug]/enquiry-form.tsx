"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Field, FieldMessage, FormMessage, TextareaField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import type { FormState } from "@/lib/forms";
import { PDPA_CONSENT_TEXT } from "@/lib/schemas/lead";
import { submitEnquiry } from "./actions";

const [CONSENT_BEFORE, CONSENT_AFTER] = PDPA_CONSENT_TEXT.split("Privacy Policy");

export function EnquiryForm({ listingId, agentId, title }: { listingId: string; agentId: string; title: string }) {
  const [state, action] = useActionState<FormState, FormData>(submitEnquiry.bind(null, listingId, agentId), {});
  const v = (k: string) => (state.values?.[k] as string | undefined) ?? "";

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-success/30 bg-success/10 p-6 text-center" role="status">
        <CheckCircle2 className="size-8 text-success" />
        <p className="font-medium">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3" noValidate>
      <FormMessage message={state.message} />
      <Field label="Name" name="name" autoComplete="name" defaultValue={v("name")} error={state.fieldErrors?.name} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={v("email")} error={state.fieldErrors?.email} />
        <Field label="Mobile" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={v("phone")} error={state.fieldErrors?.phone} />
      </div>
      <TextareaField
        label="Message (optional)"
        name="message"
        rows={3}
        defaultValue={v("message") || `Hi, I'm interested in ${title}. Could we arrange a viewing?`}
        error={state.fieldErrors?.message}
      />
      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
        <input type="checkbox" name="consent" className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
        <span>
          {CONSENT_BEFORE}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          {CONSENT_AFTER}
        </span>
      </label>
      <FieldMessage id="consent-error" error={state.fieldErrors?.consent} />
      <SubmitButton className="w-full" pendingLabel="Sending…">
        Send enquiry
      </SubmitButton>
    </form>
  );
}
