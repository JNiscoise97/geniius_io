import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound, Loader2, Lock, LogOut, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'

// Gates the admin pages (publish, version history, missing photos)
// behind: a real geniius_io session (email+password — not the magic-link
// flow the rest of this app uses, since publishing to the real family
// tree needs a password Jordan can set once and reuse) PLUS a completed
// TOTP challenge (aal2). MFA is enforced again, independently, by the
// bridge itself on every request — this gate is just the UX for getting
// there, not the actual security boundary.
type GateStatus = 'checking' | 'login' | 'enroll' | 'challenge' | 'unlocked'

type EnrollInfo = { factorId: string; qrCode: string; secret: string }

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>('checking')
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const [enrollInfo, setEnrollInfo] = useState<EnrollInfo | null>(null)
  const [challengeFactorId, setChallengeFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  async function evaluateSession() {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      setStatus('login')
      return
    }

    const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalError) {
      setError(aalError.message)
      setStatus('login')
      return
    }
    if (aalData.currentLevel === 'aal2') {
      setStatus('unlocked')
      return
    }

    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (factorsError) {
      setError(factorsError.message)
      setStatus('login')
      return
    }

    const verifiedTotp = factorsData.totp[0]
    if (verifiedTotp) {
      setChallengeFactorId(verifiedTotp.id)
      setStatus('challenge')
      return
    }

    const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (enrollError) {
      setError(enrollError.message)
      setStatus('login')
      return
    }
    setEnrollInfo({ factorId: enrollData.id, qrCode: enrollData.totp.qr_code, secret: enrollData.totp.secret })
    setStatus('enroll')
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async session/MFA check, setState only runs after await
    evaluateSession()
  }, [])

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setLoggingIn(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoggingIn(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    await evaluateSession()
  }

  async function handleVerify(event: FormEvent, factorId: string) {
    event.preventDefault()
    setVerifying(true)
    setError(null)
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() })
    setVerifying(false)
    if (verifyError) {
      setError(verifyError.message)
      return
    }
    setCode('')
    setStatus('unlocked')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setEnrollInfo(null)
    setChallengeFactorId(null)
    setStatus('login')
  }

  if (status === 'checking') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={22} />
      </div>
    )
  }

  if (status === 'login') {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-6 text-center">
        <ShieldCheck size={32} className="text-slate-300" />
        <h1 className="mt-4 text-xl font-black text-slate-950">Accès administrateur</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          Ces pages publient sur le vrai arbre familial — connexion et double authentification requises.
        </p>
        <form onSubmit={handleLogin} className="mt-6 w-full space-y-3">
          <div className="relative">
            <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-950 outline-none transition focus:border-[#1B4D3E]/50"
            />
          </div>
          <div className="relative">
            <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-950 outline-none transition focus:border-[#1B4D3E]/50"
            />
          </div>
          {error && <p className="text-left text-xs font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loggingIn || !email.trim() || !password}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1B4D3E] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#1B4D3E]/25 transition hover:bg-[#143c30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingIn ? <Loader2 size={16} className="animate-spin" /> : 'Se connecter'}
          </button>
        </form>
      </div>
    )
  }

  if (status === 'enroll' && enrollInfo) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-6 text-center">
        <KeyRound size={32} className="text-slate-300" />
        <h1 className="mt-4 text-xl font-black text-slate-950">Configurer la double authentification</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          Scanne ce code avec ton application d'authentification (Google Authenticator, 1Password…), puis saisis le
          code à 6 chiffres généré.
        </p>
        <img src={enrollInfo.qrCode} alt="Code QR de double authentification" className="mt-5 h-40 w-40" />
        <p className="mt-2 break-all text-xs font-medium text-slate-400">{enrollInfo.secret}</p>
        <form onSubmit={(event) => handleVerify(event, enrollInfo.factorId)} className="mt-5 w-full space-y-3">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-lg font-black tracking-[0.3em] text-slate-950 outline-none transition focus:border-[#1B4D3E]/50"
          />
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={verifying || code.trim().length < 6}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1B4D3E] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#1B4D3E]/25 transition hover:bg-[#143c30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Valider'}
          </button>
        </form>
      </div>
    )
  }

  if (status === 'challenge' && challengeFactorId) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-6 text-center">
        <ShieldCheck size={32} className="text-slate-300" />
        <h1 className="mt-4 text-xl font-black text-slate-950">Double authentification</h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          Saisis le code de ton application d'authentification.
        </p>
        <form onSubmit={(event) => handleVerify(event, challengeFactorId)} className="mt-5 w-full space-y-3">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-lg font-black tracking-[0.3em] text-slate-950 outline-none transition focus:border-[#1B4D3E]/50"
          />
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={verifying || code.trim().length < 6}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1B4D3E] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#1B4D3E]/25 transition hover:bg-[#143c30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Valider'}
          </button>
        </form>
        <button
          onClick={handleSignOut}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700"
        >
          <LogOut size={13} />
          Se déconnecter
        </button>
      </div>
    )
  }

  return <>{children}</>
}
