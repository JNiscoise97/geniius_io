import { useEffect, useState, type ReactNode } from 'react'
import { LeafIcon, LogOut, Search, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { AppLayout } from '@geniius/layout'
import '@geniius/layout/style.css'
import { supabase } from '../../lib/supabase/client'

interface LayoutProps {
  children: ReactNode
}

const baseNavItems = [
  { label: 'Mes arbres', to: '/trees' },
  { label: 'Importer', to: '/import' },
  { label: 'Explorer', to: '/explore' },
  { label: 'Sources', to: '/sources' },
  { label: 'Profil', to: '/profil' },
]

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
        <Link
          to="/profil"
          className="hidden max-w-[10rem] truncate text-sm font-black text-slate-700 hover:text-slate-950 sm:block"
        >
          {session.user.email}
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          <LogOut size={15} />
          Se déconnecter
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        to="/login"
        className="hidden text-sm font-black text-slate-700 transition hover:text-slate-950 sm:block"
      >
        Se connecter
      </Link>
      <Link
        to="/login"
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
      >
        Créer mon compte
      </Link>
    </div>
  )
}

export default function Layout({ children }: LayoutProps) {
  const [session, setSession] = useState<Session | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Le lien magique revient avec les jetons dans le hash (#access_token=…) ;
    // une fois la session récupérée, on nettoie l'URL pour ne pas laisser de # visible.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navItems = [
    ...baseNavItems,
    {
      label: 'auth',
      to: '#',
      render: () => <AuthControls session={session} onSignOut={signOut} />,
    },
  ]

  return (
    <AppLayout
      appName="tree"
      appTitle="Geniius.io | Tree"
      footerName="Tree"
      icon={LeafIcon}
      navItems={navItems}
      accentColor="#4f46e5"
      accentBgColor="#e0e7ff"
      accentSoftColor="#eef2ff"
      rightActions={
        <>
          <button className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 sm:block">
            <Search size={18} />
          </button>
          <button className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 sm:block">
            <Settings size={18} />
          </button>
          <AuthControls session={session} onSignOut={signOut} />
        </>
      }
    >
      {children}
    </AppLayout>
  )
}
