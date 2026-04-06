// src/features/family-tree/config/getMergedPersonUiOverrides.ts

import { PERSON_UI_OVERRIDES, type PersonUiOverride } from "../data/profiles/uiOverrides";



export function mergePersonUiOverrides(
  dbOverrides: Record<string, PersonUiOverride>,
): Record<string, PersonUiOverride> {
  const merged: Record<string, PersonUiOverride> = {
    ...PERSON_UI_OVERRIDES,
  };

  for (const [personId, dbOverride] of Object.entries(dbOverrides)) {
    merged[personId] = {
      ...(merged[personId] ?? {}),
      ...dbOverride,
    };
  }

  return merged;
}