import type { ElementType } from 'react'

export function MiniNav({
  label,
  icon: Icon,
}: {
  label: string
  icon: ElementType
}) {
  return (
    <button className="flex h-20 w-24 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-indigo-50 text-[11px] font-black text-indigo-800">
      <Icon size={24} className="mb-1" />
      {label}
    </button>
  )
}