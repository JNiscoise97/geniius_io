// src/features/player/content/parsers/activityMdParser.ts

import yaml from "js-yaml";
import type { ActivityManifestFrontmatter, ActivitySectionFrontmatter } from "../../activityTypes";

export type ParsedMdFile<TFrontmatter> = {
  frontmatter: TFrontmatter;
  body: string;
};

function assertObject(
  value: unknown,
  label: string
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function extractFrontmatter(raw: string): { yamlText: string; body: string } {
  const normalized = raw.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    throw new Error("Markdown file must start with frontmatter delimiter ---");
  }

  const endIndex = normalized.indexOf("\n---\n", 4);

  if (endIndex === -1) {
    throw new Error("Closing frontmatter delimiter --- not found");
  }

  const yamlText = normalized.slice(4, endIndex).trim();
  const body = normalized.slice(endIndex + "\n---\n".length).trim();

  return { yamlText, body };
}

function parseYamlObject<T>(yamlText: string, label: string): T {
  const parsed = yaml.load(yamlText) as unknown;
  assertObject(parsed, label);
  return parsed as T;
}

export function parseActivityManifestMd(
  raw: string
): ParsedMdFile<ActivityManifestFrontmatter> {
  const { yamlText, body } = extractFrontmatter(raw);
  const data = parseYamlObject<ActivityManifestFrontmatter>(
    yamlText,
    "activity frontmatter"
  );

  requireString(data.id, "activity.id");
  requireString(data.slug, "activity.slug");
  requireString(data.title, "activity.title");
  requireString(data.mode, "activity.mode");
  requireArray(data.sections, "activity.sections");

  return {
    frontmatter: data,
    body,
  };
}

export function parseActivitySectionMd(
  raw: string
): ParsedMdFile<ActivitySectionFrontmatter> {
  const { yamlText, body } = extractFrontmatter(raw);
  const data = parseYamlObject<ActivitySectionFrontmatter>(
    yamlText,
    "section frontmatter"
  );

  requireString(data.id, "section.id");
  requireString(data.title, "section.title");
  requireArray(data.questions, "section.questions");

  return {
    frontmatter: data,
    body,
  };
}