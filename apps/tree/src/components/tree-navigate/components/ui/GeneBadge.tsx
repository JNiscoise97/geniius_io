import type { ReactNode } from 'react'

export function GeneBadge({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'good' | 'warn' | 'info'
}) {
  return (
    <span
      className={[
        'rounded-full px-3 py-1 text-[11px] font-black',
        tone === 'good' ? 'bg-cyan-100 text-cyan-800' : '',
        tone === 'warn' ? 'bg-amber-100 text-amber-800' : '',
        tone === 'info' ? 'bg-indigo-100 text-indigo-800' : '',
      ].join(' ')}
    >
      {children}
    </span>
  )
}