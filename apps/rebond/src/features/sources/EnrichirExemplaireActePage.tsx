import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Save, Loader2, CheckCircle2, AlertTriangle, Circle, Lock, Unlock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getActeCompleteness } from '@/features/archives/reference/ReferenceSourcesCard'
import type { ActeCitationDraft } from '@/features/archives/reference/types'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
    physical_condition_ref: (r?.physical_condition_ref ?? null) as any,
    repro_quality_ref: (r?.repro_quality_ref ?? null) as any,
    ...mar,
    ecriture_ref: r?.writing?.ecriture_ref ?? null,
    handwriting_legibility_ref: r?.writing?.legibility_ref ?? null,
    damage_notes: r?.writing?.damage_notes ?? '',
    repro_notes: r?.writing?.repro_notes ?? '',
    langue_ref: r?.langue_ref ?? null,
    document_damage_kinds_ids: arrOrEmpty(r?.document_damage_kinds_ids),
    document_readability_features_ids: arrOrEmpty(r?.document_readability_features_ids),
    lacune: r?.lacune ?? null,
    lacune_note: r?.lacune_note ?? '',
    marks: r?.marks ?? '',
  } as any
}

// ── Form ──────────────────────────────────────────────────────────────────────

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

function ActeEnrichissementForm({
  draft,
  onChange,
}: {
  draft: ActeCitationDraft
  onChange: (patch: Partial<ActeCitationDraft>) => void
}) {
  const c = draft as any

  const [variant, setVariant] = useState<'short' | 'full'>('short')
  const autoSwitchedRef = useRef(false)

  const [paginationTypes, setPaginationTypes] = useState<PaginationType[]>([])
  useEffect(() => {
    supabase.from('ref_pagination_type').select('id, code, label').then(({ data }) => {
      if (data) setPaginationTypes(data as PaginationType[])
    })
  }, [])

  // auto-switch vers full si déjà complet
  useEffect(() => {
    if (autoSwitchedRef.current) return
    const { status } = getActeCompleteness(draft)
    if (status === 'ok') setVariant('full')
    autoSwitchedRef.current = true
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // loc UI state
  const [locUi, setLocUi] = useState<LocUi>(() => ({
    mode: detectLocMode(draft),
    raw: String(c.loc_raw ?? ''),
    start: c.loc_start != null ? String(c.loc_start) : '',
    end: c.loc_end != null ? String(c.loc_end) : '',
    kind: (c.loc_kind as string) ?? 'vue',
  }))

  const commitLoc = (ui: LocUi) => {
    if (ui.mode === 'raw') {
      onChange({ loc_raw: ui.raw, loc_start: null, loc_end: null, loc_kind: ui.kind } as any)
    } else if (ui.mode === 'num') {
      const n = toIntOrNull(ui.start)
      onChange({ loc_raw: null, loc_start: n, loc_end: n, loc_kind: ui.kind } as any)
    } else {
      const s = toIntOrNull(ui.start)
      const e = toIntOrNull(ui.end)
      const raw = s != null && e != null ? `${s}-${e}` : ''
      onChange({ loc_raw: raw || null, loc_start: s, loc_end: e, loc_kind: ui.kind } as any)
    }
  }

  const updateLocUi = (next: Partial<LocUi>) => {
    const merged = { ...locUi, ...next }
    setLocUi(merged)
    commitLoc(merged)
  }

  const isMissing: boolean | null = c.is_missing ?? null
  const lacune: boolean | null = c.lacune ?? null
  const missingRanges: any[] = Array.isArray(c.missing_ranges) ? c.missing_ranges : []

  const mmPresent: boolean | null = c.marginal_mentions_present ?? null
  const mmCount: number | null = c.marginal_mentions_count ?? null
  const sigPresent: boolean | null = c.signatures_present ?? null
  const sigCount: number | null = c.signatures_count ?? null
  const mcPresent: boolean | null = c.marginal_crossouts_present ?? null
  const mcCount: number | null = c.marginal_crossouts_count ?? null

  const patchMissingRanges = (next: any[]) => onChange({ missing_ranges: next } as any)
  const addRange = () => patchMissingRanges([...missingRanges, { kind: 'vue', start: null, end: null, note: '' }])
  const updateRange = (i: number, patch: any) => patchMissingRanges(missingRanges.map((r, k) => k === i ? { ...r, ...patch } : r))
  const removeRange = (i: number) => patchMissingRanges(missingRanges.filter((_, k) => k !== i))

  const { status } = getActeCompleteness(draft)

  const StatusIcon = () => {
    if (status === 'ok') return <CheckCircle2 className='h-4 w-4 text-emerald-600' />
    if (status === 'missing') return <AlertTriangle className='h-4 w-4 text-red-600' />
    return <Circle className='h-4 w-4 text-amber-600' />
  }

  // ── Sections partagées ────────────────────────────────────────────────────

  const statutBlock = (
    <div className='rounded-xl border border-slate-200 bg-white'>
      <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
        <div className='text-sm font-semibold text-slate-900'>Statut</div>
        <div className='mt-1 text-xs text-slate-600'>Champs minimum requis.</div>
      </div>
      <div className='p-4 space-y-4'>
        <div className='flex flex-wrap items-center gap-4'>
          <TriStateButton
            label='Acte manquant *'
            mode='edit'
            value={isMissing}
            yesLabel='Oui' noLabel='Non'
            onChange={(v) => onChange({ is_missing: v } as any)}
          />
          <TriStateButton
            label='Lacune *'
            mode='edit'
            value={lacune}
            yesLabel='Oui' noLabel='Non'
            onChange={(v) => {
              if (v === true) { onChange({ lacune: true } as any); return }
              onChange({ lacune: v, lacune_note: null, missing_ranges: [] } as any)
            }}
          />
        </div>

        {lacune === true && (
          <>
            <TextAreaField
              label='Détail lacune'
              readonly={false}
              value={String(c.lacune_note ?? '')}
              onChange={(next) => onChange({ lacune_note: next } as any)}
              placeholder='Ex. feuillets manquants, vues 120–140 absentes…'
              minHeightClassName='min-h-[70px]'
            />
            <div>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <div className='text-sm font-semibold text-slate-900'>Plages manquantes</div>
                  <div className='mt-1 text-xs text-slate-600'>Alternative structurée à la note.</div>
                </div>
                <Button type='button' variant='outline' size='sm' onClick={addRange}>Ajouter…</Button>
              </div>
              {missingRanges.length === 0 && (
                <div className='mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600'>Aucune plage renseignée.</div>
              )}
              {missingRanges.map((r, i) => (
                <div key={i} className='mt-2 rounded-xl border border-slate-200 bg-white p-3'>
                  <div className='grid grid-cols-1 gap-3 md:grid-cols-12'>
                    <div className='md:col-span-3'>
                      <label className='block text-xs font-medium text-slate-700'>Type</label>
                      <select
                        className='mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm'
                        value={String(r.kind ?? 'vue')}
                        onChange={(e) => updateRange(i, { kind: e.target.value })}
                      >
                        <option value='vue'>Vues</option>
                        <option value='page'>Pages</option>
                      </select>
                    </div>
                    <div className='md:col-span-3'>
                      <label className='block text-xs font-medium text-slate-700'>Début</label>
                      <Input className='mt-1' inputMode='numeric' value={r.start ?? ''} onChange={(e) => updateRange(i, { start: toIntOrNull(e.target.value) })} placeholder='ex. 120' />
                    </div>
                    <div className='md:col-span-3'>
                      <label className='block text-xs font-medium text-slate-700'>Fin</label>
                      <Input className='mt-1' inputMode='numeric' value={r.end ?? ''} onChange={(e) => updateRange(i, { end: toIntOrNull(e.target.value) })} placeholder='ex. 140' />
                    </div>
                    <div className='md:col-span-3 flex items-end justify-end'>
                      <Button type='button' variant='ghost' size='sm' onClick={() => removeRange(i)}>Supprimer</Button>
                    </div>
                    <div className='md:col-span-12'>
                      <label className='block text-xs font-medium text-slate-700'>Note</label>
                      <Input className='mt-1' value={String(r.note ?? '')} onChange={(e) => updateRange(i, { note: e.target.value })} placeholder='ex. scan manquant…' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )

  const localisationBlock = (
    <div className='rounded-xl border border-slate-200 bg-white'>
      <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
        <div className='text-sm font-semibold text-slate-900'>Localisation</div>
      </div>
      <div className='p-4 space-y-3'>
        {/* Type de pagination */}
        <div>
          <label className='block text-xs font-medium text-slate-700 mb-1'>
            Type de numérotation *
          </label>
          <select
            className='w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            value={locUi.kind}
            onChange={(e) => updateLocUi({ kind: e.target.value })}
          >
            {paginationTypes.length === 0 && (
              <option value={locUi.kind}>{locUi.kind || 'Chargement…'}</option>
            )}
            {paginationTypes.map((pt) => (
              <option key={pt.id} value={pt.code}>{pt.label}</option>
            ))}
          </select>
        </div>

        {/* Mode de saisie */}
        <div>
          <RadioGroup
            value={locUi.mode}
            onValueChange={(v) => updateLocUi({ mode: v as LocMode, start: '', end: '', raw: '' })}
            className='flex flex-wrap gap-4'
          >
            {(['num', 'range', 'raw'] as LocMode[]).map((m) => (
              <div key={m} className='flex items-center gap-2'>
                <RadioGroupItem value={m} id={`loc-${m}`} />
                <label htmlFor={`loc-${m}`} className='text-sm text-slate-700'>
                  {m === 'num' ? 'Numéro' : m === 'range' ? 'Plage (début/fin)' : 'Texte libre'}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
          {locUi.mode === 'raw' && (
            <div className='md:col-span-12'>
              <Input
                value={locUi.raw}
                onChange={(e) => updateLocUi({ raw: e.target.value })}
                placeholder='Ex. f°12r–f°13v ; vue 23 ; page 120'
              />
            </div>
          )}
          {locUi.mode === 'num' && (
            <div className='md:col-span-4'>
              <label className='block text-xs font-medium text-slate-700 mb-1'>Numéro</label>
              <Input
                inputMode='numeric'
                value={locUi.start}
                onChange={(e) => updateLocUi({ start: e.target.value, end: e.target.value })}
                placeholder='ex. 120'
              />
            </div>
          )}
          {locUi.mode === 'range' && (
            <>
              <div className='md:col-span-3'>
                <label className='block text-xs font-medium text-slate-700 mb-1'>Début</label>
                <Input inputMode='numeric' value={locUi.start} onChange={(e) => updateLocUi({ start: e.target.value })} placeholder='ex. 23' />
              </div>
              <div className='md:col-span-3'>
                <label className='block text-xs font-medium text-slate-700 mb-1'>Fin</label>
                <Input inputMode='numeric' value={locUi.end} onChange={(e) => updateLocUi({ end: e.target.value })} placeholder='ex. 24' />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  const marquesBlock = (full = false) => (
    <div className='rounded-xl border border-slate-200 bg-white'>
      <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
        <div className='text-sm font-semibold text-slate-900'>Marques & signes</div>
      </div>
      <div className='p-4 space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
          <div className='md:col-span-6'>
            <TriStateButton label='Mentions marginales' mode='edit' value={mmPresent}
              onChange={(v) => onChange({ marginal_mentions_present: v, marginal_mentions_count: v === true ? mmCount : null } as any)} />
          </div>
          <div className='md:col-span-6'>
            <label className='block text-xs font-medium text-slate-700'>Nombre</label>
            <Input className='mt-1' inputMode='numeric' value={mmCount ?? ''} disabled={mmPresent !== true}
              onChange={(e) => onChange({ marginal_mentions_count: toIntOrNull(e.target.value) } as any)} placeholder='ex. 3' />
          </div>

          <div className='md:col-span-6'>
            <TriStateButton label='Signatures' mode='edit' value={sigPresent}
              onChange={(v) => onChange({ signatures_present: v, signatures_count: v === true ? sigCount : null } as any)} />
          </div>
          <div className='md:col-span-6'>
            <label className='block text-xs font-medium text-slate-700'>Nombre</label>
            <Input className='mt-1' inputMode='numeric' value={sigCount ?? ''} disabled={sigPresent !== true}
              onChange={(e) => onChange({ signatures_count: toIntOrNull(e.target.value) } as any)} placeholder='ex. 2' />
          </div>

          <div className='md:col-span-6'>
            <TriStateButton label='Ratures indiquées en marge' mode='edit' value={mcPresent}
              onChange={(v) => onChange({ marginal_crossouts_present: v, marginal_crossouts_count: v === true ? mcCount : null } as any)} />
          </div>
          <div className='md:col-span-6'>
            <label className='block text-xs font-medium text-slate-700'>Nombre</label>
            <Input className='mt-1' inputMode='numeric' value={mcCount ?? ''} disabled={mcPresent !== true}
              onChange={(e) => onChange({ marginal_crossouts_count: toIntOrNull(e.target.value) } as any)} placeholder='ex. 1' />
          </div>
        </div>

        {full && (
          <>
            <Separator />
            <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
              <div className='md:col-span-6'>
                <TextAreaField label='Marques / signes' readonly={false}
                  value={String(c.marks ?? '')}
                  onChange={(next) => onChange({ marks: next } as any)}
                  placeholder='Ex. graphie difficile, index absent…'
                  minHeightClassName='min-h-[90px]' />
              </div>
              <div className='md:col-span-6'>
                <TextAreaField label='Note courte' readonly={false}
                  value={String(c.note ?? '')}
                  onChange={(next) => onChange({ note: next } as any)}
                  placeholder='Ex. coin déchiré, graphie difficile…'
                  minHeightClassName='min-h-[90px]' />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  const observationsBlock = (
    <div className='rounded-xl border border-slate-200 bg-white'>
      <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
        <div className='text-sm font-semibold text-slate-900'>Observations sur cette version</div>
        <div className='mt-1 text-xs text-slate-600'>État, repro, dommages, écriture & lisibilité.</div>
      </div>
      <div className='p-4 space-y-5'>
        <div>
          <div className='text-sm font-semibold text-slate-900'>État, reproduction & dommages</div>
          <div className='mt-3 grid grid-cols-1 gap-4 md:grid-cols-12'>
            <div className='md:col-span-6'>
              <div className='text-xs font-medium text-slate-700'>Condition physique</div>
              <RefSinglePickerSmart table='ref_physical_condition' mode='edit' actionsInvisible={false}
                value={(c.physical_condition_ref ?? null) as any}
                onChange={(next) => onChange({ physical_condition_ref: next } as any)}
                titleOverride='État physique' />
            </div>
            <div className='md:col-span-6'>
              <div className='text-xs font-medium text-slate-700'>Qualité de reproduction</div>
              <RefSinglePickerSmart table='ref_repro_quality' mode='edit' actionsInvisible={false}
                value={(c.repro_quality_ref ?? null) as any}
                onChange={(next) => onChange({ repro_quality_ref: next } as any)} />
            </div>
            <div className='md:col-span-12'>
              <TextAreaField label='Notes sur la qualité de reproduction' readonly={false}
                value={String(c.repro_notes ?? '')}
                onChange={(next) => onChange({ repro_notes: next } as any)}
                placeholder='Ex. scan flou, contraste insuffisant, bord coupé…'
                minHeightClassName='min-h-[90px]' />
            </div>
            <div className='md:col-span-12'>
              <div className='text-xs font-medium text-slate-700'>Dommages</div>
              <RefSinglePickerSmart table='ref_document_damage_kinds' mode='edit' actionsInvisible={false} multi
                value={(c.document_damage_kinds_ids ?? null) as any}
                onChange={(next) => onChange({ document_damage_kinds_ids: next } as any)} />
            </div>
            <div className='md:col-span-12'>
              <TextAreaField label='Notes sur les dommages' readonly={false}
                value={String(c.damage_notes ?? '')}
                onChange={(next) => onChange({ damage_notes: next } as any)}
                placeholder='Ex. coin inférieur droit déchiré, encre passée…'
                minHeightClassName='min-h-[90px]' />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <div className='text-sm font-semibold text-slate-900'>Écriture, langue & lisibilité</div>
          <div className='mt-3 grid grid-cols-1 gap-4 md:grid-cols-12'>
            <div className='md:col-span-4'>
              <div className='text-xs font-medium text-slate-700'>Langue</div>
              <RefSinglePickerSmart table='ref_langues' mode='edit' actionsInvisible={false}
                value={(c.langue_ref ?? null) as any}
                onChange={(next) => onChange({ langue_ref: next } as any)} />
            </div>
            <div className='md:col-span-4'>
              <div className='text-xs font-medium text-slate-700'>Écriture</div>
              <RefSinglePickerSmart table='ref_ecritures' mode='edit' actionsInvisible={false}
                value={(c.ecriture_ref ?? null) as any}
                onChange={(next) => onChange({ ecriture_ref: next } as any)} />
            </div>
            {c.ecriture_ref && (
              <div className='md:col-span-4'>
                <div className='text-xs font-medium text-slate-700'>Lisibilité</div>
                <RefSinglePickerSmart table='ref_handwriting_legibility' mode='edit' actionsInvisible={false}
                  value={(c.handwriting_legibility_ref ?? null) as any}
                  onChange={(next) => onChange({ handwriting_legibility_ref: next } as any)} />
              </div>
            )}
            {c.ecriture_ref && (
              <div className='md:col-span-12'>
                <div className='text-xs font-medium text-slate-700'>Caractéristiques de lisibilité</div>
                <RefSinglePickerSmart table='ref_document_readability_features' mode='edit' actionsInvisible={false} multi
                  value={(c.document_readability_features_ids ?? null) as any}
                  onChange={(next) => onChange({ document_readability_features_ids: next } as any)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {/* Toggle court / complet */}
      <div className='mb-4 flex items-center justify-end'>
        <Tabs value={variant} onValueChange={(v) => setVariant(v as 'short' | 'full')}>
          <TabsList>
            <TabsTrigger value='short' className='text-xs'>
              <StatusIcon /> <span className='ml-1.5'>Formulaire court</span>
            </TabsTrigger>
            <TabsTrigger value='full' className='text-xs'>Formulaire complet</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {variant === 'short' && (
        <div className='space-y-4'>
          {statutBlock}
          {localisationBlock}
          {marquesBlock(false)}
        </div>
      )}

      {variant === 'full' && (
        <div className='space-y-4'>
          {statutBlock}
          {localisationBlock}
          {observationsBlock}
          {marquesBlock(true)}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function EnrichirExemplaireActePage() {
  const { citationId } = useParams<{ citationId: string }>()
  const navigate = useNavigate()

  const [draft, setDraft] = useState<ActeCitationDraft | null>(null)
  const [uniteTitre, setUniteTitre] = useState<string | null>(null)
  const [institutionLabel, setInstitutionLabel] = useState<string | null>(null)
  const [coteLocale, setCoteLocale] = useState<string | null>(null)
  const [couvertureLabelDraft, setCouvertureLabelDraft] = useState<string>('')
  const [couvertureLabelLocked, setCouvertureLabelLocked] = useState(true)
  const labelRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!citationId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      const { data: row, error: err } = await supabase
        .from('citations')
        .select(
          'id, target_id, exemplaire_id, is_missing, lacune, lacune_note, note, sort_order,' +
          'physical_condition_ref, repro_quality_ref,' +
          'document_damage_kinds_ids, document_readability_features_ids,' +
          'langue_ref, marks, locating, marginalia, writing',
        )
        .eq('id', citationId)
        .single()

      if (cancelled) return
      if (err) { setError(err.message); setLoading(false); return }

      let pick: any = null
      if (row.exemplaire_id) {
        const { data } = await supabase
          .from('v_exemplaires_pick')
          .select(
            'exemplaire_id,nature_ref,nature_code,nature_label,support_ref,support_code,support_label,' +
            'unite_id,unite_titre,cote_locale,pagination_type_ref,pagination_type_code,pagination_type_label,' +
            'nb_pages,depot_nom,depot_is_online,depot_is_physical,institution_nom,institution_sigle,' +
            'url_base,plateforme_code,source_exemplaire_id,identifiant_interne,localisation_interne,' +
            'physical_condition_ref,physical_condition_code,physical_condition_label',
          )
          .eq('exemplaire_id', row.exemplaire_id)
          .maybeSingle()
        if (!cancelled) pick = data
      }

      let couvertureLabel: string | null = null
      if (row.exemplaire_id) {
        const { data: exRow } = await supabase
          .from('ref_exemplaires')
          .select('couverture_label')
          .eq('id', row.exemplaire_id)
          .maybeSingle()
        couvertureLabel = exRow?.couverture_label ?? null
      }

      if (!cancelled) {
        setDraft(normalizeCitationRow(row, pick))
        setUniteTitre(pick?.unite_titre ?? null)
        setInstitutionLabel(pick?.institution_sigle ?? pick?.institution_nom ?? null)
        setCoteLocale(pick?.cote_locale ?? null)
        const hasCustomLabel = couvertureLabel !== null && couvertureLabel !== ''
        setCouvertureLabelDraft(couvertureLabel ?? '')
        setCouvertureLabelLocked(!hasCustomLabel)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [citationId])

  const handleChange = useCallback((patch: Partial<ActeCitationDraft>) => {
    setDraft(prev => prev ? { ...prev, ...(patch as any) } : prev)
    setSaved(false)
    setSaveError(null)
  }, [])

  const handleSave = async () => {
    if (!draft || !citationId) return
    setSaving(true)
    setSaveError(null)

    const payload = {
      is_missing: toBoolOrNull((draft as any).is_missing),
      lacune: toBoolOrNull((draft as any).lacune),
      lacune_note: ((draft as any).lacune_note ?? '').trim() || null,
      note: (draft.note ?? '').trim() || null,
      physical_condition_ref: toUuidOrNull((draft as any).physical_condition_ref),
      repro_quality_ref: toUuidOrNull((draft as any).repro_quality_ref),
      document_damage_kinds_ids: Array.isArray((draft as any).document_damage_kinds_ids)
        ? (draft as any).document_damage_kinds_ids : [],
      document_readability_features_ids: Array.isArray((draft as any).document_readability_features_ids)
        ? (draft as any).document_readability_features_ids : [],
      langue_ref: (draft as any).langue_ref ?? null,
      marks: ((draft as any).marks ?? '').trim() || null,
      locating: packLocating(draft),
      marginalia: packMarginalia(draft),
      writing: packWriting(draft),
    }

    const { error: err } = await supabase
      .from('citations')
      .update(payload)
      .eq('id', citationId)

    if (err) { setSaving(false); setSaveError(err.message); return }

    if (draft.exemplaire_id) {
      const couvertureToSave = couvertureLabelLocked ? null : (couvertureLabelDraft.trim() || null)
      const { error: labelErr } = await supabase
        .from('ref_exemplaires')
        .update({ couverture_label: couvertureToSave })
        .eq('id', draft.exemplaire_id)
      if (labelErr) { setSaving(false); setSaveError(labelErr.message); return }
    }

    setSaving(false)
    setSaved(true)
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <Loader2 className='w-6 h-6 text-gray-400 animate-spin' />
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-sm text-red-600 mb-3'>{error ?? 'Citation introuvable'}</p>
          <button onClick={() => navigate('/mock/sources-corpus')} className='text-sm text-gray-500 hover:text-gray-700'>
            ← Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3 min-w-0'>
          <button
            onClick={() => navigate('/mock/sources-corpus')}
            className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0'
          >
            <ChevronLeft className='w-4 h-4' />
            Exemplaires
          </button>
          <span className='text-gray-300'>/</span>
          <div className='min-w-0'>
            <span className='text-sm font-semibold text-gray-900 truncate block'>
              {uniteTitre ?? 'Document sans titre'}
            </span>
            <span className='text-xs text-gray-400'>
              {[institutionLabel, coteLocale].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>

        <div className='flex items-center gap-3 shrink-0'>
          {saveError && <p className='text-xs text-red-600 max-w-xs truncate'>{saveError}</p>}
          {saved && !saveError && <p className='text-xs text-emerald-600'>Enregistré</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className='flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors'
          >
            {saving ? <Loader2 className='w-4 h-4 animate-spin' /> : <Save className='w-4 h-4' />}
            Enregistrer
          </button>
        </div>
      </header>

      <main className='max-w-2xl mx-auto px-6 py-6 space-y-4'>
        {/* Libellé de l'exemplaire */}
        <div className='rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3'>
          <div>
            <div className='text-sm font-semibold text-slate-900'>Libellé de l'exemplaire</div>
            <div className='mt-0.5 text-xs text-slate-500'>
              Libellé affiché sur cet exemplaire. Par défaut hérité du titre du document.
            </div>
          </div>

          <div className='w-full md:max-w-xl'>
            <div className='flex items-center gap-2 w-full'>
              <input
                ref={labelRef}
                value={couvertureLabelLocked ? (uniteTitre ?? '') : couvertureLabelDraft}
                onChange={(e) => {
                  if (!couvertureLabelLocked) {
                    setCouvertureLabelDraft(e.target.value)
                    setSaved(false)
                  }
                }}
                readOnly={couvertureLabelLocked}
                className={[
                  'w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none',
                  couvertureLabelLocked
                    ? 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-slate-400',
                ].join(' ')}
                placeholder='Ex : Registre des naissances 1880–1885'
              />

              <button
                type='button'
                onClick={() => {
                  if (couvertureLabelLocked) {
                    if (!window.confirm(
                      'Le libellé est normalement hérité du document. Voulez-vous le personnaliser pour cet exemplaire ?'
                    )) return
                    setCouvertureLabelDraft(uniteTitre ?? '')
                  }
                  setCouvertureLabelLocked((v) => !v)
                  setTimeout(() => labelRef.current?.focus(), 50)
                }}
                className={[
                  'inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm shrink-0',
                  couvertureLabelLocked
                    ? 'border-slate-200 bg-white hover:bg-slate-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
                ].join(' ')}
                title={couvertureLabelLocked ? 'Personnaliser le libellé' : 'Verrouiller (utiliser le titre du document)'}
              >
                {couvertureLabelLocked
                  ? <Lock className='h-4 w-4 text-slate-700' />
                  : <Unlock className='h-4 w-4 text-slate-800' />}
              </button>
            </div>

            {couvertureLabelLocked ? (
              <p className='mt-1 text-xs text-slate-500'>Cliquez sur le cadenas pour personnaliser.</p>
            ) : (
              <p className='mt-1 text-xs text-amber-700'>Libellé personnalisé — pensez à enregistrer.</p>
            )}
          </div>
        </div>

        <ActeEnrichissementForm draft={draft} onChange={handleChange} />
      </main>
    </div>
  )
}
