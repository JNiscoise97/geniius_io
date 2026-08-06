import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Loader2, AlertCircle, Globe, Building2, Monitor, BookOpen,
  University, AlertTriangle, CheckCircle2, Pencil, Plus, Trash2,
  Tag, FileText, PenLine, Eye, Lock, Unlock, Save,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { ActeCitationDraft } from '@/features/archives/reference/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { TriStateButton } from '@/components/shared/TriStateButton'
import { TextAreaField } from '@/components/shared/Fields'
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart'

// ── pack/unpack ───────────────────────────────────────────────────────────────

function toBoolOrNull(v: any): boolean | null {
  if (v === true) return true
  if (v === false) return false
  return null
}

function toUuidOrNull(v: any): string | null {
  if (!v) return null
  if (typeof v === 'string' && v.trim()) return v.trim()
  if (Array.isArray((v as any)?.ids) && (v as any).ids[0]) return (v as any).ids[0]
  return null
}

function toIntOrNull(s: string): number | null {
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : null
}

function unpackLocating(loc: Record<string, any> | null) {
  const sys = (loc?.systems ?? [])[0] ?? {}
  return {
    loc_start: sys.start ?? null,
    loc_end: sys.end ?? null,
    loc_raw: loc?.raw ?? '',
    loc_kind: (sys.kind as string) ?? null,
    missing_ranges: loc?.missing_ranges ?? [],
  }
}

function packLocating(c: any): Record<string, any> {
  const loc: Record<string, any> = {}
  if (c.loc_start != null || c.loc_end != null)
    loc.systems = [{ kind: c.loc_kind ?? 'vue', start: c.loc_start, end: c.loc_end }]
  if ((c.loc_raw ?? '').trim()) loc.raw = String(c.loc_raw).trim()
  if (Array.isArray(c.missing_ranges) && c.missing_ranges.length) loc.missing_ranges = c.missing_ranges
  return loc
}

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

function packMarginalia(c: any): Record<string, any> {
  return {
    present: {
      signatures: toBoolOrNull(c.signatures_present),
      marginal_mentions: toBoolOrNull(c.marginal_mentions_present),
      marginal_crossouts: toBoolOrNull(c.marginal_crossouts_present),
    },
    count: {
      signatures: c.signatures_present === true ? (c.signatures_count ?? null) : null,
      marginal_mentions: c.marginal_mentions_present === true ? (c.marginal_mentions_count ?? null) : null,
      marginal_crossouts: c.marginal_crossouts_present === true ? (c.marginal_crossouts_count ?? null) : null,
    },
  }
}

function packWriting(c: any): Record<string, any> {
  const wr: Record<string, any> = {}
  if (c.ecriture_ref) wr.ecriture_ref = c.ecriture_ref
  if (c.handwriting_legibility_ref) wr.legibility_ref = c.handwriting_legibility_ref
  if (c.damage_notes?.trim?.()) wr.damage_notes = c.damage_notes.trim()
  if (c.repro_notes?.trim?.()) wr.repro_notes = c.repro_notes.trim()
  return wr
}

function normalizeCitationRow(r: any, pick: any | null): ActeCitationDraft {
  const arrOrEmpty = (v: any) => (Array.isArray(v) ? v.filter(Boolean) : [])
  const loc = unpackLocating(r?.locating ?? null)
  const mar = unpackMarginalia(r?.marginalia ?? null)

  return {
    id: r?.id,
    exemplaire_id: r?.exemplaire_id,
    exemplaire: pick
      ? {
          exemplaire_id: pick.exemplaire_id,
          nature_ref: pick.nature_ref ?? '',
          nature_code: pick.nature_code ?? null,
          nature_label: pick.nature_label ?? null,
          support_ref: pick.support_ref ?? null,
          support_code: pick.support_code ?? null,
          support_label: pick.support_label ?? null,
          physical_condition_ref: pick.physical_condition_ref ?? null,
          physical_condition_code: pick.physical_condition_code ?? null,
          physical_condition_label: pick.physical_condition_label ?? null,
          unite_id: pick.unite_id ?? '',
          unite_titre: pick.unite_titre ?? '',
          cote_locale: pick.cote_locale ?? null,
          pagination_type_ref: pick.pagination_type_ref ?? null,
          pagination_type_code: pick.pagination_type_code ?? null,
          pagination_type_label: pick.pagination_type_label ?? null,
          nb_pages: pick.nb_pages ?? null,
          depot_nom: pick.depot_nom ?? '',
          depot_is_online: pick.depot_is_online ?? null,
          depot_is_physical: pick.depot_is_physical ?? null,
          institution_nom: pick.institution_nom ?? '',
          institution_sigle: pick.institution_sigle ?? null,
          institution_commune: pick.institution_commune ?? null,
          institution_pays: pick.institution_pays ?? null,
          institution_type_label: pick.institution_type_label ?? null,
          identifiant_interne: pick.identifiant_interne ?? null,
          localisation_interne: pick.localisation_interne ?? null,
          url_base: pick.url_base ?? null,
          plateforme_code: pick.plateforme_code ?? null,
          source_exemplaire_id: pick.source_exemplaire_id ?? undefined,
        }
      : undefined,
    ...loc,
    is_missing: r?.is_missing,
    note: r?.note ?? '',
    sort_order: typeof r?.sort_order === 'number' ? r.sort_order : 0,
    physical_condition_ref: (pick?.physical_condition_ref ?? null) as any,
    repro_quality_ref: (r?.repro_quality_ref ?? null) as any,
    ...mar,
    ecriture_ref: r?.writing?.ecriture_ref ?? null,
    handwriting_legibility_ref: r?.writing?.legibility_ref ?? null,
    damage_notes: r?.writing?.damage_notes ?? '',
    repro_notes: r?.writing?.repro_notes ?? '',
    langue_ref: null as any,
    document_damage_kinds_ids: [] as any[],
    document_readability_features_ids: [] as any[],
    lacune: r?.lacune ?? null,
    lacune_note: r?.lacune_note ?? '',
    marks: r?.marks ?? '',
  } as any
}

// ── Types ─────────────────────────────────────────────────────────────────────

