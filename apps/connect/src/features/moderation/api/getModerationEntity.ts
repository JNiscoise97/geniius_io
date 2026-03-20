// src/features/moderation/api/getModerationEntity.ts

import type {
  ModerationEntityRecord,
  ModerationEntityType,
} from "../types";

export async function getModerationEntity(params: {
  eventSlug: string;
  entityType: ModerationEntityType;
  entityId: string;
}): Promise<ModerationEntityRecord> {
  const { eventSlug, entityType, entityId } = params;

  const response = await fetch(
    `/api/moderation/${eventSlug}/${entityType}/${entityId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Impossible de charger l’élément à modérer.");
  }

  return response.json();
}