// ExemplairePickerDialog.tsx

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

import type { ExemplairePick } from '@/features/archives/reference/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Check, Search, Plus, ExternalLink, Globe, Archive, Film } from 'lucide-react';
import { SourceDialog, type SourceDialogMode } from '@/features/sources/SourceDialog';

type PickerMode = 'acte' | 'registre';

const PICK_SELECT =
  'exemplaire_id,nature_ref,nature_code,nature_label,support_ref,support_code,support_label,unite_id,unite_titre,cote_locale,' +
  'pagination_type_ref,pagination_type_code,pagination_type_label,nb_pages,identifiant_interne,localisation_interne,' +
  'depot_nom,depot_is_online,depot_is_physical,institution_nom,institution_sigle,' +
  'physical_condition_ref,physical_condition_code,physical_condition_label,' +
  'url_base,plateforme_code,source_exemplaire_id';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: PickerMode;
  registreId?: string | null;
  excludeExemplaireIds?: string[];
  onlyOnline: boolean;
  setOnlyOnline: (v: boolean) => void;
  q: string;
  setQ: (v: string) => void;
  onPick: (row: ExemplairePick) => void;
};

function normalizeRows(rows: any[]): ExemplairePick[] {
  return (rows ?? []).map((r) => ({
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
    identifiant_interne: r.identifiant_interne,
    localisation_interne: r.localisation_interne,
    depot_nom: r.depot_nom,
    depot_is_online: r.depot_is_online,
    depot_is_physical: r.depot_is_physical,
    institution_nom: r.institution_nom,
    institution_sigle: r.institution_sigle,
    url_base: r.url_base,
    plateforme_code: r.plateforme_code,
    source_exemplaire_id: r.source_exemplaire_id,
  }));
}

function isOnline(r: ExemplairePick) {
  return r.depot_is_online || Boolean((r.url_base ?? '').trim());
}

function natureLabel(code: string | null | undefined) {
  if (code === 'numerisation') return 'Numérisé';
  if (code === 'microfilm') return 'Microfilm';
  return 'Original';
}

function NatureBadge({ code }: { code: string | null | undefined }) {
  if (code === 'numerisation')
    return (
      <Badge className='border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 gap-1'>
        <Globe className='h-3 w-3' />
        Numérisé
      </Badge>
    );
  if (code === 'microfilm')
    return (
      <Badge className='border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-50 gap-1'>
        <Film className='h-3 w-3' />
        Microfilm
      </Badge>
    );
  return (
    <Badge className='border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50 gap-1'>
      <Archive className='h-3 w-3' />
      Original
    </Badge>
  );
}

