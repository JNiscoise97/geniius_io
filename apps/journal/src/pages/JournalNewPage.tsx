import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserIcon, UsersIcon, UserPlusIcon, SparklesIcon, ArrowRightIcon, PencilIcon } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase/client'
import type { NewSessionInput, ContextSummary } from '../types/journal'

type WhoStep = 'self' | 'tree' | 'new'

const WHO_OPTIONS = [
  {
    value: 'self' as WhoStep,
    icon: UserIcon,
    label: 'Moi',
    desc: "Je témoigne sur ma propre mémoire",
  },
  {
    value: 'tree' as WhoStep,
    icon: UsersIcon,
    label: "Quelqu'un de l'arbre",
    desc: "Un proche déjà présent dans Tree",
  },
  {
    value: 'new' as WhoStep,
    icon: UserPlusIcon,
    label: 'Personne non présente',
    desc: "Un témoin qui n'est pas encore dans l'arbre",
  },
]

const EXAMPLES = [
  "J'ai un audio de ma grand-mère sur Augustin Carbel",
  "Je veux explorer la famille à Bellemène",
  "J'ai une hypothèque de 1923 à comprendre",
  "Je veux raconter ce que je sais sur mon arrière-grand-père",
]

export default function JournalNewPage() {
  const navigate = useNavigate()

  // Étape 1 — Qui témoigne
  const [whoStep, setWhoStep] = useState<WhoStep>('self')
  const [interviewerName, setInterviewerName] = useState('')

  // Étape 2 — Sujet
  const [themeText, setThemeText] = useState('')

  // Étape 3 — Résumé IA
  const [contextSummary, setContextSummary] = useState<ContextSummary | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [loadingCreate, setLoadingCreate] = useState(false)

  const interviewerDescription =
    whoStep === 'self'
      ? "Moi (l'utilisateur lui-même)"
      : interviewerName.trim() || 'Interlocuteur non précisé'

  async function handleGenerateContext() {
    if (!themeText.trim() && whoStep === 'self') {
      toast.error('Décris ce dont tu veux parler')
      return
    }
    setLoadingContext(true)
    setContextSummary(null)

    const { data, error } = await supabase.functions.invoke('journal-agent', {
      body: {
        action: 'generate_context',
        interviewer_description: interviewerDescription,
        theme_text: themeText.trim(),
      },
    })

    setLoadingContext(false)

    if (error || !data?.summary) {
      toast.error('Erreur lors de la génération du contexte')
      return
    }

    setContextSummary(data as ContextSummary)
  }

  async function handleCreate() {
    setLoadingCreate(true)

    const { data: { user } } = await supabase.auth.getUser()

    const input: NewSessionInput = {
      interviewer_name: interviewerDescription,
      interviewer_is_self: whoStep === 'self',
      subject_raw: themeText.trim() || null!,
      mode: (contextSummary?.parsed.mode as any) ?? 'direct',
      intent: (contextSummary?.parsed.intent as any) ?? 'free',
    }

    const { data, error } = await supabase
      .from('journal_sessions')
      .insert({
        user_id: user?.id,
        interviewer_name: input.interviewer_name,
        interviewer_is_self: input.interviewer_is_self,
        subject_raw: input.subject_raw,
        theme_type: contextSummary?.parsed.theme_type ?? 'free',
        theme_value: input.subject_raw,
        mode: input.mode,
        intent: input.intent,
        tree_context: {},
        known_facts: {},
      })
      .select()
      .single()

    setLoadingCreate(false)

    if (error || !data) {
      toast.error('Erreur lors de la création de la session')
      return
    }

    navigate(`/journal/session/${data.id}`)
  }

  const canGenerateContext = whoStep === 'self' || interviewerName.trim().length > 0

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Nouvelle session</h1>
        <p className="mt-1 text-sm text-slate-500">
          Décris en quelques mots ce dont tu veux parler. L'agent s'occupe du reste.
        </p>
      </div>

      {/* Étape 1 — Qui témoigne */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-slate-700">Qui témoigne ?</h2>
        <div className="grid grid-cols-3 gap-2">
          {WHO_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const active = whoStep === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => { setWhoStep(opt.value); setContextSummary(null) }}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors ${
                  active
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon size={22} />
                <span className="text-xs font-semibold leading-tight">{opt.label}</span>
              </button>
            )
          })}
        </div>

        {whoStep !== 'self' && (
          <input
            type="text"
            placeholder={
              whoStep === 'tree'
                ? "Nom du témoin dans l'arbre (ex : Grand-mère Lucienne)"
                : "Nom du témoin (ex : Tante Marie)"
            }
            value={interviewerName}
            onChange={(e) => { setInterviewerName(e.target.value); setContextSummary(null) }}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        )}
      </section>

      {/* Étape 2 — Sujet */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-slate-700">De quoi veux-tu parler ?</h2>
        <textarea
          rows={4}
          placeholder={EXAMPLES.map((e, i) => (i === 0 ? `ex : "${e}"` : `     "${e}"`)).join('\n')}
          value={themeText}
          onChange={(e) => { setThemeText(e.target.value); setContextSummary(null) }}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
        <p className="mt-1.5 text-right text-xs text-slate-400">
          Laisser vide = l'agent choisit le fil
        </p>
      </section>

      {/* Bouton générer le contexte */}
      {!contextSummary && (
        <button
          onClick={handleGenerateContext}
          disabled={loadingContext || !canGenerateContext}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loadingContext ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              L'agent prépare le contexte…
            </>
          ) : (
            <>
              <SparklesIcon size={16} />
              Générer le résumé
            </>
          )}
        </button>
      )}

      {/* Étape 3 — Résumé IA */}
      {contextSummary && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-teal-600">
            <SparklesIcon size={13} />
            Résumé de l'agent
          </div>
          <p className="text-sm leading-relaxed text-teal-900">{contextSummary.summary}</p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loadingCreate}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {loadingCreate ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  C'est parti
                  <ArrowRightIcon size={15} />
                </>
              )}
            </button>
            <button
              onClick={() => setContextSummary(null)}
              className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50"
            >
              <PencilIcon size={13} />
              Modifier
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
