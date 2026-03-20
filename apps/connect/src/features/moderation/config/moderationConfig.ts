// src/features/moderation/config/moderationConfig.ts

import type { ModerationEntityType } from "../types";

export const moderationTypeLabels: Record<ModerationEntityType, string> = {
  memory: "Souvenir",
  photo: "Photo",
  relation: "Relation",
  profile: "Profil",
};

export const moderationTypeDescriptions: Record<ModerationEntityType, string> = {
  memory: "Vérifiez le contenu du souvenir avant publication.",
  photo: "Vérifiez la photo proposée avant validation.",
  relation: "Vérifiez la relation proposée entre les personnes.",
  profile: "Vérifiez la demande liée au profil ou à l’identité.",
};