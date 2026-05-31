import { documentsViews } from '../data'
import type { DocumentsView } from '../types'

interface DocumentsSubTabsProps {
  documentsView: DocumentsView
  setDocumentsView: (view: DocumentsView) => void
}

export function DocumentsSubTabs({ documentsView, setDocumentsView }: DocumentsSubTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2">
      {documentsViews.map((view) => (
        <button
          key={view.key}
          onClick={() => setDocumentsView(view.key)}
          className={[
            'rounded-full border px-4 py-1 text-[12px] font-black transition',
            documentsView === view.key
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