// src/features/family-knowledge/lib/findMeMatching.ts

import type {
  FamilyGraphData,
  PersonContext,
  PersonSummary,
} from "../types";
import { buildPersonContext } from "../api/buildPersonContext";

export type FindMeAnswers = {
  firstName?: string;
  lastName?: string;
  birthYear?: string;
  birthPlace?: string;
  fatherQuery?: string;
  motherQuery?: string;
  grandparentQuery1?: string;
  grandparentQuery2?: string;
  grandparentQuery3?: string;
  grandparentQuery4?: string;
};

export type FindMeCandidateReason = {
  label: string;
  matched: boolean;
  weight: number;
};

export type FindMeCandidate = {
  person: PersonSummary;
  context: PersonContext;
  score: number;
  confidenceLabel: "très fort" | "fort" | "moyen" | "faible";
  reasons: FindMeCandidateReason[];
};

function normalize(value?: string | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function tokenize(value?: string | null): string[] {
  return normalize(value)
    .split(/[\s,'’"-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function includesNormalized(haystack?: string | null, needle?: string | null): boolean {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!h || !n) return false;
  return h.includes(n);
}

function equalsNormalized(a?: string | null, b?: string | null): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return Boolean(na && nb && na === nb);
}

function wordsOverlap(a?: string | null, b?: string | null): boolean {
  const aa = tokenize(a);
  const bb = tokenize(b);
  if (aa.length === 0 || bb.length === 0) return false;
  return aa.some((token) => bb.includes(token));
}

function personMatchesQuery(person: PersonSummary, query?: string): boolean {
  if (!query?.trim()) return false;

  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const reversed = `${person.lastName} ${person.firstName}`.trim();

  return (
    includesNormalized(fullName, query) ||
    includesNormalized(reversed, query) ||
    includesNormalized(person.nickname, query) ||
    wordsOverlap(fullName, query)
  );
}

function personListMatchesQuery(persons: PersonSummary[], query?: string): boolean {
  if (!query?.trim()) return false;
  return persons.some((person) => personMatchesQuery(person, query));
}

function computeConfidenceLabel(score: number): FindMeCandidate["confidenceLabel"] {
  if (score >= 85) return "très fort";
  if (score >= 65) return "fort";
  if (score >= 40) return "moyen";
  return "faible";
}

function scoreCandidate(context: PersonContext, answers: FindMeAnswers): FindMeCandidate {
  const person = context.person;
  const reasons: FindMeCandidateReason[] = [];
  let score = 0;

  const addReason = (label: string, matched: boolean, weight: number) => {
    reasons.push({ label, matched, weight });
    if (matched) score += weight;
  };

  const firstNameMatched =
    equalsNormalized(person.firstName, answers.firstName) ||
    includesNormalized(person.firstName, answers.firstName);
  addReason("Prénom", Boolean(answers.firstName?.trim()) && firstNameMatched, 22);

  const lastNameMatched =
    equalsNormalized(person.lastName, answers.lastName) ||
    includesNormalized(person.lastName, answers.lastName);
  addReason("Nom", Boolean(answers.lastName?.trim()) && lastNameMatched, 18);

  const birthYearMatched =
    Boolean(answers.birthYear?.trim()) &&
    normalize(person.birthYear) === normalize(answers.birthYear);
  addReason("Année de naissance", birthYearMatched, 12);

  const birthPlaceMatched =
    Boolean(answers.birthPlace?.trim()) &&
    (includesNormalized(person.birthPlace, answers.birthPlace) ||
      wordsOverlap(person.birthPlace, answers.birthPlace));
  addReason("Lieu de naissance", birthPlaceMatched, 10);

  const fatherMatched =
    personListMatchesQuery(
      context.parents.filter((p) => p.sex === "M" || p.subtitle.toLowerCase().includes("parent")),
      answers.fatherQuery,
    );
  addReason("Père", Boolean(answers.fatherQuery?.trim()) && fatherMatched, 30);

  const motherMatched =
    personListMatchesQuery(
      context.parents.filter((p) => p.sex === "F" || p.subtitle.toLowerCase().includes("parent")),
      answers.motherQuery,
    );
  addReason("Mère", Boolean(answers.motherQuery?.trim()) && motherMatched, 30);

  const grandparentQueries = [
    answers.grandparentQuery1,
    answers.grandparentQuery2,
    answers.grandparentQuery3,
    answers.grandparentQuery4,
  ].filter((value): value is string => Boolean(value?.trim()));

  grandparentQueries.forEach((query, index) => {
    const matched = personListMatchesQuery(context.grandparents, query);
    addReason(`Grand-parent ${index + 1}`, matched, 14);
  });

  if (
    answers.firstName?.trim() &&
    !firstNameMatched &&
    answers.lastName?.trim() &&
    !lastNameMatched
  ) {
    score -= 10;
  }

  return {
    person,
    context,
    score,
    confidenceLabel: computeConfidenceLabel(score),
    reasons,
  };
}

export function findMeCandidates(
  graph: FamilyGraphData,
  answers: FindMeAnswers,
  options?: { limit?: number; minScore?: number },
): FindMeCandidate[] {
  const limit = options?.limit ?? 8;
  const minScore = options?.minScore ?? 15;

  const candidates = Object.keys(graph.people)
    .map((personId) => buildPersonContext(personId, graph))
    .map((context) => scoreCandidate(context, answers))
    .filter((candidate) => candidate.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aYear = Number(a.person.birthYear ?? "0");
      const bYear = Number(b.person.birthYear ?? "0");
      if (!Number.isNaN(aYear) && !Number.isNaN(bYear) && bYear !== aYear) {
        return bYear - aYear;
      }

      return `${a.person.lastName} ${a.person.firstName}`.localeCompare(
        `${b.person.lastName} ${b.person.firstName}`,
        "fr",
      );
    })
    .slice(0, limit);

  return candidates;
}

export function getFindMeSuggestions(
  graph: FamilyGraphData,
  query: string,
  options?: { limit?: number },
): PersonSummary[] {
  const limit = options?.limit ?? 6;
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) return [];

  return Object.values(graph.people)
    .map((person) => buildPersonContext(person.id, graph).person)
    .filter((person) => {
      const fullName = `${person.firstName} ${person.lastName}`.trim();
      return (
        includesNormalized(fullName, normalizedQuery) ||
        includesNormalized(person.nickname, normalizedQuery) ||
        wordsOverlap(fullName, normalizedQuery)
      );
    })
    .sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, "fr"),
    )
    .slice(0, limit);
}