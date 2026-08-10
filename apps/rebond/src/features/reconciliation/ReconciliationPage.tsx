// ReconciliationPage.tsx
// Candidats de fusion : entités canoniques qui partagent exactement le même
// libellé (une fois normalisé) — détection volontairement simple (pas d'IA),
// cf. doctrine dans reconciliation.service.ts. Pour chaque groupe : choisir
// la fiche qui survit, fusionner, ou confirmer que ce ne sont pas les mêmes
// (le groupe ne sera plus jamais re-suggéré).

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, GitMerge, Loader2, AlertCircle, User, MapPin, ExternalLink } from 'lucide-react'
import { fetchMergeCandidates, mergeEntities, dismissGroup } from './reconciliation.service'
import type { MergeCandidateGroup } from './reconciliation.types'

function GroupCard({ group, onDone }: { group: MergeCandidateGroup; onDone: () => void }) {
  const [survivorId, setSurvivorId] = useState(group.members[0]?.entityId)
  const [busy, setBusy] = useState(false)
  const Icon = group.entityType === 'place' ? MapPin : User

  async function handleMerge() {
    if (!survivorId || busy) return
    setBusy(true)
    try {
      await mergeEntities(survivorId, group.members.map(m => m.entityId))
      onDone()
    } finally {
      setBusy(false)
    }
  }

  async function handleDismiss() {
    if (busy) return
    setBusy(true)
    try {
      await dismissGroup(group.entityType, group.normalizedLabel)
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-900">{group.members.length} fiches "{group.members[0]?.label}"</span>
        <span className="text-xs text-gray-400">({group.entityType === 'place' ? 'lieux' : 'personnes'})</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {group.members.map(m => (
          <label key={m.entityId} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name={`survivor-${group.entityType}-${group.normalizedLabel}`}
              checked={survivorId === m.entityId}
              onChange={() => setSurvivorId(m.entityId)}
              className="shrink-0"
            />
            <span className="flex-1 text-sm text-gray-700">{m.label}</span>
            <span className="text-xs text-gray-400">{m.factsCount} fait{m.factsCount > 1 ? 's' : ''} · {m.documentsCount} acte{m.documentsCount > 1 ? 's' : ''}</span>
            <Link to={`/entites/${m.entityId}`} target="_blank" onClick={e => e.stopPropagation()}
              className="text-gray-300 hover:text-indigo-600 transition-colors shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </label>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        La fiche sélectionnée ci-dessus survit et récupère les faits et documents des autres.
      </p>

      <div className="flex items-center gap-2">
        <button onClick={handleMerge} disabled={busy}
          className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
          Fusionner
        </button>
        <button onClick={handleDismiss} disabled={busy}
          className="text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 transition-colors">
          Ce ne sont pas les mêmes
        </button>
      </div>
    </div>
  )
}

export function ReconciliationPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<MergeCandidateGroup[]>([])

  function load() {
    setLoading(true)
    fetchMergeCandidates()
      .then(setGroups)
      .catch(err => setError(err?.message ?? 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

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
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
              <LayoutDashboard className="w-4 h-4" />Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="flex items-center gap-1.5">
              <GitMerge className="w-4 h-4" />Réconciliation
            </span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Réconciliation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fiches qui partagent exactement le même nom — probablement la même personne ou le même lieu.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-8">
            <Loader2 className="w-4 h-4 animate-spin" />Chargement…
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <p className="text-sm text-gray-400">Aucun doublon détecté pour l'instant.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map(g => (
              <GroupCard key={`${g.entityType}|${g.normalizedLabel}`} group={g} onDone={load} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default ReconciliationPage
