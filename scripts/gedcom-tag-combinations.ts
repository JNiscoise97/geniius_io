/// <reference types="node" />
import fs from "fs";
import path from "path";

const rootDir = process.cwd();

// ── Adapt this path to your GEDCOM file ──────────────────────────────────────
const inputPath = path.resolve(
  rootDir,
  "data/Jordan Michel Nisçoise-20260525/Jordan Michel Nisçoise-20260525.ged",
);
const outputPath = path.resolve(
  rootDir,
  "data/Jordan Michel Nisçoise-20260525/gedcom-tag-combinations.txt",
);
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a GEDCOM file line-by-line and collects every unique tag path.
 *
 * A tag path is built by walking the level stack:
 *   level 0  →  record-type tag          (e.g. INDI, FAM, HEAD …)
 *   level 1  →  parent.child             (e.g. INDI.NAME)
 *   level 2  →  grandparent.parent.child (e.g. INDI.NAME.GIVN)
 *   …
 *
 * Level-0 lines that open a new record look like:
 *   0 @xref@ TAG   →  the record type is TAG
 *   0 TAG           →  HEAD, TRLR …
 *
 * All deeper lines:
 *   N TAG [value]
 */
function collectTagPaths(gedcomText: string): string[] {
  const paths = new Set<string>();

  // Stack holds the tag at each level, e.g. ["INDI", "BIRT", "PLAC"]
  const stack: string[] = [];

  for (const rawLine of gedcomText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // Parse: level [xref] tag [value]
    const match = line.match(/^(\d+)\s+(?:@[^@]+@\s+)?(\S+)/);
    if (!match) continue;

    const level = parseInt(match[1], 10);
    let tag = match[2];

    // Level 0 with an @xref@ pattern: the tag IS the record type
    // (already handled by the regex stripping the xref before tag)
    // But if it's the xref itself (like "@I1@"), skip – shouldn't happen
    // because we strip @…@ above; just guard:
    if (tag.startsWith("@")) continue;

    // Truncate stack to current level, then push new tag
    stack.length = level;
    stack[level] = tag;

    // Build the path from the stack up to current level
    const tagPath = stack.slice(0, level + 1).join(".");
    paths.add(tagPath);
  }

  // Sort: alphabetically, but group by top-level record type first
  return Array.from(paths).sort((a, b) => {
    const partsA = a.split(".");
    const partsB = b.split(".");
    // Primary sort: record type (level 0)
    if (partsA[0] !== partsB[0]) return partsA[0].localeCompare(partsB[0]);
    // Secondary sort: full path
    return a.localeCompare(b);
  });
}

function main(): void {
  console.log(`Reading: ${inputPath}`);
  const gedcomText = fs.readFileSync(inputPath, "utf8");

  console.log("Parsing tag paths…");
  const tagPaths = collectTagPaths(gedcomText);

  // ── Console output ──────────────────────────────────────────────────────
  console.log(`\nFound ${tagPaths.length} unique tag combinations:\n`);
  for (const p of tagPaths) {
    console.log(p);
  }

  // ── File output ─────────────────────────────────────────────────────────
  const content =
    `# GEDCOM tag combinations\n` +
    `# Source : ${path.basename(inputPath)}\n` +
    `# Total  : ${tagPaths.length} unique paths\n\n` +
    tagPaths.join("\n") +
    "\n";

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, "utf8");
  console.log(`\nResults written to: ${outputPath}`);
}

main();