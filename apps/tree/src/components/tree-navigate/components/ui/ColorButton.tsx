import { Plus } from 'lucide-react'

export function ColorButton({ label }: { label: string }) {
  return (
    <div className="mx-auto mb-2 flex max-w-[170px] items-center justify-center rounded-full bg-indigo-700 px-4 py-2 text-sm font-black text-white shadow-md">
      {label}
      <Plus size={14} className="ml-2" />
    </div>
  )
}