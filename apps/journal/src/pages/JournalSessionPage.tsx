import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  GitBranchPlusIcon,
  AlertCircleIcon,
  SparklesIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase/client'
import type { JournalMessage, JournalProposal, JournalSession, JournalThread } from '../types/journal'
import ChatBubble from '../components/chat/ChatBubble'
import ChatInput from '../components/chat/ChatInput'

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

export default function JournalSessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [session, setSession] = useState<JournalSession | null>(null)
  const [messages, setMessages] = useState<JournalMessage[]>([])
  const [proposals, setProposals] = useState<JournalProposal[]>([])
  const [threads, setThreads] = useState<JournalThread[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showRightPanel, setShowRightPanel] = useState(true)

  useEffect(() => {
    if (id) loadSession(id)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadSession(sessionId: string) {
    setLoading(true)
    const [
      { data: sessionData },
      { data: messagesData },
      { data: proposalsData },
      { data: threadsData },
    ] = await Promise.all([
      supabase.from('journal_sessions').select('*').eq('id', sessionId).single(),
      supabase.from('journal_messages').select('*').eq('session_id', sessionId).order('created_at'),
      supabase.from('journal_proposals').select('*').eq('session_id', sessionId).order('created_at'),
      supabase.from('journal_threads_open').select('*').eq('session_id', sessionId).order('created_at'),
    ])

    setSession(sessionData)
    setMessages(messagesData ?? [])
    setProposals(proposalsData ?? [])
    setThreads(threadsData ?? [])
    setLoading(false)
  }

  async function handleSend(message: string) {
    if (!id) return
    setSending(true)

    // Message utilisateur optimiste
    const optimistic: JournalMessage = {
      id: `temp-${Date.now()}`,
      session_id: id,
      role: 'user',
      content: message,
      audio_url: null,
      entities_extracted: {},
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const { data, error } = await supabase.functions.invoke('journal-agent', {
        body: { session_id: id, message },
      })

      if (error) throw error

      const agentMessage: JournalMessage = {
        id: `agent-${Date.now()}`,
        session_id: id,
        role: 'agent',
        content: data.content,
        audio_url: null,
        entities_extracted: {},
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, agentMessage])

      // Recharger proposals si nouvelles
      if (data.proposals_count > proposals.length) {
        const { data: newProposals } = await supabase
          .from('journal_proposals')
          .select('*')
          .eq('session_id', id)
          .order('created_at')
        setProposals(newProposals ?? [])

        // Recharger threads aussi
        const { data: newThreads } = await supabase
          .from('journal_threads_open')
          .select('*')
          .eq('session_id', id)
          .order('created_at')
        setThreads(newThreads ?? [])
      }
    } catch {
      toast.error("Erreur lors de l'envoi du message")
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  async function handleProposalAction(proposalId: string, status: 'accepted' | 'rejected') {
    const { error } = await supabase
      .from('journal_proposals')
      .update({ status })
      .eq('id', proposalId)

    if (error) {
      toast.error('Erreur lors de la mise à jour')
      return
    }

    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status } : p))
    )
    toast.success(status === 'accepted' ? 'Proposition acceptée' : 'Proposition rejetée')
  }

  async function handleResolveThread(threadId: string) {
    await supabase.from('journal_threads_open').update({ resolved: true }).eq('id', threadId)
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, resolved: true } : t)))
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="font-semibold text-slate-500">Session introuvable</p>
        <button
          onClick={() => navigate('/journal/sessions')}
          className="mt-4 text-sm text-teal-600 hover:underline"
        >
          Retour aux sessions
        </button>
      </div>
    )
  }

  const pendingProposals = proposals.filter((p) => p.status === 'pending')
  const openThreads = threads.filter((t) => !t.resolved)

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden">
      {/* Zone conversation */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* En-tête session */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
          <button
            onClick={() => navigate('/journal/sessions')}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <ArrowLeftIcon size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-slate-900">{session.theme}</p>
            <p className="text-xs text-slate-500">{session.interviewer_name}</p>
          </div>
          <div className="flex items-center gap-2">
            {pendingProposals.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <AlertCircleIcon size={11} />
                {pendingProposals.length}
              </span>
            )}
            <button
              onClick={() => setShowRightPanel((v) => !v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                showRightPanel
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {showRightPanel ? 'Masquer panneau' : 'Afficher panneau'}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {messages.length === 0 && (
            <div className="py-10 text-center">
              <SparklesIcon size={32} className="mx-auto mb-3 text-teal-300" />
              <p className="font-semibold text-slate-400">L'agent attend votre premier message</p>
              <p className="mt-1 text-sm text-slate-400">
                Dites bonjour, présentez le contexte, l'agent prendra le relais.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-teal-400"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={sending} />
      </div>

      {/* Panneau droit — Propositions + Fils */}
      {showRightPanel && (
        <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-slate-100 bg-slate-50 lg:block">
          {/* Propositions */}
          <div className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <AlertCircleIcon size={13} />
              Propositions Tree
            </h3>
            {pendingProposals.length === 0 ? (
              <p className="rounded-xl bg-white px-3 py-4 text-center text-xs text-slate-400">
                Aucune proposition en attente
              </p>
            ) : (
              <div className="space-y-2">
                {pendingProposals.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                        {FIELD_LABELS[p.field] ?? p.field}
                      </span>
                    </div>
                    <p className="mb-1 text-xs text-slate-700">
                      {typeof p.proposed_value === 'object'
                        ? JSON.stringify(p.proposed_value, null, 2)
                        : String(p.proposed_value)}
                    </p>
                    {p.source && (
                      <p className="mb-2 text-xs italic text-slate-400">{p.source}</p>
                    )}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleProposalAction(p.id, 'accepted')}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-teal-50 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                      >
                        <CheckCircleIcon size={13} />
                        Accepter
                      </button>
                      <button
                        onClick={() => handleProposalAction(p.id, 'rejected')}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        <XCircleIcon size={13} />
                        Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fils ouverts */}
          <div className="border-t border-slate-100 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <GitBranchPlusIcon size={13} />
              Fils à creuser
            </h3>
            {openThreads.length === 0 ? (
              <p className="rounded-xl bg-white px-3 py-4 text-center text-xs text-slate-400">
                Aucun fil en attente
              </p>
            ) : (
              <div className="space-y-2">
                {openThreads.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
                  >
                    <p className="mb-2 text-xs text-slate-700">{t.note}</p>
                    <button
                      onClick={() => handleResolveThread(t.id)}
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-slate-100 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      <CheckCircleIcon size={12} />
                      Marquer résolu
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
