import { parseGedcomDate, type GedcomDate } from "./gedcom-date";

export type { GedcomDate } from "./gedcom-date";
export { parseGedcomDate, getYear, } from "./gedcom-date";

// ── Types de base ─────────────────────────────────────────────────────────────

export type GedcomSex = "M" | "F" | "U";

export type GedcomMedia = {
  id: string;
  title?: string;
  file?: string;
  form?: string;
  /**
   * URL utilisable directement dans un <img>, résolue à l'exécution pour un
   * arbre importé (fichier retrouvé dans Supabase Storage et signé). Absent
   * pour le graphe de démo, qui construit son URL autrement (MEDIA_BASE_URL).
   */
  url?: string;
};

export type GedcomPlace = {
  raw: string;
  town?: string;
  areaCode?: string;
  county?: string;
  region?: string;
  country?: string;
  subdivision?: string;
};

// ── Tag d'événement ───────────────────────────────────────────────────────────

export type GedcomEventTag =
  | "ADOP"   // Adoption
  | "BIRT"   // Naissance          — unique par personne
  | "BURI"   // Inhumation         — unique par personne
  | "CAST"   // Caste
  | "CENS"   // Recensement
  | "CHR"    // Baptême
  | "CONF"   // Confirmation
  | "DEAT"   // Décès              — unique par personne
  | "DIV"    // Divorce (FAM)
  | "DSCR"   // Description physique
  | "EDUC"   // Éducation
  | "ENGA"   // Fiançailles (FAM)
  | "EVEN"   // Événement générique
  | "FACT"   // Fait
  | "FCOM"   // Première communion
  | "GRAD"   // Diplôme / Remise de grade
  | "HEAL"   // Santé
  | "MARB"   // Publication de bans (FAM)
  | "MARC"   // Contrat de mariage (FAM)
  | "MARR"   // Mariage (FAM)
  | "NAMR"   // Nom religieux
  | "NATU"   // Naturalisation
  | "PROP"   // Propriété
  | "RELI"   // Religion
  | "RESI"   // Résidence
  | "SIGN"   // Signature
  | "WILL";  // Testament

const UNIQUE_EVENT_TAGS = new Set<GedcomEventTag>(["BIRT", "DEAT", "BURI"]);

// ── Types événements ──────────────────────────────────────────────────────────

export type GedcomEventAssoc = {
  id?: string;
  rela?: string;
  role?: string;
  title?: string;
  age?: string;
  note?: string;
};

export type GedcomEvent = {
  tag: GedcomEventTag;
  /** TYPE — libellé précis (ex: "Résidence", "Inventaire après décès") */
  type?: string;
  /**
   * Date parsée. Remplace les anciens champs `date` (string) et `year`.
   * Accès rapide à l'année : getYear(event.date)
   * Accès à la chaîne brute : event.date.raw
   */
  date?: GedcomDate;
  place?: GedcomPlace;
  placeBrut?: string;
  caus?: string;
  note?: string;
  age?: string;
  assocs: GedcomEventAssoc[];
  mediaIds: string[];
  primaryMediaId?: string;
  sourceQuay?: string;
  sourcePage?: string;
};

// ── Entités principales ───────────────────────────────────────────────────────

export type FamilyGraphPerson = {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  sex: GedcomSex;
  occupation?: string;
  title?: string;
  events: GedcomEvent[];
  famcIds: string[];
  famsIds: string[];
  branch?: string[];
  mediaIds: string[];
  primaryMediaId?: string;
};

export type FamilyGraphFamily = {
  id: string;
  husbandId?: string;
  wifeId?: string;
  childIds: string[];
  events: GedcomEvent[];
  mediaIds: string[];
  primaryMediaId?: string;
};

export type FamilyGraphData = {
  people: Record<string, FamilyGraphPerson>;
  families: Record<string, FamilyGraphFamily>;
  media: Record<string, GedcomMedia>;
};

