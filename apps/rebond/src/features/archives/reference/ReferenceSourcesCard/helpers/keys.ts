// ReferenceSourcesCard/helpers/keys.ts
export type DraftKey = string;

export function getDraftKey(
  c: any,
  idx: number | undefined,
  tmpKeyByIndex: Map<number, DraftKey>,
): DraftKey {
  // 1) exemplaire_id (stable)
  if (c?.exemplaire_id) return `ex:${c.exemplaire_id}`;

  // 2) id DB (stable)
  const id = c?.id as string | undefined;
  if (id) return `id:${id}`;

  // 3) fallback stable : une clé par index (dans CE composant)
  const i = idx ?? -1;
  const existing = tmpKeyByIndex.get(i);
  if (existing) return existing;

  const next = `tmp:${crypto.randomUUID()}`;
  tmpKeyByIndex.set(i, next);
  return next;
}