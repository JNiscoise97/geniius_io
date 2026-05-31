// ── Types publics ─────────────────────────────────────────────────────────────

export type GedcomPartialDate = {
  year?: number;
  month?: number; // 1-12
  day?: number;
};

export type GedcomDate = {
  /** Valeur brute telle qu'elle apparaît dans le GEDCOM */
  raw: string;
  /**
   * Représentation ISO-like de la date principale (ou de début pour
   * les intervalles) : "1848-12-20" | "1848-12" | "1848"
   */
  normalized?: string;
  kind:
    | "exact"        // date précise ou partielle
    | "about"        // ABT
    | "estimated"    // EST
    | "calculated"   // CAL
    | "before"       // BEF
    | "after"        // AFT
    | "between"      // BET … AND …
    | "period"       // FROM … TO …  (ou FROM seul, ou TO seul)
    | "phrase"       // (texte libre entre parenthèses)
    | "unknown";     // non reconnu
  calendar?: "gregorian" | "julian" | "french_republican" | "hebrew" | "unknown";
  /** Date de début (ou date unique pour exact/about/…) */
  start?: GedcomPartialDate;
  /** Date de fin pour between / period */
  end?: GedcomPartialDate;
  /** Précision de la date principale */
  precision?: "day" | "month" | "year";
  confidence?: "certain" | "approximate" | "uncertain";
  /**
   * Valeur de tri ISO + précision, toujours présente quand au moins
   * une année est connue. Utilisé pour trier les événements.
   */
  sort?: {
    value: string;       // ex: "1848-12-20"
    precision: "day" | "month" | "year";
  };
};

// ── Table des mois GEDCOM ────────────────────────────────────────────────────

const GEDCOM_MONTHS: Record<string, number> = {
  // Standard gregorian/julian
  JAN: 1, FEB: 2, MAR: 3, APR: 4,  MAY: 5,  JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  // French republican
  VEND: 1, BRUM: 2, FRIM: 3, NIVO: 4, PLUV: 5, VENT: 6,
  GERM: 7, FLOR: 8, PRAI: 9, MESS: 10, THER: 11, FRUC: 12,
  COMP: 13,
  // Hebrew
  TSH: 1, CSH: 2, KSL: 3, TVT: 4, SHV: 5, ADR: 6,
  ADS: 7, NSN: 8, IYR: 9, SVN: 10, TMZ: 11, AAV: 12, ELL: 13,
};

// ── Confiance selon le kind ───────────────────────────────────────────────────

function confidenceFor(
  kind: GedcomDate["kind"],
): GedcomDate["confidence"] {
  switch (kind) {
    case "exact":
    case "between":
    case "period":
      return "certain";
    case "about":
    case "calculated":
    case "before":
    case "after":
      return "approximate";
    case "estimated":
    case "phrase":
    case "unknown":
      return "uncertain";
  }
}

// ── Parseur d'une date partielle ──────────────────────────────────────────────

function parsePartial(token: string): GedcomPartialDate | undefined {
  const parts = token.trim().split(/\s+/);

  if (parts.length === 3) {
    const day   = parseInt(parts[0], 10);
    const month = GEDCOM_MONTHS[parts[1].toUpperCase()];
    const year  = parseInt(parts[2], 10);
    if (!isNaN(day) && month && !isNaN(year)) return { year, month, day };
  }

  if (parts.length === 2) {
    const month = GEDCOM_MONTHS[parts[0].toUpperCase()];
    const year  = parseInt(parts[1], 10);
    if (month && !isNaN(year)) return { year, month };
  }

  if (parts.length === 1) {
    const year = parseInt(parts[0], 10);
    if (!isNaN(year)) return { year };
  }

  return undefined;
}

// ── Calcul de normalized et sort ──────────────────────────────────────────────

