import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ManifestationPick } from '@/features/archives/reference/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type PickerMode = 'acte' | 'registre';
type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  mode: PickerMode;

  // “registre associé” : on part des citations du registre
  registreId?: string | null;

  // pour exclure les manifestations déjà liées à l’acte
  excludeManifestationIds?: string[];

  onlyOnline: boolean;
  setOnlyOnline: (v: boolean) => void;

  q: string;
  setQ: (v: string) => void;

  onPick: (row: ManifestationPick) => void;
};

export function ManifestationPickerDialog({
  open,
  onOpenChange,
  mode = "registre",
  registreId,
  excludeManifestationIds = [],
  onlyOnline,
  setOnlyOnline,
  q,
  setQ,
  onPick,
}: Props) {
  const [loadingRegistre, setLoadingRegistre] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errRegistre, setErrRegistre] = useState<string | null>(null);
  const [errSearch, setErrSearch] = useState<string | null>(null);

  const [registreRows, setRegistreRows] = useState<ManifestationPick[]>([]);
  const [searchRows, setSearchRows] = useState<ManifestationPick[]>([]);

  const shouldOpenSearch = q.trim().length > 0;

  const isExcluded = (mId: string) => excludeManifestationIds.includes(mId);

  const normalizeRows = (rows: any[]): ManifestationPick[] =>
    (rows ?? []).map((r) => ({
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

  const hasQuery = q.trim().length > 0;
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // auto-open si q non vide
    if (hasQuery) setSearchOpen(true);
  }, [open, hasQuery]);

  // --- Section 1 : manifestations du registre associé (unite_id) --------------
  useEffect(() => {
    if (!open) return;

    // ✅ en mode registre : pas de section 1, pas de fetch
    if (mode !== 'acte') {
      setRegistreRows([]);
      setErrRegistre(null);
      setLoadingRegistre(false);
      return;
    }

    if (!registreId) {
      setRegistreRows([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingRegistre(true);
      setErrRegistre(null);

      // 1) manifestations liées au registre
      const { data: regCit, error: regErr } = await supabase
        .from('etat_civil_registre_citations')
        .select('manifestation_id')
        .eq('registre_id', registreId)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (regErr) {
        setErrRegistre(regErr.message);
        setRegistreRows([]);
        setLoadingRegistre(false);
        return;
      }

      const regManIds = Array.from(
        new Set((regCit ?? []).map((r: any) => r.manifestation_id).filter(Boolean)),
      ) as string[];

      // 2) exclure ce qui est déjà pris par l’acte
      const filteredIds = regManIds.filter((id) => !excludeManifestationIds.includes(id));

      if (!filteredIds.length) {
        setRegistreRows([]);
        setLoadingRegistre(false);
        return;
      }

      // 3) enrich via la view
      let query = supabase
        .from('v_manifestations_pick')
        .select(
          'manifestation_id,type_manifestation,unite_id,unite_titre,unite_cote,pagination_type,depot_nom,depot_type,institution_nom,institution_sigle,url_base,plateforme_code',
        )
        .in('manifestation_id', filteredIds)
        .limit(200);

      if (onlyOnline) {
        query = query.or('depot_type.eq.en_ligne,url_base.not.is.null');
      }

      const { data: pickData, error: pickErr } = await query;

      if (cancelled) return;

      if (pickErr) {
        setErrRegistre(pickErr.message);
        setRegistreRows([]);
        setLoadingRegistre(false);
        return;
      }

      const rows = normalizeRows(pickData as any[]);

      // ✅ garde l’ordre du registre (sort_order) autant que possible
      const order = new Map(filteredIds.map((id, i) => [id, i]));
      rows.sort(
        (a, b) => (order.get(a.manifestation_id) ?? 9999) - (order.get(b.manifestation_id) ?? 9999),
      );

      setRegistreRows(rows);
      setLoadingRegistre(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, registreId, onlyOnline, excludeManifestationIds.join(',')]);

  // --- Section 2 : recherche globale (repliée tant que q vide) ----------------
  useEffect(() => {
    if (!open) return;

    const needle = q.trim();

    // ✅ Repliée + pas de requête tant que q vide
    if (!needle) {
      setSearchRows([]);
      setErrSearch(null);
      setLoadingSearch(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingSearch(true);
      setErrSearch(null);

      let query = supabase
        .from('v_manifestations_pick')
        .select(
          'manifestation_id,type_manifestation,unite_id,unite_titre,unite_cote,pagination_type,depot_nom,depot_type,institution_nom,institution_sigle,url_base,plateforme_code',
        )
        .order('institution_sigle', { ascending: true })
        .order('unite_titre', { ascending: true })
        .limit(50);

      // ✅ seulement si needle non vide
      query = query.or(
        [
          `unite_titre.ilike.%${needle}%`,
          `unite_cote.ilike.%${needle}%`,
          `institution_nom.ilike.%${needle}%`,
          `institution_sigle.ilike.%${needle}%`,
          `depot_nom.ilike.%${needle}%`,
        ].join(','),
      );

      if (onlyOnline) {
        query = query.or('depot_type.eq.en_ligne,url_base.not.is.null');
      }

      // ✅ Supabase attend des valeurs QUOTÉES dans le IN()
      if (excludeManifestationIds.length) {
        const quoted = excludeManifestationIds.map((id) => `"${id}"`).join(',');
        query = query.not('manifestation_id', 'in', `(${quoted})`);
      }

      const { data, error } = await query;
      if (cancelled) return;

      if (error) {
        setErrSearch(error.message);
        setSearchRows([]);
      } else {
        setSearchRows(normalizeRows(data as any[]));
      }

      setLoadingSearch(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, q, onlyOnline, excludeManifestationIds.join(',')]);

  const Row = ({ r }: { r: ManifestationPick }) => {
    const online = r.depot_type === 'en_ligne' || Boolean((r.url_base ?? '').trim());
    const disabled = isExcluded(r.manifestation_id);

    return (
      <button
        type='button'
        disabled={disabled}
        onClick={() => onPick(r)}
        className={[
          'w-full rounded-xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-semibold text-slate-900'>{r.unite_titre}</span>

          {r.institution_sigle && (
            <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
              {r.institution_sigle}
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

          {r.type_manifestation && (
            <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
              {r.type_manifestation}
            </span>
          )}

          {r.pagination_type && (
            <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700'>
              pagination: {r.pagination_type}
            </span>
          )}
        </div>

        <div className='mt-1 text-xs text-slate-600'>
          {r.institution_nom} · {r.depot_nom}
          {r.unite_cote ? ` · ${r.unite_cote}` : ''}
        </div>

        {r.url_base ? (
          <div className='mt-2 text-[11px] text-slate-500 break-all'>
            URL: <span className='font-mono'>{r.url_base}</span>
          </div>
        ) : null}
      </button>
    );
  };

  const registreTitle = registreId
    ? 'Sources du registre associé'
    : 'Sources du registre associé (aucun registre)';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl p-0'>
        <DialogHeader className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
          <DialogTitle className='text-sm font-semibold text-slate-900'>
            Choisir une source / manifestation
          </DialogTitle>

          <div className='mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div className='text-xs text-slate-600'>
              Section 1: registre associé · Section 2: recherche globale (repliée si vide)
            </div>

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
        </DialogHeader>

        {/* BODY scrollable */}
        <div className='max-h-[75vh] overflow-y-auto px-4 py-4 space-y-4'>
          {/* SECTION 1 */}
          {mode === 'acte' && (<div className='rounded-2xl border border-slate-200 bg-white'>
            <div className='border-b border-slate-200 bg-slate-50 px-4 py-3'>
              <div className='text-sm font-semibold text-slate-900'>{registreTitle}</div>
              <div className='mt-1 text-xs text-slate-600'>
                Affiche uniquement les sources du registre (unité) et exclut celles déjà ajoutées à
                l’acte.
              </div>
            </div>

            <div className='p-4'>
              {loadingRegistre && <div className='text-sm text-slate-600'>Chargement…</div>}
              {errRegistre && (
                <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
                  {errRegistre}
                </div>
              )}

              {!loadingRegistre && !errRegistre && registreRows.length === 0 && (
                <div className='text-sm text-slate-600'>
                  Aucune source disponible pour ce registre (ou tout est déjà utilisé).
                </div>
              )}

              {!loadingRegistre && !errRegistre && registreRows.length > 0 && (
                <div className='space-y-2'>
                  {registreRows.map((r) => (
                    <Row key={r.manifestation_id} r={r} />
                  ))}
                </div>
              )}
            </div>
          </div>)}

          {/* SECTION 2 (repliée tant que q vide) */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
  <button
    type="button"
    onClick={() => setSearchOpen((v) => !v)}
    className="w-full text-left border-b border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100"
  >
    <div className="text-sm font-semibold text-slate-900">Rechercher une autre source</div>
    <div className="mt-1 text-xs text-slate-600">
      {searchOpen ? 'Recherche.' : 'Repliée.'}{' '}
      {!hasQuery ? 'Tape un terme pour afficher des résultats.' : null}
    </div>
  </button>

  <div className="p-4 space-y-3">
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="ex: Deshaies 1859 mariages / CAOM EC / ANOM…"
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
    />

    {/* Résultats uniquement si open + query */}
    {searchOpen && hasQuery && (
      <>
        {loadingSearch && <div className="text-sm text-slate-600">Recherche…</div>}

        {errSearch && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errSearch}
            <div className="mt-1 text-xs text-red-700">
              Astuce : crée la vue <span className="font-mono">v_manifestations_pick</span>.
            </div>
          </div>
        )}

        {!loadingSearch && !errSearch && searchRows.length === 0 && (
          <div className="text-sm text-slate-600">Aucun résultat.</div>
        )}

        {!loadingSearch && !errSearch && searchRows.length > 0 && (
          <div className="space-y-2">
            {searchRows.map((r) => (
              <Row key={r.manifestation_id} r={r} />
            ))}
          </div>
        )}
      </>
    )}

    {/* Petit hint quand replié */}
    {searchOpen && !hasQuery && (
      <div className="text-sm text-slate-600">Saisis un terme pour lancer la recherche.</div>
    )}
  </div>
</div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
