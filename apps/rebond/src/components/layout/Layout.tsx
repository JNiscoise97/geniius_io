import type { ReactNode } from 'react'
import { Bell, LogOut, ScrollText } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { AppLayout } from '@geniius/layout'
import '@geniius/layout/style.css'
import { supabase } from '../../lib/supabase/client'
import { useSession } from '../../lib/supabase/useSession'

interface LayoutProps {
  children: ReactNode
}

function initialsFromEmail(email: string | undefined) {
  return (email ?? '').split('@')[0].slice(0, 2).toUpperCase() || '?'
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
        <button type="button" className="relative p-1" aria-label="Notifications">
          <Bell size={18} className="text-slate-400" />
          <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>
        <button
          type="button"
          onClick={onSignOut}
          title={`${session.user.email} — Se déconnecter`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-800 transition hover:bg-amber-200"
        >
          {initialsFromEmail(session.user.email)}
        </button>
      </div>
    )
  }

  return (
    <Link
      to="/login"
      className="rounded-full bg-amber-700 px-4 py-2 text-sm font-black text-white shadow-sm shadow-amber-700/20 transition hover:bg-amber-800"
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
    ...(session
      ? [
          {
            label: 'Se déconnecter',
            to: '#',
            render: () => (
              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-2 text-sm font-black text-slate-700 hover:text-slate-950"
              >
                <LogOut size={16} />
                Se déconnecter
              </button>
            ),
          },
        ]
      : []),
  ]

  return (
    <AppLayout
      appName="rebond"
      appTitle="Geniius.io | Rebond"
      footerName="Rebond"
      icon={ScrollText}
      navItems={navItems}
      accentColor="#b45309"
      accentBgColor="#fef3c7"
      accentSoftColor="#fffbeb"
      rightActions={<AuthControls session={session} onSignOut={signOut} />}
    >
      {children}
    </AppLayout>
  )
}
