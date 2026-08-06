//toponymes.rpc.ts

import { supabase } from '@/lib/supabase';

export async function fetchToponymes() {
  return supabase
    .from('toponymes')
    .select('id, libelle, lieu_id, is_principal, lieux(id, parent_id)');
}

export async function getMentionsPreview(texteBrut: string) {
  return supabase.rpc('get_mentions_toponymes_preview', { p_forme_originale: texteBrut });
}

export async function associerMentions(texteBrut: string, toponymeId: string, pathIds: string[]) {
  return supabase.rpc('associer_mentions_toponymes', {
    p_forme_originale: texteBrut,
    p_toponyme_id: toponymeId,
    p_path_toponyme_ids: pathIds,
  });
}

export async function createVariante(lieuId: string, label: string) {
  return supabase
    .from('toponymes')
    .insert({ libelle: label, lieu_id: lieuId, is_principal: false })
    .select('id, libelle, lieu_id')
    .single();
}

export async function createLieu(parentLieuId: string, label: string, type: string) {
  const { data: lieu, error: lieuErr } = await supabase
    .from('lieux')
    .insert({ libelle: label, type, parent_id: parentLieuId })
    .select('id, libelle')
    .single();
  if (lieuErr) return { lieuErr };

  const { data: topo, error: topoErr } = await supabase
    .from('toponymes')
    .insert({ libelle: label, lieu_id: lieu.id, is_principal: true })
    .select('id, libelle, lieu_id')
    .single();

  return { lieu, topo, topoErr };
}
