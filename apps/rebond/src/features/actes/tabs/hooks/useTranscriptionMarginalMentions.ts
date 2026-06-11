// useTranscriptionMarginalMentions.ts
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ensureTranscription, type EcMarginalMentionRow } from '../transcriptionTab.service';

type MmFormMode = 'idle' | 'create' | 'edit';

export function useTranscriptionMarginalMentions(params: {
  acteId: string;
  activeSourceId: string | null;
  currentPartVersionId: string | null;
  currentPartActeSourceId: string | null;
  setSheetMode: (m: 'marginal_mentions') => void;
  setSheetOpen: (v: boolean) => void;
}) {
  const { acteId, activeSourceId, currentPartVersionId, currentPartActeSourceId, setSheetMode, setSheetOpen } =
    params;

  const [marginalMentions, setMarginalMentions] = useState<EcMarginalMentionRow[]>([]);

  const [mmFormMode, setMmFormMode] = useState<MmFormMode>('idle');
  const [editingMarginalMentionId, setEditingMarginalMentionId] = useState<string | null>(null);

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
  const [mmHandwritingLegibilityLabel, setMmHandwritingLegibilityLabel] = useState<string | null>(
    null,
  );

  const [mmDateRaw, setMmDateRaw] = useState<string>('');
  const [mmDate, setMmDate] = useState<string>(''); // YYYY-MM-DD
  const [mmContent, setMmContent] = useState<string>('');
  const [mmNote, setMmNote] = useState<string>('');

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

  // Auto-reload quand on change de version / source
  useEffect(() => {
    // éviter de garder un form ouvert sur une autre version/source
    setMmFormMode('idle');
    setEditingMarginalMentionId(null);

    void loadMarginalMentionsCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acteId, currentPartVersionId, currentPartActeSourceId]);

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
        toast.error(res.error.message ?? 'Erreur lors de l’enregistrement de la mention marginale');
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
        toast.error(res.error.message ?? 'Erreur lors de l’enregistrement de la mention marginale');
        return;
      }
    }

    // ✅ Comme signatures
    cancelMarginalMentionForm();
    await loadMarginalMentionsCurrent();
    toast.success('Mention marginale enregistrée');
  }

  async function deleteMarginalMention(id: string) {
    const res = await supabase.from('ec_transcription_marginal_mentions').delete().eq('id', id);
    if (res.error) {
      console.error(res.error);
      toast.error(res.error.message ?? 'Erreur lors de la suppression de la mention marginale');
      return;
    }
    if (editingMarginalMentionId === id) cancelMarginalMentionForm();
    await loadMarginalMentionsCurrent();
    toast.success('Mention marginale supprimée');
  }

  return {
    marginalMentions,

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
  };
}
