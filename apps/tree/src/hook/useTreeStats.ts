import { useMemo } from 'react'
import {
  getBirth,
  getDeath,
  getYear,
  type FamilyGraphPerson,
  type FamilyGraphFamily,
  type GedcomMedia,
} from '@geniius/utils/family-graph'
import { buildBloodAndSpousesSet } from '../lib/graphUtils'

export type FamilyGraphData = {
  people: Record<string, FamilyGraphPerson>
  families: Record<string, FamilyGraphFamily>
  media: Record<string, GedcomMedia>
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TreeStats = {
  // Périmètre
  totalPeople: number
  totalFamilies: number
  totalGenerations: number
  totalSources: number
  totalPlaces: number
  totalBranches: number

  // Connectivité
  connectedPeople: number
  isolatedPeople: number
  oldestAncestor: { name: string; year: number } | null
  deepestLineage: number

  // Complétude (0–100)
  completeness: {
    birthDate: number
    birthPlace: number
    death: number
    parentsKnown: number
    anySource: number
    mediaOrPhoto: number
  }

  // Sources
  sourcesByType: {
    label: string
    value: number
  }[]
  sourcesLinked: number
  sourcesUnused: number
  sourcesUnvalidated: number

  // Médias
  totalPhotos: number
  totalScans: number
  totalMedia: number
  unidentifiedPhotos: number
  sourcesWithoutTranscription: number
  audioMemories: number
  peopleWithoutPhoto: number

  // Occupations & histoire
  totalOccupations: number
  totalLastNames: number
  totalMigrations: number
  historicalEvents: number

  // Backlog
  peopleWithoutParents: number
  peopleWithoutSource: number
  actsToFind: number
  openLeads: number
  unexploredBranches: number

  // Qualité
  chronologicalInconsistencies: number
  potentialDuplicates: number
  weakFiliations: number
  ambiguousPlaces: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function hasAnySource(person: FamilyGraphPerson): boolean {
  return person.events.some(
    (e) => e.sourcePage !== undefined || e.sourceQuay !== undefined,
  )
}

function fullName(person: FamilyGraphPerson): string {
  return [person.lastName, person.firstName].filter(Boolean).join(' ')
}

function pct(count: number, total: number): number {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}


// ─────────────────────────────────────────────────────────────────────────────
// Profondeur ascendante (générations d'ancêtres depuis la racine)
// ─────────────────────────────────────────────────────────────────────────────

function computeAscendanceDepth(graph: FamilyGraphData, rootId: string): number {
  let maxDepth = 0
  const queue: [string, number][] = [[rootId, 1]]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const [id, depth] = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    if (depth > maxDepth) maxDepth = depth

    const person = graph.people[id]
    if (!person) continue

    for (const famcId of person.famcIds) {
      const fam = graph.families[famcId]
      if (!fam) continue
      if (fam.husbandId && !visited.has(fam.husbandId)) queue.push([fam.husbandId, depth + 1])
      if (fam.wifeId    && !visited.has(fam.wifeId))    queue.push([fam.wifeId,    depth + 1])
    }
  }

  return maxDepth
}

// ─────────────────────────────────────────────────────────────────────────────
// Profondeur descendante (générations de descendants depuis la racine)
// ─────────────────────────────────────────────────────────────────────────────

function computeDescendanceDepth(graph: FamilyGraphData, rootId: string): number {
  let maxDepth = 0
  const queue: [string, number][] = [[rootId, 1]]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const [id, depth] = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    if (depth > maxDepth) maxDepth = depth

    const person = graph.people[id]
    if (!person) continue

    for (const famsId of person.famsIds) {
      const fam = graph.families[famsId]
      if (!fam) continue
      for (const childId of fam.childIds) {
        if (!visited.has(childId)) queue.push([childId, depth + 1])
      }
    }
  }

  return maxDepth
}

// ─────────────────────────────────────────────────────────────────────────────
// Branches = patronymes distincts dans la lignée de sang ascendante
// ─────────────────────────────────────────────────────────────────────────────

