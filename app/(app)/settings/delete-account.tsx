"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import type { FormState } from "@/lib/forms";
import { deleteMyAccount } from "./actions";

export function DeleteAccountForm() {
  const [state, action] = useActionState<FormState, FormData>(deleteMyAccount, {});
  return (
    <form action={action} className="space-y-3">
      <FormMessage message={state.message} />
      <Field label='Type "DELETE" to confirm' name="confirm" autoComplete="off" />
      <SubmitButton variant="destructive" pendingLabel="Deleting everything…">
        Delete my account and data
      </SubmitButton>
    </form>
  );
}
