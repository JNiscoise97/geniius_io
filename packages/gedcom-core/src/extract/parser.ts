/**
 * Parser GEDCOM: tokens -> AST interne (arbre de noeuds).
 *
 * Objectif:
 * - Construire une structure hiérarchique (level nesting).
 * - Conserver raw tags/values pour debug.
 * - Produire aussi un index des XREF si possible.
 *
 * Fonctions à implémenter:
 * - parseGedcom(text: string): ParsedGedcom
 * - parseTokens(tokens: Iterable<GedcomToken>): GedcomNode[] (ou root)
 */
import type { GedcomToken, GedcomNode, ParsedGedcom } from "./astTypes";
import { lexGedcomLines } from "./lexer";

export function parseGedcom(_text: string): ParsedGedcom {
  // TODO: impl (text -> lines -> tokens -> tree + xref index)
  const tokens = lexGedcomLines([]);
  const root: GedcomNode[] = parseTokens(tokens);
  return { root, xrefIndex: { indi: {}, fam: {}, sour: {}, obje: {} } };
}

export function parseTokens(_tokens: Iterable<GedcomToken>): GedcomNode[] {
  // TODO: impl (stack by level)
  return [];
}
