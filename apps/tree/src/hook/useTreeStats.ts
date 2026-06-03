import { useMemo } from 'react'
import {
  getBirth,
  getDeath,
  getYear,
  type FamilyGraphPerson,
  type FamilyGraphFamily,
  type GedcomMedia,
} from '@geniius/utils/family-graph'
import { treeSettings } from '../features/family-tree/types/treeSettings'

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
  totalGenerations: number       // STATIQUE — nécessite BFS depuis racine connue
  totalSources: number
  totalPlaces: number
  totalBranches: number          // STATIQUE — nécessite assignBranches()

  // Connectivité
  connectedPeople: number
  isolatedPeople: number
  oldestAncestor: { name: string; year: number } | null
  deepestLineage: number         // STATIQUE — nécessite algorithme de profondeur

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
  sourcesUnused: number          // STATIQUE — non modélisé dans GEDCOM standard
  sourcesUnvalidated: number     // STATIQUE — non modélisé dans GEDCOM standard

  // Médias
  totalPhotos: number
  totalScans: number
  totalMedia: number
  unidentifiedPhotos: number     // STATIQUE
  sourcesWithoutTranscription: number // STATIQUE
  audioMemories: number          // STATIQUE
  peopleWithoutPhoto: number

  // Occupations & histoire
  totalOccupations: number
  totalLastNames: number
  totalMigrations: number        // STATIQUE
  historicalEvents: number       // STATIQUE

  // Backlog
  peopleWithoutParents: number
  peopleWithoutSource: number
  actsToFind: number             // STATIQUE
  openLeads: number              // STATIQUE
  unexploredBranches: number     // STATIQUE

  // Qualité
  chronologicalInconsistencies: number // STATIQUE
  potentialDuplicates: number          // STATIQUE
  weakFiliations: number               // STATIQUE
  ambiguousPlaces: number              // STATIQUE
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper : vérifie si une personne a une source
// ─────────────────────────────────────────────────────────────────────────────

