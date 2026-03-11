type RawTreeRow = {
  group: string;
  firstName: string;
  sex: "M" | "F";
  status: "" | "dcd";
  code: string;
};

export type MockTreePerson = {
  id: string;
  code: string;
  parentCode: string | null;
  parentId: string | null;
  firstName: string;
  name: string;
  displayName: string;
  sex: "M" | "F";
  isDeceased: boolean;
  group: string;
  generation: string;
  branchId: string;
  branchName: string;
};

export type MockTreeBranch = {
  id: string;
  name: string;
  rootPersonId: string;
  rootPersonName: string;
  peopleCount: number;
  familiesCount: number;
};

export type MockTreeFamily = {
  id: string;
  parentId: string;
  parentName: string;
  label: string;
  parentsLabel: string;
  branchId: string;
  branchName: string;
  childrenIds: string[];
  childrenCount: number;
  descendantsCount: number;
};

export const treeMockRootAncestor = {
  id: "root-tanjama",
  name: "TANJAMA",
};

const rawRows: RawTreeRow[] = [
  { group: "TANJAMA", firstName: "Mounoir", sex: "M", status: "dcd", code: "1.1" },
  { group: "TANJAMA/ROSALIE", firstName: "Stella", sex: "F", status: "dcd", code: "1.1.1" },
  { group: "ROSALIE", firstName: "Yvrin", sex: "M", status: "", code: "1.1.1.1" },
  { group: "ROSALIE", firstName: "Vincent", sex: "M", status: "", code: "1.1.1.1.1" },
  { group: "ROSALIE", firstName: "Cécile", sex: "F", status: "", code: "1.1.1.2" },
  { group: "ROSALIE", firstName: "Christelle", sex: "F", status: "", code: "1.1.1.3" },
  { group: "ROSALIE/GILBOIRE", firstName: "Catherine", sex: "F", status: "", code: "1.1.1.4" },
  { group: "GILBOIRE", firstName: "Mathieu", sex: "M", status: "", code: "1.1.1.4.1" },
  { group: "GILBOIRE", firstName: "Yonnie", sex: "M", status: "", code: "1.1.1.4.2" },
  { group: "GILBOIRE", firstName: "Anaëlle", sex: "F", status: "", code: "1.1.1.4.3" },

  { group: "TANJAMA", firstName: "Olivier", sex: "M", status: "dcd", code: "1.1.2" },
  { group: "TANJAMA", firstName: "Jean Pierre", sex: "M", status: "", code: "1.1.2.1" },
  { group: "TANJAMA", firstName: "Giovanny", sex: "M", status: "", code: "1.1.2.1.1" },
  { group: "TANJAMA", firstName: "Katty", sex: "F", status: "", code: "1.1.2.1.2" },
  { group: "TANJAMA", firstName: "Isabelle", sex: "F", status: "", code: "1.1.2.1.3" },
  { group: "TANJAMA", firstName: "Nathalie", sex: "F", status: "", code: "1.1.2.1.4" },
  { group: "TANJAMA", firstName: "Emilie", sex: "F", status: "", code: "1.1.2.1.5" },
  { group: "TANJAMA", firstName: "Esthecy", sex: "F", status: "", code: "1.1.2.1.6" },
  { group: "TANJAMA", firstName: "Esthecya", sex: "F", status: "", code: "1.1.2.1.7" },
  { group: "TANJAMA", firstName: "Marie Guylène", sex: "F", status: "", code: "1.1.2.2" },
  { group: "TANJAMA", firstName: "Jean Raymond", sex: "M", status: "", code: "1.1.2.3" },
  { group: "TANJAMA", firstName: "Cyril", sex: "M", status: "", code: "1.1.2.3.1" },
  { group: "TANJAMA", firstName: "Gabriel", sex: "M", status: "", code: "1.1.2.4" },
  { group: "TANJAMA", firstName: "Floriane", sex: "F", status: "", code: "1.1.2.4.1" },
  { group: "TANJAMA", firstName: "Laurence", sex: "F", status: "", code: "1.1.2.4.2" },
  { group: "TANJAMA", firstName: "Stéphane", sex: "M", status: "", code: "1.1.2.4.3" },
  { group: "TANJAMA", firstName: "Elodie", sex: "F", status: "", code: "1.1.2.4.4" },
  { group: "TANJAMA", firstName: "Bruno", sex: "M", status: "", code: "1.1.2.4.5" },
  { group: "TANJAMA", firstName: "Marcel", sex: "M", status: "", code: "1.1.2.5" },

  { group: "TANJAMA", firstName: "Raphaël", sex: "M", status: "", code: "1.2" },
  { group: "TANJAMA", firstName: "Tienette", sex: "F", status: "", code: "1.2.1" },
  { group: "TANJAMA", firstName: "Marie-Ange", sex: "F", status: "", code: "1.2.1.1" },
  { group: "TECHER", firstName: "Murielle", sex: "F", status: "", code: "1.2.1.1.1" },
  { group: "TECHER", firstName: "Stéphane", sex: "M", status: "", code: "1.2.1.1.2" },
  { group: "TECHER", firstName: "Teddy", sex: "M", status: "", code: "1.2.1.1.3" },
];

