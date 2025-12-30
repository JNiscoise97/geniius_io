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

import type { RegistreCitationDraft, ManifestationPick } from '@/features/archives/reference/types';

import {
  DictionnaireEditorPanel,
  type DictionnaireKind,
} from '@/components/shared/DictionnaireEditorPanel';

const tabs = [{ label: 'Référence archive', icon: Archive }] as const;

type RegistreEditTab = (typeof tabs)[number]['label'];

const REGISTRE_CITATIONS_TABLE = 'etat_civil_registre_citations';
const MANIFESTATIONS_PICK_VIEW = 'v_manifestations_pick';
const REGISTRE_TYPE_ACTE_TABLE = 'etat_civil_registres_type_acte';
const REF_TYPE_ACTE_TABLE = 'ref_ec_type_acte';

type RegistreCitationRow = {
  id: string;
  registre_id: string;
  manifestation_id: string | null;

  registre_manquant: boolean | null;
  note: string | null;
  sort_order: number | null;
};

function emptyCitation(sort_order: number): RegistreCitationDraft {
  return {
    id: undefined,
    manifestation_id: undefined,
    manifestation: undefined,

    registre_manquant: false,
    note: '',
    sort_order,
  };
}

function mapRowToDraft(r: RegistreCitationRow): RegistreCitationDraft {
  return {
    id: r.id,
    manifestation_id: r.manifestation_id ?? undefined,
    manifestation: undefined,

    registre_manquant: Boolean(r.registre_manquant),
    note: r.note ?? '',
    sort_order: r.sort_order ?? 0,
  };
}

