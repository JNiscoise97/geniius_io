// src/features/archives/reference/reference.api.ts
import { supabase } from '@/lib/supabase';
import type { ArchiveSourceRow, ReferenceOwner } from './types';

type SB<T> = { data: T | null; error: any };

function assertOk<T>(res: SB<T>, ctx: string): asserts res is { data: T; error: null } {
  if (res.error) throw new Error(`${ctx}: ${res.error.message}`);
}

/** Helpers pour cibler la bonne table/colonne selon kind */
function tableFor(kind: ReferenceOwner['kind']) {
  return kind === 'acte' ? 'etat_civil_actes_sources' : 'etat_civil_registres_sources';
}
function fkFor(kind: ReferenceOwner['kind']) {
  return kind === 'acte' ? 'acte_id' : 'registre_id';
}

export async function fetchArchiveSources(owner: ReferenceOwner): Promise<ArchiveSourceRow[]> {
  const table = tableFor(owner.kind);
  const fk = fkFor(owner.kind);

  const res = await supabase
    .from(table)
    .select('*')
    .eq(fk, owner.id)
    .order('created_at', { ascending: true });

  assertOk(res as any, 'fetchArchiveSources');

  const rows = (res.data ?? []) as any[];
  return rows.map((r) => ({
    ...r,
    owner_kind: owner.kind,
    owner_id: owner.id,
  })) as ArchiveSourceRow[];
}

export async function createArchiveSource(owner: ReferenceOwner, values: Partial<ArchiveSourceRow>) {
  const table = tableFor(owner.kind);
  const fk = fkFor(owner.kind);

  const payload: any = {
    [fk]: owner.id,
    depot_type: values.depot_type ?? null,
    nom_depot: values.nom_depot ?? null,
    chemin_classement: values.chemin_classement ?? null,
    cote: values.cote ?? null,
    registre: values.registre ?? null,
    acces_mode: values.acces_mode ?? null,
    url_site: values.url_site ?? null,
    vues_pages: values.vues_pages ?? null,
    note: values.note ?? null,
  };

  const res = await supabase.from(table).insert([payload]).select('*').single();
  assertOk(res as any, 'createArchiveSource');

  return {
    ...(res.data as any),
    owner_kind: owner.kind,
    owner_id: owner.id,
  } as ArchiveSourceRow;
}

export async function updateArchiveSource(
  owner: ReferenceOwner,
  sourceId: string,
  patch: Partial<ArchiveSourceRow>,
) {
  const table = tableFor(owner.kind);

  const payload: any = {
    depot_type: patch.depot_type ?? undefined,
    nom_depot: patch.nom_depot ?? undefined,
    chemin_classement: patch.chemin_classement ?? undefined,
    cote: patch.cote ?? undefined,
    registre: patch.registre ?? undefined,
    acces_mode: patch.acces_mode ?? undefined,
    url_site: patch.url_site ?? undefined,
    vues_pages: patch.vues_pages ?? undefined,
    note: patch.note ?? undefined,
  };

  const res = await supabase.from(table).update(payload).eq('id', sourceId).select('*').single();
  assertOk(res as any, 'updateArchiveSource');

  return {
    ...(res.data as any),
    owner_kind: owner.kind,
    owner_id: owner.id,
  } as ArchiveSourceRow;
}

export async function deleteArchiveSource(owner: ReferenceOwner, sourceId: string) {
  const table = tableFor(owner.kind);
  const res = await supabase.from(table).delete().eq('id', sourceId);
  if (res.error) throw new Error(`deleteArchiveSource: ${res.error.message}`);
}
