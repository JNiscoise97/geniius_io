// src/features/player/core/activity/content/queries/listActivityDefinitions.ts

import type { ActivityDefinition } from "../../activityTypes";
import { getAllActivityRawFiles } from "../loaders/activityContentLoader";
import { parseActivityManifestMd } from "../parsers/activityMdParser";
import { getActivityDefinition } from "./getActivityDefinition";

export function listActivityDefinitions(): ActivityDefinition[] {
  const rawFiles = getAllActivityRawFiles();

  const slugs = Object.entries(rawFiles)
    .filter(([path]) => path.endsWith("/activity.md"))
    .map(([, raw]) => parseActivityManifestMd(raw).frontmatter.slug);

  const uniqueSlugs = Array.from(new Set(slugs));

  return uniqueSlugs
    .map((slug) => getActivityDefinition(slug))
    .sort((a, b) => {
      const modeCompare = a.mode.localeCompare(b.mode, "fr");
      if (modeCompare !== 0) return modeCompare;
      return a.title.localeCompare(b.title, "fr");
    });
}