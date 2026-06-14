/// <reference types="node" />
import fs from "fs";
import path from "path";

const rootDir = process.cwd();

// ── Adapt this URL / output path if needed ──────────────────────────────────
const url = "https://www.anchoukaj.org/resultats.php?nom=%25&button=rechercher";
const outputPath = path.resolve(rootDir, "data/anchoukaj/anchoukaj-results.txt");
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts the substring of `html` corresponding to the element whose
 * opening tag is `<div id="main_content">`, by balancing nested <div> tags.
 */
function extractMainContent(html: string): string {
  const openTagMatch = html.match(/<div[^>]*id="main_content"[^>]*>/);
  if (!openTagMatch) {
    throw new Error("#main_content not found in HTML");
  }

  const start = openTagMatch.index! + openTagMatch[0].length;
  const divTagRegex = /<div\b[^>]*>|<\/div>/gi;
  divTagRegex.lastIndex = start;

  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = divTagRegex.exec(html))) {
    if (match[0].startsWith("</")) {
      depth--;
      if (depth === 0) {
        return html.slice(start, match.index);
      }
    } else {
      depth++;
    }
  }

  throw new Error("#main_content has no matching closing </div>");
}

/**
 * Finds every `<p class="titreresultat">` block and extracts the
 * idre / id pair from its detail_personne.php link.
 */
function extractIdPairs(mainContent: string): { idre: string; id: string }[] {
  const pairs: { idre: string; id: string }[] = [];
  const blockRegex =
    /<p class="titreresultat">[\s\S]*?<a href="detail_personne\.php\?idre=(\d+)&id=(\d+)&print=1"/g;

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(mainContent))) {
    pairs.push({ idre: match[1], id: match[2] });
  }

  return pairs;
}

async function main(): Promise<void> {
  console.log(`Fetching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();

  console.log("Extracting #main_content…");
  const mainContent = extractMainContent(html);

  console.log("Extracting idre/id combinations…");
  const pairs = extractIdPairs(mainContent);

  console.log(`Found ${pairs.length} combinations.`);

  const content =
    `# Anchoukaj - idre/id combinations\n` +
    `# Source : ${url}\n` +
    `# Total  : ${pairs.length}\n\n` +
    pairs.map((p) => `idre=${p.idre}&id=${p.id}`).join("\n") +
    "\n";

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, "utf8");
  console.log(`\nResults written to: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
