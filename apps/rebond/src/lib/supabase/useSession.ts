import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './client'

// État partagé au niveau module : résolu une seule fois, pas à chaque montage
// de composant — évite le flash "déconnecté" quand Layout est démonté/remonté
// en changeant de route (ex. /dashboard -> /).
let cachedSession: Session | null | undefined = undefined
const listeners = new Set<(session: Session | null) => void>()

supabase.auth.getSession().then(({ data }) => {
  cachedSession = data.session
  listeners.forEach((listener) => listener(data.session))

  if (window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
})

supabase.auth.onAuthStateChange((_event, nextSession) => {
  cachedSession = nextSession
  listeners.forEach((listener) => listener(nextSession))
})

export function useSession(): Session | null | undefined {
  const [session, setSession] = useState(cachedSession)

  useEffect(() => {
    setSession(cachedSession)
    listeners.add(setSession)
    return () => {
      listeners.delete(setSession)
    }
  }, [])

  return session
}
