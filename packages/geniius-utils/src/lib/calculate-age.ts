import { type GedcomDate } from './../family-graph/gedcom-date'

/**
 * Calcule et formate l'âge d'une personne à une date de référence.
 *
 * - refDate absente → aujourd'hui
 * - < 30 jours      → "N jour(s)"
 * - < 12 mois       → "N mois"
 * - sinon           → "N ans" (avec préfixe ≈ / au moins / au plus / entre…)
 *
 * Ne produit JAMAIS le suffixe "au décès" — c'est à l'appelant de décider
 * comment présenter l'âge selon le contexte.
 */
export function calculateAge(
  birthDate?: GedcomDate,
  refDate?: GedcomDate,
): string {
  if (!birthDate || birthDate.kind === 'unknown' || birthDate.kind === 'phrase') {
    return '—'
  }

  const ref = resolveRefDate(refDate) ?? new Date()

  // ── Exact / about / estimated / calculated ────────────────────────────────
  if (
    birthDate.kind === 'exact' ||
    birthDate.kind === 'about' ||
    birthDate.kind === 'estimated' ||
    birthDate.kind === 'calculated'
  ) {
    const dur = computeDuration(birthDate.start, ref)
    if (!dur) return '—'

    const approx =
      birthDate.kind !== 'exact' ||
      birthDate.precision === 'year'

    const label = formatDuration(dur)
    return approx ? `≈ ${label}` : label
  }

  // ── Before (BEF) : né avant X → au moins X ans ───────────────────────────
  if (birthDate.kind === 'before') {
    const dur = computeDuration(birthDate.start, ref)
    if (!dur) return '—'
    return `au moins ${formatDuration(dur)}`
  }

  // ── After (AFT) : né après X → au plus X ans ─────────────────────────────
  if (birthDate.kind === 'after') {
    const dur = computeDuration(birthDate.start, ref)
    if (!dur) return '—'
    return `au plus ${formatDuration(dur)}`
  }

  // ── Between / Period ──────────────────────────────────────────────────────
  if (birthDate.kind === 'between' || birthDate.kind === 'period') {
    const durStart = computeDuration(birthDate.start, ref)
    const durEnd   = computeDuration(birthDate.end,   ref)

    if (durStart && durEnd) {
      const daysStart = durStart.totalDays
      const daysEnd   = durEnd.totalDays
      const [lo, hi]  = daysStart < daysEnd
        ? [durStart, durEnd]
        : [durEnd, durStart]

      // Si les deux extrêmes sont dans la même unité, affiche "entre X et Y"
      const unitLo = getUnit(lo)
      const unitHi = getUnit(hi)
      if (unitLo === unitHi) {
        return `entre ${formatDuration(lo)} et ${formatDuration(hi)}`
      }
      return `${formatDuration(lo)} – ${formatDuration(hi)}`
    }

    const dur = durStart ?? durEnd
    if (!dur) return '—'
    return `≈ ${formatDuration(dur)}`
  }

  return '—'
}

// ── Types internes ────────────────────────────────────────────────────────────

type Duration = {
  totalDays: number
  years: number
  months: number
  days: number
}

type DurationUnit = 'days' | 'months' | 'years'

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveRefDate(date?: GedcomDate): Date | undefined {
  if (!date) return undefined
  const partial = date.start ?? date.end
  if (!partial?.year) return undefined
  return new Date(partial.year, (partial.month ?? 1) - 1, partial.day ?? 1)
}

/**
 * Calcule la durée exacte entre une date de naissance partielle et une Date JS.
 * Retourne undefined si l'année de naissance est inconnue.
 */
function computeDuration(
  birth: GedcomDate['start'],
  ref: Date,
): Duration | undefined {
  if (!birth?.year) return undefined

  const birthDate = new Date(birth.year, (birth.month ?? 1) - 1, birth.day ?? 1)

  // Durée totale en jours (approximation pour la sélection d'unité)
  const totalDays = Math.max(
    0,
    Math.floor((ref.getTime() - birthDate.getTime()) / 86_400_000),
  )

  // Calcul précis années / mois / jours
  let years  = ref.getFullYear() - birthDate.getFullYear()
  let months = ref.getMonth()    - birthDate.getMonth()
  let days   = ref.getDate()     - birthDate.getDate()

  if (days < 0) {
    months -= 1
    // Jours dans le mois précédent la ref
    const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years  -= 1
    months += 12
  }

  return { totalDays, years: Math.max(0, years), months, days }
}

function getUnit(dur: Duration): DurationUnit {
  if (dur.totalDays < 30)  return 'days'
  if (dur.years < 1)       return 'months'
  return 'years'
}

/**
 * Formate une durée en texte lisible selon son ordre de grandeur.
 *   < 30 jours  → "N jour(s)"
 *   < 12 mois   → "N mois" (+ jours si > 0 et < 3 mois)
 *   sinon       → "N ans"
 */
function formatDuration(dur: Duration): string {
  if (dur.totalDays < 30) {
    const d = dur.days || dur.totalDays || 0
    return `${d} jour${d > 1 ? 's' : ''}`
  }

  if (dur.years < 1) {
    const m = dur.months
    // Pour les nourrissons < 3 mois, précise aussi les jours
    if (m < 3 && dur.days > 0) {
      return `${m} mois et ${dur.days} jour${dur.days > 1 ? 's' : ''}`
    }
    return `${m} mois`
  }

  return `${dur.years} an${dur.years > 1 ? 's' : ''}`
}