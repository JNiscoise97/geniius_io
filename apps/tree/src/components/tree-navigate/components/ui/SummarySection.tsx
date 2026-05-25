import type { ReactNode } from 'react'

export function SummarySection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <details open className="border-b border-slate-200 px-3 py-2">
      <summary className="cursor-pointer font-black">{title}</summary>
      <div className="mt-2 space-y-1 text-[12px] leading-5">{children}</div>
    </details>
  )
}