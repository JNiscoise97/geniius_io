import graphUrl from "./data/family-graph.generated.json?url"
import type { FamilyGraphData } from "./types/graph"

// ── Singleton ─────────────────────────────────────────────────────────────────

let _data: FamilyGraphData | null = null

// Kick off the fetch immediately so the data arrives as early as possible.
// Used by <GraphBootstrap> via React.use() — do NOT throw this promise yourself,
// let React.use() handle Suspense correctly.
export const graphPromise: Promise<FamilyGraphData> = fetch(graphUrl)
  .then((r) => {
    if (!r.ok) throw new Error(`Graph fetch failed: ${r.status}`)
    return r.json() as Promise<FamilyGraphData>
  })
  .then((data) => { _data = data; return data })

// ── Accessor ──────────────────────────────────────────────────────────────────

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
// after <GraphBootstrap> has resolved.

export const FAMILY_GRAPH: FamilyGraphData = new Proxy({} as FamilyGraphData, {
  get(_, prop) {
    if (typeof prop === 'symbol') return undefined
    return (getGraph() as Record<string, unknown>)[prop as string]
  },
})