function getParentCode(code: string): string | null {
  const parts = code.split(".");
  if (parts.length <= 2) return null;
  return parts.slice(0, -1).join(".");
}

function getGeneration(code: string): string {
  return `G${code.split(".").length}`;
}

function makePersonId(code: string): string {
  return `person-${code.replace(/\./g, "-")}`;
}

function getTopBranchCode(code: string): string {
  const parts = code.split(".");
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : code;
}

const personByCodeSeed = new Map(
  rawRows.map((row) => [row.code, row]),
);

function getBranchNameFromCode(code: string): string {
  const topCode = getTopBranchCode(code);
  const row = personByCodeSeed.get(topCode);
  return row ? row.firstName : topCode;
}

export const treeMockPeople: MockTreePerson[] = rawRows.map((row) => {
  const parentCode = getParentCode(row.code);
  const branchCode = getTopBranchCode(row.code);
  const branchName = getBranchNameFromCode(row.code);

  return {
    id: makePersonId(row.code),
    code: row.code,
    parentCode,
    parentId: parentCode ? makePersonId(parentCode) : null,
    firstName: row.firstName,
    name: row.firstName,
    displayName: row.firstName,
    sex: row.sex,
    isDeceased: row.status === "dcd",
    group: row.group,
    generation: getGeneration(row.code),
    branchId: `branch-${branchCode.replace(/\./g, "-")}`,
    branchName,
  };
});

export const treeMockPeopleById = new Map(
  treeMockPeople.map((person) => [person.id, person]),
);

export const treeMockPeopleByCode = new Map(
  treeMockPeople.map((person) => [person.code, person]),
);

export const treeMockChildrenByParentId = new Map<string, MockTreePerson[]>();

for (const person of treeMockPeople) {
  if (!person.parentId) continue;

  const current = treeMockChildrenByParentId.get(person.parentId) ?? [];
  current.push(person);
  treeMockChildrenByParentId.set(person.parentId, current);
}

for (const [parentId, children] of treeMockChildrenByParentId.entries()) {
  children.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  treeMockChildrenByParentId.set(parentId, children);
}

function countDescendants(personId: string): number {
  const children = treeMockChildrenByParentId.get(personId) ?? [];
  if (children.length === 0) return 0;

  return children.reduce((total, child) => {
    return total + 1 + countDescendants(child.id);
  }, 0);
}

