// EntitesHubPage.tsx
// Point d'entrée du module Entités — registre canonique de personnes/lieux,
// alimenté par promotion automatique depuis les assertions validées du
// module Extraction (cf. entites.service.ts, ensureEntitiesPromoted). Liste
// filtrable par type + recherche par libellé, clic → fiche.

import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, Users2, Loader2, AlertCircle, MapPin, User, Search } from 'lucide-react'
import { fetchEntities } from './entites.service'
import type { EntityListItem, EntityType } from './entites.types'

type TypeFilter = 'tous' | EntityType

function EntityCard({ item, onClick }: { item: EntityListItem; onClick: () => void }) {
  const Icon = item.entityType === 'place' ? MapPin : User
  return (
    <div
      role="button" tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className="w-full bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all group cursor-pointer flex items-center gap-4"
    >
      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
          {item.label}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">{item.entityType === 'place' ? 'Lieu' : 'Personne'}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5">
          {item.factsCount} fait{item.factsCount > 1 ? 's' : ''}
        </span>
        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5">
          {item.documentsCount} acte{item.documentsCount > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

export function EntitesHubPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<EntityListItem[]>([])
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('tous')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchEntities({ type: typeFilter === 'tous' ? undefined : typeFilter, search: search || undefined })
      .then(data => { if (!cancelled) setItems(data) })
      .catch(err => { if (!cancelled) setError(err?.message ?? 'Erreur de chargement') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter])

  // Recherche filtrée côté client une fois la liste du type chargée, pour
  // ne pas relancer une requête à chaque frappe — la liste reste petite au
  // stade actuel du projet.
  const filtered = search.trim()
    ? items.filter(i => i.label.toLowerCase().includes(search.trim().toLowerCase()))
    : items

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-rose-200 p-6 max-w-sm text-center">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-800 mb-1">Erreur de chargement</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
              <LayoutDashboard className="w-4 h-4" />Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="flex items-center gap-1.5">
              <Users2 className="w-4 h-4" />Entités
            </span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Entités</h1>
          <p className="text-sm text-gray-500 mt-1">
            Personnes et lieux reconstitués à partir des assertions validées, toutes actes confondus.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom…"
              className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {([
            ['tous', 'Toutes'],
            ['person', 'Personnes'],
            ['place', 'Lieux'],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTypeFilter(key)}
              className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
                typeFilter === key ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-8">
            <Loader2 className="w-4 h-4 animate-spin" />Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <p className="text-sm text-gray-400">
              {items.length === 0
                ? 'Aucune entité pour l\'instant — elles apparaissent ici dès qu\'une assertion les concernant est validée dans le module Extraction.'
                : 'Aucune entité ne correspond à cette recherche.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(item => (
              <EntityCard
                key={item.id}
                item={item}
                onClick={() =>
                  navigate(
                    item.entityType === 'person'
                      ? `/individu/${item.id}`
                      : item.entityType === 'place'
                        ? `/lieu/${item.id}`
                        : `/entites/${item.id}`
                  )
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default EntitesHubPage
