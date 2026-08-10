// DocumentDetailPage.tsx
// Vue détail d'un document (ref_unites_documentaires) — tous les champs de la
// sheet "Décrire", mais en édition continue : un seul bouton "Enregistrer" en
// haut, actif dès qu'un champ change (pas de workflow_statut à faire évoluer ici).
// Un document peut avoir plusieurs exemplaires (copies dans des dépôts ou sous
// des formes différentes) — la section "Exemplaires" liste tous ceux du
// document, chacun avec son propre statut/localisation (une citation est
// propre à un exemplaire précis, pas au document).

import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronRight, ChevronDown, Loader2, Save, LayoutDashboard, Library, Lock, Unlock,
  Plus, Star, ArrowLeftRight, X, Trash2,
} from 'lucide-react'
import { supabaseRebond } from '@/lib/supabase'
import { toast } from 'sonner'
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart'
import { TriStateButton } from '@/components/shared/TriStateButton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { fetchRoleDocumentOptions } from './patrimoine.service'
import { unpackMarginalia, packMarginalia, unpackWriting, packWriting, toIntOrNull } from './citationJsonb'

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
const selectCls = `${inputCls} cursor-pointer`

// Même id que ReferenceWizardPage — type d'accès numérique "URL" dans
// ref_type_acces, utilisé pour les insertions dans ref_acces_numeriques.
const TYPE_ACCES_URL_ID = '1f6de1f1-9167-4b82-a3f1-1cdb7ae756e1'