export const treeMockBranches: MockTreeBranch[] = treeMockPeople
  .filter((person) => person.parentId === null)
  .map((rootPerson) => {
    const peopleInBranch = treeMockPeople.filter(
      (person) => person.branchId === rootPerson.branchId,
    );

    const familiesInBranch = peopleInBranch.filter((person) => {
      const children = treeMockChildrenByParentId.get(person.id) ?? [];
      return children.length > 0;
    });

    return {
      id: rootPerson.branchId,
      name: rootPerson.branchName,
      rootPersonId: rootPerson.id,
      rootPersonName: rootPerson.displayName,
      peopleCount: peopleInBranch.length,
      familiesCount: familiesInBranch.length,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const treeMockFamilies: MockTreeFamily[] = treeMockPeople
  .filter((person) => {
    const children = treeMockChildrenByParentId.get(person.id) ?? [];
    return children.length > 0;
  })
  .map((parent) => {
    const children = treeMockChildrenByParentId.get(parent.id) ?? [];

    return {
      id: `family-${parent.code.replace(/\./g, "-")}`,
      parentId: parent.id,
      parentName: parent.displayName,
      label: parent.displayName,
      parentsLabel: parent.displayName,
      branchId: parent.branchId,
      branchName: parent.branchName,
      childrenIds: children.map((child) => child.id),
      childrenCount: children.length,
      descendantsCount: countDescendants(parent.id),
    };
  })
  .sort((a, b) => a.parentName.localeCompare(b.parentName));

export function getMockBranches() {
  return {
    rootAncestor: treeMockRootAncestor,
    branches: treeMockBranches,
  };
}

export function getMockFamilies(branchId: string) {
  const branch = treeMockBranches.find((item) => item.id === branchId);
  if (!branch) {
    throw new Error(`Branch not found: ${branchId}`);
  }

  const families = treeMockFamilies.filter((family) => family.branchId === branchId);

  return {
    branch,
    breadcrumbs: [
      { label: "Famille", to: undefined },
      { label: branch.name },
    ],
    families,
  };
}

export function getMockSiblings(familyId: string) {
  const family = treeMockFamilies.find((item) => item.id === familyId);
  if (!family) {
    throw new Error(`Family not found: ${familyId}`);
  }

  const branch = treeMockBranches.find((item) => item.id === family.branchId);
  if (!branch) {
    throw new Error(`Branch not found for family: ${familyId}`);
  }

  const siblings = (treeMockChildrenByParentId.get(family.parentId) ?? []).map((person) => {
    const children = treeMockChildrenByParentId.get(person.id) ?? [];

    return {
      id: person.id,
      name: person.displayName,
      generation: person.generation,
      branchId: person.branchId,
      branchName: person.branchName,
      siblingCount: family.childrenCount,
      childrenCount: children.length,
      spouseName: null,
    };
  });

  return {
    family: {
      id: family.id,
      label: family.label,
      parentsLabel: family.parentsLabel,
      childrenCount: family.childrenCount,
      descendantsCount: family.descendantsCount,
    },
    branch: {
      id: branch.id,
      name: branch.name,
    },
    breadcrumbs: [
      { label: "Famille", to: undefined },
      { label: branch.name, to: undefined },
      { label: family.label },
    ],
    siblings,
  };
}

export function getMockPerson(personId: string) {
  const person = treeMockPeopleById.get(personId);
  if (!person) {
    throw new Error(`Person not found: ${personId}`);
  }

  const branch = treeMockBranches.find((item) => item.id === person.branchId);

  const parent =
    person.parentId ? treeMockPeopleById.get(person.parentId) ?? null : null;

  const siblings = parent
    ? (treeMockChildrenByParentId.get(parent.id) ?? []).filter(
        (item) => item.id !== person.id,
      )
    : [];

  const children = treeMockChildrenByParentId.get(person.id) ?? [];

  const family = parent
    ? treeMockFamilies.find((item) => item.parentId === parent.id) ?? null
    : null;

  return {
    person: {
      id: person.id,
      name: person.displayName,
      generation: person.generation,
      branchId: person.branchId,
      branchName: branch?.name ?? person.branchName,
      parents: parent
        ? [
            {
              id: parent.id,
              name: parent.displayName,
              generation: parent.generation,
              branchId: parent.branchId,
              branchName: parent.branchName,
            },
          ]
        : [],
      siblings: siblings.map((item) => ({
        id: item.id,
        name: item.displayName,
        generation: item.generation,
        branchId: item.branchId,
        branchName: item.branchName,
      })),
      spouse: null,
      children: children.map((item) => ({
        id: item.id,
        name: item.displayName,
        generation: item.generation,
        branchId: item.branchId,
        branchName: item.branchName,
      })),
      familyId: family?.id ?? null,
    },
    breadcrumbs: [
      { label: "Famille", to: undefined },
      ...(branch ? [{ label: branch.name, to: undefined }] : []),
      ...(family ? [{ label: family.label, to: undefined }] : []),
      { label: person.displayName },
    ],
  };
}

export function getMockLineage(personId: string) {
  const person = treeMockPeopleById.get(personId);
  if (!person) {
    throw new Error(`Person not found: ${personId}`);
  }

  const nodes: {
    id: string;
    name: string;
    generation: string;
    relationLabel?: string;
  }[] = [];

  let current: MockTreePerson | null = person;

  while (current) {
    nodes.unshift({
      id: current.id,
      name: current.displayName,
      generation: current.generation,
    });

    current = current.parentId
      ? treeMockPeopleById.get(current.parentId) ?? null
      : null;
  }

  return {
    lineage: {
      personId: person.id,
      personName: person.displayName,
      nodes,
    },
    breadcrumbs: [
      { label: "Famille", to: undefined },
      { label: person.branchName, to: undefined },
      { label: person.displayName, to: undefined },
      { label: "Lignée" },
    ],
  };
}