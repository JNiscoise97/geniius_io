import { supabase } from "../../../lib/supabase/client";
import type {
  FamilyKnowledgeTableName,
  FamilyPhotoPersonType,
  FamilyPhotoTarget,
} from "../types/familyKnowledgePhotoTargets";

type GetFamilyPhotoTargetsInput = {
  participantId: string;
};

type JsonObject = Record<string, unknown>;

type TableSpec = {
  table: FamilyKnowledgeTableName;
};

const TABLE_SPECS: TableSpec[] = [
  { table: "participant_family_knowledge_close_family" },
  { table: "participant_family_knowledge_current_links" },
  { table: "participant_family_knowledge_grandparents" },
  { table: "participant_family_knowledge_memory" },
];

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toStringOrNull(value: unknown): string | null {
  const s = toTrimmedString(value);
  return s ? s : null;
}

function hasPhotoFlag(node: JsonObject): boolean {
  return node.hasPhoto === "yes";
}

function buildDisplayName(node: JsonObject): string {
  const explicitName = toStringOrNull(node.name);
  if (explicitName) return explicitName;

  const firstName =
    toStringOrNull(node.firstName) ?? toStringOrNull(node.prenom);
  const lastName =
    toStringOrNull(node.lastName) ?? toStringOrNull(node.nom);
  const nickname = toStringOrNull(node.nickname);

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;

  if (nickname) return nickname;

  return "Personne à photographier";
}

function buildYears(node: JsonObject): string | null {
  const directYears = toStringOrNull(node.years);
  if (directYears) return directYears;

  const birthYear =
    toStringOrNull(node.birthYear) ??
    (typeof node.birthYear === "number" ? String(node.birthYear) : null) ??
    toStringOrNull(node.birth_year);

  const deathYear =
    toStringOrNull(node.deathYear) ??
    (typeof node.deathYear === "number" ? String(node.deathYear) : null) ??
    toStringOrNull(node.death_year);

  if (!birthYear && !deathYear) return null;
  return `${birthYear ?? "?"}-${deathYear ?? ""}`.replace(/-$/, "");
}

function buildStableKey(path: string, node: JsonObject): string {
  return (
    toStringOrNull(node.key) ??
    toStringOrNull(node.id) ??
    path.replace(/[^a-zA-Z0-9_-]+/g, "_")
  );
}

function buildTarget(
  sourceTable: FamilyKnowledgeTableName,
  personType: FamilyPhotoPersonType,
  path: string,
  label: string,
  node: JsonObject,
): FamilyPhotoTarget | null {
  if (!hasPhotoFlag(node)) return null;

  return {
    sourceTable,
    personType,
    key: buildStableKey(path, node),
    label,
    displayName: buildDisplayName(node),
    years: buildYears(node),
    rawPath: path,
    rawData: node,
  };
}

function pushIfTarget(
  acc: FamilyPhotoTarget[],
  sourceTable: FamilyKnowledgeTableName,
  personType: FamilyPhotoPersonType,
  path: string,
  label: string,
  value: unknown,
) {
  if (!isObject(value)) return;

  const target = buildTarget(sourceTable, personType, path, label, value);
  if (target) {
    acc.push(target);
  }
}

function collectFromArray(
  acc: FamilyPhotoTarget[],
  sourceTable: FamilyKnowledgeTableName,
  personType: FamilyPhotoPersonType,
  basePath: string,
  baseLabel: string,
  value: unknown,
) {
  if (!Array.isArray(value)) return;

  value.forEach((item, index) => {
    pushIfTarget(
      acc,
      sourceTable,
      personType,
      `${basePath}[${index}]`,
      `${baseLabel} ${index + 1}`,
      item,
    );
  });
}

function collectPhotoTargetsFromPayload(
  sourceTable: FamilyKnowledgeTableName,
  payload: JsonObject,
): FamilyPhotoTarget[] {
  const acc: FamilyPhotoTarget[] = [];

  switch (sourceTable) {
    case "participant_family_knowledge_close_family": {
      pushIfTarget(acc, sourceTable, "parent", "parent1", "Parent 1", payload.parent1);
      pushIfTarget(acc, sourceTable, "parent", "parent2", "Parent 2", payload.parent2);
      pushIfTarget(acc, sourceTable, "partner", "partner", "Conjoint", payload.partner);
      collectFromArray(acc, sourceTable, "child", "children", "Enfant", payload.children);
      break;
    }

    case "participant_family_knowledge_current_links": {
      collectFromArray(
        acc,
        sourceTable,
        "current_link",
        "contacts",
        "Contact familial",
        payload.contacts,
      );
      break;
    }

    case "participant_family_knowledge_grandparents": {
      pushIfTarget(
        acc,
        sourceTable,
        "grandparent",
        "paternalGrandfather",
        "Grand-père paternel",
        payload.paternalGrandfather,
      );
      pushIfTarget(
        acc,
        sourceTable,
        "grandparent",
        "paternalGrandmother",
        "Grand-mère paternelle",
        payload.paternalGrandmother,
      );
      pushIfTarget(
        acc,
        sourceTable,
        "grandparent",
        "maternalGrandfather",
        "Grand-père maternel",
        payload.maternalGrandfather,
      );
      pushIfTarget(
        acc,
        sourceTable,
        "grandparent",
        "maternalGrandmother",
        "Grand-mère maternelle",
        payload.maternalGrandmother,
      );

      collectFromArray(
        acc,
        sourceTable,
        "aunt_uncle",
        "paternalAuntsUncles",
        "Oncle / tante côté paternel",
        payload.paternalAuntsUncles,
      );
      collectFromArray(
        acc,
        sourceTable,
        "aunt_uncle",
        "maternalAuntsUncles",
        "Oncle / tante côté maternel",
        payload.maternalAuntsUncles,
      );
      break;
    }

    case "participant_family_knowledge_memory": {
      collectFromArray(
        acc,
        sourceTable,
        "story_teller",
        "storyTellers",
        "Personne ressource",
        payload.storyTellers,
      );
      break;
    }

    case "participant_family_knowledge_godparents": {
      break;
    }
  }

  return acc;
}

export async function getFamilyKnowledgePhotoTargets({
  participantId,
}: GetFamilyPhotoTargetsInput): Promise<FamilyPhotoTarget[]> {
  const allTargets: FamilyPhotoTarget[] = [];

  for (const spec of TABLE_SPECS) {
    const { data, error } = await supabase
      .from(spec.table)
      .select("data")
      .eq("participant_id", participantId)
      .maybeSingle();

    if (error) {
      throw new Error(`Impossible de lire ${spec.table}: ${error.message}`);
    }

    const payload = isObject(data?.data) ? data.data : null;
    if (!payload) continue;

    allTargets.push(...collectPhotoTargetsFromPayload(spec.table, payload));
  }

  const deduped = new Map<string, FamilyPhotoTarget>();

  for (const target of allTargets) {
    const dedupeKey = [
      target.sourceTable,
      target.personType,
      target.key,
      target.rawPath,
    ].join("::");

    if (!deduped.has(dedupeKey)) {
      deduped.set(dedupeKey, target);
    }
  }

  return Array.from(deduped.values()).sort((a, b) => {
    if (a.personType !== b.personType) {
      return a.personType.localeCompare(b.personType);
    }

    return a.displayName.localeCompare(b.displayName, "fr");
  });
}