type LocMode = 'raw' | 'num' | 'range'
type LocUi = { mode: LocMode; raw: string; start: string; end: string; kind: string }
type PaginationType = { id: string; code: string; label: string }

function detectLocMode(c: any): LocMode {
  const start = c?.loc_start ?? null
  const end = c?.loc_end ?? null
  if (typeof start === 'number' || typeof end === 'number') {
    return start != null && end != null && start !== end ? 'range' : 'num'
  }
  return 'raw'
}

// ── Composants inline ─────────────────────────────────────────────────────────

type Accent = 'indigo' | 'teal' | 'violet' | 'amber'
const ACCENT: Record<Accent, { icon: string; title: string }> = {
  indigo: { icon: 'text-indigo-500', title: 'text-indigo-700' },
  teal:   { icon: 'text-teal-500',   title: 'text-teal-700' },
  violet: { icon: 'text-violet-500', title: 'text-violet-700' },
  amber:  { icon: 'text-amber-500',  title: 'text-amber-700' },
}

function SectionCard({ title, icon: Icon, accent = 'indigo', headerRight, children }: {
  title: string; icon: React.ElementType; accent?: Accent
  headerRight?: React.ReactNode; children: React.ReactNode
}) {
  const a = ACCENT[accent]
  return (
    <div className='rounded-xl border border-slate-200 bg-white overflow-hidden'>
      <div className='flex items-center gap-2.5 border-b border-slate-100 px-5 py-3 bg-slate-50'>
        <Icon className={`w-4 h-4 ${a.icon} shrink-0`} />
        <h2 className={`text-sm font-semibold ${a.title} flex-1`}>{title}</h2>
        {headerRight}
      </div>
      <div className='p-5'>{children}</div>
    </div>
  )
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className='grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2'>{children}</div>
}

function FieldItem({ label, value, url }: {
  label: string; value: string | null | undefined; url?: boolean
}) {
  if (value == null || value === '') return null
  return (
    <div>
      <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5'>{label}</dt>
      <dd className='text-sm text-slate-800'>
        {url ? (
          <a href={value} target='_blank' rel='noopener noreferrer'
            className='text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors break-all'>
            <Globe className='w-3.5 h-3.5 shrink-0' />{value}
          </a>
        ) : value}
      </dd>
    </div>
  )
}