function makeInitialForm(args: {
  registre: EtatCivilRegistre;
  bureauId: string | null;
  bureauLabel: string;
}): RegistreReferenceIdentificationFormState {
  const { registre, bureauId, bureauLabel } = args;

  return {
    // legacy pour l'instant (colonne texte)
    type_acte: registre.type_acte ?? '',
    // tu migreras ensuite vers type_acte_ref (table de jointure) -> ici UI only
    type_acte_ref: null,

    bureau_id: bureauId,
    bureau_enregistrement_label: bureauLabel,
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

  // Référence archive
  const [form, setForm] = useState<RegistreReferenceIdentificationFormState | null>(null);
  const [sources, setSources] = useState<RegistreCitationDraft[]>([emptyCitation(0)]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dictionnaire (Type acte, etc.)
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

        // 1) registre (store)
        const reg = await fetchRegistre(registreId);

        // 2) bureau_id depuis la table (si ton type EtatCivilRegistre ne l’expose pas)
        const { data: regRow, error: regErr } = await supabase
          .from('etat_civil_registres')
          .select('bureau_id')
          .eq('id', registreId)
          .single();

        if (regErr) throw regErr;
        const bId = (regRow?.bureau_id as string | null) ?? null;

        // 3) bureau (store)
        const bur = bId ? await fetchBureau(bId) : undefined;

        if (cancelled) return;

        setRegistre(reg ?? null);
        setBureau(bur ?? null);
        setBureauId(bId);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Erreur lors du chargement de la page registre edit', err);
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
  // Chargement des sources (citations du registre) + enrichissement manifestation
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!registreId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingSources(true);
        setErrorMsg(null);

        const { data, error } = await supabase
          .from(REGISTRE_CITATIONS_TABLE)
          .select('id, registre_id, manifestation_id, registre_manquant, note, sort_order')
          .eq('registre_id', registreId)
          .order('sort_order', { ascending: true });

        if (cancelled) return;
        if (error) throw error;

        const rows = ((data ?? []) as RegistreCitationRow[]).sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );

        let drafts = rows.length ? rows.map(mapRowToDraft) : [emptyCitation(0)];

        // enrichir les manifestations (pour affichage “joli” dans SectionSources)
        const manIds = drafts.map((d) => d.manifestation_id).filter(Boolean) as string[];
        if (manIds.length) {
          const { data: pickRows, error: pickErr } = await supabase
            .from(MANIFESTATIONS_PICK_VIEW)
            .select(
              'manifestation_id,type_manifestation,unite_id,unite_titre,unite_cote,pagination_type,depot_nom,depot_type,institution_nom,institution_sigle,url_base,plateforme_code',
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

    const bureauLabel = bureau?.nom
      ? `${bureau.nom}${bureau.departement ? ` (${bureau.departement})` : ''}`
      : '';

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
  }, [registreId, registre, bureau, bureauId]);

  // ---------------------------------------------------------------------------
  // Baseline snapshot (pour le dirty diff)
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
  // Persist citations (robuste : delete removed + upsert with id + insert without id + reload)
  // ---------------------------------------------------------------------------
  const upsertCitations = async () => {
    if (!registreId) return;

    // 1) lire existants en base
    const { data: existing, error: errExisting } = await supabase
      .from(REGISTRE_CITATIONS_TABLE)
      .select('id')
      .eq('registre_id', registreId);

    if (errExisting) throw errExisting;

    const existingIds = (existing ?? []).map((r: any) => r.id as string);
    const uiIds = sources.map((s) => s.id).filter(Boolean) as string[];

    // 2) supprimer ceux retirés côté UI
    const toDelete = existingIds.filter((id) => !uiIds.includes(id));
    if (toDelete.length) {
      const { error } = await supabase.from(REGISTRE_CITATIONS_TABLE).delete().in('id', toDelete);
      if (error) throw error;
    }

    // 3) préparer payload (en conservant l'ordre)
    const rows = sources
      .map((c, idx) => {
        if (!c.manifestation_id) return null;
        return {
          id: c.id, // undefined ok
          registre_id: registreId,
          manifestation_id: c.manifestation_id,
          registre_manquant: Boolean(c.registre_manquant),
          note: (c.note ?? '').trim() || null,
          sort_order: idx,
        };
      })
      .filter(Boolean) as any[];

    if (!rows.length) return;

    const withId = rows.filter((r) => Boolean(r.id));
    const withoutId = rows.filter((r) => !r.id).map(({ id, ...rest }) => rest);

    // 4) upsert rows avec id
    if (withId.length) {
      const { error } = await supabase
        .from(REGISTRE_CITATIONS_TABLE)
        .upsert(withId, { onConflict: 'id' });
      if (error) throw error;
    }

    // 5) insert rows sans id
    if (withoutId.length) {
      const { error } = await supabase.from(REGISTRE_CITATIONS_TABLE).insert(withoutId);
      if (error) throw error;
    }

    // 6) reload complet pour récupérer les ids DB (le plus fiable)
    const { data: reloaded, error: reloadErr } = await supabase
      .from(REGISTRE_CITATIONS_TABLE)
      .select('id, registre_id, manifestation_id, registre_manquant, note, sort_order')
      .eq('registre_id', registreId)
      .order('sort_order', { ascending: true });

    if (reloadErr) throw reloadErr;

    let drafts = (reloaded?.length ? reloaded : []).map(mapRowToDraft);

    // enrichir manifestations
    const manIds = drafts.map((d) => d.manifestation_id).filter(Boolean) as string[];
    if (manIds.length) {
      const { data: pickRows, error: pickErr } = await supabase
        .from(MANIFESTATIONS_PICK_VIEW)
        .select(
          'manifestation_id,type_manifestation,unite_id,unite_titre,unite_cote,pagination_type,depot_nom,depot_type,institution_nom,institution_sigle,url_base,plateforme_code',
        )
        .in('manifestation_id', manIds);

      if (!pickErr && pickRows?.length) {
        const map = new Map<string, ManifestationPick>();
        for (const r of pickRows as any[]) {
          map.set(r.manifestation_id, {
            manifestation_id: r.manifestation_id,
            type_manifestation: r.type_manifestation,
            unite_id: r.unite_id ?? r.manifestation_id,
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

    setSources(drafts.length ? drafts : [emptyCitation(0)]);
  };

  const loadRegistreTypeActeRefs = async (rid: string) => {
    // 1) lire la table de jointure
    const { data: links, error: linkErr } = await supabase
      .from(REGISTRE_TYPE_ACTE_TABLE)
      .select('type_acte_id')
      .eq('registre_id', rid);

    if (linkErr) throw linkErr;

    const ids = (links ?? []).map((r: any) => r.type_acte_id as string).filter(Boolean);

    if (!ids.length) {
      // rien en base => UI vide
      setForm((prev) => (prev ? { ...prev, type_acte_ref: { ids: [], labels: [] } } : prev));
      return;
    }

    // 2) récupérer les labels dans le référentiel
    const { data: types, error: typeErr } = await supabase
      .from(REF_TYPE_ACTE_TABLE)
      .select('id, label, color')
      .in('id', ids)
      .order('id');

    if (typeErr) throw typeErr;

    // garder l'ordre des ids de la jointure
    const byId = new Map(types.map((t) => [t.id, t]));
    const labels = ids.map((id) => byId.get(id)?.label ?? '');
    const colors = ids.map((id) => (byId.get(id)?.color as any) ?? null);

    // 3) pousser dans le form
    setForm((prev) => (prev ? { ...prev, type_acte_ref: { ids, labels, colors } } : prev));
  };

  const saveRegistreTypeActeRefs = async (rid: string, ids: string[]) => {
    // stratégie simple & safe : on remplace tout
    const { error: delErr } = await supabase
      .from(REGISTRE_TYPE_ACTE_TABLE)
      .delete()
      .eq('registre_id', rid);

    if (delErr) throw delErr;

    const clean = (ids ?? []).filter(Boolean);
    if (!clean.length) return;

    const payload = clean.map((type_acte_id) => ({
      registre_id: rid,
      type_acte_id,
    }));

    const { error: insErr } = await supabase.from(REGISTRE_TYPE_ACTE_TABLE).insert(payload);

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
      // ⚠️ IMPORTANT : ta table etat_civil_registres n'a PAS encore type_acte_ref.
      // On sauvegarde uniquement le legacy texte pour l'instant.
      const patch: Record<string, any> = {
        type_acte: form.type_acte || null,
        bureau_id: form.bureau_id ?? null,
      };

      const { error } = await supabase
        .from('etat_civil_registres')
        .update(patch)
        .eq('id', registreId);

      if (error) throw error;

      await saveRegistreTypeActeRefs(registreId, form.type_acte_ref?.ids ?? []);

      await upsertCitations();
      await refreshAfterSave();

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
            <button onClick={handleNavBack} aria-label='Revenir à la fiche registre'>
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
                {bureau && (
                  <span className='text-gray-500'>
                    enregistré à la {bureau.nom} ({bureau.departement})
                  </span>
                )}
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
                        Il sert à retrouver et citer précisément l’acte.
                      </span>
                    </p>
                  </div>
                </div>

                <div className='space-y-6 p-1'>
                  <SectionIdentification
                    id={registre.id}
                    mode='registre'
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
                    mode='registre'
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
