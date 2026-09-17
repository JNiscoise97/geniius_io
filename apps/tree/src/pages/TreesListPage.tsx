import { Link } from 'react-router-dom'
import { ArrowRight, GitBranch, Loader2, TreePine } from 'lucide-react'
import { useEffect, useState } from 'react'
import AdminAuthGate from '../components/admin/AdminAuthGate'
import { bridgeGetJson, BridgeError } from '../lib/bridge/client'
import type { BridgeTree } from '../lib/bridge/types'

// Was previously wired to geniius_io's own (unrelated, multi-tenant,
// unencrypted) `trees` table — that table doesn't exist in the
// consolidated project. This now shows the real family trees via the
// bridge, same data source as the admin pages, so it's gated the same
// way (session + MFA), not by geniius_io's own magic-link session.
export default function TreesListPage() {
  return (
    <AdminAuthGate>
      <TreesList />
    </AdminAuthGate>
  )
}

function TreesList() {
  const [trees, setTrees] = useState<BridgeTree[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    bridgeGetJson<BridgeTree[]>('/trees')
      .then(setTrees)
      .catch((err) => setError(err instanceof BridgeError ? err.message : String(err)))
  }, [])

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-8">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      </div>
    )
  }

  if (trees === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={22} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-8">
      <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Mes arbres</h1>

      <div className="mt-7">
        {trees.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {trees.map((tree) => (
              <Link
                key={tree.id}
                to={`/trees/${tree.id}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4EFEA]">
                  <GitBranch size={17} className="text-[#1B4D3E]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-950">{tree.label}</p>
                  <p className="text-xs font-medium text-slate-400">{tree.id}</p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-slate-300" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <TreePine size={26} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">Aucun arbre publié</p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Publiez un premier GEDCOM depuis la page Importer pour en créer un.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
