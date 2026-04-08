// src/features/player/content/loaders/activityContentLoader.ts

type RawMdModule = string;

const activityFiles = import.meta.glob(
  "/src/content/activities/**/*.md",
  {
    eager: true,
    query: "?raw",
    import: "default",
  }
) as Record<string, RawMdModule>;

export function getAllActivityRawFiles(): Record<string, string> {
  return activityFiles;
}

export function listActivityRawFilesForSlug(activitySlug: string): Array<[string, string]> {
  const needle = `/content/activities/${activitySlug}/`;
  return Object.entries(activityFiles).filter(([fullPath]) =>
    fullPath.includes(needle)
  );
}