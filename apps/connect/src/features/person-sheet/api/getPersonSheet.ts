import {
  personSheets,
  type PersonSheetData,
} from "../config/personSheets";

export async function getPersonSheet(
  personId: string,
): Promise<PersonSheetData | null> {
  const id = personId.trim();
  if (!id) return null;

  return personSheets[id] ?? null;
}