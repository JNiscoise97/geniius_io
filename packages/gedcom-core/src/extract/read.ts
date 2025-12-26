// packages/gedcom-core/src/extract/read.ts
/**
 * GEDCOM reader helpers (gros volumes).
 *
 * Philosophie
 * - gedcom-core doit pouvoir parser des fichiers énormes (34k+ individus).
 * - On privilégie la lecture en flux (stream) et les générateurs async.
 * - On évite de charger tout le fichier en mémoire, sauf si le caller l’impose.
 *
 * Ce module fournit 3 niveaux d’API :
 *
 * 1) "text" (petit/moyen volume) :
 *    - toLinesFromText(text) -> string[]
 *
 * 2) "stream" (gros volumes, recommandé) :
 *    - linesFromReadable(readable) -> AsyncGenerator<string>
 *
 * 3) "file" (Node) :
 *    - linesFromFile(filePath) -> AsyncGenerator<string>
 *
 * Notes importantes :
 * - Les lignes GEDCOM ne sont pas forcément terminées par \n (dernier chunk).
 * - On normalise CRLF/CR vers LF.
 * - On garde le contenu en UTF-8 (standard GEDCOM export moderne).
 * - On ne tente pas de "déduire" les CONT/CONC ici : c’est le parser/builder.
 */

/* -------------------------------------------------------------------------- */
/* Types utilitaires                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Sous-ensemble de l’interface Node.js Readable (sans importer des types Node).
 * On reste compatible TS même si le projet n’a pas "types": ["node"].
 *
 * Si tu es dans Node, un fs.createReadStream() convient.
 * Dans un environnement web, tu peux adapter via stream/web => Readable-like.
 */
export type ReadableLike = {
  on(event: "data", cb: (chunk: unknown) => void): void;
  on(event: "end", cb: () => void): void;
  on(event: "error", cb: (err: unknown) => void): void;
  destroy?: (err?: unknown) => void;
  pause?: () => void;
  resume?: () => void;
};

/* -------------------------------------------------------------------------- */
/* Normalisation newlines                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Normalise les sauts de ligne :
 * - \r\n -> \n
 * - \r   -> \n
 *
 * Utile surtout en "mode text".
 */
