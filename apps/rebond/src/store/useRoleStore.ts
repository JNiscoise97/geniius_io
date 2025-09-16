import { create } from 'zustand'

type Role = 'visiteur' | 'utilisateur' | 'admin'

type RoleStore = {
  role: Role
  setRole: (role: Role) => void
}

const CURRENT_BUILD_ID = import.meta.env.VITE_BUILD_ID
const storedData = localStorage.getItem('rebond_role_data')

let initialRole: Role = 'visiteur'

if (storedData) {
  try {
    const parsed = JSON.parse(storedData)
    if (parsed.buildId === CURRENT_BUILD_ID) {
      initialRole = parsed.role
    }
  } catch {
    // si JSON invalide, on ignore
  }
}

export const useRoleStore = create<RoleStore>((set) => ({
  role: initialRole,
  setRole: (role) => {
    localStorage.setItem(
      'rebond_role_data',
      JSON.stringify({ role, buildId: CURRENT_BUILD_ID })
    )
    set({ role })
  },
}))
