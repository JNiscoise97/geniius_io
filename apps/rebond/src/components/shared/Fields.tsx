import type { ReactNode } from "react";
import { Textarea } from '@/components/ui/textarea';

export function Field(props: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
  readonly?: boolean;
  empty?: ReactNode;
}) {
  const {
    label,
    value,
    children,
    readonly,
    empty = <span className='text-xs text-muted-foreground italic'>Non renseigné</span>,
  } = props;

  return (
    <div>
      <div className='text-xs font-medium text-slate-700'>{label}</div>
      <div className='mt-1'>
        {readonly ? (
          <div className='min-h-[36px] rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800'>
            {value ?? empty}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function ReadonlyBlock(props: {
  value?: ReactNode;
  empty?: ReactNode;
  className?: string;
}) {
  const {
    value,
    empty = <span className='text-xs text-muted-foreground italic'>Non renseigné</span>,
    className,
  } = props;

  const v = value == null || value === '' ? null : value;

  return (
    <div
      className={[
        'min-h-[36px] rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800',
        'whitespace-pre-wrap break-words',
        className ?? '',
      ].join(' ')}
    >
      {v ?? empty}
    </div>
  );
}

export function TextAreaField(props: {
  label: string;
  readonly?: boolean;
  value: string;
  onChange?: (next: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  empty?: ReactNode;
}) {
  const {
    label,
    readonly,
    value,
    onChange,
    placeholder,
    minHeightClassName = 'min-h-[90px]',
    empty,
  } = props;

  return (
    <div>
      <div className='text-xs font-medium text-slate-700'>{label}</div>
      <div className='mt-1'>
        {readonly ? (
          <ReadonlyBlock value={value} empty={empty} className={['py-2', minHeightClassName].join(' ')} />
        ) : (
          <Textarea
            className={minHeightClassName}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
          />
        )}
      </div>
    </div>
  );
}