export function normalizeNewlines(text: string): string {
  // Remplace CRLF puis CR seul
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/* -------------------------------------------------------------------------- */
/* Mode texte (moins recommandé pour gros fichiers)                            */
/* -------------------------------------------------------------------------- */

/**
 * Convertit un texte GEDCOM complet en tableau de lignes.
 * ⚠️ Pour gros fichiers, préfère linesFromReadable / linesFromFile.
 */
export function toLinesFromText(text: string): string[] {
  const normalized = normalizeNewlines(text);

  // split("\n") crée un tableau complet => mémoire proportionnelle au fichier
  // OK pour tests / petits fichiers, pas pour très gros GEDCOM.
  const lines = normalized.split("\n");

  // Option: on retire un éventuel dernier élément vide si le fichier finit par \n
  // (pas obligatoire, le parser peut gérer une ligne vide)
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines;
}

/* -------------------------------------------------------------------------- */
/* Mode stream: transform "chunks" -> lignes                                   */
/* -------------------------------------------------------------------------- */

/**
 * Convertit un chunk (Buffer/string/unknown) en string UTF-8.
 * - En Node, chunk est souvent un Buffer
 * - Dans certains cas, c’est déjà une string
 */
function chunkToString(chunk: unknown): string {
  if (typeof chunk === "string") return chunk;

  // Buffer en Node : possède généralement toString("utf8")
  // On reste permissif sans dépendre de types Node.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyChunk = chunk as any;
  if (anyChunk && typeof anyChunk.toString === "function") {
    // "utf8" = standard pour les GEDCOM actuels
    return anyChunk.toString("utf8");
  }

  // Dernier recours (devrait être rare)
  return String(chunk);
}

/**
 * Génère les lignes à partir d’un Readable (Node streams).
 *
 * Pourquoi un AsyncGenerator ?
 * - Permet au parser de consommer ligne par ligne (backpressure logique)
 * - Évite de stocker le fichier complet en mémoire
 */
export async function* linesFromReadable(
  readable: ReadableLike,
  opts?: {
    /**
     * Si true, on trim uniquement le BOM UTF-8 sur la première ligne si présent.
     * Certains exports GEDCOM ajoutent un BOM.
     */
    stripUtf8Bom?: boolean;

    /**
     * Par défaut on ignore les lignes vides.
     * Pour GEDCOM, les lignes vides sont rarement significatives.
     * Mets false si tu veux les conserver pour debug.
     */
    skipEmptyLines?: boolean;
  }
): AsyncGenerator<string> {
  const stripUtf8Bom = opts?.stripUtf8Bom ?? true;
  const skipEmptyLines = opts?.skipEmptyLines ?? true;

  // Buffer textuel : on stocke uniquement la partie non-terminée en fin de chunk
  let buffer = "";
  let isFirstLine = true;

  // On transforme les événements en itération async.
  // Approche: on pousse les chunks dans une queue, et on les consomme.
  const queue: string[] = [];
  let done = false;
  let error: unknown | null = null;
  let notify: (() => void) | null = null;

  const wake = () => {
    if (notify) {
      notify();
      notify = null;
    }
  };

  readable.on("data", (chunk) => {
    queue.push(chunkToString(chunk));
    wake();
  });

  readable.on("end", () => {
    done = true;
    wake();
  });

  readable.on("error", (err) => {
    error = err;
    done = true;
    wake();
  });

  while (!done || queue.length > 0) {
    if (error) {
      // Propage l’erreur au consumer
      throw error;
    }

    if (queue.length === 0) {
      await new Promise<void>((resolve) => {
        notify = resolve;
      });
      continue;
    }

    // On consomme un chunk
    const chunkStr = queue.shift() ?? "";
    if (!chunkStr) continue;

    // Normalisation newlines à ce stade :
    // - important car un chunk peut contenir \r\n ou \r
    // - ça simplifie le split ensuite
    const normalized = normalizeNewlines(chunkStr);

    buffer += normalized;

    // Découpe en lignes. La dernière entrée peut être "incomplète"
    // (pas de \n final), donc on la garde dans buffer.
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);

      // BOM UTF-8 éventuel en tout début de fichier
      if (isFirstLine && stripUtf8Bom && line.charCodeAt(0) === 0xfeff) {
        line = line.slice(1);
      }
      isFirstLine = false;

      if (skipEmptyLines && line.length === 0) continue;

      yield line;
    }
  }

  // Dernière ligne sans \n final
  if (error) throw error;

  if (buffer.length > 0) {
    let last = buffer;

    // BOM si fichier sans \n et une seule ligne
    if (isFirstLine && stripUtf8Bom && last.charCodeAt(0) === 0xfeff) {
      last = last.slice(1);
    }

    if (!(skipEmptyLines && last.length === 0)) {
      yield last;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Mode fichier (Node) : filePath -> ReadStream -> lignes                      */
/* -------------------------------------------------------------------------- */

/**
 * Lecture d’un fichier GEDCOM en streaming (Node).
 *
 * ⚠️ Ce fichier importe dynamiquement 'node:fs' pour ne pas casser les builds
 * web si tu compiles la lib pour un usage browser.
 *
 * Usage:
 * for await (const line of linesFromFile("C:\\path\\file.ged")) { ... }
 */
export async function* linesFromFile(
  filePath: string,
  opts?: {
    stripUtf8Bom?: boolean;
    skipEmptyLines?: boolean;

    /**
     * Taille de buffer interne du stream.
     * Plus grand = potentiellement plus rapide, mais plus de mémoire “en vol”.
     * Pour gros fichiers, 64KB à 1MB peut être correct selon machine.
     */
    highWaterMark?: number;
  }
): AsyncGenerator<string> {
  // Import dynamique pour rester bundler-friendly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fs: any = await import("node:fs");

  const stream = fs.createReadStream(filePath, {
    encoding: "utf8", // important: on veut des strings (sinon Buffer)
    highWaterMark: opts?.highWaterMark ?? 1024 * 256, // 256KB par défaut
  });

  // Délègue au reader streaming
  yield* linesFromReadable(stream, {
    stripUtf8Bom: opts?.stripUtf8Bom ?? true,
    skipEmptyLines: opts?.skipEmptyLines ?? true,
  });
}

/* -------------------------------------------------------------------------- */
/* Helpers "collect" (debug/tests)                                             */
/* -------------------------------------------------------------------------- */

/**
 * Collecte toutes les lignes d’un Readable en mémoire.
 * ⚠️ À réserver au debug/tests.
 */
export async function collectLinesFromReadable(
  readable: ReadableLike,
  opts?: { stripUtf8Bom?: boolean; skipEmptyLines?: boolean }
): Promise<string[]> {
  const out: string[] = [];
  for await (const line of linesFromReadable(readable, opts)) {
    out.push(line);
  }
  return out;
}

/**
 * Collecte toutes les lignes d’un fichier en mémoire.
 * ⚠️ À réserver au debug/tests (sur gros GEDCOM tu vas sentir passer la RAM).
 */
export async function collectLinesFromFile(
  filePath: string,
  opts?: { stripUtf8Bom?: boolean; skipEmptyLines?: boolean; highWaterMark?: number }
): Promise<string[]> {
  const out: string[] = [];
  for await (const line of linesFromFile(filePath, opts)) {
    out.push(line);
  }
  return out;
}
