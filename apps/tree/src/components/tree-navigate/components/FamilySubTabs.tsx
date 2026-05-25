import { familyViews } from '../data'
import type { FamilyView } from '../types'

interface FamilySubTabsProps {
  familyView: FamilyView
  setFamilyView: (view: FamilyView) => void
}

export function FamilySubTabs({ familyView, setFamilyView }: FamilySubTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2">
      {familyViews.map((view) => (
        <button
          key={view.key}
          onClick={() => setFamilyView(view.key)}
          className={[
            'rounded-full border px-4 py-1 text-[12px] font-black transition',
            familyView === view.key
              ? 'border-cyan-300 bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-cyan-50 hover:text-cyan-700',
          ].join(' ')}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}