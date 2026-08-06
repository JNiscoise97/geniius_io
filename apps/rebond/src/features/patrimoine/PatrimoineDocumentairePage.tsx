import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search, ChevronRight, ChevronDown, FileText, ScrollText,
  MoreHorizontal, CheckCircle2, Clock, AlertCircle, Plus, Filter,
  FolderOpen, Tag, Landmark, Newspaper, ExternalLink, Copy,
  Library, BookOpen, File, X,
  AlertTriangle, Loader2, MonitorCheck, University,
  Lock, LayoutDashboard,
} from 'lucide-react'
import { supabaseRebond } from '@/lib/supabase'
import { toast } from 'sonner'
import { usePatrimoine } from './usePatrimoine'
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart'
import { TriStateButton } from '@/components/shared/TriStateButton'
import { DataTable, type ColumnDef } from '@/components/shared/DataTable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  qualifierSource, decrireDocument, rattacherDocument, fetchRoleDocumentOptions,
} from './patrimoine.service'
import type {
  PatrimoineSource as Source,
  PatrimoineDocument as Document,
  PatrimoineCorpus as Corpus,
  SourceType, SourceStatut, Acces, DocStatut, DocRole, CorpusType,
} from './source.types'

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<SourceType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  'etat-civil': { label: 'État civil', icon: ScrollText, color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  foncier:      { label: 'Foncier',    icon: Landmark,   color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200' },
  annuaire:     { label: 'Annuaire',   icon: Newspaper,  color: 'text-sky-700',    bg: 'bg-sky-50',    border: 'border-sky-200' },
  notarial:     { label: 'Notarial',   icon: FileText,   color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  paroissial:   { label: 'Paroissial', icon: BookOpen,   color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
}

const FIABILITE_CONFIG = {
  haute:   { label: 'Fiabilité haute',   color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  moyenne: { label: 'Fiabilité moyenne', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  basse:   { label: 'Fiabilité basse',   color: 'text-rose-600 bg-rose-50 border-rose-200' },
}

const STATUT_SOURCE_CONFIG: Record<SourceStatut, { label: string; icon: React.ElementType; color: string }> = {
  actif:       { label: 'Actif',       icon: CheckCircle2,  color: 'text-emerald-500' },
  archivé:     { label: 'Archivé',     icon: FolderOpen,    color: 'text-slate-400' },
  incomplet:   { label: 'Incomplet',   icon: AlertCircle,   color: 'text-amber-500' },
  a_qualifier: { label: 'À qualifier', icon: AlertTriangle, color: 'text-orange-500' },
}

const ACCES_CONFIG: Record<Acces, { label: string; color: string }> = {
  physique:  { label: 'Physique',  color: 'text-slate-600 bg-slate-50 border-slate-200' },
  numerique: { label: 'Numérisé', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  en_ligne:  { label: 'En ligne', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
}

const STATUT_DOC_CONFIG: Record<DocStatut, { label: string; color: string; dot: string }> = {
  transcrit:    { label: 'Transcrit',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  en_cours:     { label: 'En cours',     color: 'text-blue-700 bg-blue-50 border-blue-200',          dot: 'bg-blue-400' },
  decrit:       { label: 'Décrit',       color: 'text-gray-500 bg-gray-50 border-gray-200',          dot: 'bg-gray-300' },
  annote:       { label: 'Annoté',       color: 'text-violet-700 bg-violet-50 border-violet-200',    dot: 'bg-violet-500' },
  en_attente:   { label: 'En attente',   color: 'text-orange-700 bg-orange-50 border-orange-200',    dot: 'bg-orange-400' },
}

const ROLE_CONFIG: Record<DocRole, { label: string; color: string }> = {
  ACTE_PRIMAIRE:           { label: 'Acte',                    color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  INSTRUMENT_DE_RECHERCHE: { label: 'Instrument de recherche', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  REGISTRE_COMPILE:        { label: 'Registre',                color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
}

const CORPUS_TYPE_CONFIG: Record<CorpusType, { label: string; color: string; bg: string; border: string }> = {
  genealogique: { label: 'Généalogique', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  patrimonial:  { label: 'Patrimonial',  color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  territorial:  { label: 'Territorial',  color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200' },
  communaute:   { label: 'Communauté',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

const ALL_TABS = ['En attente', 'Sources', 'Documents', 'Exemplaires', 'Plateformes', 'Institutions', 'Corpus'] as const
type Tab = typeof ALL_TABS[number]

// ─── Types référentiels ───────────────────────────────────────────────────────

type PlateformeRow = {
  id: string
  code: string
  label: string
  site_web: string | null
  auth_required: boolean
  kind_label: string | null
}

type InstitutionRow = {
  id: string
  nom: string
  sigle: string | null
  pays: string | null
  commune: string | null
  type_label: string | null
  nb_depots: number
  site_web: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

// ─── SlideOver wrapper ────────────────────────────────────────────────────────

function SlideOver({ open, onClose, title, subtitle, children, footer, wide, maxWidthClassName }: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer: React.ReactNode
  wide?: boolean
  maxWidthClassName?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className={`w-full ${maxWidthClassName ?? (wide ? 'max-w-xl' : 'max-w-md')} bg-white shadow-2xl flex flex-col`}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">{children}</div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-2">{footer}</div>
      </div>
    </div>
  )
}

function IdBadge({ id }: { id: string }) {
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
    toast.success('ID copié dans le presse-papiers')
  }
  return (
    <button type="button" onClick={handleClick} title={id}
      className="font-mono text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 hover:bg-gray-100 hover:text-gray-600 transition-colors inline-flex items-center gap-1 shrink-0">
      <Copy className="w-2.5 h-2.5" />
      {id.slice(0, 8)}
    </button>
  )
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

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
const selectCls = `${inputCls} cursor-pointer`

// ─── Identifier une source (P1.1 step 1) ─────────────────────────────────────


// ─── Qualifier une source (P1.1 step 2) ──────────────────────────────────────

type RoleOption = { id: string; code: string; label: string }

function QualifierSourceSheet({ source, roleOptions, onClose, onDone }: {
  source: Source
  roleOptions: RoleOption[]
  onClose: () => void
  onDone: () => void
}) {
  const [periode, setPeriode] = useState(source.periode === 'non renseigné' ? '' : source.periode)
  const [fiabilite, setFiabilite] = useState<string>(source.niveau_fiabilite ?? '')
  const [roleRef, setRoleRef] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    const { error } = await qualifierSource(source.id, {
      niveau_fiabilite: fiabilite || null,
      role_document_ref: roleRef || null,
      couverture_label: periode || null,
      metadonnees: (source as any)._meta ?? null,
    })
    setSubmitting(false)
    if (!error) onDone()
  }

  return (
    <SlideOver open title="Qualifier la source" subtitle={source.nom} onClose={onClose}
      footer={<>
        <button onClick={onClose} disabled={submitting}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <CheckCircle2 className="w-3.5 h-3.5" />Qualifier
        </button>
      </>}
    >
      <Field label="Période couverte">
        <input value={periode} onChange={e => setPeriode(e.target.value)}
          placeholder="ex. 1860 – 1920" className={inputCls} autoFocus />
      </Field>
      <Field label="Niveau de fiabilité">
        <div className="flex gap-2">
          {(['haute', 'moyenne', 'basse'] as const).map(f => (
            <button key={f} onClick={() => setFiabilite(fiabilite === f ? '' : f)}
              className={`flex-1 rounded-xl border py-2 text-xs font-medium capitalize transition-colors ${
                fiabilite === f
                  ? f === 'haute' ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : f === 'moyenne' ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Rôle du document">
        <select value={roleRef} onChange={e => setRoleRef(e.target.value)} className={selectCls}>
          <option value="">À préciser</option>
          {roleOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </Field>
    </SlideOver>
  )
}

// ─── Décrire un document (P1.2 step 2) ───────────────────────────────────────

// ── JSONB pack/unpack pour citations.marginalia / citations.writing ──────────

function unpackMarginalia(mar: Record<string, any> | null) {
  const present = mar?.present ?? {}
  const count = mar?.count ?? {}
  return {
    signatures_present: present.signatures ?? null,
    signatures_count: count.signatures ?? null,
    marginal_mentions_present: present.marginal_mentions ?? null,
    marginal_mentions_count: count.marginal_mentions ?? null,
    marginal_crossouts_present: present.marginal_crossouts ?? null,
    marginal_crossouts_count: count.marginal_crossouts ?? null,
  }
}

function packMarginalia(c: {
  signatures_present: boolean | null; signatures_count: number | null
  marginal_mentions_present: boolean | null; marginal_mentions_count: number | null
  marginal_crossouts_present: boolean | null; marginal_crossouts_count: number | null
}): Record<string, any> {
  return {
    present: {
      signatures: c.signatures_present,
      marginal_mentions: c.marginal_mentions_present,
      marginal_crossouts: c.marginal_crossouts_present,
    },
    count: {
      signatures: c.signatures_present === true ? c.signatures_count : null,
      marginal_mentions: c.marginal_mentions_present === true ? c.marginal_mentions_count : null,
      marginal_crossouts: c.marginal_crossouts_present === true ? c.marginal_crossouts_count : null,
    },
  }
}

function unpackWriting(wr: Record<string, any> | null) {
  return {
    ecriture_ref: wr?.ecriture_ref ?? null,
    handwriting_legibility_ref: wr?.legibility_ref ?? null,
    damage_notes: wr?.damage_notes ?? '',
    repro_notes: wr?.repro_notes ?? '',
  }
}

function packWriting(c: {
  ecriture_ref: string | null; handwriting_legibility_ref: string | null
  damage_notes: string; repro_notes: string
}): Record<string, any> {
  const wr: Record<string, any> = {}
  if (c.ecriture_ref) wr.ecriture_ref = c.ecriture_ref
  if (c.handwriting_legibility_ref) wr.legibility_ref = c.handwriting_legibility_ref
  if (c.damage_notes.trim()) wr.damage_notes = c.damage_notes.trim()
  if (c.repro_notes.trim()) wr.repro_notes = c.repro_notes.trim()
  return wr
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

function DecrireDocumentSheet({ doc, roleOptions, onClose, onDone }: {
  doc: Document
  roleOptions: RoleOption[]
  onClose: () => void
  onDone: () => void
}) {
  const [typeUniteRef,       setTypeUniteRef]       = useState<string | null>(null)
  const [roleRef,            setRoleRef]            = useState('')
  const [langueRef,          setLangueRef]          = useState<string | null>(null)
  const [periode,            setPeriode]            = useState(doc.date_document ?? '')
  const [identifiantInterne, setIdentifiantInterne] = useState('')
  const [description,        setDescription]        = useState('')
  const [niveauFiabilite,    setNiveauFiabilite]    = useState<'haute' | 'moyenne' | 'basse' | null>(null)
  const [note,               setNote]               = useState(doc.note ?? '')
  const [submitting,         setSubmitting]         = useState(false)

  // Exemplaire (forme physique/numérique de cette copie) — ref_exemplaires
  const [exemplaireId,         setExemplaireId]         = useState<string | null>(null)
  const [natureRef,            setNatureRef]            = useState<string | null>(null)
  const [supportRef,           setSupportRef]           = useState<string | null>(null)
  const [paginationTypeRef,    setPaginationTypeRef]    = useState<string | null>(null)
  const [nbPages,               setNbPages]              = useState('')
  const [conditionnement,      setConditionnement]      = useState('')
  const [physicalConditionRef, setPhysicalConditionRef] = useState<string | null>(null)

  // Statut, localisation & observations de la citation (uniquement pertinent pour un acte) —
  // même donnée que le "formulaire complet" de l'atelier de transcription (/ec-acte/edit).
  const [citationId,      setCitationId]      = useState<string | null>(null)
  const [acteIsMissing,   setActeIsMissing]   = useState<boolean | null>(null)
  const [acteLacune,      setActeLacune]      = useState<boolean | null>(null)
  const [acteLacuneNote,  setActeLacuneNote]  = useState('')
  const [actePosition,    setActePosition]    = useState('')
  const [reproQualityRef, setReproQualityRef] = useState<string | null>(null)
  const [marks,           setMarks]           = useState('')
  const [citationNote,    setCitationNote]    = useState('')
  const [ecritureRef,               setEcritureRef]               = useState<string | null>(null)
  const [handwritingLegibilityRef,  setHandwritingLegibilityRef]  = useState<string | null>(null)
  const [damageNotes,               setDamageNotes]               = useState('')
  const [reproNotes,                setReproNotes]                = useState('')
  const [signaturesPresent,          setSignaturesPresent]          = useState<boolean | null>(null)
  const [signaturesCount,            setSignaturesCount]            = useState<number | null>(null)
  const [marginalMentionsPresent,    setMarginalMentionsPresent]    = useState<boolean | null>(null)
  const [marginalMentionsCount,      setMarginalMentionsCount]      = useState<number | null>(null)
  const [marginalCrossoutsPresent,   setMarginalCrossoutsPresent]   = useState<boolean | null>(null)
  const [marginalCrossoutsCount,     setMarginalCrossoutsCount]     = useState<number | null>(null)
  const [loadingActeInfo, setLoadingActeInfo] = useState(true)
  const [acteFormVariant, setActeFormVariant] = useState<'short' | 'full'>('short')

  // Hiérarchie parent/enfant — purement informatif, lecture seule.
  const [ancestors, setAncestors] = useState<Array<{ id: string; titre: string }>>([])
  const [children,  setChildren]  = useState<Array<{ id: string; titre: string }>>([])

  useEffect(() => {
    let cancelled = false
    async function loadHierarchy() {
      const chain: Array<{ id: string; titre: string }> = []
      let currentId: string | null = doc.source_id
      for (let i = 0; i < 6 && currentId; i++) {
        const { data } = await supabaseRebond.from('unites_documentaires')
          .select('id, titre, parent_ud_id').eq('id', currentId).maybeSingle()
        if (!data) break
        chain.push({ id: data.id, titre: data.titre })
        currentId = data.parent_ud_id
      }
      if (!cancelled) setAncestors(chain.reverse())

      const { data: kids } = await supabaseRebond.from('unites_documentaires')
        .select('id, titre').eq('parent_ud_id', doc.id).order('titre')
      if (!cancelled) setChildren(kids ?? [])
    }
    loadHierarchy()
    return () => { cancelled = true }
  }, [doc.id])

  const isActe = roleOptions.find(o => o.id === roleRef)?.code === 'ACTE_PRIMAIRE'
  const isTable = roleOptions.find(o => o.id === roleRef)?.code === 'INSTRUMENT_DE_RECHERCHE'
  const showStatutSection = isActe || isTable

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingActeInfo(true)
      const { data: ex } = await supabaseRebond.from('exemplaires')
        .select('id, nature_ref, support_ref, pagination_type_ref, nb_pages, conditionnement, physical_condition_ref, description')
        .eq('unite_documentaire_id', doc.id).limit(1).maybeSingle()
      if (cancelled) return
      if (!ex?.id) { setLoadingActeInfo(false); return }
      setExemplaireId(ex.id)
      setNatureRef(ex.nature_ref ?? null)
      setSupportRef(ex.support_ref ?? null)
      setPaginationTypeRef(ex.pagination_type_ref ?? null)
      setNbPages(ex.nb_pages != null ? String(ex.nb_pages) : '')
      setConditionnement(ex.conditionnement ?? '')
      setPhysicalConditionRef(ex.physical_condition_ref ?? null)
      setDescription(ex.description ?? '')

      // Une citation ec_acte ou ec_table (selon le rôle du document) — jamais les deux à la fois.
      const { data: cit } = await supabaseRebond.from('citations')
        .select('id, target_type, is_missing, lacune, lacune_note, locating, repro_quality_ref, marks, marginalia, writing, note')
        .eq('exemplaire_id', ex.id).in('target_type', ['ec_acte', 'ec_table']).maybeSingle()
      if (cancelled) return
      if (cit) {
        setCitationId(cit.id)
        setActeIsMissing(cit.is_missing ?? null)
        setActeLacune(cit.lacune ?? null)
        setActeLacuneNote(cit.lacune_note ?? '')
        const raw = (cit.locating as any)?.systems?.[0]?.raw
        setActePosition(typeof raw === 'string' ? raw : '')
        setReproQualityRef(cit.repro_quality_ref ?? null)
        setMarks(cit.marks ?? '')
        setCitationNote(cit.note ?? '')
        const wr = unpackWriting(cit.writing ?? null)
        setEcritureRef(wr.ecriture_ref)
        setHandwritingLegibilityRef(wr.handwriting_legibility_ref)
        setDamageNotes(wr.damage_notes)
        setReproNotes(wr.repro_notes)
        const mar = unpackMarginalia(cit.marginalia ?? null)
        setSignaturesPresent(mar.signatures_present)
        setSignaturesCount(mar.signatures_count)
        setMarginalMentionsPresent(mar.marginal_mentions_present)
        setMarginalMentionsCount(mar.marginal_mentions_count)
        setMarginalCrossoutsPresent(mar.marginal_crossouts_present)
        setMarginalCrossoutsCount(mar.marginal_crossouts_count)
      }
      setLoadingActeInfo(false)
    }
    load()
    return () => { cancelled = true }
  }, [doc.id])

  // Auto-complétion quand le rôle choisi est "Acte primaire" : type d'unité = Pièce.
  // Ne joue que si le champ n'a pas déjà été renseigné.
  useEffect(() => {
    if (!isActe || typeUniteRef) return
    let cancelled = false
    supabaseRebond.from('ref_type_unite').select('id').eq('code', 'piece').maybeSingle()
      .then(({ data }) => { if (!cancelled && data?.id) setTypeUniteRef(data.id) })
    return () => { cancelled = true }
  }, [isActe, typeUniteRef])

  // Auto-complétion de la couverture temporelle dès qu'un rôle est choisi (peu importe lequel) :
  // on remonte la chaîne parent_ud_id jusqu'au registre racine et on reprend son couverture_label.
  // Ne joue que si le champ n'a pas déjà été renseigné.
  useEffect(() => {
    if (!roleRef || periode.trim()) return
    let cancelled = false
    ;(async () => {
      let currentId: string | null = doc.source_id
      let lastCouverture: string | null = null
      for (let i = 0; i < 5 && currentId; i++) {
        const { data } = await supabaseRebond.from('unites_documentaires')
          .select('parent_ud_id, couverture_label').eq('id', currentId).maybeSingle()
        if (!data) break
        lastCouverture = data.couverture_label
        currentId = data.parent_ud_id
      }
      if (!cancelled && lastCouverture) setPeriode(lastCouverture)
    })()
    return () => { cancelled = true }
  }, [roleRef])

  const acteFormComplete = !showStatutSection || (
    acteIsMissing !== null && (acteIsMissing === true || actePosition.trim().length > 0)
  )

  const canSubmit = !!typeUniteRef && !!roleRef && periode.trim().length > 0 && acteFormComplete && !submitting

  function toIntOrNull(v: string): number | null {
    const s = v.trim()
    if (!s || !/^\d+$/.test(s)) return null
    return Number(s)
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    const meta: Record<string, unknown> = {}
    if (note.trim()) meta.note = note.trim()

    const { error } = await decrireDocument(doc.id, {
      type_unite_ref: typeUniteRef,
      role_document_ref: roleRef || null,
      langue_ref: langueRef,
      couverture_label: periode || null,
      identifiant_interne: identifiantInterne.trim() || null,
      niveau_fiabilite: niveauFiabilite,
      metadonnees: Object.keys(meta).length ? meta : null,
    })

    if (!error && exemplaireId) {
      await supabaseRebond.from('exemplaires').update({
        nature_ref: natureRef,
        support_ref: supportRef,
        pagination_type_ref: paginationTypeRef,
        nb_pages: toIntOrNull(nbPages),
        conditionnement: conditionnement.trim() || null,
        physical_condition_ref: physicalConditionRef,
        description: description.trim() || null,
      }).eq('id', exemplaireId)
    }

    if (!error && showStatutSection && citationId) {
      await supabaseRebond.from('citations').update({
        is_missing: acteIsMissing,
        lacune: acteLacune,
        lacune_note: acteLacune ? (acteLacuneNote.trim() || null) : null,
        locating: acteIsMissing ? {} : { systems: [{ raw: actePosition.trim() }] },
        repro_quality_ref: reproQualityRef,
        marks: marks.trim() || null,
        note: citationNote.trim() || null,
        writing: packWriting({
          ecriture_ref: ecritureRef,
          handwriting_legibility_ref: handwritingLegibilityRef,
          damage_notes: damageNotes,
          repro_notes: reproNotes,
        }),
        marginalia: packMarginalia({
          signatures_present: signaturesPresent,
          signatures_count: signaturesCount,
          marginal_mentions_present: marginalMentionsPresent,
          marginal_mentions_count: marginalMentionsCount,
          marginal_crossouts_present: marginalCrossoutsPresent,
          marginal_crossouts_count: marginalCrossoutsCount,
        }),
      }).eq('id', citationId)
    }

    setSubmitting(false)
    if (!error) onDone()
  }

  return (
    <SlideOver open title="Décrire le document" subtitle={doc.titre} onClose={onClose}
      maxWidthClassName="max-w-4xl"
      footer={<>
        <button onClick={onClose} disabled={submitting}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <CheckCircle2 className="w-3.5 h-3.5" />Marquer comme décrit
        </button>
      </>}
    >
      <p className="text-xs text-gray-500 -mt-1">
        Décris uniquement ce que tu observes de l'objet — sa forme, sa langue, la période qu'il couvre.
        Le contenu (actes, mentions…) se transcrit plus tard, dans l'atelier documentaire.
      </p>

      {(ancestors.length > 0 || children.length > 0) && (
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
                <span className="font-medium text-indigo-700">{doc.titre} (ce document)</span>
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

      <SectionCard title="Identification" subtitle="Nature intellectuelle du document et informations générales.">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Rôle" required>
            <select value={roleRef} onChange={e => setRoleRef(e.target.value)} className={selectCls} autoFocus>
              <option value="">À préciser</option>
              {roleOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>

          <Field label="Type d'unité" required>
            <RefSinglePickerSmart
              table="ref_type_unite" mode="edit" actionsInvisible={false}
              value={typeUniteRef}
              onChange={next => setTypeUniteRef(next ? String(next) : null)}
            />
          </Field>

          <Field label="Couverture temporelle" required>
            <input value={periode} onChange={e => setPeriode(e.target.value)}
              placeholder="ex. 1889 ou 1880–1920" className={inputCls} />
          </Field>

          <Field label="Langue">
            <RefSinglePickerSmart
              table="ref_langues" mode="edit" actionsInvisible={false}
              value={langueRef}
              onChange={next => setLangueRef(next ? String(next) : null)}
            />
          </Field>

          <Field label="Identifiant interne">
            <input value={identifiantInterne} onChange={e => setIdentifiantInterne(e.target.value)}
              placeholder="ex. DOC-2026-0147 (référence interne, pas la cote d'archives)" className={`${inputCls} font-mono`} />
          </Field>

          <Field label="Note">
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Observations sur ce document…" className={inputCls} />
          </Field>
        </div>

        <Field label="Fiabilité">
          <div className="flex gap-2">
            {(['haute', 'moyenne', 'basse'] as const).map(niveau => (
              <button key={niveau} type="button"
                onClick={() => setNiveauFiabilite(niveauFiabilite === niveau ? null : niveau)}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  niveauFiabilite === niveau ? FIABILITE_CONFIG[niveau].color : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {FIABILITE_CONFIG[niveau].label}
              </button>
            ))}
          </div>
        </Field>
      </SectionCard>

      {!loadingActeInfo && exemplaireId && (
        <SectionCard title="Exemplaire" subtitle="La forme physique ou numérique de cette copie précise.">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nature">
              <RefSinglePickerSmart
                table="ref_natures" mode="edit" actionsInvisible={false}
                value={natureRef}
                onChange={next => setNatureRef(next ? String(next) : null)}
              />
            </Field>

            <Field label="Support">
              <RefSinglePickerSmart
                table="ref_supports" mode="edit" actionsInvisible={false}
                value={supportRef}
                onChange={next => setSupportRef(next ? String(next) : null)}
              />
            </Field>

            <Field label="Type de pagination">
              <RefSinglePickerSmart
                table="ref_pagination_type" mode="edit" actionsInvisible={false}
                value={paginationTypeRef}
                onChange={next => setPaginationTypeRef(next ? String(next) : null)}
              />
            </Field>

            {!isActe && (
              <>
                <Field label="Nombre de pages">
                  <input value={nbPages} onChange={e => setNbPages(e.target.value)} inputMode="numeric"
                    placeholder="ex. 250" className={inputCls} />
                </Field>

                <Field label="Conditionnement">
                  <input value={conditionnement} onChange={e => setConditionnement(e.target.value)}
                    placeholder="Contenant de rangement : ex. boîte d'archives n°12, chemise cartonnée…" className={inputCls} />
                </Field>
              </>
            )}

            <Field label="Condition physique">
              <RefSinglePickerSmart
                table="ref_physical_condition" mode="edit" actionsInvisible={false}
                value={physicalConditionRef}
                onChange={next => setPhysicalConditionRef(next ? String(next) : null)}
              />
            </Field>
          </div>

          <Field label="Description physique">
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Apparence de cet exemplaire : reliure, nombre de folios, page de titre…" className={`${inputCls} min-h-[70px] resize-none`} />
          </Field>
        </SectionCard>
      )}

      {showStatutSection && !loadingActeInfo && exemplaireId && (() => {
        const statutEtLocalisation = (
          <>
            <p className="text-xs text-slate-600">
              <strong className="text-slate-800">Document manquant</strong> : ce document n'existe pas du tout à cet endroit (page absente, jamais transcrit ici). <strong className="text-slate-800">Lacune</strong> : le document est bien présent, mais une partie est illisible, endommagée ou incomplète.
            </p>
            <div className="space-y-3">
              <TriStateButton
                label="Document manquant *"
                yesLabel="Oui"
                noLabel="Non"
                mode="edit"
                value={acteIsMissing}
                onChange={v => setActeIsMissing(v ?? null)}
              />
              <TriStateButton
                label="Lacune"
                yesLabel="Oui"
                noLabel="Non"
                mode="edit"
                value={acteLacune}
                onChange={v => setActeLacune(v ?? null)}
              />
            </div>
            {acteIsMissing === true ? (
              <p className="text-xs text-amber-600">Document déclaré manquant — la localisation n'est pas requise.</p>
            ) : (
              <Field label="Localisation (vue / folio)" required>
                <input value={actePosition} onChange={e => setActePosition(e.target.value)}
                  placeholder="Ex. vue 23 ; f°12r" className={inputCls} />
              </Field>
            )}
            {acteLacune === true && (
              <Field label="Détail lacune">
                <textarea value={acteLacuneNote} onChange={e => setActeLacuneNote(e.target.value)}
                  placeholder="Ex. vues 120–140 absentes…" className={`${inputCls} min-h-[60px] resize-none`} />
              </Field>
            )}
          </>
        )

        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Statut & localisation {isActe ? "de l'acte" : 'de la table'}
            </p>

            <Tabs value={acteFormVariant} onValueChange={v => setActeFormVariant(v as 'short' | 'full')}>
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
                        <RefSinglePickerSmart
                          table="ref_repro_quality" mode="edit" actionsInvisible={false}
                          value={reproQualityRef}
                          onChange={next => setReproQualityRef(next ? String(next) : null)}
                        />
                      </Field>
                      <Field label="Marques particulières">
                        <input value={marks} onChange={e => setMarks(e.target.value)}
                          placeholder="Ex. tampon, cachet, sceau… (hors mentions marginales, voir plus bas)" className={inputCls} />
                      </Field>
                    </div>
                    <div className="mt-4 space-y-4">
                      <Field label="Notes sur la reproduction">
                        <textarea value={reproNotes} onChange={e => setReproNotes(e.target.value)}
                          placeholder="Ex. scan flou, contraste insuffisant…" className={`${inputCls} min-h-[60px] resize-none`} />
                      </Field>
                      <Field label="Notes sur les dommages">
                        <textarea value={damageNotes} onChange={e => setDamageNotes(e.target.value)}
                          placeholder="Ex. coin déchiré, encre passée, taches d'humidité…" className={`${inputCls} min-h-[60px] resize-none`} />
                      </Field>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-semibold text-slate-900">Écriture & lisibilité</div>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <Field label="Écriture">
                        <RefSinglePickerSmart
                          table="ref_ecritures" mode="edit" actionsInvisible={false}
                          value={ecritureRef}
                          onChange={next => setEcritureRef(next ? String(next) : null)}
                        />
                      </Field>
                      <Field label="Lisibilité">
                        <RefSinglePickerSmart
                          table="ref_handwriting_legibility" mode="edit" actionsInvisible={false}
                          value={handwritingLegibilityRef}
                          onChange={next => setHandwritingLegibilityRef(next ? String(next) : null)}
                        />
                      </Field>
                    </div>
                  </div>

                  {isActe && (
                    <>
                      <Separator />

                      <div>
                        <div className="text-sm font-semibold text-slate-900">Marques & signes</div>
                        <div className="mt-3 space-y-3">
                          <TriStateButton label="Signatures" yesLabel="Présentes" noLabel="Absentes" mode="edit"
                            value={signaturesPresent} onChange={v => setSignaturesPresent(v ?? null)} />
                          {signaturesPresent === true && (
                            <Field label="Nombre de signatures">
                              <input value={signaturesCount ?? ''} onChange={e => setSignaturesCount(toIntOrNull(e.target.value))}
                                inputMode="numeric" className={inputCls} />
                            </Field>
                          )}

                          <TriStateButton label="Mentions marginales" yesLabel="Présentes" noLabel="Absentes" mode="edit"
                            value={marginalMentionsPresent} onChange={v => setMarginalMentionsPresent(v ?? null)} />
                          {marginalMentionsPresent === true && (
                            <Field label="Nombre de mentions marginales">
                              <input value={marginalMentionsCount ?? ''} onChange={e => setMarginalMentionsCount(toIntOrNull(e.target.value))}
                                inputMode="numeric" className={inputCls} />
                            </Field>
                          )}

                          <TriStateButton label="Ratures marginales" yesLabel="Présentes" noLabel="Absentes" mode="edit"
                            value={marginalCrossoutsPresent} onChange={v => setMarginalCrossoutsPresent(v ?? null)} />
                          {marginalCrossoutsPresent === true && (
                            <Field label="Nombre de ratures marginales">
                              <input value={marginalCrossoutsCount ?? ''} onChange={e => setMarginalCrossoutsCount(toIntOrNull(e.target.value))}
                                inputMode="numeric" className={inputCls} />
                            </Field>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </SectionCard>

                <Field label="Note sur cette citation">
                  <input value={citationNote} onChange={e => setCitationNote(e.target.value)}
                    placeholder="Observations propres à cette occurrence…" className={inputCls} />
                </Field>
              </TabsContent>
            </Tabs>
          </div>
        )
      })()}
    </SlideOver>
  )
}

// ─── Rattacher un document (P1.2 step 3) ─────────────────────────────────────

function RattacherDocumentSheet({ doc, sources, onClose, onDone }: {
  doc: Document
  sources: Source[]
  onClose: () => void
  onDone: () => void
}) {
  const [parentId, setParentId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const activeSources = sources.filter(s => s.statut !== 'a_qualifier')

  async function handleSubmit() {
    if (!parentId) return
    setSubmitting(true)
    const { error } = await rattacherDocument(doc.id, parentId)
    setSubmitting(false)
    if (!error) onDone()
  }

  return (
    <SlideOver open title="Rattacher à une source" subtitle={doc.titre} onClose={onClose}
      footer={<>
        <button onClick={onClose} disabled={submitting}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={!parentId || submitting}
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <CheckCircle2 className="w-3.5 h-3.5" />Rattacher
        </button>
      </>}
    >
      <p className="text-xs text-gray-500">
        Sélectionnez la source dans laquelle ce document a été trouvé ou auquel il appartient.
      </p>
      <Field label="Source parente" required>
        <select value={parentId} onChange={e => setParentId(e.target.value)} className={selectCls} autoFocus>
          <option value="">Sélectionner une source…</option>
          {activeSources.map(s => {
            const t = TYPE_CONFIG[s.type]
            return <option key={s.id} value={s.id}>[{t.label}] {s.nom}</option>
          })}
        </select>
      </Field>
      {parentId && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500">
          Après rattachement, le document passera dans <strong>Documents à décrire</strong>.
        </div>
      )}
    </SlideOver>
  )
}

// ─── Source card ──────────────────────────────────────────────────────────────

function SourceCard({ source }: { source: Source }) {
  const type = TYPE_CONFIG[source.type]
  const TypeIcon = type.icon
  const fiabilite = source.niveau_fiabilite ? FIABILITE_CONFIG[source.niveau_fiabilite] : null
  const statut = STATUT_SOURCE_CONFIG[source.statut]
  const StatutIcon = statut.icon
  const acces = ACCES_CONFIG[source.acces]
  const progress = pct(source.transcris, source.total_documents)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all group cursor-pointer">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl border ${type.bg} ${type.border} flex items-center justify-center shrink-0 mt-0.5`}>
          <TypeIcon className={`w-5 h-5 ${type.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                {source.nom}
              </h3>
              <span className={`text-xs font-medium rounded border px-2 py-0.5 ${type.bg} ${type.color} ${type.border}`}>
                {type.label}
              </span>
            </div>
            <button className="p-1 rounded text-gray-300 hover:text-gray-500 transition-colors shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5 mb-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-gray-400 shrink-0 w-24">Conservation</span>
              <span className="text-xs text-gray-600">{source.institution_conservation}</span>
              {source.localisation && <span className="text-xs text-gray-400">— {source.localisation}</span>}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5">
              {source.periode}
            </span>
            {fiabilite && (
              <span className={`text-xs font-medium rounded-full border px-2.5 py-0.5 ${fiabilite.color}`}>
                {fiabilite.label}
              </span>
            )}
            <span className={`text-xs font-medium rounded-full border px-2.5 py-0.5 ${acces.color}`}>
              {acces.label}
            </span>
            {source.url && (
              <a href={source.url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
                <ExternalLink className="w-3 h-3" />Accès en ligne
              </a>
            )}
            {source.copies_connues > 0 && (
              <span className="text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                <Copy className="w-3 h-3" />
                {source.copies_connues} autre{source.copies_connues > 1 ? 's' : ''} exemplaire{source.copies_connues > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{progress}% transcrit</span>
              <span className="text-xs text-gray-400">{source.transcris}/{source.total_documents} docs</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden flex">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct(source.transcris, source.total_documents)}%` }} />
              <div className="h-full bg-indigo-200" style={{ width: `${pct(source.en_cours, source.total_documents)}%` }} />
            </div>
          </div>
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
            <Clock className="w-3 h-3" />{source.derniere_activite}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {source.en_cours > 0
            ? `${source.en_cours} transcription${source.en_cours > 1 ? 's' : ''} en cours`
            : source.a_traiter > 0
              ? `${source.a_traiter} document${source.a_traiter > 1 ? 's' : ''} non traité${source.a_traiter > 1 ? 's' : ''}`
              : 'Entièrement transcrit'}
        </div>
        <button className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
          Voir les documents <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Corpus card ──────────────────────────────────────────────────────────────

function CorpusCard({ corpus, sources }: { corpus: Corpus; sources: Source[] }) {
  const typeConf = CORPUS_TYPE_CONFIG[corpus.type]
  const corpusSources = corpus.source_ids.map(id => sources.find(s => s.id === id)).filter(Boolean) as Source[]
  const progress = pct(corpus.transcris, corpus.total_documents)
  const restants = corpus.total_documents - corpus.transcris

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors cursor-pointer">
          {corpus.nom}
        </h3>
        <span className={`text-xs font-medium rounded border px-2 py-0.5 shrink-0 ${typeConf.color} ${typeConf.bg} ${typeConf.border}`}>
          {typeConf.label}
        </span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-4">{corpus.description}</p>

      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <Tag className="w-3 h-3 text-gray-300 shrink-0" />
        {corpusSources.map(s => {
          const t = TYPE_CONFIG[s.type]
          return (
            <span key={s.id} className={`text-xs rounded-full border px-2 py-0.5 ${t.color} ${t.bg} ${t.border}`}>
              {s.institution_conservation.split('(')[0].trim()}
            </span>
          )
        })}
        {corpusSources.length === 0 && (
          <span className="text-xs text-gray-300 italic">aucune source liée</span>
        )}
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{progress}% transcrit</span>
          <span className="text-xs text-gray-400">{corpus.transcris}/{corpus.total_documents} docs</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">Créé le {corpus.cree_le}</span>
        <div className="flex items-center gap-2">
          {restants > 0 && (
            <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">
              Contribuer
              <span className="bg-indigo-500 text-white rounded px-1.5 py-0.5 text-[10px]">
                {restants} à faire
              </span>
            </button>
          )}
          {restants === 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />Complet
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── En attente tab ───────────────────────────────────────────────────────────

function EnAttenteTab({
  sourcesAQualifier,
  docsARattacher,
  docsADecrire,
  sources,
  onQualifier,
  onRattacher,
  onDecrire,
}: {
  sourcesAQualifier: Source[]
  docsARattacher: Document[]
  docsADecrire: Document[]
  sources: Source[]
  onQualifier: (source: Source) => void
  onRattacher: (doc: Document) => void
  onDecrire: (doc: Document) => void
}) {
  return (
    <div className="space-y-6">

      {sourcesAQualifier.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-800">Sources à qualifier</h2>
            <span className="text-xs font-medium bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">
              {sourcesAQualifier.length}
            </span>
          </div>
          <div className="space-y-2">
            {sourcesAQualifier.map(source => {
              const type = TYPE_CONFIG[source.type]
              const TypeIcon = type.icon
              const manquants = [
                !source.niveau_fiabilite && 'fiabilité',
              ].filter((x): x is string => typeof x === 'string')
              return (
                <div key={source.id} className="bg-white rounded-xl border border-orange-100 p-4 flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-lg border ${type.bg} ${type.border} flex items-center justify-center shrink-0`}>
                    <TypeIcon className={`w-4 h-4 ${type.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-0.5">{source.nom}</p>
                    <p className="text-xs text-gray-500">{source.institution_conservation}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {manquants.map(m => (
                        <span key={m} className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
                          {m} manquant
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => onQualifier(source)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 transition-colors">
                    Qualifier <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {docsARattacher.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-800">Documents à rattacher à une source</h2>
            <span className="text-xs font-medium bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">
              {docsARattacher.length}
            </span>
          </div>
          <div className="space-y-2">
            {docsARattacher.map(doc => (
              <div key={doc.id} className="bg-white rounded-xl border border-orange-100 p-4 flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg border bg-gray-50 border-gray-200 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900">{doc.titre}</p>
                    <IdBadge id={doc.id} />
                  </div>
                  {doc.date_document && <p className="text-xs text-gray-500">{doc.date_document}</p>}
                  {doc.note && <p className="text-xs text-gray-400 italic mt-1">{doc.note}</p>}
                </div>
                <button onClick={() => onRattacher(doc)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 transition-colors">
                  Rattacher <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {docsADecrire.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-800">Documents à décrire</h2>
            <span className="text-xs font-medium bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">
              {docsADecrire.length}
            </span>
          </div>
          <div className="space-y-2">
            {docsADecrire.map(doc => {
              const source = doc.source_id ? sources.find(s => s.id === doc.source_id) : null
              return (
                <div key={doc.id} className="bg-white rounded-xl border border-orange-100 p-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg border bg-gray-50 border-gray-200 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900">{doc.titre}</p>
                      <IdBadge id={doc.id} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="font-mono">{doc.cote}</span>
                      {source && <><span className="text-gray-200">·</span><span>{source.institution_conservation}</span></>}
                    </div>
                    {doc.note && <p className="text-xs text-gray-400 italic mt-1">{doc.note}</p>}
                  </div>
                  <button onClick={() => onDecrire(doc)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 transition-colors">
                    Décrire <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Create Plateforme Sheet ──────────────────────────────────────────────────

type KindOption = { id: string; label: string; description: string | null; categorie: string | null }

function SearchableKindSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: KindOption[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) { setOpen(false); setQuery('') }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const openDropdown = () => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setDropRect({ top: r.bottom + 4, left: r.left, width: r.width })
    setOpen(v => !v)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const filtered = options.filter(o => {
    const q = query.toLowerCase()
    return !q || o.label.toLowerCase().includes(q) || (o.description ?? '').toLowerCase().includes(q) || (o.categorie ?? '').toLowerCase().includes(q)
  })

  const grouped = filtered.reduce<Record<string, KindOption[]>>((acc, o) => {
    const cat = o.categorie ?? '—'
    ;(acc[cat] ??= []).push(o)
    return acc
  }, {})

  const selected = options.find(o => o.id === value)

  return (
    <div>
      <button ref={btnRef} type="button" onClick={openDropdown}
        className={`${inputCls} flex items-center justify-between gap-2 text-left`}>
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.label : 'À préciser'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </button>
      {open && dropRect && (
        <div ref={dropRef}
          style={{ position: 'fixed', top: dropRect.top, left: dropRect.left, width: dropRect.width }}
          className="rounded-xl border border-gray-200 bg-white shadow-xl z-[60] overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <button type="button" onClick={() => { onChange(''); setOpen(false); setQuery('') }}
              className="w-full px-3 py-2 text-sm text-left text-gray-400 italic hover:bg-gray-50 transition-colors">
              À préciser
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">Aucun résultat</p>
            ) : Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{cat}</span>
                </div>
                {items.map(o => (
                  <button key={o.id} type="button"
                    onClick={() => { onChange(o.id); setOpen(false); setQuery('') }}
                    className={`w-full px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${o.id === value ? 'bg-indigo-50' : ''}`}>
                    <div className="text-sm font-medium text-gray-900">{o.label}</div>
                    {o.description && (
                      <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{o.description}</div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CreatePlateformeSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [label, setLabel] = useState('')
  const [code, setCode] = useState('')
  const [siteWeb, setSiteWeb] = useState('')
  const [authRequired, setAuthRequired] = useState(false)
  const [kindRef, setKindRef] = useState('')
  const [kindOptions, setKindOptions] = useState<KindOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabaseRebond.from('ref_plateforme_kind').select('id, label, description, categorie').order('categorie, label').then(({ data }) => {
      if (data) setKindOptions(data.map((r: any) => ({ id: r.id, label: r.label, description: r.description ?? null, categorie: r.categorie ?? null })))
    })
  }, [])

  async function handleSubmit() {
    if (!label.trim() || !code.trim()) return
    setSubmitting(true); setError(null)
    const { error: err } = await supabaseRebond.from('ref_plateformes').insert({
      label: label.trim(),
      code: code.trim().toUpperCase(),
      site_web: siteWeb.trim() || null,
      auth_required: authRequired,
      plateforme_kind_ref: kindRef || null,
    })
    setSubmitting(false)
    if (err) { setError(err.message); return }
    toast.success('Plateforme créée')
    onDone()
  }

  return (
    <SlideOver open wide title="Nouvelle plateforme" onClose={onClose}
      footer={<>
        <button onClick={onClose} disabled={submitting}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={submitting || !label.trim() || !code.trim()}
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <CheckCircle2 className="w-3.5 h-3.5" />Créer
        </button>
      </>}
    >
      <Field label="Libellé" required>
        <input value={label} onChange={e => setLabel(e.target.value)} autoFocus
          placeholder="ex. Généanet" className={inputCls} />
      </Field>
      <Field label="Code" required>
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="ex. GENEANET" className={`${inputCls} font-mono`} />
      </Field>
      <Field label="Type">
        <SearchableKindSelect value={kindRef} onChange={setKindRef} options={kindOptions} />
      </Field>
      <Field label="Site web">
        <input value={siteWeb} onChange={e => setSiteWeb(e.target.value)}
          placeholder="https://…" className={inputCls} type="url" />
      </Field>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input type="checkbox" checked={authRequired} onChange={e => setAuthRequired(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <span className="text-sm text-gray-700">Authentification requise</span>
      </label>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}
    </SlideOver>
  )
}

// ─── Create Institution Sheet ─────────────────────────────────────────────────

function CreateInstitutionSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [nom, setNom] = useState('')
  const [sigle, setSigle] = useState('')
  const [typeRef, setTypeRef] = useState('')
  const [pays, setPays] = useState('')
  const [region, setRegion] = useState('')
  const [departement, setDepartement] = useState('')
  const [commune, setCommune] = useState('')
  const [siteWeb, setSiteWeb] = useState('')
  const [note, setNote] = useState('')
  const [typeOptions, setTypeOptions] = useState<Array<{ id: string; label: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabaseRebond.from('ref_institution_type').select('id, label').order('label').then(({ data }) => {
      if (data) setTypeOptions(data as Array<{ id: string; label: string }>)
    })
  }, [])

  async function handleSubmit() {
    if (!nom.trim() || !typeRef) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabaseRebond.from('ref_institutions').insert({
      nom: nom.trim(),
      sigle: sigle.trim() || null,
      type_institution_ref: typeRef,
      pays: pays.trim() || null,
      region: region.trim() || null,
      departement: departement.trim() || null,
      commune: commune.trim() || null,
      site_web: siteWeb.trim() || null,
      note: note.trim() || null,
    })
    setSubmitting(false)
    if (err) { setError(err.message); return }
    onDone()
  }

  return (
    <SlideOver open wide title="Nouvelle institution" onClose={onClose}
      footer={<>
        <button onClick={onClose} disabled={submitting}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={submitting || !nom.trim() || !typeRef}
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <CheckCircle2 className="w-3.5 h-3.5" />Créer
        </button>
      </>}
    >
      <Field label="Nom" required>
        <input value={nom} onChange={e => setNom(e.target.value)} autoFocus
          placeholder="ex. Archives départementales de la Guadeloupe" className={inputCls} />
      </Field>
      <Field label="Sigle">
        <input value={sigle} onChange={e => setSigle(e.target.value)}
          placeholder="ex. AD971" className={`${inputCls} font-mono`} />
      </Field>
      <Field label="Type" required>
        <select value={typeRef} onChange={e => setTypeRef(e.target.value)} className={selectCls}>
          <option value="">— Sélectionner…</option>
          {typeOptions.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Pays">
          <input value={pays} onChange={e => setPays(e.target.value)} placeholder="ex. France" className={inputCls} />
        </Field>
        <Field label="Région">
          <input value={region} onChange={e => setRegion(e.target.value)} placeholder="ex. Guadeloupe" className={inputCls} />
        </Field>
        <Field label="Département">
          <input value={departement} onChange={e => setDepartement(e.target.value)} placeholder="ex. Guadeloupe" className={inputCls} />
        </Field>
        <Field label="Commune">
          <input value={commune} onChange={e => setCommune(e.target.value)} placeholder="ex. Basse-Terre" className={inputCls} />
        </Field>
      </div>
      <Field label="Site web">
        <input value={siteWeb} onChange={e => setSiteWeb(e.target.value)}
          placeholder="https://…" className={inputCls} type="url" />
      </Field>
      <Field label="Note">
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="Observations libres…"
          className={`${inputCls} resize-none min-h-[80px]`} />
      </Field>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}
    </SlideOver>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PatrimoineDocumentairePage() {
  const navigate = useNavigate()

  const { sources, docs, corpus, citationsData, loading, error, refetch } = usePatrimoine()

  const [tab, setTab] = useState<Tab>('Sources')
  const [search, setSearch] = useState('')
  const [sourceDocFilter, setSourceDocFilter] = useState<string>('tous')
  const [statutDocFilter, setStatutDocFilter] = useState<DocStatut | 'tous'>('tous')

  // ── Référentiels (chargés à la demande) ──────────────────────────────────
  const [plateformes, setPlateformes] = useState<PlateformeRow[]>([])
  const [plateformesLoading, setPlateformesLoading] = useState(false)
  const plateformesLoaded = useRef(false)
  const [plateformesRefreshKey, setPlateformesRefreshKey] = useState(0)
  const reloadPlateformes = () => { plateformesLoaded.current = false; setPlateformesRefreshKey(k => k + 1) }

  const [institutions, setInstitutions] = useState<InstitutionRow[]>([])
  const [institutionsLoading, setInstitutionsLoading] = useState(false)
  const institutionsLoaded = useRef(false)
  const [institutionsRefreshKey, setInstitutionsRefreshKey] = useState(0)
  const reloadInstitutions = () => { institutionsLoaded.current = false; setInstitutionsRefreshKey(k => k + 1) }

  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([])
  useEffect(() => {
    fetchRoleDocumentOptions().then(setRoleOptions)
  }, [])

  useEffect(() => {
    if (plateformesLoaded.current) return
    plateformesLoaded.current = true
    setPlateformesLoading(true)
    supabaseRebond
      .from('ref_plateformes')
      .select('id, code, label, site_web, auth_required, ref_plateforme_kind!plateforme_kind_ref(label)')
      .order('label')
      .then(({ data }) => {
        setPlateformes((data ?? []).map((r: any) => ({
          id: r.id,
          code: r.code,
          label: r.label,
          site_web: r.site_web ?? null,
          auth_required: r.auth_required,
          kind_label: r.ref_plateforme_kind?.label ?? null,
        })))
        setPlateformesLoading(false)
      })
  }, [plateformesRefreshKey])

  useEffect(() => {
    if (institutionsLoaded.current) return
    institutionsLoaded.current = true
    setInstitutionsLoading(true)
    Promise.all([
      supabaseRebond.from('ref_institutions').select('id, nom, sigle, pays, commune, site_web, ref_institution_type!type_institution_ref(label)').order('nom'),
      supabaseRebond.from('ref_depots').select('institution_id'),
    ]).then(([instRes, depotsRes]) => {
      const depotCounts: Record<string, number> = {}
      for (const d of (depotsRes.data ?? [])) {
        depotCounts[d.institution_id] = (depotCounts[d.institution_id] ?? 0) + 1
      }
      setInstitutions((instRes.data ?? []).map((r: any) => ({
        id: r.id,
        nom: r.nom,
        sigle: r.sigle ?? null,
        pays: r.pays ?? null,
        commune: r.commune ?? null,
        type_label: r.ref_institution_type?.label ?? null,
        nb_depots: depotCounts[r.id] ?? 0,
        site_web: r.site_web ?? null,
      })))
      setInstitutionsLoading(false)
    })
  }, [institutionsRefreshKey])

  const [platSearch, setPlatSearch] = useState('')
  const [platKindFilter, setPlatKindFilter] = useState('')
  const [showCreatePlateforme, setShowCreatePlateforme] = useState(false)

  const [instSearch, setInstSearch] = useState('')
  const [instTypeFilter, setInstTypeFilter] = useState('')

  const [showCreateInstitution, setShowCreateInstitution] = useState(false)
  type ActiveSheet =
    | { kind: 'qualifier'; source: Source }
    | { kind: 'decrire'; doc: Document }
    | { kind: 'rattacher'; doc: Document }
  const [activeSheet, setActiveSheet] = useState<ActiveSheet | null>(null)

  function closeSheet() { setActiveSheet(null) }
  async function onSheetDone() { closeSheet(); await refetch() }

  // Alerts
  const sourcesAQualifier = sources.filter(s => s.statut === 'a_qualifier')
  const docsARattacher = docs.filter(d => !d.source_id && d.statut === 'en_attente')
  const docsADecrire = docs.filter(d => d.source_id && d.statut === 'en_attente')
  const nbAlerts = sourcesAQualifier.length + docsARattacher.length + docsADecrire.length

  const visibleTabs: Tab[] = nbAlerts > 0
    ? [...ALL_TABS]
    : ALL_TABS.filter(t => t !== 'En attente') as Tab[]

  // Stats
  const activeSources = sources.filter(s => s.statut !== 'a_qualifier')
  const activeDocs = docs.filter(d => d.statut !== 'en_attente')

  // Filtered sources
  const filteredSources = activeSources.filter(s => {
    const q = search.toLowerCase()
    return !q || s.nom.toLowerCase().includes(q)
      || s.institution_conservation.toLowerCase().includes(q)
  })

  // Filtered docs
  const STATUT_DOC_FILTERS: Array<{ key: DocStatut | 'tous'; label: string }> = [
    { key: 'tous', label: 'Tous' },
    { key: 'transcrit', label: 'Transcrits' },
    { key: 'annote', label: 'Annotés' },
    { key: 'en_cours', label: 'En cours' },
    { key: 'decrit', label: 'Décrits' },
  ]

  const filteredDocs = activeDocs.filter(d => {
    const matchSource = sourceDocFilter === 'tous' || d.source_id === sourceDocFilter
    const matchStatut = statutDocFilter === 'tous' || d.statut === statutDocFilter
    const q = search.toLowerCase()
    const matchSearch = !q || d.titre.toLowerCase().includes(q) || d.cote.toLowerCase().includes(q)
    return matchSource && matchStatut && matchSearch
  })

  const topLevelDocs = filteredDocs

  const documentColumns = useMemo<ColumnDef<Document>[]>(() => [
    {
      key: 'titre',
      label: 'Titre',
      render: (doc) => (
        <div className="space-y-0.5">
          <span className="text-sm font-medium text-gray-900">{doc.titre}</span>
          {doc.note && <p className="text-xs text-gray-400 italic">{doc.note}</p>}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rôle',
      columnWidth: '160px',
      render: (doc) => {
        const role = doc.role ? ROLE_CONFIG[doc.role] : null
        return role
          ? <span className={`text-xs font-medium rounded border px-1.5 py-0.5 w-fit ${role.color}`}>{role.label}</span>
          : <span className="text-xs text-gray-300">—</span>
      },
    },
    {
      key: 'cote',
      label: 'Cote',
      columnWidth: '140px',
      render: (doc) => (
        <span className="text-xs text-gray-500 font-mono">{doc.cote === '?' ? '—' : doc.cote}</span>
      ),
    },
    {
      key: 'source_id',
      label: 'Source',
      columnWidth: '220px',
      render: (doc) => {
        const source = doc.source_id ? sources.find(s => s.id === doc.source_id) : null
        return <span className="text-xs text-gray-500">{source ? source.institution_conservation : '—'}</span>
      },
    },
    {
      key: 'date_document',
      label: 'Période',
      columnWidth: '110px',
      render: (doc) => <span className="text-xs text-gray-500">{doc.date_document ?? '—'}</span>,
    },
    {
      key: 'vue',
      label: 'Vue',
      columnWidth: '90px',
      render: (doc) => <span className="text-xs text-gray-500 font-mono">{doc.vue ?? '—'}</span>,
    },
    {
      key: 'en_ligne',
      label: 'En ligne',
      columnWidth: '90px',
      render: (doc) => doc.url
        ? (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 transition-colors" title="Ouvrir en ligne">
            <ExternalLink className="w-4 h-4" />
          </a>
        )
        : <span className="text-xs text-gray-300">—</span>,
    },
    {
      key: 'statut',
      label: 'Statut',
      columnWidth: '130px',
      render: (doc) => {
        const statut = STATUT_DOC_CONFIG[doc.statut]
        return (
          <span className={`text-xs font-medium rounded-full border px-2.5 py-0.5 flex items-center gap-1.5 w-fit ${statut.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statut.dot}`} />{statut.label}
          </span>
        )
      },
    },
  ], [sources])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement du patrimoine documentaire…
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

        {/* Hero + actions */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <span className="text-gray-300">/</span>
              <span className="flex items-center gap-1.5">
                <Library className="w-4 h-4" />
                Patrimoine documentaire
              </span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Patrimoine documentaire</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sources, documents et corpus — le socle de toute connaissance dans REBOND.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/referencer')}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">
              <File className="w-4 h-4" />
              J'ai trouvé un document
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3.5">
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{activeSources.length}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">Sources</div>
            <div className="text-xs text-gray-400 mt-0.5">fonds actifs</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3.5">
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{activeDocs.length}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">Documents</div>
            <div className="text-xs text-gray-400 mt-0.5">référencés</div>
          </div>
          <div className={`rounded-xl border px-4 py-3.5 ${sourcesAQualifier.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
            <div className={`text-2xl font-bold tabular-nums ${sourcesAQualifier.length > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
              {sourcesAQualifier.length}
            </div>
            <div className={`text-sm font-medium mt-0.5 ${sourcesAQualifier.length > 0 ? 'text-orange-800' : 'text-gray-400'}`}>
              À qualifier
            </div>
            <div className={`text-xs mt-0.5 ${sourcesAQualifier.length > 0 ? 'text-orange-400' : 'text-gray-300'}`}>sources incomplètes</div>
          </div>
          <div className={`rounded-xl border px-4 py-3.5 ${docsARattacher.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
            <div className={`text-2xl font-bold tabular-nums ${docsARattacher.length > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
              {docsARattacher.length}
            </div>
            <div className={`text-sm font-medium mt-0.5 ${docsARattacher.length > 0 ? 'text-orange-800' : 'text-gray-400'}`}>
              À rattacher
            </div>
            <div className={`text-xs mt-0.5 ${docsARattacher.length > 0 ? 'text-orange-400' : 'text-gray-300'}`}>sans source</div>
          </div>
          <div className={`rounded-xl border px-4 py-3.5 ${docsADecrire.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
            <div className={`text-2xl font-bold tabular-nums ${docsADecrire.length > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
              {docsADecrire.length}
            </div>
            <div className={`text-sm font-medium mt-0.5 ${docsADecrire.length > 0 ? 'text-orange-800' : 'text-gray-400'}`}>
              À décrire
            </div>
            <div className={`text-xs mt-0.5 ${docsADecrire.length > 0 ? 'text-orange-400' : 'text-gray-300'}`}>docs en attente</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 border-b border-gray-200">
          {visibleTabs.map(t => {
            const badge =
              t === 'En attente' ? nbAlerts :
              t === 'Sources' ? activeSources.length :
              t === 'Documents' ? activeDocs.length :
              t === 'Exemplaires' ? citationsData.length :
              t === 'Plateformes' ? (plateformes.length || null) :
              t === 'Institutions' ? (institutions.length || null) :
              t === 'Corpus' ? corpus.length : null
            const isAlert = t === 'En attente'
            return (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch('') }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t}
                {badge != null && badge > 0 && (
                  <span className={`ml-2 text-xs rounded-full px-1.5 py-0.5 font-medium ${
                    tab === t
                      ? isAlert ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'
                      : isAlert ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── En attente ── */}
        {tab === 'En attente' && (
          <EnAttenteTab
            sourcesAQualifier={sourcesAQualifier}
            docsARattacher={docsARattacher}
            docsADecrire={docsADecrire}
            sources={sources}
            onQualifier={source => setActiveSheet({ kind: 'qualifier', source })}
            onRattacher={doc => setActiveSheet({ kind: 'rattacher', doc })}
            onDecrire={doc => setActiveSheet({ kind: 'decrire', doc })}
          />
        )}

        {/* ── Sources ── */}
        {tab === 'Sources' && (
          <div className="space-y-4">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une source…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {filteredSources.length === 0 ? (
              <div className="py-16 text-center">
                <Library className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucune source trouvée.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSources.map(source => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Documents ── */}
        {tab === 'Documents' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <select
                value={sourceDocFilter}
                onChange={e => setSourceDocFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="tous">Toutes les sources</option>
                {activeSources.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
              {STATUT_DOC_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatutDocFilter(f.key)}
                  className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${
                    statutDocFilter === f.key
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <DataTable
                title="Documents"
                data={topLevelDocs}
                columns={documentColumns}
                pageSize={15}
                defaultSort={['titre']}
                onRowClick={(doc) => navigate(`/documents/${doc.id}`)}
              />
            </div>
          </div>
        )}

        {/* ── Exemplaires ── */}
        {tab === 'Exemplaires' && (() => {
          const ecActes = citationsData.filter(c => c.target_type === 'ec_acte')

          function isShortFormComplete(c: typeof citationsData[number]): boolean {
            if (c.is_missing === null) return false
            if (c.lacune === null) return false
            const loc = (c.locating ?? {}) as Record<string, any>
            const sys0 = (Array.isArray(loc.systems) ? loc.systems[0] : {}) ?? {}
            if (!(loc.raw?.toString().trim()) && sys0.start == null) return false
            const present = ((c.marginalia ?? {}) as Record<string, any>).present ?? {}
            if (present.marginal_mentions == null) return false
            if (present.signatures == null) return false
            if (present.marginal_crossouts == null) return false
            return true
          }

          const ecActesComplets = ecActes.filter(isShortFormComplete)
          const ecActesIncomplets = ecActes.filter(c => !isShortFormComplete(c))
          const nonActes = citationsData.filter(c => c.target_type !== 'ec_acte')

          function ExemplaireRow({ c }: { c: typeof citationsData[number] }) {
            const isClickable = c.target_type === 'ec_acte'
            const handleClick = isClickable
              ? () => navigate(`/exemplaires/${c.citation_id}`)
              : undefined
            return (
              <div
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={handleClick}
                onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick?.() } : undefined}
                className={[
                  'flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0 transition-colors',
                  isClickable ? 'cursor-pointer hover:bg-gray-50' : '',
                ].join(' ')}
              >
                <div className="w-8 h-8 rounded-lg border bg-indigo-50 border-indigo-100 flex items-center justify-center shrink-0">
                  <Library className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {c.unite_titre ?? <span className="italic text-gray-400">Document inconnu</span>}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{c.target_type}</p>
                </div>
                <div className="w-48 shrink-0">
                  <p className="text-xs font-medium text-gray-700">{c.institution_sigle ?? c.institution_nom ?? '—'}</p>
                  {c.depot_nom && <p className="text-xs text-gray-400">{c.depot_nom}</p>}
                </div>
                <div className="w-32 shrink-0">
                  <span className="text-xs font-mono text-gray-600">{c.cote_locale ?? '—'}</span>
                </div>
                {isClickable && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
              </div>
            )
          }

          function Section({ title, items, emptyLabel, accent }: {
            title: string
            items: typeof citationsData
            emptyLabel: string
            accent: 'green' | 'amber' | 'slate'
          }) {
            const accentMap = {
              green: { dot: 'bg-green-400', count: 'text-green-700 bg-green-50 border-green-200' },
              amber: { dot: 'bg-amber-400', count: 'text-amber-700 bg-amber-50 border-amber-200' },
              slate: { dot: 'bg-slate-400', count: 'text-slate-700 bg-slate-50 border-slate-200' },
            }
            const a = accentMap[accent]
            return (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${a.dot}`} />
                  <span className="flex-1 text-xs font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${a.count}`}>{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-400">{emptyLabel}</p>
                  </div>
                ) : (
                  items.map(c => <ExemplaireRow key={c.citation_id} c={c} />)
                )}
              </div>
            )
          }

          if (citationsData.length === 0) {
            return (
              <div className="py-16 text-center">
                <Library className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucun exemplaire référencé.</p>
              </div>
            )
          }

          return (
            <div className="space-y-4">
              <Section
                title="Actes EC — formulaire court complété"
                items={ecActesComplets}
                emptyLabel="Aucun acte avec formulaire complété."
                accent="green"
              />
              <Section
                title="Actes EC — formulaire court incomplet"
                items={ecActesIncomplets}
                emptyLabel="Aucun acte avec formulaire incomplet."
                accent="amber"
              />
              <Section
                title="Autres (registres, actes non-EC…)"
                items={nonActes}
                emptyLabel="Aucun autre type d'occurrence."
                accent="slate"
              />
            </div>
          )
        })()}

        {/* ── Plateformes ── */}
        {tab === 'Plateformes' && (
          <div className="space-y-4">
            {plateformesLoading ? (
              <div className="flex items-center gap-2 py-16 justify-center text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />Chargement…
              </div>
            ) : (() => {
              const platKinds = Array.from(new Set(plateformes.map(p => p.kind_label).filter(Boolean))) as string[]
              const filtered = plateformes.filter(p => {
                const q = platSearch.toLowerCase()
                const matchSearch = !q || p.label.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.site_web ?? '').toLowerCase().includes(q)
                const matchKind = !platKindFilter || p.kind_label === platKindFilter
                return matchSearch && matchKind
              })
              return (
                <>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input value={platSearch} onChange={e => setPlatSearch(e.target.value)}
                          placeholder="Rechercher…"
                          className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
                      </div>
                      <button onClick={() => setPlatKindFilter('')}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${
                          !platKindFilter ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}>Tous</button>
                      {platKinds.map(k => (
                        <button key={k} onClick={() => setPlatKindFilter(platKindFilter === k ? '' : k)}
                          className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${
                            platKindFilter === k ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}>{k}</button>
                      ))}
                    </div>
                    <button onClick={() => setShowCreatePlateforme(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors shrink-0">
                      <Plus className="w-3.5 h-3.5" />Nouvelle plateforme
                    </button>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="py-16 text-center">
                      <MonitorCheck className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Aucune plateforme trouvée.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                        <div className="col-span-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Type</div>
                        <div className="col-span-7 text-xs font-medium text-gray-400 uppercase tracking-wide">Libellé</div>
                        <div className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Accès</div>
                      </div>
                      {filtered.map(p => (
                        <div key={p.id} onClick={() => navigate(`/plateformes/${p.id}`)} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="col-span-3 flex items-center">
                            <span className="text-xs text-gray-500">{p.kind_label ?? '—'}</span>
                          </div>
                          <div className="col-span-7 flex items-center min-w-0">
                            <p className="text-sm text-gray-800 truncate">{p.label}</p>
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            {p.site_web ? (
                              <a href={p.site_web} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
                                <ExternalLink className="w-3 h-3" />Site
                              </a>
                            ) : <span className="text-xs text-gray-300">—</span>}
                            {p.auth_required && (
                              <div className="relative group">
                                <Lock className="w-4 h-4 text-gray-500" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                  Authentification requise
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* ── Institutions ── */}
        {tab === 'Institutions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={instSearch} onChange={e => setInstSearch(e.target.value)}
                    placeholder="Rechercher…"
                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
                </div>
                {(() => {
                  const types = Array.from(new Set(institutions.map(i => i.type_label).filter(Boolean))) as string[]
                  return (
                    <>
                      <button onClick={() => setInstTypeFilter('')}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${
                          !instTypeFilter ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}>Tous</button>
                      {types.map(t => (
                        <button key={t} onClick={() => setInstTypeFilter(instTypeFilter === t ? '' : t)}
                          className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${
                            instTypeFilter === t ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}>{t}</button>
                      ))}
                    </>
                  )
                })()}
              </div>
              <button
                onClick={() => setShowCreateInstitution(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5" />Nouvelle institution
              </button>
            </div>
            {institutionsLoading ? (
              <div className="flex items-center gap-2 py-16 justify-center text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />Chargement…
              </div>
            ) : (() => {
              const filtered = institutions.filter(i => {
                const q = instSearch.toLowerCase()
                const matchSearch = !q || i.nom.toLowerCase().includes(q) || (i.sigle ?? '').toLowerCase().includes(q) || (i.commune ?? '').toLowerCase().includes(q)
                const matchType = !instTypeFilter || i.type_label === instTypeFilter
                return matchSearch && matchType
              })
              if (filtered.length === 0) return (
                <div className="py-16 text-center">
                  <University className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucune institution trouvée.</p>
                </div>
              )
              return (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                    <div className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Sigle</div>
                    <div className="col-span-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Nom</div>
                    <div className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Type</div>
                    <div className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Commune</div>
                    <div className="col-span-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Dépôts</div>
                    <div className="col-span-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Site</div>
                  </div>
                  {filtered.map(i => (
                    <div key={i.id} onClick={() => navigate(`/institutions/${i.id}`)}
                      className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="col-span-2 flex items-center">
                        {i.sigle ? (
                          <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                            {i.sigle}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </div>
                      <div className="col-span-4 flex items-center min-w-0">
                        <p className="text-sm text-gray-800 truncate">{i.nom}</p>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="text-xs text-gray-500">{i.type_label ?? '—'}</span>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="text-xs text-gray-500">{[i.commune, i.pays].filter(Boolean).join(', ') || '—'}</span>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                          i.nb_depots > 0
                            ? 'text-indigo-600 bg-indigo-50 border border-indigo-200'
                            : 'text-gray-400 bg-gray-50 border border-gray-200'
                        }`}>
                          {i.nb_depots}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center">
                        {i.site_web ? (
                          <a href={i.site_web} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            className="text-gray-400 hover:text-indigo-600 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Corpus ── */}
        {tab === 'Corpus' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Un corpus regroupe des documents autour d'une même enquête et permet de suivre l'avancement du travail.
              </p>
              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Plus className="w-4 h-4" />Nouveau corpus
              </button>
            </div>
            {corpus.length === 0 ? (
              <div className="py-16 text-center">
                <Tag className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucun corpus créé.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {corpus.map(c => <CorpusCard key={c.id} corpus={c} sources={sources} />)}
              </div>
            )}
          </div>
        )}

      </main>

      {showCreatePlateforme && (
        <CreatePlateformeSheet
          onClose={() => setShowCreatePlateforme(false)}
          onDone={() => { setShowCreatePlateforme(false); reloadPlateformes() }}
        />
      )}

      {showCreateInstitution && (
        <CreateInstitutionSheet
          onClose={() => setShowCreateInstitution(false)}
          onDone={() => { setShowCreateInstitution(false); reloadInstitutions() }}
        />
      )}

      {activeSheet?.kind === 'qualifier' && (
        <QualifierSourceSheet
          source={activeSheet.source}
          roleOptions={roleOptions}
          onClose={closeSheet}
          onDone={onSheetDone}
        />
      )}
      {activeSheet?.kind === 'decrire' && (
        <DecrireDocumentSheet
          doc={activeSheet.doc}
          roleOptions={roleOptions}
          onClose={closeSheet}
          onDone={onSheetDone}
        />
      )}
      {activeSheet?.kind === 'rattacher' && (
        <RattacherDocumentSheet
          doc={activeSheet.doc}
          sources={sources}
          onClose={closeSheet}
          onDone={onSheetDone}
        />
      )}
    </div>
  )
}
