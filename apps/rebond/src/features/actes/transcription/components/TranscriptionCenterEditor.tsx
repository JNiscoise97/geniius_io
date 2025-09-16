import { DocumentView } from "@/features/actes/transcription/components/DocumentView"
import { useDocumentStore } from "@/store/useDocumentStore"
import { Button } from "../../../../components/ui/button"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { useEffect, useState } from "react"
import type { Bloc } from "@/types/transcription"
import { BlockView } from "@/features/actes/transcription/components/BlockView"
import { statutConfig } from "@/features/actes/transcription/constants/statutConfig"
import { StatusPill } from "@/components/shared/StatusPill"
import { Info } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"


export function CenterEditor({ acteId }: { acteId: string }) {
  const documents = useDocumentStore((s) => s.documents)
  const fetchDocuments = useDocumentStore((s) => s.fetchDocuments)
  const addDocument = useDocumentStore((s) => s.addDocument)
  const reorderEntities = useDocumentStore((s) => s.reorderEntities)
  const moveBlocToSection = useDocumentStore((s) => s.moveBlocToSection)

  const [activeBloc, setActiveBloc] = useState<Bloc | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    fetchDocuments(acteId)
  }, [acteId, fetchDocuments])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      setActiveBloc(null)
      return
    }
  
    const state = useDocumentStore.getState()
  
    const fromSection = state.documents.flatMap((doc) =>
      doc.sections.map((section) => ({
        section,
        documentId: doc.id,
        bloc: section.blocs.find((b) => b.id === active.id)
      }))
    ).find((x) => x.bloc)
  
    const toSectionId = over.data.current?.sectionId
    const toDocumentId = over.data.current?.documentId
  
    if (!fromSection || !toSectionId || !toDocumentId) {
      console.warn("🔴 Impossible de déterminer les sections source et cible.")
      setActiveBloc(null)
      return
    }
  
    const toSection = state.documents
      .find((d) => d.id === toDocumentId)?.sections
      .find((s) => s.id === toSectionId)
  
    if (!toSection) {
      console.warn("🔴 Section cible introuvable.")
      setActiveBloc(null)
      return
    }
  
    const targetIndex = toSection.blocs.findIndex((b) => b.id === over.id)
  
    if (fromSection.section.id === toSectionId) {
      const activeId = String(active.id)
      const newOrder = [
        ...toSection.blocs.map((b) => b.id).filter((id) => id !== activeId)
      ]
      newOrder.splice(targetIndex, 0, activeId)
  
      reorderEntities({
        entity: "blocs",
        parentId: toSectionId,
        documentId: toDocumentId,
        newOrder
      })
  
    } else {
      moveBlocToSection(
        String(active.id),
        fromSection.section.id,
        toSectionId,
        toDocumentId,
        targetIndex
      )
    }
  
    setActiveBloc(null)
  }
  

  const findBlocById = (id: string): Bloc | null => {
    for (const doc of documents) {
      for (const section of doc.sections) {
        const bloc = section.blocs.find((b) => b.id === id)
        if (bloc) return bloc
      }
    }
    return null
  }
  

  return (
    <main className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Éditeur de transcription</h2>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="info-toggle" className="text-sm text-muted-foreground">
              Afficher les infos
            </Label>
            <Switch
              id="info-toggle"
              checked={showInfo}
              onCheckedChange={setShowInfo}
            />
          </div>
        </div>

        {showInfo && (
          <div className="text-sm text-muted-foreground space-y-3">
            <p>Zone principale pour saisir et structurer l’acte.</p>
            <p>
              Chaque bloc représente une portion du document à transcrire. Sa couleur
              indique l’état d’avancement de sa transcription.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground mr-2">Légende :</span>
              {statutConfig
                .filter(({ key }) => key !== "à transcrire")
                .map(({ key }) => (
                  <StatusPill key={key} statut={key} />
                ))}
            </div>
          </div>
        )}
      </div>


      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event: DragStartEvent) => {
          const blocId = String(event.active.id)
          const bloc = findBlocById(blocId)
          if (bloc) setActiveBloc(bloc)
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun document pour le moment.</p>
          ) : (
            documents
              .sort((a, b) => a.ordre - b.ordre)
              .map((doc) => <DocumentView key={doc.id} document={doc} />)
          )}
          <div className="pt-4">
          <Button
            variant="outline"
            onClick={async () => {
              await addDocument(acteId) // ✅ attend l’insertion Supabase + fetch
            }}
          >
              ➕ Ajouter un document
            </Button>
          </div>
        </div>

        <DragOverlay>
          {activeBloc && (
            <BlockView
              bloc={activeBloc}
              dragListeners={{}}
              dragAttributes={{}}
            />
          )}
        </DragOverlay>

      </DndContext>
    </main>
  )
}
