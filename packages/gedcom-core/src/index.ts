/**
 * Public API for @geniius/gedcom-core.
 *
 * Objectif:
 * - Exposer une API simple aux apps (Rebond/Echo/Gedcom Manager).
 * - Ne pas exposer les types internes GEDCOM (AST) si possible.
 *
 * Fonctions à exposer (cibles):
 * - parseGedcom(text): ParsedGedcom
 * - toCanonicalBundle(parsed): CanonicalBundle
 * - exportRebond(bundle): RebondPayload
 * - exportEcho(bundle): EchoPayload
 * - exportJson(bundle): any
 * - hashCanonicalBundle(bundle): string
 * - diffBundles(a,b): DiffResult
 */

// EXTRACT
export * from "./extract/parser";

// TRANSFORM
export * from "./transform/toCanonical";

// EXPORT (LOAD)
export * from "./export/rebond";
export * from "./export/echo";
export * from "./export/json";

// CANONICAL helpers
export * from "./canonical/hasher";
export * from "./canonical/indexes";

// DIFF
export * from "./diff/diff";
export * from "./diff/patch";
