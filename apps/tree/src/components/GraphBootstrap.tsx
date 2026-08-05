import { use, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getDemoGraphPromise, loadGraphForTree } from '../features/family-tree/loadGraph'

// Suspends until the graph for the CURRENT route is loaded: the demo graph
// outside of any tree route, or the imported graph for /trees/:treeId/*
// (Supabase Storage — see loadGraphForTree). Place inside a <Suspense>
// boundary. Once it renders, getGraph() / the FAMILY_GRAPH proxy are
// guaranteed to return the right tree's data.
//
// The promise must stay referentially stable across re-renders for the same
// treeId, or React.use() would re-suspend forever — hence useMemo keyed on
// treeId rather than calling loadGraphForTree() directly in the render body.
export function GraphBootstrap({ children }: { children: React.ReactNode }) {
  const { treeId } = useParams<{ treeId?: string }>()

  const promise = useMemo(
    () => (treeId ? loadGraphForTree(treeId) : getDemoGraphPromise()),
    [treeId],
  )

  use(promise)
  return <>{children}</>
}
