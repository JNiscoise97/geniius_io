/**
 * Transform principal: ParsedGedcom -> CanonicalBundle.
 *
 * Objectif:
 * - Résoudre les pointeurs @I/@F/@S/@M
 * - Normaliser noms/dates/lieux
 * - Produire un CanonicalBundle stable et versionnable
 *
 * Fonctions à implémenter:
 * - toCanonicalBundle(parsed: ParsedGedcom, opts?): CanonicalBundle
 * - extractIndividuals(parsed): Individual[]
 * - extractFamilies(parsed): Family[]
 * - extractMedia(parsed): Media[]
 * - extractSources(parsed): Source[]
 * - attachFactsAndLinks(...)
 *
 * Note:
 * - Idéalement, CanonicalBundle types viennent de @geniius/schema.
 */
import type { ParsedGedcom } from "../extract/astTypes";

export function toCanonicalBundle(_parsed: ParsedGedcom): unknown {
  // TODO: impl: return CanonicalBundle
  return { meta: {}, entities: {} };
}