function toISO(p?: GedcomPartialDate): string | undefined {
  if (!p?.year) return undefined;
  const y = String(p.year).padStart(4, "0");
  if (!p.month) return y;
  const m = String(p.month).padStart(2, "0");
  if (!p.day) return `${y}-${m}`;
  const d = String(p.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function precisionOf(p?: GedcomPartialDate): "day" | "month" | "year" | undefined {
  if (!p?.year) return undefined;
  if (p.day)   return "day";
  if (p.month) return "month";
  return "year";
}

// ── Extraction du calendrier ──────────────────────────────────────────────────

const CALENDAR_PATTERNS: Array<{ re: RegExp; cal: GedcomDate["calendar"] }> = [
  { re: /@#DGREGORIAN@/i,   cal: "gregorian" },
  { re: /@#DJULIAN@/i,      cal: "julian" },
  { re: /@#DFRENCH\s*R@/i,  cal: "french_republican" },
  { re: /@#DHEBREW@/i,      cal: "hebrew" },
  { re: /@#D[A-Z ]+@/i,     cal: "unknown" },
];

function extractCalendar(
  raw: string,
): { calendar: GedcomDate["calendar"] | undefined; rest: string } {
  for (const { re, cal } of CALENDAR_PATTERNS) {
    if (re.test(raw)) {
      return { calendar: cal, rest: raw.replace(re, "").trim() };
    }
  }
  return { calendar: undefined, rest: raw };
}

// ── Parser principal ──────────────────────────────────────────────────────────

export function parseGedcomDate(raw: string): GedcomDate {
  const trimmed = raw.trim();

  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return { raw, kind: "phrase", confidence: "uncertain" };
  }

  const { calendar, rest } = extractCalendar(trimmed);
  const upper = rest.toUpperCase();

  // BET … AND …
  const betMatch = upper.match(/^BET\s+(.+?)\s+AND\s+(.+)$/);
  if (betMatch) {
    const start = parsePartial(rest.slice(4, 4 + betMatch[1].length));
    const end   = parsePartial(rest.slice(rest.toUpperCase().indexOf(" AND ") + 5));
    const norm  = toISO(start);
    const prec  = precisionOf(start);
    return {
      raw, kind: "between", calendar, start, end,
      normalized: norm, precision: prec, confidence: "certain",
      sort: norm && prec ? { value: norm, precision: prec } : undefined,
    };
  }

  // FROM … TO …
  const fromToMatch = upper.match(/^FROM\s+(.+?)\s+TO\s+(.+)$/);
  if (fromToMatch) {
    const startStr = rest.slice(5, 5 + fromToMatch[1].length);
    const endStr   = rest.slice(rest.toUpperCase().indexOf(" TO ") + 4);
    const start = parsePartial(startStr);
    const end   = parsePartial(endStr);
    const norm  = toISO(start);
    const prec  = precisionOf(start);
    return {
      raw, kind: "period", calendar, start, end,
      normalized: norm, precision: prec, confidence: "certain",
      sort: norm && prec ? { value: norm, precision: prec } : undefined,
    };
  }

  // FROM …
  const fromMatch = upper.match(/^FROM\s+(.+)$/);
  if (fromMatch) {
    const start = parsePartial(rest.slice(5));
    const norm  = toISO(start);
    const prec  = precisionOf(start);
    return {
      raw, kind: "period", calendar, start,
      normalized: norm, precision: prec, confidence: "certain",
      sort: norm && prec ? { value: norm, precision: prec } : undefined,
    };
  }

  // TO …
  const toMatch = upper.match(/^TO\s+(.+)$/);
  if (toMatch) {
    const end  = parsePartial(rest.slice(3));
    const norm = toISO(end);
    const prec = precisionOf(end);
    return {
      raw, kind: "period", calendar, end,
      normalized: norm, precision: prec, confidence: "certain",
      sort: norm && prec ? { value: norm, precision: prec } : undefined,
    };
  }

  // Modificateurs simples
  const MODIFIERS: Array<{ re: RegExp; kind: GedcomDate["kind"]; offset: number }> = [
    { re: /^ABT\s+/,    kind: "about",      offset: 4 },
    { re: /^ABOUT\s+/,  kind: "about",      offset: 6 },
    { re: /^EST\s+/,    kind: "estimated",  offset: 4 },
    { re: /^CAL\s+/,    kind: "calculated", offset: 4 },
    { re: /^BEF\s+/,    kind: "before",     offset: 4 },
    { re: /^BEFORE\s+/, kind: "before",     offset: 7 },
    { re: /^AFT\s+/,    kind: "after",      offset: 4 },
    { re: /^AFTER\s+/,  kind: "after",      offset: 6 },
  ];

  for (const { re, kind, offset } of MODIFIERS) {
    if (re.test(upper)) {
      const partial = parsePartial(rest.slice(offset));
      const norm    = toISO(partial);
      const prec    = precisionOf(partial);
      return {
        raw, kind, calendar, start: partial,
        normalized: norm, precision: prec,
        confidence: confidenceFor(kind),
        sort: norm && prec ? { value: norm, precision: prec } : undefined,
      };
    }
  }

  // Date exacte
  const partial = parsePartial(rest);
  if (partial) {
    const norm = toISO(partial);
    const prec = precisionOf(partial);
    return {
      raw, kind: "exact", calendar, start: partial,
      normalized: norm, precision: prec, confidence: "certain",
      sort: norm && prec ? { value: norm, precision: prec } : undefined,
    };
  }

  return { raw, kind: "unknown", confidence: "uncertain" };
}

// ── Helpers publics ───────────────────────────────────────────────────────────

/**
 * Extrait l'année principale d'un GedcomDate.
 * Accepte undefined — retourne undefined sans crasher.
 */
export function getYear(date: GedcomDate | undefined): number | undefined {
  if (!date) return undefined;
  return date.start?.year ?? date.end?.year;
}

/**
 * Formate une GedcomDate pour l'UI.
 * Accepte undefined — retourne '' sans crasher.
 */
export function formatGedcomDate(
  date: GedcomDate | undefined,
  locale = "fr",
): string {
  if (!date) return "";

  const fmtPartial = (p?: GedcomPartialDate): string => {
    if (!p) return "";
    if (p.day && p.month && p.year) {
      return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(p.year, p.month - 1, p.day));
    }
    if (p.month && p.year) {
      return new Intl.DateTimeFormat(locale, {
        month: "short",
        year: "numeric",
      }).format(new Date(p.year, p.month - 1, 1));
    }
    return p.year ? String(p.year) : "";
  };

  switch (date.kind) {
    case "exact":      return fmtPartial(date.start);
    case "about":      return `v. ${fmtPartial(date.start)}`;
    case "estimated":  return `est. ${fmtPartial(date.start)}`;
    case "calculated": return `calc. ${fmtPartial(date.start)}`;
    case "before":     return `av. ${fmtPartial(date.start)}`;
    case "after":      return `ap. ${fmtPartial(date.start)}`;
    case "between":
      return `${fmtPartial(date.start)}–${fmtPartial(date.end)}`;
    case "period":
      if (date.start && date.end)
        return `${fmtPartial(date.start)}–${fmtPartial(date.end)}`;
      if (date.start) return `à partir de ${fmtPartial(date.start)}`;
      if (date.end)   return `jusqu'en ${fmtPartial(date.end)}`;
      return "";
    case "phrase":
      return date.raw.slice(1, -1);
    case "unknown":
    default:
      return date.raw;
  }
}