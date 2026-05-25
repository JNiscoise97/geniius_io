export type GedcomSex = "M" | "F" | "U";

export type FamilyGraphPerson = {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  sex: GedcomSex;
  birthDate?: string;
  deathDate?: string;
  birthYear?: string;
  deathYear?: string;
  birthPlace?: string;
  deathPlace?: string;
  famcIds: string[];
  famsIds: string[];
  branch?: string[];
};

export type FamilyGraphFamily = {
  id: string;
  husbandId?: string;
  wifeId?: string;
  childIds: string[];
};

export type FamilyGraphData = {
  people: Record<string, FamilyGraphPerson>;
  families: Record<string, FamilyGraphFamily>;
};

type GedcomLine = {
  level: number;
  xrefId?: string;
  tag: string;
  value?: string;
};

type ParsedGedcomName = {
  raw?: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  type?: string;
};

export function normalizeId(raw: string): string {
  return raw.replaceAll("@", "").trim().toLowerCase();
}

function yearFromDate(value?: string): string | undefined {
  if (!value) return undefined;
  const match = value.match(/\b(\d{4})\b/);
  return match?.[1];
}

function cleanValue(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function cleanPlace(value?: string): string | undefined {
  if (!value) return undefined;

  const cleaned = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  return cleaned || undefined;
}

function parseGedcomLine(line: string): GedcomLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^(\d+)\s+(?:(@[^@]+@)\s+)?([A-Z0-9_]+)(?:\s+(.*))?$/,
  );

  if (!match) return null;

  const [, levelStr, xrefId, tag, value] = match;

  return {
    level: Number(levelStr),
    xrefId,
    tag,
    value: cleanValue(value),
  };
}

function parseRawGedcomName(
  raw?: string,
): { firstName?: string; lastName?: string } {
  if (!raw) return {};

  const trimmed = raw.trim();
  const slashMatch = trimmed.match(/^(.*?)\/(.*?)\/$/);

  if (slashMatch) {
    return {
      firstName: cleanValue(slashMatch[1]),
      lastName: cleanValue(slashMatch[2]),
    };
  }

  return {
    firstName: trimmed || undefined,
    lastName: undefined,
  };
}

function parseSex(value?: string): GedcomSex {
  if (value === "M") return "M";
  if (value === "F") return "F";
  return "U";
}

function scoreName(name: ParsedGedcomName): number {
  const type = name.type?.trim().toLowerCase();

  if (!type) return 300;
  if (type === "birth") return 200;
  return 100;
}

function pickBestName(names: ParsedGedcomName[]): ParsedGedcomName | undefined {
  if (names.length === 0) return undefined;
  return [...names].sort((a, b) => scoreName(b) - scoreName(a))[0];
}

export function buildGraphFromGedcomText(gedcomText: string): FamilyGraphData {
  const lines = gedcomText
    .split(/\r?\n/)
    .map(parseGedcomLine)
    .filter((line): line is GedcomLine => Boolean(line));

  const graph: FamilyGraphData = {
    people: {},
    families: {},
  };

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.level === 0 && line.xrefId && line.tag === "INDI") {
      const personId = normalizeId(line.xrefId);

      const person: FamilyGraphPerson = {
        id: personId,
        firstName: "Nom inconnu",
        lastName: "",
        nickname: "",
        sex: "U",
        famcIds: [],
        famsIds: [],
      };

      const names: ParsedGedcomName[] = [];

      i += 1;

      let inBirth = false;
      let inDeath = false;

      while (i < lines.length && lines[i].level > 0) {
        const current = lines[i];

        if (current.level === 1) {
          inBirth = current.tag === "BIRT";
          inDeath = current.tag === "DEAT";

          if (current.tag === "NAME") {
            const nameBlock: ParsedGedcomName = {
              raw: current.value,
              ...parseRawGedcomName(current.value),
            };

            i += 1;

            while (i < lines.length && lines[i].level > 1) {
              const sub = lines[i];

              if (sub.level === 2) {
                if (sub.tag === "GIVN" && sub.value) {
                  nameBlock.firstName = sub.value;
                } else if (sub.tag === "SURN" && sub.value) {
                  nameBlock.lastName = sub.value;
                } else if (sub.tag === "NICK" && sub.value) {
                  nameBlock.nickname = sub.value;
                } else if (sub.tag === "TYPE" && sub.value) {
                  nameBlock.type = sub.value;
                }
              }

              i += 1;
            }

            names.push(nameBlock);
            continue;
          }

          if (current.tag === "SEX") {
            person.sex = parseSex(current.value);
          } else if (current.tag === "FAMC" && current.value) {
            person.famcIds.push(normalizeId(current.value));
          } else if (current.tag === "FAMS" && current.value) {
            person.famsIds.push(normalizeId(current.value));
          }

          i += 1;
          continue;
        }

        if (current.level === 2) {
          if (inBirth && current.tag === "DATE" && current.value) {
            person.birthDate = current.value;
            person.birthYear = yearFromDate(current.value);
          } else if (inBirth && current.tag === "PLAC" && current.value) {
            person.birthPlace = cleanPlace(current.value);
          } else if (inDeath && current.tag === "DATE" && current.value) {
            person.deathDate = current.value;
            person.deathYear = yearFromDate(current.value);
          } else if (inDeath && current.tag === "PLAC" && current.value) {
            person.deathPlace = cleanPlace(current.value);
          }

          i += 1;
          continue;
        }

        i += 1;
      }

      const bestName = pickBestName(names);

      if (bestName?.firstName) person.firstName = bestName.firstName;
      if (bestName?.lastName) person.lastName = bestName.lastName;
      if (bestName?.nickname) person.nickname = bestName.nickname;

      graph.people[personId] = person;
      continue;
    }

    if (line.level === 0 && line.xrefId && line.tag === "FAM") {
      const familyId = normalizeId(line.xrefId);

      const family: FamilyGraphFamily = {
        id: familyId,
        childIds: [],
      };

      i += 1;

      while (i < lines.length && lines[i].level > 0) {
        const current = lines[i];

        if (current.level === 1) {
          if (current.tag === "HUSB" && current.value) {
            family.husbandId = normalizeId(current.value);
          } else if (current.tag === "WIFE" && current.value) {
            family.wifeId = normalizeId(current.value);
          } else if (current.tag === "CHIL" && current.value) {
            family.childIds.push(normalizeId(current.value));
          }
        }

        i += 1;
      }

      graph.families[familyId] = family;
      continue;
    }

    i += 1;
  }

  return graph;
}