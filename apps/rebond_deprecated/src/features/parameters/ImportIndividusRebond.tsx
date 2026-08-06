// pages/admin/ImportIndividusRebond.tsx

import { useState } from 'react';
import { read, utils } from 'xlsx';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type ActeurMapping = {
  cible_id: string;
  acteur: {
    id: string;
    role: string;
    multi: string | null;
  } | null;
};

export default function ImportIndividusRebond() {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      const lignes = rows.slice(1)
        .map((row) => row[0])
        .filter((val): val is string => typeof val === 'string' && val.trim() !== '');

      const insertions: { id: string; acteur_id: string }[] = [];

      console.log(`🟡 Début du traitement de ${lignes.length} lignes`);

      for (let index = 0; index < lignes.length; index++) {
        const ligne = lignes[index];
        const fragments = ligne.split(';');
        const individuId = uuidv4();

        console.log(`➡️ Ligne ${index + 1}/${lignes.length} | ID: ${individuId}`);
        console.log(`   Fragments :`, fragments);

        for (const fragment of fragments) {
          const [annee, type, numeroEtMulti, role] = fragment.split('_');
          const [numero, multi] = numeroEtMulti.split(':');

          //console.log(`   🔍 Recherche acteur pour ${fragment}...`);

          const acteur = await findActeurId(supabase, {
            annee,
            type,
            numero,
            multi: multi ?? null,
            role,
          });

          const acteurId = acteur?.id;

          if (acteurId) {
            const key = `${individuId}_${acteurId}`;
            const alreadyExists = insertions.some(item => `${item.id}_${item.acteur_id}` === key);
          
            if (!alreadyExists) {
              //console.log(`   ✅ Acteur trouvé : ${acteur.nom} ${acteur.prenom} (${acteurId})`);
              insertions.push({
                id: individuId,
                acteur_id: acteurId,
              });
            } else {
              //console.log(`   ⚠️ Doublon ignoré pour ${acteur.nom} ${acteur.prenom} (${acteurId})`);
            }
          } else {
            console.warn(`   ❌ Acteur non trouvé pour ${fragment}`);
          }          
        }
      }

      console.log(`📦 Insertion en base de ${insertions.length} relations rebond_individus_mapping...`);
      const batchSize = 100;
      for (let i = 0; i < insertions.length; i += batchSize) {
        const batch = insertions.slice(i, i + batchSize);
        const { error } = await supabase.from('rebond_individus_mapping').insert(batch);
        if (error) {
          console.error(`❌ Insertion échouée pour batch ${i / batchSize + 1}`, error);
          toast.error('Erreur lors de l’insertion en BD');
          throw error;
        }
        console.log(`✅ Batch ${i / batchSize + 1} inséré (${batch.length} éléments)`);
      }

      toast.success('Importation réussie !');
      console.log('🎉 Terminé. Données insérées :', insertions);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-6 space-y-4'>
      <h1 className='text-xl font-bold'>Import des individus Rebond</h1>
      <input type='file' accept='.xlsx' onChange={handleFileUpload} disabled={loading} />
      {loading && <p className='text-muted-foreground'>Import en cours…</p>}
    </div>
  );
}

async function findActeurId(
  supabase: SupabaseClient,
  individu: {
    annee: string;
    type: string;
    numero: string;
    multi: string | null;
    role: string;
  }
): Promise<any | null> {
  const { annee, type, numero, multi, role } = individu;

  const typeMap: Record<string, string> = {
    N: 'naissance',
    M: 'mariage',
    LM: 'mariage',
    D: 'décès',
    R: 'reconnaissance',
    A: 'affranchissement'
  };

  const mappedType = typeMap[type];
  if (!mappedType) return null;

  const { data: acte, error: acteError } = await supabase
    .from('etat_civil_actes')
    .select('id')
    .eq('annee', parseInt(annee, 10))
    .eq('type_acte', mappedType)
    .eq('numero_acte', numero)
    .maybeSingle();

  if (acteError || !acte) return null;
  const acteId = acte.id;

  const { data: entites, error: entiteError } = await supabase
    .from('transcription_entites')
    .select('id')
    .eq('acte_id', acteId)
    .eq('type', 'acteur')
    .eq('source_table', 'etat_civil_actes');

  if (entiteError || !entites || entites.length === 0) return null;

  const entiteIds = entites.map((e) => e.id);

  const { data, error } = await supabase
    .from('transcription_entites_mapping')
    .select('cible_id, acteur:transcription_entites_acteurs(id, nom, prenom, role, multi)')
    .in('entite_id', entiteIds);

  if (error || !data) return null;

  const acteurs = (data ?? []).map((item) => ({
    cible_id: item.cible_id,
    acteur: Array.isArray(item.acteur) ? item.acteur[0] : item.acteur,
  })) as ActeurMapping[];

  const shouldUseMulti =
    (mappedType === 'naissance' && role === 'enfant') ||
    (mappedType === 'reconnaissance' && role === 'sujet') ||
    (mappedType === 'affranchissement' && role === 'sujet') ||
    (mappedType === 'mariage' && role === 'enfant légitimé');

  const cible = acteurs.find((a) => {
    const matchRole = normalizeRole(a.acteur?.role.replace(' légitimé', "")) === normalizeRole(role);
    const matchMulti = shouldUseMulti
      ? (multi === null ? a.acteur?.multi === null : a.acteur?.multi === multi)
      : true;
    return matchRole && matchMulti;
  });

  return cible?.acteur || null;
}

function normalizeRole(input?: string | null): string {
  if (!input) return '';

  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ /g, '')
    .replace(/-([a-zA-Z])/g, (_, p1) => p1.toUpperCase());
}
