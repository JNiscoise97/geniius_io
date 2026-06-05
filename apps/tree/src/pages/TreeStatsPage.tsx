import { ArrowLeft, MapPin, Users, FileText, Camera, Briefcase, Tag, BarChart2, Unlink, UserX, BookOpen, Search, AlertTriangle, GitBranch, Copy, ArrowRightLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { graph } from '../components/tree-navigate/data'
import {
  getBirth,
  getDeath,
  getYear,
  formatGedcomDate,
  type FamilyGraphPerson,
} from '@geniius/utils/family-graph'
import { treeSettings } from '../features/family-tree/types/treeSettings'
import { buildBloodAndSpousesSet } from '../lib/graphUtils'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fullName(p: FamilyGraphPerson) {
  return [p.lastName, p.firstName].filter(Boolean).join(' ') || '—'
}

function birthDeathLabel(p: FamilyGraphPerson) {
  const by = getYear(getBirth(p)?.date)
  const dy = getYear(getDeath(p)?.date)
  if (!by && !dy) return ''
  return `${by ?? ''}–${dy ?? ''}`
}

function hasAnySource(p: FamilyGraphPerson) {
  return p.events.some((e) => e.sourcePage !== undefined || e.sourceQuay !== undefined)
}

// ─────────────────────────────────────────────────────────────────────────────
// Config des sections
// ─────────────────────────────────────────────────────────────────────────────

type Section = {
  icon: React.ElementType
  label: string
  subtitle: string
  render: () => React.ReactNode
}

function useSections(): Record<string, Section> {
  const people       = useMemo(() => Object.values(graph.people), [])
  const mediaEntries = useMemo(() => Object.values(graph.media),  [])

  return {
    // ── Lieux ────────────────────────────────────────────────────────────────
    places: {
      icon: MapPin,
      label: 'Lieux',
      subtitle: `${new Set(people.flatMap(p => p.events).map(e => e.placeBrut).filter(Boolean)).size} lieux distincts dans l'arbre`,
      render: () => {
        const counts = new Map<string, number>()
        people.forEach(p =>
          p.events.forEach(e => {
            if (e.placeBrut) counts.set(e.placeBrut, (counts.get(e.placeBrut) ?? 0) + 1)
          }),
        )
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
        return (
          <SearchableTable
            headers={['Lieu', 'Occurrences']}
            rows={sorted.map(([place, count]) => [place, String(count)])}
            searchable
          />
        )
      },
    },

    // ── Personnes ────────────────────────────────────────────────────────────
    people: {
      icon: Users,
      label: 'Personnes',
      subtitle: `${people.length} individus dans l'arbre`,
      render: () => (
        <SearchableTable
          headers={['Nom', 'Dates', 'Lieu de naissance', 'Sexe']}
          rows={[...people]
            .sort((a, b) => (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr'))
            .map(p => [
              fullName(p),
              birthDeathLabel(p),
              getBirth(p)?.placeBrut ?? '—',
              p.sex === 'M' ? '♂' : p.sex === 'F' ? '♀' : '·',
            ])}
          searchable
        />
      ),
    },

    // ── Sources ──────────────────────────────────────────────────────────────
    sources: {
      icon: FileText,
      label: 'Sources documentaires',
      subtitle: `Événements avec au moins une référence de source`,
      render: () => {
        const rows: string[][] = []
        people.forEach(p =>
          p.events
            .filter(e => e.sourcePage || e.sourceQuay)
            .forEach(e =>
              rows.push([
                fullName(p),
                e.tag,
                e.date ? formatGedcomDate(e.date) : '—',
                e.sourcePage ?? e.sourceQuay ?? '—',
              ]),
            ),
        )
        rows.sort((a, b) => a[0].localeCompare(b[0], 'fr'))
        return (
          <SearchableTable
            headers={['Personne', 'Événement', 'Date', 'Référence']}
            rows={rows}
            searchable
          />
        )
      },
    },

    // ── Médias ───────────────────────────────────────────────────────────────
    media: {
      icon: Camera,
      label: 'Médias',
      subtitle: `${mediaEntries.length} médias indexés`,
      render: () => (
        <SearchableTable
          headers={['Titre', 'Format', 'ID']}
          rows={mediaEntries.map(m => [m.title ?? '—', m.form ?? '—', m.id])}
          searchable
        />
      ),
    },

    // ── Métiers ──────────────────────────────────────────────────────────────
    occupations: {
      icon: Briefcase,
      label: 'Métiers recensés',
      subtitle: `${new Set(people.map(p => p.occupation).filter(Boolean)).size} occupations distinctes`,
      render: () => {
        const counts = new Map<string, number>()
        people.forEach(p => {
          if (p.occupation)
            counts.set(p.occupation, (counts.get(p.occupation) ?? 0) + 1)
        })
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
        return (
          <SearchableTable
            headers={['Métier', 'Personnes']}
            rows={sorted.map(([occ, count]) => [occ, String(count)])}
            searchable
          />
        )
      },
    },

    // ── Patronymes ───────────────────────────────────────────────────────────
    lastnames: {
      icon: Tag,
      label: 'Patronymes',
      subtitle: `${new Set(people.map(p => p.lastName).filter(Boolean)).size} noms de famille distincts`,
      render: () => {
        const counts = new Map<string, number>()
        people.forEach(p => {
          if (p.lastName)
            counts.set(p.lastName, (counts.get(p.lastName) ?? 0) + 1)
        })
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
        return (
          <SearchableTable
            headers={['Patronyme', 'Occurrences']}
            rows={sorted.map(([name, count]) => [name, String(count)])}
            searchable
          />
        )
      },
    },

    // ── Complétude ───────────────────────────────────────────────────────────
    completeness: {
      icon: BarChart2,
      label: 'Complétude détaillée',
      subtitle: 'Analyse champ par champ sur toutes les personnes',
      render: () => {
        const n = people.length
        const pct = (c: number) => `${Math.round((c / n) * 100)}%`
        const withBirthDate   = people.filter(p => getBirth(p)?.date).length
        const withBirthPlace  = people.filter(p => getBirth(p)?.placeBrut).length
        const withDeath       = people.filter(p => getDeath(p)).length
        const withParents     = people.filter(p => p.famcIds.length > 0).length
        const withSource      = people.filter(hasAnySource).length
        const withMedia       = people.filter(p => p.mediaIds.length > 0).length
        const withOccupation  = people.filter(p => p.occupation).length
        const withFirstName   = people.filter(p => p.firstName && p.firstName !== 'Nom inconnu').length
        const withLastName    = people.filter(p => p.lastName).length

        const rows = [
          ['Prénom renseigné',      String(withFirstName),  pct(withFirstName)],
          ['Nom de famille',        String(withLastName),   pct(withLastName)],
          ['Date de naissance',     String(withBirthDate),  pct(withBirthDate)],
          ['Lieu de naissance',     String(withBirthPlace), pct(withBirthPlace)],
          ['Décès renseigné',       String(withDeath),      pct(withDeath)],
          ['Parents connus',        String(withParents),    pct(withParents)],
          ['Au moins une source',   String(withSource),     pct(withSource)],
          ['Photo ou média',        String(withMedia),      pct(withMedia)],
          ['Profession connue',     String(withOccupation), pct(withOccupation)],
        ]
        return (
          <div className="space-y-4">
            {rows.map(([label, count, percent]) => (
              <div key={label}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-700">{label}</p>
                  <span className="text-xs font-black text-slate-500">
                    {count} / {n} — <span className="text-emerald-700">{percent}</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: percent }}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      },
    },

    // ── Individus isolés ─────────────────────────────────────────────────────
    isolated: {
      icon: Unlink,
      label: 'Individus isolés',
      subtitle: `Personnes sans lien de sang ni de mariage avec la personne de référence`,
      render: () => {
        const linkedIds = buildBloodAndSpousesSet(graph, treeSettings.sosaReferencePersonId)
        const isolated = people.filter((p) => !linkedIds.has(p.id))
        return (
          <SearchableTable
            headers={['Nom', 'Dates', 'Lieu de naissance']}
            rows={[...isolated]
              .sort((a, b) => (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr'))
              .map(p => [
                fullName(p),
                birthDeathLabel(p),
                getBirth(p)?.placeBrut ?? '—',
              ])}
            emptyMessage="Aucun individu isolé."
            searchable
          />
        )
      },
    },

    // ── Sans parents ─────────────────────────────────────────────────────────
    'without-parents': {
      icon: UserX,
      label: 'Personnes sans parents connus',
      subtitle: 'Pistes de recherche prioritaires pour remonter les lignées',
      render: () => {
        const withoutParents = people.filter(p => p.famcIds.length === 0)
        return (
          <SearchableTable
            headers={['Nom', 'Dates', 'Lieu de naissance']}
            rows={[...withoutParents]
              .sort((a, b) => (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr'))
              .map(p => [
                fullName(p),
                birthDeathLabel(p),
                getBirth(p)?.placeBrut ?? '—',
              ])}
            emptyMessage="Toutes les personnes ont au moins un parent connu."
            searchable
          />
        )
      },
    },

    // ── Sans source ──────────────────────────────────────────────────────────
    'without-source': {
      icon: BookOpen,
      label: 'Personnes sans source',
      subtitle: "Individus dont aucun événement n'est référencé",
      render: () => {
        const withoutSource = people.filter(p => !hasAnySource(p))
        return (
          <SearchableTable
            headers={['Nom', 'Dates', 'Lieu de naissance']}
            rows={[...withoutSource]
              .sort((a, b) => (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr'))
              .map(p => [
                fullName(p),
                birthDeathLabel(p),
                getBirth(p)?.placeBrut ?? '—',
              ])}
            emptyMessage="Toutes les personnes ont au moins une source."
            searchable
          />
        )
      },
    },

    // ── Doublons potentiels ───────────────────────────────────────────────────
    duplicates: {
      icon: Copy,
      label: 'Doublons potentiels',
      subtitle: 'Paires partageant le même nom, prénom et période de naissance (±2 ans)',
      render: () => {
        // O(n) via index — évite les ~630M itérations de la double boucle sur 35k personnes
        const byKey = new Map<string, FamilyGraphPerson[]>()
        for (const person of people) {
          if (!person.lastName) continue
          const last  = person.lastName.toLowerCase()
          const first = (person.firstName ?? '').split(/[\s"]+/)[0]?.toLowerCase() ?? ''
          if (!first) continue
          const key = `${last}|${first}`
          const arr = byKey.get(key)
          if (arr) arr.push(person)
          else byKey.set(key, [person])
        }
        const pairs: [FamilyGraphPerson, FamilyGraphPerson][] = []
        for (const group of byKey.values()) {
          if (group.length < 2) continue
          for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
              const ya = getYear(getBirth(group[i])?.date)
              const yb = getYear(getBirth(group[j])?.date)
              if (ya && yb && Math.abs(ya - yb) <= 2) pairs.push([group[i], group[j]])
            }
          }
        }
        return (
          <SearchableTable
            headers={['Personne A', 'Personne B', 'Naissance A', 'Naissance B']}
            rows={pairs.map(([a, b]) => [
              fullName(a),
              fullName(b),
              String(getYear(getBirth(a)?.date) ?? '—'),
              String(getYear(getBirth(b)?.date) ?? '—'),
            ])}
            emptyMessage="Aucun doublon potentiel détecté."
            searchable
          />
        )
      },
    },

    // ── Incohérences chronologiques ───────────────────────────────────────────
    inconsistencies: {
      icon: AlertTriangle,
      label: 'Incohérences chronologiques',
      subtitle: 'Événements impossibles ou dates biologiquement improbables',
      render: () => {
        const rows: string[][] = []
        for (const person of people) {
          const birthYear = getYear(getBirth(person)?.date)
          const deathYear = getYear(getDeath(person)?.date)

          if (birthYear && deathYear && deathYear < birthYear) {
            rows.push([fullName(person), 'Décès avant naissance', `† ${deathYear} < ✶ ${birthYear}`])
            continue
          }

          if (birthYear) {
            for (const famcId of person.famcIds) {
              const fam = graph.families[famcId]
              if (!fam) continue
              for (const parentId of [fam.husbandId, fam.wifeId]) {
                if (!parentId) continue
                const parent = graph.people[parentId]
                if (!parent) continue
                const pBirth = getYear(getBirth(parent)?.date)
                if (!pBirth) continue
                const gap = birthYear - pBirth
                if (gap < 12) {
                  rows.push([fullName(person), 'Parent trop jeune', `${fullName(parent)} ✶${pBirth} → ${gap} ans d'écart`])
                } else if (gap > 85) {
                  rows.push([fullName(person), 'Parent trop âgé', `${fullName(parent)} ✶${pBirth} → ${gap} ans d'écart`])
                }
              }
            }
          }
        }
        rows.sort((a, b) => a[0].localeCompare(b[0], 'fr'))
        return (
          <SearchableTable
            headers={['Personne', "Type d'incohérence", 'Détail']}
            rows={rows}
            emptyMessage="Aucune incohérence chronologique détectée."
            searchable
          />
        )
      },
    },

    // ── Filiations faibles ────────────────────────────────────────────────────
    'weak-filiations': {
      icon: GitBranch,
      label: 'Filiations faibles',
      subtitle: 'Lien parental connu mais sans acte de naissance sourcé',
      render: () => {
        const weak = people.filter(p => {
          if (p.famcIds.length === 0) return false
          const birth = getBirth(p)
          return !birth?.sourcePage && !birth?.sourceQuay
        })
        return (
          <SearchableTable
            headers={['Personne', 'Dates', 'Lieu de naissance']}
            rows={[...weak]
              .sort((a, b) => (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr'))
              .map(p => [
                fullName(p),
                birthDeathLabel(p),
                getBirth(p)?.placeBrut ?? '—',
              ])}
            emptyMessage="Aucune filiation faible détectée."
            searchable
          />
        )
      },
    },

    // ── Migrations ────────────────────────────────────────────────────────────
    migrations: {
      icon: ArrowRightLeft,
      label: 'Migrations détectées',
      subtitle: 'Personnes nées et décédées dans des lieux différents',
      render: () => {
        const migrants = people.filter(p => {
          const bp = getBirth(p)?.placeBrut
          const dp = getDeath(p)?.placeBrut
          return bp && dp && bp !== dp
        })
        return (
          <SearchableTable
            headers={['Personne', 'Né(e) à', 'Décédé(e) à', 'Dates']}
            rows={[...migrants]
              .sort((a, b) => (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr'))
              .map(p => [
                fullName(p),
                getBirth(p)?.placeBrut ?? '—',
                getDeath(p)?.placeBrut ?? '—',
                birthDeathLabel(p),
              ])}
            emptyMessage="Aucune migration détectée."
            searchable
          />
        )
      },
    },

    // ── Branches inexplorées ──────────────────────────────────────────────────
    'unexplored-branches': {
      icon: Search,
      label: 'Branches à explorer',
      subtitle: 'Personnes sans parents connus, nées après 1700 (pistes prioritaires)',
      render: () => {
        const unexplored = people.filter(p => {
          const year = getYear(getBirth(p)?.date)
          return p.famcIds.length === 0 && year !== undefined && year > 1700
        })
        return (
          <SearchableTable
            headers={['Nom', 'Dates', 'Lieu de naissance']}
            rows={[...unexplored]
              .sort((a, b) => (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr'))
              .map(p => [
                fullName(p),
                birthDeathLabel(p),
                getBirth(p)?.placeBrut ?? '—',
              ])}
            emptyMessage="Aucune branche inexplorée."
            searchable
          />
        )
      },
    },

    // ── Lieux ambigus ─────────────────────────────────────────────────────────
    'ambiguous-places': {
      icon: MapPin,
      label: 'Lieux ambigus',
      subtitle: 'Toponymes non résolus, trop courts ou incertains',
      render: () => {
        const counts = new Map<string, number>()
        people.forEach(p => p.events.forEach(e => {
          if (e.placeBrut) counts.set(e.placeBrut, (counts.get(e.placeBrut) ?? 0) + 1)
        }))
        const ambiguous = [...counts.entries()].filter(([p]) => {
          const s = p.toLowerCase().trim()
          return s.length < 3 || s.includes('?') || s === 'inconnue' || s === 'inconnu' || s === 'unknown'
        })
        return (
          <SearchableTable
            headers={['Lieu', 'Occurrences']}
            rows={ambiguous.sort((a, b) => b[1] - a[1]).map(([place, count]) => [place, String(count)])}
            emptyMessage="Aucun lieu ambigu détecté."
            searchable
          />
        )
      },
    },

    // ── Photos non attribuées ─────────────────────────────────────────────────
    'unlinked-photos': {
      icon: Camera,
      label: 'Photos non attribuées',
      subtitle: 'Médias photos non liés à aucun individu',
      render: () => {
        const linkedIds = new Set(people.flatMap(p => p.mediaIds))
        const unlinked = Object.entries(graph.media)
          .filter(([id, m]) =>
            /jpe?g|png|gif|webp/i.test(m.form ?? m.title ?? '') && !linkedIds.has(id),
          )
          .map(([, m]) => m)
        return (
          <SearchableTable
            headers={['Titre', 'Format']}
            rows={unlinked.map(m => [m.title ?? '—', m.form ?? '—'])}
            emptyMessage="Toutes les photos sont attribuées à des individus."
            searchable
          />
        )
      },
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Table avec recherche et tri
// ─────────────────────────────────────────────────────────────────────────────

function SearchableTable({
  headers,
  rows,
  emptyMessage = 'Aucun résultat.',
  searchable = false,
  defaultSortCol = 0,
}: {
  headers: string[]
  rows: string[][]
  emptyMessage?: string
  searchable?: boolean
  defaultSortCol?: number
}) {
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
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
                    className="cursor-pointer select-none px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500 hover:text-emerald-700"
                  >
                    <span className="inline-flex items-center gap-1">
                      {h}
                      {sortCol === i && (
                        <span className="text-emerald-600">{sortAsc ? '↑' : '↓'}</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

export default function TreeStatsPage() {
  const { treeId, section } = useParams<{ treeId: string; section: string }>()
  const sections = useSections()
  const current = section ? sections[section] : undefined

  if (!current) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link
          to={`/trees/${treeId}`}
          className="mb-8 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft size={17} />
          Retour à l'arbre
        </Link>
        <p className="text-slate-600">Section introuvable : <code>{section}</code></p>
      </div>
    )
  }

  const Icon = current.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto w-full max-w-5xl px-0 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="px-6 sm:px-0">
          <Link
            to={`/trees/${treeId}`}
            className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-emerald-700"
          >
            <ArrowLeft size={17} />
            Retour à l'arbre
          </Link>
        </div>

        <div className="rounded-none border-y border-slate-200 bg-white px-6 py-6 shadow-sm sm:rounded-3xl sm:border lg:px-8 lg:py-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
              <Icon size={22} className="text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Famille TANJAMA
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {current.label}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600">{current.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="mt-6 rounded-none border-y border-slate-200 bg-white px-6 py-6 shadow-sm sm:rounded-3xl sm:border lg:px-8">
          {current.render()}
        </div>

      </div>
    </div>
  )
}