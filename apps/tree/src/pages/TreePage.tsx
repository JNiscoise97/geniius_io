import type { ElementType } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Camera,
  Clock3,
  Code2,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  GitBranch,
  Globe2,
  History,
  Layers3,
  Lock,
  MapPin,
  Network,
  Compass,
  Search,
  Share2,
  ShieldCheck,
  Split,
  TreePine,
  UserRound,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const tabs = [
  'Vue d’ensemble',
  'Recherche',
  'Collaboration',
  'Vues & sous-arbres',
  'Médias',
  'Analyse historique',
  'Power user',
]

const overviewStats = [
  { label: 'Personnes', value: '428', icon: Users },
  { label: 'Familles / couples', value: '132', icon: UserRound },
  { label: 'Générations', value: '9', icon: Layers3 },
  { label: 'Sources', value: '91', icon: FileText },
  { label: 'Lieux', value: '37', icon: MapPin },
  { label: 'Branches', value: '12', icon: GitBranch },
]

const completeness = [
  { label: 'Date de naissance', value: 72 },
  { label: 'Lieu de naissance', value: 68 },
  { label: 'Décès renseigné', value: 54 },
  { label: 'Parents connus', value: 61 },
  { label: 'Au moins une source', value: 43 },
  { label: 'Photo ou média', value: 18 },
]

const sourceTypes = [
  { label: 'État civil', value: 46 },
  { label: 'Notariat', value: 14 },
  { label: 'Recensements', value: 9 },
  { label: 'Hypothèques', value: 7 },
  { label: 'Presse', value: 5 },
  { label: 'Témoignages', value: 10 },
]

const qualityAlerts = [
  { icon: AlertTriangle, title: '12 incohérences chronologiques', text: 'Événements impossibles ou dates à vérifier.' },
  { icon: Split, title: '8 doublons potentiels', text: 'Même nom, même période, même commune.' },
  { icon: GitBranch, title: '23 filiations faibles', text: 'Relations sans source directe ou hypothèse.' },
  { icon: MapPin, title: '6 lieux ambigus', text: 'Toponymes à normaliser ou géocoder.' },
]

const researchBacklog = [
  '31 personnes sans parents connus',
  '18 individus sans source',
  '14 actes à retrouver',
  '9 pistes ouvertes',
  '5 branches peu explorées',
]

const collaborators = [
  { name: 'Jordan Niscoise', role: 'Propriétaire', access: 'Complet' },
  { name: 'Sarah', role: 'Collaboratrice', access: 'Édition' },
  { name: 'Famille TANJAMA', role: 'Groupe invité', access: 'Lecture' },
]

const views = [
  { name: 'Branche maternelle', count: '184 personnes', type: 'Vue dynamique' },
  { name: 'Descendants de Coundiaman TANJAMA', count: '76 personnes', type: 'Sous-arbre' },
  { name: 'Engagés indiens', count: '42 personnes', type: 'Segment historique' },
  { name: 'Personnes nées avant 1848', count: '31 personnes', type: 'Filtre chronologique' },
]

const mediaStats = [
  { label: 'Photos', value: '64', icon: Camera },
  { label: 'Scans', value: '91', icon: FileText },
  { label: 'Témoignages', value: '12', icon: BookOpen },
  { label: 'Cartes', value: '8', icon: MapPin },
]

const historicalStats = [
  { label: 'Métiers recensés', value: '43' },
  { label: 'Patronymes', value: '118' },
  { label: 'Migrations', value: '9' },
  { label: 'Événements historiques liés', value: '6' },
]

export default function TreePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <section className="mx-auto w-full max-w-7xl px-0 py-6 sm:px-6 lg:px-8">
        <div className="px-6 sm:px-0">
          <button className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-emerald-700">
            <ArrowLeft size={17} />
            Retour aux arbres
          </button>
        </div>

        <header className="rounded-none border-y border-slate-200 bg-white p-6 shadow-sm sm:rounded-3xl sm:border lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Arbre familial
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Famille TANJAMA
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                Arbre de travail pour explorer les branches réunionnaises, indiennes,
                malgaches et guadeloupéennes de la famille. Import GEDCOM enrichi
                progressivement par sources, médias, hypothèses et vues dynamiques.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge icon={TreePine} text="Personne racine : Coundiaman TANJAMA" />
                <Badge icon={Clock3} text="1670 → 2026" />
                <Badge icon={Globe2} text="Réunion · Inde · Madagascar · Guadeloupe" />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                to="/trees/tanjama/navigate"
              >
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800">
                <Compass size={17} />
                Naviguer dans l’arbre
                </button>
              </Link>
              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm hover:bg-slate-50">
                <Share2 size={17} />
                Partager
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm hover:bg-slate-50">
                <Download size={17} />
                Exporter
              </button>
            </div>
          </div>
        </header>

        <nav className="mt-5 flex gap-2 overflow-x-auto px-6 pb-2 sm:px-0">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={[
                'shrink-0 rounded-full px-4 py-2 text-sm font-black',
                index === 0
                  ? 'bg-slate-950 text-white'
                  : 'border border-slate-200 bg-white text-slate-600',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </nav>
      </section>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-0 pb-12 sm:px-6 lg:px-8">
        <OverviewTab />
        <ResearchTab />
        <GovernanceTab />
        <ViewsTab />
        <MediaTab />
        <HistoricalTab />
        <PowerUserTab />
      </main>
    </div>
  )
}

