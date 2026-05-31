import { ChevronRight, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useDebouncedValue } from '../../../lib/useDebouncedValue'
import { people } from '../data'
import { PanelTitle } from './ui/PanelTitle'

type SexFilter = 'all' | '♂' | '♀'

const MAX_RESULTS = 250

const sexFilters: { label: string; value: SexFilter }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Hommes', value: '♂' },
  { label: 'Femmes', value: '♀' },
]

export function LeftIndex({
  selectedPersonId,
  onPersonSelect,
}: {
  selectedPersonId?: string
  onPersonSelect: (personId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [sexFilter, setSexFilter] = useState<SexFilter>('all')

  const debouncedQuery = useDebouncedValue(query, 250)

  const indexedPeople = useMemo(() => {
    return people.map(([name, years, sex, id]) => ({
      id,
      name,
      years,
      sex,
      searchText: normalize(`${name} ${years} ${sex}`),
    }))
  }, [])

  const normalizedQuery = useMemo(
    () => normalize(debouncedQuery.trim()),
    [debouncedQuery],
  )

  const filteredPeople = useMemo(() => {
    const hasQuery = normalizedQuery.length >= 2

    return indexedPeople
      .filter((person) => {
        const queryMatch = !hasQuery || person.searchText.includes(normalizedQuery)
        const sexMatch = sexFilter === 'all' || person.sex === sexFilter

        return queryMatch && sexMatch
      })
      .slice(0, MAX_RESULTS)
  }, [indexedPeople, normalizedQuery, sexFilter])

  const hasActiveSearch = query.trim() !== '' || sexFilter !== 'all'
  const canSearch = normalizedQuery.length >= 2 || sexFilter !== 'all'

  return (
    <aside className="hidden min-h-0 flex-col border-r border-slate-200 bg-white lg:flex overflow-hidden">
      <PanelTitle title="Individus" />

      <div className="border-b border-slate-200 p-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, prénom, année..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-[13px] font-medium outline-none transition focus:border-slate-400 focus:bg-white"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label="Effacer la recherche"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {sexFilters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setSexFilter(item.value)}
              className={[
                'rounded-full px-3 py-1 text-[11px] font-black transition',
                sexFilter === item.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-500">
            {canSearch
              ? `${filteredPeople.length} résultat${filteredPeople.length > 1 ? 's' : ''}`
              : 'Saisir au moins 2 caractères'}
          </span>

          {hasActiveSearch && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSexFilter('all')
              }}
              className="font-bold text-slate-500 hover:text-slate-900"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 py-2">
        {filteredPeople.length > 0 ? (
          <div className="grid gap-[2px]">
            {filteredPeople.map(({ id, name, years, sex }) => {
              const isSelected = id === selectedPersonId

              return (
                <button
                  key={id ?? `${name}-${years}`}
                  type="button"
                  onDoubleClick={() => {
                    if (id) onPersonSelect(id)
                  }}
                  className={[
                    'group flex items-center gap-2 rounded-xl px-2 py-2 text-left transition',
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'hover:bg-slate-100',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black',
                      sex === '♀'
                        ? isSelected
                          ? 'bg-fuchsia-500/20 text-fuchsia-200'
                          : 'bg-fuchsia-100 text-fuchsia-700'
                        : isSelected
                          ? 'bg-sky-500/20 text-sky-200'
                          : 'bg-sky-100 text-sky-700',
                    ].join(' ')}
                  >
                    {sex}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={['truncate text-[12px] font-bold', isSelected ? 'text-white' : 'text-slate-800'].join(' ')}>
                      {highlight(name, debouncedQuery)}
                    </p>

                    <p className={['text-[11px]', isSelected ? 'text-slate-300' : 'text-slate-500'].join(' ')}>
                      {highlight(years, debouncedQuery)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <span title="Source liée" className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span title="À vérifier" className="h-2 w-2 rounded-full bg-amber-400" />
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-sm font-black text-slate-700">Aucun individu trouvé</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Essaie avec un nom, une année ou une variante.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50/80">
        {['Résultats', 'Branches', 'Médias'].map((item) => (
          <button
            key={item}
            type="button"
            className="flex w-full items-center justify-between border-b border-slate-200 px-3 py-2 text-left text-[12px] font-bold text-slate-600 transition hover:bg-white hover:text-slate-900"
          >
            <span>{item}</span>
            <ChevronRight size={13} />
          </button>
        ))}
      </div>
    </aside>
  )
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function highlight(text: string, query: string) {
  const trimmedQuery = query.trim()

  if (trimmedQuery.length < 2) return text

  const normalizedText = normalize(text)
  const normalizedQuery = normalize(trimmedQuery)
  const index = normalizedText.indexOf(normalizedQuery)

  if (index === -1) return text

  return (
    <>
      {text.slice(0, index)}
      <span className="rounded bg-amber-200/70 px-[2px] text-slate-950">
        {text.slice(index, index + trimmedQuery.length)}
      </span>
      {text.slice(index + trimmedQuery.length)}
    </>
  )
}