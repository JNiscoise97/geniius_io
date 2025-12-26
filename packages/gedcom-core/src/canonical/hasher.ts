/**
 * Hash stable du CanonicalBundle.
 *
 * Objectif:
 * - Produire une empreinte stable pour historisation/diff
 * - IMPORTANT: ne pas inclure les indexes générables à la volée
 *
 * Fonctions à implémenter:
 * - hashCanonicalBundle(bundle: CanonicalBundle): string (sha256)
 * - stableStringify(obj): string (tri des clés)
 */
export function hashCanonicalBundle(_bundle: unknown): string {
  // TODO: impl sha256 stable
  return "";
}
