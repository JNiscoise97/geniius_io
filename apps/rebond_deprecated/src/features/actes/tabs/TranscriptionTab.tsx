// TranscriptionTab.tsx
// Deux modes : Saisie rapide (plein ecran) et Enrichissement (split + panel contextuel)

import React, { useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  FileText,
  Eye,
  Pencil,
  Trash2,
  GripVertical,
  Lock,
  Unlock,
  AlignLeft,
  HelpCircle,
  LayoutGrid,
  Strikethrough,
  PenLine,
  Scissors,
  AlertTriangle,
  SeparatorHorizontal,
  Plus,
  Tags,
  User,
  Calendar,
  MapPin,
  MessageSquare,
  Save,
  Signature,
  Star,
} from 'lucide-react';

import {
  PAGE_BREAK_TOKEN,
  normalizeSpaces,
  splitIntoReadableBlocks,
  detectActeReperages,
  tokenizeInline,
  transcriptionKey,
} from './transcriptionTab.service';

import { useTranscriptionTab } from './transcriptionTab.logic';
import { StatusPill } from '@/components/shared/StatusPill';
import { ProgressVerboseBar } from '@/components/shared/ProgressVerboseBar';
import { SignatureFormSection } from './SignatureFormSection';
import { SignatureList } from './SignatureList';
import { MarginalMentionFormSection } from './MarginalMentionFormSection';
import { MarginalMentionList } from './MarginalMentionList';
import { MarginalCrossoutFormSection } from './MarginalCrossoutFormSection';
import { anchorBadge, tagBadge, typeLabel } from './transcriptionTab.ui';
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type ViewMode = 'saisie' | 'enrichissement';
const VIEWMODE_LS_KEY = 'rebond.transcription.viewMode';

type QualiteDraft = {
  source_lecture_kind_ref: string | null;
  langue_ref: string | null;
  language_confidence_ref: string | null;
  handwriting_style_ref: string | null;
  handwriting_legibility_ref: string | null;
  completeness_ref: string | null;
  incompleteness_reason: string | null;
  reserve_level_ref: string | null;
  reserve_reason: string | null;
};

const QUALITE_EMPTY: QualiteDraft = {
  source_lecture_kind_ref: null,
  langue_ref: null,
  language_confidence_ref: null,
  handwriting_style_ref: null,
  handwriting_legibility_ref: null,
  completeness_ref: null,
  incompleteness_reason: null,
  reserve_level_ref: null,
  reserve_reason: null,
};

type Props = { acteId: string; onGoToTab?: (tab: string) => void };

// ---------------------------------------------------------------------------
// TranscriptionTab (main)
// ---------------------------------------------------------------------------

