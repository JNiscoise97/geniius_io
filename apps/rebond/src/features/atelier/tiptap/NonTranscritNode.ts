// NonTranscritNode.ts
// Bloc repère "passage non transcrit" — répond au TODO "section non
// transcrite" laissé de côté à la conception du module (voir en-tête
// atelier.service.ts), demandé explicitement le 2026-08-10. Premier essai
// avec une marque de bascule (texte librement éditable) explicitement
// refusé par l'utilisateur ("je voulais un bloc verrouillé coloré") —
// refait en noeud Tiptap atomique : indivisible, pas de contenu éditable à
// l'intérieur, se place dans le texte comme un repère qu'on entoure de
// vrais fragments de transcription tapés normalement autour, pas dedans.

import { Node, mergeAttributes } from '@tiptap/core'

export const NON_TRANSCRIT_LABEL = 'Passage non transcrit'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nonTranscrit: {
      insertNonTranscrit: () => ReturnType
    }
  }
}

export const NonTranscritNode = Node.create({
  name: 'nonTranscrit',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: 'span[data-non-transcrit]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-non-transcrit': '', class: 'transcription-non-transcrit-node', contenteditable: 'false' }), NON_TRANSCRIT_LABEL]
  },

  addCommands() {
    return {
      insertNonTranscrit: () => ({ commands }) => commands.insertContent({ type: this.name }),
    }
  },
})
