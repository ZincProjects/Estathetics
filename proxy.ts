import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip static assets, images and the public listing pages' heavy assets.
    "/((?!_next/static|_next/image|favicon.ico|icons/|mock/|manifest.webmanifest|apple-icon.png|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
