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
import { ListeChipsViewSmart } from '@/components/shared/ListeChipsViewSmart';
import { toIds, toLabels } from '@/utils/dictionnaireValue';
import {
  DictionnaireEditorPanel,
  type DictionnaireKind,
} from '@/components/shared/DictionnaireEditorPanel';
import {
  EtatCivilBureauPickerPanel,
  formatBureauLabel,
  type EtatCivilBureau,
} from '@/components/shared/EtatCivilBureauPickerPanel';
import { Lock, Unlock } from 'lucide-react';

type LieuSituation = 'bureau_courant' | 'autre_bureau' | 'transporte';

type ReferenceArchiveTabProps = {
  acte: EtatCivilActe;
  bureauLabel?: string;
  onUpdated?: () => Promise<void> | void;
};

/**
 * =========================================================================
 * NOUVEAU MODELE - TYPES
 * =========================================================================
 * - sources = citations (etat_civil_acte_citations)
 * - chaque citation pointe vers une manifestation (ref_manifestations)
 * - l’UI dénormalise un peu via v_manifestations_pick
 */

type ManifestationPick = {
  manifestation_id: string;
  type_manifestation: 'original' | 'microfilm' | 'numerisation';

  unite_id: string;
  unite_titre: string;
  unite_cote: string | null;
  pagination_type: 'vues' | 'pages' | 'folios' | 'images' | null;

  depot_nom: string;
  depot_type: 'physique' | 'en_ligne';

  institution_nom: string;
  institution_sigle: string | null;

  url_base: string | null;
  plateforme_code: string | null;
};

type CitationDraft = {
  id?: string;

  // FK
  manifestation_id?: string;

  // Dénormalisation UI (depuis v_manifestations_pick)
  manifestation?: {
    type_manifestation?: string;
    unite_titre?: string;
    unite_cote?: string | null;
    pagination_type?: string | null;

    depot_nom?: string;
    depot_type?: 'physique' | 'en_ligne';

    institution_nom?: string;
    institution_sigle?: string | null;

    url_base?: string | null;
    plateforme_code?: string | null;
  };

  // Vues
  vues_start?: number | null;
  vues_end?: number | null;
  vues_raw?: string;

  // Pages
  page_start?: number | null;
  page_end?: number | null;
  page_raw?: string;

  acte_manquant?: boolean;
  note?: string;

  sort_order?: number;
};

type ActeCitationRow = {
  id: string;
  acte_id: string;
  manifestation_id: string;
  vues_start: number | null;
  vues_end: number | null;
  vues_raw: string | null;
  page_start: number | null;
  page_end: number | null;
  page_raw: string | null;
  acte_manquant: boolean;
  note: string | null;
  sort_order: number;
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

  mentions_marginales_presentes: boolean;

  auteur_fonction: string;
  auteur_institutionnel_ref: { ids: string[]; labels: string[] } | null;
};

