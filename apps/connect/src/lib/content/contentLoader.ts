import yaml from "js-yaml";

export type ContentEvent = {
  slug: string;
  title: string;
  zones: Array<{ file: string; title: string }>;
};

export type ContentZone = {
  id: string;
  title: string;
  theme?: string;
  body: string;
  rawFrontmatter: Record<string, any>;
};

const eventYamlByPath = import.meta.glob("../../content/events/*/event.yaml", {
  as: "raw",
  eager: true,
}) as Record<string, string>;

const zoneMdByPath = import.meta.glob("../../content/events/*/zones/*.md", {
  as: "raw",
  eager: true,
}) as Record<string, string>;

function parseEventYaml(raw: string): ContentEvent {
  const data = yaml.load(raw) as any;
  if (!data?.slug || !data?.title) {
    throw new Error("Invalid event.yaml (missing slug/title)");
  }
  return {
    slug: String(data.slug),
    title: String(data.title),
    zones: Array.isArray(data.zones)
      ? data.zones.map((z: any) => ({ file: String(z.file), title: String(z.title ?? z.file) }))
      : [],
  };
}

function splitFrontmatter(raw: string): { fmRaw: string | null; body: string } {
  // Frontmatter YAML:
  // ---
  // key: value
  // ---
  // body...
  if (!raw.startsWith("---")) {
    return { fmRaw: null, body: raw.trim() };
  }

  const lines = raw.split("\n");
  // first line is ---
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) {
    // no closing --- found
    return { fmRaw: null, body: raw.trim() };
  }

  const fmRaw = lines.slice(1, end).join("\n");
  const body = lines.slice(end + 1).join("\n").trim();
  return { fmRaw, body };
}

function parseZoneMd(raw: string): ContentZone {
  const { fmRaw, body } = splitFrontmatter(raw);
  const fm = (fmRaw ? (yaml.load(fmRaw) as any) : {}) ?? {};

  return {
    id: String(fm.id ?? ""),
    title: String(fm.title ?? ""),
    theme: fm.theme ? String(fm.theme) : undefined,
    body,
    rawFrontmatter: fm,
  };
}


export function getLocalEvent(slug: string): { event: ContentEvent; zones: ContentZone[] } | null {
  const eventEntry = Object.entries(eventYamlByPath).find(([path]) =>
    path.includes(`/events/${slug}/event.yaml`)
  );
  if (!eventEntry) return null;

  const event = parseEventYaml(eventEntry[1]);

  const zones: ContentZone[] = event.zones.map((z) => {
    const zoneEntry = Object.entries(zoneMdByPath).find(([path]) =>
      path.includes(`/events/${slug}/zones/${z.file}`)
    );
    if (!zoneEntry) {
      throw new Error(`Missing zone file: ${z.file} for event ${slug}`);
    }
    return parseZoneMd(zoneEntry[1]);
  });

  return { event, zones };
}
