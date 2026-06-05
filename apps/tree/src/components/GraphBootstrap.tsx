import { use } from 'react'
import { graphPromise } from '../features/family-tree/loadGraph'

// Suspends the entire React tree until the 53 MB GEDCOM JSON is loaded.
// Place this inside a <Suspense> boundary. Once it renders, all calls to
// getGraph() / the FAMILY_GRAPH proxy are guaranteed to return real data.
export function GraphBootstrap({ children }: { children: React.ReactNode }) {
  use(graphPromise)
  return <>{children}</>
}
