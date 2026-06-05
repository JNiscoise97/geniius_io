import type { ElementType } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  FileAudioIcon,
  LayersIcon,
  MicIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase/client'
import type { JournalSession } from '../types/journal'

const actions = [
  {
    icon: SparklesIcon,
    title: 'Nouvelle interview',
    text: 'Interrogez un proche sur ses souvenirs avec le guide de l\'agent.',
    to: '/journal/new',
  },
  {
    icon: FileAudioIcon,
    title: 'Importer un audio',
    text: 'Transcrivez et analysez un témoignage WhatsApp ou vocal.',
    to: '/journal/new',
  },
  {
    icon: CheckCircleIcon,
    title: 'Propositions en attente',
    text: 'Validez les mises à jour suggérées par l\'agent pour votre arbre.',
    to: '/journal/proposals',
  },
  {
    icon: MessageSquareIcon,
    title: 'Toutes les sessions',
    text: 'Retrouvez l\'historique de vos interviews et les fils ouverts.',
    to: '/journal/sessions',
  },
]

const ecosystem = [
  { name: 'Tree',    text: 'L\'arbre familial : la base de données centrale de votre généalogie.' },
  { name: 'Rebond',  text: 'Reconstituer les parcours de vie à partir des actes d\'état civil.' },
  { name: 'Echo',    text: 'Gérer vos contacts et échanges avec d\'autres généalogistes.' },
  { name: 'Connect', text: 'Créer du lien familial lors d\'une cousinade ou réunion de famille.' },
]

const STATUS_LABELS = { active: 'En cours', completed: 'Terminée', paused: 'En pause' }
const STATUS_COLORS = {
  active:    'text-teal-400',
  completed: 'text-slate-400',
  paused:    'text-amber-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-0 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:px-8 lg:py-20">
        <div className="px-6 sm:px-0">
          <h1 className="max-w-2xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Chaque souvenir compte.
          </h1>

          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600">
            Journal capture les témoignages de vos proches, résout les identités
            et enrichit votre arbre généalogique — sans jamais rien modifier sans votre accord.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/journal/new')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700"
            >
              Nouvelle session
              <ArrowRight size={17} />
            </button>

            <button
              onClick={() => navigate('/journal/sessions')}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Mes sessions
              <MessageSquareIcon size={17} />
            </button>
          </div>
        </div>

        <SessionsPreview />
      </section>

      {/* ── Actions ────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-12 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((item) => (
            <SmallCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <BigCard
            icon={SparklesIcon}
            title="Interview guidée par l'IA"
            text="L'agent pose les bonnes questions, rebondit sur chaque réponse et détecte automatiquement les informations généalogiques clés."
          />
          <BigCard
            icon={LayersIcon}
            title="Identités multiples sourcées"
            text="Un individu peut être connu sous plusieurs noms. Journal empile les identités sans jamais en écraser aucune — chaque source est conservée."
          />
          <BigCard
            icon={ShieldCheckIcon}
            title="Validation manuelle"
            text="Aucune mise à jour ne part dans Tree sans votre accord. Chaque proposition est présentée avec sa source et son niveau de certitude."
          />
        </div>
      </section>

      {/* ── Ecosystem ──────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16 lg:px-8">
        <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-teal-300">
                Suite Geniius.io
              </p>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                Journal comme mémoire vivante.
              </h2>
              <p className="mt-4 text-sm font-medium leading-6 text-slate-300 sm:text-base">
                Journal enrichit Tree à partir des témoignages oraux. Il s'articule
                avec les autres outils de la suite pour une généalogie complète.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {ecosystem.map((app) => (
                <div key={app.name} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-base font-black text-white">{app.name}</p>
                  <p className="mt-2 text-sm font-medium leading-5 text-slate-300">
                    {app.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Preview widget ───────────────────────────────────────

function SessionsPreview() {
  const [sessions, setSessions] = useState<JournalSession[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase
        .from('journal_sessions')
        .select('id, subject_raw, theme_value, interviewer_name, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(3),
      supabase
        .from('journal_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]).then(([{ data }, { count }]) => {
      setSessions((data ?? []) as JournalSession[])
      setPendingCount(count ?? 0)
      setLoading(false)
    })
  }, [])

  return (
    <div className="w-full rounded-none border-y border-slate-200 bg-white/90 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur sm:rounded-[2rem] sm:border lg:max-w-xl lg:justify-self-end">
      <div className="rounded-2xl bg-slate-950 p-5 text-white sm:rounded-[1.75rem] sm:p-6">

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-teal-300">
              Mes sessions
            </p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">
              Sessions récentes
            </h2>
          </div>
          <div className="rounded-2xl bg-white/10 p-2">
            <MicIcon size={20} className="text-teal-300" />
          </div>
        </div>

        {/* Propositions en attente */}
        {pendingCount > 0 && (
          <Link
            to="/journal/proposals"
            className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-500/15 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/25"
          >
            <CheckCircleIcon size={15} />
            {pendingCount} proposition{pendingCount > 1 ? 's' : ''} en attente de validation
            <ArrowRight size={13} className="ml-auto" />
          </Link>
        )}

        {/* Sessions */}
        <div className="mt-5 space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/10" />
            ))
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <BookOpenIcon size={24} className="mx-auto mb-2 text-slate-500" />
              <p className="text-sm font-medium text-slate-400">Aucune session pour l'instant</p>
            </div>
          ) : (
            sessions.map((s) => (
              <Link
                key={s.id}
                to={`/journal/session/${s.id}`}
                className="block rounded-2xl border border-white/5 bg-white/10 p-4 transition hover:bg-white/15"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">
                      {s.subject_raw ?? s.theme_value ?? 'Session sans thème'}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {s.interviewer_name ?? 'Interlocuteur inconnu'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`text-xs font-bold ${STATUS_COLORS[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <ClockIcon size={10} />
                      {formatDate(s.updated_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <Link
          to="/journal/sessions"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-teal-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-400"
        >
          Voir toutes mes sessions
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}

// ── Composants ───────────────────────────────────────────

function SmallCard({
  icon: Icon,
  title,
  text,
  to,
}: {
  icon: ElementType
  title: string
  text: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <Icon className="mb-4 text-teal-600" size={22} />
      <h3 className="text-base font-black">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </Link>
  )
}

function BigCard({
  icon: Icon,
  title,
  text,
}: {
  icon: ElementType
  title: string
  text: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Icon className="mb-5 text-teal-600" size={26} />
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </article>
  )
}
