// AnalysePanelRightFooter.tsx

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function AnalysePanelRightFooter({
  mode,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  mode: "view" | "edit" | "create"
  onEdit?: () => void
  onSave?: () => void
  onCancel?: () => void
  onDelete?: () => void
}) {
  return (
    <footer className="border-t bg-gray-100 px-6 py-4 space-y-2 shadow-inner">
      {mode === "view" && onEdit && (
        <Button className="w-full" onClick={onEdit}>
          Modifier l’entité
        </Button>
      )}

      {mode !== "view" && (
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onSave} disabled={!onSave}>Enregistrer</Button>
          <Button variant="outline" className="flex-1" onClick={onCancel}>Annuler</Button>
        </div>
      )}

      {mode === "edit" && onDelete && (
        <Button variant="destructive" className="w-full" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" /> Supprimer l’entité
        </Button>
      )}
    </footer>
  )
}
