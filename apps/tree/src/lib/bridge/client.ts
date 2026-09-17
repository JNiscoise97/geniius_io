// Client for the admin publishing bridge (see
// geniius-app-mobile/bridge/README.md) — a separate backend from
// geniius_io's own Supabase project's tables, but now sharing the SAME
// Supabase project for *auth*. It's the only thing that can write to
// Geniius Arbre's real, encrypted family tree, so this app never talks
// to that tree's data directly: everything goes through the bridge's own
// small HTTP API. Authorization is the caller's own geniius_io session
// (with MFA completed) — the bridge itself re-verifies that session and
// its aal2 status server-side (see admin_auth_middleware.dart); there is
// no separate bridge-specific secret to manage on this side anymore.
import { supabase } from '../supabase/client'

function bridgeUrl(): string {
  const url = import.meta.env.VITE_BRIDGE_URL
  if (!url) throw new Error('Missing VITE_BRIDGE_URL')
  return url
}

export class BridgeError extends Error {}

async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const token = await accessToken()
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${bridgeUrl()}${path}`, { ...init, headers })
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const body = await response.json()
      if (typeof body.error === 'string') message = body.error
    } catch {
      // response body wasn't JSON — keep the status-based message
    }
    throw new BridgeError(message)
  }
  return response
}

export async function bridgeGetJson<T>(path: string): Promise<T> {
  const response = await request(path)
  return response.json() as Promise<T>
}

export async function bridgePublish(formData: FormData): Promise<Response> {
  return request('/publish', { method: 'POST', body: formData })
}
