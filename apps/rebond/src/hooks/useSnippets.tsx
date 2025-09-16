// hooks/useSnippets.ts
import { useEffect, useRef, useState } from "react"
import { useSnippetStore } from "@/store/useSnippetStore"
import getCaretCoordinates from "textarea-caret"

interface UseSnippetsOptions {
  value: string
  onChange: (value: string) => void
  element: HTMLTextAreaElement | HTMLElement | null
  isContentEditable?: boolean
}

export function useSnippets({
  value,
  onChange,
  element,
  isContentEditable = false,
}: UseSnippetsOptions) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [highlightedRanges, setHighlightedRanges] = useState<{ start: number; end: number; text: string }[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentKey, setCurrentKey] = useState("")

  const { snippets: allSnippets, fetchSnippets } = useSnippetStore()
  const snippets = currentKey
    ? allSnippets.filter(
        (s) =>
          s.clé.toLowerCase().startsWith(currentKey.toLowerCase()) ||
          s.valeur.toLowerCase().includes(currentKey.toLowerCase())
      )
    : allSnippets

  useEffect(() => {
    fetchSnippets()
  }, [fetchSnippets])

  const scrollIntoView = (index: number) => {
    const item = menuRef.current?.children?.[index] as HTMLElement
    item?.scrollIntoView({ block: "nearest" })
  }

  const adjustMenuPosition = ({ top, left }: { top: number; left: number }) => {
    const vw = window.innerWidth
    const menuWidth = 300
    const safeLeft = Math.min(left, vw - menuWidth - 10)
    return { top, left: safeLeft }
  }

  const insertSnippet = (valeur: string) => {
    if (!element) return

    if (isContentEditable) {
      const selection = window.getSelection()
      const range = selection?.getRangeAt(0)
      if (!range) return

      const node = range.startContainer
      const offset = range.startOffset
      const text = node.textContent || ""
      const prefix = "::" + currentKey
      const start = text.lastIndexOf(prefix, offset)
      if (start === -1) return

      const before = text.slice(0, start)
      const after = text.slice(offset)
      const newText = before + valeur + after

      node.textContent = newText
      const newOffset = before.length + valeur.length

      const newRange = document.createRange()
      newRange.setStart(node, newOffset)
      newRange.setEnd(node, newOffset)
      selection?.removeAllRanges()
      selection?.addRange(newRange)

      onChange(newText)
    } else {
      const textarea = element as HTMLTextAreaElement
      const pos = textarea.selectionStart
      const before = value.slice(0, pos - currentKey.length - 2)
      const after = value.slice(pos)
      const newText = before + valeur + after
      onChange(newText)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(before.length + valeur.length, before.length + valeur.length)
      }, 0)
    }

    const start = value.indexOf("::" + currentKey)
    setHighlightedRanges((prev) => [...prev, { start, end: start + valeur.length, text: valeur }])
    setShowMenu(false)
    setCurrentKey("")
  }

  const getHighlightedHTML = () => {
    if (!value.trim()) return "" // 🛡 protection anti-crash
    let result = ""
    let current = 0
    const ranges = [...highlightedRanges]

    let tempCurrentRange: { start: number; end: number; color: string } | null = null
    if (showMenu && currentKey) {
      const match = value.lastIndexOf("::" + currentKey)
      if (match !== -1) {
        tempCurrentRange = {
          start: match,
          end: match + 2 + currentKey.length,
          color: "rgb(236, 236, 236)",
        }
      }
    }

    const allRanges = [...ranges.map(({ start, end }) => ({ start, end, color: "lightred" }))]
    if (tempCurrentRange) allRanges.push(tempCurrentRange)
    const sorted = allRanges.sort((a, b) => a.start - b.start)

    for (const { start, end, color } of sorted) {
      result += escapeHTML(value.slice(current, start))
      result += `<mark style="padding:0;margin:0;line-height:inherit;background-color:${color};color:transparent">${escapeHTML(value.slice(start, end))}</mark>`
      current = end
    }
    result += escapeHTML(value.slice(current))
    return result
  }

  const escapeHTML = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const handleKey = (e: KeyboardEvent) => {
    if (!element) return

    if (e.key === ":") {
      if (isContentEditable) {
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;
      
          const range = selection.getRangeAt(0);
          const node = range.startContainer;
          const offset = range.startOffset;
      
          if (!node || node.nodeType !== Node.TEXT_NODE) return;
      
          const textBefore = node.textContent?.slice(0, offset) ?? "";
      
          if (!textBefore.endsWith("::")) return;
      
          // Position du menu (inchangé)
          const rects = range.getClientRects();
          if (rects.length === 0) return;
          const rect = rects[0];
      
          const top = window.scrollY + rect.top + 20;
          const left = window.scrollX + rect.left;
      
          setMenuPosition(adjustMenuPosition({ top, left }));
          setShowMenu(true);
          setSelectedIndex(0);
          setCurrentKey("");
        }, 0);
        return;
      }      

      // 📝 textarea = logique immédiate (inchangée)
      const pos = (element as HTMLTextAreaElement).selectionStart;
      const textBefore = (element as HTMLTextAreaElement).value.slice(0, pos) + ":";

      if (!textBefore.endsWith("::")) return;

      const coords = getCaretCoordinates(element as HTMLTextAreaElement, pos);
      const rect = element.getBoundingClientRect();

      const top = window.scrollY + rect.top + coords.top + 20;
      const left = window.scrollX + rect.left + coords.left;

      setMenuPosition(adjustMenuPosition({ top, left }));
      setShowMenu(true);
      setSelectedIndex(0);
      setCurrentKey("");
      return;
    }
       

    if (!showMenu) return

    if (e.key === "Enter") {
      e.preventDefault()
      insertSnippet(snippets[selectedIndex]?.valeur)
    } else if (e.key === "Escape") {
      setShowMenu(false)
    } else if (e.key === "Backspace") {
        const newKey = currentKey.slice(0, -1)
        setCurrentKey(newKey)
        if (newKey === "") setShowMenu(false)
    } else if (e.key === " ") {
      const match = snippets.find((s) => s.clé === currentKey)
      if (match) {
        e.preventDefault()
        insertSnippet(match.valeur)
      } else {
        setShowMenu(false)
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      e.stopPropagation();
      setSelectedIndex((prev) => {
        const next = (prev + 1) % snippets.length
        scrollIntoView(next)
        return next
      })
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      e.stopPropagation();
      setSelectedIndex((prev) => {
        const next = (prev - 1 + snippets.length) % snippets.length
        scrollIntoView(next)
        return next
      })
    } else if (/^[a-zA-Z]$/.test(e.key)) {
        setCurrentKey((prev) => prev + e.key)
    } else if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) {
    // Ne rien faire
    } else {
    setShowMenu(false)
    }
      
  }

  useEffect(() => {
    if (!element) return
    const listener = handleKey as EventListener
    const blurHandler = () => setShowMenu(false)
  
    element.addEventListener("keydown", listener)
    element.addEventListener("blur", blurHandler)
  
    return () => {
      element.removeEventListener("keydown", listener)
      element.removeEventListener("blur", blurHandler)
    }
  }, [element, snippets, selectedIndex, currentKey, value])
  

  return {
    showMenu,
    menuPosition,
    snippets,
    selectedIndex,
    insertSnippet,
    getHighlightedHTML,
    menuRef,
    onKeyDown: handleKey,
    onReactKeyDown: (e: React.KeyboardEvent) => handleKey(e.nativeEvent),
  }
}