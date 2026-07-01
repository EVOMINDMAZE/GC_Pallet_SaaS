/**
 * Date formatting helpers. Kept tiny and dependency-free so we can
 * share it between server and client code.
 *
 * `formatDistanceToNow` is intentionally simple (no `Intl.RelativeTimeFormat`
 * polyfill drama) — it just returns a friendly relative time string.
 */
export function formatDistanceToNow(
  input: string | number | Date,
  now: Date = new Date(),
): string {
  const date = input instanceof Date ? input : new Date(input);
  const diffMs = now.getTime() - date.getTime();
  if (Number.isNaN(diffMs)) return "—";
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const month = Math.round(day / 30);
  if (month < 12) return `${month}mo ago`;
  const year = Math.round(month / 12);
  return `${year}y ago`;
}

export function formatDate(input: string | number | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}
