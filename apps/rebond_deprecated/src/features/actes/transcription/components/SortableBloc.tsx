import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { BlockView } from "./BlockView"
import type { Bloc } from "@/types/transcription"

interface SortableBlocProps {
  bloc: Bloc
  sectionId: string
  documentId: string
}

export function SortableBloc({ bloc, sectionId, documentId }: SortableBlocProps) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    listeners,
    attributes,
  } = useSortable({
    id: bloc.id,
    data: { sectionId, documentId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="bloc-wrapper">
      <BlockView
        bloc={bloc}
        dragListeners={listeners ?? {}}
        dragAttributes={attributes ?? {}}
        />
    </div>
  )
}
