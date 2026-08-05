import type { ElementType, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Cloud,
  Import,
  Link2,
  MapPin,
  ShieldCheck,
  Sparkles,
  TreePine,
  Users,
} from 'lucide-react'

const trustStats = [
  { value: '35 000+', label: 'individus déjà documentés' },
  { value: '100%', label: 'des noms croisés avec vos actes' },
  { value: '0', label: 'fichier local à sauvegarder vous-même' },
]

const features = [
  {
    eyebrow: 'Description automatique',
    title: "Une fiche qui s'écrit toute seule",
    text: "Dès qu'un acte est rattaché à une personne, Tree rédige ce qu'on sait d'elle en phrases claires — pas un formulaire à relire, un texte à vérifier.",
    demo: (
      <DemoDescription
        actsCount={7}
        sourced={false}
        body={(
          <>
            <span className="font-bold text-slate-950">Yves Le Gallo</span> est né en 1839 à{' '}
            <span className="font-semibold text-[#0F8A8A] underline decoration-[#0F8A8A]/30 underline-offset-2">
              Paimpol
            </span>
            . Il épouse{' '}
            <span className="font-semibold text-[#378ADD] underline decoration-[#378ADD]/30 underline-offset-2">
              Marguerite Fresnais
            </span>{' '}
            en 1861, avant de disparaître en mer en 1876.
          </>
        )}
      />
    ),
  },
  {
    eyebrow: 'Navigation',
    title: 'De personne en personne, sans jamais vous perdre',
    text: "Chaque nom cité — un parent, un conjoint, un témoin — devient une porte vers sa propre fiche. L'arbre se parcourt en suivant les gens, pas les onglets.",
    demo: <DemoNavigation />,
  },
  {
    eyebrow: 'Sources',
    title: 'Chaque lieu, chaque preuve, à un clic',
    text: 'Un lieu cité retrouve instantanément qui d’autre y est lié. Et vous savez toujours, en un coup d’œil, si une information vient d’un acte ou reste à confirmer.',
    demo: <DemoSource />,
  },
]

const trustPoints = [
  {
    icon: Cloud,
    title: 'Accès partout',
    text: 'Votre arbre reste disponible sur ordinateur, tablette ou mobile, sans dépendre d’un seul fichier local.',
  },
  {
    icon: ShieldCheck,
    title: 'Données maîtrisées',
    text: 'Une généalogie structurée, sourcée et exportable — vos données restent les vôtres.',
  },
  {
    icon: Users,
    title: 'Transmission familiale',
    text: 'Préparez le partage avec vos proches, vos cousins, vos témoins et les générations suivantes.',
  },
]

