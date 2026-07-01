"use client";

/**
 * Buckets an array of records into per-day counts for the last N days.
 * Used by sparklines and the documents timeline.
 */
export function bucketByDay<
  T extends { created?: string; created_at?: string; uploaded_at?: string; last_updated?: string }
>(
  records: T[],
  days: number,
  field: keyof T = "created_at"
): { date: string; count: number; iso: string }[] {
  const out: { date: string; count: number; iso: string }[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const iso = d.toISOString();
    out.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: 0,
      iso,
    });
  }
  for (const r of records) {
    const raw = r[field] as string | undefined;
    if (!raw) continue;
    const day = raw.slice(0, 10); // YYYY-MM-DD
    const idx = out.findIndex((b) => b.iso.slice(0, 10) === day);
    if (idx >= 0) out[idx].count += 1;
  }
  return out;
}

/** Pretty percentage with sign, e.g. +12% / -3% / 0%. */
export function pctDelta(curr: number, prev: number): { text: string; positive: boolean } {
  if (prev === 0) return { text: curr === 0 ? "—" : "+100%", positive: curr >= 0 };
  const delta = ((curr - prev) / prev) * 100;
  const rounded = Math.round(delta);
  if (rounded === 0) return { text: "0%", positive: true };
  const sign = rounded > 0 ? "+" : "";
  return { text: `${sign}${rounded}%`, positive: rounded > 0 };
}
