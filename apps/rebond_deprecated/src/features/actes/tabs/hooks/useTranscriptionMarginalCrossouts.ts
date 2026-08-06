// useTranscriptionMarginalCrossouts.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureTranscription, type EcMarginalCrossoutRow } from '../transcriptionTab.service';

export function useTranscriptionMarginalCrossouts(params: {
  acteId: string;
  activeSourceId: string | null;
  currentPartVersionId: string | null;
  currentPartActeSourceId: string | null;
  setSheetMode: (m: 'marginal_crossouts') => void;
  setSheetOpen: (v: boolean) => void;
}) {
  const { acteId, activeSourceId, currentPartVersionId, currentPartActeSourceId, setSheetMode, setSheetOpen } =
    params;

  const [marginalCrossouts, setMarginalCrossouts] = useState<EcMarginalCrossoutRow[]>([]);

  const [editingMarginalCrossoutId, setEditingMarginalCrossoutId] = useState<string | null>(null);

  const [mcType, setMcType] = useState<string>('');
  const [mcTarget, setMcTarget] = useState<string>('');
  const [mcStruck, setMcStruck] = useState<string>('');
  const [mcReplacement, setMcReplacement] = useState<string>('');
  const [mcNote, setMcNote] = useState<string>('');

  function resetMarginalCrossoutForm() {
    setEditingMarginalCrossoutId(null);
    setMcType('');
    setMcTarget('');
    setMcStruck('');
    setMcReplacement('');
    setMcNote('');
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
    void loadMarginalCrossouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acteId, currentPartVersionId, currentPartActeSourceId]);

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

  async function deleteMarginalCrossout(id: string) {
    const res = await supabase.from('ec_transcription_marginal_crossouts').delete().eq('id', id);
    if (res.error) {
      console.error(res.error);
      return;
    }
    if (editingMarginalCrossoutId === id) resetMarginalCrossoutForm();
    await loadMarginalCrossouts();
  }

  return {
    marginalCrossouts,

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
