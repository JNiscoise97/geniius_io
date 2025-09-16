import { create } from "zustand"
import type { Document, Section, Bloc } from "@/types/transcription"
import { generateUUID } from "@/lib/uuid"
import type { Statut } from "@/features/actes/transcription/constants/statutConfig"

function assignOrdre<T extends { ordre: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, ordre: index + 1 }))
}


type DocumentStore = {
  documents: Document[]
  addDocument: (titre?: string) => void
  deleteDocument: (id: string) => void
  duplicateDocument: (id: string) => void
  updateDocumentTitre: (documentId: string, titre: string) => void
  updateDocument: (id: string, patch: Partial<Document>) => void
  updateDocumentStatut: (documentId: string, statut: Statut) => void
  recalculerStatutDocument: (documentId: string) => void

  addSection: (documentId: string, withInitialBlock: boolean, titre?: string) => string
  deleteSection: (sectionId: string) => void
  duplicateSection: (sectionId: string) => void
  updateSectionTitre: (sectionId: string, titre: string) => void
  updateSectionStatut: (sectionId: string, statut: Statut) => void
  recalculerStatutSection: (sectionId: string) => void

  addBloc: (sectionId: string, documentId: string, contenu?: string, ordre?:number) => string
  deleteBloc: (blocId: string) => void
  duplicateBloc: (blocId: string) => void
  activeBlocId: string | null
  setActiveBlocId: (id: string | null) => void

  reorderDocuments: (newOrder: string[]) => void
  reorderSections: (documentId: string, newOrder: string[]) => void
  reorderBlocs: (sectionId: string, documentId: string, newOrder: string[]) => void
  moveBlocToSection: (
    blocId: string,
    fromSectionId: string,
    toSectionId: string,
    documentId: string,
    targetIndex: number
  ) => void
  updateBlocContent: (blocId: string, contenu: string) => void
  updateBlocType: (blocId: string, type: Bloc["type"]) => void
  updateBlocStatut: (blocId: string, statut: Statut) => void
}

