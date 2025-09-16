import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { Notaire, NotaireRegistre } from "@/types/acte"

interface NotaireStore {
  notaires: Notaire[]
  loading: boolean
  selected: Notaire | null
  error: string | null
  fetchNotaires: () => Promise<void>
  fetchOne: (id: string) => Promise<Notaire | null>
  addNotaire: (data: Omit<Notaire, "id">) => Promise<void>
  updateNotaire: (id: string, data: Partial<Notaire>) => Promise<void>
  deleteNotaire: (id: string) => Promise<void>
}

export const useNotaireStore = create<NotaireStore>((set, get) => ({
  notaires: [],
  loading: false,
  selected: null,

  fetchOne: async (id: string): Promise<Notaire | null> => {
    set({ loading: true, error: null });

    try {
      const { data: notaire, error: errorNotaire } = await supabase
        .from("notaires")
        .select("*")
        .eq("id", id)
        .single();

      if (errorNotaire || !notaire) {
        throw new Error(errorNotaire?.message || "Notaire introuvable");
      }

      const { data: registres, error: errorRegistres } = await supabase
        .from("notaire_registres")
        .select(
          `
    id,
    annee,
    nombre_actes,
    complet,
    actes:actes(
      id,
      statut
    )
  `,
        )
        .eq("notaire_id", id)
        .order('annee', { ascending: true });

      if (errorRegistres || !registres) {
        throw new Error(errorRegistres?.message || "Erreur lors du chargement des registres");
      }

      const registresMapped: NotaireRegistre[] = (registres ?? []).map((r) => {
        const actes = r.actes ?? [];
        const releves = actes.length;
        const transcrits = actes.filter((a: any) => a.statut === 'transcrit').length;

        return {
          id: r.id,
          annee: r.annee,
          actes_estimes: r.nombre_actes,
          complet: r.complet,
          actes_releves: releves,
          actes_a_relever: r.nombre_actes - releves,
          actes_transcrits: transcrits,
          actes_a_transcrire: releves - transcrits,
        };
      });

      const fullNotaire = { ...notaire, registres: registresMapped };
      set({ selected: fullNotaire, loading: false, error: null });

      return fullNotaire;
    } catch (error) {
      set({ selected: null, error: (error as Error).message, loading: false });
      return null;
    }
  },

  error: null,

  fetchNotaires: async () => {
    set({ loading: true, error: null })

    const { data: notaires, error } = await supabase
      .from("notaires")
      .select("*")
      .order("nom", { ascending: true })

    if (error || !notaires) {
      set({ error: error?.message ?? "Erreur notaires", loading: false })
      return
    }

    const notairesAvecRegistres = await Promise.all(
      notaires.map(async (n) => {
        const { data: registres } = await supabase
          .from("notaire_registres")
          .select("*")
          .eq("notaire_id", n.id)

        return { ...n, registres }
      })
    )

    set({ notaires: notairesAvecRegistres, loading: false })
  }
  ,

  addNotaire: async (notaireData) => {
    const { error } = await supabase.from("notaires").insert([notaireData])
    if (error) {
      console.error("Erreur ajout notaire:", error.message)
      return
    }
    await get().fetchNotaires()
  },

  updateNotaire: async (id, data) => {
    const { error } = await supabase.from("notaires").update(data).eq("id", id)
    if (error) {
      console.error("Erreur update notaire:", error.message)
      return
    }
    await get().fetchNotaires()
  },

  deleteNotaire: async (id) => {
    const { error } = await supabase.from("notaires").delete().eq("id", id)
    if (error) {
      console.error("Erreur suppression notaire:", error.message)
      return
    }
    set((state) => ({
      notaires: state.notaires.filter((n) => n.id !== id),
    }))
  },
}))
