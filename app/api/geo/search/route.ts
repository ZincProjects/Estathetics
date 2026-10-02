import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { searchAddress } from "@/lib/geo/onemap";

/** Address autocomplete for the Listing Studio (signed-in users only). */
export async function GET(request: NextRequest) {
  if (!(await getUser())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchAddress(q.slice(0, 100));
  return NextResponse.json({ results });
}
