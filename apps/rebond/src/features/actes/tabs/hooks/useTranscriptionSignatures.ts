// useTranscriptionSignatures.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureTranscription, type EcSignatureRow } from '../transcriptionTab.service';

type SigFormMode = 'idle' | 'create' | 'edit';

export function useTranscriptionSignatures(params: {
  acteId: string;
  activeSourceId: string | null;
  currentPartVersionId: string | null;
  currentPartActeSourceId: string | null;
  setSheetMode: (m: 'signatures') => void;
  setSheetOpen: (v: boolean) => void;
}) {
  const { acteId, activeSourceId, currentPartVersionId, currentPartActeSourceId, setSheetMode, setSheetOpen } =
    params;

  const [signatures, setSignatures] = useState<EcSignatureRow[]>([]);

  const [sigFormMode, setSigFormMode] = useState<SigFormMode>('idle');
  const [editingSignatureId, setEditingSignatureId] = useState<string | null>(null);

  const [sigLabel, setSigLabel] = useState<string>('');

  const [sigKindRef, setSigKindRef] = useState<string | null>(null);
  const [sigKindLabel, setSigKindLabel] = useState<string | null>(null);

  const [sigConfidenceRef, setSigConfidenceRef] = useState<string | null>(null);
  const [sigConfidenceLabel, setSigConfidenceLabel] = useState<string | null>(null);

  const [sigHandwritingLegibilityRef, setSigHandwritingLegibilityRef] = useState<string | null>(
    null,
  );
  const [sigHandwritingLegibilityLabel, setSigHandwritingLegibilityLabel] = useState<
    string | null
  >(null);

  const [sigPatternRaw, setSigPatternRaw] = useState<string>(''); // "A;B;C" stocké en text
  const [sigNote, setSigNote] = useState<string>('');

  function resetSignatureDraft() {
    setEditingSignatureId(null);
    setSigLabel('');
    setSigKindRef(null);
    setSigKindLabel(null);
    setSigConfidenceRef(null);
    setSigConfidenceLabel(null);
    setSigHandwritingLegibilityRef(null);
    setSigHandwritingLegibilityLabel(null);
    setSigPatternRaw('');
    setSigNote('');
  }

  function cancelSignatureForm() {
    resetSignatureDraft();
    setSigFormMode('idle');
  }

  async function loadSignatures() {
    if (!currentPartVersionId) {
      setSignatures([]);
      return;
    }

    const q = supabase
      .from('ec_transcription_signatures')
      .select(
        `
  id, acte_id, acte_source_id, transcription_id, transcription_version_id,
  label, pattern, note, created_at, updated_at,

  signature_kind_ref,
  confidence_ref,
  handwriting_legibility_ref,

  ref_signature_kind: signature_kind_ref ( id, label ),
  ref_confiance: confidence_ref ( id, label ),
  ref_handwriting_legibility: handwriting_legibility_ref ( id, label )
`,
      )
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

    const rows: EcSignatureRow[] = (res.data ?? []).map((row: any) => ({
      ...row,
      signature_kind_label: row.ref_signature_kind?.label ?? null,
      confidence_label: row.ref_confiance?.label ?? null,
      handwriting_legibility_label: row.ref_handwriting_legibility?.label ?? null,
    }));

    setSignatures(rows);
  }

  // Auto-reload quand on change de version / source
  useEffect(() => {
    setSigFormMode('idle');
    setEditingSignatureId(null);
    void loadSignatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acteId, currentPartVersionId, currentPartActeSourceId]);

  function startCreateSignature() {
    resetSignatureDraft();
    setSigFormMode('create');
  }

  function startEditSignature(row: EcSignatureRow) {
    setEditingSignatureId(row.id);
    setSigLabel(row.label ?? '');
    setSigKindRef(row.signature_kind_ref ?? null);
    setSigKindLabel(row.signature_kind_label ?? null);
    setSigConfidenceRef(row.confidence_ref ?? null);
    setSigConfidenceLabel(row.confidence_label ?? null);
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
      signature_kind_ref: sigKindRef,
      confidence_ref: sigConfidenceRef,
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

  async function deleteSignature(id: string) {
    const res = await supabase.from('ec_transcription_signatures').delete().eq('id', id);
    if (res.error) {
      console.error(res.error);
      return;
    }
    if (editingSignatureId === id) cancelSignatureForm();

    await loadSignatures();
  }

  return {
    signatures,

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
    sigKindRef,
    setSigKindRef,
    sigKindLabel,
    setSigKindLabel,
    sigConfidenceRef,
    setSigConfidenceRef,
    sigConfidenceLabel,
    setSigConfidenceLabel,
    sigHandwritingLegibilityRef,
    setSigHandwritingLegibilityRef,
    sigHandwritingLegibilityLabel,
    setSigHandwritingLegibilityLabel,
    sigPatternRaw,
    setSigPatternRaw,
    sigNote,
    setSigNote,
  };
}
