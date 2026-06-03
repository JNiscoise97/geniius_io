import { type GedcomDate } from './../family-graph/gedcom-date'

/** Âge maximum considéré comme plausible. Au-delà → décès non trouvé. */
const MAX_PLAUSIBLE_AGE_YEARS = 110

/**
 * Calcule et formate l'âge d'une personne à une date de référence.
 *
 * - refDate absente → aujourd'hui
 * - < 30 jours      → "N jour(s)"
 * - < 12 mois       → "N mois"
 * - sinon           → "N ans"
 *
 * Retourne '—' si le calcul est impossible.
 * Retourne 'MISSING_DEATH' si l'âge calculé dépasse MAX_PLAUSIBLE_AGE_YEARS
 * et qu'aucune date de décès n'est fournie — signal pour l'UI d'afficher
 * "D : ?" plutôt qu'un âge aberrant.
 */
export const MISSING_DEATH = 'MISSING_DEATH' as const
export type AgeResult = string | typeof MISSING_DEATH

export function calculateAge(
  birthDate?: GedcomDate,
  refDate?: GedcomDate,
): AgeResult {
  if (!birthDate || birthDate.kind === 'unknown' || birthDate.kind === 'phrase') {
    return '—'
  }

  const ref        = resolveRefDate(refDate) ?? new Date()
  const hasRefDate = Boolean(refDate)

  // ── Exact / about / estimated / calculated ────────────────────────────────
  if (
    birthDate.kind === 'exact' ||
    birthDate.kind === 'about' ||
    birthDate.kind === 'estimated' ||
    birthDate.kind === 'calculated'
  ) {
    const dur = computeDuration(birthDate.start, ref)
    if (!dur) return '—'

    if (!hasRefDate && dur.years > MAX_PLAUSIBLE_AGE_YEARS) return MISSING_DEATH

    const approx = birthDate.kind !== 'exact' || birthDate.precision === 'year'
    return approx ? `≈ ${formatDuration(dur)}` : formatDuration(dur)
  }

  // ── Before (BEF) ─────────────────────────────────────────────────────────
  if (birthDate.kind === 'before') {
    const dur = computeDuration(birthDate.start, ref)
    if (!dur) return '—'
    if (!hasRefDate && dur.years > MAX_PLAUSIBLE_AGE_YEARS) return MISSING_DEATH
    return `au moins ${formatDuration(dur)}`
  }

  // ── After (AFT) ──────────────────────────────────────────────────────────
  if (birthDate.kind === 'after') {
    const dur = computeDuration(birthDate.start, ref)
    if (!dur) return '—'
    if (!hasRefDate && dur.years > MAX_PLAUSIBLE_AGE_YEARS) return MISSING_DEATH
    return `au plus ${formatDuration(dur)}`
  }

  // ── Between / Period ──────────────────────────────────────────────────────
  if (birthDate.kind === 'between' || birthDate.kind === 'period') {
    const durStart = computeDuration(birthDate.start, ref)
    const durEnd   = computeDuration(birthDate.end,   ref)

    if (durStart && durEnd) {
      if (!hasRefDate && Math.min(durStart.years, durEnd.years) > MAX_PLAUSIBLE_AGE_YEARS) {
        return MISSING_DEATH
      }
      const [lo, hi] = durStart.totalDays < durEnd.totalDays
        ? [durStart, durEnd]
        : [durEnd, durStart]
      if (getUnit(lo) === getUnit(hi)) {
        return `entre ${formatDuration(lo)} et ${formatDuration(hi)}`
      }
      return `${formatDuration(lo)} – ${formatDuration(hi)}`
    }

    const dur = durStart ?? durEnd
    if (!dur) return '—'
    if (!hasRefDate && dur.years > MAX_PLAUSIBLE_AGE_YEARS) return MISSING_DEATH
    return `≈ ${formatDuration(dur)}`
  }

  return '—'
}

// ── Types internes ────────────────────────────────────────────────────────────

type Duration     = { totalDays: number; years: number; months: number; days: number }
type DurationUnit = 'days' | 'months' | 'years'

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveRefDate(date?: GedcomDate): Date | undefined {
  if (!date) return undefined
  const partial = date.start ?? date.end
  if (!partial?.year) return undefined
  return new Date(partial.year, (partial.month ?? 1) - 1, partial.day ?? 1)
}

function computeDuration(birth: GedcomDate['start'], ref: Date): Duration | undefined {
  if (!birth?.year) return undefined

  const birthDate = new Date(birth.year, (birth.month ?? 1) - 1, birth.day ?? 1)
  const totalDays = Math.max(0, Math.floor((ref.getTime() - birthDate.getTime()) / 86_400_000))

  let years  = ref.getFullYear() - birthDate.getFullYear()
  let months = ref.getMonth()    - birthDate.getMonth()
  let days   = ref.getDate()     - birthDate.getDate()

  if (days < 0) {
    months -= 1
    days   += new Date(ref.getFullYear(), ref.getMonth(), 0).getDate()
  }
  if (months < 0) { years -= 1; months += 12 }

  return { totalDays, years: Math.max(0, years), months, days }
}

function getUnit(dur: Duration): DurationUnit {
  if (dur.totalDays < 30) return 'days'
  if (dur.years < 1)      return 'months'
  return 'years'
}

function formatDuration(dur: Duration): string {
  if (dur.totalDays < 30) {
    const d = dur.days || dur.totalDays || 0
    return `${d} jour${d > 1 ? 's' : ''}`
  }
  if (dur.years < 1) {
    const m = dur.months
    if (m < 3 && dur.days > 0) return `${m} mois et ${dur.days} jour${dur.days > 1 ? 's' : ''}`
    return `${m} mois`
  }
  return `${dur.years} an${dur.years > 1 ? 's' : ''}`
}