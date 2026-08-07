// AtelierExemplairesPage.tsx
// Deuxième étape de l'atelier documentaire : les exemplaires d'un document,
// chacun menant à sa propre transcription (rebond.transcriptions est liée à
// l'exemplaire, pas au document — deux numérisations du même document ont
// deux transcriptions distinctes).

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, FileEdit, ChevronRight, Loader2, Star, Building2, Library, CheckCircle2, Circle, PenLine } from 'lucide-react'
import { fetchDocumentHeader, fetchExemplairesForDocument } from './atelier.service'
import type { AtelierExemplaire, TranscriptionStatut } from './atelier.types'

const TRANSCRIPTION_STATUT_CONFIG: Record<TranscriptionStatut, { label: string; color: string; icon: React.ElementType }> = {
  non_commence: { label: 'Non commencé', color: 'text-gray-500 bg-gray-50 border-gray-200', icon: Circle },
  en_cours:     { label: 'En cours',      color: 'text-blue-700 bg-blue-50 border-blue-200', icon: PenLine },
  termine:      { label: 'Terminé',       color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
}

export function AtelierExemplairesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [docTitre, setDocTitre] = useState('')
  const [registreName, setRegistreName] = useState<string | null>(null)
  const [exemplaires, setExemplaires] = useState<AtelierExemplaire[]>([])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data: doc } = await fetchDocumentHeader(id!)
      if (cancelled) return
      if (!doc) { setNotFound(true); setLoading(false); return }
      setDocTitre(doc.titre)
      setRegistreName(doc.registreName)

      const { data: ex } = await fetchExemplairesForDocument(id!)
      if (cancelled) return
      setExemplaires(ex)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />Chargement des exemplaires…
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-rose-200 p-6 max-w-sm text-center">
          <p className="text-sm font-medium text-gray-800">Document introuvable</p>
          <button onClick={() => navigate('/atelier-documentaire')} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800">
            Retour à l'atelier documentaire
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 flex-wrap">
            <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors shrink-0">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <Link to="/atelier-documentaire" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors shrink-0">
              <FileEdit className="w-4 h-4" />
              Atelier documentaire
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900 truncate">{docTitre}</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{docTitre}</h1>
          {registreName && (
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <Library className="w-3.5 h-3.5 text-gray-400" />{registreName}
            </p>
          )}
        </div>

        {exemplaires.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <p className="text-sm text-gray-400">Aucun exemplaire pour ce document.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exemplaires.map(ex => {
              const statut = TRANSCRIPTION_STATUT_CONFIG[ex.transcriptionStatut]
              const StatutIcon = statut.icon
              return (
                <div
                  key={ex.id}
                  role="button" tabIndex={0}
                  onClick={() => navigate(`/atelier-documentaire/exemplaires/${ex.id}`)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/atelier-documentaire/exemplaires/${ex.id}`) }}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {ex.coteLocale || ex.identifiantInterne || 'Exemplaire sans cote'}
                      </span>
                      {ex.estReference && (
                        <span title="Exemplaire de référence" className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          <Star className="w-3 h-3" />Référence
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      {ex.depotLabel && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-300" />{ex.depotLabel}
                        </span>
                      )}
                      {ex.natureLabel && <span>{ex.natureLabel}</span>}
                      {ex.localisationInterne && <span className="text-gray-400">— {ex.localisationInterne}</span>}
                    </div>
                  </div>

                  <span className={`text-xs font-medium rounded-full border px-2.5 py-0.5 flex items-center gap-1.5 shrink-0 ${statut.color}`}>
                    <StatutIcon className="w-3 h-3" />{statut.label}
                  </span>

                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default AtelierExemplairesPage
