import { useEffect, useState } from 'react'
import { ImageOff, Loader2 } from 'lucide-react'
import { bridgeGetJson, BridgeError } from '../../lib/bridge/client'
import type { BridgeTree, MissingPhotosResponse } from '../../lib/bridge/types'
import SearchableTable from '../../components/SearchableTable'

export default function MissingPhotosPage() {
  const [trees, setTrees] = useState<BridgeTree[] | null>(null)
  const [selectedTreeId, setSelectedTreeId] = useState('')
  const [data, setData] = useState<MissingPhotosResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    bridgeGetJson<BridgeTree[]>('/trees')
      .then((trees) => {
        setTrees(trees)
        setSelectedTreeId((current) => current || trees[0]?.id || '')
      })
      .catch((err) => setError(err instanceof BridgeError ? err.message : String(err)))
  }, [])

  useEffect(() => {
    if (!selectedTreeId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the list while the new tree's data loads
    setData(null)
    bridgeGetJson<MissingPhotosResponse>(`/trees/${selectedTreeId}/missing-photos`)
      .then(setData)
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
        <ImageOff size={22} className="text-[#1B4D3E]" />
        <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Photos manquantes</h1>
      </div>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
        Ces personnes référencent une photo dans le GEDCOM dont le fichier n'a pas été trouvé lors
        de la dernière publication — retrouvez-le (ou renommez-le) dans votre export Heredis avant
        de republier.
      </p>

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

      {data === null ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="animate-spin text-slate-400" size={22} />
        </div>
      ) : (
        <div className="mt-6">
          {data.version === null ? (
            <p className="text-sm font-medium text-slate-500">Aucune publication via cette interface pour cet arbre.</p>
          ) : data.missing.length === 0 ? (
            <p className="text-sm font-medium text-slate-500">Toutes les photos référencées ont été résolues.</p>
          ) : (
            <SearchableTable
              headers={['Personne', 'Type', 'Nom de fichier attendu']}
              rows={data.missing.map((m) => [m.personName, m.kind === 'primary' ? 'Photo principale' : 'Galerie', m.expectedFileName])}
              searchable
              emptyMessage="Toutes les photos référencées ont été résolues."
              accent="brand"
            />
          )}
        </div>
      )}
    </div>
  )
}
