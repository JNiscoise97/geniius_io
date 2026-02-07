// ReferenceArchiveTab.tsx
import { useEffect, useMemo, useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import type { EtatCivilActe } from '@/types/etatcivil';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  DictionnaireEditorPanel,
  type DictionnaireKind,
} from '@/components/shared/DictionnaireEditorPanel';
import {
  EtatCivilBureauPickerPanel,
  formatBureauLabel,
  type EtatCivilBureau,
} from '@/components/shared/EtatCivilBureauPickerPanel';
import { AlertTriangle, Lock, Unlock } from 'lucide-react';
import type { ActeCitationDraft, ExemplairePick, Mode } from '@/features/archives/reference/types';
import { SectionIdentification, SectionSources } from '@/features/archives/reference';
import { SectionEnregistrementActe } from '@/features/archives/reference/SectionEnregistrementActe';

type LieuSituation = 'bureau_courant' | 'autre_bureau' | 'transporte';

type ReferenceArchiveTabProps = {
  acte: EtatCivilActe;
  mode?: Mode;
  bureauLabel?: string;
  onUpdated?: () => Promise<void> | void;
};

/**
 * =========================================================================
 * NOUVEAU MODELE - TYPES
 * =========================================================================
 * - sources = citations (etat_civil_acte_citations)
 * - chaque citation pointe vers une exemplaire (ref_exemplaires)
 * - l’UI dénormalise un peu via v_exemplaires_pick
 */

type ActeCitationRow = {
  id: string;
  acte_id: string;
  exemplaire_id: string;

  loc_start: number | null;
  loc_end: number | null;
  loc_raw: string | null;

  is_missing: boolean;
  note: string | null;
  sort_order: number;

  // ✅ DB: uuid
  physical_condition_ref: string | null;
  repro_quality_ref: string | null;

  // ✅ jsonb
  missing_ranges: any;

  damage_notes: string | null;
  repro_notes: string | null;

  // ✅ atomiques
  marginal_mentions_present: boolean | null;
  marginal_mentions_count: number | null;
  signatures_present: boolean | null;
  signatures_count: number | null;
  marginal_crossouts_present: boolean | null;
  marginal_crossouts_count: number | null;

  // ✅ si tu as aussi ces champs dans la table citations (sinon ignore)
  langue_ref?: string | null;
  ecriture_ref?: string | null;
  handwriting_legibility_ref?: string | null;

  // ✅ multi: arrays d'uuid
  document_damage_kinds_ids?: string[] | null;
  document_readability_features_ids?: string[] | null;

  // localisation / repères
  anchor_hint?: string | null;
  acte_no?: number | null;

  // lacunes
  lacune?: boolean | null;
  lacune_note?: string | null;

  // divers
  marks?: string | null;
  work_note?: string | null;
};

type FormState = {
  type_acte: string;
  type_acte_ref: { ids: string[]; labels: string[] } | null;

  numero_acte: string;
  date: string;
  heure: string;

  bureau_id: string | null;
  bureau_enregistrement_label: string;

  lieu_situation: LieuSituation;
  redaction_bureau_id: string | null;
  redaction_bureau_label: string;
  lieu_transport_raison: string;

  // legacy (à supprimer plus tard)
  comparution_observations: string;

  auteur_fonction: string;
  auteur_institutionnel_ref: { ids: string[]; labels: string[] } | null;
};

