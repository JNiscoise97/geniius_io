// ReferenceArchiveTab.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import type { EtatCivilActe } from '@/types/etatcivil';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

import {
  DictionnaireEditorPanel,
  type DictionnaireKind,
} from '@/components/shared/DictionnaireEditorPanel';

import {
  EtatCivilBureauPickerPanel,
  formatBureauLabel,
  type EtatCivilBureau,
} from '@/components/shared/EtatCivilBureauPickerPanel';

import { AlertTriangle, CheckCircle2, Loader2, Lock, Save, Unlock } from 'lucide-react';

import type {
  ActeCitationDraft,
  ExemplairePick,
  Mode,
  RegistreCitationDraft,
} from '@/features/archives/reference/types';

import { SectionIdentification, SectionSources } from '@/features/archives/reference';
import { SectionEnregistrementActe } from '@/features/archives/reference/SectionEnregistrementActe';

type LieuSituation = 'bureau_courant' | 'autre_bureau' | 'transporte';

type ReferenceArchiveTabProps =
  | {
    type: 'acte';
    acte: EtatCivilActe;
    registreId?: string;
    mode?: Mode;
    bureauLabel?: string;
    onUpdated?: () => Promise<void> | void;
  }
  | {
    type: 'registre';
    acte?: never;
    registreId: string;
    mode?: Mode;
    bureauLabel?: string;
    onUpdated?: () => Promise<void> | void;
  };

/**
 * =========================================================================
 * SHARED - helpers + UI
 * =========================================================================
 */

type DirtyKey = 'label' | 'identification' | 'enregistrement' | 'sources';

function toDateInput(v: any) {
  if (!v) return '';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toUuidOrNull(v: any): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v || null;
  if (typeof v === 'object') {
    if (typeof (v as any).id === 'string') return (v as any).id;
    if (Array.isArray((v as any).ids) && typeof (v as any).ids[0] === 'string')
      return (v as any).ids[0];
  }
  return null;
}

function toBoolOrNull(v: any): boolean | null {
  if (v === true) return true;
  if (v === false) return false;
  return null;
}

