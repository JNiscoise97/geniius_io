// store/useSelectionStore.ts
import { create } from "zustand"

export type TextSelection = {
  blocId: string
  text: string
  start: number
  end: number
}

export const useSelectionStore = create<{
  selection: TextSelection | null
  setSelection: (sel: TextSelection | null) => void
}>((set) => ({
  selection: null,
  setSelection: (sel) => set({ selection: sel }),
}))
