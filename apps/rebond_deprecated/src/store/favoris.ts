import { create } from "zustand"
import { supabase } from "@/lib/supabase"

const GENIIUS_JO_ID = "dc881d88-e4c0-4eee-becd-d1fd0c005197"

interface FavorisStore {
  // Notaires
  notaireFavorisIds: string[]
  fetchNotaireFavoris: () => Promise<void>
  isNotaireFavori: (idNotaire: string) => boolean
  ajouterNotaireFavori: (idNotaire: string) => Promise<void>
  retirerNotaireFavori: (idNotaire: string) => Promise<void>

  // Actes
  acteFavorisIds: string[]
  fetchActeFavoris: () => Promise<void>
  isActeFavori: (idActe: string) => boolean
  ajouterActeFavori: (idActe: string) => Promise<void>
  retirerActeFavori: (idActe: string) => Promise<void>
}

export const useFavorisStore = create<FavorisStore>((set, get) => ({
  // --- NOTAIRES ---
  notaireFavorisIds: [],

  fetchNotaireFavoris: async () => {
    const { data, error } = await supabase
      .from("utilisateur_notaires_favoris")
      .select("id_notaire")
      .eq("id_utilisateur", GENIIUS_JO_ID)

    if (!error && data) {
      set({ notaireFavorisIds: data.map((row) => row.id_notaire) })
    }
  },

  isNotaireFavori: (idNotaire) => {
    return get().notaireFavorisIds.includes(idNotaire)
  },

  ajouterNotaireFavori: async (idNotaire) => {
    const { error } = await supabase
      .from("utilisateur_notaires_favoris")
      .insert({ id_utilisateur: GENIIUS_JO_ID, id_notaire: idNotaire })

    if (!error) {
      set((state) => ({
        notaireFavorisIds: [...state.notaireFavorisIds, idNotaire],
      }))
    }
  },

  retirerNotaireFavori: async (idNotaire) => {
    const { error } = await supabase
      .from("utilisateur_notaires_favoris")
      .delete()
      .eq("id_utilisateur", GENIIUS_JO_ID)
      .eq("id_notaire", idNotaire)

    if (!error) {
      set((state) => ({
        notaireFavorisIds: state.notaireFavorisIds.filter((id) => id !== idNotaire),
      }))
    }
  },

  // --- ACTES ---
  acteFavorisIds: [],

  fetchActeFavoris: async () => {
    const { data, error } = await supabase
      .from("utilisateur_actes_favoris")
      .select("id_acte")
      .eq("id_utilisateur", GENIIUS_JO_ID)

    if (!error && data) {
      set({ acteFavorisIds: data.map((row) => row.id_acte) })
    }
  },

  isActeFavori: (idActe) => {
    return get().acteFavorisIds.includes(idActe)
  },

  ajouterActeFavori: async (idActe) => {
    const { error } = await supabase
      .from("utilisateur_actes_favoris")
      .insert({ id_utilisateur: GENIIUS_JO_ID, id_acte: idActe })

    if (!error) {
      set((state) => ({
        acteFavorisIds: [...state.acteFavorisIds, idActe],
      }))
    }
  },

  retirerActeFavori: async (idActe) => {
    const { error } = await supabase
      .from("utilisateur_actes_favoris")
      .delete()
      .eq("id_utilisateur", GENIIUS_JO_ID)
      .eq("id_acte", idActe)

    if (!error) {
      set((state) => ({
        acteFavorisIds: state.acteFavorisIds.filter((id) => id !== idActe),
      }))
    }
  },
}))
