// TranscriptionTab.tsx

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
import { TranscriptionWorkflowStepper } from './TranscriptionWorkflowStepper';
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
  Plus,
  Save,
  Tags,
  SeparatorHorizontal,
  Eye,
  Pencil,
  Trash2,
  GripVertical,
  Star,
  Circle,
  Lock,
  Unlock,
  ChevronDown,
  AlignLeft,
  HelpCircle,
  LayoutGrid,
  Strikethrough,
  PenLine,
  Signature,
  Scissors,
  AlertTriangle,
} from 'lucide-react';

import { anchorBadge, STEPPER_COPY, tagBadge, typeLabel } from './transcriptionTab.ui';

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

type Props = {
  acteId: string;
  onGoToTab?: (tabLabel: string) => void;
};

type SourceDashboardRow = {
  id: string;
  label: string;

  isPreferred: boolean;
  status: string;

  latestVersionId: string | null; // “active transcription” for that source
  usedInWorkingVersion: boolean; // for info only
};

type IconComp = React.ComponentType<{ className?: string }>;

type CitationTotals = {
  marginalMentionsTotal: number | null;
  signaturesTotal: number | null;
  marginalCrossoutsTotal: number | null;
};

export default function TranscriptionTab({ acteId }: Props) {
  // ---------------------------------------------------------------------------
  // Hook + shortcuts
  // ---------------------------------------------------------------------------
  const t = useTranscriptionTab({ acteId });

  const sources = t.sources;
  const versions = t.versions;
  const annotations = t.annotations;
  const notes = t.notes;
  const tags = t.tags;

  // ---------------------------------------------------------------------------
  // Local UI state
  // ---------------------------------------------------------------------------
  const [readGrouped, setReadGrouped] = useState(true); // lecture: blocs vs brut

  // Workflow stepper UI-only states
  const [wfMetaDraft, setWfMetaDraft] = useState({
    visibility: 'private',
    state: 'active',

    source_lecture_kind: 'image_originale',

    scope: 'full_acte',
    scope_details: null,

    langue_vue: null,
    language_confidence: null,

    handwriting_style: null,
    handwriting_legibility: null,

    goal: null,

    normalisation_policy_raw: '{}', // JSON string

    conventions_id: null,
    conventions_override_text: null,

    completeness: 'complete',
    incompleteness_reason: null,

    reserve_level: 'none',
    reserve_reason: null,

    source_page_from: null,
    source_page_to: null,

    image_transform_notes: null,
    note: null,
  });

  const [wfChecklist, setWfChecklist] = useState({
    majuscules: false,
    ponctuation: false,
    grammaire: false,
    orthographe_noms: false,
    orthographe_lieux: false,
    format_dates: false,
    autres: false,
  });

  // Lock state (only when "lockable" statuses)
  const [textareaLocked, setTextareaLocked] = useState(false);

  // ---------------------------------------------------------------------------
  // Derived data: read/repérages
  // ---------------------------------------------------------------------------
  const onMouseDownDivider = (e: React.MouseEvent) => t.split.onMouseDownDivider(e);

  const readableBlocks = useMemo(
    () => splitIntoReadableBlocks(t.editorValue, { typeActe: (t.acte as any)?.type_acte ?? null }),
    [t.editorValue, (t.acte as any)?.type_acte],
  );

  const rep = useMemo(() => detectActeReperages(t.editorValue), [t.editorValue]);

  // ---------------------------------------------------------------------------
  // Dashboard rows (sources)
  // ---------------------------------------------------------------------------
  const dashboard = useMemo<SourceDashboardRow[]>(() => {
    const preferredSourceId = (t.preferredSourceId as string | null) ?? null;

    return (sources ?? []).map((s: any) => {
      const latestVersionId = t.getLatestVersionIdForSource(s.id) ?? null;

      // label simple
      const uniteTitre = s.exemplaire?.unite_titre ?? 'Source';
      const inst =
        s.exemplaire?.institution_sigle ??
        (s.exemplaire?.depot_is_online || s.exemplaire?.depot_is_physical) ??
        null;
      const vuesPages =
        s.loc_raw ||
        (s.loc_start || s.loc_end
          ? `Vues ${s.loc_start ?? '?'}–${s.loc_end ?? '?'}`
          : '');
      const label = [uniteTitre, inst, vuesPages].filter(Boolean).join(' · ');
      const usedInWorkingVersion = t.activeSourceId === s.id;

      // ✅ transcription de la source = transcriptionByKey (part main_body)
      const tr = t.transcriptionByKey?.[transcriptionKey(s.id, 'main_body')] ?? null;
      const status = (tr?.status ?? 'TO_TRANSCRIBE') as string;

      return {
        id: s.id,
        label,
        isPreferred: !!preferredSourceId && preferredSourceId === s.id,
        status,
        latestVersionId,
        usedInWorkingVersion,
      };
    });
  }, [sources, t.preferredSourceId, t.activeSourceId, t.transcriptionByKey, t.versions]);

  const activeSourceRow = useMemo(() => {
    if (!t.activeSourceId) return null;
    return dashboard.find((d) => d.id === t.activeSourceId) ?? null;
  }, [dashboard, t.activeSourceId]);

  const activeLatestVersionId = t.activeSourceId
    ? t.getLatestVersionIdForSource(t.activeSourceId)
    : null;

  // Working version = latest version of active source (source-first),
  // otherwise fallback to currentVersion (legacy)
  const workingVersion = useMemo(() => {
    if (activeSourceRow?.latestVersionId) {
      return versions.find((v) => v.id === activeSourceRow.latestVersionId) ?? null;
    }
    return t.currentVersion ?? null;
  }, [activeSourceRow?.latestVersionId, versions, t.currentVersion]);

  // ---------------------------------------------------------------------------
  // Stepper state
  // ---------------------------------------------------------------------------
  const isFinalized =
    (workingVersion?.status === 'IN_REVIEW' || workingVersion?.status === 'VALIDATED') ?? false;

  const step: 1 | 2 | 3 | 4 = !t.activeSourceId
    ? 1
    : !activeLatestVersionId
      ? 2
      : isFinalized
        ? 4
        : 3;

  // ✅ Sources accordion hooks MUST be before any early return
  const [sourcesExpanded, setSourcesExpanded] = useState(step === 1);

  React.useEffect(() => {
    // règle demandée : replié si step ≠ 1
    setSourcesExpanded(step === 1);
  }, [step]);

  const toggleSourcesExpanded = () => {
    setSourcesExpanded((v) => !v);
  };

  // ---------------------------------------------------------------------------
  // Loading (after hooks!)
  // ---------------------------------------------------------------------------
  const showLoading = t.loading && !workingVersion && versions.length === 0;

  // ---------------------------------------------------------------------------
  // Locking rules (cadenas uniquement pour certains statuts)
  // ---------------------------------------------------------------------------
  const lockableStatuses = new Set(['TRANSCRIBED', 'IN_REVIEW', 'VALIDATED']);
  const isLockable = lockableStatuses.has((workingVersion?.status ?? '') as string);

  React.useEffect(() => {
    // Auto-lock uniquement quand la version est "verrouillable"
    if (isLockable) setTextareaLocked(true);
  }, [isLockable]);

  const textareaDisabled =
    step === 1 || (isLockable && textareaLocked) || t.dirtyState === 'saving';

  // ---------------------------------------------------------------------------
  // Active citation + totals
  // ---------------------------------------------------------------------------
  function normalizeTotal(present: boolean | null | undefined, count: number | null | undefined) {
    // si present est explicitement false => 0
    if (present === false) return 0;
    // si present est true => on prend count (ou 0 si null)
    if (present === true) return count ?? 0;
    // si present est null/undefined => on ne sait pas => null (indéterminé)
    if (count == null) return null;
    return count; // fallback si tu as un count sans present
  }

  const activeCitation = useMemo(() => {
    if (!t.activeSourceId) return null;
    return (sources ?? []).find((x: any) => x.id === t.activeSourceId) ?? null;
  }, [sources, t.activeSourceId]);

  const citationTotals = useMemo<CitationTotals>(() => {
    if (!activeCitation) {
      return {
        marginalMentionsTotal: null,
        signaturesTotal: null,
        marginalCrossoutsTotal: null,
      };
    }

    return {
      marginalMentionsTotal: normalizeTotal(
        activeCitation.marginal_mentions_present,
        activeCitation.marginal_mentions_count,
      ),
      signaturesTotal: normalizeTotal(
        activeCitation.signatures_present,
        activeCitation.signatures_count,
      ),
      marginalCrossoutsTotal: normalizeTotal(
        activeCitation.marginal_crossouts_present,
        activeCitation.marginal_crossouts_count,
      ),
    };
  }, [activeCitation]);

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------
  function sourcesLabel(count: number) {
    if (count <= 1) return '1 source';
    return `${count} sources`;
  }

  const StepItem = ({
    idx,
    title,
    subtitle,
    active,
    done,
    Icon,
  }: {
    idx: 1 | 2 | 3 | 4;
    title: string;
    subtitle: string;
    active: boolean;
    done: boolean;
    Icon: IconComp;
  }) => {
    return (
      <div className='flex items-start gap-3'>
        <div
          className={[
            'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border',
            done
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : active
                ? 'border-slate-300 bg-white text-slate-900'
                : 'border-slate-200 bg-slate-50 text-slate-500',
          ].join(' ')}
        >
          {done ? <CheckCircle2 className='h-4 w-4' /> : <Icon className='h-4 w-4' />}
        </div>

        <div className='min-w-0'>
          <div
            className={['text-sm font-semibold', active ? 'text-slate-900' : 'text-slate-700'].join(
              ' ',
            )}
          >
            {idx}. {title}
          </div>
          <div className='text-xs text-slate-600'>{subtitle}</div>
        </div>
      </div>
    );
  };

  if (showLoading) {
    return <div className='p-4 text-sm text-slate-600'>Chargement…</div>;
  }
  return (
    <div className='p-4 space-y-4'>
      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
        <div className='flex items-start justify-between gap-4'>
          {/* Stepper */}
          <div className='min-w-0 flex-1'>
            <div className='mt-3 grid gap-3 sm:grid-cols-4'>
              <StepItem
                idx={1}
                title={STEPPER_COPY[1].title}
                subtitle={STEPPER_COPY[1].subtitle}
                active={step === 1}
                done={step > 1}
                Icon={Circle}
              />

              <StepItem
                idx={2}
                title={STEPPER_COPY[2].title}
                subtitle={STEPPER_COPY[2].subtitle}
                active={step === 2}
                done={step > 2}
                Icon={FileText}
              />

              <StepItem
                idx={3}
                title={STEPPER_COPY[3].title}
                subtitle={STEPPER_COPY[3].subtitle}
                active={step === 3}
                done={step > 3}
                Icon={Tags}
              />

              <StepItem
                idx={4}
                title={STEPPER_COPY[4].title}
                subtitle={STEPPER_COPY[4].subtitle}
                active={step === 4}
                done={false}
                Icon={Pencil}
              />
            </div>

            {step === 1 ? (
              <div className='mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>
                Choisis une source à droite pour commencer. Le champ de transcription est désactivé
                tant que la source n’est pas sélectionnée.
              </div>
            ) : null}

            {step === 2 ? (
              <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700'>
                Cette source n’a pas encore de transcription. Commence à saisir le texte : un
                brouillon sera créé automatiquement après une courte pause.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Split layout */}
      <div
        id='transcription-split-root'
        className='grid gap-0'
        style={{
          gridTemplateColumns: `minmax(360px, ${t.split.leftPct}%) 12px minmax(320px, ${100 - t.split.leftPct}%)`,
        }}
      >
        {/* Left: editor */}
        <div className='pr-2'>
          <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
            <div className='flex flex-col gap-2'>
              {/* Ligne 1 */}
              <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-2 shrink-0'>
                  {/* Toggle edit/read */}
                  <div className='inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1'>
                    <button
                      type='button'
                      onClick={() => t.setTextMode('edit')}
                      className={[
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                        t.textMode === 'edit'
                          ? 'bg-white shadow-sm text-slate-900'
                          : 'text-slate-600',
                      ].join(' ')}
                    >
                      <Pencil className='h-3.5 w-3.5' />
                      Édition
                    </button>
                    <button
                      type='button'
                      onClick={() => t.setTextMode('read')}
                      className={[
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                        t.textMode === 'read'
                          ? 'bg-white shadow-sm text-slate-900'
                          : 'text-slate-600',
                      ].join(' ')}
                    >
                      <Eye className='h-3.5 w-3.5' />
                      Lecture
                    </button>
                  </div>

                  {/* Status */}
                  <StatusPill statut={(workingVersion?.status as any) || 'TO_TRANSCRIBE'} />

                  {/* Lock uniquement si finalisé + mode edit */}
                  {isLockable && t.textMode === 'edit' && step !== 1 && (
                    <button
                      type='button'
                      onClick={() => setTextareaLocked((v) => !v)}
                      className={[
                        'inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm',
                        textareaLocked
                          ? 'border-slate-200 bg-white hover:bg-slate-50'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
                      ].join(' ')}
                      title={
                        textareaLocked
                          ? 'Déverrouiller l’édition (attention : version finalisée)'
                          : 'Verrouiller l’édition'
                      }
                    >
                      {textareaLocked ? (
                        <Lock className='h-4 w-4 text-slate-700' />
                      ) : (
                        <Unlock className='h-4 w-4 text-slate-800' />
                      )}
                    </button>
                  )}
                </div>

                <div className='flex items-center gap-2 min-w-0'>
                  {t.textMode === 'edit' ? (
                    <>
                      <span className='text-xs text-slate-500'>{t.dirtyLabel || ''}</span>

                      {activeSourceRow?.isPreferred ? (
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            t.togglePreferred(activeSourceRow.id);
                          }}
                          title='Transcription de référence (modifier / retirer)'
                          className='inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50'
                        >
                          <Star className='h-4 w-4 text-amber-500 fill-amber-500' />
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span className='text-xs text-slate-600'>
                        {workingVersion?.status == 'TRANSCRIBED'
                          ? 'Marqué comme transcrit'
                          : 'Dernière modification'}{' '}
                        le :{' '}
                        <span className='font-medium'>
                          {workingVersion?.updated_at
                            ? new Date(workingVersion.updated_at).toLocaleString()
                            : '—'}
                        </span>
                      </span>

                      {activeSourceRow?.isPreferred ? (
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            t.togglePreferred(activeSourceRow.id);
                          }}
                          title='Transcription de référence (modifier / retirer)'
                          className='inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50'
                        >
                          <Star className='h-4 w-4 text-amber-500 fill-amber-500' />
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              {/* Ligne 2 */}
              {t.textMode === 'edit' ? (
                <div className='flex items-center justify-between gap-2'>
                  {/* Gauche : tokens */}
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-xs gap-2'
                      onClick={t.insertPageBreak}
                      disabled={textareaDisabled || !workingVersion || t.loading}
                    >
                      <SeparatorHorizontal className='w-4 h-4' />
                      Saut de page
                    </Button>

                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-xs gap-2'
                      onClick={t.openIllisibleDialog}
                      disabled={textareaDisabled || !workingVersion || t.loading}
                      title='Insérer le token [illisible]'
                    >
                      <HelpCircle className='w-4 h-4' />
                      Illisible
                    </Button>

                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-xs gap-2'
                      onClick={t.wrapStrike}
                      disabled={textareaDisabled || !workingVersion || t.loading}
                      title='Barrer (~...~)'
                    >
                      <Strikethrough className='w-4 h-4' />
                      Barré
                    </Button>

                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-xs gap-2'
                      onClick={t.wrapBold}
                      disabled={textareaDisabled || !workingVersion || t.loading}
                      title='Mettre en gras (*...*)'
                    >
                      <span className='font-bold text-xs'>G</span>
                      Gras
                    </Button>
                  </div>

                  {/* Droite : actions */}
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-xs gap-2'
                      onClick={t.openAddAnnotation}
                      disabled={textareaDisabled || !workingVersion || t.loading}
                    >
                      <Plus className='w-4 h-4' /> Annotation
                    </Button>

                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-xs gap-2'
                      onClick={t.openAddNote}
                      disabled={textareaDisabled || !workingVersion || t.loading}
                    >
                      <Plus className='w-4 h-4' /> Note
                    </Button>

                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-xs gap-2'
                      onClick={t.openTagPassage}
                      disabled={textareaDisabled || !workingVersion || t.loading}
                    >
                      <Tags className='w-4 h-4' /> Tags
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='flex items-center justify-between gap-2'>
                  {/* Gauche : annotation/note/tags */}
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-xs gap-2'
                      onClick={t.openAddAnnotation}
                      disabled={!workingVersion || t.loading}
                    >
                      <Plus className='w-4 h-4' /> Annotation
                    </Button>

                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-xs gap-2'
                      onClick={t.openAddNote}
                      disabled={!workingVersion || t.loading}
                    >
                      <Plus className='w-4 h-4' /> Note
                    </Button>

                    <Button
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-xs gap-2'
                      onClick={t.openTagPassage}
                      disabled={!workingVersion || t.loading}
                    >
                      <Tags className='w-4 h-4' /> Tags
                    </Button>
                  </div>

                  {/* Droite : groupage par bloc */}
                  <div className='inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1'>
                    <button
                      type='button'
                      onClick={() => setReadGrouped(true)}
                      className={[
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                        readGrouped ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600',
                      ].join(' ')}
                      title='Afficher par blocs'
                    >
                      <LayoutGrid className='h-3.5 w-3.5' />
                      Blocs
                    </button>
                    <button
                      type='button'
                      onClick={() => setReadGrouped(false)}
                      className={[
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                        !readGrouped ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600',
                      ].join(' ')}
                      title='Afficher en texte brut'
                    >
                      <AlignLeft className='h-3.5 w-3.5' />
                      Brut
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className='mt-3'>
              {t.textMode === 'edit' ? (
                <>
                  <textarea
                    disabled={textareaDisabled}
                    ref={t.textareaRef}
                    value={t.editorValue}
                    onChange={(e) => t.onChangeEditor(e.target.value)}
                    onMouseUp={t.captureSelection}
                    onKeyUp={t.captureSelection}
                    placeholder={`Transcrivez ici le texte… (ex : [illisible], [barré], [lacune], [ajout en marge], ${PAGE_BREAK_TOKEN} = saut de page)`}
                    className={[
                      'min-h-[520px] w-full resize-y rounded-xl border px-3 py-3 text-sm leading-relaxed shadow-sm outline-none',
                      textareaDisabled
                        ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                        : 'border-slate-200 bg-white text-slate-900 focus:border-slate-400',
                    ].join(' ')}
                  />
                  <div className='mt-3 w-fit'>
                    <Button
                      onClick={t.saveNewVersionForActiveSource}
                      disabled={t.loading || step !== 3 || t.dirtyState !== 'editing'}
                      className='w-full gap-2'
                      title='Enregistrer : crée une nouvelle version'
                    >
                      <Save className='h-4 w-4' />
                      Enregistrer
                    </Button>
                  </div>

                  <div className='mt-2 flex items-center justify-between text-xs text-slate-500'>
                    <div>
                      {t.selection ? (
                        <span>
                          Sélection : {t.selection.start}–{t.selection.end} (
                          {t.selection.end - t.selection.start} caractères)
                        </span>
                      ) : (
                        <span>Sélectionnez un passage pour créer une annotation / tag ancré.</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className='min-h-[520px] w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed text-slate-900 shadow-sm'>
                  {readGrouped ? (
                    <div className='space-y-3'>
                      {readableBlocks.map((b, idx) => {
                        if (b.kind === 'page_break') {
                          return (
                            <div key={`pb-${idx}`} className='my-4'>
                              <div className='flex items-center gap-3'>
                                <div className='h-px flex-1 bg-slate-200' />
                                <div className='text-xs text-slate-500'>Saut de page</div>
                                <div className='h-px flex-1 bg-slate-200' />
                              </div>
                            </div>
                          );
                        }
                        if (b.kind === 'section') {
                          return (
                            <div
                              key={`sec-${idx}`}
                              className='rounded-xl border border-slate-200 bg-slate-50 p-3'
                            >
                              <div className='text-xs font-semibold text-slate-700'>{b.label}</div>
                              <div className='mt-1 whitespace-pre-wrap text-slate-900'>
                                <RichText text={b.text} />
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={`p-${idx}`}
                            className='rounded-xl border border-slate-200 bg-slate-50 p-3'
                          >
                            <div className='text-xs font-semibold text-slate-700'>
                              {(b as any).label ?? 'Texte'}
                            </div>
                            <div className='mt-1 whitespace-pre-wrap text-slate-900'>
                              <RichText text={b.text} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className='whitespace-pre-wrap text-slate-900'>
                      <RichText text={t.editorValue?.trim() ? t.editorValue : ''} />
                    </div>
                  )}
                </div>
              )}
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
              {/* ✅ Sources dashboard (FIRST) */}
              <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
                <div className='flex items-center justify-between'>
                  {/* Titre à gauche */}
                  <div className='text-sm font-semibold text-slate-900'>Sources</div>

                  {/* Bouton déplier / replier à droite */}
                  {step !== 1 && dashboard.length > 1 && (
                    <button
                      type='button'
                      onClick={toggleSourcesExpanded}
                      className={[
                        'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                        'border-slate-200 bg-white text-slate-700',
                        'hover:bg-slate-50 hover:text-slate-900',
                      ].join(' ')}
                      title={
                        sourcesExpanded
                          ? 'Replier la liste des sources'
                          : 'Déplier la liste des sources'
                      }
                    >
                      <span>
                        {sourcesExpanded
                          ? `Masquer ${sourcesLabel(dashboard.length)}`
                          : `Afficher ${sourcesLabel(dashboard.length)}`}
                      </span>

                      <ChevronDown
                        className={[
                          'h-4 w-4 transition-transform duration-200',
                          sourcesExpanded ? 'rotate-180' : 'rotate-0',
                        ].join(' ')}
                      />
                    </button>
                  )}
                </div>

                {/* ✅ description : pas de conditionnel, on anime */}
                <div
                  className={[
                    'overflow-hidden transition-all duration-200',
                    sourcesExpanded ? 'max-h-16 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0',
                  ].join(' ')}
                >
                  <p className='text-xs text-slate-600'>
                    Chaque source a une transcription active (la dernière version liée). Le diff
                    compare les transcriptions actives.
                  </p>
                </div>

                <div className='mt-3 space-y-2'>
                  {dashboard.length === 0 ? (
                    <div className='text-sm text-slate-600'>
                      Aucune source enregistrée pour cet acte.
                    </div>
                  ) : (
                    dashboard.map((d) => {
                      const g = sources.find((x: any) => x.id === d.id) as any; // récupère l’objet enrichi
                      const isActive = d.id === t.activeSourceId;

                      const m = g?.exemplaire ?? null;
                      const online = m?.depot_is_online;
                      const uniteTitre = m?.unite_titre ?? 'Source';
                      const institutionSigle =
                        m?.institution_sigle ??
                        (m?.depot_is_physical || m?.depot_is_online) ??
                        null;
                      const uniteCote = m?.cote_locale ?? null;

                      const signatures_label = g?.signatures_present
                        ? 'avec signatures manuscrites'
                        : null;
                      const marginal_mentions_label = g?.marginal_mentions_present
                        ? 'avec mentions marginales'
                        : null;

                      const vuesPages =
                        g?.loc_raw ||
                        (g?.loc_start || g?.loc_end
                          ? `Vues ${g?.loc_start ?? '?'}–${g?.loc_end ?? '?'}`
                          : '');

                      const lineParts = [
                        uniteCote ? uniteCote : null,
                        vuesPages ? vuesPages : null,
                        g?.is_missing ? 'Acte manquant' : null,
                        signatures_label,
                        marginal_mentions_label,
                      ].filter(Boolean);

                      const line = lineParts.join(' · ');
                      const isPreferred = d.id === t.preferredSourceId;

                      const pick = () => t.selectSource(d.id);

                      return (
                        <div
                          key={d.id}
                          className={[
                            // base card
                            'w-full rounded-xl border p-3 text-left',
                            // état actif/inactif
                            isActive
                              ? 'border-slate-900/20 bg-slate-50 shadow-sm ring-2 ring-slate-900/10'
                              : 'border-slate-200 bg-white hover:bg-slate-50',
                            // ✅ animation replié/déplié sans retirer du DOM
                            'transition-all duration-200',
                            !sourcesExpanded && !isActive
                              ? 'max-h-0 opacity-0 py-0 border-transparent pointer-events-none overflow-hidden'
                              : 'max-h-[220px] opacity-100',
                          ].join(' ')}
                        >
                          <div className='flex items-start justify-between gap-3'>
                            <button
                              type='button'
                              onClick={pick}
                              className='min-w-0 flex-1 text-left'
                              title={d.label}
                            >
                              <div className='grid grid-cols-12 gap-x-2 gap-y-1'>
                                <div className='col-span-12 min-w-0'>
                                  <span className='block truncate text-sm font-semibold text-slate-900'>
                                    {uniteTitre}
                                  </span>
                                </div>

                                <div className='col-span-12 flex flex-wrap items-center gap-2'>
                                  {institutionSigle ? (
                                    <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
                                      {institutionSigle}
                                    </span>
                                  ) : null}

                                  {online ? (
                                    <span className='rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800'>
                                      En ligne
                                    </span>
                                  ) : (
                                    <span className='rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800'>
                                      Sur place
                                    </span>
                                  )}

                                  <StatusPill statut={d.status || 'TO_TRANSCRIBE'} />
                                </div>
                              </div>

                              {line ? (
                                <div className='mt-1 text-xs text-slate-600'>{line}</div>
                              ) : null}
                            </button>

                            <div className='shrink-0 flex flex-col items-end gap-2'>
                              <button
                                type='button'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  t.togglePreferred(d.id);
                                }}
                                title={
                                  isPreferred
                                    ? 'Transcription de référence'
                                    : 'Définir comme référence'
                                }
                                className='inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50'
                              >
                                <Star
                                  className={[
                                    'h-4 w-4 transition-colors',
                                    isPreferred
                                      ? 'text-amber-500 fill-amber-500'
                                      : 'text-slate-400 hover:text-amber-500',
                                  ].join(' ')}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ✅ Zones : mentions/signatures/ratures */}
              {step !== 1 && (
                <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'>
                  <div className='text-sm font-semibold text-slate-900'>Zones spécifiques</div>

                  <PartSectionCard
                    title='Mentions marginales'
                    Icon={PenLine}
                    count={(t.marginalMentions?.length ?? 0) as number}
                    total={citationTotals.marginalMentionsTotal ?? 0}
                    onAdd={() => t.openAddMarginalMention?.()}
                    onManage={() => t.openManageMarginalMentions?.()}
                    disabled={t.loading || !workingVersion}
                    present={activeCitation?.marginal_mentions_present}
                  />

                  <PartSectionCard
                    title='Signatures'
                    Icon={Signature}
                    count={(t.signatures?.length ?? 0) as number}
                    total={citationTotals.signaturesTotal ?? 0}
                    onAdd={() => t.openAddSignature?.()}
                    onManage={() => t.openManageSignatures?.()}
                    disabled={t.loading || !workingVersion}
                    present={activeCitation?.signatures_present}
                  />

                  <PartSectionCard
                    title='Ratures marginales'
                    Icon={Scissors}
                    count={(t.marginalCrossouts?.length ?? 0) as number}
                    total={citationTotals.marginalCrossoutsTotal ?? 0}
                    onAdd={() => t.openAddMarginalCrossout?.()}
                    onManage={() => t.openManageMarginalCrossouts?.()}
                    disabled={t.loading || !workingVersion}
                    present={activeCitation?.marginal_crossouts_present}
                  />
                </div>
              )}

              {/* Workflow stepper */}
              {step !== 1 && (
                <TranscriptionWorkflowStepper
                  disabled={t.loading || !workingVersion}
                  metaDraft={wfMetaDraft as any}
                  setMetaDraft={setWfMetaDraft as any}
                  checklist={wfChecklist as any}
                  setChecklist={setWfChecklist as any}
                  onSaveMetadata={() =>
                    t.saveWorkflowMetadata(wfMetaDraft as any, wfChecklist as any)
                  }
                  onMarkAsTranscribed={t.markAsTranscribed}
                  canSaveMetadata={true}
                  canMarkAsTranscribed={!!(t.editorValue ?? '').trim() && !t.loading}
                  historyEvents={t.versionEvents as any}
                />
              )}

              {/* Repérages */}
              {step !== 1 && (
                <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm font-semibold text-slate-900'>Repérages</div>
                    <Badge variant='secondary'>heuristique</Badge>
                  </div>

                  <div className='mt-3 space-y-3'>
                    <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                      <div className='text-xs font-semibold text-slate-700'>Dans le texte</div>

                      <div className='mt-2 space-y-3'>
                        <MiniHitRow
                          title='Dates'
                          hits={rep.dates}
                          onPick={(a, b) => t.jumpToRange(a, b)}
                        />
                        <MiniHitRow
                          title='Âges'
                          hits={rep.ages}
                          onPick={(a, b) => t.jumpToRange(a, b)}
                        />
                        <MiniHitRow
                          title='Numéros'
                          hits={rep.numeros}
                          onPick={(a, b) => t.jumpToRange(a, b)}
                        />
                        <MiniHitRow
                          title='Majuscules'
                          hits={rep.majuscules}
                          onPick={(a, b) => t.jumpToRange(a, b)}
                        />
                      </div>

                      <div className='mt-2 text-xs text-slate-500'>
                        Repérages visuels : rien n’est créé automatiquement.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {step !== 1 && (
                <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm font-semibold text-slate-900'>Tags</div>
                    <Badge variant='secondary'>{tags.length}</Badge>
                  </div>

                  <div className='mt-3 space-y-2'>
                    {tags.length === 0 && <div className='text-sm text-slate-600'>Aucun tag.</div>}

                    {tags.map((tRow) => (
                      <div
                        key={tRow.id}
                        className='rounded-xl border border-slate-200 bg-slate-50 p-3'
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <div className='flex items-center gap-2'>
                              {tagBadge(tRow.kind)}
                              <div className='text-sm font-semibold text-slate-900 truncate'>
                                {tRow.label}
                              </div>
                            </div>
                            <div className='mt-1 text-xs text-slate-600'>
                              {tRow.start_offset}–{tRow.end_offset}
                              {tRow.linked_acteur_id ? (
                                <>
                                  {' '}
                                  · <span className='font-medium'>lié à un acteur</span>
                                </>
                              ) : null}
                            </div>
                            <div className='mt-1 text-sm text-slate-800 line-clamp-2'>
                              “{tRow.quote}”
                            </div>
                          </div>

                          <div className='flex items-center gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => t.jumpToRange(tRow.start_offset, tRow.end_offset)}
                            >
                              Voir
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => t.removeTag(tRow.id)}
                              className='gap-1'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Annotations */}
              {step !== 1 && (
                <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm font-semibold text-slate-900'>Annotations</div>
                    <Badge variant='secondary'>{annotations.length}</Badge>
                  </div>

                  <div className='mt-3 space-y-3'>
                    {annotations.length === 0 && (
                      <div className='text-sm text-slate-600'>Aucune annotation.</div>
                    )}

                    {(
                      Object.keys(t.groupedAnnotations) as Array<keyof typeof t.groupedAnnotations>
                    ).map((k) => {
                      const list = t.groupedAnnotations[k];
                      if (!list.length) return null;

                      return (
                        <div key={k} className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                          <div className='flex items-center justify-between'>
                            <div className='text-xs font-semibold text-slate-700'>
                              {typeLabel[k]}
                            </div>
                            <Badge variant='secondary'>{list.length}</Badge>
                          </div>

                          <div className='mt-2 space-y-2'>
                            {list.map((a) => {
                              const effective = t.anchorStatusOverrides[a.id] ?? a.status;
                              return (
                                <div
                                  key={a.id}
                                  className='rounded-xl border border-slate-200 bg-white px-3 py-2'
                                >
                                  <div className='flex items-start justify-between gap-2'>
                                    <button
                                      type='button'
                                      onClick={() => t.jumpToRange(a.start_offset, a.end_offset)}
                                      className='text-left min-w-0'
                                    >
                                      <div className='text-xs font-semibold text-slate-900'>
                                        {a.type} · {a.start_offset}–{a.end_offset}
                                      </div>
                                      <div className='mt-1 text-sm text-slate-800 line-clamp-2'>
                                        “{a.quote}”
                                      </div>
                                      {a.comment ? (
                                        <div className='mt-1 text-xs text-slate-600 line-clamp-2'>
                                          {a.comment}
                                        </div>
                                      ) : null}
                                    </button>

                                    <div className='shrink-0 flex flex-col items-end gap-2'>
                                      {anchorBadge(effective)}
                                      <div className='flex gap-2'>
                                        <Button
                                          variant='outline'
                                          size='sm'
                                          onClick={() => t.openEditAnnotation(a)}
                                          className='gap-1'
                                        >
                                          <Pencil className='h-4 w-4' />
                                        </Button>
                                        <Button
                                          variant='outline'
                                          size='sm'
                                          onClick={() => t.removeAnnotation(a.id)}
                                          className='gap-1'
                                        >
                                          <Trash2 className='h-4 w-4' />
                                        </Button>
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
              )}

              {/* Notes */}
              {step !== 1 && (
                <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm font-semibold text-slate-900'>Notes</div>
                    <Badge variant='secondary'>
                      {notes.filter((n) => !n.content?.startsWith('[META]')).length}
                    </Badge>
                  </div>

                  <div className='mt-3 space-y-2'>
                    {notes.filter(
                      (n) => !n.content?.startsWith('[META]') && !n.content?.startsWith('[DIFF '),
                    ).length === 0 && (
                      <div className='text-sm text-slate-600'>Aucune note (hors méta/diff).</div>
                    )}

                    {notes
                      .filter(
                        (n) => !n.content?.startsWith('[META]') && !n.content?.startsWith('[DIFF '),
                      )
                      .map((n) => (
                        <div
                          key={n.id}
                          className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'
                        >
                          <div className='flex items-start justify-between gap-3'>
                            <button
                              type='button'
                              onClick={() => {
                                if (n.start_offset != null && n.end_offset != null)
                                  t.jumpToRange(n.start_offset, n.end_offset);
                              }}
                              className='text-left min-w-0'
                            >
                              {n.quote ? (
                                <div className='text-xs text-slate-600 line-clamp-1'>
                                  Ancrée : “{n.quote}”
                                </div>
                              ) : null}
                              <div className='mt-1 text-sm text-slate-900 line-clamp-3'>
                                {n.content}
                              </div>
                            </button>

                            <div className='shrink-0 flex gap-2'>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => t.openEditNote(n)}
                                className='gap-1'
                              >
                                <Pencil className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => t.removeNote(n.id)}
                                className='gap-1'
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sheet */}
      <Sheet open={t.sheetOpen} onOpenChange={t.setSheetOpen}>
        <SheetContent side='right' className='!w-[50vw] !max-w-none p-0 flex flex-col max-h-screen'>
          <SheetHeader className='p-4 border-b'>
            <SheetTitle>
              {t.sheetMode === 'annotation'
                ? t.editingAnnotationId
                  ? 'Modifier l’annotation'
                  : 'Ajouter une annotation'
                : t.sheetMode === 'note'
                  ? t.editingNoteId
                    ? 'Modifier la note'
                    : 'Ajouter une note'
                  : t.sheetMode === 'compare'
                    ? 'Comparer des sources (diff + note de cause)'
                    : t.sheetMode === 'tag'
                      ? 'Tagger un passage'
                      : t.sheetMode === 'reference'
                        ? 'Définir la source de référence'
                        : t.sheetMode === 'marginal_mentions'
                          ? 'Définir les mentions marginales'
                          : t.sheetMode === 'signatures'
                            ? 'Définir les signatures'
                            : t.sheetMode === 'marginal_crossouts'
                              ? 'Définir les ratures marginales'
                              : 'Panneau'}
            </SheetTitle>
            <SheetDescription>
              {t.sheetMode === 'compare'
                ? 'Diff visuel entre transcriptions actives de deux sources + note de cause.'
                : t.sheetMode === 'marginal_mentions'
                  ? 'Transcrire et structurer les mentions en marge (mariage, décès, rectif...).'
                  : t.sheetMode === 'signatures'
                    ? 'Ajoute une signature telle que lue (sans interprétation).'
                    : t.sheetMode === 'marginal_crossouts'
                      ? 'Décrire ratures/biffures, texte barré, corrections visibles en marge.'
                      : ''}
            </SheetDescription>
          </SheetHeader>

          {/* Le contenu Sheet reste géré par logic (on le refactor après) */}
          <div className='flex-1 overflow-y-auto p-4 scroll-smooth'>
            {t.sheetMode === 'reference' ? (
              <div className='space-y-4'>
                <div>
                  <div className='text-xs font-medium text-slate-700'>Raison principale</div>
                  <select
                    className='mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm'
                    value={t.refReason}
                    onChange={(e) => t.setRefReason(e.target.value as any)}
                  >
                    <option value=''>—</option>
                    <option value='best_legibility'>Meilleure lisibilité</option>
                    <option value='most_complete'>Plus complète</option>
                    <option value='best_match'>Correspond le mieux à l’acte</option>
                    <option value='other'>Autre</option>
                  </select>
                </div>

                <div>
                  <div className='text-xs font-medium text-slate-700'>Détail</div>
                  <Textarea
                    className='mt-1 min-h-[90px]'
                    value={t.refComment}
                    onChange={(e) => t.setRefComment(e.target.value)}
                    placeholder='Ex : page plus nette, acte plus complet, moins de lacunes…'
                  />
                  <div className='mt-1 text-[11px] text-slate-500'>
                    Champs requis : raison principale + détail.
                  </div>
                </div>

                <div className='flex items-center justify-end gap-2 pt-2'>
                  <Button variant='outline' onClick={t.cancelSetReference} disabled={t.loading}>
                    Annuler
                  </Button>

                  {t.referenceMode === 'edit' ? (
                    <>
                      <Button
                        variant='outline'
                        onClick={t.clearCurrentReference}
                        disabled={t.loading || !t.referenceTargetSourceId}
                        className='gap-2'
                        title='Retirer la référence'
                      >
                        Retirer la référence
                      </Button>

                      <Button
                        onClick={t.saveReferenceEdits}
                        disabled={
                          t.loading ||
                          !t.referenceTargetSourceId ||
                          !t.refReason ||
                          !t.refComment.trim()
                        }
                      >
                        Enregistrer
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={t.confirmSetReference}
                      disabled={
                        t.loading ||
                        !t.referenceTargetSourceId ||
                        !t.refReason ||
                        !t.refComment.trim()
                      }
                    >
                      Définir comme référence
                    </Button>
                  )}
                </div>
              </div>
            ) : t.sheetMode === 'marginal_mentions' ? (
              <div className='space-y-4'>
                {/* Liste */}
                {step !== 1 && (
                  <MarginalMentionList
                    items={t.marginalMentions ?? []}
                    disabled={t.loading || !t.workingVersion}
                    mode={t.mmFormMode}
                    onNew={() => t.startCreateMarginalMention?.()}
                    onEdit={(row) => t.openEditMarginalMention?.(row)}
                    onDelete={(id) => t.deleteMarginalMention?.(id)}
                  />
                )}

                {/* Formulaire (masqué par défaut) */}
                {step !== 1 && t.mmFormMode !== 'idle' && (
                  <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'>
                    <MarginalMentionFormSection t={t} />

                    <div className='flex items-center justify-end gap-2 pt-2'>
                      <Button
                        variant='outline'
                        onClick={() => t.cancelMarginalMentionForm?.()}
                        disabled={t.loading}
                      >
                        Annuler
                      </Button>

                      <Button
                        onClick={() => t.saveMarginalMention?.()}
                        disabled={t.loading || !t.workingVersion || !(t.mmContent ?? '').trim()}
                      >
                        {t.mmFormMode === 'edit' ? 'Enregistrer la modification' : 'Enregistrer'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : t.sheetMode === 'signatures' ? (
              <div className='space-y-4'>
                {/* Liste */}
                {step !== 1 && (
                  <SignatureList
                    items={t.signatures ?? []}
                    disabled={t.loading || !t.workingVersion}
                    mode={t.sigFormMode}
                    onNew={() => t.startCreateSignature?.()}
                    onEdit={(row) => t.openEditSignature?.(row)}
                    onDelete={(id) => t.deleteSignature?.(id)}
                  />
                )}

                {/* Formulaire (masqué par défaut) */}
                {step !== 1 && t.sigFormMode !== 'idle' && (
                  <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'>
                    <SignatureFormSection t={t} />

                    <div className='flex items-center justify-end gap-2 pt-2'>
                      <Button
                        variant='outline'
                        onClick={() => t.cancelSignatureForm?.()}
                        disabled={t.loading}
                      >
                        Annuler
                      </Button>

                      <Button
                        onClick={() => t.saveSignature?.()}
                        disabled={t.loading || !t.workingVersion || !(t.sigLabel ?? '').trim()}
                      >
                        {t.sigFormMode === 'edit' ? 'Enregistrer la modification' : 'Enregistrer'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : t.sheetMode === 'marginal_crossouts' ? (
              <div className='space-y-4'>
                {/* Liste */}
                {Boolean((t.marginalCrossouts?.length ?? 0) > 0) && (
                  <div className='space-y-2'>
                    {(t.marginalCrossouts ?? []).map((c: any) => (
                      <div
                        key={c.id}
                        className='rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm'
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <div className='text-sm font-semibold text-slate-900'>
                              {c.crossout_type ?? 'Rature'} {c.target ? `· ${c.target}` : ''}
                            </div>

                            {c.struck_text || c.replacement_text ? (
                              <div className='mt-2 grid grid-cols-2 gap-2'>
                                <div className='rounded-lg border border-slate-200 bg-slate-50 p-2'>
                                  <div className='text-[11px] font-medium text-slate-700'>
                                    Texte barré
                                  </div>
                                  <div className='mt-1 text-xs text-slate-800 whitespace-pre-wrap'>
                                    {c.struck_text ?? '—'}
                                  </div>
                                </div>
                                <div className='rounded-lg border border-slate-200 bg-slate-50 p-2'>
                                  <div className='text-[11px] font-medium text-slate-700'>
                                    Remplacement
                                  </div>
                                  <div className='mt-1 text-xs text-slate-800 whitespace-pre-wrap'>
                                    {c.replacement_text ?? '—'}
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {c.note ? (
                              <div className='mt-2 text-xs text-slate-600 whitespace-pre-wrap'>
                                {c.note}
                              </div>
                            ) : null}
                          </div>

                          <div className='shrink-0 flex items-center gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-8 px-2 text-xs'
                              onClick={() => t.openEditMarginalCrossout?.(c)}
                              disabled={t.loading || !t.workingVersion}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-8 px-2 text-xs'
                              onClick={() => t.deleteMarginalCrossout?.(c.id)}
                              disabled={t.loading || !t.workingVersion}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulaire */}
                <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <div className='text-xs font-medium text-slate-700'>Type de rature</div>
                      <Input
                        className='mt-1'
                        placeholder='rature_simple / surcharge / grattage…'
                        value={t.mcType ?? ''}
                        onChange={(e) => t.setMcType?.(e.target.value)}
                        disabled={t.loading || !t.workingVersion}
                      />
                    </div>

                    <div>
                      <div className='text-xs font-medium text-slate-700'>Cible</div>
                      <Input
                        className='mt-1'
                        placeholder='mot / ligne / bloc / mention / ...'
                        value={t.mcTarget ?? ''}
                        onChange={(e) => t.setMcTarget?.(e.target.value)}
                        disabled={t.loading || !t.workingVersion}
                      />
                    </div>

                    <div className='col-span-2'>
                      <div className='text-xs font-medium text-slate-700'>
                        Texte barré (si lisible)
                      </div>
                      <Textarea
                        className='mt-1 min-h-[110px]'
                        placeholder='Texte barré…'
                        value={t.mcStruck ?? ''}
                        onChange={(e) => t.setMcStruck?.(e.target.value)}
                        disabled={t.loading || !t.workingVersion}
                      />
                    </div>

                    <div className='col-span-2'>
                      <div className='text-xs font-medium text-slate-700'>
                        Remplacement (si visible)
                      </div>
                      <Textarea
                        className='mt-1 min-h-[110px]'
                        placeholder='Texte corrigé…'
                        value={t.mcReplacement ?? ''}
                        onChange={(e) => t.setMcReplacement?.(e.target.value)}
                        disabled={t.loading || !t.workingVersion}
                      />
                    </div>

                    <div className='col-span-2'>
                      <div className='text-xs font-medium text-slate-700'>Note</div>
                      <Textarea
                        className='mt-1 min-h-[90px]'
                        placeholder='Ambiguïtés, lecture…'
                        value={t.mcNote ?? ''}
                        onChange={(e) => t.setMcNote?.(e.target.value)}
                        disabled={t.loading || !t.workingVersion}
                      />
                    </div>
                  </div>

                  <div className='flex items-center justify-end gap-2 pt-2'>
                    <Button
                      variant='outline'
                      onClick={() => t.cancelMarginalCrossoutEdit?.() ?? t.setSheetOpen(false)}
                      disabled={t.loading}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => t.saveMarginalCrossout?.()}
                      disabled={
                        t.loading ||
                        !t.workingVersion ||
                        (!(t.mcType ?? '').trim() &&
                          !(t.mcTarget ?? '').trim() &&
                          !(t.mcStruck ?? '').trim() &&
                          !(t.mcReplacement ?? '').trim())
                      }
                    >
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-sm text-slate-600'>
                (Contenu du panneau à implémenter pour ce mode.)
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <Dialog open={t.illisibleOpen} onOpenChange={t.setIllisibleOpen}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Insérer une zone illisible</DialogTitle>
          </DialogHeader>

          <div className='grid grid-cols-3 gap-3'>
            <div>
              <div className='text-xs font-medium text-slate-700'>x · caractères</div>
              <Input
                className='mt-1'
                type='number'
                min={0}
                value={t.illisibleX}
                onChange={(e) => t.setIllisibleX(Number(e.target.value))}
              />
            </div>

            <div>
              <div className='text-xs font-medium text-slate-700'>y · mots</div>
              <Input
                className='mt-1'
                type='number'
                min={0}
                value={t.illisibleY}
                onChange={(e) => t.setIllisibleY(Number(e.target.value))}
              />
            </div>

            <div>
              <div className='text-xs font-medium text-slate-700'>z · lignes</div>
              <Input
                className='mt-1'
                type='number'
                min={0}
                value={t.illisibleZ}
                onChange={(e) => t.setIllisibleZ(Number(e.target.value))}
              />
            </div>
          </div>

          <div className='mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700'>
            Token inséré :{' '}
            <span className='font-mono'>
              [ILLISIBLE_CARACTERE{t.illisibleX}_MOT{t.illisibleY}_LIGNE{t.illisibleZ}]
            </span>
          </div>

          <DialogFooter className='mt-3 flex items-center justify-end gap-2'>
            <Button variant='outline' onClick={() => t.setIllisibleOpen(false)}>
              Annuler
            </Button>
            <Button onClick={t.confirmInsertIllisible}>Insérer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniHitRow({
  title,
  hits,
  onPick,
}: {
  title: string;
  hits: Array<{ label: string; start: number; end: number }>;
  onPick: (start: number, end: number) => void;
}) {
  return (
    <div>
      <div className='text-[11px] text-slate-600'>{title}</div>
      {hits.length ? (
        <div className='mt-1 flex flex-wrap gap-2'>
          {hits.map((h, i) => (
            <button
              key={`${h.start}-${h.end}-${i}`}
              type='button'
              onClick={() => onPick(h.start, h.end)}
              className='rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100'
            >
              {normalizeSpaces(h.label).slice(0, 36)}
              {normalizeSpaces(h.label).length > 36 ? '…' : ''}
            </button>
          ))}
        </div>
      ) : (
        <div className='mt-1 text-xs text-slate-600'>—</div>
      )}
    </div>
  );
}

function RichText({ text }: { text: string }) {
  const tokens = React.useMemo(() => tokenizeInline(text ?? ''), [text]);

  return (
    <span>
      {tokens.map((t, i) => {
        if (t.kind === 'text') return <React.Fragment key={i}>{t.text}</React.Fragment>;
        if (t.kind === 'bold') return <strong key={i}>{t.text}</strong>;
        if (t.kind === 'strike') return <s key={i}>{t.text}</s>;
        if (t.kind === 'illisible') {
          const label = `illisible · ${t.x} car. · ${t.y} mot(s) · ${t.z} ligne(s)`;
          return (
            <span
              key={i}
              title={t.raw}
              className='mx-0.5 inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-900'
            >
              {label}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}

function PartSectionCard({
  title,
  Icon,
  count,
  total,
  onAdd,
  onManage,
  disabled,
  present,
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
  // 1) absent => on masque totalement la section
  if (present === false) return null;

  return (
    <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
      <div className='flex items-start justify-between gap-3'>
        {/* Partie gauche */}
        <div className='w-full'>
          <div className='flex items-center gap-2'>
            <span className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white'>
              <Icon className='h-4 w-4 text-slate-700' />
            </span>

            {/* 2) indéterminé sur la présence => message ambre */}
            {present === null ? (
              <div className='min-w-0'>
                <div className='text-sm font-semibold text-slate-900'>{title}</div>
                <div className='mt-1 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 w-fit flex items-center gap-1'>
                  <HelpCircle className='h-3.5 w-3.5' />
                  Présence à renseigner dans « Référence archive »
                </div>
              </div>
            ) : (
              /* 3) présence confirmée => on montre la barre et rien d’autre */
              <div className='w-full min-w-0'>
                <div className='w-[60%]'>
                  <div className='font-semibold text-slate-900 lowercase'>
                    <ProgressVerboseBar
                      value={count}
                      max={total ?? 0}
                      label={`${count} / ${total ?? '—'} ${title}${(total ?? 0) < count ? ' ⚠️' : ''}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='shrink-0 flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={onManage}
            disabled={disabled}
            title='Voir / modifier / supprimer'
            className='h-8 px-2 text-xs gap-1'
          >
            <Eye className='h-4 w-4' />
            Voir
          </Button>

          {/* Bouton Ajouter */}
          <Button
            size='sm'
            onClick={onAdd}
            disabled={disabled}
            title='Ajouter'
            className='h-8 px-2 text-xs gap-1'
          >
            <Plus className='h-4 w-4' />
            Ajouter
          </Button>
        </div>
      </div>

      {/* 4) Si total est renseigné (>0) et que count > total => message d’erreur rouge */}
      {present === true && total !== null && total > 0 && count > total && (
        <div className='mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1 w-fit flex items-center gap-1'>
          <AlertTriangle className='h-3.5 w-3.5' />
          Incohérence : {count} relevé(s) mais total attendu = {total}
        </div>
      )}
    </div>
  );
}
