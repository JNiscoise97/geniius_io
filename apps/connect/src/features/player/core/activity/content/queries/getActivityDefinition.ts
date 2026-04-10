// src/features/player/content/queries/getActivityDefinition.ts

import type {
  ActivityDefinition,
  ActivityManifestFrontmatter,
  ActivitySectionDefinition,
  ActivitySectionManifestItem,
} from "../../activityTypes";
import { listActivityRawFilesForSlug } from "../loaders/activityContentLoader";
import {
  parseActivityManifestMd,
  parseActivitySectionMd,
} from "../parsers/activityMdParser";

function findManifestFile(entries: Array<[string, string]>): string {
  const manifest = entries.find(([path]) => path.endsWith("/activity.md"));

  if (!manifest) {
    throw new Error("activity.md not found");
  }

  return manifest[1];
}

function findSectionFile(
  entries: Array<[string, string]>,
  section: ActivitySectionManifestItem
): string {
  const wanted = `/${section.file}`;
  const found = entries.find(([path]) => path.endsWith(wanted));

  if (!found) {
    throw new Error(`Section file not found: ${section.file}`);
  }

  return found[1];
}

function buildSectionDefinition(
  entries: Array<[string, string]>,
  sectionManifest: ActivitySectionManifestItem
): ActivitySectionDefinition {
  const raw = findSectionFile(entries, sectionManifest);
  const parsed = parseActivitySectionMd(raw);

  return {
    id: parsed.frontmatter.id,
    title: parsed.frontmatter.title,
    kind: parsed.frontmatter.kind,
    introMarkdown: parsed.body || undefined,
    questions: parsed.frontmatter.questions,
  };
}

function withDefaults(
  manifest: ActivityManifestFrontmatter
): Omit<ActivityDefinition, "sections"> {
  return {
    id: manifest.id,
    slug: manifest.slug,
    title: manifest.title,
    mode: manifest.mode,
    description: manifest.description,
    order:
  typeof manifest.order === "number"
    ? manifest.order
    : typeof manifest.order === "string" && manifest.order !== ""
      ? Number(manifest.order)
      : undefined,
    availability: manifest.availability ?? { kind: "available" },
    visibility: manifest.visibility ?? "private",
    introMarkdown: undefined,
    outroMarkdown: undefined,
    participation: manifest.participation ?? { kind: "individual" },
    navigation:
      manifest.navigation ?? {
        kind: "linear",
        allowBack: false,
        allowSkip: false,
      },
    scoring: manifest.scoring ?? { kind: "disabled" },
    feedback: manifest.feedback ?? { kind: "none" },
    persistence: manifest.persistence ?? {
      autosave: true,
      resumeAllowed: true,
      saveDrafts: true,
    },
  };
}

export function getActivityDefinition(activitySlug: string): ActivityDefinition {
  const entries = listActivityRawFilesForSlug(activitySlug);

  if (!entries.length) {
    throw new Error(`No activity files found for slug "${activitySlug}"`);
  }

  const manifestRaw = findManifestFile(entries);
  const parsedManifest = parseActivityManifestMd(manifestRaw);

  const base = withDefaults(parsedManifest.frontmatter);
  const sections = parsedManifest.frontmatter.sections.map((section) =>
    buildSectionDefinition(entries, section)
  );

  return {
    ...base,
    introMarkdown: parsedManifest.body || undefined,
    sections,
  };
}