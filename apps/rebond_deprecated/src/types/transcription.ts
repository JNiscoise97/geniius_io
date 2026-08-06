import type { Statut } from "@/features/actes/transcription/constants/statutConfig"
import type { Mention } from "./analyse"

export type BlocType = "texte" | "titre" | "liste-à-puces" | "liste-numérotée"

export interface Bloc {
  id: string
  sectionId: string
  type: BlocType
  contenu: string
  statut?: Statut
  ordre: number
  mentions?: Mention[]
}

export interface Section {
  id: string
  documentId: string
  titre: string
  statut?: Statut
  ordre: number
  blocs: Bloc[]
}

export interface Document {
  id: string
  acte_id: string
  titre: string
  statut?: Statut
  ordre: number
  sections: Section[]
}
