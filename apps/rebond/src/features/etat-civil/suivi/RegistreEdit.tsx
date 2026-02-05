// RegistreEdit.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Archive, Settings, AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useEtatCivilStore } from '@/store/etatcivil';
import type { EtatCivilBureau, EtatCivilRegistre } from '@/types/etatcivil';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

import { getRegistreLabel } from './BureauRegistres';
import { getIconForStatutFromStats } from '@/features/actes/transcription/constants/statutConfig';

import {
  SectionIdentification,
  SectionSources,
  type RegistreReferenceIdentificationFormState,
} from '@/features/archives/reference';

import type { RegistreCitationDraft, ExemplairePick } from '@/features/archives/reference/types';

import {
  DictionnaireEditorPanel,
  type DictionnaireKind,
} from '@/components/shared/DictionnaireEditorPanel';

const tabs = [{ label: 'Référence archive', icon: Archive }] as const;
type RegistreEditTab = (typeof tabs)[number]['label'];

const TABLE_REGISTRES = 'etat_civil_registres';
const TABLE_REGISTRE_CITATIONS = 'etat_civil_registre_citations';
const TABLE_REGISTRE_SEGMENTS = 'etat_civil_registre_exemplaire_segments';
const VIEW_EXEMPLAIRES_PICK = 'v_exemplaires_pick';

const TABLE_REGISTRE_TYPE_ACTE = 'etat_civil_registres_type_acte';
const TABLE_REF_TYPE_ACTE = 'ref_ec_type_acte';

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

function emptyCitation(sort_order: number): RegistreCitationDraft {
  return {
    id: undefined,
    exemplaire_id: undefined,
    exemplaire: undefined,

    is_missing: null,
    lacune: null,
    lacune_note: null,
    locating: { systems: [{}] }, // UI lit systems[0]

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

    segments: [], // chargé séparément
  };
}

function makeInitialForm(args: {
  registre: EtatCivilRegistre;
  bureauId: string | null;
  bureauLabel: string;
}): RegistreReferenceIdentificationFormState {
  const { registre, bureauId, bureauLabel } = args;

  return {
    // legacy texte (colonne)
    type_acte: registre.type_acte ?? '',
    // UI only (table de jointure)
    type_acte_ref: null,

    bureau_id: bureauId,
    bureau_enregistrement_label: bureauLabel,
  };
}

function safeTrimOrNull(v: unknown): string | null {
  const s = (v ?? '').toString().trim();
  return s ? s : null;
}

function safeJson(v: any, fallback: any = {}): any {
  return v ?? fallback;
}

