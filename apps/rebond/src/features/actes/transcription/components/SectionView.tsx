import type { Section } from "@/types/transcription"
import { useDocumentStore } from "@/store/useDocumentStore"
import { Button } from "@/components/ui/button"
import { Trash2, Copy, ArrowUp, ArrowDown, Check } from "lucide-react"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableBloc } from "./SortableBloc"
import { placeCaretAtStart } from "@/lib/caretUtils"
import { StatusPill } from "../../../../components/shared/StatusPill"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDebouncedCallback } from "use-debounce"
import { useLayoutEffect, useRef } from "react"

interface SectionViewProps {
  section: Section
}

export function SectionView({ section }: SectionViewProps) {
  const { deleteSection, duplicateSection, setActiveBlocId, updateBlocStatut, updateSectionStatut } = useDocumentStore()
  const addBloc = useDocumentStore((state) => state.addBloc)
  const moveSection = (documentId: string, sectionId: string, direction: "up" | "down") => {
    const doc = useDocumentStore.getState().documents.find((d) => d.id === documentId)
    if (!doc) return
  
    const index = doc.sections.findIndex((s) => s.id === sectionId)
    if (index === -1) return
  
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= doc.sections.length) return
  
    const reordered = [...doc.sections]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)
  
    useDocumentStore.getState().reorderEntities({
      entity: "sections",
      parentId: documentId,
      newOrder: reordered.map((s) => s.id),
    })
    
  }
  const doc = useDocumentStore.getState().documents.find((d) => d.id === section.documentId)
  const sections = doc?.sections ?? []
  const index = sections.findIndex((s) => s.id === section.id)

  const debouncedUpdateTitre = useDebouncedCallback((val: string) => {
    useDocumentStore.getState().updateSectionTitre(section.id, val)
  }, 1000)
  
  
    const textareaRef = useRef<HTMLTextAreaElement>(null)
  
    useLayoutEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, [section.titre])
  
  return (
    <section className="px-4 py-3 bg-gray-50 border rounded mb-4">
      <header className="mb-2 flex justify-between items-start">
        <div className="flex-1 pr-4">
        <textarea
          value={section.titre}
          onChange={(e) => {
            const newTitre = e.target.value
            e.currentTarget.style.height = "auto"
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
          
            // Mise à jour immédiate du state
            useDocumentStore.setState((state) => ({
              documents: state.documents.map((doc) => ({
                ...doc,
                sections: doc.sections.map((s) =>
                  s.id === section.id ? { ...s, titre: newTitre } : s
                ),
              })),
            }))
          
            debouncedUpdateTitre(newTitre)
          }}          
          placeholder="Section sans titre"
          rows={1}
          className="w-full text-lg font-medium resize-none bg-transparent border-none focus:outline-none focus:ring-0"
          style={{ minHeight: "1.75rem" }}
        />

        </div>

        <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>
              <StatusPill statut={section.statut || "à transcrire"} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right">
          <DropdownMenuItem
            onClick={() => {
              // 1. Marquer tous les blocs de la section comme transcrits
              section.blocs.forEach((bloc) => {
                updateBlocStatut(bloc.id, "transcrit")
              })

              // 2. Mettre à jour manuellement le statut de la section
              updateSectionStatut(section.id, "transcrit")

              // 3. Afficher un toast
              toast.success(`Section "${section.titre}" marquée comme transcrite`)
            }}
            className="text-blue-800" // utilise la couleur de texte associée à "transcrit"
          >
            <Check className="w-4 h-4 mr-2" />
            Marquer comme transcrit
          </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>

          {sections.length > 1 && index > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveSection(section.documentId, section.id, "up")}
              title="Monter"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          )}
          {sections.length > 1 && index < sections.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveSection(section.documentId, section.id, "down")}
              title="Descendre"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => duplicateSection(section.id)} title="Dupliquer">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => deleteSection(section.id)} title="Supprimer">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>

      </header>

      <div className="space-y-1 bg-white p-2">
        <SortableContext
          items={section.blocs.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {[...section.blocs]
            .sort((a, b) => a.ordre - b.ordre)
            .map((bloc) => (
              <SortableBloc
                key={bloc.id}
                bloc={bloc}
                sectionId={section.id}
                documentId={section.documentId}
              />
            ))}
        </SortableContext>
      </div>

      <div className="mt-2">
        <Button variant="ghost" size="sm" onClick={async () => {
            const newBlocId = await addBloc(section.id, section.documentId)
            setActiveBlocId(newBlocId)
        
            setTimeout(() => {
              const target = document.querySelector(`[data-bloc-id="${newBlocId}"]`) as HTMLElement | null
              if (target) {
                target.focus()
                placeCaretAtStart(target)
              }
            }, 10)
        
           }}>
          ➕ Ajouter un bloc
        </Button>
      </div>
    </section>
  )
}