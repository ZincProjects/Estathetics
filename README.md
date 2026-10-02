# Estathetics

AI platform connecting **interior designers** and **property agents** in Singapore.

- **Designers** photograph a room, get an AI scan (dimensions, light, beams, DB box, trunking…), and generate structure-preserving redesigns in ten themes with a before/after slider.
- **Agents** build listings with an automatic neighbourhood report (MRT, schools, hawker centres…), facts-only AI copy, and a beautiful public listing page with a PDPA-compliant enquiry form.
- **The Bridge** (Phase 3) lets agents invite designers to virtually stage listings so buyers can toggle themes.

Built with Next.js 16 (App Router) · TypeScript · Tailwind 4 · shadcn/ui (Base UI) · Supabase (Auth, Postgres + RLS, Storage) · Anthropic Claude · Replicate · OneMap · MapLibre.

---

## Quick start

```bash
npm install              # also copies the MapLibre worker into public/vendor
cp .env.example .env.local
npm run dev              # http://localhost:3000
```

The app runs fully in **mock mode** with only the Supabase variables set: AI scans, redesigns and copy return realistic demo output, and nothing is charged.

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (region: Singapore).
2. Copy the **Project URL** and **anon key** into `.env.local`; copy the **service_role** key into `SUPABASE_SERVICE_ROLE_KEY` (server-only; used by the seed script).
3. Apply the database schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
4. **Authentication → URL Configuration**: Site URL `http://localhost:3000` (or your domain); add `http://localhost:3000/**` and `https://<your-domain>/**` to Redirect URLs.
5. Optional, for faster local testing: turn off **Confirm email** under Authentication → Providers → Email.
6. Optional, Google sign-in: enable the Google provider (Client ID + secret from Google Cloud; redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`) and set `NEXT_PUBLIC_GOOGLE_AUTH=true`.

### 2. Demo data

```bash
npm run seed
```

This creates a demo designer, a second designer and a demo agent (password in `tests/e2e/test-accounts.ts`), a designer project with a scan and redesigns, and two published **demo** listings:

- `/l/demo-tampines-4-room`: an HDB 4-room
- `/l/demo-bishan-condo`: a condo

### 3. Real AI (optional)

| Feature | Variables | Notes |
|---|---|---|
| Room scan, listing copy | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-opus-5-5`) | Structured outputs + Zod, retry on invalid JSON, refusal fallbacks enabled |
| Redesign images | `REPLICATE_API_TOKEN`, `REPLICATE_REDESIGN_MODEL`, optional `REPLICATE_INPUT_STYLE` | e.g. `adirik/interior-design` (ControlNet) or `black-forest-labs/flux-kontext-pro` (edit) |
| Neighbourhood (live) | `ONEMAP_EMAIL`, `ONEMAP_PASSWORD` | Adds supermarkets, clinics, parks, bus stops via OneMap themes |
| Neighbourhood (fallback) | `GOOGLE_PLACES_API_KEY` | Places API (New) nearby search |

Without these keys each service falls back to mock mode independently. `FORCE_MOCK=true` forces everything into mock mode.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `start` | Production build / serve |
| `npm run check` | Typecheck + lint + unit tests |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright happy paths per role, in forced mock mode (needs `npm run seed` first; stop any other `next dev` in this folder, since Next allows one per project) |
| `npm run seed` | Demo accounts and data (needs service-role key) |
| `npm run db:push` / `db:types` | Apply migrations / regenerate `lib/supabase/database.types.ts` |
| `npx tsx scripts/build-amenity-dataset.ts` | Rebuild `data/sg-amenities.json` from OneMap search |
| `npm run assets` | Regenerate PWA icons and mock room images |

## Project structure

```
app/
  (marketing)/           landing, privacy, terms, public listing page /l/[slug]
  (auth)/                login, signup (+ server actions)
  onboarding/            role-specific profile setup
  (app)/designer/        projects → rooms → photos, scan, redesign; Theme Studio
  (app)/agent/           Listing Studio: details, photos, neighbourhood, copy, publish
  (app)/leads, settings  leads inbox, profile, PDPA account deletion
  api/ai/*               scan, redesign (+ job polling) route handlers
  api/listings/*         neighbourhood report, listing copy
components/              UI kit (shadcn/Base UI), slider, scan report, maps…
lib/
  ai/                    Claude wrapper, redesign providers (Replicate, mock), usage & rate limits
  prompts/               versioned prompts: room-scan.v1, redesign.v1, listing-copy.v1
  schemas/               Zod schemas for every form and AI output
  geo/                   OneMap search, amenity sources, walking estimates
  images/                client resize, watermarking
  supabase/              server/browser/admin clients, generated types
supabase/migrations/     schema, RLS, storage buckets, preset themes
data/sg-amenities.json   bundled OneMap amenity dataset
tests/unit, tests/e2e    Vitest and Playwright
```

## Compliance built in

- Every AI image is watermarked **"Virtually staged (AI-generated)"** before storage; originals stay viewable.
- The agent's **CEA registration number** is required to onboard and is shown on every listing; publishing is blocked without it.
- Listing copy is generated from a fact sheet only, and every number is checked against the facts before display.
- Dimensions are always labelled **"estimated, verify on site"**.
- **PDPA**: enquiry forms require explicit consent (stored with the consent text), a privacy policy page, and self-serve account deletion.

## Architecture notes

- All AI calls are server-side. Keys never reach the browser.
- Row Level Security on every table; helper functions live in a non-exposed `private` schema.
- Long AI jobs (redesign) run in `after()` with progress in `generation_jobs`, and the client polls `/api/ai/jobs/[id]`.
- Rate limits are a sliding window per user per action (`check_rate_limit`), and every AI call is logged to `usage_events` with token counts and estimated cost (the foundation for Phase 4 billing).
