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
  ChevronRight,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { graph } from '../components/tree-navigate/data'
import { useTreeStats } from '../hook/useTreeStats'

// ─────────────────────────────────────────────────────────────────────────────
// Marqueur visuel — données encore statiques
// ─────────────────────────────────────────────────────────────────────────────

function Static({ children, inline }: { children: React.ReactNode; inline?: boolean }) {
  const Tag = inline ? 'span' : 'div'
  return (
    <Tag
      title="Donnée statique — à brancher sur une logique dédiée"
      className={inline ? 'relative inline-flex items-center gap-1' : 'relative'}
    >
      {children}
      <span
        aria-hidden
        className={
          inline
            ? 'ml-1 inline-block rounded-full bg-red-500/20 px-1 text-[10px] font-black uppercase tracking-wide text-red-600'
            : 'pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-red-400/60'
        }
      >
        {inline ? '⬤' : null}
      </span>
    </Tag>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Lien vers une page de détail
// ─────────────────────────────────────────────────────────────────────────────

function DetailLink({
  to,
  children,
  className,
}: {
  to: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={[
        'relative cursor-pointer transition-all hover:ring-2 hover:ring-emerald-400/60 hover:ring-offset-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
      <span className="absolute right-3 top-3">
        <ChevronRight size={14} className="text-emerald-400" />
      </span>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const tabs = [
  "Vue d'ensemble",
  'Recherche',
  'Collaboration',
  'Vues & sous-arbres',
  'Médias',
  'Analyse historique',
  'Power user',
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

export default function TreePage() {
  const { treeId } = useParams<{ treeId: string }>()
  const stats = useTreeStats(graph)
  const base = `/trees/${treeId}/stats`

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
              <Link to={`/trees/${treeId}/navigate`}>
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800">
                  <Compass size={17} />
                  Naviguer dans l'arbre
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
        <OverviewTab stats={stats} base={base} />
        <ResearchTab stats={stats} base={base} />
        <GovernanceTab />
        <ViewsTab />
        <MediaTab stats={stats} base={base} />
        <HistoricalTab stats={stats} base={base} />
        <PowerUserTab />
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────────────

function OverviewTab({ stats, base }: { stats: ReturnType<typeof useTreeStats>; base: string }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Panel title="Périmètre réel de l'arbre" subtitle="Taille, couverture et structure de base.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailLink to={`${base}/people`} className="rounded-2xl">
            <StatCard label="Personnes" value={String(stats.totalPeople)} icon={Users} />
          </DetailLink>
          <StatCard label="Familles / couples" value={String(stats.totalFamilies)} icon={UserRound} />
          <StatCard label="Générations" value={String(stats.totalGenerations)} icon={Layers3} />
          <DetailLink to={`${base}/sources`} className="rounded-2xl">
            <StatCard label="Sources" value={String(stats.totalSources)} icon={FileText} />
          </DetailLink>
          <DetailLink to={`${base}/places`} className="rounded-2xl">
            <StatCard label="Lieux" value={String(stats.totalPlaces)} icon={MapPin} />
          </DetailLink>
          <StatCard label="Branches" value={String(stats.totalBranches)} icon={GitBranch} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DetailLink to={`${base}/people`} className="rounded-2xl">
            <InfoLine label="Individus reliés" value={String(stats.connectedPeople)} />
          </DetailLink>
          <DetailLink to={`${base}/isolated`} className="rounded-2xl">
            <InfoLine label="Individus isolés" value={String(stats.isolatedPeople)} />
          </DetailLink>
          <InfoLine
            label="Ancêtre le plus ancien"
            value={
              stats.oldestAncestor
                ? `${stats.oldestAncestor.name} · ${stats.oldestAncestor.year} env.`
                : '—'
            }
          />
          <InfoLine label="Lignée la plus profonde" value={`${stats.deepestLineage} générations`} />
        </div>
      </Panel>

      <DetailLink to={`${base}/completeness`} className="rounded-none sm:rounded-3xl">
        <Panel title="Complétude" subtitle="Cliquer pour voir le détail champ par champ.">
          <div className="space-y-4">
            {[
              { label: 'Date de naissance',   value: stats.completeness.birthDate },
              { label: 'Lieu de naissance',   value: stats.completeness.birthPlace },
              { label: 'Décès renseigné',     value: stats.completeness.death },
              { label: 'Parents connus',      value: stats.completeness.parentsKnown },
              { label: 'Au moins une source', value: stats.completeness.anySource },
              { label: 'Photo ou média',      value: stats.completeness.mediaOrPhoto },
            ].map((item) => (
              <ProgressLine key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </Panel>
      </DetailLink>

      <Panel title="Sources documentaires" subtitle="Ce qui fonde la fiabilité historique.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.sourcesByType.map((source) => (
            <div key={source.label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-slate-950">{source.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                {source.label}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <DetailLink to={`${base}/sources`} className="rounded-2xl">
            <MiniAlert label="Sources liées" value={String(stats.sourcesLinked)} good />
          </DetailLink>
          <MiniAlert label="Non exploitées" value={String(stats.sourcesUnused)} />
          <MiniAlert label="Sans validation" value={String(stats.sourcesUnvalidated)} />
        </div>
      </Panel>

      <Panel title="Dernière activité" subtitle="Cet arbre vit-il encore ?">
        <Timeline />
      </Panel>
    </section>
  )
}

function ResearchTab({ stats, base }: { stats: ReturnType<typeof useTreeStats>; base: string }) {
  const qualityAlerts = [
    { icon: AlertTriangle, title: `${stats.chronologicalInconsistencies} incohérences chronologiques`, text: 'Événements impossibles ou dates à vérifier.',    href: `${base}/inconsistencies` },
    { icon: Split,         title: `${stats.potentialDuplicates} doublons potentiels`,                  text: 'Même nom, même période, même commune.',           href: `${base}/duplicates` },
    { icon: GitBranch,     title: `${stats.weakFiliations} filiations faibles`,                        text: 'Relations sans source directe ou hypothèse.',     href: `${base}/weak-filiations` },
    { icon: MapPin,        title: `${stats.ambiguousPlaces} lieux ambigus`,                            text: 'Toponymes à normaliser ou géocoder.',             href: `${base}/ambiguous-places` },
  ]

  const researchBacklog = [
    { label: `${stats.peopleWithoutParents} personnes sans parents connus`, isStatic: false, href: `${base}/without-parents` },
    { label: `${stats.peopleWithoutSource} individus sans source`,          isStatic: false, href: `${base}/without-source` },
    { label: `${stats.actsToFind} actes à retrouver`,                       isStatic: false, href: `${base}/without-source` },
    { label: `${stats.openLeads} pistes ouvertes`,                          isStatic: true,  href: null },
    { label: `${stats.unexploredBranches} branches peu explorées`,          isStatic: false, href: `${base}/unexplored-branches` },
  ]

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Panel title="Cohérence & qualité" subtitle="Les zones faibles à traiter en priorité.">
        <div className="grid gap-3">
          {qualityAlerts.map((alert) => (
            <DetailLink key={alert.title} to={alert.href} className="rounded-2xl">
              <QualityAlert icon={alert.icon} title={alert.title} text={alert.text} />
            </DetailLink>
          ))}
        </div>
      </Panel>

      <Panel title="Backlog de recherche" subtitle="Un arbre est aussi une liste de pistes.">
        <div className="grid gap-3 sm:grid-cols-2">
          {researchBacklog.map(({ label, isStatic, href }) => {
            const inner = (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-800">{label}</p>
              </div>
            )
            if (isStatic) return <Static key={label}>{inner}</Static>
            if (href) return <DetailLink key={label} to={href} className="rounded-2xl">{inner}</DetailLink>
            return <div key={label}>{inner}</div>
          })}
        </div>
      </Panel>
    </section>
  )
}

function GovernanceTab() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Panel title="Propriété & origine" subtitle="D'où vient l'arbre ? Qui le porte ?">
        <div className="grid gap-3">
          <InfoLine label="Créateur"      value="Jordan Niscoise" />
          <InfoLine label="Propriétaire"  value="Jordan Niscoise" />
          <InfoLine label="Origine"       value="Import GEDCOM + enrichissement manuel" />
          <InfoLine label="Fusion"        value="2 arbres familiaux fusionnés" />
          <InfoLine label="Dernier import" value="GEDCOM · 21 mai 2026" />
        </div>
      </Panel>

      <Panel title="Partage & visibilité" subtitle="Accès, droits et invitations.">
        <div className="grid gap-3">
          {collaborators.map((user) => (
            <div
              key={user.name}
              className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
            >
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
          <MiniFeature icon={Lock}        title="Branches privées" text="3 branches masquées." />
          <MiniFeature icon={Eye}         title="Version publique" text="Une vue partageable existe." />
          <MiniFeature icon={History}     title="Snapshots"        text="12 sauvegardes disponibles." />
          <MiniFeature icon={ShieldCheck} title="Restauration"     text="Retour possible à une version." />
        </div>
      </Panel>
    </section>
  )
}

function ViewsTab() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <Panel title="Sous-arbres & vues dynamiques" subtitle="Comme des vues SQL appliquées à l'arbre.">
        <div className="grid gap-3">
          {views.map((view) => (
            <div
              key={view.name}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
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
          <MiniFeature icon={Database}  title="Copie de travail"    text="1 version brouillon." />
          <MiniFeature icon={Share2}    title="Version publique"    text="Masque les vivants." />
          <MiniFeature icon={GitBranch} title="Branche exportable"  text="Descendants TANJAMA." />
          <MiniFeature icon={Split}     title="Version hypothétique" text="Filiations à confirmer." />
        </div>
      </Panel>
    </section>
  )
}

function MediaTab({ stats, base }: { stats: ReturnType<typeof useTreeStats>; base: string }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Médias liés" subtitle="Photos, scans, témoignages et objets.">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailLink to={`${base}/media`} className="rounded-2xl">
            <StatCard label="Photos" value={String(stats.totalPhotos)} icon={Camera} />
          </DetailLink>
          <DetailLink to={`${base}/media`} className="rounded-2xl">
            <StatCard label="Scans" value={String(stats.totalScans)} icon={FileText} />
          </DetailLink>
          <StatCard
            label="Témoignages"
            value={<Static inline><span>{12}</span></Static>}
            icon={BookOpen}
          />
          <StatCard
            label="Cartes"
            value={<Static inline><span>{8}</span></Static>}
            icon={MapPin}
          />
        </div>
      </Panel>

      <Panel title="À enrichir" subtitle="Les médias qui peuvent encore créer de la valeur.">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailLink to={`${base}/unlinked-photos`} className="rounded-2xl">
            <MiniAlert label="Photos non identifiées" value={String(stats.unidentifiedPhotos)} />
          </DetailLink>
          <MiniAlert label="Sources sans transcription" value={String(stats.sourcesWithoutTranscription)} />
          <MiniAlert label="Mémoires audio liées" value={String(stats.audioMemories)} good />
          <DetailLink to={`${base}/without-source`} className="rounded-2xl">
            <MiniAlert label="Personnes sans photo" value={String(stats.peopleWithoutPhoto)} />
          </DetailLink>
        </div>
      </Panel>
    </section>
  )
}

function HistoricalTab({ stats, base }: { stats: ReturnType<typeof useTreeStats>; base: string }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Panel title="Observatoire historique familial" subtitle="Répartitions et phénomènes historiques.">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailLink to={`${base}/occupations`} className="rounded-2xl">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-slate-950">{stats.totalOccupations}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">Métiers recensés</p>
            </div>
          </DetailLink>
          <DetailLink to={`${base}/lastnames`} className="rounded-2xl">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-slate-950">{stats.totalLastNames}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">Patronymes</p>
            </div>
          </DetailLink>
          <DetailLink to={`${base}/migrations`} className="rounded-2xl">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-slate-950">{stats.totalMigrations}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">Migrations</p>
            </div>
          </DetailLink>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-2xl font-black text-slate-950">{stats.historicalEvents}</p>
            <p className="mt-1 text-sm font-bold text-slate-600">Événements historiques liés</p>
          </div>
        </div>
      </Panel>

      <Panel title="Événements historiques liés" subtitle="Contextualisation des parcours.">
        <div className="flex flex-wrap gap-2">
          {['Esclavage', 'Engagisme', 'Abolition', 'Migrations', 'Épidémies', 'Notariat'].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
            >
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
          <MiniFeature icon={Code2}    title="Export JSON"   text="Structure exploitable." />
          <MiniFeature icon={Database} title="API"           text="Accès programmatique futur." />
        </div>
      </Panel>

      <Panel title="Recherche avancée" subtitle="Interroger l'arbre comme une base.">
        <div className="grid gap-3">
          <MiniFeature icon={Filter} title="Filtres complexes"      text="Dates, lieux, statuts, sources." />
          <MiniFeature icon={Search} title="Phonétique"             text="Variantes de noms." />
          <MiniFeature icon={MapPin} title="Recherche géographique" text="Lieux et voisinages." />
        </div>
      </Panel>

      <Panel title="Graphe relationnel" subtitle="Voir les réseaux derrière les filiations.">
        <div className="grid gap-3">
          <MiniFeature icon={Network}  title="Témoins récurrents" text="Réseaux sociaux historiques." />
          <MiniFeature icon={Users}    title="Familles liées"     text="Alliances et voisinages." />
          <MiniFeature icon={BookOpen} title="Héritages"          text="Liens notariés et propriétés." />
        </div>
      </Panel>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitives UI
// ─────────────────────────────────────────────────────────────────────────────

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
  value: React.ReactNode
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

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
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
            <p className="mt-1 text-xs font-medium text-slate-500">Aujourd'hui · Jordan</p>
          </div>
        </div>
      ))}
    </div>
  )
}