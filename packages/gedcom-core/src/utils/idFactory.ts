/**
 * Génération d'IDs stables (fallback).
 *
 * Objectif:
 * - Quand un hash "content-based" est impossible/ambigu,
 *   fournir des IDs stables (namespace + counter + seed)
 *
 * Fonctions à implémenter:
 * - createIdFactory(seed: string): { next(ns: string): string }
 */
export function createIdFactory(_seed: string) {
  // TODO: impl
  return {
    next: (_ns: string) => ""
  };
}
