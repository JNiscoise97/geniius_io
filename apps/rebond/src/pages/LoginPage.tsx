import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ScrollText, Mail, Lock, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-6 py-16">
      <Link to="/" className="mb-14 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
          <ScrollText size={18} className="text-amber-700" />
        </div>
        <span className="text-sm font-black text-amber-700">Geniius.io | Rebond</span>
      </Link>

      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
          Reconstituez les parcours,
          <br />
          acte après acte.
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base font-medium leading-7 text-slate-600">
          Connectez-vous avec votre e-mail et votre mot de passe.
        </p>

        <form onSubmit={onSubmit} className="mx-auto mt-8 flex flex-col gap-3">
          <div className="relative">
            <Mail
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="vous@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white"
            />
          </div>

          <div className="relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        {error && (
          <div className="mx-auto mt-4 max-w-md rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <p className="mx-auto mt-6 max-w-md text-xs font-medium leading-5 text-slate-400">
          En vous connectant, vous acceptez nos{' '}
          <Link to="/mentions-legales" className="underline hover:text-slate-600">
            Conditions d'utilisation
          </Link>{' '}
          et notre{' '}
          <Link to="/mentions-legales" className="underline hover:text-slate-600">
            Politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
