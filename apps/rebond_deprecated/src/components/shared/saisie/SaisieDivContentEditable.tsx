import { useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useDebouncedCallback } from "use-debounce"
import { useSnippetsInContentEditable } from "@/hooks/useSnippetsInContentEditable"
import { SnippetMenu } from "./SnippetMenu"
import { getCaretCoordinatesInContentEditable } from "@/lib/caretUtils"
import { statutConfig } from "@/features/actes/transcription/constants/statutConfig"

interface Props {
  blocId: string
  value: string
  type?: "texte" | "titre" | "liste-à-puces" | "liste-numérotée"
  isActive?: boolean
  statut?: string
  
  onClick?: () => void
  onArrowUp?: (caretX: number) => void
  onArrowDown?: (caretX: number) => void
  onChange: (val: string) => void
  onSplit?: (before: string, after: string) => void
  onBackspaceAtStart?: () => void
  
  className?: string
  placeholder?: string
  editorRef?: React.RefObject<HTMLDivElement>
  sectionId: string
  documentId: string
  onCreateSectionFromPaste: (blocs: string[]) => void

}
function getBlocBorderClassFromStatut(statut?: string): string {
  const found = statutConfig.find((s) => s.key === statut)
  return found?.color ? `border-l-2 pl-2 ${found.color}` : "border-l-2 pl-2 border-white"
}

export function DivContentEditable({
  blocId,
  value,
  type = "texte",
  isActive = false,
  statut,
  onClick,
  onArrowUp,
  onArrowDown,
  onChange,
  onSplit,
  onBackspaceAtStart,
  className = "",
  placeholder = "",
  editorRef,
  onCreateSectionFromPaste
  
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!ref.current) return
    const isEmpty = ref.current.innerText.trim() === ""
    if (isEmpty && value.trim()) {
      ref.current.innerText = value
    }
  }, []) // 👈 exécuter une seule fois au montage
  
  const updateDebounced = useDebouncedCallback((val: string) => {
    onChange(val)
  }, 300)

  const {
    showMenu,
    menuPosition,
    snippets,
    selectedIndex,
    insertSnippet,
    getHighlightedHTML,
    menuRef,
    onKeyDown,
  } = useSnippetsInContentEditable({
    value,
    onChange,
    editableRef: ref,
  })

  return (
    <div className="relative flex-1">

      {/* couche de surlignage */}
      <div className={cn(
          "absolute inset-0 z-10 px-1 py-1 text-sm text-transparent pointer-events-none whitespace-pre-wrap break-words",
          type === "titre" && "font-bold text-base",
          type === "liste-à-puces" && "list-disc list-inside",
          type === "liste-numérotée" && "list-decimal list-inside",
          isActive && "",
          getBlocBorderClassFromStatut(statut),
          className
        )} >
        <div
          className="absolute"
          dangerouslySetInnerHTML={{ __html: getHighlightedHTML() }}
        />
      </div>

      {/* div editable */}
      <div
        ref={editorRef || ref}
        contentEditable
        suppressContentEditableWarning
        data-bloc-id={blocId}
        onInput={() => {
          if (!ref.current) return
          const text = ref.current.innerText
          if (text === value) return // évite les doubles appels inutiles
          updateDebounced(text)
        }}
        onClick={onClick}
        onPaste={(e) => {
          e.preventDefault()
          const pasted = e.clipboardData.getData("text/plain")
          const trimmed = pasted.trim()
          const target = e.currentTarget
          if (!trimmed.includes("\n")) {
            // Cas 1 : pas de retour à la ligne → insertion directe
            const selection = window.getSelection()
            if (!selection || selection.rangeCount === 0) return
            selection.deleteFromDocument()
            selection.getRangeAt(0).insertNode(document.createTextNode(trimmed))
            const event = new Event("input", { bubbles: true })
            target.dispatchEvent(event)

            return
          }
        
          // Cas 2 ou 3 : multi-paragraphes
          const isParagraphs = trimmed.includes("\n\n")
          const blocs = isParagraphs
            ? trimmed.split(/\n{2,}/).map((p) => p.trim())
            : trimmed.split("\n").map((l) => l.trim())
        
          onCreateSectionFromPaste(blocs)
        }}              
        onKeyDown={(e) => {
          if (!ref.current) return
        
          const key = e.key
          if (key === "Enter" && showMenu) {
            return // Ne pas interférer si le menu de snippet est actif
          }
          
          const selection = window.getSelection()
          const range = selection?.getRangeAt(0)
          const { x } = getCaretCoordinatesInContentEditable() || {}
        
          // 1. Snippets + gestion centralisée
          try {
            onKeyDown?.(e.nativeEvent)
          } catch (err) {
            console.warn("Erreur dans onKeyDown (snippets)", err)
          }
        
          // 2. Split bloc au bon endroit
          if (key === "Enter") {
            e.preventDefault()
        
            if (!selection || !range || !ref.current) return

            const textContent = ref.current.innerText.replace(/\u200b/g, "")
            const pos = range.startOffset
        
            const before = textContent.slice(0, pos)
            const after = textContent.slice(pos)
            if (ref.current) {
              ref.current.innerText = before
            }
            onChange(before)
            onSplit?.(before, after)

            return
          }

          if (key === "Backspace") {
            const selection = window.getSelection()
            const range = selection?.getRangeAt(0)
          
            const caretAtStart = range?.startOffset === 0
          
            if (caretAtStart) {
              e.preventDefault()
              onBackspaceAtStart?.()
              return
            }
          }          
        
          // 3. Navigation ↑ ↓
          if (key === "ArrowUp") {
            e.preventDefault()
            onArrowUp?.(x ?? 0)
          }
        
          if (key === "ArrowDown") {
            e.preventDefault()
            onArrowDown?.(x ?? 0)
          }
        }}
        
        className={cn(
          "relative z-10 px-1 py-1 text-sm transition cursor-text whitespace-pre-wrap break-words bg-transparent caret-black focus:outline-none",
          type === "titre" && "font-bold text-base",
          type === "liste-à-puces" && "list-disc list-inside",
          type === "liste-numérotée" && "list-decimal list-inside",
          isActive && "",
          getBlocBorderClassFromStatut(statut),
          className
        )}
      >
        {value === "" && (
          <span className="italic text-muted-foreground">{placeholder}</span>
        )}
      </div>

      {showMenu && (
        <SnippetMenu
          snippets={snippets}
          selectedIndex={selectedIndex}
          menuRef={menuRef}
          position={menuPosition}
          onSelect={insertSnippet}
        />
      )}
    </div>
  )
}
