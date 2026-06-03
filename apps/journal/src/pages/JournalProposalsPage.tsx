import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  InboxIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase/client'
import type { JournalProposal, JournalSession } from '../types/journal'

const FIELD_LABELS: Record<string, string> = {
  identity: 'Identité',
  birth_date: 'Date de naissance',
  death_date: 'Date de décès',
  profession: 'Profession',
  location: 'Lieu de vie',
  relation: 'Relation familiale',
  note: 'Note',
  new_person: 'Nouvelle personne',
}

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-teal-50 text-teal-700 border-teal-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
}

const STATUS_LABELS = {
  pending: 'En attente',
  accepted: 'Acceptée',
  rejected: 'Rejetée',
}

type Filter = 'all' | 'pending' | 'accepted' | 'rejected'

interface ProposalWithSession extends JournalProposal {
  session?: JournalSession
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

export default function JournalProposalsPage() {
  const navigate = useNavigate()
  const [proposals, setProposals] = useState<ProposalWithSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')

  useEffect(() => {
    loadProposals()
  }, [])

  async function loadProposals() {
    setLoading(true)

    const { data: proposalsData } = await supabase
      .from('journal_proposals')
      .select('*')
      .order('created_at', { ascending: false })

    if (!proposalsData?.length) {
      setProposals([])
      setLoading(false)
      return
    }

    // Charger les sessions associées
    const sessionIds = [...new Set(proposalsData.map((p) => p.session_id))]
    const { data: sessionsData } = await supabase
      .from('journal_sessions')
      .select('id, interviewer_name, theme')
      .in('id', sessionIds)

    const sessionMap = Object.fromEntries((sessionsData ?? []).map((s) => [s.id, s]))

    setProposals(
      proposalsData.map((p) => ({ ...p, session: sessionMap[p.session_id] }))
    )
    setLoading(false)
  }

  async function handleAction(id: string, status: 'accepted' | 'rejected') {
    const { error } = await supabase
      .from('journal_proposals')
      .update({ status })
      .eq('id', id)

    if (error) {
      toast.error('Erreur lors de la mise à jour')
      return
    }

    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
    toast.success(status === 'accepted' ? 'Proposition acceptée ✓' : 'Proposition rejetée')
  }

  async function handleBulkAccept() {
    const pendingIds = proposals.filter((p) => p.status === 'pending').map((p) => p.id)
    if (!pendingIds.length) return

    const { error } = await supabase
      .from('journal_proposals')
      .update({ status: 'accepted' })
      .in('id', pendingIds)

    if (error) {
      toast.error('Erreur lors de la validation groupée')
      return
    }

    setProposals((prev) =>
      prev.map((p) => (pendingIds.includes(p.id) ? { ...p, status: 'accepted' as const } : p))
    )
    toast.success(`${pendingIds.length} proposition(s) acceptée(s)`)
  }

  const filtered = proposals.filter((p) => filter === 'all' || p.status === filter)
  const pendingCount = proposals.filter((p) => p.status === 'pending').length

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <button
          onClick={() => navigate('/journal')}
          className="mt-0.5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
        >
          <ArrowLeftIcon size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900">Propositions Tree</h1>
          <p className="mt-1 text-sm text-slate-500">
            Validez ou rejetez les mises à jour suggérées par l'agent.
          </p>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={handleBulkAccept}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <CheckCircleIcon size={15} />
            Tout accepter ({pendingCount})
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="mb-5 flex gap-2">
        {(['pending', 'all', 'accepted', 'rejected'] as Filter[]).map((f) => {
          const count =
            f === 'all'
              ? proposals.length
              : proposals.filter((p) => p.status === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'Toutes' : STATUS_LABELS[f]} ({count})
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <InboxIcon size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-400">
            {filter === 'pending' ? 'Aucune proposition en attente' : 'Aucune proposition ici'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              {/* Meta */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[p.status]}`}
                >
                  {STATUS_LABELS[p.status]}
                </span>
                <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {FIELD_LABELS[p.field] ?? p.field}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <ClockIcon size={11} />
                  {formatDate(p.created_at)}
                </span>
              </div>

              {/* Session info */}
              {p.session && (
                <button
                  onClick={() => navigate(`/journal/session/${p.session_id}`)}
                  className="mb-3 block text-xs text-teal-600 hover:underline"
                >
                  Session : {p.session.theme} — {p.session.interviewer_name}
                </button>
              )}

              {/* Valeurs */}
              <div className="mb-3 grid grid-cols-2 gap-3">
                {p.current_value !== null && p.current_value !== undefined && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-slate-400">Valeur actuelle</p>
                    <pre className="text-xs whitespace-pre-wrap text-slate-600">
                      {renderValue(p.current_value)}
                    </pre>
                  </div>
                )}
                <div className={`rounded-xl bg-teal-50 p-3 ${!p.current_value ? 'col-span-2' : ''}`}>
                  <p className="mb-1 text-xs font-semibold text-teal-500">Valeur proposée</p>
                  <pre className="text-xs whitespace-pre-wrap text-teal-800">
                    {renderValue(p.proposed_value)}
                  </pre>
                </div>
              </div>

              {/* Source */}
              {p.source && (
                <p className="mb-3 text-xs italic text-slate-400">Source : {p.source}</p>
              )}

              {/* Actions */}
              {p.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(p.id, 'accepted')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    <CheckCircleIcon size={15} />
                    Accepter
                  </button>
                  <button
                    onClick={() => handleAction(p.id, 'rejected')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                  >
                    <XCircleIcon size={15} />
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
