/**
 * ============================================================================
 * DEFINITION OF DONE — Onglet "Extraction" (edit + view)
 * ============================================================================
 *
 * A) Prérequis & affichage
 * ☐ L’onglet reçoit acte_id, exemplaire_id (si applicable), transcription_version_id et mode.
 * ☐ La transcription de la version active est chargée et affichée.
 * ☐ Le split-view (transcription / panneau) est responsive et stable.
 *
 * B) Modèle Anchor (preuve)
 * ☐ Toute extraction est liée à un anchor contenant :
 *    - transcription_version_id
 *    - start_offset / end_offset
 *    - exact / prefix / suffix
 *    - status (OK / NEEDS_REVIEW / ORPHANED)
 * ☐ Interdit de persister une extraction sans anchor complet.
 *
 * C) Mode VIEW (lecture seule)
 * ☐ Aucun contrôle d’ajout/édition/suppression/re-liaison n’est visible ou actif.
 * ☐ Aucun appel d’écriture DB ne peut être déclenché en view (zéro side-effect).
 * ☐ La liste des extractions est visible, groupée, avec badge de statut.
 * ☐ “Voir dans le texte” fonctionne (scroll + highlight) pour OK/NEEDS_REVIEW.
 * ☐ ORPHANED :
 *    - badge visible
 *    - pas de highlight dans le texte
 *    - “Voir dans le texte” désactivé avec tooltip explicite.
 *
 * D) Mode EDIT (création depuis texte + repair)
 * ☐ L’utilisateur peut sélectionner un segment dans le texte.
 * ☐ Menu/actions permettant de créer : Acteur/Lieu/Fait/Mention/Document lié.
 * ☐ Un formulaire s’ouvre et la validation crée l’entité + l’anchor.
 * ☐ La création est impossible si aucune sélection n’est faite.
 * ☐ Les nouveaux items apparaissent immédiatement dans la liste et sont highlightés.
 * ☐ Re-lier est possible pour NEEDS_REVIEW/ORPHANED :
 *    - nouvelle sélection
 *    - update de l’anchor (offset + exact/prefix/suffix)
 *    - status => OK.
 *
 * E) Navigation bidirectionnelle (dans les deux modes)
 * ☐ Cliquer un item => scroll + highlight focus.
 * ☐ Les highlights sont rendus dans le texte pour les segments localisables.
 * ☐ (Optionnel recommandé) clic highlight => focus item dans liste.
 *
 * F) Gestion des versions (robustesse)
 * ☐ Les anchors indiquent toujours la version source.
 * ☐ Les statuts sont cohérents avec la version affichée.
 * ☐ Aucun “faux OK” : si l’anchor n’est pas localisable sur la version courante,
 *    il n’apparaît pas highlighté et est marqué NEEDS_REVIEW/ORPHANED.
 *
 * G) Qualité UX / perf / stabilité
 * ☐ Aucun saut de scroll non voulu.
 * ☐ Pas de perte de focus dans les formulaires.
 * ☐ Highlights performants (pas de recalcul destructif).
 * ☐ Keys React stables dans les listes.
 * ☐ Tooltips / libellés clairs sur les actions désactivées.
 */


// ExtractionTab.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  GripVertical,
  Pickaxe,
  Plus,
  Eye,
  AlertTriangle,
  Users,
  MapPin,
  Network,
  NotepadText,
  Link2,
  X,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

/**
 * ============================================================================
 * ONGLET "EXTRACTION" — Spécification globale (mode="edit" & mode="view")
 * ============================================================================
 *
 * Intention produit
 *  - Pont scientifique entre transcription (source primaire) et données structurées.
 *  - Toute extraction est justifiée par un segment (anchor) sur une version de transcription.
 *
 * Règles d’or
 *  - Pas de création sans sélection.
 *  - Les anchors stockent exact + prefix + suffix + offsets + status.
 *  - En mode view : lecture seule, aucune écriture DB, aucune action d’ajout / reliaison.
 *
 * Définition of Done : voir bas de fichier.
 */

