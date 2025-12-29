import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CitationDraft, ManifestationPick } from '@/features/archives/reference/types';

type SectionSourcesProps = {
  sources: CitationDraft[];
  loading: boolean;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, patch: Partial<CitationDraft>) => void;

  presetKey?: string;
  presetLabel?: string;
};

export function SectionSources({
  sources,
  loading,
  onAdd,
  onRemove,
  onChange,
  presetKey,
  presetLabel,
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
    const man = c.manifestation?.type_manifestation ? ` · ${c.manifestation.type_manifestation}` : '';

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
            onClick={() => {
              const nextIdx = sources.length;
              onAdd();
              requestAnimationFrame(() => requestAnimationFrame(() => scrollToIdx(nextIdx)));
            }}
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
                // ✅ FIX TS2322: callback ref must return void
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
                              Cote : <span className='font-medium'>{c.manifestation.unite_cote}</span>
                            </span>
                          ) : (
                            <span className='text-slate-500'>—</span>
                          )}
                          {c.manifestation?.pagination_type ? (
                            <span className='text-slate-500'> · Pagination : {c.manifestation.pagination_type}</span>
                          ) : null}
                        </div>

                        <details className='mt-2'>
                          <summary className='cursor-pointer select-none text-xs font-medium text-slate-700 hover:text-slate-900'>
                            Détails
                          </summary>
                          <div className='mt-2 space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700'>
                            <div>
                              <span className='text-slate-500'>Institution :</span>{' '}
                              <span className='font-medium'>{c.manifestation?.institution_nom ?? '—'}</span>
                            </div>
                            <div>
                              <span className='text-slate-500'>Dépôt :</span>{' '}
                              <span className='font-medium'>{c.manifestation?.depot_nom ?? '—'}</span>
                              {c.manifestation?.depot_type ? (
                                <span className='text-slate-500'> · {c.manifestation.depot_type}</span>
                              ) : null}
                            </div>
                            <div>
                              <span className='text-slate-500'>Manifestation :</span>{' '}
                              <span className='font-medium'>{c.manifestation?.type_manifestation ?? '—'}</span>
                              {c.manifestation?.pagination_type ? (
                                <span className='text-slate-500'> · pagination {c.manifestation.pagination_type}</span>
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
                      <label className='block text-xs font-medium text-slate-700'>Vues (structuré)</label>
                      <div className='mt-1 flex items-center gap-2'>
                        <input
                          inputMode='numeric'
                          value={c.vues_start ?? ''}
                          onChange={(e) => onChange(idx, { vues_start: toIntOrNull(e.target.value) })}
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
                      <label className='block text-xs font-medium text-slate-700'>Vues (brut)</label>
                      <input
                        type='text'
                        value={c.vues_raw ?? ''}
                        onChange={(e) => onChange(idx, { vues_raw: e.target.value })}
                        placeholder='ex : 101-102 / vue 101 / images 3 à 4'
                        className='mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400'
                      />
                    </div>

                    <div className='md:col-span-6'>
                      <label className='block text-xs font-medium text-slate-700'>Pages (structuré)</label>
                      <div className='mt-1 flex items-center gap-2'>
                        <input
                          inputMode='numeric'
                          value={c.page_start ?? ''}
                          onChange={(e) => onChange(idx, { page_start: toIntOrNull(e.target.value) })}
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
                          {formatRangeLabel(c.page_start ?? null, c.page_end ?? null, 'page') || '—'}
                        </span>
                      </div>
                    </div>

                    <div className='md:col-span-6'>
                      <label className='block text-xs font-medium text-slate-700'>Pages (brut)</label>
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

      {pickerOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
          <div className='w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'>
            <div className='border-b border-slate-200 bg-slate-50 p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <div className='text-sm font-semibold text-slate-900'>Choisir un registre / une manifestation</div>
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
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='text-sm font-semibold text-slate-900'>{g.unite_titre}</span>

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