function DirtyBadge({ saving, dirty }: { saving: boolean; dirty: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
      saving ? 'border-slate-200 bg-slate-50 text-slate-700'
      : dirty ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-slate-200 bg-slate-50 text-slate-500'
    }`}>
      {saving ? <Loader2 className='w-3.5 h-3.5 animate-spin' />
        : dirty ? <AlertTriangle className='w-3.5 h-3.5' />
        : <CheckCircle2 className='w-3.5 h-3.5' />}
      <span className='whitespace-nowrap'>
        {saving ? 'Enregistrement…' : dirty ? 'Non enregistré' : 'À jour'}
      </span>
    </div>
  )
}

function TriStatePill({ value }: { value: boolean | null }) {
  if (value === true) return (
    <span className='inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'>Oui</span>
  )
  if (value === false) return (
    <span className='inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200'>Non</span>
  )
  return <span className='text-sm text-slate-300 italic'>—</span>
}

function SectionEditHeader({ isEditing, dirty, saving, onEdit, onSave, onCancel }: {
  isEditing: boolean; dirty: boolean; saving: boolean
  onEdit: () => void; onSave: () => void; onCancel: () => void
}) {
  if (!isEditing) return (
    <button type='button' onClick={onEdit}
      className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition'>
      <Pencil className='w-3 h-3' />Modifier
    </button>
  )
  return (
    <div className='flex items-center gap-2'>
      <DirtyBadge saving={saving} dirty={dirty} />
      <button type='button' onClick={onCancel}
        className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition'>
        Annuler
      </button>
      <button type='button' onClick={onSave} disabled={!dirty || saving}
        className='inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition'>
        {saving ? <Loader2 className='w-3 h-3 animate-spin' /> : <Save className='w-3 h-3' />}
        Enregistrer
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function EnrichirExemplaireActePage() {
  const { citationId } = useParams<{ citationId: string }>()
  const navigate = useNavigate()

  const [draft, setDraft] = useState<ActeCitationDraft | null>(null)
  const [paginationTypes, setPaginationTypes] = useState<PaginationType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Section : Libellé ──
  const [couvertureLabelDraft, setCouvertureLabelDraft] = useState('')
  const [couvertureLabelLocked, setCouvertureLabelLocked] = useState(true)
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [labelDirty, setLabelDirty] = useState(false)
  const [savingLabel, setSavingLabel] = useState(false)
  const labelRef = useRef<HTMLInputElement>(null)
  const labelSnapshot = useRef<{ label: string; locked: boolean } | null>(null)

  // ── Section : Statut & Localisation ──
  const [isEditingStatLoc, setIsEditingStatLoc] = useState(false)
  const [statLocDirty, setStatLocDirty] = useState(false)
  const [savingStatLoc, setSavingStatLoc] = useState(false)
  const [locUi, setLocUi] = useState<LocUi>({ mode: 'num', raw: '', start: '', end: '', kind: 'vue' })
  const statLocSnapshot = useRef<any>(null)

  // ── Section : Marques & signes ──
  const [isEditingMarques, setIsEditingMarques] = useState(false)
  const [marquesDirty, setMarquesDirty] = useState(false)
  const [savingMarques, setSavingMarques] = useState(false)
  const marquesSnapshot = useRef<any>(null)

  // ── Section : Observations ──
  const [isEditingObs, setIsEditingObs] = useState(false)
  const [obsDirty, setObsDirty] = useState(false)
  const [savingObs, setSavingObs] = useState(false)
  const obsSnapshot = useRef<any>(null)

  // ── Load ──
  useEffect(() => {
    if (!citationId) return
    let cancelled = false

    const load = async () => {
      setLoading(true); setError(null)

      const [ptRes, citRes] = await Promise.all([
        supabase.from('ref_pagination_type').select('id, code, label'),
        supabase.from('citations')
          .select('id, target_id, exemplaire_id, is_missing, lacune, lacune_note, note, sort_order, repro_quality_ref, marks, locating, marginalia, writing')
          .eq('id', citationId).single(),
      ])

      if (cancelled) return
      if (citRes.error) { setError(citRes.error.message); setLoading(false); return }
      if (ptRes.data) setPaginationTypes(ptRes.data as PaginationType[])

      let pick: any = null
      if (citRes.data.exemplaire_id) {
        const { data } = await supabase
          .from('v_exemplaires_pick')
          .select('exemplaire_id,nature_ref,nature_code,nature_label,support_ref,support_code,support_label,unite_id,unite_titre,cote_locale,pagination_type_ref,pagination_type_code,pagination_type_label,nb_pages,depot_nom,depot_is_online,depot_is_physical,institution_nom,institution_sigle,institution_commune,institution_pays,institution_type_label,url_base,plateforme_code,source_exemplaire_id,identifiant_interne,localisation_interne,physical_condition_ref,physical_condition_code,physical_condition_label')
          .eq('exemplaire_id', citRes.data.exemplaire_id)
          .maybeSingle()
        if (!cancelled) pick = data
      }

      let couvertureLabel: string | null = null
      if (citRes.data.exemplaire_id) {
        const { data: exRow } = await supabase
          .from('ref_exemplaires').select('couverture_label')
          .eq('id', citRes.data.exemplaire_id).maybeSingle()
        couvertureLabel = exRow?.couverture_label ?? null
      }

      if (!cancelled) {
        const normalized = normalizeCitationRow(citRes.data, pick)
        setDraft(normalized)
        const c = normalized as any
        setLocUi({
          mode: detectLocMode(c),
          raw: String(c.loc_raw ?? ''),
          start: c.loc_start != null ? String(c.loc_start) : '',
          end: c.loc_end != null ? String(c.loc_end) : '',
          kind: c.loc_kind ?? 'vue',
        })
        const hasCustomLabel = couvertureLabel !== null && couvertureLabel !== ''
        setCouvertureLabelDraft(couvertureLabel ?? '')
        setCouvertureLabelLocked(!hasCustomLabel)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [citationId])

  // ── Libellé handlers ──
  const startEditingLabel = () => {
    labelSnapshot.current = { label: couvertureLabelDraft, locked: couvertureLabelLocked }
    setIsEditingLabel(true); setLabelDirty(false)
  }
  const cancelLabel = () => {
    if (labelSnapshot.current) {
      setCouvertureLabelDraft(labelSnapshot.current.label)
      setCouvertureLabelLocked(labelSnapshot.current.locked)
    }
    setIsEditingLabel(false); setLabelDirty(false)
  }
  const saveLabel = async () => {
    if (!draft?.exemplaire_id) return
    setSavingLabel(true)
    const couvertureToSave = couvertureLabelLocked ? null : (couvertureLabelDraft.trim() || null)
    const { error: err } = await supabase.from('ref_exemplaires')
      .update({ couverture_label: couvertureToSave }).eq('id', draft.exemplaire_id)
    setSavingLabel(false)
    if (err) { toast.error(err.message); return }
    setLabelDirty(false); setIsEditingLabel(false)
    toast.success('Libellé mis à jour')
  }

  // ── Statut & Localisation handlers ──
  const startEditingStatLoc = () => {
    if (!draft) return
    const c = draft as any
    statLocSnapshot.current = {
      is_missing: c.is_missing, lacune: c.lacune, lacune_note: c.lacune_note,
      missing_ranges: c.missing_ranges,
      loc_start: c.loc_start, loc_end: c.loc_end, loc_raw: c.loc_raw, loc_kind: c.loc_kind,
      locUi: { ...locUi },
    }
    setIsEditingStatLoc(true); setStatLocDirty(false)
  }
  const cancelStatLoc = () => {
    if (statLocSnapshot.current) {
      const { locUi: savedLocUi, ...draftFields } = statLocSnapshot.current
      setDraft(prev => prev ? { ...prev, ...draftFields } : prev)
      setLocUi(savedLocUi)
    }
    setIsEditingStatLoc(false); setStatLocDirty(false)
  }
  const saveStatLoc = async () => {
    if (!draft || !citationId) return
    setSavingStatLoc(true)
    const c = draft as any
    const { error: err } = await supabase.from('citations').update({
      is_missing: toBoolOrNull(c.is_missing),
      lacune: toBoolOrNull(c.lacune),
      lacune_note: (c.lacune_note ?? '').trim() || null,
      locating: packLocating(c),
    }).eq('id', citationId)
    setSavingStatLoc(false)
    if (err) { toast.error(err.message); return }
    setStatLocDirty(false); setIsEditingStatLoc(false)
    toast.success('Statut & localisation mis à jour')
  }

  const commitLoc = (ui: LocUi) => {
    if (ui.mode === 'raw') {
      setDraft(prev => prev ? { ...prev, loc_raw: ui.raw, loc_start: null, loc_end: null, loc_kind: ui.kind } as any : prev)
    } else if (ui.mode === 'num') {
      const n = toIntOrNull(ui.start)
      setDraft(prev => prev ? { ...prev, loc_raw: null, loc_start: n, loc_end: n, loc_kind: ui.kind } as any : prev)
    } else {
      const s = toIntOrNull(ui.start); const e = toIntOrNull(ui.end)
      const raw = s != null && e != null ? `${s}-${e}` : ''
      setDraft(prev => prev ? { ...prev, loc_raw: raw || null, loc_start: s, loc_end: e, loc_kind: ui.kind } as any : prev)
    }
  }
  const updateLocUi = (next: Partial<LocUi>) => {
    const merged = { ...locUi, ...next }
    setLocUi(merged); commitLoc(merged); setStatLocDirty(true)
  }

  // ── Marques handlers ──
  const startEditingMarques = () => {
    if (!draft) return
    const c = draft as any
    marquesSnapshot.current = {
      marginal_mentions_present: c.marginal_mentions_present, marginal_mentions_count: c.marginal_mentions_count,
      signatures_present: c.signatures_present, signatures_count: c.signatures_count,
      marginal_crossouts_present: c.marginal_crossouts_present, marginal_crossouts_count: c.marginal_crossouts_count,
      marks: c.marks, note: draft.note,
    }
    setIsEditingMarques(true); setMarquesDirty(false)
  }
  const cancelMarques = () => {
    if (marquesSnapshot.current) setDraft(prev => prev ? { ...prev, ...marquesSnapshot.current } : prev)
    setIsEditingMarques(false); setMarquesDirty(false)
  }
  const saveMarques = async () => {
    if (!draft || !citationId) return
    setSavingMarques(true)
    const c = draft as any
    const { error: err } = await supabase.from('citations').update({
      marginalia: packMarginalia(c),
      marks: (c.marks ?? '').trim() || null,
      note: (draft.note ?? '').trim() || null,
    }).eq('id', citationId)
    setSavingMarques(false)
    if (err) { toast.error(err.message); return }
    setMarquesDirty(false); setIsEditingMarques(false)
    toast.success('Marques & signes mis à jour')
  }

  // ── Observations handlers ──
  const startEditingObs = () => {
    if (!draft) return
    const c = draft as any
    obsSnapshot.current = {
      physical_condition_ref: c.physical_condition_ref, repro_quality_ref: c.repro_quality_ref,
      document_damage_kinds_ids: c.document_damage_kinds_ids, document_readability_features_ids: c.document_readability_features_ids,
      langue_ref: c.langue_ref, ecriture_ref: c.ecriture_ref,
      handwriting_legibility_ref: c.handwriting_legibility_ref,
      damage_notes: c.damage_notes, repro_notes: c.repro_notes,
    }
    // physical_condition_ref, document_damage_kinds_ids, document_readability_features_ids → ref_exemplaires
    // langue_ref → ref_unites_documentaires
    setIsEditingObs(true); setObsDirty(false)
  }
  const cancelObs = () => {
    if (obsSnapshot.current) setDraft(prev => prev ? { ...prev, ...obsSnapshot.current } : prev)
    setIsEditingObs(false); setObsDirty(false)
  }
  const saveObs = async () => {
    if (!draft || !citationId) return
    setSavingObs(true)
    const c = draft as any
    const exemplaire_id = draft?.exemplaire_id
    const unite_id = (draft as any)?.exemplaire?.unite_id

    const [citErr, exErr, udErr] = await Promise.all([
      supabase.from('citations').update({
        repro_quality_ref: toUuidOrNull(c.repro_quality_ref),
        writing: packWriting(c),
      }).eq('id', citationId).then(r => r.error),
      exemplaire_id ? supabase.from('ref_exemplaires').update({
        physical_condition_ref: toUuidOrNull(c.physical_condition_ref),
        document_damage_kinds_ids: Array.isArray(c.document_damage_kinds_ids) ? c.document_damage_kinds_ids : [],
        document_readability_features_ids: Array.isArray(c.document_readability_features_ids) ? c.document_readability_features_ids : [],
      }).eq('id', exemplaire_id).then(r => r.error) : Promise.resolve(null),
      unite_id ? supabase.from('ref_unites_documentaires').update({
        langue_ref: toUuidOrNull(c.langue_ref),
      }).eq('id', unite_id).then(r => r.error) : Promise.resolve(null),
    ])
    const err = citErr ?? exErr ?? udErr
    setSavingObs(false)
    if (err) { toast.error(err.message); return }
    setObsDirty(false); setIsEditingObs(false)
    toast.success('Observations mises à jour')
  }

  // ── Rendu ──

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <Loader2 className='w-6 h-6 text-gray-400 animate-spin' />
    </div>
  )

  if (error || !draft) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <AlertCircle className='w-8 h-8 text-red-400 mx-auto mb-3' />
        <p className='text-sm text-red-600 mb-3'>{error ?? 'Citation introuvable'}</p>
        <button onClick={() => navigate('/mock/sources-corpus')} className='text-sm text-gray-500 hover:text-gray-700'>← Retour</button>
      </div>
    </div>
  )

  const c = draft as any
  const ex = draft.exemplaire
  const uniteTitre = ex?.unite_titre ?? 'Document sans titre'
  const institutionLabel = ex?.institution_sigle ?? ex?.institution_nom ?? null

  const locDisplay = (() => {
    const kindLabel = paginationTypes.find(pt => pt.code === c.loc_kind)?.label ?? c.loc_kind ?? ''
    if (c.loc_start != null && c.loc_end != null)
      return c.loc_start === c.loc_end ? `${kindLabel} ${c.loc_start}` : `${kindLabel} ${c.loc_start}–${c.loc_end}`
    if (c.loc_raw) return c.loc_raw
    return null
  })()

  const missingRanges: any[] = Array.isArray(c.missing_ranges) ? c.missing_ranges : []

  return (
    <div className='min-h-screen bg-gray-50'>

      <header className='sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4'>
        <button onClick={() => navigate('/mock/sources-corpus')}
          className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0'>
          <ChevronLeft className='w-4 h-4' />Exemplaires
        </button>
        <span className='text-gray-300'>/</span>
        <div className='min-w-0'>
          <span className='text-sm font-semibold text-gray-900 truncate block'>{uniteTitre}</span>
          <span className='text-xs text-gray-400'>
            {[institutionLabel, ex?.cote_locale].filter(Boolean).join(' · ')}
          </span>
        </div>
      </header>

      <main className='max-w-3xl mx-auto px-6 py-6 space-y-6'>

        {/* ── Contexte ── */}
        <SectionCard title={"Contexte de l'exemplaire"} icon={BookOpen} accent='indigo'>
          <dl className='space-y-4'>
            <FieldGrid>
              <FieldItem label='Unité documentaire' value={ex?.unite_titre} />
              <FieldItem label='Cote locale' value={ex?.cote_locale} />
            </FieldGrid>

            {ex && (
              <div className='space-y-3 border-t border-slate-100 pt-4'>
                <div>
                  <div className='flex items-center gap-1.5 mb-1.5'>
                    <University className='w-3.5 h-3.5 text-indigo-500' />
                    <span className='text-xs font-medium text-slate-400 uppercase tracking-wide'>Institution</span>
                  </div>
                  <div className='rounded-lg border border-slate-200 px-3 py-2.5 space-y-1'>
                    {ex.institution_type_label && (
                      <div>
                        <span className='text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200'>
                          {ex.institution_type_label}
                        </span>
                      </div>
                    )}
                    <div className='flex items-center gap-2 flex-wrap'>
                      {ex.institution_sigle && (
                        <span className='text-xs font-mono font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5'>
                          {ex.institution_sigle}
                        </span>
                      )}
                      <span className='text-xs text-slate-700'>{ex.institution_nom}</span>
                    </div>
                    
                    {(ex.institution_commune || ex.institution_pays) && (
                      <div className='text-xs text-slate-400'>
                        {[ex.institution_commune, ex.institution_pays].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {ex.depot_nom && (
                  <div>
                    <div className='flex items-center gap-1.5 mb-1.5'>
                      <Building2 className='w-3.5 h-3.5 text-teal-500' />
                      <span className='text-xs font-medium text-slate-400 uppercase tracking-wide'>Dépôt</span>
                    </div>
                    <div className='rounded-lg border border-slate-200 px-3 py-2.5'>
                      <div className='text-xs text-slate-600'>{ex.depot_nom}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {ex?.url_base && (
              <div className='flex items-start gap-2.5 border-t border-slate-100 pt-4'>
                <Monitor className='w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5' />
                <div className='min-w-0'>
                  <div className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5'>Accès numérique</div>
                  {ex.plateforme_code && (
                    <div className='text-xs font-medium text-slate-600 mb-0.5'>{ex.plateforme_code}</div>
                  )}
                  <a href={ex.url_base} target='_blank' rel='noopener noreferrer'
                    className='text-xs text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1 break-all'>
                    <Globe className='w-3 h-3 shrink-0' />{ex.url_base}
                  </a>
                </div>
              </div>
            )}
          </dl>
        </SectionCard>

        {/* ── Libellé ── */}
        <SectionCard title='Libellé' icon={Tag} accent='violet'
          headerRight={
            <SectionEditHeader isEditing={isEditingLabel} dirty={labelDirty} saving={savingLabel}
              onEdit={startEditingLabel} onSave={saveLabel} onCancel={cancelLabel} />
          }>
          {isEditingLabel ? (
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <input ref={labelRef}
                  value={couvertureLabelLocked ? uniteTitre : couvertureLabelDraft}
                  onChange={(e) => {
                    if (!couvertureLabelLocked) { setCouvertureLabelDraft(e.target.value); setLabelDirty(true) }
                  }}
                  readOnly={couvertureLabelLocked}
                  className={[
                    'w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none',
                    couvertureLabelLocked
                      ? 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                      : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-400',
                  ].join(' ')}
                  placeholder='Ex. Registre des naissances 1880–1885'
                />
                <button type='button'
                  onClick={() => {
                    if (couvertureLabelLocked) {
                      if (!window.confirm('Le libellé est normalement hérité du document. Voulez-vous le personnaliser ?')) return
                      setCouvertureLabelDraft(uniteTitre)
                    }
                    setCouvertureLabelLocked(v => !v)
                    setLabelDirty(true)
                    setTimeout(() => labelRef.current?.focus(), 50)
                  }}
                  className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50 shrink-0'
                  title={couvertureLabelLocked ? 'Personnaliser' : 'Hériter du document'}>
                  {couvertureLabelLocked
                    ? <Lock className='h-4 w-4 text-slate-700' />
                    : <Unlock className='h-4 w-4 text-slate-800' />}
                </button>
              </div>
              <p className='text-xs text-slate-500'>
                {couvertureLabelLocked ? 'Libellé hérité du titre du document.' : 'Libellé personnalisé pour cet exemplaire.'}
              </p>
            </div>
          ) : (
            <dl>
              <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5'>Libellé</dt>
              <dd className='text-sm text-slate-800'>
                {couvertureLabelLocked ? uniteTitre : (couvertureLabelDraft || uniteTitre)}
              </dd>
              {!couvertureLabelLocked && (
                <p className='text-xs text-violet-500 mt-1'>Libellé personnalisé</p>
              )}
            </dl>
          )}
        </SectionCard>

        {/* ── Statut & Localisation ── */}
        <SectionCard title='Statut & Localisation' icon={FileText} accent='indigo'
          headerRight={
            <SectionEditHeader isEditing={isEditingStatLoc} dirty={statLocDirty} saving={savingStatLoc}
              onEdit={startEditingStatLoc} onSave={saveStatLoc} onCancel={cancelStatLoc} />
          }>
          {isEditingStatLoc ? (
            <div className='space-y-5'>
              {/* Statut */}
              <div className='flex flex-wrap items-center gap-4'>
                <TriStateButton label='Acte manquant' mode='edit' value={c.is_missing} yesLabel='Oui' noLabel='Non'
                  onChange={(v) => { setDraft(prev => prev ? { ...prev, is_missing: v } as any : prev); setStatLocDirty(true) }} />
                <TriStateButton label='Lacune' mode='edit' value={c.lacune} yesLabel='Oui' noLabel='Non'
                  onChange={(v) => {
                    setDraft(prev => prev ? { ...prev, lacune: v, ...(v !== true ? { lacune_note: null, missing_ranges: [] } : {}) } as any : prev)
                    setStatLocDirty(true)
                  }} />
              </div>

              {c.lacune === true && (
                <div className='space-y-3 border-t border-slate-100 pt-4'>
                  <TextAreaField label='Détail lacune' readonly={false} value={String(c.lacune_note ?? '')}
                    onChange={(v) => { setDraft(prev => prev ? { ...prev, lacune_note: v } as any : prev); setStatLocDirty(true) }}
                    placeholder='Ex. feuillets manquants, vues 120–140 absentes…' minHeightClassName='min-h-[70px]' />
                  <div>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-xs font-medium text-slate-600'>Plages manquantes</span>
                      <button type='button' onClick={() => {
                        setDraft(prev => prev ? { ...prev, missing_ranges: [...(c.missing_ranges ?? []), { kind: 'vue', start: null, end: null, note: '' }] } as any : prev)
                        setStatLocDirty(true)
                      }} className='inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 transition'>
                        <Plus className='w-3 h-3' />Ajouter
                      </button>
                    </div>
                    {missingRanges.length === 0 && (
                      <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400'>Aucune plage renseignée.</div>
                    )}
                    {missingRanges.map((r: any, i: number) => (
                      <div key={i} className='rounded-lg border border-slate-200 p-3 mb-2'>
                        <div className='grid grid-cols-12 gap-2 items-end'>
                          <div className='col-span-3'>
                            <label className='block text-xs font-medium text-slate-600 mb-1'>Type</label>
                            <select className='w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs'
                              value={r.kind ?? 'vue'}
                              onChange={(e) => {
                                const next = [...missingRanges]; next[i] = { ...r, kind: e.target.value }
                                setDraft(prev => prev ? { ...prev, missing_ranges: next } as any : prev); setStatLocDirty(true)
                              }}>
                              <option value='vue'>Vues</option>
                              <option value='page'>Pages</option>
                            </select>
                          </div>
                          <div className='col-span-3'>
                            <label className='block text-xs font-medium text-slate-600 mb-1'>Début</label>
                            <Input inputMode='numeric' value={r.start ?? ''} placeholder='120'
                              onChange={(e) => {
                                const next = [...missingRanges]; next[i] = { ...r, start: toIntOrNull(e.target.value) }
                                setDraft(prev => prev ? { ...prev, missing_ranges: next } as any : prev); setStatLocDirty(true)
                              }} />
                          </div>
                          <div className='col-span-3'>
                            <label className='block text-xs font-medium text-slate-600 mb-1'>Fin</label>
                            <Input inputMode='numeric' value={r.end ?? ''} placeholder='140'
                              onChange={(e) => {
                                const next = [...missingRanges]; next[i] = { ...r, end: toIntOrNull(e.target.value) }
                                setDraft(prev => prev ? { ...prev, missing_ranges: next } as any : prev); setStatLocDirty(true)
                              }} />
                          </div>
                          <div className='col-span-3 flex justify-end'>
                            <button type='button' onClick={() => {
                              const next = missingRanges.filter((_, k) => k !== i)
                              setDraft(prev => prev ? { ...prev, missing_ranges: next } as any : prev); setStatLocDirty(true)
                            }} className='p-1.5 text-red-400 hover:text-red-600 transition'>
                              <Trash2 className='w-3.5 h-3.5' />
                            </button>
                          </div>
                          <div className='col-span-12'>
                            <label className='block text-xs font-medium text-slate-600 mb-1'>Note</label>
                            <Input value={String(r.note ?? '')} placeholder='ex. scan manquant…'
                              onChange={(e) => {
                                const next = [...missingRanges]; next[i] = { ...r, note: e.target.value }
                                setDraft(prev => prev ? { ...prev, missing_ranges: next } as any : prev); setStatLocDirty(true)
                              }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Localisation */}
              <div className='border-t border-slate-100 pt-4 space-y-3'>
                <div>
                  <label className='block text-xs font-medium text-slate-600 mb-1'>Type de numérotation</label>
                  <select className='w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
                    value={locUi.kind} onChange={(e) => updateLocUi({ kind: e.target.value })}>
                    {paginationTypes.map(pt => <option key={pt.id} value={pt.code}>{pt.label}</option>)}
                  </select>
                </div>
                <RadioGroup value={locUi.mode}
                  onValueChange={(v) => updateLocUi({ mode: v as LocMode, start: '', end: '', raw: '' })}
                  className='flex flex-wrap gap-4'>
                  {(['num', 'range', 'raw'] as LocMode[]).map(m => (
                    <div key={m} className='flex items-center gap-2'>
                      <RadioGroupItem value={m} id={`loc-${m}`} />
                      <label htmlFor={`loc-${m}`} className='text-sm text-slate-700'>
                        {m === 'num' ? 'Numéro' : m === 'range' ? 'Plage (début/fin)' : 'Texte libre'}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
                <div className='grid grid-cols-12 gap-4'>
                  {locUi.mode === 'raw' && (
                    <div className='col-span-12'>
                      <Input value={locUi.raw} onChange={(e) => updateLocUi({ raw: e.target.value })}
                        placeholder='Ex. f°12r–f°13v ; vue 23 ; page 120' />
                    </div>
                  )}
                  {locUi.mode === 'num' && (
                    <div className='col-span-4'>
                      <label className='block text-xs font-medium text-slate-600 mb-1'>Numéro</label>
                      <Input inputMode='numeric' value={locUi.start}
                        onChange={(e) => updateLocUi({ start: e.target.value, end: e.target.value })} placeholder='120' />
                    </div>
                  )}
                  {locUi.mode === 'range' && (
                    <>
                      <div className='col-span-4'>
                        <label className='block text-xs font-medium text-slate-600 mb-1'>Début</label>
                        <Input inputMode='numeric' value={locUi.start}
                          onChange={(e) => updateLocUi({ start: e.target.value })} placeholder='23' />
                      </div>
                      <div className='col-span-4'>
                        <label className='block text-xs font-medium text-slate-600 mb-1'>Fin</label>
                        <Input inputMode='numeric' value={locUi.end}
                          onChange={(e) => updateLocUi({ end: e.target.value })} placeholder='24' />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <dl className='space-y-4'>
              <FieldGrid>
                <div>
                  <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Acte manquant</dt>
                  <dd><TriStatePill value={c.is_missing} /></dd>
                </div>
                <div>
                  <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Lacune</dt>
                  <dd><TriStatePill value={c.lacune} /></dd>
                </div>
              </FieldGrid>
              {c.lacune === true && (
                <div className='space-y-2 border-t border-slate-100 pt-3'>
                  <FieldItem label='Détail lacune' value={c.lacune_note} />
                  {missingRanges.length > 0 && (
                    <div>
                      <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Plages manquantes</dt>
                      <dd className='space-y-0.5'>
                        {missingRanges.map((r: any, i: number) => (
                          <div key={i} className='text-sm text-slate-700'>
                            {r.kind ?? 'vue'} {r.start}–{r.end}{r.note ? ` — ${r.note}` : ''}
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}
                </div>
              )}
              <div className='border-t border-slate-100 pt-3'>
                <FieldGrid>
                  <FieldItem label='Type de numérotation' value={paginationTypes.find(pt => pt.code === c.loc_kind)?.label ?? c.loc_kind} />
                  <FieldItem label='Position' value={locDisplay} />
                </FieldGrid>
              </div>
            </dl>
          )}
        </SectionCard>

        {/* ── Marques & signes ── */}
        <SectionCard title='Marques & signes' icon={PenLine} accent='violet'
          headerRight={
            <SectionEditHeader isEditing={isEditingMarques} dirty={marquesDirty} saving={savingMarques}
              onEdit={startEditingMarques} onSave={saveMarques} onCancel={cancelMarques} />
          }>
          {isEditingMarques ? (
            <div className='space-y-4'>
              <FieldGrid>
                <div className='space-y-2'>
                  <TriStateButton label='Mentions marginales' mode='edit' value={c.marginal_mentions_present}
                    onChange={(v) => { setDraft(prev => prev ? { ...prev, marginal_mentions_present: v, marginal_mentions_count: v === true ? c.marginal_mentions_count : null } as any : prev); setMarquesDirty(true) }} />
                  <Input inputMode='numeric' value={c.marginal_mentions_count ?? ''} disabled={c.marginal_mentions_present !== true}
                    placeholder='Nombre' onChange={(e) => { setDraft(prev => prev ? { ...prev, marginal_mentions_count: toIntOrNull(e.target.value) } as any : prev); setMarquesDirty(true) }} />
                </div>
                <div className='space-y-2'>
                  <TriStateButton label='Signatures' mode='edit' value={c.signatures_present}
                    onChange={(v) => { setDraft(prev => prev ? { ...prev, signatures_present: v, signatures_count: v === true ? c.signatures_count : null } as any : prev); setMarquesDirty(true) }} />
                  <Input inputMode='numeric' value={c.signatures_count ?? ''} disabled={c.signatures_present !== true}
                    placeholder='Nombre' onChange={(e) => { setDraft(prev => prev ? { ...prev, signatures_count: toIntOrNull(e.target.value) } as any : prev); setMarquesDirty(true) }} />
                </div>
                <div className='space-y-2'>
                  <TriStateButton label='Ratures en marge' mode='edit' value={c.marginal_crossouts_present}
                    onChange={(v) => { setDraft(prev => prev ? { ...prev, marginal_crossouts_present: v, marginal_crossouts_count: v === true ? c.marginal_crossouts_count : null } as any : prev); setMarquesDirty(true) }} />
                  <Input inputMode='numeric' value={c.marginal_crossouts_count ?? ''} disabled={c.marginal_crossouts_present !== true}
                    placeholder='Nombre' onChange={(e) => { setDraft(prev => prev ? { ...prev, marginal_crossouts_count: toIntOrNull(e.target.value) } as any : prev); setMarquesDirty(true) }} />
                </div>
              </FieldGrid>
              <div className='border-t border-slate-100 pt-4'>
                <FieldGrid>
                  <TextAreaField label='Marques / signes' readonly={false} value={String(c.marks ?? '')}
                    onChange={(v) => { setDraft(prev => prev ? { ...prev, marks: v } as any : prev); setMarquesDirty(true) }}
                    placeholder='Ex. graphie difficile, index absent…' minHeightClassName='min-h-[80px]' />
                  <TextAreaField label='Note' readonly={false} value={String(draft.note ?? '')}
                    onChange={(v) => { setDraft(prev => prev ? { ...prev, note: v } : prev); setMarquesDirty(true) }}
                    placeholder='Ex. coin déchiré…' minHeightClassName='min-h-[80px]' />
                </FieldGrid>
              </div>
            </div>
          ) : (
            <dl className='space-y-4'>
              <FieldGrid>
                <div>
                  <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Mentions marginales</dt>
                  <dd className='flex items-center gap-2'>
                    <TriStatePill value={c.marginal_mentions_present} />
                    {c.marginal_mentions_present === true && c.marginal_mentions_count != null && (
                      <span className='text-xs text-slate-400'>× {c.marginal_mentions_count}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Signatures</dt>
                  <dd className='flex items-center gap-2'>
                    <TriStatePill value={c.signatures_present} />
                    {c.signatures_present === true && c.signatures_count != null && (
                      <span className='text-xs text-slate-400'>× {c.signatures_count}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Ratures en marge</dt>
                  <dd className='flex items-center gap-2'>
                    <TriStatePill value={c.marginal_crossouts_present} />
                    {c.marginal_crossouts_present === true && c.marginal_crossouts_count != null && (
                      <span className='text-xs text-slate-400'>× {c.marginal_crossouts_count}</span>
                    )}
                  </dd>
                </div>
              </FieldGrid>
              {(c.marks || draft.note) && (
                <div className='border-t border-slate-100 pt-3'>
                  <FieldGrid>
                    <FieldItem label='Marques / signes' value={c.marks} />
                    <FieldItem label='Note' value={draft.note} />
                  </FieldGrid>
                </div>
              )}
            </dl>
          )}
        </SectionCard>

        {/* ── Observations ── */}
        <SectionCard title='Observations' icon={Eye} accent='teal'
          headerRight={
            <SectionEditHeader isEditing={isEditingObs} dirty={obsDirty} saving={savingObs}
              onEdit={startEditingObs} onSave={saveObs} onCancel={cancelObs} />
          }>
          {isEditingObs ? (
            <div className='space-y-5'>
              <div>
                <p className='text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3'>État & reproduction</p>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <div className='text-xs font-medium text-slate-600 mb-1'>Condition physique</div>
                    <RefSinglePickerSmart table='ref_physical_condition' mode='edit' actionsInvisible={false}
                      value={c.physical_condition_ref ?? null}
                      onChange={(v) => { setDraft(prev => prev ? { ...prev, physical_condition_ref: v } as any : prev); setObsDirty(true) }} />
                  </div>
                  <div>
                    <div className='text-xs font-medium text-slate-600 mb-1'>Qualité de reproduction</div>
                    <RefSinglePickerSmart table='ref_repro_quality' mode='edit' actionsInvisible={false}
                      value={c.repro_quality_ref ?? null}
                      onChange={(v) => { setDraft(prev => prev ? { ...prev, repro_quality_ref: v } as any : prev); setObsDirty(true) }} />
                  </div>
                  <div className='col-span-2'>
                    <div className='text-xs font-medium text-slate-600 mb-1'>Dommages</div>
                    <RefSinglePickerSmart table='ref_document_damage_kinds' mode='edit' actionsInvisible={false} multi
                      value={c.document_damage_kinds_ids ?? null}
                      onChange={(v) => { setDraft(prev => prev ? { ...prev, document_damage_kinds_ids: v } as any : prev); setObsDirty(true) }} />
                  </div>
                  <div className='col-span-2'>
                    <TextAreaField label='Notes reproduction' readonly={false} value={String(c.repro_notes ?? '')}
                      onChange={(v) => { setDraft(prev => prev ? { ...prev, repro_notes: v } as any : prev); setObsDirty(true) }}
                      placeholder='Ex. scan flou, contraste insuffisant…' minHeightClassName='min-h-[70px]' />
                  </div>
                  <div className='col-span-2'>
                    <TextAreaField label='Notes dommages' readonly={false} value={String(c.damage_notes ?? '')}
                      onChange={(v) => { setDraft(prev => prev ? { ...prev, damage_notes: v } as any : prev); setObsDirty(true) }}
                      placeholder='Ex. coin déchiré, encre passée…' minHeightClassName='min-h-[70px]' />
                  </div>
                </div>
              </div>
              <div className='border-t border-slate-100 pt-4'>
                <p className='text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3'>Écriture & langue</p>
                <div className='grid grid-cols-12 gap-4'>
                  <div className='col-span-4'>
                    <div className='text-xs font-medium text-slate-600 mb-1'>Langue</div>
                    <RefSinglePickerSmart table='ref_langues' mode='edit' actionsInvisible={false}
                      value={c.langue_ref ?? null}
                      onChange={(v) => { setDraft(prev => prev ? { ...prev, langue_ref: v } as any : prev); setObsDirty(true) }} />
                  </div>
                  <div className='col-span-4'>
                    <div className='text-xs font-medium text-slate-600 mb-1'>Écriture</div>
                    <RefSinglePickerSmart table='ref_ecritures' mode='edit' actionsInvisible={false}
                      value={c.ecriture_ref ?? null}
                      onChange={(v) => { setDraft(prev => prev ? { ...prev, ecriture_ref: v } as any : prev); setObsDirty(true) }} />
                  </div>
                  {c.ecriture_ref && (
                    <div className='col-span-4'>
                      <div className='text-xs font-medium text-slate-600 mb-1'>Lisibilité</div>
                      <RefSinglePickerSmart table='ref_handwriting_legibility' mode='edit' actionsInvisible={false}
                        value={c.handwriting_legibility_ref ?? null}
                        onChange={(v) => { setDraft(prev => prev ? { ...prev, handwriting_legibility_ref: v } as any : prev); setObsDirty(true) }} />
                    </div>
                  )}
                  {c.ecriture_ref && (
                    <div className='col-span-12'>
                      <div className='text-xs font-medium text-slate-600 mb-1'>Caractéristiques de lisibilité</div>
                      <RefSinglePickerSmart table='ref_document_readability_features' mode='edit' actionsInvisible={false} multi
                        value={c.document_readability_features_ids ?? null}
                        onChange={(v) => { setDraft(prev => prev ? { ...prev, document_readability_features_ids: v } as any : prev); setObsDirty(true) }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <dl className='space-y-4'>
              <FieldGrid>
                <div>
                  <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Condition physique</dt>
                  <dd>
                    <RefSinglePickerSmart table='ref_physical_condition' mode='view' actionsInvisible={true}
                      value={c.physical_condition_ref ?? null} onChange={() => {}} />
                  </dd>
                </div>
                <div>
                  <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Qualité de reproduction</dt>
                  <dd>
                    <RefSinglePickerSmart table='ref_repro_quality' mode='view' actionsInvisible={true}
                      value={c.repro_quality_ref ?? null} onChange={() => {}} />
                  </dd>
                </div>
                {(c.document_damage_kinds_ids ?? []).length > 0 && (
                  <div className='sm:col-span-2'>
                    <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Dommages</dt>
                    <dd>
                      <RefSinglePickerSmart table='ref_document_damage_kinds' mode='view' actionsInvisible={true} multi
                        value={c.document_damage_kinds_ids} onChange={() => {}} />
                    </dd>
                  </div>
                )}
                <FieldItem label='Notes reproduction' value={c.repro_notes} />
                <FieldItem label='Notes dommages' value={c.damage_notes} />
              </FieldGrid>
              {(c.langue_ref || c.ecriture_ref) && (
                <div className='border-t border-slate-100 pt-3'>
                  <FieldGrid>
                    <div>
                      <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Langue</dt>
                      <dd>
                        <RefSinglePickerSmart table='ref_langues' mode='view' actionsInvisible={true}
                          value={c.langue_ref ?? null} onChange={() => {}} />
                      </dd>
                    </div>
                    <div>
                      <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Écriture</dt>
                      <dd>
                        <RefSinglePickerSmart table='ref_ecritures' mode='view' actionsInvisible={true}
                          value={c.ecriture_ref ?? null} onChange={() => {}} />
                      </dd>
                    </div>
                    {c.ecriture_ref && c.handwriting_legibility_ref && (
                      <div>
                        <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Lisibilité</dt>
                        <dd>
                          <RefSinglePickerSmart table='ref_handwriting_legibility' mode='view' actionsInvisible={true}
                            value={c.handwriting_legibility_ref} onChange={() => {}} />
                        </dd>
                      </div>
                    )}
                    {c.ecriture_ref && (c.document_readability_features_ids ?? []).length > 0 && (
                      <div className='sm:col-span-2'>
                        <dt className='text-xs font-medium text-slate-400 uppercase tracking-wide mb-1'>Caractéristiques de lisibilité</dt>
                        <dd>
                          <RefSinglePickerSmart table='ref_document_readability_features' mode='view' actionsInvisible={true} multi
                            value={c.document_readability_features_ids} onChange={() => {}} />
                        </dd>
                      </div>
                    )}
                  </FieldGrid>
                </div>
              )}
            </dl>
          )}
        </SectionCard>

      </main>
    </div>
  )
}
