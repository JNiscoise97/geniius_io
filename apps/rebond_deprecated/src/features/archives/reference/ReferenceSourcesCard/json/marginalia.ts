// ReferenceSourcesCard/json/marginalia.ts
import { isRecord } from '../helpers/utils';

export type MarginaliaSystem = {
  count?: {
    signatures?: number | null;
    marginal_mentions?: number | null;
    marginal_crossouts?: number | null;
  };
  present?: {
    signatures?: boolean | null;
    marginal_mentions?: boolean | null;
    marginal_crossouts?: boolean | null;
  };
};

export function getMarginalia0(marginalia: unknown): MarginaliaSystem {
  if (!isRecord(marginalia)) return {};
  const systems = (marginalia as any).systems;
  if (!Array.isArray(systems) || systems.length === 0) return {};
  const s0 = systems[0];
  return isRecord(s0) ? (s0 as MarginaliaSystem) : {};
}

export function setMarginalia0(prev: unknown, patch: Partial<MarginaliaSystem>) {
  const base = isRecord(prev) ? { ...(prev as any) } : {};
  const systems = Array.isArray(base.systems) ? [...base.systems] : [];
  const s0 = isRecord(systems[0]) ? { ...(systems[0] as any) } : {};

  const next = {
    ...s0,
    ...patch,
    count: { ...(s0.count ?? {}), ...(patch.count ?? {}) },
    present: { ...(s0.present ?? {}), ...(patch.present ?? {}) },
  };

  systems[0] = next;
  return { ...base, systems };
}