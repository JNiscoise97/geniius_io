import { supabase } from '@/lib/supabase';
import type { NoteDraft } from '@/types/notes';

export async function loadNotesForActeur(acteur_id: string): Promise<{ notes_ref: NoteDraft[] }> {
  const { data, error } = await supabase
    .from('transcription_acteur_notes')
    .select(`
      id, acteur_id, type_code, texte,
      date_evenement, date_precision,
      bureau_id, registre_id, acte_id,
      inscription_nature, annee_registre, numero_acte,
      target_kind, target_acte_ac_id, target_acte_ec_id, target_label,
      position
    `)
    .eq('acteur_id', acteur_id)
    .order('position', { ascending: true });

  if (error) throw error;

  // Rien à transformer : on renvoie tel quel pour l’UI
  return { notes_ref: (data ?? []) as NoteDraft[] };
}

export async function saveAllNotesForActeur(acteur_id: string, all: NoteDraft[]) {
  // wipe + bulk insert (même stratégie que liens)
  const { error: delErr } = await supabase
    .from('transcription_acteur_notes')
    .delete()
    .eq('acteur_id', acteur_id);
  if (delErr) throw delErr;

  if (!all?.length) return;

  const payload = all.map((n, idx) => ({
    acteur_id,
    type_code: n.type_code,
    texte: n.texte ?? null,
    date_evenement: n.date_evenement ?? null,
    date_precision: n.date_precision ?? null,
    bureau_id: n.bureau_id ?? null,
    registre_id: n.registre_id ?? null,
    acte_id: n.acte_id ?? null,
    inscription_nature: n.inscription_nature ?? null,
    annee_registre: n.annee_registre ?? null,
    numero_acte: n.numero_acte ?? null,
    target_kind: n.target_kind ?? null,
    target_acte_ac_id: n.target_acte_ac_id ?? null,
    target_acte_ec_id: n.target_acte_ec_id ?? null,
    target_label: n.target_label ?? null,
    position: Number.isFinite(n.position) ? n.position : idx + 1,
  }));

  const { error: insErr } = await supabase
    .from('transcription_acteur_notes')
    .insert(payload);
  if (insErr) throw insErr;
}
