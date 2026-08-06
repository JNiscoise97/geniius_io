// AnalysePanelRightBody.tsx

import type { Entity } from "@/types/analyse"
import { BlocActeurs } from "./blocPanel/BlocActeurs"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export function AnalysePanelRightBody({
  mode,
  entity,
  categorieLabel,
  categorieId,
  acteId,
  setMode,
  setSelectedEntity,
  setRightVisible,
  setOnSaveHandler,
  setOnDeleteHandler
}: {
  mode: "view" | "edit" | "create"
  entity: Entity | null
  categorieLabel: string
  categorieId: string
  acteId: string
  setMode: (mode: "view" | "edit" | "create") => void
  setSelectedEntity: (e: Entity | null) => void
  setRightVisible: (v: boolean) => void
  setOnSaveHandler: (fn: () => void) => void
  setOnDeleteHandler: (fn: () => void) => void
}) {

  if (!entity) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8 px-4">
        <p>Veuillez sélectionner une entité à gauche.</p>
        <Button className="mt-4">
          <PlusCircle className="w-4 h-4 mr-2" />
          Créer une entité
        </Button>
      </div>
    )
  }

  const categorie = categorieLabel.toLowerCase()
  const handleClose = () => {
    setMode("view")
    setSelectedEntity(null)
    setRightVisible(false)
  }

  switch (categorie) {
    case "acteurs":
      return (
        <div className="space-y-6 px-4 pb-8">
          <BlocActeurs
            entity={entity}
            mode={mode}
            categorieId={categorieId}
            acteId={acteId}
            onClose={handleClose}
            onSubmit={handleClose}
            onSubmitClick={setOnSaveHandler}
            onDeleteClick={setOnDeleteHandler}
          />
        </div>
      )
    default:
      return (
        <p className="text-sm text-muted-foreground px-4 py-8">
          Interface de création pour la catégorie « {categorieLabel} » à venir...
        </p>
      )
  }
}
