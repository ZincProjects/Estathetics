"use server";

import { fieldErrors, type FormState } from "@/lib/forms";
import { enquirySchema, PDPA_CONSENT_TEXT } from "@/lib/schemas/lead";
import { createClient } from "@/lib/supabase/server";

/**
 * Public enquiry. Anyone may submit; RLS only accepts leads addressed to the agent of a
 * published listing, and only with PDPA consent. The insert never reads rows back.
 */
export async function submitEnquiry(listingId: string, agentId: string, _: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    // Silently "succeed" for bots that fill the honeypot.
    if (parsed.error.issues.some((i) => i.path[0] === "company")) return { ok: true, message: "Thanks! The agent will be in touch." };
    return { fieldErrors: fieldErrors(parsed.error), values: { ...raw, consent: undefined } };
  }
  const { name, email, phone, message } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    kind: "enquiry",
    recipient_id: agentId,
    listing_id: listingId,
    name,
    email,
    phone,
    message,
    pdpa_consent: true,
    consent_text: PDPA_CONSENT_TEXT,
  });
  if (error) {
    console.error("enquiry failed", error);
    return { message: "Sorry, we couldn't send your enquiry. Please try again.", values: raw };
  }
  return { ok: true, message: "Thanks! Your enquiry has been sent and the agent will be in touch." };
}
