// useTranscriptionReference.ts
import { useState } from 'react';
import { toast } from 'sonner';
import {
  ensureTranscription,
  setTranscriptionReference,
  clearTranscriptionReference,
  transcriptionKey,
  type TranscriptionRow,
} from '../transcriptionTab.service';

type RefReasonKey = 'best_legibility' | 'most_complete' | 'best_match' | 'other';

export function useTranscriptionReference(params: {
  acteId: string;
  currentId: string | null;
  preferredSourceId: string | null;
  transcriptionByKey: Record<string, TranscriptionRow>;
  setLoading: (v: boolean) => void;
  refreshVersionsAndSelect: (idToSelect?: string) => Promise<void>;
  setSheetMode: (m: 'reference') => void;
  setSheetOpen: (v: boolean) => void;
}) {
  const {
    acteId,
    currentId,
    preferredSourceId,
    transcriptionByKey,
    setLoading,
    refreshVersionsAndSelect,
    setSheetMode,
    setSheetOpen,
  } = params;

  const [referenceTargetSourceId, setReferenceTargetSourceId] = useState<string | null>(null);

  const [refReason, setRefReason] = useState<RefReasonKey | ''>('');
  const [refComment, setRefComment] = useState('');

  const [referenceMode, setReferenceMode] = useState<'set' | 'edit'>('set');

  // snapshot initial (pour Annuler modifs)
  const [refInitial, setRefInitial] = useState<{ reason: RefReasonKey | ''; comment: string }>({
    reason: '',
    comment: '',
  });

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

  return {
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
  };
}
