import { individuViews } from '../data'
import type { IndividuView } from '../types'

interface IndividuSubTabsProps {
  individuView: IndividuView
  setIndividuView: (view: IndividuView) => void
}

export function IndividuSubTabs({ individuView, setIndividuView }: IndividuSubTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2">
      {individuViews.map((view) => (
        <button
          key={view.key}
          onClick={() => setIndividuView(view.key)}
          className={[
            'rounded-full border px-4 py-1 text-[12px] font-black transition',
            individuView === view.key
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