const mockDocument: Document = {
  id: "doc-1",
  titre: "Inventaire après décès de M. Jacques Delacroix",
  acte_id: "1",
  ordre: 1,
  sections: [
    {
      id: "section-1",
      documentId: "doc-1",
      titre: "Présentation des parties",
      ordre: 1,
      blocs: [
        {
          id: "bloc-1",
          sectionId: "section-1",
          type: "texte",
          contenu: "Maître Jean Dupont, notaire royal, résidant à Basse-Terre.",
          statut: "transcrit",
          ordre: 1,
        },
        {
          id: "bloc-2",
          sectionId: "section-1",
          type: "titre",
          contenu: "Témoins",
          statut: "brouillon",
          ordre: 2,
        },
        {
          id: "bloc-3",
          sectionId: "section-1",
          type: "liste-à-puces",
          contenu: "M. Pierre Lemoine",
          statut: "brouillon",
          ordre: 3,
        },
        {
          id: "bloc-4",
          sectionId: "section-1",
          type: "liste-numérotée",
          contenu: "1. Cheval noir",
          statut: "brouillon",
          ordre: 4,
        },
        {
          id: "bloc-5",
          sectionId: "section-1",
          type: "texte",
          contenu: "2. Coq rouge",
          statut: "brouillon",
          ordre: 5,
        },
      ],
    },
  ],
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({

  activeBlocId: null,
  setActiveBlocId: (id) => set({ activeBlocId: id }),


  documents: [mockDocument],

  addDocument: (titre = "") => {
    const docId = generateUUID()
    const sectionId = generateUUID()
    const blocId = generateUUID()
  
    const newBloc: Bloc = {
      id: blocId,
      sectionId,
      type: "texte",
      contenu: "",
      ordre: 1,
      statut: "brouillon",
    }
  
    const newSection: Section = {
      id: sectionId,
      documentId: docId,
      titre: "",
      ordre: 1,
      statut: "brouillon",
      blocs: [newBloc],
    }
  
    const newDoc: Document = {
      id: docId,
      acte_id: "0",
      titre,
      ordre: 0, // temporaire, sera corrigé par assignOrdre
      statut: "brouillon",
      sections: [newSection],
    }
  
    set((state) => ({
      documents: assignOrdre([...state.documents, newDoc]),
    }))
  },

  deleteDocument: (id) => {
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    }))
  },

  duplicateDocument: (id) => {
    const originalIndex = get().documents.findIndex((doc) => doc.id === id)
    const original = get().documents[originalIndex]
    if (!original) return
  
    const newId = generateUUID()
    const newDoc: Document = {
      ...structuredClone(original),
      id: newId,
      titre: `${original.titre} (copie)`,
      sections: original.sections.map((s) => {
        const newSectionId = generateUUID()
        return {
          ...structuredClone(s),
          id: newSectionId,
          documentId: newId,
          blocs: assignOrdre(s.blocs.map((b) => ({
            ...structuredClone(b),
            id: generateUUID(),
            sectionId: newSectionId,
          }))),
        }
      }),
    }
  
    set((state) => {
      const newDocuments = [...state.documents]
      newDocuments.splice(originalIndex + 1, 0, newDoc)
      return {
        documents: assignOrdre(newDocuments),
      }
    })
  },    

  updateDocument: (id, patch) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...patch } : doc
      ),
    }))
  },
  updateDocumentTitre: (id: string, titre: string) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, titre } : doc
      ),
    }))
  },
  updateDocumentStatut: (documentId, statut) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId ? { ...doc, statut } : doc
      )
    }))
  },
  
  recalculerStatutDocument: (documentId: string) => {
    set((state) => {
      const doc = state.documents.find((d) => d.id === documentId)
      if (!doc) return state
  
      const statuts = doc.sections.map((s) => s.statut)
  
      let nouveauStatut: Statut = "brouillon"
      if (statuts.includes("transcrit")) {
        nouveauStatut = "en cours de transcription"
      }
  
      doc.statut = nouveauStatut
      return { documents: [...state.documents] }
    })
  },  

  addSection: (documentId, withInitialBloc = true, titre = "" ) => {
    const sectionId = generateUUID()
  
    const newSection: Section = {
      id: sectionId,
      documentId,
      titre,
      ordre: 0,
      statut: "brouillon",
      blocs: withInitialBloc
        ? [{
            id: generateUUID(),
            sectionId,
            type: "texte",
            contenu: "",
            ordre: 1,
            statut: "brouillon",
          }]
        : [],
    }
  
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              sections: assignOrdre([...doc.sections, newSection]),
            }
          : doc
      ),
    }))
  
    return sectionId
  },

  deleteSection: (sectionId) => {
    set((state) => ({
      documents: state.documents.map((doc) => ({
        ...doc,
        sections: doc.sections.filter((s) => s.id !== sectionId),
      })),
    }))
  },

  duplicateSection: (sectionId) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        const index = doc.sections.findIndex((s) => s.id === sectionId)
        if (index === -1) return doc
  
        const original = doc.sections[index]
        const newSectionId = generateUUID()
        const newSection: Section = {
          ...structuredClone(original),
          id: newSectionId,
          titre: `${original.titre} (copie)`,
          blocs: assignOrdre(original.blocs.map((b) => ({
            ...structuredClone(b),
            id: generateUUID(),
            sectionId: newSectionId,
          }))),
        }
  
        const newSections = [...doc.sections]
        newSections.splice(index + 1, 0, newSection)
  
        return { ...doc, sections: assignOrdre(newSections) }
      }),
    }))
  },
  updateSectionTitre: (id: string, titre: string) => {
    set((state) => ({
      documents: state.documents.map((doc) => ({
        ...doc,
        sections: doc.sections.map((section) =>
          section.id === id ? { ...section, titre } : section
        ),
      })),
    }))
  },
  updateSectionStatut: (sectionId, statut) => {
    set((state) => ({
      documents: state.documents.map((doc) => ({
        ...doc,
        sections: doc.sections.map((section) =>
          section.id === sectionId
            ? { ...section, statut }
            : section
        ),
      }))
    }))
  
    // Propagation vers le document parent
    const documentId = get().documents.find(doc =>
      doc.sections.some(section => section.id === sectionId)
    )?.id
  
    if (documentId) {
      get().recalculerStatutDocument(documentId)
    }
  }
  ,
  recalculerStatutSection: (sectionId: string): void => {
    const state = get()
    const doc = state.documents.find((d) =>
      d.sections.some((s) => s.id === sectionId)
    )
    if (!doc) return
  
    const section = doc.sections.find((s) => s.id === sectionId)
    if (!section) return
  
    const statuts = section.blocs.map((b) => b.statut)
  
    let nouveauStatut: Statut = "brouillon"
  
    if (statuts.includes("transcrit")) {
      nouveauStatut = "en cours de transcription"
    } else if (statuts.includes("brouillon")) {
      nouveauStatut = "brouillon"
    }
  
    section.statut = nouveauStatut
  
    // Mise à jour de l'état pour forcer le re-render
    set({ documents: [...state.documents] })
  
    // ⏩ Recalcul du statut du document parent (en dehors du set)
    get().recalculerStatutDocument(doc.id)
  }
  ,

  addBloc: (sectionId, documentId, contenu = "", ordre = undefined) => {
    
    const blocId = generateUUID()
  
    const newBloc: Bloc = {
      id: blocId,
      sectionId,
      type: "texte",
      contenu,
      ordre: 0,
      statut: "brouillon",
    }
  
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              sections: doc.sections.map((sec) =>
                sec.id === sectionId
                  ? {
                      ...sec,
                      blocs: assignOrdre([
                        ...sec.blocs.slice(0, ordre ? ordre - 1 : sec.blocs.length),
                        newBloc,
                        ...sec.blocs.slice(ordre ? ordre - 1 : sec.blocs.length),
                      ]),
                    }
                  : sec
              ),
            }
          : doc
      ),
      activeBlocId: blocId,
    }))
    return blocId
  },

  deleteBloc: (blocId) => {
    set((state) => ({
      documents: state.documents.map((doc) => ({
        ...doc,
        sections: doc.sections.map((s) => ({
          ...s,
          blocs: assignOrdre(s.blocs.filter((b) => b.id !== blocId)),
        })),
      })),
    }))
  },

  duplicateBloc: (blocId) => {
    set((state) => ({
      documents: state.documents.map((doc) => ({
        ...doc,
        sections: doc.sections.map((s) => {
          const index = s.blocs.findIndex((b) => b.id === blocId)
          if (index === -1) return s
  
          const original = s.blocs[index]
          const newBloc: Bloc = {
            ...structuredClone(original),
            id: generateUUID(),
          }
  
          const newBlocs = [...s.blocs]
          newBlocs.splice(index + 1, 0, newBloc)
  
          return { ...s, blocs: assignOrdre(newBlocs) }
        }),
      })),
    }))
  },  
  reorderDocuments: (newOrder: string[]) => {
    set((state) => {
      const reordered = newOrder
        .map((id) => state.documents.find((d) => d.id === id))
        .filter(Boolean) as Document[]
      return {
        documents: assignOrdre(reordered),
      }
    })
  },

  reorderSections: (documentId: string, newOrder: string[]) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              sections: assignOrdre(
                newOrder
                  .map((id) => doc.sections.find((s) => s.id === id))
                  .filter(Boolean) as Section[]
              ),
            }
          : doc
      ),
    }))
  },

  reorderBlocs: (sectionId: string, documentId: string, newOrder: string[]) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              sections: doc.sections.map((sec) =>
                sec.id === sectionId
                  ? {
                      ...sec,
                      blocs: assignOrdre(
                        newOrder
                          .map((id) => sec.blocs.find((b) => b.id === id))
                          .filter(Boolean) as Bloc[]
                      ),
                    }
                  : sec
              ),
            }
          : doc
      ),
    }))
  },
  moveBlocToSection: (blocId, fromSectionId, toSectionId, documentId, targetIndex) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id !== documentId) return doc
  
        const fromSection = doc.sections.find((s) => s.id === fromSectionId)
        const toSection = doc.sections.find((s) => s.id === toSectionId)
        if (!fromSection || !toSection) return doc
  
        const blocIndex = fromSection.blocs.findIndex((b) => b.id === blocId)
        if (blocIndex === -1) return doc
  
        const [movedBloc] = fromSection.blocs.splice(blocIndex, 1)
        movedBloc.sectionId = toSectionId
  
        const updatedToBlocs = [...toSection.blocs]
        updatedToBlocs.splice(targetIndex, 0, movedBloc)
  
        return {
          ...doc,
          sections: doc.sections.map((s) => {
            if (s.id === fromSectionId) return { ...s, blocs: assignOrdre(fromSection.blocs) }
            if (s.id === toSectionId) return { ...s, blocs: assignOrdre(updatedToBlocs) }
            return s
          }),
        }
      }),
    }))
  },
  updateBlocContent: (blocId: string, contenu: string) => {
    set((state) => {
      for (const doc of state.documents) {
        for (const section of doc.sections) {
          const bloc = section.blocs.find((b) => b.id === blocId)
          if (bloc) {
            bloc.contenu = contenu
  
            // Mise à jour automatique du statut
            if (contenu.trim() === "") {
              bloc.statut = undefined
            } else if (bloc.statut !== "brouillon") {
              bloc.statut = "brouillon"
            }
          }
        }
      }
      return { documents: [...state.documents] }
    })
  
    const sectionId = get().documents
      .flatMap(doc => doc.sections)
      .find(section => section.blocs.some(b => b.id === blocId))?.id
  
    if (sectionId) {
      get().recalculerStatutSection(sectionId)
    }
  },  
  updateBlocType: (blocId, type) => {
    set((state) => ({
      documents: state.documents.map((doc) => ({
        ...doc,
        sections: doc.sections.map((sec) => ({
          ...sec,
          blocs: sec.blocs.map((b) =>
            b.id === blocId ? { ...b, type } : b
          ),
        })),
      })),
    }))
  },
  updateBlocStatut: (blocId: string, statut: Statut) => {
    set((state) => {
      for (const doc of state.documents) {
        for (const section of doc.sections) {
          const bloc = section.blocs.find((b) => b.id === blocId)
          if (bloc) {
            bloc.statut = statut
          }
        }
      }
      return { documents: [...state.documents] }
    })
  
    const sectionId = get().documents
      .flatMap(doc => doc.sections)
      .find(section => section.blocs.some(b => b.id === blocId))?.id
  
    if (sectionId) {
      get().recalculerStatutSection(sectionId)
    }
  },
  
}))
