/**
 * Types internes GEDCOM (non exposés aux apps).
 *
 * Objectif:
 * - Définir tokens, noeuds, et structures ParsedGedcom.
 * - Garder flexible: GEDCOM peut être sale / non standard selon producteurs.
 *
 * Types à prévoir:
 * - GedcomToken: { level, tag, value?, xref? }
 * - GedcomNode: { token, children[] }
 * - ParsedGedcom: { root, xrefIndex }
 */

export type GedcomToken = {
  level: number;
  tag: string;
  value?: string;
  xref?: string; // ex "@I123@" si présent sur la ligne
  rawLine?: string;
};

export type GedcomNode = {
  token: GedcomToken;
  children: GedcomNode[];
};

export type XrefIndex = {
  indi: Record<string, GedcomNode>;
  fam: Record<string, GedcomNode>;
  sour: Record<string, GedcomNode>;
  obje: Record<string, GedcomNode>;
};

export type ParsedGedcom = {
  root: GedcomNode[];
  xrefIndex: XrefIndex;
};
