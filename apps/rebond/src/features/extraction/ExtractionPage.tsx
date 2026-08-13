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

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  LayoutDashboard, Loader2, Sparkles, CheckCircle2, XCircle, RotateCcw, AlertCircle,
  ChevronDown, ChevronRight, ChevronLeft, FileText, BrainCircuit, ListChecks, Pencil, Plus,
  Check, X, Trash2, Search, Columns2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { fetchExemplaireContext } from '../atelier/atelier.service'
import { tiptapJsonToPlainText } from '../atelier/tiptap/tiptapText'
import {
  fetchVersion, fetchEntities, fetchAssertions, setAssertionStatus, runExtraction, describeAssertion,
  fetchPredicates, createManualAssertion, updateAssertion, createManualEntity, updateEntityLabel, deleteLocalEntity,
  searchExtractedVersions, DEPRECATED_PREDICATE_CODES,
} from './extraction.service'
import type { ManualAssertionInput } from './extraction.service'
import { ensureEntitiesPromoted } from '../entites/entites.service'
import type { ActeCompareSearchResult, ExtractionEntity, ExtractionAssertion, AssertionStatus, EntityType, Predicate } from './extraction.types'

type Ctx = {
  documentId: string
  documentTitre: string
  coteLocale: string | null
}

type StatusFilter = 'tous' | AssertionStatus

const STATUS_CONFIG: Record<AssertionStatus, { label: string; color: string; markClass: string }> = {
  pending:     { label: 'À valider', color: 'text-amber-700 bg-amber-50 border-amber-200',     markClass: 'bg-amber-100' },
  validated:   { label: 'Validée',   color: 'text-emerald-700 bg-emerald-50 border-emerald-200', markClass: 'bg-emerald-100' },
  rejected:    { label: 'Rejetée',   color: 'text-gray-400 bg-gray-50 border-gray-200',          markClass: 'bg-gray-100 line-through decoration-gray-300' },
  // conflicting (2026-08-11) : deux assertions distinctes se contredisent
  // sur la même valeur (voir flagValueConflicts, extraction.service.ts) —
  // couleur distincte des trois statuts existants pour signaler qu'il faut
  // choisir entre plusieurs assertions liées, pas juste valider/rejeter
  // celle-ci isolément.
  conflicting: { label: 'Conflit',   color: 'text-rose-700 bg-rose-50 border-rose-200',        markClass: 'bg-rose-100' },
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

// Convertit la sélection DOM courante en offsets dans le texte brut affiché
// (2026-08-10, demande explicite : surligner plutôt que retaper le texte
// source à la main, source d'erreurs de recopie). Repose sur le fait que
// `container.textContent` est exactement égal à `plainText` — HighlightedText
// ne fait que découper ce texte en fragments <mark>/texte brut, jamais
// l'altérer — donc `Range.toString()` d'un "pré-range" du début du
// conteneur jusqu'au début de la sélection donne directement l'offset en
// caractères, quel que soit le nombre de nœuds DOM traversés.
function getSelectionOffsetsWithin(container: HTMLElement): { text: string; start: number; end: number } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const range = sel.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) return null
  const selectedText = range.toString()
  if (!selectedText.trim()) return null
  const preRange = document.createRange()
  preRange.selectNodeContents(container)
  preRange.setEnd(range.startContainer, range.startOffset)
  const start = preRange.toString().length
  return { text: selectedText, start, end: start + selectedText.length }
}

