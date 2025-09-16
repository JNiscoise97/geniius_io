import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { updateIndividuIdentiteByIndividuId } from './individus';
import { getDeces, getNaissance } from './enrichirIndividu';

export async function startFusionLogic(
  selectedActeurs: string[],
  selectedIndividus: string[],
) {
  if (selectedActeurs.length < 2) {
    return { success: false, errorMessage: 'Il faut sélectionner au moins deux acteurs.' };
  }

  console.log('[startFusionLogic] selectedActeurs', selectedActeurs);
  console.log('[startFusionLogic] selectedIndividus', selectedIndividus);

  const newIndividuId = uuidv4();
  const mappingInserts: { id: string; acteur_id: string }[] = [];
  const individuIdsToUpdate = new Set<string>();

  try {
    // Vérification des acteurs existants
    const { data: acteursData, error: acteursError } = await supabase
      .from('transcription_entites_acteurs')
      .select('id, sexe')
      .in('id', selectedActeurs);

    if (acteursError) throw acteursError;
    if (!acteursData || acteursData.length !== selectedActeurs.length) {
      throw new Error("Certains acteurs sélectionnés n'existent pas.");
    }

    // Récupération des sexes
    const sexes = acteursData.map((a) => a.sexe).filter(Boolean);
    const uniqueSexes = Array.from(new Set(sexes));
    const sexeToInsert = uniqueSexes.length === 1 ? uniqueSexes[0] : null;

    // Vérifier les mappings existants
    const { data: existingMappings, error: mappingError } = await supabase
      .from('rebond_individus_mapping')
      .select('acteur_id, id')
      .in('acteur_id', selectedActeurs);

    if (mappingError) throw mappingError;

    const acteurToIndividuMap = new Map(existingMappings?.map(m => [m.acteur_id, m.id]));

    if (selectedIndividus.length === 0) {
      // Règle 1 : aucun individu rattaché
      await supabase.from('rebond_individus').insert([{ id: newIndividuId, sexe: sexeToInsert }]);
      for (const acteurId of selectedActeurs) {
        mappingInserts.push({ id: newIndividuId, acteur_id: acteurId });
      }
      individuIdsToUpdate.add(newIndividuId);
    }

    else if (selectedIndividus.length === 1) {
      // Règle 2 : un seul individu cible
      const [targetIndividuId] = selectedIndividus;

      // Optionnel : vérif cohérence du sexe
      const { data: targetIndividu } = await supabase
        .from('rebond_individus')
        .select('sexe')
        .eq('id', targetIndividuId)
        .maybeSingle();

      if (targetIndividu && sexeToInsert && targetIndividu.sexe && targetIndividu.sexe !== sexeToInsert) {
        console.warn(`[Fusion] Sexe divergent (acteurs: ${sexeToInsert}, existant: ${targetIndividu.sexe})`);
      }

      for (const acteurId of selectedActeurs) {
        const existingIndividuId = acteurToIndividuMap.get(acteurId);
        if (existingIndividuId && existingIndividuId !== targetIndividuId) {
          // Supprimer le lien existant
          await supabase
            .from('rebond_individus_mapping')
            .delete()
            .match({ acteur_id: acteurId, id: existingIndividuId });
        }

        // Insérer si nécessaire
        if (!existingIndividuId || existingIndividuId !== targetIndividuId) {
          mappingInserts.push({ id: targetIndividuId, acteur_id: acteurId });
        }
      }

      individuIdsToUpdate.add(targetIndividuId);
    }

    else {
      // Règle 3 : plusieurs individus à fusionner
      await supabase.from('rebond_individus').insert([{ id: newIndividuId, sexe: sexeToInsert }]);

      for (const acteurId of selectedActeurs) {
        const currentIndividuId = acteurToIndividuMap.get(acteurId);
        if (currentIndividuId && !selectedIndividus.includes(currentIndividuId)) {
          // Ne pas supprimer des mappings hors sélection
          throw new Error(`L'acteur ${acteurId} est lié à un individu non sélectionné (${currentIndividuId}).`);
        }

        if (currentIndividuId) {
          await supabase
            .from('rebond_individus_mapping')
            .delete()
            .match({ acteur_id: acteurId, id: currentIndividuId });
        }

        mappingInserts.push({ id: newIndividuId, acteur_id: acteurId });
      }

      individuIdsToUpdate.add(newIndividuId);
    }

    // Insertion des nouveaux liens
    if (mappingInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('rebond_individus_mapping')
        .upsert(mappingInserts, { onConflict: 'acteur_id' });

      if (insertError) throw insertError;
    }

    // Mise à jour ciblée des identités
    for (const individuId of individuIdsToUpdate) {
      await updateIndividuIdentiteByIndividuId(individuId);
      await updateIndividuNaissanceDeces(individuId);
    }

    return { success: true };
  } catch (e: any) {
    console.error('[Fusion Acteurs]', e);
    return { success: false, errorMessage: e.message };
  }
}


export async function deleteActeurIndividuRelation(
  acteurId: string | undefined | null,
  individuId: string | undefined | null,
) {
  if (!acteurId || !individuId) {
    return { success: false, errorMessage: 'Il faut fournir un acteur ET un individu.' };
  }

  try {
    // 1. Supprimer la relation dans rebond_individus_mapping
    const { error: deleteError } = await supabase
      .from('rebond_individus_mapping')
      .delete()
      .match({ acteur_id: acteurId, id: individuId });

    if (deleteError) throw deleteError;

    // 2. Mettre à jour l'identité de l'individu
    await updateIndividuIdentiteByIndividuId(individuId);
    await updateIndividuNaissanceDeces(individuId);

    return { success: true };
  } catch (e: any) {
    console.error('[deleteActeurIndividuRelation]', e);
    return { success: false, errorMessage: e.message };
  }
}


export async function updateIndividuNaissanceDeces(individuId: string) {
  // Étape 1 : récupérer les acteur_id liés à l'individu
  const { data } = await supabase.from('v_acteurs_enrichis').select('*').eq('individu_id', individuId);
  const acteurs = data;

  if (!acteurs || acteurs.length === 0) return;

  // Étape 2 : calcul et mise à jour
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
