import { Inbox, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { requireProfile } from "@/lib/auth";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Leads" };

const STATUSES: { value: Enums<"lead_status">; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

async function setLeadStatus(formData: FormData) {
  "use server";
  await requireProfile();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as Enums<"lead_status">;
  if (!STATUSES.some((s) => s.value === status)) return;
  const supabase = await createClient();
  await supabase.from("leads").update({ status }).eq("id", id);
  revalidatePath("/leads");
}

export default async function LeadsPage() {
  await requireProfile();
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, kind, name, email, phone, budget, timeline, message, status, created_at, listings(title, slug)")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Leads" description="Enquiries and quote requests sent to you. Contact details are shared with consent under PDPA." />
      {!leads?.length ? (
        <EmptyState icon={Inbox} title="No leads yet" description="When buyers enquire on your listings or request a look, they appear here." />
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    {lead.name}
                    {lead.status === "new" && <Badge>New</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lead.kind === "enquiry" ? "Listing enquiry" : "Get this look"}
                    {lead.listings && (
                      <>
                        {" · "}
                        <Link href={`/l/${lead.listings.slug}`} className="underline" target="_blank">
                          {lead.listings.title}
                        </Link>
                      </>
                    )}
                    {" · "}
                    {new Date(lead.created_at).toLocaleString("en-SG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <form action={setLeadStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={lead.id} />
                  <select
                    name="status"
                    defaultValue={lead.status}
                    aria-label="Lead status"
                    className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="text-xs text-muted-foreground underline">
                    Update
                  </button>
                </form>
              </div>
              {lead.message && <p className="whitespace-pre-line text-sm">{lead.message}</p>}
              <div className="flex flex-wrap gap-4 text-sm">
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-brand">
                    <Mail className="size-4" /> {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-brand">
                    <Phone className="size-4" /> {lead.phone}
                  </a>
                )}
                {lead.budget && <span className="text-muted-foreground">Budget: {lead.budget}</span>}
                {lead.timeline && <span className="text-muted-foreground">Timeline: {lead.timeline}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
