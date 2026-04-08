// findMeCandidates.ts

import { FAMILY_GRAPH } from "../../api/loadGraph";
import { findMeCandidates, getFindMeSuggestions } from "../../lib/findMeMatching";
import type { FindMeAnswers } from "../../types/findMe";

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