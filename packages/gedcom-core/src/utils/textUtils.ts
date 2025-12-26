/**
 * Helpers texte.
 *
 * Objectif:
 * - trim/normalize spaces
 * - remove diacritics (optionnel)
 * - uppercase locale-safe (optionnel)
 *
 * Fonctions à implémenter:
 * - cleanSpaces(s: string): string
 * - stripDiacritics(s: string): string
 */
export function cleanSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
