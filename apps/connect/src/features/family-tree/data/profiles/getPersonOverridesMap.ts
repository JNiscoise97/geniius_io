// src/features/family-tree/api/getPersonOverridesMap.ts

import { supabase } from "../../../../lib/supabase/client";
import type { PersonSummary } from "../../types/person";
import type { PersonUiOverride } from "./uiOverrides";

type PersonOverrideRow = {
  person_id: string;
  overrides: Partial<PersonSummary> | null;
};

export async function getPersonOverridesMap(
  eventSlug: string,
): Promise<Record<string, PersonUiOverride>> {
  const { data, error } = await supabase
    .from("person_overrides")
    .select("person_id, overrides")
    .eq("event_slug", eventSlug);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as PersonOverrideRow[];

  return rows.reduce<Record<string, PersonUiOverride>>((acc, row) => {
    acc[row.person_id] = (row.overrides ?? {}) as PersonUiOverride;
    return acc;
  }, {});
}