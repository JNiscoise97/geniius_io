import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronRight, ChevronDown, Layers, Bell, FileText, ScrollText,
  MoreHorizontal, CheckCircle2, Clock, AlertCircle, Plus, Filter,
  FolderOpen, Tag, Landmark, Newspaper, ExternalLink, Globe, Copy,
  Sparkles, Library, BookOpen, X,
  AlertTriangle, Loader2, MonitorCheck, University,
  Lock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { usePatrimoine } from './usePatrimoine'
import {
  qualifierSource, decrireDocument, rattacherDocument, fetchRoleDocumentOptions,
} from './patrimoine.service'
import type {
  PatrimoineSource as Source,
  PatrimoineDocument as Document,
  PatrimoineCorpus as Corpus,
  SourceType, SourceStatut, Acces, DocStatut, DocRole, NiveauConservation, CorpusType,
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
  a_transcrire: { label: 'À transcrire', color: 'text-gray-500 bg-gray-50 border-gray-200',          dot: 'bg-gray-300' },
  annote:       { label: 'Annoté',       color: 'text-violet-700 bg-violet-50 border-violet-200',    dot: 'bg-violet-500' },
  en_attente:   { label: 'En attente',   color: 'text-orange-700 bg-orange-50 border-orange-200',    dot: 'bg-orange-400' },
}

