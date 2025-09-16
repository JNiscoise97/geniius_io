import { useRef, useEffect, useState } from "react"
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Breadcrumb } from "../shared/Breadcrumb"

type Layout3VoletsProps = {
  acteId: string
  titre: string
  Center: React.ReactNode
  Left?: React.ReactNode
  Right?: React.ReactNode
  leftVisible?: boolean
  rightVisible?: boolean
  leftInitialCollapsed?: boolean
  rightInitialCollapsed?: boolean
  leftMinSize?: number
  leftMaxSize?: number
  rightMinSize?: number
  rightMaxSize?: number
}

export function Layout3Volets({
  acteId,
  titre,
  Left,
  Center,
  Right,
  leftVisible = true,
  rightVisible = true,
  leftInitialCollapsed = false,
  rightInitialCollapsed = false,
  leftMinSize = 0,
  leftMaxSize = 30,
  rightMinSize = 10,
  rightMaxSize = 25,
}: Layout3VoletsProps) {
  const leftRef = useRef<ImperativePanelHandle>(null)
  const rightRef = useRef<ImperativePanelHandle>(null)

  const [leftCollapsed, setLeftCollapsed] = useState(leftInitialCollapsed)
  const [rightCollapsed, setRightCollapsed] = useState(rightInitialCollapsed)

  // Init collapse on mount
  useEffect(() => {
    if (leftInitialCollapsed) leftRef.current?.collapse()
    if (rightInitialCollapsed) rightRef.current?.collapse()
  }, [])

  // Sync leftVisible dynamically
  useEffect(() => {
    if (leftVisible) {
      leftRef.current?.expand()
    } else {
      leftRef.current?.collapse()
    }
  }, [leftVisible])

  // Sync rightVisible dynamically
  useEffect(() => {
    if (rightVisible) {
      rightRef.current?.expand()
      rightRef.current?.resize(50) // facultatif : ajuste la taille à 50% à l'ouverture
    } else {
      rightRef.current?.collapse()
    }
  }, [rightVisible])

  return (
    <div className="flex flex-col h-full w-full">
      {/* Zone 3 volets */}
      <PanelGroup direction="horizontal" className="flex-1 px-5">
        {/* LEFT PANEL */}
        <Panel
          ref={leftRef}
          defaultSize={leftInitialCollapsed ? 0 : 20}
          minSize={leftMinSize}
          maxSize={leftMaxSize}
          collapsible
          onCollapse={() => setLeftCollapsed(true)}
          onExpand={() => setLeftCollapsed(false)}
        >
          {Left}
        </Panel>

        <PanelResizeHandle className="w-2 bg-gray-200 flex items-center justify-center relative">
          {leftCollapsed ? (
            <button
              className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white border rounded p-1 shadow hover:bg-gray-100"
              onClick={() => leftRef.current?.expand()}
              title="Réouvrir le panneau de gauche"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white border rounded p-1 shadow hover:bg-gray-100"
              onClick={() => leftRef.current?.collapse()}
              title="Réduire le panneau de gauche"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </PanelResizeHandle>

        {/* CENTER PANEL */}
        <Panel defaultSize={60} minSize={40}>
          <div className="h-full overflow-auto">{Center}</div>
        </Panel>

        {/* RIGHT PANEL */}
        <PanelResizeHandle className="w-2 bg-gray-200 flex items-center justify-center relative">
          {rightCollapsed ? (
            <button
              className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border rounded p-1 shadow hover:bg-gray-100"
              onClick={() => rightRef.current?.expand()}
              title="Réouvrir le panneau de droite"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <button
              className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border rounded p-1 shadow hover:bg-gray-100"
              onClick={() => rightRef.current?.collapse()}
              title="Réduire le panneau de droite"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </PanelResizeHandle>

        <Panel
          ref={rightRef}
          defaultSize={rightInitialCollapsed ? 0 : 20}
          minSize={rightMinSize}
          maxSize={rightMaxSize}
          collapsible
          onCollapse={() => setRightCollapsed(true)}
          onExpand={() => setRightCollapsed(false)}
        >
          {Right}
        </Panel>
      </PanelGroup>
    </div>
  )
}
