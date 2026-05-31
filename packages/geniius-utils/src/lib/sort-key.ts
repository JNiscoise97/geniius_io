import { type GedcomDate } from './../family-graph'

/**
 * Retourne une clé de tri numérique pour un GedcomEvent.
 *
 * Stratégie : on veut toujours comparer sur la même base AAAAMMJJ.
 * - Année seule     "1848"         → 18480101
 * - Mois + année    "1848-12"      → 18481201
 * - Jour complet    "1848-12-20"   → 18481220  (précision: day)
 *
 * Pour between/period on prend le milieu de la fourchette.
 * Les dates sans année sont rejetées à Infinity (fin de liste).
 */
export function sortKey(date: GedcomDate | undefined): number {
  if (!date) return Infinity

  // ── between / period : milieu de fourchette ────────────────────────────
  if (date.kind === 'between' || date.kind === 'period') {
    const startKey = partialToKey(date.start)
    const endKey   = partialToKey(date.end)

    if (startKey !== undefined && endKey !== undefined) {
      return Math.round((startKey + endKey) / 2)
    }
    return startKey ?? endKey ?? Infinity
  }

  // ── Tous les autres kinds : on prend start, sinon end ─────────────────
  return partialToKey(date.start) ?? partialToKey(date.end) ?? Infinity
}

/**
 * Convertit un GedcomPartialDate en entier AAAAMMJJ normalisé.
 * - Année seule  → AAAA0101
 * - Mois + année → AAAAMM01
 * - Complet      → AAAAMMJJ
 */
function partialToKey(
  p: { year?: number; month?: number; day?: number } | undefined,
): number | undefined {
  if (!p?.year) return undefined

  const y = p.year
  const m = p.month ?? 1    // pas de mois → milieu d'année
  const d = p.day   ?? 1  // pas de jour → milieu du mois

  return y * 10000 + m * 100 + d
}