// store/useIndividuStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Individu } from '@/types/individu';
import type { ActeurEnrichiFields } from '@/types/analyse';
import { enrichirDateNaissanceEstimee, enrichirLien } from '@/lib/enrichirActeur';

type IndividuStore = {
  loading: boolean;
  enrichissementEnCoursLienEnrichi: boolean;
  individu: Individu | null;
  individus: Individu[];
  acteurs: ActeurEnrichiFields[];
  fetchIndividus: () => Promise<void>;
  fetchIndividuById: (acteurId: string) => Promise<string | null>;
  fetchActeurs: () => Promise<void>;
  fetchActeFromActeur: (acteurId: string) => Promise<any>;
};

export const useIndividuStore = create<IndividuStore>((set) => ({
  loading: false,
  individu: null,
  individus: [],
  acteurs: [],
  enrichissementEnCoursLienEnrichi: true,
  fetchIndividus: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('rebond_individus').select('*');
    if (error) {
      console.error('Erreur de chargement des individus:', error);
      set({ individus: [], loading: false });
    } else {
      set({ individus: data, loading: false });
    }
  },
  fetchIndividuById: async (acteurId: string): Promise<string | null> => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('rebond_individus_mapping')
      .select('id')
      .eq('acteur_id', acteurId)
      .single();


    if (error) {
      console.warn('Individu non trouvé pour acteur', acteurId, error.message);
      return null;
    }
    return data.id;
  },
  fetchActeurs: async () => {
    const start = performance.now();
    set({ loading: true });

    const pageSize = 1000;
    let page = 0;
    let all: ActeurEnrichiFields[] = [];
    let done = false;

    while (!done) {
      const { data, error } = await supabase
        .from('v_acteurs_enrichis')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error('❌ Erreur chargement page', page, ':', error);
        set({ acteurs: [], loading: false });
        return;
      }

      if (data) {
        all = all.concat(data);
        done = data.length < pageSize;
        page++;
      } else {
        done = true;
      }
    }

    // enrichissement local pour date_naissance_estimee
    const enrichisSansLien = all.map((acteur) => ({
      ...acteur,
      date_naissance_estimee: enrichirDateNaissanceEstimee(acteur),
      lien_enrichi: '', // temporairement vide
    }));

    const endLoad = performance.now();
    console.log(
      `✅ Chargement complet des ${enrichisSansLien.length} acteurs en ${Math.round(endLoad - start)} ms`,
    );

    set({ acteurs: enrichisSansLien, loading: false, enrichissementEnCoursLienEnrichi: true });

    // Fonction interne : enrichissement des liens
    const enrichirLiensPostChargement = (acteurs: ActeurEnrichiFields[]) => {
      console.log('⏳ Début enrichissement des liens...');
      const startEnrichissement = performance.now();

      const acteursParActe = acteurs.reduce((acc, acteur) => {
        const acteId = acteur.acte_id;
        if (!acteId) return acc; // ignore si pas de acte_id

        if (!acc[acteId]) acc[acteId] = [];
        acc[acteId].push(acteur);
        return acc;
      }, {} as Record<string, ActeurEnrichiFields[]>);

      const enrichis = acteurs.map((acteur) => {
        const acteursDuMemeActe = acteur.acte_id ? acteursParActe[acteur.acte_id] ?? [] : [];
        return {
          ...acteur,
          lien_enrichi: enrichirLien(acteur, acteursDuMemeActe),
        };
      });

      const endEnrichissement = performance.now();
      console.log(`✅ Lien enrichi pour ${enrichis.length} acteurs en ${Math.round(endEnrichissement - startEnrichissement)} ms`);

      set({ acteurs: [...enrichis], enrichissementEnCoursLienEnrichi: false });
    };

    // Lancement différé pour ne pas bloquer l'interface
    setTimeout(() => enrichirLiensPostChargement(enrichisSansLien), 0);
  },


  fetchActeFromActeur: async (acteurId: string) => {
    // 1. Trouver l'entité liée à l'acteur via le mapping
    const { data: mappings, error: mappingError } = await supabase
      .from('transcription_entites_mapping')
      .select('entite_id')
      .eq('cible_id', acteurId)
      .eq('cible_type', 'etat_civil_actes');

    if (mappingError || !mappings?.length) {
      console.error('Erreur dans la récupération du mapping', mappingError);
      return null;
    }

    const entiteId = mappings[0].entite_id;

    // 2. Récupérer l'entité pour connaître l’acte_id et la source_table
    const { data: entite, error: entiteError } = await supabase
      .from('transcription_entites')
      .select('acte_id, source_table')
      .eq('id', entiteId)
      .eq('type', 'acteur')
      .single();

    if (entiteError || !entite) {
      console.error("Erreur dans la récupération de l'entité", entiteError);
      return null;
    }

    const { acte_id, source_table } = entite;

    // 3. Aller chercher l'acte dans la bonne table
    const { data: acte, error: acteError } = await supabase
      .from(source_table) // soit "etat_civil_actes", soit "actes"
      .select('*')
      .eq('id', acte_id)
      .single();

    if (acteError) {
      console.error(`Erreur récupération acte depuis ${source_table}`, acteError);
      return null;
    }

    return acte;
  }
}));