// ── Helpers publics ───────────────────────────────────────────────────────────

export function getEvent(
  entity: { events: GedcomEvent[] },
  tag: GedcomEventTag,
): GedcomEvent | undefined {
  return entity.events.find((e) => e.tag === tag);
}

export function getEventsByTag(
  entity: { events: GedcomEvent[] },
  tag: GedcomEventTag,
): GedcomEvent[] {
  return entity.events.filter((e) => e.tag === tag);
}

export const getBirth       = (p: FamilyGraphPerson) => getEvent(p, "BIRT");
export const getDeath       = (p: FamilyGraphPerson) => getEvent(p, "DEAT");
export const getBurial      = (p: FamilyGraphPerson) => getEvent(p, "BURI");
export const getChristening = (p: FamilyGraphPerson) => getEvent(p, "CHR");
export const getMarriage    = (f: FamilyGraphFamily) => getEvent(f, "MARR");

// ── Types internes ────────────────────────────────────────────────────────────

type GedcomLine = {
  level: number;
  xrefId?: string;
  tag: string;
  value?: string;
};

type ParsedGedcomName = {
  raw?: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  type?: string;
};

export type BuildGraphOptions = {
  mediaBasePath?: string;
};

// ── Fonctions utilitaires ─────────────────────────────────────────────────────

export function normalizeId(raw: string): string {
  return raw.replaceAll("@", "").trim().toLowerCase();
}

function resolveMediaFile(file: string, mediaBasePath: string): string {
  const normalized = file.replace(/\\/g, "/");
  const segments = normalized.split("/");
  const mediasDirIndex = segments.findIndex((s) => /medias/i.test(s));
  const relative =
    mediasDirIndex !== -1 && mediasDirIndex < segments.length - 1
      ? segments.slice(mediasDirIndex + 1).join("\\")
      : segments[segments.length - 1];
  const base = mediaBasePath.replace(/[\\/]+$/, "");
  return `${base}\\${relative}`;
}

function cleanValue(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function cleanPlace(value?: string): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
  return cleaned || undefined;
}

function parsePlace(raw?: string): GedcomPlace | undefined {
  if (!raw) return undefined;
  const parts = raw.split(",").map((p) => p.trim());
  const [town, areaCode, county, region, country, subdivision] = parts;
  return {
    raw,
    town: town || undefined,
    areaCode: areaCode || undefined,
    county: county || undefined,
    region: region || undefined,
    country: country || undefined,
    subdivision: subdivision || undefined,
  };
}

function parseGedcomLine(line: string): GedcomLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const match = trimmed.match(
    /^(\d+)\s+(?:(@[^@]+@)\s+)?([A-Z0-9_]+)(?:\s+(.*))?$/,
  );
  if (!match) return null;
  const [, levelStr, xrefId, tag, value] = match;
  return {
    level: Number(levelStr),
    xrefId,
    tag,
    value: cleanValue(value),
  };
}

function parseRawGedcomName(
  raw?: string,
): { firstName?: string; lastName?: string } {
  if (!raw) return {};
  const trimmed = raw.trim();
  const slashMatch = trimmed.match(/^(.*?)\/(.*?)\/$/);
  if (slashMatch) {
    return {
      firstName: cleanValue(slashMatch[1]),
      lastName: cleanValue(slashMatch[2]),
    };
  }
  return { firstName: trimmed || undefined, lastName: undefined };
}

function parseSex(value?: string): GedcomSex {
  if (value === "M") return "M";
  if (value === "F") return "F";
  return "U";
}

function scoreName(name: ParsedGedcomName): number {
  const type = name.type?.trim().toLowerCase();
  if (!type) return 300;
  if (type === "birth") return 200;
  return 100;
}

function pickBestName(names: ParsedGedcomName[]): ParsedGedcomName | undefined {
  if (names.length === 0) return undefined;
  return [...names].sort((a, b) => scoreName(b) - scoreName(a))[0];
}

