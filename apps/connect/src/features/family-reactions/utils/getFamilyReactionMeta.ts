import {
  Camera,
  Heart,
  Megaphone,
  MessageCircle,
  UserCheck, // ✅ ajouté
} from "lucide-react";
import type { FamilyReactionKind, FamilyReactionMeta } from "../types";

export function getFamilyReactionMeta(
  kind: FamilyReactionKind,
): FamilyReactionMeta {
  switch (kind) {
    case "photo":
      return {
        label: "Photo",
        icon: Camera,
      };
    case "memory":
      return {
        label: "Souvenir",
        icon: MessageCircle,
      };
    case "touched_by_person":
      return {
        label: "J’aime",
        icon: Heart,
      };
    case "heard_of_person":
      return {
        label: "J’ai entendu parler",
        icon: Megaphone,
      };
    case "knew_person":
      return {
        label: "J’ai connu",
        icon: UserCheck, // ✅ plus clair
      };
    default: {
      const exhaustiveCheck: never = kind;
      throw new Error(`Type de réaction inconnu: ${exhaustiveCheck}`);
    }
  }
}