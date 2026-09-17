import graphUrl from "./data/family-graph.generated.json?url"
import type { FamilyGraphData } from "./types/graph"
import { bridgeGetJson, BridgeError } from "../../lib/bridge/client"
import { convertTreeSnapshotToFamilyGraph, type TreeSnapshotJson } from "./convertTreeSnapshot"

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

// ── Graphe d'un arbre réel (pont admin, GET /trees/:id/current) ─────────────────
// Le pont déchiffre côté serveur et renvoie le JSON en clair (voir
// bridge/lib/src/current_tree_handler.dart) — ce module n'a donc jamais à
// connaître K_tree ni à faire de crypto. Converti depuis le format Dart
// (TreeSnapshot) vers FamilyGraphData (voir convertTreeSnapshot.ts).
// Mis en cache par treeId pour que <GraphBootstrap> puisse réutiliser la même
// promesse d'un rendu à l'autre (React.use() a besoin d'une référence stable).
//
// Les photos ne sont pas encore résolues ici (le pont n'a pas encore
// d'endpoint pour servir une photo déchiffrée) — `media` reste vide tant
// que cette brique n'existe pas ; les sections qui affichent des vignettes
// n'auront rien à montrer jusque-là.

const treeGraphPromises = new Map<string, Promise<FamilyGraphData>>()

export function loadGraphForTree(treeId: string): Promise<FamilyGraphData> {
  const cached = treeGraphPromises.get(treeId)
  if (cached) return cached

  const promise = bridgeGetJson<TreeSnapshotJson>(`/trees/${treeId}/current`)
    .then((snapshot) => convertTreeSnapshotToFamilyGraph(snapshot))
    .catch((error) => {
      if (error instanceof BridgeError) {
        console.error(`[geniius] Failed to load tree "${treeId}" from bridge:`, error.message)
      }
      return EMPTY_GRAPH
    })
    .then((data) => {
      _data = data
      return data
    })

  treeGraphPromises.set(treeId, promise)
  return promise
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
