import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronDown, Loader2, AlertCircle, Globe, Building2,
  University, Monitor, Search,
  Save, AlertTriangle, CheckCircle2, Pencil, Settings, Trash2, Plus,
  Calendar, Check, X, LayoutDashboard, Library,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

type InstitutionType = { id: string; label: string; description: string | null; categorie: string | null }
type DepotType = { id: string; code: string; label: string; is_online: boolean }
type ModeAcces = { id: string; code: string; label: string }
type PlateformeOption = { id: string; code: string; label: string; site_web: string | null; kind_label: string | null }

type Institution = {
  id: string; nom: string; sigle: string | null; pays: string | null
  region: string | null; departement: string | null; commune: string | null
  note: string | null
  type_ref: string | null; type_label: string | null; type_description: string | null; type_categorie: string | null
  plateforme_ref: string | null; plateforme_label: string | null; plateforme_site_web: string | null; plateforme_kind_label: string | null
}

type Depot = {
  id: string; nom: string | null
  type_ref: string | null; type_code: string | null; type_label: string | null; type_is_online: boolean
  meme_adresse_institution: boolean
  adresse: string | null; ville: string | null; code_postal: string | null; pays: string | null
  note: string | null
  conditions_communication: string | null; modalites_repro: string | null; delais_communication: string | null
  mode_acces_ref: string | null; mode_acces_code: string | null; mode_acces_label: string | null
  plateforme_ref: string | null; plateforme_label: string | null; plateforme_site_web: string | null; plateforme_kind_label: string | null
}

type InstitutionForm = {
  nom: string; sigle: string; type_ref: string; plateforme_ref: string
  commune: string; departement: string; region: string; pays: string; note: string
}

type DepotForm = {
  id: string; nom: string; type_ref: string
  meme_adresse_institution: boolean
  adresse: string; ville: string; code_postal: string; pays: string
  note: string
  conditions_communication: string; modalites_repro: string; delais_communication: string
  mode_acces_ref: string; plateforme_ref: string
}

type NewDepotForm = Omit<DepotForm, 'id'>

function institutionToForm(inst: Institution): InstitutionForm {
  return {
    nom: inst.nom ?? '', sigle: inst.sigle ?? '', type_ref: inst.type_ref ?? '',
    plateforme_ref: inst.plateforme_ref ?? '', commune: inst.commune ?? '',
    departement: inst.departement ?? '', region: inst.region ?? '',
    pays: inst.pays ?? '', note: inst.note ?? '',
  }
}

function depotToForm(d: Depot): DepotForm {
  return {
    id: d.id, nom: d.nom ?? '', type_ref: d.type_ref ?? '',
    meme_adresse_institution: d.meme_adresse_institution,
    adresse: d.adresse ?? '', ville: d.ville ?? '', code_postal: d.code_postal ?? '',
    pays: d.pays ?? '',
    note: d.note ?? '', conditions_communication: d.conditions_communication ?? '',
    modalites_repro: d.modalites_repro ?? '', delais_communication: d.delais_communication ?? '',
    mode_acces_ref: d.mode_acces_ref ?? '', plateforme_ref: d.plateforme_ref ?? '',
  }
}

function emptyDepotForm(): NewDepotForm {
  return {
    nom: '', type_ref: '', meme_adresse_institution: true,
    adresse: '', ville: '', code_postal: '', pays: '',
    note: '',
    conditions_communication: '', modalites_repro: '', delais_communication: '',
    mode_acces_ref: '', plateforme_ref: '',
  }
}

// ── Components ────────────────────────────────────────────────────────────────

type Accent = 'indigo' | 'teal' | 'violet'
const ACCENT: Record<Accent, { icon: string; title: string }> = {
  indigo: { icon: 'text-indigo-500', title: 'text-indigo-700' },
  teal:   { icon: 'text-teal-500',   title: 'text-teal-700' },
  violet: { icon: 'text-violet-500', title: 'text-violet-700' },
}

function SectionCard({ title, icon: Icon, accent = 'indigo', headerRight, children }: {
  title: string; icon: React.ElementType; accent?: Accent
  headerRight?: React.ReactNode; children: React.ReactNode
}) {
  const a = ACCENT[accent]
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3 bg-slate-50">
        <Icon className={`w-4 h-4 ${a.icon} shrink-0`} />
        <h2 className={`text-sm font-semibold ${a.title} flex-1`}>{title}</h2>
        {headerRight}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">{children}</div>
}

function FieldItem({ label, value, url, mono }: {
  label: string; value: string | null | undefined; url?: boolean; mono?: boolean
}) {
  const empty = value == null || value === ''
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className={`text-sm ${mono ? 'font-mono' : ''} ${empty ? 'text-slate-300 italic' : 'text-slate-800'}`}>
        {empty ? '—' : url ? (
          <a href={value!} target="_blank" rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors break-all">
            <Globe className="w-3.5 h-3.5 shrink-0" />{value}
          </a>
        ) : value}
      </dd>
    </div>
  )
}

