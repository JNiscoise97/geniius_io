import type { ElementType } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Cloud,
  Download,
  GitBranch,
  Import,
  Search,
  ShieldCheck,
  TreePine,
  Users,
} from 'lucide-react'

const actions = [
  {
    icon: TreePine,
    title: 'Créer un arbre',
    text: 'Construisez une base claire, génération après génération.',
    to: '/trees/new',
  },
  {
    icon: Import,
    title: 'Importer un GEDCOM',
    text: 'Reprenez un arbre existant sans repartir de zéro.',
    to: '/import',
  },
  {
    icon: Search,
    title: 'Explorer les branches',
    text: 'Retrouvez rapidement personnes, couples et lignées.',
    to: '/explore',
  },
  {
    icon: Download,
    title: 'Exporter',
    text: 'Gardez vos données réutilisables et transmissibles.',
    to: '/export',
  },
]

const ecosystem = [
  { name: 'Rebond', text: 'Reconstituer les parcours des individus à partir des actes.' },
  { name: 'Echo', text: 'Gérer vos contacts et échanges généalogiques.' },
  { name: 'Journal', text: 'Consigner vos connaissances et hypothèses.' },
  { name: 'Connect', text: 'Créer du lien familial lors d’une cousinade.' },
]

const existingTrees = [
  {
    id: 'tanjama',
    name: 'Famille TANJAMA',
    people: 428,
    sources: 91,
    updatedAt: 'Mis à jour récemment',
  },
  {
    id: 'visram',
    name: 'Branche VISRAM',
    people: 126,
    sources: 34,
    updatedAt: 'Dernière exploration',
  },
  {
    id: 'italie',
    name: 'Ascendance ITALIE',
    people: 87,
    sources: 18,
    updatedAt: 'À enrichir',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-0 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:px-8 lg:py-20">
        <div className="px-6 sm:px-0">

          <h1 className="max-w-2xl text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            L’arbre familial au cœur de votre généalogie.
          </h1>

          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600">
            Créez, explorez, enrichissez et exportez vos arbres familiaux depuis partout.
            Tree devient la base simple et durable de votre écosystème Geniius.io.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800">
              Créer mon arbre
              <ArrowRight size={17} />
            </button>

            <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-50">
              Importer un GEDCOM
              <Import size={17} />
            </button>
          </div>
        </div>

        <TreesPreview />
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-12 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((item) => (
            <SmallCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <BigCard
            icon={Cloud}
            title="Accès partout"
            text="Votre arbre reste disponible sur ordinateur, tablette ou mobile, sans dépendre d’un seul fichier local."
          />
          <BigCard
            icon={ShieldCheck}
            title="Données maîtrisées"
            text="Tree est pensé pour garder une généalogie structurée, claire, exportable et durable."
          />
          <BigCard
            icon={Users}
            title="Transmission familiale"
            text="Préparez le partage avec vos proches, vos cousins, vos témoins et les générations suivantes."
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16 lg:px-8">
        <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-300">
                Suite Geniius.io
              </p>

              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                Tree comme point de départ.
              </h2>

              <p className="mt-4 text-sm font-medium leading-6 text-slate-300 sm:text-base">
                Votre arbre n’est pas isolé : il peut devenir le socle qui relie vos actes,
                vos contacts, vos connaissances et vos événements familiaux.
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

function TreesPreview() {
  return (
    <div className="w-full rounded-none border-y border-slate-200 bg-white/90 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur sm:rounded-[2rem] sm:border lg:max-w-xl lg:justify-self-end">
      <div className="rounded-2xl bg-slate-950 p-5 text-white sm:rounded-[1.75rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-300">
              Mes arbres
            </p>

            <h2 className="mt-1 text-2xl font-black sm:text-3xl">
              Arbres récents
            </h2>
          </div>

          <div className="rounded-2xl bg-white/10 p-2">
            <TreePine size={20} className="text-emerald-300" />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {existingTrees.map((tree) => (
            <TreeRow key={tree.id} tree={tree} />
          ))}
        </div>

        <Link
          to="/trees"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
        >
          Voir tous mes arbres
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}

function TreeRow({
  tree,
}: {
  tree: {
    id: string
    name: string
    people: number
    sources: number
    updatedAt: string
  }
}) {
  return (
    <Link
      to={`/trees/${tree.id}`}
      className="block rounded-2xl border border-white/5 bg-white/10 p-4 transition hover:bg-white/15"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white sm:text-base">
            {tree.name}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-400">
            {tree.updatedAt}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-500/10 p-2">
          <GitBranch size={15} className="text-emerald-300" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat value={tree.people} label="personnes" />
        <MiniStat value={tree.sources} label="sources" />
      </div>
    </Link>
  )
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-3">
      <p className="text-lg font-black leading-none text-white">{value}</p>

      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  )
}

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
    <Link to={to} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Icon className="mb-4 text-emerald-700" size={22} />
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
      <Icon className="mb-5 text-indigo-700" size={26} />
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </article>
  )
}