// ReferenceSourcesCard/json/locating.ts
import { isRecord } from '../helpers/utils';

export type LocSystem = {
  kind?: string | null; // ref_pagination_type id
  start?: number | null;
  end?: number | null;
  raw?: string | null;
  missing_ranges?: string | null;
};

export function getLocSystem0(locating: unknown): LocSystem {
  if (!isRecord(locating)) return {};
  const systems = (locating as any).systems;
  if (!Array.isArray(systems) || systems.length === 0) return {};
  const s0 = systems[0];
  return isRecord(s0) ? (s0 as LocSystem) : {};
}

export function setLocSystem0(prevLocating: unknown, patch: Partial<LocSystem>) {
  const base = isRecord(prevLocating) ? { ...(prevLocating as any) } : {};
  const systems = Array.isArray(base.systems) ? [...base.systems] : [];
  const s0 = isRecord(systems[0]) ? { ...(systems[0] as any) } : {};
  systems[0] = { ...s0, ...patch };
  return { ...base, systems };
}