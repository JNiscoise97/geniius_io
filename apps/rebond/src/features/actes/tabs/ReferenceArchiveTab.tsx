//ReferenceArchiveTab.tsx

import { useEffect, useMemo, useState } from 'react';
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

type LieuSituation = 'bureau_courant' | 'autre_bureau' | 'transporte';

type ReferenceArchiveTabProps = {
  acte: EtatCivilActe;
  bureauLabel?: string;
  onUpdated?: () => Promise<void> | void;
};

type ActeSource = {
  id: string;
  acte_id: string;
  depot_type: string | null;
  nom_depot: string | null;
  serie: string | null;
  cote: string | null;
  registre: string | null;
  folio_page: string | null;
  vue_image: string | null;
  support: string | null;
  langue: string | null;
  ecriture: string | null;
  etat_conservation: string | null;
  note: string | null;
};

type SourceDraft = {
  id?: string;
  depot_type: string;
  nom_depot: string;
  serie: string;
  cote: string;
  registre: string;
  folio_page: string;
  vue_image: string;
  support: string;
  langue: string;
  ecriture: string;
  etat_conservation: string;
  note: string;
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

function normalizeSourceRow(s: Partial<ActeSource> | null | undefined): SourceDraft {
  return {
    id: s?.id,
    depot_type: s?.depot_type ?? '',
    nom_depot: s?.nom_depot ?? '',
    serie: s?.serie ?? '',
    cote: s?.cote ?? '',
    registre: s?.registre ?? '',
    folio_page: s?.folio_page ?? '',
    vue_image: s?.vue_image ?? '',
    support: s?.support ?? '',
    langue: s?.langue ?? '',
    ecriture: s?.ecriture ?? '',
    etat_conservation: s?.etat_conservation ?? '',
    note: s?.note ?? '',
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

      // legacy (à supprimer plus tard)
      comparution_observations: (acte as any).comparution_observations ?? '',

      mentions_marginales_presentes: Boolean((acte as any).mentions_marginales_presentes),
      auteur_fonction: (acte as any).auteur_fonction ?? '',
    }),
    [acte, bureauLabel],
  );

  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [sources, setSources] = useState<SourceDraft[]>([]);

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

  useEffect(() => {
    setForm(initialState);
  }, [initialState]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingSources(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from('etat_civil_actes_sources')
        .select(
          'id, acte_id, depot_type, nom_depot, serie, cote, registre, folio_page, vue_image, support, langue, ecriture, etat_conservation, note',
        )
        .eq('acte_id', acteId)
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        setErrorMsg(error.message);
        setSources([]);
        setLoadingSources(false);
        return;
      }

      const rows = (data ?? []).map((r: ActeSource) => normalizeSourceRow(r));
      setSources(rows.length ? rows : [normalizeSourceRow(null)]);
      setLoadingSources(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [acteId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateSource = (idx: number, patch: Partial<SourceDraft>) => {
    setSources((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addSource = () => {
    setSources((prev) => [...prev, normalizeSourceRow(null)]);
  };

  const duplicateSource = (idx: number) => {
    setSources((prev) => {
      const copy = { ...prev[idx] };
      delete copy.id;
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  };

  const removeSource = (idx: number) => {
    setSources((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  const upsertSources = async () => {
    const payload = sources
      .map((s) => ({
        id: s.id,
        acte_id: acteId,
        depot_type: s.depot_type || null,
        nom_depot: s.nom_depot || null,
        serie: s.serie || null,
        cote: s.cote || null,
        registre: s.registre || null,
        folio_page: s.folio_page || null,
        vue_image: s.vue_image || null,
        support: s.support || null,
        langue: s.langue || null,
        ecriture: s.ecriture || null,
        etat_conservation: s.etat_conservation || null,
        note: s.note || null,
      }))
      .filter((row) => {
        const hasAny =
          row.depot_type ||
          row.nom_depot ||
          row.serie ||
          row.cote ||
          row.registre ||
          row.folio_page ||
          row.vue_image ||
          row.support ||
          row.langue ||
          row.ecriture ||
          row.etat_conservation ||
          row.note;
        return Boolean(hasAny);
      });

    const keepIds = payload.map((p) => p.id).filter(Boolean) as string[];

    if (payload.length) {
      const { error } = await supabase
        .from('etat_civil_actes_sources')
        .upsert(payload, { onConflict: 'id' });
      if (error) throw error;
    }

    const { data: existing, error: errExisting } = await supabase
      .from('etat_civil_actes_sources')
      .select('id')
      .eq('acte_id', acteId);
    if (errExisting) throw errExisting;

    const existingIds = (existing ?? []).map((r: any) => r.id as string);
    const toDelete = existingIds.filter((id) => !keepIds.includes(id));

    if (toDelete.length) {
      const { error } = await supabase.from('etat_civil_actes_sources').delete().in('id', toDelete);
      if (error) throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const patch: Record<string, any> = {
      type_acte: form.type_acte || null,
      type_acte_ref: form.type_acte_ref?.ids?.[0] ?? null,
      numero_acte: form.numero_acte || null,
      date: form.date || null,
      heure: form.heure || null,

      bureau_id: form.bureau_id ?? null,
      redaction_bureau_id: form.lieu_situation === 'autre_bureau' ? form.redaction_bureau_id : null,

      lieu_situation: form.lieu_situation,
      lieu_autre_bureau:
        form.lieu_situation === 'autre_bureau' ? form.lieu_autre_bureau || null : null,
      lieu_transport_raison:
        form.lieu_situation === 'transporte' ? form.lieu_transport_raison || null : null,

      // legacy (à supprimer plus tard)
      comparution_observations:
        form.lieu_situation === 'transporte' ? form.comparution_observations || null : null,

      mentions_marginales_presentes: Boolean(form.mentions_marginales_presentes),
      auteur_fonction: form.auteur_fonction || null,
    };

    const { error } = await supabase.from('etat_civil_actes').update(patch).eq('id', acteId);

    if (error) {
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    try {
      await upsertSources();
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Erreur lors de l’enregistrement des sources.');
      setSaving(false);
      return;
    }

    setSaving(false);
    await onUpdated?.();
  };

  const currentTypeActeLabels = toLabels((form as any).type_acte_ref); // ou form.type_acte_ref
  const currentTypeActeIds = toIds((form as any).type_acte_ref);

  const openDictionnaire = (
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

  const clearDictValue = (field: 'type_acte_ref') => {
    setField(field, null);
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

          <div className='w-fit'>
            <label className='block text-xs font-medium text-slate-700'>Label</label>
            <div className='mt-1 inline-flex w-fit items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'>
              {label}
            </div>
          </div>
        </div>

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
                  openDictionnaire(
                    'type_acte_ref',
                    "Modifier le type d'acte",
                    false,
                    currentTypeActeIds,
                  )
                }
                onDelete={() => clearDictValue('type_acte_ref')}
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
                  if (!iso && v) {
                    // reset si invalide
                    setField('date', '');
                  }
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
                        setField('lieu_situation', 'bureau_courant')
                        setField('redaction_bureau_id', null);
                        setField('redaction_bureau_label', '');
                        setField('lieu_transport_raison', '');
                      }
                    }
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
                      }
                    }
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
                        setField('lieu_situation', 'transporte')
                        setField('redaction_bureau_id', null);
                        setField('redaction_bureau_label', '');
                        setField('lieu_transport_raison', '');
                      }
                    }
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
                      defaultSelectedId: form.redaction_bureau_id, // ✅ pas form.bureau_id
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
                    ></textarea>
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
                    ></textarea>
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

        <SectionSources
          sources={sources}
          loading={loadingSources}
          onAdd={addSource}
          onDuplicate={duplicateSource}
          onRemove={removeSource}
          onChange={updateSource}
        />

        <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h3 className='text-sm font-semibold text-slate-900'>Auteur institutionnel</h3>

          <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
            <div className='md:col-span-4'>
              <label className='block text-xs font-medium text-slate-700'>Fonction</label>
              <select
                value={form.auteur_fonction}
                onChange={(e) => setField('auteur_fonction', e.target.value)}
                className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400'
              >
                <option value=''></option>
                <option>Officier d’état civil</option>
                <option>Prêtre</option>
                <option>Greffier</option>
                <option>Autre</option>
              </select>
            </div>
          </div>

          <p className='mt-2 text-xs text-slate-500'>
            Le nom de l’officiant est rattaché aux acteurs (niveau “entités/acteurs”), pas à l’acte.
          </p>
        </section>

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

function SectionSources({
  sources,
  loading,
  onAdd,
  onDuplicate,
  onRemove,
  onChange,

  // ✅ NOUVEAU : clé de preset et libellé (sinon pas de preset UI)
  presetKey,
  presetLabel,
}: {
  sources: SourceDraft[];
  loading: boolean;
  onAdd: () => void;
  onDuplicate: (idx: number) => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, patch: Partial<SourceDraft>) => void;

  presetKey?: string;
  presetLabel?: string;
}) {
  // ----------------------------
  // Helpers UI
  // ----------------------------
  const isOnline = (support?: string, urlVisionneuse?: string) => {
    const s = (support ?? '').toLowerCase();
    return (
      Boolean((urlVisionneuse ?? '').trim()) ||
      s.includes('num') ||
      s.includes('en ligne') ||
      s.includes('online')
    );
  };

  const normalizeUrl = (url: string) => {
    const u = (url ?? '').trim();
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    return `https://${u}`;
  };

  const parseVueRange = (value: string) => {
    const v = (value ?? '')
      .toLowerCase()
      .replaceAll('vues', '')
      .replaceAll('vue', '')
      .replaceAll('images', '')
      .replaceAll('image', '')
      .replaceAll('et', '-')
      .replaceAll('à', '-')
      .replaceAll('–', '-')
      .replaceAll(' ', '')
      .trim();

    if (!v) return { start: '', end: '' };
    if (/^\d+$/.test(v)) return { start: v, end: v };
    const m = v.match(/^(\d+)-(\d+)$/);
    if (m) return { start: m[1], end: m[2] };
    const nums = Array.from(v.matchAll(/\d+/g)).map((x) => x[0]);
    if (nums.length === 1) return { start: nums[0], end: nums[0] };
    if (nums.length >= 2) return { start: nums[0], end: nums[1] };
    return { start: '', end: '' };
  };

  const formatVueRangeLabel = (vues: string) => {
    const { start, end } = parseVueRange(vues);
    if (!start) return '';
    if (start === end) return `vue ${start}`;
    return `vues ${start}–${end}`;
  };

  const isMissingActe = (note?: string) => {
    const n = (note ?? '').toLowerCase();
    return (
      (note ?? '').includes('[ACTE_MANQUANT]') ||
      n.includes('manquant') ||
      n.includes('introuvable') ||
      n.includes('lacune') ||
      n.includes('absent') ||
      n.includes('page manquante')
    );
  };

  const toggleMissingActe = (idx: number, checked: boolean) => {
    const tag = '[ACTE_MANQUANT]';
    const current = sources[idx]?.note ?? '';
    const hasTag = current.includes(tag);

    if (checked && !hasTag) {
      const next = (
        current ? `${tag} ${current}` : `${tag} Acte manquant à l’endroit attendu.`
      ).trim();
      onChange(idx, { note: next });
      return;
    }

    if (!checked && hasTag) {
      const next = current
        .replace(tag, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      onChange(idx, { note: next });
    }
  };

  // ----------------------------
  // Presets (localStorage)
  // ----------------------------
  type PresetPayload = {
    version: 1;
    savedAt: string;
    sources: SourceDraft[];
  };

  const presetStorageKey = presetKey ? `rebond:acte_sources_preset:${presetKey}` : null;

  const loadPreset = (): PresetPayload | null => {
    if (!presetStorageKey) return null;
    try {
      const raw = localStorage.getItem(presetStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.sources || !Array.isArray(parsed.sources)) return null;
      return parsed as PresetPayload;
    } catch {
      return null;
    }
  };

  const savePreset = (payloadSources: SourceDraft[]) => {
    if (!presetStorageKey) return;
    const payload: PresetPayload = {
      version: 1,
      savedAt: new Date().toISOString(),
      sources: payloadSources,
    };
    localStorage.setItem(presetStorageKey, JSON.stringify(payload));
  };

  const clearPreset = () => {
    if (!presetStorageKey) return;
    localStorage.removeItem(presetStorageKey);
  };

  const applyPreset = (opts: { keepVues: boolean; keepNotes: boolean }) => {
    const preset = loadPreset();
    if (!preset) return;

    // Stratégie:
    // - on remplace la liste courante par celle du preset
    // - on conserve (optionnel) les vues/notes déjà saisies sur l’acte courant
    // - on garde l’id? -> NON: on laisse tel quel (tes rows n’ont pas d’id tant que non persistées)
    //   Ici on ne peut pas recréer la liste via setSources car SectionSources ne possède pas setSources.
    //   Donc on "projette" le preset sur les lignes existantes via onChange, et on ajuste le nombre via onAdd/onRemove.
    //
    // => Important: sans callback "setSources", on fait un apply en 2 étapes:
    //    1) ajuster le nombre de lignes (add/remove)
    //    2) patcher chaque ligne

    const next = preset.sources;

    // Ajuster le nombre de lignes
    if (sources.length < next.length) {
      const toAdd = next.length - sources.length;
      for (let i = 0; i < toAdd; i++) onAdd();
    } else if (sources.length > next.length) {
      const toRemove = sources.length - next.length;
      for (let i = 0; i < toRemove; i++) onRemove(sources.length - 1 - i);
    }

    // Appliquer les champs
    next.forEach((p, idx) => {
      const current = sources[idx] ?? ({} as SourceDraft);

      const merged: Partial<SourceDraft> = {
        depot_type: p.depot_type,
        nom_depot: p.nom_depot,
        cote: p.cote,
        registre: p.registre,
        serie: p.serie,
        support: p.support,
        langue: p.langue,
        ecriture: p.ecriture,
        etat_conservation: p.etat_conservation,

        // url visionneuse
        vue_image: p.vue_image,

        // vues/pages
        folio_page: opts.keepVues ? current.folio_page : '',

        // notes
        note: opts.keepNotes ? current.note : p.note,
      };

      onChange(idx, merged);
    });
  };

  const presetExists = Boolean(loadPreset());
  const presetInfo = loadPreset();

  const buildCompactTitle = (s: SourceDraft) => {
    const depot = (s.depot_type || '').trim() || 'Dépôt';
    const nomDepot = (s.nom_depot || '').trim();
    const cote = (s.cote || '').trim();
    const registre = (s.registre || '').trim();
    const vues = (s.folio_page || '').trim();
    const vueLabel = formatVueRangeLabel(vues) || vues;

    const left = nomDepot ? `${depot} · ${nomDepot}` : depot;
    const mid = cote ? ` · ${cote}` : '';
    const right = registre ? ` · ${registre}` : '';
    const v = vueLabel ? ` · ${vueLabel}` : '';

    return `${left}${mid}${right}${v}`;
  };

  // Pour enregistrer le preset, on veut **retirer les choses “acte-spécifiques”** :
  // - vues/pages => on peut les vider (sinon tu risques de réappliquer de mauvaises vues)
  // - note => garder note “structurelle” (ex: “numérisé en ligne”), mais enlever le tag [ACTE_MANQUANT]
  const toPresetSources = (mode: 'empty_vues' | 'keep_vues') => {
    return sources.map((s) => {
      const note = (s.note ?? '')
        .replace('[ACTE_MANQUANT]', '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      return {
        ...s,
        id: undefined,
        folio_page: mode === 'empty_vues' ? '' : s.folio_page,
        note,
      };
    });
  };

  return (
    <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
        <div>
          <h3 className='text-sm font-semibold text-slate-900'>Sources & références par dépôts</h3>
          <p className='mt-1 text-sm text-slate-600'>
            Dépôt + cote/registre + accès + vues/pages. (Les mêmes sources reviennent souvent sur
            une commune/année/type.)
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
            + Ajouter une source
          </button>
        </div>
      </div>

      {/* Presets bar */}
      {presetKey && (
        <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3'>
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <div className='text-sm font-medium text-slate-900'>Pré-remplissage automatique</div>

            <div className='flex flex-wrap items-center gap-2'>
              <button
                type='button'
                disabled={!presetExists}
                onClick={() => applyPreset({ keepVues: false, keepNotes: false })}
                className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'
                title='Applique les sources du preset et vide les vues/pages pour cet acte'
              >
                Appliquer preset (vues vides)
              </button>

              <button
                type='button'
                disabled={!presetExists}
                onClick={() => applyPreset({ keepVues: true, keepNotes: true })}
                className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'
                title='Applique les sources du preset mais conserve ce que tu as déjà saisi (vues + notes) sur l’acte courant'
              >
                Appliquer preset (garder saisie)
              </button>

              <button
                type='button'
                onClick={() => savePreset(toPresetSources('empty_vues'))}
                className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50'
                title='Enregistre les sources actuelles comme preset, mais vide les vues/pages (recommandé)'
              >
                Enregistrer preset (sans vues)
              </button>

              <button
                type='button'
                onClick={() => savePreset(toPresetSources('keep_vues'))}
                className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50'
                title='Enregistre les sources actuelles avec les vues/pages (moins recommandé)'
              >
                Enregistrer preset (avec vues)
              </button>

              <button
                type='button'
                disabled={!presetExists}
                onClick={() => clearPreset()}
                className='rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'
                title='Supprime le preset pour ce contexte'
              >
                Effacer preset
              </button>
            </div>
          </div>

          <p className='mt-2 text-xs text-slate-600'>
            Objectif : quand tu passes de l’acte 3 à l’acte 4, tu cliques{' '}
            <span className='font-medium'>Appliquer preset</span> et tu n’as plus qu’à renseigner
            les <span className='font-medium'>vues/pages</span> (et éventuellement cocher “acte
            manquant”).
          </p>
        </div>
      )}

      <div className='mt-4 space-y-3'>
        {loading && <div className='text-sm text-slate-600'>Chargement…</div>}

        {!loading &&
          sources.map((s, idx) => {
            const urlVisionneuse = (s.vue_image ?? '').trim();
            const vuesRaw = (s.folio_page ?? '').trim();
            const online = isOnline(s.support, urlVisionneuse);
            const missing = isMissingActe(s.note);

            return (
              <div
                key={s.id ?? idx}
                className='overflow-hidden rounded-xl border border-slate-200 bg-white'
              >
                <div className='flex flex-col gap-2 border-b border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between'>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <div className='text-sm font-semibold text-slate-900'>Source #{idx + 1}</div>

                      {s.depot_type && (
                        <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
                          {s.depot_type}
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

                      {vuesRaw && (
                        <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
                          {formatVueRangeLabel(vuesRaw) || vuesRaw}
                        </span>
                      )}
                    </div>

                    <div className='mt-1 truncate text-xs text-slate-600'>
                      {buildCompactTitle(s)}
                    </div>
                  </div>

                  <div className='flex flex-wrap items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => onDuplicate(idx)}
                      className='rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50'
                      title='Dupliquer uniquement dans cet acte'
                    >
                      Dupliquer
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
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
                    <div className='md:col-span-4'>
                      <label className='block text-xs font-medium text-slate-700'>Dépôt</label>
                      <select
                        value={s.depot_type}
                        onChange={(e) => onChange(idx, { depot_type: e.target.value })}
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      >
                        <option value=''></option>
                        <option>Mairie</option>
                        <option>Archives départementales</option>
                        <option>Archives du tribunal</option>
                        <option>ANOM</option>
                        <option>Autre</option>
                      </select>
                    </div>

                    <div className='md:col-span-8'>
                      <label className='block text-xs font-medium text-slate-700'>
                        Nom du dépôt
                      </label>
                      <input
                        type='text'
                        value={s.nom_depot}
                        onChange={(e) => onChange(idx, { nom_depot: e.target.value })}
                        placeholder='ex : Archives départementales de la Guadeloupe'
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      />
                    </div>

                    <div className='md:col-span-4'>
                      <label className='block text-xs font-medium text-slate-700'>Cote</label>
                      <input
                        type='text'
                        value={s.cote}
                        onChange={(e) => onChange(idx, { cote: e.target.value })}
                        placeholder='ex : 1E9_001'
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      />
                    </div>

                    <div className='md:col-span-8'>
                      <label className='block text-xs font-medium text-slate-700'>
                        Titre du registre
                      </label>
                      <input
                        type='text'
                        value={s.registre}
                        onChange={(e) => onChange(idx, { registre: e.target.value })}
                        placeholder='ex : 1841, 1848-1861, 1863-1867'
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      />
                    </div>

                    <div className='md:col-span-12'>
                      <label className='block text-xs font-medium text-slate-700'>
                        Chemin fonds / collection
                      </label>
                      <textarea
                        value={s.serie}
                        onChange={(e) => onChange(idx, { serie: e.target.value })}
                        placeholder='ex : État civil : collection des greffes des tribunaux > Deshaies > État civil de la population > Mariages'
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      />
                      <p className='mt-1 text-[11px] text-slate-500'>
                        (On utilise “Série” comme champ “chemin de classement”, car c’est ce qui
                        t’aide vraiment à retrouver.)
                      </p>
                    </div>

                    <div className='md:col-span-8'>
                      <label className='block text-xs font-medium text-slate-700'>
                        URL visionneuse
                      </label>
                      <input
                        type='url'
                        value={urlVisionneuse}
                        onChange={(e) => onChange(idx, { vue_image: normalizeUrl(e.target.value) })}
                        placeholder='ex : https://earchives... / http://anom...'
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      />
                      {urlVisionneuse ? (
                        <div className='mt-1'>
                          <a
                            href={normalizeUrl(urlVisionneuse)}
                            target='_blank'
                            rel='noreferrer'
                            className='text-xs font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500'
                          >
                            Ouvrir la visionneuse ↗
                          </a>
                        </div>
                      ) : (
                        <p className='mt-1 text-[11px] text-slate-500'>
                          Laisse vide si non numérisé / pas en ligne.
                        </p>
                      )}
                    </div>

                    <div className='md:col-span-4'>
                      <label className='block text-xs font-medium text-slate-700'>
                        Vues / pages
                      </label>
                      <input
                        type='text'
                        value={vuesRaw}
                        onChange={(e) => onChange(idx, { folio_page: e.target.value })}
                        placeholder='ex : 101-102'
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      />
                      <p className='mt-1 text-[11px] text-slate-500'>
                        Format conseillé : <span className='font-medium'>101-102</span> (affiché :{' '}
                        {formatVueRangeLabel(vuesRaw) || '—'}).
                      </p>
                    </div>

                    <div className='md:col-span-12'>
                      <div className='flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between'>
                        <label className='inline-flex items-center gap-2 text-sm text-slate-800'>
                          <input
                            type='checkbox'
                            checked={missing}
                            onChange={(e) => toggleMissingActe(idx, e.target.checked)}
                            className='h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-0'
                          />
                          Acte attendu mais manquant (lacune dans le registre)
                        </label>
                        <div className='text-xs text-slate-600'>
                          À cocher quand tu es <span className='font-medium'>au bon endroit</span>{' '}
                          mais l’acte n’est pas là.
                        </div>
                      </div>
                    </div>

                    <div className='md:col-span-12'>
                      <details className='group rounded-xl border border-slate-200 bg-white p-3'>
                        <summary className='cursor-pointer list-none text-sm font-medium text-slate-900'>
                          Détails avancés{' '}
                          <span className='text-slate-500'>
                            (support, langue, écriture, conservation)
                          </span>
                        </summary>

                        <div className='mt-3 grid grid-cols-1 gap-4 md:grid-cols-12'>
                          <div className='md:col-span-4'>
                            <label className='block text-xs font-medium text-slate-700'>
                              Support
                            </label>
                            <select
                              value={s.support}
                              onChange={(e) => onChange(idx, { support: e.target.value })}
                              className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                            >
                              <option value=''></option>
                              <option>Numérisé</option>
                              <option>Microfilm</option>
                              <option>Original papier</option>
                              <option>Copie</option>
                            </select>
                          </div>

                          <div className='md:col-span-4'>
                            <label className='block text-xs font-medium text-slate-700'>
                              Langue
                            </label>
                            <input
                              type='text'
                              value={s.langue}
                              onChange={(e) => onChange(idx, { langue: e.target.value })}
                              placeholder='ex : français'
                              className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                            />
                          </div>

                          <div className='md:col-span-4'>
                            <label className='block text-xs font-medium text-slate-700'>
                              Écriture
                            </label>
                            <select
                              value={s.ecriture}
                              onChange={(e) => onChange(idx, { ecriture: e.target.value })}
                              className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                            >
                              <option value=''></option>
                              <option>Manuscrite</option>
                              <option>Dactylographiée</option>
                              <option>Imprimée</option>
                              <option>Mixte</option>
                            </select>
                          </div>

                          <div className='md:col-span-12'>
                            <label className='block text-xs font-medium text-slate-700'>
                              État de conservation
                            </label>
                            <textarea
                              value={s.etat_conservation}
                              onChange={(e) => onChange(idx, { etat_conservation: e.target.value })}
                              placeholder='ex : encre pâle / page déchirée / marge illisible...'
                              className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                            ></textarea>
                          </div>
                        </div>
                      </details>
                    </div>

                    <div className='md:col-span-12'>
                      <label className='block text-xs font-medium text-slate-700'>Note</label>
                      <textarea
                        value={s.note}
                        onChange={(e) => onChange(idx, { note: e.target.value })}
                        placeholder='ex : registre consulté le … ; lacune confirmée ; particularités ; etc.'
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
