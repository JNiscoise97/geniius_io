// ReconciliationPage.tsx
// Candidats de fusion : entités canoniques qui partagent exactement le même
// libellé (une fois normalisé) — détection volontairement simple (pas d'IA),
// cf. doctrine dans reconciliation.service.ts. Pour chaque groupe : choisir
// la fiche qui survit, fusionner, ou confirmer que ce ne sont pas les mêmes
// (le groupe ne sera plus jamais re-suggéré).

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, GitMerge, Loader2, AlertCircle, User, MapPin, ExternalLink, ArrowLeft, ChevronRight } from 'lucide-react'
import { fetchMergeCandidates, mergeEntities, dismissGroup } from './reconciliation.service'
import type { MergeCandidateGroup } from './reconciliation.types'
import { fetchEntities, fetchEntityDetail, fetchPlaceHierarchies } from '../entites/entites.service'
import { supabaseRebond } from '@/lib/supabase'
import type { EntityListItem, EntityType } from '../entites/entites.types'
import { DataTable, type ColumnDef } from '@/components/shared/DataTable'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'

// Couleurs de repérage par fiche dans la revue de fusion — même palette que
// FusionActeursModal (rebond_deprecated), pour distinguer visuellement à qui
// appartient chaque fait avant de valider.
const COULEUR_PAR_INDEX = ['bg-blue-100', 'bg-purple-100', 'bg-pink-100', 'bg-cyan-100', 'bg-rose-100', 'bg-orange-100', 'bg-teal-100']

type ReviewRow = {
  id: string
  entityId: string
  entityLabel: string
  label: string
  sourceText: string
  documentTitre: string
}

