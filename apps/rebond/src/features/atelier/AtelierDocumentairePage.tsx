// AtelierDocumentairePage.tsx
// Point d'entrée de l'atelier documentaire : la même liste de documents que
// l'onglet "Documents" de Patrimoine documentaire, mais dont le clic mène à
// la transcription (liste des exemplaires) plutôt qu'à la fiche
// administrative du document.
//
// Arborescence dépliable (2026-08-09, sur demande explicite, refondue en
// vraie tree view puis ajustée le même jour — année/type d'acte étaient
// d'abord de simples critères de tri, promus en niveaux dépliables, puis
// "type d'acte" remplacé par "registre" sur demande) : série documentaire >
// (si le document est rattaché à un acte d'état civil) région > département
// > commune > bureau > année > registre (trié par la position de son type
// d'acte principal, ref_etat_civil_type_acte.position — un registre n'a pas
// d'ordre propre en base) > actes individuels (triés par numéro d'acte). Un
// document sans acte d'état civil résolu (pas un acte, ou données pas
// encore reliées) reste en liste plate sous sa série, sans les niveaux
// intermédiaires.
//
// Chemin de données pour région/département/commune/bureau/année/registre
// (pas évident au premier abord, cf. atelier.service.ts) :
// unites_documentaires -> exemplaires -> citations (target_type='ec_acte')
// -> etat_civil_actes -> etat_civil_bureaux / etat_civil_registres.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, FileEdit, Filter, Search, ExternalLink, Loader2, AlertCircle,
  ChevronDown, ChevronRight, FileText,
} from 'lucide-react'
import { usePatrimoine } from '../patrimoine/usePatrimoine'
import { ROLE_CONFIG } from '../patrimoine/PatrimoineDocumentairePage'
import { vueMax, formatVue } from '../patrimoine/vueFormat'
import { fetchDocumentsHierarchyMeta, type DocHierarchyMeta } from './atelier.service'
import type { PatrimoineDocument as Document, DocStatut } from '../patrimoine/source.types'

// Tri "naturel" (2 avant 10, pas 10 avant 2 comme un tri texte pur) — pour
// les libellés de hiérarchie qui sont du texte (région/département/
// commune/bureau/série). Année et type d'acte ont leur propre critère de
// tri numérique, cf. HIERARCHY_LEVELS.
const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

const NON_RENSEIGNE = 'Non renseigné'

const STATUT_DOC_FILTERS: Array<{ key: DocStatut | 'tous'; label: string }> = [
  { key: 'tous', label: 'Tous' },
  { key: 'a_transcrire', label: 'À transcrire' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'transcrit', label: 'Transcrits' },
  { key: 'annote', label: 'Annotés' },
]

