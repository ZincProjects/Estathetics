"use client";

import { Loader2, MapPin, Search } from "lucide-react";
import { useActionState, useEffect, useId, useState } from "react";
import { Field, FieldMessage, FormMessage, SelectField, TextareaField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROPERTY_TYPES } from "@/lib/constants";
import type { FormState } from "@/lib/forms";
import { CONDO_FACILITIES, FACINGS, TENURES } from "@/lib/schemas/listing";
import { formatSgd, remainingLease, sqftToSqm, sqmToSqft } from "@/lib/units";
import { cn } from "@/lib/utils";

type GeoAddress = { label: string; block: string | null; road: string; building: string | null; postalCode: string | null; lat: number; lng: number };

export type ListingDefaults = Partial<{
  propertyType: string;
  title: string;
  address: string;
  postalCode: string | null;
  block: string | null;
  unit: string | null;
  lat: number | null;
  lng: number | null;
  sizeSqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floorLevel: string | null;
  facing: string | null;
  tenure: string | null;
  leaseStartYear: number | null;
  topYear: number | null;
  facilities: string[];
  askingPrice: number | null;
  highlights: string | null;
}>;

function AddressSearch({ onPick }: { onPick: (a: GeoAddress) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const listId = useId();

  useEffect(() => {
    if (q.trim().length < 3) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const body = await res.json();
        setResults(body.results ?? []);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const shown = q.trim().length < 3 ? [] : results;
  return (
    <div className="relative space-y-1.5">
      <Label htmlFor="address-search">Find address</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="address-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Postal code, block and street, or condo name"
          className="h-11 pl-9 text-base md:h-10 md:text-sm"
          role="combobox"
          aria-expanded={shown.length > 0}
          aria-controls={listId}
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {shown.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {shown.map((a) => (
            <li key={`${a.label}-${a.lat}`} role="option" aria-selected={false}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onPick(a);
                  setQ("");
                  setResults([]);
                }}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                {a.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Powered by OneMap. Picking a result fills in the address and map location.</p>
    </div>
  );
}

export function ListingForm({
  action: serverAction,
  defaults = {},
  submitLabel,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  defaults?: ListingDefaults;
  submitLabel: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(serverAction, {});
  const v = <T,>(k: string, fallback: T) => (state.values?.[k] as T | undefined) ?? fallback;

  const [type, setType] = useState(v("propertyType", defaults.propertyType ?? "hdb"));
  const [addr, setAddr] = useState({
    address: v("address", defaults.address ?? ""),
    postalCode: v("postalCode", defaults.postalCode ?? ""),
    block: v("block", defaults.block ?? ""),
    lat: v<string | number>("lat", defaults.lat ?? ""),
    lng: v<string | number>("lng", defaults.lng ?? ""),
  });
  const [unit, setUnit] = useState<"sqft" | "sqm">(v("sizeUnit", "sqft"));
  const [size, setSize] = useState<string>(v("sizeValue", defaults.sizeSqft ? String(defaults.sizeSqft) : ""));
  const [leaseYear, setLeaseYear] = useState<string>(v("leaseStartYear", defaults.leaseStartYear ? String(defaults.leaseStartYear) : ""));
  const [tenure, setTenure] = useState<string>(v("tenure", defaults.tenure ?? ""));
  const [price, setPrice] = useState<string>(v("askingPrice", defaults.askingPrice ? String(defaults.askingPrice) : ""));
  const facilities = new Set(v<string[]>("facilities", defaults.facilities ?? []));

  const isHdb = type === "hdb";
  const showLease = isHdb || tenure.startsWith("leasehold");
  const leaseYears = tenure === "leasehold_999" ? 999 : 99;
  const lease = /^\d{4}$/.test(leaseYear) ? remainingLease(Number(leaseYear), leaseYears) : null;
  const sizeNum = Number(size);
  const fe = state.fieldErrors ?? {};

  function switchUnit(next: "sqft" | "sqm") {
    if (next === unit) return;
    if (sizeNum > 0) setSize(String(Math.round(next === "sqm" ? sqftToSqm(sizeNum) : sqmToSqft(sizeNum))));
    setUnit(next);
  }

  return (
    <form action={action} className="space-y-8" noValidate>
      <FormMessage message={state.message} />

      <section className="space-y-4">
        <h2 className="text-xl">Property</h2>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Type</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROPERTY_TYPES.map((p) => (
              <label
                key={p.value}
                className={cn(
                  "cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  type === p.value ? "border-brand bg-accent/60 font-medium" : "border-border hover:bg-muted",
                )}
              >
                <input type="radio" name="propertyType" value={p.value} checked={type === p.value} onChange={() => setType(p.value)} className="sr-only" />
                {p.label}
              </label>
            ))}
          </div>
          <FieldMessage id="propertyType-error" error={fe.propertyType} />
        </fieldset>
        <Field
          label="Listing title"
          name="title"
          placeholder={isHdb ? "Bright 4-room near Tampines MRT" : "High-floor 3-bed with pool view"}
          defaultValue={v("title", defaults.title ?? "")}
          error={fe.title}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl">Location</h2>
        <AddressSearch
          onPick={(a) =>
            setAddr({
              address: [a.block ? `${a.block} ${a.road}` : a.road, a.building].filter(Boolean).join(", "),
              postalCode: a.postalCode ?? "",
              block: a.block ?? "",
              lat: a.lat,
              lng: a.lng,
            })
          }
        />
        <Field label="Address" name="address" value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })} error={fe.address} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Postal code" name="postalCode" inputMode="numeric" maxLength={6} value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} error={fe.postalCode} />
          <Field label="Block" name="block" value={addr.block} onChange={(e) => setAddr({ ...addr, block: e.target.value })} error={fe.block} />
          <Field label="Unit (private)" name="unit" placeholder="#08-123" defaultValue={v("unit", defaults.unit ?? "")} error={fe.unit} hint="Not shown publicly" />
        </div>
        <input type="hidden" name="lat" value={addr.lat} />
        <input type="hidden" name="lng" value={addr.lng} />
        <p className={cn("text-xs", addr.lat ? "text-success" : "text-muted-foreground")}>
          {addr.lat ? "✓ Location pinned: the neighbourhood report can be generated." : "Pick an address above to pin the location for the neighbourhood report."}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl">Size & layout</h2>
        <div className="space-y-1.5">
          <Label htmlFor="sizeValue">Floor area</Label>
          <div className="flex gap-2">
            <Input
              id="sizeValue"
              name="sizeValue"
              inputMode="decimal"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              aria-invalid={fe.sizeValue ? true : undefined}
              className="h-11 flex-1 text-base md:h-10 md:text-sm"
            />
            <div className="flex rounded-lg border border-input p-0.5" role="group" aria-label="Unit">
              {(["sqft", "sqm"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={unit === u}
                  onClick={() => switchUnit(u)}
                  className={cn("rounded-md px-3 text-sm", unit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                >
                  {u}
                </button>
              ))}
            </div>
            <input type="hidden" name="sizeUnit" value={unit} />
          </div>
          <FieldMessage
            id="sizeValue-error"
            error={fe.sizeValue}
            hint={sizeNum > 0 ? `≈ ${Math.round(unit === "sqft" ? sqftToSqm(sizeNum) : sqmToSqft(sizeNum)).toLocaleString("en-SG")} ${unit === "sqft" ? "sqm" : "sqft"}` : undefined}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Bedrooms" name="bedrooms" inputMode="numeric" defaultValue={v("bedrooms", defaults.bedrooms ?? "")} error={fe.bedrooms} />
          <Field label="Bathrooms" name="bathrooms" inputMode="numeric" defaultValue={v("bathrooms", defaults.bathrooms ?? "")} error={fe.bathrooms} />
          <Field label="Floor level" name="floorLevel" placeholder="High / 12" defaultValue={v("floorLevel", defaults.floorLevel ?? "")} error={fe.floorLevel} />
          <SelectField label="Facing" name="facing" placeholder="—" options={FACINGS.map((f) => ({ value: f, label: f }))} defaultValue={v("facing", defaults.facing ?? "")} error={fe.facing} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl">Tenure & price</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {isHdb ? (
            <div className="space-y-1.5">
              <Label>Tenure</Label>
              <p className="flex h-10 items-center text-sm">99-year leasehold (HDB)</p>
              <input type="hidden" name="tenure" value="leasehold_99" />
            </div>
          ) : (
            <SelectField label="Tenure" name="tenure" placeholder="Select…" options={TENURES} value={tenure} onChange={(e) => setTenure(e.target.value)} error={fe.tenure} />
          )}
          {showLease && (
            <Field
              label="Lease start year"
              name="leaseStartYear"
              inputMode="numeric"
              maxLength={4}
              value={leaseYear}
              onChange={(e) => setLeaseYear(e.target.value)}
              hint={lease !== null ? `About ${lease} years remaining` : "Used to calculate the remaining lease"}
              error={fe.leaseStartYear}
            />
          )}
          <Field label="TOP year" name="topYear" inputMode="numeric" maxLength={4} defaultValue={v("topYear", defaults.topYear ?? "")} error={fe.topYear} />
        </div>
        <Field
          label="Asking price (SGD)"
          name="askingPrice"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
          hint={price ? formatSgd(Number(price)) : "Leave blank to show “Price on request”"}
          error={fe.askingPrice}
        />
      </section>

      {!isHdb && (
        <fieldset className="space-y-2">
          <legend className="text-xl">Facilities</legend>
          <div className="flex flex-wrap gap-2">
            {CONDO_FACILITIES.map((f) => (
              <label
                key={f}
                className="cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors has-checked:border-brand has-checked:bg-accent/70 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              >
                <input type="checkbox" name="facilities" value={f} defaultChecked={facilities.has(f)} className="sr-only" />
                {f}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <TextareaField
        label="Key facts & highlights"
        name="highlights"
        rows={5}
        placeholder={"Renovated kitchen (2022)\nUnblocked view of the park\n5 min walk to Tampines West MRT"}
        hint="The AI copywriter will only use facts you write here and above. It never invents amenities or numbers."
        defaultValue={v("highlights", defaults.highlights ?? "")}
        error={fe.highlights}
      />

      <SubmitButton className="w-full sm:w-auto" pendingLabel="Saving…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
