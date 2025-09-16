// useHighlightStore.ts

import type { Entity } from "@/types/analyse"
import { create } from "zustand"

type HighlightState = {
  global: boolean
  categories: Record<string, boolean>
  subcategories: Record<string, boolean>
  entities: Record<string, boolean>
  setGlobal: (val: boolean) => void
  setCategory: (cat: string, val: boolean) => void
  setSubcategory: (sub: string, val: boolean) => void
  setEntity: (id: string, val: boolean) => void
  getEffective: (entityId: string, cat: string, sub: string) => boolean
  setCategoryWithChildren: (
    cat: string,
    val: boolean,
    subcats: string[],
    entities: Entity[],
    categories: { id: string; categorie: string; sous_categorie: string }[]
  ) => void
  setSubcategoryWithChildren: (
    subcat: string,
    val: boolean,
    entities: Entity[],
    categories: { id: string; categorie: string; sous_categorie: string }[]
  ) => void
  ensureParentActive: (
    entityId: string,
    entities: Entity[],
    categories: CategoryMeta[]
  ) => void
  ensureParentOfSubcategoryActive: (
    subcat: string,
    categories: CategoryMeta[]
  ) => void

  // 🆕 contextes internes (hors API publique)
  _entitiesForContext: Entity[]
  _categoriesForContext: CategoryMeta[]
}

type CategoryMeta = {
  id: string
  categorie: string
  sous_categorie: string
}

export const useHighlightStore = create<HighlightState>((set, get) => ({
  global: true,
  categories: {},
  subcategories: {},
  entities: {},

  setGlobal: (val) => set({ global: val }),

  setCategory: (cat, val) => set((s) => ({
    categories: { ...s.categories, [cat]: val },
  })),

  setSubcategory: (sub, val) => {
    set((s) => ({
      subcategories: { ...s.subcategories, [sub]: val },
    }))
  },

  setEntity: (id, val) => {
    set((s) => ({
      entities: { ...s.entities, [id]: val },
    }))

    if (val) {
      const entities = useHighlightStore.getState()._entitiesForContext || []
      const categories = useHighlightStore.getState()._categoriesForContext || []
      get().ensureParentActive(id, entities, categories)
    }
  },

  getEffective: (entityId, cat, sub) => {
    const { global, categories, subcategories, entities } = get()
    return (
      global &&
      (categories[cat] ?? true) &&
      (subcategories[sub] ?? true) &&
      (entities[entityId] ?? true)
    )
  },

  setCategoryWithChildren: (cat, val, subcats, entities, categories) => {
    // stocke les contextes à usage interne
    useHighlightStore.setState({
      _entitiesForContext: entities,
      _categoriesForContext: categories,
    })

    set((state) => {
      const updatedSub = { ...state.subcategories }
      const updatedEnt = { ...state.entities }

      subcats.forEach((sub) => {
        updatedSub[sub] = val
      })

      entities.forEach((ent) => {
        const meta = categories.find((c) => c.id === ent.categorie_id)
        if (meta?.categorie === cat) {
          updatedEnt[ent.id!] = val
        }
      })

      return {
        categories: { ...state.categories, [cat]: val },
        subcategories: updatedSub,
        entities: updatedEnt,
      }
    })
  },

  setSubcategoryWithChildren: (subcat, val, entities, categories) => {
    // stocke les contextes à usage interne
    useHighlightStore.setState({
      _entitiesForContext: entities,
      _categoriesForContext: categories,
    })

    set((state) => {
      const updatedEnt = { ...state.entities }

      entities.forEach((ent) => {
        const meta = categories.find((c) => c.id === ent.categorie_id)
        if (meta?.sous_categorie === subcat) {
          updatedEnt[ent.id!] = val
        }
      })

      return {
        subcategories: { ...state.subcategories, [subcat]: val },
        entities: updatedEnt,
      }
    })

    if (val) {
      get().ensureParentOfSubcategoryActive(subcat, categories)
    }
  },

  ensureParentActive: (entityId, entities, categories) => {
    const ent = entities.find((e) => e.id === entityId)
    if (!ent) return

    const meta = categories.find((c) => c.id === ent.categorie_id)
    if (!meta) return

    const { categorie, sous_categorie } = meta

    set((state) => ({
      categories: { ...state.categories, [categorie]: true },
      subcategories: { ...state.subcategories, [sous_categorie]: true },
    }))
  },

  ensureParentOfSubcategoryActive: (subcat, categories) => {
    const meta = categories.find((c) => c.sous_categorie === subcat)
    if (!meta) return

    const { categorie } = meta

    set((state) => ({
      categories: { ...state.categories, [categorie]: true },
    }))
  },

  // stockage temporaire du contexte (non typé publiquement)
  _entitiesForContext: [],
  _categoriesForContext: [],
}))