const ROLE_CONFIG: Record<DocRole, { label: string; color: string }> = {
  ACTE_PRIMAIRE:           { label: 'Acte',                    color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  INSTRUMENT_DE_RECHERCHE: { label: 'Instrument de recherche', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  REGISTRE_COMPILE:        { label: 'Registre',                color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
}

const CONSERVATION_CONFIG: Record<NiveauConservation, { label: string; color: string }> = {
  bon:          { label: 'Bon état',     color: 'text-emerald-600' },
  moyen:        { label: 'État moyen',   color: 'text-amber-600' },
  degrade:      { label: 'Dégradé',      color: 'text-orange-600' },
  fragmentaire: { label: 'Fragmentaire', color: 'text-rose-600' },
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

function SlideOver({ open, onClose, title, subtitle, children, footer, wide }: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer: React.ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'} bg-white shadow-2xl flex flex-col`}>
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

const DOMAINE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'etat-civil',  label: 'État civil' },
  { value: 'foncier',     label: 'Foncier' },
  { value: 'notarial',    label: 'Notarial' },
  { value: 'paroissial',  label: 'Paroissial' },
  { value: 'annuaire',    label: 'Annuaire' },
]


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

function DecrireDocumentSheet({ doc, roleOptions, onClose, onDone }: {
  doc: Document
  roleOptions: RoleOption[]
  onClose: () => void
  onDone: () => void
}) {
  const [domaine, setDomaine] = useState('')
  const [roleRef, setRoleRef] = useState('')
  const [cote, setCote] = useState(doc.cote === '?' ? '' : doc.cote)
  const [periode, setPeriode] = useState(doc.date_document ?? '')
  const [note, setNote] = useState(doc.note ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    const meta: Record<string, unknown> = {}
    if (cote.trim()) meta.cote = cote.trim()
    if (note.trim()) meta.note = note.trim()
    if (domaine) meta.domaine = domaine

    const { error } = await decrireDocument(doc.id, {
      role_document_ref: roleRef || null,
      couverture_label: periode || null,
      metadonnees: Object.keys(meta).length ? meta : null,
    })
    setSubmitting(false)
    if (!error) onDone()
  }

  return (
    <SlideOver open title="Décrire le document" subtitle={doc.titre} onClose={onClose}
      footer={<>
        <button onClick={onClose} disabled={submitting}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <CheckCircle2 className="w-3.5 h-3.5" />Décrire
        </button>
      </>}
    >
      <Field label="Type de document">
        <select value={domaine} onChange={e => setDomaine(e.target.value)} className={selectCls} autoFocus>
          <option value="">À préciser</option>
          {DOMAINE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Rôle">
        <select value={roleRef} onChange={e => setRoleRef(e.target.value)} className={selectCls}>
          <option value="">À préciser</option>
          {roleOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Cote / référence">
        <input value={cote} onChange={e => setCote(e.target.value)}
          placeholder="ex. EC DESHAIES 1889 N" className={`${inputCls} font-mono`} />
      </Field>
      <Field label="Couverture temporelle">
        <input value={periode} onChange={e => setPeriode(e.target.value)}
          placeholder="ex. 1889 ou 1880–1920" className={inputCls} />
      </Field>
      <Field label="Note">
        <input value={note} onChange={e => setNote(e.target.value)}
          placeholder="Observations sur ce document…" className={inputCls} />
      </Field>
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

// ─── Document row ─────────────────────────────────────────────────────────────

function DocumentRow({ doc, depth = 0, sources, docs }: {
  doc: Document
  depth?: number
  sources: Source[]
  docs: Document[]
}) {
  const typeConf = doc.type_document ? TYPE_CONFIG[doc.type_document] : null
  const TypeIcon = typeConf?.icon ?? FileText
  const statut = STATUT_DOC_CONFIG[doc.statut]
  const role = doc.role ? ROLE_CONFIG[doc.role] : null
  const conservation = doc.niveau_conservation ? CONSERVATION_CONFIG[doc.niveau_conservation] : null
  const source = doc.source_id ? sources.find(s => s.id === doc.source_id) : null
  const nbExemplaires = doc.exemplaire_groupe_id
    ? docs.filter(d => d.exemplaire_groupe_id === doc.exemplaire_groupe_id).length
    : 0

  return (
    <div
      className={`group border-b border-gray-50 last:border-0 ${depth > 0 ? 'bg-gray-50/50' : ''}`}
      style={{ paddingLeft: depth > 0 ? `${depth * 1.5 + 1}rem` : '1rem' }}
    >
<div className="flex items-start gap-4 py-3 pr-4 hover:bg-white transition-colors cursor-pointer">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${typeConf ? `${typeConf.bg} ${typeConf.border}` : 'bg-gray-50 border-gray-200'}`}>
          <TypeIcon className={`w-3.5 h-3.5 ${typeConf?.color ?? 'text-gray-400'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
              {doc.titre}
            </span>
            {role && (
              <span className={`text-xs font-medium rounded border px-1.5 py-0.5 shrink-0 ${role.color}`}>
                {role.label}
              </span>
            )}
            {nbExemplaires > 1 && (
              <span className="text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5 flex items-center gap-1 shrink-0">
                <Copy className="w-3 h-3" />{nbExemplaires} exemplaires
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">{doc.cote}</span>
            {source && <><span className="text-gray-200">·</span><span className="text-xs text-gray-400">{source.institution_conservation}</span></>}
            {doc.note && <><span className="text-gray-200">·</span><span className="text-xs text-gray-400 italic">{doc.note}</span></>}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400 w-20 text-right">{doc.date_document ?? '—'}</span>
          {conservation && (
            <span className={`text-xs ${conservation.color} w-20 text-right`}>{conservation.label}</span>
          )}
          {doc.mentions_detectees != null ? (
            <span className="text-xs text-gray-500 w-24 text-right flex items-center justify-end gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />{doc.mentions_detectees} mentions
            </span>
          ) : <span className="w-24" />}
          <span className={`text-xs font-medium rounded-full border px-2.5 py-0.5 flex items-center gap-1.5 w-28 ${statut.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statut.dot}`} />{statut.label}
          </span>
          <div className="flex items-center gap-1.5 w-16 justify-end">
            {doc.url && (
              <a href={doc.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                className="text-gray-300 hover:text-indigo-500 transition-colors">
                <Globe className="w-3.5 h-3.5" />
              </a>
            )}
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
          </div>
        </div>
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
                  <p className="text-sm font-medium text-gray-900 mb-0.5">{doc.titre}</p>
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
                    <p className="text-sm font-medium text-gray-900 mb-0.5">{doc.titre}</p>
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
    supabase.from('ref_plateforme_kind').select('id, label, description, categorie').order('categorie, label').then(({ data }) => {
      if (data) setKindOptions(data.map((r: any) => ({ id: r.id, label: r.label, description: r.description ?? null, categorie: r.categorie ?? null })))
    })
  }, [])

  async function handleSubmit() {
    if (!label.trim() || !code.trim()) return
    setSubmitting(true); setError(null)
    const { error: err } = await supabase.from('ref_plateformes').insert({
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
    supabase.from('ref_institution_type').select('id, label').order('label').then(({ data }) => {
      if (data) setTypeOptions(data as Array<{ id: string; label: string }>)
    })
  }, [])

  async function handleSubmit() {
    if (!nom.trim() || !typeRef) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.from('ref_institutions').insert({
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

export function SourcesCorpusPage() {
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
    if (tab !== 'Plateformes' || plateformesLoaded.current) return
    plateformesLoaded.current = true
    setPlateformesLoading(true)
    supabase
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
  }, [tab, plateformesRefreshKey])

  useEffect(() => {
    if (tab !== 'Institutions' || institutionsLoaded.current) return
    institutionsLoaded.current = true
    setInstitutionsLoading(true)
    Promise.all([
      supabase.from('ref_institutions').select('id, nom, sigle, pays, commune, site_web, ref_institution_type!type_institution_ref(label)').order('nom'),
      supabase.from('ref_depots').select('institution_id'),
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
  }, [tab, institutionsRefreshKey])

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
    { key: 'a_transcrire', label: 'À transcrire' },
  ]

  const filteredDocs = activeDocs.filter(d => {
    const matchSource = sourceDocFilter === 'tous' || d.source_id === sourceDocFilter
    const matchStatut = statutDocFilter === 'tous' || d.statut === statutDocFilter
    const q = search.toLowerCase()
    const matchSearch = !q || d.titre.toLowerCase().includes(q) || d.cote.toLowerCase().includes(q)
    return matchSource && matchStatut && matchSearch
  })

  const topLevelDocs = filteredDocs

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

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-900 tracking-tight">REBOND</span>
          <span className="text-gray-300 text-sm">/</span>
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            <Library className="w-4 h-4" />Patrimoine documentaire
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-1">
            <Bell className="w-5 h-5 text-gray-400" />
            {nbAlerts > 0 && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
          </button>
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">JB</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Hero + actions */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Patrimoine documentaire</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sources, documents et corpus — le socle de toute connaissance dans REBOND.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/mock/referencer-document')}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
            >
              <Search className="w-4 h-4" />
              Référencer un document
            </button>
            <button onClick={() => navigate('/mock/sources-identifier')}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" />
              Créer une source
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

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <div className="w-8 shrink-0" />
                <div className="flex-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Titre / Cote</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide w-20 text-right">Date</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide w-20 text-right">Conservation</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 text-right">Mentions</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide w-28">Statut</div>
                <div className="w-16" />
              </div>
              {topLevelDocs.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun document trouvé.</p>
                </div>
              ) : (
                topLevelDocs.map(doc => (
                  <DocumentRow key={doc.id} doc={doc} depth={0} sources={sources} docs={docs} />
                ))
              )}
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
              ? () => navigate(`/mock/enrichir-exemplaire/${c.citation_id}`)
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
                        <div key={p.id} onClick={() => navigate(`/mock/plateforme/${p.id}`)} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer">
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
                    <div key={i.id} onClick={() => navigate(`/mock/institution/${i.id}`)}
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
