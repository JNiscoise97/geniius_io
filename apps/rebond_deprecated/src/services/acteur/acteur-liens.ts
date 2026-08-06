// src/services/acteur/acteur-liens.ts
import { supabase } from '@/lib/supabase';
import type { LienDraft } from '@/types/liens';

export async function loadLiensForActeur(acteur_id: string, acteurSexe?: 'M'|'F'|null) {
  // jointure pour récupérer labels genrés
  const { data, error } = await supabase
    .from('transcription_acteur_liens')
    .select(`
      id, acteur_id, lien_id, cible_type, cible_acteur_id, cible_role, cible_label,
      cote, fratrie_qualif, cousin_degre, cousin_removal, cousin_double, ascend_n, descend_n, position,
      ref_lien:ref_lien (
        id, code, label, label_m, label_f, invariable, nature
      )
    `)
    .eq('acteur_id', acteur_id)
    .order('position', { ascending: true });

  if (error) throw error;

  const chooseGendered = (r: any): string =>
    r?.invariable
      ? r?.label
      : acteurSexe === 'F'
      ? r?.label_f || r?.label || r?.label_m || ''
      : acteurSexe === 'M'
      ? r?.label_m || r?.label || r?.label_f || ''
      : r?.label || r?.label_m || r?.label_f || '';

  const all: LienDraft[] = (data ?? []).map((row: any) => ({
    id: row.id,
    lien_id: row.lien_id,
    lien_code: row.ref_lien?.code ?? null,
    lien_label: row.ref_lien ? chooseGendered(row.ref_lien) : null,
    nature: row.ref_lien?.nature ?? null,
    cible_type: row.cible_type,
    cible_acteur_id: row.cible_acteur_id,
    cible_role: row.cible_role,
    cible_label: row.cible_label,
    cote: row.cote,
    fratrie_qualif: row.fratrie_qualif,
    cousin_degre: row.cousin_degre,
    cousin_removal: row.cousin_removal,
    cousin_double: row.cousin_double,
    ascend_n: row.ascend_n,
    descend_n: row.descend_n,
    position: row.position,
  }));

  const liens_matrimoniaux_ref = all.filter((l) => l.nature === 'mariage');
  const liens_non_matrimoniaux_ref = all.filter((l) => l.nature !== 'mariage');

  return { liens_matrimoniaux_ref, liens_non_matrimoniaux_ref };
}

export async function saveAllLiensForActeur(acteur_id: string, all: LienDraft[]) {
  // stratégie simple : on efface tout et on réinsère le tableau courant
  const { error: delErr } = await supabase
    .from('transcription_acteur_liens')
    .delete()
    .eq('acteur_id', acteur_id);
  if (delErr) throw delErr;

  if (!all?.length) return;

  const payload = all.map((l) => ({
    acteur_id,
    lien_id: l.lien_id,
    cible_type: l.cible_type,
    cible_acteur_id: l.cible_type === 'acteur' ? l.cible_acteur_id ?? null : null,
    cible_role: l.cible_type === 'role' ? l.cible_role ?? null : null,
    cible_label: l.cible_type === 'texte' ? l.cible_label ?? null : null,
    cote: l.cote ?? null,
    fratrie_qualif: l.fratrie_qualif ?? null,
    cousin_degre: l.cousin_degre ?? null,
    cousin_removal: l.cousin_removal ?? null,
    cousin_double: !!l.cousin_double,
    ascend_n: l.ascend_n ?? null,
    descend_n: l.descend_n ?? null,
    position: l.position ?? null,
  }));

  const { error: insErr } = await supabase
    .from('transcription_acteur_liens')
    .insert(payload);
  if (insErr) throw insErr;
}