function toDateInput(v: any) {
  if (!v) return '';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function emptyCitation(): ActeCitationDraft {
  return {
    id: undefined,
    exemplaire_id: undefined,
    exemplaire: undefined,

    loc_start: null,
    loc_end: null,
    loc_raw: '',

    is_missing: false,
    note: '',
    sort_order: 0,

    // ✅ uuid
    physical_condition_ref: null,
    repro_quality_ref: null,

    // ✅ notes
    damage_notes: '',
    repro_notes: '',

    // ✅ jsonb
    missing_ranges: [],

    // ✅ atomiques
    marginal_mentions_present: null,
    marginal_mentions_count: null,
    signatures_present: null,
    signatures_count: null,
    marginal_crossouts_present: null,
    marginal_crossouts_count: null,

    // ✅ si présents dans le draft/UI
    langue_ref: null,
    ecriture_ref: null,
    handwriting_legibility_ref: null,
    document_damage_kinds_ids: [],
    document_readability_features_ids: [],
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

    is_missing: r?.is_missing ?? false,
    note: r?.note ?? '',
    sort_order: typeof r?.sort_order === 'number' ? r.sort_order : 0,

    // ✅ uuid direct
    physical_condition_ref: (r?.physical_condition_ref ?? null) as any,
    repro_quality_ref: (r?.repro_quality_ref ?? null) as any,

    damage_notes: r?.damage_notes ?? '',
    repro_notes: r?.repro_notes ?? '',

    missing_ranges: Array.isArray(r?.missing_ranges)
      ? (r!.missing_ranges as any[]).filter(Boolean)
      : [],

    marginal_mentions_present: r?.marginal_mentions_present ?? null,
    marginal_mentions_count:
      typeof r?.marginal_mentions_count === 'number' ? r.marginal_mentions_count : null,

    signatures_present: r?.signatures_present ?? null,
    signatures_count: typeof r?.signatures_count === 'number' ? r.signatures_count : null,

    marginal_crossouts_present: r?.marginal_crossouts_present ?? null,
    marginal_crossouts_count:
      typeof r?.marginal_crossouts_count === 'number' ? r.marginal_crossouts_count : null,

    // ✅ si tu les as dans la table citations
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
  } as any;
}

export default function ReferenceArchiveTab({
  acte,
  mode = 'edit',
  bureauLabel,
  onUpdated,
}: ReferenceArchiveTabProps) {
  const acteId = acte.id;
  const label = acte.label ?? '';
  const tar = (acte as any).type_acte_ref;
  const tai = (acte as any).auteur_institutionnel_ref;

  const initialState: FormState = useMemo(
    () => ({
      type_acte: (acte as any).type_acte ?? '',
      type_acte_ref: tar?.id ? { ids: [tar.id], labels: [tar.label ?? ''] } : null,

      numero_acte: String((acte as any).numero_acte ?? ''),
      date: toDateInput((acte as any).date),
      heure: (acte as any).heure ?? '',

      bureau_id: (acte as any).bureau_id ?? null,
      bureau_enregistrement_label: bureauLabel ?? '',

      lieu_situation: ((acte as any).lieu_situation as LieuSituation) ?? 'bureau_courant',
      redaction_bureau_id: (acte as any).redaction_bureau_id ?? null,
      redaction_bureau_label: (acte as any).redaction_bureau_label ?? '',
      lieu_transport_raison: (acte as any).lieu_transport_raison ?? '',

      // legacy
      comparution_observations: (acte as any).comparution_observations ?? '',

      auteur_fonction: (acte as any).auteur_fonction ?? '',
      auteur_institutionnel_ref: tai?.id ? { ids: [tai.id], labels: [tai.label ?? ''] } : null,
    }),
    [acte, bureauLabel],
  );

  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [sources, setSources] = useState<ActeCitationDraft[]>([emptyCitation()]);

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

  const [labelLocked, setLabelLocked] = useState(true);
  const [labelDraft, setLabelDraft] = useState(label);

  const labelRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(initialState);
  }, [initialState]);

  /**
   * =========================================================================
   * LOAD citations (etat_civil_acte_citations) + enrich from v_exemplaires_pick
   * =========================================================================
   */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoadingSources(true);
      setErrorMsg(null);

      // 1) load raw citations
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
        setErrorMsg(error.message);
        setSources([emptyCitation()]);
        setLoadingSources(false);
        return;
      }

      const rows = data ?? [];
      const drafts = rows.map((r) => normalizeCitationRow(r));

      // si aucune citation -> 1 ligne vide
      if (!drafts.length) {
        setSources([emptyCitation()]);
        setLoadingSources(false);
        return;
      }

      // 2) enrich from view (optional but nice)
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
          'exemplaire_id,nature_ref,nature_code,nature_label,support_ref,support_code,support_label,unite_id,unite_titre,cote_locale,pagination_type_ref,pagination_type_code,pagination_type_label,nb_pages,depot_nom,depot_is_online,depot_is_physical,institution_nom,institution_sigle,url_base,plateforme_code,source_exemplaire_id,identifiant_interne,localisation_interne,physical_condition_ref, physical_condition_code,physical_condition_label ',
        )
        .in('exemplaire_id', manIds);

      if (cancelled) return;

      if (pickErr) {
        // on affiche quand même les citations sans enrichissement
        setSources(drafts);
        setLoadingSources(false);
        return;
      }

      const pickRows = (pickData ?? []) as any[];

      // ⚠️ La view peut dupliquer une exemplaire si plusieurs url (acces_numeriques).
      // On choisit la "meilleure" ligne par exemplaire : celle qui a url_base non null si possible.
      const bestByManId = new Map<string, ExemplairePick>();
      for (const r of pickRows) {
        const current = bestByManId.get(r.exemplaire_id);
        const candidate: ExemplairePick = {
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

        if (!current) {
          bestByManId.set(r.exemplaire_id, candidate);
          continue;
        }

        const curHasUrl = Boolean((current.url_base ?? '').trim());
        const candHasUrl = Boolean((candidate.url_base ?? '').trim());

        if (!curHasUrl && candHasUrl) {
          bestByManId.set(r.exemplaire_id, candidate);
        }
      }

      const enriched = drafts.map((d) => {
        const e = d.exemplaire_id ? bestByManId.get(d.exemplaire_id) : null;
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

      setSources(enriched);
      setLoadingSources(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [acteId]);

  useEffect(() => {
    setLabelDraft(label);
    setLabelLocked(true);
  }, [label]);

  useEffect(() => {
    if (!labelLocked) labelRef.current?.focus();
  }, [labelLocked]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateSource = (idx: number, patch: Partial<ActeCitationDraft>) => {
    setSources((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addSource = () => {
    setSources((prev) => [...prev, emptyCitation()]);
  };

  const removeSource = (idx: number) => {
    setSources((prev) => {
      // ✅ on garde 1 ligne minimum
      if (prev.length === 1) return [emptyCitation()];
      return prev.filter((_, i) => i !== idx);
    });
  };

  const toBoolOrNull = (v: any): boolean | null => {
    if (v === true) return true;
    if (v === false) return false;
    return null;
  };

  /**
   * =========================================================================
   * SAVE citations
   * =========================================================================
   * Stratégie "safe":
   * 1) delete d’abord les citations DB supprimées côté UI (par id connu)
   * 2) upsert ensuite (insert/update)
   */
  const upsertCitations = async () => {
    // 0) ids UI existants
    const uiExistingIds = sources.map((s) => s.id).filter(Boolean) as string[];

    // 1) delete rows removed in UI
    const { data: existing, error: errExisting } = await supabase
      .from('etat_civil_acte_citations')
      .select('id')
      .eq('acte_id', acteId);

    if (errExisting) throw errExisting;

    const existingIds = (existing ?? []).map((r: any) => r.id as string);
    const toDelete = existingIds.filter((id) => !uiExistingIds.includes(id));

    if (toDelete.length) {
      const { error } = await supabase
        .from('etat_civil_acte_citations')
        .delete()
        .in('id', toDelete);
      if (error) throw error;
    }

    // 2) upsert (IMPORTANT: include id when present)
    const payload = sources
      .map((c, idx) => {
        if (!c.exemplaire_id) return null;

        const base = {
          acte_id: acteId,
          exemplaire_id: c.exemplaire_id,

          loc_start: c.loc_start ?? null,
          loc_end: c.loc_end ?? null,
          loc_raw: (c.loc_raw ?? '').trim() || null,

          is_missing: c.is_missing,
          note: (c.note ?? '').trim() || null,

          sort_order: idx,

          // ✅ uuid direct
          physical_condition_ref: toUuidOrNull((c as any).physical_condition_ref),
          repro_quality_ref: toUuidOrNull((c as any).repro_quality_ref),

          damage_notes: (c.damage_notes ?? '').trim() || null,
          repro_notes: (c.repro_notes ?? '').trim() || null,

          missing_ranges: Array.isArray(c.missing_ranges) ? c.missing_ranges : [],

          marginal_mentions_present: toBoolOrNull(c.marginal_mentions_present),
          marginal_mentions_count:
            c.marginal_mentions_present === true ? (c.marginal_mentions_count ?? null) : null,

          signatures_present: toBoolOrNull(c.signatures_present),
          signatures_count: c.signatures_present === true ? (c.signatures_count ?? null) : null,

          marginal_crossouts_present: toBoolOrNull(c.marginal_crossouts_present),
          marginal_crossouts_count:
            c.marginal_crossouts_present === true ? (c.marginal_crossouts_count ?? null) : null,

          // ✅ si tu les enregistres aussi au niveau citation
          langue_ref: (c as any).langue_ref ?? null,
          ecriture_ref: (c as any).ecriture_ref ?? null,
          handwriting_legibility_ref: (c as any).handwriting_legibility_ref ?? null,

          document_damage_kinds_ids: Array.isArray((c as any).document_damage_kinds_ids)
            ? (c as any).document_damage_kinds_ids
            : [],
          document_readability_features_ids: Array.isArray(
            (c as any).document_readability_features_ids,
          )
            ? (c as any).document_readability_features_ids
            : [],

          anchor_hint: (c as any).anchor_hint?.trim?.() || null,
          acte_no: (c as any).acte_no ?? null,

          // ➕ AJOUTS lacunes
          lacune: toBoolOrNull((c as any).lacune),
          lacune_note: (c as any).lacune_note?.trim?.() || null,

          // ➕ AJOUTS divers
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

    // 3) (optionnel mais conseillé) recoller les ids générés côté DB dans le state
    // pour éviter que la prochaine sauvegarde réinsère à nouveau
    if (upserted?.length) {
      const byKey = new Map(
        upserted.map((r: any) => [`${r.exemplaire_id}__${r.sort_order}`, r.id as string]),
      );

      setSources((prev) =>
        prev.map((c, idx) => {
          if (c.id) return c;
          const key = `${c.exemplaire_id}__${idx}`;
          const newId = byKey.get(key);
          return newId ? { ...c, id: newId } : c;
        }),
      );
    }
  };

  const toUuidOrNull = (v: any): string | null => {
    if (!v) return null;
    if (typeof v === 'string') return v || null;
    if (typeof v === 'object') {
      if (typeof v.id === 'string') return v.id;
      if (Array.isArray(v.ids) && typeof v.ids[0] === 'string') return v.ids[0];
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const patch: Record<string, any> = {
      type_acte: form.type_acte || null,
      type_acte_ref: form.type_acte_ref?.ids?.[0] ?? null,
      numero_acte: form.numero_acte || null,
      date: form.date || null,
      heure: form.heure || null,

      label: (labelDraft ?? '').trim() || null,

      bureau_id: form.bureau_id ?? null,
      redaction_bureau_id: form.lieu_situation === 'autre_bureau' ? form.redaction_bureau_id : null,

      lieu_situation: form.lieu_situation,
      lieu_transport_raison:
        form.lieu_situation === 'transporte' ? form.lieu_transport_raison || null : null,

      // legacy
      comparution_observations:
        form.lieu_situation === 'transporte' ? form.comparution_observations || null : null,

      auteur_fonction: form.auteur_fonction || null,
      auteur_institutionnel_ref: form.auteur_institutionnel_ref?.ids?.[0] ?? null,
    };

    const { error } = await supabase.from('etat_civil_actes').update(patch).eq('id', acteId);

    if (error) {
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    try {
      await upsertCitations();
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Erreur lors de l’enregistrement des citations.');
      setSaving(false);
      return;
    }

    setSaving(false);
    await onUpdated?.();
  };

  return (
    <div className='p-4'>
      <form className='space-y-6' onSubmit={handleSubmit}>
        <div className='space-y-10'>
          <div>
            <h2 className='text-base font-semibold text-slate-900'>Référence archive</h2>
            <div className='mt-1 space-y-1'>
              <p className='text-sm leading-relaxed text-slate-700'>
                Cet onglet vous permet de décrire l’acte en tant que document d’archive : registre,
                date, lieu de rédaction, dépôts de conservation et état du document.
              </p>
              <p>
                <span className='font-semibold text-sm text-slate-700'>
                  Il sert à retrouver et citer précisément l’acte.
                </span>
              </p>
            </div>
          </div>

          <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
              <div className='min-w-0'>
                <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
                <div className='mt-0.5 text-xs text-amber-800'>
                  <ol>
                    <li>Mode view (lieu de rédaction)</li>
                    <li>raison du transport</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          {mode == 'edit' && (
            <div className='w-full'>
              <div className='w-full md:max-w-xl'>
                <label className='block text-xs font-medium text-slate-700'>Label</label>

                <div className='mt-1 flex items-center gap-2 w-full'>
                  <input
                    value={labelDraft}
                    onChange={(e) => setLabelDraft(e.target.value)}
                    readOnly={labelLocked}
                    className={[
                      'w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none',
                      labelLocked
                        ? 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
                        : 'border-slate-200 bg-white text-slate-900 focus:border-slate-400',
                    ].join(' ')}
                    placeholder='Label…'
                  />

                  <button
                    type='button'
                    onClick={() => setLabelLocked((v) => !v)}
                    className={[
                      'inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm',
                      labelLocked
                        ? 'border-slate-200 bg-white hover:bg-slate-50'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100',
                    ].join(' ')}
                    title={labelLocked ? 'Déverrouiller le label' : 'Verrouiller le label'}
                    aria-label={labelLocked ? 'Déverrouiller le label' : 'Verrouiller le label'}
                  >
                    {labelLocked ? (
                      <Lock className='h-4 w-4 text-slate-700' />
                    ) : (
                      <Unlock className='h-4 w-4 text-slate-800' />
                    )}
                  </button>
                </div>

                {labelLocked ? (
                  <p className='mt-1 text-xs text-slate-500'>
                    Le label est verrouillé. Déverrouille-le pour le modifier.
                  </p>
                ) : (
                  <p className='mt-1 text-xs text-amber-700'>
                    Label déverrouillé : toute modification sera enregistrée.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* IDENTIFICATION */}

        <SectionIdentification
          id={acteId}
          form={form as any}
          type='acte'
          mode={mode}
          setField={setField as any}
        />

        <SectionEnregistrementActe
          mode={mode}
          form={form as any}
          setField={setField as any}
          onEditBureauEnregistrement={() => {
            setBureauArgs({
              title: 'Sélectionner un bureau d’état civil',
              defaultSelectedId: form.bureau_id,
              onValidate: async (bureau) => {
                setField('bureau_id', bureau.id);
                setField('bureau_enregistrement_label', formatBureauLabel(bureau));
                setBureauOpen(false);
              },
            });
            setBureauOpen(true);
          }}
          onClearBureauEnregistrement={() => {
            setField('bureau_id', null);
            setField('bureau_enregistrement_label', '');
          }}
          onEditBureauRedaction={() => {
            setBureauArgs({
              title: 'Sélectionner le bureau de rédaction',
              defaultSelectedId: form.redaction_bureau_id,
              onValidate: async (bureau) => {
                setField('redaction_bureau_id', bureau.id);
                setField('redaction_bureau_label', formatBureauLabel(bureau));
                setBureauOpen(false);
              },
            });
            setBureauOpen(true);
          }}
          onClearBureauRedaction={() => {
            setField('redaction_bureau_id', null);
            setField('redaction_bureau_label', '');
          }}
        />

        {/* SOURCES */}
        {mode === 'edit' ? (
          <SectionSources
            type='acte'
            mode='edit'
            registreId={(acte as any).registre_id ?? null}
            sources={sources}
            loading={loadingSources}
            onAdd={addSource}
            onRemove={removeSource}
            onChange={updateSource}
          />
        ) : (
          <SectionSources
            type='acte'
            mode='view'
            registreId={(acte as any).registre_id ?? null}
            sources={sources}
            loading={loadingSources}
          />
        )}

        {errorMsg && (
          <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
            {errorMsg}
          </div>
        )}

        {mode === 'edit' ? (
          <div className='flex items-center justify-end gap-3'>
            <button
              type='submit'
              disabled={saving}
              className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        ) : null}
      </form>

      {/* DRAWERS */}
      <Sheet open={dictOpen} onOpenChange={setDictOpen}>
        <SheetContent side='right' className='w-[520px] sm:w-[640px] p-0'>
          <SheetHeader className='sr-only'>
            <SheetTitle>{dictArgs?.title ?? 'Dictionnaire'}</SheetTitle>
            <SheetDescription>Sélection d’une valeur de dictionnaire</SheetDescription>
          </SheetHeader>

          {dictArgs && (
            <DictionnaireEditorPanel
              kind={dictArgs.kind}
              title={dictArgs.title}
              multi={dictArgs.multi}
              defaultSelectedIds={dictArgs.defaultSelectedIds}
              onValidate={dictArgs.onValidate}
              onCancel={() => setDictOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={bureauOpen} onOpenChange={setBureauOpen}>
        <SheetContent side='right' className='!w-[40vw] !max-w-none p-0'>
          <SheetHeader className='sr-only'>
            <SheetTitle>{bureauArgs?.title ?? 'Bureaux'}</SheetTitle>
            <SheetDescription>Sélection d’un bureau d’état civil</SheetDescription>
          </SheetHeader>

          {bureauArgs && (
            <EtatCivilBureauPickerPanel
              title={bureauArgs.title}
              defaultSelectedId={bureauArgs.defaultSelectedId}
              onCancel={() => setBureauOpen(false)}
              onValidate={bureauArgs.onValidate}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
