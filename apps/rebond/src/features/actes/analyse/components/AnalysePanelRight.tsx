// AnalysePanelRight.tsx
 
import type { Entity } from "@/types/analyse"
import { useEntityStore } from "@/store/useEntityStore"
import { useCallback, useMemo, useState } from "react"
import { AnalyseRightHeader } from "./AnalysePanelRightHeader"
import { AnalysePanelRightFooter } from "./AnalysePanelRightFooter"
import { AnalysePanelRightBody } from "./AnalysePanelRightBody"
import { useEffect, useRef } from "react"

export function AnalyseRightPanel({
  acteId,
  entity,
  mode,
  setSelectedEntity,
  setMode,
  setRightVisible,
}: {
  acteId: string
  entity: Entity | null
  mode: "view" | "edit" | "create"
  setSelectedEntity: (e: Entity | null) => void
  setMode: (mode: "view" | "edit" | "create") => void
  setRightVisible: (v: boolean) => void
}) {


  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }, 0) // attend que le DOM soit monté
  
    return () => clearTimeout(timeout)
  }, [entity?.id])
  

  const { categories } = useEntityStore()

  const [handleSave, setHandleSave] = useState<() => void>(() => {})
  const [handleDelete, setHandleDelete] = useState<() => void>(() => {})

  const setOnSaveHandler = useCallback((fn: () => void) => {
    setHandleSave(() => fn)
  }, [])

  const setOnDeleteHandler = useCallback((fn: () => void) => {
    setHandleDelete(() => fn)
  }, [])

  // 💡 Récupération directe de la catégorie liée
  const categoryMeta = useMemo(() => {
    if (!entity?.categorie_id) return null
    return categories.find((c) => String(c.id) === String(entity.categorie_id)) || null
  }, [entity?.categorie_id, categories])

  const categorieLabel = categoryMeta?.categorie || ""
  const sousCategorieLabel = categoryMeta?.sous_categorie || ""
  const categorieId = String(entity?.categorie_id || "")

  return (
    <aside className="flex flex-col h-full max-h-screen bg-gray-50 border-l w-full">
      {/* Header : fixe */}
      <header className="p-4 border-b shrink-0">
        <AnalyseRightHeader
          mode={mode}
          sousCategorieLabel={sousCategorieLabel}
          hasEntity={!!entity}
        />
      </header>

      {/* Body : scrollable */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <AnalysePanelRightBody
          mode={mode}
          entity={entity}
          categorieLabel={categorieLabel}
          categorieId={categorieId}
          acteId={acteId}
          setMode={setMode}
          setSelectedEntity={setSelectedEntity}
          setRightVisible={setRightVisible}
          setOnSaveHandler={setOnSaveHandler}
          setOnDeleteHandler={setOnDeleteHandler}
        />
      </main>

      {/* Footer : fixe */}
      <footer className="shrink-0 border-t bg-white">
        <AnalysePanelRightFooter
          mode={mode}
          onEdit={() => setMode("edit")}
          onSave={handleSave}
          onCancel={() => setMode("view")}
          onDelete={handleDelete}
        />
      </footer>
    </aside>

  )
}
