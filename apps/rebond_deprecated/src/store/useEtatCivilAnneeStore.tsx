// @/store/useEtatCivilAnneesStore.ts

import { create } from "zustand"
import type { EtatCivilAnnee } from "@/types/etatcivil"

interface EtatCivilAnneesStore {
  annees: EtatCivilAnnee[]
  loading: boolean
  error: string | null

  fetchAnnees: (bureauId: string) => Promise<void>
  addAnnee: (bureauId: string, annee: number, nombre_actes?: number) => Promise<void>
  updateAnnee: (id: string, data: Partial<EtatCivilAnneesStore>) => Promise<void>
  deleteAnnee: (id: string) => Promise<void>
}

export const useEtatCivilAnneesStore = create<EtatCivilAnneesStore>((set) => ({
  annees: [],
  loading: false,
  error: null,

  fetchAnnees: async (bureauId) => {
    set({ loading: true, error: null })

    // 🔁 Mock de données selon la bureau
    const mock: Record<string, EtatCivilAnnee[]> = {
      "1": [
        { id: "1a", bureau_id: "1", annee: 1893, nombre_actes: 47, nb_actes_releves: 23 },
        { id: "1b", bureau_id: "1", annee: 1894, nombre_actes: 56, nb_actes_releves: 38 },
        { id: "1c", bureau_id: "1", annee: 1895, nombre_actes: 27, nb_actes_releves: 15 },
      ],
      "2": [
        { id: "2a", bureau_id: "2", annee: 1881, nombre_actes: 38, nb_actes_releves: 8 },
        { id: "2b", bureau_id: "2", annee: 1882, nombre_actes: 37, nb_actes_releves: 12 },
      ],
    }

    const annees = mock[bureauId] || []
    set({ annees, loading: false })
  },

  addAnnee: async (bureauId, annee, nombre_actes) => {
    const id = `${bureauId}-${annee}`
    const nouvelleAnnee: EtatCivilAnnee = {
      id,
      bureau_id: bureauId,
      annee,
      nombre_actes,
      nb_actes_releves: 0,
    }

    set((state) => ({
      annees: [...state.annees, nouvelleAnnee],
    }))
  },

  updateAnnee: async (id, data) => {
    set((state) => ({
      annees: state.annees.map((a) => (a.id === id ? { ...a, ...data } : a)),
    }))
  },

  deleteAnnee: async (id) => {
    set((state) => ({
      annees: state.annees.filter((a) => a.id !== id),
    }))
  },
}))