function EditField({ label, value, onChange, mono, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; mono?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition ${mono ? 'font-mono' : ''}`} />
    </div>
  )
}

function EditTextarea({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition resize-none" />
    </div>
  )
}

function SearchableTypeSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: InstitutionType[]
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

  const grouped = filtered.reduce<Record<string, InstitutionType[]>>((acc, o) => {
    const cat = o.categorie ?? '—'
    ;(acc[cat] ??= []).push(o)
    return acc
  }, {})

  const selected = options.find(o => o.id === value)

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Type</label>
      <button ref={btnRef} type="button" onClick={openDropdown}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-left shadow-sm hover:bg-slate-50 transition">
        <span className={selected ? 'text-slate-900' : 'text-slate-400 italic'}>
          {selected ? selected.label : 'À préciser'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>
      {open && dropRect && (
        <div ref={dropRef}
          style={{ position: 'fixed', top: dropRect.top, left: dropRect.left, width: dropRect.width }}
          className="rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <button type="button" onClick={() => { onChange(''); setOpen(false); setQuery('') }}
              className="w-full px-3 py-2 text-sm text-left text-slate-400 italic hover:bg-slate-50 transition-colors">
              À préciser
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-400 text-center">Aucun résultat</p>
            ) : Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{cat}</span>
                </div>
                {items.map(o => (
                  <button key={o.id} type="button"
                    onClick={() => { onChange(o.id); setOpen(false); setQuery('') }}
                    className={`w-full px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${o.id === value ? 'bg-indigo-50' : ''}`}>
                    <div className="text-sm font-medium text-slate-900">{o.label}</div>
                    {o.description && (
                      <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{o.description}</div>
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

function DepotTypeSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: DepotType[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const selected = options.find(o => o.id === value)
  const sorted = [...options].sort((a, b) => {
    if (a.is_online !== b.is_online) return a.is_online ? 1 : -1
    return a.label.localeCompare(b.label, 'fr')
  })

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</label>
      <div className="relative" ref={ref}>
        <button type="button" onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-left shadow-sm hover:bg-slate-50 transition">
          {selected ? (
            <>
              <span className={`w-2 h-2 rounded-full shrink-0 ${selected.is_online ? 'bg-teal-400' : 'bg-slate-400'}`} />
              <span className="flex-1 text-slate-900">{selected.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${selected.is_online ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                {selected.is_online ? 'En ligne' : 'Physique'}
              </span>
            </>
          ) : (
            <span className="flex-1 text-slate-400 italic">Sélectionner un type…</span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg z-10 overflow-hidden py-1">
            {sorted.map((o, idx) => {
              const prevOnline = idx > 0 ? sorted[idx - 1].is_online : null
              const showDivider = prevOnline !== null && prevOnline !== o.is_online
              return (
                <div key={o.id}>
                  {showDivider && <div className="border-t border-slate-100 my-1" />}
                  <button type="button" onClick={() => { onChange(o.id); setOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition ${
                      o.id === value ? 'bg-slate-50 font-medium' : 'hover:bg-slate-50'
                    }`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${o.is_online ? 'bg-teal-400' : 'bg-slate-400'}`} />
                    <span className="flex-1 text-slate-900">{o.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${o.is_online ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                      {o.is_online ? 'En ligne' : 'Physique'}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PlateformeSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: PlateformeOption[]
}) {
  const [open, setOpen] = useState(false)
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const openDropdown = () => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setDropRect({ top: r.bottom + 4, left: r.left, width: r.width })
    setOpen(v => !v)
  }

  const selected = options.find(o => o.id === value)

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</label>
      <button ref={btnRef} type="button" onClick={openDropdown}
        className="w-full flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-left shadow-sm hover:bg-slate-50 transition">
        <Monitor className="w-3.5 h-3.5 text-teal-500 shrink-0" />
        {selected ? (
          <span className="flex-1 text-slate-900">{selected.label}</span>
        ) : (
          <span className="flex-1 text-slate-400 italic">Sélectionner une plateforme…</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>
      {open && dropRect && (
        <div ref={dropRef}
          style={{ position: 'fixed', top: dropRect.top, left: dropRect.left, width: dropRect.width }}
          className="rounded-lg border border-slate-200 bg-white shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
          <button type="button" onClick={() => { onChange(''); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-slate-400 italic hover:bg-slate-50 transition">
            Aucune
          </button>
          {options.map(o => (
            <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false) }}
              className={`w-full flex items-start gap-2 px-3 py-2 text-sm text-left transition ${
                o.id === value ? 'bg-slate-50' : 'hover:bg-slate-50'
              }`}>
              <Monitor className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900">{o.label}</div>
                {o.site_web && (
                  <div className="text-xs text-slate-400 truncate">{o.site_web}</div>
                )}
              </div>
              {o.kind_label && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 shrink-0 whitespace-nowrap self-start">
                  {o.kind_label}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function modeAccesIcon(code: string) {
  if (code === 'libre') return <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
  if (code === 'sur_rdv')     return <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
  if (code === 'interdit')    return <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
  return null
}

function ModeAccesSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: ModeAcces[]
}) {
  const [open, setOpen] = useState(false)
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const openDropdown = () => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setDropRect({ top: r.bottom + 4, left: r.left, width: r.width })
    setOpen(v => !v)
  }

  const selected = options.find(o => o.id === value)

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</label>
      <button ref={btnRef} type="button" onClick={openDropdown}
        className="w-full flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-left shadow-sm hover:bg-slate-50 transition">
        {selected ? (
          <>
            {modeAccesIcon(selected.code)}
            <span className="flex-1 text-slate-900">{selected.label}</span>
          </>
        ) : (
          <span className="flex-1 text-slate-400 italic">À préciser</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>
      {open && dropRect && (
        <div ref={dropRef}
          style={{ position: 'fixed', top: dropRect.top, left: dropRect.left, width: dropRect.width }}
          className="rounded-lg border border-slate-200 bg-white shadow-lg z-50 py-1 overflow-hidden">
          <button type="button" onClick={() => { onChange(''); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-slate-400 italic hover:bg-slate-50 transition">
            À préciser
          </button>
          {options.map(o => (
            <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition ${
                o.id === value ? 'bg-slate-50 font-medium' : 'hover:bg-slate-50'
              }`}>
              {modeAccesIcon(o.code)}
              <span className="text-slate-900">{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EditCheckbox({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-300 text-teal-500 focus:ring-teal-400" />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}

function DirtyBadge({ saving, dirty }: { saving: boolean; dirty: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
      saving ? 'border-slate-200 bg-slate-50 text-slate-700'
      : dirty ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-slate-200 bg-slate-50 text-slate-500'
    }`}>
      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : dirty ? <AlertTriangle className="w-3.5 h-3.5" />
        : <CheckCircle2 className="w-3.5 h-3.5" />}
      <span className="whitespace-nowrap">
        {saving ? 'Enregistrement…' : dirty ? 'Non enregistré' : 'À jour'}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function InstitutionDetailPage() {
  const { institutionId } = useParams<{ institutionId: string }>()
  const navigate = useNavigate()

  const [institution, setInstitution] = useState<Institution | null>(null)
  const [depots, setDepots] = useState<Depot[]>([])
  const [institutionTypes, setInstitutionTypes] = useState<InstitutionType[]>([])
  const [depotTypes, setDepotTypes] = useState<DepotType[]>([])
  const [modeAcces, setModeAcces] = useState<ModeAcces[]>([])
  const [plateformesOptions, setPlateformesOptions] = useState<PlateformeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Institution edit ──
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<InstitutionForm>({
    nom: '', sigle: '', type_ref: '', plateforme_ref: '',
    commune: '', departement: '', region: '', pays: '', note: '',
  })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [, setSavedAt] = useState<number | null>(null)

  // ── Dépôts edit ──
  const [isEditingDepots, setIsEditingDepots] = useState(false)
  const [depotForms, setDepotForms] = useState<DepotForm[]>([])
  const [dirtyDepots, setDirtyDepots] = useState(false)
  const [savingDepots, setSavingDepots] = useState(false)
  const [saveDepotError, setSaveDepotError] = useState<string | null>(null)

  // ── Dépôt création ──
  const [showCreateDepot, setShowCreateDepot] = useState(false)
  const [newDepot, setNewDepot] = useState<NewDepotForm>(emptyDepotForm())
  const [savingNewDepot, setSavingNewDepot] = useState(false)

  // ── Menu réglages ──
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Load ──
  useEffect(() => {
    if (!institutionId) return
    let cancelled = false

    async function load() {
      setLoading(true); setError(null)

      const [instRes, depotsRes, instTypesRes, depotTypesRes, modeAccesRes, platOptRes] = await Promise.all([
        supabase.from('ref_institutions')
          .select('id, nom, sigle, pays, region, departement, commune, note, type_institution_ref, ref_institution_type!type_institution_ref(label, description, categorie), plateforme_ref, ref_plateformes!plateforme_ref(label, site_web, ref_plateforme_kind!plateforme_kind_ref(label))')
          .eq('id', institutionId).single(),
        supabase.from('ref_depots')
          .select('id, nom, type_ref, ref_depot_type!type_ref(code, label, is_online), meme_adresse_institution, adresse, ville, code_postal, pays, note, conditions_communication, modalites_repro, delais_communication, mode_acces_ref, ref_mode_acces!mode_acces_ref(code, label), plateforme_ref, ref_plateformes!plateforme_ref(label, site_web, ref_plateforme_kind!plateforme_kind_ref(label))')
          .eq('institution_id', institutionId).order('nom'),
        supabase.from('ref_institution_type').select('id, label, description, categorie').order('categorie, label'),
        supabase.from('ref_depot_type').select('id, code, label, is_online').order('label'),
        supabase.from('ref_mode_acces').select('id, code, label').order('label'),
        supabase.from('ref_plateformes').select('id, code, label, site_web, ref_plateforme_kind!plateforme_kind_ref(label)').order('label'),
      ])

      if (cancelled) return
      if (instRes.error) { setError(instRes.error.message); setLoading(false); return }
      if (depotsRes.error) { setError(`Dépôts : ${depotsRes.error.message}`); setLoading(false); return }

      const r = instRes.data as any
      const instObj: Institution = {
        id: r.id, nom: r.nom, sigle: r.sigle ?? null, pays: r.pays ?? null,
        region: r.region ?? null, departement: r.departement ?? null,
        commune: r.commune ?? null, note: r.note ?? null,
        type_ref: r.type_institution_ref ?? null,
        type_label: r.ref_institution_type?.label ?? null,
        type_description: r.ref_institution_type?.description ?? null,
        type_categorie: r.ref_institution_type?.categorie ?? null,
        plateforme_ref: r.plateforme_ref ?? null,
        plateforme_label: r.ref_plateformes?.label ?? null,
        plateforme_site_web: r.ref_plateformes?.site_web ?? null,
        plateforme_kind_label: r.ref_plateformes?.ref_plateforme_kind?.label ?? null,
      }
      setInstitution(instObj)
      setForm(institutionToForm(instObj))
      setInstitutionTypes((instTypesRes.data ?? []) as InstitutionType[])
      setDepotTypes((depotTypesRes.data ?? []) as DepotType[])
      setModeAcces((modeAccesRes.data ?? []) as ModeAcces[])
      setPlateformesOptions((platOptRes.data ?? []).map((r: any): PlateformeOption => ({
        id: r.id, code: r.code, label: r.label, site_web: r.site_web ?? null,
        kind_label: r.ref_plateforme_kind?.label ?? null,
      })))

      setDepots((depotsRes.data ?? []).map((d: any): Depot => ({
        id: d.id, nom: d.nom ?? null,
        type_ref: d.type_ref ?? null,
        type_code: d.ref_depot_type?.code ?? null,
        type_label: d.ref_depot_type?.label ?? null,
        type_is_online: d.ref_depot_type?.is_online ?? false,
        meme_adresse_institution: d.meme_adresse_institution ?? true,
        adresse: d.adresse ?? null, ville: d.ville ?? null,
        code_postal: d.code_postal ?? null, pays: d.pays ?? null,
        note: d.note ?? null,
        conditions_communication: d.conditions_communication ?? null,
        modalites_repro: d.modalites_repro ?? null,
        delais_communication: d.delais_communication ?? null,
        mode_acces_ref: d.mode_acces_ref ?? null,
        mode_acces_code: d.ref_mode_acces?.code ?? null,
        mode_acces_label: d.ref_mode_acces?.label ?? null,
        plateforme_ref: d.plateforme_ref ?? null,
        plateforme_label: d.ref_plateformes?.label ?? null,
        plateforme_site_web: d.ref_plateformes?.site_web ?? null,
        plateforme_kind_label: d.ref_plateformes?.ref_plateforme_kind?.label ?? null,
      })))

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [institutionId])

  // ── Helpers ──
  const depotTypeIsOnline = (typeRef: string) =>
    depotTypes.find(t => t.id === typeRef)?.is_online ?? false

  // ── Institution handlers ──
  const setField = (key: keyof InstitutionForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setDirty(true); setSavedAt(null)
  }

  const startEditing = () => {
    if (!institution) return
    setForm(institutionToForm(institution))
    setDirty(false); setSaveError(null); setIsEditing(true)
  }

  const cancelEditing = () => { setIsEditing(false); setDirty(false); setSaveError(null) }

  const handleSave = async () => {
    if (!institutionId || !dirty) return
    setSaving(true); setSaveError(null)
    const patch = {
      nom: form.nom.trim() || null, sigle: form.sigle.trim() || null,
      type_institution_ref: form.type_ref || null, plateforme_ref: form.plateforme_ref || null,
      commune: form.commune.trim() || null, departement: form.departement.trim() || null,
      region: form.region.trim() || null, pays: form.pays.trim() || null,
      note: form.note.trim() || null,
    }
    const { error } = await supabase.from('ref_institutions').update(patch).eq('id', institutionId)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    const selectedType = institutionTypes.find(t => t.id === form.type_ref) ?? null
    const selectedPlatOpt = plateformesOptions.find(p => p.id === form.plateforme_ref) ?? null
    setInstitution(prev => prev ? {
      ...prev,
      nom: patch.nom ?? prev.nom,
      sigle: patch.sigle,
      type_ref: patch.type_institution_ref,
      type_label: selectedType?.label ?? null,
      type_description: selectedType?.description ?? null,
      type_categorie: selectedType?.categorie ?? null,
      plateforme_ref: patch.plateforme_ref,
      plateforme_label: selectedPlatOpt?.label ?? null,
      plateforme_site_web: selectedPlatOpt?.site_web ?? null,
      plateforme_kind_label: selectedPlatOpt?.kind_label ?? null,
      commune: patch.commune,
      departement: patch.departement,
      region: patch.region,
      pays: patch.pays,
      note: patch.note,
    } : prev)
    setDirty(false); setSavedAt(Date.now()); setIsEditing(false)
    toast.success('Institution mise à jour')
  }

  // ── Dépôts handlers ──
  const startEditingDepots = () => {
    setDepotForms(depots.map(depotToForm))
    setDirtyDepots(false); setSaveDepotError(null); setIsEditingDepots(true)
  }

  const cancelEditingDepots = () => { setIsEditingDepots(false); setDirtyDepots(false); setSaveDepotError(null) }

  const updateDepotField = (idx: number, key: keyof Omit<DepotForm, 'meme_adresse_institution'>, value: string) => {
    setDepotForms(prev => prev.map((f, i) => i === idx ? { ...f, [key]: value } : f))
    setDirtyDepots(true)
  }

  const updateDepotBool = (idx: number, key: 'meme_adresse_institution', value: boolean) => {
    setDepotForms(prev => prev.map((f, i) => i === idx ? { ...f, [key]: value } : f))
    setDirtyDepots(true)
  }

  const buildDepotPatch = (f: DepotForm | NewDepotForm) => {
    const isOnline = depotTypeIsOnline(f.type_ref)
    const hasOwnAddress = !isOnline && !f.meme_adresse_institution
    return {
      nom: f.nom.trim() || null,
      type_ref: f.type_ref || null,
      meme_adresse_institution: !isOnline ? f.meme_adresse_institution : true,
      note: f.note.trim() || null,
      adresse: hasOwnAddress ? f.adresse.trim() || null : null,
      ville: hasOwnAddress ? f.ville.trim() || null : null,
      code_postal: hasOwnAddress ? f.code_postal.trim() || null : null,
      pays: hasOwnAddress ? f.pays.trim() || null : null,
      conditions_communication: isOnline ? null : f.conditions_communication.trim() || null,
      modalites_repro: isOnline ? null : f.modalites_repro.trim() || null,
      delais_communication: isOnline ? null : f.delais_communication.trim() || null,
      mode_acces_ref: !isOnline ? (f.mode_acces_ref || null) : null,
      plateforme_ref: isOnline ? (f.plateforme_ref || null) : null,
    }
  }

  const saveDepots = async () => {
    if (!dirtyDepots) return
    setSavingDepots(true); setSaveDepotError(null)
    for (const f of depotForms) {
      const { error } = await supabase.from('ref_depots').update(buildDepotPatch(f)).eq('id', f.id)
      if (error) { setSaveDepotError(error.message); setSavingDepots(false); return }
    }
    setDepots(prev => prev.map(d => {
      const f = depotForms.find(f => f.id === d.id)
      if (!f) return d
      const dt = depotTypes.find(t => t.id === f.type_ref)
      const ma = modeAcces.find(m => m.id === f.mode_acces_ref)
      const pl = plateformesOptions.find(p => p.id === f.plateforme_ref)
      const patch = buildDepotPatch(f)
      return { ...d, ...patch, type_code: dt?.code ?? null, type_label: dt?.label ?? null, type_is_online: dt?.is_online ?? false, mode_acces_code: ma?.code ?? null, mode_acces_label: ma?.label ?? null, plateforme_label: pl?.label ?? null, plateforme_site_web: pl?.site_web ?? null, plateforme_kind_label: pl?.kind_label ?? null }
    }))
    setSavingDepots(false); setDirtyDepots(false); setIsEditingDepots(false)
    toast.success('Dépôts mis à jour')
  }

  const deleteDepot = async (id: string, nom: string | null) => {
    if (!window.confirm(`Supprimer "${nom ?? 'ce dépôt'}" ?`)) return
    const { error } = await supabase.from('ref_depots').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setDepots(prev => prev.filter(d => d.id !== id))
    if (isEditingDepots) setDepotForms(prev => prev.filter(f => f.id !== id))
    toast.success('Dépôt supprimé')
  }

  const createDepot = async () => {
    if (!institutionId || !newDepot.type_ref) return
    setSavingNewDepot(true)
    const { data, error } = await supabase.from('ref_depots')
      .insert({ institution_id: institutionId, ...buildDepotPatch(newDepot) })
      .select('id').single()
    setSavingNewDepot(false)
    if (error) { toast.error(error.message); return }
    const dt = depotTypes.find(t => t.id === newDepot.type_ref)
    const ma = modeAcces.find(m => m.id === newDepot.mode_acces_ref)
    const pl = plateformesOptions.find(p => p.id === newDepot.plateforme_ref)
    const patch = buildDepotPatch(newDepot)
    setDepots(prev => [...prev, {
      id: (data as any).id,
      nom: patch.nom, type_ref: patch.type_ref,
      type_code: dt?.code ?? null, type_label: dt?.label ?? null, type_is_online: dt?.is_online ?? false,
      meme_adresse_institution: patch.meme_adresse_institution ?? true,
      adresse: patch.adresse, ville: patch.ville, code_postal: patch.code_postal, pays: patch.pays,
      note: patch.note,
      conditions_communication: patch.conditions_communication,
      modalites_repro: patch.modalites_repro,
      delais_communication: patch.delais_communication,
      mode_acces_ref: patch.mode_acces_ref ?? null,
      mode_acces_code: ma?.code ?? null,
      mode_acces_label: ma?.label ?? null,
      plateforme_ref: patch.plateforme_ref ?? null,
      plateforme_label: pl?.label ?? null,
      plateforme_site_web: pl?.site_web ?? null,
      plateforme_kind_label: pl?.kind_label ?? null,
    }])
    setNewDepot(emptyDepotForm()); setShowCreateDepot(false)
    toast.success('Dépôt créé')
  }

  // ── Delete institution ──
  const handleDelete = async () => {
    if (!institutionId) return
    if (!window.confirm(`Supprimer "${institution?.nom}" ainsi que ses dépôts associés ?`)) return
    setMenuOpen(false); setDeleting(true)
    await supabase.from('ref_depots').delete().eq('institution_id', institutionId)
    const { error } = await supabase.from('ref_institutions').delete().eq('id', institutionId)
    setDeleting(false)
    if (error) { toast.error('Erreur lors de la suppression'); return }
    toast.success('Institution supprimée'); navigate(-1)
  }

  // ── Render guards ──
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
    </div>
  )

  if (error || !institution) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-600 mb-3">{error ?? 'Institution introuvable'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-700">← Retour</button>
      </div>
    </div>
  )

  // ── Shared form blocks ──
  function DepotFormFields({
    f, onField, onBool,
  }: {
    f: DepotForm | NewDepotForm
    onField: (key: keyof Omit<DepotForm, 'id' | 'meme_adresse_institution'>, v: string) => void
    onBool: (key: 'meme_adresse_institution', v: boolean) => void
  }) {
    const isOnline = depotTypeIsOnline(f.type_ref)
    return (
      <div className="space-y-3">
        <DepotTypeSelect label="Type *" value={f.type_ref} onChange={v => onField('type_ref', v)} options={depotTypes} />
        <EditField label="Nom (optionnel)" value={f.nom} onChange={v => onField('nom', v)} placeholder="Ex. Salle Richelieu" />
        {isOnline && (
          <PlateformeSelect label="Plateforme" value={f.plateforme_ref} onChange={v => onField('plateforme_ref', v)} options={plateformesOptions} />
        )}
        {!isOnline && (
          <>
            <EditCheckbox
              label="Se trouve au sein de l'institution"
              checked={f.meme_adresse_institution}
              onChange={v => onBool('meme_adresse_institution', v)}
            />
            {!f.meme_adresse_institution && (
              <>
                <EditField label="Adresse" value={f.adresse} onChange={v => onField('adresse', v)} />
                <EditField label="Ville" value={f.ville} onChange={v => onField('ville', v)} />
                <div className="grid grid-cols-2 gap-4">
                  <EditField label="Code postal" value={f.code_postal} onChange={v => onField('code_postal', v)} mono />
                  <EditField label="Pays / Île" value={f.pays} onChange={v => onField('pays', v)} />
                </div>
              </>
            )}
            <ModeAccesSelect label="Mode d'accès" value={f.mode_acces_ref} onChange={v => onField('mode_acces_ref', v)} options={modeAcces} />
            <EditField label="Conditions de communication" value={f.conditions_communication} onChange={v => onField('conditions_communication', v)} />
            <EditField label="Modalités de reproduction" value={f.modalites_repro} onChange={v => onField('modalites_repro', v)} />
            <EditField label="Délais de communication" value={f.delais_communication} onChange={v => onField('delais_communication', v)} />
          </>
        )}
        <EditTextarea label="Note" value={f.note} onChange={v => onField('note', v)} />
      </div>
    )
  }

  // ── Header rights ──
  const institutionHeaderRight = isEditing ? (
    <div className="flex items-center gap-2 shrink-0">
      <DirtyBadge saving={saving} dirty={dirty} />
      <button type="button" onClick={cancelEditing}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition">
        Annuler
      </button>
      <button type="button" onClick={handleSave} disabled={!dirty || saving}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Enregistrer
      </button>
    </div>
  ) : (
    <button type="button" onClick={startEditing}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition shrink-0">
      <Pencil className="w-3.5 h-3.5" />Modifier
    </button>
  )

  const depotsHeaderRight = isEditingDepots ? (
    <div className="flex items-center gap-2 shrink-0">
      <DirtyBadge saving={savingDepots} dirty={dirtyDepots} />
      <button type="button" onClick={cancelEditingDepots}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition">
        Annuler
      </button>
      <button type="button" onClick={saveDepots} disabled={!dirtyDepots || savingDepots}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition">
        {savingDepots ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Enregistrer
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2 shrink-0">
      <button type="button" onClick={() => { setShowCreateDepot(v => !v); setNewDepot(emptyDepotForm()) }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition">
        <Plus className="w-3.5 h-3.5" />Nouveau
      </button>
      <button type="button" onClick={startEditingDepots}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition">
        <Pencil className="w-3.5 h-3.5" />Modifier
      </button>
    </div>
  )

  // ── JSX ──
  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-6">

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <Link to="/patrimoine-documentaire" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
            <Library className="w-4 h-4" />
            Patrimoine documentaire
          </Link>
          <span className="text-gray-300">/</span>
          <span className="flex items-center gap-2 min-w-0">
            <University className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{institution.nom}</span>
            {institution.sigle && (
              <span className="text-xs font-mono text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 shrink-0">{institution.sigle}</span>
            )}
          </span>
          <div className="relative ml-auto shrink-0" ref={menuRef}>
            <button type="button" onClick={() => setMenuOpen(v => !v)} disabled={deleting}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition disabled:opacity-40">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-20">
                <button type="button" onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 shrink-0" />Supprimer l'institution
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Institution ── */}
        <SectionCard title="Fiche institution" icon={University} accent="indigo" headerRight={institutionHeaderRight}>
          {isEditing ? (
            <dl className="space-y-5">
              <FieldGrid>
                <div className="sm:col-span-2">
                  <EditField label="Nom complet" value={form.nom} onChange={v => setField('nom', v)} />
                </div>
                  <EditField label="Sigle" value={form.sigle} onChange={v => setField('sigle', v)} mono />
                <div className="sm:col-span-2">
                  <SearchableTypeSelect value={form.type_ref} onChange={v => setField('type_ref', v)} options={institutionTypes} />
                </div>
              </FieldGrid>
              <div className="border-t border-slate-100 pt-4">
                <FieldGrid>
                  <div className="sm:col-span-2">
                    <PlateformeSelect label="Plateforme" value={form.plateforme_ref} onChange={v => setField('plateforme_ref', v)} options={plateformesOptions} />
                  </div>
                </FieldGrid>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Localisation</p>
                <FieldGrid>
                  <EditField label="Commune" value={form.commune} onChange={v => setField('commune', v)} />
                  <EditField label="Département" value={form.departement} onChange={v => setField('departement', v)} />
                  <EditField label="Région" value={form.region} onChange={v => setField('region', v)} />
                  <EditField label="Pays / Île" value={form.pays} onChange={v => setField('pays', v)} />
                </FieldGrid>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <EditTextarea label="Note" value={form.note} onChange={v => setField('note', v)} />
              </div>
              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            </dl>
          ) : (
            <dl className="space-y-5">
              <FieldGrid>
                <div className="sm:col-span-2">
                  <FieldItem label="Nom complet" value={institution.nom} />
                </div>
                <FieldItem label="Sigle" value={institution.sigle} mono />
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Type</dt>
                  {institution.type_label ? (
                    <dd className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-sm text-slate-800">{institution.type_label}</span>
                      {institution.type_categorie && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          {institution.type_categorie}
                        </span>
                      )}
                      {institution.type_description && (
                        <span className="text-xs text-slate-400">{institution.type_description}</span>
                      )}
                    </dd>
                  ) : (
                    <dd className="text-sm text-slate-300 italic">—</dd>
                  )}
                </div>
              </FieldGrid>
              {institution.plateforme_label && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-start gap-2">
                    <Monitor className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900">{institution.plateforme_label}</span>
                        {institution.plateforme_kind_label && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            {institution.plateforme_kind_label}
                          </span>
                        )}
                      </div>
                      {institution.plateforme_site_web && (
                        <a href={institution.plateforme_site_web} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1 mt-0.5 break-all">
                          <Globe className="w-3 h-3 shrink-0" />{institution.plateforme_site_web}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Localisation</p>
                <FieldGrid>
                  <FieldItem label="Commune" value={institution.commune} />
                  <FieldItem label="Département" value={institution.departement} />
                  <FieldItem label="Région" value={institution.region} />
                  <FieldItem label="Pays / Île" value={institution.pays} />
                </FieldGrid>
              </div>
              {institution.note && (
                <div className="border-t border-slate-100 pt-4">
                  <FieldItem label="Note" value={institution.note} />
                </div>
              )}
            </dl>
          )}
        </SectionCard>

        {/* ── Dépôts ── */}
        <SectionCard title={`Dépôts (${depots.length})`} icon={Building2} accent="teal" headerRight={depotsHeaderRight}>
          <div className="space-y-3">

            {/* Formulaire de création */}
            {showCreateDepot && (
              <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-4 space-y-3">
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Nouveau dépôt</p>
                <DepotFormFields
                  f={newDepot}
                  onField={(key, v) => setNewDepot(p => ({ ...p, [key]: v }))}
                  onBool={(key, v) => setNewDepot(p => ({ ...p, [key]: v }))}
                />
                <div className="flex items-center gap-2 pt-1">
                  <button type="button" onClick={() => setShowCreateDepot(false)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition">
                    Annuler
                  </button>
                  <button type="button" onClick={createDepot} disabled={!newDepot.type_ref || savingNewDepot}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition">
                    {savingNewDepot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Créer le dépôt
                  </button>
                </div>
              </div>
            )}

            {depots.length === 0 && !showCreateDepot && (
              <p className="text-sm text-slate-400 italic">Aucun dépôt associé.</p>
            )}

            {isEditingDepots
              ? depotForms.map((f, idx) => (
                <div key={f.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {f.nom || depotTypes.find(t => t.id === f.type_ref)?.label || 'Dépôt sans nom'}
                    </span>
                    <button type="button" onClick={() => deleteDepot(f.id, f.nom || null)}
                      className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <DepotFormFields
                    f={f}
                    onField={(key, v) => updateDepotField(idx, key, v)}
                    onBool={(key, v) => updateDepotBool(idx, key, v)}
                  />
                </div>
              ))
              : depots.map((d) => (
                <div key={d.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {d.type_label && (
                      <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                        {d.type_label}
                      </span>
                    )}
                    {d.nom && <span className="text-sm font-semibold text-slate-800">{d.nom}</span>}
                    <button type="button" onClick={() => deleteDepot(d.id, d.nom)}
                      className="ml-auto p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {d.mode_acces_label && d.mode_acces_code && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-xs">Accès : </span>{modeAccesIcon(d.mode_acces_code)}
                      <span className="text-xs font-medium text-slate-700">{d.mode_acces_label}</span>
                    </div>
                  )}
                  <dl className="space-y-3">
                    {d.type_is_online && d.plateforme_label && (
                      <div>
                        <dd className="flex items-start gap-2 mt-0.5">
                          <Monitor className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-900">{d.plateforme_label}</span>
                              {d.plateforme_kind_label && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                  {d.plateforme_kind_label}
                                </span>
                              )}
                            </div>
                            {d.plateforme_site_web && (
                              <a href={d.plateforme_site_web} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1 mt-0.5 break-all">
                                <Globe className="w-3 h-3 shrink-0" />{d.plateforme_site_web}
                              </a>
                            )}
                          </div>
                        </dd>
                      </div>
                    )}
                    {!d.type_is_online && (
                      <>
                        {d.meme_adresse_institution
                          ? <p className="text-xs">Localisation : au sein de l'institution</p>
                          : <>
                              {d.adresse && <FieldItem label="Adresse" value={d.adresse} />}
                              {d.ville && (
                                <div className="grid grid-cols-2 gap-4">
                                  <FieldItem label="Ville" value={d.ville} />
                                  <FieldItem label="Code postal" value={d.code_postal} mono />
                                </div>
                              )}
                              {d.pays && <FieldItem label="Pays / Île" value={d.pays} />}
                            </>
                        }
                        {d.conditions_communication && <FieldItem label="Conditions de communication" value={d.conditions_communication} />}
                        {d.modalites_repro && <FieldItem label="Modalités de reproduction" value={d.modalites_repro} />}
                        {d.delais_communication && <FieldItem label="Délais de communication" value={d.delais_communication} />}
                      </>
                    )}
                    {d.note && <FieldItem label="Note" value={d.note} />}
                  </dl>
                </div>
              ))
            }
            {saveDepotError && <p className="text-xs text-red-600 mt-2">{saveDepotError}</p>}
          </div>
        </SectionCard>

      </main>
    </div>
  )
}
