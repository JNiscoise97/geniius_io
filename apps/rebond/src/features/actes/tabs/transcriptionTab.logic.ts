// transcriptionTab.logic.ts

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
  type CitationDraft,
  type ActeCitationRow,
  type ExemplairePick,
  type TranscriptionRow,
  createNewVersionForSource,
  updateTranscription,
  setTranscriptionReference,
  clearTranscriptionReference,
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
  type EcMarginalCrossoutRow,
  type EcSignatureRow,
  type EcMarginalMentionRow,
} from './transcriptionTab.service';
import { supabase } from '@/lib/supabase';

type SheetMode =
  | 'annotation'
  | 'note'
  | 'compare'
  | 'tag'
  | 'reference'
  | 'marginal_mentions'
  | 'signatures'
  | 'marginal_crossouts';

type Props = { acteId: string };

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

type SplitState = { leftPct: number };
const SPLIT_LS_KEY = 'rebond.transcription.split';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function emptyCitation(acteId: string): CitationDraft {
  return {
    id: 'tmp-' + crypto.randomUUID(),
    acte_id: acteId,
    exemplaire_id: null,
    vues_start: null,
    vues_end: null,
    vues_raw: null,
    page_start: null,
    page_end: null,
    page_raw: null,
    acte_manquant: false,
    note: null,
    sort_order: 0,
    marginal_mentions_present: null,
    marginal_mentions_count: null,
    signatures_present: null,
    signatures_count: null,
    marginal_crossouts_present: null,
    marginal_crossouts_count: null,
    exemplaire: null,
  };
}

function normalizeCitationRow(r: ActeCitationRow): CitationDraft {
  return {
    id: r.id,
    acte_id: r.acte_id,
    exemplaire_id: r.exemplaire_id,
    vues_start: r.vues_start,
    vues_end: r.vues_end,
    vues_raw: r.vues_raw,
    page_start: r.page_start,
    page_end: r.page_end,
    page_raw: r.page_raw,
    acte_manquant: Boolean(r.acte_manquant),
    note: r.note,
    sort_order: r.sort_order,
    marginal_mentions_present: r.marginal_mentions_present,
    marginal_mentions_count: r.marginal_mentions_count,
    signatures_present: r.signatures_present,
    signatures_count: r.signatures_count,
    marginal_crossouts_present: r.marginal_crossouts_present,
    marginal_crossouts_count: r.marginal_crossouts_count,
    exemplaire: null,
  };
}

function bestPickPerExemplaire(picks: any[]): Map<string, ExemplairePick> {
  const bestByManId = new Map<string, ExemplairePick>();

  for (const r of picks) {
    const candidate: ExemplairePick = {
      exemplaire_id: r.exemplaire_id,
      nature_id: r.nature_id ?? null,
      unite_id: r.unite_id ?? null,
      unite_titre: r.unite_titre ?? null,
      cote_locale: r.cote_locale ?? null,
      pagination_type: r.pagination_type ?? null,
      depot_nom: r.depot_nom ?? null,
      depot_is_online: r.depot_is_online ?? null,
      depot_is_physical: r.depot_is_physical ?? null,
      institution_nom: r.institution_nom ?? null,
      institution_sigle: r.institution_sigle ?? null,
      url_base: r.url_base ?? null,
      plateforme_code: r.plateforme_code ?? null,
    };

    const current = bestByManId.get(candidate.exemplaire_id);
    if (!current) {
      bestByManId.set(candidate.exemplaire_id, candidate);
      continue;
    }

    // règle: préférer une ligne avec url_base si possible
    const curHasUrl = Boolean((current.url_base ?? '').trim());
    const candHasUrl = Boolean((candidate.url_base ?? '').trim());

    if (!curHasUrl && candHasUrl) {
      bestByManId.set(candidate.exemplaire_id, candidate);
    }
  }

  return bestByManId;
}

