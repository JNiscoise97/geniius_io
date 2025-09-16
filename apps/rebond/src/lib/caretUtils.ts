// lib/caretUtils.ts
export function getCaretCoordinatesInContentEditable(): { x: number; y: number } | undefined {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
  
    const range = selection.getRangeAt(0).cloneRange()
    const rects = range.getClientRects()
  
    if (rects.length === 0) return
  
    const rect = rects[0]
    return { x: rect.left + window.scrollX, y: rect.top + window.scrollY }
  }
  
  export function placeCaretAtX(el: HTMLElement, x: number) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
    const range = document.createRange()
    const selection = window.getSelection()
    let bestNode: Node | null = null
    let bestOffset = 0
    let bestDiff = Infinity
  
    while (walker.nextNode()) {
      const node = walker.currentNode
      for (let i = 0; i <= node.textContent!.length; i++) {
        range.setStart(node, i)
        range.setEnd(node, i)
        const rect = range.getBoundingClientRect()
        const diff = Math.abs(rect.left - x)
        if (diff < bestDiff) {
          bestNode = node
          bestOffset = i
          bestDiff = diff
        }
      }
    }
  
    if (bestNode) {
      range.setStart(bestNode, bestOffset)
      range.collapse(true)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }
  
  export function placeCaretAtStart(el: HTMLElement) {
    const range = document.createRange()
    const sel = window.getSelection()
    range.setStart(el, 0)
    range.collapse(true)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  export function isCaretAtEdge(ref: HTMLDivElement, direction: "start" | "end") {
    const selection = window.getSelection()
    if (!selection || !ref.contains(selection.anchorNode)) return false
  
    const range = selection.getRangeAt(0).cloneRange()
    const testRange = document.createRange()
  
    if (direction === "start") {
      testRange.selectNodeContents(ref)
      testRange.setEnd(range.startContainer, range.startOffset)
      return testRange.toString().trim() === ""
    }
  
    if (direction === "end") {
      testRange.selectNodeContents(ref)
      testRange.setStart(range.endContainer, range.endOffset)
      return testRange.toString().trim() === ""
    }
  
    return false
  }
  
  