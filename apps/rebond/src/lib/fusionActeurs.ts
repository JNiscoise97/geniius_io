// lib/fusionActeurs.ts
//
// Version rapatriée depuis rebond_deprecated : seule
// `deleteActeurIndividuRelation` (utilisée par IndividuLigneDeVieTable pour
// dissocier une mention) a été portée. `startFusionLogic`, qui dépendait de
// `uuid`, n'est appelée par aucun composant rapatrié — non portée pour ne
// pas ajouter une dépendance inutilisée.

import { supabase } from '@/lib/supabase';
import { updateIndividuIdentiteByIndividuId } from './individus';
import { getDeces, getNaissance } from './enrichirIndividu';

export async function deleteActeurIndividuRelation(
  acteurId: string | undefined | null,
  individuId: string | undefined | null,
) {
  if (!acteurId || !individuId) {
    return { success: false, errorMessage: 'Il faut fournir un acteur ET un individu.' };
  }

  try {
    const { error: deleteError } = await supabase
      .from('rebond_individus_mapping')
      .delete()
      .match({ acteur_id: acteurId, id: individuId });

    if (deleteError) throw deleteError;

    await updateIndividuIdentiteByIndividuId(individuId);
    await updateIndividuNaissanceDeces(individuId);

    return { success: true };
  } catch (e: any) {
    console.error('[deleteActeurIndividuRelation]', e);
    return { success: false, errorMessage: e.message };
  }
}

export async function updateIndividuNaissanceDeces(individuId: string) {
  const { data } = await supabase.from('v_acteurs_enrichis').select('*').eq('individu_id', individuId);
  const acteurs = data;

  if (!acteurs || acteurs.length === 0) return;

  const { date: naissance_date, lieu: naissance_lieu } = getNaissance(acteurs);
  const { date: deces_date, lieu: deces_lieu } = getDeces(acteurs);

  const { error: updateError } = await supabase
    .from('rebond_individus')
    .update({ naissance_date, naissance_lieu, deces_date, deces_lieu })
    .eq('id', individuId);

  if (updateError) {
    console.error('[updateIndividuNaissanceDeces] erreur update', updateError);
  }
}