const ecosystem = [
  { name: 'Rebond', text: 'Reconstituer les parcours des individus à partir des actes.' },
  { name: 'Echo', text: 'Gérer vos contacts et échanges généalogiques.' },
  { name: 'Journal', text: 'Consigner vos connaissances et hypothèses.' },
  { name: 'Connect', text: 'Créer du lien familial lors d’une cousinade.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
        <div>
          <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
            Chaque personne de votre arbre mérite sa propre histoire.
          </h1>

          <p className="mt-5 max-w-lg text-base font-medium leading-7 text-slate-600">
            Tree lit vos actes et rédige, pour chacun, ce qu'on sait vraiment de lui — sources
            incluses, mis à jour à chaque nouvel acte retrouvé.
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

        <div className="flex flex-col items-stretch gap-3 lg:items-end">
          <FamilyConstellation />
          <DemoDescription featured />
        </div>
      </section>

      {/* ── Bandeau de confiance ─────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-3 lg:px-8">
          {trustStats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="text-2xl font-black text-slate-950">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fonctionnalités, en démonstration ────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-16 lg:gap-24">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={[
                'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
                index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : '',
              ].join(' ')}
            >
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                  {feature.eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                  {feature.title}
                </h2>
                <p className="mt-4 max-w-md text-sm font-medium leading-6 text-slate-600 sm:text-base">
                  {feature.text}
                </p>
              </div>

              {feature.demo}
            </div>
          ))}
        </div>
      </section>

      {/* ── Confiance / vie privée ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {trustPoints.map((point) => (
            <BigCard key={point.title} {...point} />
          ))}
        </div>
      </section>

      {/* ── Écosystème Geniius.io ────────────────────────────────────────── */}
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
                Votre arbre n'est pas isolé : il peut devenir le socle qui relie vos actes,
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

      {/* ── CTA finale ───────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20 lg:px-8">
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-slate-200 bg-slate-50/60 px-6 py-14 text-center">
          <TreePine size={28} className="text-emerald-700" />
          <h2 className="max-w-xl text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
            Prêt à retrouver le fil de votre histoire ?
          </h2>
          <Link
            to="/trees"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
          >
            Voir mes arbres
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  )
}

// ── Illustration ───────────────────────────────────────────────────────────────

function FamilyConstellation() {
  return (
    <svg
      viewBox="0 0 320 92"
      aria-hidden="true"
      className="h-20 w-full max-w-[360px] sm:h-24"
    >
      <g stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6">
        <path d="M28,64 L82,32" />
        <path d="M82,32 L152,54" />
        <path d="M152,54 L150,18" />
        <path d="M152,54 L222,28" />
        <path d="M222,28 L292,58" />
      </g>

      <circle cx="28" cy="64" r="9" fill="#cbd5e1" />
      <circle cx="82" cy="32" r="11" fill="#a7f3d0" />
      <circle cx="150" cy="18" r="8" fill="#6366f1" opacity="0.85" />
      <circle cx="152" cy="54" r="17" fill="#047857" />
      <circle cx="222" cy="28" r="11" fill="#34d399" />
      <circle cx="292" cy="58" r="9" fill="#cbd5e1" />
    </svg>
  )
}

// ── Démos "produit réel" ──────────────────────────────────────────────────────

function DemoDescription({
  featured = false,
  actsCount = 12,
  sourced = true,
  body,
}: {
  featured?: boolean
  actsCount?: number
  sourced?: boolean
  body?: ReactNode
}) {
  return (
    <div
      className={[
        'w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-6',
        featured ? 'lg:max-w-md lg:justify-self-end' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
          <Sparkles size={12} />
          Généré automatiquement · {actsCount} actes
        </p>
        <span
          className={[
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold',
            sourced ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
          ].join(' ')}
        >
          <span className={['h-[6px] w-[6px] rounded-full', sourced ? 'bg-emerald-500' : 'bg-slate-400'].join(' ')} />
          {sourced ? 'Source liée' : 'Aucune source liée'}
        </span>
      </div>

      <p className="mt-4 text-[13px] leading-6 text-slate-700">
        {body ?? (
          <>
            <span className="font-bold text-slate-950">Marguerite Fresnais</span> est née le 3
            mars 1842 à{' '}
            <span className="font-semibold text-[#0F8A8A] underline decoration-[#0F8A8A]/30 underline-offset-2">
              Plouha
            </span>
            , dans les Côtes-du-Nord. Elle épouse{' '}
            <span className="font-semibold text-[#378ADD] underline decoration-[#378ADD]/30 underline-offset-2">
              Yves Le Gallo
            </span>{' '}
            en 1861, puis tient l'auberge du bourg après son veuvage.
          </>
        )}
      </p>
    </div>
  )
}

function DemoNavigation() {
  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-6">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        Il est le fils de
      </p>
      <div className="mt-3 flex flex-col gap-2.5">
        {[
          { name: 'Jean-Baptiste Fresnais', role: 'Père', active: true },
          { name: 'Anne Le Roux', role: 'Mère', active: false },
        ].map((person) => (
          <div
            key={person.name}
            className={[
              'flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition',
              person.active ? 'border-[#378ADD] bg-[#378ADD]/[0.04]' : 'border-slate-200',
            ].join(' ')}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[13px] font-black text-blue-700">
              {person.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[9px] font-bold uppercase tracking-wide text-slate-400">
                {person.role}
              </p>
              <p className="truncate text-[13px] font-bold text-slate-950">{person.name}</p>
            </div>
            <ArrowRight size={15} className="shrink-0 text-slate-300" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DemoSource() {
  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-6">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-slate-400">
        <MapPin size={12} />
        Lieu cité
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
        <span className="text-[14px] font-black text-[#0F8A8A]">Kerouzine</span>
        <span className="text-[11px] font-bold text-slate-400">7 mentions</span>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3">
        <Link2 size={14} className="shrink-0 text-emerald-700" />
        <p className="text-[12px] font-semibold text-emerald-800">
          Acte de vente, 1872 — Arch. dép. 22 · 4 E 1122
        </p>
      </div>
    </div>
  )
}

// ── Cartes de confiance ───────────────────────────────────────────────────────

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
      <Icon className="mb-5 text-emerald-700" size={26} />
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </article>
  )
}
