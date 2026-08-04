// DocumentDetailPage.tsx
// Vue détail d'un document (ref_unites_documentaires) — tous les champs de la
// sheet "Décrire", mais en édition continue : un seul bouton "Enregistrer" en
// haut, actif dès qu'un champ change (pas de workflow_statut à faire évoluer ici).

import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Save, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart'
import { TriStateButton } from '@/components/shared/TriStateButton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { fetchRoleDocumentOptions } from './patrimoine.service'

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
const selectCls = `${inputCls} cursor-pointer`

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

function toIntOrNull(v: string): number | null {
  const s = v.trim()
  if (!s || !/^\d+$/.test(s)) return null
  return Number(s)
}

type RoleOption = { id: string; code: string; label: string }

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [titre, setTitre] = useState('')
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([])

  const [typeUniteRef,       setTypeUniteRef]       = useState<string | null>(null)
  const [roleRef,            setRoleRef]            = useState('')
  const [langueRef,          setLangueRef]          = useState<string | null>(null)
  const [periode,            setPeriode]            = useState('')
  const [identifiantInterne, setIdentifiantInterne] = useState('')
  const [description,        setDescription]        = useState('')
  const [niveauFiabilite,    setNiveauFiabilite]    = useState<'haute' | 'moyenne' | 'basse' | null>(null)
  const [note,               setNote]               = useState('')

  const [exemplaireId,         setExemplaireId]         = useState<string | null>(null)
  const [natureRef,            setNatureRef]            = useState<string | null>(null)
  const [supportRef,           setSupportRef]           = useState<string | null>(null)
  const [paginationTypeRef,    setPaginationTypeRef]    = useState<string | null>(null)
  const [nbPages,              setNbPages]              = useState('')
  const [conditionnement,      setConditionnement]      = useState('')
  const [physicalConditionRef, setPhysicalConditionRef] = useState<string | null>(null)

  const [citationId,      setCitationId]      = useState<string | null>(null)
  const [acteIsMissing,   setActeIsMissing]   = useState<boolean | null>(null)
  const [acteLacune,      setActeLacune]      = useState<boolean | null>(null)
  const [acteLacuneNote,  setActeLacuneNote]  = useState('')
  const [actePosition,    setActePosition]    = useState('')
  const [reproQualityRef, setReproQualityRef] = useState<string | null>(null)
  const [marks,           setMarks]           = useState('')
  const [citationNote,    setCitationNote]    = useState('')
  const [ecritureRef,              setEcritureRef]              = useState<string | null>(null)
  const [handwritingLegibilityRef, setHandwritingLegibilityRef] = useState<string | null>(null)
  const [damageNotes,              setDamageNotes]              = useState('')
  const [reproNotes,               setReproNotes]               = useState('')
  const [signaturesPresent,        setSignaturesPresent]        = useState<boolean | null>(null)
  const [signaturesCount,          setSignaturesCount]          = useState<number | null>(null)
  const [marginalMentionsPresent,  setMarginalMentionsPresent]  = useState<boolean | null>(null)
  const [marginalMentionsCount,    setMarginalMentionsCount]    = useState<number | null>(null)
  const [marginalCrossoutsPresent, setMarginalCrossoutsPresent] = useState<boolean | null>(null)
  const [marginalCrossoutsCount,   setMarginalCrossoutsCount]   = useState<number | null>(null)
  const [acteFormVariant, setActeFormVariant] = useState<'short' | 'full'>('full')

  const [ancestors, setAncestors] = useState<Array<{ id: string; titre: string }>>([])
  const [children,  setChildren]  = useState<Array<{ id: string; titre: string }>>([])

  const isActe = roleOptions.find(o => o.id === roleRef)?.code === 'ACTE_PRIMAIRE'
  const isTable = roleOptions.find(o => o.id === roleRef)?.code === 'INSTRUMENT_DE_RECHERCHE'
  const showStatutSection = isActe || isTable
  const snapshotRef = useRef<string>('')

  function getTrackedValues() {
    return {
      typeUniteRef, roleRef, langueRef, periode, identifiantInterne, description, niveauFiabilite, note,
      natureRef, supportRef, paginationTypeRef, nbPages, conditionnement, physicalConditionRef,
      acteIsMissing, acteLacune, acteLacuneNote, actePosition, reproQualityRef, marks, citationNote,
      ecritureRef, handwritingLegibilityRef, damageNotes, reproNotes,
      signaturesPresent, signaturesCount, marginalMentionsPresent, marginalMentionsCount,
      marginalCrossoutsPresent, marginalCrossoutsCount,
    }
  }

  const dirty = !loading && JSON.stringify(getTrackedValues()) !== snapshotRef.current

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const roles = await fetchRoleDocumentOptions()
      if (cancelled) return
      setRoleOptions(roles)

      const { data: doc } = await supabase.from('ref_unites_documentaires')
        .select('id, titre, type_unite_ref, role_document_ref, couverture_label, langue_ref, identifiant_interne, niveau_fiabilite, metadonnees, parent_ud_id')
        .eq('id', id).maybeSingle()
      if (cancelled) return
      if (!doc) { setNotFound(true); setLoading(false); return }

      setTitre(doc.titre)
      setTypeUniteRef(doc.type_unite_ref ?? null)
      setRoleRef(doc.role_document_ref ?? '')
      setLangueRef(doc.langue_ref ?? null)
      setPeriode(doc.couverture_label ?? '')
      setIdentifiantInterne(doc.identifiant_interne ?? '')
      setNiveauFiabilite((doc.niveau_fiabilite as 'haute' | 'moyenne' | 'basse' | null) ?? null)
      setNote((doc.metadonnees as any)?.note ?? '')

      const { data: ex } = await supabase.from('ref_exemplaires')
        .select('id, nature_ref, support_ref, pagination_type_ref, nb_pages, conditionnement, physical_condition_ref, description')
        .eq('unite_documentaire_id', id).limit(1).maybeSingle()
      if (cancelled) return

      if (ex?.id) {
        setExemplaireId(ex.id)
        setNatureRef(ex.nature_ref ?? null)
        setSupportRef(ex.support_ref ?? null)
        setPaginationTypeRef(ex.pagination_type_ref ?? null)
        setNbPages(ex.nb_pages != null ? String(ex.nb_pages) : '')
        setConditionnement(ex.conditionnement ?? '')
        setPhysicalConditionRef(ex.physical_condition_ref ?? null)
        setDescription(ex.description ?? '')

        // Une citation ec_acte ou ec_table (selon le rôle du document) — jamais les deux à la fois.
        const { data: cit } = await supabase.from('citations')
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
      }

      // Hiérarchie — lecture seule
      const chain: Array<{ id: string; titre: string }> = []
      let currentId: string | null = doc.parent_ud_id
      for (let i = 0; i < 6 && currentId; i++) {
        const { data } = await supabase.from('ref_unites_documentaires')
          .select('id, titre, parent_ud_id').eq('id', currentId).maybeSingle()
        if (!data) break
        chain.push({ id: data.id, titre: data.titre })
        currentId = data.parent_ud_id
      }
      if (!cancelled) setAncestors(chain.reverse())

      const { data: kids } = await supabase.from('ref_unites_documentaires')
        .select('id, titre').eq('parent_ud_id', id).order('titre')
      if (!cancelled) setChildren(kids ?? [])

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

      const { error } = await supabase.from('ref_unites_documentaires').update({
        type_unite_ref: typeUniteRef,
        role_document_ref: roleRef || null,
        langue_ref: langueRef,
        couverture_label: periode || null,
        identifiant_interne: identifiantInterne.trim() || null,
        niveau_fiabilite: niveauFiabilite,
        metadonnees: Object.keys(meta).length ? meta : null,
      }).eq('id', id)
      if (error) throw error

      if (exemplaireId) {
        const { error: exErr } = await supabase.from('ref_exemplaires').update({
          nature_ref: natureRef,
          support_ref: supportRef,
          pagination_type_ref: paginationTypeRef,
          nb_pages: toIntOrNull(nbPages),
          conditionnement: conditionnement.trim() || null,
          physical_condition_ref: physicalConditionRef,
          description: description.trim() || null,
        }).eq('id', exemplaireId)
        if (exErr) throw exErr
      }

      if (showStatutSection && citationId) {
        const { error: citErr } = await supabase.from('citations').update({
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
        if (citErr) throw citErr
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
          <button onClick={() => navigate('/mock/sources-corpus')} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800">
            Retour à Patrimoine documentaire
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate('/mock/sources-corpus')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0">
            <ChevronLeft className="w-4 h-4" />Documents
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900 truncate">{titre}</span>
        </div>
        <button onClick={handleSave} disabled={!dirty || saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Enregistrer
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-4">
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
                  <span className="font-medium text-indigo-700">{titre} (ce document)</span>
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
              <select value={roleRef} onChange={e => setRoleRef(e.target.value)} className={selectCls}>
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

        {exemplaireId && (
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

        {showStatutSection && exemplaireId && (() => {
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
      </main>
    </div>
  )
}
