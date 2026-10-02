import "server-only";
import { env, logMockMode, mock } from "@/lib/env";
import { propertyTypeLabel } from "@/lib/constants";
import { AMENITY_CATEGORIES, type AmenityCategory } from "@/lib/geo/categories";
import { buildFactSheet, ungroundedNumbers } from "@/lib/listing-facts";
import { listingFacts, priceLabel } from "@/lib/listing-format";
import { prompts } from "@/lib/prompts";
import { copyToText, listingCopySchema, type ListingCopy, type Tone } from "@/lib/schemas/listing-copy";
import type { Tables } from "@/lib/supabase/database.types";
import { generateStructured, type AiUsage } from "./claude";

type Listing = Tables<"listings">;
type Amenity = Pick<Tables<"listing_amenities">, "category" | "name" | "walk_minutes" | "distance_m">;

/** Template copy built strictly from the facts, used in mock mode. */
function mockCopy(listing: Listing, amenities: Amenity[], tone: Tone): ListingCopy {
  const facts = Object.fromEntries(listingFacts(listing));
  const nearest = (c: AmenityCategory) => amenities.filter((a) => a.category === c).sort((a, b) => a.distance_m - b.distance_m)[0];
  const mrt = nearest("mrt");
  const hawker = nearest("hawker");
  const school = nearest("primary_school");
  const beds = listing.bedrooms != null ? `${listing.bedrooms}-bedroom ` : "";
  const type = propertyTypeLabel(listing.property_type);
  const opener = {
    professional: `A well-located ${beds}${type} at ${listing.address}.`,
    warm: `Picture your family settling into this ${beds}${type} at ${listing.address}.`,
    luxury: `An understated ${beds}${type} residence at ${listing.address}.`,
    punchy: `${beds}${type}. ${listing.address}. Ready when you are.`,
  }[tone];

  const points: string[] = [];
  if (facts["Floor area"]) points.push(`${facts["Floor area"]} of living space`);
  if (facts["Remaining lease"]) points.push(`${facts["Remaining lease"]} remaining on the lease`);
  if (mrt) points.push(`About ${mrt.walk_minutes} minutes' walk to ${mrt.name}`);
  if (school) points.push(`${school.name} is about ${school.walk_minutes} minutes' walk away`);
  if (hawker) points.push(`${hawker.name} nearby for everyday meals`);
  if (listing.facilities.length) points.push(`Facilities include ${listing.facilities.slice(0, 3).join(", ").toLowerCase()}`);
  for (const line of (listing.highlights ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 2)) points.push(line);

  const nearby = amenities.length
    ? `Within walking distance you'll find ${[...new Set(amenities.slice(0, 6).map((a) => AMENITY_CATEGORIES[a.category as AmenityCategory]?.plural.toLowerCase() ?? a.category))].slice(0, 3).join(", ")}.`
    : "";
  return {
    headline: `${beds}${type} at ${listing.address}`.slice(0, 90),
    description: [
      [opener, facts["Floor area"] ? `It offers ${facts["Floor area"]}.` : ""].filter(Boolean).join(" "),
      [nearby, mrt ? `${mrt.name} is about ${mrt.walk_minutes} minutes away on foot.` : ""].filter(Boolean).join(" "),
      `Asking ${priceLabel(listing.asking_price)}. Contact the agent to arrange a viewing.`,
    ].filter(Boolean),
    key_selling_points: points.slice(0, 7),
  };
}

export async function generateListingCopy(input: { listing: Listing; amenities: Amenity[]; tone: Tone }): Promise<{
  copy: ListingCopy;
  warnings: string[];
  usage?: AiUsage;
  model: string;
  promptVersion: string;
  mocked: boolean;
}> {
  const p = prompts.listingCopy;
  const factSheet = buildFactSheet(input.listing, input.amenities);

  if (mock.claude) {
    logMockMode();
    await new Promise((r) => setTimeout(r, 1200));
    const copy = mockCopy(input.listing, input.amenities, input.tone);
    return { copy, warnings: ungroundedNumbers(copyToText(copy), factSheet), model: "mock", promptVersion: p.version, mocked: true };
  }

  const userText = p.user({ factSheet, tone: input.tone, propertyLabel: propertyTypeLabel(input.listing.property_type) });
  let { data, usage } = await generateStructured({ system: p.system, content: [{ type: "text", text: userText }], schema: listingCopySchema });
  let bad = ungroundedNumbers(copyToText(data), factSheet);

  if (bad.length) {
    // One corrective pass: name the offending numbers explicitly.
    const retry = await generateStructured({
      system: p.system,
      content: [
        {
          type: "text",
          text: `${userText}\n\nA previous draft used these numbers that are NOT in the fact sheet: ${bad.join(", ")}. Write the listing again without them.`,
        },
      ],
      schema: listingCopySchema,
    });
    usage = {
      ...retry.usage,
      inputTokens: usage.inputTokens + retry.usage.inputTokens,
      outputTokens: usage.outputTokens + retry.usage.outputTokens,
      costUsd: usage.costUsd + retry.usage.costUsd,
    };
    data = retry.data;
    bad = ungroundedNumbers(copyToText(data), factSheet);
  }

  return {
    copy: data,
    warnings: bad.map((n) => `“${n}” isn't in your listing facts. Check it before publishing.`),
    usage,
    model: env.ANTHROPIC_MODEL,
    promptVersion: p.version,
    mocked: false,
  };
}
