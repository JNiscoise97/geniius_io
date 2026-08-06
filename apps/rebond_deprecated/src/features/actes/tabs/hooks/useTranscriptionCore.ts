// useTranscriptionCore.ts

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  PAGE_BREAK_TOKEN,
  type AnchorStatus,
  type AnnotationRow,
  type ConfidenceLevel,
  type EcActeRow,
  type NoteRow,
  type TranscriptionKind,
  type TranscriptionStatus,
  type TranscriptionTagRow,
  type TranscriptionVersionRow,
  computeAnchor,
  insertAtSelection,
  loadActeBundle,
  loadVersionChildren,
  loadVersionTags,
  refreshTranscriptionsAndVersions,
  setVersionStatusWithEvent,
  updateAnnotation,
  deleteAnnotation,
  updateNote,
  deleteNote,
  createTag,
  deleteTag,
  persistAnnotationStatuses,
  revalidateAnchor,
  insertAnnotation,
  insertNote,
  type TranscriptionRow,
  createNewVersionForSource,
  updateTranscription,
  ensureTranscription,
  type VersionEventRow,
  loadVersionEvents,
  logVersionEvent,
  findIllisibleSuspectRanges,
  findIllisibleValidRanges,
  isInsideAnyRange,
  buildIllisibleToken,
  type TranscriptionPart,
  transcriptionKey,
} from '../transcriptionTab.service';

type DirtyState = 'clean' | 'editing' | 'saving' | 'saved';

function dirtyLabel(state: DirtyState) {
  switch (state) {
    case 'editing':
      return 'Modifications non enregistrées';
    case 'saving':
      return 'Enregistrement…';
    case 'saved':
      return 'Enregistré';
    default:
      return '';
  }
}

