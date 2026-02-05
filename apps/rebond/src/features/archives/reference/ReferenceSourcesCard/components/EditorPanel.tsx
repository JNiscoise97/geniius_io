// ReferenceSourcesCard/components/EditorPanel.tsx
import type { JSX } from 'react';
import type { DraftKey, SelectedMeta } from '../model/types';

import { Button } from '@/components/ui/button';

type Props<TDraft> = {
  type: 'acte' | 'registre';
  selectedMeta: SelectedMeta<TDraft> | null;

  idx: number;

  hasExemplaireId: (c: TDraft) => boolean;
  onOpenPickerForIdx: (idx: number) => void;

  renderActe: (args: {
    c: TDraft;
    idx: number;
    draftKey: DraftKey;
    globalNo: number | null;
  }) => JSX.Element;

  renderRegistre: (args: {
    c: TDraft;
    idx: number;
    draftKey: DraftKey;
    globalNo: number | null;
  }) => JSX.Element;
};

/**
 * Shell utilisé uniquement pour les états "vides".
 * Ici, on peut scroller au niveau du panel car il n’y a pas de header interne à fixer.
 */
function EmptyShell(props: { title?: string; subtitle?: string; children: JSX.Element }) {
  const { title = 'Édition', subtitle, children } = props;

  return (
    <div className='rounded-2xl border border-slate-200 bg-white flex flex-col min-h-0 overflow-hidden'>
      <div className='shrink-0 border-b border-slate-200 bg-slate-50 p-4'>
        <div className='min-w-0'>
          <div className='text-sm font-semibold text-slate-900'>{title}</div>
          {subtitle ? <div className='mt-1 text-xs text-slate-600'>{subtitle}</div> : null}
        </div>
      </div>

      {/* scroll autorisé uniquement sur les empty states */}
      <div className='flex-1 min-h-0 overflow-y-auto'>{children}</div>
    </div>
  );
}

export function EditorPanel<TDraft>(props: Props<TDraft>) {
  const { type, selectedMeta, idx, hasExemplaireId, onOpenPickerForIdx, renderActe, renderRegistre } =
    props;

  // ------------------------------------------------------------
  // Empty state: nothing selected
  // ------------------------------------------------------------
  if (!selectedMeta) {
    return (
        <EmptyShell subtitle='Sélection incomplète.'>

        <div className='p-4'>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'>
            Rien à éditer pour le moment.
            <div className='mt-2 text-xs text-slate-600'>
              Ajoute un exemplaire via le bouton <span className='font-medium'>+</span> dans la
              colonne “Exemplaires”.
            </div>
          </div>
        </div>
      </EmptyShell>
    );
  }

  const { c, globalNo, draftKey } = selectedMeta;

  // ------------------------------------------------------------
  // Selected but missing exemplaire
  // ------------------------------------------------------------
  if (!hasExemplaireId(c)) {
    return (
        <EmptyShell subtitle='Sélectionne une unité avec au moins un exemplaire.'>

        <div className='p-4'>
          <div className='rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'>
            Cet item n’a pas d’exemplaire associé.
            <div className='mt-3'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => onOpenPickerForIdx(idx)}
              >
                Associer un exemplaire
              </Button>
            </div>
          </div>
        </div>
      </EmptyShell>
    );
  }

  // ------------------------------------------------------------
  // Normal state
  // IMPORTANT:
  // - EditorPanel NE SCROLLE PAS.
  // - Il contraint la hauteur et met overflow-hidden.
  // - Le scroll doit être dans renderActeForm / renderRegistreForm (flex-1 min-h-0 overflow-y-auto).
  // ------------------------------------------------------------
  const content =
    type === 'acte'
      ? renderActe({ c, idx, draftKey, globalNo })
      : renderRegistre({ c, idx, draftKey, globalNo });

  return (
      <div className='flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col'>{content}</div>
  );
}
