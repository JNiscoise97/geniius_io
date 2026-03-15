import { supabase } from "../supabase/client";
import type {
  CompletionCondition,
  CompletionRow,
  CompletionRule,
} from "./sectionCompletion";

function collectConditionFields(condition: CompletionCondition): string[] {
  if (typeof condition === "string") {
    return [condition];
  }

  if ("and" in condition) {
    return condition.and.flatMap(collectConditionFields);
  }

  if ("or" in condition) {
    return condition.or.flatMap(collectConditionFields);
  }

  return [];
}

function getFieldsForRule(rule: CompletionRule): string[] {
  return [...new Set(collectConditionFields(rule.fields))];
}

export async function loadCompletionData(
  participantId: string,
  rules: CompletionRule[],
): Promise<Record<string, CompletionRow>> {
  const rulesWithTables = rules.filter(
    (rule): rule is CompletionRule & { table: string } => rule.table !== null,
  );

  const uniqueTables = [...new Set(rulesWithTables.map((rule) => rule.table))];
  const rowsByTable: Record<string, CompletionRow> = {};

  for (const table of uniqueTables) {
    const rulesForTable = rulesWithTables.filter((rule) => rule.table === table);
    const fields = [...new Set(rulesForTable.flatMap(getFieldsForRule))];
    const participantField =
      rulesForTable[0]?.participantField?.trim() || "participant_id";

    const selectFields = [...new Set([participantField, ...fields])].join(", ");

    const { data, error } = await supabase
      .from(table)
      .select(selectFields)
      .eq(participantField, participantId)
      .maybeSingle();

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    rowsByTable[table] = (data as Record<string, unknown> | null) ?? null;
  }

  return rowsByTable;
}