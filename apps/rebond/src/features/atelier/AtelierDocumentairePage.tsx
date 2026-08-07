// AtelierDocumentairePage.tsx
// Point d'entrée de l'atelier documentaire : la même liste de documents que
// l'onglet "Documents" de Patrimoine documentaire, mais dont le clic mène à
// la transcription (liste des exemplaires) plutôt qu'à la fiche
// administrative du document.

import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, FileEdit, Filter, Search, ExternalLink, Copy, Loader2, AlertCircle, Library } from 'lucide-react'
import { usePatrimoine } from '../patrimoine/usePatrimoine'
import { STATUT_DOC_CONFIG, STATUT_DOC_FALLBACK, ROLE_CONFIG } from '../patrimoine/PatrimoineDocumentairePage'
import type { PatrimoineDocument as Document, DocStatut } from '../patrimoine/source.types'

const STATUT_DOC_FILTERS: Array<{ key: DocStatut | 'tous'; label: string }> = [
  { key: 'tous', label: 'Tous' },
  { key: 'a_transcrire', label: 'À transcrire' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'transcrit', label: 'Transcrits' },
  { key: 'annote', label: 'Annotés' },
]

function DocumentCard({ doc, registreName, onClick }: { doc: Document; registreName: string | null; onClick: () => void }) {
  const role = doc.role ? ROLE_CONFIG[doc.role] : null
  const statut = STATUT_DOC_CONFIG[doc.statut] ?? STATUT_DOC_FALLBACK

  return (
    <div
      role="button" tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className="w-full bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all group cursor-pointer flex items-center gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
            {doc.titre}
          </h3>
          {role && (
            <span className={`text-xs font-medium rounded border px-1.5 py-0.5 shrink-0 ${role.color}`}>{role.label}</span>
          )}
          {doc.serie && (
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5 shrink-0">{doc.serie}</span>
          )}
        </div>
        {registreName && (
          <p className="flex items-center gap-1 text-xs text-gray-400 mt-1 truncate">
            <Library className="w-3 h-3 shrink-0" />
            {registreName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Copy className="w-3 h-3 text-gray-300" />
          {doc.exemplaire_count} exemplaire{doc.exemplaire_count > 1 ? 's' : ''}
        </span>
        {doc.url ? (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />En ligne
          </a>
        ) : (
          <span className="text-xs text-gray-300 w-[62px]">—</span>
        )}
        <span className={`text-xs font-medium rounded-full border px-2.5 py-0.5 flex items-center gap-1.5 ${statut.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statut.dot}`} />{statut.label}
        </span>
      </div>
    </div>
  )
}

export function AtelierDocumentairePage() {
  const navigate = useNavigate()
  const { docs, sources, loading, error } = usePatrimoine()

  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('tous')
  const [statutFilter, setStatutFilter] = useState<DocStatut | 'tous'>('tous')

  const activeSources = sources.filter(s => s.statut !== 'a_qualifier')
  const activeDocs = docs.filter(d => d.statut !== 'en_attente')

  const sourceNameById = useMemo(() => new Map(sources.map(s => [s.id, s.nom])), [sources])

  const filteredDocs = activeDocs.filter(d => {
    const matchSource = sourceFilter === 'tous' || d.source_id === sourceFilter
    const matchStatut = statutFilter === 'tous' || d.statut === statutFilter
    const q = search.toLowerCase()
    const matchSearch = !q || d.titre.toLowerCase().includes(q) || d.cote.toLowerCase().includes(q)
    return matchSource && matchStatut && matchSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement de l'atelier documentaire…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-rose-200 p-6 max-w-sm text-center">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-800 mb-1">Erreur de chargement</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="flex items-center gap-1.5">
              <FileEdit className="w-4 h-4" />
              Atelier documentaire
            </span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Atelier documentaire</h1>
          <p className="text-sm text-gray-500 mt-1">
            Choisis un document, puis l'exemplaire à transcrire.
          </p>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un document…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="tous">Toutes les sources</option>
            {activeSources.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
          {STATUT_DOC_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatutFilter(f.key)}
              className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${
                statutFilter === f.key
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredDocs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <p className="text-sm text-gray-400">Aucun document trouvé.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredDocs.map(doc => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                registreName={doc.source_id ? sourceNameById.get(doc.source_id) ?? null : null}
                onClick={() => navigate(`/atelier-documentaire/documents/${doc.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default AtelierDocumentairePage
