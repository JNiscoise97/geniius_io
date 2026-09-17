import { useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'

const MIN_PASSWORD_LENGTH = 8

export default function AdminAccountPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setSuccess(true)
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-12 lg:px-8">
      <div className="flex items-center gap-2.5">
        <KeyRound size={22} className="text-[#1B4D3E]" />
        <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Mon compte</h1>
      </div>
      {email && <p className="mt-2 text-sm font-medium text-slate-500">Connecté en tant que {email}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">Nouveau mot de passe</label>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-950 outline-none transition focus:border-[#1B4D3E]/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">Confirmer le mot de passe</label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-950 outline-none transition focus:border-[#1B4D3E]/50"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-2xl border border-[#1B4D3E]/20 bg-[#E9F2ED] px-4 py-3 text-sm font-medium text-[#1B4D3E]">
            <CheckCircle2 size={16} />
            Mot de passe mis à jour.
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !newPassword || !confirmPassword}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1B4D3E] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#1B4D3E]/25 transition hover:bg-[#143c30] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : 'Mettre à jour le mot de passe'}
        </button>
      </form>
    </div>
  )
}
