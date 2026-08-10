// ExtractionHubPage.tsx
// Point d'entrée du module Extraction — écran distinct de l'outil de
// transcription. Liste les exemplaires d'actes primaires (rôle documentaire
// ACTE_PRIMAIRE) dont la transcription est marquée "transcrit" (bouton
// "Marquer comme transcrit" de l'atelier — cf. fetchExtractableExemplaires
// dans extraction.service.ts), classés par activité récente. Clic → l'atelier
// d'extraction pour la version la plus récente de cet exemplaire.

import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, Sparkles, Loader2, AlertCircle, Library, History } from 'lucide-react'
import { fetchExtractableExemplaires } from './extraction.service'
import type { ExtractableExemplaire } from './extraction.types'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 2) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  return `il y a ${days} jour${days > 1 ? 's' : ''}`
}

function ExtractionCard({ item, onClick }: { item: ExtractableExemplaire; onClick: () => void }) {
  const statusBadge = item.assertionsCount === 0
    ? <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5">Pas encore extrait</span>
    : item.pendingCount > 0
      ? <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">{item.pendingCount} à valider</span>
      : <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">{item.assertionsCount} validée{item.assertionsCount > 1 ? 's' : ''}</span>

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
            {item.documentTitre}
          </h3>
          {item.coteLocale && (
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5 shrink-0">{item.coteLocale}</span>
          )}
        </div>
        {item.registreName && (
          <p className="flex items-center gap-1 text-xs text-gray-400 mt-1 truncate">
            <Library className="w-3 h-3 shrink-0" />{item.registreName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <History className="w-3 h-3 text-gray-300" />
          v{item.latestVersionNumber} · {relativeTime(item.latestVersionCreatedAt)}
        </span>
        {statusBadge}
      </div>
    </div>
  )
}

export function ExtractionHubPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<ExtractableExemplaire[]>([])

  useEffect(() => {
    let cancelled = false
    fetchExtractableExemplaires()
      .then(data => { if (!cancelled) setItems(data) })
      .catch(err => { if (!cancelled) setError(err?.message ?? 'Erreur de chargement') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />Chargement de l'extraction…
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
              <LayoutDashboard className="w-4 h-4" />Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />Extraction
            </span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Extraction</h1>
          <p className="text-sm text-gray-500 mt-1">
            Exemplaires transcrits — choisis-en un pour générer ou valider ses assertions documentaires.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <p className="text-sm text-gray-400">
              Aucun exemplaire d'acte primaire marqué comme transcrit pour l'instant. Termine une transcription dans l'atelier documentaire (bouton "Marquer comme transcrit") pour qu'elle apparaisse ici.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map(item => (
              <ExtractionCard
                key={item.exemplaireId}
                item={item}
                onClick={() => navigate(`/atelier-documentaire/exemplaires/${item.exemplaireId}/versions/${item.latestVersionId}/extraction`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default ExtractionHubPage
