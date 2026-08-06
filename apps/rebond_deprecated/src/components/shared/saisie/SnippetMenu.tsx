// components/shared/snippets/SnippetMenu.tsx
import { type RefObject } from "react"

interface Snippet {
  id: string
  clé: string
  valeur: string
}

interface SnippetMenuProps {
  snippets: Snippet[]
  selectedIndex: number
  menuRef: RefObject<HTMLDivElement | null>
  position: { top: number; left: number }
  onSelect: (valeur: string) => void
}

export function SnippetMenu({
  snippets,
  selectedIndex,
  menuRef,
  position,
  onSelect,
}: SnippetMenuProps) {
  if (snippets.length === 0) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border rounded shadow-md text-sm w-[300px] max-h-[120px] overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {snippets.map((s, index) => (
        <div
          key={s.id}
          className={`px-3 py-1 cursor-pointer ${
            selectedIndex === index ? "bg-blue-100 font-medium" : "hover:bg-gray-100"
          }`}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(s.valeur)
          }}
        >
          ::{s.clé} → {s.valeur}
        </div>
      ))}
    </div>
  )
}