export function useTranscriptionCore({
  acteId,
  setSheetMode,
  setSheetOpen,
}: {
  acteId: string;
  setSheetMode: (m: 'annotation' | 'note' | 'tag') => void;
  setSheetOpen: (v: boolean) => void;
}) {
  // -----------------------------
  // Base state
  // -----------------------------
  const [loading, setLoading] = useState(false);

  const [acte, setActe] = useState<EcActeRow | null>(null);

  const [transcriptions, setTranscriptions] = useState<TranscriptionRow[]>([]);
  const [activePart, setActivePart] = useState<TranscriptionPart>('main_body');

  const [versions, setVersions] = useState<TranscriptionVersionRow[]>([]);
  const [transcriptionByKey, setTranscriptionByKey] = useState<Record<string, TranscriptionRow>>(
    {},
  );
  const [latestVersionIdByKey, setLatestVersionIdByKey] = useState<Record<string, string>>({});

  const [currentId, setCurrentId] = useState<string | null>(null);
  const currentVersion = useMemo(
    () => versions.find((v) => v.id === currentId) ?? null,
    [versions, currentId],
  );

  // -----------------------------
  // ✅ Sources-first state
  // -----------------------------
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const preferredSourceId = useMemo(() => {
    const ref = transcriptions.find(
      (t) => t.is_reference && (t.transcription_part ?? 'main_body') === 'main_body',
    );
    return ref?.acte_source_id ?? null;
  }, [transcriptions]);

  const [workingVersionId, setWorkingVersionId] = useState<string | null>(null);
  const workingVersion = useMemo(
    () => versions.find((v) => v.id === workingVersionId) ?? null,
    [versions, workingVersionId],
  );

  // -----------------------------
  // Editor
  // -----------------------------
  const [editorValue, setEditorValue] = useState('');
  const [dirtyState, setDirtyState] = useState<DirtyState>('clean');
  const savedFlashTimerRef = useRef<number | null>(null);

  const [illisibleOpen, setIllisibleOpen] = useState(false);
  const [illisibleX, setIllisibleX] = useState<number>(0);
  const [illisibleY, setIllisibleY] = useState<number>(0);
  const [illisibleZ, setIllisibleZ] = useState<number>(0);

  function clearSavedFlashTimer() {
    if (savedFlashTimerRef.current !== null) {
      window.clearTimeout(savedFlashTimerRef.current);
      savedFlashTimerRef.current = null;
    }
  }

  // flash "saved" 1.2s puis retourne à clean (ou editing si l'utilisateur a retapé entre temps)
  function flashSavedThenClean() {
    clearSavedFlashTimer();
    setDirtyState('saved');
    savedFlashTimerRef.current = window.setTimeout(() => {
      setDirtyState((prev) => (prev === 'saved' ? 'clean' : prev));
    }, 1200);
  }

  const [textMode, setTextMode] = useState<'edit' | 'read'>('edit');

  // Children
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [tags, setTags] = useState<TranscriptionTagRow[]>([]);

  const [versionEvents, setVersionEvents] = useState<VersionEventRow[]>([]);

  // Actors + gabarits
  const [acteurs, setActeurs] = useState<
    Array<{ id: string; role: string | null; prenom: string | null; nom: string | null }>
  >([]);

  // Selection
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

  // Annotation drafts
  const [annoType, setAnnoType] = useState<AnnotationRow['type']>('doubt');
  const [annoComment, setAnnoComment] = useState('');
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);

  // Note drafts
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Tag drafts
  const [tagKind, setTagKind] = useState<TranscriptionTagRow['kind']>('date');
  const [tagLabel, setTagLabel] = useState('');
  const [tagActeurId, setTagActeurId] = useState('');

  // Compare (version-based internal)
  const [compareLeftId, setCompareLeftId] = useState<string>('');
  const [compareRightId, setCompareRightId] = useState<string>('');
  const [compareReasonDraft, setCompareReasonDraft] = useState<string>('');

  // Anchor overrides (auto revalidation)
  const [anchorStatusOverrides, setAnchorStatusOverrides] = useState<Record<string, AnchorStatus>>(
    {},
  );

  // ✅ IMPORTANT: éviter le conflit NodeJS.Timeout vs number (si @types/node est présent)
  const anchorRevalidateTimer = useRef<number | null>(null);

  const autoDraftInFlightRef = useRef(false);
  const autoDraftDoneRef = useRef(false);

  // ✅ Debounce timer pour création auto de v1 draft quand l'utilisateur s'arrête de taper
  // number (window.setTimeout) pour éviter NodeJS.Timeout
  const autoDraftDebounceTimer = useRef<number | null>(null);

  // -----------------------------
  // 🔒 Editability rules
  // -----------------------------
  const EDITABLE_STATUSES: TranscriptionStatus[] = ['TO_TRANSCRIBE', 'DRAFT', 'IN_PROGRESS'];

  const isEditableStatus = useMemo(() => {
    return EDITABLE_STATUSES.includes(workingVersion?.status as any);
  }, [workingVersion?.status]);

  const shouldDefaultToReadMode = useMemo(() => {
    if (!workingVersion) return false;
    return !EDITABLE_STATUSES.includes(workingVersion.status);
  }, [workingVersion?.status]);

  useEffect(() => {
    return () => {
      if (autoDraftDebounceTimer.current !== null) {
        window.clearTimeout(autoDraftDebounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      clearSavedFlashTimer();
    };
  }, []);

  // -----------------------------
  // Derived
  // -----------------------------
  function getNextVersionNumberForSource(sourceId: string | null): number {
    if (!sourceId) {
      const maxAll = versions.reduce((acc, v) => Math.max(acc, v.version ?? 0), 0);
      return maxAll + 1;
    }

    const tr = transcriptionByKey[transcriptionKey(sourceId, activePart)];
    if (!tr) return 1;

    const maxForTranscription = versions
      .filter((v) => v.transcription_id === tr.id)
      .reduce((acc, v) => Math.max(acc, v.version ?? 0), 0);

    return maxForTranscription + 1;
  }

  const nextVersionNumber = useMemo(() => {
    return getNextVersionNumberForSource(activeSourceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions, activeSourceId, activePart, transcriptionByKey]);

  const groupedAnnotations = useMemo(() => {
    const groups: Record<AnnotationRow['type'], AnnotationRow[]> = {
      doubt: [],
      rature: [],
      lacune: [],
      mention: [],
      other: [],
    };
    for (const a of annotations) groups[a.type].push(a);
    return groups;
  }, [annotations]);

  // -----------------------------
  // Helpers: latest version per source
  // -----------------------------
  function getLatestVersionIdForSource(
    sourceId: string,
    part: TranscriptionPart = activePart,
  ): string | null {
    const k = transcriptionKey(sourceId, part);
    return latestVersionIdByKey[k] ?? null;
  }

  // -----------------------------
  // Load bundle (and create v1 if needed)
  // -----------------------------
  useEffect(() => {
    let cancelled = false;

    const hardReset = () => {
      setActe(null);
      setTranscriptions([]);
      setVersions([]);
      setCurrentId(null);

      setActiveSourceId(null);
      setWorkingVersionId(null);

      setActeurs([]);
      setAnnotations([]);
      setNotes([]);
      setTags([]);
      setEditorValue('');
      setDirtyState('clean');
      setSelection(null);
      setAnchorStatusOverrides({});
    };

    const run = async () => {
      setLoading(true);
      try {
        const bundle = await loadActeBundle(acteId);
        if (cancelled) return;

        setActe(bundle.acte);
        setTranscriptions(bundle.transcriptions);
        setVersions(bundle.versions);
        setTranscriptionByKey(bundle.transcriptionByKey);
        setLatestVersionIdByKey(bundle.latestVersionIdByKey);

        setActeurs(bundle.acteurs);

        // Default: pick a “current”
        if (!currentId && bundle.versions.length) {
          setCurrentId(bundle.versions[0].id);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? 'Erreur lors du chargement de l’onglet Transcription');
        hardReset();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acteId]);

  // -----------------------------
  // When current version changes: load children + seed meta drafts from [META]
  // -----------------------------
  useEffect(() => {
    if (!currentVersion) return;

    let cancelled = false;

    // reset editor state to that version
    setEditorValue(currentVersion.content ?? '');
    setDirtyState('clean');
    setSelection(null);
    setTextMode(shouldDefaultToReadMode ? 'read' : 'edit');
    setAnchorStatusOverrides({});

    const run = async () => {
      try {
        const [children, t, evts] = await Promise.all([
          loadVersionChildren(currentVersion.id),
          loadVersionTags(currentVersion.id),
          loadVersionEvents(currentVersion.id),
        ]);
        if (cancelled) return;

        setAnnotations(children.annotations);
        setNotes(children.notes);
        setTags(t);
        setVersionEvents(evts);
      } catch (e) {
        console.error(e);
        if (cancelled) return;
        setAnnotations([]);
        setNotes([]);
        setTags([]);
        setVersionEvents([]);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [currentId, shouldDefaultToReadMode]); // intentionally

  // -----------------------------
  // Selection capture
  // -----------------------------
  const captureSelection = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start === end) return setSelection(null);
    setSelection({ start, end });
  };

  // -----------------------------
  // Refresh versions helper
  // -----------------------------
  async function refreshVersionsAndSelect(idToSelect?: string) {
    const res = await refreshTranscriptionsAndVersions(acteId);
    setTranscriptions(res.transcriptions);
    setVersions(res.versions);
    setTranscriptionByKey(res.transcriptionByKey);
    setLatestVersionIdByKey(res.latestVersionIdByKey);

    if (idToSelect) setCurrentId(idToSelect);
  }

  // -----------------------------
  // Version creation helpers
  // -----------------------------
  const createNewVersion = async (
    payload: {
      status: TranscriptionStatus;
      content: string;
      transcription_kind?: TranscriptionKind | null;
      confidence?: ConfidenceLevel | null;
      sourceIds?: string[];
    },
    opts?: {
      // ✅ Option A : auto-draft -> false (ne touche pas currentId)
      selectAfterCreate?: boolean;
      // si true : on refresh les maps versions/transcriptions après insert
      refreshAfterCreate?: boolean;
    },
  ): Promise<TranscriptionVersionRow> => {
    if (!activeSourceId) throw new Error('Aucune source active');

    const selectAfterCreate = opts?.selectAfterCreate ?? true;
    const refreshAfterCreate = opts?.refreshAfterCreate ?? true;

    setLoading(true);
    try {
      const row = await createNewVersionForSource({
        acteId,
        activeSourceId,
        part: activePart, // ✅
        editorContent: payload.content,
        status: payload.status,
        prevVersionId: (workingVersion ?? currentVersion)?.id ?? null,
        prevContent: (workingVersion ?? currentVersion)?.content ?? null,
        transcription_kind: payload.transcription_kind ?? null,
        confidence: payload.confidence ?? null,
        nextVersionNumber: getNextVersionNumberForSource(activeSourceId),
      });

      toast.success('Version créée');

      // ✅ On garde TOUJOURS workingVersionId à jour (utile pour Save/Meta/etc)
      setWorkingVersionId(row.newVersion.id);

      // ✅ Option A : auto-draft ne touche pas currentId
      if (selectAfterCreate) {
        setCurrentId(row.newVersion.id);
      }

      // refresh des maps pour que le dashboard + status + latestVersionIdBySourceId se mettent à jour
      if (refreshAfterCreate) {
        await refreshVersionsAndSelect(selectAfterCreate ? row.newVersion.id : undefined);
      }

      return row.newVersion;
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Erreur lors de la création de version');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const setInReview = async () => {
    const target = workingVersion ?? currentVersion;
    if (!target) return;

    if (target.status !== 'TRANSCRIBED') {
      toast('Marque d’abord la transcription comme transcrite.', { icon: '🧾' });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await setVersionStatusWithEvent(
        target.id,
        { status: 'IN_REVIEW' },
        { type: 'status_change', payload: { to: 'IN_REVIEW' } },
      );

      toast.success('Marquée en relecture');
      await refreshVersionsAndSelect(target.id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const saveWorkflowMetadata = async (meta: any, checklist: any) => {
    if (!activeSourceId) {
      toast('Sélectionne une source.', { icon: '🧩' });
      return;
    }

    const target = workingVersion ?? currentVersion;
    if (!target) {
      toast('Aucune version à mettre à jour.', { icon: '⚠️' });
      return;
    }

    setLoading(true);
    try {
      setDirtyState('saving');

      // 1) Normalisation policy : raw JSON -> string JSON canonical
      let normalisation_policy: string | null = null;
      const raw = (meta?.normalisation_policy_raw ?? '').trim();
      if (raw) {
        const parsed = JSON.parse(raw); // throw si invalide
        normalisation_policy = JSON.stringify(parsed);
      }

      // 2) Ensure transcription (source-level row)
      const tr0 = transcriptionByKey[transcriptionKey(activeSourceId, activePart)];
      const tr = tr0 ?? (await ensureTranscription(acteId, activeSourceId, activePart));

      // 3) Update transcription-level fields (ec_transcriptions)
      await updateTranscription(tr.id, {
        visibility: meta.visibility,
        state: meta.state,
        source_lecture_kind_ref: meta.source_lecture_kind_ref,
        scope: meta.scope,
        scope_details: meta.scope_details,
        langue_ref: meta.langue_ref,
        language_confidence_ref: meta.language_confidence_ref,
        handwriting_style_ref: meta.handwriting_style_ref,
        handwriting_legibility_ref: meta.handwriting_legibility_ref,
        goal: meta.goal,
        normalisation_policy,
        conventions_id: meta.conventions_id,
        conventions_override_text: meta.conventions_override_text,
        completeness_ref: meta.completeness_ref,
        incompleteness_reason: meta.incompleteness_reason,
        reserve_level_ref: meta.reserve_level_ref,
        reserve_reason: meta.reserve_reason,

        // 👇 nécessitent colonnes en DB (voir SQL plus bas)
        source_page_from: meta.source_page_from,
        source_page_to: meta.source_page_to,
        image_transform_notes: meta.image_transform_notes,

        note: meta.note,
      } as any);

      // 4) Log event: metadata + checklist (version-level history)
      await logVersionEvent({
        transcription_version_id: target.id,
        event_type: 'workflow_metadata',
        payload: {
          acte_source_id: activeSourceId,
          transcription_id: tr.id,
          meta: {
            ...meta,
            normalisation_policy,
          },
        },
      } as any);

      await logVersionEvent({
        transcription_version_id: target.id,
        event_type: 'workflow_checklist',
        payload: {
          acte_source_id: activeSourceId,
          checklist,
        },
      } as any);

      toast.success('Métadonnées enregistrées');
      flashSavedThenClean();

      // Refresh versions + events
      await refreshVersionsAndSelect(target.id);
      const evts = await loadVersionEvents(target.id);
      setVersionEvents(evts);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Erreur enregistrement métadonnées');
      setDirtyState((prev) => (prev === 'saving' ? 'editing' : prev));
    } finally {
      setLoading(false);
    }
  };

  const markAsTranscribed = async () => {
    const target = workingVersion ?? currentVersion;
    if (!target) return;

    setLoading(true);
    try {
      await setVersionStatusWithEvent(
        target.id,
        { status: 'TRANSCRIBED' },
        { type: 'status_change', payload: { to: 'TRANSCRIBED' } },
      );

      toast.success('Marquée comme transcrite');
      await refreshVersionsAndSelect(target.id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const autoStartDraftIfNeeded = async (nextText: string) => {
    if (!activeSourceId) return;
    // déjà une version pour cette source (workingVersion suffit, currentVersion peut être "legacy")
    if (workingVersion) return;
    if (autoDraftDoneRef.current || autoDraftInFlightRef.current) return;

    const trimmed = (nextText ?? '').trim();
    if (!trimmed) return; // pas au 1er caractère "utile"

    setDirtyState('saving');

    autoDraftInFlightRef.current = true;
    try {
      // crée une v1 brouillon avec le texte courant (1 char, paste, etc.)
      const v1 = await createNewVersion(
        {
          status: (nextText ?? '').trim() ? 'IN_PROGRESS' : 'DRAFT',
          content: nextText ?? '',
          transcription_kind: 'travail',
          confidence: 'low',
          sourceIds: [activeSourceId],
        },
        {
          // ✅ Option A : auto-draft ne touche pas currentId
          selectAfterCreate: false,
          refreshAfterCreate: true,
        },
      );

      // comme on vient de persister ce texte, on n’est pas dirty à cet instant
      setEditorValue(v1.content ?? '');
      setDirtyState('clean');

      autoDraftDoneRef.current = true;
      toast.info("Brouillon v1 créé automatiquement", { duration: 2500 });
    } catch (e) {
      console.error(e);
      // si ça échoue, on laisse l’utilisateur taper quand même (isDirty restera true)
    } finally {
      autoDraftInFlightRef.current = false;
    }
  };

  // -----------------------------
  // Editor changes
  // -----------------------------
  const onChangeEditor = (next: string) => {
    setEditorValue(next);
    setDirtyState('editing');

    // ✅ Auto-brouillon : seulement après une pause de frappe (debounce)
    // Conditions de base : source active + pas encore de version pour cette source + pas déjà fait
    if (!activeSourceId) return;
    if (workingVersion) return;
    if (autoDraftDoneRef.current || autoDraftInFlightRef.current) return;

    // Reset du timer à chaque frappe/collage
    if (autoDraftDebounceTimer.current !== null) {
      window.clearTimeout(autoDraftDebounceTimer.current);
    }

    // Après une courte pause, si le texte contient quelque chose de "utile", on crée la v1 draft
    autoDraftDebounceTimer.current = window.setTimeout(() => {
      void autoStartDraftIfNeeded(next);
    }, 800);
  };

  const jumpToRange = (start: number, end: number) => {
    const el = textareaRef.current;
    if (!el) return;
    setTextMode('edit');
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, end);
      setSelection({ start, end });
    });
  };

  const insertPageBreak = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? editorValue.length;
    const end = el.selectionEnd ?? editorValue.length;

    const toInsert = `${start > 0 && !/\n$/.test(editorValue.slice(0, start)) ? '\n' : ''}${PAGE_BREAK_TOKEN}\n`;
    const next = insertAtSelection(editorValue, start, end, toInsert);

    setEditorValue(next);
    setDirtyState('editing');

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + toInsert.length;
      el.setSelectionRange(pos, pos);
      setSelection(null);
    });

    toast('Saut de page inséré', { icon: '📄' });
  };

  function getSelectionFromTextarea() {
    const ta = textareaRef.current;
    if (!ta) {
      const len = (editorValue ?? '').length;
      return { start: len, end: len };
    }
    const start = ta.selectionStart ?? (editorValue ?? '').length;
    const end = ta.selectionEnd ?? start;
    return { start, end };
  }

  /**
   * Wrap la sélection avec left/right.
   * - Si sélection vide: insère left+right et place le curseur au milieu.
   * - Si sélection non vide: entoure le texte sélectionné.
   */
  function wrapSelection(left: string, right = left) {
    const ta = textareaRef.current;
    const sel = getSelectionFromTextarea();

    const raw = editorValue ?? '';
    const start = sel.start;
    const end = sel.end;

    // (optionnel mais recommandé) : si on est dans un token illisible, avertir
    if (!confirmIfIllisibleMayBreak({ start, end })) return;

    if (start === end) {
      const insert = left + right;
      const next = insertAtSelection(raw, start, end, insert);
      onChangeEditor(next);

      requestAnimationFrame(() => {
        try {
          ta?.focus();
          const pos = start + left.length;
          ta?.setSelectionRange(pos, pos);
        } catch {}
      });
      return;
    }

    const selected = raw.slice(start, end);
    const next = raw.slice(0, start) + left + selected + right + raw.slice(end);
    onChangeEditor(next);

    requestAnimationFrame(() => {
      try {
        ta?.focus();
        // on garde la sélection sur le texte initial
        const newStart = start + left.length;
        const newEnd = end + left.length;
        ta?.setSelectionRange(newStart, newEnd);
      } catch {}
    });
  }

  function wrapStrike() {
    // ⚠️ Tu avais défini ta convention comme ~texte~
    // Si tu veux vraiment ~~texte~~, remplace "~" par "~~" ci-dessous.
    wrapSelection('~');
  }

  function wrapBold() {
    // convention demandée : *texte*
    wrapSelection('*');
  }

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) {
      // fallback
      onChangeEditor((editorValue ?? '') + text);
      return;
    }

    const start = ta.selectionStart ?? (editorValue ?? '').length;
    const end = ta.selectionEnd ?? start;

    const before = (editorValue ?? '').slice(0, start);
    const after = (editorValue ?? '').slice(end);

    const next = `${before}${text}${after}`;
    onChangeEditor(next);

    // remettre le curseur après insertion
    requestAnimationFrame(() => {
      try {
        ta.focus();
        const pos = start + text.length;
        ta.setSelectionRange(pos, pos);
      } catch {}
    });
  }

  function insertToken(token: string) {
    // tu peux ajuster les espaces si tu veux un format strict
    insertAtCursor(token);
  }

  function getCurrentSelectionOrCursor() {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? (editorValue ?? '').length;
    const end = el?.selectionEnd ?? start;
    return { start, end };
  }

  function willBreakIllisibleFormatIfInsertHere(sel: { start: number; end: number }) {
    const raw = editorValue ?? '';

    // Si on est dans une zone "suspecte" [ILLISIBLE...], on avertit
    const suspect = findIllisibleSuspectRanges(raw);
    if (isInsideAnyRange(sel, suspect)) {
      return true;
    }

    // Si on est dans un token valide (ex: curseur au milieu), on avertit aussi
    const valid = findIllisibleValidRanges(raw);
    if (isInsideAnyRange(sel, valid)) {
      return true;
    }

    return false;
  }

  function confirmIfIllisibleMayBreak(sel: { start: number; end: number }) {
    if (!willBreakIllisibleFormatIfInsertHere(sel)) return true;

    const msg =
      'Tu es en train d’écrire à l’intérieur d’un token [ILLISIBLE…]. ' +
      'Ça risque de casser son format et l’affichage en mode Lecture.\n\n' +
      'Continuer quand même ?';
    return window.confirm(msg);
  }

  function openIllisibleDialog() {
    const sel = getCurrentSelectionOrCursor();
    if (!confirmIfIllisibleMayBreak(sel)) return;

    // defaults “sympas”
    setIllisibleX(0);
    setIllisibleY(1);
    setIllisibleZ(0);
    setIllisibleOpen(true);
  }

  function confirmInsertIllisible() {
    const token = buildIllisibleToken(illisibleX, illisibleY, illisibleZ);
    insertAtCursor(token);
    setIllisibleOpen(false);
    toast('Token illisible inséré', { icon: '🕳️' });
  }

  // -----------------------------
  // Anchors auto-revalidation (debounced)
  // -----------------------------
  useEffect(() => {
    if (!currentVersion) return;
    if (!annotations.length) return;

    if (anchorRevalidateTimer.current !== null) {
      window.clearTimeout(anchorRevalidateTimer.current);
    }

    anchorRevalidateTimer.current = window.setTimeout(async () => {
      const nextOverrides: Record<string, AnchorStatus> = {};
      const changed: Array<{ id: string; status: AnchorStatus }> = [];

      for (const a of annotations) {
        const newStatus = revalidateAnchor(editorValue, a);
        const effectiveNow = anchorStatusOverrides[a.id] ?? a.status;
        nextOverrides[a.id] = newStatus;
        if (newStatus !== effectiveNow) changed.push({ id: a.id, status: newStatus });
      }

      setAnchorStatusOverrides(nextOverrides);

      if (changed.length) {
        await persistAnnotationStatuses(changed);
        setAnnotations((prev) =>
          prev.map((a) => (nextOverrides[a.id] ? { ...a, status: nextOverrides[a.id] } : a)),
        );
      }
    }, 700);

    return () => {
      if (anchorRevalidateTimer.current !== null)
        window.clearTimeout(anchorRevalidateTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorValue, currentId]);

  // -----------------------------
  // ✅ Sources-first actions
  // -----------------------------
  const selectSource = (sourceId: string) => {
    setActiveSourceId(sourceId);
    const latest = getLatestVersionIdForSource(sourceId);
    void onActiveSourceChanged(sourceId, latest);
  };

  const onActiveSourceChanged = async (sourceId: string, latestVersionId: string | null) => {
    const nextWorking = latestVersionId ?? getLatestVersionIdForSource(sourceId, activePart);
    setWorkingVersionId(nextWorking);

    autoDraftDoneRef.current = false;
    autoDraftInFlightRef.current = false;
    if (autoDraftDebounceTimer.current !== null) {
      window.clearTimeout(autoDraftDebounceTimer.current);
      autoDraftDebounceTimer.current = null;
    }

    if (nextWorking) {
      setCurrentId(nextWorking); // déclenche load children + reset editor
      return;
    }

    // Pas de transcription liée à cette source
    setCurrentId(null);
    setEditorValue('');
    setDirtyState('clean');
    setSelection(null);
    setAnnotations([]);
    setNotes([]);
    setTags([]);
    setAnchorStatusOverrides({});
  };

  const startTranscriptionForActiveSource = async (): Promise<TranscriptionVersionRow | null> => {
    if (!activeSourceId) return null;

    const existing = getLatestVersionIdForSource(activeSourceId);
    if (existing) {
      toast('Cette source a déjà une transcription active.', { icon: '✅' });
      setWorkingVersionId(existing);
      setCurrentId(existing);
      return versions.find((v) => v.id === existing) ?? null;
    }

    const newV = await createNewVersion({
      status: (editorValue ?? '').trim() ? 'IN_PROGRESS' : 'DRAFT',
      content: '',
      transcription_kind: 'travail',
      confidence: 'low',
      sourceIds: [activeSourceId],
    });

    toast('Brouillon créé pour la source active', { icon: '📝' });
    return newV;
  };

  const normalizeContentForCompare = (s: string) => (s ?? '').replace(/\r\n/g, '\n').trim();

  const saveNewVersionForActiveSource = async () => {
    if (!activeSourceId) return;

    setDirtyState('saving');

    try {
      const base = workingVersion ?? currentVersion;
      const next = normalizeContentForCompare(editorValue ?? '');
      const prev = normalizeContentForCompare(base?.content ?? '');

      if (!base) {
        await createNewVersion({
          status: (editorValue ?? '').trim() ? 'IN_PROGRESS' : 'DRAFT',
          content: editorValue ?? '',
          transcription_kind: 'travail',
          confidence: 'low',
          sourceIds: [activeSourceId],
        });
        toast('Brouillon créé et enregistré', { icon: '📝' });
        flashSavedThenClean();
        return;
      }

      if (next === prev) {
        toast('Aucun changement : nouvelle version non créée.', { icon: '🟰' });
        setDirtyState('clean');
        return;
      }

      await createNewVersion({
        status: (editorValue ?? '').trim() ? 'IN_PROGRESS' : 'DRAFT',
        content: editorValue ?? '',
        transcription_kind: base?.transcription_kind ?? null,
        confidence: base?.confidence ?? null,
        sourceIds: [activeSourceId],
      });

      toast('Nouvelle version enregistrée (historique conservé)', { icon: '💾' });
      flashSavedThenClean();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Erreur lors de l’enregistrement');
      // si on était en saving, on revient à editing (l’utilisateur a des modifs)
      setDirtyState((prev) => (prev === 'saving' ? 'editing' : prev));
    }
  };

  // -----------------------------
  // Sheet openers
  // -----------------------------
  const openAddAnnotation = () => {
    const target = workingVersion ?? currentVersion;
    if (!target) return;
    if (!selection) return toast('Sélectionnez un passage dans le texte', { icon: '🖊️' });

    setEditingAnnotationId(null);
    setEditingNoteId(null);
    setSheetMode('annotation');
    setAnnoType('doubt');
    setAnnoComment('');
    setSheetOpen(true);
  };

  const openEditAnnotation = (a: AnnotationRow) => {
    setEditingAnnotationId(a.id);
    setEditingNoteId(null);
    setSheetMode('annotation');
    setAnnoType(a.type);
    setAnnoComment(a.comment ?? '');
    setSheetOpen(true);
  };

  const openAddNote = () => {
    const target = workingVersion ?? currentVersion;
    if (!target) return;
    setEditingAnnotationId(null);
    setEditingNoteId(null);
    setSheetMode('note');
    setNoteContent('');
    setSheetOpen(true);
  };

  const openEditNote = (n: NoteRow) => {
    setEditingAnnotationId(null);
    setEditingNoteId(n.id);
    setSheetMode('note');
    setNoteContent(n.content ?? '');
    setSheetOpen(true);
  };

  const openTagPassage = () => {
    const target = workingVersion ?? currentVersion;
    if (!target) return;
    if (!selection) return toast('Sélectionnez un passage à tagger', { icon: '🏷️' });

    setEditingAnnotationId(null);
    setEditingNoteId(null);
    setSheetMode('tag');
    setTagKind('date');
    setTagLabel('');
    setTagActeurId('');
    setSheetOpen(true);
  };

  const onChangeTagKind = (k: TranscriptionTagRow['kind']) => {
    setTagKind(k);
    setTagActeurId('');
  };

  // -----------------------------
  // Persist actions: annotation / note / tag
  // -----------------------------
  const submitAnnotation = async () => {
    const target = workingVersion ?? currentVersion;
    if (!target || !selection) return;

    try {
      if (editingAnnotationId) {
        const updated = await updateAnnotation(editingAnnotationId, {
          type: annoType,
          comment: annoComment.trim() || null,
        });
        setAnnotations((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        toast.success('Annotation modifiée');
        setSheetOpen(false);
        return;
      }

      const { quote, prefix, suffix } = computeAnchor(editorValue, selection.start, selection.end);
      const row = await insertAnnotation({
        transcription_version_id: target.id,
        type: annoType,
        start_offset: selection.start,
        end_offset: selection.end,
        quote,
        prefix,
        suffix,
        status: 'ok',
        comment: annoComment.trim() || null,
      } as any);

      setAnnotations((prev) => [...prev, row]);
      toast.success('Annotation ajoutée');
      setSheetOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de l’enregistrement de l’annotation');
    }
  };

  const submitNote = async () => {
    const target = workingVersion ?? currentVersion;
    if (!target) return;

    const content = noteContent.trim();
    if (!content) return toast('Écrivez une note', { icon: '📝' });

    const anchored = selection
      ? computeAnchor(editorValue, selection.start, selection.end)
      : { quote: null, prefix: null, suffix: null };

    try {
      if (editingNoteId) {
        const updated = await updateNote(editingNoteId, { content });
        setNotes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        toast.success('Note modifiée');
        setSheetOpen(false);
        return;
      }

      const row = await insertNote({
        transcription_version_id: target.id,
        start_offset: selection ? selection.start : null,
        end_offset: selection ? selection.end : null,
        quote: selection ? anchored.quote : null,
        prefix: selection ? anchored.prefix : null,
        suffix: selection ? anchored.suffix : null,
        content,
      } as any);

      setNotes((prev) => [...prev, row]);
      toast.success('Note ajoutée');
      setSheetOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de l’enregistrement de la note');
    }
  };

  const submitTag = async () => {
    const target = workingVersion ?? currentVersion;
    if (!target || !selection) return;

    try {
      const { quote, prefix, suffix } = computeAnchor(editorValue, selection.start, selection.end);
      const cleanLabel = tagLabel.trim() || quote?.trim() || '';
      if (!cleanLabel) return toast('Renseigne un libellé', { icon: '🏷️' });

      const acteurId = tagKind === 'acteur' ? tagActeurId || null : null;
      if (tagKind === 'acteur' && !acteurId) return toast('Choisis un acteur', { icon: '👤' });

      const row = await createTag({
        transcription_version_id: target.id,
        kind: tagKind,
        label: cleanLabel,
        start_offset: selection.start,
        end_offset: selection.end,
        quote,
        prefix,
        suffix,
        linked_acteur_id: acteurId,
      });

      setTags((prev) => [...prev, row]);
      toast.success('Tag ajouté');
      setSheetOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de l’ajout du tag');
    }
  };

  const removeAnnotation = async (id: string) => {
    try {
      await deleteAnnotation(id);
      setAnnotations((prev) => prev.filter((x) => x.id !== id));
      toast.success('Annotation supprimée');
    } catch (e) {
      console.error(e);
      toast.error('Suppression impossible');
    }
  };

  const removeNote = async (id: string) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((x) => x.id !== id));
      toast.success('Note supprimée');
    } catch (e) {
      console.error(e);
      toast.error('Suppression impossible');
    }
  };

  const removeTag = async (id: string) => {
    try {
      await deleteTag(id);
      setTags((prev) => prev.filter((x) => x.id !== id));
      toast.success('Tag supprimé');
    } catch (e) {
      console.error(e);
      toast.error('Suppression impossible');
    }
  };

  // -----------------------------
  // API surface
  // -----------------------------
  return {
    // state
    loading,
    setLoading,
    acte,
    versions,
    currentId,
    currentVersion,

    // sources-first
    activeSourceId,
    preferredSourceId,
    workingVersion,

    // editor + children
    editorValue,
    dirtyState,
    dirtyLabel: dirtyLabel(dirtyState),
    textMode,
    annotations,
    notes,
    tags,
    acteurs,
    selection,
    textareaRef,

    // drafts
    annoType,
    annoComment,
    noteContent,
    tagKind,
    tagLabel,
    tagActeurId,
    editingAnnotationId,
    editingNoteId,

    // compare
    compareLeftId,
    compareRightId,
    setCompareLeftId,
    setCompareRightId,
    compareReasonDraft,
    setCompareReasonDraft,

    // computed
    nextVersionNumber,
    groupedAnnotations,
    anchorStatusOverrides,

    // actions: versions
    setCurrentId,
    setTextMode,
    captureSelection,
    onChangeEditor,
    jumpToRange,
    insertPageBreak,
    insertToken,
    illisibleOpen,
    setIllisibleOpen,
    illisibleX,
    setIllisibleX,
    illisibleY,
    setIllisibleY,
    illisibleZ,
    setIllisibleZ,
    openIllisibleDialog,
    confirmInsertIllisible,
    wrapStrike,
    wrapBold,

    saveWorkflowMetadata,

    setInReview,
    markAsTranscribed,

    // ✅ sources-first actions
    selectSource,
    onActiveSourceChanged,
    startTranscriptionForActiveSource,
    saveNewVersionForActiveSource,

    versionEvents,

    // annotations / notes / tags
    openAddAnnotation,
    openEditAnnotation,
    openAddNote,
    openEditNote,
    openTagPassage,
    onChangeTagKind,

    setAnnoType,
    setAnnoComment,
    setNoteContent,
    setTagLabel,
    setTagActeurId,

    submitAnnotation,
    submitNote,
    submitTag,

    removeAnnotation,
    removeNote,
    removeTag,

    getLatestVersionIdForSource,
    latestVersionIdByKey,
    transcriptionByKey,

    isEditableStatus,
    shouldDefaultToReadMode,

    refreshVersionsAndSelect,
  };
}
