//BlocMentions.tsx

import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, List } from "lucide-react"
import { useSelectionStore } from "@/store/useSelectionStore"
import { useEntityStore } from "@/store/useEntityStore"
import { useEffect } from "react"
import { DataTable, type ColumnDef } from "@/components/shared/DataTable"

export function BlocMentions({ entityId, mentions, onScrollToBloc }: { entityId: string | undefined, mentions: any[], onScrollToBloc?: (blocId: string) => void }) {
  if (!entityId) return null

  const entity = useEntityStore((s) => s.entities.find((e) => e.id === entityId))
  const selection = useSelectionStore((s) => s.selection)

  const addMention = useEntityStore((s) => s.addMentionToEntity)
  const deleteMention = useEntityStore((s) => s.deleteMention)
  const fetchMentionsForEntity = useEntityStore((s) => s.fetchMentionsForEntity)
  const updateEntityMentions = useEntityStore((s) => s.updateEntityMentions)

  useEffect(() => {
    const loadMentions = async () => {
      if (!entity?.id) return
      const fetched = await fetchMentionsForEntity(entity.id)
      updateEntityMentions(entity.id, fetched)
    }
    loadMentions()
  }, [entity?.id])

  const handleAddMention = async () => {
    if (!selection || !entity?.id) return
    await addMention({
      entite_id: entity.id,
      bloc_id: selection.blocId,
      start: selection.start,
      end: selection.end,
      preview: selection.text,
    })
    useSelectionStore.getState().setSelection(null)
  }

  const handleDeleteMention = async (id: string) => {
    if (!confirm("Supprimer cette mention ?")) return
    await deleteMention(id)
  }

  const columns: ColumnDef<any>[] = [
    {
      key: 'preview',
      label: 'Texte mentionné',
      render: (mention) => <span className="text-sm">{mention.preview}</span>,
      columnWidth: '70%',
    },
    {
  key: 'actions',
  label: '',
  render: (mention) => (
    <div className="flex justify-end gap-2">
      {mention.bloc_id && onScrollToBloc && (
        <Button
          variant="outline" size="sm"
          onClick={() => onScrollToBloc(mention.bloc_id)}
        >
          Voir
        </Button>
      )}
      {mention.id !== '__temp__' && (
        <Button
          variant="outline" size="icon"
          className="text-red-500 hover:text-red-600"
          onClick={() => handleDeleteMention(mention.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  ),
  columnWidth: '30%',
}

  ];


  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddMention}
          disabled={!selection || mentions.some((m) => m.id === '__temp__')}
        >
          <PlusCircle className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <DataTable
        title=""
        data={mentions}
        columns={columns}
        defaultVisibleColumns={['preview', 'voir', 'actions']}
        pageSize={5}
        showMenu={false}
      />
    </section>
  );
}
