// TranscriptionEditorPage.tsx
// Troisième étape de l'atelier documentaire : éditeur de transcription
// "confluence-like" pour un exemplaire précis (rebond.transcriptions,
// contenu en JSON Tiptap). Sauvegarde automatique du brouillon, sans bouton
// "Enregistrer" — l'historique de versions et les commentaires ancrés sont
// des actions explicites à côté de cet auto-save (voir panneau latéral).
//
// Voir atelier.service.ts pour la TODO du module.

import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  LayoutDashboard, FileEdit, Loader2, Bold, Italic, Strikethrough, List, ListOrdered,
  Quote, Undo2, Redo2, Minus, Cloud, CloudOff, MessageSquarePlus, History, Save,
  CheckCircle2, RotateCcw, Trash2, Plus, Tag, PenLine, FileSignature, Eraser, Layers, Gauge,
  ChevronDown, ChevronRight, AlertTriangle, Lock, Unlock, BadgeCheck,
} from 'lucide-react'
import { CommentMark } from './tiptap/CommentMark'
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  fetchExemplaireContext, fetchTranscription, saveTranscription, ensureTranscriptionId,
  fetchVersions, createVersionSnapshot, fetchComments, createComment, setCommentStatut, deleteComment,
  fetchZoneTypes, fetchZones, createZone, deleteZone, fetchZonesAttendu, updateQualite,
  markAsTranscrit, revertToEnCours,
} from './atelier.service'
import type {
  TranscriptionStatut, TranscriptionVersion, TranscriptionCommentaire, TranscriptionZoneType, TranscriptionZone,
  TranscriptionQualite, SourceLectureKind, Completeness, ReserveLevel, ZoneAttendu,
} from './atelier.types'

const QUALITE_VIDE: TranscriptionQualite = {
  sourceLectureKind: null,
  langueRef: null,
  ecritureRef: null,
  handwritingLegibilityRef: null,
  completeness: 'complete',
  completenessNote: null,
  reserveLevel: 'aucune',
  reserveReason: null,
}

const ZONE_ICONS: Record<string, React.ElementType> = {
  mention_marginale: PenLine,
  signature: FileSignature,
  rature_marginale: Eraser,
}

type ExemplaireContext = {
  id: string
  coteLocale: string | null
  documentId: string
  documentTitre: string
  depotLabel: string | null
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type SectionKey = 'zones' | 'commentaires' | 'historique' | 'qualite'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 2) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  return `il y a ${days} jour${days > 1 ? 's' : ''}`
}

function ToolbarButton({ onClick, active, disabled, title, children }: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor, hasSelection, onComment, locked }: { editor: Editor; hasSelection: boolean; onComment: () => void; locked: boolean }) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 flex-wrap">
    <fieldset disabled={locked} className="contents">
      <select
        value={editor.isActive('heading', { level: 1 }) ? '1' : editor.isActive('heading', { level: 2 }) ? '2' : editor.isActive('heading', { level: 3 }) ? '3' : 'p'}
        onChange={e => {
          const v = e.target.value
          if (v === 'p') editor.chain().focus().setParagraph().run()
          else editor.chain().focus().toggleHeading({ level: Number(v) as 1 | 2 | 3 }).run()
        }}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 mr-1"
      >
        <option value="p">Paragraphe</option>
        <option value="1">Titre 1</option>
        <option value="2">Titre 2</option>
        <option value="3">Titre 3</option>
      </select>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton title="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Barré" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton title="Liste à puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Liste numérotée" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Citation" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Ligne horizontale" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton title="Annuler" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Rétablir" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton title="Commenter la sélection" disabled={!hasSelection} onClick={onComment}>
        <MessageSquarePlus className="w-4 h-4" />
      </ToolbarButton>
    </fieldset>
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving') return <span className="flex items-center gap-1.5 text-xs text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" />Enregistrement…</span>
  if (state === 'saved') return <span className="flex items-center gap-1.5 text-xs text-emerald-600"><Cloud className="w-3.5 h-3.5" />Enregistré</span>
  if (state === 'error') return <span className="flex items-center gap-1.5 text-xs text-rose-600"><CloudOff className="w-3.5 h-3.5" />Erreur d'enregistrement</span>
  return null
}

