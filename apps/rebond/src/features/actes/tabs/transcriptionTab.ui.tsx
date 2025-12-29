// transcriptionTab.ui.tsx
// Pure UI helpers (badges, labels) – no business logic here.
// ✅ Objectif : composants UI ultra stables, testables, et faciles à étendre.

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  User,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import type {
  AnchorStatus,
  TranscriptionTagRow,
} from "./transcriptionTab.service";

// ---------------------------
// Anchor badge (annotation validity vs text edits)
// ---------------------------

export function anchorBadge(status: AnchorStatus) {
  switch (status) {
    case "ok":
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          OK
        </Badge>
      );

    case "needs_review":
      return (
        <Badge className="bg-yellow-600 text-white gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          À revoir
        </Badge>
      );

    case "orphaned":
      return (
        <Badge className="bg-red-600 text-white gap-1">
          <XCircle className="h-3.5 w-3.5" />
          Orpheline
        </Badge>
      );

    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <HelpCircle className="h-3.5 w-3.5" />
          Inconnu
        </Badge>
      );
  }
}

// ---------------------------
// Tag chip (not a Badge: lighter, inline)
// ---------------------------

type TagChipConfig = {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function tagChipConfig(kind: TranscriptionTagRow["kind"]): TagChipConfig {
  switch (kind) {
    case "date":
      return { label: "Date", Icon: Calendar };
    case "acteur":
      return { label: "Acteur", Icon: User };
    case "lieu":
      return { label: "Lieu", Icon: MapPin };
    default:
      return { label: "Tag", Icon: HelpCircle };
  }
}

export function tagBadge(kind: TranscriptionTagRow["kind"]) {
  const { label, Icon } = tagChipConfig(kind);
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

// ---------------------------
// Labels
// ---------------------------

export const typeLabel: Record<
  "doubt" | "rature" | "lacune" | "mention" | "other",
  string
> = {
  doubt: "Doutes",
  rature: "Ratures",
  lacune: "Lacunes",
  mention: "Mentions",
  other: "Autres",
};
