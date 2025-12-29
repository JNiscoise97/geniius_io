// RegistreEdit.tsx
import {
  ArrowLeft,
  Archive,
  Save,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { supabase } from '@/lib/supabase';
import { useEtatCivilStore } from '@/store/etatcivil';
import type { EtatCivilBureau, EtatCivilRegistre } from '@/types/etatcivil';

import { getRegistreLabel } from './BureauRegistres';
import { getIconForStatutFromStats } from '@/features/actes/transcription/constants/statutConfig';

// ✅ Tab "Référence archive" (sections)
import { SectionIdentification, SectionSources, type ReferenceIdentificationFormState } from '@/features/archives/reference';
import type { CitationDraft, ManifestationPick } from '@/features/archives/reference/types';

const tabs = [{ label: 'Référence archive', icon: Archive }] as const;

// ⚠️ Ajuste si ta table a un autre nom
const REGISTRE_CITATIONS_TABLE = 'etat_civil_registre_citations';
// ⚠️ Optionnel : si tu as la vue de pick, on s’en sert pour enrichir l’affichage
const MANIFESTATIONS_PICK_VIEW = 'v_manifestations_pick';

type RegistreEditTab = (typeof tabs)[number]['label'];

type RegistreCitationRow = {
  id: string;
  registre_id: string;
  manifestation_id: string;

  vues_start: number | null;
  vues_end: number | null;
  vues_raw: string | null;

  page_start: number | null;
  page_end: number | null;
  page_raw: string | null;

  acte_manquant: boolean;
  note: string | null;
  sort_order: number | null;
};

function emptyCitation(sort_order: number): CitationDraft {
  return {
    id: undefined,
    manifestation_id: undefined,
    manifestation: undefined,

    vues_start: null,
    vues_end: null,
    vues_raw: '',

    page_start: null,
    page_end: null,
    page_raw: '',

    acte_manquant: false,
    note: '',
    sort_order,
  };
}

function mapRowToDraft(r: RegistreCitationRow): CitationDraft {
  return {
    id: r.id,
    manifestation_id: r.manifestation_id,
    manifestation: undefined,

    vues_start: r.vues_start ?? null,
    vues_end: r.vues_end ?? null,
    vues_raw: r.vues_raw ?? '',

    page_start: r.page_start ?? null,
    page_end: r.page_end ?? null,
    page_raw: r.page_raw ?? '',

    acte_manquant: Boolean(r.acte_manquant),
    note: r.note ?? '',
    sort_order: r.sort_order ?? 0,
  };
}

function makeInitialForm(args: {
  registre: EtatCivilRegistre;
  bureauId: string | null;
  bureauLabel: string;
}): ReferenceIdentificationFormState {
  const { registre, bureauId, bureauLabel } = args;

  return {
    // ⚠️ Pour un registre, certains champs sont “acte-like” mais restent vides.
    type_acte: registre.type_acte ?? '',
    type_acte_ref: null,

    numero_acte: '',
    date: '',
    heure: '',

    bureau_id: bureauId,
    bureau_enregistrement_label: bureauLabel,

    lieu_situation: 'bureau_courant',
    redaction_bureau_id: null,
    redaction_bureau_label: '',
    lieu_transport_raison: '',

    // legacy
    comparution_observations: '',
    mentions_marginales_presentes: false,

    auteur_fonction: '',
    auteur_institutionnel_ref: null,
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
  const [saving, setSaving] = useState(false);

  // Tab state
  const [form, setForm] = useState<ReferenceIdentificationFormState | null>(null);
  const [sources, setSources] = useState<CitationDraft[]>([emptyCitation(0)]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dirty tracking (même idée que ActeEdit -> ref.isDirty)
  const initialSnapshotRef = useRef<string>('');
  const snapshot = useMemo(() => JSON.stringify({ form, sources }), [form, sources]);
  const isFormDirty = () => Boolean(form) && snapshot !== initialSnapshotRef.current;

  // --- Reset à chaque changement d'id ---------------------------------------
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

  // --- Chargement principal (comme ActeEdit) --------------------------------
  useEffect(() => {
    if (!registreId) return;

    (async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        // 1) registre (store)
        const reg = await fetchRegistre(registreId);

        // 2) bureau_id (⚠️ pas toujours dans ton EtatCivilRegistre “mappé”)
        const { data: regRow, error: regErr } = await supabase
          .from('etat_civil_registres')
          .select('bureau_id')
          .eq('id', registreId)
          .single();

        if (regErr) throw regErr;

        const bId = (regRow?.bureau_id as string | null) ?? null;

        // 3) bureau (store) + 4) citations
        const [bur] = await Promise.all([
          bId ? fetchBureau(bId) : Promise.resolve(undefined),
        ]);

        setRegistre(reg ?? null);
        setBureau(bur ?? null);
        setBureauId(bId);
      } catch (err: any) {
        console.error('Erreur lors du chargement de la page registre edit', err);
        setRegistre(null);
        setBureau(null);
        setBureauId(null);
        setErrorMsg(err?.message ?? 'Erreur chargement');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [registreId, fetchRegistre, fetchBureau]);

  // --- Chargement des sources (référence archive) ---------------------------
  useEffect(() => {
    if (!registreId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingSources(true);
        setErrorMsg(null);

        const { data, error } = await supabase
          .from(REGISTRE_CITATIONS_TABLE)
          .select(
            'id, registre_id, manifestation_id, vues_start, vues_end, vues_raw, page_start, page_end, page_raw, acte_manquant, note, sort_order',
          )
          .eq('registre_id', registreId)
          .order('sort_order', { ascending: true });

        if (cancelled) return;
        if (error) throw error;

        const rows = ((data ?? []) as RegistreCitationRow[]).sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );

        let drafts = rows.length ? rows.map(mapRowToDraft) : [emptyCitation(0)];

        // (optionnel) enrichir manifestation pour un rendu “joli” dans SectionSources
        const manIds = drafts.map((d) => d.manifestation_id).filter(Boolean) as string[];
        if (manIds.length) {
          const { data: pickRows, error: pickErr } = await supabase
            .from(MANIFESTATIONS_PICK_VIEW)
            .select(
              'manifestation_id,type_manifestation,unite_titre,unite_cote,pagination_type,depot_nom,depot_type,institution_nom,institution_sigle,url_base,plateforme_code',
            )
            .in('manifestation_id', manIds);

          if (!pickErr && pickRows?.length) {
            const map = new Map<string, ManifestationPick>();
            for (const r of pickRows as any[]) {
              map.set(r.manifestation_id, {
                manifestation_id: r.manifestation_id,
                type_manifestation: r.type_manifestation,
                unite_id: r.unite_id ?? r.manifestation_id, // fallback
                unite_titre: r.unite_titre,
                unite_cote: r.unite_cote,
                pagination_type: r.pagination_type,
                depot_nom: r.depot_nom,
                depot_type: r.depot_type,
                institution_nom: r.institution_nom,
                institution_sigle: r.institution_sigle,
                url_base: r.url_base,
                plateforme_code: r.plateforme_code,
              });
            }

            drafts = drafts.map((d) => {
              const r = d.manifestation_id ? map.get(d.manifestation_id) : undefined;
              if (!r) return d;
              return {
                ...d,
                manifestation: {
                  type_manifestation: r.type_manifestation,
                  unite_titre: r.unite_titre,
                  unite_cote: r.unite_cote,
                  pagination_type: r.pagination_type,
                  depot_nom: r.depot_nom,
                  depot_type: r.depot_type,
                  institution_nom: r.institution_nom,
                  institution_sigle: r.institution_sigle,
                  url_base: r.url_base,
                  plateforme_code: r.plateforme_code,
                },
              };
            });
          }
        }

        setSources(drafts);
      } catch (err: any) {
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

  // --- Init form (quand registre+bureau chargés) ----------------------------
  useEffect(() => {
    if (!registreId || !registre) return;

    const bureauLabel = bureau?.nom
      ? `${bureau.nom}${bureau.departement ? ` (${bureau.departement})` : ''}`
      : '';

    const initial = makeInitialForm({
      registre,
      bureauId,
      bureauLabel,
    });

    setForm(initial);
  }, [registreId, registre, bureau, bureauId]);

  // --- Baseline snapshot (pour le dirty diff) -------------------------------
  useEffect(() => {
    if (!registre || !form) return;
    if (loadingSources) return;
    initialSnapshotRef.current = JSON.stringify({ form, sources });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registre, form, loadingSources]);

  // --- Guard de sortie: beforeunload (comme ActeEdit) -----------------------
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

  // --- Helpers UI/state ------------------------------------------------------

  const setField = <K extends keyof ReferenceIdentificationFormState>(
    key: K,
    value: ReferenceIdentificationFormState[K],
  ) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const onAdd = () => setSources((prev) => [...prev, emptyCitation(prev.length)]);
  const onRemove = (idx: number) =>
    setSources((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (!next.length) return [emptyCitation(0)];
      return next.map((c, i) => ({ ...c, sort_order: i }));
    });
  const onChange = (idx: number, patch: Partial<CitationDraft>) =>
    setSources((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    );

  // --- Save: seulement si diff (comme ActeEdit) ------------------------------

  async function saveRegistreIfDirty(): Promise<boolean> {
    if (!registreId || !form) return false;

    if (!isFormDirty()) {
      return true;
    }

    setSaving(true);
    try {
      // 1) Update registre (minimal, mais utile)
      // ⚠️ Ici je mets bureau_id depuis le form.
      // Si tu veux aussi sauver type_acte_ref etc, ajoute les colonnes + patch.
      const patchReg: Record<string, any> = {
        bureau_id: form.bureau_id,
      };

      const { error: errReg } = await supabase
        .from('etat_civil_registres')
        .update(patchReg)
        .eq('id', registreId);

      if (errReg) throw errReg;

      // 2) Upsert citations (référence archive)
      const keepIds = sources.map((s) => s.id).filter(Boolean) as string[];

      const { data: existing, error: errExisting } = await supabase
        .from(REGISTRE_CITATIONS_TABLE)
        .select('id')
        .eq('registre_id', registreId);

      if (errExisting) throw errExisting;

      const existingIds = (existing ?? []).map((r: any) => r.id as string);
      const toDelete = existingIds.filter((id) => !keepIds.includes(id));

      if (toDelete.length) {
        const { error } = await supabase
          .from(REGISTRE_CITATIONS_TABLE)
          .delete()
          .in('id', toDelete);
        if (error) throw error;
      }

      const payload = sources
        .map((c, idx) => {
          // on n’enregistre pas les lignes sans manifestation
          if (!c.manifestation_id) return null;
          const base = {
            registre_id: registreId,
            manifestation_id: c.manifestation_id,

            vues_start: c.vues_start ?? null,
            vues_end: c.vues_end ?? null,
            vues_raw: (c.vues_raw ?? '').trim() || null,

            page_start: c.page_start ?? null,
            page_end: c.page_end ?? null,
            page_raw: (c.page_raw ?? '').trim() || null,

            acte_manquant: Boolean(c.acte_manquant),
            note: (c.note ?? '').trim() || null,

            sort_order: idx,
          };
          return c.id ? { id: c.id, ...base } : base;
        })
        .filter(Boolean) as any[];

      if (payload.length) {
        const { error } = await supabase
          .from(REGISTRE_CITATIONS_TABLE)
          .upsert(payload, { onConflict: 'id' });
        if (error) throw error;
      }

      toast.success('Registre mis à jour');
      initialSnapshotRef.current = JSON.stringify({ form, sources });
      return true;
    } catch (err: any) {
      console.error('Erreur save registre', err);
      toast.error('Erreur lors de l’enregistrement');
      setErrorMsg(err?.message ?? 'Erreur save');
      return false;
    } finally {
      setSaving(false);
    }
  }

  // --- Nav back (comme ActeEdit) --------------------------------------------

  async function handleNavBack() {
    if (saving || isFormDirty()) {
      const ok = confirm('Vous avez des modifications non enregistrées. Quitter quand même ?');
      if (!ok) return;
    }
    navigate(`/ec-registre/${registreId}`);
  }

  // --- Rendering -------------------------------------------------------------

  if (isLoading || !registre || registre.id !== registreId || !form) {
    return (
      <div className='flex flex-col' aria-busy='true'>
        <p className='text-muted-foreground'>Chargement du registre...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col' aria-busy={isLoading || saving ? 'true' : 'false'}>
      <div className='sticky top-0 z-10 bg-white'>
        <div className='flex items-center justify-between px-6 py-3 border-b'>
          <div className='flex items-center gap-3'>
            <button onClick={handleNavBack} aria-label='Revenir à la fiche registre'>
              <ArrowLeft className='w-4 h-4 text-gray-600 cursor-pointer' />
            </button>

            {getIconForStatutFromStats(registre.actes_estimes, registre.actes_transcrits)}

            <div>
              <div className='flex items-center gap-x-2'>
                <h1 className='text-base font-semibold text-gray-800'>
                  {getRegistreLabel(registre.type_acte, registre.statut_juridique)}
                </h1>
                <Badge className='m-0 bg-yellow-600 text-white shadow'>Mode édition</Badge>
                {errorMsg && (
                  <AlertTriangle
                    className='w-4 h-4 text-yellow-600'
                    aria-label='Erreur détectée'
                  />
                )}
              </div>

              <div className='text-xs flex items-center space-x-2'>
                <span className='text-gray-500'>{registre.annee}</span>
                {bureau && (
                  <span className='text-gray-500'>
                    enregistré à la {bureau.nom} ({bureau.departement})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <Button
              onClick={async () => {
                const ok = await saveRegistreIfDirty();
                if (ok) navigate(`/ec-registre/${registre.id}`);
              }}
              disabled={saving}
              className='flex items-center gap-2 text-sm hover:text-black'
            >
              <Save className='w-4 h-4' />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>

            <Settings className='w-5 h-5 text-gray-700 cursor-pointer' />
          </div>
        </div>

        <div className='flex items-center gap-8 px-6 text-sm border-b overflow-x-auto bg-white'>
          {tabs.map(({ label, icon: Icon }) => {
            const isActive = activeSection === label;
            return (
              <button
                key={label}
                onClick={() => setActiveSection(label)}
                className={`py-3 -mb-px border-b-2 flex items-center gap-2 transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-controls={`section-${label}`}
              >
                <Icon className='w-4 h-4' />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <section id={`section-${tabs[0].label}`} className='p-6 prose prose-sm max-w-none'>
        {activeSection === 'Référence archive' && (
          <div className='p-1 space-y-6'>
            <SectionIdentification
              acteId={registre.id}
              form={form}
              setField={setField}
              onEditBureauEnregistrement={() => {
                toast('À implémenter : picker bureau côté RegistreEdit', { icon: 'ℹ️' });
              }}
              onClearBureauEnregistrement={() => {
                setField('bureau_id', null);
                setField('bureau_enregistrement_label', '');
              }}
              onEditTypeActe={() => {
                toast('À implémenter : picker type_acte_ref côté RegistreEdit', { icon: 'ℹ️' });
              }}
              onClearTypeActe={() => setField('type_acte_ref', null)}
            />

            <SectionSources
              sources={sources}
              loading={loadingSources}
              onAdd={onAdd}
              onRemove={onRemove}
              onChange={onChange}
              presetKey={`registre:${registreId}`}
              presetLabel={`${bureau?.commune ?? ''} · ${registre.annee} · ${registre.type_acte}`}
            />

            {errorMsg && (
              <div className='flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900'>
                <AlertTriangle className='w-4 h-4 mt-0.5' />
                <div>
                  <div className='font-medium'>Attention</div>
                  <div className='text-yellow-800'>{errorMsg}</div>
                  <div className='mt-1 text-xs text-yellow-800'>
                    Si tu n’as pas la table <span className='font-mono'>{REGISTRE_CITATIONS_TABLE}</span>, remplace
                    sa valeur en haut du fichier.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
