import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronDown, Loader2, AlertCircle, Globe, Monitor,
  Save, AlertTriangle, CheckCircle2, Pencil, Settings, Trash2, Search, UserCircle,
  Lock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

type KindOption = { id: string; label: string; description: string | null; categorie: string | null }

type Plateforme = {
  id: string
  label: string
  code: string
  site_web: string | null
  auth_required: boolean
  kind_ref: string | null
  kind_label: string | null
  kind_description: string | null
  kind_categorie: string | null
}

type PlateformeForm = {
  label: string
  code: string
  site_web: string
  auth_required: boolean
  kind_ref: string
}

function plateformeToForm(p: Plateforme): PlateformeForm {
  return {
    label: p.label,
    code: p.code,
    site_web: p.site_web ?? '',
    auth_required: p.auth_required,
    kind_ref: p.kind_ref ?? '',
  }
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, headerRight, children }: {
  title: string; icon: React.ElementType
  headerRight?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3 bg-slate-50">
        <Icon className="w-4 h-4 text-teal-500 shrink-0" />
        <h2 className="text-sm font-semibold text-teal-700 flex-1">{title}</h2>
        {headerRight}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function FieldItem({ label, value, url }: {
  label: string; value: string | null | undefined; url?: boolean
}) {
  if (value == null || value === '') return null
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-slate-800">
        {url ? (
          <a href={value} target="_blank" rel="noopener noreferrer"
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
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition ${mono ? 'font-mono' : ''}`} />
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
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-400" />
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
                    className={`w-full px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${o.id === value ? 'bg-teal-50' : ''}`}>
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

// ── Page ──────────────────────────────────────────────────────────────────────

export function PlateformeDetailPage() {
  const { plateformeId } = useParams<{ plateformeId: string }>()
  const navigate = useNavigate()

  const [plateforme, setPlateforme] = useState<Plateforme | null>(null)
  const [kindOptions, setKindOptions] = useState<KindOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<PlateformeForm>({ label: '', code: '', site_web: '', auth_required: false, kind_ref: '' })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!plateformeId) return
    let cancelled = false

    async function load() {
      setLoading(true); setError(null)
      const [platRes, kindsRes] = await Promise.all([
        supabase.from('ref_plateformes')
          .select('id, label, code, site_web, auth_required, plateforme_kind_ref, ref_plateforme_kind!plateforme_kind_ref(label, description, categorie)')
          .eq('id', plateformeId).single(),
        supabase.from('ref_plateforme_kind').select('id, label, description, categorie').order('categorie, label'),
      ])
      if (cancelled) return
      if (platRes.error) { setError(platRes.error.message); setLoading(false); return }

      const r = platRes.data as any
      const p: Plateforme = {
        id: r.id, label: r.label, code: r.code,
        site_web: r.site_web ?? null, auth_required: r.auth_required,
        kind_ref: r.plateforme_kind_ref ?? null,
        kind_label: r.ref_plateforme_kind?.label ?? null,
        kind_description: r.ref_plateforme_kind?.description ?? null,
        kind_categorie: r.ref_plateforme_kind?.categorie ?? null,
      }
      setPlateforme(p)
      setForm(plateformeToForm(p))
      setKindOptions((kindsRes.data ?? []).map((k: any) => ({
        id: k.id, label: k.label, description: k.description ?? null, categorie: k.categorie ?? null,
      })))
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [plateformeId])

  const setField = <K extends keyof PlateformeForm>(key: K, value: PlateformeForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const startEditing = () => {
    if (!plateforme) return
    setForm(plateformeToForm(plateforme))
    setDirty(false); setSaveError(null); setIsEditing(true)
  }

  const cancelEditing = () => { setIsEditing(false); setDirty(false); setSaveError(null) }

  const handleSave = async () => {
    if (!plateformeId || !dirty) return
    setSaving(true); setSaveError(null)
    const patch = {
      label: form.label.trim() || null,
      code: form.code.trim().toUpperCase() || null,
      site_web: form.site_web.trim() || null,
      auth_required: form.auth_required,
      plateforme_kind_ref: form.kind_ref || null,
    }
    const { error } = await supabase.from('ref_plateformes').update(patch).eq('id', plateformeId)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    const kind = kindOptions.find(k => k.id === form.kind_ref) ?? null
    setPlateforme(prev => prev ? {
      ...prev,
      label: patch.label ?? prev.label,
      code: patch.code ?? prev.code,
      site_web: patch.site_web,
      auth_required: patch.auth_required,
      kind_ref: patch.plateforme_kind_ref,
      kind_label: kind?.label ?? null,
      kind_description: kind?.description ?? null,
      kind_categorie: kind?.categorie ?? null,
    } : prev)
    setDirty(false); setIsEditing(false)
    toast.success('Plateforme mise à jour')
  }

  const handleDelete = async () => {
    if (!plateformeId) return
    if (!window.confirm(`Supprimer "${plateforme?.label}" ?`)) return
    setMenuOpen(false); setDeleting(true)
    const { error } = await supabase.from('ref_plateformes').delete().eq('id', plateformeId)
    setDeleting(false)
    if (error) { toast.error('Erreur lors de la suppression'); return }
    toast.success('Plateforme supprimée'); navigate(-1)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
    </div>
  )

  if (error || !plateforme) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-600 mb-3">{error ?? 'Plateforme introuvable'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-700">← Retour</button>
      </div>
    </div>
  )

  const headerRight = isEditing ? (
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

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors shrink-0">
          <ChevronLeft className="w-4 h-4" />Plateformes
        </button>
        <span className="text-slate-300">/</span>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Monitor className="w-4 h-4 text-teal-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-900 truncate">{plateforme.label}</span>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 shrink-0">{plateforme.code}</span>
          {plateforme.auth_required && (
            <div className="relative group shrink-0">
              <UserCircle className="w-4 h-4 text-gray-500" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                Authentification requise
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          )}
        </div>
        <div className="relative shrink-0" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen(v => !v)} disabled={deleting}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition disabled:opacity-40">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border border-slate-200 bg-white shadow-lg py-1 z-20">
              <button type="button" onClick={handleDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4 shrink-0" />Supprimer la plateforme
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        <SectionCard title="Fiche plateforme" icon={Monitor} headerRight={headerRight}>
          {isEditing ? (
            <div className="space-y-4">
              <EditField label="Libellé *" value={form.label} onChange={v => setField('label', v)} />
              <EditField label="Code *" value={form.code} onChange={v => setField('code', v.toUpperCase())} mono />
              <SearchableKindSelect value={form.kind_ref} onChange={v => setField('kind_ref', v)} options={kindOptions} />
              <EditField label="Site web" value={form.site_web} onChange={v => setField('site_web', v)} placeholder="https://…" />
              <EditCheckbox label="Authentification requise" checked={form.auth_required} onChange={v => setField('auth_required', v)} />
              {saveError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
              )}
            </div>
          ) : (
            <dl className="space-y-4">
              <FieldItem label="Libellé" value={plateforme.label} />
              <FieldItem label="Code" value={plateforme.code} />
              {plateforme.kind_label && (
                <div>
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Type</dt>
                  <dd className="text-sm text-slate-800">
                    <span>{plateforme.kind_label}</span>
                    {plateforme.kind_categorie && (
                      <span className="ml-2 text-xs text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">{plateforme.kind_categorie}</span>
                    )}
                    {plateforme.kind_description && (
                      <p className="text-xs text-slate-400 mt-0.5">{plateforme.kind_description}</p>
                    )}
                  </dd>
                </div>
              )}
              {plateforme.auth_required && (
                <div>
                  <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Authentification</dt>
                  <dd className="text-sm flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-gray-500" /><span className="text-slate-700">Requise</span>
                  </dd>
                </div>
              )}
              <FieldItem label="Site web" value={plateforme.site_web} url={!!plateforme.site_web} />
            </dl>
          )}
        </SectionCard>
      </main>
    </div>
  )
}
