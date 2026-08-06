import { HelpCircle, XCircle, CheckCircle2 } from 'lucide-react';

export type TriState = boolean | null | undefined;
type OptionKey = 'unknown' | 'no' | 'yes';

export type TriStateButtonProps = {
  label?: string;
  value: TriState;
  onChange: (v: TriState) => void;

  // NEW
  mode?: 'edit' | 'view'; // default 'edit'

  // Texte personnalisable
  unknownLabel?: string; // null
  noLabel?: string; // false
  yesLabel?: string; // true

  // Désactivation globale (en edit)
  disabled?: boolean;

  // Si tu veux un mode compact
  compact?: boolean;

  // Aide sous le label
  helpText?: string;

  // className wrapper
  className?: string;
};

function toKey(v: TriState): OptionKey {
  if (v === null) return 'unknown';
  return v ? 'yes' : 'no';
}

function fromKey(k: OptionKey): TriState {
  if (k === 'unknown') return null;
  return k === 'yes';
}

export function TriStateButton({
  label,
  value,
  onChange,
  mode = 'edit',
  unknownLabel = 'Non observé',
  noLabel = 'Absent',
  yesLabel = 'Présent',
  disabled = false,
  compact = false,
  helpText,
  className,
}: TriStateButtonProps) {
  const k = toKey(value);

  const baseBtn =
    'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors select-none';
  const wrap = 'inline-flex rounded-lg border border-slate-200 bg-white p-1';
  const size = compact ? '' : 'min-h-[36px]';

  const isView = mode === 'view';

  const commonBtn = [
    baseBtn,
    isView ? 'cursor-default pointer-events-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['space-y-1', className].filter(Boolean).join(' ')}>
      {label ? <div className='text-xs font-medium text-slate-700'>{label}</div> : null}

      {helpText ? <div className='text-[11px] text-slate-600'>{helpText}</div> : null}

      <div
        className={[
          wrap,
          size,
          !isView && disabled ? 'opacity-60 pointer-events-none' : '',
        ].join(' ')}
      >
        <button
          type='button'
          onClick={() => (!isView ? onChange(fromKey('unknown')) : undefined)}
          aria-pressed={k === 'unknown'}
          className={[
            commonBtn,
            k === 'unknown'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
            isView ? 'hover:bg-transparent hover:text-current' : '',
          ].join(' ')}
          title='Non observé / non renseigné'
        >
          <HelpCircle className='h-4 w-4' />
          {unknownLabel}
        </button>

        <button
          type='button'
          onClick={() => (!isView ? onChange(fromKey('no')) : undefined)}
          aria-pressed={k === 'no'}
          className={[
            commonBtn,
            k === 'no'
              ? 'bg-rose-50 text-rose-700'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
            isView ? 'hover:bg-transparent hover:text-current' : '',
          ].join(' ')}
          title='Absent'
        >
          <XCircle className='h-4 w-4' />
          {noLabel}
        </button>

        <button
          type='button'
          onClick={() => (!isView ? onChange(fromKey('yes')) : undefined)}
          aria-pressed={k === 'yes'}
          className={[
            commonBtn,
            k === 'yes'
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
            isView ? 'hover:bg-transparent hover:text-current' : '',
          ].join(' ')}
          title='Présent'
        >
          <CheckCircle2 className='h-4 w-4' />
          {yesLabel}
        </button>
      </div>
    </div>
  );
}