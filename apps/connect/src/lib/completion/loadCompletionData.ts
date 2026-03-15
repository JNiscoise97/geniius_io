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

function getTablesToLoad(rules: CompletionRule[]): string[] {
  const tables = new Set<string>();

  for (const rule of rules) {
    if (rule.table) {
      tables.add(rule.table);
    }

    for (const table of rule.dependsOnTables ?? []) {
      tables.add(table);
    }
  }

  return [...tables];
}

function getParticipantFieldForTable(
  table: string,
  rules: CompletionRule[],
): string {
  for (const rule of rules) {
    if (rule.table === table && rule.participantField?.trim()) {
      return rule.participantField.trim();
    }
  }

  return "participant_id";
}

function getSelectFieldsForTable(
  table: string,
  rules: CompletionRule[],
  participantField: string,
): string[] {
  const fields = new Set<string>([participantField]);

  for (const rule of rules) {
    if (rule.table === table) {
      for (const field of getFieldsForRule(rule)) {
        fields.add(field);
      }
    }

    const extraFields = rule.selectFieldsByTable?.[table] ?? [];
    for (const field of extraFields) {
      fields.add(field);
    }
  }

  return [...fields];
}

export async function loadCompletionData(
  participantId: string,
  rules: CompletionRule[],
): Promise<Record<string, CompletionRow>> {
  const tables = getTablesToLoad(rules);
  const rowsByTable: Record<string, CompletionRow> = {};

  for (const table of tables) {
    const participantField = getParticipantFieldForTable(table, rules);
    const selectFields = getSelectFieldsForTable(
      table,
      rules,
      participantField,
    ).join(", ");

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