export default function TranscriptionTab({ acteId, onGoToTab }: Props) {
  const t = useTranscriptionTab({ acteId });

  // ---- View mode (persisted) ----
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const v = localStorage.getItem(VIEWMODE_LS_KEY);
      return v === 'enrichissement' ? 'enrichissement' : 'saisie';
    } catch {
      return 'saisie';
    }
  });

  const switchMode = (m: ViewMode) => {
    setViewMode(m);
    try {
      localStorage.setItem(VIEWMODE_LS_KEY, m);
    } catch {}
  };

  // ---- Local UI state ----
  const [readGrouped, setReadGrouped] = useState(true);
  const [textareaLocked, setTextareaLocked] = useState(false);

  const [qualiteDraft, setQualiteDraft] = useState<QualiteDraft>(QUALITE_EMPTY);

  // ---- Status-based rules ----
  // Source de vérité unique : t.isEditableStatus (EDITABLE_STATUSES dans transcriptionTab.logic.ts)
  const workingStatus = t.workingVersion?.status ?? null;
  const isLockable = !!workingStatus && !t.isEditableStatus;
  const isFinalized = isLockable;

  React.useEffect(() => {
    if (isLockable) setTextareaLocked(true);
    else setTextareaLocked(false);
  }, [isLockable]);

  React.useEffect(() => {
    if (!t.activeSourceId) {
      setQualiteDraft(QUALITE_EMPTY);
      return;
    }
    const tr = t.transcriptionByKey[transcriptionKey(t.activeSourceId, 'main_body')];
    if (!tr) {
      setQualiteDraft(QUALITE_EMPTY);
      return;
    }
    setQualiteDraft({
      source_lecture_kind_ref: tr.source_lecture_kind_ref ?? null,
      langue_ref: tr.langue_ref ?? null,
      language_confidence_ref: tr.language_confidence_ref ?? null,
      handwriting_style_ref: tr.handwriting_style_ref ?? null,
      handwriting_legibility_ref: tr.handwriting_legibility_ref ?? null,
      completeness_ref: tr.completeness_ref ?? null,
      incompleteness_reason: tr.incompleteness_reason ?? null,
      reserve_level_ref: tr.reserve_level_ref ?? null,
      reserve_reason: tr.reserve_reason ?? null,
    });
  }, [t.activeSourceId, t.transcriptionByKey]);

  const isViewingPast = !!(
    t.currentId &&
    t.workingVersion &&
    t.currentId !== t.workingVersion.id
  );
  const currentVersionNum = t.currentVersion?.version ?? null;

  const textareaDisabled =
    !t.activeSourceId || (isLockable && textareaLocked) || t.dirtyState === 'saving' || isViewingPast;

  // ---- Auto-select unique source ----
  React.useEffect(() => {
    if (!t.activeSourceId && (t.sources as any[])?.length === 1) {
      t.selectSource((t.sources as any[])[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(t.sources as any[])?.length, t.activeSourceId]);

  // ---- Active source info ----
  const activeSource = useMemo(
    () => ((t.sources ?? []) as any[]).find((s) => s.id === t.activeSourceId) ?? null,
    [t.sources, t.activeSourceId],
  );

  const sourceLabel = useMemo(() => {
    if (!activeSource) return null;
    const m = activeSource.exemplaire ?? {};
    const inst = m.institution_sigle || m.institution_nom || m.depot_nom || null;
    const cote = m.cote_locale || null;
    const vues =
      activeSource.loc_raw ||
      (activeSource.loc_start != null ? `Vue ${activeSource.loc_start}` : null);
    return [inst, cote, vues].filter(Boolean).join(' · ') || 'Source active';
  }, [activeSource]);

  // ---- Derived content ----
  const readableBlocks = useMemo(
    () =>
      splitIntoReadableBlocks(t.editorValue, {
        typeActe: (t.acte as any)?.type_acte ?? null,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t.editorValue, (t.acte as any)?.type_acte],
  );

  const rep = useMemo(() => detectActeReperages(t.editorValue), [t.editorValue]);

  const canMarkTranscribed =
    !!(t.editorValue ?? '').trim() &&
    !t.loading &&
    !!t.activeSourceId &&
    !!t.workingVersion &&
    !isFinalized;

  const lastSavedAt = useMemo(() => {
    if (!t.workingVersion?.updated_at) return null;
    return new Date(t.workingVersion.updated_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [t.workingVersion?.updated_at]);

  const saveIndicator = (() => {
    if (t.dirtyState === 'saving') return 'Enregistrement...';
    if (t.dirtyState === 'saved') return 'Enregistre';
    if (t.dirtyState === 'editing') return 'Non enregistre';
    return '';
  })();

  // ---- Loading ----
  if (t.loading && !t.workingVersion && t.versions.length === 0 && !(t.sources as any[])?.length) {
    return <div className="p-4 text-sm text-slate-600">Chargement...</div>;
  }

  // ---- No sources ----
  if (!t.loading && (!(t.sources as any[]) || (t.sources as any[]).length === 0)) {
    return (
      <div className="flex flex-col h-full">
        <TabHeader
          viewMode={viewMode}
          onSwitch={switchMode}
          sourceLabel={null}
          status={null}
          canMarkTranscribed={false}
          onMarkTranscribed={t.markAsTranscribed}
          onSetInReview={t.setInReview}
          loading={false}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">Aucune source enregistree</div>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Ajoute d&apos;abord une source dans l&apos;onglet{' '}
              <button
                type="button"
                className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
                onClick={() => onGoToTab?.('Reference archive')}
              >
                Reference archive
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Source pills (shared) ----
  const sourcePills =
    ((t.sources as any[])?.length ?? 0) > 1 ? (
      <div className="px-4 py-1.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-slate-400 font-medium">Source</span>
        {((t.sources ?? []) as any[]).map((s) => {
          const m = s.exemplaire ?? {};
          const lbl = m.unite_titre || m.institution_sigle || m.depot_nom || 'Archive';
          const isActive = s.id === t.activeSourceId;
          const isPreferred = s.id === t.preferredSourceId;
          return (
            <div key={s.id} className="inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => t.selectSource(s.id)}
                className={[
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                {lbl}
              </button>
              <button
                type="button"
                onClick={() => t.togglePreferred(s.id)}
                title={isPreferred ? 'Source de reference (cliquer pour modifier)' : 'Definir comme source de reference'}
                className="p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <Star className={['h-3 w-3 transition-colors', isPreferred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'].join(' ')} />
              </button>
            </div>
          );
        })}
      </div>
    ) : null;

  // ---- No source selected placeholder ----
  const noSourceSelected = (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-sm font-medium text-slate-700">Choisissez une source</div>
      <p className="text-xs text-slate-500 max-w-xs">
        Selectionnez la version d&apos;archive que vous souhaitez transcrire.
      </p>
    </div>
  );

  // ---- Editor section (shared JSX) ----
  const editorSection = (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 border-b border-slate-100 flex-wrap gap-y-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => t.setTextMode('edit')}
              className={[
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                t.textMode === 'edit'
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edition
            </button>
            <button
              type="button"
              onClick={() => t.setTextMode('read')}
              className={[
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                t.textMode === 'read'
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              <Eye className="h-3.5 w-3.5" />
              Lecture
            </button>
          </div>

          {isLockable && t.textMode === 'edit' && (
            <button
              type="button"
              onClick={() => setTextareaLocked((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
              title={textareaLocked ? 'Deverrouiller (version finalisee)' : 'Verrouiller'}
            >
              {textareaLocked ? (
                <Lock className="h-4 w-4 text-slate-600" />
              ) : (
                <Unlock className="h-4 w-4 text-slate-700" />
              )}
            </button>
          )}

        </div>

        {t.textMode === 'edit' ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={t.insertPageBreak}
              disabled={textareaDisabled || !t.workingVersion}
            >
              <SeparatorHorizontal className="w-3.5 h-3.5" />
              Saut
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={t.openIllisibleDialog}
              disabled={textareaDisabled || !t.workingVersion}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Illisible
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={t.wrapStrike}
              disabled={textareaDisabled || !t.workingVersion}
            >
              <Strikethrough className="w-3.5 h-3.5" />
              Barre
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs font-bold gap-1"
              onClick={t.wrapBold}
              disabled={textareaDisabled || !t.workingVersion}
            >
              G Gras
            </Button>

            {viewMode === 'enrichissement' && (
              <>
                <div className="w-px h-5 bg-slate-200 mx-0.5" />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={t.openAddAnnotation}
                  disabled={textareaDisabled || !t.workingVersion}
                  title="Annoter la selection"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Anno.
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={t.openAddNote}
                  disabled={!t.workingVersion}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Note
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={t.openTagPassage}
                  disabled={textareaDisabled || !t.workingVersion}
                  title="Tagger la selection"
                >
                  <Tags className="w-3.5 h-3.5" />
                  Tag
                </Button>
              </>
            )}

            <div className="w-px h-5 bg-slate-200 mx-0.5" />

            {/* Timestamp + Save */}
            <span className="text-xs text-slate-400 shrink-0">
              {t.dirtyState === 'saving'
                ? 'Enregistrement...'
                : t.dirtyState === 'editing'
                ? 'Modifie'
                : lastSavedAt
                ? `Sauvegarde a ${lastSavedAt}`
                : ''}
            </span>
            <Button
              onClick={t.saveNewVersionForActiveSource}
              disabled={t.loading || !t.activeSourceId || t.dirtyState !== 'editing'}
              variant={t.dirtyState === 'editing' ? 'default' : 'outline'}
              size="sm"
              className="h-7 gap-1.5 shrink-0"
            >
              <Save className="h-3.5 w-3.5" />
              Enregistrer
            </Button>
          </div>
        ) : (
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setReadGrouped(true)}
              className={[
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                readGrouped ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500',
              ].join(' ')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Blocs
            </button>
            <button
              type="button"
              onClick={() => setReadGrouped(false)}
              className={[
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                !readGrouped ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500',
              ].join(' ')}
            >
              <AlignLeft className="h-3.5 w-3.5" />
              Brut
            </button>
          </div>
        )}
      </div>

      {/* Banniere version ancienne */}
      {isViewingPast && (
        <div className="mx-4 mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-center justify-between gap-3">
          <span>Consultation de la version v{currentVersionNum} (ancienne) — lecture seule.</span>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs shrink-0"
            onClick={() => t.setCurrentId(t.workingVersion!.id)}
          >
            Revenir a la version actuelle
          </Button>
        </div>
      )}

      {/* Text area / reader */}
      <div className="flex-1 px-4 py-3">
        {t.textMode === 'edit' ? (
          <textarea
            disabled={textareaDisabled}
            ref={t.textareaRef}
            value={t.editorValue}
            onChange={(e) => t.onChangeEditor(e.target.value)}
            onMouseUp={t.captureSelection}
            onKeyUp={t.captureSelection}
            placeholder={`Transcrivez ici... (${PAGE_BREAK_TOKEN} = saut de page, [illisible], ~barre~, *gras*)`}
            className={[
              viewMode === 'saisie'
                ? 'w-full resize-y rounded-xl border px-3 py-3 text-sm leading-relaxed shadow-sm outline-none font-mono min-h-[300px]'
                : 'w-full resize-y rounded-xl border px-3 py-3 text-sm leading-relaxed shadow-sm outline-none font-mono min-h-[420px]',
              textareaDisabled
                ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                : 'border-slate-200 bg-white text-slate-900 focus:border-slate-400',
            ].join(' ')}
          />
        ) : (
          <div className={[
            'overflow-auto rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900',
            viewMode === 'saisie' ? 'min-h-[calc(100vh-180px)]' : 'min-h-[420px]',
          ].join(' ')}>
            {readGrouped ? (
              <div className="space-y-3">
                {readableBlocks.map((b, idx) => {
                  if (b.kind === 'page_break') {
                    return (
                      <div key={`pb-${idx}`} className="flex items-center gap-3 my-4">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs text-slate-400">Saut de page</span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                    );
                  }
                  return (
                    <div key={`b-${idx}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        {(b as any).label ?? 'Texte'}
                      </div>
                      <div className="whitespace-pre-wrap">
                        <RichText text={b.text} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="whitespace-pre-wrap">
                <RichText text={t.editorValue?.trim() ? t.editorValue : ''} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barre info selection */}
      {t.selection && t.textMode === 'edit' && (
        <div className="px-4 py-1.5 border-t border-slate-100 bg-slate-50">
          <span className="text-xs text-slate-400">
            {t.selection.start}–{t.selection.end} &middot; {t.selection.end - t.selection.start} caracteres selectionnes
          </span>
        </div>
      )}
    </div>
  );

  // ---- Main render ----
  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      <TabHeader
        viewMode={viewMode}
        onSwitch={switchMode}
        sourceLabel={sourceLabel}
        status={workingStatus}
        canMarkTranscribed={canMarkTranscribed}
        onMarkTranscribed={t.markAsTranscribed}
        onSetInReview={t.setInReview}
        loading={t.loading}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'saisie' ? (
          // ======= MODE SAISIE RAPIDE =======
          <div className="flex flex-col h-full">
            {sourcePills}
            {!t.activeSourceId ? (
              noSourceSelected
            ) : (
              <>
                {!t.workingVersion && (
                  <div className="mx-4 mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Commencez a saisir — un brouillon sera cree automatiquement.
                  </div>
                )}
                {editorSection}
              </>
            )}
          </div>
        ) : (
          // ======= MODE ENRICHISSEMENT =======
          <div
            id="transcription-split-root"
            className="grid h-full gap-0"
            style={{
              gridTemplateColumns: `minmax(320px, ${t.split.leftPct}%) 12px minmax(280px, ${100 - t.split.leftPct}%)`,
            }}
          >
            {/* Left: editor */}
            <div className="flex flex-col min-h-0 overflow-hidden border-r border-slate-100">
              {sourcePills}
              {!t.activeSourceId ? (
                noSourceSelected
              ) : (
                <>
                  {!t.workingVersion && (
                    <div className="mx-3 mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      Commencez a saisir — un brouillon sera cree automatiquement.
                    </div>
                  )}
                  {editorSection}
                </>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-stretch justify-center">
              <div
                role="separator"
                onMouseDown={t.split.onMouseDownDivider}
                className="mx-1 my-2 w-2 cursor-col-resize rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                title="Redimensionner"
              >
                <GripVertical className="h-4 w-4 text-slate-300" />
              </div>
            </div>

            {/* Right: contextual panel */}
            <div className="flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                <RightPanel
                  t={t}
                  rep={rep}
                  isFinalized={isFinalized}
                  canMarkTranscribed={canMarkTranscribed}
                  activeSource={activeSource}
                  qualiteDraft={qualiteDraft}
                  setQualiteDraft={setQualiteDraft}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <TranscriptionSheet t={t} />

      <Dialog open={t.illisibleOpen} onOpenChange={t.setIllisibleOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Inserer une zone illisible</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs font-medium text-slate-700">x &middot; caracteres</div>
              <Input className="mt-1" type="number" min={0} value={t.illisibleX} onChange={(e) => t.setIllisibleX(Number(e.target.value))} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700">y &middot; mots</div>
              <Input className="mt-1" type="number" min={0} value={t.illisibleY} onChange={(e) => t.setIllisibleY(Number(e.target.value))} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700">z &middot; lignes</div>
              <Input className="mt-1" type="number" min={0} value={t.illisibleZ} onChange={(e) => t.setIllisibleZ(Number(e.target.value))} />
            </div>
          </div>
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-mono text-slate-700">
            [ILLISIBLE_CARACTERE{t.illisibleX}_MOT{t.illisibleY}_LIGNE{t.illisibleZ}]
          </div>
          <DialogFooter className="mt-3 gap-2">
            <Button variant="outline" onClick={() => t.setIllisibleOpen(false)}>Annuler</Button>
            <Button onClick={t.confirmInsertIllisible}>Inserer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TabHeader
// ---------------------------------------------------------------------------

function TabHeader({
  viewMode,
  onSwitch,
  sourceLabel,
  status,
  canMarkTranscribed,
  onMarkTranscribed,
  onSetInReview,
  loading,
}: {
  viewMode: ViewMode;
  onSwitch: (m: ViewMode) => void;
  sourceLabel: string | null;
  status: string | null;
  canMarkTranscribed: boolean;
  onMarkTranscribed: () => void;
  onSetInReview: () => void;
  loading: boolean;
}) {
  const cta = (() => {
    if (!sourceLabel) return null;
    if (status === 'IN_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
          En relecture
        </span>
      );
    }
    if (status === 'VALIDATED') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Valide
        </span>
      );
    }
    if (status === 'TRANSCRIBED') {
      return (
        <Button
          size="sm"
          className="shrink-0 gap-1.5 h-8"
          onClick={onSetInReview}
          disabled={loading}
          variant="default"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Soumettre en relecture
        </Button>
      );
    }
    return (
      <Button
        size="sm"
        className="shrink-0 gap-1.5 h-8"
        onClick={onMarkTranscribed}
        disabled={!canMarkTranscribed || loading}
        variant={canMarkTranscribed ? 'default' : 'outline'}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Marquer comme transcrit
      </Button>
    );
  })();

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 bg-white shrink-0 flex-wrap gap-y-1.5">
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shrink-0">
        <button
          type="button"
          onClick={() => onSwitch('saisie')}
          className={[
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            viewMode === 'saisie' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700',
          ].join(' ')}
        >
          <Pencil className="h-3 w-3" />
          Saisie rapide
        </button>
        <button
          type="button"
          onClick={() => onSwitch('enrichissement')}
          className={[
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            viewMode === 'enrichissement' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700',
          ].join(' ')}
        >
          <Tags className="h-3 w-3" />
          Enrichissement
        </button>
      </div>

      {sourceLabel && (
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span className="text-xs text-slate-500 truncate">{sourceLabel}</span>
          {status && <StatusPill statut={status as any} />}
        </div>
      )}

      {cta}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RightPanel (contextuel)
// ---------------------------------------------------------------------------

type RightPanelProps = {
  t: ReturnType<typeof useTranscriptionTab>;
  rep: ReturnType<typeof detectActeReperages>;
  isFinalized: boolean;
  canMarkTranscribed: boolean;
  activeSource: any;
  qualiteDraft: QualiteDraft;
  setQualiteDraft: React.Dispatch<React.SetStateAction<QualiteDraft>>;
};

function RightPanel({ t, rep, isFinalized, canMarkTranscribed, activeSource, qualiteDraft, setQualiteDraft }: RightPanelProps) {
  if (!t.activeSourceId) return null;

  const normalizeTotal = (present: boolean | null | undefined, count: number | null | undefined) => {
    if (present === false) return 0;
    if (present === true) return count ?? 0;
    if (count == null) return null;
    return count;
  };

  const citationTotals = {
    marginalMentionsTotal: normalizeTotal(activeSource?.marginal_mentions_present, activeSource?.marginal_mentions_count),
    signaturesTotal: normalizeTotal(activeSource?.signatures_present, activeSource?.signatures_count),
    marginalCrossoutsTotal: normalizeTotal(activeSource?.marginal_crossouts_present, activeSource?.marginal_crossouts_count),
  };

  const saveQualite = () => {
    t.saveWorkflowMetadata({
      source_lecture_kind_ref: qualiteDraft.source_lecture_kind_ref,
      langue_ref: qualiteDraft.langue_ref,
      language_confidence_ref: qualiteDraft.language_confidence_ref,
      handwriting_style_ref: qualiteDraft.handwriting_style_ref,
      handwriting_legibility_ref: qualiteDraft.handwriting_legibility_ref,
      completeness_ref: qualiteDraft.completeness_ref,
      incompleteness_reason: qualiteDraft.incompleteness_reason,
      reserve_level_ref: qualiteDraft.reserve_level_ref,
      reserve_reason: qualiteDraft.reserve_reason,
      visibility: 'private',
      state: 'active',
      scope: 'full_acte',
      scope_details: null,
      normalisation_policy_raw: '{}',
      conventions_id: null,
      conventions_override_text: null,
      source_page_from: null,
      source_page_to: null,
      image_transform_notes: null,
      note: null,
      goal: null,
    } as any, {} as any);
  };

  if (!t.workingVersion) {
    return <RepéragesCard rep={rep} t={t} />;
  }

  return (
    <>
      {!isFinalized ? (
        <RepéragesCard rep={rep} t={t} />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="text-sm font-semibold text-slate-900">Zones specifiques</div>
            <PartSectionCard
              title="Mentions marginales"
              Icon={PenLine}
              count={(t.marginalMentions?.length ?? 0) as number}
              total={citationTotals.marginalMentionsTotal ?? 0}
              onAdd={() => t.openAddMarginalMention?.()}
              onManage={() => t.openManageMarginalMentions?.()}
              disabled={t.loading || !t.workingVersion}
              present={activeSource?.marginal_mentions_present}
            />
            <PartSectionCard
              title="Signatures"
              Icon={Signature}
              count={(t.signatures?.length ?? 0) as number}
              total={citationTotals.signaturesTotal ?? 0}
              onAdd={() => t.openAddSignature?.()}
              onManage={() => t.openManageSignatures?.()}
              disabled={t.loading || !t.workingVersion}
              present={activeSource?.signatures_present}
            />
            <PartSectionCard
              title="Ratures marginales"
              Icon={Scissors}
              count={(t.marginalCrossouts?.length ?? 0) as number}
              total={citationTotals.marginalCrossoutsTotal ?? 0}
              onAdd={() => t.openAddMarginalCrossout?.()}
              onManage={() => t.openManageMarginalCrossouts?.()}
              disabled={t.loading || !t.workingVersion}
              present={activeSource?.marginal_crossouts_present}
            />
          </div>
          <AnnotationsCard t={t} />
          <TagsCard t={t} />
          <NotesCard t={t} />
        </>
      )}
      <QualiteCard draft={qualiteDraft} setDraft={setQualiteDraft} onSave={saveQualite} disabled={!t.workingVersion} loading={t.loading} />
      <VersionHistoryCard t={t} />
    </>
  );
}

// ---------------------------------------------------------------------------
// TranscriptionSheet
// ---------------------------------------------------------------------------

function TranscriptionSheet({ t }: { t: ReturnType<typeof useTranscriptionTab> }) {
  const sheetTitle = (() => {
    switch (t.sheetMode) {
      case 'annotation': return t.editingAnnotationId ? 'Modifier l’annotation' : 'Annoter un passage';
      case 'note': return t.editingNoteId ? 'Modifier la note' : 'Ajouter une note';
      case 'tag': return 'Tagger un passage';
      case 'reference': return 'Definir la source de reference';
      case 'marginal_mentions': return 'Mentions marginales';
      case 'signatures': return 'Signatures';
      case 'marginal_crossouts': return 'Ratures marginales';
      default: return 'Panneau';
    }
  })();

  const sheetDesc = (() => {
    switch (t.sheetMode) {
      case 'annotation': return 'Documenter un doute, une rature, une lacune ou une remarque particuliere.';
      case 'note': return 'Ajouter une note libre, ancree ou non au texte.';
      case 'tag': return 'Identifier une date, un acteur ou un lieu dans la selection.';
      case 'marginal_mentions': return 'Transcrire les mentions en marge (mariage, deces, rectification...).';
      case 'signatures': return 'Relever les signatures telles que lues.';
      case 'marginal_crossouts': return 'Decrire les ratures et corrections visibles en marge.';
      default: return '';
    }
  })();

  return (
    <Sheet open={t.sheetOpen} onOpenChange={t.setSheetOpen}>
      <SheetContent side="right" className="!w-[640px] !max-w-none p-0 flex flex-col max-h-screen">
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle>{sheetTitle}</SheetTitle>
          {sheetDesc && <SheetDescription>{sheetDesc}</SheetDescription>}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">

          {/* ANNOTATION */}
          {t.sheetMode === 'annotation' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-700 mb-1.5">Type d&apos;annotation</div>
                <div className="grid grid-cols-1 gap-2">
                  {([
                    ['doubt', '?', 'Doute de lecture — incertitude paleographique'],
                    ['rature', '✕', 'Rature dans l’original — texte barre ou surcharge'],
                    ['lacune', '…', 'Information manquante — trou dans le texte'],
                    ['mention', 'i', 'Remarque — observation generale'],
                    ['other', '•', 'Autre'],
                  ] as const).map(([val, icon, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => t.setAnnoType(val)}
                      className={[
                        'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm text-left transition-colors',
                        t.annoType === val
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <span className="w-5 text-center font-bold text-base">{icon}</span>
                      <span className="text-xs">{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-700 mb-1">
                  Commentaire
                  <span className="text-slate-400 font-normal ml-1">(facultatif)</span>
                </div>
                <Textarea
                  className="min-h-[100px]"
                  value={t.annoComment}
                  onChange={(e) => t.setAnnoComment(e.target.value)}
                  placeholder="Ex : lecture incertaine entre MOREAU et MOUREAU..."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => t.setSheetOpen(false)}>Annuler</Button>
                <Button onClick={t.submitAnnotation} disabled={t.loading}>
                  {t.editingAnnotationId ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </div>
          )}

          {/* NOTE */}
          {t.sheetMode === 'note' && (
            <div className="space-y-4">
              {t.selection && !t.editingNoteId ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  La note sera ancree a votre selection actuelle.
                </div>
              ) : !t.selection && !t.editingNoteId ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  Aucune selection : la note sera libre (non ancree au texte).
                </div>
              ) : null}
              <div>
                <div className="text-xs font-medium text-slate-700 mb-1">Note</div>
                <Textarea
                  className="min-h-[140px]"
                  value={t.noteContent}
                  onChange={(e) => t.setNoteContent(e.target.value)}
                  placeholder="Votre note..."
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => t.setSheetOpen(false)}>Annuler</Button>
                <Button onClick={t.submitNote} disabled={t.loading || !t.noteContent.trim()}>
                  {t.editingNoteId ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </div>
          )}

          {/* TAG */}
          {t.sheetMode === 'tag' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-700 mb-1.5">Type de tag</div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['date', 'Date', Calendar],
                    ['acteur', 'Acteur', User],
                    ['lieu', 'Lieu', MapPin],
                  ] as const).map(([val, lbl, Icon]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => t.onChangeTagKind(val)}
                      className={[
                        'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors',
                        t.tagKind === val
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4" />
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-700 mb-1">
                  Libelle
                  <span className="text-slate-400 font-normal ml-1">(pre-rempli avec la selection)</span>
                </div>
                <Input
                  value={t.tagLabel}
                  onChange={(e) => t.setTagLabel(e.target.value)}
                  placeholder="Ex : 12 janvier 1821..."
                />
              </div>
              {t.tagKind === 'acteur' && (
                <div>
                  <div className="text-xs font-medium text-slate-700 mb-1">Acteur lie</div>
                  {t.acteurs.length === 0 ? (
                    <div className="text-xs text-slate-500 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      Aucun acteur enregistre pour cet acte.
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                      value={t.tagActeurId}
                      onChange={(e) => t.setTagActeurId(e.target.value)}
                    >
                      <option value="">&mdash; Aucun &mdash;</option>
                      {t.acteurs.map((a) => (
                        <option key={a.id} value={a.id}>
                          {[a.prenom, a.nom].filter(Boolean).join(' ')}{a.role ? ` (${a.role})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => t.setSheetOpen(false)}>Annuler</Button>
                <Button onClick={t.submitTag} disabled={t.loading}>Ajouter le tag</Button>
              </div>
            </div>
          )}

          {/* REFERENCE */}
          {t.sheetMode === 'reference' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-700">Raison principale</div>
                <select
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
                  value={t.refReason}
                  onChange={(e) => t.setRefReason(e.target.value as any)}
                >
                  <option value="">&mdash;</option>
                  <option value="best_legibility">Meilleure lisibilite</option>
                  <option value="most_complete">Plus complete</option>
                  <option value="best_match">Correspond le mieux</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-700">Detail</div>
                <Textarea
                  className="mt-1 min-h-[90px]"
                  value={t.refComment}
                  onChange={(e) => t.setRefComment(e.target.value)}
                  placeholder="Ex : page plus nette, acte plus complet..."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={t.cancelSetReference} disabled={t.loading}>Annuler</Button>
                {t.referenceMode === 'edit' ? (
                  <>
                    <Button variant="outline" onClick={t.clearCurrentReference} disabled={t.loading || !t.referenceTargetSourceId}>
                      Retirer la reference
                    </Button>
                    <Button onClick={t.saveReferenceEdits} disabled={t.loading || !t.referenceTargetSourceId || !t.refReason || !t.refComment.trim()}>
                      Enregistrer
                    </Button>
                  </>
                ) : (
                  <Button onClick={t.confirmSetReference} disabled={t.loading || !t.referenceTargetSourceId || !t.refReason || !t.refComment.trim()}>
                    Definir comme reference
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* MARGINAL MENTIONS */}
          {t.sheetMode === 'marginal_mentions' && (
            <div className="space-y-4">
              <MarginalMentionList
                items={t.marginalMentions ?? []}
                disabled={t.loading || !t.workingVersion}
                mode={t.mmFormMode}
                onNew={() => t.startCreateMarginalMention?.()}
                onEdit={(row) => t.openEditMarginalMention?.(row)}
                onDelete={(id) => t.deleteMarginalMention?.(id)}
              />
              {t.mmFormMode !== 'idle' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <MarginalMentionFormSection t={t} />
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => t.cancelMarginalMentionForm?.()} disabled={t.loading}>Annuler</Button>
                    <Button onClick={() => t.saveMarginalMention?.()} disabled={t.loading || !t.workingVersion || !(t.mmContent ?? '').trim()}>
                      {t.mmFormMode === 'edit' ? 'Enregistrer' : 'Ajouter'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SIGNATURES */}
          {t.sheetMode === 'signatures' && (
            <div className="space-y-4">
              <SignatureList
                items={t.signatures ?? []}
                disabled={t.loading || !t.workingVersion}
                mode={t.sigFormMode}
                onNew={() => t.startCreateSignature?.()}
                onEdit={(row) => t.openEditSignature?.(row)}
                onDelete={(id) => t.deleteSignature?.(id)}
              />
              {t.sigFormMode !== 'idle' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <SignatureFormSection t={t} />
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => t.cancelSignatureForm?.()} disabled={t.loading}>Annuler</Button>
                    <Button onClick={() => t.saveSignature?.()} disabled={t.loading || !t.workingVersion || !(t.sigLabel ?? '').trim()}>
                      {t.sigFormMode === 'edit' ? 'Enregistrer' : 'Ajouter'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MARGINAL CROSSOUTS */}
          {t.sheetMode === 'marginal_crossouts' && (
            <div className="space-y-4">
              {(t.marginalCrossouts?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  {(t.marginalCrossouts ?? []).map((c: any) => (
                    <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">
                            {c.crossout_type ?? 'Rature'}{c.target ? ` · ${c.target}` : ''}
                          </div>
                          {(c.struck_text || c.replacement_text) && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                <div className="text-[11px] font-medium text-slate-600">Texte barre</div>
                                <div className="mt-1 text-xs">{c.struck_text ?? '—'}</div>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                <div className="text-[11px] font-medium text-slate-600">Remplacement</div>
                                <div className="mt-1 text-xs">{c.replacement_text ?? '—'}</div>
                              </div>
                            </div>
                          )}
                          {c.note && <div className="mt-2 text-xs text-slate-600">{c.note}</div>}
                        </div>
                        <div className="shrink-0 flex gap-2">
                          <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => t.openEditMarginalCrossout?.(c)} disabled={t.loading || !t.workingVersion}>Modifier</Button>
                          <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => t.deleteMarginalCrossout?.(c.id)} disabled={t.loading || !t.workingVersion}>Supprimer</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <MarginalCrossoutFormSection
                mcType={t.mcType}
                setMcType={(v) => t.setMcType?.(v)}
                mcTarget={t.mcTarget}
                setMcTarget={(v) => t.setMcTarget?.(v)}
                mcStruck={t.mcStruck}
                setMcStruck={(v) => t.setMcStruck?.(v)}
                mcReplacement={t.mcReplacement}
                setMcReplacement={(v) => t.setMcReplacement?.(v)}
                mcNote={t.mcNote}
                setMcNote={(v) => t.setMcNote?.(v)}
                loading={t.loading}
                disabled={!t.workingVersion}
                onCancel={() => t.cancelMarginalCrossoutEdit?.() ?? t.setSheetOpen(false)}
                onSave={() => t.saveMarginalCrossout?.()}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Right panel cards
// ---------------------------------------------------------------------------

function RepéragesCard({
  rep,
  t,
}: {
  rep: ReturnType<typeof detectActeReperages>;
  t: ReturnType<typeof useTranscriptionTab>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Reperages heuristiques</div>
        <Badge variant="secondary" className="text-[11px]">auto</Badge>
      </div>
      <div className="mt-3 space-y-3">
        <MiniHitRow title="Dates" hits={rep.dates} onPick={t.jumpToRange} />
        <MiniHitRow title="Ages" hits={rep.ages} onPick={t.jumpToRange} />
        <MiniHitRow title="Numeros" hits={rep.numeros} onPick={t.jumpToRange} />
        <MiniHitRow title="Majuscules" hits={rep.majuscules} onPick={t.jumpToRange} />
      </div>
      <div className="mt-2 text-xs text-slate-400">
        Reperages visuels uniquement — rien n&apos;est cree automatiquement.
      </div>
    </div>
  );
}

function AnnotationsCard({ t }: { t: ReturnType<typeof useTranscriptionTab> }) {
  const { annotations } = t;
  if (!annotations.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Annotations</div>
        <Badge variant="secondary">{annotations.length}</Badge>
      </div>
      <div className="mt-3 space-y-2">
        {(Object.keys(t.groupedAnnotations) as Array<keyof typeof t.groupedAnnotations>).map((k) => {
          const list = t.groupedAnnotations[k];
          if (!list.length) return null;
          return (
            <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-700">{typeLabel[k]}</div>
                <Badge variant="secondary" className="text-[10px]">{list.length}</Badge>
              </div>
              <div className="space-y-2">
                {list.map((a) => {
                  const effective = t.anchorStatusOverrides[a.id] ?? a.status;
                  return (
                    <div key={a.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <button type="button" onClick={() => t.jumpToRange(a.start_offset, a.end_offset)} className="text-left min-w-0">
                          <div className="text-xs text-slate-500">{a.start_offset}–{a.end_offset}</div>
                          <div className="text-xs text-slate-800 line-clamp-2 italic">&ldquo;{a.quote}&rdquo;</div>
                          {a.comment && <div className="mt-0.5 text-xs text-slate-600 line-clamp-1">{a.comment}</div>}
                        </button>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {anchorBadge(effective)}
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => t.openEditAnnotation(a)}><Pencil className="h-3 w-3" /></Button>
                            <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => t.removeAnnotation(a.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
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
    </div>
  );
}

function TagsCard({ t }: { t: ReturnType<typeof useTranscriptionTab> }) {
  const { tags } = t;
  if (!tags.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Tags</div>
        <Badge variant="secondary">{tags.length}</Badge>
      </div>
      <div className="mt-3 space-y-2">
        {tags.map((tRow) => (
          <div key={tRow.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => t.jumpToRange(tRow.start_offset, tRow.end_offset)} className="text-left min-w-0">
                <div className="flex items-center gap-2">
                  {tagBadge(tRow.kind)}
                  <span className="text-xs font-semibold text-slate-900 truncate">{tRow.label}</span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500 italic line-clamp-1">&ldquo;{tRow.quote}&rdquo;</div>
                {tRow.linked_acteur_id && (
                  <div className="mt-0.5 text-[11px] text-slate-400 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Lie a un acteur
                  </div>
                )}
              </button>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => t.removeTag(tRow.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesCard({ t }: { t: ReturnType<typeof useTranscriptionTab> }) {
  const visibleNotes = t.notes.filter(
    (n) => !n.content?.startsWith('[META]') && !n.content?.startsWith('[DIFF '),
  );
  if (!visibleNotes.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Notes</div>
        <Badge variant="secondary">{visibleNotes.length}</Badge>
      </div>
      <div className="mt-3 space-y-2">
        {visibleNotes.map((n) => (
          <div key={n.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => { if (n.start_offset != null && n.end_offset != null) t.jumpToRange(n.start_offset, n.end_offset); }} className="text-left min-w-0">
                {n.quote && <div className="text-[11px] text-slate-500 italic line-clamp-1 mb-0.5">&ldquo;{n.quote}&rdquo;</div>}
                <div className="text-xs text-slate-900 line-clamp-3">{n.content}</div>
              </button>
              <div className="shrink-0 flex gap-1">
                <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => t.openEditNote(n)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => t.removeNote(n.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PartSectionCard
// ---------------------------------------------------------------------------

function PartSectionCard({
  title, Icon, count, total, onAdd, onManage, disabled, present,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  count: number;
  total: number | null;
  onAdd: () => void;
  onManage: () => void;
  disabled: boolean;
  present?: boolean | null;
}) {
  if (present === false) return null;
  const notQualified = present === null;
  const addTitle = notQualified
    ? "A renseigner d'abord dans Reference archive"
    : 'Ajouter';
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white shrink-0">
            <Icon className="h-3.5 w-3.5 text-slate-700" />
          </span>
          {notQualified ? (
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900">{title}</div>
              <div className="mt-0.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 w-fit flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                A renseigner dans Reference archive
              </div>
            </div>
          ) : (
            <div className="min-w-0 w-full">
              <ProgressVerboseBar value={count} max={total ?? 0} label={`${count} / ${total ?? '—'} ${title}`} />
              {total !== null && total > 0 && count > total && (
                <div className="mt-1 text-[11px] text-red-700 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Incoherence : {count} releve(s), total attendu {total}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={onManage} disabled={disabled || notQualified} title="Voir / modifier">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-7 px-2 text-xs" onClick={onAdd} disabled={disabled || notQualified} title={addTitle}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MiniHitRow
// ---------------------------------------------------------------------------

function MiniHitRow({
  title, hits, onPick,
}: {
  title: string;
  hits: Array<{ label: string; start: number; end: number }>;
  onPick: (start: number, end: number) => void;
}) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 font-medium">{title}</div>
      {hits.length ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {hits.map((h, i) => (
            <button
              key={`${h.start}-${h.end}-${i}`}
              type="button"
              onClick={() => onPick(h.start, h.end)}
              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              {normalizeSpaces(h.label).slice(0, 32)}
              {normalizeSpaces(h.label).length > 32 ? '…' : ''}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-0.5 text-xs text-slate-400">—</div>
      )}
    </div>
  );
}



// ---------------------------------------------------------------------------
// VersionHistoryCard
// ---------------------------------------------------------------------------

function VersionHistoryCard({ t }: { t: ReturnType<typeof useTranscriptionTab> }) {
  const sourceVersions = t.workingVersion
    ? t.versions.filter((v) => v.transcription_id === t.workingVersion!.transcription_id)
    : [];

  if (sourceVersions.length <= 1) return null;

  const sorted = [...sourceVersions].sort(
    (a, b) => (b.version ?? 0) - (a.version ?? 0),
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Historique des versions</div>
        <Badge variant="secondary">{sourceVersions.length}</Badge>
      </div>

      <div className="mt-3 space-y-2">
        {sorted.map((v) => {
          const isCurrent = v.id === t.currentId;
          const isWorking = v.id === t.workingVersion?.id;
          return (
            <div
              key={v.id}
              className={[
                'rounded-xl border p-3 transition-colors',
                isCurrent
                  ? 'border-slate-900 bg-slate-900'
                  : 'border-slate-200 bg-white hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className={['text-xs font-semibold', isCurrent ? 'text-white' : 'text-slate-900'].join(' ')}>
                    v{v.version ?? '?'}
                    {isWorking && (
                      <span className={['ml-1.5 text-[10px] font-normal', isCurrent ? 'text-slate-300' : 'text-slate-500'].join(' ')}>
                        actuelle
                      </span>
                    )}
                  </div>
                  <div className={['text-[11px]', isCurrent ? 'text-slate-400' : 'text-slate-500'].join(' ')}>
                    {v.updated_at
                      ? new Date(v.updated_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill statut={v.status as any} />
                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs"
                      onClick={() => t.setCurrentId(v.id)}
                    >
                      Charger
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {t.versionEvents.length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Evenements recents
          </div>
          {t.versionEvents.slice(0, 5).map((ev) => (
            <div key={ev.id} className="text-[11px] text-slate-600 flex items-center justify-between gap-2">
              <span className="truncate">{ev.event_type.replace(/_/g, ' ')}</span>
              <span className="shrink-0 text-slate-400">
                {new Date(ev.event_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QualiteCard
// ---------------------------------------------------------------------------

function QualiteCard({
  draft,
  setDraft,
  onSave,
  disabled,
  loading,
}: {
  draft: QualiteDraft;
  setDraft: React.Dispatch<React.SetStateAction<QualiteDraft>>;
  onSave: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  const set = <K extends keyof QualiteDraft>(k: K, v: QualiteDraft[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Qualite de la transcription</div>
          <div className="mt-0.5 text-xs text-slate-500">Langue, ecriture, completude, reserves.</div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs gap-1.5 shrink-0"
          onClick={onSave}
          disabled={disabled || loading}
        >
          <Save className="h-3.5 w-3.5" />
          Enregistrer
        </Button>
      </div>

      <div>
        <div className="text-xs font-medium text-slate-700 mb-1">Support de lecture</div>
        <RefSinglePickerSmart
          table="ref_support_lecture"
          value={draft.source_lecture_kind_ref ?? null}
          onChange={(id) => set('source_lecture_kind_ref', id ?? null)}
          mode="edit"
          titleOverride="Support de lecture"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-medium text-slate-700 mb-1">Langue</div>
          <RefSinglePickerSmart
            table="ref_langues"
            value={draft.langue_ref ?? null}
            onChange={(id) => set('langue_ref', id ?? null)}
            mode="edit"
            titleOverride="Choisir la langue"
          />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-700 mb-1">Confiance</div>
          <RefSinglePickerSmart
            table="ref_confiance"
            value={draft.language_confidence_ref ?? null}
            onChange={(id) => set('language_confidence_ref', id ?? null)}
            mode="edit"
            titleOverride="Niveau de confiance"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-medium text-slate-700 mb-1">Style d&apos;ecriture</div>
          <RefSinglePickerSmart
            table="ref_handwriting_style"
            value={draft.handwriting_style_ref ?? null}
            onChange={(id) => set('handwriting_style_ref', id ?? null)}
            mode="edit"
            titleOverride="Style d'ecriture"
          />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-700 mb-1">Lisibilite</div>
          <RefSinglePickerSmart
            table="ref_handwriting_legibility"
            value={draft.handwriting_legibility_ref ?? null}
            onChange={(id) => set('handwriting_legibility_ref', id ?? null)}
            mode="edit"
            titleOverride="Niveau de lisibilite"
          />
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-slate-700 mb-1">Completude</div>
        <RefSinglePickerSmart
          table="ref_completude_transcription"
          value={draft.completeness_ref ?? null}
          onChange={(id) => set('completeness_ref', id ?? null)}
          mode="edit"
          titleOverride="Completude de la transcription"
        />
      </div>

      {draft.completeness_ref !== null && (
        <div>
          <div className="text-xs font-medium text-slate-700 mb-1">Raison</div>
          <Textarea
            className="min-h-[70px]"
            value={draft.incompleteness_reason ?? ''}
            onChange={(e) => set('incompleteness_reason', e.target.value || null)}
            placeholder="Ex : fin du document manquante, vues absentes..."
          />
        </div>
      )}

      <div>
        <div className="text-xs font-medium text-slate-700 mb-1">Reserves</div>
        <RefSinglePickerSmart
          table="ref_niveau_reserve"
          value={draft.reserve_level_ref ?? null}
          onChange={(id) => set('reserve_level_ref', id ?? null)}
          mode="edit"
          titleOverride="Niveau de reserve"
        />
      </div>

      {draft.reserve_level_ref !== null && (
        <div>
          <div className="text-xs font-medium text-slate-700 mb-1">Motif</div>
          <Textarea
            className="min-h-[70px]"
            value={draft.reserve_reason ?? ''}
            onChange={(e) => set('reserve_reason', e.target.value || null)}
            placeholder="Ex : doute paleographique, source secondaire..."
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldSelect
// ---------------------------------------------------------------------------

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-700 mb-1">{label}</div>
      <select
        className="w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">-- Non renseigne --</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RichText
// ---------------------------------------------------------------------------

function RichText({ text }: { text: string }) {
  const tokens = React.useMemo(() => tokenizeInline(text ?? ''), [text]);
  return (
    <span>
      {tokens.map((tok, i) => {
        if (tok.kind === 'text') return <React.Fragment key={i}>{tok.text}</React.Fragment>;
        if (tok.kind === 'bold') return <strong key={i}>{tok.text}</strong>;
        if (tok.kind === 'strike') return <s key={i}>{tok.text}</s>;
        if (tok.kind === 'illisible') {
          const label = `illisible · ${tok.x} car. · ${tok.y} mot(s) · ${tok.z} ligne(s)`;
          return (
            <span key={i} title={tok.raw} className="mx-0.5 inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-900">
              {label}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}
