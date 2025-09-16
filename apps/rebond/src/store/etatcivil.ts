// @/store/etatcivil.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { EtatCivilBureau, EtatCivilRegistre } from '@/types/etatcivil';

type BureauStats = {
  estimes: number;
  nb_registres: number;
  releves: number;
  transcrits: number;
};

type EtatCivilStore = {
  bureaux: EtatCivilBureau[];
  loading: boolean;
  fetchBureaux: () => Promise<void>;
  fetchBureau: (id: string) => Promise<EtatCivilBureau | undefined>;
  fetchRegistre: (id: string) => Promise<EtatCivilRegistre | undefined>;
};

export const useEtatCivilStore = create<EtatCivilStore>((set) => ({
  bureaux: [],
  loading: false,

  fetchBureaux: async () => {
    set({ loading: true });

    const { data: rawBureaux, error: errorBureaux } = await supabase
      .from('etat_civil_bureaux')
      .select('id, nom, commune, departement, region');

    if (!rawBureaux || errorBureaux) {
      console.error('Erreur chargement bureaux :', errorBureaux?.message);
      set({ loading: false });
      return;
    }

    const { data: stats, error: errorStats } = await supabase.rpc('get_bureau_stats');

    if (!stats || errorStats) {
      console.error('Erreur RPC get_bureau_stats :', errorStats?.message);
      set({ loading: false });
      return;
    }

    const statsMap = new Map<string, BureauStats>();
    for (const row of stats) {
      statsMap.set(row.bureau_id, {
        estimes: row.estimes ?? 0,
        nb_registres: row.nb_registres ?? 0,
        releves: row.releves ?? 0,
        transcrits: row.transcrits ?? 0,
      });
    }

    const bureaux: EtatCivilBureau[] = rawBureaux.map((b) => {
      const stat = statsMap.get(b.id) ?? {
        estimes: 0,
        nb_registres: 0,
        releves: 0,
        transcrits: 0,
      };

      return {
        id: b.id,
        nom: b.nom,
        commune: b.commune,
        departement: b.departement ?? '',
        region: b.region ?? '',
        actes_estimes: stat.estimes,
        actes_releves: stat.releves,
        actes_a_relever: stat.estimes - stat.releves,
        actes_transcrits: stat.transcrits,
        actes_a_transcrire: stat.releves - stat.transcrits,
      };
    });

    set({ bureaux, loading: false });
  },

  fetchBureau: async (id: string): Promise<EtatCivilBureau | undefined> => {
    set({ loading: true });

    const { data, error } = await supabase
      .from('etat_civil_bureaux')
      .select('id, nom, commune, departement, region')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Erreur fetchBureau :', error?.message);
      set({ loading: false });
      return undefined;
    }

    const { data: stat, error: errorStat } = await supabase
      .rpc('get_bureau_stats')
      .eq('bureau_id', id);

    if (errorStat || !stat || !stat[0]) {
      console.error('Erreur RPC stats pour bureau :', errorStat?.message);
      set({ loading: false });
      return undefined;
    }

    const { data: registres, error: errorRegistres } = await supabase
      .from('etat_civil_registres')
      .select(
        `
    id,
    annee,
    type_acte,
    mode_registre,
    statut_juridique,
    nombre_actes_estime,
    complet,
    actes:etat_civil_actes(
      id,
      statut
    )
  `,
      )
      .eq('bureau_id', id)
      .order('annee', { ascending: true });

    if (errorRegistres) {
      console.error('Erreur chargement registres :', errorRegistres.message);
    }

    const registresMapped: EtatCivilRegistre[] = (registres ?? []).map((r) => {
      const actes = r.actes ?? [];
      const releves = actes.length;
      const transcrits = actes.filter((a: any) => a.statut === 'transcrit').length;

      return {
        id: r.id,
        annee: r.annee,
        type_acte: r.type_acte,
        statut_juridique: r.statut_juridique,
        mode_registre: r.mode_registre,
        actes_estimes: r.nombre_actes_estime,
        complet: r.complet,
        actes_releves: releves,
        actes_a_relever: r.nombre_actes_estime - releves,
        actes_transcrits: transcrits,
        actes_a_transcrire: releves - transcrits,
      };
    });

    const bureau: EtatCivilBureau = {
      id: data.id,
      nom: data.nom,
      commune: data.commune,
      departement: data.departement ?? '',
      region: data.region ?? '',
      actes_estimes: stat[0].estimes ?? 0,
      actes_releves: stat[0].releves ?? 0,
      actes_a_relever: (stat[0].estimes ?? 0) - (stat[0].releves ?? 0),
      actes_transcrits: stat[0].transcrits ?? 0,
      actes_a_transcrire: (stat[0].releves ?? 0) - (stat[0].transcrits ?? 0),
      registres: registresMapped ?? [],
    };

    set((s) => ({
      bureaux: [...s.bureaux.filter((b) => b.id !== id), bureau],
      loading: false,
    }));

    return bureau;
  },

  fetchRegistre: async (id: string): Promise<EtatCivilRegistre | undefined> => {
    set({ loading: true });
  
    const { data, error } = await supabase
      .from('etat_civil_registres')
      .select(
        `
        id,
        bureau_id,
        annee,
        type_acte,
        statut_juridique,
        mode_registre,
        nombre_actes_estime,
        complet,
        actes:etat_civil_actes (
          id, bureau_id, registre_id, date, heure, annee, source, type_acte, numero_acte, comparution_mairie, label, statut, transcription
        )
      `
      )
      .eq('id', id)
      .single();
  
    if (error || !data) {
      console.error('Erreur fetchRegistre :', error?.message);
      set({ loading: false });
      return undefined;
    }
  
    const actes = data.actes ?? [];
    const releves = actes.length;
    const transcrits = actes.filter((a: any) => a.statut === 'transcrit').length;
  
    const registre: EtatCivilRegistre = {
      id: data.id,
      annee: data.annee,
      type_acte: data.type_acte,
      statut_juridique: data.statut_juridique,
      mode_registre: data.mode_registre,
      actes_estimes: data.nombre_actes_estime,
      complet: data.complet,
      actes_releves: releves,
      actes_a_relever: data.nombre_actes_estime - releves,
      actes_transcrits: transcrits,
      actes_a_transcrire: releves - transcrits,
      actes: actes,
    };
  
    set(() => ({
      loading: false,
    }));
  
    return registre;
  },
  
}));