// Une ligne d'arbre générique — même composant pour tous les niveaux
// intermédiaires (région, département, commune, bureau, année, type
// d'acte), avec un simple décalage horizontal + un filet vertical pour
// matérialiser la profondeur, plutôt qu'une carte par niveau.
function TreeRow({ label, count, depth, open, onToggle }: {
  label: string
  count: number
  depth: number
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-1.5 py-1.5 pr-3 text-left hover:bg-gray-50 rounded-md transition-colors"
      style={{ paddingLeft: 8 + depth * 18 }}
    >
      {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
      <span className={`text-gray-700 ${depth === 0 ? 'text-sm font-medium' : 'text-sm'}`}>{label}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </button>
  )
}

// Feuille de l'arbre : un acte individuel, ligne simple (pas de carte) —
// titre, puis rôle, date, vue (position dans le registre numérisé, cf.
// vueFormat.ts déjà utilisé ailleurs dans Patrimoine documentaire pour ce
// même calcul), et lien en ligne s'il existe.
function DocumentRow({ doc, sourceVueRangeById, depth, onClick }: {
  doc: Document
  sourceVueRangeById: Map<string, string | null>
  depth: number
  onClick: () => void
}) {
  const role = doc.role ? ROLE_CONFIG[doc.role] : null
  const registreVueRange = doc.source_id ? sourceVueRangeById.get(doc.source_id) ?? null : null
  const vueLabel = doc.vue ? formatVue(doc.vue, vueMax(registreVueRange)) : null

  return (
    <div
      role="button" tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className="w-full flex items-center gap-2 py-1.5 pr-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors group"
      style={{ paddingLeft: 8 + depth * 18 }}
    >
      <FileText className="w-3.5 h-3.5 text-gray-300 shrink-0" />
      <span className="text-sm text-gray-800 group-hover:text-indigo-700 transition-colors truncate">{doc.titre}</span>
      {role && <span className={`text-[10px] font-medium rounded border px-1.5 py-0.5 shrink-0 ${role.color}`}>{role.label}</span>}
      {doc.date_document && <span className="text-xs text-gray-400 shrink-0">{doc.date_document}</span>}
      {vueLabel && <span className="text-xs text-gray-400 shrink-0">{vueLabel}</span>}
      {doc.url && (
        <a href={doc.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          className="text-gray-300 hover:text-emerald-600 transition-colors shrink-0">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  )
}

// Un niveau de hiérarchie = un libellé affiché + une valeur de tri
// (numérique pour année/registre, texte trié naturellement pour le reste)
// + une clé de regroupement (getKey, distincte du libellé). Les 6 niveaux
// ont la même forme group-by, d'où une seule fonction récursive
// (buildHierarchy) plutôt que 6 composants quasi identiques.
type LevelDef = {
  getLabel: (meta: DocHierarchyMeta) => string
  getKey: (meta: DocHierarchyMeta) => string
  getSortValue: (meta: DocHierarchyMeta) => string | number
}
const HIERARCHY_LEVELS: LevelDef[] = [
  { getLabel: m => m.region || NON_RENSEIGNE, getKey: m => m.region || NON_RENSEIGNE, getSortValue: m => m.region || NON_RENSEIGNE },
  { getLabel: m => m.departement || NON_RENSEIGNE, getKey: m => m.departement || NON_RENSEIGNE, getSortValue: m => m.departement || NON_RENSEIGNE },
  { getLabel: m => m.commune || NON_RENSEIGNE, getKey: m => m.commune || NON_RENSEIGNE, getSortValue: m => m.commune || NON_RENSEIGNE },
  { getLabel: m => m.bureauLabel || NON_RENSEIGNE, getKey: m => m.bureauLabel || NON_RENSEIGNE, getSortValue: m => m.bureauLabel || NON_RENSEIGNE },
  { getLabel: m => m.sortYear != null ? String(m.sortYear) : NON_RENSEIGNE, getKey: m => m.sortYear != null ? String(m.sortYear) : NON_RENSEIGNE, getSortValue: m => m.sortYear ?? Number.MAX_SAFE_INTEGER },
  // Regroupement par registreId (l'id réel), pas par registreLabel : le
  // libellé est généré automatiquement à partir du seul type d'acte (cf.
  // atelier.service.ts) donc deux registres distincts peuvent partager le
  // même libellé générique ("Registre des décès") — grouper par le texte
  // fusionnerait à tort deux vrais registres différents en un seul nœud.
  // Trié par la position de son type d'acte principal (registreSortPosition,
  // via ref_etat_civil_type_acte.position) — le registre n'a pas d'ordre
  // propre en base.
  { getLabel: m => m.registreLabel || NON_RENSEIGNE, getKey: m => m.registreId ?? NON_RENSEIGNE, getSortValue: m => m.registreSortPosition ?? Number.MAX_SAFE_INTEGER },
]

function compareSortValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return naturalCollator.compare(String(a), String(b))
}

type HierarchyNode = { key: string; label: string; docs: Document[]; children: HierarchyNode[] }

function buildHierarchy(docs: Document[], metaByDoc: Map<string, DocHierarchyMeta>, levelIndex: number): HierarchyNode[] {
  const level = HIERARCHY_LEVELS[levelIndex]
  const groups = new Map<string, { key: string; label: string; sortValue: string | number; docs: Document[] }>()
  for (const doc of docs) {
    const meta = metaByDoc.get(doc.id)
    if (!meta) continue
    const key = level.getKey(meta)
    const g = groups.get(key) ?? { key, label: level.getLabel(meta), sortValue: level.getSortValue(meta), docs: [] }
    g.docs.push(doc)
    groups.set(key, g)
  }
  const isLastLevel = levelIndex === HIERARCHY_LEVELS.length - 1
  return [...groups.values()]
    .sort((a, b) => compareSortValues(a.sortValue, b.sortValue))
    .map(g => ({
      key: g.key,
      label: g.label,
      docs: g.docs,
      children: isLastLevel ? [] : buildHierarchy(g.docs, metaByDoc, levelIndex + 1),
    }))
}

// Feuille finale : tri par numéro d'acte (etat_civil_actes.numero_acte,
// fiable) avec repli sur doc.cote (exemplaires.cote_locale, souvent vide en
// pratique) si absent.
function sortLeafDocs(docs: Document[], metaByDoc: Map<string, DocHierarchyMeta>): Document[] {
  return [...docs].sort((a, b) => {
    const numA = metaByDoc.get(a.id)?.numeroActe ?? a.cote
    const numB = metaByDoc.get(b.id)?.numeroActe ?? b.cote
    return naturalCollator.compare(numA, numB)
  })
}

function HierarchyTreeNode({ node, depth, metaByDoc, sourceVueRangeById, onOpenDocument }: {
  node: HierarchyNode
  depth: number
  metaByDoc: Map<string, DocHierarchyMeta>
  sourceVueRangeById: Map<string, string | null>
  onOpenDocument: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const isLeafLevel = node.children.length === 0
  return (
    <div>
      <TreeRow label={node.label} count={node.docs.length} depth={depth} open={open} onToggle={() => setOpen(o => !o)} />
      {open && (
        isLeafLevel
          ? sortLeafDocs(node.docs, metaByDoc).map(doc => (
            <DocumentRow key={doc.id} doc={doc} sourceVueRangeById={sourceVueRangeById} depth={depth + 1} onClick={() => onOpenDocument(doc.id)} />
          ))
          : node.children.map(child => (
            <HierarchyTreeNode key={child.key} node={child} depth={depth + 1} metaByDoc={metaByDoc} sourceVueRangeById={sourceVueRangeById} onOpenDocument={onOpenDocument} />
          ))
      )}
    </div>
  )
}

function SerieSection({ serieLabel, docs, metaByDoc, sourceVueRangeById, defaultOpen, onOpenDocument }: {
  serieLabel: string
  docs: Document[]
  metaByDoc: Map<string, DocHierarchyMeta>
  sourceVueRangeById: Map<string, string | null>
  defaultOpen: boolean
  onOpenDocument: (id: string) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const withActe = docs.filter(d => metaByDoc.get(d.id)?.bureauLabel)
  const withoutActe = docs.filter(d => !metaByDoc.get(d.id)?.bureauLabel)
  const tree = withActe.length > 0 ? buildHierarchy(withActe, metaByDoc, 0) : []

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          {serieLabel}
          <span className="text-xs font-normal text-gray-400">({docs.length})</span>
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3">
          {tree.map(node => (
            <HierarchyTreeNode key={node.key} node={node} depth={1} metaByDoc={metaByDoc} sourceVueRangeById={sourceVueRangeById} onOpenDocument={onOpenDocument} />
          ))}
          {withoutActe.length > 0 && sortLeafDocs(withoutActe, metaByDoc).map(doc => (
            <DocumentRow key={doc.id} doc={doc} sourceVueRangeById={sourceVueRangeById} depth={1} onClick={() => onOpenDocument(doc.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AtelierDocumentairePage() {
  const navigate = useNavigate()
  const { docs, sources, loading, error } = usePatrimoine()

  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('tous')
  const [statutFilter, setStatutFilter] = useState<DocStatut | 'tous'>('tous')
  const [hierarchyMeta, setHierarchyMeta] = useState<Map<string, DocHierarchyMeta>>(new Map())
  const [metaLoading, setMetaLoading] = useState(true)

  const activeSources = sources.filter(s => s.statut !== 'a_qualifier')
  const activeDocs = docs.filter(d => d.statut !== 'en_attente')

  // Pour situer un acte dans l'étendue numérisée totale de son registre
  // (formatVue/vueMax, cf. vueFormat.ts — même calcul déjà utilisé ailleurs
  // dans Patrimoine documentaire).
  const sourceVueRangeById = useMemo(() => new Map(sources.map(s => [s.id, s.vue_range])), [sources])

  useEffect(() => {
    if (activeDocs.length === 0) { setMetaLoading(false); return }
    let cancelled = false
    setMetaLoading(true)
    fetchDocumentsHierarchyMeta(activeDocs.map(d => d.id))
      .then(m => { if (!cancelled) setHierarchyMeta(m) })
      .finally(() => { if (!cancelled) setMetaLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs])

  const filteredDocs = activeDocs.filter(d => {
    const matchSource = sourceFilter === 'tous' || d.source_id === sourceFilter
    const matchStatut = statutFilter === 'tous' || d.statut === statutFilter
    const q = search.toLowerCase()
    const matchSearch = !q || d.titre.toLowerCase().includes(q) || d.cote.toLowerCase().includes(q)
    return matchSource && matchStatut && matchSearch
  })

  // Regroupement par série documentaire (doc.serie), trié par nom de série ;
  // les documents sans série (ne devrait pas arriver, serie_ref est NOT NULL
  // en base, mais le champ peut être vide côté UI si le libellé n'a pas pu
  // être résolu) forment un groupe à part, affiché en dernier.
  const serieGroups = useMemo(() => {
    const bySerie = new Map<string, Document[]>()
    for (const doc of filteredDocs) {
      const label = doc.serie || NON_RENSEIGNE
      const arr = bySerie.get(label) ?? []
      arr.push(doc)
      bySerie.set(label, arr)
    }
    return [...bySerie.entries()]
      .sort((a, b) => naturalCollator.compare(a[0], b[0]))
      .map(([serieLabel, docsInGroup]) => ({ key: serieLabel, serieLabel, docs: docsInGroup }))
  }, [filteredDocs])

  if (loading || metaLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement de l'atelier documentaire…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-rose-200 p-6 max-w-sm text-center">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-800 mb-1">Erreur de chargement</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="flex items-center gap-1.5">
              <FileEdit className="w-4 h-4" />
              Atelier documentaire
            </span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Atelier documentaire</h1>
          <p className="text-sm text-gray-500 mt-1">
            Choisis un document, puis l'exemplaire à transcrire.
          </p>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un document…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="tous">Toutes les sources</option>
            {activeSources.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
          {STATUT_DOC_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatutFilter(f.key)}
              className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${
                statutFilter === f.key
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredDocs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <p className="text-sm text-gray-400">Aucun document trouvé.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {serieGroups.map(group => (
              <SerieSection
                key={group.key}
                serieLabel={group.serieLabel}
                docs={group.docs}
                metaByDoc={hierarchyMeta}
                sourceVueRangeById={sourceVueRangeById}
                defaultOpen={serieGroups.length <= 3}
                onOpenDocument={id => navigate(`/atelier-documentaire/documents/${id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default AtelierDocumentairePage
