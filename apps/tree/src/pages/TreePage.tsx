import { useEffect, useMemo, useState, type ElementType } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Compass,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  GitBranch,
  History,
  Image,
  Layers3,
  Loader2,
  Lock,
  MapPin,
  Network,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Split,
  TreePine,
  UploadCloud,
  UserRound,
  Users,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { buildGraphFromGedcomText, getBirth, getDeath, getYear } from '@geniius/utils/family-graph'
import { supabase } from '../lib/supabase/client'
import { graph, formatPersonName } from '../components/tree-navigate/data'
import { useTreeStats } from '../hook/useTreeStats'

const BUCKET = 'tree-files'

type StoredFile = { id: string | null; name: string }
type GraphStats = {
  person_count: number
  family_count: number
  media_count: number
  parsed_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Marqueur visuel — données encore statiques (aucune logique réelle derrière)
// ─────────────────────────────────────────────────────────────────────────────

function Static({ children, inline }: { children: React.ReactNode; inline?: boolean }) {
  const Tag = inline ? 'span' : 'div'
  return (
    <Tag
      title="Donnée statique — fonctionnalité pas encore construite"
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
// Lien vers une page de détail réelle (apps/tree/src/pages/TreeStatsPage.tsx)
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
        'relative block cursor-pointer transition-all hover:ring-2 hover:ring-emerald-400/60 hover:ring-offset-1',
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

const tabs = [
  "Vue d'ensemble",
  'Recherche',
  'Collaboration',
  'Vues & sous-arbres',
  'Médias',
  'Analyse historique',
  'Power user',
]

export default function TreePage() {
  const { treeId } = useParams<{ treeId: string }>()

  const [loaded, setLoaded] = useState(false)
  const [treeName, setTreeName] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null)
  const [gedcomFiles, setGedcomFiles] = useState<StoredFile[]>([])
  const [mediaFiles, setMediaFiles] = useState<StoredFile[]>([])
  const [graphStats, setGraphStats] = useState<GraphStats | null>(null)
  const [referencePersonId, setReferencePersonId] = useState<string | undefined>(undefined)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  async function refreshAll(id: string) {
    const [treeRes, gedcomRes, mediaRes, statsRes, sessionRes] = await Promise.all([
      supabase.from('trees').select('name, created_at, reference_person_id').eq('id', id).maybeSingle(),
      supabase.storage.from(BUCKET).list(`${id}/gedcom`),
      supabase.storage.from(BUCKET).list(`${id}/media`),
      supabase
        .from('tree_graph_stats')
        .select('person_count, family_count, media_count, parsed_at')
        .eq('tree_id', id)
        .maybeSingle(),
      supabase.auth.getSession(),
    ])

    setTreeName(treeRes.data?.name ?? null)
    setCreatedAt(treeRes.data?.created_at ?? null)
    setReferencePersonId(treeRes.data?.reference_person_id ?? undefined)
    setGedcomFiles(gedcomRes.data ?? [])
    setMediaFiles(mediaRes.data ?? [])
    setGraphStats(statsRes.data ?? null)
    setOwnerEmail(sessionRes.data.session?.user.email ?? null)
    setLoaded(true)
  }

  async function analyzeGedcom() {
    if (!treeId || gedcomFiles.length === 0) return

    setParsing(true)
    setParseError(null)

    try {
      const gedcomPath = `${treeId}/gedcom/${gedcomFiles[0].name}`
      const { data: blob, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(gedcomPath)

      if (downloadError || !blob) {
        throw new Error(downloadError?.message ?? 'Fichier introuvable')
      }

      const text = await blob.text()
      const graphData = buildGraphFromGedcomText(text)

      const personCount = Object.keys(graphData.people).length
      const familyCount = Object.keys(graphData.families).length
      const mediaCount = Object.keys(graphData.media ?? {}).length

      const graphJson = new Blob([JSON.stringify(graphData)], { type: 'application/json' })
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(`${treeId}/graph/graph.json`, graphJson, { upsert: true, contentType: 'application/json' })

      if (uploadError) throw new Error(uploadError.message)

      const parsedAt = new Date().toISOString()
      const { error: statsError } = await supabase.from('tree_graph_stats').upsert({
        tree_id: treeId,
        person_count: personCount,
        family_count: familyCount,
        media_count: mediaCount,
        parsed_at: parsedAt,
      })

      if (statsError) throw new Error(statsError.message)

      // Le graphe global (chargé une fois par <GraphBootstrap> au montage de la
      // route) ne reflète pas encore ce nouvel import — on recharge la page
      // pour le relire depuis le Storage.
      window.location.reload()
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Échec de l'analyse")
      setParsing(false)
    }
  }

  useEffect(() => {
    if (!treeId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch, setState only runs after await
    refreshAll(treeId)
  }, [treeId])

  const stats = useTreeStats(graph, referencePersonId)

  const yearRange = useMemo(() => {
    const years: number[] = []
    Object.values(graph.people).forEach((p) => {
      const birthYear = getYear(getBirth(p)?.date)
      const deathYear = getYear(getDeath(p)?.date)
      if (birthYear) years.push(birthYear)
      if (deathYear) years.push(deathYear)
    })
    if (years.length === 0) return null
    return { min: Math.min(...years), max: Math.max(...years) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphStats])

  const hasFiles = gedcomFiles.length > 0 || mediaFiles.length > 0
  const isParsed = graphStats !== null && graphStats.person_count > 0

  if (!isParsed) {
    return (
      <ImportPrompt
        loaded={loaded}
        treeName={treeName}
        createdAt={createdAt}
        treeId={treeId}
        hasFiles={hasFiles}
        gedcomFiles={gedcomFiles}
        mediaFiles={mediaFiles}
        graphStats={graphStats}
        parsing={parsing}
        parseError={parseError}
        onAnalyze={analyzeGedcom}
      />
    )
  }

  const referencePerson = referencePersonId ? graph.people[referencePersonId] : undefined
  const base = `/trees/${treeId}/stats`

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <section className="mx-auto w-full max-w-7xl px-0 py-6 sm:px-6 lg:px-8">
        <div className="px-6 sm:px-0">
          <Link
            to="/trees"
            className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-emerald-700"
          >
            <ArrowLeft size={17} />
            Retour aux arbres
          </Link>
        </div>

        <header className="rounded-none border-y border-slate-200 bg-white p-6 shadow-sm sm:rounded-3xl sm:border lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Arbre familial
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {treeName ?? 'Arbre'}
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                Analysé le {graphStats && new Date(graphStats.parsed_at).toLocaleDateString('fr-FR')} à
                partir du GEDCOM importé. {stats.totalPeople.toLocaleString('fr-FR')} personnes et{' '}
                {stats.totalFamilies.toLocaleString('fr-FR')} familles ont été trouvées.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge
                  icon={TreePine}
                  text={
                    referencePerson
                      ? `Personne source : ${formatPersonName(referencePerson)}`
                      : 'Personne source non définie'
                  }
                />
                {yearRange && (
                  <Badge icon={Clock3} text={`${yearRange.min} → ${yearRange.max}`} />
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link to={`/trees/${treeId}/navigate`}>
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800">
                  <Compass size={17} />
                  Naviguer dans l'arbre
                </button>
              </Link>
              <Static>
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm hover:bg-slate-50">
                  <Share2 size={17} />
                  Partager
                </button>
              </Static>
              <Static>
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm hover:bg-slate-50">
                  <Download size={17} />
                  Exporter
                </button>
              </Static>
            </div>
          </div>

          {!referencePersonId && (
            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Aucune personne source définie — les générations, branches et lignées ne peuvent pas
              encore être calculées.{' '}
              <Link to={`/trees/${treeId}/navigate`} className="font-black underline">
                Choisir une personne source
              </Link>
            </p>
          )}
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
        <GovernanceTab ownerEmail={ownerEmail} gedcomFiles={gedcomFiles} graphStats={graphStats} />
        <ViewsTab />
        <MediaTab stats={stats} base={base} />
        <HistoricalTab stats={stats} base={base} />
        <PowerUserTab />
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// État "pas encore analysé" — GEDCOM/médias déposés mais aucun graphe construit
// ─────────────────────────────────────────────────────────────────────────────

function ImportPrompt({
  loaded,
  treeName,
  createdAt,
  treeId,
  hasFiles,
  gedcomFiles,
  mediaFiles,
  graphStats,
  parsing,
  parseError,
  onAnalyze,
}: {
  loaded: boolean
  treeName: string | null
  createdAt: string | null
  treeId: string | undefined
  hasFiles: boolean
  gedcomFiles: StoredFile[]
  mediaFiles: StoredFile[]
  graphStats: GraphStats | null
  parsing: boolean
  parseError: string | null
  onAnalyze: () => void
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto w-full max-w-3xl px-6 py-10 lg:px-8">
        <Link
          to="/trees"
          className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft size={17} />
          Retour aux arbres
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <TreePine size={26} className="text-emerald-700" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950 sm:text-3xl">
            {loaded ? (treeName ?? 'Arbre introuvable') : 'Chargement...'}
          </h1>

          {createdAt && (
            <p className="mt-1 text-xs font-medium text-slate-400">
              Créé le {new Date(createdAt).toLocaleDateString('fr-FR')}
            </p>
          )}

          {graphStats ? (
            <>
              <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-6 text-slate-500">
                Analysé le {new Date(graphStats.parsed_at).toLocaleDateString('fr-FR')}, mais le GEDCOM
                ne contient encore aucune personne exploitable.
              </p>
              <div className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3 text-center">
                <StatTile icon={Users} value={graphStats.person_count} label="Personnes" />
                <StatTile icon={TreePine} value={graphStats.family_count} label="Familles" />
                <StatTile icon={Image} value={graphStats.media_count} label="Médias GEDCOM" />
              </div>
            </>
          ) : (
            <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-6 text-slate-500">
              {hasFiles
                ? "Vos fichiers sont bien déposés et en sécurité."
                : "Cet arbre est vide pour l'instant. Importez un fichier GEDCOM et vos médias pour commencer à le construire."}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {gedcomFiles.length > 0 && (
              <button
                type="button"
                onClick={onAnalyze}
                disabled={parsing}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {parsing ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {parsing ? 'Analyse en cours…' : graphStats ? 'Ré-analyser le GEDCOM' : 'Analyser le GEDCOM'}
              </button>
            )}

            <Link
              to={`/import?tree=${treeId}`}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
            >
              <UploadCloud size={17} />
              {hasFiles ? 'Gérer les fichiers importés' : 'Importer mon GEDCOM et mes médias'}
            </Link>
          </div>

          {parseError && (
            <div className="mx-auto mt-4 max-w-md rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700">
              {parseError}
            </div>
          )}

          {hasFiles && (
            <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
              <FileStatus icon={FileText} label="GEDCOM" files={gedcomFiles} />
              <FileStatus icon={Image} label="Médias" files={mediaFiles} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatTile({ icon: Icon, value, label }: { icon: ElementType; value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon size={16} className="mx-auto text-emerald-700" />
      <p className="mt-2 text-xl font-black text-slate-950">{value.toLocaleString('fr-FR')}</p>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  )
}

function FileStatus({
  icon: Icon,
  label,
  files,
}: {
  icon: ElementType
  label: string
  files: StoredFile[]
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
        <Icon size={14} />
        {label}
      </div>

      {files.length === 0 ? (
        <p className="mt-2 text-sm font-medium text-slate-400">Aucun fichier</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {files.map((file) => (
            <li key={file.id ?? file.name} className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
              <span className="truncate">{file.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tableau de bord — arbre analysé, données réelles branchées sur useTreeStats
// ─────────────────────────────────────────────────────────────────────────────

type Stats = ReturnType<typeof useTreeStats>

function OverviewTab({ stats, base }: { stats: Stats; base: string }) {
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
              { label: 'Date de naissance', value: stats.completeness.birthDate },
              { label: 'Lieu de naissance', value: stats.completeness.birthPlace },
              { label: 'Décès renseigné', value: stats.completeness.death },
              { label: 'Parents connus', value: stats.completeness.parentsKnown },
              { label: 'Au moins une source', value: stats.completeness.anySource },
              { label: 'Photo ou média', value: stats.completeness.mediaOrPhoto },
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
          <Static>
            <MiniAlert label="Non exploitées" value={String(stats.sourcesUnused)} />
          </Static>
          <Static>
            <MiniAlert label="Sans validation" value={String(stats.sourcesUnvalidated)} />
          </Static>
        </div>
      </Panel>

      <Panel title="Dernière activité" subtitle="Cet arbre vit-il encore ?">
        <Static>
          <Timeline />
        </Static>
      </Panel>
    </section>
  )
}

function ResearchTab({ stats, base }: { stats: Stats; base: string }) {
  const qualityAlerts = [
    { icon: AlertTriangle, title: `${stats.chronologicalInconsistencies} incohérences chronologiques`, text: 'Événements impossibles ou dates à vérifier.', href: `${base}/inconsistencies` },
    { icon: Split,         title: `${stats.potentialDuplicates} doublons potentiels`,                  text: 'Même nom, même période, même commune.',   href: `${base}/duplicates` },
    { icon: GitBranch,     title: `${stats.weakFiliations} filiations faibles`,                        text: 'Relations sans source directe ou hypothèse.', href: `${base}/weak-filiations` },
    { icon: MapPin,        title: `${stats.ambiguousPlaces} lieux ambigus`,                            text: 'Toponymes à normaliser ou géocoder.',      href: `${base}/ambiguous-places` },
  ]

  const researchBacklog = [
    { label: `${stats.peopleWithoutParents} personnes sans parents connus`, href: `${base}/without-parents` },
    { label: `${stats.peopleWithoutSource} individus sans source`,          href: `${base}/without-source` },
    { label: `${stats.actsToFind} actes à retrouver`,                       href: null },
    { label: `${stats.unexploredBranches} branches peu explorées`,          href: `${base}/unexplored-branches` },
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
          {researchBacklog.map(({ label, href }) => {
            const inner = (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-800">{label}</p>
              </div>
            )
            if (href) return <DetailLink key={label} to={href} className="rounded-2xl">{inner}</DetailLink>
            return <div key={label}>{inner}</div>
          })}
          <Static>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-800">{stats.openLeads} pistes ouvertes</p>
            </div>
          </Static>
        </div>
      </Panel>
    </section>
  )
}

function GovernanceTab({
  ownerEmail,
  gedcomFiles,
  graphStats,
}: {
  ownerEmail: string | null
  gedcomFiles: StoredFile[]
  graphStats: GraphStats | null
}) {
  const collaborators = [
    { name: ownerEmail ?? 'Vous', role: 'Propriétaire', access: 'Complet' },
  ]

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Panel title="Propriété & origine" subtitle="D'où vient l'arbre ? Qui le porte ?">
        <div className="grid gap-3">
          <InfoLine label="Propriétaire" value={ownerEmail ?? '—'} />
          <InfoLine
            label="Origine"
            value={gedcomFiles.length > 0 ? `Import GEDCOM (${gedcomFiles[0].name})` : '—'}
          />
          <InfoLine
            label="Dernier import"
            value={graphStats ? new Date(graphStats.parsed_at).toLocaleDateString('fr-FR') : '—'}
          />
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
          <Static>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="font-black text-slate-950">Inviter un collaborateur</p>
                <p className="text-sm font-medium text-slate-600">Partage en édition ou lecture</p>
              </div>
            </div>
          </Static>
        </div>
      </Panel>

      <Panel title="Historique des modifications" subtitle="Versions, snapshots et restauration.">
        <Static>
          <Timeline />
        </Static>
      </Panel>

      <Panel title="Sécurité" subtitle="Branches privées et visibilité fine.">
        <Static>
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniFeature icon={Lock} title="Branches privées" text="Masquer des branches sensibles." />
            <MiniFeature icon={Eye} title="Version publique" text="Créer une vue partageable." />
            <MiniFeature icon={History} title="Snapshots" text="Sauvegardes automatiques." />
            <MiniFeature icon={ShieldCheck} title="Restauration" text="Retour à une version antérieure." />
          </div>
        </Static>
      </Panel>
    </section>
  )
}

function ViewsTab() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <Panel title="Sous-arbres & vues dynamiques" subtitle="Comme des vues SQL appliquées à l'arbre.">
        <Static>
          <p className="text-sm font-medium text-slate-500">
            Aucune vue ou sous-arbre enregistré pour l'instant.
          </p>
        </Static>
      </Panel>

      <Panel title="Arbres dérivés" subtitle="Versions de travail, publiques ou hypothétiques.">
        <Static>
          <div className="grid gap-3">
            <MiniFeature icon={Database} title="Copie de travail" text="Créer une version brouillon." />
            <MiniFeature icon={Share2} title="Version publique" text="Masquer les personnes vivantes." />
            <MiniFeature icon={GitBranch} title="Branche exportable" text="Extraire une sous-branche." />
            <MiniFeature icon={Split} title="Version hypothétique" text="Filiations à confirmer." />
          </div>
        </Static>
      </Panel>
    </section>
  )
}

function MediaTab({ stats, base }: { stats: Stats; base: string }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Médias liés" subtitle="Photos, scans et autres documents indexés.">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailLink to={`${base}/media`} className="rounded-2xl">
            <StatCard label="Photos" value={String(stats.totalPhotos)} icon={Camera} />
          </DetailLink>
          <DetailLink to={`${base}/media`} className="rounded-2xl">
            <StatCard label="Scans" value={String(stats.totalScans)} icon={FileText} />
          </DetailLink>
          <StatCard label="Mémoires audio" value={String(stats.audioMemories)} icon={BookOpen} />
          <Static>
            <StatCard label="Cartes" value="—" icon={MapPin} />
          </Static>
        </div>
      </Panel>

      <Panel title="À enrichir" subtitle="Les médias qui peuvent encore créer de la valeur.">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailLink to={`${base}/unlinked-photos`} className="rounded-2xl">
            <MiniAlert label="Photos non attribuées" value={String(stats.unidentifiedPhotos)} />
          </DetailLink>
          <Static>
            <MiniAlert label="Sources sans transcription" value={String(stats.sourcesWithoutTranscription)} />
          </Static>
          <MiniAlert label="Personnes sans photo" value={String(stats.peopleWithoutPhoto)} />
        </div>
      </Panel>
    </section>
  )
}

function HistoricalTab({ stats, base }: { stats: Stats; base: string }) {
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
          <Static>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-slate-950">{stats.historicalEvents}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">Événements historiques liés</p>
            </div>
          </Static>
        </div>
      </Panel>

      <Panel title="Événements historiques liés" subtitle="Contextualisation des parcours.">
        <Static>
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
        </Static>
      </Panel>
    </section>
  )
}

function PowerUserTab() {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <Static>
        <Panel title="Interopérabilité" subtitle="Réutiliser et déplacer les données.">
          <div className="grid gap-3">
            <MiniFeature icon={Download} title="Export GEDCOM" text="Compatible logiciels classiques." />
            <MiniFeature icon={Code2} title="Export JSON" text="Structure exploitable." />
            <MiniFeature icon={Database} title="API" text="Accès programmatique futur." />
          </div>
        </Panel>
      </Static>

      <Static>
        <Panel title="Recherche avancée" subtitle="Interroger l'arbre comme une base.">
          <div className="grid gap-3">
            <MiniFeature icon={Filter} title="Filtres complexes" text="Dates, lieux, statuts, sources." />
            <MiniFeature icon={Search} title="Phonétique" text="Variantes de noms." />
            <MiniFeature icon={MapPin} title="Recherche géographique" text="Lieux et voisinages." />
          </div>
        </Panel>
      </Static>

      <Static>
        <Panel title="Graphe relationnel" subtitle="Voir les réseaux derrière les filiations.">
          <div className="grid gap-3">
            <MiniFeature icon={Network} title="Témoins récurrents" text="Réseaux sociaux historiques." />
            <MiniFeature icon={Users} title="Familles liées" text="Alliances et voisinages." />
            <MiniFeature icon={BookOpen} title="Héritages" text="Liens notariés et propriétés." />
          </div>
        </Panel>
      </Static>
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
    'Arbre importé',
    'Vue créée : à venir',
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
            <p className="mt-1 text-xs font-medium text-slate-500">Aujourd'hui</p>
          </div>
        </div>
      ))}
    </div>
  )
}