function SectionHeaderRow(props: {
  title: string;
  subtitle?: string;
  dirty: boolean;
  saving: boolean;
  savedAt: number | null;
  disabled?: boolean;
  readonly?: boolean;
  onSave?: () => void;
}) {
  const { title, subtitle, dirty, saving, savedAt, disabled, readonly = false, onSave } = props;

  const status = (() => {
    if (saving) return { label: 'Enregistrement…', icon: <Loader2 className='h-4 w-4 animate-spin' /> };
    if (dirty) return { label: 'Modifications non enregistrées', icon: <AlertTriangle className='h-4 w-4' /> };
    if (savedAt) return { label: 'Enregistré', icon: <CheckCircle2 className='h-4 w-4' /> };
    return { label: 'À jour', icon: <CheckCircle2 className='h-4 w-4 opacity-60' /> };
  })();

  const statusClasses = saving
    ? 'border-slate-200 bg-slate-50 text-slate-700'
    : dirty
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-emerald-200 bg-emerald-50 text-emerald-900';

  return (
    <div className='flex items-start justify-between gap-3'>
      <div className='min-w-0'>
        <div className='text-sm font-semibold text-slate-900'>{title}</div>
        {subtitle ? <div className='mt-0.5 text-xs text-slate-600'>{subtitle}</div> : null}
      </div>

      {!readonly ? (
        <div className='flex items-center gap-2 shrink-0'>
          <div
            className={[
              'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs',
              statusClasses,
            ].join(' ')}
          >
            {status.icon}
            <span className='whitespace-nowrap'>{status.label}</span>
          </div>

          {onSave ? (
            <button
              type='button'
              disabled={disabled || saving || !dirty}
              onClick={onSave}
              className='inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
              title={dirty ? 'Enregistrer cette section' : 'Aucune modification'}
            >
              <Save className='h-4 w-4' />
              Enregistrer
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * =========================================================================
 * ACTE - types (citations)
 * =========================================================================
 */

type ActeCitationRow = {
  id: string;
  acte_id: string;
  exemplaire_id: string;

  loc_start: number | null;
  loc_end: number | null;
  loc_raw: string | null;

  is_missing: boolean | null;
  note: string | null;
  sort_order: number;

  physical_condition_ref: string | null;
  repro_quality_ref: string | null;

  missing_ranges: any;

  damage_notes: string | null;
  repro_notes: string | null;

  marginal_mentions_present: boolean | null;
  marginal_mentions_count: number | null;
  signatures_present: boolean | null;
  signatures_count: number | null;
  marginal_crossouts_present: boolean | null;
  marginal_crossouts_count: number | null;

  langue_ref?: string | null;
  ecriture_ref?: string | null;
  handwriting_legibility_ref?: string | null;

  document_damage_kinds_ids?: string[] | null;
  document_readability_features_ids?: string[] | null;

  anchor_hint?: string | null;
  acte_no?: number | null;

  lacune?: boolean | null;
  lacune_note?: string | null;

  marks?: string | null;
  work_note?: string | null;
};

function emptyActeCitation(): ActeCitationDraft {
  return {
    id: undefined,
    exemplaire_id: undefined,
    exemplaire: undefined,

    loc_start: null,
    loc_end: null,
    loc_raw: '',

    is_missing: null,
    note: '',
    sort_order: 0,

    physical_condition_ref: null,
    repro_quality_ref: null,

    damage_notes: '',
    repro_notes: '',

    missing_ranges: [],

    marginal_mentions_present: null,
    marginal_mentions_count: null,
    signatures_present: null,
    signatures_count: null,
    marginal_crossouts_present: null,
    marginal_crossouts_count: null,

    langue_ref: null,
    ecriture_ref: null,
    handwriting_legibility_ref: null,

    document_damage_kinds_ids: [],
    document_readability_features_ids: [],

    lacune: null,
    lacune_note: null,
  } as any;
}

function normalizeCitationRow(r: Partial<ActeCitationRow> | null | undefined): ActeCitationDraft {
  const arrOrEmpty = (v: any) => (Array.isArray(v) ? v.filter(Boolean) : []);

  return {
    id: r?.id,
    exemplaire_id: r?.exemplaire_id,

    loc_start: r?.loc_start ?? null,
    loc_end: r?.loc_end ?? null,
    loc_raw: r?.loc_raw ?? '',

    is_missing: r?.is_missing,
    note: r?.note ?? '',
    sort_order: typeof r?.sort_order === 'number' ? r.sort_order : 0,

    physical_condition_ref: (r?.physical_condition_ref ?? null) as any,
    repro_quality_ref: (r?.repro_quality_ref ?? null) as any,

    damage_notes: r?.damage_notes ?? '',
    repro_notes: r?.repro_notes ?? '',

    missing_ranges: Array.isArray(r?.missing_ranges) ? (r!.missing_ranges as any[]).filter(Boolean) : [],

    marginal_mentions_present: r?.marginal_mentions_present ?? null,
    marginal_mentions_count: typeof r?.marginal_mentions_count === 'number' ? r.marginal_mentions_count : null,

    signatures_present: r?.signatures_present ?? null,
    signatures_count: typeof r?.signatures_count === 'number' ? r.signatures_count : null,

    marginal_crossouts_present: r?.marginal_crossouts_present ?? null,
    marginal_crossouts_count: typeof r?.marginal_crossouts_count === 'number' ? r.marginal_crossouts_count : null,

    langue_ref: (r as any)?.langue_ref ?? null,
    ecriture_ref: (r as any)?.ecriture_ref ?? null,
    handwriting_legibility_ref: (r as any)?.handwriting_legibility_ref ?? null,

    document_damage_kinds_ids: arrOrEmpty((r as any)?.document_damage_kinds_ids),
    document_readability_features_ids: arrOrEmpty((r as any)?.document_readability_features_ids),

    anchor_hint: (r as any)?.anchor_hint ?? '',
    acte_no: typeof (r as any)?.acte_no === 'number' ? (r as any).acte_no : null,

    lacune: (r as any)?.lacune ?? null,
    lacune_note: (r as any)?.lacune_note ?? '',

    marks: (r as any)?.marks ?? '',
    work_note: (r as any)?.work_note ?? '',
  } as any;
}

/**
 * =========================================================================
 * REGISTRE - citations + segments
 * =========================================================================
 */

const TABLE_REGISTRE_CITATIONS = 'etat_civil_registre_citations';
const TABLE_REGISTRE_SEGMENTS = 'etat_civil_registre_exemplaire_segments';
const VIEW_EXEMPLAIRES_PICK = 'v_exemplaires_pick';

type RegistreCitationRow = {
  id: string;
  registre_id: string;
  exemplaire_id: string;

  is_missing: boolean | null;
  lacune: boolean | null;
  lacune_note: string | null;
  locating: any;

  physical_condition_ref: string | null;
  repro_quality_ref: string | null;
  marks: string | null;
  document_damage_kinds_ids: string[] | null;

  note: string | null;
  sort_order: number | null;
};

function emptyRegistreCitation(sort_order: number): RegistreCitationDraft {
  return {
    id: undefined,
    exemplaire_id: undefined,
    exemplaire: undefined,

    is_missing: null,
    lacune: null,
    lacune_note: null,
    locating: { systems: [{}] },

    physical_condition_ref: null,
    repro_quality_ref: null,
    marks: '',
    document_damage_kinds_ids: [],

    note: '',
    sort_order,
    segments: [],
    work_note: '',
  };
}

function mapRowToDraft(r: RegistreCitationRow): RegistreCitationDraft {
  return {
    id: r.id,
    exemplaire_id: r.exemplaire_id,
    exemplaire: undefined,

    is_missing: r.is_missing,
    lacune: r.lacune,
    lacune_note: r.lacune_note,
    locating: r.locating ?? {},

    physical_condition_ref: r.physical_condition_ref,
    repro_quality_ref: r.repro_quality_ref,
    marks: r.marks ?? '',
    document_damage_kinds_ids: r.document_damage_kinds_ids ?? [],

    note: r.note ?? '',
    sort_order: r.sort_order ?? 0,

    segments: [],
    work_note: '',
  };
}

/**
 * =========================================================================
 * Wrapper: SAME component name, but hooks “acte” only live in Acte child.
 * =========================================================================
 */

export default function ReferenceArchiveTab(props: ReferenceArchiveTabProps) {
  if (props.type === 'registre') {
    return <ReferenceArchiveTabRegistre {...props} />;
  }
  return <ReferenceArchiveTabActe {...props} />;
}

/**
 * =========================================================================
 * ACTE component (hooks acte only)
 * =========================================================================
 */

type FormStateActe = {
  // IDENTIFICATION
  type_acte: string;
  type_acte_ref: { ids: string[]; labels: string[] } | null;
  numero_acte: string;
  date: string;
  heure: string;

  auteur_fonction: string;
  auteur_institutionnel_ref: { ids: string[]; labels: string[] } | null;

  // ENREGISTREMENT / LIEU
  bureau_id: string | null;
  bureau_enregistrement_label: string;

  lieu_situation: LieuSituation;
  redaction_bureau_id: string | null;
  redaction_bureau_label: string;
};

function ReferenceArchiveTabActe(props: Extract<ReferenceArchiveTabProps, { type: 'acte' }>) {
  const { type, acte, registreId, mode = 'edit', bureauLabel, onUpdated } = props;

  const acteId = acte.id;
  const label = acte.label ?? '';
  const tar = (acte as any).type_acte_ref;
  const tai = (acte as any).auteur_institutionnel_ref;

  const initialState: FormStateActe = useMemo(
    () => ({
      type_acte: (acte as any).type_acte ?? '',
      type_acte_ref: tar?.id ? { ids: [tar.id], labels: [tar.label ?? ''] } : null,

      numero_acte: String((acte as any).numero_acte ?? ''),
      date: toDateInput((acte as any).date),
      heure: (acte as any).heure ?? '',

      auteur_fonction: (acte as any).auteur_fonction ?? '',
      auteur_institutionnel_ref: tai?.id ? { ids: [tai.id], labels: [tai.label ?? ''] } : null,

      bureau_id: (acte as any).bureau_id ?? null,
      bureau_enregistrement_label: bureauLabel ?? '',

      lieu_situation: ((acte as any).lieu_situation as LieuSituation) ?? 'bureau_courant',
      redaction_bureau_id: (acte as any).redaction_bureau_id ?? null,
      redaction_bureau_label: (acte as any).redaction_bureau_label ?? '',
    }),
    [acte, bureauLabel],
  );

  const [form, setForm] = useState<FormStateActe>(initialState);

  const [loadingActesSources, setLoadingActesSources] = useState(false);
  const [actesSources, setActesSources] = useState<ActeCitationDraft[]>([]);

  // drawers (acte only)
  const [dictOpen, setDictOpen] = useState(false);
  const [dictArgs, setDictArgs] = useState<{
    kind: DictionnaireKind;
    title: string;
    multi: boolean;
    defaultSelectedIds: string[];
    onValidate: (items: { id: string; code: string; label: string }[]) => Promise<void> | void;
  } | null>(null);

  const [bureauOpen, setBureauOpen] = useState(false);
  const [bureauArgs, setBureauArgs] = useState<{
    title: string;
    defaultSelectedId: string | null;
    onValidate: (bureau: EtatCivilBureau) => Promise<void> | void;
  } | null>(null);

  // Label (acte edit only)
  const [labelLocked, setLabelLocked] = useState(true);
  const [labelDraft, setLabelDraft] = useState(label);
  const labelRef = useRef<HTMLInputElement | null>(null);

  // Dirty + saving
  const [dirty, setDirty] = useState<Record<DirtyKey, boolean>>({
    label: false,
    identification: false,
    enregistrement: false,
    sources: false,
  });

  const [savingBy, setSavingBy] = useState<Record<DirtyKey, boolean>>({
    label: false,
    identification: false,
    enregistrement: false,
    sources: false,
  });

  const [errorBy, setErrorBy] = useState<Record<DirtyKey, string | null>>({
    label: null,
    identification: null,
    enregistrement: null,
    sources: null,
  });

  const [savedAtBy, setSavedAtBy] = useState<Record<DirtyKey, number | null>>({
    label: null,
    identification: null,
    enregistrement: null,
    sources: null,
  });

  const isAnyDirty = Object.values(dirty).some(Boolean);

  const markDirty = (k: DirtyKey) => {
    setDirty((prev) => (prev[k] ? prev : { ...prev, [k]: true }));
    setSavedAtBy((prev) => ({ ...prev, [k]: null }));
  };

  const clearDirty = (k: DirtyKey) => {
    setDirty((prev) => ({ ...prev, [k]: false }));
    setSavedAtBy((prev) => ({ ...prev, [k]: Date.now() }));
  };

  const setSectionError = (k: DirtyKey, msg: string | null) => {
    setErrorBy((prev) => ({ ...prev, [k]: msg }));
  };

  const setSectionSaving = (k: DirtyKey, v: boolean) => {
    setSavingBy((prev) => ({ ...prev, [k]: v }));
  };

  // reset when acte changes
  useEffect(() => {
    setForm(initialState);
    setDirty({ label: false, identification: false, enregistrement: false, sources: false });
    setErrorBy({ label: null, identification: null, enregistrement: null, sources: null });
    setSavedAtBy({ label: null, identification: null, enregistrement: null, sources: null });
  }, [initialState]);

  useEffect(() => {
    setLabelDraft(label);
    setLabelLocked(true);
    setDirty((prev) => ({ ...prev, label: false }));
    setErrorBy((prev) => ({ ...prev, label: null }));
    setSavedAtBy((prev) => ({ ...prev, label: null }));
  }, [label]);

  useEffect(() => {
    if (!labelLocked) labelRef.current?.focus();
  }, [labelLocked]);

  // Guard navigateur si dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isAnyDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isAnyDirty]);

  /**
   * LOAD Acte citations + enrich exemplaires
   */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoadingActesSources(true);
      setSectionError('sources', null);

      const { data, error } = await supabase
        .from('etat_civil_acte_citations')
        .select(
          'id, acte_id, exemplaire_id, loc_start, loc_end, loc_raw, is_missing, note, sort_order,' +
          'physical_condition_ref, damage_notes, repro_quality_ref, repro_notes, missing_ranges,' +
          'marginal_mentions_present, marginal_mentions_count, signatures_present, signatures_count, marginal_crossouts_present, marginal_crossouts_count,' +
          'anchor_hint, acte_no, lacune, lacune_note, marks,' +
          'langue_ref, ecriture_ref, handwriting_legibility_ref, document_damage_kinds_ids, document_readability_features_ids',
        )
        .eq('acte_id', acteId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .returns<ActeCitationRow[]>();

      if (cancelled) return;

      if (error) {
        setSectionError('sources', error.message);
        setActesSources([]);
        setLoadingActesSources(false);
        return;
      }

      const rows = data ?? [];
      const drafts = rows.map((r) => normalizeCitationRow(r));

      if (!drafts.length) {
        setActesSources([]);
        setLoadingActesSources(false);
        return;
      }

      const exIds = Array.from(new Set(drafts.map((d) => d.exemplaire_id).filter(Boolean) as string[]));
      if (!exIds.length) {
        setActesSources(drafts);
        setLoadingActesSources(false);
        return;
      }

      const { data: pickData, error: pickErr } = await supabase
        .from(VIEW_EXEMPLAIRES_PICK)
        .select(
          'exemplaire_id,nature_ref,nature_code,nature_label,support_ref,support_code,support_label,unite_id,unite_titre,cote_locale,pagination_type_ref,pagination_type_code,pagination_type_label,nb_pages,depot_nom,depot_is_online,depot_is_physical,institution_nom,institution_sigle,url_base,plateforme_code,source_exemplaire_id,identifiant_interne,localisation_interne,physical_condition_ref,physical_condition_code,physical_condition_label',
        )
        .in('exemplaire_id', exIds);

      if (cancelled) return;

      if (pickErr) {
        setActesSources(drafts);
        setLoadingActesSources(false);
        return;
      }

      const bestById = new Map<string, ExemplairePick>();
      for (const r of (pickData ?? []) as any[]) {
        const cur = bestById.get(r.exemplaire_id);
        const cand: ExemplairePick = {
          exemplaire_id: r.exemplaire_id,
          nature_ref: r.nature_ref,
          nature_code: r.nature_code,
          nature_label: r.nature_label,
          support_ref: r.support_ref,
          support_code: r.support_code,
          support_label: r.support_label,
          physical_condition_ref: r.physical_condition_ref,
          physical_condition_code: r.physical_condition_code,
          physical_condition_label: r.physical_condition_label,
          unite_id: r.unite_id,
          unite_titre: r.unite_titre,
          cote_locale: r.cote_locale,
          pagination_type_ref: r.pagination_type_ref,
          pagination_type_code: r.pagination_type_code,
          pagination_type_label: r.pagination_type_label,
          nb_pages: r.nb_pages,
          depot_nom: r.depot_nom,
          depot_is_online: r.depot_is_online,
          depot_is_physical: r.depot_is_physical,
          institution_nom: r.institution_nom,
          institution_sigle: r.institution_sigle,
          identifiant_interne: r.identifiant_interne,
          localisation_interne: r.localisation_interne,
          url_base: r.url_base,
          plateforme_code: r.plateforme_code,
          source_exemplaire_id: r.source_exemplaire_id,
        };

        if (!cur) {
          bestById.set(r.exemplaire_id, cand);
          continue;
        }

        const curHasUrl = Boolean((cur.url_base ?? '').trim());
        const candHasUrl = Boolean((cand.url_base ?? '').trim());
        if (!curHasUrl && candHasUrl) bestById.set(r.exemplaire_id, cand);
      }

      const enriched = drafts.map((d) => {
        const e = d.exemplaire_id ? bestById.get(d.exemplaire_id) : null;
        if (!e) return d;
        return {
          ...d,
          exemplaire: {
            exemplaire_id: e.exemplaire_id,
            unite_id: e.unite_id,
            nature_ref: e.nature_ref,
            unite_titre: e.unite_titre,
            nature_code: e.nature_code,
            nature_label: e.nature_label,
            support_ref: e.support_ref,
            support_code: e.support_code,
            support_label: e.support_label,
            physical_condition_ref: e.physical_condition_ref,
            physical_condition_code: e.physical_condition_code,
            physical_condition_label: e.physical_condition_label,
            cote_locale: e.cote_locale,
            pagination_type_ref: e.pagination_type_ref,
            pagination_type_code: e.pagination_type_code,
            pagination_type_label: e.pagination_type_label,
            nb_pages: e.nb_pages,
            depot_nom: e.depot_nom,
            depot_is_online: e.depot_is_online,
            depot_is_physical: e.depot_is_physical,
            institution_nom: e.institution_nom,
            institution_sigle: e.institution_sigle,
            identifiant_interne: e.identifiant_interne,
            localisation_interne: e.localisation_interne,
            url_base: e.url_base,
            plateforme_code: e.plateforme_code,
            source_exemplaire_id: e.source_exemplaire_id,
          },
        } satisfies ActeCitationDraft;
      });

      setActesSources(enriched);
      setLoadingActesSources(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [acteId]);

  /**
   * State helpers
   */
  const setField = <K extends keyof FormStateActe>(key: K, value: FormStateActe[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setFieldIn = <K extends keyof FormStateActe>(section: DirtyKey, key: K, value: FormStateActe[K]) => {
    setField(key, value);
    if (mode === 'edit') {
      if (section !== 'label' && section !== 'sources') markDirty(section);
    }
  };

  const updateSource = (idx: number, patch: Partial<ActeCitationDraft>) => {
    setActesSources((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    if (mode === 'edit') markDirty('sources');
  };

  const addSource = () => {
    setActesSources((prev) => [...prev, emptyActeCitation()]);
    if (mode === 'edit') markDirty('sources');
  };

  const removeSource = (idx: number) => {
    setActesSources((prev) => prev.filter((_, i) => i !== idx));
    if (mode === 'edit') markDirty('sources');
  };

  /**
   * SAVE - acte citations
   */
  const upsertCitations = async () => {
    const uiExistingIds = actesSources.map((s) => s.id).filter(Boolean) as string[];

    const { data: existing, error: errExisting } = await supabase
      .from('etat_civil_acte_citations')
      .select('id')
      .eq('acte_id', acteId);

    if (errExisting) throw errExisting;

    const existingIds = (existing ?? []).map((r: any) => r.id as string);
    const toDelete = existingIds.filter((id) => !uiExistingIds.includes(id));

    if (toDelete.length) {
      const { error } = await supabase.from('etat_civil_acte_citations').delete().in('id', toDelete);
      if (error) throw error;
    }

    const payload = actesSources
      .map((c, idx) => {
        if (!c.exemplaire_id) return null;

        const base = {
          acte_id: acteId,
          exemplaire_id: c.exemplaire_id,

          loc_start: c.loc_start ?? null,
          loc_end: c.loc_end ?? null,
          loc_raw: (c.loc_raw ?? '').trim() || null,

          is_missing: toBoolOrNull(c.is_missing),
          note: (c.note ?? '').trim() || null,

          sort_order: idx,

          physical_condition_ref: toUuidOrNull((c as any).physical_condition_ref),
          repro_quality_ref: toUuidOrNull((c as any).repro_quality_ref),

          damage_notes: (c.damage_notes ?? '').trim() || null,
          repro_notes: (c.repro_notes ?? '').trim() || null,

          missing_ranges: Array.isArray(c.missing_ranges) ? c.missing_ranges : [],

          marginal_mentions_present: toBoolOrNull(c.marginal_mentions_present),
          marginal_mentions_count: c.marginal_mentions_present === true ? (c.marginal_mentions_count ?? null) : null,

          signatures_present: toBoolOrNull(c.signatures_present),
          signatures_count: c.signatures_present === true ? (c.signatures_count ?? null) : null,

          marginal_crossouts_present: toBoolOrNull(c.marginal_crossouts_present),
          marginal_crossouts_count: c.marginal_crossouts_present === true ? (c.marginal_crossouts_count ?? null) : null,

          langue_ref: (c as any).langue_ref ?? null,
          ecriture_ref: (c as any).ecriture_ref ?? null,
          handwriting_legibility_ref: (c as any).handwriting_legibility_ref ?? null,

          document_damage_kinds_ids: Array.isArray((c as any).document_damage_kinds_ids) ? (c as any).document_damage_kinds_ids : [],
          document_readability_features_ids: Array.isArray((c as any).document_readability_features_ids)
            ? (c as any).document_readability_features_ids
            : [],

          anchor_hint: (c as any).anchor_hint?.trim?.() || null,
          acte_no: (c as any).acte_no ?? null,

          lacune: toBoolOrNull((c as any).lacune),
          lacune_note: (c as any).lacune_note?.trim?.() || null,

          marks: (c as any).marks?.trim?.() || null,
        };

        return c.id ? { id: c.id, ...base } : base;
      })
      .filter(Boolean) as any[];

    if (!payload.length) return;

    const { data: upserted, error } = await supabase
      .from('etat_civil_acte_citations')
      .upsert(payload, { onConflict: 'id' })
      .select('id, exemplaire_id, sort_order');

    if (error) throw error;

    // backfill IDs for newly created citations
    if (upserted?.length) {
      const byKey = new Map(upserted.map((r: any) => [`${r.exemplaire_id}__${r.sort_order}`, r.id as string]));
      setActesSources((prev) =>
        prev.map((c, idx) => {
          if (c.id) return c;
          const key = `${c.exemplaire_id}__${idx}`;
          const newId = byKey.get(key);
          return newId ? { ...c, id: newId } : c;
        }),
      );
    }
  };

  /**
   * SAVE - per section (acte)
   */
  const saveLabel = async () => {
    if (mode !== 'edit') return;
    if (!dirty.label) return;

    setSectionSaving('label', true);
    setSectionError('label', null);

    const patch: Record<string, any> = { label: (labelDraft ?? '').trim() || null };
    const { error } = await supabase.from('etat_civil_actes').update(patch).eq('id', acteId);

    setSectionSaving('label', false);

    if (error) {
      setSectionError('label', error.message);
      return;
    }

    clearDirty('label');
    await onUpdated?.();
  };

  const saveIdentification = async () => {
    if (mode !== 'edit') return;
    if (!dirty.identification) return;

    setSectionSaving('identification', true);
    setSectionError('identification', null);

    const patch: Record<string, any> = {
      type_acte: form.type_acte || null,
      type_acte_ref: form.type_acte_ref?.ids?.[0] ?? null,
    };

    const { error } = await supabase.from('etat_civil_actes').update(patch).eq('id', acteId);

    setSectionSaving('identification', false);

    if (error) {
      setSectionError('identification', error.message);
      return;
    }

    clearDirty('identification');
    await onUpdated?.();
  };

  const saveEnregistrement = async () => {
    if (mode !== 'edit') return;
    if (!dirty.enregistrement) return;

    setSectionSaving('enregistrement', true);
    setSectionError('enregistrement', null);

    const patch: Record<string, any> = {
      date: form.date || null,
      heure: form.heure || null,
      numero_acte: form.numero_acte || null,
      auteur_institutionnel_ref: form.auteur_institutionnel_ref?.ids?.[0] ?? null,

      bureau_id: form.bureau_id ?? null,
      lieu_situation: form.lieu_situation,

      redaction_bureau_id: form.lieu_situation === 'autre_bureau' ? form.redaction_bureau_id : null,
    };

    const { error } = await supabase.from('etat_civil_actes').update(patch).eq('id', acteId);

    setSectionSaving('enregistrement', false);

    if (error) {
      setSectionError('enregistrement', error.message);
      return;
    }

    clearDirty('enregistrement');
    await onUpdated?.();
  };

  const saveSources = async () => {
    if (mode !== 'edit') return;
    if (!dirty.sources) return;

    setSectionSaving('sources', true);
    setSectionError('sources', null);

    try {
      await upsertCitations();
    } catch (err: any) {
      setSectionSaving('sources', false);
      setSectionError('sources', err?.message ?? 'Erreur lors de l’enregistrement des citations.');
      return;
    }

    setSectionSaving('sources', false);
    clearDirty('sources');
    await onUpdated?.();
  };

  const saveAll = async () => {
    if (mode !== 'edit') return;
    if (dirty.label) await saveLabel();
    if (dirty.identification) await saveIdentification();
    if (dirty.enregistrement) await saveEnregistrement();
    if (dirty.sources) await saveSources();
  };

  const handleLegacySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveAll();
  };

  /**
   * Render (acte) — IMPORTANT: sections displayed per your rules.
   */
  return (
    <div className='p-4'>
      <form className='space-y-6' onSubmit={handleLegacySubmit}>
        <div className='space-y-10'>
          <div>
            <h2 className='text-base font-semibold text-slate-900'>Référence archive</h2>

            {/* intro acte */}
            <div className='mt-1 space-y-1'>
              <p className='text-sm leading-relaxed text-slate-700'>
                Cet onglet vous permet de décrire l’acte en tant que document d’archive : registre, date, lieu de
                rédaction, dépôts de conservation et état du document.
              </p>
              <p>
                <span className='font-semibold text-sm text-slate-700'>Il sert à retrouver et citer précisément l’acte.</span>
              </p>
            </div>
          </div>

          {/* Global sticky-ish helper (top) */}
          {mode === 'edit' ? (
            <div className='rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='text-sm font-semibold text-slate-900'>État des modifications</div>
                  <div className='mt-0.5 text-xs text-slate-600'>
                    {isAnyDirty ? 'Certaines sections ont des modifications non enregistrées.' : 'Tout est à jour.'}
                  </div>
                </div>

                <button
                  type='button'
                  onClick={saveAll}
                  disabled={!isAnyDirty || Object.values(savingBy).some(Boolean)}
                  className='inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
                  title={isAnyDirty ? 'Enregistrer toutes les sections modifiées' : 'Aucune modification'}
                >
                  {Object.values(savingBy).some(Boolean) ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
                  Tout enregistrer
                </button>
              </div>
            </div>
          ) : null}

          {/* 1) Label — type == 'acte' && mode == 'edit' */}
          {type === 'acte' && mode === 'edit' ? (
            <div className='rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3'>
              <SectionHeaderRow
                title='Label'
                subtitle='Titre court pour identifier l’acte rapidement.'
                dirty={dirty.label}
                saving={savingBy.label}
                savedAt={savedAtBy.label}
                onSave={saveLabel}
                disabled={labelLocked}
              />

              <div className='w-full md:max-w-xl'>
                <label className='block text-xs font-medium text-slate-700'>Label</label>

                <div className='mt-1 flex items-center gap-2 w-full'>
                  <input
                    ref={labelRef}
                    value={labelDraft}
                    onChange={(e) => {
                      setLabelDraft(e.target.value);
                      markDirty('label');
                    }}
                    readOnly={labelLocked}
                    className={[
                      'w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none',
                      labelLocked ? 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-900 focus:border-slate-400',
                    ].join(' ')}
                    placeholder='Label…'
                  />

                  <button
                    type='button'
                    onClick={() => setLabelLocked((v) => !v)}
                    className={[
                      'inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm',
                      labelLocked ? 'border-slate-200 bg-white hover:bg-slate-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
                    ].join(' ')}
                    title={labelLocked ? 'Déverrouiller le label' : 'Verrouiller le label'}
                    aria-label={labelLocked ? 'Déverrouiller le label' : 'Verrouiller le label'}
                  >
                    {labelLocked ? <Lock className='h-4 w-4 text-slate-700' /> : <Unlock className='h-4 w-4 text-slate-800' />}
                  </button>
                </div>

                {labelLocked ? (
                  <p className='mt-1 text-xs text-slate-500'>Le label est verrouillé. Déverrouille-le pour le modifier.</p>
                ) : (
                  <p className='mt-1 text-xs text-amber-700'>Label déverrouillé : toute modification sera enregistrée.</p>
                )}

                {errorBy.label ? (
                  <div className='mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800'>{errorBy.label}</div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* 2) Identification — type == 'acte' && mode == 'edit' */}
        {type === 'acte' && mode === 'edit' ? (
          <div className='rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-4'>
            <SectionHeaderRow
              title='Identification'
              subtitle='Type d’acte, date/heure, numéro, auteur.'
              dirty={dirty.identification}
              saving={savingBy.identification}
              savedAt={savedAtBy.identification}
              onSave={saveIdentification}
              readonly={false}
            />

            <SectionIdentification
              id={acteId}
              form={form as any}
              type='acte'
              mode={mode}
              setField={((key: keyof FormStateActe, value: any) => setFieldIn('identification', key as any, value)) as any}
            />

            {errorBy.identification ? (
              <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800'>{errorBy.identification}</div>
            ) : null}
          </div>
        ) : null}

        {/* 3) Enregistrement et lieu — type == 'acte' && (mode == 'view' || mode == 'edit') */}
        {type === 'acte' ? (
          <div className='rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-4'>
            <SectionHeaderRow
              title='Enregistrement et lieu'
              subtitle='Bureau d’enregistrement, lieu de rédaction, transport.'
              dirty={dirty.enregistrement}
              saving={savingBy.enregistrement}
              savedAt={savedAtBy.enregistrement}
              onSave={mode === 'edit' ? saveEnregistrement : undefined}
              readonly={mode === 'view'}
            />

            <SectionEnregistrementActe
              mode={mode}
              form={form as any}
              setField={((key: keyof FormStateActe, value: any) => setFieldIn('enregistrement', key as any, value)) as any}
              onEditBureauEnregistrement={() => {
                if (mode !== 'edit') return;
                setBureauArgs({
                  title: 'Sélectionner un bureau d’état civil',
                  defaultSelectedId: form.bureau_id,
                  onValidate: async (bureau) => {
                    setFieldIn('enregistrement', 'bureau_id', bureau.id);
                    setFieldIn('enregistrement', 'bureau_enregistrement_label', formatBureauLabel(bureau));
                    setBureauOpen(false);
                  },
                });
                setBureauOpen(true);
              }}
              onClearBureauEnregistrement={() => {
                if (mode !== 'edit') return;
                setFieldIn('enregistrement', 'bureau_id', null);
                setFieldIn('enregistrement', 'bureau_enregistrement_label', '');
              }}
              onEditBureauRedaction={() => {
                if (mode !== 'edit') return;
                setBureauArgs({
                  title: 'Sélectionner le bureau de rédaction',
                  defaultSelectedId: form.redaction_bureau_id,
                  onValidate: async (bureau) => {
                    setFieldIn('enregistrement', 'redaction_bureau_id', bureau.id);
                    setFieldIn('enregistrement', 'redaction_bureau_label', formatBureauLabel(bureau));
                    setBureauOpen(false);
                  },
                });
                setBureauOpen(true);
              }}
              onClearBureauRedaction={() => {
                if (mode !== 'edit') return;
                setFieldIn('enregistrement', 'redaction_bureau_id', null);
                setFieldIn('enregistrement', 'redaction_bureau_label', '');
              }}
            />

            {errorBy.enregistrement ? (
              <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800'>{errorBy.enregistrement}</div>
            ) : null}
          </div>
        ) : null}

        {/* 4) Sources — type == 'acte' && (mode == 'view' || mode == 'edit') */}
        {type === 'acte' ? (
          <div className='rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-4'>
            <SectionHeaderRow
              title='Sources'
              subtitle='Citations par exemplaire + localisation + état du document.'
              dirty={dirty.sources}
              saving={savingBy.sources}
              savedAt={savedAtBy.sources}
              onSave={mode === 'edit' ? saveSources : undefined}
              disabled={loadingActesSources}
              readonly={mode === 'view'}
            />

            {mode === 'edit' ? (
              <SectionSources
                type='acte'
                mode='edit'
                registreId={(acte as any).registre_id ?? registreId ?? null}
                sources={actesSources}
                loading={loadingActesSources}
                onAdd={addSource}
                onRemove={removeSource}
                onChange={updateSource}
              />
            ) : (
              <SectionSources
                type='acte'
                mode='view'
                registreId={(acte as any).registre_id ?? registreId ?? null}
                sources={actesSources}
                loading={loadingActesSources}
              />
            )}

            {errorBy.sources ? (
              <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800'>{errorBy.sources}</div>
            ) : null}
          </div>
        ) : null}

        {/* Footer global (acte edit only) */}
        {mode === 'edit' ? (
          <div className='flex items-center justify-end gap-3'>
            <button
              type='button'
              onClick={saveAll}
              disabled={!isAnyDirty || Object.values(savingBy).some(Boolean)}
              className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
              title={isAnyDirty ? 'Enregistrer toutes les sections modifiées' : 'Aucune modification'}
            >
              {Object.values(savingBy).some(Boolean) ? 'Enregistrement…' : 'Tout enregistrer'}
            </button>
          </div>
        ) : null}
      </form>

      {/* DRAWERS (acte only) */}
      <Sheet open={dictOpen} onOpenChange={setDictOpen}>
        <SheetContent side='right' className='w-[520px] sm:w-[640px] p-0'>
          <SheetHeader className='sr-only'>
            <SheetTitle>{dictArgs?.title ?? 'Dictionnaire'}</SheetTitle>
            <SheetDescription>Sélection d’une valeur de dictionnaire</SheetDescription>
          </SheetHeader>

          {dictArgs ? (
            <DictionnaireEditorPanel
              kind={dictArgs.kind}
              title={dictArgs.title}
              multi={dictArgs.multi}
              defaultSelectedIds={dictArgs.defaultSelectedIds}
              onValidate={dictArgs.onValidate}
              onCancel={() => setDictOpen(false)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={bureauOpen} onOpenChange={setBureauOpen}>
        <SheetContent side='right' className='!w-[40vw] !max-w-none p-0'>
          <SheetHeader className='sr-only'>
            <SheetTitle>{bureauArgs?.title ?? 'Bureaux'}</SheetTitle>
            <SheetDescription>Sélection d’un bureau d’état civil</SheetDescription>
          </SheetHeader>

          {bureauArgs ? (
            <EtatCivilBureauPickerPanel
              title={bureauArgs.title}
              defaultSelectedId={bureauArgs.defaultSelectedId}
              onCancel={() => setBureauOpen(false)}
              onValidate={bureauArgs.onValidate}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * =========================================================================
 * REGISTRE component (hooks registre only)
 * =========================================================================
 */

type FormStateRegistre = {
  // champs affichés dans SectionIdentification (registre)
  bureau_id: string | null;
  annee: string;
  mode_registre: 'par_type' | 'chronologique_mixte' | '';
  type_acte: string;
  type_acte_ref: { ids: string[]; labels: string[] } | null;
  ordre_numerotation: 'par_type' | 'globale' | '';
  nombre_actes_estime: string;
  numero_acte_min: string;
  numero_acte_max: string;
  statut_juridique: 'esclave' | 'nouveau_libre' | '';
};


function ReferenceArchiveTabRegistre(props: Extract<ReferenceArchiveTabProps, { type: 'registre' }>) {
  const { type, registreId, mode = 'edit', onUpdated } = props;

  type DirtyKeyReg = 'identification' | 'sources';

  type ModeRegistre = 'par_type' | 'chronologique_mixte' | '';
  type OrdreNumerotation = 'par_type' | 'globale' | '';
  type StatutJuridique = 'esclave' | 'nouveau_libre' | '';

  type FormStateRegistre = {
    bureau_id: string | null;
    bureau_enregistrement_label: string; // affichage (si tu l’utilises plus tard)
    annee: string; // string pour inputs
    mode_registre: ModeRegistre;

    type_acte: string;
    type_acte_ref: { ids: string[]; labels: string[] } | null;

    ordre_numerotation: OrdreNumerotation;
    nombre_actes_estime: string;
    numero_acte_min: string;
    numero_acte_max: string;

    statut_juridique: StatutJuridique;
  };

  const toIntOrNull = (v: any): number | null => {
    const s = String(v ?? '').trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const [form, setForm] = useState<FormStateRegistre>({
    bureau_id: null,
    bureau_enregistrement_label: '',
    annee: '',
    mode_registre: '',

    type_acte: '',
    type_acte_ref: null,

    ordre_numerotation: '',
    nombre_actes_estime: '',
    numero_acte_min: '',
    numero_acte_max: '',

    statut_juridique: '',
  });

  const [registresSources, setRegistresSources] = useState<RegistreCitationDraft[]>([]);
  const [loadingRegistresSources, setLoadingRegistresSources] = useState(false);

  const [dirty, setDirty] = useState<Record<DirtyKeyReg, boolean>>({
    identification: false,
    sources: false,
  });

  const [savingBy, setSavingBy] = useState<Record<DirtyKeyReg, boolean>>({
    identification: false,
    sources: false,
  });

  const [errorBy, setErrorBy] = useState<Record<DirtyKeyReg, string | null>>({
    identification: null,
    sources: null,
  });

  const [savedAtBy, setSavedAtBy] = useState<Record<DirtyKeyReg, number | null>>({
    identification: null,
    sources: null,
  });

  const isAnyDirty = Object.values(dirty).some(Boolean);

  const markDirty = (k: DirtyKeyReg) => {
    setDirty((prev) => (prev[k] ? prev : { ...prev, [k]: true }));
    setSavedAtBy((prev) => ({ ...prev, [k]: null }));
  };

  const clearDirty = (k: DirtyKeyReg) => {
    setDirty((prev) => ({ ...prev, [k]: false }));
    setSavedAtBy((prev) => ({ ...prev, [k]: Date.now() }));
  };

  const setSectionError = (k: DirtyKeyReg, msg: string | null) => {
    setErrorBy((prev) => ({ ...prev, [k]: msg }));
  };

  const setSectionSaving = (k: DirtyKeyReg, v: boolean) => {
    setSavingBy((prev) => ({ ...prev, [k]: v }));
  };

  const setFieldIn = <K extends keyof FormStateRegistre>(key: K, value: FormStateRegistre[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (mode === 'edit') markDirty('identification');
  };

  // guard navigateur (registre) si dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isAnyDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isAnyDirty]);

  /**
   * LOAD registre row -> hydrate identification form
   */
  useEffect(() => {
    if (!registreId) return;
    let cancelled = false;

    (async () => {
      setSectionError('identification', null);

      const { data, error } = await supabase
  .from('etat_civil_registres')
  .select(
    'id,bureau_id,annee,mode_registre,ordre_numerotation,nombre_actes_estime,numero_acte_min,numero_acte_max,statut_juridique',
  )
  .eq('id', registreId)
  .maybeSingle();

  // type_acte via table de jointure
const { data: taRows, error: taErr } = await supabase
  .from('etat_civil_registres_type_acte')
  .select('type_acte_id, ref_ec_type_acte:ref_ec_type_acte(id,label)')
  .eq('registre_id', registreId);

if (taErr) {
  // tu peux choisir de "throw" ou juste log
  console.warn('load registre type_acte failed', taErr);
}

const typeActeId = (taRows?.[0] as any)?.type_acte_id ?? null;
const typeActeLabel = (taRows?.[0] as any)?.ref_ec_type_acte?.label ?? '';



      if (cancelled) return;

      if (error) {
        setSectionError('identification', error.message);
        return;
      }

      const r: any = data ?? {};
      setForm({
        bureau_id: r.bureau_id ?? null,
        bureau_enregistrement_label: '',

        annee: r.annee != null ? String(r.annee) : '',
        mode_registre: (r.mode_registre ?? '') as ModeRegistre,

        type_acte: typeActeLabel || '',
type_acte_ref: typeActeId ? { ids: [typeActeId], labels: [typeActeLabel] } : null,


        ordre_numerotation: (r.ordre_numerotation ?? '') as OrdreNumerotation,
        nombre_actes_estime: r.nombre_actes_estime != null ? String(r.nombre_actes_estime) : '',
        numero_acte_min: r.numero_acte_min != null ? String(r.numero_acte_min) : '',
        numero_acte_max: r.numero_acte_max != null ? String(r.numero_acte_max) : '',

        statut_juridique: (r.statut_juridique ?? '') as StatutJuridique,
      });

      setDirty((prev) => ({ ...prev, identification: false }));
      setSavedAtBy((prev) => ({ ...prev, identification: null }));
      setSectionError('identification', null);
    })();

    return () => {
      cancelled = true;
    };
  }, [registreId]);

  /**
   * LOAD registre citations + segments + enrich exemplaires
   * (ta version, avec erreurs branchées sur errorBy.sources)
   */
  useEffect(() => {
    if (!registreId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingRegistresSources(true);
        setSectionError('sources', null);

        // 1) citations
        const { data, error } = await supabase
          .from(TABLE_REGISTRE_CITATIONS)
          .select(
            `
              id, registre_id, exemplaire_id,
              is_missing, lacune, lacune_note, locating,
              physical_condition_ref, repro_quality_ref,
              marks, document_damage_kinds_ids,
              note, sort_order
            `,
          )
          .eq('registre_id', registreId)
          .order('sort_order', { ascending: true });

        if (cancelled) return;
        if (error) throw error;

        const rows = ((data ?? []) as RegistreCitationRow[]).sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
        let drafts: RegistreCitationDraft[] = rows.length ? rows.map(mapRowToDraft) : [];

        // 2) segments
        const citIds = drafts.map((d) => d.id).filter(Boolean) as string[];
        if (citIds.length) {
          const { data: segRows, error: segErr } = await supabase
            .from(TABLE_REGISTRE_SEGMENTS)
            .select(
              `
                id, registre_citation_id,
                kind_ref, label_override, scope,
                range_start, range_end,
                date_from, date_to, year_from, year_to,
                note, sort_order
              `,
            )
            .in('registre_citation_id', citIds)
            .order('sort_order', { ascending: true });

          if (segErr) throw segErr;

          const byCit = new Map<string, any[]>();
          for (const s of (segRows ?? []) as any[]) {
            const k = s.registre_citation_id as string;
            byCit.set(k, [...(byCit.get(k) ?? []), s]);
          }

          drafts = drafts.map((d) => {
            const segs = d.id ? (byCit.get(d.id) ?? []) : [];
            return {
              ...d,
              segments: segs.map((s: any) => ({
                id: s.id,
                kind_ref: s.kind_ref,
                label_override: s.label_override,
                scope: s.scope,
                range_start: s.range_start,
                range_end: s.range_end,
                date_from: s.date_from,
                date_to: s.date_to,
                year_from: s.year_from,
                year_to: s.year_to,
                note: s.note,
                sort_order: s.sort_order ?? 0,
              })),
            };
          });
        }

        // 3) enrich exemplaires
        const exIds = drafts.map((d) => d.exemplaire_id).filter(Boolean) as string[];
        if (exIds.length) {
          const { data: pickRows, error: pickErr } = await supabase
            .from(VIEW_EXEMPLAIRES_PICK)
            .select(
              'exemplaire_id,nature_ref,nature_code,nature_label,support_ref,support_code,support_label,unite_id,unite_titre,cote_locale,pagination_type_ref,pagination_type_code,pagination_type_label,nb_pages,depot_nom,depot_is_online,depot_is_physical,institution_nom,institution_sigle,url_base,plateforme_code,source_exemplaire_id,identifiant_interne,localisation_interne,physical_condition_ref,physical_condition_code,physical_condition_label',
            )
            .in('exemplaire_id', exIds);

          if (pickErr) throw pickErr;

          const map = new Map<string, ExemplairePick>();
          for (const r of (pickRows ?? []) as any[]) {
            map.set(r.exemplaire_id, {
              exemplaire_id: r.exemplaire_id,
              nature_ref: r.nature_ref,
              nature_code: r.nature_code,
              nature_label: r.nature_label,
              support_ref: r.support_ref,
              support_code: r.support_code,
              support_label: r.support_label,
              physical_condition_ref: r.physical_condition_ref,
              physical_condition_code: r.physical_condition_code,
              physical_condition_label: r.physical_condition_label,
              unite_id: r.unite_id ?? r.exemplaire_id,
              unite_titre: r.unite_titre,
              cote_locale: r.cote_locale,
              pagination_type_ref: r.pagination_type_ref,
              pagination_type_code: r.pagination_type_code,
              pagination_type_label: r.pagination_type_label,
              nb_pages: r.nb_pages,
              depot_nom: r.depot_nom,
              depot_is_online: r.depot_is_online,
              depot_is_physical: r.depot_is_physical,
              institution_nom: r.institution_nom,
              institution_sigle: r.institution_sigle,
              identifiant_interne: r.identifiant_interne,
              localisation_interne: r.localisation_interne,
              url_base: r.url_base,
              plateforme_code: r.plateforme_code,
              source_exemplaire_id: r.source_exemplaire_id,
            });
          }

          drafts = drafts.map((d) => {
            const r = d.exemplaire_id ? map.get(d.exemplaire_id) : undefined;
            if (!r) return d;
            return {
              ...d,
              exemplaire: {
                exemplaire_id: r.exemplaire_id,
                nature_ref: r.nature_ref,
                nature_code: r.nature_code,
                nature_label: r.nature_label,
                support_ref: r.support_ref,
                support_code: r.support_code,
                support_label: r.support_label,
                physical_condition_ref: r.physical_condition_ref,
                physical_condition_code: r.physical_condition_code,
                physical_condition_label: r.physical_condition_label,
                unite_titre: r.unite_titre,
                cote_locale: r.cote_locale,
                pagination_type_ref: r.pagination_type_ref,
                pagination_type_code: r.pagination_type_code,
                pagination_type_label: r.pagination_type_label,
                nb_pages: r.nb_pages,
                depot_nom: r.depot_nom,
                depot_is_online: r.depot_is_online,
                depot_is_physical: r.depot_is_physical,
                institution_nom: r.institution_nom,
                institution_sigle: r.institution_sigle,
                identifiant_interne: r.identifiant_interne,
                localisation_interne: r.localisation_interne,
                url_base: r.url_base,
                plateforme_code: r.plateforme_code,
                source_exemplaire_id: r.source_exemplaire_id,
              },
            };
          });
        }

        if (!cancelled) setRegistresSources(drafts.length ? drafts : []);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Erreur chargement références registre', err);
        setRegistresSources([]);
        setSectionError('sources', err?.message ?? 'Erreur chargement registre.');
      } finally {
        if (!cancelled) setLoadingRegistresSources(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [registreId]);

  /**
   * Editing helpers (registre sources)
   */
  const updateRegSource = (idx: number, patch: Partial<RegistreCitationDraft>) => {
    setRegistresSources((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    if (mode === 'edit') markDirty('sources');
  };

  const addRegSource = () => {
    setRegistresSources((prev) => [...prev, emptyRegistreCitation(prev.length)]);
    if (mode === 'edit') markDirty('sources');
  };

  const removeRegSource = (idx: number) => {
    setRegistresSources((prev) => prev.filter((_, i) => i !== idx).map((c, i) => ({ ...c, sort_order: i })));
    if (mode === 'edit') markDirty('sources');
  };

  /**
   * SAVE - identification (registre)
   */
  const saveIdentification = async () => {
    if (mode !== 'edit') return;
    if (!dirty.identification) return;

    setSectionSaving('identification', true);
    setSectionError('identification', null);

    // NB: bureau_id + annee sont NOT NULL en DB -> à sécuriser via UI/validation si besoin
    const patch: Record<string, any> = {
      bureau_id: form.bureau_id ?? null,
      annee: toIntOrNull(form.annee),
      mode_registre: form.mode_registre || null,

      ordre_numerotation: form.ordre_numerotation || null,
      nombre_actes_estime: toIntOrNull(form.nombre_actes_estime),
      numero_acte_min: toIntOrNull(form.numero_acte_min),
      numero_acte_max: toIntOrNull(form.numero_acte_max),

      statut_juridique: form.statut_juridique || null,
    };

    const { error } = await supabase.from('etat_civil_registres').update(patch).eq('id', registreId);

    const nextTypeActeId = form.type_acte_ref?.ids?.[0] ?? null;

// 1) on purge les liens existants (vu que ton UI est single)
{
  const { error: delErr } = await supabase
    .from('etat_civil_registres_type_acte')
    .delete()
    .eq('registre_id', registreId);

  if (delErr) {
    setSectionError('identification', delErr.message);
    return;
  }
}

// 2) si un type est choisi, on (re)crée le lien
if (nextTypeActeId) {
  const { error: insErr } = await supabase
    .from('etat_civil_registres_type_acte')
    .insert({ registre_id: registreId, type_acte_id: nextTypeActeId });

  if (insErr) {
    setSectionError('identification', insErr.message);
    return;
  }
}

    setSectionSaving('identification', false);

    if (error) {
      setSectionError('identification', error.message);
      return;
    }

    clearDirty('identification');
    await onUpdated?.();
  };

  /**
   * SAVE - sources (citations + segments)
   * (ta version, ré-branchée sur dirty/saving/errorBy.sources)
   */
  const saveRegistreSources = async () => {
    if (mode !== 'edit') return;
    if (!dirty.sources) return;

    setSectionSaving('sources', true);
    setSectionError('sources', null);

    try {
      // --- 1) delete removed citations
      const uiExistingIds = registresSources.map((s) => s.id).filter(Boolean) as string[];
      const { data: existing, error: errExisting } = await supabase
        .from(TABLE_REGISTRE_CITATIONS)
        .select('id')
        .eq('registre_id', registreId);

      if (errExisting) throw errExisting;

      const existingIds = (existing ?? []).map((r: any) => r.id as string);
      const toDelete = existingIds.filter((id) => !uiExistingIds.includes(id));

      if (toDelete.length) {
        await supabase.from(TABLE_REGISTRE_SEGMENTS).delete().in('registre_citation_id', toDelete);
        const { error: delErr } = await supabase.from(TABLE_REGISTRE_CITATIONS).delete().in('id', toDelete);
        if (delErr) throw delErr;
      }

      // --- 2) upsert citations
      const citPayload = registresSources
        .map((c, idx) => {
          if (!c.exemplaire_id) return null;

          const base = {
            registre_id: registreId,
            exemplaire_id: c.exemplaire_id,

            is_missing: toBoolOrNull((c as any).is_missing),
            lacune: toBoolOrNull((c as any).lacune),
            lacune_note: ((c as any).lacune_note ?? null)
              ? String((c as any).lacune_note).trim() || null
              : null,
            locating: (c as any).locating ?? { systems: [{}] },

            physical_condition_ref: toUuidOrNull((c as any).physical_condition_ref),
            repro_quality_ref: toUuidOrNull((c as any).repro_quality_ref),

            marks: ((c as any).marks ?? '').trim() || null,
            document_damage_kinds_ids: Array.isArray((c as any).document_damage_kinds_ids)
              ? (c as any).document_damage_kinds_ids
              : [],

            note: ((c as any).note ?? '').trim() || null,
            sort_order: idx,
          };

          return c.id ? { id: c.id, ...base } : base;
        })
        .filter(Boolean) as any[];

      const { data: upserted, error: upErr } = await supabase
        .from(TABLE_REGISTRE_CITATIONS)
        .upsert(citPayload, { onConflict: 'id' })
        .select('id, exemplaire_id, sort_order');

      if (upErr) throw upErr;

      // backfill ids
      if (upserted?.length) {
        const byKey = new Map(upserted.map((r: any) => [`${r.exemplaire_id}__${r.sort_order}`, r.id as string]));
        setRegistresSources((prev) =>
          prev.map((c, idx) => {
            if (c.id) return c;
            const key = `${c.exemplaire_id}__${idx}`;
            const newId = byKey.get(key);
            return newId ? { ...c, id: newId } : c;
          }),
        );
      }

      // --- 3) segments sync (delete missing + upsert)
      const citIdsFromUpsert = (upserted ?? []).map((r: any) => r.id as string).filter(Boolean);
      const allCitIds = citIdsFromUpsert.length
        ? citIdsFromUpsert
        : (registresSources.map((c) => c.id).filter(Boolean) as string[]);

      if (allCitIds.length) {
        const { data: existingSegs, error: segListErr } = await supabase
          .from(TABLE_REGISTRE_SEGMENTS)
          .select('id, registre_citation_id')
          .in('registre_citation_id', allCitIds);

        if (segListErr) throw segListErr;

        const existingSegIds = new Map<string, string[]>();
        for (const s of (existingSegs ?? []) as any[]) {
          const k = s.registre_citation_id as string;
          existingSegIds.set(k, [...(existingSegIds.get(k) ?? []), s.id as string]);
        }

        const uiSegIdsByCit = new Map<string, string[]>();
        for (const c of registresSources) {
          if (!c.id) continue;
          const ids = (c.segments ?? []).map((s: any) => s.id).filter(Boolean) as string[];
          uiSegIdsByCit.set(c.id, ids);
        }

        const toDeleteSeg: string[] = [];
        for (const [citId, segIds] of existingSegIds.entries()) {
          const uiIds = uiSegIdsByCit.get(citId) ?? [];
          for (const id of segIds) if (!uiIds.includes(id)) toDeleteSeg.push(id);
        }

        if (toDeleteSeg.length) {
          const { error: delSegErr } = await supabase.from(TABLE_REGISTRE_SEGMENTS).delete().in('id', toDeleteSeg);
          if (delSegErr) throw delSegErr;
        }

        const segPayload: any[] = [];
        for (const c of registresSources) {
          if (!c.id) continue;
          const segs = (c.segments ?? []) as any[];
          segs
            .filter((s) => s && (s.kind_ref || s.label_override || s.range_start || s.range_end))
            .forEach((s, i) => {
              const base = {
                registre_citation_id: c.id,
                kind_ref: s.kind_ref ?? null,
                label_override: (s.label_override ?? '').trim() || null,
                scope: s.scope ?? null,
                range_start: s.range_start ?? null,
                range_end: s.range_end ?? null,
                date_from: s.date_from ?? null,
                date_to: s.date_to ?? null,
                year_from: s.year_from ?? null,
                year_to: s.year_to ?? null,
                note: (s.note ?? '').trim() || null,
                sort_order: typeof s.sort_order === 'number' ? s.sort_order : i,
              };
              segPayload.push(s.id ? { id: s.id, ...base } : base);
            });
        }

        if (segPayload.length) {
          const { error: segUpErr } = await supabase
            .from(TABLE_REGISTRE_SEGMENTS)
            .upsert(segPayload, { onConflict: 'id' });
          if (segUpErr) throw segUpErr;
        }
      }

      clearDirty('sources');
      await onUpdated?.();
    } catch (err: any) {
      setSectionError('sources', err?.message ?? 'Erreur lors de l’enregistrement des sources registre.');
    } finally {
      setSectionSaving('sources', false);
    }
  };

  const saveAll = async () => {
    if (mode !== 'edit') return;
    if (dirty.identification) await saveIdentification();
    if (dirty.sources) await saveRegistreSources();
  };

  const handleLegacySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveAll();
  };

  return (
    <div className='p-4'>
      <form className='space-y-6' onSubmit={handleLegacySubmit}>
        <div className='space-y-10'>
          <div>
            <h2 className='text-base font-semibold text-slate-900'>Référence archive</h2>

            <div className='mt-1 space-y-1'>
              <p className='text-sm leading-relaxed text-slate-700'>
                Cet onglet vous permet de décrire le registre en tant que document d’archive : identification, dépôts de conservation.
              </p>
              <p>
                <span className='font-semibold text-sm text-slate-700'>Il sert à retrouver et citer précisément le registre.</span>
              </p>
            </div>
          </div>

          {/* Global helper (top) */}
          {mode === 'edit' ? (
            <div className='rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='text-sm font-semibold text-slate-900'>État des modifications</div>
                  <div className='mt-0.5 text-xs text-slate-600'>
                    {isAnyDirty ? 'Certaines sections ont des modifications non enregistrées.' : 'Tout est à jour.'}
                  </div>
                </div>

                <button
                  type='button'
                  onClick={saveAll}
                  disabled={!isAnyDirty || Object.values(savingBy).some(Boolean)}
                  className='inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
                  title={isAnyDirty ? 'Enregistrer toutes les sections modifiées' : 'Aucune modification'}
                >
                  {Object.values(savingBy).some(Boolean) ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Save className='h-4 w-4' />
                  )}
                  Tout enregistrer
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Identification — registre */}
        {type === 'registre' ? (
          <div className='rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-4'>
            <SectionHeaderRow
              title='Identification'
              subtitle='Caractéristiques administratives du registre.'
              dirty={dirty.identification}
              saving={savingBy.identification}
              savedAt={savedAtBy.identification}
              onSave={mode === 'edit' ? saveIdentification : undefined}
              readonly={mode === 'view'}
            />

            <SectionIdentification
              id={registreId}
              form={form as any}
              type='registre'
              mode={mode}
              setField={setFieldIn as any}
            />

            {errorBy.identification ? (
              <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800'>
                {errorBy.identification}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Sources — registre */}
        {type === 'registre' ? (
          <div className='rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-4'>
            <SectionHeaderRow
              title='Sources'
              subtitle='Citations par exemplaire + segments.'
              dirty={mode === 'edit' ? dirty.sources : false}
              saving={mode === 'edit' ? savingBy.sources : false}
              savedAt={mode === 'edit' ? savedAtBy.sources : Date.now()}
              onSave={mode === 'edit' ? saveRegistreSources : undefined}
              disabled={loadingRegistresSources}
              readonly={mode === 'view'}
            />

            {mode === 'edit' ? (
              <SectionSources
                type='registre'
                mode='edit'
                registreId={registreId ?? null}
                sources={registresSources}
                loading={loadingRegistresSources}
                onAdd={addRegSource}
                onRemove={removeRegSource}
                onChange={updateRegSource}
              />
            ) : (
              <SectionSources
                type='registre'
                mode='view'
                registreId={registreId ?? null}
                sources={registresSources}
                loading={loadingRegistresSources}
              />
            )}

            {errorBy.sources ? (
              <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800'>
                {errorBy.sources}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Footer registre edit */}
        {mode === 'edit' ? (
          <div className='flex items-center justify-end gap-3'>
            <button
              type='button'
              onClick={saveAll}
              disabled={!isAnyDirty || Object.values(savingBy).some(Boolean)}
              className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
              title={isAnyDirty ? 'Enregistrer toutes les sections modifiées' : 'Aucune modification'}
            >
              {Object.values(savingBy).some(Boolean) ? 'Enregistrement…' : 'Tout enregistrer'}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}