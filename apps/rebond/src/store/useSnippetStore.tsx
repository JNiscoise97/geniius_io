// src/store/useSnippetStore.ts

import { create } from "zustand"
import { supabase } from "@/lib/supabase"

export interface Snippet {
  id: string
  clé: string
  valeur: string
}

interface SnippetStore {
  snippets: Snippet[]
  loading: boolean
  error: string | null

  fetchSnippets: () => Promise<void>
}

export const useSnippetStore = create<SnippetStore>((set) => ({
  snippets: [],
  loading: false,
  error: null,

  fetchSnippets: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from("snippets")
      .select("*")
      .order("clé", { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ snippets: data ?? [], loading: false })
    }
  },
}))
