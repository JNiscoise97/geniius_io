// services/acteur-situation-fiscale.ts
import { supabase } from "@/lib/supabase";

export async function loadSituationFiscaleForActeur(acteurId: string) {
  const { data, error } = await supabase
    .from("transcription_acteur_situation_fiscale")
    .select("situation_fiscale_id, ref_situation_fiscale:ref_situation_fiscale!inner(id,label)")
    .eq("acteur_id", acteurId);
  if (error) throw error;

  const ids = data.map((r: any) => r.situation_fiscale_id);
  const labels = data.map((r: any) => r.ref_situation_fiscale?.label).filter(Boolean);
  return { ids, labels };
}

export async function saveSituationFiscaleForActeur(acteurId: string, nextIds?: string[] | null) {
  const ids = Array.isArray(nextIds) ? nextIds.filter(Boolean) : [];

  // 1) si aucun choix => on supprime toutes les lignes
  if (ids.length === 0) {
    const { error } = await supabase
      .from("transcription_acteur_situation_fiscale")
      .delete()
      .eq("acteur_id", acteurId);
    if (error) throw error;
    return;
  }

  // 2) On lit l’existant
  const { data: existing, error: readErr } = await supabase
    .from("transcription_acteur_situation_fiscale")
    .select("situation_fiscale_id")
    .eq("acteur_id", acteurId);
  if (readErr) throw readErr;

  const existingIds = new Set((existing ?? []).map((r: any) => r.situation_fiscale_id));
  const nextSet = new Set(ids);

  // 3) A supprimer
  const toDelete = [...existingIds].filter((id) => !nextSet.has(id));
  if (toDelete.length) {
    const { error: delErr } = await supabase
      .from("transcription_acteur_situation_fiscale")
      .delete()
      .eq("acteur_id", acteurId)
      .in("situation_fiscale_id", toDelete);
    if (delErr) throw delErr;
  }

  // 4) A insérer
  const toInsert = ids.filter((id) => !existingIds.has(id)).map((fid) => ({
    acteur_id: acteurId,
    situation_fiscale_id: fid,
  }));
  if (toInsert.length) {
    const { error: insErr } = await supabase
      .from("transcription_acteur_situation_fiscale")
      .insert(toInsert); // contrainte unique couvre les doublons
    if (insErr) throw insErr;
  }
}
