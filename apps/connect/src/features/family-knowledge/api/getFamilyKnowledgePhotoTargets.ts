import { supabase } from "../../../lib/supabase/client";
import type {
  FamilyKnowledgeTableName,
  FamilyPhotoPersonType,
  FamilyPhotoTarget,
} from "../types/familyKnowledgePhotoTargets";

type GetFamilyPhotoTargetsInput = {
  eventSlug: string;
  participantId: string;
};

type TableSpec = {
  table: FamilyKnowledgeTableName;
  personType: FamilyPhotoPersonType;
};

const TABLE_SPECS: TableSpec[] = [
  {
    table: "participant_family_knowledge_close_family",
    personType: "parent",
  },
  {
    table: "participant_family_knowledge_godparents",
    personType: "godparent",
  },
  {
    table: "participant_family_knowledge_grandparents",
    personType: "grandparent",
  },
  {
    table: "participant_family_knowledge_siblings",
    personType: "sibling",
  },
];

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildDisplayName(node: JsonObject): string {
  const explicitName =
    toStringOrNull(node.name) ??
    [toStringOrNull(node.firstName), toStringOrNull(node.lastName)]
      .filter(Boolean)
      .join(" ")
      .trim();

  if (explicitName) return explicitName;

  const fallback =
    [toStringOrNull(node.prenom), toStringOrNull(node.nom)]
      .filter(Boolean)
      .join(" ")
      .trim() || "Personne à photographier";

  return fallback;
}

function buildLabelFromPath(path: string, personType: FamilyPhotoPersonType, node: JsonObject): string {
  const explicitLabel =
    toStringOrNull(node.label) ??
    toStringOrNull(node.roleLabel) ??
    toStringOrNull(node.relationshipLabel);

  if (explicitLabel) return explicitLabel;

  const normalized = path
    .replace(/\.\d+\./g, " > ")
    .replace(/\./g, " > ")
    .replace(/\[\d+\]/g, "");

  if (normalized.trim()) return normalized;

  switch (personType) {
    case "parent":
      return "Parent";
    case "godparent":
      return "Parrain / marraine";
    case "grandparent":
      return "Grand-parent";
    case "sibling":
      return "Frère / sœur";
    default:
      return "Personne";
  }
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

  if (birthYear || deathYear) {
    return `${birthYear ?? "?"}-${deathYear ?? ""}`.replace(/-$/, "");
  }

  return null;
}

function buildStableKey(path: string, node: JsonObject): string {
  return (
    toStringOrNull(node.key) ??
    toStringOrNull(node.id) ??
    path.replace(/[^a-zA-Z0-9_-]+/g, "_")
  );
}

function collectPhotoTargetsFromNode(
  value: unknown,
  path: string,
  sourceTable: FamilyKnowledgeTableName,
  personType: FamilyPhotoPersonType,
  acc: FamilyPhotoTarget[],
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectPhotoTargetsFromNode(
        item,
        `${path}[${index}]`,
        sourceTable,
        personType,
        acc,
      );
    });
    return;
  }

  if (!isObject(value)) return;

  const hasPhoto = value.hasPhoto === true;

  if (hasPhoto) {
    const key = buildStableKey(path, value);
    const label = buildLabelFromPath(path, personType, value);
    const displayName = buildDisplayName(value);
    const years = buildYears(value);

    acc.push({
      sourceTable,
      personType,
      key,
      label,
      displayName,
      years,
      rawPath: path,
      rawData: value,
    });
  }

  for (const [childKey, childValue] of Object.entries(value)) {
    collectPhotoTargetsFromNode(
      childValue,
      path ? `${path}.${childKey}` : childKey,
      sourceTable,
      personType,
      acc,
    );
  }
}

export async function getFamilyKnowledgePhotoTargets(
  input: GetFamilyPhotoTargetsInput,
): Promise<FamilyPhotoTarget[]> {
  const { eventSlug, participantId } = input;

  const allTargets: FamilyPhotoTarget[] = [];

  for (const spec of TABLE_SPECS) {
    const { data, error } = await supabase
      .from(spec.table)
      .select("data")
      .eq("event_slug", eventSlug)
      .eq("participant_id", participantId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Impossible de lire ${spec.table}: ${error.message}`,
      );
    }

    const payload = data?.data;

    if (!payload) continue;

    collectPhotoTargetsFromNode(
      payload,
      "",
      spec.table,
      spec.personType,
      allTargets,
    );
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