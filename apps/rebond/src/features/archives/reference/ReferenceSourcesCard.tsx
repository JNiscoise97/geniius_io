//ReferenceSourcesCard.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  ActeCitationDraft,
  RegistreCitationDraft,
  ManifestationPick,
} from '@/features/archives/reference/types';
import { Plus } from 'lucide-react';
import { ManifestationPickerDialog } from './ManifestationPickerDialog';
import { ListeChipsViewSmart } from '@/components/shared/ListeChipsViewSmart';
import {
  DictionnaireEditorPanel,
  type DictionnaireKind,
} from '@/components/shared/DictionnaireEditorPanel';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { TriStateButton } from '@/components/shared/TriStateButton';

type SectionMode = 'acte' | 'registre';
type AnyDraft = ActeCitationDraft | RegistreCitationDraft;

type SectionSourcesProps = {
  mode: SectionMode;

  registreId?: string | null;

  sources: AnyDraft[];
  loading: boolean;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, patch: Partial<AnyDraft>) => void;
};

export function SectionSources({
  mode,
  registreId,
  sources,
  loading,
  onAdd,
  onRemove,
  onChange,
}: SectionSourcesProps) {
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  const scrollToIdx = (idx: number) => {
    const el = itemRefs.current[idx];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHighlightIdx(idx);
    window.setTimeout(() => setHighlightIdx((cur) => (cur === idx ? null : cur)), 900);
  };

  const normalizeUrl = (url: string) => {
    const u = (url ?? '').trim();
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    return `https://${u}`;
  };

  const isOnline = (c: AnyDraft) => {
    const depotType = c.manifestation?.depot_type;
    const hasUrl = Boolean((c.manifestation?.url_base ?? '').trim());
    return depotType === 'en_ligne' || hasUrl;
  };

  const titleFor = (c: AnyDraft) => {
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

  const splitCsvToList = (v: string) => {
    return (v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const joinListToCsv = (arr: any) => {
    if (!Array.isArray(arr)) return '';
    return arr.filter(Boolean).join(', ');
  };

  const safeParseJsonArray = (text: string) => {
    const t = (text ?? '').trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return null; // invalid json
    }
  };

  const patchActe = (idx: number, patch: Partial<ActeCitationDraft>) => onChange(idx, patch);

  const patchRegistre = (idx: number, patch: Partial<RegistreCitationDraft>) =>
    onChange(idx, patch);

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

  // Ouvre sur une nouvelle référence : onAdd() puis on ouvre le picker dessus
  const openPickerForNew = () => {
    const nextIdx = sources.length;
    onAdd();
    // Attendre que la ligne soit rendue
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToIdx(nextIdx);
        setPickerTargetIdx(nextIdx);
        setPickerOpen(true);
      });
    });
  };

  const closePicker = () => {
    setPickerOpen(false);
    setPickerTargetIdx(null);
    setPickError(null);
  };

  // ---------------------------------------------------------------------------
  // Dictionnaire (document_form_ref / physical_condition_ref / repro_quality_ref)
  // ---------------------------------------------------------------------------
  const [dictOpen, setDictOpen] = useState(false);
  const [dictArgs, setDictArgs] = useState<{
    kind: DictionnaireKind;
    title: string;
    multi: boolean;
    defaultSelectedIds: string[];
    onValidate: (items: { id: string; code: string; label: string }[]) => Promise<void> | void;
  } | null>(null);

  const openDict = (args: {
    kind: DictionnaireKind;
    title: string;
    multi?: boolean;
    defaultSelectedIds?: string[];
    onValidate: (items: { id: string; code: string; label: string }[]) => Promise<void> | void;
  }) => {
    setDictArgs({
      kind: args.kind,
      title: args.title,
      multi: args.multi ?? false,
      defaultSelectedIds: args.defaultSelectedIds ?? [],
      onValidate: args.onValidate,
    });
    setDictOpen(true);
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
      if (!curHasUrl && candHasUrl) return cand;
      return cur;
    };

    const map = new Map<string, UniteGroup>();

    for (const r of pickRows) {
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

  const alreadyPickedManifestationIds = useMemo(() => {
    return sources.map((s) => s.manifestation_id).filter(Boolean) as string[];
  }, [sources]);

  const pick = (row: ManifestationPick) => {
    if (pickerTargetIdx == null) return;

    // Champs communs (Acte + Registre)
    const base = {
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

    if (mode === 'acte') {
      patchActe(pickerTargetIdx, {
        ...base,
        vues_start: null,
        vues_end: null,
        vues_raw: '',
        page_start: null,
        page_end: null,
        page_raw: '',
        acte_manquant: false,
      });
    } else {
      patchRegistre(pickerTargetIdx, {
        ...base,
        registre_manquant: false,
      });
    }

    closePicker();
  };

  const hasAnySelected = sources.some((s) => Boolean(s.manifestation_id));
  const selectedSources = sources
    .map((s, idx) => ({ s, idx }))
    .filter(({ s }) => Boolean(s.manifestation_id));

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
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <button
            type='button'
            onClick={openPickerForNew}
            className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50'
          >
            <Plus className='w-4 h-4' />
            Ajouter une référence
          </button>
        </div>
      </div>

      <div className='mt-4 space-y-3'>
        {loading && <div className='text-sm text-slate-600'>Chargement…</div>}

        {!loading && !hasAnySelected && (
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'>
            Aucune référence sélectionnée pour l’instant.
            <div className='mt-2 text-xs text-slate-600'>
              Clique sur <span className='font-medium'>“Ajouter une référence”</span> pour choisir
              le registre / l’unité documentaire.
            </div>
          </div>
        )}

        {!loading &&
          selectedSources.map(({ s: c, idx }, pos) => {
            const online = isOnline(c);
            const url = (c.manifestation?.url_base ?? '').trim();
            const missing =
              mode === 'acte'
                ? Boolean((c as ActeCitationDraft).acte_manquant)
                : Boolean((c as RegistreCitationDraft).registre_manquant);

            const vuesLabel =
              mode === 'acte'
                ? ((c as ActeCitationDraft).vues_raw ?? '').trim() ||
                formatRangeLabel(
                  (c as ActeCitationDraft).vues_start ?? null,
                  (c as ActeCitationDraft).vues_end ?? null,
                  'vue',
                )
                : '';

            const pagesLabel =
              mode === 'acte'
                ? ((c as ActeCitationDraft).page_raw ?? '').trim() ||
                formatRangeLabel(
                  (c as ActeCitationDraft).page_start ?? null,
                  (c as ActeCitationDraft).page_end ?? null,
                  'page',
                )
                : '';

            return (
              <div
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                key={c.id ?? idx}
                className={[
                  'overflow-hidden rounded-xl border border-slate-200 bg-white transition',
                  'scroll-mt-30',
                  highlightIdx === idx
                    ? 'ring-2 ring-slate-900/30 shadow-md animate-[pulse_0.8s_ease-out]'
                    : '',
                ].join(' ')}
              >
                <div className='flex flex-col gap-2 border-b border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between'>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <div className='text-sm font-semibold text-slate-900'>
                        Référence #{pos + 1}
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
                            checked={
                              mode === 'acte'
                                ? Boolean((c as ActeCitationDraft).acte_manquant)
                                : Boolean((c as RegistreCitationDraft).registre_manquant)
                            }
                            onChange={(e) => {
                              if (mode === 'acte') {
                                patchActe(idx, { acte_manquant: e.target.checked });
                              } else {
                                patchRegistre(idx, { registre_manquant: e.target.checked });
                              }
                            }}
                            className='h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-0'
                          />
                          {mode === 'acte'
                            ? 'Acte attendu mais manquant (lacune)'
                            : 'Registre attendu mais manquant (lacune)'}
                        </label>
                        <div className='text-xs text-slate-600'>
                          {mode === 'acte'
                            ? 'À cocher si tu es au bon endroit mais l’acte n’est pas présent.'
                            : 'À cocher si la référence est attendue mais introuvable (registre manquant, lacune, etc.).'}
                        </div>
                      </div>
                    </div>

                    {mode === 'acte' &&
                      (() => {
                        const a = c as ActeCitationDraft;

                        return (
                          <>
                            {/* Pagination consultée */}
                            <div className='md:col-span-12'>
                              <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                                <div className='text-sm font-semibold text-slate-900'>
                                  Pagination consultée
                                </div>
                                <p className='mt-1 text-xs text-slate-600'>
                                  Renseigne soit la pagination structurée (début/fin), soit une
                                  saisie brute si la logique est particulière (folios, images,
                                  etc.).
                                </p>

                                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
                                  {/* Vues structuré */}
                                  <div className='md:col-span-6'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Vues (structuré)
                                    </label>
                                    <div className='mt-1 flex items-center gap-2'>
                                      <input
                                        inputMode='numeric'
                                        value={a.vues_start ?? ''}
                                        onChange={(e) =>
                                          patchActe(idx, {
                                            vues_start: toIntOrNull(e.target.value),
                                          })
                                        }
                                        placeholder='début'
                                        className='w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                      />
                                      <span className='text-sm text-slate-500'>→</span>
                                      <input
                                        inputMode='numeric'
                                        value={a.vues_end ?? ''}
                                        onChange={(e) =>
                                          patchActe(idx, { vues_end: toIntOrNull(e.target.value) })
                                        }
                                        placeholder='fin'
                                        className='w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                      />
                                      <span className='text-xs text-slate-600'>
                                        {formatRangeLabel(
                                          a.vues_start ?? null,
                                          a.vues_end ?? null,
                                          'vue',
                                        ) || '—'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Vues brut */}
                                  <div className='md:col-span-6'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Vues (brut)
                                    </label>
                                    <input
                                      type='text'
                                      value={a.vues_raw ?? ''}
                                      onChange={(e) => patchActe(idx, { vues_raw: e.target.value })}
                                      placeholder='ex : 101-102 / vue 101 / images 3 à 4'
                                      className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                    />
                                  </div>

                                  {/* Pages structuré */}
                                  <div className='md:col-span-6'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Pages (structuré)
                                    </label>
                                    <div className='mt-1 flex items-center gap-2'>
                                      <input
                                        inputMode='numeric'
                                        value={a.page_start ?? ''}
                                        onChange={(e) =>
                                          patchActe(idx, {
                                            page_start: toIntOrNull(e.target.value),
                                          })
                                        }
                                        placeholder='début'
                                        className='w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                      />
                                      <span className='text-sm text-slate-500'>→</span>
                                      <input
                                        inputMode='numeric'
                                        value={a.page_end ?? ''}
                                        onChange={(e) =>
                                          patchActe(idx, { page_end: toIntOrNull(e.target.value) })
                                        }
                                        placeholder='fin'
                                        className='w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                      />
                                      <span className='text-xs text-slate-600'>
                                        {formatRangeLabel(
                                          a.page_start ?? null,
                                          a.page_end ?? null,
                                          'page',
                                        ) || '—'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Pages brut */}
                                  <div className='md:col-span-6'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Pages (brut)
                                    </label>
                                    <input
                                      type='text'
                                      value={a.page_raw ?? ''}
                                      onChange={(e) => patchActe(idx, { page_raw: e.target.value })}
                                      placeholder='ex : p. 12-13 / folio 8r-8v'
                                      className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Qualité / état du document */}
                            <div className='md:col-span-12'>
                              <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                                <div className='text-sm font-semibold text-slate-900'>
                                  Qualité / état du document
                                </div>
                                <p className='mt-1 text-xs text-slate-600'>
                                  Décris la nature (copie/extrait…), l’état matériel
                                  (trous/déchirures…) et la qualité de reproduction (flou/cadrage…).
                                </p>

                                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
                                  <div className='md:col-span-4'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Nature du document
                                    </label>

                                    <ListeChipsViewSmart
                                      titre='Nature du document'
                                      values={[
                                        a.document_form_label || a.document_form_ref || '—',
                                      ].filter((v) => v !== '—')}
                                      dense
                                      onEdit={() => {
                                        openDict({
                                          kind: 'ec_document_form_ref' as DictionnaireKind,
                                          title: 'Nature du document',
                                          multi: false,
                                          defaultSelectedIds: a.document_form_ref
                                            ? [a.document_form_ref]
                                            : [],
                                          onValidate: async (items) => {
                                            const it = items?.[0];
                                            patchActe(idx, {
                                              document_form_ref: it?.id ?? null,
                                              document_form_label: it?.label ?? null,
                                            });
                                            setDictOpen(false);
                                          },
                                        });
                                      }}
                                      onDelete={() =>
                                        patchActe(idx, {
                                          document_form_ref: null,
                                          document_form_label: null,
                                        })
                                      }
                                    />
                                  </div>

                                  <div className='md:col-span-8'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Détails (nature)
                                    </label>
                                    <input
                                      type='text'
                                      value={a.document_form_details ?? ''}
                                      onChange={(e) =>
                                        patchActe(idx, { document_form_details: e.target.value })
                                      }
                                      placeholder='ex: copie envoyée ailleurs ; duplicata ; extrait pour dossier…'
                                      className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                    />
                                  </div>

                                  <div className='md:col-span-4'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      État matériel
                                    </label>
                                    <ListeChipsViewSmart
                                      titre='État matériel'
                                      values={[
                                        a.physical_condition_label ||
                                        a.physical_condition_ref ||
                                        '—',
                                      ].filter((v) => v !== '—')}
                                      dense
                                      onEdit={() => {
                                        openDict({
                                          kind: 'ec_physical_condition_ref' as DictionnaireKind,
                                          title: 'État matériel',
                                          multi: false,
                                          defaultSelectedIds: a.physical_condition_ref
                                            ? [a.physical_condition_ref]
                                            : [],
                                          onValidate: async (items) => {
                                            const it = items?.[0];
                                            patchActe(idx, {
                                              physical_condition_ref: it?.id ?? null,
                                              physical_condition_label: it?.label ?? null,
                                            });
                                            setDictOpen(false);
                                          },
                                        });
                                      }}
                                      onDelete={() =>
                                        patchActe(idx, {
                                          physical_condition_ref: null,
                                          physical_condition_label: null,
                                        })
                                      }
                                    />
                                  </div>

                                  <div className='md:col-span-8'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Dommages (liste, séparée par des virgules)
                                    </label>
                                    <input
                                      type='text'
                                      value={joinListToCsv(a.damage_kinds)}
                                      onChange={(e) =>
                                        patchActe(idx, {
                                          damage_kinds: splitCsvToList(e.target.value),
                                        })
                                      }
                                      placeholder='ex: holes, torn, stains, faded, water_damage…'
                                      className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                    />
                                  </div>

                                  <div className='md:col-span-12'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Notes (dommages)
                                    </label>
                                    <textarea
                                      value={a.damage_notes ?? ''}
                                      onChange={(e) =>
                                        patchActe(idx, { damage_notes: e.target.value })
                                      }
                                      placeholder='ex: trou au centre qui masque les âges ; marge gauche déchirée…'
                                      className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                    />
                                  </div>

                                  <div className='md:col-span-4'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Qualité de reproduction
                                    </label>
                                    <ListeChipsViewSmart
                                      titre='Qualité de reproduction'
                                      values={[
                                        a.repro_quality_label || a.repro_quality_ref || '—',
                                      ].filter((v) => v !== '—')}
                                      dense
                                      onEdit={() => {
                                        openDict({
                                          kind: 'ec_repro_quality_ref' as DictionnaireKind,
                                          title: 'Qualité de reproduction',
                                          multi: false,
                                          defaultSelectedIds: a.repro_quality_ref
                                            ? [a.repro_quality_ref]
                                            : [],
                                          onValidate: async (items) => {
                                            const it = items?.[0];
                                            patchActe(idx, {
                                              repro_quality_ref: it?.id ?? null,
                                              repro_quality_label: it?.label ?? null,
                                            });
                                            setDictOpen(false);
                                          },
                                        });
                                      }}
                                      onDelete={() =>
                                        patchActe(idx, {
                                          repro_quality_ref: null,
                                          repro_quality_label: null,
                                        })
                                      }
                                    />
                                  </div>

                                  <div className='md:col-span-8'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Défauts de repro (liste, séparée par des virgules)
                                    </label>
                                    <input
                                      type='text'
                                      value={joinListToCsv(a.repro_issues)}
                                      onChange={(e) =>
                                        patchActe(idx, {
                                          repro_issues: splitCsvToList(e.target.value),
                                        })
                                      }
                                      placeholder='ex: blur, cropped, low_resolution, skewed…'
                                      className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                    />
                                  </div>

                                  <div className='md:col-span-12'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Notes (reproduction)
                                    </label>
                                    <textarea
                                      value={a.repro_notes ?? ''}
                                      onChange={(e) =>
                                        patchActe(idx, { repro_notes: e.target.value })
                                      }
                                      placeholder='ex: cadrage coupe la marge ; flou sur signatures ; contraste trop fort…'
                                      className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                    />
                                  </div>

                                  <div className='md:col-span-12'>
                                    <div className='flex items-center justify-between gap-3'>
                                      <label className='block text-xs font-medium text-slate-700'>
                                        Plages manquantes (JSON array)
                                      </label>
                                      <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700'>
                                        optionnel
                                      </span>
                                    </div>

                                    {/* Edition en JSON pour commencer (simple et robuste) */}
                                    <textarea
                                      value={JSON.stringify(a.missing_ranges ?? [], null, 2)}
                                      onChange={(e) => {
                                        const parsed = safeParseJsonArray(e.target.value);
                                        // parsed === null => JSON invalide -> on ne met pas à jour
                                        if (parsed !== null)
                                          patchActe(idx, { missing_ranges: parsed });
                                      }}
                                      placeholder='ex: [{"type":"vues","from":12,"to":14,"kind":"missing","reason":"cropped"}]'
                                      className='mt-1 w-full font-mono rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none focus:border-slate-400'
                                      rows={6}
                                    />
                                    <p className='mt-1 text-[11px] text-slate-600'>
                                      Astuce : si le JSON est invalide, la valeur n’est pas
                                      appliquée (pour éviter de casser la sauvegarde).
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Marques / signes sur l’acte */}
                            <div className='md:col-span-12'>
                              <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                                <div className='text-sm font-semibold text-slate-900'>
                                  Marques & signes
                                </div>
                                <p className='mt-1 text-xs text-slate-600'>
                                  Informations rapides sur ce que tu observes sur la page : mentions
                                  marginales, signatures, marques en marge.
                                </p>

                                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
                                  {/* Mentions marginales (sur la page) */}
                                  <div className='md:col-span-6'>
                                    <TriStateButton
                                      label="Mentions marginales"
                                      value={a.marginal_mentions_present}
                                      onChange={(v) => {
                                        patchActe(idx, {
                                          marginal_mentions_present: v,
                                          // si on passe à false ou null, on efface le count
                                          marginal_mentions_count: v === true ? (a.marginal_mentions_count ?? null) : null,
                                        });
                                      }}
                                      helpText="Présent / absent / non observé."
                                    />
                                  </div>

                                  <div className='md:col-span-6'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Nombre de mentions marginales
                                    </label>
                                    <input
                                      inputMode='numeric'
                                      value={a.marginal_mentions_count ?? ''}
                                      onChange={(e) =>
                                        patchActe(idx, {
                                          marginal_mentions_count: toIntOrNull(e.target.value),
                                        } as any)
                                      }
                                      disabled={!Boolean(a.marginal_mentions_present)}
                                      placeholder='ex: 3'
                                      className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500'
                                    />
                                  </div>

                                  {/* Signatures */}
                                  <div className='md:col-span-6'>
                                    <TriStateButton
                                      label="Signatures"
                                      value={a.signatures_present}
                                      onChange={(v) => {
                                        patchActe(idx, {
                                          signatures_present: v,
                                          // si on passe à false ou null, on efface le count
                                          signatures_count: v === true ? (a.signatures_count ?? null) : null,
                                        });
                                      }}
                                      helpText="Présent / absent / non observé."
                                    />
                                  </div>

                                  <div className='md:col-span-6'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Nombre de signatures
                                    </label>
                                    <input
                                      inputMode='numeric'
                                      value={a.signatures_count ?? ''}
                                      onChange={(e) =>
                                        patchActe(idx, {
                                          signatures_count: toIntOrNull(e.target.value),
                                        } as any)
                                      }
                                      disabled={!Boolean(a.signatures_present)}
                                      placeholder='ex: 3'
                                      className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500'
                                    />
                                  </div>

                                  {/* Mots rayés indiqués en marge */}
                                  <div className='md:col-span-6'>
                                    <TriStateButton
                                      label="Mots rayés indiqués en marge"
                                      value={a.marginal_crossouts_present}
                                      onChange={(v) => {
                                        patchActe(idx, {
                                          marginal_crossouts_present: v,
                                          // si on passe à false ou null, on efface le count
                                          marginal_crossouts_count: v === true ? (a.marginal_crossouts_count ?? null) : null,
                                        });
                                      }}
                                      helpText="Présent / absent / non observé."
                                    />

                                    {/* NOTE : à distinguer des rayures dans le texte */}
                                    <p className='mt-1 text-[11px] text-slate-600'>
                                      {/* À distinguer des rayures incluses dans le texte (corrections dans le corps de l’acte). */}
                                      À distinguer des rayures incluses dans le texte (corrections
                                      dans le corps de l’acte).
                                    </p>
                                  </div>

                                  <div className='md:col-span-6'>
                                    <label className='block text-xs font-medium text-slate-700'>
                                      Nombre (en marge)
                                    </label>
                                    <input
                                      inputMode='numeric'
                                      value={a.marginal_crossouts_count ?? ''}
                                      onChange={(e) =>
                                        patchActe(idx, {
                                          marginal_crossouts_count: toIntOrNull(e.target.value),
                                        } as any)
                                      }
                                      disabled={!Boolean(a.marginal_crossouts_present)}
                                      placeholder='ex: 1'
                                      className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500'
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}

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

      <ManifestationPickerDialog
        open={pickerOpen}
        onOpenChange={(v) => {
          setPickerOpen(v);
          if (!v) closePicker();
        }}
        mode='acte'
        registreId={mode === 'acte' ? (registreId ?? null) : null}
        excludeManifestationIds={alreadyPickedManifestationIds}
        onlyOnline={onlyOnline}
        setOnlyOnline={setOnlyOnline}
        q={q}
        setQ={setQ}
        onPick={(row) => pick(row)}
      />

      {/* DRAWER dictionnaire */}
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
    </section>
  );
}
