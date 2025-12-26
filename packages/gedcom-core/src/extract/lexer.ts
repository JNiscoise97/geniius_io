/**
 * Lexer GEDCOM: transforme un flux de lignes en tokens.
 *
 * Objectif:
 * - Lire des lignes GEDCOM "LEVEL TAG [VALUE]" et produire des tokens typés.
 * - Gérer CONC/CONT au niveau token si utile (ou plus tard via builder).
 *
 * Fonctions à implémenter:
 * - lexGedcomLines(lines: Iterable<string>): Iterable<GedcomToken>
 * - parseLine(line: string): GedcomToken | null
 *
 * Notes:
 * - Garder ça streaming-friendly (ne pas tout charger en mémoire).
 */
import type { GedcomToken } from "./astTypes";

export function lexGedcomLines(_lines: Iterable<string>): Iterable<GedcomToken> {
  // TODO: impl
  return [];
}