function SourceTextCard({ text, assertions, onAddFromSelection }: {
  text: string
  assertions: ExtractionAssertion[]
  onAddFromSelection: (sel: { text: string; start: number; end: number }) => void
}) {
  const [open, setOpen] = useState(true)
  const [selection, setSelection] = useState<{ text: string; start: number; end: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function handleMouseUp() {
    if (!containerRef.current) return
    setSelection(getSelectionOffsetsWithin(containerRef.current))
  }

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
        <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-3">
          {text ? (
            <div ref={containerRef} onMouseUp={handleMouseUp}>
              <HighlightedText text={text} assertions={assertions} />
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Cette version n'a aucun contenu.</p>
          )}
          {selection && (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
              <p className="text-xs text-indigo-700 italic truncate">« {selection.text} »</p>
              <button
                onClick={() => { onAddFromSelection(selection); setSelection(null); window.getSelection()?.removeAllRanges() }}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-2.5 py-1.5 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />Ajouter une assertion pour ce passage
              </button>
            </div>
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
  const byType: Record<EntityType, number> = { person: 0, document: 0, place: 0, event: 0, property: 0 }
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
            <li>{byType.property} bien{byType.property !== 1 ? 's' : ''}</li>
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
function AssertionFormDialog({ open, onClose, entities, predicates, transcriptionVersionId, initial, prefill, onSaved }: {
  open: boolean
  onClose: () => void
  entities: ExtractionEntity[]
  predicates: Predicate[]
  transcriptionVersionId: string
  initial: ExtractionAssertion | null
  // Passage sélectionné dans le texte source avant d'ouvrir en mode ajout
  // (2026-08-10) — évite de retaper la citation à la main. Les offsets ne
  // sont soumis que si le texte n'a pas été modifié depuis (cf. handleSubmit).
  prefill?: { text: string; start: number; end: number } | null
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
  const [sourceText, setSourceText] = useState(initial?.sourceText ?? prefill?.text ?? '')
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
    setSourceText(initial?.sourceText ?? prefill?.text ?? '')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, prefill])

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
      // Résolution des offsets : une nouvelle sélection prime toujours ; en
      // édition, si le texte source n'a pas changé, garder les offsets déjà
      // en base (sinon `updateAssertion` les écraserait à null au moindre
      // clic sur "Enregistrer", même sans toucher à la citation) ; sinon
      // (texte retapé/modifié à la main, sans sélection) pas de position
      // fiable à soumettre.
      const sourceMatchesPrefill = !!prefill && sourceText.trim() === prefill.text.trim()
      const sourceUnchangedInEdit = isEdit && sourceText.trim() === (initial?.sourceText ?? '').trim()
      const resolvedSourceStart = sourceMatchesPrefill ? prefill!.start : sourceUnchangedInEdit ? (initial?.sourceStart ?? null) : null
      const resolvedSourceEnd = sourceMatchesPrefill ? prefill!.end : sourceUnchangedInEdit ? (initial?.sourceEnd ?? null) : null
      const input: ManualAssertionInput = {
        subjectEntityId: resolvedSubjectId,
        predicateCode,
        rawRelation: predicateCode === 'other' ? (rawRelation.trim() || null) : null,
        objectEntityId: objectEntityId || null,
        valueText: valueText.trim() || null,
        sourceText: sourceText.trim() || null,
        sourceStart: resolvedSourceStart,
        sourceEnd: resolvedSourceEnd,
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
              placeholder="Passage exact qui justifie ce fait… (ou sélectionne-le dans le texte avant d'ouvrir ce formulaire)"
              className={`${inputCls} min-h-[60px] resize-none`} />
            {prefill && sourceText.trim() === prefill.text.trim() && (
              <p className="text-[11px] text-indigo-600 mt-1">Position dans le texte capturée — le passage sera surligné une fois validé.</p>
            )}
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

// Écran de revue par étapes (2026-08-10, demande explicite de l'utilisateur
// après avoir trouvé le flux "tout d'un coup" trop dense) : personnes ->
// lieux -> faits sur les personnes -> faits sur les lieux -> le reste
// (document/événement). C'est une restructuration de la REVUE uniquement —
// l'extraction elle-même reste un seul aller-retour IA comme avant (voir
// l'avis donné à l'utilisateur : découper l'appel IA lui-même coûterait plus
// cher en tokens/latence et ne réglerait pas les vraies causes d'erreurs
// d'entités, contrairement à un simple re-séquençage de la revue). Le type
// de sujet (person/place/autre) déjà présent sur chaque entité sert
// directement à répartir les assertions par étape, sans nouvelle colonne.
type ReviewStep = 'personnes' | 'lieux' | 'assertions-personnes' | 'assertions-lieux' | 'reste'
type ReviewViewMode = 'guided' | 'complete'

const REVIEW_STEPS: { key: ReviewStep; label: string }[] = [
  { key: 'personnes', label: 'Personnes' },
  { key: 'lieux', label: 'Lieux' },
  { key: 'assertions-personnes', label: 'Faits — personnes' },
  { key: 'assertions-lieux', label: 'Faits — lieux' },
  { key: 'reste', label: 'Reste' },
]

function StepNav({ current, onSelect, counts }: {
  current: ReviewStep
  onSelect: (s: ReviewStep) => void
  counts: Record<ReviewStep, number>
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {REVIEW_STEPS.map((s, i) => {
        const active = s.key === current
        return (
          <button key={s.key} onClick={() => onSelect(s.key)}
            className={`flex items-center gap-1.5 text-xs font-medium rounded-full pl-1.5 pr-3 py-1 border transition-colors ${
              active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${active ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
              {i + 1}
            </span>
            {s.label}
            <span className={active ? 'text-white/70' : 'text-gray-400'}>({counts[s.key]})</span>
          </button>
        )
      })}
    </div>
  )
}

// Étape "Personnes"/"Lieux" : valider ce que l'extraction a trouvé (juste en
// le parcourant), corriger un libellé non exploitable (ex. bug D1/L2/E1
// résolu au 10ᵉ affinage, ou une fusion de lieux erronée comme "section
// Pineau, hameau Richard" repérée le 2026-08-10), ou ajouter une personne/un
// lieu que l'extraction a oublié — avant de passer aux faits qui s'appuient
// dessus. Ne supprime jamais une entité ici (pas demandé, et une entité
// utilisée par une assertion existante ne doit pas disparaître silencieusement).
function EntityStepCard({ title, hint, entities, assertions, entityType, transcriptionVersionId, onChanged }: {
  title: string
  hint: string
  entities: ExtractionEntity[]
  assertions: ExtractionAssertion[]
  entityType: EntityType
  transcriptionVersionId: string
  onChanged: () => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function startEdit(e: ExtractionEntity) {
    setEditingId(e.id)
    setDraft(e.label)
  }

  async function saveEdit() {
    if (!editingId || !draft.trim()) return
    setSaving(true)
    try {
      await updateEntityLabel(editingId, draft.trim())
      setEditingId(null)
      onChanged()
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur lors du renommage')
    } finally {
      setSaving(false)
    }
  }

  // Une entité qui ne devrait pas exister du tout (ex. un faux départ de
  // l'extraction, cf. 15ᵉ affinage du prompt) — pas une correction de
  // libellé. Avertit distinctement si des assertions ACTIVES (pas déjà
  // rejetées) en dépendent encore, plutôt que de les faire disparaître en
  // silence (le cascade DB ne fait pas cette distinction lui-même).
  async function handleDelete(e: ExtractionEntity) {
    const linked = assertions.filter(a => a.subjectEntityId === e.id || a.objectEntityId === e.id)
    const active = linked.filter(a => a.status !== 'rejected')
    const message = active.length > 0
      ? `Attention : ${active.length} assertion${active.length > 1 ? 's' : ''} encore active${active.length > 1 ? 's' : ''} (à valider ou validée${active.length > 1 ? 's' : ''}) référence${active.length > 1 ? 'nt' : ''} "${e.label}" et seront supprimées avec elle. Continuer ?`
      : linked.length > 0
        ? `Supprimer "${e.label}" ? ${linked.length} assertion${linked.length > 1 ? 's' : ''} déjà rejetée${linked.length > 1 ? 's' : ''} seront supprimées avec elle.`
        : `Supprimer "${e.label}" ?`
    if (!window.confirm(message)) return
    setDeletingId(e.id)
    try {
      await deleteLocalEntity(e.id)
      onChanged()
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  async function addMissing() {
    if (!newLabel.trim()) return
    setSaving(true)
    try {
      await createManualEntity(transcriptionVersionId, newLabel.trim(), entityType)
      setNewLabel('')
      setAdding(false)
      onChanged()
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de l'ajout")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-800">{title} ({entities.length})</h2>
        <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
      </div>

      {entities.length === 0 && !adding && (
        <p className="text-xs text-gray-400 italic">Aucune pour l'instant.</p>
      )}

      <div className="space-y-1.5">
        {entities.map(e => (
          <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
            {editingId === e.id ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <input
                  autoFocus
                  value={draft}
                  onChange={ev => setDraft(ev.target.value)}
                  onKeyDown={ev => { if (ev.key === 'Enter') saveEdit(); if (ev.key === 'Escape') setEditingId(null) }}
                  className="flex-1 min-w-0 text-sm border border-indigo-300 rounded-md px-2 py-1 focus:outline-none"
                />
                <button onClick={saveEdit} disabled={saving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md disabled:opacity-50">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditingId(null)} disabled={saving} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm text-gray-800 truncate">{e.label}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-gray-300">{e.localKey}</span>
                  <button onClick={() => startEdit(e)} className="p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-md">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(e)}
                    disabled={deletingId === e.id}
                    className="p-1 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-md disabled:opacity-50"
                  >
                    {deletingId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addMissing(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Nom oublié par l'extraction…"
            className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={addMissing} disabled={saving}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 shrink-0">
            Ajouter
          </button>
          <button onClick={() => setAdding(false)} disabled={saving}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 shrink-0">
            Annuler
          </button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
          <Plus className="w-3.5 h-3.5" />Ajouter {entityType === 'person' ? 'une personne oubliée' : 'un lieu oublié'}
        </button>
      )}
    </div>
  )
}

// Liste d'assertions filtrable par statut — factorisée pour être réutilisée
// telle quelle par chaque étape "Faits" ET par la vue complète (2026-08-10),
// c'était auparavant codé en dur dans le rendu principal de ExtractionPage.
function AssertionsListCard({ title, hint, assertions, entities, statusFilter, setStatusFilter, onSetStatus, onEdit, onAdd }: {
  title: string
  hint?: string
  assertions: ExtractionAssertion[]
  entities: ExtractionEntity[]
  statusFilter: StatusFilter
  setStatusFilter: (f: StatusFilter) => void
  onSetStatus: (id: string, status: AssertionStatus) => void
  onEdit: (a: ExtractionAssertion) => void
  onAdd: () => void
}) {
  const filtered = statusFilter === 'tous' ? assertions : assertions.filter(a => a.status === statusFilter)
  const counts = {
    pending: assertions.filter(a => a.status === 'pending').length,
    validated: assertions.filter(a => a.status === 'validated').length,
    rejected: assertions.filter(a => a.status === 'rejected').length,
    conflicting: assertions.filter(a => a.status === 'conflicting').length,
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-800">{title} ({assertions.length})</div>
            {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
          </div>
          <button onClick={onAdd}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors shrink-0">
            <Plus className="w-3.5 h-3.5" />Ajouter une assertion
          </button>
        </div>
        {assertions.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {(Array.of<[StatusFilter, string]>(
              ['tous', `Toutes (${assertions.length})`],
              ['pending', `À valider (${counts.pending})`],
              ['validated', `Validées (${counts.validated})`],
              ['rejected', `Rejetées (${counts.rejected})`],
              ...(counts.conflicting > 0 ? [['conflicting', `Conflits (${counts.conflicting})`] as [StatusFilter, string]] : []),
            )).map(([key, label]) => (
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
          <p className="text-sm text-gray-400 italic px-1 py-2">Rien ici pour l'instant.</p>
        )}
        {filtered.map(a => (
          <AssertionRow key={a.id} assertion={a} label={describeAssertion(a, entities)} onSetStatus={onSetStatus} onEdit={() => onEdit(a)} />
        ))}
      </div>
    </div>
  )
}

// "Comparer avec un autre acte" (2026-08-10, demande explicite) : met en
// miroir les prédicats de cet acte et d'un autre acte déjà extrait, pour
// repérer une clause probablement oubliée à la transcription en cours — ces
// actes d'état civil sont très formulaires (même structure de clauses d'un
// acte à l'autre), donc un prédicat présent dans l'acte de référence et
// absent de celui-ci est un signal utile. Comparaison volontairement
// GLOBALE par code de prédicat (pas personne par personne/rôle par rôle) —
// à affiner seulement si ça s'avère insuffisant en usage réel, même logique
// que le reste de ce module (cf. mémoire agent project_extraction_module).
// Volontairement simple (2026-08-10, après deux itérations trop
// compliquées — l'utilisateur voulait juste voir les deux listes côte à
// côte) : aucune tentative de faire correspondre les assertions entre les
// deux actes (ni par prédicat, ni par catégorie). Juste les assertions de
// chaque acte, chacune dans sa colonne, dans l'ordre où elles apparaissent
// dans le texte (même ordre que fetchAssertions). À l'utilisateur de
// repérer visuellement les écarts.
// Détail brut d'une assertion (2026-08-10, demande explicite depuis l'écran
// de comparaison) — affiche les champs tels qu'en base plutôt que la seule
// phrase reformulée par describeAssertion, utile pour vérifier une valeur
// exacte (source_text, offsets, prédicat brut...) sans quitter la
// comparaison.
function AssertionDetailDialog({ open, onClose, assertion, entities }: {
  open: boolean
  onClose: () => void
  assertion: ExtractionAssertion | null
  entities: ExtractionEntity[]
}) {
  if (!assertion) return null
  const cfg = STATUS_CONFIG[assertion.status]
  const subjectLabel = entities.find(e => e.id === assertion.subjectEntityId)?.label ?? assertion.subjectEntityId
  const objectLabel = assertion.objectEntityId
    ? (entities.find(e => e.id === assertion.objectEntityId)?.label ?? assertion.objectEntityId)
    : null

  const rows: { field: string; value: string }[] = [
    { field: 'id', value: assertion.id },
    { field: 'subject_entity_id', value: `${subjectLabel} (${assertion.subjectEntityId})` },
    { field: 'predicate', value: `${assertion.predicateLabel} (${assertion.predicateCode})` },
    { field: 'object_entity_id', value: objectLabel ? `${objectLabel} (${assertion.objectEntityId})` : '—' },
    { field: 'raw_relation', value: assertion.rawRelation ?? '—' },
    { field: 'value_text', value: assertion.valueText ?? '—' },
    { field: 'value_number', value: assertion.valueNumber != null ? String(assertion.valueNumber) : '—' },
    { field: 'value_date', value: assertion.valueDate ?? '—' },
    { field: 'source_text', value: assertion.sourceText ?? '—' },
    { field: 'source_start / source_end', value: assertion.sourceStart != null ? `${assertion.sourceStart} – ${assertion.sourceEnd}` : '—' },
    { field: 'status', value: assertion.status },
    { field: 'origin', value: assertion.origin },
    { field: 'created_at', value: assertion.createdAt },
  ]

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Détail de l'assertion
            <span className={`text-[10px] font-medium rounded-full border px-2 py-0.5 ${cfg.color}`}>{cfg.label}</span>
          </DialogTitle>
          <DialogDescription>{describeAssertion(assertion, entities)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.field} className="grid grid-cols-[170px_1fr] gap-2 text-xs border-b border-gray-50 pb-1.5">
              <span className="font-mono text-gray-400">{r.field}</span>
              <span className="text-gray-800 break-words">{r.value}</span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <button onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Fermer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CompareActeDialog({ open, onClose, currentVersionId, currentAssertions, currentEntities, predicates }: {
  open: boolean
  onClose: () => void
  currentVersionId: string
  currentAssertions: ExtractionAssertion[]
  currentEntities: ExtractionEntity[]
  predicates: Predicate[]
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ActeCompareSearchResult[]>([])
  const [loadingResults, setLoadingResults] = useState(false)
  const [selected, setSelected] = useState<ActeCompareSearchResult | null>(null)
  const [otherAssertions, setOtherAssertions] = useState<ExtractionAssertion[]>([])
  const [otherEntities, setOtherEntities] = useState<ExtractionEntity[]>([])
  const [loadingOther, setLoadingOther] = useState(false)
  const [detail, setDetail] = useState<{ assertion: ExtractionAssertion; entities: ExtractionEntity[] } | null>(null)

  useEffect(() => {
    if (!open) { setQuery(''); setSelected(null); setOtherAssertions([]); setOtherEntities([]); setDetail(null); return }
    setLoadingResults(true)
    searchExtractedVersions(currentVersionId).then(setResults).finally(() => setLoadingResults(false))
  }, [open, currentVersionId])

  async function handleSelect(r: ActeCompareSearchResult) {
    setSelected(r)
    setLoadingOther(true)
    const [assertionsList, entitiesList] = await Promise.all([
      fetchAssertions(r.versionId),
      fetchEntities(r.versionId),
    ])
    setOtherAssertions(assertionsList)
    setOtherEntities(entitiesList)
    setLoadingOther(false)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return results
    return results.filter(r => r.documentTitre.toLowerCase().includes(q) || (r.coteLocale ?? '').toLowerCase().includes(q))
  }, [results, query])

  // Une section par prédicat présent dans au moins un des deux actes, dans
  // l'ordre du référentiel (ref_assertion_predicates.ordre — position dans
  // "predicates", déjà trié par fetchPredicates) — le nom du prédicat en
  // bandeau pleine largeur au-dessus des deux colonnes, une séparation
  // entre chaque section. Toujours aucune tentative d'aligner ligne à
  // ligne À L'INTÉRIEUR d'une section : juste le regroupement par
  // prédicat lui-même sert de repère commun.
  const mergedGroups = useMemo(() => {
    const byCodeCurrent = new Map<string, ExtractionAssertion[]>()
    const byCodeOther = new Map<string, ExtractionAssertion[]>()
    for (const a of currentAssertions) {
      if (a.status === 'rejected') continue
      const arr = byCodeCurrent.get(a.predicateCode) ?? []; arr.push(a); byCodeCurrent.set(a.predicateCode, arr)
    }
    for (const a of otherAssertions) {
      if (a.status === 'rejected') continue
      const arr = byCodeOther.get(a.predicateCode) ?? []; arr.push(a); byCodeOther.set(a.predicateCode, arr)
    }
    const codes = [...new Set([...byCodeCurrent.keys(), ...byCodeOther.keys()])].sort((c1, c2) => {
      const i1 = predicates.findIndex(p => p.code === c1)
      const i2 = predicates.findIndex(p => p.code === c2)
      return (i1 === -1 ? Infinity : i1) - (i2 === -1 ? Infinity : i2)
    })
    return codes.map(code => ({
      code,
      label: predicates.find(p => p.code === code)?.label ?? code,
      current: byCodeCurrent.get(code) ?? [],
      other: byCodeOther.get(code) ?? [],
    }))
  }, [currentAssertions, otherAssertions, predicates])

  return (
    <>
      <Dialog open={open} onOpenChange={o => !o && onClose()}>
        <DialogContent className="sm:max-w-[90vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Columns2 className="w-4 h-4 text-indigo-500" />Comparer avec un autre acte</DialogTitle>
          <DialogDescription>
            Les assertions des deux actes, côte à côte.
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher par titre de document ou cote…"
                className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="border border-gray-100 rounded-lg overflow-y-auto max-h-[420px] divide-y divide-gray-50">
              {loadingResults ? (
                <div className="p-3 text-xs text-gray-400 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Chargement…</div>
              ) : filtered.length === 0 ? (
                <p className="p-3 text-xs text-gray-400 italic">Aucun autre acte déjà extrait trouvé.</p>
              ) : filtered.map(r => (
                <button
                  key={r.versionId}
                  onClick={() => handleSelect(r)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-800 truncate">{r.documentTitre}</p>
                  <p className="text-[11px] text-gray-400 truncate">{r.coteLocale || 'Sans cote'} · {r.assertionsCount} assertion{r.assertionsCount > 1 ? 's' : ''}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500 truncate">
                Comparé à : <span className="font-medium text-gray-800">{selected.documentTitre}</span>
                {selected.coteLocale && <span> ({selected.coteLocale})</span>}
              </p>
              <button onClick={() => setSelected(null)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 shrink-0">
                Changer d'acte
              </button>
            </div>
            {loadingOther ? (
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 py-10">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />Chargement…
              </div>
            ) : (
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-700">
                  <div className="px-3 py-2">Cet acte ({currentAssertions.filter(a => a.status !== 'rejected').length})</div>
                  <div className="px-3 py-2 border-l border-gray-100 truncate">{selected.documentTitre} ({otherAssertions.filter(a => a.status !== 'rejected').length})</div>
                </div>
                <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-200">
                  {mergedGroups.length === 0 && <p className="px-3 py-2 text-xs text-gray-400 italic">Aucune assertion.</p>}
                  {mergedGroups.map(group => {
                    // "Diff" = nombre d'occurrences différent entre les deux
                    // actes pour ce prédicat (le cas le plus fréquent étant
                    // 0 vs au moins 1 — présent d'un côté, absent de
                    // l'autre). Mise en lumière demandée explicitement.
                    const diff = group.current.length !== group.other.length
                    return (
                      <div key={group.code}>
                        <div className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                          diff ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {group.label}
                        </div>
                        <div className="grid grid-cols-2">
                          <div className={`divide-y divide-gray-50 py-1 ${diff && group.current.length === 0 ? 'bg-amber-50' : ''}`}>
                            {group.current.length === 0
                              ? <p className={`px-3 py-2 text-xs ${diff ? 'text-amber-700' : 'text-gray-300'}`}>—</p>
                              : group.current.map(a => (
                                <button
                                  key={a.id}
                                  onClick={() => setDetail({ assertion: a, entities: currentEntities })}
                                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <span>{describeAssertion(a, currentEntities)}</span>
                                  {a.status === 'pending' && (
                                    <span className="shrink-0 text-[10px] font-medium rounded-full border px-1.5 py-0.5 text-amber-700 bg-amber-50 border-amber-200">
                                      À valider
                                    </span>
                                  )}
                                </button>
                              ))}
                          </div>
                          <div className={`divide-y divide-gray-50 border-l border-gray-100 py-1 ${diff && group.other.length === 0 ? 'bg-amber-50' : ''}`}>
                            {group.other.length === 0
                              ? <p className={`px-3 py-2 text-xs ${diff ? 'text-amber-700' : 'text-gray-300'}`}>—</p>
                              : group.other.map(a => (
                                <button
                                  key={a.id}
                                  onClick={() => setDetail({ assertion: a, entities: otherEntities })}
                                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <span>{describeAssertion(a, otherEntities)}</span>
                                  {a.status === 'pending' && (
                                    <span className="shrink-0 text-[10px] font-medium rounded-full border px-1.5 py-0.5 text-amber-700 bg-amber-50 border-amber-200">
                                      À valider
                                    </span>
                                  )}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <button onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Fermer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <AssertionDetailDialog
        open={!!detail}
        onClose={() => setDetail(null)}
        assertion={detail?.assertion ?? null}
        entities={detail?.entities ?? []}
      />
    </>
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
  const [reviewStep, setReviewStep] = useState<ReviewStep>('personnes')
  const [viewMode, setViewMode] = useState<ReviewViewMode>('guided')

  const [extracting, setExtracting] = useState(false)
  const [confirmReextractOpen, setConfirmReextractOpen] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAssertion, setEditingAssertion] = useState<ExtractionAssertion | null>(null)
  const [addPrefill, setAddPrefill] = useState<{ text: string; start: number; end: number } | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)

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

  // Si "à valider" est vide pour ce qu'on regarde (une étape ou la vue
  // complète), basculer automatiquement sur "Validées" plutôt que de
  // laisser l'utilisateur atterrir sur un onglet vide (demande explicite,
  // 2026-08-10). Ne se déclenche qu'au changement d'étape/de vue ou après
  // un rechargement des données — ne force pas la main si l'utilisateur
  // clique lui-même sur "À valider" en cours de route et qu'elle se vide
  // entre-temps (statusFilter n'est volontairement pas dans les deps).
  useEffect(() => {
    const entityTypeByIdForFilter = new Map(entities.map(e => [e.id, e.entityType]))
    const subset = viewMode === 'complete'
      ? assertions
      : reviewStep === 'assertions-personnes'
        ? assertions.filter(a => entityTypeByIdForFilter.get(a.subjectEntityId) === 'person')
        : reviewStep === 'assertions-lieux'
          ? assertions.filter(a => entityTypeByIdForFilter.get(a.subjectEntityId) === 'place')
          : reviewStep === 'reste'
            ? assertions.filter(a => {
                const t = entityTypeByIdForFilter.get(a.subjectEntityId)
                return t !== 'person' && t !== 'place'
              })
            : null // étapes "Personnes"/"Lieux" : pas de filtre de statut d'assertions ici
    if (!subset || subset.length === 0) return
    const hasPending = subset.some(a => a.status === 'pending')
    setStatusFilter(hasPending ? 'pending' : 'validated')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewStep, viewMode, assertions, entities])

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
    setAddPrefill(null)
    setFormOpen(true)
  }

  function handleAddFromSelection(sel: { text: string; start: number; end: number }) {
    setEditingAssertion(null)
    setAddPrefill(sel)
    setFormOpen(true)
  }

  function handleOpenEdit(assertion: ExtractionAssertion) {
    setEditingAssertion(assertion)
    setAddPrefill(null)
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
      setReviewStep('personnes')
      setViewMode('guided')
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

  // Répartition par étape de revue — réutilise le entity_type déjà posé sur
  // chaque entité (person/place/document/event), aucune nouvelle donnée.
  const entityTypeById = new Map(entities.map(e => [e.id, e.entityType]))
  const personEntities = entities.filter(e => e.entityType === 'person')
  const placeEntities = entities.filter(e => e.entityType === 'place')
  const personAssertions = assertions.filter(a => entityTypeById.get(a.subjectEntityId) === 'person')
  const placeAssertions = assertions.filter(a => entityTypeById.get(a.subjectEntityId) === 'place')
  const restAssertions = assertions.filter(a => {
    const t = entityTypeById.get(a.subjectEntityId)
    return t !== 'person' && t !== 'place'
  })
  const stepCounts: Record<ReviewStep, number> = {
    personnes: personEntities.length,
    lieux: placeEntities.length,
    'assertions-personnes': personAssertions.length,
    'assertions-lieux': placeAssertions.length,
    reste: restAssertions.length,
  }
  const reviewStepIndex = REVIEW_STEPS.findIndex(s => s.key === reviewStep)

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
          <div className="flex items-center gap-2 shrink-0">
            {assertions.length > 0 && (
              <button
                onClick={() => setCompareOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Columns2 className="w-3.5 h-3.5" />Comparer avec un autre acte
              </button>
            )}
            <button
              onClick={handleExtractClick}
              disabled={extracting}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {assertions.length > 0 ? "Relancer l'extraction" : "Lancer l'extraction"}
            </button>
          </div>
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
        <SourceTextCard text={plainText} assertions={assertions} onAddFromSelection={handleAddFromSelection} />

        {extractionError && (
          <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {extractionError}
          </div>
        )}

        {extracting ? (
          <LoadingState />
        ) : entities.length === 0 && assertions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-400 italic">
              Aucune extraction pour l'instant — clique sur "Lancer l'extraction".
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {viewMode === 'guided'
                ? <StepNav current={reviewStep} onSelect={setReviewStep} counts={stepCounts} />
                : <div className="text-sm font-semibold text-gray-800">Toutes les assertions</div>}
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 bg-white shrink-0">
                <button onClick={() => setViewMode('guided')}
                  className={`text-xs font-medium rounded-md px-2.5 py-1 transition-colors ${viewMode === 'guided' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  Revue guidée
                </button>
                <button onClick={() => setViewMode('complete')}
                  className={`text-xs font-medium rounded-md px-2.5 py-1 transition-colors ${viewMode === 'complete' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  Vue complète
                </button>
              </div>
            </div>

            {viewMode === 'complete' ? (
              <AssertionsListCard
                title="Assertions"
                assertions={assertions}
                entities={entities}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onSetStatus={handleSetStatus}
                onEdit={handleOpenEdit}
                onAdd={handleOpenAdd}
              />
            ) : (
              <>
                {reviewStep === 'personnes' && (
                  <EntityStepCard
                    title="Personnes" entities={personEntities} assertions={assertions} entityType="person" transcriptionVersionId={versionId!}
                    hint="Vérifie les personnes trouvées par l'extraction, corrige un libellé ou ajoute celles qui manquent, avant de passer aux faits."
                    onChanged={reloadEntitiesAndAssertions}
                  />
                )}
                {reviewStep === 'lieux' && (
                  <EntityStepCard
                    title="Lieux" entities={placeEntities} assertions={assertions} entityType="place" transcriptionVersionId={versionId!}
                    hint="Même chose pour les lieux nommés (commune, section, hameau…)."
                    onChanged={reloadEntitiesAndAssertions}
                  />
                )}
                {reviewStep === 'assertions-personnes' && (
                  <AssertionsListCard
                    title="Faits — personnes" hint="Faits dont le sujet est une personne."
                    assertions={personAssertions} entities={entities}
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                    onSetStatus={handleSetStatus} onEdit={handleOpenEdit} onAdd={handleOpenAdd}
                  />
                )}
                {reviewStep === 'assertions-lieux' && (
                  <AssertionsListCard
                    title="Faits — lieux" hint="Faits dont le sujet est un lieu."
                    assertions={placeAssertions} entities={entities}
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                    onSetStatus={handleSetStatus} onEdit={handleOpenEdit} onAdd={handleOpenAdd}
                  />
                )}
                {reviewStep === 'reste' && (
                  <AssertionsListCard
                    title="Reste" hint="Faits sur l'acte lui-même ou sur un événement (vente, présentation…)."
                    assertions={restAssertions} entities={entities}
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                    onSetStatus={handleSetStatus} onEdit={handleOpenEdit} onAdd={handleOpenAdd}
                  />
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => reviewStepIndex > 0 && setReviewStep(REVIEW_STEPS[reviewStepIndex - 1].key)}
                    className={`flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors ${reviewStepIndex === 0 ? 'invisible' : ''}`}>
                    <ChevronLeft className="w-3.5 h-3.5" />Étape précédente
                  </button>
                  <button
                    onClick={() => reviewStepIndex < REVIEW_STEPS.length - 1 && setReviewStep(REVIEW_STEPS[reviewStepIndex + 1].key)}
                    className={`flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors ${reviewStepIndex === REVIEW_STEPS.length - 1 ? 'invisible' : ''}`}>
                    Étape suivante<ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
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
        prefill={addPrefill}
        onSaved={reloadEntitiesAndAssertions}
      />

      <CompareActeDialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        currentVersionId={versionId!}
        currentAssertions={assertions}
        currentEntities={entities}
        predicates={predicates}
      />
    </div>
  )
}

export default ExtractionPage
