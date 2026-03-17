/// <reference types="node" />

import fs from "fs";
import path from "path";

type GedcomSex = "M" | "F" | "U";

type FamilyGraphPerson = {
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

type FamilyGraphFamily = {
  id: string;
  husbandId?: string;
  wifeId?: string;
  childIds: string[];
};

type FamilyGraphData = {
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

type FamilyIndexes = {
  familiesByChildId: Map<string, FamilyGraphFamily[]>;
  familiesByParentId: Map<string, FamilyGraphFamily[]>;
};

function normalizeId(raw: string): string {
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

function buildGraphFromGedcomText(gedcomText: string): FamilyGraphData {
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

function buildFamilyIndexes(graph: FamilyGraphData): FamilyIndexes {
  const familiesByChildId = new Map<string, FamilyGraphFamily[]>();
  const familiesByParentId = new Map<string, FamilyGraphFamily[]>();

  function pushToMap(
    map: Map<string, FamilyGraphFamily[]>,
    key: string,
    family: FamilyGraphFamily,
  ) {
    const existing = map.get(key);
    if (existing) {
      existing.push(family);
    } else {
      map.set(key, [family]);
    }
  }

  for (const family of Object.values(graph.families)) {
    for (const childId of family.childIds) {
      pushToMap(familiesByChildId, childId, family);
    }

    if (family.husbandId) {
      pushToMap(familiesByParentId, family.husbandId, family);
    }

    if (family.wifeId) {
      pushToMap(familiesByParentId, family.wifeId, family);
    }
  }

  return {
    familiesByChildId,
    familiesByParentId,
  };
}

function collectAncestorIds(
  graph: FamilyGraphData,
  rootPersonId: string,
  indexes: FamilyIndexes,
): Set<string> {
  if (!graph.people[rootPersonId]) {
    throw new Error(`Personne racine introuvable: ${rootPersonId}`);
  }

  const ancestorIds = new Set<string>();
  const queue: string[] = [rootPersonId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (ancestorIds.has(currentId)) continue;

    ancestorIds.add(currentId);

    const parentFamilies = indexes.familiesByChildId.get(currentId) ?? [];
    for (const family of parentFamilies) {
      if (family.husbandId && !ancestorIds.has(family.husbandId)) {
        queue.push(family.husbandId);
      }
      if (family.wifeId && !ancestorIds.has(family.wifeId)) {
        queue.push(family.wifeId);
      }
    }
  }

  return ancestorIds;
}

function collectDescendantIdsFromSeeds(
  indexes: FamilyIndexes,
  seedIds: Iterable<string>,
): Set<string> {
  const descendantIds = new Set<string>();
  const queue = Array.from(seedIds);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (descendantIds.has(currentId)) continue;

    descendantIds.add(currentId);

    const childFamilies = indexes.familiesByParentId.get(currentId) ?? [];
    for (const family of childFamilies) {
      for (const childId of family.childIds) {
        if (!descendantIds.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }

  return descendantIds;
}

function collectBloodRelativeIds(
  graph: FamilyGraphData,
  rootPersonId: string,
): Set<string> {
  const indexes = buildFamilyIndexes(graph);
  const ancestorIds = collectAncestorIds(graph, rootPersonId, indexes);

  return collectDescendantIdsFromSeeds(indexes, ancestorIds);
}

function collectSpouseIdsForBloodPeople(
  graph: FamilyGraphData,
  bloodIds: Set<string>,
): Set<string> {
  const spouseIds = new Set<string>();

  for (const family of Object.values(graph.families)) {
    const { husbandId, wifeId } = family;

    if (husbandId && wifeId) {
      const husbandIsBlood = bloodIds.has(husbandId);
      const wifeIsBlood = bloodIds.has(wifeId);

      if (husbandIsBlood && !wifeIsBlood && graph.people[wifeId]) {
        spouseIds.add(wifeId);
      }

      if (wifeIsBlood && !husbandIsBlood && graph.people[husbandId]) {
        spouseIds.add(husbandId);
      }
    }
  }

  return spouseIds;
}

function collectDirectDescendantIds(
  graph: FamilyGraphData,
  rootPersonId: string,
): Set<string> {
  if (!graph.people[rootPersonId]) {
    return new Set<string>();
  }

  const indexes = buildFamilyIndexes(graph);
  return collectDescendantIdsFromSeeds(indexes, [rootPersonId]);
}

function assignBranches(
  graph: FamilyGraphData,
  branchRootIds: string[],
): FamilyGraphData {
  const descendantIdsByBranch = new Map<string, Set<string>>();

  for (const branchRootId of branchRootIds) {
    descendantIdsByBranch.set(
      branchRootId,
      collectDirectDescendantIds(graph, branchRootId),
    );
  }

  for (const person of Object.values(graph.people)) {
    const branches: string[] = [];

    for (const branchRootId of branchRootIds) {
      const descendantIds = descendantIdsByBranch.get(branchRootId);
      if (descendantIds?.has(person.id)) {
        branches.push(branchRootId);
      }
    }

    if (branches.length > 0) {
      person.branch = branches;
    }
  }

  return graph;
}

function filterGraphToBloodRelativesAndSpouses(
  graph: FamilyGraphData,
  rootPersonId: string,
): FamilyGraphData {
  const bloodIds = collectBloodRelativeIds(graph, rootPersonId);
  const spouseIds = collectSpouseIdsForBloodPeople(graph, bloodIds);
  const keptIds = new Set<string>([...bloodIds, ...spouseIds]);

  const filteredFamilies: Record<string, FamilyGraphFamily> = {};

  for (const [familyId, family] of Object.entries(graph.families)) {
    const husbandKept = family.husbandId ? keptIds.has(family.husbandId) : false;
    const wifeKept = family.wifeId ? keptIds.has(family.wifeId) : false;
    const keptChildren = family.childIds.filter((childId) => keptIds.has(childId));

    if (!husbandKept && !wifeKept && keptChildren.length === 0) {
      continue;
    }

    filteredFamilies[familyId] = {
      id: family.id,
      husbandId: husbandKept ? family.husbandId : undefined,
      wifeId: wifeKept ? family.wifeId : undefined,
      childIds: keptChildren,
    };
  }

  const filteredPeople: Record<string, FamilyGraphPerson> = {};

  for (const [personId, person] of Object.entries(graph.people)) {
    if (!keptIds.has(personId)) continue;

    filteredPeople[personId] = {
      ...person,
      famcIds: person.famcIds.filter((famId) => Boolean(filteredFamilies[famId])),
      famsIds: person.famsIds.filter((famId) => Boolean(filteredFamilies[famId])),
    };
  }

  return {
    people: filteredPeople,
    families: filteredFamilies,
  };
}

function main(): void {
  const rootDir = process.cwd();
  const inputPath = path.resolve(
    rootDir,
    "data/Jordan Michel Nisçoise-Export.ged",
  );
  const outputPath = path.resolve(
    rootDir,
    "src/features/family-tree/data/family-graph.generated.json",
  );

  const rootAncestorId = "7398";
  const branchRootIds = ["731452", "732469", "7391", "732470", "732467"];

  const gedcomText = fs.readFileSync(inputPath, "utf8");
  const fullGraph = buildGraphFromGedcomText(gedcomText);
  const filteredGraph = filterGraphToBloodRelativesAndSpouses(
    fullGraph,
    rootAncestorId,
  );
  const graph = assignBranches(filteredGraph, branchRootIds);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2), "utf8");

  console.log(
    `GEDCOM converti et filtré depuis ${rootAncestorId} : ${Object.keys(graph.people).length} personnes, ${Object.keys(graph.families).length} familles`,
  );
  console.log(`Fichier généré : ${outputPath}`);
}

main();