export const SQFT_PER_SQM = 10.7639;
export const FT_PER_M = 3.28084;

export const sqmToSqft = (sqm: number) => sqm * SQFT_PER_SQM;
export const sqftToSqm = (sqft: number) => sqft / SQFT_PER_SQM;

const round = (n: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

/** "19 sqm (205 sqft)" */
export function formatArea(sqm: number | null | undefined, primary: "sqm" | "sqft" = "sqm") {
  if (sqm == null || !Number.isFinite(sqm)) return "—";
  const m = `${round(sqm, sqm < 10 ? 1 : 0)} sqm`;
  const f = `${round(sqmToSqft(sqm)).toLocaleString("en-SG")} sqft`;
  return primary === "sqm" ? `${m} (${f})` : `${f} (${m})`;
}

/** "5.6 m (18′4″)" */
export function formatLength(m: number | null | undefined) {
  if (m == null || !Number.isFinite(m)) return "—";
  const totalIn = Math.round(m * FT_PER_M * 12);
  return `${round(m, 1)} m (${Math.floor(totalIn / 12)}′${totalIn % 12}″)`;
}

export function formatSgd(amount: number | null | undefined, opts: { compact?: boolean } = {}) {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
    notation: opts.compact ? "compact" : "standard",
  }).format(amount);
}

/** Remaining lease in whole years for a 99-year (or other) lease starting in `startYear`. */
export function remainingLease(startYear: number, leaseYears = 99, now = new Date()) {
  const elapsed = now.getFullYear() - startYear;
  return Math.max(0, leaseYears - elapsed);
}