export default function RegistreEdit() {
  const { id: registreId } = useParams();
  const navigate = useNavigate();

  const fetchRegistre = useEtatCivilStore((s) => s.fetchRegistre);
  const fetchBureau = useEtatCivilStore((s) => s.fetchBureau);

  const [activeSection, setActiveSection] = useState<RegistreEditTab>(tabs[0].label);

  const [registre, setRegistre] = useState<EtatCivilRegistre | null>(null);
  const [bureau, setBureau] = useState<EtatCivilBureau | null>(null);
  const [bureauId, setBureauId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Référence archive
  const [form, setForm] = useState<RegistreReferenceIdentificationFormState | null>(null);
  const [sources, setSources] = useState<RegistreCitationDraft[]>([emptyCitation(0)]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dictionnaire
  const [dictOpen, setDictOpen] = useState(false);
  const [dictArgs, setDictArgs] = useState<{
    kind: DictionnaireKind;
    title: string;
    multi: boolean;
    defaultSelectedIds: string[];
    onValidate: (items: { id: string; code: string; label: string }[]) => Promise<void> | void;
  } | null>(null);

  // Dirty tracking
  const initialSnapshotRef = useRef<string>('');
  const snapshot = useMemo(() => JSON.stringify({ form, sources }), [form, sources]);
  const isFormDirty = () => Boolean(form) && snapshot !== initialSnapshotRef.current;

  const bureauLabel = useMemo(() => {
    if (!bureau?.nom) return '';
    return `${bureau.nom}${bureau.departement ? ` (${bureau.departement})` : ''}`;
  }, [bureau?.nom, bureau?.departement]);

  // ---------------------------------------------------------------------------
  // Reset à chaque changement d'id
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!registreId) return;
    setRegistre(null);
    setBureau(null);
    setBureauId(null);
    setForm(null);
    setSources([emptyCitation(0)]);
    setErrorMsg(null);
    initialSnapshotRef.current = '';
  }, [registreId]);

  // ---------------------------------------------------------------------------
  // Chargement principal : registre + bureau_id + bureau
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!registreId) return;

    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        const reg = await fetchRegistre(registreId);

        const { data: regRow, error: regErr } = await supabase
          .from(TABLE_REGISTRES)
          .select('bureau_id')
          .eq('id', registreId)
          .single();

        if (regErr) throw regErr;
        const bId = (regRow?.bureau_id as string | null) ?? null;

        const bur = bId ? await fetchBureau(bId) : undefined;

        if (cancelled) return;

        setRegistre(reg ?? null);
        setBureau(bur ?? null);
        setBureauId(bId);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Erreur chargement page RegistreEdit', err);
        setRegistre(null);
        setBureau(null);
        setBureauId(null);
        setErrorMsg(err?.message ?? 'Erreur chargement');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [registreId, fetchRegistre, fetchBureau]);

  // ---------------------------------------------------------------------------
  // Chargement des sources (citations du registre) + segments + enrichissement exemplaire
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!registreId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingSources(true);
        setErrorMsg(null);

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

        let drafts = rows.length ? rows.map(mapRowToDraft) : [emptyCitation(0)];

        // segments
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

        // enrich exemplaires
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

        setSources(drafts);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Erreur chargement références registre', err);
        setSources([emptyCitation(0)]);
        setErrorMsg(err?.message ?? 'Erreur chargement références');
      } finally {
        if (!cancelled) setLoadingSources(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [registreId]);

  // ---------------------------------------------------------------------------
  // Init form (quand registre+bureau chargés)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!registreId || !registre) return;

    setForm(
      makeInitialForm({
        registre,
        bureauId,
        bureauLabel,
      }),
    );

    loadRegistreTypeActeRefs(registreId).catch((err) => {
      console.error('Erreur chargement types acte registre', err);
      setErrorMsg(err?.message ?? 'Erreur chargement type_acte_ref');
    });
  }, [registreId, registre, bureauId, bureauLabel]);

  // ---------------------------------------------------------------------------
  // Baseline snapshot (dirty diff)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!registre || !form) return;
    if (loadingSources) return;
    initialSnapshotRef.current = JSON.stringify({ form, sources });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registre, form, loadingSources]);

  // ---------------------------------------------------------------------------
  // Guard de sortie (beforeunload)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saving || isFormDirty()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, snapshot]);

  // ---------------------------------------------------------------------------
  // Helpers UI/state
  // ---------------------------------------------------------------------------
  const setField = <K extends keyof RegistreReferenceIdentificationFormState>(
    key: K,
    value: RegistreReferenceIdentificationFormState[K],
  ) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const onAdd = () => setSources((prev) => [...prev, emptyCitation(prev.length)]);

  const onRemove = (idx: number) =>
    setSources((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (!next.length) return [emptyCitation(0)];
      return next.map((c, i) => ({ ...c, sort_order: i }));
    });

  const onChange = (idx: number, patch: Partial<RegistreCitationDraft>) =>
    setSources((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const openDictionnaireTypeActe = (
    kind: DictionnaireKind,
    title: string,
    multi = true,
    defaultSelectedIds: string[] = [],
  ) => {
    setDictArgs({
      kind,
      title,
      multi,
      defaultSelectedIds,
      onValidate: async (items) => {
        const ids = items.map((i) => i.id);
        const labels = items.map((i) => i.label);
        setField('type_acte_ref', { ids, labels });
        setDictOpen(false);
      },
    });
    setDictOpen(true);
  };

  const clearDictValueTypeActe = () => setField('type_acte_ref', null);

  const refreshAfterSave = async () => {
    if (!registreId) return;
    const reg = await fetchRegistre(registreId);
    setRegistre(reg ?? null);
    initialSnapshotRef.current = JSON.stringify({ form, sources });
  };

  async function handleNavBack() {
    if (saving || isFormDirty()) {
      const ok = confirm('Vous avez des modifications non enregistrées. Quitter quand même ?');
      if (!ok) return;
    }
    navigate(`/ec-registre/${bureauId ?? ''}/${registreId}`);
  }

  // ---------------------------------------------------------------------------
  // PERSIST (version "plus propre") :
  // - delete removed
  // - upsert existing (avec id)
  // - insert new + select(...) pour récupérer ids
  // - sans reload complet
  // - segments idem (insert + select)
  // ---------------------------------------------------------------------------
  const persistCitationsAndSegments = async (): Promise<RegistreCitationDraft[]> => {
    if (!registreId) return sources;

    // Snapshot UI des segments/exemplaires (ne jamais perdre ce state)
    const uiByIdx = sources.map((s) => ({
      id: s.id,
      exemplaire_id: s.exemplaire_id,
      exemplaire: s.exemplaire,
      segments: Array.isArray(s.segments) ? s.segments : [],
      sort_order: s.sort_order ?? 0,
      // le reste (fields citation)
      is_missing: s.is_missing ?? null,
      lacune: (s as any).lacune ?? null,
      lacune_note: (s as any).lacune_note ?? null,
      locating: (s as any).locating ?? {},
      physical_condition_ref: (s as any).physical_condition_ref ?? null,
      repro_quality_ref: (s as any).repro_quality_ref ?? null,
      marks: (s as any).marks ?? '',
      document_damage_kinds_ids: (s as any).document_damage_kinds_ids ?? [],
      note: s.note ?? '',
    }));

    // 0) existants pour delete removed
    const { data: existing, error: errExisting } = await supabase
      .from(TABLE_REGISTRE_CITATIONS)
      .select('id')
      .eq('registre_id', registreId);

    if (errExisting) throw errExisting;

    const existingIds = (existing ?? []).map((r: any) => r.id as string);
    const uiIds = uiByIdx.map((s) => s.id).filter(Boolean) as string[];

    const toDelete = existingIds.filter((id) => !uiIds.includes(id));
    if (toDelete.length) {
      const { error } = await supabase.from(TABLE_REGISTRE_CITATIONS).delete().in('id', toDelete);
      if (error) throw error;
    }

    // 1) payload citations (on conserve strictement l'ordre UI)
    const citationRows = uiByIdx
      .map((c, idx) => {
        if (!c.exemplaire_id) return null;

        return {
          id: c.id,
          registre_id: registreId,
          exemplaire_id: c.exemplaire_id,

          is_missing: c.is_missing,
          lacune: c.lacune,
          lacune_note: safeTrimOrNull(c.lacune_note),
          locating: safeJson(c.locating, {}),

          physical_condition_ref: c.physical_condition_ref,
          repro_quality_ref: c.repro_quality_ref,
          marks: safeTrimOrNull(c.marks),
          document_damage_kinds_ids: (c.document_damage_kinds_ids ?? []).length
            ? c.document_damage_kinds_ids
            : [],

          note: safeTrimOrNull(c.note),
          sort_order: idx,
        };
      })
      .filter(Boolean) as any[];

    // Si rien à persister (pas d’exemplaire_id), on ne touche pas
    if (!citationRows.length) return sources;

    const withId = citationRows.filter((r) => Boolean(r.id));
    const withoutId = citationRows.filter((r) => !r.id).map(({ id, ...rest }: any) => rest);

    // 2) upsert citations existantes
    if (withId.length) {
      const { error } = await supabase
        .from(TABLE_REGISTRE_CITATIONS)
        .upsert(withId, { onConflict: 'id' });

      if (error) throw error;
    }

    // 3) insert new citations + récupérer ids
    let insertedCitationRows: Array<{ id: string; exemplaire_id: string; sort_order: number }> = [];
    if (withoutId.length) {
      const { data: inserted, error } = await supabase
        .from(TABLE_REGISTRE_CITATIONS)
        .insert(withoutId)
        .select('id, exemplaire_id, sort_order');

      if (error) throw error;
      insertedCitationRows = ((inserted ?? []) as any[]).map((r) => ({
        id: r.id as string,
        exemplaire_id: r.exemplaire_id as string,
        sort_order: r.sort_order as number,
      }));
      // Supabase renvoie en général dans l’ordre d’insert ; on sécurise quand même
      insertedCitationRows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }

    // 4) reconstruire drafts UI avec ids complets (sans reload)
    //    - On assigne les IDs insérés aux citations UI sans id, dans l’ordre des sort_order
    const insertedByOrder = [...insertedCitationRows];
    let insertedPtr = 0;

    let drafts: RegistreCitationDraft[] = uiByIdx
      .map((c, idx) => {
        // on ne garde que les citations “valides” (avec exemplaire_id)
        if (!c.exemplaire_id) return null;

        let id = c.id;
        if (!id) {
          const row = insertedByOrder[insertedPtr++];
          if (!row) {
            // Cas anormal : insert a échoué silencieusement ou mapping cassé.
            // On throw pour éviter un état incohérent (sinon segments impossibles à sauver)
            throw new Error('Insertion des citations : impossible de récupérer les IDs.');
          }
          id = row.id;
        }

        return {
          id,
          exemplaire_id: c.exemplaire_id,
          exemplaire: c.exemplaire,

          is_missing: c.is_missing,
          lacune: c.lacune,
          lacune_note: c.lacune_note,
          locating: c.locating,

          physical_condition_ref: c.physical_condition_ref,
          repro_quality_ref: c.repro_quality_ref,
          marks: c.marks ?? '',
          document_damage_kinds_ids: c.document_damage_kinds_ids ?? [],

          note: c.note ?? '',
          sort_order: idx,

          // 🔥 on conserve les segments UI
          segments: c.segments ?? [],
          work_note: (sources[idx] as any)?.work_note ?? '',
        } as RegistreCitationDraft;
      })
      .filter(Boolean) as RegistreCitationDraft[];

    // 5) enrich exemplaires manquants (si besoin)
    const missingExPickIds = drafts
      .filter((d) => d.exemplaire_id && !d.exemplaire)
      .map((d) => d.exemplaire_id)
      .filter(Boolean) as string[];

    if (missingExPickIds.length) {
      const { data: pickRows, error: pickErr } = await supabase
        .from(VIEW_EXEMPLAIRES_PICK)
        .select(
          'exemplaire_id,nature_ref,nature_code,nature_label,support_ref,support_code,support_label,unite_id,unite_titre,cote_locale,pagination_type_ref,pagination_type_code,pagination_type_label,nb_pages,depot_nom,depot_is_online,depot_is_physical,institution_nom,institution_sigle,url_base,plateforme_code,source_exemplaire_id,identifiant_interne,localisation_interne,physical_condition_ref,physical_condition_code,physical_condition_label',
        )
        .in('exemplaire_id', missingExPickIds);

      if (pickErr) throw pickErr;

      const map = new Map<string, any>();
      for (const r of (pickRows ?? []) as any[]) map.set(r.exemplaire_id, r);

      drafts = drafts.map((d) => {
        if (d.exemplaire) return d;
        const r = d.exemplaire_id ? map.get(d.exemplaire_id) : null;
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

    // 6) segments (delete removed + upsert/insert + select pour ids)
    await persistSegmentsForCitations(drafts);

    return drafts.length ? drafts : [emptyCitation(0)];
  };

  const persistSegmentsForCitations = async (drafts: RegistreCitationDraft[]) => {
    const citIds = drafts.map((d) => d.id).filter(Boolean) as string[];
    if (!citIds.length) return;

    // 1) existing segments pour delete removed
    const { data: existing, error: exErr } = await supabase
      .from(TABLE_REGISTRE_SEGMENTS)
      .select('id, registre_citation_id, sort_order')
      .in('registre_citation_id', citIds);

    if (exErr) throw exErr;

    const existingByCit = new Map<string, Array<{ id: string; sort_order: number }>>();
    for (const r of (existing ?? []) as any[]) {
      const k = r.registre_citation_id as string;
      existingByCit.set(k, [
        ...(existingByCit.get(k) ?? []),
        { id: r.id as string, sort_order: r.sort_order ?? 0 },
      ]);
    }

    // 2) per citation
    for (const d of drafts) {
      if (!d.id) continue;
      const cid = d.id;

      const uiSegsRaw = Array.isArray(d.segments) ? d.segments : [];

      // ✅ Guard : si segments présents, kind_ref obligatoire (BD NOT NULL) — sinon on throw (évite “rien ne se sauvegarde”)
      const missingKind = uiSegsRaw.find((s: any) => !s?.kind_ref);
      if (missingKind) {
        throw new Error('Chaque segment doit avoir un kind (type) avant enregistrement.');
      }

      const uiSegs = uiSegsRaw.map((s: any, i: number) => ({ ...s, sort_order: i }));
      const uiIds = uiSegs.map((s: any) => s.id).filter(Boolean) as string[];

      const dbIds = (existingByCit.get(cid) ?? []).map((x) => x.id);
      const toDelete = dbIds.filter((id) => !uiIds.includes(id));

      if (toDelete.length) {
        const { error } = await supabase.from(TABLE_REGISTRE_SEGMENTS).delete().in('id', toDelete);
        if (error) throw error;
      }

      const payload = uiSegs.map((s: any) => ({
        id: s.id, // undefined ok
        registre_citation_id: cid,
        kind_ref: s.kind_ref,
        label_override: safeTrimOrNull(s.label_override),
        scope: s.scope ?? 'full',
        range_start: s.range_start ?? null,
        range_end: s.range_end ?? null,
        date_from: s.date_from || null,
        date_to: s.date_to || null,
        year_from: s.year_from ?? null,
        year_to: s.year_to ?? null,
        note: safeTrimOrNull(s.note),
        sort_order: s.sort_order ?? 0,
      }));

      if (!payload.length) continue;

      const withId = payload.filter((p) => Boolean(p.id));
      const withoutId = payload.filter((p) => !p.id).map(({ id, ...rest }: any) => rest);

      if (withId.length) {
        const { error } = await supabase
          .from(TABLE_REGISTRE_SEGMENTS)
          .upsert(withId, { onConflict: 'id' });
        if (error) throw error;
      }

      let inserted: Array<{ id: string; sort_order: number }> = [];
      if (withoutId.length) {
        const { data: insertedRows, error } = await supabase
          .from(TABLE_REGISTRE_SEGMENTS)
          .insert(withoutId)
          .select('id, sort_order');

        if (error) throw error;

        inserted = ((insertedRows ?? []) as any[]).map((r) => ({
          id: r.id as string,
          sort_order: r.sort_order ?? 0,
        }));
        inserted.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      }

      // 🔁 ré-injecte les ids segments insérés dans le state draft (même ordre sort_order)
      if (inserted.length) {
        const insertedByOrder = [...inserted];
        let ptr = 0;

        const nextSegments = uiSegs.map((s: any) => {
          if (s.id) return s;
          const row = insertedByOrder[ptr++];
          if (!row) return s;
          return { ...s, id: row.id };
        });

        // mut safe (on reconstruit drafts ailleurs) : ici on patch d.segments
        d.segments = nextSegments as any;
      }
    }
  };

  const loadRegistreTypeActeRefs = async (rid: string) => {
    const { data: links, error: linkErr } = await supabase
      .from(TABLE_REGISTRE_TYPE_ACTE)
      .select('type_acte_id')
      .eq('registre_id', rid);

    if (linkErr) throw linkErr;

    const ids = (links ?? []).map((r: any) => r.type_acte_id as string).filter(Boolean);

    if (!ids.length) {
      setForm((prev) => (prev ? { ...prev, type_acte_ref: { ids: [], labels: [] } } : prev));
      return;
    }

    const { data: types, error: typeErr } = await supabase
      .from(TABLE_REF_TYPE_ACTE)
      .select('id, label, color')
      .in('id', ids)
      .order('id');

    if (typeErr) throw typeErr;

    const byId = new Map((types ?? []).map((t: any) => [t.id, t]));
    const labels = ids.map((id) => byId.get(id)?.label ?? '');
    const colors = ids.map((id) => (byId.get(id)?.color as any) ?? null);

    setForm((prev) => (prev ? { ...prev, type_acte_ref: { ids, labels, colors } } : prev));
  };

  const saveRegistreTypeActeRefs = async (rid: string, ids: string[]) => {
    const { error: delErr } = await supabase
      .from(TABLE_REGISTRE_TYPE_ACTE)
      .delete()
      .eq('registre_id', rid);
    if (delErr) throw delErr;

    const clean = (ids ?? []).filter(Boolean);
    if (!clean.length) return;

    const payload = clean.map((type_acte_id) => ({ registre_id: rid, type_acte_id }));
    const { error: insErr } = await supabase.from(TABLE_REGISTRE_TYPE_ACTE).insert(payload);
    if (insErr) throw insErr;
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!registreId || !form) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      // table registres : legacy type_acte texte seulement pour l’instant
      const patch: Record<string, any> = {
        type_acte: safeTrimOrNull(form.type_acte),
        bureau_id: form.bureau_id ?? null,
      };

      const { error } = await supabase.from(TABLE_REGISTRES).update(patch).eq('id', registreId);
      if (error) throw error;

      await saveRegistreTypeActeRefs(registreId, form.type_acte_ref?.ids ?? []);

      const nextSources = await persistCitationsAndSegments();
      setSources(nextSources);

      await refreshAfterSave();

      // baseline snapshot “propre”
      initialSnapshotRef.current = JSON.stringify({ form, sources: nextSources });

      toast('Enregistré', { icon: '✅' });
    } catch (err: any) {
      console.error('Erreur save registre', err);
      setErrorMsg(err?.message ?? 'Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  if (isLoading || !registreId || !registre || registre.id !== registreId || !form) {
    return (
      <div className='flex flex-col' aria-busy='true'>
        <p className='text-muted-foreground'>Chargement du registre...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col' aria-busy={isLoading || saving ? 'true' : 'false'}>
      <div className='sticky top-0 z-10 bg-white'>
        <div className='flex items-center justify-between border-b px-6 py-3'>
          <div className='flex items-center gap-3'>
            <button type='button' onClick={handleNavBack} aria-label='Revenir à la fiche registre'>
              <ArrowLeft className='h-4 w-4 cursor-pointer text-gray-600' />
            </button>

            {getIconForStatutFromStats(registre.actes_estimes, registre.actes_transcrits)}

            <div>
              <div className='flex items-center gap-x-2'>
                <h1 className='text-base font-semibold text-gray-800'>
                  {getRegistreLabel(registre.type_acte, registre.statut_juridique)}
                </h1>
                <Badge className='m-0 bg-yellow-600 text-white shadow'>Mode édition</Badge>
                {errorMsg && (
                  <AlertTriangle className='h-4 w-4 text-yellow-600' aria-label='Erreur détectée' />
                )}
              </div>

              <div className='flex items-center space-x-2 text-xs'>
                <span className='text-gray-500'>{registre.annee}</span>
                {bureau && <span className='text-gray-500'>enregistré à la {bureauLabel}</span>}
              </div>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <Settings className='h-5 w-5 cursor-pointer text-gray-700' />
          </div>
        </div>

        <div className='flex items-center gap-8 overflow-x-auto border-b bg-white px-6 text-sm'>
          {tabs.map(({ label, icon: Icon }) => {
            const isActive = activeSection === label;
            return (
              <button
                type='button'
                key={label}
                onClick={() => setActiveSection(label)}
                className={`-mb-px flex items-center gap-2 border-b-2 py-3 transition-all ${
                  isActive
                    ? 'border-blue-600 font-medium text-blue-600'
                    : 'border-transparent text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-controls={`section-${label}`}
              >
                <Icon className='h-4 w-4' />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <section id={`section-${tabs[0].label}`} className='prose prose-sm max-w-none p-6'>
        {activeSection === 'Référence archive' && (
          <div className='p-4'>
            <form className='space-y-6' onSubmit={handleSubmit}>
              <div className='space-y-10'>
                <div>
                  <h2 className='text-base font-semibold text-slate-900'>Référence archive</h2>
                  <div className='mt-1 space-y-1'>
                    <p className='text-sm leading-relaxed text-slate-700'>
                      Cet onglet vous permet de décrire le registre en tant que document d’archive :
                      identification, dépôts de conservation.
                    </p>
                    <p>
                      <span className='font-semibold text-sm text-slate-700'>
                        Il sert à retrouver et citer précisément le registre.
                      </span>
                    </p>
                  </div>
                </div>

                <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
                  <div className='flex items-start gap-3'>
                    <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
                    <div className='min-w-0'>
                      <div className='text-sm font-semibold text-amber-900'>Chantier en cours</div>
                      <div className='mt-0.5 text-xs text-amber-800'>
                        <ol>
                          <li>Mode view</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='space-y-6 p-1'>
                  <SectionIdentification
                    id={registre.id}
                    type='registre'
                    form={form}
                    setField={setField}
                    onEditBureauEnregistrement={() => {
                      toast('À implémenter : picker bureau côté RegistreEdit', { icon: 'ℹ️' });
                    }}
                    onClearBureauEnregistrement={() => {
                      setField('bureau_id', null);
                      setField('bureau_enregistrement_label', '');
                    }}
                    onEditTypeActe={({ kind, title, multi, defaultSelectedIds }) =>
                      openDictionnaireTypeActe(kind, title, multi, defaultSelectedIds)
                    }
                    onClearTypeActe={clearDictValueTypeActe}
                  />

                  <SectionSources
                    type='registre'
                    mode='edit'
                    sources={sources}
                    loading={loadingSources}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    onChange={onChange}
                  />

                  {errorMsg && (
                    <div className='flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900'>
                      <AlertTriangle className='mt-0.5 h-4 w-4' />
                      <div>
                        <div className='font-medium'>Attention</div>
                        <div className='text-yellow-800'>{errorMsg}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex items-center justify-end gap-3'>
                <button
                  type='submit'
                  disabled={saving}
                  className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
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
          </div>
        )}
      </section>
    </div>
  );
}
