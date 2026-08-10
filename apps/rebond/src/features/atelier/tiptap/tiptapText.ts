// tiptapText.ts
// Convertit un document Tiptap (JSON) en texte brut, de façon déterministe —
// utilisé par le module Extraction : le texte envoyé à l'agent IA et le
// texte affiché pour le surlignage doivent être exactement la même chaîne,
// sinon les offsets (source_start/source_end) ne pointent plus au bon
// endroit. Pas besoin de revenir vers l'éditeur Tiptap : la page
// d'extraction affiche ce texte brut directement, pas le document riche.

type TiptapMark = { type: string }
type TiptapNode = {
  type: string
  content?: TiptapNode[]
  text?: string
  marks?: TiptapMark[]
  attrs?: Record<string, unknown>
}

const BLOCK_TYPES = new Set(['paragraph', 'heading', 'blockquote', 'listItem', 'codeBlock'])

// Convention markdown pour la mise en forme fidèle à la source (2026-08-10,
// demande explicite) — gras/barré/titres reproduisent ce que le scribe a
// réellement mis en forme dans l'acte (ex. un patronyme en gras, une
// correction barrée), pas juste de l'esthétique. Le texte brut produit ici
// sert À LA FOIS au surlignage écran ET au texte envoyé à Claude (voir
// en-tête) — ces marqueurs sont donc visibles dans l'écran de relecture des
// assertions, pas seulement en coulisses ; le prompt système d'Extraction
// doit connaître cette même convention (voir extract-assertions/index.ts).
const HEADING_PREFIX: Record<number, string> = { 1: '# ', 2: '## ', 3: '### ' }

export function tiptapJsonToPlainText(doc: unknown): string {
  const parts: string[] = []

  function walk(node: TiptapNode) {
    if (node.type === 'text') {
      let text = node.text ?? ''
      const markTypes = new Set((node.marks ?? []).map(m => m.type))
      if (markTypes.has('bold')) text = `**${text}**`
      if (markTypes.has('strike')) text = `~~${text}~~`
      parts.push(text)
      return
    }
    if (node.type === 'hardBreak') {
      parts.push('\n')
      return
    }
    // Bloc repère "passage non transcrit" (NonTranscritNode.ts, 2026-08-10) —
    // noeud atomique sans contenu textuel propre ; représenté fidèlement en
    // texte brut pour que le module Extraction (et tout diff sur ce texte)
    // voie clairement qu'un passage a été délibérément omis à cet endroit.
    if (node.type === 'nonTranscrit') {
      parts.push('[passage non transcrit]')
      return
    }
    if (node.type === 'heading') {
      const level = (node.attrs?.level as number) ?? 1
      parts.push(HEADING_PREFIX[level] ?? '# ')
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
