import { formatGedcomDate, type FamilyGraphPerson, type GedcomDate, type GedcomPlace } from "@geniius/utils/family-graph"
import { formatGedcomPlace } from "@geniius/utils/family-graph-utils"

export function getInitials(person: FamilyGraphPerson) {
  const first = formatFirstName(person.firstName).charAt(0)
  const last  = person.lastName && person.lastName.trim() !== '? SANS NOM'
    ? person.lastName.charAt(0) : ''
  return `${first}${last}`.toUpperCase() || '·'
}

export function formatDisplayName(person: FamilyGraphPerson) {
  const last  = person.lastName && person.lastName.trim() !== '? SANS NOM' ? person.lastName : ''
  const first = formatFirstName(person.firstName)
  const nick  = person.nickname
    ? `${person.sex === 'F' ? 'dite' : 'dit'} ${person.nickname}` : ''
  return [last, first, nick].filter(Boolean).join(' ') || 'Individu sans nom'
}

export function formatShortName(person: FamilyGraphPerson) {
  const last  = person.lastName && person.lastName.trim() !== '? SANS NOM' ? person.lastName : ''
  const first = formatFirstName(person.firstName)
  return [first, last].filter(Boolean).join(' ') || 'Individu sans nom'
}

export function formatFirstName(firstName?: string) {
  if (!firstName) return ''
  const trimmed     = firstName.trim()
  const quotedMatch = trimmed.match(/"([^"]+)"/)
  if (quotedMatch?.[1]) return quotedMatch[1]
  return trimmed.split(/\s+/)[0] ?? trimmed
}

export function formatFullFirstName(firstName?: string) {
  return firstName?.trim() ?? ''
}

// ── Helpers de date ───────────────────────────────────────────────────────────

/**
 * Formate une GedcomDate pour l'affichage dans l'UI.
 * Retourne une chaîne vide si pas de date.
 */
export function fmtDate(date?: GedcomDate): string {
  if (!date) return ''
  return formatGedcomDate(date)
}

/**
 * Ligne de résumé d'un événement : "20 déc. 1848 - Le Gosier"
 */
export function formatEventLine(
  date?: GedcomDate,
  place?: GedcomPlace | string,
): string {
  const datePart  = fmtDate(date)
  const placePart = formatPlace(place)
  if (datePart && placePart) return `${datePart} - ${placePart}`
  return datePart || placePart
}

export function formatPlace(place?: GedcomPlace | string): string {
  if (!place) return ''
  if (typeof place === 'string') return place
  return formatGedcomPlace(place)
}