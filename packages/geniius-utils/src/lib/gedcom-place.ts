// src/lib/gedcomPlace.ts

import { type GedcomPlace } from "../family-graph/gedcom-parser"

export function formatGedcomPlace(place?: GedcomPlace | string): string {
  if (!place) return ''
  if (typeof place === 'string') return place.trim()

  const town = clean(place.town)
  const county = clean(place.county)
  const country = normalizeCountry(place)
  const subdivision = clean(place.subdivision)

  const parentParts = uniqueNonEmpty(
    county && country && equalsIgnoreAccents(county, country)
      ? [country]
      : [county, country],
  )

  const main =
    town && parentParts.length > 0
      ? `${town} (${parentParts.join(', ')})`
      : town || parentParts.join(', ')

  return [main, subdivision].filter(Boolean).join(', ')
}

function normalizeCountry(place: GedcomPlace): string {
  const region = clean(place.region)

  if (equalsIgnoreAccents(region, 'Guadeloupe')) {
    return 'GUADELOUPE'
  }

  if (
    equalsIgnoreAccents(region, 'Réunion') ||
    equalsIgnoreAccents(region, 'La Réunion')
  ) {
    return 'RÉUNION'
  }

  return clean(place.country)
}

function clean(value?: string): string {
  return value?.trim() ?? ''
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>()

  return values.filter((value) => {
    if (!value) return false

    const key = normalizeForCompare(value)
    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

function equalsIgnoreAccents(a?: string, b?: string): boolean {
  return normalizeForCompare(a) === normalizeForCompare(b)
}

function normalizeForCompare(value?: string): string {
  return clean(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}