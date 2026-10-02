/**
 * Seeds demo accounts (and, as features land, demo projects and listings).
 * Idempotent: re-running updates existing demo users instead of duplicating them.
 *
 *   npm run seed        (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesUpdate } from "../lib/supabase/database.types";
import { TEST_AGENT, TEST_DESIGNER, TEST_PASSWORD } from "../tests/e2e/test-accounts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const admin: SupabaseClient<Database> = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type DemoUser = { email: string; name: string; profile: TablesUpdate<"profiles"> };

export const DEMO_USERS: DemoUser[] = [
  {
    email: TEST_DESIGNER.email,
    name: TEST_DESIGNER.name,
    profile: {
      role: "interior_designer",
      firm_name: "Studio Linen & Oak",
      specialties: ["HDB renovation", "Small spaces", "Sustainable design"],
      portfolio_urls: ["https://example.com/linen-and-oak"],
      bio: "Warm, practical interiors for Singapore HDB and condo homes.",
      phone: "+65 9123 4567",
      slug: "dev-designer",
    },
  },
  {
    email: "designer.dev2@example.com",
    name: "Priya Nair",
    profile: {
      role: "interior_designer",
      firm_name: "Kebun Interiors",
      specialties: ["Condo", "Luxury", "Heritage / Peranakan"],
      portfolio_urls: [],
      bio: "Peranakan-inspired modern spaces with a crafted touch.",
      slug: "priya-nair",
    },
  },
  {
    email: TEST_AGENT.email,
    name: TEST_AGENT.name,
    profile: {
      role: "agent",
      agency_name: "Demo Realty Pte Ltd",
      cea_number: "R000001A", // fictitious, for demo only
      phone: "+65 8123 4567",
      bio: "Helping families find homes near great schools in the east.",
      slug: "dev-agent",
    },
  },
];

async function findUserByEmail(email: string) {
  for (let page = 1; page < 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function upsertUser(u: DemoUser) {
  const existing = await findUserByEmail(u.email);
  let id = existing?.id;
  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.name, role: u.profile.role },
    });
    if (error) throw error;
    id = data.user.id;
  } else {
    await admin.auth.admin.updateUserById(id, { password: TEST_PASSWORD });
  }
  const { error } = await admin
    .from("profiles")
    .update({ ...u.profile, full_name: u.name, onboarded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  console.log(`✓ ${u.profile.role} ${u.email}`);
  return id;
}

async function main() {
  const ids: Record<string, string> = {};
  for (const u of DEMO_USERS) ids[u.email] = await upsertUser(u);
  console.log("\nDemo accounts ready. Password is TEST_PASSWORD in tests/e2e/test-accounts.ts.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
