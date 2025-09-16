// services/acteEdit.api.ts
import { supabase } from '@/lib/supabase';
import { fetchActeursEnrichis } from '@/lib/acteurs';
import { fetchRelationsForActeId } from '@/lib/detectRelationsPreview';
import { updateIndividuIdentiteByIndividuId } from '@/lib/individus';
import type { MentionMarginale } from '@/store/actes';

// --- Acteurs / relations -----------------------------------------------------

export async function apiFetchActeursEnrichis(acteId: string) {
  return await fetchActeursEnrichis(acteId);
}

export async function apiFetchRelationsForActeId(acteId: string) {
  return await fetchRelationsForActeId(acteId);
}

// --- Label d'acte ------------------------------------------------------------

export async function apiUpdateActeLabel(acteId: string, newLabel: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('etat_civil_actes')
    .update({ label: newLabel, updated_at: now })
    .eq('id', acteId);
  if (error) throw error;
}

// --- Suppression acteur + effets de bord ------------------------------------

export async function apiDeleteActeurCascade(acteurId: string) {
  // 1) récupérer individu_id
  const { data: acteur, error: error1 } = await supabase
    .from('v_acteurs_enrichis')
    .select('individu_id')
    .eq('id', acteurId)
    .maybeSingle();

  if (error1) throw error1;
  const individuId = acteur?.individu_id as string | undefined;

  // 2) delete mapping + acteur
  const { error: eMap } = await supabase
    .from('transcription_entites_mapping')
    .delete()
    .eq('cible_id', acteurId);
  if (eMap) throw eMap;

  const { error: eAct } = await supabase
    .from('transcription_entites_acteurs')
    .delete()
    .eq('id', acteurId);
  if (eAct) throw eAct;

  // 3) maj identité individu si présent
  if (individuId) {
    await updateIndividuIdentiteByIndividuId(individuId);
  }

  return { individuId };
}

export async function apiFetchBureaux() {
  const { data, error } = await supabase
    .from('etat_civil_bureaux')
    .select('id, nom')
    .order('nom', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function apiUpdateActe(acteId: string, payload: any) {
  const { error } = await supabase.from('etat_civil_actes').update(payload).eq('id', acteId);
  if (error) throw error;
}

type Cible = {
  id: string;
  label: string | null;
  type_acte: string | null;
  date: string | null;
  numero_acte: string | null;
};
type Row = MentionMarginale & { cible: Cible | null };

export type MentionMarginaleWithCible = MentionMarginale & { cible: Cible | null };

// apiListMentionsMarginales
export async function apiListMentionsMarginales(acte_id: string) {
  const { data, error } = await supabase
    .from('ec_acte_mentions_marginales')
    .select(
      `
      id, acte_id, type_mention, date_acte, lieu_toponyme_id, lieu_texte, numero_acte,
      acte_id_cible, texte_brut, note, source, created_at, updated_at,
      cible:etat_civil_actes!ec_acte_mentions_marginales_acte_id_cible_fkey (
        id, label, type_acte, date, numero_acte
      )
    `,
    )
    .eq('acte_id', acte_id)
    .order('date_acte', { ascending: true })
    // si tu utilises l’alias "cible", la limite s’applique par { foreignTable: 'cible' }
    .limit(1, { foreignTable: 'cible' });

  if (error) throw error;

  const normalized: Row[] = (data ?? []).map((r) => ({
    ...r,
    cible: Array.isArray(r.cible) ? (r.cible[0] ?? null) : (r.cible ?? null),
  }));

  return normalized;
}

export async function apiCreateMentionMarginale(payload: MentionMarginale) {
  const { data, error } = await supabase
    .from('ec_acte_mentions_marginales')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as MentionMarginale;
}

export async function apiUpdateMentionMarginale(id: string, patch: Partial<MentionMarginale>) {
  const { data, error } = await supabase
    .from('ec_acte_mentions_marginales')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MentionMarginale;
}

export async function apiDeleteMentionMarginale(id: string) {
  const { error } = await supabase.from('ec_acte_mentions_marginales').delete().eq('id', id);
  if (error) throw error;
}