function hasAnySource(person: FamilyGraphPerson): boolean {
  return person.events.some(
    (e) => e.sourcePage !== undefined || e.sourceQuay !== undefined,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper : format nom complet
// ─────────────────────────────────────────────────────────────────────────────

function fullName(person: FamilyGraphPerson): string {
  return [person.lastName, person.firstName].filter(Boolean).join(' ')
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper : pct arrondi
// ─────────────────────────────────────────────────────────────────────────────

function pct(count: number, total: number): number {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

// ─────────────────────────────────────────────────────────────────────────────
// BFS : construit le Set des IDs liés par le sang ou conjoint à une racine
// Même logique que filterGraphToBloodRelativesAndSpouses du script de build
// ─────────────────────────────────────────────────────────────────────────────

function buildBloodAndSpousesSet(
  graph: FamilyGraphData,
  rootId: string,
): Set<string> {
  const bloodIds = new Set<string>()
  const queue: string[] = [rootId]

  // BFS sur les liens de sang (parents ↔ enfants)
  while (queue.length > 0) {
    const id = queue.shift()!
    if (bloodIds.has(id)) continue
    bloodIds.add(id)

    const person = graph.people[id]
    if (!person) continue

    // Remonter vers les parents
    for (const famcId of person.famcIds) {
      const fam = graph.families[famcId]
      if (!fam) continue
      if (fam.husbandId && !bloodIds.has(fam.husbandId)) queue.push(fam.husbandId)
      if (fam.wifeId   && !bloodIds.has(fam.wifeId))   queue.push(fam.wifeId)
    }

    // Descendre vers les enfants
    for (const famsId of person.famsIds) {
      const fam = graph.families[famsId]
      if (!fam) continue
      for (const childId of fam.childIds) {
        if (!bloodIds.has(childId)) queue.push(childId)
      }
    }
  }

  // Ajouter les conjoints des personnes liées par le sang
  const result = new Set<string>(bloodIds)
  for (const id of bloodIds) {
    const person = graph.people[id]
    if (!person) continue
    for (const famsId of person.famsIds) {
      const fam = graph.families[famsId]
      if (!fam) continue
      if (fam.husbandId) result.add(fam.husbandId)
      if (fam.wifeId)    result.add(fam.wifeId)
    }
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────────────────

export function useTreeStats(graph: FamilyGraphData): TreeStats {
  return useMemo(() => {
    const people = Object.values(graph.people)
    const families = Object.values(graph.families)
    const mediaEntries = Object.values(graph.media)
    const n = people.length

    // ── Périmètre ────────────────────────────────────────────────────────────

    const totalPeople = n
    const totalFamilies = families.length

    // Lieux uniques toutes sources confondues
    const allPlaces = new Set(
      people
        .flatMap((p) => p.events)
        .map((e) => e.placeBrut)
        .filter((p): p is string => Boolean(p)),
    )
    const totalPlaces = allPlaces.size

    // Sources = events avec sourcePage ou sourceQuay
    const allEvents = people.flatMap((p) => p.events)
    const sourcesLinked = allEvents.filter(
      (e) => e.sourcePage !== undefined || e.sourceQuay !== undefined,
    ).length

    // Connectivité
    // "Isolé" = pas lié par le sang à sosaReferencePersonId
    // et pas conjoint d'une personne liée par le sang
    const linkedIds = buildBloodAndSpousesSet(graph, treeSettings.sosaReferencePersonId)
    const isolated = people.filter((p) => !linkedIds.has(p.id))
    const isolatedPeople = isolated.length
    const connectedPeople = n - isolatedPeople

    // Ancêtre le plus ancien
    const withBirthYear = people
      .map((p) => ({ p, year: getYear(getBirth(p)?.date) }))
      .filter((x): x is { p: FamilyGraphPerson; year: number } => x.year !== undefined)
      .sort((a, b) => a.year - b.year)

    const oldestAncestor =
      withBirthYear.length > 0
        ? { name: fullName(withBirthYear[0].p), year: withBirthYear[0].year }
        : null

    // ── Complétude ────────────────────────────────────────────────────────────

    const withBirthDate = people.filter((p) => getBirth(p)?.date).length
    const withBirthPlace = people.filter((p) => getBirth(p)?.placeBrut).length
    const withDeath = people.filter((p) => getDeath(p)).length
    const withParents = people.filter((p) => p.famcIds.length > 0).length
    const withSource = people.filter(hasAnySource).length
    const withMedia = people.filter((p) => p.mediaIds.length > 0).length

    // ── Sources par type (heuristique sur sourcePage) ─────────────────────────
    // On cherche des mots-clés dans les sourcePage pour catégoriser

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

    const totalMedia = mediaEntries.length
    const totalPhotos = mediaEntries.filter((m) =>
      /jpe?g|png|gif|webp/i.test(m.form ?? m.title ?? ''),
    ).length
    const totalScans = mediaEntries.filter((m) =>
      /pdf/i.test(m.form ?? m.title ?? ''),
    ).length
    const peopleWithoutPhoto = people.filter(
      (p) => p.mediaIds.length === 0,
    ).length

    // ── Occupations & patronymes ──────────────────────────────────────────────

    const occupations = new Set(
      people.map((p) => p.occupation).filter((o): o is string => Boolean(o)),
    )
    const lastNames = new Set(
      people.map((p) => p.lastName).filter((l): l is string => Boolean(l)),
    )

    // ── Backlog ───────────────────────────────────────────────────────────────

    const peopleWithoutParents = people.filter(
      (p) => p.famcIds.length === 0,
    ).length
    const peopleWithoutSource = people.filter((p) => !hasAnySource(p)).length

    // ─────────────────────────────────────────────────────────────────────────

    return {
      // Périmètre
      totalPeople,
      totalFamilies,
      totalGenerations: 9,           // STATIQUE
      totalSources: sourcesLinked,
      totalPlaces,
      totalBranches: 12,             // STATIQUE

      // Connectivité
      connectedPeople,
      isolatedPeople,
      oldestAncestor,
      deepestLineage: 9,             // STATIQUE

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
      sourcesUnused: 17,             // STATIQUE
      sourcesUnvalidated: 9,         // STATIQUE

      // Médias
      totalPhotos,
      totalScans,
      totalMedia,
      unidentifiedPhotos: 18,        // STATIQUE
      sourcesWithoutTranscription: 22, // STATIQUE
      audioMemories: 7,              // STATIQUE
      peopleWithoutPhoto,

      // Occupations & histoire
      totalOccupations: occupations.size,
      totalLastNames: lastNames.size,
      totalMigrations: 9,            // STATIQUE
      historicalEvents: 6,           // STATIQUE

      // Backlog
      peopleWithoutParents,
      peopleWithoutSource,
      actsToFind: 14,                // STATIQUE
      openLeads: 9,                  // STATIQUE
      unexploredBranches: 5,         // STATIQUE

      // Qualité — tous statiques (algorithmes dédiés à écrire)
      chronologicalInconsistencies: 12, // STATIQUE
      potentialDuplicates: 8,           // STATIQUE
      weakFiliations: 23,               // STATIQUE
      ambiguousPlaces: 6,               // STATIQUE
    }
  }, [graph])
}