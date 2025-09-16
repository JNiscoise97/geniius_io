export type TranscriptionBlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list_item"
  | "numbered_list_item"
  | "quote"
  | "todo"

  export interface TranscriptionBlock {
    id: string
    acte_id?: string
    type: TranscriptionBlockType
    content: string
    ordre: number
    indentLevel?: number
    author?: string
    created_at?: string
    updated_at?: string
    metadata?: Record<string, any>
  }  