function computeTotalBranches(graph: FamilyGraphData, rootId: string): number {
  const surnames = new Set<string>()
  const queue: string[] = [rootId]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)

    const person = graph.people[id]
    if (!person) continue
    if (person.lastName) surnames.add(person.lastName.toUpperCase())

    for (const famcId of person.famcIds) {
      const fam = graph.families[famcId]
      if (!fam) continue
      if (fam.husbandId) queue.push(fam.husbandId)
      if (fam.wifeId)    queue.push(fam.wifeId)
    }
  }

  return surnames.size
}

// ─────────────────────────────────────────────────────────────────────────────
// Incohérences chronologiques : décès avant naissance, enfant né trop tôt/tard
// ─────────────────────────────────────────────────────────────────────────────

function computeChronologicalInconsistencies(
  people: FamilyGraphPerson[],
  graph: FamilyGraphData,
): number {
  let count = 0

  for (const person of people) {
    let bad = false

    const birthYear = getYear(getBirth(person)?.date)
    const deathYear = getYear(getDeath(person)?.date)

    if (birthYear && deathYear && deathYear < birthYear) bad = true

    if (!bad && birthYear) {
      outer: for (const famcId of person.famcIds) {
        const fam = graph.families[famcId]
        if (!fam) continue

        for (const parentId of [fam.husbandId, fam.wifeId]) {
          if (!parentId) continue
          const parent = graph.people[parentId]
          if (!parent) continue
          const pBirth = getYear(getBirth(parent)?.date)
          if (!pBirth) continue

          const gap = birthYear - pBirth
          if (gap < 12 || gap > 85) {
            bad = true
            break outer
          }
        }
      }
    }

    if (bad) count++
  }

  return count
}

// ─────────────────────────────────────────────────────────────────────────────
// Doublons potentiels : O(n) via index (lastName|firstName) → years[]
// Remplace la double boucle O(n²) qui gelait le tab sur 35k personnes
// ─────────────────────────────────────────────────────────────────────────────

