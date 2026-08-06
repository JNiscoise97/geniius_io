// transcriptionTab.logic.ts

import { useState } from 'react';

import { useTranscriptionCore } from './hooks/useTranscriptionCore';
import { useTranscriptionSplitPane } from './hooks/useTranscriptionSplitPane';
import { useActeCitationsSources } from './hooks/useActeCitationsSources';
import { useTranscriptionSignatures } from './hooks/useTranscriptionSignatures';
import { useTranscriptionMarginalCrossouts } from './hooks/useTranscriptionMarginalCrossouts';
import { useTranscriptionMarginalMentions } from './hooks/useTranscriptionMarginalMentions';
import { useTranscriptionReference } from './hooks/useTranscriptionReference';

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

export function useTranscriptionTab({ acteId }: Props) {
  // Sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>('annotation');

  const core = useTranscriptionCore({ acteId, setSheetMode, setSheetOpen });

  // ✅ on rattache les lignes à : acte_id + transcription_version_id + (option) acte_source_id
  const currentPartActeSourceId = core.activeSourceId ?? null;
  const currentPartVersionId = core.workingVersion?.id ?? null;

  const splitApi = useTranscriptionSplitPane();

  const { sources, loadingSources, errorMsg } = useActeCitationsSources(acteId);

  const sigHook = useTranscriptionSignatures({
    acteId,
    activeSourceId: core.activeSourceId,
    currentPartVersionId,
    currentPartActeSourceId,
    setSheetMode,
    setSheetOpen,
  });

  const mcHook = useTranscriptionMarginalCrossouts({
    acteId,
    activeSourceId: core.activeSourceId,
    currentPartVersionId,
    currentPartActeSourceId,
    setSheetMode,
    setSheetOpen,
  });

  const mmHook = useTranscriptionMarginalMentions({
    acteId,
    activeSourceId: core.activeSourceId,
    currentPartVersionId,
    currentPartActeSourceId,
    setSheetMode,
    setSheetOpen,
  });

  const refHook = useTranscriptionReference({
    acteId,
    currentId: core.currentId,
    preferredSourceId: core.preferredSourceId,
    transcriptionByKey: core.transcriptionByKey,
    setLoading: core.setLoading,
    refreshVersionsAndSelect: core.refreshVersionsAndSelect,
    setSheetMode,
    setSheetOpen,
  });

  // -----------------------------
  // API surface
  // -----------------------------
  return {
    ...core,

    // sheet
    sheetOpen,
    sheetMode,
    setSheetOpen,
    setSheetMode,

    // split
    split: splitApi,

    sources,
    loadingSources,
    errorMsg,

    // -----------------------------
    // Référence
    // -----------------------------
    ...refHook,

    // -----------------------------
    // Mentions marginales
    // -----------------------------
    ...mmHook,

    // -----------------------------
    // Signatures
    // -----------------------------
    ...sigHook,

    // -----------------------------
    // Ratures marginales
    // -----------------------------
    ...mcHook,
  };
}
