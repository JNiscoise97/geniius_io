import graphUrl from "./data/family-graph.generated.json?url"
import type { FamilyGraphData } from "./types/graph"
import { supabase } from "../../lib/supabase/client"

const TREE_FILES_BUCKET = "tree-files"
const EMPTY_GRAPH: FamilyGraphData = { people: {}, families: {}, media: {} }

// ── État courant ──────────────────────────────────────────────────────────────
// Un seul graphe est "actif" à la fois — celui de l'arbre actuellement affiché.
// <GraphBootstrap> (monté par route, dans router.tsx) est responsable de charger
// le bon graphe avant de rendre l'explorateur, et donc de tenir _data à jour.

let _data: FamilyGraphData | null = null

// ── Graphe de démo (fichier statique, historique) ───────────────────────────────
// Chargement paresseux : ce fichier ne doit être récupéré que si un composant
// en a réellement besoin (aucune route ne l'utilise plus directement
// aujourd'hui — tout passe par loadGraphForTree — mais on garde ce chemin
// disponible). Un `const … = fetch(...)` au niveau module se déclenchait sur
// TOUTE page de l'app dès que ce fichier était importé transitivement, y
// compris la landing page.

let _demoGraphPromise: Promise<FamilyGraphData> | null = null

export function getDemoGraphPromise(): Promise<FamilyGraphData> {
  if (!_demoGraphPromise) {
    _demoGraphPromise = fetch(graphUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Graph fetch failed: ${r.status}`)
        return r.json() as Promise<FamilyGraphData>
      })
      .then((data) => { _data = data; return data })
  }
  return _demoGraphPromise
}

// ── Graphe d'un arbre importé (Supabase Storage, {treeId}/graph/graph.json) ─────
// Mis en cache par treeId pour que <GraphBootstrap> puisse réutiliser la même
// promesse d'un rendu à l'autre (React.use() a besoin d'une référence stable).

const treeGraphPromises = new Map<string, Promise<FamilyGraphData>>()

export function loadGraphForTree(treeId: string): Promise<FamilyGraphData> {
  const cached = treeGraphPromises.get(treeId)
  if (cached) return cached

  const promise = supabase.storage
    .from(TREE_FILES_BUCKET)
    .download(`${treeId}/graph/graph.json`)
    .then(async ({ data: blob, error }) => {
      if (error || !blob) return EMPTY_GRAPH
      try {
        return JSON.parse(await blob.text()) as FamilyGraphData
      } catch {
        return EMPTY_GRAPH
      }
    })
    .then(async (data) => {
      await resolveMediaUrls(treeId, data)
      _data = data
      return data
    })

  treeGraphPromises.set(treeId, promise)
  return promise
}

// ── Résolution des médias (Supabase Storage → URL signée) ───────────────────────
// Le GEDCOM référence ses médias par un chemin/nom de fichier (TITL ou FILE) qui
// vient du logiciel d'origine — quasi jamais celui sous lequel le fichier a été
// déposé dans le formulaire d'import. On rapatriche donc par nom de fichier
// seul (insensible à la casse), sur un niveau de dossier depuis
// {treeId}/media, et on résout les correspondances en URLs signées en un seul
// appel groupé plutôt qu'un par média.

async function resolveMediaUrls(treeId: string, data: FamilyGraphData): Promise<void> {
  const mediaEntries = Object.values(data.media ?? {})
  if (mediaEntries.length === 0) return

  const pathByBasename = new Map<string, string>()

  const { data: topLevel } = await supabase.storage
    .from(TREE_FILES_BUCKET)
    .list(`${treeId}/media`, { limit: 1000 })

  for (const entry of topLevel ?? []) {
    if (entry.id) {
      pathByBasename.set(entry.name.toLowerCase(), `${treeId}/media/${entry.name}`)
      continue
    }

    // Pas de métadonnée = sous-dossier (ex. import d'un dossier entier) — un
    // seul niveau de récursion, suffisant pour les cas d'usage actuels.
    const { data: nested } = await supabase.storage
      .from(TREE_FILES_BUCKET)
      .list(`${treeId}/media/${entry.name}`, { limit: 1000 })

    for (const nestedEntry of nested ?? []) {
      if (nestedEntry.id) {
        pathByBasename.set(
          nestedEntry.name.toLowerCase(),
          `${treeId}/media/${entry.name}/${nestedEntry.name}`,
        )
      }
    }
  }

  if (pathByBasename.size === 0) return

  const matches = mediaEntries.flatMap((media) => {
    const reference = media.file || media.title
    const basename = reference?.replace(/\\/g, '/').split('/').pop()?.toLowerCase()
    const path = basename ? pathByBasename.get(basename) : undefined
    return path ? [{ media, path }] : []
  })

  if (matches.length === 0) return

  const { data: signed } = await supabase.storage
    .from(TREE_FILES_BUCKET)
    .createSignedUrls(matches.map((m) => m.path), 60 * 60 * 6) // 6h — le temps d'une session de consultation

  signed?.forEach((result, index) => {
    if (result.signedUrl) matches[index].media.url = result.signedUrl
  })
}

// ── Accesseur ──────────────────────────────────────────────────────────────────

// Called at render time (after <GraphBootstrap> ensures the data is ready).
// Throws a plain Error — NOT a Promise — so it is never mistaken for a Suspense
// signal and never surfaces as "Uncaught Promise" in the console.
export function getGraph(): FamilyGraphData {
  if (!_data) throw new Error('[geniius] Graph not ready — is <GraphBootstrap> mounted?')
  return _data
}

// ── Backward-compatible proxy ─────────────────────────────────────────────────
// data.ts and all callers can keep using  `graph.people`, `graph.families`, etc.
// The proxy forwards each property access to getGraph(), which is always safe
// after <GraphBootstrap> has resolved — for whichever tree is currently active.

export const FAMILY_GRAPH: FamilyGraphData = new Proxy({} as FamilyGraphData, {
  get(_, prop) {
    if (typeof prop === 'symbol') return undefined
    return (getGraph() as Record<string, unknown>)[prop as string]
  },
})
