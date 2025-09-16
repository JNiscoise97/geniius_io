import type { Document } from "@/types/transcription"
import { SectionView } from "./SectionView"
import { useDocumentStore } from "@/store/useDocumentStore"
import { Button } from "@/components/ui/button"
import { Trash2, Copy, ArrowUp, ArrowDown, Check } from "lucide-react"
import { StatusPill } from "../../../../components/shared/StatusPill"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { statutConfig } from "../constants/statutConfig"
import { useDebouncedCallback } from "use-debounce"
import { useLayoutEffect, useRef } from "react"

interface DocumentViewProps {
  document: Document
}

export function DocumentView({ document }: DocumentViewProps) {
  const documents = useDocumentStore((s) => s.documents)
  const duplicateDocument = useDocumentStore((s) => s.duplicateDocument)
  const deleteDocument = useDocumentStore((s) => s.deleteDocument)
  const addSection = useDocumentStore((s) => s.addSection)
  const moveDocument = (id: string, direction: "up" | "down") => {
    const index = documents.findIndex((d) => d.id === id)
    if (index === -1) return
  
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= documents.length) return
  
    const reordered = [...documents]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)
    if (reordered.length > 0) {
      useDocumentStore.getState().reorderEntities({
        entity: "documents",
        parentId: reordered[0].acte_id,
        newOrder: reordered.map((d) => d.id),
      })
    }
  }
  const index = documents.findIndex((d) => d.id === document.id)
  const debouncedUpdateTitre = useDebouncedCallback((val: string) => {
    const doc = useDocumentStore.getState().documents.find(d => d.id === document.id)
    if (doc?.titre !== val) {
      useDocumentStore.getState().updateDocumentTitre(document.id, val)
    }
  }, 1000) // augmente à 1000ms pour éviter les sur-requêtes  

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [document.titre])

  return (
    <div className="mb-12 px-5 py-6 bg-white shadow rounded border">
      <header className="mb-4 flex justify-between items-start">
        <div className="flex-1 pr-4">
        <textarea
          value={document.titre}
          onChange={(e) => {
            e.currentTarget.style.height = "auto"
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
          
            useDocumentStore.setState((state) => ({
              documents: state.documents.map((doc) =>
                doc.id === document.id ? { ...doc, titre: e.target.value } : doc
              ),
            }))
          
            debouncedUpdateTitre(e.target.value)
          }}          
          placeholder="Document sans titre"
          rows={1}
          className="w-full text-xl font-semibold resize-none bg-transparent border-none focus:outline-none focus:ring-0"
          style={{ minHeight: "2rem" }}
        />

          <div className="mt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button>
                <StatusPill statut={document.statut || "à transcrire"} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuItem
                onClick={() => {
                  // 1. Marquer tous les blocs du document comme transcrits
                  document.sections.forEach((section) => {
                    section.blocs.forEach((bloc) => {
                      useDocumentStore.getState().updateBlocStatut(bloc.id, "transcrit")
                    })
                    useDocumentStore.getState().updateSectionStatut(section.id, "transcrit")
                  })
                  
                  // Puis MAJ manuelle du document
                  useDocumentStore.getState().updateDocumentStatut(document.id, "transcrit")                  

                  // 2. Afficher un toast
                  toast.success(`Document "${document.titre || "Sans titre"}" marqué comme transcrit`)
                }}
                className={statutConfig.find(s => s.key === "transcrit")?.text}
              >
                <Check className="w-4 h-4 mr-2" />
                Marquer comme transcrit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>

        </div>

        <div className="flex gap-2">
          {documents.length > 1 && index > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveDocument(document.id, "up")}
              title="Monter"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          )}
          {documents.length > 1 && index < documents.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveDocument(document.id, "down")}
              title="Descendre"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => duplicateDocument(document.id)}
            title="Dupliquer"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteDocument(document.id)}
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>

      </header>

      <div className="space-y-6">
      {[...document.sections]
        .sort((a, b) => a.ordre - b.ordre)
        .map((section) => (
          <SectionView key={section.id} section={section} />
      ))}
      </div>

      <div className="pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addSection(document.id, true)}
        >
          ➕ Ajouter une section
        </Button>
      </div>
    </div>
  )
}