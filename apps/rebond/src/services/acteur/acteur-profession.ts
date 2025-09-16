// services/acteur-profession.ts
import { supabase } from "@/lib/supabase";

export async function loadProfessionForActeur(acteurId: string) {
  const { data, error } = await supabase
    .from("transcription_acteur_profession")
    .select("profession_id, ref_profession:ref_profession!inner(id,label)")
    .eq("acteur_id", acteurId);
  if (error) throw error;

  const ids = data.map((r: any) => r.profession_id);
  const labels = data.map((r: any) => r.ref_profession?.label).filter(Boolean);
  return { ids, labels };
}

export async function saveProfessionForActeur(acteurId: string, nextIds?: string[] | null) {
  const ids = Array.isArray(nextIds) ? nextIds.filter(Boolean) : [];

  // 1) si aucun choix => on supprime toutes les lignes
  if (ids.length === 0) {
    const { error } = await supabase
      .from("transcription_acteur_profession")
      .delete()
      .eq("acteur_id", acteurId);
    if (error) throw error;
    return;
  }

  // 2) On lit l’existant
  const { data: existing, error: readErr } = await supabase
    .from("transcription_acteur_profession")
    .select("profession_id")
    .eq("acteur_id", acteurId);
  if (readErr) throw readErr;

  const existingIds = new Set((existing ?? []).map((r: any) => r.profession_id));
  const nextSet = new Set(ids);

  // 3) A supprimer
  const toDelete = [...existingIds].filter((id) => !nextSet.has(id));
  if (toDelete.length) {
    const { error: delErr } = await supabase
      .from("transcription_acteur_profession")
      .delete()
      .eq("acteur_id", acteurId)
      .in("profession_id", toDelete);
    if (delErr) throw delErr;
  }

  // 4) A insérer
  const toInsert = ids.filter((id) => !existingIds.has(id)).map((fid) => ({
    acteur_id: acteurId,
    profession_id: fid,
  }));
  if (toInsert.length) {
    const { error: insErr } = await supabase
      .from("transcription_acteur_profession")
      .insert(toInsert); // contrainte unique couvre les doublons
    if (insErr) throw insErr;
  }
}

export async function createProfession(label: string) {
  return supabase
    .from('ref_profession')
    .insert({ label, code: label.trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_') })
    .select('id, label, code')
    .single();
}

export async function getProfessionsPreview(professionBrut: string) {
  return supabase.rpc('get_professions_preview', { p_profession_brut: professionBrut });
}

export async function associerProfessions(professionBrut: string, professionIds: string[]) {
  return supabase.rpc('associer_professions', {
    p_profession_brut: professionBrut,
    p_profession_ids: professionIds,
  });
}

export async function clearProfessionBrut(professionBrut: string) {
  return supabase.rpc('clear_profession_brut', { p_profession_brut: professionBrut });
}

