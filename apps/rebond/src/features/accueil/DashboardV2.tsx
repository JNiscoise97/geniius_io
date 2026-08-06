import { useNavigate } from 'react-router-dom'
import {
  Library,
  FileEdit,
  Sparkles,
  Users2,
  GitMerge,
  Network,
  Map,
  ShieldCheck,
  Search,
  BarChart3,
  Share2,
  Settings,
  ChevronRight,
  Clock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

type Section = {
  id: string
  label: string
  icon: React.ElementType
  accent: string
  bg: string
  border: string
  items: string[]
  description: string
  badge?: string
  badgeColor?: string
  to?: string
}

const sections: Section[] = [
  {
    id: 'sources',
    label: 'Patrimoine documentaire',
    icon: Library,
    accent: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    description: 'Sources, documents et corpus — le socle de la chaîne de connaissance',
    items: ['En attente', 'Sources', 'Documents', 'Corpus'],
    badge: '3',
    badgeColor: 'bg-orange-100 text-orange-700',
    to: '/mock/sources-corpus',
  },
  {
    id: 'atelier',
    label: 'Atelier documentaire',
    icon: FileEdit,
    accent: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    description: 'Transcrire, annoter, relire et versionner',
    items: ['À transcrire', 'Transcription', 'Annotation', 'Versions'],
  },
  {
    id: 'extraction',
    label: 'Extraction',
    icon: Sparkles,
    accent: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    description: 'Identifier les mentions et produire des assertions',
    items: ['Mentions détectées', 'Suggestions IA', 'À valider', 'Assertions'],
    badge: 'IA',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'entites',
    label: 'Entités',
    icon: Users2,
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    description: 'Personnes, lieux, biens, organisations et contrats',
    items: ['Personnes', 'Lieux', 'Biens', 'Organisations'],
  },
  {
    id: 'reconciliation',
    label: 'Réconciliation',
    icon: GitMerge,
    accent: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    description: 'Rapprocher et fusionner les entités identiques',
    items: ['Propositions', 'Personnes', 'Lieux', 'Biens'],
  },
  {
    id: 'graphe',
    label: 'Graphe historique',
    icon: Network,
    accent: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    description: 'Explorer les réseaux, relations, événements et hypothèses',
    items: ['Explorateur', 'Réseaux', 'Événements', 'Hypothèses'],
  },
  {
    id: 'cartographie',
    label: 'Cartographie',
    icon: Map,
    accent: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    description: 'Lieux, voisinages, déplacements et évolutions territoriales',
    items: ['Carte des lieux', 'Propriétés', 'Voisinages', 'Trajectoires'],
  },
  {
    id: 'qualite',
    label: 'Qualité & validation',
    icon: ShieldCheck,
    accent: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    description: 'Valider les connaissances, corriger les incohérences',
    items: ['À valider', 'Incohérences', 'Doublons', 'Décisions'],
  },
  {
    id: 'recherche',
    label: 'Recherche',
    icon: Search,
    accent: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    description: 'Rechercher dans les documents, entités et relations',
    items: ['Globale', 'Documentaire', 'Entités', 'Avancée'],
  },
  {
    id: 'restitutions',
    label: 'Restitutions',
    icon: BarChart3,
    accent: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    description: 'Arbres, chronologies, cartes, chaînes et rapports',
    items: ['Arbres', 'Chronologies', 'Cartes', 'Rapports'],
  },
  {
    id: 'exports',
    label: 'Exports & intégrations',
    icon: Share2,
    accent: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
    description: 'Exporter, synchroniser et exposer les connaissances',
    items: ['Exports', 'API', 'Synchronisations', 'Historique'],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Settings,
    accent: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    description: 'Utilisateurs, référentiels, règles et paramètres',
    items: ['Utilisateurs', 'Référentiels', 'Règles métier', 'Paramètres'],
  },
]

const stats = [
  { label: 'Documents', value: '7', sub: 'référencés', highlight: false },
  { label: 'Transcriptions', value: '2', sub: 'complètes', highlight: false },
  { label: 'Entités', value: '—', sub: 'reconstruites', highlight: false },
  { label: 'En attente', value: '3', sub: 'tâches patrimoine', highlight: true },
]

type Task = {
  label: string
  count: string
  color: string
  to?: string
  divider?: boolean
}

const tasks: Task[] = [
  { label: 'Sources à qualifier', count: '1', color: 'bg-orange-50 text-orange-700', to: '/mock/sources-corpus' },
  { label: 'Documents à rattacher', count: '1', color: 'bg-orange-50 text-orange-700', to: '/mock/sources-corpus' },
  { label: 'Documents à décrire', count: '1', color: 'bg-orange-50 text-orange-700', to: '/mock/sources-corpus' },
  { label: 'Mentions à valider', count: '—', color: 'bg-amber-50 text-amber-700', divider: true },
  { label: 'Propositions de réconciliation', count: '—', color: 'bg-rose-50 text-rose-700' },
  { label: 'Incohérences détectées', count: '—', color: 'bg-orange-50 text-orange-700' },
  { label: 'Hypothèses à arbitrer', count: '—', color: 'bg-purple-50 text-purple-700' },
]

export function DashboardV2() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Hero */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Reconstruction de la connaissance historique
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Des traces documentaires aux entités reconstruites — personnes, lieux, biens, réseaux, territoires.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map(s => (
            <div
              key={s.label}
              className={`rounded-xl border px-5 py-4 ${
                s.highlight
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className={`text-2xl font-bold tabular-nums ${s.highlight ? 'text-orange-600' : 'text-gray-900'}`}>
                {s.value}
              </div>
              <div className="text-sm font-medium text-gray-700 mt-0.5">{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Sections grid */}
        <div className="grid grid-cols-3 gap-3">
          {sections.map(section => {
            const Icon = section.icon
            return (
              <div
                key={section.id}
                onClick={() => section.to && navigate(section.to)}
                className={`bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-300 hover:shadow-sm transition-all group ${section.to ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${section.bg} border ${section.border} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${section.accent}`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {section.badge && (
                      <span className={`text-xs font-medium rounded px-1.5 py-0.5 ${section.badgeColor}`}>
                        {section.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>

                <div className="text-sm font-medium text-gray-900 mb-1">{section.label}</div>
                <div className="text-xs text-gray-500 mb-3 leading-relaxed">{section.description}</div>

                <div className="flex flex-wrap gap-1.5">
                  {section.items.map(item => (
                    <span
                      key={item}
                      className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-0.5"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-3">

          {/* Recent activity */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Activité récente</span>
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
                  <span className="text-xs text-gray-400">Les actions apparaîtront ici</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-gray-700">Tâches à traiter</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {tasks.map(task => (
                <div key={task.label}>
                  {task.divider && <div className="border-t border-gray-100 my-1" />}
                  <div
                    onClick={() => task.to && navigate(task.to)}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group ${task.to ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className="text-xs text-gray-700">{task.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium rounded px-1.5 py-0.5 ${task.color}`}>
                        {task.count}
                      </span>
                      <ArrowRight className={`w-3 h-3 transition-colors ${task.to ? 'text-gray-300 group-hover:text-gray-500' : 'text-gray-200'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
