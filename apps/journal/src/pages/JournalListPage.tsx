import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, MessageSquareIcon, ClockIcon, CheckCircleIcon, PauseCircleIcon, AlertCircleIcon } from 'lucide-react'
import { supabase } from '../lib/supabase/client'
import type { JournalSession } from '../types/journal'

const STATUS_CONFIG = {
  active: { icon: MessageSquareIcon, label: 'En cours', color: 'text-teal-600 bg-teal-50' },
  completed: { icon: CheckCircleIcon, label: 'Terminée', color: 'text-slate-500 bg-slate-100' },
  paused: { icon: PauseCircleIcon, label: 'En pause', color: 'text-amber-600 bg-amber-50' },
}

const MODE_LABELS = {
  thematic: 'Thématique',
  import: 'Import audio',
  auto: 'Libre',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function JournalListPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<JournalSession[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    setLoading(true)

    const [{ data: sessionsData }, { count }] = await Promise.all([
      supabase
        .from('journal_sessions')
        .select('*')
        .order('updated_at', { ascending: false }),
      supabase
        .from('journal_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ])

    setSessions(sessionsData ?? [])
    setPendingCount(count ?? 0)
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Sessions d'interview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Chaque session capture les souvenirs d'un proche pour enrichir l'arbre.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <button
              onClick={() => navigate('/journal/proposals')}
              className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
            >
              <AlertCircleIcon size={15} />
              {pendingCount} proposition{pendingCount > 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={() => navigate('/journal/new')}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <PlusIcon size={16} />
            Nouvelle session
          </button>
        </div>
      </div>

      {/* Session list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <MessageSquareIcon size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-400">Aucune session pour l'instant</p>
          <p className="mt-1 text-sm text-slate-400">
            Démarrez votre première interview généalogique.
          </p>
          <button
            onClick={() => navigate('/journal/new')}
            className="mt-4 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Commencer
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const statusCfg = STATUS_CONFIG[session.status]
            const StatusIcon = statusCfg.icon
            return (
              <button
                key={session.id}
                onClick={() => navigate(`/journal/session/${session.id}`)}
                className="w-full rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${statusCfg.color}`}
                      >
                        <StatusIcon size={11} />
                        {statusCfg.label}
                      </span>
                      <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                        {MODE_LABELS[session.mode]}
                      </span>
                    </div>
                    <p className="truncate font-bold text-slate-900">
                      {session.subject_raw ?? session.theme_value ?? 'Sans thème'}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {session.interviewer_name ?? 'Interlocuteur inconnu'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                    <ClockIcon size={12} />
                    {formatDate(session.updated_at)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

    </div>
  )
}