function computePotentialDuplicates(people: FamilyGraphPerson[]): number {
  const byKey = new Map<string, number[]>()

  for (const person of people) {
    if (!person.lastName) continue
    const last  = person.lastName.toLowerCase()
    const first = (person.firstName ?? '').split(/[\s"]+/)[0]?.toLowerCase() ?? ''
    if (!first) continue
    const key  = `${last}|${first}`
    const year = getYear(getBirth(person)?.date) ?? -1
    const arr  = byKey.get(key)
    if (arr) arr.push(year)
    else byKey.set(key, [year])
  }

  let count = 0
  for (const years of byKey.values()) {
    if (years.length < 2) continue
    for (let i = 0; i < years.length; i++) {
      for (let j = i + 1; j < years.length; j++) {
        const ya = years[i], yb = years[j]
        if (ya !== -1 && yb !== -1 && Math.abs(ya - yb) <= 2) count++
      }
    }
  }
  return count
}

// ─────────────────────────────────────────────────────────────────────────────
// Filiations faibles : lien parent connu mais sans acte de naissance sourcé
// ─────────────────────────────────────────────────────────────────────────────

function computeWeakFiliations(people: FamilyGraphPerson[]): number {
  return people.filter((person) => {
    if (person.famcIds.length === 0) return false
    const birth = getBirth(person)
    return !birth?.sourcePage && !birth?.sourceQuay
  }).length
}

// ─────────────────────────────────────────────────────────────────────────────
// Lieux ambigus : trop courts, inconnus ou contenant "?"
// ─────────────────────────────────────────────────────────────────────────────

function computeAmbiguousPlaces(places: Set<string>): number {
  return [...places].filter((p) => {
    const s = p.toLowerCase().trim()
    return s.length < 3 || s.includes('?') || s === 'inconnue' || s === 'inconnu' || s === 'unknown'
  }).length
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────────────────

export function useTreeStats(graph: FamilyGraphData, rootId?: string): TreeStats {
  return useMemo(() => {
    const people       = Object.values(graph.people)
    const families     = Object.values(graph.families)
    const mediaEntries = Object.values(graph.media)
    const n            = people.length

    // ── Périmètre ────────────────────────────────────────────────────────────

    const totalPeople   = n
    const totalFamilies = families.length

    const allPlaces = new Set(
      people
        .flatMap((p) => p.events)
        .map((e) => e.placeBrut)
        .filter((p): p is string => Boolean(p)),
    )
    const totalPlaces = allPlaces.size

    const allEvents    = people.flatMap((p) => p.events)
    const sourcesLinked = allEvents.filter(
      (e) => e.sourcePage !== undefined || e.sourceQuay !== undefined,
    ).length

    // ── Connectivité ─────────────────────────────────────────────────────────

    const linkedIds     = rootId ? buildBloodAndSpousesSet(graph, rootId) : new Set<string>()
    const isolated      = people.filter((p) => !linkedIds.has(p.id))
    const isolatedPeople = isolated.length
    const connectedPeople = n - isolatedPeople

    const withBirthYear = people
      .map((p) => ({ p, year: getYear(getBirth(p)?.date) }))
      .filter((x): x is { p: FamilyGraphPerson; year: number } => x.year !== undefined)
      .sort((a, b) => a.year - b.year)

    const oldestAncestor =
      withBirthYear.length > 0
        ? { name: fullName(withBirthYear[0].p), year: withBirthYear[0].year }
        : null

    // ── Profondeurs (dynamiques) ──────────────────────────────────────────────

    const totalGenerations = rootId ? computeAscendanceDepth(graph, rootId) : 0
    const deepestLineage   = rootId ? computeDescendanceDepth(graph, rootId) : 0
    const totalBranches    = rootId ? computeTotalBranches(graph, rootId) : 0

    // ── Complétude ────────────────────────────────────────────────────────────

    const withBirthDate  = people.filter((p) => getBirth(p)?.date).length
    const withBirthPlace = people.filter((p) => getBirth(p)?.placeBrut).length
    const withDeath      = people.filter((p) => getDeath(p)).length
    const withParents    = people.filter((p) => p.famcIds.length > 0).length
    const withSource     = people.filter(hasAnySource).length
    const withMedia      = people.filter((p) => p.mediaIds.length > 0).length

    // ── Sources par type ──────────────────────────────────────────────────────

    const sourcePages = allEvents
      .map((e) => e.sourcePage?.toLowerCase() ?? '')
      .filter(Boolean)

    const countKeyword = (keywords: string[]) =>
      sourcePages.filter((s) => keywords.some((k) => s.includes(k))).length

    const sourcesByType = [
      { label: 'État civil',   value: countKeyword(['état civil', 'naissance', 'mariage', 'décès', 'baptême', 'birth', 'death', 'marriage']) },
      { label: 'Notariat',     value: countKeyword(['notaire', 'notarial', 'acte notarié', 'testament']) },
      { label: 'Recensements', value: countKeyword(['recensement', 'census']) },
      { label: 'Hypothèques',  value: countKeyword(['hypothèque', 'mortgage']) },
      { label: 'Presse',       value: countKeyword(['journal', 'presse', 'newspaper']) },
      { label: 'Témoignages',  value: countKeyword(['témoignage', 'oral', 'family']) },
    ]

    // ── Médias ────────────────────────────────────────────────────────────────

    const totalMedia   = mediaEntries.length
    const totalPhotos  = mediaEntries.filter((m) =>
      /jpe?g|png|gif|webp/i.test(m.form ?? m.title ?? ''),
    ).length
    const totalScans   = mediaEntries.filter((m) =>
      /pdf/i.test(m.form ?? m.title ?? ''),
    ).length
    const audioMemories = mediaEntries.filter((m) =>
      /mp3|wav|ogg|aac|m4a|flac/i.test(m.form ?? m.title ?? ''),
    ).length
    const peopleWithoutPhoto = people.filter((p) => p.mediaIds.length === 0).length

    // Photos non liées à un individu
    const linkedMediaIds = new Set(people.flatMap((p) => p.mediaIds))
    const unidentifiedPhotos = Object.entries(graph.media).filter(
      ([id, m]) =>
        /jpe?g|png|gif|webp/i.test(m.form ?? m.title ?? '') &&
        !linkedMediaIds.has(id),
    ).length

    // ── Occupations & patronymes ──────────────────────────────────────────────

    const occupations = new Set(
      people.map((p) => p.occupation).filter((o): o is string => Boolean(o)),
    )
    const lastNames = new Set(
      people.map((p) => p.lastName).filter((l): l is string => Boolean(l)),
    )

    // Migrations : naissance et décès dans des lieux différents
    const totalMigrations = people.filter((p) => {
      const birthPlace = getBirth(p)?.placeBrut
      const deathPlace = getDeath(p)?.placeBrut
      return birthPlace && deathPlace && birthPlace !== deathPlace
    }).length

    // ── Backlog ───────────────────────────────────────────────────────────────

    const peopleWithoutParents = people.filter((p) => p.famcIds.length === 0).length
    const peopleWithoutSource  = people.filter((p) => !hasAnySource(p)).length

    // Actes à trouver : personnes nées après 1600 sans acte de naissance sourcé
    const actsToFind = people.filter((p) => {
      const birth = getBirth(p)
      const year  = getYear(birth?.date)
      if (!year || year < 1600) return false
      return !birth?.sourcePage && !birth?.sourceQuay
    }).length

    // Branches inexplorées : sans parents connus, nées après 1700
    const unexploredBranches = people.filter((p) => {
      const year = getYear(getBirth(p)?.date)
      return p.famcIds.length === 0 && year !== undefined && year > 1700
    }).length

    // ── Qualité ───────────────────────────────────────────────────────────────

    const chronologicalInconsistencies = computeChronologicalInconsistencies(people, graph)
    const potentialDuplicates          = computePotentialDuplicates(people)
    const weakFiliations               = computeWeakFiliations(people)
    const ambiguousPlaces              = computeAmbiguousPlaces(allPlaces)

    // ─────────────────────────────────────────────────────────────────────────

    return {
      // Périmètre
      totalPeople,
      totalFamilies,
      totalGenerations,
      totalSources: sourcesLinked,
      totalPlaces,
      totalBranches,

      // Connectivité
      connectedPeople,
      isolatedPeople,
      oldestAncestor,
      deepestLineage,

      // Complétude
      completeness: {
        birthDate:    pct(withBirthDate,  n),
        birthPlace:   pct(withBirthPlace, n),
        death:        pct(withDeath,      n),
        parentsKnown: pct(withParents,    n),
        anySource:    pct(withSource,     n),
        mediaOrPhoto: pct(withMedia,      n),
      },

      // Sources
      sourcesByType,
      sourcesLinked,
      sourcesUnused:             0,  // non modélisé en GEDCOM standard
      sourcesUnvalidated:        0,  // non modélisé en GEDCOM standard

      // Médias
      totalPhotos,
      totalScans,
      totalMedia,
      unidentifiedPhotos,
      sourcesWithoutTranscription: 0, // non modélisé en GEDCOM standard
      audioMemories,
      peopleWithoutPhoto,

      // Occupations & histoire
      totalOccupations: occupations.size,
      totalLastNames: lastNames.size,
      totalMigrations,
      historicalEvents: 0,           // non modélisé en GEDCOM standard

      // Backlog
      peopleWithoutParents,
      peopleWithoutSource,
      actsToFind,
      openLeads: 0,                  // non modélisé en GEDCOM standard
      unexploredBranches,

      // Qualité
      chronologicalInconsistencies,
      potentialDuplicates,
      weakFiliations,
      ambiguousPlaces,
    }
  }, [graph, rootId])
}
