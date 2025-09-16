import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { ActeBase, DateHistorique, NotaireRegistre } from "@/types/acte"

interface ActeStore {
  actes: ActeBase[]
  loading: boolean
  error: string | null
  fetchActes: () => Promise<void>
  fetchActeById: (id: string) => Promise<void>
  addActe: (acte: Omit<ActeBase, "id">, notaireId: string, seance: {
    date: DateHistorique
  }) => Promise<void>
  updateActe: (id: string, data: Partial<ActeBase>) => Promise<void>
  deleteActe: (id: string) => Promise<void>
  updateNumeroActe: (acteId: string, numero: string) => Promise<boolean>
}

export const useActeStore = create<ActeStore>((set) => ({
  actes: [],
  loading: false,
  error: null,

  fetchActes: async () => {
    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from("actes")
      .select(`
        *,
        origine_acte,
        notaires:actes_notaires (
          role,
          notaire: notaire_id (
            id,
            nom,
            prenom,
            titre
          )
        ),
        seances (
            id,
            acte_id,
            date,
            lieu
        )
      `)

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      const actes = (data as ActeBase[]).map((acte) => ({
        ...acte,
        seances: acte.seances?.sort((a, b) => {
          const da = a.date?.exact ?? ""
          const db = b.date?.exact ?? ""
          return da.localeCompare(db)
        })
      }))

      set({ actes: actes, loading: false })

    }
  },

  fetchActeById: async (id: string) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase
      .from("actes")
      .select(`
        *,
        notaire_registre: notaire_registre_id (
      id,
      annee,
      nombre_actes,
      complet,
      actes (
        id,
        statut
      )
    ),
    notaires:actes_notaires (
          role,
          notaire: notaire_id (
            id,
            nom,
            prenom,
            titre
          )
        ),
        seances (
          id,
          acte_id,
          date,
          lieu
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    const registreRaw = data.notaire_registre;
    const actes = registreRaw?.actes ?? [];
    const releves = actes.length;
    const transcrits = actes.filter((a: any) => a.statut === "transcrit").length;

    const registre: NotaireRegistre = {
      id: registreRaw?.id,
      annee: registreRaw?.annee,
      actes_estimes: registreRaw?.nombre_actes,
      complet: registreRaw?.complet,
      actes_releves: releves,
      actes_a_relever: registreRaw?.nombre_actes - releves,
      actes_transcrits: transcrits,
      actes_a_transcrire: releves - transcrits,
      actes,
    };


    const acte: ActeBase = {
      ...data,
      registre,
      seances: data.seances?.sort((a: any, b: any) => {
        const da = a.date?.exact ?? "";
        const db = b.date?.exact ?? "";
        return da.localeCompare(db);
      }),
    };

    set((state) => ({
      actes: [...state.actes.filter((a) => a.id !== id), acte],
      loading: false
    }));

  },

  addActe: async (acte, notaireId, seance) => {
    const { data: newActe, error: acteError } = await supabase
      .from("actes")
      .insert([acte])
      .select(`
        *,
        notaires:actes_notaires (
          role,
          notaire: notaire_id (
            id,
            nom,
            prenom,
            titre
          )
        ),
        seances (
            id,
            acte_id,
            date,
            lieu
        )
      `)
      .single()

    if (acteError) {
      console.error("Erreur ajout acte:", acteError.message)
      return
    }

    const acteId = newActe.id

    const { error: liaisonError } = await supabase.from("actes_notaires").insert({
      acte_id: acteId,
      notaire_id: notaireId,
      role: "principal",
    })

    if (liaisonError) {
      console.error("Erreur liaison notaire:", liaisonError.message)
      return
    }

    const { error: seanceError } = await supabase.from("seances").insert({
      acte_id: acteId,
      ...seance,
    })

    if (seanceError) {
      console.error("Erreur ajout séance:", seanceError.message)
      return
    }

    const { data: fullActe, error: fetchError } = await supabase
      .from("actes")
      .select(`
    *,
    notaires:actes_notaires (
        role,
        notaire: notaire_id (
        id, nom, prenom, titre
        )
    ),
    seances (
        date,
        lieu
    )
    `)
      .eq("id", acteId)
      .single()

    if (fetchError) {
      console.error("Erreur récupération acte complet :", fetchError.message)
      return
    }

    set((state) => ({ actes: [...state.actes, fullActe as ActeBase] }))

  },


  updateActe: async (id, data) => {
    const { error } = await supabase.from("actes").update(data).eq("id", id)
    if (error) {
      console.error("Erreur update acte:", error.message)
      return
    }
    set((state) => ({
      actes: state.actes.map((a) => (a.id === id ? { ...a, ...data } : a)),
    }))
  },

  deleteActe: async (id) => {
    const { error } = await supabase.from("actes").delete().eq("id", id)
    if (error) {
      console.error("Erreur suppression acte:", error.message)
      return
    }
    set((state) => ({
      actes: state.actes.filter((a) => a.id !== id),
    }))
  },

  updateNumeroActe: async (acteId: string, numero: string) => {
    const { error } = await supabase
      .from("actes")
      .update({ numero_acte: numero })
      .eq("id", acteId)
      .select()
      .single()

    if (error) {
      console.error("Erreur update numero_acte:", error.message)
      return false
    }

    // Mets à jour localement
    set((state) => ({
      actes: state.actes.map((a) => (a.id === acteId ? { ...a, numero_acte: numero } : a)),
    }))

    return true
  }
}))
export type MentionMarginale = {
  id?: string;
  acte_id: string;
  type_mention:
    | 'mariage' | 'divorce' | 'deces' | 'reconnaissance' | 'reconnaissance-pere' | 'reconnaissance-mere' | 'adoption'
    | 'annulation' | 'rectification' | 'autre' | 'texte_brut';
  date_acte?: string | null;           // 'YYYY-MM-DD'
  lieu_toponyme_id?: string | null;
  lieu_texte?: string | null;
  numero_acte?: string | null;
  acte_id_cible?: string | null;
  texte_brut?: string | null;
  note?: string | null;
  source?: string | null;
};
