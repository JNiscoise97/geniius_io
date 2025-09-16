import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { NotaireRegistre } from "@/types/acte" // ou "@/types/notaire"

interface NotaireRegistreStore {
  registres: NotaireRegistre[]
  loading: boolean
  error: string | null

  fetchRegistres: (notaireId: string) => Promise<void>
  addRegistre: (notaireId: string, registre: number, nombre_actes?: number) => Promise<void>
  updateRegistre: (id: string, data: Partial<NotaireRegistre>) => Promise<void>
  deleteRegistre: (id: string) => Promise<void>
  fetchRegistre: (id: string) => Promise<NotaireRegistre | undefined>;
}

export const useNotaireRegistreStore = create<NotaireRegistreStore>((set) => ({
  registres: [],
  loading: false,
  error: null,

  fetchRegistres: async (notaireId: string) => {
    set({ loading: true, error: null })
  
    // Étape 1 : Récupérer les années d’exercice déclarées
    const { data: registres, error: errorRegistres } = await supabase
      .from("notaire_registres")
      .select("*")
      .eq("notaire_id", notaireId)
  
    if (errorRegistres || !registres) {
      set({ error: errorRegistres?.message ?? "Erreur notaire_registres", loading: false })
      return
    }
  
    // Étape 2 : Récupérer les actes via la vue
    const { data: actes, error: errorActes } = await supabase
      .from("actes_par_notaire")
      .select("acte_id, date")
      .eq("notaire_id", notaireId)
  
    if (errorActes || !actes) {
      set({ error: errorActes?.message ?? "Erreur actes_par_notaire", loading: false })
      return
    }
  
    // Étape 3 : Regrouper les actes par année
    const actesParRegistre: Record<number, number> = {}
  
    for (const acte of actes) {
      const exact = acte.date?.exact
      const year = exact?.slice(0, 4)
      if (year && /^\d{4}$/.test(year)) {
        const n = parseInt(year)
        actesParRegistre[n] = (actesParRegistre[n] ?? 0) + 1
      }
    }
  
    // Étape 4 : Fusionner les résultats
    const completed = registres.map(an => ({
      ...an,
      nb_actes_releves: actesParRegistre[an.registre] ?? 0
    }))
  
    set({ registres: completed, loading: false })
  },

  addRegistre: async (notaireId, registre, nombre_actes) => {
    const { data, error } = await supabase
      .from("notaire_registres")
      .insert([{ notaire_id: notaireId, registre, nombre_actes }])
      .select()
      .single()

    if (error || !data) {
      console.error("Erreur insertion année :", error?.message)
      return
    }

    set((state) => ({ registres: [...state.registres, data as NotaireRegistre] }))
  },

  updateRegistre: async (id, data) => {
    const { error } = await supabase
      .from("notaire_registres")
      .update(data)
      .eq("id", id)

    if (error) {
      console.error("Erreur mise à jour année :", error.message)
      return
    }

    set((state) => ({
      registres: state.registres.map((a) => (a.id === id ? { ...a, ...data } : a)),
    }))
  },

  deleteRegistre: async (id) => {
    const { error } = await supabase
      .from("notaire_registres")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erreur suppression année :", error.message)
      return
    }

    set((state) => ({
      registres: state.registres.filter((a) => a.id !== id),
    }))
  },

  fetchRegistre: async (id: string): Promise<NotaireRegistre | undefined> => {
  set({ loading: true });

  const { data, error } = await supabase
    .from('notaire_registres')
    .select(
      `
      id,
      notaire_id,
      annee,
      nombre_actes,
      complet,
      actes:actes (
        id,
        notaire_registre_id,
        type_operation,
        numero_acte,
        label,
        statut,
        seances(date)
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

  const actes = (data.actes ?? []).map((acte: any) => {
    const dates = acte.seances
      ?.map((s: any) => s.date?.exact)
      .filter((d: string | undefined) => !!d && typeof d === 'string');

    const firstDate = dates?.sort((a:any, b:any) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

    return {
      ...acte,
      date: firstDate, // ajout de la date ISO la plus ancienne
    };
  });

  const releves = actes.length;
  const transcrits = actes.filter((a: any) => a.statut === 'transcrit').length;

  const registre: NotaireRegistre = {
    id: data.id,
    annee: data.annee,
    actes_estimes: data.nombre_actes,
    complet: data.complet,
    actes_releves: releves,
    actes_a_relever: data.nombre_actes - releves,
    actes_transcrits: transcrits,
    actes_a_transcrire: releves - transcrits,
    actes,
  };

  set({ loading: false });
  return registre;
},
}))