function ExemplaireCard({
  row,
  selected,
  alreadyLinked,
  onSelect,
  onPick,
}: {
  row: ExemplairePick;
  selected: boolean;
  alreadyLinked: boolean;
  onSelect: () => void;
  onPick: () => void;
}) {
  const online = isOnline(row);
  const institution = row.institution_sigle || row.institution_nom || '—';
  const depot = row.depot_nom || '—';
  const collection = row.unite_titre || '—';
  const cote = row.cote_locale;

  return (
    <button
      type='button'
      onClick={onSelect}
      className={[
        'w-full rounded-xl border p-3 text-left transition-all',
        selected
          ? 'border-slate-900 bg-slate-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
        alreadyLinked ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          {/* Ligne 1: institution + nature */}
          <div className='flex flex-wrap items-center gap-2'>
            <NatureBadge code={row.nature_code} />
            {online && row.nature_code !== 'numerisation' && (
              <Badge className='border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50'>
                En ligne
              </Badge>
            )}
            {alreadyLinked && (
              <Badge variant='secondary' className='gap-1'>
                <Check className='h-3 w-3' />
                Déjà lié
              </Badge>
            )}
          </div>

          {/* Ligne 2: institution > dépôt */}
          <div className='mt-2 text-sm font-semibold text-slate-900 truncate'>
            {institution}
            <span className='font-normal text-slate-500'> · {depot}</span>
          </div>

          {/* Ligne 3: collection */}
          <div className='mt-0.5 text-xs text-slate-600 truncate'>{collection}</div>

          {/* Ligne 4: cote si disponible */}
          {cote && (
            <div className='mt-1 text-[11px] text-slate-500'>
              Cote : <span className='font-mono'>{cote}</span>
            </div>
          )}

          {/* URL si en ligne */}
          {row.url_base && selected && (
            <div className='mt-2 flex items-center gap-2'>
              <div className='text-[11px] text-slate-500 truncate font-mono'>{row.url_base}</div>
              <a
                href={row.url_base}
                target='_blank'
                rel='noreferrer'
                onClick={(e) => e.stopPropagation()}
                className='shrink-0 inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline'
              >
                <ExternalLink className='h-3 w-3' />
                Ouvrir
              </a>
            </div>
          )}
        </div>

        {/* Bouton choisir */}
        {!alreadyLinked && (
          <Button
            size='sm'
            variant={selected ? 'default' : 'outline'}
            onClick={(e) => {
              e.stopPropagation();
              onPick();
            }}
            className='shrink-0'
          >
            Choisir
          </Button>
        )}
      </div>
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className='text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2'>
      {children}
    </div>
  );
}

export function ExemplairePickerDialog({
  open,
  onOpenChange,
  type,
  registreId,
  excludeExemplaireIds = [],
  onlyOnline,
  setOnlyOnline,
  q,
  setQ,
  onPick,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registreRows, setRegistreRows] = useState<ExemplairePick[]>([]);
  const [searchRows, setSearchRows] = useState<ExemplairePick[]>([]);
  const [loadingRegistre, setLoadingRegistre] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modeCreate, setModeCreate] = useState<SourceDialogMode | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  const excludedSet = useMemo(() => new Set(excludeExemplaireIds), [excludeExemplaireIds.join(',')]);

  // Reset à l'ouverture
  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
  }, [open]);

  // Exemplaires du registre associé (acte uniquement)
  useEffect(() => {
    if (!open || type !== 'acte' || !registreId) {
      setRegistreRows([]);
      return;
    }

    let cancelled = false;
    setLoadingRegistre(true);

    (async () => {
      const { data: regCit } = await supabase
        .from('etat_civil_registre_citations')
        .select('exemplaire_id, sort_order')
        .eq('registre_id', registreId)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      const orderedIds = [...new Set((regCit ?? []).map((r: any) => r.exemplaire_id).filter(Boolean))] as string[];

      if (!orderedIds.length) {
        setRegistreRows([]);
        setLoadingRegistre(false);
        return;
      }

      let query = supabase.from('v_exemplaires_pick').select(PICK_SELECT).in('exemplaire_id', orderedIds);
      if (onlyOnline) query = query.or('depot_is_online.eq.true,url_base.not.is.null,url_base.neq.""');

      const { data } = await query.limit(100);
      if (cancelled) return;

      const rows = normalizeRows(data as any[]);
      const order = new Map(orderedIds.map((id, i) => [id, i]));
      rows.sort((a, b) => (order.get(a.exemplaire_id) ?? 9999) - (order.get(b.exemplaire_id) ?? 9999));

      setRegistreRows(rows);
      setLoadingRegistre(false);
    })();

    return () => { cancelled = true; };
  }, [open, type, registreId, onlyOnline, refreshKey]);

  // Recherche globale
  useEffect(() => {
    if (!open) return;

    const needle = q.trim();
    if (!needle) {
      setSearchRows([]);
      setLoadingSearch(false);
      return;
    }

    let cancelled = false;
    setLoadingSearch(true);

    (async () => {
      let query = supabase.from('v_exemplaires_pick').select(PICK_SELECT).limit(60).or(
        [
          `unite_titre.ilike.%${needle}%`,
          `cote_locale.ilike.%${needle}%`,
          `institution_nom.ilike.%${needle}%`,
          `institution_sigle.ilike.%${needle}%`,
          `depot_nom.ilike.%${needle}%`,
        ].join(','),
      );

      if (onlyOnline) query = query.or('depot_is_online.eq.true,url_base.not.is.null,url_base.neq.""');

      const { data } = await query
        .order('institution_sigle', { ascending: true })
        .order('depot_nom', { ascending: true })
        .order('unite_titre', { ascending: true });

      if (cancelled) return;
      setSearchRows(normalizeRows(data as any[]));
      setLoadingSearch(false);
    })();

    return () => { cancelled = true; };
  }, [open, q, onlyOnline, refreshKey]);

  // Résultats unifiés (registre d'abord, puis recherche, dédoublonnés)
  const registreIds = useMemo(() => new Set(registreRows.map((r) => r.exemplaire_id)), [registreRows]);
  const searchExtra = useMemo(
    () => searchRows.filter((r) => !registreIds.has(r.exemplaire_id)),
    [searchRows, registreIds],
  );

  const hasRegistreResults = registreRows.length > 0;
  const hasSearchResults = searchExtra.length > 0;
  const hasAnyResults = hasRegistreResults || hasSearchResults;
  const isLoading = loadingRegistre || loadingSearch;

  function handlePick(row: ExemplairePick) {
    onPick(row);
    onOpenChange(false);
  }

  function renderCard(row: ExemplairePick) {
    return (
      <ExemplaireCard
        key={row.exemplaire_id}
        row={row}
        selected={selectedId === row.exemplaire_id}
        alreadyLinked={excludedSet.has(row.exemplaire_id)}
        onSelect={() => setSelectedId(row.exemplaire_id)}
        onPick={() => handlePick(row)}
      />
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className='flex flex-col p-0 gap-0'
          style={{ width: '680px', maxWidth: '95vw', height: '85vh', maxHeight: '85vh' }}
        >
          {/* Header */}
          <DialogHeader className='px-5 pt-5 pb-3 border-b shrink-0'>
            <DialogTitle className='text-base font-semibold text-slate-900'>
              Où avez-vous trouvé cet acte ?
            </DialogTitle>
            <p className='text-xs text-slate-500 mt-0.5'>
              Sélectionnez la version d'archive que vous avez consultée.
            </p>

            {/* Barre de recherche */}
            <div className='mt-3 flex items-center gap-2'>
              <div className='relative flex-1'>
                <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder='ANOM, Deshaies, cote, dépôt…'
                  className='pl-8'
                  autoFocus
                />
              </div>
              <div className='flex items-center gap-2 shrink-0'>
                <Checkbox
                  id='onlyOnline'
                  checked={onlyOnline}
                  onCheckedChange={(v) => setOnlyOnline(Boolean(v))}
                />
                <label htmlFor='onlyOnline' className='text-sm text-slate-600 cursor-pointer'>
                  En ligne
                </label>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <ScrollArea className='flex-1 min-h-0'>
            <div className='px-5 py-4 space-y-4'>

              {/* Section: depuis ce registre */}
              {type === 'acte' && (
                <div>
                  <SectionTitle>Depuis ce registre</SectionTitle>
                  {loadingRegistre ? (
                    <div className='text-sm text-slate-500'>Chargement…</div>
                  ) : !registreId ? (
                    <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500'>
                      Aucun registre associé à cet acte.
                    </div>
                  ) : registreRows.length === 0 ? (
                    <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500'>
                      Ce registre n'a pas encore de version d'archive enregistrée.
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {registreRows.map(renderCard)}
                    </div>
                  )}
                </div>
              )}

              {/* Separator */}
              {type === 'acte' && hasSearchResults && <Separator />}

              {/* Section: résultats de recherche */}
              {q.trim() && (
                <div>
                  <SectionTitle>
                    {type === 'acte' ? 'Autres résultats' : 'Résultats'}
                  </SectionTitle>
                  {loadingSearch ? (
                    <div className='text-sm text-slate-500'>Recherche…</div>
                  ) : searchExtra.length === 0 ? (
                    <div className='rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500'>
                      Aucun résultat pour « {q} ».
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {searchExtra.map(renderCard)}
                    </div>
                  )}
                </div>
              )}

              {/* État vide global */}
              {!isLoading && !hasAnyResults && !q.trim() && type === 'registre' && (
                <div className='py-8 flex flex-col items-center text-center gap-2'>
                  <div className='text-sm font-medium text-slate-700'>Aucune version d'archive trouvée</div>
                  <div className='text-xs text-slate-500'>Lancez une recherche ou ajoutez un dépôt ci-dessous.</div>
                </div>
              )}

              {/* Indice si pas encore de recherche en mode acte et pas de résultats registre */}
              {!isLoading && !hasRegistreResults && !q.trim() && type === 'acte' && (
                <div className='py-4 text-center text-xs text-slate-500'>
                  Tapez pour rechercher dans toutes les archives.
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className='border-t px-5 py-3 shrink-0 flex items-center justify-between gap-3 bg-slate-50'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setModeCreate('create');
                setOpenCreate(true);
              }}
              className='text-slate-600 gap-2'
            >
              <Plus className='h-4 w-4' />
              Dépôt non listé
            </Button>

            <Button variant='outline' size='sm' onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SourceDialog
        open={openCreate}
        mode={modeCreate}
        onClose={() => {
          setOpenCreate(false);
          setModeCreate(null);
        }}
        onCreated={async () => {
          setOpenCreate(false);
          setModeCreate(null);
          setRefreshKey((k) => k + 1);
        }}
      />
    </>
  );
}
