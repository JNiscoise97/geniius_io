import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, LogIn, User } from 'lucide-react'
import { useSession } from '../lib/supabase/useSession'
import IndividuLayout from '../features/individu/IndividuFiche'

export default function IndividuPage() {
  // undefined = session pas encore résolue, null = déconnecté
  const session = useSession()

  if (session === undefined) {
    return (
      <CenteredState>
        <Loader2 className="animate-spin text-slate-400" size={22} />
      </CenteredState>
    )
  }

  if (session === null) {
    return (
      <CenteredState>
        <User size={32} className="text-slate-300" />
        <h1 className="mt-4 text-xl font-black text-slate-950">
          Connectez-vous pour accéder à cette fiche
        </h1>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
        >
          <LogIn size={16} />
          Se connecter
        </Link>
      </CenteredState>
    )
  }

  return <IndividuLayout />
}

function CenteredState({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  )
}
