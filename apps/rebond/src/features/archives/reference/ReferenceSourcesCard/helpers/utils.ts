// ReferenceSourcesCard/helpers/utils.ts
export function safeLabel(x: string | null | undefined, fallback = '—') {
  const s = (x ?? '').trim();
  return s.length ? s : fallback;
}

export function normKey(x: string | null | undefined) {
  return safeLabel(x, '').trim().toLowerCase();
}

export function normalizeUrl(url: string) {
  const u = (url ?? '').trim();
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  return `https://${u}`;
}

export function formatRangeLabel(
  a?: number | null,
  b?: number | null,
  kind = 'vue',
) {
  if (a == null && b == null) return '';
  if (a != null && b == null) return `${kind} ${a}`;
  if (a == null && b != null) return `${kind} ${b}`;
  if (a === b) return `${kind} ${a}`;
  return `${kind}s ${a}–${b}`;
}

export function toIntOrNull(v: string) {
  const t = (v ?? '').trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export function splitCsvToList(v: string) {
  return (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinListToCsv(arr: unknown) {
  if (!Array.isArray(arr)) return '';
  return arr.filter(Boolean).join(', ');
}

export function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null;
}