import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** OAuth / email-confirmation landing: exchanges the PKCE code for a session cookie. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const role = searchParams.get("role");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Google sign-ups carry the chosen role in the callback URL rather than user metadata.
      if (data.user && (role === "interior_designer" || role === "agent")) {
        await supabase.from("profiles").update({ role }).eq("id", data.user.id).is("role", null);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That sign-in link is invalid or expired.")}`);
}