type Props = {
  acteId: string;
  mode: 'edit' | 'view';
  onGoToTab?: (tabLabel: string) => void;
};

// ---------------------------------------------------------------------------
// Types (à aligner avec ton modèle Supabase)
// ---------------------------------------------------------------------------
type AnchorStatus = 'OK' | 'NEEDS_REVIEW' | 'ORPHANED';

type ExtractKind = 'acteur' | 'lieu' | 'fait' | 'mention' | 'document';

type TextAnchor = {
  transcription_version_id: string;
  start_offset: number;
  end_offset: number;
  exact: string;
  prefix: string;
  suffix: string;
  status: AnchorStatus;
};

type ExtractionItem = {
  id: string;
  kind: ExtractKind;
  label: string; // ex: "Marius ROMAND — époux"
  anchor: TextAnchor | null;
  // fields métier minimaux (tu enrichiras ensuite)
  payload?: Record<string, any>;
};

type Selection = { start: number; end: number; text: string; prefix: string; suffix: string } | null;

// ---------------------------------------------------------------------------
// Helpers UI
// ---------------------------------------------------------------------------
function kindMeta(kind: ExtractKind) {
  switch (kind) {
    case 'acteur':
      return { title: 'Acteurs', Icon: Users };
    case 'lieu':
      return { title: 'Lieux', Icon: MapPin };
    case 'fait':
      return { title: 'Faits familiaux', Icon: Network };
    case 'mention':
      return { title: 'Mentions', Icon: NotepadText };
    case 'document':
      return { title: 'Documents liés', Icon: Link2 };
  }
}

function statusBadge(status: AnchorStatus) {
  if (status === 'OK') return <Badge className='bg-emerald-600 text-white'>OK</Badge>;
  if (status === 'NEEDS_REVIEW') return <Badge className='bg-amber-600 text-white'>À vérifier</Badge>;
  return <Badge className='bg-red-600 text-white'>Orphelin</Badge>;
}

function selectionFromDOM(container: HTMLElement, text: string): Selection {
  // ⚠️ Hypothèse : le texte affiché correspond exactement à `text` (pas de transformation).
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const raw = sel.toString();
  if (!raw.trim()) return null;

  // Calcul d’offset simple : on reconstruit l’index en parcourant les text nodes du container
  // => suffisant pour un premier jet. Si tu veux du robuste, il faudra un “text layer” contrôlé.
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let currentNode: Node | null = walker.nextNode();
  let offset = 0;

  let start = -1;
  let end = -1;

  while (currentNode) {
    const nodeText = currentNode.textContent ?? '';
    if (currentNode === range.startContainer) {
      start = offset + range.startOffset;
    }
    if (currentNode === range.endContainer) {
      end = offset + range.endOffset;
      break;
    }
    offset += nodeText.length;
    currentNode = walker.nextNode();
  }

  if (start < 0 || end < 0 || end <= start) return null;

  const exact = text.slice(start, end);
  const prefix = text.slice(Math.max(0, start - 40), start);
  const suffix = text.slice(end, Math.min(text.length, end + 40));

  return { start, end, text: exact, prefix, suffix };
}

type Highlight = {
  id: string;
  start: number;
  end: number;
  status: AnchorStatus;
  kind: ExtractKind;
  label: string;
};

function buildHighlights(items: ExtractionItem[], transcriptionVersionId: string | null): Highlight[] {
  const hs: Highlight[] = [];
  for (const it of items) {
    const a = it.anchor;
    if (!a) continue;
    if (!transcriptionVersionId) continue;

    // Ici : on ne surligne QUE si anchor liée à la version courante et localisable.
    if (a.transcription_version_id !== transcriptionVersionId) continue;
    if (a.status === 'ORPHANED') continue;

    hs.push({
      id: it.id,
      start: a.start_offset,
      end: a.end_offset,
      status: a.status,
      kind: it.kind,
      label: it.label,
    });
  }
  return hs.sort((x, y) => x.start - y.start);
}

