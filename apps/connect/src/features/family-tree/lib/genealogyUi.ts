// genealogyUi.ts

import type { PersonSummary } from "../types";

export function anonymizePerson(person: PersonSummary): PersonSummary {
  if (person.canDisplay) return person;

  return {
    ...person,
    firstName: "Personne",
    lastName: "privée",
    nickname: undefined,
    photoSrc: undefined,
    birthYear: undefined,
    deathYear: undefined,
    birthPlace: undefined,
    deathPlace: undefined,
    linkedSpouseLabel: undefined,
    spouseRoleLabel: undefined,
    branch: undefined,
  };
}

export function formatYears(person: PersonSummary) {
  const { birthYear, deathYear, isPossiblyAlive } = person;

  if (!birthYear && !deathYear) return null;

  if (birthYear && deathYear) {
    return `${birthYear} - ${deathYear}`;
  }

  if (!isPossiblyAlive) {
    return `${birthYear ?? "?"} - ?`;
  }

  return birthYear ?? "?";
}

type ParsedPlace = {
  city?: string;
  department?: string;
  region?: string;
  country?: string;
};

function cleanPart(value?: string): string | undefined {
  const s = value?.trim();
  if (!s || s === "?") return undefined;
  return s;
}

function parsePlace(place?: string): ParsedPlace | null {
  if (!place) return null;

  const parts = place.split(",").map((p) => cleanPart(p));

  if (parts.length >= 5) {
    return {
      city: parts[0],
      department: parts[2],
      region: parts[3],
      country: parts[4],
    };
  }

  if (parts.length === 4) {
    return {
      city: parts[0],
      department: parts[1],
      region: parts[2],
      country: parts[3],
    };
  }

  if (parts.length === 3) {
    return {
      city: parts[0],
      region: parts[1],
      country: parts[2],
    };
  }

  if (parts.length === 2) {
    return {
      city: parts[0],
      country: parts[1],
    };
  }

  if (parts.length === 1) {
    return { city: parts[0] };
  }

  return null;
}

function normalizeTerritory(place: ParsedPlace | null): ParsedPlace | null {
  if (!place) return null;

  const dep = place.department?.toLowerCase();
  const reg = place.region?.toLowerCase();
  const country = place.country?.toLowerCase();

  if (dep === "réunion" && reg === "réunion" && country === "france") {
    return {
      ...place,
      department: undefined,
      region: undefined,
      country: "LA RÉUNION",
    };
  }

  if (dep === "guadeloupe" && reg === "guadeloupe" && country === "france") {
    return {
      ...place,
      department: undefined,
      region: undefined,
      country: "GUADELOUPE",
    };
  }

  return place;
}

function same(a?: string, b?: string): boolean {
  return (a ?? "").toLowerCase() === (b ?? "").toLowerCase();
}

function shouldDisplayCountry(place: ParsedPlace): boolean {
  return Boolean(place.country && place.country !== "LA RÉUNION");
}

function pickSingle(place: ParsedPlace | null): string | null {
  if (!place) return null;

  if (place.city) {
    return shouldDisplayCountry(place)
      ? [place.city, place.country].filter(Boolean).join(", ")
      : place.city;
  }

  return place.department ?? place.region ?? place.country ?? null;
}

export function formatPlaceTransition(
  birthPlace?: string,
  currentPlace?: string,
  deathPlace?: string,
): string | null {
  const birth = normalizeTerritory(parsePlace(birthPlace));
  const current = normalizeTerritory(parsePlace(currentPlace));
  const death = normalizeTerritory(parsePlace(deathPlace));

  const places = [birth, current, death].filter(
    (place): place is ParsedPlace => Boolean(place),
  );

  if (places.length === 0) return null;
  if (places.length === 1) return pickSingle(places[0]);

  function isSamePlace(a: ParsedPlace, b: ParsedPlace): boolean {
    return (
      same(a.city, b.city) &&
      same(a.department, b.department) &&
      same(a.region, b.region) &&
      same(a.country, b.country)
    );
  }

  const dedupedPlaces = places.filter((place, index) => {
    if (index === 0) return true;
    return !isSamePlace(place, places[index - 1]);
  });

  if (dedupedPlaces.length === 1) {
    return pickSingle(dedupedPlaces[0]);
  }

  return dedupedPlaces.map((place) => pickSingle(place) ?? "?").join(" → ");
}

export function formatLifePath(person: PersonSummary) {
  return formatPlaceTransition(person.birthPlace, person.currentPlace, person.deathPlace);
}

export function formatPersonName(person: PersonSummary) {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function toOrdinalFr(n: number, sex: string = "M") {
  if (n <= 0) return "";
  if (n === 1) return sex === "F" ? "1re" : "1er";
  return `${n}e`;
}