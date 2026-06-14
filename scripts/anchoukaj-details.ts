/// <reference types="node" />
import fs from "fs";
import path from "path";
import XLSX from "xlsx";

const rootDir = process.cwd();

// ── Adapt these paths if needed ──────────────────────────────────────────────
const inputPath = path.resolve(rootDir, "data/anchoukaj/anchoukaj-results.txt");
const checkpointPath = path.resolve(rootDir, "data/anchoukaj/anchoukaj-details.jsonl");
const outputPath = path.resolve(rootDir, "data/anchoukaj/anchoukaj-details.xlsx");

const CONCURRENCY = 6;
// ─────────────────────────────────────────────────────────────────────────────

const COLUMNS = [
  "idre",
  "id",
  "nom",
  "surnom",
  "matricule",
  "sexe",
  "acte",
  "article",
  "naissance_lieu",
  "habitation_nom",
  "habitation_commune",
  "enregistrement_nomination_date",
  "enregistrement_officier_ec",
  "enregistrement_lieu",
  "enregistrement_ile",
  "age_nomination",
  "metier",
  "mere_nom",
  "pere_nom",
] as const;

type Row = Record<(typeof COLUMNS)[number], string>;

interface Pair {
  idre: string;
  id: string;
}

/** Parses `idre=NUM&id=NUM` lines from the results file. */
function readPairs(filePath: string): Pair[] {
  const text = fs.readFileSync(filePath, "utf8");
  const pairs: Pair[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^idre=(\d+)&id=(\d+)$/);
    if (match) pairs.push({ idre: match[1], id: match[2] });
  }
  return pairs;
}

/** Reads already-fetched pairs from the checkpoint file (for resuming). */
function readCheckpoint(filePath: string): Map<string, Row> {
  const rows = new Map<string, Row>();
  if (!fs.existsSync(filePath)) return rows;

  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as Row;
    rows.set(`${row.idre}|${row.id}`, row);
  }
  return rows;
}

const ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  eacute: "é",
  egrave: "è",
  ecirc: "ê",
  euml: "ë",
  agrave: "à",
  acirc: "â",
  auml: "ä",
  ocirc: "ô",
  ouml: "ö",
  ucirc: "û",
  uuml: "ü",
  ugrave: "ù",
  icirc: "î",
  iuml: "ï",
  ccedil: "ç",
  Eacute: "É",
  Egrave: "È",
  Ecirc: "Ê",
  Agrave: "À",
  Acirc: "Â",
  Ocirc: "Ô",
  Ccedil: "Ç",
  oelig: "œ",
  OElig: "Œ",
  deg: "°",
};

/** Decodes the small set of HTML entities seen on anchoukaj.org pages. */
function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => ENTITIES[name] ?? m);
}

/** Strips remaining HTML tags, decodes entities, and collapses whitespace. */
function cleanText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Extracts the text found between `afterRe` and `untilRe` (or end of string). */
function extractBetween(html: string, afterRe: RegExp, untilRe: RegExp): string {
  const afterMatch = html.match(afterRe);
  if (!afterMatch || afterMatch.index === undefined) return "";

  const rest = html.slice(afterMatch.index + afterMatch[0].length);
  const untilMatch = rest.match(untilRe);
  const end = untilMatch && untilMatch.index !== undefined ? untilMatch.index : rest.length;
  return cleanText(rest.slice(0, end));
}

const BR = /<br\s*\/?>/i;
const END_P = /<\/p>/i;

