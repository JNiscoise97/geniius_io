// ReferenceSourcesCard/components/UnitsPanel.tsx
import type { UnitNode } from '../model/types';

type Props<TDraft> = {
  units: UnitNode<TDraft>[];
  activeUniteKey: string | null;
  onSelectUnit: (key: string) => void;
};

export function UnitsPanel<TDraft>(props: Props<TDraft>) {
  const { units, activeUniteKey, onSelectUnit } = props;

  return (
    <div className='rounded-2xl border border-slate-200 bg-white flex flex-col min-h-0'>
      <div className='shrink-0 border-b border-slate-200 bg-slate-50 p-4'>
        <div className='text-sm font-semibold text-slate-900'>Collections</div>
        <div className='mt-1 text-xs text-slate-600'>Sélectionne une collection</div>
      </div>

      <div className='flex-1 min-h-0 overflow-y-auto p-3 space-y-2' id="debug-scroll-4">
        {units.length === 0 ? (
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'>
            Aucune collection (ajoute une version d'archive pour commencer).
          </div>
        ) : (
          units.map((u) => {
            const active = u.key === activeUniteKey;

            return (
              <button
                key={u.key}
                type='button'
                onClick={() => onSelectUnit(u.key)}
                className={[
                  'w-full text-left rounded-xl border px-3 py-2 transition',
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white hover:bg-slate-50 border-slate-200',
                ].join(' ')}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <div className='text-sm font-semibold'>{u.label}</div>
                    <div
                      className={[
                        'mt-0.5 text-xs',
                        active ? 'text-white/80' : 'text-slate-500',
                      ].join(' ')}
                    >
                      {u.count} version{u.count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}