// ── Parseur ASSO ──────────────────────────────────────────────────────────────

function parseAssoBlock(
  lines: GedcomLine[],
  i: number,
  assoLevel: number,
): { assoc: GedcomEventAssoc; nextI: number } {
  const assoc: GedcomEventAssoc = {};
  const rootValue = lines[i].value;
  if (rootValue?.startsWith("@")) assoc.id = normalizeId(rootValue);

  i += 1;
  const noteLines: string[] = [];

  while (i < lines.length && lines[i].level > assoLevel) {
    const sub = lines[i];
    if (sub.level === assoLevel + 1) {
      switch (sub.tag) {
        case "RELA": if (sub.value) assoc.rela  = sub.value; break;
        case "ROLE": if (sub.value) assoc.role  = sub.value; break;
        case "TITL": if (sub.value) assoc.title = sub.value; break;
        case "AGE":  if (sub.value) assoc.age   = sub.value; break;
        case "NOTE": if (sub.value) noteLines.push(sub.value); break;
      }
    }
    if (
      sub.level === assoLevel + 2 &&
      (sub.tag === "CONT" || sub.tag === "CONC") &&
      sub.value
    ) {
      noteLines.push(sub.value);
    }
    i += 1;
  }

  if (noteLines.length > 0) assoc.note = noteLines.join(" ");
  return { assoc, nextI: i };
}

// ── Parseur générique d'événement ─────────────────────────────────────────────

function parseEventBlock(
  lines: GedcomLine[],
  i: number,
  tag: GedcomEventTag,
  parentLevel: number,
): { event: GedcomEvent; nextI: number } {
  const event: GedcomEvent = { tag, assocs: [], mediaIds: [] };

  const rootValue = lines[i].value;
  if (rootValue) event.type = rootValue;

  i += 1;

  const noteLines: string[] = [];
  const sourcePageLines: string[] = [];

  while (i < lines.length && lines[i].level > parentLevel) {
    const sub = lines[i];

    if (sub.level === parentLevel + 1) {
      switch (sub.tag) {
        case "TYPE":
          if (sub.value) event.type = sub.value;
          i += 1;
          break;

        case "DATE":
          // Parse la date GEDCOM → GedcomDate structuré
          if (sub.value) event.date = parseGedcomDate(sub.value);
          i += 1;
          break;

        case "PLAC":
          if (sub.value) {
            event.placeBrut = cleanPlace(sub.value);
            event.place = parsePlace(sub.value);
          }
          i += 1;
          while (i < lines.length && lines[i].level > parentLevel + 1) i += 1;
          break;

        case "CAUS":
          if (sub.value) event.caus = sub.value;
          i += 1;
          break;

        case "AGE":
          if (sub.value) event.age = sub.value;
          i += 1;
          break;

        case "NOTE":
          if (sub.value) noteLines.push(sub.value);
          i += 1;
          while (i < lines.length && lines[i].level > parentLevel + 1) {
            const n = lines[i];
            if ((n.tag === "CONT" || n.tag === "CONC") && n.value) noteLines.push(n.value);
            i += 1;
          }
          break;

        case "OBJE":
          if (sub.value) {
            const mediaId = normalizeId(sub.value);
            event.mediaIds.push(mediaId);
            i += 1;
            while (i < lines.length && lines[i].level > parentLevel + 1) {
              if (lines[i].tag === "_PRIM" && lines[i].value === "YES") {
                event.primaryMediaId = mediaId;
              }
              i += 1;
            }
          } else {
            i += 1;
          }
          break;

        case "ASSO": {
          const { assoc, nextI } = parseAssoBlock(lines, i, parentLevel + 1);
          event.assocs.push(assoc);
          i = nextI;
          break;
        }

        case "SOUR":
          i += 1;
          while (i < lines.length && lines[i].level > parentLevel + 1) {
            const s = lines[i];
            if (s.level === parentLevel + 2) {
              if (s.tag === "QUAY" && s.value) event.sourceQuay = s.value;
              else if (s.tag === "PAGE" && s.value) sourcePageLines.push(s.value);
            }
            if (s.level === parentLevel + 3 && s.tag === "CONC" && s.value) {
              sourcePageLines.push(s.value);
            }
            i += 1;
          }
          break;

        default:
          i += 1;
          while (i < lines.length && lines[i].level > parentLevel + 1) i += 1;
          break;
      }
      continue;
    }

    i += 1;
  }

  if (noteLines.length > 0)       event.note       = noteLines.join(" ");
  if (sourcePageLines.length > 0) event.sourcePage = sourcePageLines.join("");

  return { event, nextI: i };
}