/** Extracts the fields of interest from a #main_content HTML fragment. */
function parseMainContent(mainContent: string): Omit<Row, "idre" | "id"> {
  return {
    nom: extractBetween(mainContent, /<span class="titreresultat">/, /<\/span>/),
    surnom: extractBetween(mainContent, /<strong>Surnom<\/strong>\s*:/, /<strong>/),
    matricule: extractBetween(mainContent, /<strong>Matricule<\/strong>\s*:/, BR),
    sexe: extractBetween(mainContent, /<strong>Sexe<\/strong>\s*:/, BR),
    acte: extractBetween(mainContent, /<strong>Acte<\/strong>\s*:/, BR),
    article: extractBetween(mainContent, /<strong>Article<\/strong>\s*:/, BR),
    naissance_lieu: extractBetween(mainContent, /<strong>Lieu de naissance<\/strong>\s*:/, BR),
    habitation_nom: extractBetween(
      mainContent,
      /<strong>Nom de l'habitation<\/strong>\s*:/,
      BR,
    ),
    habitation_commune: extractBetween(
      mainContent,
      /<strong>Commune d'habitation<\/strong>\s*:/,
      END_P,
    ),
    enregistrement_nomination_date: extractBetween(
      mainContent,
      /Date de nomination\s*:/,
      BR,
    ),
    metier: extractBetween(mainContent, /<strong>M[^<]*tier<\/strong>\s*:/, BR),
    enregistrement_lieu: extractBetween(
      mainContent,
      /<strong>Lieu d'enregistrement[^<]*<\/strong>\s*:/,
      BR,
    ),
    enregistrement_ile: extractBetween(mainContent, /<strong>Ile<\/strong>\s*:/, BR),
    age_nomination: extractBetween(mainContent, /<strong>Age[^<]*nomination<\/strong>\s*:/, BR),
    enregistrement_officier_ec: extractBetween(
      mainContent,
      /Officier d'Etat Civil<\/strong>\s*:/,
      END_P,
    ),
    mere_nom: extractBetween(mainContent, /<strong>M[^<]*re<\/strong>\s*:/, BR),
    pere_nom: extractBetween(mainContent, /<strong>P[^<]*re<\/strong>\s*:/, END_P),
  };
}

/** Extracts the substring of `html` for the element `<div id="main_content">`. */
function extractMainContent(html: string): string {
  const openTagMatch = html.match(/<div[^>]*id="main_content"[^>]*>/);
  if (!openTagMatch || openTagMatch.index === undefined) {
    throw new Error("#main_content not found in HTML");
  }

  const start = openTagMatch.index + openTagMatch[0].length;
  const divTagRegex = /<div\b[^>]*>|<\/div>/gi;
  divTagRegex.lastIndex = start;

  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = divTagRegex.exec(html))) {
    if (match[0].startsWith("</")) {
      depth--;
      if (depth === 0) return html.slice(start, match.index);
    } else {
      depth++;
    }
  }

  throw new Error("#main_content has no matching closing </div>");
}

async function fetchRow(pair: Pair): Promise<Row> {
  const url = `https://www.anchoukaj.org/detail_personne.php?idre=${pair.idre}&id=${pair.id}&print=1`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  const html = await response.text();
  const mainContent = extractMainContent(html);
  return { idre: pair.idre, id: pair.id, ...parseMainContent(mainContent) };
}

/** Runs `tasks` with at most `concurrency` running at the same time. */
async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  async function run(): Promise<void> {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
}

function writeXlsx(rows: Map<string, Row>): void {
  const data = Array.from(rows.values()).map((row) =>
    COLUMNS.reduce((acc, col) => ({ ...acc, [col]: row[col] }), {} as Row),
  );
  const sheet = XLSX.utils.json_to_sheet(data, { header: COLUMNS as unknown as string[] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "anchoukaj");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  XLSX.writeFile(workbook, outputPath);
}

async function main(): Promise<void> {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

  let pairs = readPairs(inputPath);
  if (limit) pairs = pairs.slice(0, limit);

  const rows = readCheckpoint(checkpointPath);
  const remaining = pairs.filter((p) => !rows.has(`${p.idre}|${p.id}`));

  console.log(`Total combinations : ${pairs.length}`);
  console.log(`Already fetched    : ${rows.size}`);
  console.log(`Remaining          : ${remaining.length}`);

  fs.mkdirSync(path.dirname(checkpointPath), { recursive: true });
  const checkpointStream = fs.createWriteStream(checkpointPath, { flags: "a" });

  let done = 0;
  await runPool(remaining, CONCURRENCY, async (pair) => {
    try {
      const row = await fetchRow(pair);
      rows.set(`${pair.idre}|${pair.id}`, row);
      checkpointStream.write(JSON.stringify(row) + "\n");
    } catch (err) {
      console.error(`Failed for idre=${pair.idre}&id=${pair.id}:`, (err as Error).message);
    }
    done++;
    if (done % 100 === 0 || done === remaining.length) {
      console.log(`Progress: ${done}/${remaining.length}`);
    }
  });

  checkpointStream.end();

  console.log("Writing Excel file…");
  writeXlsx(rows);
  console.log(`\nResults written to: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
