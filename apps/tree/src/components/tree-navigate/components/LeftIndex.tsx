import { ChevronRight } from 'lucide-react'
import { people } from '../data'
import { PanelTitle } from './ui/PanelTitle'

export function LeftIndex() {
  return (
    <aside className="hidden h-[calc(100vh-94px)] flex-col bg-white lg:flex">
      <PanelTitle title="Individus" />

      <div className="grid grid-cols-2 gap-1 border-b border-slate-200 p-2">
        <input className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[12px]" placeholder="Nom" />
        <input className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[12px]" placeholder="Prénoms" />
        <select className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[12px]">
          <option>Tous les sexes</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto px-2 py-1">
        {people.concat(people).map(([name, years, sex], index) => (
          <button
            key={`${name}-${index}`}
            className={[
              'flex w-full items-center gap-1.5 rounded-lg px-1.5 py-[4px] text-left hover:bg-indigo-50',
              name.includes('Pierre Gédéon') ? 'bg-indigo-50 text-indigo-900' : '',
            ].join(' ')}
          >
            <span className={sex === '♀' ? 'text-fuchsia-600' : 'text-blue-600'}>{sex}</span>
            <span className="min-w-0 flex-1 truncate text-[12px]">
              {name} <span className="text-slate-500">({years})</span>
            </span>
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </button>
        ))}
      </div>

      <div className="border-t border-slate-200 bg-slate-50">
        {['Résultats', 'Branches', 'Médias'].map((item) => (
          <div key={item} className="border-b border-slate-200 px-3 py-1 text-[12px] font-black text-slate-600">
            <ChevronRight size={12} className="inline" /> {item}
          </div>
        ))}
      </div>
    </aside>
  )
}