function renderTextWithHighlights(
  text: string,
  highlights: Highlight[],
  onClickHighlight?: (id: string) => void,
) {
  if (!highlights.length) {
    return <div className='whitespace-pre-wrap text-slate-900'>{text}</div>;
  }

  // On suppose pas de overlaps pour ce MVP. Si overlap => on rend brut + warning.
  for (let i = 1; i < highlights.length; i++) {
    if (highlights[i].start < highlights[i - 1].end) {
      return (
        <div className='space-y-2'>
          <div className='rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-center gap-2'>
            <AlertTriangle className='h-4 w-4' />
            Overlaps détectés dans les segments : rendu sans surlignage (à gérer plus tard).
          </div>
          <div className='whitespace-pre-wrap text-slate-900'>{text}</div>
        </div>
      );
    }
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const h of highlights) {
    if (h.start > cursor) {
      parts.push(<React.Fragment key={`t-${cursor}`}>{text.slice(cursor, h.start)}</React.Fragment>);
    }

    const chunk = text.slice(h.start, h.end);

    const base =
      h.status === 'OK'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
        : 'border-amber-200 bg-amber-50 text-amber-950';

    parts.push(
      <button
        key={`h-${h.id}-${h.start}`}
        type='button'
        onClick={() => onClickHighlight?.(h.id)}
        className={[
          'inline rounded-sm border px-0.5 py-0.5 text-left',
          'hover:shadow-sm hover:brightness-[0.98]',
          base,
        ].join(' ')}
        title={`${h.label}`}
      >
        {chunk}
      </button>,
    );

    cursor = h.end;
  }

  if (cursor < text.length) {
    parts.push(<React.Fragment key={`t-${cursor}`}>{text.slice(cursor)}</React.Fragment>);
  }

  return <div className='whitespace-pre-wrap text-slate-900 leading-relaxed'>{parts}</div>;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function ExtractionTab({ acteId, mode }: Props) {
  // -------------------------------------------------------------------------
  // State "split" (copie du pattern de TranscriptionTab)
  // -------------------------------------------------------------------------
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [leftPct, setLeftPct] = useState(62);

  const onMouseDownDivider = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startLeft = leftPct;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const root = rootRef.current;
      if (!root) return;
      const width = root.getBoundingClientRect().width;
      const deltaPct = (dx / width) * 100;
      const next = Math.max(35, Math.min(75, startLeft + deltaPct));
      setLeftPct(next);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // -------------------------------------------------------------------------
  // Data loading (TODO: brancher sur ta logique réelle)
  // -------------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [exemplaireId, setExemplaireId] = useState<string | null>(null);
  const [transcriptionVersionId, setTranscriptionVersionId] = useState<string | null>(null);
  const [transcriptionText, setTranscriptionText] = useState<string>('');
  const [items, setItems] = useState<ExtractionItem[]>([]);

  // Pour le MVP, on simule le chargement ; remplace par ton hook/service.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      try {
        // TODO(api): récupérer l’exemplaire actif + transcription_version_id + texte
        // TODO(api): récupérer la liste des extractions (items + anchors) pour acte/exemplaire/version
        // Exemple attendu :
        // setExemplaireId(...)
        // setTranscriptionVersionId(...)
        // setTranscriptionText(...)
        // setItems(...)

        // Placeholder de dev
        if (cancelled) return;
        setExemplaireId('active_source_placeholder');
        setTranscriptionVersionId('tr_v1_placeholder');
        setTranscriptionText(
          `Transcription (placeholder) — acte ${acteId}\n\nSélectionnez un passage (mode edit) pour créer une extraction.\n\nEx: "L’an mil huit cent cinquante-neuf..."`,
        );
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [acteId]);

  // -------------------------------------------------------------------------
  // Selection & focus
  // -------------------------------------------------------------------------
  const textRef = useRef<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const captureSelection = () => {
    if (mode !== 'edit') return; // en view => aucune “création” ne doit se déclencher
    const node = textRef.current;
    if (!node) return;
    setSelection(selectionFromDOM(node, transcriptionText));
  };

  const highlights = useMemo(
    () => buildHighlights(items, transcriptionVersionId),
    [items, transcriptionVersionId],
  );

  const focusedItem = useMemo(() => items.find((x) => x.id === focusedId) ?? null, [items, focusedId]);

  const scrollToAnchor = (it: ExtractionItem) => {
    const a = it.anchor;
    if (!a) return;
    if (!transcriptionVersionId) return;
    if (a.transcription_version_id !== transcriptionVersionId) return;
    if (a.status === 'ORPHANED') return;

    // MVP: on “simule” un focus en mettant l’item en focus, et le highlight a déjà un style.
    setFocusedId(it.id);

    // Option plus robuste: calculer la position d’un highlight rendu et scroll.
    // Ici, on scrolle la zone texte en haut (simple et safe).
    textRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // -------------------------------------------------------------------------
  // Sheet: création (edit-only)
  // -------------------------------------------------------------------------
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKind, setSheetKind] = useState<ExtractKind>('acteur');
  const [draftLabel, setDraftLabel] = useState('');
  const [draftNote, setDraftNote] = useState('');

  const openCreate = (kind: ExtractKind) => {
    if (mode !== 'edit') return;
    if (!selection) return;
    setSheetKind(kind);
    setDraftLabel('');
    setDraftNote('');
    setSheetOpen(true);
  };

  const createExtraction = async () => {
    if (mode !== 'edit') return; // guard anti-écriture
    if (!selection) return;
    if (!transcriptionVersionId) return;

    // TODO(api): insert extraction + anchor (exact/prefix/suffix/offsets/status=OK) + payload
    // Ici on fait un insert local (MVP UI)
    const id = crypto.randomUUID();
    const a: TextAnchor = {
      transcription_version_id: transcriptionVersionId,
      start_offset: selection.start,
      end_offset: selection.end,
      exact: selection.text,
      prefix: selection.prefix,
      suffix: selection.suffix,
      status: 'OK',
    };

    const labelBase = draftLabel.trim()
      ? draftLabel.trim()
      : `${kindMeta(sheetKind).title.slice(0, -1)} extrait`;

    const next: ExtractionItem = {
      id,
      kind: sheetKind,
      label: labelBase,
      anchor: a,
      payload: {
        note: draftNote.trim() || null,
      },
    };

    setItems((prev) => [next, ...prev]);
    setFocusedId(id);
    setSheetOpen(false);
    setSelection(null);
  };

  // -------------------------------------------------------------------------
  // Sheet: repair / re-lier (edit-only) — MVP
  // -------------------------------------------------------------------------
  const [repairingId, setRepairingId] = useState<string | null>(null);

  const startRepair = (id: string) => {
    if (mode !== 'edit') return;
    setRepairingId(id);
    setSelection(null);
  };

  const applyRepair = async () => {
    if (mode !== 'edit') return;
    if (!repairingId) return;
    if (!selection) return;
    if (!transcriptionVersionId) return;

    // TODO(api): update anchor offsets+exact+prefix+suffix + status OK
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== repairingId) return it;
        if (!it.anchor) return it;
        return {
          ...it,
          anchor: {
            ...it.anchor,
            transcription_version_id: transcriptionVersionId,
            start_offset: selection.start,
            end_offset: selection.end,
            exact: selection.text,
            prefix: selection.prefix,
            suffix: selection.suffix,
            status: 'OK',
          },
        };
      }),
    );

    setRepairingId(null);
    setSelection(null);
  };

  // -------------------------------------------------------------------------
  // Derived groups
  // -------------------------------------------------------------------------
  const grouped = useMemo(() => {
    const map: Record<ExtractKind, ExtractionItem[]> = {
      acteur: [],
      lieu: [],
      fait: [],
      mention: [],
      document: [],
    };
    for (const it of items) map[it.kind].push(it);
    return map;
  }, [items]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (loading) {
    return <div className='p-4 text-sm text-slate-600'>Chargement…</div>;
  }

  const isEdit = mode === 'edit';

  return (
    <div className='p-4 space-y-4'>
      {/* Header “guidance” card */}
      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
        <div className='flex items-start justify-between gap-4'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <Pickaxe className='h-4 w-4 text-slate-700' />
              <div className='text-sm font-semibold text-slate-900'>Extraction</div>
              <Badge variant='secondary'>{isEdit ? 'mode edit' : 'mode view'}</Badge>
            </div>

            <div className='mt-2 text-xs text-slate-600 leading-relaxed'>
              Cet onglet relie les données extraites (acteurs, lieux, faits, mentions…) aux passages exacts de la
              transcription. Le but est de conserver une preuve (segment) pour chaque information.
            </div>

            <div className='mt-2 flex flex-wrap items-center gap-2 text-xs'>
              <span className='rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700'>
                exemplaire: <span className='font-medium'>{exemplaireId ?? '—'}</span>
              </span>
              <span className='rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700'>
                version: <span className='font-medium'>{transcriptionVersionId ?? '—'}</span>
              </span>
              <span className='rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700'>
                extractions: <span className='font-medium'>{items.length}</span>
              </span>
            </div>
          </div>

          {isEdit ? (
            <div className='shrink-0'>
              <div className='rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-start gap-2'>
                <HelpCircle className='h-4 w-4 mt-0.5' />
                <div className='min-w-0'>
                  <div className='font-semibold'>Rappel</div>
                  <div className='mt-0.5'>
                    Sélectionne un passage du texte pour activer les actions “Ajouter…”.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Split layout */}
      <div
        ref={rootRef}
        id='extraction-split-root'
        className='grid gap-0'
        style={{
          gridTemplateColumns: `minmax(360px, ${leftPct}%) 12px minmax(320px, ${100 - leftPct}%)`,
        }}
      >
        {/* Left: transcription + highlights */}
        <div className='pr-2'>
          <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
            <div className='flex items-center justify-between gap-3'>
              <div className='flex items-center gap-2 min-w-0'>
                <div className='text-sm font-semibold text-slate-900'>Transcription</div>
                <Badge variant='secondary'>ancrages</Badge>
              </div>

              {isEdit ? (
                <div className='flex items-center gap-2'>
                  {repairingId ? (
                    <Badge className='bg-amber-600 text-white'>Re-lier en cours</Badge>
                  ) : selection ? (
                    <Badge className='bg-slate-900 text-white'>
                      sélection {selection.start}–{selection.end}
                    </Badge>
                  ) : (
                    <Badge variant='secondary'>Aucune sélection</Badge>
                  )}
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>lecture seule</Badge>
                </div>
              )}
            </div>

            {/* Action bar (edit only) */}
            {isEdit ? (
              <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Button
                    size='sm'
                    className='h-8 px-2 text-xs gap-1'
                    onClick={() => openCreate('acteur')}
                    disabled={!selection || !!repairingId}
                    title={!selection ? 'Sélectionne un passage dans le texte' : 'Ajouter un acteur'}
                  >
                    <Plus className='h-4 w-4' /> Acteur
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='h-8 px-2 text-xs gap-1'
                    onClick={() => openCreate('lieu')}
                    disabled={!selection || !!repairingId}
                  >
                    <Plus className='h-4 w-4' /> Lieu
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='h-8 px-2 text-xs gap-1'
                    onClick={() => openCreate('fait')}
                    disabled={!selection || !!repairingId}
                  >
                    <Plus className='h-4 w-4' /> Fait
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='h-8 px-2 text-xs gap-1'
                    onClick={() => openCreate('mention')}
                    disabled={!selection || !!repairingId}
                  >
                    <Plus className='h-4 w-4' /> Mention
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='h-8 px-2 text-xs gap-1'
                    onClick={() => openCreate('document')}
                    disabled={!selection || !!repairingId}
                  >
                    <Plus className='h-4 w-4' /> Document
                  </Button>
                </div>

                {repairingId ? (
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-xs gap-1'
                      onClick={() => {
                        setRepairingId(null);
                        setSelection(null);
                      }}
                    >
                      <X className='h-4 w-4' /> Annuler re-liaison
                    </Button>
                    <Button
                      size='sm'
                      className='h-8 px-2 text-xs gap-1'
                      onClick={applyRepair}
                      disabled={!selection}
                      title={!selection ? 'Sélectionne le bon passage puis “Appliquer”' : 'Appliquer'}
                    >
                      <CheckCircle2 className='h-4 w-4' /> Appliquer
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className='mt-3'>
              <div
                ref={textRef}
                onMouseUp={captureSelection}
                onKeyUp={captureSelection}
                className={[
                  'min-h-[520px] w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm',
                  isEdit ? 'cursor-text' : 'cursor-default',
                  focusedId ? 'ring-2 ring-slate-900/10' : '',
                ].join(' ')}
                // ⚠️ IMPORTANT : laisser la sélection possible (copier) même en view,
                // mais aucune action ne doit en découler.
                tabIndex={0}
              >
                {renderTextWithHighlights(transcriptionText, highlights, (id) => setFocusedId(id))}
              </div>

              <div className='mt-2 text-xs text-slate-500 flex items-center justify-between gap-2'>
                <div>
                  {isEdit ? (
                    selection ? (
                      <span>
                        Sélection : {selection.start}–{selection.end} ({selection.end - selection.start} caractères)
                      </span>
                    ) : (
                      <span>Sélectionnez un passage pour créer une extraction.</span>
                    )
                  ) : (
                    <span>Mode view : navigation et vérification (aucune création).</span>
                  )}
                </div>

                {focusedItem ? (
                  <div className='rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700'>
                    Focus : <span className='font-medium'>{focusedItem.label}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className='flex items-stretch justify-center'>
          <div
            role='separator'
            onMouseDown={onMouseDownDivider}
            className='mx-1 my-2 w-[10px] cursor-col-resize rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center'
            title='Glisser pour redimensionner'
          >
            <GripVertical className='h-4 w-4 text-slate-400' />
          </div>
        </div>

        {/* Right panel */}
        <div className='pl-2'>
          <div className='sticky top-4'>
            <div className='max-h-[calc(100vh-160px)] overflow-auto space-y-4 pr-1'>
              {/* Card: Extractions list */}
              <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm font-semibold text-slate-900'>Extraits</div>
                  <Badge variant='secondary'>{items.length}</Badge>
                </div>

                {items.length === 0 ? (
                  <div className='mt-3 text-sm text-slate-600'>
                    Aucun extrait pour le moment.
                    {isEdit ? ' Sélectionne un passage et ajoute un élément.' : ''}
                  </div>
                ) : (
                  <div className='mt-3 space-y-3'>
                    {(['acteur', 'lieu', 'fait', 'mention', 'document'] as ExtractKind[]).map((k) => {
                      const group = grouped[k];
                      const meta = kindMeta(k);
                      const Icon = meta.Icon;
                      if (!group.length) return null;

                      return (
                        <div key={k} className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <span className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white'>
                                <Icon className='h-4 w-4 text-slate-700' />
                              </span>
                              <div className='text-xs font-semibold text-slate-700'>{meta.title}</div>
                            </div>
                            <Badge variant='secondary'>{group.length}</Badge>
                          </div>

                          <div className='mt-2 space-y-2'>
                            {group.map((it) => {
                              const a = it.anchor;
                              const status: AnchorStatus = a?.status ?? 'ORPHANED';
                              const canSee =
                                !!a &&
                                status !== 'ORPHANED' &&
                                a.transcription_version_id === transcriptionVersionId;

                              return (
                                <div
                                  key={it.id}
                                  className={[
                                    'rounded-xl border bg-white px-3 py-2',
                                    focusedId === it.id
                                      ? 'border-slate-900/20 ring-2 ring-slate-900/10'
                                      : 'border-slate-200',
                                  ].join(' ')}
                                >
                                  <div className='flex items-start justify-between gap-3'>
                                    <button
                                      type='button'
                                      className='min-w-0 text-left'
                                      onClick={() => setFocusedId(it.id)}
                                      title={it.label}
                                    >
                                      <div className='flex items-center gap-2'>
                                        <div className='text-sm font-semibold text-slate-900 truncate'>
                                          {it.label}
                                        </div>
                                        {statusBadge(status)}
                                      </div>

                                      <div className='mt-1 text-xs text-slate-600'>
                                        {a ? (
                                          <>
                                            {a.start_offset}–{a.end_offset}
                                            {a.transcription_version_id !== transcriptionVersionId ? (
                                              <>
                                                {' '}
                                                · <span className='text-amber-700 font-medium'>autre version</span>
                                              </>
                                            ) : null}
                                          </>
                                        ) : (
                                          <span className='text-red-700 font-medium'>sans segment</span>
                                        )}
                                      </div>

                                      {a?.exact ? (
                                        <div className='mt-1 text-sm text-slate-800 line-clamp-2'>
                                          “{a.exact}”
                                        </div>
                                      ) : null}
                                    </button>

                                    <div className='shrink-0 flex flex-col items-end gap-2'>
                                      <Button
                                        variant='outline'
                                        size='sm'
                                        className='h-8 px-2 text-xs gap-1'
                                        onClick={() => scrollToAnchor(it)}
                                        disabled={!canSee}
                                        title={
                                          !a
                                            ? 'Aucun segment'
                                            : status === 'ORPHANED'
                                              ? 'Segment introuvable'
                                              : a.transcription_version_id !== transcriptionVersionId
                                                ? 'Anchor sur une autre version'
                                                : 'Voir dans le texte'
                                        }
                                      >
                                        <Eye className='h-4 w-4' /> Voir
                                      </Button>

                                      {isEdit && (status === 'NEEDS_REVIEW' || status === 'ORPHANED') ? (
                                        <Button
                                          variant='outline'
                                          size='sm'
                                          className='h-8 px-2 text-xs gap-1'
                                          onClick={() => startRepair(it.id)}
                                        >
                                          <AlertTriangle className='h-4 w-4' /> Re-lier
                                        </Button>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card: Orphans / review summary */}
              <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm font-semibold text-slate-900'>Cohérence</div>
                  <Badge variant='secondary'>segments</Badge>
                </div>

                <div className='mt-3 grid grid-cols-3 gap-2 text-xs'>
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                    <div className='text-slate-600'>OK</div>
                    <div className='mt-1 text-lg font-semibold text-slate-900'>
                      {items.filter((x) => x.anchor?.status === 'OK').length}
                    </div>
                  </div>
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                    <div className='text-slate-600'>À vérifier</div>
                    <div className='mt-1 text-lg font-semibold text-slate-900'>
                      {items.filter((x) => x.anchor?.status === 'NEEDS_REVIEW').length}
                    </div>
                  </div>
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                    <div className='text-slate-600'>Orphelins</div>
                    <div className='mt-1 text-lg font-semibold text-slate-900'>
                      {items.filter((x) => x.anchor?.status === 'ORPHANED' || !x.anchor).length}
                    </div>
                  </div>
                </div>

                {!isEdit ? (
                  <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 flex items-start gap-2'>
                    <HelpCircle className='h-4 w-4 mt-0.5 text-slate-600' />
                    <div className='min-w-0'>
                      En mode view, tu peux vérifier les segments et naviguer, mais pas réparer. Passe en edit pour
                      re-lier les orphelins.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet: Create extraction (edit-only) */}
      <Sheet open={sheetOpen} onOpenChange={(v) => setSheetOpen(v)}>
        <SheetContent side='right' className='!w-[50vw] !max-w-none p-0 flex flex-col max-h-screen'>
          <SheetHeader className='p-4 border-b'>
            <SheetTitle>Ajouter un extrait — {kindMeta(sheetKind).title.slice(0, -1)}</SheetTitle>
            <SheetDescription>
              Création depuis une sélection de texte (preuve). En mode view, ce panneau ne doit jamais s’ouvrir.
            </SheetDescription>
          </SheetHeader>

          <div className='flex-1 overflow-y-auto p-4 scroll-smooth space-y-4'>
            {mode !== 'edit' ? (
              <div className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900'>
                Guard : ce panneau ne doit pas être accessible en mode view.
              </div>
            ) : null}

            <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'>
              <div className='text-sm font-semibold text-slate-900'>Segment sélectionné</div>
              {selection ? (
                <>
                  <div className='text-xs text-slate-600'>
                    Offsets : <span className='font-medium'>{selection.start}–{selection.end}</span>
                  </div>
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 whitespace-pre-wrap'>
                    “{selection.text}”
                  </div>
                </>
              ) : (
                <div className='text-sm text-slate-600'>
                  Aucune sélection. Ferme le panneau et sélectionne un passage avant de créer.
                </div>
              )}
            </div>

            <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'>
              <div className='text-sm font-semibold text-slate-900'>Données minimales</div>
              <div>
                <div className='text-xs font-medium text-slate-700'>Libellé (ex: “Marius ROMAND — époux”)</div>
                <Input
                  className='mt-1'
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  placeholder='Libellé…'
                  disabled={mode !== 'edit'}
                />
              </div>
              <div>
                <div className='text-xs font-medium text-slate-700'>Note (optionnel)</div>
                <Textarea
                  className='mt-1 min-h-[90px]'
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder='Hypothèse, précision de lecture…'
                  disabled={mode !== 'edit'}
                />
              </div>

              <div className='rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-start gap-2'>
                <HelpCircle className='h-4 w-4 mt-0.5' />
                <div className='min-w-0'>
                  <div className='font-semibold'>Important</div>
                  <div className='mt-0.5'>
                    Ce formulaire est minimal (MVP). Tu pourras ensuite relier l’extraction à un acteur/lieu/fait existant,
                    et enrichir dans les onglets dédiés.
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-end gap-2 pt-2'>
                <Button variant='outline' onClick={() => setSheetOpen(false)} className='gap-2'>
                  <X className='h-4 w-4' /> Annuler
                </Button>
                <Button
                  onClick={createExtraction}
                  disabled={mode !== 'edit' || !selection || !transcriptionVersionId}
                  className='gap-2'
                  title={!selection ? 'Sélection requise' : 'Créer l’extraction'}
                >
                  <CheckCircle2 className='h-4 w-4' /> Créer
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/**
       * ============================================================================
       * DEFINITION OF DONE — Onglet "Extraction" (edit + view)
       * ============================================================================
       *
       * A) Affichage & data
       * ☐ L’onglet affiche la transcription d’une version active (exemplaire_id + transcription_version_id).
       * ☐ Les extractions sont listées et groupées par type.
       *
       * B) Anchors (preuve)
       * ☐ Chaque extraction a un anchor : offsets + exact + prefix + suffix + status + transcription_version_id.
       * ☐ En mode view : aucune écriture DB possible.
       *
       * C) Mode VIEW
       * ☐ Aucun bouton Ajouter / Modifier / Supprimer / Re-lier.
       * ☐ Navigation : “Voir dans le texte” fonctionne si localisable.
       * ☐ Statuts visibles (OK / À vérifier / Orphelin).
       *
       * D) Mode EDIT
       * ☐ Sélection texte → actions “Ajouter …” actives.
       * ☐ Création impossible sans sélection.
       * ☐ Re-lier possible pour NEEDS_REVIEW / ORPHANED, via re-sélection.
       *
       * E) Highlights
       * ☐ OK/NEEDS_REVIEW surlignés dans le texte si anchor sur version courante.
       * ☐ ORPHANED non surligné + visible via liste.
       *
       * F) Qualité
       * ☐ Pas de side-effects en view (guards).
       * ☐ UI stable (split, scroll, sticky panel).
       */}
    </div>
  );
}
