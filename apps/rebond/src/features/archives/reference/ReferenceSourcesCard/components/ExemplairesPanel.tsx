// ReferenceSourcesCard/components/ExemplairesPanel.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { DraftKey, SelectedMeta } from '../model/types';

type Props<TDraft> = {
  loading: boolean;
  hasAnySelected: boolean;
  activeUniteKey: string | null;

  items: SelectedMeta<TDraft>[];
  selectedKey: DraftKey | null;

  getTitle: (c: TDraft, globalNo: number | null) => string;
  getStatus: (c: TDraft) => 'ok' | 'todo' | 'missing';

  renderChipOnline: (online: boolean) => React.ReactNode;
  renderStatusIcon: (status: 'ok' | 'todo' | 'missing') => React.ReactNode;

  getInstDepotOnline: (c: TDraft) => { inst: string; depot: string; online: boolean };

  onSelect: (draftKey: DraftKey) => void;
  onAdd?: () => void;
  readonly?: boolean;
};

export function ExemplairesPanel<TDraft>(props: Props<TDraft>) {
  const {
    loading,
    hasAnySelected,
    activeUniteKey,
    items,
    selectedKey,
    getTitle,
    getStatus,
    renderChipOnline,
    renderStatusIcon,
    getInstDepotOnline,
    onSelect,
    onAdd,
    readonly,
  } = props;

  const canAdd = !readonly && Boolean(onAdd);

  return (
    <div className='rounded-2xl border border-slate-200 bg-white flex flex-col min-h-0'>
      <div className='shrink-0 border-b border-slate-200 bg-slate-50 p-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <div className='text-sm font-semibold text-slate-900'>Exemplaires</div>
            <div className='mt-1 text-xs text-slate-600'>
              {activeUniteKey ? 'Liste des exemplaires de l’unité' : 'Sélectionne une unité'}
            </div>
          </div>

          {canAdd ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type='button' variant='ghost' size='icon' onClick={onAdd}>
                  <Plus className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Associer un exemplaire</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>

      <div className='flex-1 min-h-0 overflow-y-auto p-3' id="debug-scroll-3">
        {loading ? (
          <div className='text-sm text-slate-600'>Chargement…</div>
        ) : !hasAnySelected ? (
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'>
            Aucune référence sélectionnée.
            <div className='mt-2 text-xs text-slate-600'>
              Clique sur <span className='font-medium'>Associer un exemplaire</span> pour choisir un
              exemplaire.
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'>
            Aucun exemplaire dans cette unité.
            <div className='mt-2 text-xs text-slate-600'>
              Clique sur <span className='font-medium'>Associer un exemplaire</span> pour
              sélectionner un exemplaire.
            </div>
          </div>
        ) : (
          <div className='space-y-2'>
            {items.map(({ draftKey, c, globalNo }) => {
              const active = draftKey === selectedKey;

              const title = getTitle(c, globalNo ?? null);
              const status = getStatus(c);

              const { inst, depot, online } = getInstDepotOnline(c);

              return (
                <button
                  key={`ex-${draftKey}`}
                  type='button'
                  onClick={() => onSelect(draftKey)}
                  className={[
                    'w-full text-left rounded-lg border px-3 py-2 transition',
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 border-slate-200',
                  ].join(' ')}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='text-sm font-semibold truncate'>{title}</div>

                      <div
                        className={[
                          'mt-0.5 text-xs truncate',
                          active ? 'text-white/80' : 'text-slate-500',
                        ].join(' ')}
                      >
                        {inst}
                      </div>

                      <div
                        className={[
                          'mt-0.5 text-xs truncate flex items-center gap-2',
                          active ? 'text-white/80' : 'text-slate-500',
                        ].join(' ')}
                      >
                        <span className='truncate'>{depot}</span>
                        {renderChipOnline(online)}
                      </div>
                    </div>

                    <div className='shrink-0 pt-0.5'>{renderStatusIcon(status)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
