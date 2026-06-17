import { useState } from 'react'
import {
  Library,
  Upload,
  Search,
  ChevronRight,
  Layers,
  Bell,
  ArrowLeft,
  FileText,
  BookOpen,
  ScrollText,
  Map,
  Users,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  FolderOpen,
  Tag,
  Sparkles,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type SourceType = 'paroissial' | 'etat-civil' | 'notarial' | 'cadastral' | 'recensement' | 'fiscal'
type DocStatut = 'transcrit' | 'en_cours' | 'a_transcrire' | 'annote'
type CorpusType = 'genealogique' | 'patrimonial' | 'territorial' | 'communaute'

type Source = {
  id: string
  nom: string
  type: SourceType
  producteur: string
  territoire: string
  periode: string
  niveau_fiabilite: 'haute' | 'moyenne' | 'basse'
  total_documents: number
  transcris: number
  en_cours: number
  a_traiter: number
  statut: 'actif' | 'archivé' | 'incomplet'
  derniere_activite: string
}

type Document = {
  id: string
  source_id: string
  type_document: SourceType
  cote: string
  titre: string
  date_document: string
  statut: DocStatut
  mentions_detectees?: number
}

type Corpus = {
  id: string
  nom: string
  description: string
  type: CorpusType
  source_ids: string[]
  total_documents: number
  transcris: number
  cree_par: string
  cree_le: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const SOURCES: Source[] = [
  {
    id: '1',
    nom: 'Registres paroissiaux de Saint-Malo',
    type: 'paroissial',
    producteur: "Archives départementales d'Ille-et-Vilaine",
    territoire: 'Ille-et-Vilaine',
    periode: '1620 – 1792',
    niveau_fiabilite: 'haute',
    total_documents: 214,
    transcris: 148,
    en_cours: 12,
    a_traiter: 54,
    statut: 'actif',
    derniere_activite: 'il y a 2 jours',
  },
  {
    id: '2',
    nom: 'État civil – Arrondissement de Dinan',
    type: 'etat-civil',
    producteur: "Archives départementales des Côtes-d'Armor",
    territoire: "Côtes-d'Armor",
    periode: '1793 – 1912',
    niveau_fiabilite: 'haute',
    total_documents: 892,
    transcris: 211,
    en_cours: 34,
    a_traiter: 647,
    statut: 'actif',
    derniere_activite: 'il y a 5 heures',
  },
  {
    id: '3',
    nom: 'Minutes notariales – Étude Le Goaziou',
    type: 'notarial',
    producteur: 'Archives départementales du Finistère',
    territoire: 'Finistère',
    periode: '1748 – 1823',
    niveau_fiabilite: 'haute',
    total_documents: 63,
    transcris: 63,
    en_cours: 0,
    a_traiter: 0,
    statut: 'actif',
    derniere_activite: 'il y a 3 semaines',
  },
  {
    id: '4',
    nom: 'Recensements de population – Morbihan',
    type: 'recensement',
    producteur: 'Archives départementales du Morbihan',
    territoire: 'Morbihan',
    periode: '1836 – 1906',
    niveau_fiabilite: 'moyenne',
    total_documents: 38,
    transcris: 8,
    en_cours: 3,
    a_traiter: 27,
    statut: 'actif',
    derniere_activite: 'il y a 1 semaine',
  },
  {
    id: '5',
    nom: 'Cadastre napoléonien – Côtes-du-Nord',
    type: 'cadastral',
    producteur: "Service historique de l'armée",
    territoire: "Côtes-d'Armor",
    periode: '1807 – 1850',
    niveau_fiabilite: 'moyenne',
    total_documents: 17,
    transcris: 0,
    en_cours: 0,
    a_traiter: 17,
    statut: 'incomplet',
    derniere_activite: 'jamais',
  },
  {
    id: '6',
    nom: 'Rôles de taille – Région malouine',
    type: 'fiscal',
    producteur: 'Archives nationales – site de Paris',
    territoire: 'Ille-et-Vilaine',
    periode: '1680 – 1789',
    niveau_fiabilite: 'basse',
    total_documents: 29,
    transcris: 4,
    en_cours: 0,
    a_traiter: 25,
    statut: 'actif',
    derniere_activite: 'il y a 2 mois',
  },
]

const DOCUMENTS: Document[] = [
  { id: 'd1',  source_id: '1', type_document: 'paroissial',   cote: '5 Mi 7/R1',   titre: 'Registre BMS Saint-Servan 1742–1760',       date_document: '1742',  statut: 'transcrit',    mentions_detectees: 847 },
  { id: 'd2',  source_id: '1', type_document: 'paroissial',   cote: '5 Mi 7/R4',   titre: 'Acte de mariage Guérin & Jannin',            date_document: '1756',  statut: 'transcrit',    mentions_detectees: 12 },
  { id: 'd3',  source_id: '1', type_document: 'paroissial',   cote: '5 Mi 7/R4',   titre: 'Acte de sépulture Marie-Anne Bréhier',       date_document: '1761',  statut: 'en_cours' },
  { id: 'd4',  source_id: '1', type_document: 'paroissial',   cote: '5 Mi 7/R8',   titre: 'Registre des baptêmes de Pleurtuit 1720–1740', date_document: '1720', statut: 'en_cours' },
  { id: 'd5',  source_id: '2', type_document: 'etat-civil',   cote: '2E 51/1',      titre: 'Naissances – Dinan 1793–1802',               date_document: '1793',  statut: 'transcrit',    mentions_detectees: 634 },
  { id: 'd6',  source_id: '2', type_document: 'etat-civil',   cote: '2E 51/3',      titre: 'Mariages – Dinan 1818–1830',                 date_document: '1818',  statut: 'en_cours' },
  { id: 'd7',  source_id: '2', type_document: 'etat-civil',   cote: '2E 51/12',     titre: 'Décès – Dinan 1843–1855',                    date_document: '1843',  statut: 'a_transcrire' },
  { id: 'd8',  source_id: '2', type_document: 'etat-civil',   cote: '2E 51/18',     titre: 'Tables décennales 1803–1812',                date_document: '1803',  statut: 'a_transcrire' },
  { id: 'd9',  source_id: '3', type_document: 'notarial',     cote: '4E 127/45',    titre: 'Contrat de vente – Kerambrun à Le Goff',     date_document: '1775',  statut: 'annote',       mentions_detectees: 31 },
  { id: 'd10', source_id: '3', type_document: 'notarial',     cote: '4E 127/67',    titre: 'Inventaire après décès – Jean Kerambrun',    date_document: '1802',  statut: 'transcrit',    mentions_detectees: 58 },
  { id: 'd11', source_id: '3', type_document: 'notarial',     cote: '4E 127/89',    titre: 'Contrat de mariage Mahé & Bréhier',          date_document: '1815',  statut: 'transcrit',    mentions_detectees: 24 },
  { id: 'd12', source_id: '4', type_document: 'recensement',  cote: '6 M 197',      titre: 'Recensement de Vannes – 1836',               date_document: '1836',  statut: 'en_cours' },
  { id: 'd13', source_id: '4', type_document: 'recensement',  cote: '6 M 247',      titre: 'Recensement de Ploërmel – 1851',             date_document: '1851',  statut: 'a_transcrire' },
  { id: 'd14', source_id: '5', type_document: 'cadastral',    cote: '3P 567/1',     titre: 'Tableau de section A – Questembert',         date_document: '1811',  statut: 'a_transcrire' },
  { id: 'd15', source_id: '6', type_document: 'fiscal',       cote: 'G 712',        titre: 'Rôle de taille 1685 – paroisse Saint-Malo',  date_document: '1685',  statut: 'transcrit',    mentions_detectees: 203 },
]

const CORPUS: Corpus[] = [
  {
    id: 'c1',
    nom: 'Famille Le Goff de Saint-Malo',
    description: "Ensemble des actes mentionnant la famille Le Goff entre 1720 et 1820. Couvre baptêmes, mariages, successions et contrats notariaux.",
    type: 'genealogique',
    source_ids: ['1', '2', '3'],
    total_documents: 18,
    transcris: 14,
    cree_par: 'JB',
    cree_le: '12 mars 2026',
  },
  {
    id: 'c2',
    nom: 'Successions Kerambrun 1775–1810',
    description: "Enquête patrimoniale sur la famille Kerambrun. Contrats de vente, inventaires après décès, partages et quittances.",
    type: 'patrimonial',
    source_ids: ['3', '6'],
    total_documents: 12,
    transcris: 12,
    cree_par: 'JB',
    cree_le: '4 avril 2026',
  },
  {
    id: 'c3',
    nom: 'Communauté de Pleurtuit – XVIIIe siècle',
    description: "Étude de la communauté villageoise de Pleurtuit. Registres paroissiaux, rôles de taille et actes notariaux pour reconstituer le tissu social.",
    type: 'communaute',
    source_ids: ['1', '6'],
    total_documents: 34,
    transcris: 8,
    cree_par: 'JB',
    cree_le: '28 avril 2026',
  },
  {
    id: 'c4',
    nom: 'Propriétés foncières – Région malouine',
    description: "Cartographie des propriétés entre 1680 et 1850. Croise cadastre, actes notariaux, rôles de taille et recensements pour suivre les transmissions.",
    type: 'territorial',
    source_ids: ['3', '5', '6', '1'],
    total_documents: 27,
    transcris: 7,
    cree_par: 'JB',
    cree_le: '2 juin 2026',
  },
]

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<SourceType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  paroissial:    { label: 'Paroissial',   icon: BookOpen,   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  'etat-civil':  { label: 'État civil',   icon: ScrollText, color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  notarial:      { label: 'Notarial',     icon: FileText,   color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  cadastral:     { label: 'Cadastral',    icon: Map,        color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200' },
  recensement:   { label: 'Recensement', icon: Users,      color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  fiscal:        { label: 'Fiscal',       icon: Library,    color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
}

const FIABILITE_CONFIG = {
  haute:   { label: 'Fiabilité haute',   color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  moyenne: { label: 'Fiabilité moyenne', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  basse:   { label: 'Fiabilité basse',   color: 'text-rose-600 bg-rose-50 border-rose-200' },
}

const STATUT_SOURCE_CONFIG = {
  actif:     { label: 'Actif',     icon: CheckCircle2, color: 'text-emerald-500' },
  archivé:   { label: 'Archivé',   icon: FolderOpen,   color: 'text-slate-400' },
  incomplet: { label: 'Incomplet', icon: AlertCircle,  color: 'text-amber-500' },
}

const STATUT_DOC_CONFIG: Record<DocStatut, { label: string; color: string; dot: string }> = {
  transcrit:    { label: 'Transcrit',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  en_cours:     { label: 'En cours',     color: 'text-blue-700 bg-blue-50 border-blue-200',          dot: 'bg-blue-400' },
  a_transcrire: { label: 'À transcrire', color: 'text-gray-500 bg-gray-50 border-gray-200',          dot: 'bg-gray-300' },
  annote:       { label: 'Annoté',       color: 'text-violet-700 bg-violet-50 border-violet-200',    dot: 'bg-violet-500' },
}

const CORPUS_TYPE_CONFIG: Record<CorpusType, { label: string; color: string; bg: string; border: string }> = {
  genealogique: { label: 'Généalogique',    color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  patrimonial:  { label: 'Patrimonial',     color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  territorial:  { label: 'Territorial',     color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200' },
  communaute:   { label: 'Communauté',      color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

const TABS = ['Sources', 'Documents', 'Corpus', 'Importer'] as const
type Tab = typeof TABS[number]

const TYPE_FILTERS: Array<{ key: SourceType | 'tous'; label: string }> = [
  { key: 'tous',         label: 'Tous les types' },
  { key: 'paroissial',   label: 'Paroissiaux' },
  { key: 'etat-civil',   label: 'État civil' },
  { key: 'notarial',     label: 'Notariaux' },
  { key: 'recensement',  label: 'Recensements' },
  { key: 'cadastral',    label: 'Cadastraux' },
  { key: 'fiscal',       label: 'Fiscaux' },
]

const STATUT_DOC_FILTERS: Array<{ key: DocStatut | 'tous'; label: string }> = [
  { key: 'tous',         label: 'Tous' },
  { key: 'transcrit',    label: 'Transcrits' },
  { key: 'annote',       label: 'Annotés' },
  { key: 'en_cours',     label: 'En cours' },
  { key: 'a_transcrire', label: 'À transcrire' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

function sourceById(id: string) {
  return SOURCES.find(s => s.id === id)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ transcris, en_cours, total }: { transcris: number; en_cours: number; total: number }) {
  const pctDone = total === 0 ? 0 : (transcris / total) * 100
  const pctProgress = total === 0 ? 0 : (en_cours / total) * 100
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{pct(transcris, total)}% transcrit</span>
        <span className="text-xs text-gray-400">{transcris}/{total} docs</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden flex">
        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pctDone}%` }} />
        <div className="h-full bg-indigo-200 transition-all" style={{ width: `${pctProgress}%` }} />
      </div>
      <div className="flex items-center gap-3 pt-0.5">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
          {transcris} terminés
        </span>
        {en_cours > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-200" />
            {en_cours} en cours
          </span>
        )}
      </div>
    </div>
  )
}

function SourceCard({ source }: { source: Source }) {
  const type = TYPE_CONFIG[source.type]
  const TypeIcon = type.icon
  const fiabilite = FIABILITE_CONFIG[source.niveau_fiabilite]
  const statut = STATUT_SOURCE_CONFIG[source.statut]
  const StatutIcon = statut.icon

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all group cursor-pointer">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl border ${type.bg} ${type.border} flex items-center justify-center shrink-0 mt-0.5`}>
          <TypeIcon className={`w-5 h-5 ${type.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
                {source.nom}
              </h3>
              <span className={`inline-flex items-center gap-1 text-xs font-medium rounded border px-2 py-0.5 ${type.bg} ${type.color} ${type.border}`}>
                {type.label}
              </span>
            </div>
            <button className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">{source.producteur}</p>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5">{source.territoire}</span>
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5">{source.periode}</span>
            <span className={`text-xs font-medium rounded-full border px-2.5 py-0.5 ${fiabilite.color}`}>{fiabilite.label}</span>
          </div>
          <ProgressBar transcris={source.transcris} en_cours={source.en_cours} total={source.total_documents} />
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0 pl-2">
          <div className={`flex items-center gap-1 text-xs ${statut.color}`}>
            <StatutIcon className="w-3.5 h-3.5" />
            {statut.label}
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900 tabular-nums">{source.total_documents}</div>
            <div className="text-xs text-gray-400">documents</div>
          </div>
          {source.a_traiter > 0 && (
            <span className="text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2 py-0.5">
              {source.a_traiter} à traiter
            </span>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {source.derniere_activite}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {source.en_cours > 0
            ? `${source.en_cours} transcription${source.en_cours > 1 ? 's' : ''} en cours`
            : source.a_traiter > 0
              ? `${source.a_traiter} document${source.a_traiter > 1 ? 's' : ''} non traité${source.a_traiter > 1 ? 's' : ''}`
              : 'Corpus entièrement transcrit'}
        </div>
        <div className="flex items-center gap-2">
          {source.a_traiter > 0 && (
            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
              Transcrire <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
            Voir les documents <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function DocumentRow({ doc }: { doc: Document }) {
  const type = TYPE_CONFIG[doc.type_document]
  const TypeIcon = type.icon
  const statut = STATUT_DOC_CONFIG[doc.statut]
  const source = sourceById(doc.source_id)

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-50 last:border-0">
      <div className={`w-8 h-8 rounded-lg border ${type.bg} ${type.border} flex items-center justify-center shrink-0`}>
        <TypeIcon className={`w-3.5 h-3.5 ${type.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
            {doc.titre}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">{doc.cote}</span>
          <span className="text-gray-200">·</span>
          <span className="text-xs text-gray-400 truncate">{source?.nom}</span>
        </div>
      </div>

      <span className="text-xs text-gray-400 shrink-0 w-12 text-right">{doc.date_document}</span>

      {doc.mentions_detectees != null ? (
        <span className="text-xs text-gray-500 shrink-0 w-28 text-right flex items-center justify-end gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          {doc.mentions_detectees} mentions
        </span>
      ) : (
        <span className="w-28" />
      )}

      <span className={`text-xs font-medium rounded-full border px-2.5 py-0.5 shrink-0 flex items-center gap-1.5 ${statut.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${statut.dot}`} />
        {statut.label}
      </span>

      <button className="text-xs font-medium text-gray-400 hover:text-indigo-600 flex items-center gap-0.5 transition-colors shrink-0 opacity-0 group-hover:opacity-100">
        Ouvrir <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function CorpusCard({ corpus }: { corpus: Corpus }) {
  const typeConf = CORPUS_TYPE_CONFIG[corpus.type]
  const sources = corpus.source_ids.map(id => sourceById(id)).filter(Boolean) as Source[]
  const progress = pct(corpus.transcris, corpus.total_documents)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
          {corpus.nom}
        </h3>
        <span className={`text-xs font-medium rounded border px-2 py-0.5 shrink-0 ${typeConf.color} ${typeConf.bg} ${typeConf.border}`}>
          {typeConf.label}
        </span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-4">{corpus.description}</p>

      {/* Sources impliquées */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <Tag className="w-3 h-3 text-gray-300 shrink-0" />
        {sources.map(s => {
          const t = TYPE_CONFIG[s.type]
          return (
            <span
              key={s.id}
              className={`text-xs rounded-full border px-2 py-0.5 ${t.color} ${t.bg} ${t.border}`}
            >
              {s.nom.split('–')[0].trim()}
            </span>
          )
        })}
      </div>

      {/* Progress */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{progress}% transcrit</span>
          <span className="text-xs text-gray-400">{corpus.transcris}/{corpus.total_documents} docs</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">Créé le {corpus.cree_le}</span>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
          Explorer <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SourcesCorpusPage() {
  const [tab, setTab] = useState<Tab>('Sources')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<SourceType | 'tous'>('tous')
  const [statutDocFilter, setStatutDocFilter] = useState<DocStatut | 'tous'>('tous')
  const [sourceDocFilter, setSourceDocFilter] = useState<string>('tous')

  const filteredSources = SOURCES.filter(s => {
    const matchType = typeFilter === 'tous' || s.type === typeFilter
    const q = search.toLowerCase()
    const matchSearch = !q
      || s.nom.toLowerCase().includes(q)
      || s.producteur.toLowerCase().includes(q)
      || s.territoire.toLowerCase().includes(q)
    return matchType && matchSearch
  })

  const filteredDocs = DOCUMENTS.filter(d => {
    const matchSource = sourceDocFilter === 'tous' || d.source_id === sourceDocFilter
    const matchStatut = statutDocFilter === 'tous' || d.statut === statutDocFilter
    const q = search.toLowerCase()
    const matchSearch = !q || d.titre.toLowerCase().includes(q) || d.cote.toLowerCase().includes(q)
    return matchSource && matchStatut && matchSearch
  })

  const totalDocs = SOURCES.reduce((a, s) => a + s.total_documents, 0)
  const totalTranscris = SOURCES.reduce((a, s) => a + s.transcris, 0)
  const totalEnCours = SOURCES.reduce((a, s) => a + s.en_cours, 0)
  const totalATraiter = SOURCES.reduce((a, s) => a + s.a_traiter, 0)

  const TAB_COUNTS: Partial<Record<Tab, number>> = {
    Sources: SOURCES.length,
    Documents: DOCUMENTS.length,
    Corpus: CORPUS.length,
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-900 tracking-tight">REBOND</span>
          <span className="text-gray-300 text-sm">/</span>
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            <Library className="w-4 h-4" />
            Sources & corpus
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-1">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          </button>
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">
            JB
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-2 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Tableau de bord
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Sources & corpus</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérer les fonds, collections et corpus documentaires alimentant REBOND.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />
            Importer une source
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{SOURCES.length}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">Sources</div>
            <div className="text-xs text-gray-400 mt-0.5">fonds actifs</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{totalDocs.toLocaleString('fr-FR')}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">Documents</div>
            <div className="text-xs text-gray-400 mt-0.5">dans le corpus total</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{totalTranscris.toLocaleString('fr-FR')}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">Transcrits</div>
            <div className="text-xs text-gray-400 mt-0.5">{totalEnCours > 0 ? `+ ${totalEnCours} en cours` : 'terminés'}</div>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 px-5 py-4">
            <div className="text-2xl font-bold text-orange-600 tabular-nums">{totalATraiter.toLocaleString('fr-FR')}</div>
            <div className="text-sm font-medium text-orange-800 mt-0.5">À traiter</div>
            <div className="text-xs text-orange-400 mt-0.5">documents en attente</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 border-b border-gray-200">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch('') }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t}
              {TAB_COUNTS[t] != null && (
                <span className={`ml-2 text-xs rounded-full px-1.5 py-0.5 font-medium ${
                  tab === t ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {TAB_COUNTS[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Sources ── */}
        {tab === 'Sources' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher une source…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                {TYPE_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setTypeFilter(f.key)}
                    className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
                      typeFilter === f.key
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {(search || typeFilter !== 'tous') && (
              <p className="text-xs text-gray-400">
                {filteredSources.length} source{filteredSources.length !== 1 ? 's' : ''} trouvée{filteredSources.length !== 1 ? 's' : ''}
                {search && ` pour "${search}"`}
              </p>
            )}
            <div className="space-y-3">
              {filteredSources.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
                  <Library className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucune source ne correspond à votre recherche.</p>
                </div>
              ) : (
                filteredSources.map(source => <SourceCard key={source.id} source={source} />)
              )}
            </div>
          </div>
        )}

        {/* ── Documents ── */}
        {tab === 'Documents' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un document…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                {/* Source filter */}
                <select
                  value={sourceDocFilter}
                  onChange={e => setSourceDocFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="tous">Toutes les sources</option>
                  {SOURCES.map(s => (
                    <option key={s.id} value={s.id}>{s.nom}</option>
                  ))}
                </select>
                {/* Statut filter */}
                {STATUT_DOC_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setStatutDocFilter(f.key)}
                    className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
                      statutDocFilter === f.key
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Table header */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <div className="w-8 shrink-0" />
                <div className="flex-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Titre / Cote</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide w-12 text-right">Date</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide w-28 text-right">Mentions</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide w-28">Statut</div>
                <div className="w-16" />
              </div>

              {filteredDocs.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun document trouvé.</p>
                </div>
              ) : (
                filteredDocs.map(doc => <DocumentRow key={doc.id} doc={doc} />)
              )}
            </div>

            <p className="text-xs text-gray-400 text-right">
              {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''} affiché{filteredDocs.length !== 1 ? 's' : ''}
              {' '}sur {DOCUMENTS.length} dans cet échantillon
            </p>
          </div>
        )}

        {/* ── Corpus ── */}
        {tab === 'Corpus' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Un corpus est un regroupement thématique de documents qui traverse les sources.
                Il sert à conduire une enquête ciblée.
              </p>
              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Plus className="w-4 h-4" />
                Nouveau corpus
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {CORPUS.map(corpus => <CorpusCard key={corpus.id} corpus={corpus} />)}
            </div>
          </div>
        )}

        {/* ── Importer ── */}
        {tab === 'Importer' && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Importer une nouvelle source</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              Déclarez un fonds d'archives, une collection ou un ensemble documentaire.
              Les documents sont ensuite rattachés à cette source.
            </p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" />
              Déclarer une source
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
