import type { ReactNode } from 'react'
import { ScrollText } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { AppLayout } from '@geniius/layout'
import '@geniius/layout/style.css'
import { supabase } from '../../lib/supabase/client'
import { useSession } from '../../lib/supabase/useSession'
import { NotificationsPanel } from '../../features/notifications/NotificationsPanel'
import { UserMenu } from '../../features/account/UserMenu'

interface LayoutProps {
  children: ReactNode
}

function AuthControls({
  session,
  onSignOut,
}: {
  session: Session | null
  onSignOut: () => void
}) {
  if (session) {
    return (
      <div className="flex items-center gap-3">
        <NotificationsPanel />
        <UserMenu session={session} onSignOut={onSignOut} />
      </div>
    )
  }

  return (
    <Link
      to="/login"
      className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
    >
      Se connecter
    </Link>
  )
}

export default function Layout({ children }: LayoutProps) {
  const session = useSession() ?? null
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navItems = [
    {
      label: 'auth',
      to: '#',
      // Sur les pages hors accueil, ce même contrôle est déjà affiché via
      // rightActions dans le header — on évite de le dupliquer dans le menu.
      hideInDropdown: !isHome,
      render: () => <AuthControls session={session} onSignOut={signOut} />,
    },
  ]

  return (
    <AppLayout
      appName="rebond"
      appTitle="Geniius.io | Rebond"
      footerName="Rebond"
      icon={ScrollText}
      navItems={navItems}
      accentColor="#4f46e5"
      accentBgColor="#e0e7ff"
      accentSoftColor="#eef2ff"
      rightActions={<AuthControls session={session} onSignOut={signOut} />}
    >
      {children}
    </AppLayout>
  )
}
