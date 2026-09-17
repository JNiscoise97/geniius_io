import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, History, Loader2 } from 'lucide-react'
import { bridgeGetJson, BridgeError } from '../../lib/bridge/client'
import type { BridgeTree, VersionHistoryEntry } from '../../lib/bridge/types'
import SearchableTable from '../../components/SearchableTable'

export default function VersionHistoryPage() {
  const [trees, setTrees] = useState<BridgeTree[] | null>(null)
  const [selectedTreeId, setSelectedTreeId] = useState('')
  const [versions, setVersions] = useState<VersionHistoryEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    bridgeGetJson<BridgeTree[]>('/trees')
      .then((data) => {
        setTrees(data)
        setSelectedTreeId((current) => current || data[0]?.id || '')
      })
      .catch((err) => setError(err instanceof BridgeError ? err.message : String(err)))
  }, [])

  useEffect(() => {
    if (!selectedTreeId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the list while the new tree's versions load
    setVersions(null)
    bridgeGetJson<VersionHistoryEntry[]>(`/trees/${selectedTreeId}/versions`)
      .then(setVersions)
      .catch((err) => setError(err instanceof BridgeError ? err.message : String(err)))
  }, [selectedTreeId])

  if (error) {
    return <p className="mx-auto max-w-3xl px-6 py-12 text-sm font-medium text-red-600">{error}</p>
  }

  if (trees === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={22} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 lg:px-8">
      <div className="flex items-center gap-2.5">
        <History size={22} className="text-[#1B4D3E]" />
        <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Historique des publications</h1>
      </div>

      {trees.length > 1 && (
        <select
          value={selectedTreeId}
          onChange={(event) => setSelectedTreeId(event.target.value)}
          className="mt-4 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-950 outline-none transition focus:border-[#1B4D3E]/50"
        >
          {trees.map((tree) => (
            <option key={tree.id} value={tree.id}>
              {tree.label}
            </option>
          ))}
        </select>
      )}

      {versions === null ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="animate-spin text-slate-400" size={22} />
        </div>
      ) : versions.length === 0 ? (
        <p className="mt-8 text-sm font-medium text-slate-500">Aucune version publiée pour cet arbre.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {versions.map((entry) => {
            const isOpen = expanded === entry.version
            const stats = entry.stats
            const details = stats ? (JSON.parse(stats.details_json) as { category: string; personName: string; note: string | null }[]) : []

            return (
              <li key={entry.version} className="rounded-2xl border border-slate-200 bg-white">
                <button
                  onClick={() => setExpanded(isOpen ? null : entry.version)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Version {entry.version}
                      <span className="ml-2 text-xs font-medium text-slate-400">
                        {new Date(entry.created_at).toLocaleString('fr-FR')}
                      </span>
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {stats
                        ? [
                            stats.new_individuals_count ? `${stats.new_individuals_count} nouvelle(s) personne(s)` : null,
                            stats.new_photos_count ? `${stats.new_photos_count} nouvelle(s) photo(s)` : null,
                            stats.modified_events_count ? `${stats.modified_events_count} événement(s) modifié(s)` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'Aucun changement notable'
                        : 'Publié via le CLI — pas de changelog'}
                    </p>
                  </div>
                  {details.length > 0 && (isOpen ? <ChevronUp size={18} className="shrink-0 text-slate-400" /> : <ChevronDown size={18} className="shrink-0 text-slate-400" />)}
                </button>

                {isOpen && details.length > 0 && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <SearchableTable
                      headers={['Catégorie', 'Personne', 'Note']}
                      rows={details.map((d) => [d.category, d.personName, d.note ?? ''])}
                      searchable
                      accent="brand"
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
