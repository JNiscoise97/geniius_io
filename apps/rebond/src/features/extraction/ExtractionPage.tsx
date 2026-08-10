// ExtractionPage.tsx
// Module Extraction : transforme une version de transcription figée en une
// liste d'assertions documentaires atomiques via un agent IA (Anthropic,
// appelé côté serveur uniquement — voir supabase/functions/extract-assertions).
//
// Écran pleine largeur (refondu le 2026-08-08, sur demande explicite —
// l'ancien layout à deux colonnes texte/assertions ne convenait pas) :
// texte source dans une carte repliable en haut, grandes icônes animées
// pendant l'extraction (pas de progression fine possible : l'appel serveur
// est un aller-retour unique, pas un flux d'événements), puis une fenêtre de
// résumé chiffré à la fin, et la liste d'assertions en pleine largeur en
// dessous — plus de synchronisation surbrillance texte/ligne au survol
// (les deux zones ne sont plus côte à côte) : chaque ligne d'assertion garde
// sa citation exacte pour la vérification, qui ne dépend donc pas de la
// disposition à deux panneaux.

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Loader2, Sparkles, CheckCircle2, XCircle, RotateCcw, AlertCircle,
  ChevronDown, ChevronRight, FileText, BrainCircuit, ListChecks, Pencil, Plus,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { fetchExemplaireContext } from '../atelier/atelier.service'
import { tiptapJsonToPlainText } from '../atelier/tiptap/tiptapText'
import {
  fetchVersion, fetchEntities, fetchAssertions, setAssertionStatus, runExtraction, describeAssertion,
  fetchPredicates, createManualAssertion, updateAssertion, createManualEntity, DEPRECATED_PREDICATE_CODES,
} from './extraction.service'
import type { ManualAssertionInput } from './extraction.service'
import { ensureEntitiesPromoted } from '../entites/entites.service'
import type { ExtractionEntity, ExtractionAssertion, AssertionStatus, EntityType, Predicate } from './extraction.types'

type Ctx = {
  documentId: string
  documentTitre: string
  coteLocale: string | null
}

type StatusFilter = 'tous' | AssertionStatus

const STATUS_CONFIG: Record<AssertionStatus, { label: string; color: string; markClass: string }> = {
  pending:   { label: 'À valider', color: 'text-amber-700 bg-amber-50 border-amber-200',     markClass: 'bg-amber-100' },
  validated: { label: 'Validée',   color: 'text-emerald-700 bg-emerald-50 border-emerald-200', markClass: 'bg-emerald-100' },
  rejected:  { label: 'Rejetée',   color: 'text-gray-400 bg-gray-50 border-gray-200',          markClass: 'bg-gray-100 line-through decoration-gray-300' },
}

// describeAssertion (+ son helper entityLabel) vit désormais dans
// extraction.service.ts — réutilisé tel quel par le module Entités
// (entites.service.ts) pour ne pas dupliquer ce switch de formulations.

// Affichage statique du texte source avec les passages cités surlignés,
// colorés par statut — plus de survol/synchronisation avec les lignes
// d'assertions (les deux zones ne sont plus côte à côte), juste un aperçu
// visuel de ce qui a été couvert par l'extraction.
function HighlightedText({ text, assertions }: { text: string; assertions: ExtractionAssertion[] }) {
  const spans = assertions
    .filter(a => a.sourceStart != null && a.sourceEnd != null && a.sourceEnd! > a.sourceStart!)
    .sort((a, b) => (a.sourceStart! - b.sourceStart!))

  const out: React.ReactNode[] = []
  let cursor = 0
  for (const a of spans) {
    if (a.sourceStart! < cursor) continue
    if (a.sourceStart! > cursor) out.push(text.slice(cursor, a.sourceStart!))
    const cfg = STATUS_CONFIG[a.status]
    out.push(<mark key={a.id} className={`rounded-sm ${cfg.markClass}`}>{text.slice(a.sourceStart!, a.sourceEnd!)}</mark>)
    cursor = a.sourceEnd!
  }
  if (cursor < text.length) out.push(text.slice(cursor))

  return <p className="whitespace-pre-wrap leading-relaxed text-[15px] text-gray-800">{out}</p>
}

function SourceTextCard({ text, assertions }: { text: string; assertions: ExtractionAssertion[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50/60 transition-colors rounded-xl"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <FileText className="w-4 h-4 text-gray-400" />Texte source
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          {text ? <HighlightedText text={text} assertions={assertions} /> : (
            <p className="text-sm text-gray-400 italic">Cette version n'a aucun contenu.</p>
          )}
        </div>
      )}
    </div>
  )
}

