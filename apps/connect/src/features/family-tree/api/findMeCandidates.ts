// src/features/family-knowledge/api/findMeCandidates.ts

import { FAMILY_GRAPH } from "./loadGraph";
import type { FindMeAnswers } from "../lib/findMeMatching";
import { findMeCandidates, getFindMeSuggestions } from "../lib/findMeMatching";

export function searchFindMeCandidates(answers: FindMeAnswers) {
  return findMeCandidates(FAMILY_GRAPH, answers, {
    limit: 8,
    minScore: 15,
  });
}

export function searchFindMeSuggestions(query: string) {
  return getFindMeSuggestions(FAMILY_GRAPH, query, {
    limit: 6,
  });
}