const FIABILITE_CONFIG = {
  haute:   { label: 'Fiabilité haute',   color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  moyenne: { label: 'Fiabilité moyenne', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  basse:   { label: 'Fiabilité basse',   color: 'text-rose-600 bg-rose-50 border-rose-200' },
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {subtitle && <div className="mt-1 text-xs text-slate-600">{subtitle}</div>}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

// Sépare visuellement ce qui appartient à l'unité documentaire (intellectuel,
// unique) de ce qui appartient à l'exemplaire/la citation (physique, propre
// à cette copie précise) — deux entités distinctes qu'on peut sinon confondre
// en parcourant la page.
function GroupHeading({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-800 text-white text-[11px] font-bold shrink-0">
        {step}
      </span>
      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  )
}

type RoleOption = { id: string; code: string; label: string }

type DepotOption = {
  id: string
  institution_sigle: string | null
  institution_nom: string | null
  type_code: string | null
  type_label: string | null
  plateforme_label: string | null
  is_online: boolean
}

// Même composant de recherche de dépôt que ReferenceWizardPage (page "j'ai
// trouvé un document") — dupliqué ici plutôt qu'extrait en commun, faute
// d'export partagé, mais visuellement et fonctionnellement identique pour
// que l'utilisateur retrouve les mêmes repères (badge En ligne/Sur place,
// même mise en forme du libellé institution).
function DepotPicker({ depotQuery, setDepotQuery, depotResults, depotSearching, selectedDepot, setSelectedDepot, autoFocus }: {
  depotQuery: string; setDepotQuery: (v: string) => void
  depotResults: DepotOption[]; depotSearching: boolean
  selectedDepot: DepotOption | null; setSelectedDepot: (v: DepotOption | null) => void
  autoFocus?: boolean
}) {
  const instLabel = (d: DepotOption) => [d.institution_sigle, d.institution_nom].filter(Boolean).join(' — ')
  const AccessBadge = ({ online }: { online: boolean }) => (
    <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
      online ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-amber-50 text-amber-600 border-amber-200'
    }`}>
      {online ? 'En ligne' : 'Sur place'}
    </span>
  )

  if (selectedDepot) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2">
        <AccessBadge online={selectedDepot.is_online} />
        <span className="flex-1 text-sm text-gray-800">
          <span className="font-medium">{instLabel(selectedDepot)}</span>
          {selectedDepot.type_label && (
            <span className="text-gray-400 ml-1.5">· {selectedDepot.type_label}</span>
          )}
        </span>
        <button onClick={() => { setSelectedDepot(null); setDepotQuery('') }} className="text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }
  return (
    <div className="relative">
      <input value={depotQuery} onChange={e => setDepotQuery(e.target.value)}
        placeholder="Ex. ANOM, AD Guadeloupe, BNF…" className={inputCls} autoFocus={autoFocus} />
      {depotSearching && (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
      )}
      {depotResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {depotResults.map(d => (
            <button key={d.id} onClick={() => { setSelectedDepot(d); setDepotQuery('') }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3">
              <AccessBadge online={d.is_online} />
              <span className="flex-1 text-sm font-medium text-gray-800">{instLabel(d)}</span>
              {d.type_label && <span className="text-xs text-gray-400 shrink-0">{d.type_label}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type ExemplaireDraft = {
  id: string
  estReference: boolean
  natureRef: string | null
  supportRef: string | null
  paginationTypeRef: string | null
  nbPages: string
  conditionnement: string
  physicalConditionRef: string | null
  description: string
  identifiantInterne: string
  coteLocale: string
  localisationInterne: string
  note: string
  dansTable: boolean | null
  dansRegistre: boolean | null
  damageKindsIds: string[] | null
  readabilityFeaturesIds: string[] | null
  depotInfo: { nom: string; institutionNom: string | null; institutionSigle: string | null } | null
  parentExemplaireId: string | null
  sourceExemplaire: { coteLocale: string | null; titre: string | null } | null
  citationId: string | null
  acteIsMissing: boolean | null
  acteLacune: boolean | null
  acteLacuneNote: string
  actePosition: string
  reproQualityRef: string | null
  marks: string
  citationNote: string
  ecritureRef: string | null
  handwritingLegibilityRef: string | null
  damageNotes: string
  reproNotes: string
  signaturesPresent: boolean | null
  signaturesCount: number | null
  marginalMentionsPresent: boolean | null
  marginalMentionsCount: number | null
  marginalCrossoutsPresent: boolean | null
  marginalCrossoutsCount: number | null
}

function depotLabel(depotInfo: ExemplaireDraft['depotInfo']) {
  if (!depotInfo) return '—'
  return [depotInfo.institutionNom ?? depotInfo.institutionSigle, depotInfo.nom].filter(Boolean).join(' · ') || '—'
}

// En-tête de carte (résumé compact) : sigle plutôt que nom complet, pour
// rester lisible sur une seule ligne à côté de la cote.
function depotShortLabel(depotInfo: ExemplaireDraft['depotInfo']) {
  if (!depotInfo) return '—'
  return [depotInfo.institutionSigle ?? depotInfo.institutionNom, depotInfo.nom].filter(Boolean).join(' · ') || '—'
}

function parentExemplaireOptionLabel(o: { coteLocale: string | null; depotInfo: ExemplaireDraft['depotInfo'] }) {
  return [o.coteLocale, depotLabel(o.depotInfo)].filter(Boolean).join(' — ') || 'Exemplaire sans cote'
}

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [notFound, setNotFound] = useState(false)

  // Lecture seule par défaut — évite les modifications accidentelles sur un
  // document déjà décrit. Déverrouillage explicite avec confirmation.
  const [locked, setLocked] = useState(true)
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false)
  const fieldMode = locked ? 'view' : 'edit'

  const [titre, setTitre] = useState('')
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([])

  const [typeUniteRef,       setTypeUniteRef]       = useState<string | null>(null)
  const [roleRef,            setRoleRef]            = useState('')
  const [langueRef,          setLangueRef]          = useState<string | null>(null)
  const [periode,            setPeriode]            = useState('')
  const [niveauFiabilite,    setNiveauFiabilite]    = useState<'haute' | 'moyenne' | 'basse' | null>(null)
  const [note,               setNote]               = useState('')
  const [serieRef,           setSerieRef]           = useState<string | null>(null)

  const [exemplaires,     setExemplaires]     = useState<ExemplaireDraft[]>([])
  const [exemplairesOpen, setExemplairesOpen] = useState(false)
  const [expandedIds,     setExpandedIds]     = useState<Set<string>>(new Set())
  const [compareIds,      setCompareIds]      = useState<string[]>([])
  const [compareOpen,     setCompareOpen]     = useState(false)
  const [formVariants,    setFormVariants]    = useState<Record<string, 'short' | 'full'>>({})
  const [referenceUpdating, setReferenceUpdating] = useState<string | null>(null)

  const [addOpen,           setAddOpen]           = useState(false)
  const [addDepotQuery,     setAddDepotQuery]     = useState('')
  const [addDepotResults,   setAddDepotResults]   = useState<DepotOption[]>([])
  const [addDepotSearching, setAddDepotSearching] = useState(false)
  const [addSelectedDepot,  setAddSelectedDepot]  = useState<DepotOption | null>(null)
  const [addCoteLocale,     setAddCoteLocale]     = useState('')
  const [addNatureRef,      setAddNatureRef]      = useState<string | null>(null)
  const [addPosition,       setAddPosition]       = useState('')
  const [addUrl,            setAddUrl]            = useState('')
  const [addNotes,          setAddNotes]          = useState('')
  const [addingExemplaire,  setAddingExemplaire]  = useState(false)
  const [addParentExemplaireId, setAddParentExemplaireId] = useState<string | null>(null)

  // Exemplaires du document parent direct (typiquement le registre qui
  // contient physiquement cet acte/cette table) — permet de préciser de
  // quel exemplaire précis du parent (quelle numérisation) provient cet
  // exemplaire, via exemplaires.parent_exemplaire_id.
  const [parentExemplaireOptions, setParentExemplaireOptions] = useState<Array<{ id: string; coteLocale: string | null; localisationInterne: string | null; depotInfo: ExemplaireDraft['depotInfo'] }>>([])

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleting,       setDeleting]       = useState(false)
  const [linkingCitationId, setLinkingCitationId] = useState<string | null>(null)

  const [ancestors, setAncestors] = useState<Array<{ id: string; titre: string }>>([])
  const [children,  setChildren]  = useState<Array<{ id: string; titre: string }>>([])
  const [mentionedIn, setMentionedIn] = useState<Array<{ id: string; titre: string }>>([])

  const isActe = roleOptions.find(o => o.id === roleRef)?.code === 'ACTE_PRIMAIRE'
  const isTable = roleOptions.find(o => o.id === roleRef)?.code === 'INSTRUMENT_DE_RECHERCHE'
  const showStatutSection = isActe || isTable
  const snapshotRef = useRef<string>('')

  function getTrackedValues() {
    return { titre, typeUniteRef, roleRef, langueRef, periode, niveauFiabilite, note, serieRef, exemplaires }
  }

  const dirty = !loading && JSON.stringify(getTrackedValues()) !== snapshotRef.current

  function updateExemplaire(idx: number, patch: Partial<ExemplaireDraft>) {
    setExemplaires(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e))
  }

  function toggleExpanded(exId: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(exId)) next.delete(exId); else next.add(exId)
      return next
    })
  }

  function toggleCompare(exId: string) {
    setCompareIds(prev => {
      if (prev.includes(exId)) return prev.filter(x => x !== exId)
      if (prev.length >= 2) { toast.info('Deux exemplaires maximum pour la comparaison'); return prev }
      return [...prev, exId]
    })
  }

  async function setReference(exId: string) {
    if (!id) return
    setReferenceUpdating(exId)
    try {
      const { error: e1 } = await supabaseRebond.from('exemplaires')
        .update({ est_reference: false }).eq('unite_documentaire_id', id).neq('id', exId)
      if (e1) throw e1
      const { error: e2 } = await supabaseRebond.from('exemplaires').update({ est_reference: true }).eq('id', exId)
      if (e2) throw e2
      setExemplaires(prev => {
        const next = prev.map(e => ({ ...e, estReference: e.id === exId }))
        snapshotRef.current = JSON.stringify({ titre, typeUniteRef, roleRef, langueRef, periode, niveauFiabilite, note, serieRef, exemplaires: next })
        return next
      })
      toast.success('Exemplaire de référence mis à jour')
    } catch {
      toast.error("Erreur lors de la mise à jour de l'exemplaire de référence")
    } finally {
      setReferenceUpdating(null)
    }
  }

  // Relie a posteriori un exemplaire créé avant que la création de citation
  // automatique n'existe (ou dont la cible n'était pas encore connue à ce
  // moment-là) — reprend le même target_type/target_id qu'un autre
  // exemplaire déjà relié du même document.
  async function handleLinkCitation(exId: string) {
    setLinkingCitationId(exId)
    try {
      const siblingIds = exemplaires.filter(e => e.id !== exId && e.citationId).map(e => e.id)
      if (siblingIds.length === 0) {
        toast.error("Aucun autre exemplaire de ce document n'est encore relié à un acte/une table.")
        return
      }
      const { data: existingCit, error: findErr } = await supabaseRebond.from('citations')
        .select('target_type, target_id').in('exemplaire_id', siblingIds).in('target_type', ['ec_acte', 'ec_table', 'hyp_acte']).limit(1).maybeSingle()
      if (findErr) throw findErr
      if (!existingCit) {
        toast.error("Aucun autre exemplaire de ce document n'est encore relié à un acte/une table.")
        return
      }
      const { data: newCit, error: citErr } = await supabaseRebond.from('citations').insert({
        exemplaire_id: exId, target_type: existingCit.target_type, target_id: existingCit.target_id,
      }).select('id').single()
      if (citErr) throw citErr
      setExemplaires(prev => {
        const next = prev.map(e => e.id === exId ? { ...e, citationId: newCit?.id ?? null } : e)
        snapshotRef.current = JSON.stringify({ titre, typeUniteRef, roleRef, langueRef, periode, niveauFiabilite, note, serieRef, exemplaires: next })
        return next
      })
      toast.success('Exemplaire relié')
    } catch {
      toast.error("Erreur lors de la mise en relation de l'exemplaire")
    } finally {
      setLinkingCitationId(null)
    }
  }

  useEffect(() => {
    if (!addOpen) return
    const q = addDepotQuery.trim()
    if (q.length < 2 || addSelectedDepot) { setAddDepotResults([]); setAddDepotSearching(false); return }
    setAddDepotSearching(true)
    const t = setTimeout(async () => {
      try {
        const toOption = (d: any): DepotOption => {
          const inst  = Array.isArray(d.ref_institutions) ? d.ref_institutions[0] : d.ref_institutions
          const dtype = Array.isArray(d.ref_depot_type)   ? d.ref_depot_type[0]   : d.ref_depot_type
          const plat  = Array.isArray(d.ref_plateformes)  ? d.ref_plateformes[0]  : d.ref_plateformes
          return {
            id: d.id,
            institution_sigle: inst?.sigle ?? null,
            institution_nom:   inst?.nom   ?? null,
            type_code:    dtype?.code      ?? null,
            type_label:   dtype?.label     ?? null,
            plateforme_label: plat?.label  ?? null,
            is_online: dtype?.is_online    ?? false,
          }
        }

        const { data: instData } = await supabaseRebond.from('ref_institutions')
          .select('id').or(`nom.ilike.%${q}%,sigle.ilike.%${q}%`).limit(20)
        const instIds = (instData ?? []).map((i: any) => i.id as string)
        if (instIds.length === 0) { setAddDepotResults([]); return }

        const { data: depotData } = await supabaseRebond.from('ref_depots')
          .select(`
            id,
            ref_institutions!institution_id(nom, sigle),
            ref_depot_type!type_ref(code, label, is_online),
            ref_plateformes!plateforme_ref(code, label)
          `)
          .in('institution_id', instIds).order('institution_id').limit(20)
        setAddDepotResults((depotData ?? []).map(toOption).slice(0, 10))
      } finally {
        setAddDepotSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [addDepotQuery, addSelectedDepot, addOpen])

  async function handleCreateExemplaire() {
    if (!id || !addSelectedDepot || !addNatureRef || addingExemplaire) return
    setAddingExemplaire(true)
    try {
      const { data, error } = await supabaseRebond.from('exemplaires').insert({
        unite_documentaire_id: id,
        depot_id: addSelectedDepot.id,
        nature_ref: addNatureRef,
        cote_locale: addCoteLocale.trim() || null,
        localisation_interne: addPosition.trim() || null,
        note: addNotes.trim() || null,
        parent_exemplaire_id: addParentExemplaireId,
      }).select('id').single()
      if (error) throw error

      if (addUrl.trim()) {
        await supabaseRebond.from('ref_acces_numeriques').insert({
          exemplaire_id: data.id, url_base: addUrl.trim(), type_acces_id: TYPE_ACCES_URL_ID,
        })
      }

      // Ce document a déjà un acte/une table métier relié (via un autre
      // exemplaire) — cette nouvelle copie documente le même acte/la même
      // table, juste vu ailleurs (autre numérisation) : on crée directement
      // sa citation (même target), prête à compléter, plutôt que d'obliger
      // à repasser par l'assistant de référencement qui ne sait pas ajouter
      // un exemplaire à un acte déjà existant.
      let newCitationId: string | null = null
      if (showStatutSection) {
        const existingIds = exemplaires.map(e => e.id)
        if (existingIds.length > 0) {
          const { data: existingCit } = await supabaseRebond.from('citations')
            .select('target_type, target_id').in('exemplaire_id', existingIds).in('target_type', ['ec_acte', 'ec_table', 'hyp_acte']).limit(1).maybeSingle()
          if (existingCit) {
            const { data: newCit } = await supabaseRebond.from('citations').insert({
              exemplaire_id: data.id, target_type: existingCit.target_type, target_id: existingCit.target_id,
              locating: addPosition.trim() ? { systems: [{ raw: addPosition.trim() }] } : {},
            }).select('id').single()
            newCitationId = newCit?.id ?? null
          }
        }
      }

      const newDraft: ExemplaireDraft = {
        id: data.id,
        estReference: false,
        natureRef: addNatureRef, supportRef: null, paginationTypeRef: null, nbPages: '', conditionnement: '',
        physicalConditionRef: null, description: '', identifiantInterne: '',
        coteLocale: addCoteLocale.trim(), localisationInterne: addPosition.trim(), note: addNotes.trim(),
        dansTable: null, dansRegistre: null, damageKindsIds: null, readabilityFeaturesIds: null,
        depotInfo: { nom: '', institutionNom: addSelectedDepot.institution_nom, institutionSigle: addSelectedDepot.institution_sigle },
        parentExemplaireId: addParentExemplaireId, sourceExemplaire: null,
        citationId: newCitationId, acteIsMissing: null, acteLacune: null, acteLacuneNote: '', actePosition: addPosition.trim(),
        reproQualityRef: null, marks: '', citationNote: '',
        ecritureRef: null, handwritingLegibilityRef: null, damageNotes: '', reproNotes: '',
        signaturesPresent: null, signaturesCount: null, marginalMentionsPresent: null, marginalMentionsCount: null,
        marginalCrossoutsPresent: null, marginalCrossoutsCount: null,
      }
      setExemplaires(prev => {
        const next = [...prev, newDraft]
        snapshotRef.current = JSON.stringify({ titre, typeUniteRef, roleRef, langueRef, periode, niveauFiabilite, note, serieRef, exemplaires: next })
        return next
      })
      setExpandedIds(prev => new Set(prev).add(data.id))
      setExemplairesOpen(true)
      setAddOpen(false); setAddDepotQuery(''); setAddDepotResults([]); setAddSelectedDepot(null); setAddCoteLocale('')
      setAddNatureRef(null); setAddPosition(''); setAddUrl(''); setAddNotes(''); setAddParentExemplaireId(null)
      toast.success('Exemplaire créé')
    } catch {
      toast.error("Erreur lors de la création de l'exemplaire")
    } finally {
      setAddingExemplaire(false)
    }
  }

  async function handleDeleteExemplaire() {
    if (!deleteTargetId || deleting) return
    setDeleting(true)
    try {
      const { error } = await supabaseRebond.from('exemplaires').delete().eq('id', deleteTargetId)
      if (error) {
        if (error.code === '23503') {
          toast.error("Impossible de supprimer : cet exemplaire est encore relié à une citation (acte/table) ou à un accès numérique.")
        } else {
          toast.error("Erreur lors de la suppression de l'exemplaire")
        }
        return
      }
      const deletedId = deleteTargetId
      setExemplaires(prev => {
        const next = prev.filter(e => e.id !== deletedId)
        snapshotRef.current = JSON.stringify({ titre, typeUniteRef, roleRef, langueRef, periode, niveauFiabilite, note, serieRef, exemplaires: next })
        return next
      })
      setExpandedIds(prev => { const next = new Set(prev); next.delete(deletedId); return next })
      setCompareIds(prev => prev.filter(x => x !== deletedId))
      toast.success('Exemplaire supprimé')
      setDeleteTargetId(null)
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const roles = await fetchRoleDocumentOptions()
      if (cancelled) return
      setRoleOptions(roles)

      const { data: doc } = await supabaseRebond.from('unites_documentaires')
        .select('id, titre, type_unite_ref, role_document_ref, couverture_label, langue_ref, niveau_fiabilite, metadonnees, parent_ud_id, serie_ref')
        .eq('id', id).maybeSingle()
      if (cancelled) return
      if (!doc) { setNotFound(true); setLoading(false); return }

      setTitre(doc.titre)
      setTypeUniteRef(doc.type_unite_ref ?? null)
      setRoleRef(doc.role_document_ref ?? '')
      setLangueRef(doc.langue_ref ?? null)
      setPeriode(doc.couverture_label ?? '')
      setNiveauFiabilite((doc.niveau_fiabilite as 'haute' | 'moyenne' | 'basse' | null) ?? null)
      setNote((doc.metadonnees as any)?.note ?? '')
      setSerieRef(doc.serie_ref ?? null)

      if (doc.parent_ud_id) {
        const { data: parentEx } = await supabaseRebond.from('exemplaires')
          .select('id, cote_locale, localisation_interne, ref_depots ( nom, ref_institutions ( nom, sigle ) )')
          .eq('unite_documentaire_id', doc.parent_ud_id).order('created_at', { ascending: true })
        if (cancelled) return
        setParentExemplaireOptions((parentEx ?? []).map((p: any) => {
          const depot = Array.isArray(p.ref_depots) ? p.ref_depots[0] : p.ref_depots
          const depotInfo = depot ? {
            nom: depot.nom,
            institutionNom: (Array.isArray(depot.ref_institutions) ? depot.ref_institutions[0] : depot.ref_institutions)?.nom ?? null,
            institutionSigle: (Array.isArray(depot.ref_institutions) ? depot.ref_institutions[0] : depot.ref_institutions)?.sigle ?? null,
          } : null
          return { id: p.id, coteLocale: p.cote_locale ?? null, localisationInterne: p.localisation_interne ?? null, depotInfo }
        }))
      }

      const { data: exRows } = await supabaseRebond.from('exemplaires')
        .select(`
          id, nature_ref, support_ref, pagination_type_ref, nb_pages, conditionnement, physical_condition_ref, description, identifiant_interne,
          depot_id, cote_locale, localisation_interne, note, dans_table, dans_registre, est_reference, parent_exemplaire_id,
          document_damage_kinds_ids, document_readability_features_ids,
          ref_depots ( nom, ref_institutions ( nom, sigle ) ),
          source_exemplaire:exemplaires!source_exemplaire_id ( cote_locale, unites_documentaires ( titre ) )
        `)
        .eq('unite_documentaire_id', id).order('created_at', { ascending: true })
      if (cancelled) return

      const exIds = (exRows ?? []).map((r: any) => r.id as string)
      const citByExemplaire = new Map<string, any>()
      if (exIds.length) {
        const { data: cits } = await supabaseRebond.from('citations')
          .select('id, exemplaire_id, target_type, is_missing, lacune, lacune_note, locating, repro_quality_ref, marks, marginalia, writing, note')
          .in('exemplaire_id', exIds).in('target_type', ['ec_acte', 'ec_table', 'hyp_acte'])
        if (cancelled) return
        for (const c of cits ?? []) citByExemplaire.set(c.exemplaire_id, c)
      }

      const drafts: ExemplaireDraft[] = (exRows ?? []).map((ex: any) => {
        const depot = Array.isArray(ex.ref_depots) ? ex.ref_depots[0] : ex.ref_depots
        const depotInfo = depot ? {
          nom: depot.nom,
          institutionNom: (Array.isArray(depot.ref_institutions) ? depot.ref_institutions[0] : depot.ref_institutions)?.nom ?? null,
          institutionSigle: (Array.isArray(depot.ref_institutions) ? depot.ref_institutions[0] : depot.ref_institutions)?.sigle ?? null,
        } : null
        const sEx = Array.isArray(ex.source_exemplaire) ? ex.source_exemplaire[0] : ex.source_exemplaire
        const sourceExemplaire = sEx ? {
          coteLocale: sEx.cote_locale ?? null,
          titre: (Array.isArray(sEx.unites_documentaires) ? sEx.unites_documentaires[0] : sEx.unites_documentaires)?.titre ?? null,
        } : null

        const cit = citByExemplaire.get(ex.id)
        const wr = unpackWriting(cit?.writing ?? null)
        const mar = unpackMarginalia(cit?.marginalia ?? null)
        const raw = (cit?.locating as any)?.systems?.[0]?.raw

        return {
          id: ex.id,
          estReference: ex.est_reference ?? false,
          natureRef: ex.nature_ref ?? null,
          supportRef: ex.support_ref ?? null,
          paginationTypeRef: ex.pagination_type_ref ?? null,
          nbPages: ex.nb_pages != null ? String(ex.nb_pages) : '',
          conditionnement: ex.conditionnement ?? '',
          physicalConditionRef: ex.physical_condition_ref ?? null,
          description: ex.description ?? '',
          identifiantInterne: ex.identifiant_interne ?? '',
          coteLocale: ex.cote_locale ?? '',
          localisationInterne: ex.localisation_interne ?? '',
          note: ex.note ?? '',
          dansTable: ex.dans_table ?? null,
          dansRegistre: ex.dans_registre ?? null,
          damageKindsIds: Array.isArray(ex.document_damage_kinds_ids) ? ex.document_damage_kinds_ids : null,
          readabilityFeaturesIds: Array.isArray(ex.document_readability_features_ids) ? ex.document_readability_features_ids : null,
          depotInfo, sourceExemplaire,
          parentExemplaireId: ex.parent_exemplaire_id ?? null,
          citationId: cit?.id ?? null,
          acteIsMissing: cit?.is_missing ?? null,
          acteLacune: cit?.lacune ?? null,
          acteLacuneNote: cit?.lacune_note ?? '',
          actePosition: typeof raw === 'string' ? raw : '',
          reproQualityRef: cit?.repro_quality_ref ?? null,
          marks: cit?.marks ?? '',
          citationNote: cit?.note ?? '',
          ecritureRef: wr.ecriture_ref,
          handwritingLegibilityRef: wr.handwriting_legibility_ref,
          damageNotes: wr.damage_notes,
          reproNotes: wr.repro_notes,
          signaturesPresent: mar.signatures_present,
          signaturesCount: mar.signatures_count,
          marginalMentionsPresent: mar.marginal_mentions_present,
          marginalMentionsCount: mar.marginal_mentions_count,
          marginalCrossoutsPresent: mar.marginal_crossouts_present,
          marginalCrossoutsCount: mar.marginal_crossouts_count,
        }
      })
      if (!cancelled) setExemplaires(drafts)

      // Hiérarchie — lecture seule
      const chain: Array<{ id: string; titre: string }> = []
      let currentId: string | null = doc.parent_ud_id
      for (let i = 0; i < 6 && currentId; i++) {
        const { data } = await supabaseRebond.from('unites_documentaires')
          .select('id, titre, parent_ud_id').eq('id', currentId).maybeSingle()
        if (!data) break
        chain.push({ id: data.id, titre: data.titre })
        currentId = data.parent_ud_id
      }
      if (!cancelled) setAncestors(chain.reverse())

      const { data: kids } = await supabaseRebond.from('unites_documentaires')
        .select('id, titre').eq('parent_ud_id', id).order('titre')
      if (!cancelled) setChildren(kids ?? [])

      // "Mentionné dans" — tables/répertoires qui référencent ce document
      // sans le contenir physiquement (rebond.unites_documentaires_mentions,
      // distinct du containment porté par parent_ud_id).
      const { data: mentions } = await supabaseRebond.from('unites_documentaires_mentions')
        .select('mentionnant:unites_documentaires!mentionnant_id ( id, titre )').eq('mentionne_id', id)
      if (!cancelled) {
        setMentionedIn((mentions ?? []).map((m: any) => Array.isArray(m.mentionnant) ? m.mentionnant[0] : m.mentionnant).filter(Boolean))
      }

      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // Snapshot pris une fois le chargement terminé (state déjà à jour à ce moment-là)
  useEffect(() => {
    if (!loading && !notFound) {
      snapshotRef.current = JSON.stringify(getTrackedValues())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  async function handleSave() {
    if (!id || saving || !dirty) return
    setSaving(true)
    try {
      const meta: Record<string, unknown> = {}
      if (note.trim()) meta.note = note.trim()

      const { error } = await supabaseRebond.from('unites_documentaires').update({
        titre: titre.trim() || 'Document sans titre',
        type_unite_ref: typeUniteRef,
        role_document_ref: roleRef || null,
        langue_ref: langueRef,
        couverture_label: periode || null,
        niveau_fiabilite: niveauFiabilite,
        metadonnees: Object.keys(meta).length ? meta : null,
        serie_ref: serieRef,
      }).eq('id', id)
      if (error) throw error

      for (const ex of exemplaires) {
        const { error: exErr } = await supabaseRebond.from('exemplaires').update({
          nature_ref: ex.natureRef,
          support_ref: ex.supportRef,
          pagination_type_ref: ex.paginationTypeRef,
          nb_pages: toIntOrNull(ex.nbPages),
          conditionnement: ex.conditionnement.trim() || null,
          physical_condition_ref: ex.physicalConditionRef,
          description: ex.description.trim() || null,
          identifiant_interne: ex.identifiantInterne.trim() || null,
          cote_locale: ex.coteLocale.trim() || null,
          localisation_interne: ex.localisationInterne.trim() || null,
          note: ex.note.trim() || null,
          document_damage_kinds_ids: ex.damageKindsIds ?? [],
          document_readability_features_ids: ex.readabilityFeaturesIds ?? [],
          parent_exemplaire_id: ex.parentExemplaireId,
        }).eq('id', ex.id)
        if (exErr) throw exErr

        if (showStatutSection && ex.citationId) {
          const { error: citErr } = await supabaseRebond.from('citations').update({
            is_missing: ex.acteIsMissing,
            lacune: ex.acteLacune,
            lacune_note: ex.acteLacune ? (ex.acteLacuneNote.trim() || null) : null,
            locating: ex.acteIsMissing ? {} : { systems: [{ raw: ex.actePosition.trim() }] },
            repro_quality_ref: ex.reproQualityRef,
            marks: ex.marks.trim() || null,
            note: ex.citationNote.trim() || null,
            writing: packWriting({
              ecriture_ref: ex.ecritureRef,
              handwriting_legibility_ref: ex.handwritingLegibilityRef,
              damage_notes: ex.damageNotes,
              repro_notes: ex.reproNotes,
            }),
            marginalia: packMarginalia({
              signatures_present: ex.signaturesPresent,
              signatures_count: ex.signaturesCount,
              marginal_mentions_present: ex.marginalMentionsPresent,
              marginal_mentions_count: ex.marginalMentionsCount,
              marginal_crossouts_present: ex.marginalCrossoutsPresent,
              marginal_crossouts_count: ex.marginalCrossoutsCount,
            }),
          }).eq('id', ex.citationId)
          if (citErr) throw citErr
        }
      }

      snapshotRef.current = JSON.stringify(getTrackedValues())
      toast.success('Document enregistré')
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />Chargement du document…
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-rose-200 p-6 max-w-sm text-center">
          <p className="text-sm font-medium text-gray-800">Document introuvable</p>
          <button onClick={() => navigate('/patrimoine-documentaire')} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800">
            Retour à Patrimoine documentaire
          </button>
        </div>
      </div>
    )
  }

  const compareA = compareIds[0] ? exemplaires.find(e => e.id === compareIds[0]) : undefined
  const compareB = compareIds[1] ? exemplaires.find(e => e.id === compareIds[1]) : undefined
  const deleteTarget = deleteTargetId ? exemplaires.find(e => e.id === deleteTargetId) : undefined

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-4">

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
            <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors shrink-0">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <Link to="/patrimoine-documentaire" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors shrink-0">
              <Library className="w-4 h-4" />
              Patrimoine documentaire
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900 truncate">{titre}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => locked ? setConfirmUnlockOpen(true) : setLocked(true)}
              title={locked ? 'Déverrouiller pour modifier' : 'Reverrouiller (lecture seule)'}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                locked
                  ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}>
              {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {locked ? 'Lecture seule' : 'Édition'}
            </button>
            {!locked && (
              <button onClick={handleSave} disabled={!dirty || saving}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Enregistrer
              </button>
            )}
          </div>
        </div>

        <Dialog open={confirmUnlockOpen} onOpenChange={setConfirmUnlockOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Passer en mode édition ?</DialogTitle>
              <DialogDescription>
                Ce document est actuellement en lecture seule. Le déverrouiller rendra tous les champs modifiables.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button onClick={() => setConfirmUnlockOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={() => { setLocked(false); setConfirmUnlockOpen(false) }}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors">
                <Unlock className="w-3.5 h-3.5" />Déverrouiller
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {(ancestors.length > 0 || children.length > 0 || mentionedIn.length > 0) && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-600 space-y-2">
            {ancestors.length > 0 && (
              <div>
                <div className="font-semibold text-gray-400 uppercase tracking-wide text-[10px] mb-1">Hiérarchie</div>
                <div className="flex flex-wrap items-center gap-1">
                  {ancestors.map(a => (
                    <span key={a.id} className="flex items-center gap-1">
                      <span className="text-gray-700">{a.titre}</span>
                      <ChevronRight className="w-3 h-3 text-gray-300" />
                    </span>
                  ))}
                  <span className="font-medium text-indigo-700">{titre} (ce document)</span>
                </div>
              </div>
            )}
            {mentionedIn.length > 0 && (
              <div>
                <div className="font-semibold text-gray-400 uppercase tracking-wide text-[10px] mb-1">Mentionné dans</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {mentionedIn.map((m, i) => (
                    <span key={m.id} className="text-gray-700">
                      {m.titre}{i < mentionedIn.length - 1 && <span className="text-gray-300">,</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {children.length > 0 && (
              <div>
                <div className="font-semibold text-gray-400 uppercase tracking-wide text-[10px] mb-1">
                  Documents enfants ({children.length})
                </div>
                <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                  {children.slice(0, 5).map(c => <li key={c.id}>{c.titre}</li>)}
                  {children.length > 5 && <li className="text-gray-400">… et {children.length - 5} autre(s)</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        <GroupHeading step={1} label="Le document" />
        <SectionCard title="Identification" subtitle="Nature intellectuelle du document et informations générales.">
          <Field label="Titre" required>
            <input value={titre} onChange={e => setTitre(e.target.value)} readOnly={locked}
              placeholder="Titre du document" className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Rôle" required>
              <select value={roleRef} onChange={e => setRoleRef(e.target.value)} disabled={locked} className={selectCls}>
                <option value="">À préciser</option>
                {roleOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Type d'unité" required>
              <RefSinglePickerSmart
                table="ref_type_unite" mode={fieldMode} actionsInvisible={false}
                value={typeUniteRef}
                onChange={next => setTypeUniteRef(next ? String(next) : null)}
              />
            </Field>

            <Field label="Couverture temporelle" required>
              <input value={periode} onChange={e => setPeriode(e.target.value)} readOnly={locked}
                placeholder="ex. 1889 ou 1880–1920" className={inputCls} />
            </Field>

            <Field label="Langue">
              <RefSinglePickerSmart
                table="ref_langues" mode={fieldMode} actionsInvisible={false}
                value={langueRef}
                onChange={next => setLangueRef(next ? String(next) : null)}
              />
            </Field>

            <Field label="Série documentaire" required>
              <RefSinglePickerSmart
                table="ref_series_documentaires" mode={fieldMode} actionsInvisible={false}
                value={serieRef}
                onChange={next => setSerieRef(next ? String(next) : null)}
              />
            </Field>

            <Field label="Note">
              <input value={note} onChange={e => setNote(e.target.value)} readOnly={locked}
                placeholder="Observations sur ce document…" className={inputCls} />
            </Field>
          </div>

          <Field label="Fiabilité">
            <div className="flex gap-2">
              {(['haute', 'moyenne', 'basse'] as const).map(niveau => (
                <button key={niveau} type="button" disabled={locked}
                  onClick={() => setNiveauFiabilite(niveauFiabilite === niveau ? null : niveau)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-default disabled:hover:border-gray-200 ${
                    niveauFiabilite === niveau ? FIABILITE_CONFIG[niveau].color : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {FIABILITE_CONFIG[niveau].label}
                </button>
              ))}
            </div>
          </Field>
        </SectionCard>

        <GroupHeading step={2} label="L'exemplaire" />
        <div className="rounded-xl border border-slate-200 bg-white">
          <button type="button" onClick={() => setExemplairesOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="text-sm font-semibold text-slate-900">Exemplaires</div>
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                {exemplaires.length}
              </span>
            </div>
            {exemplairesOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {exemplairesOpen && (
            <div className="border-t border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-600">La forme physique ou numérique de chaque copie de ce document.</p>
                <div className="flex items-center gap-2 shrink-0">
                  {compareIds.length === 2 && (
                    <button type="button" onClick={() => setCompareOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                      <ArrowLeftRight className="w-3.5 h-3.5" />Comparer
                    </button>
                  )}
                  {!locked && (
                    <button type="button" onClick={() => setAddOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                      <Plus className="w-3.5 h-3.5" />Ajouter un exemplaire
                    </button>
                  )}
                </div>
              </div>

              {exemplaires.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">Aucun exemplaire pour ce document.</p>
              )}

              {exemplaires.map((ex, idx) => {
                const expanded = expandedIds.has(ex.id)
                const inCompare = compareIds.includes(ex.id)
                const variant = formVariants[ex.id] ?? 'full'
                const parentOpt = ex.parentExemplaireId ? parentExemplaireOptions.find(o => o.id === ex.parentExemplaireId) : undefined

                const statutEtLocalisation = (
                  <>
                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-800">Document manquant</strong> : ce document n'existe pas du tout à cet endroit (page absente, jamais transcrit ici). <strong className="text-slate-800">Lacune</strong> : le document est bien présent, mais une partie est illisible, endommagée ou incomplète.
                    </p>
                    <div className="space-y-3">
                      <TriStateButton
                        label="Document manquant *" yesLabel="Oui" noLabel="Non" mode={fieldMode}
                        value={ex.acteIsMissing}
                        onChange={v => updateExemplaire(idx, { acteIsMissing: v ?? null })}
                      />
                      <TriStateButton
                        label="Lacune" yesLabel="Oui" noLabel="Non" mode={fieldMode}
                        value={ex.acteLacune}
                        onChange={v => updateExemplaire(idx, { acteLacune: v ?? null })}
                      />
                    </div>
                    {ex.acteIsMissing === true ? (
                      <p className="text-xs text-amber-600">Document déclaré manquant — la localisation n'est pas requise.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Localisation (vue / folio)" required>
                          <input value={ex.actePosition} onChange={e => updateExemplaire(idx, { actePosition: e.target.value })} readOnly={locked}
                            placeholder="Ex. vue 23 ; f°12r" className={inputCls} />
                        </Field>
                        <Field label="Plage du registre">
                          <div className={`${inputCls} bg-gray-50 text-gray-500`}>{parentOpt?.localisationInterne || '—'}</div>
                        </Field>
                      </div>
                    )}
                    {ex.acteLacune === true && (
                      <Field label="Détail lacune">
                        <textarea value={ex.acteLacuneNote} onChange={e => updateExemplaire(idx, { acteLacuneNote: e.target.value })} readOnly={locked}
                          placeholder="Ex. vues 120–140 absentes…" className={`${inputCls} min-h-[60px] resize-none`} />
                      </Field>
                    )}
                  </>
                )

                return (
                  <div key={ex.id} className="rounded-lg border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/70">
                      <Checkbox checked={inCompare} onCheckedChange={() => toggleCompare(ex.id)} aria-label="Sélectionner pour comparaison" />
                      <button type="button" onClick={() => toggleExpanded(ex.id)} className="flex-1 flex items-center gap-2 min-w-0 text-left">
                        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                        <span className="text-sm font-medium text-slate-800 truncate">{ex.coteLocale || `Exemplaire ${idx + 1}`}</span>
                        {ex.depotInfo && <span className="text-xs text-slate-400 truncate">{depotShortLabel(ex.depotInfo)}</span>}
                        {ex.estReference && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                            <Star className="w-2.5 h-2.5 fill-current" />Référence
                          </span>
                        )}
                      </button>
                      {!locked && !ex.estReference && (
                        <button type="button" onClick={() => setReference(ex.id)} disabled={referenceUpdating === ex.id}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 shrink-0 disabled:opacity-50">
                          {referenceUpdating === ex.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                          Choisir comme référence
                        </button>
                      )}
                      {!locked && (
                        <button type="button" onClick={() => setDeleteTargetId(ex.id)} title="Supprimer cet exemplaire"
                          className="flex items-center rounded-lg border border-gray-200 p-1.5 text-rose-600 hover:bg-rose-50 hover:border-rose-200 shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {expanded && (
                      <div className="p-4 space-y-4 border-t border-slate-200">
                        {(ex.dansTable != null || ex.dansRegistre != null || parentOpt || ex.sourceExemplaire) && (
                          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 space-y-1">
                            {(ex.dansTable != null || ex.dansRegistre != null) && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Répertorié</span>
                                {ex.dansTable === true && <span className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5">Dans une table</span>}
                                {ex.dansRegistre === true && <span className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5">Dans un registre</span>}
                                {ex.dansTable !== true && ex.dansRegistre !== true && <span className="text-gray-400">Ni table ni registre</span>}
                              </div>
                            )}
                            {ex.sourceExemplaire && (
                              <div>
                                <span className="font-semibold text-gray-400 uppercase tracking-wide text-[10px] mr-1.5">Dérivé de</span>
                                <span className="text-gray-700">{ex.sourceExemplaire.titre}{ex.sourceExemplaire.coteLocale && ` (${ex.sourceExemplaire.coteLocale})`}</span>
                              </div>
                            )}
                            {parentOpt && (
                              <div>
                                <span className="font-semibold text-gray-400 uppercase tracking-wide text-[10px] mr-1.5">Exemplaire du registre correspondant</span>
                                <span className="text-gray-700">{parentExemplaireOptionLabel(parentOpt)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <Field label="Dépôt de conservation">
                          <div className={`${inputCls} bg-gray-50 text-gray-500`}>{depotLabel(ex.depotInfo)}</div>
                        </Field>

                        <Field label="Cote locale">
                          <input value={ex.coteLocale} onChange={e => updateExemplaire(idx, { coteLocale: e.target.value })} readOnly={locked}
                            placeholder="Cote d'archives de cette copie" className={`${inputCls} font-mono`} />
                        </Field>

                        <Field label="Vue (plage dans le visualiseur numérique)">
                          <input value={ex.localisationInterne} onChange={e => updateExemplaire(idx, { localisationInterne: e.target.value })} readOnly={locked}
                            placeholder="Ex. 12-14 (ou 1-376 pour l'étendue totale d'un registre)" className={inputCls} />
                        </Field>

                        {parentExemplaireOptions.length > 0 && (
                          <Field label="Exemplaire du registre correspondant">
                            <select value={ex.parentExemplaireId ?? ''} disabled={locked}
                              onChange={e => updateExemplaire(idx, { parentExemplaireId: e.target.value || null })} className={selectCls}>
                              <option value="">Non précisé</option>
                              {parentExemplaireOptions.map(o => (
                                <option key={o.id} value={o.id}>{parentExemplaireOptionLabel(o)}</option>
                              ))}
                            </select>
                          </Field>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Nature">
                            <RefSinglePickerSmart table="ref_natures" mode={fieldMode} actionsInvisible={false}
                              value={ex.natureRef} onChange={next => updateExemplaire(idx, { natureRef: next ? String(next) : null })} />
                          </Field>

                          <Field label="Support">
                            <RefSinglePickerSmart table="ref_supports" mode={fieldMode} actionsInvisible={false}
                              value={ex.supportRef} onChange={next => updateExemplaire(idx, { supportRef: next ? String(next) : null })} />
                          </Field>
                        </div>

                        <Field label="Identifiant interne">
                          <input value={ex.identifiantInterne} onChange={e => updateExemplaire(idx, { identifiantInterne: e.target.value })} readOnly={locked}
                            placeholder="ex. DOC-2026-0147 (référence interne à cette copie, pas la cote d'archives)" className={`${inputCls} font-mono`} />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Condition physique">
                            <RefSinglePickerSmart table="ref_physical_condition" mode={fieldMode} actionsInvisible={false}
                              value={ex.physicalConditionRef} onChange={next => updateExemplaire(idx, { physicalConditionRef: next ? String(next) : null })} />
                          </Field>

                          {!isActe && (
                            <>
                              <Field label="Nombre de pages">
                                <input value={ex.nbPages} onChange={e => updateExemplaire(idx, { nbPages: e.target.value })} inputMode="numeric" readOnly={locked}
                                  placeholder="ex. 250" className={inputCls} />
                              </Field>

                              <Field label="Conditionnement">
                                <input value={ex.conditionnement} onChange={e => updateExemplaire(idx, { conditionnement: e.target.value })} readOnly={locked}
                                  placeholder="Contenant de rangement : ex. boîte d'archives n°12, chemise cartonnée…" className={inputCls} />
                              </Field>
                            </>
                          )}
                        </div>

                        <Field label="Dommages">
                          <RefSinglePickerSmart table="ref_document_damage_kinds" mode={fieldMode} actionsInvisible={false} multi
                            value={ex.damageKindsIds} onChange={next => updateExemplaire(idx, { damageKindsIds: next })} />
                        </Field>

                        <Field label="Caractéristiques de lisibilité">
                          <RefSinglePickerSmart table="ref_document_readability_features" mode={fieldMode} actionsInvisible={false} multi
                            value={ex.readabilityFeaturesIds} onChange={next => updateExemplaire(idx, { readabilityFeaturesIds: next })} />
                        </Field>

                        <Field label="Description physique">
                          <textarea value={ex.description} onChange={e => updateExemplaire(idx, { description: e.target.value })} readOnly={locked}
                            placeholder="Apparence de cet exemplaire : reliure, nombre de folios, page de titre…" className={`${inputCls} min-h-[70px] resize-none`} />
                        </Field>

                        <Field label="Note (exemplaire)">
                          <textarea value={ex.note} onChange={e => updateExemplaire(idx, { note: e.target.value })} readOnly={locked}
                            placeholder="Note libre propre à cette copie…" className={`${inputCls} min-h-[60px] resize-none`} />
                        </Field>

                        {showStatutSection && !ex.citationId && (
                          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                            <p className="text-xs text-slate-400 italic">
                              Cette copie n'est pas encore reliée à l'acte/la table.
                            </p>
                            {!locked && (
                              <button type="button" onClick={() => handleLinkCitation(ex.id)} disabled={linkingCitationId === ex.id}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 shrink-0 disabled:opacity-50">
                                {linkingCitationId === ex.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                Relier maintenant
                              </button>
                            )}
                          </div>
                        )}

                        {showStatutSection && ex.citationId && (
                          <div className="space-y-3 border-t border-slate-100 pt-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Statut & localisation {isActe ? "de l'acte" : 'de la table'}
                            </p>

                            <Tabs value={variant} onValueChange={v => setFormVariants(prev => ({ ...prev, [ex.id]: v as 'short' | 'full' }))}>
                              <TabsList>
                                <TabsTrigger value="short" className="text-xs">Formulaire court</TabsTrigger>
                                <TabsTrigger value="full" className="text-xs">Formulaire complet</TabsTrigger>
                              </TabsList>

                              <TabsContent value="short" className="pt-4">
                                <SectionCard title="Statut" subtitle="Champs minimum requis pour valider l'occurrence.">
                                  {statutEtLocalisation}
                                </SectionCard>
                              </TabsContent>

                              <TabsContent value="full" className="pt-4 space-y-4">
                                <SectionCard title="Statut" subtitle="Champs minimum requis pour valider l'occurrence.">
                                  {statutEtLocalisation}
                                </SectionCard>

                                <SectionCard title="Observations sur cette version" subtitle="État, reproduction, dommages, écriture & lisibilité.">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">État, reproduction & dommages</div>
                                    <div className="mt-3 grid grid-cols-2 gap-4">
                                      <Field label="Qualité de reproduction">
                                        <RefSinglePickerSmart table="ref_repro_quality" mode={fieldMode} actionsInvisible={false}
                                          value={ex.reproQualityRef} onChange={next => updateExemplaire(idx, { reproQualityRef: next ? String(next) : null })} />
                                      </Field>
                                      <Field label="Marques particulières">
                                        <input value={ex.marks} onChange={e => updateExemplaire(idx, { marks: e.target.value })} readOnly={locked}
                                          placeholder="Ex. tampon, cachet, sceau… (hors mentions marginales, voir plus bas)" className={inputCls} />
                                      </Field>
                                    </div>
                                    <div className="mt-4 space-y-4">
                                      <Field label="Notes sur la reproduction">
                                        <textarea value={ex.reproNotes} onChange={e => updateExemplaire(idx, { reproNotes: e.target.value })} readOnly={locked}
                                          placeholder="Ex. scan flou, contraste insuffisant…" className={`${inputCls} min-h-[60px] resize-none`} />
                                      </Field>
                                      <Field label="Notes sur les dommages">
                                        <textarea value={ex.damageNotes} onChange={e => updateExemplaire(idx, { damageNotes: e.target.value })} readOnly={locked}
                                          placeholder="Ex. coin déchiré, encre passée, taches d'humidité…" className={`${inputCls} min-h-[60px] resize-none`} />
                                      </Field>
                                    </div>
                                  </div>

                                  <Separator />

                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">Écriture & lisibilité</div>
                                    <div className="mt-3 grid grid-cols-2 gap-4">
                                      <Field label="Écriture">
                                        <RefSinglePickerSmart table="ref_ecritures" mode={fieldMode} actionsInvisible={false}
                                          value={ex.ecritureRef} onChange={next => updateExemplaire(idx, { ecritureRef: next ? String(next) : null })} />
                                      </Field>
                                      <Field label="Lisibilité">
                                        <RefSinglePickerSmart table="ref_handwriting_legibility" mode={fieldMode} actionsInvisible={false}
                                          value={ex.handwritingLegibilityRef} onChange={next => updateExemplaire(idx, { handwritingLegibilityRef: next ? String(next) : null })} />
                                      </Field>
                                    </div>
                                  </div>

                                  {isActe && (
                                    <>
                                      <Separator />
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">Marques & signes</div>
                                        <div className="mt-3 space-y-3">
                                          <TriStateButton label="Signatures" yesLabel="Présentes" noLabel="Absentes" mode={fieldMode}
                                            value={ex.signaturesPresent} onChange={v => updateExemplaire(idx, { signaturesPresent: v ?? null })} />
                                          {ex.signaturesPresent === true && (
                                            <Field label="Nombre de signatures">
                                              <input value={ex.signaturesCount ?? ''} onChange={e => updateExemplaire(idx, { signaturesCount: toIntOrNull(e.target.value) })}
                                                inputMode="numeric" readOnly={locked} className={inputCls} />
                                            </Field>
                                          )}

                                          <TriStateButton label="Mentions marginales" yesLabel="Présentes" noLabel="Absentes" mode={fieldMode}
                                            value={ex.marginalMentionsPresent} onChange={v => updateExemplaire(idx, { marginalMentionsPresent: v ?? null })} />
                                          {ex.marginalMentionsPresent === true && (
                                            <Field label="Nombre de mentions marginales">
                                              <input value={ex.marginalMentionsCount ?? ''} onChange={e => updateExemplaire(idx, { marginalMentionsCount: toIntOrNull(e.target.value) })}
                                                inputMode="numeric" readOnly={locked} className={inputCls} />
                                            </Field>
                                          )}

                                          <TriStateButton label="Ratures marginales" yesLabel="Présentes" noLabel="Absentes" mode={fieldMode}
                                            value={ex.marginalCrossoutsPresent} onChange={v => updateExemplaire(idx, { marginalCrossoutsPresent: v ?? null })} />
                                          {ex.marginalCrossoutsPresent === true && (
                                            <Field label="Nombre de ratures marginales">
                                              <input value={ex.marginalCrossoutsCount ?? ''} onChange={e => updateExemplaire(idx, { marginalCrossoutsCount: toIntOrNull(e.target.value) })}
                                                inputMode="numeric" readOnly={locked} className={inputCls} />
                                            </Field>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </SectionCard>

                                <Field label="Note sur cette citation">
                                  <input value={ex.citationNote} onChange={e => updateExemplaire(idx, { citationNote: e.target.value })} readOnly={locked}
                                    placeholder="Observations propres à cette occurrence…" className={inputCls} />
                                </Field>
                              </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* TODO Annexes : table + service prêts (unites_documentaires_annexes,
            fetchAnnexes/searchDocumentsByTitre/addAnnexe/removeAnnexe dans
            patrimoine.service.ts), UI volontairement pas encore branchée ici —
            demande explicite de l'utilisateur le 2026-08-10 (un premier essai
            desservait la fonctionnalité). Revenir dessus avec plus de soin. */}

        <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) {
          setAddDepotQuery(''); setAddDepotResults([]); setAddSelectedDepot(null); setAddCoteLocale('')
          setAddNatureRef(null); setAddPosition(''); setAddUrl(''); setAddNotes(''); setAddParentExemplaireId(null)
        } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un exemplaire</DialogTitle>
              <DialogDescription>
                Une nouvelle copie physique ou numérique de ce document.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">C'est où ?</p>
                <div className="space-y-3">
                  <Field label="Dépôt / institution" required>
                    <DepotPicker
                      depotQuery={addDepotQuery} setDepotQuery={setAddDepotQuery}
                      depotResults={addDepotResults} depotSearching={addDepotSearching}
                      selectedDepot={addSelectedDepot} setSelectedDepot={setAddSelectedDepot}
                      autoFocus
                    />
                  </Field>
                  <Field label="Nature de l'exemplaire" required>
                    <RefSinglePickerSmart
                      table="ref_natures" mode="edit" actionsInvisible={false}
                      value={addNatureRef}
                      onChange={next => setAddNatureRef(next ? String(next) : null)}
                    />
                  </Field>
                  <Field label="Cote">
                    <input value={addCoteLocale} onChange={e => setAddCoteLocale(e.target.value)}
                      placeholder="Ex. 5Mi/456" className={`${inputCls} font-mono`} />
                  </Field>
                  <Field label="Vue / folio">
                    <input value={addPosition} onChange={e => setAddPosition(e.target.value)}
                      placeholder="Ex. 12" className={inputCls} />
                  </Field>
                  {parentExemplaireOptions.length > 0 && (
                    <Field label="Exemplaire du registre correspondant">
                      <select value={addParentExemplaireId ?? ''} onChange={e => setAddParentExemplaireId(e.target.value || null)} className={selectCls}>
                        <option value="">Non précisé</option>
                        {parentExemplaireOptions.map(o => (
                          <option key={o.id} value={o.id}>{parentExemplaireOptionLabel(o)}</option>
                        ))}
                      </select>
                    </Field>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Comment y accéder ?</p>
                <Field label="URL">
                  <input value={addUrl} onChange={e => setAddUrl(e.target.value)} placeholder="https://…" className={inputCls} />
                </Field>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <Field label="Notes (optionnel)">
                  <textarea value={addNotes} onChange={e => setAddNotes(e.target.value)}
                    placeholder="Observations…" className={`${inputCls} min-h-[60px] resize-none`} />
                </Field>
              </div>
            </div>
            <DialogFooter>
              <button onClick={() => setAddOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleCreateExemplaire} disabled={!addSelectedDepot || !addNatureRef || addingExemplaire}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {addingExemplaire ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Créer
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Comparer deux exemplaires</DialogTitle>
            </DialogHeader>
            {compareA && compareB && (() => {
              const textRows: Array<{ label: string; a: string; b: string }> = [
                { label: 'Cote locale', a: compareA.coteLocale || '—', b: compareB.coteLocale || '—' },
                { label: 'Dépôt', a: depotLabel(compareA.depotInfo), b: depotLabel(compareB.depotInfo) },
                { label: 'Référence', a: compareA.estReference ? 'Oui' : 'Non', b: compareB.estReference ? 'Oui' : 'Non' },
                { label: 'Identifiant interne', a: compareA.identifiantInterne || '—', b: compareB.identifiantInterne || '—' },
                { label: 'Localisation interne', a: compareA.localisationInterne || '—', b: compareB.localisationInterne || '—' },
                { label: 'Nombre de pages', a: compareA.nbPages || '—', b: compareB.nbPages || '—' },
                { label: 'Conditionnement', a: compareA.conditionnement || '—', b: compareB.conditionnement || '—' },
                { label: 'Description physique', a: compareA.description || '—', b: compareB.description || '—' },
                { label: 'Note', a: compareA.note || '—', b: compareB.note || '—' },
              ]
              if (showStatutSection) {
                textRows.push(
                  { label: 'Document manquant', a: compareA.acteIsMissing == null ? '—' : compareA.acteIsMissing ? 'Oui' : 'Non', b: compareB.acteIsMissing == null ? '—' : compareB.acteIsMissing ? 'Oui' : 'Non' },
                  { label: 'Lacune', a: compareA.acteLacune == null ? '—' : compareA.acteLacune ? 'Oui' : 'Non', b: compareB.acteLacune == null ? '—' : compareB.acteLacune ? 'Oui' : 'Non' },
                  { label: 'Localisation (vue/folio)', a: compareA.actePosition || '—', b: compareB.actePosition || '—' },
                )
              }
              const refRows: Array<{ label: string; key: 'natureRef' | 'supportRef' | 'paginationTypeRef' | 'physicalConditionRef'; table: string }> = [
                { label: 'Nature', key: 'natureRef', table: 'ref_natures' },
                { label: 'Support', key: 'supportRef', table: 'ref_supports' },
                { label: 'Type de pagination', key: 'paginationTypeRef', table: 'ref_pagination_type' },
                { label: 'Condition physique', key: 'physicalConditionRef', table: 'ref_physical_condition' },
              ]
              return (
                <div className="space-y-1">
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-xs pb-1">
                    <div />
                    <div className="font-semibold text-slate-700 truncate">{compareA.coteLocale || 'Exemplaire A'}</div>
                    <div className="font-semibold text-slate-700 truncate">{compareB.coteLocale || 'Exemplaire B'}</div>
                  </div>
                  {textRows.map(r => (
                    <div key={r.label} className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-xs items-start py-1.5 border-t border-slate-100 ${r.a !== r.b ? 'bg-amber-50' : ''}`}>
                      <div className="text-slate-500 font-medium">{r.label}</div>
                      <div className="text-slate-800 break-words">{r.a}</div>
                      <div className="text-slate-800 break-words">{r.b}</div>
                    </div>
                  ))}
                  {refRows.map(r => (
                    <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-xs items-center py-1.5 border-t border-slate-100">
                      <div className="text-slate-500 font-medium">{r.label}</div>
                      <RefSinglePickerSmart table={r.table} mode="view" actionsInvisible value={compareA[r.key]} onChange={() => {}} />
                      <RefSinglePickerSmart table={r.table} mode="view" actionsInvisible value={compareB[r.key]} onChange={() => {}} />
                    </div>
                  ))}
                </div>
              )
            })()}
            <DialogFooter>
              <button onClick={() => setCompareOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Fermer
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteTargetId != null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer cet exemplaire ?</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. {deleteTarget?.coteLocale ? `« ${deleteTarget.coteLocale} »` : 'Cette copie'} sera définitivement supprimée.
                {deleteTarget?.estReference && " C'est actuellement l'exemplaire de référence de ce document."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button onClick={() => setDeleteTargetId(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleDeleteExemplaire} disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition-colors">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Supprimer
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!locked && (
          <div className="flex justify-end border-t border-gray-200 pt-4">
            <button onClick={handleSave} disabled={!dirty || saving}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Enregistrer
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
