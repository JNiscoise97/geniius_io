import type { Document } from "@/types/transcription"
import type { Section } from "@/types/transcription"
import type { Bloc } from "@/types/transcription"

export function buildDocumentInsertPayload(document: Document) {
    return {
      id: document.id,
      acte_id: document.acte_id,
      titre: document.titre,
      ordre: document.ordre,
      statut: document.statut,
    }
}

export function buildSectionInsertPayload(section: Section) {
    return {
      id: section.id,
      document_id: section.documentId,
      titre: section.titre,
      ordre: section.ordre,
      statut: section.statut,
    }
}

export function buildBlocInsertPayload(bloc: Bloc) {
    return {
      id: bloc.id,
      section_id: bloc.sectionId,
      type: bloc.type,
      contenu: bloc.contenu,
      ordre: bloc.ordre,
      statut: bloc.statut,
    }
}
  
export function buildDocumentsUpsertPayload(documents: Document[]) {
    return documents.map((d) => ({
      id: d.id,
      acte_id: d.acte_id,
      titre: d.titre,
      ordre: d.ordre,
      statut: d.statut,
    }))
}

export function buildDocumentUpsertPayload(doc: Document) {
    return {
        id: doc.id,
        acte_id: doc.acte_id,
        titre: doc.titre,
        ordre: doc.ordre,
        statut: doc.statut,
      }
    
}
  
export function buildSectionUpsertPayload(sections: Section[]) {
    return sections.map((s) => ({
        id: s.id,
        document_id: s.documentId,
        titre: s.titre,
        ordre: s.ordre,
        statut: s.statut,
    }))
}

export function buildBlocUpsertPayload(blocs: Bloc[]) {
    return blocs.map((b) => ({
        id: b.id,
        section_id: b.sectionId,
        ordre: b.ordre,
        type: b.type,
        contenu: b.contenu,
        statut: b.statut,
    }))
}
export function buildBlocsInsertPayload(blocs: Bloc[]) {
    return blocs.map((b) => ({
      id: b.id,
      section_id: b.sectionId,
      type: b.type,
      contenu: b.contenu,
      ordre: b.ordre,
      statut: b.statut,
    }))
  }
  
