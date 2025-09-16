import { useRef } from "react"
import { useSnippets } from "@/hooks/useSnippets"
import { Textarea } from "@/components/ui/textarea"
import { SnippetMenu } from "@/components/shared/saisie/SnippetMenu"

interface SnippetTextareaProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function SnippetTextarea({ value, onChange, placeholder, className }: SnippetTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    showMenu,
    menuPosition,
    snippets,
    selectedIndex,
    menuRef,
    insertSnippet,
    getHighlightedHTML,
  } = useSnippets({
    value,
    onChange,
    element: textareaRef.current,
    isContentEditable: false,
  })

  const commonStyle =
    "w-full h-full p-2 text-sm font-sans leading-[1.5] whitespace-pre-wrap break-words"

  return (
    <div className="relative w-full">
      {/* Couche de surlignage */}
      <div className="absolute inset-0 p-2 whitespace-pre-wrap pointer-events-none text-transparent">
        <div
          className={`absolute inset-0 text-transparent pointer-events-none ${commonStyle}`}
          dangerouslySetInnerHTML={{ __html: getHighlightedHTML() }}
        />
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`relative z-10 bg-transparent caret-black ${commonStyle} ${className ?? ""}`}
        rows={6}
      />

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
