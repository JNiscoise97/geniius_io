// usePathClipboardStore.ts
import { create } from "zustand";

type PathClipboardState = {
  path: string | null;
  set: (path: string) => void;
  clear: () => void;
};

export const usePathClipboardStore = create<PathClipboardState>((set) => ({
  path: null,
  set: (path) => set({ path }),
  clear: () => set({ path: null }),
}));