function AccordionSection({ title, icon: Icon, count, open, onToggle, children }: {
  title: string
  icon: React.ElementType
  count?: number
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <Icon className="w-4 h-4 text-gray-400" />
          {title}
          {!!count && <span className="text-xs font-normal text-gray-400">({count})</span>}
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function CommentsPanel({ comments, activeCommentId, pending, locked, onCancelPending, onSubmitPending, onResolve, onReopen, onDelete }: {
  comments: TranscriptionCommentaire[]
  activeCommentId: string | null
  pending: { text: string } | null
  locked: boolean
  onCancelPending: () => void
  onSubmitPending: (text: string) => void
  onResolve: (id: string) => void
  onReopen: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [draft, setDraft] = useState('')

  useEffect(() => { if (pending) setDraft('') }, [pending])

  const open = comments.filter(c => c.statut === 'ouvert')
  const resolved = comments.filter(c => c.statut === 'resolu')

  return (
    <fieldset disabled={locked} className="contents">
    <div className="space-y-4">
      {pending && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2">
          <p className="text-xs font-medium text-indigo-700">Nouveau commentaire</p>
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Ton commentaire…"
            className="w-full text-sm border border-indigo-200 rounded-lg px-2.5 py-2 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] resize-none"
          />
          <div className="flex items-center gap-2">
            <button onClick={() => onSubmitPending(draft)} disabled={!draft.trim()}
              className="text-xs font-medium bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-40 transition-colors">
              Ajouter
            </button>
            <button onClick={onCancelPending} className="text-xs font-medium text-gray-500 hover:text-gray-700">
              Annuler
            </button>
          </div>
        </div>
      )}

      {comments.length === 0 && !pending && (
        <p className="text-xs text-gray-400 italic">Sélectionne du texte dans l'éditeur puis clique sur l'icône commentaire pour en ajouter un.</p>
      )}

      {open.length > 0 && (
        <div className="space-y-2">
          {open.map(c => (
            <div key={c.id} id={`comment-${c.id}`}
              className={`rounded-lg border p-3 space-y-1.5 transition-colors ${activeCommentId === c.id ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-white'}`}>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.contenu}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">{relativeTime(c.createdAt)}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => onResolve(c.id)} title="Résoudre" className="text-gray-400 hover:text-emerald-600 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(c.id)} title="Supprimer" className="text-gray-400 hover:text-rose-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Résolus</p>
          {resolved.map(c => (
            <div key={c.id} id={`comment-${c.id}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1.5">
              <p className="text-sm text-gray-500 line-through decoration-gray-300 whitespace-pre-wrap">{c.contenu}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">{relativeTime(c.createdAt)}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => onReopen(c.id)} title="Rouvrir" className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(c.id)} title="Supprimer" className="text-gray-400 hover:text-rose-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </fieldset>
  )
}

function ZoneAttenduBadge({ attendu }: { attendu?: ZoneAttendu }) {
  if (!attendu || attendu.present === null) {
    return <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 shrink-0">Non qualifié</span>
  }
  if (attendu.present === false) {
    return <span className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 shrink-0">Non attendu</span>
  }
  return (
    <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 shrink-0">
      {attendu.count ?? '?'} attendu{(attendu.count ?? 0) > 1 ? 's' : ''}
    </span>
  )
}

function ZonesPanel({ zoneTypes, zones, attendu, locked, onAdd, onDelete }: {
  zoneTypes: TranscriptionZoneType[]
  zones: TranscriptionZone[]
  attendu: Record<string, ZoneAttendu>
  locked: boolean
  onAdd: (zoneTypeId: string, contenu: string) => void
  onDelete: (zoneId: string) => void
}) {
  const [composingTypeId, setComposingTypeId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  if (zoneTypes.length === 0) {
    return <p className="text-xs text-gray-400 italic">Chargement des types de zone…</p>
  }

  return (
    <fieldset disabled={locked} className="contents">
    <div className="space-y-3">
      <p className="text-[11px] text-gray-400">
        "Attendu" vient de la description de l'exemplaire dans Patrimoine documentaire — ce qui est relevé ici est le contenu réel.
      </p>
      {zoneTypes.map(zt => {
        const items = zones.filter(z => z.zoneTypeId === zt.id)
        const Icon = ZONE_ICONS[zt.code] ?? Tag
        const zoneAttendu = attendu[zt.code]
        const incoherent = zoneAttendu?.present === true && zoneAttendu.count != null && items.length > zoneAttendu.count
        return (
          <div key={zt.id} className="rounded-lg border border-gray-100 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-800 truncate">{zt.label}</span>
                {items.length > 0 && <span className="text-xs text-gray-400 shrink-0">({items.length})</span>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <ZoneAttenduBadge attendu={zoneAttendu} />
                <button
                  onClick={() => { setComposingTypeId(zt.id); setDraft('') }}
                  title={`Ajouter — ${zt.label}`}
                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {incoherent && (
              <p className="text-[11px] text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {items.length} relevé{items.length > 1 ? 's' : ''} pour {zoneAttendu!.count} attendu{(zoneAttendu!.count ?? 0) > 1 ? 's' : ''}
              </p>
            )}

            {items.length > 0 && (
              <div className="space-y-1.5">
                {items.map(z => (
                  <div key={z.id} className="flex items-start justify-between gap-2 rounded-md bg-gray-50 px-2.5 py-1.5">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{z.contenu}</p>
                    <button onClick={() => onDelete(z.id)} className="text-gray-300 hover:text-rose-600 transition-colors shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {composingTypeId === zt.id && (
              <div className="space-y-1.5 pt-1">
                <textarea
                  autoFocus
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder={`Texte relevé — ${zt.label.toLowerCase()}…`}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[50px] resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { onAdd(zt.id, draft); setComposingTypeId(null) }}
                    disabled={!draft.trim()}
                    className="text-xs font-medium bg-indigo-600 text-white rounded-lg px-2.5 py-1 hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    Ajouter
                  </button>
                  <button onClick={() => setComposingTypeId(null)} className="text-xs font-medium text-gray-500 hover:text-gray-700">
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
    </fieldset>
  )
}

function QualitePanel({ qualite, onChange, locked }: {
  qualite: TranscriptionQualite
  onChange: (patch: Partial<TranscriptionQualite>) => void
  locked: boolean
}) {
  const selectCls = 'w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed'
  const textareaCls = 'mt-1.5 w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[50px] resize-none disabled:opacity-60 disabled:cursor-not-allowed'
  const fieldMode = locked ? 'view' : 'edit'

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Source de lecture</label>
        <select
          value={qualite.sourceLectureKind ?? ''}
          onChange={e => onChange({ sourceLectureKind: (e.target.value || null) as SourceLectureKind | null })}
          disabled={locked}
          className={selectCls}
        >
          <option value="">Non renseigné</option>
          <option value="image_originale">Image originale</option>
          <option value="microfilm">Microfilm</option>
          <option value="transcription_secondaire">Transcription secondaire</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Langue</label>
        <RefSinglePickerSmart table="ref_langues" mode={fieldMode} actionsInvisible={false}
          value={qualite.langueRef} onChange={next => onChange({ langueRef: next })} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Écriture</label>
        <RefSinglePickerSmart table="ref_ecritures" mode={fieldMode} actionsInvisible={false}
          value={qualite.ecritureRef} onChange={next => onChange({ ecritureRef: next })} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Lisibilité</label>
        <RefSinglePickerSmart table="ref_handwriting_legibility" mode={fieldMode} actionsInvisible={false}
          value={qualite.handwritingLegibilityRef} onChange={next => onChange({ handwritingLegibilityRef: next })} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Complétude</label>
        <select
          value={qualite.completeness}
          onChange={e => onChange({ completeness: e.target.value as Completeness })}
          disabled={locked}
          className={selectCls}
        >
          <option value="complete">Complète</option>
          <option value="partielle">Partielle</option>
          <option value="fragment">Fragment</option>
        </select>
        {qualite.completeness !== 'complete' && (
          <textarea
            value={qualite.completenessNote ?? ''}
            onChange={e => onChange({ completenessNote: e.target.value || null })}
            placeholder="Ce qui manque…"
            disabled={locked}
            className={textareaCls}
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Niveau de réserve</label>
        <select
          value={qualite.reserveLevel}
          onChange={e => onChange({ reserveLevel: e.target.value as ReserveLevel })}
          disabled={locked}
          className={selectCls}
        >
          <option value="aucune">Aucune</option>
          <option value="mineure">Mineure</option>
          <option value="majeure">Majeure</option>
        </select>
        {qualite.reserveLevel !== 'aucune' && (
          <textarea
            value={qualite.reserveReason ?? ''}
            onChange={e => onChange({ reserveReason: e.target.value || null })}
            placeholder="Pourquoi cette réserve…"
            disabled={locked}
            className={textareaCls}
          />
        )}
      </div>
    </div>
  )
}

function HistoryPanel({ versions, onSave, onRestore, saving, locked }: {
  versions: TranscriptionVersion[]
  onSave: (changeSummary: string) => void
  onRestore: (version: TranscriptionVersion) => void
  saving: boolean
  locked: boolean
}) {
  const [summary, setSummary] = useState('')

  return (
    <div className="space-y-4">
      <fieldset disabled={locked} className="contents">
      <div className="rounded-lg border border-gray-100 bg-white p-3 space-y-2">
        <input
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="Résumé du changement (optionnel)…"
          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => { onSave(summary.trim()); setSummary('') }}
          disabled={saving}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg px-3 py-2 hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Enregistrer une version
        </button>
      </div>
      </fieldset>

      {versions.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Aucune version enregistrée pour l'instant.</p>
      ) : (
        <div className="space-y-2">
          {versions.map(v => (
            <div key={v.id} className="rounded-lg border border-gray-100 bg-white p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">Version {v.version}</span>
                <span className="text-[11px] text-gray-400">{relativeTime(v.createdAt)}</span>
              </div>
              {v.changeSummary && <p className="text-xs text-gray-500">{v.changeSummary}</p>}
              <button onClick={() => onRestore(v)} disabled={locked}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors pt-1">
                <RotateCcw className="w-3.5 h-3.5" />Restaurer dans le brouillon
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TranscriptionEditorPage() {
  const { exemplaireId } = useParams<{ exemplaireId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [ctx, setCtx] = useState<ExemplaireContext | null>(null)
  const [statut, setStatut] = useState<TranscriptionStatut>('en_cours')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [hasSelection, setHasSelection] = useState(false)

  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(['historique']))
  const [zonesAttendu, setZonesAttendu] = useState<Record<string, ZoneAttendu>>({})
  const [comments, setComments] = useState<TranscriptionCommentaire[]>([])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [pendingComment, setPendingComment] = useState<{ from: number; to: number } | null>(null)
  const [versions, setVersions] = useState<TranscriptionVersion[]>([])
  const [savingVersion, setSavingVersion] = useState(false)
  const [zoneTypes, setZoneTypes] = useState<TranscriptionZoneType[]>([])
  const [zones, setZones] = useState<TranscriptionZone[]>([])
  const [qualite, setQualite] = useState<TranscriptionQualite>(QUALITE_VIDE)

  const [locked, setLocked] = useState(false)
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false)
  const [marking, setMarking] = useState(false)
  const [marqueTranscritParEmail, setMarqueTranscritParEmail] = useState<string | null>(null)
  const [marqueTranscritLe, setMarqueTranscritLe] = useState<string | null>(null)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const qualiteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const qualitePendingRef = useRef<Partial<TranscriptionQualite>>({})
  const statutRef = useRef(statut)
  statutRef.current = statut
  const transcriptionIdRef = useRef<string | null>(null)

  const editor = useEditor({
    extensions: [StarterKit, CommentMark],
    editorProps: {
      attributes: {
        class: 'min-h-[60vh] max-w-none focus:outline-none text-[15px] leading-relaxed text-gray-800 '
          + '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 '
          + '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2.5 '
          + '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 '
          + '[&_p]:my-2.5 '
          + '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2.5 '
          + '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2.5 '
          + '[&_blockquote]:border-l-2 [&_blockquote]:border-indigo-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-3 '
          + '[&_hr]:my-6 [&_hr]:border-gray-200 '
          + '[&_code]:bg-gray-100 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] '
          + '[&_mark.transcription-comment-mark]:bg-amber-100 [&_mark.transcription-comment-mark]:rounded-sm [&_mark.transcription-comment-mark]:cursor-pointer',
      },
    },
    onUpdate: () => scheduleSave(),
    onSelectionUpdate: ({ editor }) => {
      setHasSelection(!editor.state.selection.empty)
      const attrs = editor.getAttributes('commentaire')
      setActiveCommentId(editor.isActive('commentaire') ? (attrs.commentId ?? null) : null)
    },
  })

  function toggleSection(key: SectionKey) {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  useEffect(() => {
    if (!activeCommentId) return
    document.getElementById(`comment-${activeCommentId}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    setOpenSections(prev => new Set(prev).add('commentaires'))
  }, [activeCommentId])

  useEffect(() => {
    editor?.setEditable(!locked)
  }, [locked, editor])

  function scheduleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(doSave, 1200)
  }

  async function doSave() {
    if (!exemplaireId || !editor) return
    setSaveState('saving')
    try {
      const { data, error } = await saveTranscription(exemplaireId, editor.getJSON(), statutRef.current)
      if (error) throw error
      if (data?.id) transcriptionIdRef.current = data.id
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  // Garantit une ligne rebond.transcriptions ET qu'elle porte le contenu
  // réel de l'éditeur — pas juste "une ligne existe". ensureTranscriptionId
  // (service) insère `contenu: {}` si la ligne n'existe pas encore ; appelé
  // seul (ex. avant "Enregistrer une version" cliqué juste après avoir tapé,
  // avant le premier auto-save différé), ça créait une ligne vide à côté
  // d'une version qui, elle, avait le vrai texte — brouillon vide jusqu'au
  // prochain auto-save, perdu si la page se ferme avant.
  async function ensureTranscriptionRow(): Promise<string> {
    if (transcriptionIdRef.current) return transcriptionIdRef.current
    if (editor) {
      const { data } = await saveTranscription(exemplaireId!, editor.getJSON(), statutRef.current)
      if (data?.id) {
        transcriptionIdRef.current = data.id
        return data.id
      }
    }
    const id = await ensureTranscriptionId(exemplaireId!)
    transcriptionIdRef.current = id
    return id
  }

  async function handleMarkAsTranscrit() {
    if (!editor || marking) return
    setMarking(true)
    try {
      // Force-flush le brouillon avant de marquer, pour ne pas laisser une
      // frappe récente hors de la version verrouillée.
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
      await doSave()
      const id = await ensureTranscriptionRow()
      const { email, le } = await markAsTranscrit(id)
      setStatut('termine')
      statutRef.current = 'termine'
      setMarqueTranscritParEmail(email)
      setMarqueTranscritLe(le)
      setLocked(true)
    } finally {
      setMarking(false)
    }
  }

  async function handleUnlock() {
    setConfirmUnlockOpen(false)
    setLocked(false)
    setStatut('en_cours')
    statutRef.current = 'en_cours'
    const id = await ensureTranscriptionRow()
    revertToEnCours(id).catch(() => {})
  }

  function handleOpenCommentComposer() {
    if (!editor) return
    const { from, to } = editor.state.selection
    if (from === to) return
    setPendingComment({ from, to })
  }

  async function handleSubmitComment(text: string) {
    if (!editor || !pendingComment || !text.trim()) return
    const transcriptionId = await ensureTranscriptionRow()
    const comment = await createComment(transcriptionId, text.trim())
    editor.chain()
      .setTextSelection(pendingComment)
      .setCommentaire(comment.id)
      .run()
    setComments(prev => [...prev, comment])
    setPendingComment(null)
  }

  async function handleResolveComment(id: string) {
    await setCommentStatut(id, 'resolu')
    setComments(prev => prev.map(c => c.id === id ? { ...c, statut: 'resolu', resolvedAt: new Date().toISOString() } : c))
  }

  async function handleReopenComment(id: string) {
    await setCommentStatut(id, 'ouvert')
    setComments(prev => prev.map(c => c.id === id ? { ...c, statut: 'ouvert', resolvedAt: null } : c))
  }

  async function handleDeleteComment(id: string) {
    await deleteComment(id)
    editor?.chain().unsetCommentaireById(id).run()
    setComments(prev => prev.filter(c => c.id !== id))
  }

  async function handleSaveVersion(changeSummary: string) {
    if (!editor || savingVersion) return
    setSavingVersion(true)
    try {
      const transcriptionId = await ensureTranscriptionRow()
      const version = await createVersionSnapshot(transcriptionId, editor.getJSON(), changeSummary || null)
      setVersions(prev => [version, ...prev])
    } finally {
      setSavingVersion(false)
    }
  }

  function handleRestoreVersion(version: TranscriptionVersion) {
    if (!editor) return
    editor.commands.setContent(version.contenu as any)
  }

  async function handleAddZone(zoneTypeId: string, contenu: string) {
    if (!contenu.trim()) return
    const transcriptionId = await ensureTranscriptionRow()
    const zone = await createZone(transcriptionId, zoneTypeId, contenu.trim())
    setZones(prev => [...prev, zone])
  }

  async function handleDeleteZone(zoneId: string) {
    await deleteZone(zoneId)
    setZones(prev => prev.filter(z => z.id !== zoneId))
  }

  function handleQualiteChange(patch: Partial<TranscriptionQualite>) {
    setQualite(prev => ({ ...prev, ...patch }))
    qualitePendingRef.current = { ...qualitePendingRef.current, ...patch }
    if (qualiteSaveTimer.current) clearTimeout(qualiteSaveTimer.current)
    qualiteSaveTimer.current = setTimeout(async () => {
      const pending = qualitePendingRef.current
      qualitePendingRef.current = {}
      const id = await ensureTranscriptionRow()
      updateQualite(id, pending).catch(() => {})
    }, 600)
  }

  useEffect(() => {
    fetchZoneTypes().then(setZoneTypes).catch(() => {})
  }, [])

  useEffect(() => {
    if (!exemplaireId || !editor) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data: exCtx } = await fetchExemplaireContext(exemplaireId!)
      if (cancelled) return
      if (!exCtx) { setNotFound(true); setLoading(false); return }

      const docRel = Array.isArray((exCtx as any).unites_documentaires) ? (exCtx as any).unites_documentaires[0] : (exCtx as any).unites_documentaires
      const depot = Array.isArray((exCtx as any).ref_depots) ? (exCtx as any).ref_depots[0] : (exCtx as any).ref_depots
      const institution = depot ? (Array.isArray(depot.ref_institutions) ? depot.ref_institutions[0] : depot.ref_institutions) : null
      const depotLabel = depot ? [institution?.sigle ?? institution?.nom, depot.nom].filter(Boolean).join(' · ') || null : null

      setCtx({
        id: (exCtx as any).id,
        coteLocale: (exCtx as any).cote_locale ?? null,
        documentId: (exCtx as any).unite_documentaire_id,
        documentTitre: docRel?.titre ?? 'Document',
        depotLabel,
      })

      fetchZonesAttendu(exemplaireId!).then(a => { if (!cancelled) setZonesAttendu(a) }).catch(() => {})

      const { data: tr } = await fetchTranscription(exemplaireId!)
      if (cancelled) return
      if (tr) {
        transcriptionIdRef.current = tr.id
        setStatut(tr.statut)
        statutRef.current = tr.statut
        setLocked(tr.statut === 'termine')
        setMarqueTranscritParEmail((tr as any).marque_transcrit_par_email ?? null)
        setMarqueTranscritLe((tr as any).marque_transcrit_le ?? null)
        if (tr.contenu && Object.keys(tr.contenu as object).length > 0) {
          editor.commands.setContent(tr.contenu as any)
        }

        const [versionsList, commentsList, zonesList] = await Promise.all([
          fetchVersions(tr.id),
          fetchComments(tr.id),
          fetchZones(tr.id),
        ])
        if (cancelled) return
        setVersions(versionsList)
        setComments(commentsList)
        setZones(zonesList)
        if ((tr as any).qualite) setQualite((tr as any).qualite)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exemplaireId, editor])

  // Flush plutôt qu'annule les sauvegardes différées en attente — sinon
  // fermer/naviguer dans la fenêtre des 1,2s après une frappe perd le
  // changement (le timer est annulé, jamais exécuté).
  useEffect(() => () => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); doSave() }
    if (qualiteSaveTimer.current) {
      clearTimeout(qualiteSaveTimer.current)
      const pending = qualitePendingRef.current
      if (Object.keys(pending).length > 0 && transcriptionIdRef.current) {
        updateQualite(transcriptionIdRef.current, pending).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading || !editor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />Chargement de la transcription…
        </div>
      </div>
    )
  }

  if (notFound || !ctx) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-rose-200 p-6 max-w-sm text-center">
          <p className="text-sm font-medium text-gray-800">Exemplaire introuvable</p>
          <button onClick={() => navigate('/atelier-documentaire')} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800">
            Retour à l'atelier documentaire
          </button>
        </div>
      </div>
    )
  }

  const openCommentsCount = comments.filter(c => c.statut === 'ouvert').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0 flex-wrap">
            <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors shrink-0">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <Link to="/atelier-documentaire" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors shrink-0">
              <FileEdit className="w-4 h-4" />
              Atelier documentaire
            </Link>
            <span className="text-gray-300">/</span>
            <Link to={`/atelier-documentaire/documents/${ctx.documentId}`} className="hover:text-gray-700 transition-colors truncate">
              {ctx.documentTitre}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900 truncate">{ctx.coteLocale || 'Exemplaire'}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <SaveIndicator state={saveState} />
            {marqueTranscritParEmail && (
              <span
                className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400"
                title={marqueTranscritLe ? new Date(marqueTranscritLe).toLocaleString('fr-FR') : undefined}
              >
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Transcrit par {marqueTranscritParEmail}{marqueTranscritLe && ` · ${relativeTime(marqueTranscritLe)}`}
              </span>
            )}
            {!locked && statut !== 'termine' && (
              <button
                onClick={handleMarkAsTranscrit}
                disabled={marking}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Marquer comme transcrit
              </button>
            )}
            <button
              onClick={() => locked ? setConfirmUnlockOpen(true) : setLocked(true)}
              title={locked ? 'Déverrouiller pour modifier' : 'Verrouiller'}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                locked ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={confirmUnlockOpen} onOpenChange={setConfirmUnlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déverrouiller pour modifier ?</DialogTitle>
            <DialogDescription>
              Cette transcription est marquée comme transcrite. La déverrouiller repasse son statut à "En cours" et
              rend à nouveau modifiables le contenu, les zones spécifiques, la qualité et les commentaires.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setConfirmUnlockOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button onClick={handleUnlock}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors">
              <Unlock className="w-3.5 h-3.5" />Déverrouiller
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-6 py-8 flex items-start gap-6">
        <div className="flex-1 min-w-0 max-w-4xl">
          {ctx.depotLabel && <p className="text-xs text-gray-400 mb-3">{ctx.depotLabel}</p>}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <Toolbar editor={editor} hasSelection={hasSelection} onComment={handleOpenCommentComposer} locked={locked} />
            <div className="px-8 py-6">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        <aside className="w-96 shrink-0 sticky top-[68px]">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-h-[calc(100vh-100px)] overflow-y-auto">
            <AccordionSection title="Zones spécifiques" icon={Layers} count={zones.length}
              open={openSections.has('zones')} onToggle={() => toggleSection('zones')}>
              <ZonesPanel
                zoneTypes={zoneTypes}
                zones={zones}
                attendu={zonesAttendu}
                locked={locked}
                onAdd={handleAddZone}
                onDelete={handleDeleteZone}
              />
            </AccordionSection>

            <AccordionSection title="Commentaires" icon={MessageSquarePlus} count={openCommentsCount}
              open={openSections.has('commentaires')} onToggle={() => toggleSection('commentaires')}>
              <CommentsPanel
                comments={comments}
                activeCommentId={activeCommentId}
                pending={pendingComment ? { text: '' } : null}
                locked={locked}
                onCancelPending={() => setPendingComment(null)}
                onSubmitPending={handleSubmitComment}
                onResolve={handleResolveComment}
                onReopen={handleReopenComment}
                onDelete={handleDeleteComment}
              />
            </AccordionSection>

            <AccordionSection title="Historique" icon={History} count={versions.length}
              open={openSections.has('historique')} onToggle={() => toggleSection('historique')}>
              <HistoryPanel
                versions={versions}
                onSave={handleSaveVersion}
                onRestore={handleRestoreVersion}
                saving={savingVersion}
                locked={locked}
              />
            </AccordionSection>

            <AccordionSection title="Qualité" icon={Gauge}
              open={openSections.has('qualite')} onToggle={() => toggleSection('qualite')}>
              <QualitePanel qualite={qualite} onChange={handleQualiteChange} locked={locked} />
            </AccordionSection>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default TranscriptionEditorPage
