export function createFamilyOrderId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tmp_${Math.random().toString(36).slice(2, 11)}`;
}

export function getPersonDisplayName(person: {
  firstName?: string;
  lastName?: string;
  nickname?: string;
}): string {
  const fullName = [person.firstName, person.lastName]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  const nickname = person.nickname?.trim() ?? "";
  if (nickname) {
    return nickname;
  }

  return "Personne sans nom";
}

export function normalizeOrderedKeys(params: {
  existingKeys: string[];
  allowedKeys: string[];
  fixedKey: string;
}): string[] {
  const { existingKeys, allowedKeys, fixedKey } = params;
  const allowed = new Set(allowedKeys);

  const next = existingKeys.filter((key) => allowed.has(key));

  if (!next.includes(fixedKey) && allowed.has(fixedKey)) {
    next.push(fixedKey);
  }

  for (const key of allowedKeys) {
    if (!next.includes(key)) {
      next.push(key);
    }
  }

  return next;
}

export function sortIdsByLegacyBirthOrder<T extends { id: string; birthOrder?: string }>(
  people: T[],
): string[] {
  return [...people]
    .sort((a, b) => {
      const aNum = Number.parseInt((a.birthOrder ?? "").trim(), 10);
      const bNum = Number.parseInt((b.birthOrder ?? "").trim(), 10);

      const aValid = Number.isFinite(aNum);
      const bValid = Number.isFinite(bNum);

      if (aValid && bValid) return aNum - bNum;
      if (aValid) return -1;
      if (bValid) return 1;
      return 0;
    })
    .map((person) => person.id);
}