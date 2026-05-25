import { ChevronDown } from 'lucide-react'

export function PanelTitle({ title }: { title: string }) {
  return (
    <div className="border-b border-slate-200 bg-indigo-50 px-3 py-1 text-[12px] font-black text-indigo-900">
      <ChevronDown size={12} className="inline" /> {title}
    </div>
  )
}