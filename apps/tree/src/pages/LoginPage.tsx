import { useState } from 'react'
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">
            <LeafIcon size={22} className="text-indigo-700" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-indigo-700">
              Geniius.io
            </p>
            <h1 className="text-lg font-black text-slate-950">Tree</h1>
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={24} className="text-emerald-700" />
            </div>
            <h2 className="text-xl font-black text-slate-950">Vérifiez vos e-mails</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              Un lien de connexion a été envoyé à <strong>{email}</strong>. Cliquez dessus
              pour accéder à votre arbre.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-6 text-sm font-black text-indigo-700 hover:text-indigo-800"
            >
              Utiliser une autre adresse
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-black text-slate-950">Connexion</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              Recevez un lien de connexion par e-mail, sans mot de passe.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Adresse e-mail
                </label>
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Envoi du lien…' : 'Recevoir le lien de connexion'}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