function OverviewTab() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Panel title="Périmètre réel de l’arbre" subtitle="Taille, couverture et structure de base.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {overviewStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoLine label="Individus reliés" value="403" />
          <InfoLine label="Individus isolés" value="25" />
          <InfoLine label="Ancêtre le plus ancien" value="Séverin AUBER · 1670 env." />
          <InfoLine label="Lignée la plus profonde" value="9 générations" />
        </div>
      </Panel>

      <Panel title="Complétude" subtitle="Est-ce un arbre solide ou encore vide ?">
        <div className="space-y-4">
          {completeness.map((item) => (
            <ProgressLine key={item.label} {...item} />
          ))}
        </div>
      </Panel>

      <Panel title="Sources documentaires" subtitle="Ce qui fonde la fiabilité historique.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sourceTypes.map((source) => (
            <div key={source.label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-slate-950">{source.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                {source.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MiniAlert label="Sources liées" value="74" good />
          <MiniAlert label="Non exploitées" value="17" />
          <MiniAlert label="Sans validation" value="9" />
        </div>
      </Panel>

      <Panel title="Dernière activité" subtitle="Cet arbre vit-il encore ?">
        <Timeline />
      </Panel>
    </section>
  )
}

function ResearchTab() {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Panel title="Cohérence & qualité" subtitle="Les zones faibles à traiter en priorité.">
        <div className="grid gap-3">
          {qualityAlerts.map((alert) => (
            <QualityAlert key={alert.title} {...alert} />
          ))}
        </div>
      </Panel>

      <Panel title="Backlog de recherche" subtitle="Un arbre est aussi une liste de pistes.">
        <div className="grid gap-3 sm:grid-cols-2">
          {researchBacklog.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-800">{item}</p>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  )
}

function GovernanceTab() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Panel title="Propriété & origine" subtitle="D’où vient l’arbre ? Qui le porte ?">
        <div className="grid gap-3">
          <InfoLine label="Créateur" value="Jordan Niscoise" />
          <InfoLine label="Propriétaire" value="Jordan Niscoise" />
          <InfoLine label="Origine" value="Import GEDCOM + enrichissement manuel" />
          <InfoLine label="Fusion" value="2 arbres familiaux fusionnés" />
          <InfoLine label="Dernier import" value="GEDCOM · 21 mai 2026" />
        </div>
      </Panel>

      <Panel title="Partage & visibilité" subtitle="Accès, droits et invitations.">
        <div className="grid gap-3">
          {collaborators.map((user) => (
            <div key={user.name} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="font-black text-slate-950">{user.name}</p>
                <p className="text-sm font-medium text-slate-600">{user.role}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                {user.access}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Historique des modifications" subtitle="Versions, snapshots et restauration.">
        <Timeline />
      </Panel>

      <Panel title="Sécurité" subtitle="Branches privées et visibilité fine.">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniFeature icon={Lock} title="Branches privées" text="3 branches masquées." />
          <MiniFeature icon={Eye} title="Version publique" text="Une vue partageable existe." />
          <MiniFeature icon={History} title="Snapshots" text="12 sauvegardes disponibles." />
          <MiniFeature icon={ShieldCheck} title="Restauration" text="Retour possible à une version." />
        </div>
      </Panel>
    </section>
  )
}

function ViewsTab() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <Panel title="Sous-arbres & vues dynamiques" subtitle="Comme des vues SQL appliquées à l’arbre.">
        <div className="grid gap-3">
          {views.map((view) => (
            <div key={view.name} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-black text-slate-950">{view.name}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">{view.type}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                {view.count}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Arbres dérivés" subtitle="Versions de travail, publiques ou hypothétiques.">
        <div className="grid gap-3">
          <MiniFeature icon={Database} title="Copie de travail" text="1 version brouillon." />
          <MiniFeature icon={Share2} title="Version publique" text="Masque les vivants." />
          <MiniFeature icon={GitBranch} title="Branche exportable" text="Descendants TANJAMA." />
          <MiniFeature icon={Split} title="Version hypothétique" text="Filiations à confirmer." />
        </div>
      </Panel>
    </section>
  )
}

function MediaTab() {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Médias liés" subtitle="Photos, scans, témoignages et objets.">
        <div className="grid gap-3 sm:grid-cols-2">
          {mediaStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </Panel>

      <Panel title="À enrichir" subtitle="Les médias qui peuvent encore créer de la valeur.">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniAlert label="Photos non identifiées" value="18" />
          <MiniAlert label="Sources sans transcription" value="22" />
          <MiniAlert label="Mémoires audio liées" value="7" good />
          <MiniAlert label="Personnes sans photo" value="351" />
        </div>
      </Panel>
    </section>
  )
}

function HistoricalTab() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Panel title="Observatoire historique familial" subtitle="Répartitions et phénomènes historiques.">
        <div className="grid gap-3 sm:grid-cols-2">
          {historicalStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-slate-950">{stat.value}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Événements historiques liés" subtitle="Contextualisation des parcours.">
        <div className="flex flex-wrap gap-2">
          {['Esclavage', 'Engagisme', 'Abolition', 'Migrations', 'Épidémies', 'Notariat'].map((tag) => (
            <span key={tag} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
              {tag}
            </span>
          ))}
        </div>
      </Panel>
    </section>
  )
}

function PowerUserTab() {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <Panel title="Interopérabilité" subtitle="Réutiliser et déplacer les données.">
        <div className="grid gap-3">
          <MiniFeature icon={Download} title="Export GEDCOM" text="Compatible logiciels classiques." />
          <MiniFeature icon={Code2} title="Export JSON" text="Structure exploitable." />
          <MiniFeature icon={Database} title="API" text="Accès programmatique futur." />
        </div>
      </Panel>

      <Panel title="Recherche avancée" subtitle="Interroger l’arbre comme une base.">
        <div className="grid gap-3">
          <MiniFeature icon={Filter} title="Filtres complexes" text="Dates, lieux, statuts, sources." />
          <MiniFeature icon={Search} title="Phonétique" text="Variantes de noms." />
          <MiniFeature icon={MapPin} title="Recherche géographique" text="Lieux et voisinages." />
        </div>
      </Panel>

      <Panel title="Graphe relationnel" subtitle="Voir les réseaux derrière les filiations.">
        <div className="grid gap-3">
          <MiniFeature icon={Network} title="Témoins récurrents" text="Réseaux sociaux historiques." />
          <MiniFeature icon={Users} title="Familles liées" text="Alliances et voisinages." />
          <MiniFeature icon={BookOpen} title="Héritages" text="Liens notariés et propriétés." />
        </div>
      </Panel>
    </section>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-none border-y border-slate-200 bg-white p-6 shadow-sm sm:rounded-3xl sm:border">
      <div className="mb-5">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        {subtitle && <p className="mt-1 text-sm font-medium text-slate-600">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: ElementType
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon size={18} className="text-emerald-700" />
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}

function ProgressLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-700">{label}</p>
        <p className="text-sm font-black text-emerald-700">{value}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  )
}

function MiniAlert({
  label,
  value,
  good,
}: {
  label: string
  value: string
  good?: boolean
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className={good ? 'text-2xl font-black text-emerald-700' : 'text-2xl font-black text-orange-600'}>
        {value}
      </p>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}

function QualityAlert({
  icon: Icon,
  title,
  text,
}: {
  icon: ElementType
  title: string
  text: string
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4">
      <Icon size={18} className="mt-0.5 shrink-0 text-orange-600" />
      <div>
        <p className="font-black text-slate-950">{title}</p>
        <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{text}</p>
      </div>
    </div>
  )
}

function MiniFeature({
  icon: Icon,
  title,
  text,
}: {
  icon: ElementType
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon size={18} className="text-emerald-700" />
      <p className="mt-3 font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{text}</p>
    </div>
  )
}

function Badge({
  icon: Icon,
  text,
}: {
  icon: ElementType
  text: string
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
      <Icon size={14} />
      {text}
    </span>
  )
}

function Timeline() {
  const events = [
    'Coundiaman TANJAMA modifiée',
    'Source ajoutée : acte de baptême 1908',
    'Vue créée : Engagés indiens',
    'Snapshot automatique généré',
  ]

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <div key={event} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="mt-1 h-3 w-3 rounded-full bg-emerald-500" />
            {index < events.length - 1 && <div className="h-full w-px bg-slate-200" />}
          </div>
          <div className="pb-4">
            <p className="text-sm font-black text-slate-950">{event}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Aujourd’hui · Jordan</p>
          </div>
        </div>
      ))}
    </div>
  )
}