import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { ArrowRight, GitBranch, Loader2, LogIn, Plus, TreePine } from 'lucide-react'
import { supabase } from '../lib/supabase/client'

type Tree = {
  id: string
  name: string
  created_at: string
}

export default function TreesListPage() {
  // undefined = session not resolved yet, null = logged out
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [trees, setTrees] = useState<Tree[] | null>(null)
  const [loadingTrees, setLoadingTrees] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return

    let cancelled = false
    setLoadingTrees(true)

    supabase
      .from('trees')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        setLoadingTrees(false)
        if (fetchError) {
          setError(fetchError.message)
          return
        }
        setTrees(data ?? [])
      })

    return () => {
      cancelled = true
    }
  }, [session])

  async function createTree(event: FormEvent) {
    event.preventDefault()
    if (!session || !newName.trim()) return

    setCreating(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('trees')
      .insert({ name: newName.trim(), owner_id: session.user.id })
      .select('id, name, created_at')
      .single()

    setCreating(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setTrees((current) => [data, ...(current ?? [])])
    setNewName('')
    setShowCreateForm(false)
  }

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
        <TreePine size={32} className="text-slate-300" />
        <h1 className="mt-4 text-xl font-black text-slate-950">
          Connectez-vous pour voir vos arbres
        </h1>
        <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500">
          Vos arbres sont liés à votre compte — connectez-vous pour y accéder.
        </p>
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

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Mes arbres</h1>

        <button
          type="button"
          onClick={() => setShowCreateForm((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-emerald-700/20 transition hover:bg-emerald-800"
        >
          <Plus size={16} />
          Nouvel arbre
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={createTree}
          className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row"
        >
          <input
            type="text"
            required
            autoFocus
            placeholder="Nom de l'arbre, ex. Famille Fresnais"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-950 outline-none transition focus:border-indigo-300"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Création…' : 'Créer'}
          </button>
        </form>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mt-7">
        {loadingTrees ? (
          <CenteredState small>
            <Loader2 className="animate-spin text-slate-400" size={20} />
          </CenteredState>
        ) : trees && trees.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {trees.map((tree) => (
              <Link
                key={tree.id}
                to={`/trees/${tree.id}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <GitBranch size={17} className="text-emerald-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-950">{tree.name}</p>
                  <p className="text-xs font-medium text-slate-400">
                    Créé le {new Date(tree.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-slate-300" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <TreePine size={26} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">
              Vous n'avez pas encore d'arbre
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Créez votre premier arbre pour commencer.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function CenteredState({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center',
        small ? 'py-10' : 'min-h-[60vh] px-6',
      ].join(' ')}
    >
      {children}
    </div>
  )
}
