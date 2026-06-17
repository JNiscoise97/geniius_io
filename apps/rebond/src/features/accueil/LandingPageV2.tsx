import type { ElementType } from 'react'
import {
  ArrowRight,
  Layers,
  FileSearch,
  Sparkles,
  GitMerge,
  Network,
  ShieldCheck,
  Map,
  Users2,
  Landmark,
  Coins,
  Upload,
  CheckCircle,
  BookOpen,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const actions = [
  {
    icon: Upload,
    title: 'Importer une source',
    text: "Déposez un fonds d'archives, un registre ou un acte isolé pour démarrer.",
    to: '/sources',
  },
  {
    icon: FileSearch,
    title: 'Transcrire un document',
    text: 'Ouvrez l\'atelier documentaire et commencez la transcription.',
    to: '/ac-actes/liste',
  },
  {
    icon: CheckCircle,
    title: 'Valider des mentions',
    text: 'Arbitrez les suggestions du moteur d\'extraction en attente de validation.',
    to: '/',
  },
  {
    icon: Network,
    title: 'Explorer le graphe',
    text: 'Naviguez dans les réseaux, trajectoires et relations reconstruites.',
    to: '/',
  },
]

const features = [
  {
    icon: Sparkles,
    title: "Extraction assistée par IA",
    text: "Le moteur détecte les mentions — personnes, lieux, biens, dates, rôles. Il propose. Vous validez. Aucune connaissance sans décision humaine.",
  },
  {
    icon: GitMerge,
    title: "Réconciliation explicable",
    text: "Règles bloquantes, scoring pondéré par critère, validation humaine. Chaque proposition affiche ses preuves, ses poids et ses contradictions.",
  },
  {
    icon: ShieldCheck,
    title: "Traçabilité totale",
    text: "Toute connaissance remonte jusqu'à sa source. Le doute est conservé, jamais effacé. La réversibilité est garantie à chaque étape.",
  },
]

const reconstructions = [
  {
    icon: Users2,
    label: "Personnes & trajectoires",
    text: "Reconstituer la vie d'un individu à travers ses actes, professions, résidences et liens.",
  },
  {
    icon: Landmark,
    label: "Réseaux sociaux",
    text: "Témoins récurrents, voisins, parrains, associés — les liens qui structurent une société.",
  },
  {
    icon: Coins,
    label: "Patrimoines & transmissions",
    text: "Suivre un bien foncier à travers les ventes, successions, divisions et regroupements.",
  },
  {
    icon: Map,
    label: "Territoires & voisinages",
    text: "Cartographier les propriétés, habitations et communautés dans le temps.",
  },
  {
    icon: BookOpen,
    label: "Organisations & institutions",
    text: "Études notariales, paroisses, administrations — leurs membres et leurs actes.",
  },
  {
    icon: Network,
    label: "Dynamiques historiques",
    text: "Comprendre comment un monde évolue : migrations, transmissions, mariages, ruptures.",
  },
]

const ecosystem = [
  { name: 'Tree',    text: "L'arbre familial : la base de données centrale de votre généalogie." },
  { name: 'Journal', text: "Capturer les témoignages oraux et les enrichir dans votre arbre." },
  { name: 'Echo',    text: "Gérer vos contacts et échanges avec d'autres généalogistes." },
  { name: 'Connect', text: "Créer du lien familial lors d'une cousinade ou réunion de famille." },
]

const chain = [
  { label: 'Sources & documents', color: 'bg-indigo-100 text-indigo-700' },
  { label: 'Transcription',       color: 'bg-indigo-200 text-indigo-800' },
  { label: 'Extraction',          color: 'bg-indigo-300 text-indigo-900' },
  { label: 'Assertions',          color: 'bg-indigo-400 text-white' },
  { label: 'Entités',             color: 'bg-indigo-500 text-white' },
  { label: 'Graphe historique',   color: 'bg-indigo-700 text-white' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function LandingPageV2() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">

      {/* ── Hero ── */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-0 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:px-8 lg:py-20">
        <div className="px-6 sm:px-0">
          <h1 className="max-w-2xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Reconstruire le monde à partir de ses traces.
          </h1>

          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600">
            REBOND transforme des sources documentaires éparses — actes notariés, registres
            d'état civil, fonds d'archives — en une connaissance structurée, sourcée,
            explicable et explorable.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="/sources"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              Importer une source
              <ArrowRight size={17} />
            </a>
            <a
              href="/ac-actes/liste"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Voir les documents
              <FileSearch size={17} />
            </a>
          </div>
        </div>

        <ChainWidget />
      </section>

      {/* ── Actions ── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-12 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((item) => (
            <SmallCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {features.map((item) => (
            <BigCard key={item.title} icon={item.icon} title={item.title} text={item.text} />
          ))}
        </div>
      </section>

      {/* ── Ce qu'on reconstruit ── */}
      <section className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-8">
        <p className="mb-1 text-xs font-black uppercase tracking-wide text-indigo-600">
          Ce qu'on reconstruit
        </p>
        <h2 className="mb-8 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Pas seulement de la généalogie.
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reconstructions.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <Icon className="mb-4 text-indigo-600" size={22} />
                <h3 className="text-base font-black text-slate-900">{item.label}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Écosystème ── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16 lg:px-8">
        <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-indigo-300">
                Suite Geniius.io
              </p>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                REBOND comme moteur de connaissance.
              </h2>
              <p className="mt-4 text-sm font-medium leading-6 text-slate-300 sm:text-base">
                REBOND reconstitue le monde à partir des archives. Il s'articule
                avec les autres outils de la suite pour une recherche historique complète.
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

// ── Widget chaîne de connaissance ────────────────────────────────────────────

function ChainWidget() {
  return (
    <div className="w-full rounded-none border-y border-slate-200 bg-white/90 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur sm:rounded-[2rem] sm:border lg:max-w-xl lg:justify-self-end">
      <div className="rounded-2xl bg-slate-950 p-5 text-white sm:rounded-[1.75rem] sm:p-6">

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-indigo-300">
              Chaîne de connaissance
            </p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">
              De la trace à l'entité
            </h2>
          </div>
          <div className="rounded-2xl bg-white/10 p-2">
            <Layers size={20} className="text-indigo-300" />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {chain.map((step, i) => (
            <div
              key={step.label}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/10 px-4 py-3"
            >
              <span className="text-xs font-black text-slate-500 w-5 shrink-0">
                0{i + 1}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-black ${step.color}`}
              >
                {step.label}
              </span>
              {i < chain.length - 1 && (
                <ArrowRight size={12} className="ml-auto text-slate-600" />
              )}
              {i === chain.length - 1 && (
                <span className="ml-auto text-xs font-black text-indigo-300">✓</span>
              )}
            </div>
          ))}
        </div>

        <a
          href="/"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-400"
        >
          Accéder à REBOND
          <ArrowRight size={16} />
        </a>

      </div>
    </div>
  )
}

// ── Composants ───────────────────────────────────────────────────────────────

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
    <a
      href={to}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <Icon className="mb-4 text-indigo-600" size={22} />
      <h3 className="text-base font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </a>
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
      <Icon className="mb-5 text-indigo-600" size={26} />
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </article>
  )
}
