// src/features/family-knowledge/lib/genealogyUi.ts

import type { PersonSummary } from "../types";

export function anonymizePerson(person: PersonSummary): PersonSummary {
  if (!person.hidden) return person;

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
  deathPlace?: string,
): string | null {
  const birth = normalizeTerritory(parsePlace(birthPlace));
  const death = normalizeTerritory(parsePlace(deathPlace));

  if (!birth && !death) return null;
  if (!birth) return pickSingle(death);
  if (!death) return pickSingle(birth);

  const sameCountry = same(birth.country, death.country);
  const sameRegion = same(birth.region, death.region);
  const sameDepartment = same(birth.department, death.department);
  const sameCity = same(birth.city, death.city);

  if (sameCity && sameDepartment && sameRegion && sameCountry) {
    return pickSingle(birth);
  }

  const birthLocal = pickSingle(birth) ?? "?";
  const deathLocal = pickSingle(death) ?? "?";

  if (sameDepartment && sameRegion && sameCountry) {
    return `${birthLocal} → ${deathLocal}`;
  }

  if (sameRegion && sameCountry) {
    return `${birthLocal} → ${deathLocal}`;
  }

  if (sameCountry) {
    return `${birthLocal} → ${deathLocal}`;
  }

  return `${birthLocal} → ${deathLocal}`;
}

export function formatLifePath(person: PersonSummary) {
  return formatPlaceTransition(person.birthPlace, person.deathPlace);
}

export function formatPersonName(person: PersonSummary) {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function toOrdinalFr(n: number, sex: string = "M") {
  if (n <= 0) return "";
  if (n === 1) return sex === "F" ? "1re" : "1er";
  return `${n}e`;
}