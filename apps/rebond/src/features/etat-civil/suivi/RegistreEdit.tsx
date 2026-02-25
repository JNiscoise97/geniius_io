// RegistreEdit.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Archive, Settings, AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useEtatCivilStore } from '@/store/etatcivil';
import type { EtatCivilBureau, EtatCivilRegistre } from '@/types/etatcivil';

import { getRegistreLabel } from './BureauRegistres';
import { getIconForStatutFromStats } from '@/features/actes/transcription/constants/statutConfig';

import {
  type RegistreReferenceIdentificationFormState,
} from '@/features/archives/reference';

import type { RegistreCitationDraft, ExemplairePick } from '@/features/archives/reference/types';

import ReferenceArchiveTab from '@/features/actes/tabs/ReferenceArchiveTab';

const tabs = [{ label: 'Référence archive', icon: Archive }] as const;
type RegistreEditTab = (typeof tabs)[number]['label'];

const TABLE_REGISTRES = 'etat_civil_registres';
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
    missing_ranges: [],
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

    annee: '',
   registre_ordre_numerotation_ref: null,
    registre_mode_ref: null,
    nombre_actes_estime: '',
    numero_acte_min: '',
    numero_acte_max: '',
    statut_juridique: '',

    registre_statut_juridique_ref: null,
    registre_support_ref: null,
    registre_pagination_ref: null,
    registre_langue_ref: null,
    registre_fonction_ref: null,
    registre_norme_ref: null,
  };
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

  // Référence archive
  const [form, setForm] = useState<RegistreReferenceIdentificationFormState | null>(null);
  const [sources, setSources] = useState<RegistreCitationDraft[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dirty tracking
  const initialSnapshotRef = useRef<string>('');

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
    setSources([]);
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
  // Helpers UI/state
  // ---------------------------------------------------------------------------

  async function handleNavBack() {
    navigate(`/ec-registre/${bureauId ?? ''}/${registreId}`);
  }

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
    <div className='flex flex-col' aria-busy={isLoading ? 'true' : 'false'}>
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
                className={`-mb-px flex items-center gap-2 border-b-2 py-3 transition-all ${isActive
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
          registreId && (<div className='p-1'>
            <ReferenceArchiveTab
              registreId={registreId}
              type={'registre'}
              mode={'edit'}
              bureauLabel={bureau?.nom ?? ''} />
          </div>))}
      </section>
    </div>
  );
}
