import type { Tone } from '../../types'

const toneClasses: Record<Tone, string> = {
  neutral: 'border-slate-200 bg-white text-slate-950',
  source: 'border-cyan-200 bg-cyan-50 text-cyan-950',
  hypothesis: 'border-amber-200 bg-amber-50 text-amber-950',
  selected: 'border-indigo-300 bg-indigo-50 text-indigo-950',
}

export function FamilyCard({
  label,
  subtitle,
  tag,
  empty,
  large,
  selected,
  tone,
}: {
  label: string
  subtitle?: string
  tag?: string
  empty?: boolean
  large?: boolean
  selected?: boolean
  tone: Tone
}) {
  return (
    <div
      className={[
        'rounded-2xl border p-4 text-center shadow-sm transition hover:shadow-md',
        toneClasses[tone],
        large ? 'min-h-[84px]' : 'min-h-[58px]',
        selected ? 'ring-2 ring-indigo-400 ring-offset-2' : '',
      ].join(' ')}
    >
      <p className={empty ? 'text-sm font-semibold opacity-70' : 'text-sm font-black'}>
        {label}
      </p>

      {subtitle && <p className="mt-1 truncate text-[12px] opacity-70">{subtitle}</p>}

      {tag && <p className="mt-2 text-right text-[11px] font-black opacity-80">{tag}</p>}
    </div>
  )
}