// lib/detectLieuxPreview.ts
import { supabase } from '@/lib/supabase';
import type { LieuPreview } from '@/types/lieux';

export function parseLieuTexte(
  fonction: string,
  texte: string,
  precisions: string | null
): Omit<LieuPreview, 'acteur_id' | 'individu_id' | 'fonction'> {
  let section: string | null = null;
  let commune: string | null = null;
  let propriete: string | null = null;
  let numero: string | null = null;

  if (!texte || typeof texte !== 'string') {
    return {
      texte_brut: texte ?? '',
      commune: null,
      section: null,
      propriete: null,
      maison: null,
      precisions: null,
      numero: null,
    };
  }

  let texteNettoye = texte.trim();

   // ✅ Extraire et supprimer parenthèses du texte_brut
  const matchNumeroTexte = texteNettoye.match(/\(([^)]+)\)/);
  if (matchNumeroTexte) {
    numero = matchNumeroTexte[1].trim();
    texteNettoye = texteNettoye.replace(matchNumeroTexte[0], '').trim();
  }

  // Étape 1 : séparer à la virgule
  const [avantVirgule, apresVirgule] = texteNettoye.split(',').map(s => s.trim());
  propriete = apresVirgule || null;

  // Étape 2 : séparer à " - " pour section / commune
  if (avantVirgule.includes(' - ')) {
    const [sec, com] = avantVirgule.split(' - ').map(s => s.trim());
    section = sec || null;
    commune = com || null;
  } else {
    commune = avantVirgule || null;
  }

  const maison = precisions?.includes('maison') ? precisions : null;

  return {
    texte_brut: texte.trim(),
    commune,
    section,
    propriete,
    maison,
    precisions: maison ? precisions : null,
    numero
  };
}


export async function detectLieuxPreview(): Promise<LieuPreview[]> {
  const pageSize = 1000;
  let page = 0;
  let allData: any[] = [];
  let finished = false;

  // 1. Récupération paginée de tous les acteurs
  while (!finished) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('transcription_entites_acteurs')
      .select(`
        id,
        naissance_lieux, naissance_lieu_précisions,
        deces_lieux, deces_lieu_précisions,
        domicile, origine
      `)
      .range(from, to);

    if (error) throw error;

    if (!data || data.length < pageSize) {
      finished = true;
    }

    allData = allData.concat(data);
    page++;
  }

  // 2. Parsing des lieux en LieuPreview[]
  const previews: LieuPreview[] = [];

  for (const acteur of allData) {
    const { id, individuId } = acteur;

    if (acteur.naissance_lieux) {
      previews.push({
        acteur_id: id,
        individu_id: individuId,
        fonction: 'naissance',
        ...parseLieuTexte('naissance', acteur.naissance_lieux, acteur.naissance_lieu_précisions),
      });
    }

    if (acteur.deces_lieux) {
      previews.push({
        acteur_id: id,
        individu_id: individuId,
        fonction: 'deces',
        ...parseLieuTexte('deces', acteur.deces_lieux, acteur.deces_lieu_précisions),
      });
    }

    if (acteur.domicile) {
      previews.push({
        acteur_id: id,
        individu_id: individuId,
        fonction: 'domicile',
        ...parseLieuTexte('domicile', acteur.domicile, null),
      });
    }

    if (acteur.origine) {
      previews.push({
        acteur_id: id,
        individu_id: individuId,
        fonction: 'origine',
        ...parseLieuTexte('origine', acteur.origine, null),
      });
    }
  }

  return previews;
}

export type LieuBrut = {
  texte_brut: string;
};

export async function detectLieuxBruts(): Promise<LieuBrut[]> {
  const { data, error } = await supabase.rpc('get_lieux_bruts_uniques');
  if (error) throw error;
  return data ?? [];
}