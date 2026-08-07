// CommentMark.ts
// Marque Tiptap portant l'id d'un commentaire (rebond.transcription_commentaires)
// directement dans le document — l'ancrage au texte se fait par le document
// lui-même (le commentaire "voyage" avec le texte marqué), pas par une
// relocalisation de citation après coup. Voir
// supabase/schema-docs/transcription_commentaires.md pour le pourquoi.

import { Mark, mergeAttributes } from '@tiptap/core'

export type CommentMarkOptions = {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentaire: {
      setCommentaire: (commentId: string) => ReturnType
      unsetCommentaireById: (commentId: string) => ReturnType
    }
  }
}

export const CommentMark = Mark.create<CommentMarkOptions>({
  name: 'commentaire',

  addOptions() {
    return { HTMLAttributes: {} }
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) return {}
          return { 'data-comment-id': attributes.commentId }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'mark[data-comment-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'transcription-comment-mark' }), 0]
  },

  addCommands() {
    return {
      setCommentaire: (commentId: string) => ({ commands }) => commands.setMark(this.name, { commentId }),
      unsetCommentaireById: (commentId: string) => ({ tr, state, dispatch }) => {
        let found = false
        state.doc.descendants((node, pos) => {
          if (!node.isText) return
          const mark = node.marks.find(m => m.type.name === 'commentaire' && m.attrs.commentId === commentId)
          if (!mark) return
          found = true
          tr.removeMark(pos, pos + node.nodeSize, mark.type)
        })
        if (found && dispatch) dispatch(tr)
        return found
      },
    }
  },
})
