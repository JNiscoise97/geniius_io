import type { Tone } from '../../types'

const toneClasses: Record<Tone, string> = {
  neutral: 'border-slate-200 bg-white text-slate-950',
  source: 'border-cyan-200 bg-cyan-50 text-cyan-950',
  hypothesis: 'border-amber-200 bg-amber-50 text-amber-950',
  selected: 'border-indigo-300 bg-indigo-50 text-indigo-950',
}

export function AncestorNode({
  title,
  subtitle,
  empty,
  className,
  tone,
}: {
  title: string
  subtitle?: string
  empty?: boolean
  className: string
  tone: Tone
}) {
  return (
    <div className={`absolute w-52 rounded-2xl border p-4 shadow-md ${toneClasses[tone]} ${className}`}>
      <p className={empty ? 'text-center text-sm font-semibold opacity-70' : 'font-black'}>
        {title}
      </p>

      {subtitle && <p className="mt-1 text-[12px] opacity-70">{subtitle}</p>}
    </div>
  )
}