function isoToFr(iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d} / ${m} / ${y}`;
}

function frToIso(fr?: string) {
  if (!fr) return '';
  const cleaned = fr.replace(/\s+/g, '');
  const m = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  const [, d, mo, y] = m;
  return `${y}-${mo}-${d}`;
}

function autoFormatFrDate(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 8);
  const parts: string[] = [];
  if (digits.length >= 2) parts.push(digits.slice(0, 2));
  if (digits.length >= 4) parts.push(digits.slice(2, 4));
  if (digits.length > 4) parts.push(digits.slice(4));
  return parts.join(' / ');
}

function toDateInput(v: any) {
  if (!v) return '';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function emptyCitation(): CitationDraft {
  return {
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
    sort_order: 0,
  };
}

function normalizeCitationRow(r: Partial<ActeCitationRow> | null | undefined): CitationDraft {
  return {
    id: r?.id,
    manifestation_id: r?.manifestation_id,

    vues_start: r?.vues_start ?? null,
    vues_end: r?.vues_end ?? null,
    vues_raw: r?.vues_raw ?? '',

    page_start: r?.page_start ?? null,
    page_end: r?.page_end ?? null,
    page_raw: r?.page_raw ?? '',

    acte_manquant: Boolean(r?.acte_manquant),
    note: r?.note ?? '',
    sort_order: typeof r?.sort_order === 'number' ? r!.sort_order : 0,
  };
}

export default function ReferenceArchiveTab({
  acte,
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

      mentions_marginales_presentes: Boolean((acte as any).mentions_marginales_presentes),

      auteur_fonction: (acte as any).auteur_fonction ?? '',
      auteur_institutionnel_ref: tai?.id ? { ids: [tai.id], labels: [tai.label ?? ''] } : null,
    }),
    [acte, bureauLabel],
  );

  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [sources, setSources] = useState<CitationDraft[]>([emptyCitation()]);

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
   * LOAD citations (etat_civil_acte_citations) + enrich from v_manifestations_pick
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
          'id, acte_id, manifestation_id, vues_start, vues_end, vues_raw, page_start, page_end, page_raw, acte_manquant, note, sort_order',
        )
        .eq('acte_id', acteId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        setErrorMsg(error.message);
        setSources([emptyCitation()]);
        setLoadingSources(false);
        return;
      }

      const rows = (data ?? []) as ActeCitationRow[];
      const drafts = rows.map((r) => normalizeCitationRow(r));

      // si aucune citation -> 1 ligne vide
      if (!drafts.length) {
        setSources([emptyCitation()]);
        setLoadingSources(false);
        return;
      }

      // 2) enrich from view (optional but nice)
      const manIds = Array.from(
        new Set(drafts.map((d) => d.manifestation_id).filter(Boolean) as string[]),
      );

      if (!manIds.length) {
        setSources(drafts);
        setLoadingSources(false);
        return;
      }

      const { data: pickData, error: pickErr } = await supabase
        .from('v_manifestations_pick')
        .select(
          'manifestation_id,type_manifestation,unite_id,unite_titre,unite_cote,pagination_type,depot_nom,depot_type,institution_nom,institution_sigle,url_base,plateforme_code',
        )
        .in('manifestation_id', manIds);

      if (cancelled) return;

      if (pickErr) {
        // on affiche quand même les citations sans enrichissement
        setSources(drafts);
        setLoadingSources(false);
        return;
      }

      const pickRows = (pickData ?? []) as any[];

      // ⚠️ La view peut dupliquer une manifestation si plusieurs url (acces_numeriques).
      // On choisit la "meilleure" ligne par manifestation : celle qui a url_base non null si possible.
      const bestByManId = new Map<string, ManifestationPick>();
      for (const r of pickRows) {
        const current = bestByManId.get(r.manifestation_id);
        const candidate: ManifestationPick = {
          manifestation_id: r.manifestation_id,
          type_manifestation: r.type_manifestation,
          unite_id: r.unite_id,
          unite_titre: r.unite_titre,
          unite_cote: r.unite_cote,
          pagination_type: r.pagination_type,
          depot_nom: r.depot_nom,
          depot_type: r.depot_type,
          institution_nom: r.institution_nom,
          institution_sigle: r.institution_sigle,
          url_base: r.url_base,
          plateforme_code: r.plateforme_code,
        };

        if (!current) {
          bestByManId.set(r.manifestation_id, candidate);
          continue;
        }

        const curHasUrl = Boolean((current.url_base ?? '').trim());
        const candHasUrl = Boolean((candidate.url_base ?? '').trim());

        if (!curHasUrl && candHasUrl) {
          bestByManId.set(r.manifestation_id, candidate);
        }
      }

      const enriched = drafts.map((d) => {
        const m = d.manifestation_id ? bestByManId.get(d.manifestation_id) : null;
        if (!m) return d;

        return {
          ...d,
          manifestation: {
            type_manifestation: m.type_manifestation,
            unite_titre: m.unite_titre,
            unite_cote: m.unite_cote,
            pagination_type: m.pagination_type,
            depot_nom: m.depot_nom,
            depot_type: m.depot_type,
            institution_nom: m.institution_nom,
            institution_sigle: m.institution_sigle,
            url_base: m.url_base,
            plateforme_code: m.plateforme_code,
          },
        } satisfies CitationDraft;
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

  const updateSource = (idx: number, patch: Partial<CitationDraft>) => {
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

  /**
   * =========================================================================
   * SAVE citations
   * =========================================================================
   * Stratégie "safe":
   * 1) delete d’abord les citations DB supprimées côté UI (par id connu)
   * 2) upsert ensuite (insert/update)
   */
  const upsertCitations = async () => {
    // on ne persiste que les lignes qui ont une manifestation
    const payload = sources
      .map((c, idx) => ({
        acte_id: acteId,
        manifestation_id: c.manifestation_id ?? null,

        vues_start: c.vues_start ?? null,
        vues_end: c.vues_end ?? null,
        vues_raw: (c.vues_raw ?? '').trim() || null,

        page_start: c.page_start ?? null,
        page_end: c.page_end ?? null,
        page_raw: (c.page_raw ?? '').trim() || null,

        acte_manquant: Boolean(c.acte_manquant),
        note: (c.note ?? '').trim() || null,

        sort_order: typeof c.sort_order === 'number' ? c.sort_order : idx,
      }))
      .filter((row) => Boolean(row.manifestation_id));

    // ids présents dans l’UI (ceux déjà persistés)
    const uiExistingIds = sources.map((s) => s.id).filter(Boolean) as string[];

    // 1) delete rows removed in UI (only among existing ids)
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

    // 2) upsert new + updated
    if (payload.length) {
      const { error } = await supabase
        .from('etat_civil_acte_citations')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    }
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

      mentions_marginales_presentes: Boolean(form.mentions_marginales_presentes),

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

  const currentTypeActeLabels = toLabels(form.type_acte_ref);
  const currentTypeActeIds = toIds(form.type_acte_ref);

  const currentAuteurInstitutionnelLabels = toLabels(form.auteur_institutionnel_ref);
  const currentAuteurInstitutionnelIds = toIds(form.auteur_institutionnel_ref);

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

  const clearDictValueTypeActe = () => {
    setField('type_acte_ref', null);
  };

  const openDictionnaireAuteurInstitutionnel = (
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
        setField('auteur_institutionnel_ref', { ids, labels });
        setDictOpen(false);
      },
    });
    setDictOpen(true);
  };

  const clearDictValueAuteurInstitutionnel = () => {
    setField('auteur_institutionnel_ref', null);
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
                      : 'border-amber-200 bg-amber-50 hover:bg-amber-100',
                  ].join(' ')}
                  title={labelLocked ? 'Déverrouiller le label' : 'Verrouiller le label'}
                  aria-label={labelLocked ? 'Déverrouiller le label' : 'Verrouiller le label'}
                >
                  {labelLocked ? (
                    <Lock className='h-4 w-4 text-slate-700' />
                  ) : (
                    <Unlock className='h-4 w-4 text-amber-800' />
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
        </div>

        {/* IDENTIFICATION */}
        <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h3 className='text-sm font-semibold text-slate-900'>Identification</h3>

          <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
            <div className='md:col-span-12'>
              <label className='block text-xs font-medium text-slate-700'>Identifiant unique</label>
              <div className='mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 w-fit'>
                {acteId}
              </div>
            </div>

            <div className='md:col-span-4'>
              <label className='block text-xs font-medium text-slate-700'>
                Bureau d’enregistrement
              </label>
              <ListeChipsViewSmart
                titre='Bureau d’enregistrement'
                values={form.bureau_id ? [form.bureau_enregistrement_label || '—'] : []}
                dense
                onEdit={() => {
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
                onDelete={() => {
                  setField('bureau_id', null);
                  setField('bureau_enregistrement_label', '');
                }}
              />
            </div>

            <div className='md:col-span-4'>
              <label className='block text-xs font-medium text-slate-700'>Type d’acte</label>
              <ListeChipsViewSmart
                titre="Type d'acte"
                values={currentTypeActeLabels}
                dense
                onEdit={() =>
                  openDictionnaireTypeActe(
                    'type_acte_ref',
                    "Modifier le type d'acte",
                    false,
                    currentTypeActeIds,
                  )
                }
                onDelete={() => clearDictValueTypeActe()}
              />
            </div>

            <div className='md:col-span-4'>
              <label className='block text-xs font-medium text-slate-700'>Numéro d’acte</label>
              <input
                type='text'
                name='numero_acte'
                value={form.numero_acte}
                onChange={(e) => setField('numero_acte', e.target.value)}
                className='mt-1 w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
              />
            </div>

            <div className='md:col-span-4'>
              <label className='block text-xs font-medium text-slate-700'>
                Date d’enregistrement
              </label>
              <input
                type='text'
                inputMode='numeric'
                placeholder='jj / mm / aaaa'
                value={isoToFr(form.date)}
                onChange={(e) => {
                  const formatted = autoFormatFrDate(e.target.value);
                  const iso = frToIso(formatted);
                  setField('date', iso);
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  const iso = frToIso(v);
                  if (!iso && v) setField('date', '');
                }}
                className='mt-1 w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
              />
            </div>

            <div className='md:col-span-4'>
              <label className='block text-xs font-medium text-slate-700'>
                Heure d’enregistrement
              </label>
              <input
                type='time'
                name='heure'
                value={form.heure}
                onChange={(e) => setField('heure', e.target.value)}
                className='mt-1 w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
              />
            </div>
          </div>
        </section>

        {/* LIEU DE REDACTION */}
        <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h3 className='text-sm font-semibold text-slate-900'>Lieu de rédaction</h3>

          <div className='mt-4 space-y-4'>
            <fieldset className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
              <legend className='px-1 text-xs font-medium text-slate-700'>Situation</legend>

              <div className='mt-2 grid grid-cols-1 gap-3 md:grid-cols-12'>
                <label className='flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 md:col-span-4'>
                  <input
                    type='radio'
                    name='lieu_situation'
                    value='bureau_courant'
                    checked={form.lieu_situation === 'bureau_courant'}
                    onChange={() => {
                      setField('lieu_situation', 'bureau_courant');
                      setField('redaction_bureau_id', null);
                      setField('redaction_bureau_label', '');
                      setField('lieu_transport_raison', '');
                    }}
                    className='mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-0'
                  />
                  <div>
                    <div className='text-sm font-medium text-slate-900'>Bureau courant</div>
                    <div className='text-xs text-slate-600'>
                      Rédigé au bureau d’état-civil indiqué.
                    </div>
                  </div>
                </label>

                <label className='flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 md:col-span-4'>
                  <input
                    type='radio'
                    name='lieu_situation'
                    value='autre_bureau'
                    checked={form.lieu_situation === 'autre_bureau'}
                    onChange={() => {
                      setField('lieu_situation', 'autre_bureau');
                      setField('redaction_bureau_id', null);
                      setField('redaction_bureau_label', '');
                      setField('lieu_transport_raison', '');
                    }}
                    className='mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-0'
                  />
                  <div>
                    <div className='text-sm font-medium text-slate-900'>Autre bureau</div>
                    <div className='text-xs text-slate-600'>Rédigé dans un autre bureau.</div>
                  </div>
                </label>

                <label className='flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 md:col-span-4'>
                  <input
                    type='radio'
                    name='lieu_situation'
                    value='transporte'
                    checked={form.lieu_situation === 'transporte'}
                    onChange={() => {
                      setField('lieu_situation', 'transporte');
                      setField('redaction_bureau_id', null);
                      setField('redaction_bureau_label', '');
                      setField('lieu_transport_raison', '');
                    }}
                    className='mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-0'
                  />
                  <div>
                    <div className='text-sm font-medium text-slate-900'>Acte transporté</div>
                    <div className='text-xs text-slate-600'>Rédigé hors du bureau.</div>
                  </div>
                </label>
              </div>
            </fieldset>

            {form.lieu_situation === 'autre_bureau' && (
              <div className='rounded-xl border border-slate-200 bg-white p-4'>
                <label className='block text-xs font-medium text-slate-700'>
                  Bureau de rédaction
                </label>
                <ListeChipsViewSmart
                  titre='Bureau de rédaction'
                  values={form.redaction_bureau_id ? [form.redaction_bureau_label || '—'] : []}
                  dense
                  onEdit={() => {
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
                  onDelete={() => {
                    setField('redaction_bureau_id', null);
                    setField('redaction_bureau_label', '');
                  }}
                />
              </div>
            )}

            {form.lieu_situation === 'transporte' && (
              <div className='rounded-xl border border-slate-200 bg-white p-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                  <div className='md:col-span-12'>
                    <label className='block text-xs font-medium text-slate-700'>
                      Raison du transport
                    </label>
                    <textarea
                      value={form.lieu_transport_raison}
                      onChange={(e) => setField('lieu_transport_raison', e.target.value)}
                      className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                    />
                  </div>

                  <div className='md:col-span-12'>
                    <div className='flex items-center justify-between gap-3'>
                      <label className='block text-xs font-medium text-red-700'>
                        Comparution observations (legacy)
                      </label>
                      <span className='rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700'>
                        À supprimer
                      </span>
                    </div>
                    <textarea
                      value={form.comparution_observations}
                      onChange={(e) => setField('comparution_observations', e.target.value)}
                      className='mt-1 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 shadow-sm outline-none placeholder:text-red-400 focus:border-red-300'
                    />
                    <p className='mt-1 text-xs text-red-700'>
                      Champ hérité (legacy). À remplacer par des champs structurés +{' '}
                      <span className='font-medium'>mentions_toponymes</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SOURCES (NOUVEAU MODELE) */}
        <SectionSources
          sources={sources}
          loading={loadingSources}
          onAdd={addSource}
          onRemove={removeSource}
          onChange={updateSource}
        />

        {/* AUTEUR INSTITUTIONNEL */}
        <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h3 className='text-sm font-semibold text-slate-900'>Auteur institutionnel</h3>

          <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
            <div className='md:col-span-4'>
              <label className='block text-xs font-medium text-slate-700'>Fonction</label>
              <ListeChipsViewSmart
                titre='Fonction'
                values={currentAuteurInstitutionnelLabels}
                dense
                onEdit={() =>
                  openDictionnaireAuteurInstitutionnel(
                    'auteur_institutionnel_ref',
                    "Modifier la fonction de l'auteur institutionnel",
                    false,
                    currentAuteurInstitutionnelIds,
                  )
                }
                onDelete={() => clearDictValueAuteurInstitutionnel()}
              />
            </div>
          </div>

          <p className='mt-2 text-xs text-slate-500'>
            Le nom de l’officiant est rattaché aux acteurs (niveau “entités/acteurs”), pas à l’acte.
          </p>
        </section>

        {/* MENTIONS */}
        <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h3 className='text-sm font-semibold text-slate-900'>Mentions marginales</h3>

          <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
            <div className='md:col-span-4'>
              <label className='inline-flex items-center gap-2 text-sm text-slate-700'>
                <input
                  type='checkbox'
                  checked={form.mentions_marginales_presentes}
                  onChange={(e) => setField('mentions_marginales_presentes', e.target.checked)}
                  className='h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-0'
                />
                Présence de mentions marginales
              </label>
            </div>
          </div>

          <p className='mt-2 text-xs text-slate-500'>
            Le contenu des mentions marginales se trouve dans l'onglet dédié.
          </p>
        </section>

        {errorMsg && (
          <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
            {errorMsg}
          </div>
        )}

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

/**
 * =========================================================================
 * SectionSources (nouveau modèle) - INLINE (comme tu l’as collé)
 * =========================================================================
 * ⚠️ Important:
 * - nécessite que la vue SQL v_manifestations_pick existe
 * - sources = CitationDraft[]
 */
function SectionSources({
  sources,
  loading,
  onAdd,
  onRemove,
  onChange,

  presetKey,
  presetLabel,
}: {
  sources: CitationDraft[];
  loading: boolean;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, patch: Partial<CitationDraft>) => void;

  presetKey?: string;
  presetLabel?: string;
}) {
  const normalizeUrl = (url: string) => {
    const u = (url ?? '').trim();
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    return `https://${u}`;
  };

  const isOnline = (c: CitationDraft) => {
    const depotType = c.manifestation?.depot_type;
    const hasUrl = Boolean((c.manifestation?.url_base ?? '').trim());
    return depotType === 'en_ligne' || hasUrl;
  };

  const titleFor = (c: CitationDraft) => {
    const sigle = c.manifestation?.institution_sigle?.trim();
    const inst = c.manifestation?.institution_nom?.trim();
    const depot = c.manifestation?.depot_nom?.trim();
    const unite = c.manifestation?.unite_titre?.trim();
    const cote = (c.manifestation?.unite_cote ?? '').trim();
    const man = c.manifestation?.type_manifestation
      ? ` · ${c.manifestation.type_manifestation}`
      : '';

    const left = sigle && inst ? `${inst} (${sigle})` : inst ? inst : sigle ? sigle : 'Source';
    const mid = depot ? ` · ${depot}` : '';
    const right = unite ? ` · ${unite}` : '';
    const cLabel = cote ? ` · ${cote}` : '';
    return `${left}${mid}${man}${right}${cLabel}`;
  };

  const formatRangeLabel = (a?: number | null, b?: number | null, kind = 'vue') => {
    if (a == null && b == null) return '';
    if (a != null && b == null) return `${kind} ${a}`;
    if (a == null && b != null) return `${kind} ${b}`;
    if (a === b) return `${kind} ${a}`;
    return `${kind}s ${a}–${b}`;
  };

  const toIntOrNull = (v: string) => {
    const t = (v ?? '').trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  };

  /**
   * =========================================================================
   * Presets (localStorage) — optionnel
   * =========================================================================
   */
  type PresetPayload = { version: 1; savedAt: string; citations: CitationDraft[] };
  const presetStorageKey = presetKey ? `rebond:acte_citations_preset:${presetKey}` : null;

  const loadPreset = (): PresetPayload | null => {
    if (!presetStorageKey) return null;
    try {
      const raw = localStorage.getItem(presetStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.citations || !Array.isArray(parsed.citations)) return null;
      return parsed as PresetPayload;
    } catch {
      return null;
    }
  };

  const savePreset = (payloadCitations: CitationDraft[]) => {
    if (!presetStorageKey) return;
    const payload: PresetPayload = {
      version: 1,
      savedAt: new Date().toISOString(),
      citations: payloadCitations,
    };
    localStorage.setItem(presetStorageKey, JSON.stringify(payload));
  };

  const clearPreset = () => {
    if (!presetStorageKey) return;
    localStorage.removeItem(presetStorageKey);
  };

  const applyPreset = (opts: { keepRanges: boolean; keepNotes: boolean }) => {
    const preset = loadPreset();
    if (!preset) return;

    const next = preset.citations;

    if (sources.length < next.length) {
      const toAdd = next.length - sources.length;
      for (let i = 0; i < toAdd; i++) onAdd();
    } else if (sources.length > next.length) {
      const toRemove = sources.length - next.length;
      for (let i = 0; i < toRemove; i++) onRemove(sources.length - 1 - i);
    }

    next.forEach((p, idx) => {
      const cur = sources[idx] ?? ({} as CitationDraft);

      const merged: Partial<CitationDraft> = {
        manifestation_id: p.manifestation_id,
        manifestation: p.manifestation,

        // ranges
        vues_start: opts.keepRanges ? cur.vues_start : null,
        vues_end: opts.keepRanges ? cur.vues_end : null,
        vues_raw: opts.keepRanges ? cur.vues_raw : '',
        page_start: opts.keepRanges ? cur.page_start : null,
        page_end: opts.keepRanges ? cur.page_end : null,
        page_raw: opts.keepRanges ? cur.page_raw : '',

        acte_manquant: opts.keepRanges ? cur.acte_manquant : false,

        note: opts.keepNotes ? cur.note : p.note,
      };

      onChange(idx, merged);
    });
  };

  const presetExists = Boolean(loadPreset());
  const presetInfo = loadPreset();

  const toPresetCitations = (mode: 'empty_ranges' | 'keep_ranges') => {
    return sources.map((c) => {
      const cleanNote = (c.note ?? '').replace(/\s{2,}/g, ' ').trim();
      return {
        ...c,
        id: undefined,
        vues_start: mode === 'empty_ranges' ? null : (c.vues_start ?? null),
        vues_end: mode === 'empty_ranges' ? null : (c.vues_end ?? null),
        vues_raw: mode === 'empty_ranges' ? '' : (c.vues_raw ?? ''),
        page_start: mode === 'empty_ranges' ? null : (c.page_start ?? null),
        page_end: mode === 'empty_ranges' ? null : (c.page_end ?? null),
        page_raw: mode === 'empty_ranges' ? '' : (c.page_raw ?? ''),
        acte_manquant: mode === 'empty_ranges' ? false : Boolean(c.acte_manquant),
        note: cleanNote,
      } satisfies CitationDraft;
    });
  };

  /**
   * =========================================================================
   * Picker (v_manifestations_pick)
   * =========================================================================
   */
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [pickLoading, setPickLoading] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [pickRows, setPickRows] = useState<ManifestationPick[]>([]);

  const openPicker = (idx: number) => {
    setPickerTargetIdx(idx);
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setPickerTargetIdx(null);
    setPickError(null);
  };

  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;

    const run = async () => {
      setPickLoading(true);
      setPickError(null);

      let query = supabase
        .from('v_manifestations_pick')
        .select(
          'manifestation_id,type_manifestation,unite_id,unite_titre,unite_cote,pagination_type,depot_nom,depot_type,institution_nom,institution_sigle,url_base,plateforme_code',
        )
        .order('institution_sigle', { ascending: true })
        .order('unite_titre', { ascending: true })
        .limit(50);

      const needle = q.trim();
      if (needle) {
        query = query.or(
          [
            `unite_titre.ilike.%${needle}%`,
            `unite_cote.ilike.%${needle}%`,
            `institution_nom.ilike.%${needle}%`,
            `institution_sigle.ilike.%${needle}%`,
            `depot_nom.ilike.%${needle}%`,
          ].join(','),
        );
      }

      if (onlyOnline) {
        query = query.or('depot_type.eq.en_ligne,url_base.not.is.null');
      }

      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        setPickError(error.message);
        setPickRows([]);
        setPickLoading(false);
        return;
      }

      const rows = (data ?? []) as any[];
      const mapped: ManifestationPick[] = rows.map((r) => ({
        manifestation_id: r.manifestation_id,
        type_manifestation: r.type_manifestation,

        unite_id: r.unite_id,
        unite_titre: r.unite_titre,
        unite_cote: r.unite_cote,
        pagination_type: r.pagination_type,

        depot_nom: r.depot_nom,
        depot_type: r.depot_type,

        institution_nom: r.institution_nom,
        institution_sigle: r.institution_sigle,

        url_base: r.url_base,
        plateforme_code: r.plateforme_code,
      }));

      setPickRows(mapped);
      setPickLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [pickerOpen, q, onlyOnline]);

  const groupedByUnite = useMemo(() => {
    type UniteGroup = {
      unite_id: string;
      unite_titre: string;
      unite_cote: string | null;
      pagination_type: ManifestationPick['pagination_type'];

      depot_nom: string;
      depot_type: ManifestationPick['depot_type'];

      institution_nom: string;
      institution_sigle: string | null;

      original?: ManifestationPick;
      numerisation?: ManifestationPick;
    };

    const best = (cur: ManifestationPick | undefined, cand: ManifestationPick) => {
      if (!cur) return cand;
      const curHasUrl = Boolean((cur.url_base ?? '').trim());
      const candHasUrl = Boolean((cand.url_base ?? '').trim());
      if (!curHasUrl && candHasUrl) return cand; // préfère une ligne avec url
      return cur;
    };

    const map = new Map<string, UniteGroup>();

    for (const r of pickRows) {
      // on ne veut afficher que ces 2 options dans le picker
      if (r.type_manifestation !== 'original' && r.type_manifestation !== 'numerisation') continue;

      const g =
        map.get(r.unite_id) ??
        ({
          unite_id: r.unite_id,
          unite_titre: r.unite_titre,
          unite_cote: r.unite_cote ?? null,
          pagination_type: r.pagination_type ?? null,
          depot_nom: r.depot_nom,
          depot_type: r.depot_type,
          institution_nom: r.institution_nom,
          institution_sigle: r.institution_sigle ?? null,
        } satisfies UniteGroup);

      if (r.type_manifestation === 'original') g.original = best(g.original, r);
      if (r.type_manifestation === 'numerisation') g.numerisation = best(g.numerisation, r);

      map.set(r.unite_id, g);
    }

    return Array.from(map.values()).sort((a, b) => a.unite_titre.localeCompare(b.unite_titre));
  }, [pickRows]);

  const pick = (row: ManifestationPick) => {
    if (pickerTargetIdx == null) return;

    const patch: Partial<CitationDraft> = {
      manifestation_id: row.manifestation_id,
      manifestation: {
        type_manifestation: row.type_manifestation,
        unite_titre: row.unite_titre,
        unite_cote: row.unite_cote,
        depot_type: row.depot_type,
        depot_nom: row.depot_nom,
        institution_sigle: row.institution_sigle,
        institution_nom: row.institution_nom,
        url_base: row.url_base,
        plateforme_code: row.plateforme_code,
        pagination_type: row.pagination_type,
      },
    };

    // si on change de registre, on reset les ranges pour éviter incohérences
    patch.vues_start = null;
    patch.vues_end = null;
    patch.vues_raw = '';
    patch.page_start = null;
    patch.page_end = null;
    patch.page_raw = '';
    patch.acte_manquant = false;

    onChange(pickerTargetIdx, patch);
    closePicker();
  };

  return (
    <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
        <div>
          <h3 className='text-sm font-semibold text-slate-900'>Sources & références</h3>
          <p className='mt-1 text-sm text-slate-600'>
            Tu choisis un <span className='font-medium'>registre / unité documentaire</span> (via
            une manifestation : original, microfilm, numérisation) puis tu saisis ce qui est
            spécifique à l’acte : <span className='font-medium'>vues/pages</span>,{' '}
            <span className='font-medium'>lacune</span>, note.
          </p>

          {presetKey && (
            <p className='mt-1 text-xs text-slate-500'>
              Preset : <span className='font-medium'>{presetLabel ?? presetKey}</span>
              {presetExists && presetInfo?.savedAt ? (
                <>
                  {' '}
                  · enregistré le{' '}
                  <span className='font-medium'>
                    {new Date(presetInfo.savedAt).toLocaleString()}
                  </span>
                </>
              ) : (
                <> · aucun preset enregistré</>
              )}
            </p>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <button
            type='button'
            onClick={onAdd}
            className='rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50'
          >
            + Ajouter une référence
          </button>
        </div>
      </div>

      {presetKey && (
        <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3'>
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <div className='text-sm font-medium text-slate-900'>Pré-remplissage</div>

            <div className='flex flex-wrap items-center gap-2'>
              <button
                type='button'
                disabled={!presetExists}
                onClick={() => applyPreset({ keepRanges: false, keepNotes: false })}
                className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'
              >
                Appliquer preset (ranges vides)
              </button>

              <button
                type='button'
                disabled={!presetExists}
                onClick={() => applyPreset({ keepRanges: true, keepNotes: true })}
                className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'
              >
                Appliquer preset (garder saisie)
              </button>

              <button
                type='button'
                onClick={() => savePreset(toPresetCitations('empty_ranges'))}
                className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50'
              >
                Enregistrer preset (sans ranges)
              </button>

              <button
                type='button'
                onClick={() => savePreset(toPresetCitations('keep_ranges'))}
                className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50'
              >
                Enregistrer preset (avec ranges)
              </button>

              <button
                type='button'
                disabled={!presetExists}
                onClick={() => clearPreset()}
                className='rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'
              >
                Effacer preset
              </button>
            </div>
          </div>

          <p className='mt-2 text-xs text-slate-600'>
            Idéal : même commune/année/type → mêmes registres, seules les vues/pages changent.
          </p>
        </div>
      )}

      <div className='mt-4 space-y-3'>
        {loading && <div className='text-sm text-slate-600'>Chargement…</div>}

        {!loading &&
          sources.map((c, idx) => {
            const online = isOnline(c);
            const url = (c.manifestation?.url_base ?? '').trim();
            const missing = Boolean(c.acte_manquant);

            const vuesLabel =
              (c.vues_raw ?? '').trim() ||
              formatRangeLabel(c.vues_start ?? null, c.vues_end ?? null, 'vue');
            const pagesLabel =
              (c.page_raw ?? '').trim() ||
              formatRangeLabel(c.page_start ?? null, c.page_end ?? null, 'page');

            return (
              <div
                key={c.id ?? idx}
                className='overflow-hidden rounded-xl border border-slate-200 bg-white'
              >
                <div className='flex flex-col gap-2 border-b border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between'>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <div className='text-sm font-semibold text-slate-900'>
                        Référence #{idx + 1}
                      </div>

                      {c.manifestation?.institution_sigle && (
                        <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
                          {c.manifestation.institution_sigle}
                        </span>
                      )}

                      {online ? (
                        <span className='rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800'>
                          En ligne
                        </span>
                      ) : (
                        <span className='rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800'>
                          Sur place
                        </span>
                      )}

                      {missing && (
                        <span className='rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800'>
                          Acte manquant
                        </span>
                      )}

                      {vuesLabel && (
                        <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
                          {vuesLabel}
                        </span>
                      )}

                      {pagesLabel && (
                        <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
                          {pagesLabel}
                        </span>
                      )}
                    </div>

                    <div className='mt-1 truncate text-xs text-slate-600'>
                      {c.manifestation_id ? titleFor(c) : 'Aucune source sélectionnée'}
                    </div>
                  </div>

                  <div className='flex flex-wrap items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => openPicker(idx)}
                      className='rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50'
                    >
                      Sélectionner le registre
                    </button>

                    <button
                      type='button'
                      onClick={() => onRemove(idx)}
                      className='rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50'
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className='p-4'>
                  <div className='rounded-xl border border-slate-200 bg-white p-3'>
                    <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
                      <div className='min-w-0'>
                        <div className='text-xs font-medium text-slate-700'>Registre</div>

                        {/* Ligne principale lisible */}
                        <div className='mt-1 flex flex-wrap items-center gap-2'>
                          <div className='text-sm font-semibold text-slate-900'>
                            {c.manifestation?.unite_titre || '—'}
                          </div>

                          {c.manifestation?.institution_sigle && (
                            <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
                              {c.manifestation.institution_sigle}
                            </span>
                          )}

                          {c.manifestation?.depot_nom && (
                            <span className='rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700'>
                              {c.manifestation.depot_nom}
                            </span>
                          )}

                          {c.manifestation?.type_manifestation && (
                            <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
                              {c.manifestation.type_manifestation}
                            </span>
                          )}
                        </div>

                        {/* Sous-ligne ultra légère */}
                        <div className='mt-1 text-xs text-slate-600'>
                          {c.manifestation?.unite_cote ? (
                            <span>
                              Cote :{' '}
                              <span className='font-medium'>{c.manifestation.unite_cote}</span>
                            </span>
                          ) : (
                            <span className='text-slate-500'>—</span>
                          )}
                          {c.manifestation?.pagination_type ? (
                            <span className='text-slate-500'>
                              {' '}
                              · Pagination : {c.manifestation.pagination_type}
                            </span>
                          ) : null}
                        </div>

                        {/* Détails repliables */}
                        <details className='mt-2'>
                          <summary className='cursor-pointer select-none text-xs font-medium text-slate-700 hover:text-slate-900'>
                            Détails
                          </summary>
                          <div className='mt-2 space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700'>
                            <div>
                              <span className='text-slate-500'>Institution :</span>{' '}
                              <span className='font-medium'>
                                {c.manifestation?.institution_nom ?? '—'}
                              </span>
                            </div>
                            <div>
                              <span className='text-slate-500'>Dépôt :</span>{' '}
                              <span className='font-medium'>
                                {c.manifestation?.depot_nom ?? '—'}
                              </span>
                              {c.manifestation?.depot_type ? (
                                <span className='text-slate-500'>
                                  {' '}
                                  · {c.manifestation.depot_type}
                                </span>
                              ) : null}
                            </div>
                            <div>
                              <span className='text-slate-500'>Manifestation :</span>{' '}
                              <span className='font-medium'>
                                {c.manifestation?.type_manifestation ?? '—'}
                              </span>
                              {c.manifestation?.pagination_type ? (
                                <span className='text-slate-500'>
                                  {' '}
                                  · pagination {c.manifestation.pagination_type}
                                </span>
                              ) : null}
                            </div>

                            {url ? (
                              <div className='break-all'>
                                <span className='text-slate-500'>URL :</span>{' '}
                                <span className='font-mono'>{url}</span>
                              </div>
                            ) : null}
                          </div>
                        </details>
                      </div>

                      <div className='flex flex-wrap items-center gap-2'>
                        {url ? (
                          <a
                            href={normalizeUrl(url)}
                            target='_blank'
                            rel='noreferrer'
                            className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50'
                          >
                            Ouvrir visionneuse ↗
                          </a>
                        ) : (
                          <span className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700'>
                            Pas d’URL
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
                    <div className='md:col-span-12'>
                      <div className='flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between'>
                        <label className='inline-flex items-center gap-2 text-sm text-slate-800'>
                          <input
                            type='checkbox'
                            checked={Boolean(c.acte_manquant)}
                            onChange={(e) => onChange(idx, { acte_manquant: e.target.checked })}
                            className='h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-0'
                          />
                          Acte attendu mais manquant (lacune)
                        </label>
                        <div className='text-xs text-slate-600'>
                          À cocher si tu es au bon endroit mais l’acte n’est pas présent.
                        </div>
                      </div>
                    </div>

                    <div className='md:col-span-6'>
                      <label className='block text-xs font-medium text-slate-700'>
                        Vues (structuré)
                      </label>
                      <div className='mt-1 flex items-center gap-2'>
                        <input
                          inputMode='numeric'
                          value={c.vues_start ?? ''}
                          onChange={(e) =>
                            onChange(idx, { vues_start: toIntOrNull(e.target.value) })
                          }
                          placeholder='début'
                          className='w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                        />
                        <span className='text-sm text-slate-500'>→</span>
                        <input
                          inputMode='numeric'
                          value={c.vues_end ?? ''}
                          onChange={(e) => onChange(idx, { vues_end: toIntOrNull(e.target.value) })}
                          placeholder='fin'
                          className='w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                        />
                        <span className='text-xs text-slate-600'>
                          {formatRangeLabel(c.vues_start ?? null, c.vues_end ?? null, 'vue') || '—'}
                        </span>
                      </div>
                    </div>

                    <div className='md:col-span-6'>
                      <label className='block text-xs font-medium text-slate-700'>
                        Vues (brut)
                      </label>
                      <input
                        type='text'
                        value={c.vues_raw ?? ''}
                        onChange={(e) => onChange(idx, { vues_raw: e.target.value })}
                        placeholder='ex : 101-102 / vue 101 / images 3 à 4'
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      />
                    </div>

                    <div className='md:col-span-6'>
                      <label className='block text-xs font-medium text-slate-700'>
                        Pages (structuré)
                      </label>
                      <div className='mt-1 flex items-center gap-2'>
                        <input
                          inputMode='numeric'
                          value={c.page_start ?? ''}
                          onChange={(e) =>
                            onChange(idx, { page_start: toIntOrNull(e.target.value) })
                          }
                          placeholder='début'
                          className='w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                        />
                        <span className='text-sm text-slate-500'>→</span>
                        <input
                          inputMode='numeric'
                          value={c.page_end ?? ''}
                          onChange={(e) => onChange(idx, { page_end: toIntOrNull(e.target.value) })}
                          placeholder='fin'
                          className='w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                        />
                        <span className='text-xs text-slate-600'>
                          {formatRangeLabel(c.page_start ?? null, c.page_end ?? null, 'page') ||
                            '—'}
                        </span>
                      </div>
                    </div>

                    <div className='md:col-span-6'>
                      <label className='block text-xs font-medium text-slate-700'>
                        Pages (brut)
                      </label>
                      <input
                        type='text'
                        value={c.page_raw ?? ''}
                        onChange={(e) => onChange(idx, { page_raw: e.target.value })}
                        placeholder='ex : p. 12-13 / folio 8r-8v'
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      />
                    </div>

                    <div className='md:col-span-12'>
                      <label className='block text-xs font-medium text-slate-700'>Note</label>
                      <textarea
                        value={c.note ?? ''}
                        onChange={(e) => onChange(idx, { note: e.target.value })}
                        placeholder='ex : consulté le … ; registre lacunaire ; qualité faible ; etc.'
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Picker modal */}
      {pickerOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
          <div className='w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'>
            <div className='border-b border-slate-200 bg-slate-50 p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <div className='text-sm font-semibold text-slate-900'>
                    Choisir un registre / une manifestation
                  </div>
                  <div className='mt-1 text-xs text-slate-600'>
                    Recherche par titre, cote, institution (ANOM / AD971…), dépôt…
                  </div>
                </div>
                <button
                  type='button'
                  onClick={closePicker}
                  className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50'
                >
                  Fermer
                </button>
              </div>

              <div className='mt-3 space-y-2'>
                <div className='grid grid-cols-12 gap-2'>
                  <div className='col-span-12'>
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder='ex: Deshaies 1859 mariages / CAOM EC / ANOM…'
                      className='w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                    />
                  </div>
                </div>

                <div className='flex justify-end'>
                  <label className='inline-flex w-fit items-center gap-2 text-sm text-slate-700'>
                    <input
                      type='checkbox'
                      checked={onlyOnline}
                      onChange={(e) => setOnlyOnline(e.target.checked)}
                      className='h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-0'
                    />
                    En ligne uniquement
                  </label>
                </div>
              </div>
            </div>

            <div className='max-h-[70vh] overflow-auto p-4'>
              {pickLoading && <div className='text-sm text-slate-600'>Recherche…</div>}
              {pickError && (
                <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
                  {pickError}
                  <div className='mt-1 text-xs text-red-700'>
                    Astuce : crée la vue <span className='font-mono'>v_manifestations_pick</span>.
                  </div>
                </div>
              )}

              {!pickLoading && !pickError && pickRows.length === 0 && (
                <div className='text-sm text-slate-600'>Aucun résultat.</div>
              )}

              {!pickLoading && !pickError && pickRows.length > 0 && (
                <div className='space-y-2'>
                  {groupedByUnite.map((g) => {
                    const online =
                      g.depot_type === 'en_ligne' ||
                      Boolean((g.numerisation?.url_base ?? '').trim());

                    return (
                      <div
                        key={g.unite_id}
                        className='w-full rounded-xl border border-slate-200 bg-white p-3 text-left'
                      >
                        {/* Ligne "registre" */}
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='text-sm font-semibold text-slate-900'>
                            {g.unite_titre}
                          </span>

                          {g.institution_sigle && (
                            <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
                              {g.institution_sigle}
                            </span>
                          )}

                          {online ? (
                            <span className='rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800'>
                              En ligne
                            </span>
                          ) : (
                            <span className='rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800'>
                              Sur place
                            </span>
                          )}

                          {g.pagination_type && (
                            <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
                              pagination: {g.pagination_type}
                            </span>
                          )}
                        </div>

                        <div className='mt-1 text-xs text-slate-600'>
                          {g.institution_nom} · {g.depot_nom}
                          {g.unite_cote ? ` · ${g.unite_cote}` : ''}
                        </div>

                        {/* 2 options sous le registre */}
                        <div className='mt-3 flex flex-wrap gap-2'>
                          <button
                            type='button'
                            disabled={!g.original}
                            onClick={() => g.original && pick(g.original)}
                            className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
                          >
                            Original
                          </button>

                          <button
                            type='button'
                            disabled={!g.numerisation}
                            onClick={() => g.numerisation && pick(g.numerisation)}
                            className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
                          >
                            Numérisation
                          </button>

                          {g.numerisation?.url_base ? (
                            <span className='text-[11px] text-slate-500 self-center'>
                              URL: <span className='font-mono'>{g.numerisation.url_base}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