// Pas de progression fine possible côté UI : l'Edge Function fait un aller-
// retour unique (deux appels Claude en interne, mais aucun événement
// streamé côté client) — ces trois étapes sont donc décoratives, pas un
// vrai indicateur d'avancement, juste pour donner un signal visuel fort
// pendant les ~20-30s d'attente réelle.
function LoadingState() {
  const steps = [
    { icon: FileText, label: 'Lecture du texte' },
    { icon: BrainCircuit, label: "Analyse par l'agent IA" },
    { icon: ListChecks, label: 'Extraction des assertions' },
  ]
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-8">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <s.icon className="w-8 h-8 text-indigo-500" />
            </div>
            <span className="text-xs text-gray-400">{s.label}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />Extraction en cours — généralement 20 à 30 secondes…
      </p>
    </div>
  )
}

function ExtractionSummaryDialog({ open, onClose, assertions, entities }: {
  open: boolean
  onClose: () => void
  assertions: ExtractionAssertion[]
  entities: ExtractionEntity[]
}) {
  const byType: Record<EntityType, number> = { person: 0, document: 0, place: 0, event: 0 }
  for (const e of entities) byType[e.entityType]++
  const otherAssertions = assertions.filter(a => a.predicateCode === 'other')

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" />Extraction terminée</DialogTitle>
          <DialogDescription>Résumé de ce que l'agent a trouvé dans ce texte.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-gray-900">{assertions.length}</span>
            <span className="text-sm text-gray-500">assertion{assertions.length > 1 ? 's' : ''}</span>
          </div>
          {otherAssertions.length > 0 && (
            <div className="pl-1 space-y-1.5">
              <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {otherAssertions.length} non catégorisée{otherAssertions.length > 1 ? 's' : ''} ("other")
              </p>
              <ul className="space-y-1 pl-1">
                {otherAssertions.map(a => (
                  <li key={a.id} className="text-xs text-gray-500">— {describeAssertion(a, entities)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        <div className="space-y-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-gray-900">{entities.length}</span>
            <span className="text-sm text-gray-500">entité{entities.length > 1 ? 's' : ''}</span>
          </div>
          <ul className="pl-1 space-y-0.5 text-xs text-gray-500">
            <li>{byType.person} personne{byType.person !== 1 ? 's' : ''}</li>
            <li>{byType.place} lieu{byType.place > 1 ? 'x' : ''}</li>
            <li>{byType.event} événement{byType.event !== 1 ? 's' : ''}</li>
          </ul>
        </div>

        <DialogFooter>
          <button onClick={onClose}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Voir les assertions
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AssertionRow({ assertion, label, onSetStatus, onEdit }: {
  assertion: ExtractionAssertion
  label: string
  onSetStatus: (id: string, status: AssertionStatus) => void
  onEdit: () => void
}) {
  const cfg = STATUS_CONFIG[assertion.status]
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3.5 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-800">{label}</p>
        <span className="flex items-center gap-1.5 shrink-0">
          {assertion.origin === 'manual' && (
            <span className="text-[10px] font-medium rounded-full border px-2 py-0.5 text-violet-700 bg-violet-50 border-violet-200">Manuelle</span>
          )}
          <span className={`text-[10px] font-medium rounded-full border px-2 py-0.5 ${cfg.color}`}>{cfg.label}</span>
        </span>
      </div>
      {assertion.sourceText && (
        <p className="text-xs text-gray-400 italic">« {assertion.sourceText} »</p>
      )}
      {assertion.status !== 'validated' && (
        <button onClick={() => onSetStatus(assertion.id, 'validated')}
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors mr-3">
          <CheckCircle2 className="w-3.5 h-3.5" />Valider
        </button>
      )}
      {assertion.status !== 'rejected' && (
        <button onClick={() => onSetStatus(assertion.id, 'rejected')}
          className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-800 transition-colors mr-3">
          <XCircle className="w-3.5 h-3.5" />Rejeter
        </button>
      )}
      {assertion.status !== 'pending' && (
        <button onClick={() => onSetStatus(assertion.id, 'pending')}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors mr-3">
          <RotateCcw className="w-3.5 h-3.5" />Remettre à valider
        </button>
      )}
      <button onClick={onEdit}
        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
        <Pencil className="w-3.5 h-3.5" />Éditer
      </button>
    </div>
  )
}

const NEW_ENTITY_VALUE = '__new__'

// Formulaire partagé ajout/édition — édition : le sujet reste fixe (changer
// QUI est concerné revient à recréer l'assertion, pas à la corriger, hors
// périmètre volontairement pour rester simple). Ajout : le sujet peut être
// une entité existante ou une toute nouvelle (créée à la volée avant
// l'assertion elle-même, cf. createManualEntity).
function AssertionFormDialog({ open, onClose, entities, predicates, transcriptionVersionId, initial, onSaved }: {
  open: boolean
  onClose: () => void
  entities: ExtractionEntity[]
  predicates: Predicate[]
  transcriptionVersionId: string
  initial: ExtractionAssertion | null
  onSaved: () => void
}) {
  const isEdit = !!initial
  const [subjectEntityId, setSubjectEntityId] = useState(initial?.subjectEntityId ?? entities[0]?.id ?? '')
  const [newSubjectLabel, setNewSubjectLabel] = useState('')
  const [newSubjectType, setNewSubjectType] = useState<EntityType>('person')
  const [predicateCode, setPredicateCode] = useState(initial?.predicateCode ?? 'other')
  const [rawRelation, setRawRelation] = useState(initial?.rawRelation ?? '')
  const [objectEntityId, setObjectEntityId] = useState(initial?.objectEntityId ?? '')
  const [valueText, setValueText] = useState(initial?.valueText ?? '')
  const [sourceText, setSourceText] = useState(initial?.sourceText ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSubjectEntityId(initial?.subjectEntityId ?? entities[0]?.id ?? '')
    setNewSubjectLabel('')
    setNewSubjectType('person')
    setPredicateCode(initial?.predicateCode ?? 'other')
    setRawRelation(initial?.rawRelation ?? '')
    setObjectEntityId(initial?.objectEntityId ?? '')
    setValueText(initial?.valueText ?? '')
    setSourceText(initial?.sourceText ?? '')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])

  const selectablePredicates = predicates.filter(p => !DEPRECATED_PREDICATE_CODES.has(p.code))

  async function handleSubmit() {
    if (saving) return
    if (!isEdit && subjectEntityId === NEW_ENTITY_VALUE && !newSubjectLabel.trim()) {
      setError('Le nom de la nouvelle entité est requis.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      let resolvedSubjectId = subjectEntityId
      if (!isEdit && subjectEntityId === NEW_ENTITY_VALUE) {
        const created = await createManualEntity(transcriptionVersionId, newSubjectLabel.trim(), newSubjectType)
        resolvedSubjectId = created.id
      }
      const input: ManualAssertionInput = {
        subjectEntityId: resolvedSubjectId,
        predicateCode,
        rawRelation: predicateCode === 'other' ? (rawRelation.trim() || null) : null,
        objectEntityId: objectEntityId || null,
        valueText: valueText.trim() || null,
        sourceText: sourceText.trim() || null,
      }
      if (isEdit) await updateAssertion(initial!.id, input)
      else await createManualAssertion(transcriptionVersionId, input)
      // Une assertion manuelle est déjà 'validated' à la création (cf.
      // extraction.service.ts) — la promotion vers Entités qui se déclenche
      // normalement au clic "Valider" ne passe pas par ce chemin, il faut
      // l'appeler explicitement ici pour rester cohérent.
      ensureEntitiesPromoted([resolvedSubjectId, input.objectEntityId]).catch(() => {})
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const selectCls = 'w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Corriger l'assertion" : 'Ajouter une assertion'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Le contenu corrigé remplace ce que l'IA avait produit et sera marqué \"Manuelle\"."
              : "Un fait que l'extraction n'a pas trouvé — sera marqué \"Manuelle\" et directement validé."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sujet</label>
            {isEdit ? (
              <p className="text-sm text-gray-700 px-2.5 py-2 bg-gray-50 rounded-lg border border-gray-100">
                {entities.find(e => e.id === subjectEntityId)?.label ?? subjectEntityId}
              </p>
            ) : (
              <>
                <select value={subjectEntityId} onChange={e => setSubjectEntityId(e.target.value)} className={selectCls}>
                  {entities.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                  <option value={NEW_ENTITY_VALUE}>+ Nouvelle entité…</option>
                </select>
                {subjectEntityId === NEW_ENTITY_VALUE && (
                  <div className="flex gap-2 mt-1.5">
                    <input value={newSubjectLabel} onChange={e => setNewSubjectLabel(e.target.value)}
                      placeholder="Nom de la personne/du lieu…" className={inputCls} />
                    <select value={newSubjectType} onChange={e => setNewSubjectType(e.target.value as EntityType)}
                      className={`${selectCls} w-40 shrink-0`}>
                      <option value="person">Personne</option>
                      <option value="place">Lieu</option>
                      <option value="document">Document</option>
                      <option value="event">Événement</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prédicat</label>
            <select value={predicateCode} onChange={e => setPredicateCode(e.target.value)} className={selectCls}>
              {selectablePredicates.map(p => <option key={p.code} value={p.code}>{p.label} ({p.code})</option>)}
            </select>
          </div>

          {predicateCode === 'other' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Relation (texte libre)</label>
              <input value={rawRelation} onChange={e => setRawRelation(e.target.value)}
                placeholder='ex. "cousin germain du futur époux"' className={inputCls} />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Objet (si l'assertion relie deux entités)</label>
            <select value={objectEntityId} onChange={e => setObjectEntityId(e.target.value)} className={selectCls}>
              <option value="">Aucun</option>
              {entities.filter(e => e.id !== subjectEntityId).map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Valeur</label>
            <input value={valueText} onChange={e => setValueText(e.target.value)}
              placeholder="ex. cultivateur, 1875-02-10…" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Texte source (citation, optionnel)</label>
            <textarea value={sourceText} onChange={e => setSourceText(e.target.value)}
              placeholder="Passage exact qui justifie ce fait…" className={`${inputCls} min-h-[60px] resize-none`} />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>

        <DialogFooter>
          <button onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isEdit ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />)}
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ExtractionPage() {
  const { exemplaireId, versionId } = useParams<{ exemplaireId: string; versionId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [versionNumber, setVersionNumber] = useState<number | null>(null)
  const [plainText, setPlainText] = useState('')
  const [entities, setEntities] = useState<ExtractionEntity[]>([])
  const [assertions, setAssertions] = useState<ExtractionAssertion[]>([])
  const [predicates, setPredicates] = useState<Predicate[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')

  const [extracting, setExtracting] = useState(false)
  const [confirmReextractOpen, setConfirmReextractOpen] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAssertion, setEditingAssertion] = useState<ExtractionAssertion | null>(null)

  useEffect(() => {
    if (!exemplaireId || !versionId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const [{ data: exCtx }, version] = await Promise.all([
        fetchExemplaireContext(exemplaireId!),
        fetchVersion(versionId!),
      ])
      if (cancelled) return
      if (!exCtx || !version) { setNotFound(true); setLoading(false); return }

      const docRel = Array.isArray((exCtx as any).unites_documentaires) ? (exCtx as any).unites_documentaires[0] : (exCtx as any).unites_documentaires
      setCtx({
        documentId: (exCtx as any).unite_documentaire_id,
        documentTitre: docRel?.titre ?? 'Document',
        coteLocale: (exCtx as any).cote_locale ?? null,
      })
      setVersionNumber(version.version)
      setPlainText(tiptapJsonToPlainText(version.contenu))

      const [entitiesList, assertionsList, predicatesList] = await Promise.all([
        fetchEntities(versionId!),
        fetchAssertions(versionId!),
        fetchPredicates(),
      ])
      if (cancelled) return
      setEntities(entitiesList)
      setAssertions(assertionsList)
      setPredicates(predicatesList)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [exemplaireId, versionId])

  async function reloadEntitiesAndAssertions() {
    if (!versionId) return
    const [entitiesList, assertionsList] = await Promise.all([
      fetchEntities(versionId),
      fetchAssertions(versionId),
    ])
    setEntities(entitiesList)
    setAssertions(assertionsList)
  }

  function handleOpenAdd() {
    setEditingAssertion(null)
    setFormOpen(true)
  }

  function handleOpenEdit(assertion: ExtractionAssertion) {
    setEditingAssertion(assertion)
    setFormOpen(true)
  }

  async function doExtract() {
    if (!versionId || extracting) return
    setConfirmReextractOpen(false)
    setExtracting(true)
    setExtractionError(null)
    try {
      await runExtraction(versionId, plainText)
      const [entitiesList, assertionsList] = await Promise.all([
        fetchEntities(versionId),
        fetchAssertions(versionId),
      ])
      setEntities(entitiesList)
      setAssertions(assertionsList)
      setShowSummary(true)
    } catch (err: any) {
      setExtractionError(err?.message ?? "Erreur lors de l'extraction")
    } finally {
      setExtracting(false)
    }
  }

  function handleExtractClick() {
    if (assertions.length > 0) setConfirmReextractOpen(true)
    else doExtract()
  }

  async function handleSetStatus(id: string, status: AssertionStatus) {
    setAssertions(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    try {
      await setAssertionStatus(id, status)
      // Promotion vers le registre canonique (module Entités) : une
      // assertion validée fait exister ses entités (personne/lieu) au-delà
      // de cet acte précis. Idempotent, best-effort — ne bloque jamais la
      // validation elle-même si la promotion échoue.
      if (status === 'validated') {
        const a = assertions.find(x => x.id === id)
        if (a) ensureEntitiesPromoted([a.subjectEntityId, a.objectEntityId]).catch(() => {})
      }
    } catch {
      // best-effort — pas de rollback visuel pour rester simple au MVP
    }
  }

  const filteredAssertions = statusFilter === 'tous' ? assertions : assertions.filter(a => a.status === statusFilter)
  const counts = {
    pending: assertions.filter(a => a.status === 'pending').length,
    validated: assertions.filter(a => a.status === 'validated').length,
    rejected: assertions.filter(a => a.status === 'rejected').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />Chargement de l'extraction…
        </div>
      </div>
    )
  }

  if (notFound || !ctx) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-rose-200 p-6 max-w-sm text-center">
          <p className="text-sm font-medium text-gray-800">Version introuvable</p>
          <button onClick={() => navigate('/atelier-documentaire')} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800">
            Retour à l'atelier documentaire
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0 flex-wrap">
            <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors shrink-0">
              <LayoutDashboard className="w-4 h-4" />Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <Link to="/extraction" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors shrink-0">
              <Sparkles className="w-4 h-4" />Extraction
            </Link>
            <span className="text-gray-300">/</span>
            <Link to={`/atelier-documentaire/exemplaires/${exemplaireId}`} className="hover:text-gray-700 transition-colors truncate">
              {ctx.coteLocale || 'Exemplaire'}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900 truncate">Extraction — version {versionNumber}</span>
          </div>
          <button
            onClick={handleExtractClick}
            disabled={extracting}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {assertions.length > 0 ? "Relancer l'extraction" : "Lancer l'extraction"}
          </button>
        </div>
      </div>

      <Dialog open={confirmReextractOpen} onOpenChange={setConfirmReextractOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relancer l'extraction ?</DialogTitle>
            <DialogDescription>
              {assertions.length} assertion{assertions.length > 1 ? 's' : ''} existent déjà pour cette version, y compris
              celles déjà validées ou rejetées. Relancer l'extraction les remplace intégralement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setConfirmReextractOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button onClick={doExtract}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />Relancer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExtractionSummaryDialog
        open={showSummary && !extracting}
        onClose={() => setShowSummary(false)}
        assertions={assertions}
        entities={entities}
      />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <SourceTextCard text={plainText} assertions={assertions} />

        {extractionError && (
          <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {extractionError}
          </div>
        )}

        {extracting ? (
          <LoadingState />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">Assertions</div>
                <button onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                  <Plus className="w-3.5 h-3.5" />Ajouter une assertion
                </button>
              </div>
              {assertions.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {([
                    ['tous', `Toutes (${assertions.length})`],
                    ['pending', `À valider (${counts.pending})`],
                    ['validated', `Validées (${counts.validated})`],
                    ['rejected', `Rejetées (${counts.rejected})`],
                  ] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setStatusFilter(key)}
                      className={`text-[11px] font-medium rounded-full px-2.5 py-1 border transition-colors ${
                        statusFilter === key ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 space-y-2.5">
              {assertions.length === 0 && (
                <p className="text-sm text-gray-400 italic px-1 py-2">
                  Aucune assertion pour l'instant — clique sur "Lancer l'extraction".
                </p>
              )}
              {filteredAssertions.map(a => (
                <AssertionRow
                  key={a.id}
                  assertion={a}
                  label={describeAssertion(a, entities)}
                  onSetStatus={handleSetStatus}
                  onEdit={() => handleOpenEdit(a)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <AssertionFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        entities={entities}
        predicates={predicates}
        transcriptionVersionId={versionId!}
        initial={editingAssertion}
        onSaved={reloadEntitiesAndAssertions}
      />
    </div>
  )
}

export default ExtractionPage
