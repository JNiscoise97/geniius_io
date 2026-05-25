import { mainTabs } from '../data'
import type { MainTab } from '../types'

interface AppTabsProps {
  mainTab: MainTab
  setMainTab: (tab: MainTab) => void
}

export function AppTabs({ mainTab, setMainTab }: AppTabsProps) {
  return (
    <nav className="flex overflow-x-auto bg-white px-2 pt-2 shadow-sm">
      {mainTabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setMainTab(tab.key)}
          className={[
            'min-w-[120px] rounded-t-2xl border-x border-t border-slate-200 px-5 py-2 text-sm font-black transition',
            mainTab === tab.key
              ? 'bg-indigo-700 text-white shadow-lg shadow-indigo-700/20'
              : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}