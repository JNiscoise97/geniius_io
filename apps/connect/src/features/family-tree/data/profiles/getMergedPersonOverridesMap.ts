// src/features/family-tree/api/getMergedPersonOverridesMap.ts


import { getPersonOverridesMap } from "./getPersonOverridesMap";
import { mergePersonUiOverrides } from "../../config/getMergedPersonUiOverrides";
import type { PersonUiOverride } from "./uiOverrides";

export async function getMergedPersonOverridesMap(
  eventSlug: string,
): Promise<Record<string, PersonUiOverride>> {
  const dbOverrides = await getPersonOverridesMap(eventSlug);
  return mergePersonUiOverrides(dbOverrides);
}