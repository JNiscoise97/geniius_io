// tiptapText.ts
// Convertit un document Tiptap (JSON) en texte brut, de façon déterministe —
// utilisé par le module Extraction : le texte envoyé à l'agent IA et le
// texte affiché pour le surlignage doivent être exactement la même chaîne,
// sinon les offsets (source_start/source_end) ne pointent plus au bon
// endroit. Pas besoin de revenir vers l'éditeur Tiptap : la page
// d'extraction affiche ce texte brut directement, pas le document riche.

type TiptapNode = {
  type: string
  content?: TiptapNode[]
  text?: string
}

const BLOCK_TYPES = new Set(['paragraph', 'heading', 'blockquote', 'listItem', 'codeBlock'])

export function tiptapJsonToPlainText(doc: unknown): string {
  const parts: string[] = []

  function walk(node: TiptapNode) {
    if (node.type === 'text') {
      parts.push(node.text ?? '')
      return
    }
    if (node.type === 'hardBreak') {
      parts.push('\n')
      return
    }
    if (node.content) {
      for (const child of node.content) walk(child)
    }
    if (BLOCK_TYPES.has(node.type)) parts.push('\n\n')
  }

  const root = doc as TiptapNode
  if (root?.content) {
    for (const child of root.content) walk(child)
  }

  return parts.join('').replace(/\n{3,}/g, '\n\n').trim()
}
