import { useEffect, useMemo, useRef } from "react"
import { GripVertical, Trash2, Copy, MoreVertical, AlignLeft, Heading } from "lucide-react"
import { Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDocumentStore } from "@/store/useDocumentStore"
import type { Bloc } from "@/types/transcription"
import { DivContentEditable } from "@/components/shared/saisie/SaisieDivContentEditable"
import { placeCaretAtStart, placeCaretAtX } from "@/lib/caretUtils"
import { statutConfig } from "../constants/statutConfig"
import { cn } from "@/lib/utils"

interface BlockViewProps {
  bloc: Bloc
  dragListeners: React.HTMLAttributes<HTMLElement>
  dragAttributes: React.HTMLAttributes<HTMLElement>
}


function useAllBlocs() {
  const documents = useDocumentStore((state) => state.documents)

  return useMemo(() => {
    return documents
      .flatMap((doc) => doc.sections)
      .flatMap((sec) => sec.blocs)
  }, [documents])
}

function getDocumentIdFromSectionId(sectionId: string): string | null {
  const documents = useDocumentStore.getState().documents
  for (const doc of documents) {
    if (doc.sections.some((sec) => sec.id === sectionId)) {
      return doc.id
    }
  }
  return null
}


export function BlockView({ bloc, dragListeners, dragAttributes }: BlockViewProps) {
  const {
    addBloc,
    deleteBloc,
    duplicateBloc,
    updateBlocContent,
    updateBlocType,
    updateBlocStatut,
    setActiveBlocId,
    addSection,
    activeBlocId,
  } = useDocumentStore()

  const ref = useRef<HTMLDivElement>(null)


  useEffect(() => {
    if (ref.current && ref.current.innerText !== bloc.contenu) {
      ref.current.innerText = bloc.contenu
    }
  }, [bloc.contenu])
  
  useEffect(() => {
    if (activeBlocId === bloc.id && ref.current) {
      // Ne rien faire ici : le focus est géré après setActiveBlocId + setTimeout
    }
  }, [activeBlocId, bloc.id])
  

  const blocs = useAllBlocs()

  const focusBlocByOffset = (offset: number) => {
    const index = blocs.findIndex(b => b.id === bloc.id)
    return (targetX: number) => {
      const newIndex = index + offset
      const targetBloc = blocs[newIndex]
      if (targetBloc) {
        setActiveBlocId(targetBloc.id)
        setTimeout(() => {
          const targetRef = document.querySelector(
            `[data-bloc-id="${targetBloc.id}"]`
          ) as HTMLElement
  
          if (targetRef) {
            targetRef.focus() // 👉 focus manuel ici
            targetRef.scrollIntoView({ behavior: "smooth", block: "nearest" }) // optionnel
            placeCaretAtX(targetRef, targetX)
          }
        }, 10)
      }
    }
  }

  const handleSplitBloc = (bloc: Bloc) => {
  return async (before: string, after: string) => {
    const state = useDocumentStore.getState()

    const doc = state.documents.find(d =>
      d.sections.some(s => s.id === bloc.sectionId)
    )
    const section = doc?.sections.find(s => s.id === bloc.sectionId)

    if (!doc || !section) return

    const index = section.blocs.findIndex(b => b.id === bloc.id)
    if (index === -1) return

    // 1. Mettre à jour le contenu avant le curseur
    await state.updateBlocContent(bloc.id, before)

    // 2. Créer un nouveau bloc, même si `after` est vide
    const newBlocId = await state.addBloc(bloc.sectionId, doc.id, after, index + 1)
    state.setActiveBlocId(newBlocId)

    // 3. Focus sur le nouveau bloc
    setTimeout(() => {
      const newBlocElement = document.querySelector(
        `[data-bloc-id="${newBlocId}"]`
      ) as HTMLElement | null

      if (newBlocElement) {
        newBlocElement.focus()
        placeCaretAtStart(newBlocElement)
      }
    }, 10)
  }
}

  

  const mergeWithPreviousBloc = () => {
    const index = blocs.findIndex((b) => b.id === bloc.id)
    if (index <= 0) return
  
    const previous = blocs[index - 1]
    const mergedContent = previous.contenu + bloc.contenu
  
    // Met à jour le contenu du bloc précédent et supprime l’actuel
    updateBlocContent(previous.id, mergedContent)
    deleteBloc(bloc.id)
    setActiveBlocId(previous.id)
  
    // Attendre que le DOM soit à jour avant de modifier innerText et placer le curseur
    setTimeout(() => {
      const target = document.querySelector(`[data-bloc-id="${previous.id}"]`) as HTMLDivElement | null
      if (!target) return
    
      target.innerText = mergedContent
      target.focus()
    
      const offset = previous.contenu.length
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null)
      let currentNode: Text | null = null
      let chars = 0
    
      while (walker.nextNode()) {
        const node = walker.currentNode as Text
        const nextChars = chars + node.length
        if (offset <= nextChars) {
          currentNode = node
          break
        }
        chars = nextChars
      }
    
      if (currentNode) {
        const range = document.createRange()
        const sel = window.getSelection()
        range.setStart(currentNode, offset - chars)
        range.collapse(true)
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }, 10)    
  }
  const documentId = getDocumentIdFromSectionId(bloc.sectionId)
  if (!documentId) return null // ou un fallback visuel

  const transcritTextColor = statutConfig.find(s => s.key === "transcrit")?.text || "text-blue-800"

  return (
    <div className="flex items-start group relative">
      <div className="text-xs text-gray-400 mt-2 mr-2 min-w-[24px] text-right">
        {bloc.ordre}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="mr-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Options du bloc"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-56">
        {bloc.statut !== "transcrit" && (
          <DropdownMenuItem
            onClick={() => {
              updateBlocStatut(bloc.id, "transcrit")
              toast.success("Bloc marqué comme transcrit")
            }}
            className={transcritTextColor}
          >
            <Check className="w-4 h-4 mr-2" /> Marquer comme transcrit
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => duplicateBloc(bloc.id)}>
            <Copy className="w-4 h-4 mr-2" /> Dupliquer
          </DropdownMenuItem>
          {bloc.type !== "texte" && (
            <DropdownMenuItem onClick={() => updateBlocType(bloc.id, "texte")}>
              <AlignLeft className="w-4 h-4 mr-2" /> Transformer en texte
            </DropdownMenuItem>
          )}
          {bloc.type !== "titre" && (
            <DropdownMenuItem onClick={() => updateBlocType(bloc.id, "titre")}>
              <Heading className="w-4 h-4 mr-2" /> Transformer en titre
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => deleteBloc(bloc.id)}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        {...dragAttributes}
        onPointerDown={dragListeners.onPointerDown}
        className="mr-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
        title="Déplacer le bloc"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </button>

      <DivContentEditable
        blocId={bloc.id}
        value={bloc.contenu}
        statut = {bloc.statut}
        type={bloc.type}
        isActive={activeBlocId === bloc.id}
        onClick={() => setActiveBlocId(bloc.id)}
        onArrowUp={focusBlocByOffset(-1)}
        onArrowDown={focusBlocByOffset(1)}
        onChange={(val) => updateBlocContent(bloc.id, val)}
        onSplit={handleSplitBloc(bloc)}
        onBackspaceAtStart={mergeWithPreviousBloc}
        sectionId={bloc.sectionId}
        documentId={documentId}
        onCreateSectionFromPaste={async (blocs) => {
          try {
            const newSectionId = await addSection(documentId, false, "Section créée par collage")
        
            await Promise.all(
              blocs.map((text, index) =>
                addBloc(newSectionId, documentId, text, index + 1) // ⚠️ assignation explicite de l’ordre
              )
            )
          } catch (e) {
            console.error("Erreur collage :", e)
          }
        }}        
      />
      {bloc.statut !== "transcrit" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "mr-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
                transcritTextColor
              )}
              onClick={() => {
                updateBlocStatut(bloc.id, "transcrit")
                toast.success("Bloc marqué comme transcrit")
              }}
              title="Marquer comme transcrit"
            >
              <Check className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Marquer comme transcrit</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
