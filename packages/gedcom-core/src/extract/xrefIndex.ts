/**
 * Construction d'un index de pointeurs GEDCOM.
 *
 * Objectif:
 * - Permettre la résolution rapide des @I..@ @F..@ @S..@ @M..@
 * - Isoler la logique d'indexation pour tests et performance.
 *
 * Fonctions à implémenter:
 * - buildXrefIndex(root: GedcomNode[]): XrefIndex
 * - detectRecordType(node): "indi"|"fam"|"sour"|"obje"|null
 */
import type { GedcomNode, XrefIndex } from "./astTypes";

export function buildXrefIndex(_root: GedcomNode[]): XrefIndex {
  // TODO: impl
  return { indi: {}, fam: {}, sour: {}, obje: {} };
}
