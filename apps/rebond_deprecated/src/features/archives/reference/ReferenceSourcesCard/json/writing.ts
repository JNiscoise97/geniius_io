// ReferenceSourcesCard/json/writing.ts
import { isRecord } from '../helpers/utils';

export type WritingJson = {
  ecriture_ref?: string | null;
  hands_count_estimate?: number | null;
  handwriting_style_ref?: string | null;
  handwriting_legibility_ref?: string | null;
};

export function getWriting(w: unknown): WritingJson {
  return isRecord(w) ? (w as WritingJson) : {};
}

export function setWriting(prev: unknown, patch: Partial<WritingJson>) {
  const base = isRecord(prev) ? { ...(prev as any) } : {};
  return { ...base, ...patch };
}