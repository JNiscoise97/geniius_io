import { useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { TranscriptionBlock } from "@/types/transcription2"

interface BlockRendererProps {
  block: TranscriptionBlock
  onChange: (val: string) => void
  onEnter?: () => void
  onBlur?: () => void
  inputRef?: (el: HTMLTextAreaElement | HTMLInputElement | null) => void
  onArrowUp?: (offset: number) => void
  onArrowDown?: (offset: number) => void
  onPasteCustom?: (pastedText: string) => void
  onEmptyDelete?: () => void
  onMergeWithPrevious: () => void
}

export function BlockRenderer({ block, onChange, onEnter, inputRef, onArrowUp, onArrowDown, onPasteCustom, onEmptyDelete, onMergeWithPrevious, onBlur }: BlockRendererProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [block.content])
  
  function getCursorColumn(value: string, offset: number): number {
    const lines = value.slice(0, offset).split("\n")
    const currentLine = lines[lines.length - 1] || ""
    return currentLine.length
  }
  
  const commonProps = {
    value: block.content,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onBlur: () => onBlur?.(),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const el = e.currentTarget
        const pos = el.selectionStart
      
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          onEnter?.()
        } else if (e.key === "ArrowUp" && pos === 0) {
          e.preventDefault()
          onArrowUp?.(getCursorColumn(el.value, pos))
        } else if (e.key === "ArrowDown" && pos === el.value.length) {
          e.preventDefault()
          onArrowDown?.(getCursorColumn(el.value, pos))
        } else if (e.key === "Backspace" && el.value === "") {
          e.preventDefault()
          onEmptyDelete?.()
        } else if (e.key === "Backspace" && pos === 0) {
          e.preventDefault()
          onMergeWithPrevious?.()
        }
      },      
    onPaste: (e: React.ClipboardEvent) => {
        if (onPasteCustom) {
          e.preventDefault()
          const pastedText = e.clipboardData.getData("text/plain")
          onPasteCustom(pastedText)
        }
      },      
    className: "w-full resize-none overflow-hidden",
  }

  switch (block.type) {
    case "heading_1":
      return <Input {...commonProps} ref={inputRef} className="text-2xl font-bold" placeholder="Titre 1" />
    case "heading_2":
      return <Input {...commonProps} ref={inputRef} className="text-xl font-semibold" placeholder="Titre 2" />
    case "heading_3":
      return <Input {...commonProps} ref={inputRef} className="text-lg font-medium" placeholder="Titre 3" />
    case "quote":
      return (
        <Textarea
          {...commonProps}
          ref={(el) => {
            textareaRef.current = el
            inputRef?.(el)
          }}
          className="italic border-l-4 pl-4 text-muted-foreground"
          placeholder="Citation"
        />
      )
    case "bulleted_list_item":
    case "numbered_list_item":
      return (
        <Textarea
          {...commonProps}
          ref={(el) => {
            textareaRef.current = el
            inputRef?.(el)
          }}
          placeholder="Élément de liste"
        />
      )
    case "todo":
      return (
        <label className="flex items-center space-x-2">
          <input type="checkbox" disabled />
          <Textarea
            {...commonProps}
            ref={(el) => {
              textareaRef.current = el
              inputRef?.(el)
            }}
            placeholder="Tâche"
          />
        </label>
      )
    case "paragraph":
    default:
      return (
        <Textarea
          {...commonProps}
          ref={(el) => {
            textareaRef.current = el
            inputRef?.(el)
          }}
          className="w-full resize-none overflow-hidden min-h-0"
          placeholder="Texte"
        />
      )
  }
}
