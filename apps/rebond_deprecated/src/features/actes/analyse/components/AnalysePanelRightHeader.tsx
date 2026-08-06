// AnalysePanelRightHeader.tsx

import { Badge } from "@/components/ui/badge"

export function AnalyseRightHeader({
  mode,
  sousCategorieLabel,
  hasEntity,
}: {
  mode: "view" | "edit" | "create"
  sousCategorieLabel?: string
  hasEntity: boolean
}) {
  const title = {
    create: "Nouvel acteur",
    edit: "Modifier l'acteur",
    view: "Analyse de l'acteur",
  }[mode]

  const subtitle = {
    create: "Remplissez le formulaire pour ajouter un acteur.",
    edit: "Modifiez les informations de acteur sélectionné.",
    view: !hasEntity
      ? "Aucun acteur sélectionné."
      : "Consultez les données de l’acteur et ajoutez des mentions.",
  }[mode]

  return (
    <div className="px-6 py-5 border-b bg-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        {hasEntity && sousCategorieLabel && (
          <Badge
            variant="outline"
            className="capitalize text-xs px-2 py-1 bg-white border"
          >
            {sousCategorieLabel}
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
    </div>
  )
}