// Modale de revue avant fusion (2026-08-14, demande explicite : "je veux
// tout voir") — même garde-fou que FusionActeursModal dans rebond_deprecated
// (obligation de parcourir toutes les pages avant de pouvoir valider), mais
// sur les FAITS des fiches sélectionnées plutôt que sur des mentions brutes
// (granularité différente du nouveau modèle — voir commentaire plus haut).
function MergeReviewModal({
  open,
  onClose,
  selectedItems,
  onMerged,
}: {
  open: boolean
  onClose: () => void
  selectedItems: EntityListItem[]
  onMerged: () => void
}) {
  const [survivorId, setSurvivorId] = useState<string | null>(null)
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [hierarchies, setHierarchies] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pagesVues, setPagesVues] = useState<Set<number>>(new Set())
  const pageSize = 10

  useEffect(() => {
    if (!open) return
    setSurvivorId(selectedItems[0]?.id ?? null)
    setPagesVues(new Set())
    setLoading(true)
    const isPlace = selectedItems.every(i => i.entityType === 'place')
    Promise.all([
      Promise.all(selectedItems.map(item => fetchEntityDetail(item.id))),
      isPlace ? fetchPlaceHierarchies(selectedItems.map(i => i.id)) : Promise.resolve(new Map<string, string>()),
    ])
      .then(([details, hierarchyMap]) => {
        setHierarchies(hierarchyMap)
        const flat: ReviewRow[] = []
        details.forEach((detail, i) => {
          const item = selectedItems[i]
          for (const f of detail?.facts ?? []) {
            flat.push({ id: f.id, entityId: item.id, entityLabel: item.label, label: f.label, sourceText: f.sourceText, documentTitre: f.documentTitre })
          }
          // Faits où la fiche n'est que l'OBJET (ex. "Pineau — circonscription
          // administrative : Deshaies" sur la revue de Deshaies) — comptés
          // dans factsCount/documentsCount (computeEntityCounts) depuis
          // 2026-08-15, mais absents de `facts` (voir EntityDetail.mentions).
          // Sans ça, le badge affiché sur chaque fiche ("N faits") ne
          // correspondait plus au nombre de lignes vues ici avant validation.
          for (const m of detail?.mentions ?? []) {
            flat.push({ id: m.id, entityId: item.id, entityLabel: item.label, label: `Mention : ${m.label}`, sourceText: m.sourceText, documentTitre: m.documentTitre })
          }
        })
        setRows(flat)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const totalPages = Math.ceil(rows.length / pageSize)
  const toutesPagesVues = totalPages <= 1 || pagesVues.size >= totalPages
  const handlePageViewed = (page: number) => {
    setPagesVues(prev => (prev.has(page) ? prev : new Set(prev).add(page)))
  }

  const getRowStyle = (row: ReviewRow) => {
    const index = selectedItems.findIndex(i => i.id === row.entityId)
    return index >= 0 ? COULEUR_PAR_INDEX[index % COULEUR_PAR_INDEX.length] : ''
  }

  const columns: ColumnDef<ReviewRow>[] = [
    { key: 'entityLabel', label: 'Fiche' },
    { key: 'label', label: 'Fait' },
    { key: 'sourceText', label: 'Citation' },
    { key: 'documentTitre', label: 'Acte' },
  ]

  async function handleValidate() {
    if (!survivorId || busy) return
    setBusy(true)
    try {
      await mergeEntities(survivorId, selectedItems.map(i => i.id))
      onMerged()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="flex flex-col p-0" style={{ width: '90vw', height: '90vh', maxWidth: 'none', maxHeight: 'none' }}>
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Revue avant fusion</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="flex flex-col gap-1.5">
            {selectedItems.map((item, i) => (
              <label key={item.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${COULEUR_PAR_INDEX[i % COULEUR_PAR_INDEX.length]}`}>
                <input type="radio" name="review-survivor" checked={survivorId === item.id} onChange={() => setSurvivorId(item.id)} className="shrink-0" />
                <span className="flex-1 text-sm text-gray-800">
                  <span className="block">{item.label}</span>
                  {hierarchies.get(item.id) && (
                    <span className="block text-xs text-gray-500 mt-0.5">{hierarchies.get(item.id)}</span>
                  )}
                </span>
                <span className="text-xs text-gray-500">{item.factsCount} fait{item.factsCount > 1 ? 's' : ''} · {item.documentsCount} acte{item.documentsCount > 1 ? 's' : ''}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            La fiche sélectionnée ci-dessus survit. Parcours toutes les pages des faits ci-dessous pour pouvoir valider.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-8">
              <Loader2 className="w-4 h-4 animate-spin" />Chargement des faits…
            </div>
          ) : (
            <DataTable
              data={rows}
              columns={columns}
              defaultVisibleColumns={['entityLabel', 'label', 'sourceText', 'documentTitre']}
              pageSize={pageSize}
              rowClassName={getRowStyle}
              onPageViewed={handlePageViewed}
              showMenu={false}
            />
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
          <button onClick={onClose} disabled={busy}
            className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            Annuler
          </button>
          <button onClick={handleValidate} disabled={busy || !toutesPagesVues || !survivorId}
            className="flex items-center gap-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-40 transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
            {busy ? 'Fusion en cours…' : 'Valider la fusion'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Fusion manuelle (2026-08-14, demande explicite) — en plus des groupes
// détectés automatiquement (libellé identique) ci-dessous : une table libre
// de toutes les fiches actives où l'utilisateur cherche/coche lui-même les
// fiches à rapprocher, plutôt que d'attendre une suggestion. Reprend l'esprit
// de l'écran "Fusionner des acteurs" de rebond_deprecated (sélection libre +
// choix du survivant), adapté à la granularité de ce module (fiches
// canoniques déjà promues, pas des mentions brutes non liées — dans le
// nouveau modèle, la promotion vers une fiche canonique est automatique dès
// qu'une assertion est validée, il n'y a donc pas de mention "orpheline" à
// rattraper comme dans l'ancien).
function ManualMergeSection({ entityType, onDone }: { entityType: EntityType; onDone: () => void }) {
  const [items, setItems] = useState<EntityListItem[]>([])
  const [hierarchies, setHierarchies] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [reviewOpen, setReviewOpen] = useState(false)

  function load() {
    setLoading(true)
    fetchEntities({ type: entityType })
      .then(async list => {
        setItems(list)
        // Chaîne hiérarchique complète (commune > section > hameau...) :
        // pour distinguer avant fusion deux fiches au même libellé mais à
        // des niveaux/rattachements différents — ex. "Caféyère" hameau DE
        // la section Caféyère vs "Caféyère" section elle-même, ou "Destine"
        // hameau de la section Caféyère vs "Destine" hameau de la section
        // Grand'Anse — un seul niveau ("Qualité") ne suffit pas à les
        // distinguer, d'où fetchPlaceHierarchies plutôt que
        // fetchEntityQualities (2026-08-15, demande explicite avec
        // exemples précis). N'a de sens que pour les lieux.
        if (entityType === 'place' && list.length > 0) {
          setHierarchies(await fetchPlaceHierarchies(list.map(e => e.id)))
        } else {
          setHierarchies(new Map())
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(); setSelectedIds([]) }, [entityType])

  function toggle(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const selectedItems = items.filter(i => selectedIds.includes(i.id))

  function handleMerged() {
    setSelectedIds([])
    load()
    onDone()
  }

  // Pas de colonne "Type" : la liste est déjà filtrée à un seul type par le
  // sous-menu d'entrée (2026-08-15, demande explicite), l'info serait
  // redondante sur chaque ligne.
  const columns: ColumnDef<EntityListItem>[] = [
    {
      key: 'checkbox',
      label: '',
      render: row => (
        <Checkbox checked={selectedIds.includes(row.id)} onCheckedChange={() => toggle(row.id)} />
      ),
    },
    { key: 'label', label: 'Libellé' },
    ...(entityType === 'place'
      ? [{
          key: 'hierarchie',
          label: 'Hiérarchie',
          render: (row: EntityListItem) => hierarchies.get(row.id) || <span className="text-gray-300">—</span>,
        } as ColumnDef<EntityListItem>]
      : []),
    { key: 'factsCount', label: 'Faits' },
    { key: 'documentsCount', label: 'Actes' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Fusion manuelle</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Cherche et coche toi-même les fiches à rapprocher, plutôt que d'attendre une suggestion automatique.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />Chargement…
        </div>
      ) : (
        <DataTable
          data={items}
          columns={columns}
          defaultVisibleColumns={entityType === 'place' ? ['checkbox', 'label', 'hierarchie', 'factsCount', 'documentsCount'] : ['checkbox', 'label', 'factsCount', 'documentsCount']}
          pageSize={10}
        />
      )}

      {selectedIds.length > 0 && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-xs text-gray-500">
            {selectedIds.length} fiche{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}
          </p>
          {selectedIds.length < 2 ? (
            <p className="text-xs text-gray-400 italic">Sélectionne au moins deux fiches pour fusionner.</p>
          ) : (
            <button onClick={() => setReviewOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 transition-colors">
              <GitMerge className="w-3.5 h-3.5" />
              Fusionner la sélection
            </button>
          )}
        </div>
      )}

      <MergeReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        selectedItems={selectedItems}
        onMerged={handleMerged}
      />
    </div>
  )
}

// Sous-menu d'entrée (2026-08-15, demande explicite) — choisir le type
// avant d'entrer dans l'écran, plutôt que de mélanger lieux et personnes
// dans la même table/les mêmes groupes détectés. Compteurs légers (juste un
// count, pas fetchEntities qui calcule aussi faits/actes) pour donner un
// aperçu sans le coût de la vraie liste.
function TypeChoiceMenu({ onSelect }: { onSelect: (type: EntityType) => void }) {
  const [counts, setCounts] = useState<{ person: number; place: number } | null>(null)

  useEffect(() => {
    Promise.all([
      supabaseRebond.from('entities').select('id', { count: 'exact', head: true }).eq('entity_type', 'person').is('merged_into_id', null),
      supabaseRebond.from('entities').select('id', { count: 'exact', head: true }).eq('entity_type', 'place').is('merged_into_id', null),
    ]).then(([p, l]) => setCounts({ person: p.count ?? 0, place: l.count ?? 0 }))
  }, [])

  const options: { type: EntityType; label: string; icon: typeof User; count: number | undefined }[] = [
    { type: 'person', label: 'Réconciliation de personnes', icon: User, count: counts?.person },
    { type: 'place', label: 'Réconciliation de lieux', icon: MapPin, count: counts?.place },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map(({ type, label, icon: Icon, count }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className="flex items-center justify-between text-left bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-300 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-indigo-600" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-900">{label}</span>
              <span className="block text-xs text-gray-400 mt-0.5">
                {count === undefined ? 'Chargement…' : `${count} fiche${count > 1 ? 's' : ''}`}
              </span>
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>
      ))}
    </div>
  )
}

function GroupCard({ group, onDone }: { group: MergeCandidateGroup; onDone: () => void }) {
  const [survivorId, setSurvivorId] = useState(group.members[0]?.entityId)
  const [busy, setBusy] = useState(false)
  const Icon = group.entityType === 'place' ? MapPin : User

  async function handleMerge() {
    if (!survivorId || busy) return
    setBusy(true)
    try {
      await mergeEntities(survivorId, group.members.map(m => m.entityId))
      onDone()
    } finally {
      setBusy(false)
    }
  }

  async function handleDismiss() {
    if (busy) return
    setBusy(true)
    try {
      await dismissGroup(group.entityType, group.normalizedLabel)
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-900">{group.members.length} fiches "{group.members[0]?.label}"</span>
        <span className="text-xs text-gray-400">({group.entityType === 'place' ? 'lieux' : 'personnes'})</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {group.members.map(m => (
          <label key={m.entityId} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name={`survivor-${group.entityType}-${group.normalizedLabel}`}
              checked={survivorId === m.entityId}
              onChange={() => setSurvivorId(m.entityId)}
              className="shrink-0"
            />
            <span className="flex-1 text-sm text-gray-700">{m.label}</span>
            <span className="text-xs text-gray-400">{m.factsCount} fait{m.factsCount > 1 ? 's' : ''} · {m.documentsCount} acte{m.documentsCount > 1 ? 's' : ''}</span>
            <Link to={`/entites/${m.entityId}`} target="_blank" onClick={e => e.stopPropagation()}
              className="text-gray-300 hover:text-indigo-600 transition-colors shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </label>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        La fiche sélectionnée ci-dessus survit et récupère les faits et documents des autres.
      </p>

      <div className="flex items-center gap-2">
        <button onClick={handleMerge} disabled={busy}
          className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
          Fusionner
        </button>
        <button onClick={handleDismiss} disabled={busy}
          className="text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 transition-colors">
          Ce ne sont pas les mêmes
        </button>
      </div>
    </div>
  )
}

export function ReconciliationPage() {
  const [entityType, setEntityType] = useState<EntityType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<MergeCandidateGroup[]>([])

  function load() {
    setLoading(true)
    fetchMergeCandidates()
      .then(setGroups)
      .catch(err => setError(err?.message ?? 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (entityType) load() }, [entityType])

  const visibleGroups = groups.filter(g => g.entityType === entityType)

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
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
              <LayoutDashboard className="w-4 h-4" />Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            {entityType ? (
              <button onClick={() => setEntityType(null)} className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
                <GitMerge className="w-4 h-4" />Réconciliation
              </button>
            ) : (
              <span className="flex items-center gap-1.5">
                <GitMerge className="w-4 h-4" />Réconciliation
              </span>
            )}
            {entityType && (
              <>
                <span className="text-gray-300">/</span>
                <span className="flex items-center gap-1.5">
                  {entityType === 'place' ? 'Lieux' : 'Personnes'}
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            {entityType ? `Réconciliation — ${entityType === 'place' ? 'lieux' : 'personnes'}` : 'Réconciliation'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {entityType
              ? `Fiches de ${entityType === 'place' ? 'lieux' : 'personnes'} qui partagent exactement le même nom — probablement le même ${entityType === 'place' ? 'lieu' : 'individu'}.`
              : 'Choisis quoi réconcilier.'}
          </p>
        </div>

        {!entityType ? (
          <TypeChoiceMenu onSelect={setEntityType} />
        ) : (
          <>
            <button onClick={() => setEntityType(null)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-3.5 h-3.5" />Changer de type
            </button>

            <ManualMergeSection entityType={entityType} onDone={load} />

            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Doublons détectés automatiquement</h2>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-8">
                  <Loader2 className="w-4 h-4 animate-spin" />Chargement…
                </div>
              ) : visibleGroups.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
                  <p className="text-sm text-gray-400">Aucun doublon détecté pour l'instant.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {visibleGroups.map(g => (
                    <GroupCard key={`${g.entityType}|${g.normalizedLabel}`} group={g} onDone={load} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default ReconciliationPage
