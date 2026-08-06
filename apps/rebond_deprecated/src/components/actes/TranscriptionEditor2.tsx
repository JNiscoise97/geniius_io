import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { BlockRenderer } from "./BlockRenderer"
import { useBlockStore } from "@/store/useBlockStore"
import type { TranscriptionBlockType } from "@/types/transcription2"

interface Props {
  acteId: string
}

export function TranscriptionEditor({ acteId }: Props) {
  const { blocks, fetchBlocks, updateBlock, insertBlock, deleteBlock, reorderAfterInsert, reorderAfterDelete } =
  useBlockStore()

  const blockRefs = useRef<Record<string, HTMLTextAreaElement | HTMLInputElement | null>>({})

  useEffect(() => {
    const load = async () => {
      if (!acteId) return
      const blocksFromDB = await fetchBlocks(acteId)

        if ((blocksFromDB ?? []).length === 0) {
        await insertBlock({
            acte_id: acteId,
            type: "paragraph",
            content: "",
            ordre: 0,
        }, 0)
        }


    }
  
    load()
  }, [acteId])
  

  const arrowUp = (index: number, column: number) => {
    if (index === 0) return
    const previous = blocks[index - 1]
    const el = blockRefs.current[previous.id]
    if (!el) return

    el.focus()
    const lines = el.value.split("\n")
    const lastLineIndex = lines.length - 1
    const lastLine = lines[lastLineIndex]
    const offset = lines.slice(0, lastLineIndex).join("\n").length + (lastLineIndex > 0 ? 1 : 0) + Math.min(column, lastLine.length)
    el.setSelectionRange(offset, offset)
  }

  const arrowDown = (index: number, column: number) => {
    if (index === blocks.length - 1) return
    const next = blocks[index + 1]
    const el = blockRefs.current[next.id]
    if (!el) return

    el.focus()
    const lines = el.value.split("\n")
    const firstLine = lines[0]
    const offset = Math.min(column, firstLine.length)
    el.setSelectionRange(offset, offset)
  }

  const handleInsert = async (index: number) => {
    const inserted = await insertBlock({
      acte_id: acteId,
      type: "paragraph",
      content: "",
      ordre: index + 1,
    }, index)
  
    reorderAfterInsert(index)
  
    if (inserted) {
      setTimeout(() => blockRefs.current[inserted.id]?.focus(), 0)
    }
  }

  const handleUpdate = (id: string, content: string) => {
    updateBlock(id,{ content })
  }

  const handleDelete = (index: number) => {
    const toDelete = blocks[index]
    if (blocks.length === 1) return
    deleteBlock(toDelete.id)
    reorderAfterDelete(toDelete.ordre ?? 0)

    setTimeout(() => {
      const fallback = blocks[index - 1] || blocks[index + 1]
      const el = fallback ? blockRefs.current[fallback.id] : null
      if (el) {
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      }
    }, 0)
  }

  const handlePaste = async (index: number, pastedText: string) => {
    const lines = pastedText.split("\n")
    if (lines.length === 1) return

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      await insertBlock({
        acte_id: acteId,
        type: "paragraph",
        content: line,
        ordre: index + 1 + i,
      })
    }
    reorderAfterInsert(index, lines.length)
  }

  const handleMergeWithPrevious = async (index: number) => {
    if (index === 0) return
    const prev = blocks[index - 1]
    const current = blocks[index]
    const merged = { ...prev, content: prev.content + current.content }

    await updateBlock(merged.id, { content: merged.content })
    await deleteBlock(current.id)
    reorderAfterDelete(current.ordre ?? 0)

    setTimeout(() => {
      const el = blockRefs.current[merged.id]
      if (el) {
        el.focus()
        el.setSelectionRange(prev.content.length, prev.content.length)
      }
    }, 0)
  }

  const handleChangeType = (id: string, type: TranscriptionBlockType) => {
    const block = blocks.find(b => b.id === id)
    if (!block) return
    updateBlock(id, { type })
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <div key={block.id} className="group relative">
          <BlockRenderer
            block={block}
            onChange={(val) => handleUpdate(block.id, val)}
            onEnter={() => handleInsert(i)}
            onBlur={() => {
                const storeBlock = blocks.find((b) => b.id === block.id)
                if (storeBlock && storeBlock.content !== block.content) {
                  updateBlock(block.id, { content: block.content })
                }
              }}              
            inputRef={(el) => (blockRefs.current[block.id] = el)}
            onArrowUp={(offset) => arrowUp(i, offset)}
            onArrowDown={(offset) => arrowDown(i, offset)}
            onPasteCustom={(text) => handlePaste(i, text)}
            onMergeWithPrevious={() => handleMergeWithPrevious(i)}
            onEmptyDelete={() => handleDelete(i)}
          />
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 hidden group-hover:flex space-x-1">
            <select
              value={block.type}
              onChange={(e) => handleChangeType(block.id, e.target.value as TranscriptionBlockType)}
              className="text-sm border rounded p-1"
            >
              <option value="paragraph">Texte</option>
              <option value="heading_1">Titre 1</option>
              <option value="heading_2">Titre 2</option>
              <option value="heading_3">Titre 3</option>
              <option value="bulleted_list_item">Liste à puces</option>
              <option value="numbered_list_item">Liste numérotée</option>
              <option value="quote">Citation</option>
              <option value="todo">À faire</option>
            </select>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDelete(i)}
              title="Supprimer"
            >
              ✕
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
