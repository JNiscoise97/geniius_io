import { useState } from 'react'
import { Search } from 'lucide-react'

// Extracted from TreeStatsPage.tsx (pure move, no behavior change) so the
// admin history/missing-photos pages can reuse the same searchable,
// sortable table without duplicating this ~110-line component. `accent`
// lets a caller swap the focus-ring/sort-indicator colour without a second
// copy of this component — TreeStatsPage keeps its original emerald,
// the admin pages use the mobile app's own "vert sapin" brand colour.
const ACCENTS = {
  emerald: {
    focus: 'focus:border-emerald-400 focus:ring-emerald-400/20',
    headerHover: 'hover:text-emerald-700',
    sortArrow: 'text-emerald-600',
  },
  brand: {
    focus: 'focus:border-[#1B4D3E] focus:ring-[#1B4D3E]/15',
    headerHover: 'hover:text-[#1B4D3E]',
    sortArrow: 'text-[#1B4D3E]',
  },
} as const

export default function SearchableTable({
  headers,
  rows,
  emptyMessage = 'Aucun résultat.',
  searchable = false,
  defaultSortCol = 0,
  accent = 'emerald',
}: {
  headers: string[]
  rows: string[][]
  emptyMessage?: string
  searchable?: boolean
  defaultSortCol?: number
  accent?: keyof typeof ACCENTS
}) {
  const a = ACCENTS[accent]
  const [query, setQuery] = useState('')
  const [sortCol, setSortCol] = useState(defaultSortCol)
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = rows
    .filter((row) => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return row.some((cell) => cell.toLowerCase().includes(q))
    })
    .sort((a, b) => {
      const cmp = (a[sortCol] ?? '').localeCompare(b[sortCol] ?? '', 'fr', { numeric: true })
      return sortAsc ? cmp : -cmp
    })

  const handleColClick = (i: number) => {
    if (sortCol === i) {
      setSortAsc((v) => !v)
    } else {
      setSortCol(i)
      setSortAsc(true)
    }
  }

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 ${a.focus}`}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm font-medium text-slate-500">
          {query ? `Aucun résultat pour « ${query} »` : emptyMessage}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {headers.map((h, i) => (
                  <th
                    key={h}
                    onClick={() => handleColClick(i)}
                    className={`cursor-pointer select-none px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500 ${a.headerHover}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {h}
                      {sortCol === i && (
                        <span className={a.sortArrow}>{sortAsc ? '↑' : '↓'}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 font-medium text-slate-800">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-2 text-xs font-bold text-slate-400">
            {filtered.length !== rows.length
              ? `${filtered.length} / ${rows.length} entrée${rows.length > 1 ? 's' : ''}`
              : `${rows.length} entrée${rows.length > 1 ? 's' : ''}`}
          </p>
        </div>
      )}
    </div>
  )
}