export function useActeCitationsSources(acteId: string) {
  const [sources, setSources] = useState<CitationDraft[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoadingSources(true);
      setErrorMsg(null);

      // 1) load raw citations
      const { data, error } = await supabase
        .from('etat_civil_acte_citations')
        .select(
          'id, acte_id, exemplaire_id, vues_start, vues_end, vues_raw, page_start, page_end, page_raw, acte_manquant, note, sort_order, marginal_mentions_present,marginal_mentions_count, signatures_present, signatures_count, marginal_crossouts_present, marginal_crossouts_count',
        )
        .eq('acte_id', acteId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        setErrorMsg(error.message);
        setSources([emptyCitation(acteId)]);
        setLoadingSources(false);
        return;
      }

      const rows = (data ?? []) as ActeCitationRow[];
      const drafts = rows.map((r) => normalizeCitationRow(r));

      if (!drafts.length) {
        setSources([emptyCitation(acteId)]);
        setLoadingSources(false);
        return;
      }

      // 2) enrich from view
      const manIds = Array.from(
        new Set(drafts.map((d) => d.exemplaire_id).filter(Boolean) as string[]),
      );

      if (!manIds.length) {
        setSources(drafts);
        setLoadingSources(false);
        return;
      }

      const { data: pickData, error: pickErr } = await supabase
        .from('v_exemplaires_pick')
        .select(
          'exemplaire_id,nature_id,unite_id,unite_titre,cote_locale,pagination_type,depot_nom,depot_is_online,depot_is_physical,institution_nom,institution_sigle,url_base,plateforme_code',
        )
        .in('exemplaire_id', manIds);

      if (cancelled) return;

      if (pickErr) {
        setSources(drafts);
        setLoadingSources(false);
        return;
      }

      const bestByManId = bestPickPerExemplaire(pickData ?? []);

      const enriched = drafts.map((d) => {
        const e = d.exemplaire_id ? bestByManId.get(d.exemplaire_id) : null;
        if (!e) return d;

        return {
          ...d,
          exemplaire: {
            nature_id: e.nature_id,
            unite_titre: e.unite_titre,
            cote_locale: e.cote_locale,
            pagination_type: e.pagination_type,
            depot_nom: e.depot_nom,
            depot_is_online: e.depot_is_online,
            depot_is_physical: e.depot_is_physical,
            institution_nom: e.institution_nom,
            institution_sigle: e.institution_sigle,
            url_base: e.url_base,
            plateforme_code: e.plateforme_code,
          },
        } satisfies CitationDraft;
      });

      setSources(enriched);
      setLoadingSources(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [acteId]);

  return { sources, setSources, loadingSources, errorMsg };
}

export function useTranscriptionTab({ acteId }: Props) {
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

  // Sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>('annotation');

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

  const [referenceTargetSourceId, setReferenceTargetSourceId] = useState<string | null>(null);

  type RefReasonKey = 'best_legibility' | 'most_complete' | 'best_match' | 'other';
  const [refReason, setRefReason] = useState<RefReasonKey | ''>('');
  const [refComment, setRefComment] = useState('');

  const [referenceMode, setReferenceMode] = useState<'set' | 'edit'>('set');

  // snapshot initial (pour Annuler modifs)
  const [refInitial, setRefInitial] = useState<{ reason: RefReasonKey | ''; comment: string }>({
    reason: '',
    comment: '',
  });

  // =====================================================
  // Parts CRUD (Mentions marginales / Signatures / Ratures)
  // =====================================================

  // ✅ on rattache les lignes à : acte_id + transcription_version_id + (option) acte_source_id
  const currentPartActeSourceId = (activeSourceId as string | null) ?? null;
  const currentPartVersionId = (workingVersion?.id as string | null) ?? null;

  // -----------------------------
  // List state
  // -----------------------------
  const [marginalMentions, setMarginalMentions] = useState<EcMarginalMentionRow[]>([]);
  const [signatures, setSignatures] = useState<EcSignatureRow[]>([]);
  const [marginalCrossouts, setMarginalCrossouts] = useState<EcMarginalCrossoutRow[]>([]);

  type SigFormMode = 'idle' | 'create' | 'edit';
  const [sigFormMode, setSigFormMode] = useState<SigFormMode>('idle');

  type MmFormMode = 'idle' | 'create' | 'edit';
  const [mmFormMode, setMmFormMode] = useState<MmFormMode>('idle');

  // -----------------------------
  // Editing ids
  // -----------------------------
  const [editingMarginalMentionId, setEditingMarginalMentionId] = useState<string | null>(null);
  const [editingSignatureId, setEditingSignatureId] = useState<string | null>(null);
  const [editingMarginalCrossoutId, setEditingMarginalCrossoutId] = useState<string | null>(null);

  // -----------------------------
  // Form state - Mentions marginales
  // -----------------------------
  const [mmTypeActeRef, setMmTypeActeRef] = useState<string | null>(null);
  const [mmTypeActeLabel, setMmTypeActeLabel] = useState<string | null>(null);
  const [mmTypeActeColor, setMmTypeActeColor] = useState<string | null>(null);

  const [mmConfidenceRef, setMmConfidenceRef] = useState<string | null>(null);
  const [mmConfidenceLabel, setMmConfidenceLabel] = useState<string | null>(null);

  const [mmLegibilityRef, setMmLegibilityRef] = useState<string | null>(null);
  const [mmLegibilityLabel, setMmLegibilityLabel] = useState<string | null>(null);

  const [mmHandwritingStyleRef, setMmHandwritingStyleRef] = useState<string | null>(null);
  const [mmHandwritingStyleLabel, setMmHandwritingStyleLabel] = useState<string | null>(null);

  const [mmHandwritingLegibilityRef, setMmHandwritingLegibilityRef] = useState<string | null>(null);
  const [mmHandwritingLegibilityLabel, setMmHandwritingLegibilityLabel] = useState<string | null>(null);

  const [mmDateRaw, setMmDateRaw] = useState<string>('');
  const [mmDate, setMmDate] = useState<string>(''); // YYYY-MM-DD
  const [mmContent, setMmContent] = useState<string>('');
  const [mmNote, setMmNote] = useState<string>('');

  // -----------------------------
  // Form state - Signatures
  // -----------------------------
  const [sigLabel, setSigLabel] = useState<string>('');
  const [sigKind, setSigKind] = useState<string>('');
  const [sigConfidence, setSigConfidence] = useState<string>('');
  const [sigLegibility, setSigLegibility] = useState<string>('');
  const [sigHandwritingLegibilityRef, setSigHandwritingLegibilityRef] = useState<string | null>(null);
  const [sigHandwritingLegibilityLabel, setSigHandwritingLegibilityLabel] = useState<string | null>(null);
  const [sigPatternRaw, setSigPatternRaw] = useState<string>(''); // "A;B;C" stocké en text
  const [sigNote, setSigNote] = useState<string>('');

  // -----------------------------
  // Form state - Ratures marginales
  // -----------------------------
  const [mcType, setMcType] = useState<string>('');
  const [mcTarget, setMcTarget] = useState<string>('');
  const [mcStruck, setMcStruck] = useState<string>('');
  const [mcReplacement, setMcReplacement] = useState<string>('');
  const [mcNote, setMcNote] = useState<string>('');

  // -----------------------------
  // Helpers reset
  // -----------------------------
  function resetMarginalMentionForm() {
    setEditingMarginalMentionId(null);
    setMmConfidenceRef(null);
    setMmConfidenceLabel(null);

    setMmLegibilityRef(null);
    setMmLegibilityLabel(null);

    setMmHandwritingStyleRef(null);
    setMmHandwritingStyleLabel(null);

    setMmHandwritingLegibilityRef(null);
    setMmHandwritingLegibilityLabel(null);

    setMmTypeActeRef(null);
    setMmDateRaw('');
    setMmDate('');
    setMmContent('');
    setMmNote('');
  }

  function cancelMarginalMentionForm() {
    resetMarginalMentionForm();
    setMmFormMode('idle');
  }

  function resetSignatureDraft() {
    setEditingSignatureId(null);
    setSigHandwritingLegibilityRef(null);
    setSigHandwritingLegibilityLabel(null);
    setSigLabel('');
    setSigKind('');
    setSigConfidence('');
    setSigLegibility('');
    setSigPatternRaw('');
    setSigNote('');
  }

  function cancelSignatureForm() {
    resetSignatureDraft();
    setSigFormMode('idle');
  }

  function resetMarginalCrossoutForm() {
    setEditingMarginalCrossoutId(null);
    setMcType('');
    setMcTarget('');
    setMcStruck('');
    setMcReplacement('');
    setMcNote('');
  }

  // -----------------------------
  // Loaders
  // -----------------------------
  async function loadMarginalMentions(params: { acteId: string; transcriptionVersionId: string }) {
    const { acteId, transcriptionVersionId } = params;

    let q = supabase
      .from('ec_transcription_marginal_mentions')
      .select(
        `
  id, acte_id, acte_source_id, transcription_id, transcription_version_id,
  type_acte_ref, mention_date_raw, mention_date, mention_content, note,

  confidence_ref,
  legibility_ref,
  handwriting_style_ref,
  handwriting_legibility_ref,

  ref_ec_type_acte: type_acte_ref ( id, label, color ),

  ref_confiance: confidence_ref ( id, label ),
  ref_legibilite: legibility_ref ( id, label ),
  ref_handwriting_style: handwriting_style_ref ( id, label ),
  ref_handwriting_legibility: handwriting_legibility_ref ( id, label )
`,
      )

      .eq('acte_id', acteId)
      .eq('transcription_version_id', transcriptionVersionId)
      .order('created_at', { ascending: true });

    if (currentPartActeSourceId) q = q.eq('acte_source_id', currentPartActeSourceId);
    const res = await q;

    if (res.error) return { data: null, error: res.error };

    const rows: EcMarginalMentionRow[] = (res.data ?? []).map((row: any) => ({
      ...row,

      type_acte_label: row.ref_ec_type_acte?.label ?? null,
      type_acte_color: row.ref_ec_type_acte?.color ?? null,

      confidence_label: row.ref_confiance?.label ?? null,
      legibility_label: row.ref_legibilite?.label ?? null,
      handwriting_style_label: row.ref_handwriting_style?.label ?? null,
      handwriting_legibility_label: row.ref_handwriting_legibility?.label ?? null,
    }));

    return { data: rows, error: null };
  }

  function loadMarginalMentionsCurrent() {
    if (!currentPartVersionId) {
      setMarginalMentions([]);
      return Promise.resolve();
    }
    return loadMarginalMentions({
      acteId,
      transcriptionVersionId: currentPartVersionId,
    }).then(({ data, error }) => {
      if (error) {
        console.error(error);
        setMarginalMentions([]);
        return;
      }
      setMarginalMentions(data ?? []);
    });
  }

  async function loadSignatures() {
    if (!currentPartVersionId) {
      setSignatures([]);
      return;
    }

    const q = supabase
      .from('ec_transcription_signatures')
      .select('*')
      .eq('acte_id', acteId)
      .eq('transcription_version_id', currentPartVersionId)
      .order('created_at', { ascending: true });

    const res = currentPartActeSourceId
      ? await q.eq('acte_source_id', currentPartActeSourceId)
      : await q;
    if (res.error) {
      console.error(res.error);
      setSignatures([]);
      return;
    }
    setSignatures((res.data ?? []) as any);
  }

  async function loadMarginalCrossouts() {
    if (!currentPartVersionId) {
      setMarginalCrossouts([]);
      return;
    }

    const q = supabase
      .from('ec_transcription_marginal_crossouts')
      .select('*')
      .eq('acte_id', acteId)
      .eq('transcription_version_id', currentPartVersionId)
      .order('created_at', { ascending: true });

    const res = currentPartActeSourceId
      ? await q.eq('acte_source_id', currentPartActeSourceId)
      : await q;
    if (res.error) {
      console.error(res.error);
      setMarginalCrossouts([]);
      return;
    }
    setMarginalCrossouts((res.data ?? []) as any);
  }

  // Auto-reload quand on change de version / source
  useEffect(() => {
    // éviter de garder un form ouvert sur une autre version/source
    setSigFormMode('idle');
    setEditingSignatureId(null);

    setMmFormMode('idle');
    setEditingMarginalMentionId(null);

    // (optionnel mais cohérent) idem ratures si tu veux:
    // setEditingMarginalCrossoutId(null);

    void loadMarginalMentionsCurrent();
    void loadSignatures();
    void loadMarginalCrossouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acteId, currentPartVersionId, currentPartActeSourceId]);

  // -----------------------------
  // OPEN / EDIT / CANCEL
  // -----------------------------
  function startCreateMarginalMention() {
    resetMarginalMentionForm();
    setMmFormMode('create');
  }

  function startEditMarginalMention(row: EcMarginalMentionRow) {
    setEditingMarginalMentionId(row.id);

    setMmTypeActeRef(row.type_acte_ref ?? null);

    // ✅ IMPORTANT : alimenter la chip au chargement
    setMmTypeActeLabel(row.type_acte_label ?? null);
    setMmTypeActeColor(row.type_acte_color ?? null);

    setMmConfidenceRef(row.confidence_ref ?? null);
    setMmConfidenceLabel(row.confidence_label ?? null);

    setMmLegibilityRef(row.legibility_ref ?? null);
    setMmLegibilityLabel(row.legibility_label ?? null);

    setMmHandwritingStyleRef(row.handwriting_style_ref ?? null);
    setMmHandwritingStyleLabel(row.handwriting_style_label ?? null);

    setMmHandwritingLegibilityRef(row.handwriting_legibility_ref ?? null);
    setMmHandwritingLegibilityLabel(row.handwriting_legibility_label ?? null);

    setMmDateRaw(row.mention_date_raw ?? '');
    setMmDate(row.mention_date ?? '');
    setMmContent(row.mention_content ?? '');
    setMmNote(row.note ?? '');
    setMmFormMode('edit');
  }

  function openEditMarginalMention(row: EcMarginalMentionRow) {
    startEditMarginalMention(row);
    setSheetMode('marginal_mentions');
    setSheetOpen(true);
  }

  function cancelMarginalMentionEdit() {
    cancelMarginalMentionForm();
  }

  function startCreateSignature() {
    resetSignatureDraft();
    setSigFormMode('create');
  }

  function startEditSignature(row: EcSignatureRow) {
    setEditingSignatureId(row.id);
    setSigLabel(row.label ?? '');
    setSigKind(row.signature_kind ?? '');
    setSigConfidence(row.confidence ?? '');
    setSigLegibility(row.legibility ?? '');
    setSigHandwritingLegibilityRef(row.handwriting_legibility_ref ?? null);
    setSigHandwritingLegibilityLabel(row.handwriting_legibility_label ?? null);
    setSigPatternRaw((row.pattern ?? '') as any);
    setSigNote(row.note ?? '');
    setSigFormMode('edit');
  }

  function openEditSignature(row: EcSignatureRow) {
    startEditSignature(row);
    setSheetMode('signatures');
    setSheetOpen(true);
  }

  function cancelSignatureEdit() {
    cancelSignatureForm();
  }

  function openEditMarginalCrossout(row: EcMarginalCrossoutRow) {
    setEditingMarginalCrossoutId(row.id);
    setMcType(row.crossout_type ?? '');
    setMcTarget(row.target ?? '');
    setMcStruck(row.struck_text ?? '');
    setMcReplacement(row.replacement_text ?? '');
    setMcNote(row.note ?? '');
    setSheetMode('marginal_crossouts');
    setSheetOpen(true);
  }

  function cancelMarginalCrossoutEdit() {
    resetMarginalCrossoutForm();
  }

  // -----------------------------
  // SAVE
  // -----------------------------
  async function saveMarginalMention() {
    if (!currentPartVersionId) return;

    const tr = activeSourceId
      ? await ensureTranscription(acteId, activeSourceId, 'main_body')
      : null;

    const payload = {
      acte_id: acteId,
      acte_source_id: currentPartActeSourceId,
      transcription_id: tr?.id ?? null,
      transcription_version_id: currentPartVersionId,

      type_acte_ref: (mmTypeActeRef || null) as string | null,
      confidence_ref: mmConfidenceRef,
      legibility_ref: mmLegibilityRef,
      handwriting_style_ref: mmHandwritingStyleRef,
      handwriting_legibility_ref: mmHandwritingLegibilityRef,

      mention_date_raw: (mmDateRaw || null) as string | null,
      mention_date: (mmDate || null) as string | null,
      mention_content: mmContent.trim(),
      note: (mmNote || null) as string | null,
    };

    if (!payload.mention_content) return;

    // ✅ Calque signatures : edit si editingId, sinon create
    if (mmFormMode === 'edit' && editingMarginalMentionId) {
      const res = await supabase
        .from('ec_transcription_marginal_mentions')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingMarginalMentionId)
        .select('*')
        .single();

      if (res.error) {
        console.error(res.error);
        return;
      }
    } else {
      const res = await supabase
        .from('ec_transcription_marginal_mentions')
        .insert(payload)
        .select('*')
        .single();

      if (res.error) {
        console.error(res.error);
        return;
      }
    }

    // ✅ Comme signatures
    cancelMarginalMentionForm();
    await loadMarginalMentionsCurrent();
  }

  async function saveSignature() {
    if (!currentPartVersionId) return;

    const tr = activeSourceId
      ? await ensureTranscription(acteId, activeSourceId, 'main_body')
      : null;

    const payload = {
      acte_id: acteId,
      acte_source_id: currentPartActeSourceId,
      transcription_id: tr?.id ?? null,
      transcription_version_id: currentPartVersionId,

      label: sigLabel.trim(),
      signature_kind: (sigKind || null) as string | null,
      confidence: (sigConfidence || null) as string | null,
      legibility: (sigLegibility || null) as string | null,
      handwriting_legibility_ref: sigHandwritingLegibilityRef,
      pattern: (sigPatternRaw || null) as string | null,
      note: (sigNote || null) as string | null,
    };

    if (!payload.label) return;

    if (editingSignatureId) {
      const res = await supabase
        .from('ec_transcription_signatures')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingSignatureId)
        .select('*')
        .single();

      if (res.error) {
        console.error(res.error);
        return;
      }
    } else {
      const res = await supabase
        .from('ec_transcription_signatures')
        .insert(payload)
        .select('*')
        .single();

      if (res.error) {
        console.error(res.error);
        return;
      }
    }

    cancelSignatureForm();
    await loadSignatures();
  }

  async function saveMarginalCrossout() {
    if (!currentPartVersionId) return;

    const tr = activeSourceId
      ? await ensureTranscription(acteId, activeSourceId, 'main_body')
      : null;

    const payload = {
      acte_id: acteId,
      acte_source_id: currentPartActeSourceId,
      transcription_id: tr?.id ?? null,
      transcription_version_id: currentPartVersionId,

      crossout_type: (mcType || null) as string | null,
      target: (mcTarget || null) as string | null,
      struck_text: (mcStruck || null) as string | null,
      replacement_text: (mcReplacement || null) as string | null,
      note: (mcNote || null) as string | null,
    };

    // au moins un champ
    const hasSomething =
      Boolean(payload.crossout_type?.trim()) ||
      Boolean(payload.target?.trim()) ||
      Boolean(payload.struck_text?.trim()) ||
      Boolean(payload.replacement_text?.trim()) ||
      Boolean(payload.note?.trim());

    if (!hasSomething) return;

    if (editingMarginalCrossoutId) {
      const res = await supabase
        .from('ec_transcription_marginal_crossouts')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingMarginalCrossoutId)
        .select('*')
        .single();

      if (res.error) {
        console.error(res.error);
        return;
      }
    } else {
      const res = await supabase
        .from('ec_transcription_marginal_crossouts')
        .insert(payload)
        .select('*')
        .single();

      if (res.error) {
        console.error(res.error);
        return;
      }
    }

    resetMarginalCrossoutForm();
    await loadMarginalCrossouts();
  }

  // -----------------------------
  // DELETE
  // -----------------------------
  async function deleteMarginalMention(id: string) {
    const res = await supabase.from('ec_transcription_marginal_mentions').delete().eq('id', id);
    if (res.error) {
      console.error(res.error);
      return;
    }
    if (editingMarginalMentionId === id) cancelMarginalMentionForm();
    await loadMarginalMentionsCurrent();
  }

  async function deleteSignature(id: string) {
    const res = await supabase.from('ec_transcription_signatures').delete().eq('id', id);
    if (res.error) {
      console.error(res.error);
      return;
    }
    if (editingSignatureId === id) cancelSignatureForm();

    await loadSignatures();
  }

  async function deleteMarginalCrossout(id: string) {
    const res = await supabase.from('ec_transcription_marginal_crossouts').delete().eq('id', id);
    if (res.error) {
      console.error(res.error);
      return;
    }
    if (editingMarginalCrossoutId === id) resetMarginalCrossoutForm();
    await loadMarginalCrossouts();
  }

  function buildPreferenceReasonStrict(key: RefReasonKey, detail: string) {
    const d = (detail ?? '').trim();

    const label =
      key === 'best_legibility'
        ? 'Meilleure lisibilité'
        : key === 'most_complete'
          ? 'Plus complète'
          : key === 'best_match'
            ? 'Correspond le mieux'
            : 'Autre';

    // On stocke un texte unique (simple et robuste)
    return `${label} — ${d}`;
  }
  // mêmes labels que buildPreferenceReasonStrict
  const REF_LABELS: Record<RefReasonKey, string> = {
    best_legibility: 'Meilleure lisibilité',
    most_complete: 'Plus complète',
    best_match: 'Correspond le mieux',
    other: 'Autre',
  };

  // parse "Label : detail" (ou "Label — detail") -> { key, detail }
  function parsePreferenceReasonStrict(reason: string | null | undefined): {
    key: RefReasonKey | '';
    detail: string;
  } {
    const raw = (reason ?? '').trim();
    if (!raw) return { key: '', detail: '' };

    // split sur " : " ou " — "
    const sep = raw.includes(' : ') ? ' : ' : raw.includes(' — ') ? ' — ' : null;
    if (!sep) return { key: '', detail: raw }; // fallback

    const [labelPart, ...rest] = raw.split(sep);
    const detail = rest.join(sep).trim();

    const label = labelPart.trim();
    const key =
      (Object.keys(REF_LABELS) as RefReasonKey[]).find((k) => REF_LABELS[k] === label) ?? '';

    return { key, detail };
  }

  const openSetReference = (sourceId: string) => {
    setReferenceMode('set');
    setReferenceTargetSourceId(sourceId);

    setRefReason('');
    setRefComment('');
    setRefInitial({ reason: '', comment: '' });

    setSheetMode('reference');
    setSheetOpen(true);
  };

  const openEditReference = (sourceId: string) => {
    setReferenceMode('edit');
    setReferenceTargetSourceId(sourceId);

    const tr = transcriptionByKey[transcriptionKey(sourceId, 'main_body')]; // pour référence

    const parsed = parsePreferenceReasonStrict(tr?.preference_reason);

    setRefReason(parsed.key);
    setRefComment(parsed.detail);
    setRefInitial({ reason: parsed.key, comment: parsed.detail });

    setSheetMode('reference');
    setSheetOpen(true);
  };

  const cancelSetReference = () => {
    // Annuler modifs en cours -> revenir au snapshot
    setRefReason(refInitial.reason);
    setRefComment(refInitial.comment);

    // et fermer (si tu préfères rester ouvert, supprime ces 2 lignes)
    setSheetOpen(false);
    setReferenceTargetSourceId(null);
    setReferenceMode('set');
    setRefInitial({ reason: '', comment: '' });
  };

  const saveReferenceEdits = async () => {
    if (!referenceTargetSourceId) return;

    const tr = transcriptionByKey[transcriptionKey(referenceTargetSourceId, 'main_body')];

    if (!tr?.id) {
      toast('Aucune transcription liée à cette source.', { icon: '⚠️' });
      return;
    }

    if (!refReason) {
      toast('Choisis une raison principale.', { icon: '⭐' });
      return;
    }
    if (!refComment.trim()) {
      toast('Ajoute un détail.', { icon: '✍️' });
      return;
    }

    setLoading(true);
    try {
      const reason = buildPreferenceReasonStrict(refReason as RefReasonKey, refComment);

      await setTranscriptionReference({
        transcriptionId: tr.id,
        preferenceReason: reason,
      });

      toast.success('Raison mise à jour');

      // snapshot devient la nouvelle base
      setRefInitial({ reason: refReason as RefReasonKey, comment: refComment });

      // option: fermer après save
      setSheetOpen(false);
      setReferenceTargetSourceId(null);
      setReferenceMode('set');
      setRefInitial({ reason: '', comment: '' });

      await refreshVersionsAndSelect(currentId ?? undefined);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Impossible de mettre à jour la raison');
    } finally {
      setLoading(false);
    }
  };

  const unsetReference = async (sourceId: string) => {
    const tr = transcriptionByKey[transcriptionKey(sourceId, 'main_body')];
    if (!tr?.id) {
      // si pas de transcription liée, techniquement pas de référence possible
      toast('Aucune transcription liée à cette source.', { icon: '⚠️' });
      return;
    }

    setLoading(true);
    try {
      await clearTranscriptionReference({ transcriptionId: tr.id });
      toast.success('Source de référence retirée');

      await refreshVersionsAndSelect(currentId ?? undefined);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Impossible de retirer la source de référence');
    } finally {
      setLoading(false);
    }
  };

  const clearCurrentReference = async () => {
    if (!referenceTargetSourceId) return;
    await unsetReference(referenceTargetSourceId);

    // fermer le sheet après retrait
    setSheetOpen(false);
    setReferenceTargetSourceId(null);
    setReferenceMode('set');
    setRefInitial({ reason: '', comment: '' });
  };

  const confirmSetReference = async () => {
    if (!referenceTargetSourceId) return;

    // ✅ Champs requis (ton workflow)
    if (!refReason) {
      toast('Choisis une raison principale.', { icon: '⭐' });
      return;
    }
    if (!refComment.trim()) {
      toast('Ajoute un détail.', { icon: '✍️' });
      return;
    }

    setLoading(true);
    try {
      // ✅ 1 transcription par source ; on la crée si besoin
      const tr = await ensureTranscription(acteId, referenceTargetSourceId);

      const reason = buildPreferenceReasonStrict(refReason as RefReasonKey, refComment);

      await setTranscriptionReference({
        transcriptionId: tr.id,
        preferenceReason: reason,
      });

      toast.success('Source définie comme référence');

      // ferme la sheet
      setSheetOpen(false);
      setReferenceTargetSourceId(null);
      setRefReason('');
      setRefComment('');

      // refresh pour mettre à jour preferredSourceId
      await refreshVersionsAndSelect(currentId ?? undefined);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Impossible de définir la source de référence');
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ C’est LA fonction que le bouton ⭐ doit appeler
   */
  const togglePreferred = async (sourceId: string) => {
    const isPreferredNow = preferredSourceId === sourceId;

    if (isPreferredNow) {
      // ✅ NOUVEAU : on ouvre en édition pré-remplie
      openEditReference(sourceId);
      return;
    }

    // inchangé : ouverture en “set”
    openSetReference(sourceId);
  };

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
  // Split pane (UI-only)
  // -----------------------------
  const [split, setSplit] = useState<SplitState>(() => {
    try {
      const raw = localStorage.getItem(SPLIT_LS_KEY);
      if (!raw) return { leftPct: 66 };
      const parsed = JSON.parse(raw);
      const pct = Number(parsed?.leftPct);
      if (!Number.isFinite(pct)) return { leftPct: 66 };
      return { leftPct: clamp(pct, 40, 80) };
    } catch {
      return { leftPct: 66 };
    }
  });

  const dragRef = useRef<{ dragging: boolean; startX: number; startPct: number } | null>(null);

  function setSplitPct(next: number) {
    const clamped = clamp(next, 40, 80);
    setSplit({ leftPct: clamped });
    try {
      localStorage.setItem(SPLIT_LS_KEY, JSON.stringify({ leftPct: clamped }));
    } catch {
      // ignore
    }
  }

  const splitApi = {
    leftPct: split.leftPct,
    onMouseDownDivider: (e: any) => {
      const container = document.getElementById('transcription-split-root');
      if (!container) return;

      dragRef.current = { dragging: true, startX: e.clientX, startPct: split.leftPct };
      const rect = container.getBoundingClientRect();

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current?.dragging) return;
        const dx = ev.clientX - dragRef.current.startX;
        const pctDelta = (dx / rect.width) * 100;
        setSplitPct(dragRef.current.startPct + pctDelta);
      };

      const onUp = () => {
        if (dragRef.current) dragRef.current.dragging = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
  };

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

  const { sources, loadingSources, errorMsg } = useActeCitationsSources(acteId);

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
        source_lecture_kind: meta.source_lecture_kind,
        scope: meta.scope,
        scope_details: meta.scope_details,
        langue_vue: meta.langue_vue,
        language_confidence: meta.language_confidence,
        handwriting_style: meta.handwriting_style,
        handwriting_legibility: meta.handwriting_legibility,
        goal: meta.goal,
        normalisation_policy,
        conventions_id: meta.conventions_id,
        conventions_override_text: meta.conventions_override_text,
        completeness: meta.completeness,
        incompleteness_reason: meta.incompleteness_reason,
        reserve_level: meta.reserve_level,
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
      setDirtyState((prev) => (prev === 'saving' ? 'clean' : prev));
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

    // sheet
    sheetOpen,
    sheetMode,
    setSheetOpen,
    setSheetMode,

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

    // split
    split: splitApi,

    sources,
    loadingSources,
    errorMsg,

    getLatestVersionIdForSource,
    latestVersionIdByKey,
    transcriptionByKey,

    togglePreferred,
    cancelSetReference,
    confirmSetReference,
    referenceMode,
    saveReferenceEdits,
    clearCurrentReference,
    openEditReference,
    openSetReference,
    referenceTargetSourceId,
    refReason,
    setRefReason,
    refComment,
    setRefComment,

    isEditableStatus,
    shouldDefaultToReadMode,

    marginalMentions,
    signatures,
    marginalCrossouts,
    // -----------------------------
    // Mentions marginales
    // -----------------------------
    // -----------------------------
    // Mentions marginales
    // -----------------------------
    mmFormMode,
    startCreateMarginalMention,
    startEditMarginalMention,
    cancelMarginalMentionForm,

    openAddMarginalMention: async () => {
      startCreateMarginalMention();
      setSheetMode('marginal_mentions');
      setSheetOpen(true);
    },
    openManageMarginalMentions: async () => {
      setSheetMode('marginal_mentions');
      setSheetOpen(true);
    },

    openEditMarginalMention,
    deleteMarginalMention,
    cancelMarginalMentionEdit,
    saveMarginalMention,

    mmTypeActeRef,
    setMmTypeActeRef,
    mmTypeActeLabel,
    setMmTypeActeLabel,
    mmTypeActeColor,
    setMmTypeActeColor,

    mmConfidenceRef,
    setMmConfidenceRef,
    mmConfidenceLabel,
    setMmConfidenceLabel,

    mmLegibilityRef,
    setMmLegibilityRef,
    mmLegibilityLabel,
    setMmLegibilityLabel,

    mmHandwritingStyleRef,
    setMmHandwritingStyleRef,
    mmHandwritingStyleLabel,
    setMmHandwritingStyleLabel,

    mmHandwritingLegibilityRef,
    setMmHandwritingLegibilityRef,
    mmHandwritingLegibilityLabel,
    setMmHandwritingLegibilityLabel,

    mmDateRaw,
    setMmDateRaw,
    mmDate,
    setMmDate,
    mmContent,
    setMmContent,
    mmNote,
    setMmNote,

    // -----------------------------
    // Signatures
    // -----------------------------
    sigFormMode,
    startCreateSignature,
    startEditSignature,
    cancelSignatureForm,

    openAddSignature: async () => {
      startCreateSignature();
      setSheetMode('signatures');
      setSheetOpen(true);
    },
    openManageSignatures: async () => {
      setSheetMode('signatures');
      setSheetOpen(true);
    },

    openEditSignature,
    deleteSignature,
    cancelSignatureEdit,
    saveSignature,

    sigLabel,
    setSigLabel,
    sigKind,
    setSigKind,
    sigConfidence,
    setSigConfidence,
    sigLegibility,
    setSigLegibility,
    sigHandwritingLegibilityRef,
    setSigHandwritingLegibilityRef,
    sigHandwritingLegibilityLabel,
    setSigHandwritingLegibilityLabel,
    sigPatternRaw,
    setSigPatternRaw,
    sigNote,
    setSigNote,

    // -----------------------------
    // Ratures marginales
    // -----------------------------
    openAddMarginalCrossout: async () => {
      resetMarginalCrossoutForm();
      setSheetMode('marginal_crossouts');
      setSheetOpen(true);
    },
    openManageMarginalCrossouts: async () => {
      setSheetMode('marginal_crossouts');
      setSheetOpen(true);
    },

    openEditMarginalCrossout,
    deleteMarginalCrossout,
    cancelMarginalCrossoutEdit,
    saveMarginalCrossout,

    mcType,
    setMcType,
    mcTarget,
    setMcTarget,
    mcStruck,
    setMcStruck,
    mcReplacement,
    setMcReplacement,
    mcNote,
    setMcNote,
  };
}
