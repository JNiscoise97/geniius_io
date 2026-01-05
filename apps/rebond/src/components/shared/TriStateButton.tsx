import { HelpCircle, XCircle, CheckCircle2 } from 'lucide-react';

export type TriState = boolean | null | undefined;
type OptionKey = 'unknown' | 'no' | 'yes';

export type TriStateButtonProps = {
  label?: string;
  value: TriState;
  onChange: (v: TriState) => void;

  // Texte personnalisable
  unknownLabel?: string; // null
  noLabel?: string; // false
  yesLabel?: string; // true

  // Désactivation globale
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
  const wrap =
    'inline-flex rounded-lg border border-slate-200 bg-white p-1';

  const size = compact ? '' : 'min-h-[36px]';

  return (
    <div className={['space-y-1', className].filter(Boolean).join(' ')}>
      {label ? (
        <div className="text-xs font-medium text-slate-700">{label}</div>
      ) : null}

      {helpText ? (
        <div className="text-[11px] text-slate-600">{helpText}</div>
      ) : null}

      <div className={[wrap, size, disabled ? 'opacity-60 pointer-events-none' : ''].join(' ')}>
        <button
          type="button"
          onClick={() => onChange(fromKey('unknown'))}
          aria-pressed={k === 'unknown'}
          className={[
            baseBtn,
            k === 'unknown'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
          ].join(' ')}
          title="Non observé / non renseigné"
        >
          <HelpCircle className="h-4 w-4" />
          {unknownLabel}
        </button>

        <button
          type="button"
          onClick={() => onChange(fromKey('no'))}
          aria-pressed={k === 'no'}
          className={[
            baseBtn,
            k === 'no'
              ? 'bg-rose-50 text-rose-700'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
          ].join(' ')}
          title="Absent"
        >
          <XCircle className="h-4 w-4" />
          {noLabel}
        </button>

        <button
          type="button"
          onClick={() => onChange(fromKey('yes'))}
          aria-pressed={k === 'yes'}
          className={[
            baseBtn,
            k === 'yes'
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
          ].join(' ')}
          title="Présent"
        >
          <CheckCircle2 className="h-4 w-4" />
          {yesLabel}
        </button>
      </div>

      {/* petit hint visuel en dessous si tu veux */}
      <div className="text-[11px] text-slate-500">
        Valeur enregistrée :{' '}
        <span className="font-mono">
          {value === null ? 'null' : value ? 'true' : 'false'}
        </span>
      </div>
    </div>
  );
}
