import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSession } from '../lib/supabase/useSession'

export default function LandingPage() {
  const session = useSession()

  return (
    <div className="min-h-screen bg-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col items-start px-6 py-20 lg:px-8 lg:py-28">
        <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
          Reconstituer les parcours des individus à partir des actes.
        </h1>

        <p className="mt-5 max-w-lg text-base font-medium leading-7 text-slate-600">
          Rebond fait le lien entre les documents d'archives et les personnes qu'ils
          racontent.
        </p>

        {session ? (
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
          >
            Aller à mon tableau de bord
            <ArrowRight size={17} />
          </Link>
        ) : (
          <Link
            to="/login"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
          >
            Se connecter
            <ArrowRight size={17} />
          </Link>
        )}
      </section>
    </div>
  )
}
