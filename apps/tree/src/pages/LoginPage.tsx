import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LeafIcon, Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [sent, setSent]       = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/trees`,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-6 py-16">
      <Link to="/" className="mb-14 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
          <LeafIcon size={18} className="text-indigo-700" />
        </div>
        <span className="text-sm font-black text-indigo-700">Geniius.io | Tree</span>
      </Link>

      <div className="w-full max-w-xl text-center">
        {sent ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={26} className="text-emerald-700" />
            </div>

            <h1 className="text-3xl font-black leading-[1.1] tracking-tight text-slate-950 sm:text-4xl">
              Vérifiez vos e-mails.
            </h1>

            <p className="mx-auto mt-4 max-w-md text-base font-medium leading-7 text-slate-600">
              Un lien de connexion a été envoyé à <strong className="text-slate-950">{email}</strong>.
              Cliquez dessus pour accéder à votre arbre.
            </p>

            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-7 text-sm font-black text-indigo-700 hover:text-indigo-800"
            >
              Utiliser une autre adresse
            </button>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
              Concentrez-vous sur vos ancêtres.
              <br />
              On s'occupe du reste.
            </h1>

            <p className="mx-auto mt-5 max-w-md text-base font-medium leading-7 text-slate-600">
              Recevez un lien de connexion par e-mail — aucun mot de passe à retenir.
            </p>

            <form
              onSubmit={onSubmit}
              className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
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
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Envoi…' : 'Recevoir le lien'}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            {error && (
              <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700">
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
          </>
        )}
      </div>
    </div>
  )
}
