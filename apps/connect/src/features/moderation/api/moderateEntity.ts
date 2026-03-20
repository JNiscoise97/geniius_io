// src/features/moderation/api/moderateEntity.ts

import type { ModerateEntityInput } from "../types";

export async function moderateEntity(
  input: ModerateEntityInput,
): Promise<void> {
  const response = await fetch(`/api/moderation/${input.entityType}/${input.entityId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: input.status,
      moderatorComment: input.moderatorComment ?? "",
    }),
  });

  if (!response.ok) {
    throw new Error("Impossible d’enregistrer la modération.");
  }
}