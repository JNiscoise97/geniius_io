// components/ProtectedRoute.tsx
import { useRoleStore } from "@/store/useRoleStore"
import { Navigate } from "react-router-dom"

type Role = 'visiteur' | 'utilisateur' | 'admin'

const roleHierarchy: Role[] = ['visiteur', 'utilisateur', 'admin']

export function ProtectedRoute({
  children,
  minRole = 'utilisateur',
}: {
  children: React.ReactNode
  minRole?: Role
}) {
  const { role } = useRoleStore()

  const hasAccess =
    roleHierarchy.indexOf(role) >= roleHierarchy.indexOf(minRole)

  return hasAccess ? <>{children}</> : <Navigate to="/unauthorized" replace />
}
