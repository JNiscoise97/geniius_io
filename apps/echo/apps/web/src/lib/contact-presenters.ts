import type { Contact } from "@echo/domain";

export function getPrimaryEmail(c: Contact): string | undefined {
  return c.emails?.find(e => (e.label ?? "").toLowerCase().includes("perso") || (e.label ?? "").toLowerCase().includes("home"))?.value
      ?? c.emails?.[0]?.value;
}
export function getProEmail(c: Contact): string | undefined {
  return c.emails?.find(e => (e.label ?? "").toLowerCase().includes("pro") || (e.label ?? "").toLowerCase().includes("work"))?.value;
}
export function upsertLabeled(list: {label?: string; value: string}[] = [], value?: string, label?: string) {
  if (!value) return list;
  const i = list.findIndex(x => x.label === label || x.value === value);
  if (i === -1) return [{ label, value }, ...list];
  const copy = [...list];
  copy[i] = { ...copy[i], value, label: label ?? copy[i].label };
  return copy;
}
export function getPrimaryPhone(c: Contact): string | undefined {
  return c.phones?.find(p => (p.label ?? "").toLowerCase().includes("mobile"))?.value
      ?? c.phones?.[0]?.value;
}
export function getProPhone(c: Contact): string | undefined {
  return c.phones?.find(p => (p.label ?? "").toLowerCase().includes("pro") || (p.label ?? "").toLowerCase().includes("bureau"))?.value;
}
export function getAddressLine(c: Contact): string | undefined {
  const a = c.addresses?.[0];
  if (!a) return;
  return [a.street, a.zip, a.city, a.country].filter(Boolean).join(", ");
}
