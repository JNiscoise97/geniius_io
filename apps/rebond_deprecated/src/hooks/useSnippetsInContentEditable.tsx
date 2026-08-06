// hooks/useSnippetsInContentEditable.tsx
import { useSnippets } from "./useSnippets"
import type { RefObject } from "react"

interface Options {
  value: string
  onChange: (value: string) => void
  editableRef: RefObject<HTMLDivElement | null>
}

export function useSnippetsInContentEditable({ value, onChange, editableRef }: Options) {
  return useSnippets({
    value,
    onChange,
    element: editableRef.current as HTMLElement,
    isContentEditable: true,
  })
}
