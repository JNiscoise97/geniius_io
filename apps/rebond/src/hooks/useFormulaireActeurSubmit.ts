// useFormulaireActeurSubmit.ts
import { toast } from "sonner"
import type { ActeurFields, Entity } from "@/types/analyse"
import { sanitizeActeurFields } from "@/store/useEntityStore"

export function createFormulaireActeurSubmitHandlers({
  getFields,
  getMode,
  entity,
  acteId,
  categorie_id,
  onSuccess,
  addEntity,
  updateEntity,
  deleteEntity,
  addMentionToEntity
}: {
  getFields: () => ActeurFields
  getMode: () => "create" | "edit" | "view"
  entity?: Entity
  acteId: string
  categorie_id: string
  onSuccess?: () => void
  addEntity: any
  updateEntity: any
  deleteEntity: any
  addMentionToEntity: any
}) {
  const submit = async () => {
    const mode = getMode()
    const fields = getFields()
    const { label } = fields

    if (!label.trim()) {
      toast.error("Le label est obligatoire pour enregistrer l’acteur.")
      return
    }
    
    const mapping = {
      cible_type: "acteur" as const,
      acteur: sanitizeActeurFields(fields),
    }

    if (mode === "edit" && entity?.id) {
      await updateEntity(entity.id, { label, mapping })
      toast.success("Acteur modifié.")
      onSuccess?.()
      return
    }

    const entityPayload = {
      acte_id: acteId,
      categorie_id,
      label,
      mapping,
      source_table:"actes"
    }

    const result = await addEntity(acteId, entityPayload)

    if (result && entity?.mentions?.length) {
      const tempMention = entity.mentions.find((m) => m.id === "__temp__")
      if (tempMention) {
        await addMentionToEntity({
          entite_id: result,
          bloc_id: tempMention.bloc_id,
          start: tempMention.start,
          end: tempMention.end,
          preview: tempMention.preview,
        })
      }
    }

    if (result) {
      toast.success("Acteur enregistré.")
      onSuccess?.()
    } else {
      toast.error("Impossible d’enregistrer l’acteur.")
    }
  }

  const remove = async () => {
    if (!entity?.id) return

    const confirmed = confirm("Êtes-vous sûr de vouloir supprimer cette entité ?")
    if (!confirmed) return

    await deleteEntity(entity.id)
    onSuccess?.()
  }

  return { submit, remove }
}