// ── Tables de dispatch ────────────────────────────────────────────────────────

const INDI_EVENT_TAGS: Partial<Record<string, GedcomEventTag>> = {
  ADOP: "ADOP", BIRT: "BIRT", BURI: "BURI", CAST: "CAST",
  CENS: "CENS", CHR:  "CHR",  CONF: "CONF", DEAT: "DEAT",
  DSCR: "DSCR", EDUC: "EDUC", EVEN: "EVEN", FACT: "FACT",
  FCOM: "FCOM", GRAD: "GRAD", HEAL: "HEAL", NAMR: "NAMR",
  NATU: "NATU", PROP: "PROP", RELI: "RELI", RESI: "RESI",
  SIGN: "SIGN", WILL: "WILL",
};

const FAM_EVENT_TAGS: Partial<Record<string, GedcomEventTag>> = {
  DIV:  "DIV",
  ENGA: "ENGA",
  MARB: "MARB",
  MARC: "MARC",
  MARR: "MARR",
  EVEN: "EVEN",
};

// ── Parser principal ──────────────────────────────────────────────────────────

export function buildGraphFromGedcomText(
  gedcomText: string,
  options: BuildGraphOptions = {},
): FamilyGraphData {
  const { mediaBasePath } = options;
  const lines = gedcomText
    .split(/\r?\n/)
    .map(parseGedcomLine)
    .filter((line): line is GedcomLine => Boolean(line));

  const graph: FamilyGraphData = { people: {}, families: {}, media: {} };

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── INDI ──────────────────────────────────────────────────────────────
    if (line.level === 0 && line.xrefId && line.tag === "INDI") {
      const personId = normalizeId(line.xrefId);
      const person: FamilyGraphPerson = {
        id: personId,
        firstName: "Nom inconnu",
        lastName: "",
        nickname: "",
        sex: "U",
        famcIds: [],
        famsIds: [],
        mediaIds: [],
        events: [],
      };

      const names: ParsedGedcomName[] = [];
      i += 1;

      while (i < lines.length && lines[i].level > 0) {
        const current = lines[i];

        if (current.level === 1) {
          const eventTag = INDI_EVENT_TAGS[current.tag];
          if (eventTag !== undefined) {
            const alreadyPresent =
              UNIQUE_EVENT_TAGS.has(eventTag) &&
              person.events.some((e) => e.tag === eventTag);

            if (alreadyPresent) {
              i += 1;
              while (i < lines.length && lines[i].level > 1) i += 1;
            } else {
              const { event, nextI } = parseEventBlock(lines, i, eventTag, 1);
              person.events.push(event);
              i = nextI;
            }
            continue;
          }

          if (current.tag === "NAME") {
            const nameBlock: ParsedGedcomName = {
              raw: current.value,
              ...parseRawGedcomName(current.value),
            };
            i += 1;
            while (i < lines.length && lines[i].level > 1) {
              const sub = lines[i];
              if (sub.level === 2) {
                if (sub.tag === "GIVN" && sub.value) nameBlock.firstName = sub.value;
                else if (sub.tag === "SURN" && sub.value) nameBlock.lastName = sub.value;
                else if (sub.tag === "NICK" && sub.value) nameBlock.nickname = sub.value;
                else if (sub.tag === "TYPE" && sub.value) nameBlock.type = sub.value;
              }
              i += 1;
            }
            names.push(nameBlock);
            continue;
          }

          if (current.tag === "OBJE" && current.value) {
            const mediaId = normalizeId(current.value);
            person.mediaIds.push(mediaId);
            i += 1;
            while (i < lines.length && lines[i].level > 1) {
              const sub = lines[i];
              if (sub.level === 2 && sub.tag === "_PRIM" && sub.value === "YES") {
                person.primaryMediaId = mediaId;
              }
              i += 1;
            }
            continue;
          }

          if (current.tag === "SEX") {
            person.sex = parseSex(current.value);
          } else if (current.tag === "FAMC" && current.value) {
            person.famcIds.push(normalizeId(current.value));
          } else if (current.tag === "FAMS" && current.value) {
            person.famsIds.push(normalizeId(current.value));
          } else if (current.tag === "OCCU" && current.value) {
            person.occupation ??= current.value;
          } else if (current.tag === "TITL" && current.value) {
            person.title ??= current.value;
          }

          i += 1;
          continue;
        }

        i += 1;
      }

      const bestName = pickBestName(names);
      if (bestName?.firstName) person.firstName = bestName.firstName;
      if (bestName?.lastName)  person.lastName  = bestName.lastName;
      if (bestName?.nickname)  person.nickname  = bestName.nickname;

      graph.people[personId] = person;
      continue;
    }

    // ── FAM ───────────────────────────────────────────────────────────────
    if (line.level === 0 && line.xrefId && line.tag === "FAM") {
      const familyId = normalizeId(line.xrefId);
      const family: FamilyGraphFamily = { id: familyId, childIds: [], events: [], mediaIds: [] };

      i += 1;

      while (i < lines.length && lines[i].level > 0) {
        const current = lines[i];

        if (current.level === 1) {
          const eventTag = FAM_EVENT_TAGS[current.tag];
          if (eventTag !== undefined) {
            const { event, nextI } = parseEventBlock(lines, i, eventTag, 1);
            family.events.push(event);
            i = nextI;
            continue;
          }

          if (current.tag === "HUSB" && current.value) {
            family.husbandId = normalizeId(current.value);
          } else if (current.tag === "WIFE" && current.value) {
            family.wifeId = normalizeId(current.value);
          } else if (current.tag === "CHIL" && current.value) {
            family.childIds.push(normalizeId(current.value));
          } else if (current.tag === "OBJE" && current.value) {
            const mediaId = normalizeId(current.value);
            family.mediaIds.push(mediaId);
            i += 1;
            while (i < lines.length && lines[i].level > 1) {
              if (lines[i].tag === "_PRIM" && lines[i].value === "YES") {
                family.primaryMediaId = mediaId;
              }
              i += 1;
            }
            continue;
          }
        }

        i += 1;
      }

      graph.families[familyId] = family;
      continue;
    }

    // ── OBJE (global record) ──────────────────────────────────────────────
    if (line.level === 0 && line.xrefId && line.tag === "OBJE") {
      const mediaId = normalizeId(line.xrefId);
      const media: GedcomMedia = { id: mediaId };

      i += 1;

      while (i < lines.length && lines[i].level > 0) {
        const current = lines[i];

        if (current.level === 1) {
          if (current.tag === "TITL" && current.value) {
            media.title = current.value;
          } else if (current.tag === "FILE" && current.value) {
            media.file = mediaBasePath
              ? resolveMediaFile(current.value, mediaBasePath)
              : current.value;
          }
        }

        if (current.level === 2 && current.tag === "FORM" && current.value) {
          media.form = current.value;
        }

        i += 1;
      }

      graph.media[mediaId] = media;
      continue;
    }

    i += 1;
  }

  return graph;
}