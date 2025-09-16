// AnalyseEditor.tsx

import { useCallback, useEffect, useState } from "react"
import { AnalyseLeftPanel } from "@/features/actes/analyse/components/AnalysePanelLeft"
import { AnalyseCenterPanel } from "@/features/actes/analyse/components/AnalysePanelCenter"
import { AnalyseRightPanel } from "@/features/actes/analyse/components/AnalysePanelRight"
import { Layout3Volets } from "@/components/layout/Layout3Volets"
import type { Entity } from "@/types/analyse"
import { useEntityStore } from "@/store/useEntityStore"
import { useSelectionStore } from "@/store/useSelectionStore"


export default function AnalyseEditor({ acteId }: { acteId: string }) {
  const [mode, setMode] = useState<"view" | "create" | "edit">("view")
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [rightVisible, setRightVisible] = useState(false)

  const fetchEntities = useEntityStore((s) => s.fetchEntities)

  useEffect(() => {
    fetchEntities(acteId, "actes")
  }, [acteId])



  const selection = useSelectionStore((s) => s.selection)

  const handleAdd = (categorie_id: string) => {
    const label = selection?.text || ""
    const newEntity: Entity = {
      categorie_id,
      acte_id: acteId,
      label,
      // on peut aussi stocker temporairement la mention ici
      mentions: selection ? [{
        bloc_id: selection.blocId,
        start: selection.start,
        end: selection.end,
        preview: selection.text,
        entite_id: "__temp__",
        id: "__temp__"  // identifiant temporaire
      }] : [],
    }

    setSelectedEntity(newEntity)
    setMode("create")
    setRightVisible(true)
  }


  const handleSelect = useCallback((entity: Entity) => {
    setSelectedEntity((prev) =>
      prev?.id === entity.id ? prev : entity // évite un rerender inutile
    )
    setMode("view")
    setRightVisible(true)
  }, [])


  return (
    <Layout3Volets
      acteId={acteId}
      titre="Analyse de l’acte notarié"
      Left={<AnalyseLeftPanel onAdd={handleAdd} onSelect={handleSelect} />}
      Center={<AnalyseCenterPanel acteId={acteId} onSelectEntity={handleSelect} />}
      Right={<AnalyseRightPanel acteId={acteId} entity={selectedEntity} mode={mode} setSelectedEntity={setSelectedEntity}
        setMode={setMode} setRightVisible={setRightVisible}
      />}
      leftVisible={true}
      rightVisible={rightVisible}
      rightInitialCollapsed={!rightVisible}
      leftMinSize={15}
      leftMaxSize={30}
      rightMinSize={45}
      rightMaxSize={55}
    />
  )
}
