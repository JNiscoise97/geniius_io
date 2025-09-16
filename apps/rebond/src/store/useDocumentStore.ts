// useDocumentStore.ts

import { create } from "zustand"
import type { Document, Section, Bloc } from "@/types/transcription"
import { generateUUID } from "@/lib/uuid"
import type { Statut } from "@/features/actes/transcription/constants/statutConfig"
import { supabase } from "@/lib/supabase"
import { buildDocumentInsertPayload, buildDocumentUpsertPayload, buildDocumentsUpsertPayload, buildSectionInsertPayload, buildSectionUpsertPayload, buildBlocInsertPayload, buildBlocsInsertPayload, buildBlocUpsertPayload } from "@/lib/transcriptionUtils"

function assignOrdre<T extends { ordre: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, ordre: index + 1 }))
}


type DocumentStore = {
  documents: Document[]
  loading: boolean
  error: string | null
  fetchDocuments: (acte_id:string) => Promise<void>
  addDocument: (acte_id:string, titre?: string) => void
  deleteDocument: (id: string) => void
  duplicateDocument: (id: string) => void
  updateDocumentTitre: (documentId: string, titre: string) => void
  updateDocument: (id: string, patch: Partial<Document>) => void
  updateDocumentStatut: (documentId: string, statut: Statut) => void
  recalculerStatutDocument: (documentId: string) => void

  addSection: (documentId: string, withInitialBlock: boolean, titre?: string) => Promise<string>
  deleteSection: (sectionId: string) => void
  duplicateSection: (sectionId: string) => void
  updateSectionTitre: (sectionId: string, titre: string) => void
  updateSectionStatut: (sectionId: string, statut: Statut) => void
  recalculerStatutSection: (sectionId: string) => void

  addBloc: (sectionId: string, documentId: string, contenu?: string, ordre?:number) => Promise<string>
  deleteBloc: (blocId: string) => void
  duplicateBloc: (blocId: string) => void
  activeBlocId: string | null
  setActiveBlocId: (id: string | null) => void

  reorderEntities: (options: ReorderOptions) => void | Promise<void>
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
type EntityType = "documents" | "sections" | "blocs"

interface ReorderOptions {
  entity: EntityType
  parentId: string // acteId pour documents, documentId pour sections, sectionId pour blocs
  documentId?: string // requis pour blocs
  newOrder: string[]
}


export const useDocumentStore = create<DocumentStore>((set, get) => ({

  documents: [],
  loading: false,
  error: null,
  activeBlocId: null,
  setActiveBlocId: (id) => set({ activeBlocId: id }),


  fetchDocuments: async (acteId: string) => {
    set({ loading: true, error: null });
  
    // ✅ Cas mock
    if (acteId === "0") {
      const mockDocument: Document = {
        id: "doc-1",
        titre: "Inventaire après décès de M. Jacques Delacroix",
        acte_id: "0",
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
  
      set({ documents: [mockDocument], loading: false });
      return;
    }
  
    // 🌐 Requête Supabase pour les documents, sections, blocs
    const { data, error } = await supabase
    .from("transcription_documents")
    .select(`
      *,
      sections:transcription_sections (
        *,
        blocs:transcription_blocs (*)
      )
    `)
    .eq("acte_id", acteId)

  if (error) {
    console.error("[fetchDocuments] ❌ Erreur Supabase :", error.message);
    set({ error: error.message, loading: false });
    return;
  }

  // 🌐 Récupération des entités liées à l'acte
  const { data: entitesData, error: entitesError } = await supabase
    .from("transcription_entites")
    .select(`
      id,
      label,
      transcription_entites_mapping (
        cible_type,
        cible_id,
        acteur:transcription_entites_acteurs (*)
      )
    `)
    .eq("acte_id", acteId)
    .eq("source_table", "actes")

  if (entitesError) {
    console.error("Erreur récupération entités:", entitesError.message)
    set({ error: entitesError.message, loading: false })
    return
  }

  const entiteIds = entitesData.map((e) => e.id)

  // 🌐 Récupération des mentions liées aux entités
  const { data: mentionsData, error: mentionsError } = await supabase
    .from("transcription_entites_mentions")
    .select("*")
    .in("entite_id", entiteIds)

  if (mentionsError) {
    console.error("Erreur récupération des mentions:", mentionsError.message)
    set({ error: mentionsError.message, loading: false })
    return
  }

  // 🧠 Tri manuel + injection des mentions dans les blocs
  const sortedDocuments: Document[] = data.map((doc) => ({
    ...doc,
    sections: (doc.sections || []).map((section: any) => ({
      ...section,
      documentId: section.document_id,
      blocs: (section.blocs || []).map((bloc: any) => ({
        ...bloc,
        sectionId: bloc.section_id,
        mentions: mentionsData.filter((m) => m.bloc_id === bloc.id),
      })).sort((a: any, b: any) => a.ordre - b.ordre),
    })).sort((a: any, b: any) => a.ordre - b.ordre),
  }))

  set({
    documents: sortedDocuments,
    loading: false,
  });
  },

  addDocument: async (acteId: string, titre = "") => {
    const docId = generateUUID()
    const sectionId = generateUUID()
    const blocId = generateUUID()
  console.log('docId', docId)
    const newDoc : Document = {
      id: docId,
      acte_id: acteId,
      titre,
      ordre: 0, // temporaire, recalculé ensuite
      statut: "brouillon",
      sections: []
    }
  
    const newSection: Section = {
      id: sectionId,
      documentId: docId,
      titre: "",
      ordre: 1,
      statut: "brouillon",
      blocs: []
    }
  
    const newBloc: Bloc = {
      id: blocId,
      sectionId: sectionId,
      type: "texte",
      contenu: "",
      ordre: 1,
      statut: "brouillon",
    }
  
    // Étape 1 – Récupération des documents existants de l’acte
    const { data: existingDocs, error: fetchError } = await supabase
      .from("transcription_documents")
      .select("*")
      .eq("acte_id", acteId)
  
    if (fetchError) {
      console.error("Erreur chargement documents:", fetchError.message)
      return
    }
  
    // Étape 2 – Ajout du nouveau doc localement et réassignation des ordres
    const updatedDocs = assignOrdre([...existingDocs, newDoc])
  
    console.log('buildDocumentInsertPayload(newDoc)', buildDocumentInsertPayload(newDoc))
    // Étape 3 – Insertion du nouveau document
    const { error: docError } = await supabase
      .from("transcription_documents")
      .insert(buildDocumentInsertPayload(newDoc))
  
    if (docError) {
      console.error("Erreur ajout document:", docError.message)
      return
    }
  
    // Étape 4 – Mise à jour des ordres recalculés (y compris pour les autres)
    const updates = updatedDocs.map(d => ({
      id: d.id,
      ordre: d.ordre,
    }))
  
    const { error: updateError } = await supabase
      .from("transcription_documents")
      .upsert(updates, { onConflict: "id" }) // Met à jour les ordres
  
    if (updateError) {
      console.error("Erreur mise à jour des ordres:", updateError.message)
      return
    }
  
    // Étape 5 – Insertion de la section
    const { error: sectionError } = await supabase
      .from("transcription_sections")
      .insert(buildSectionInsertPayload(newSection))
  
    if (sectionError) {
      console.error("Erreur ajout section:", sectionError.message)
      return
    }
  
    // Étape 6 – Insertion du bloc
    const { error: blocError } = await supabase
      .from("transcription_blocs")
      .insert(buildBlocInsertPayload(newBloc))
  
    if (blocError) {
      console.error("Erreur ajout bloc:", blocError.message)
      return
    }
  
    // Étape 7 – Rafraîchir l’état local
    await get().fetchDocuments(acteId)
  },  

  deleteDocument: async (id: string) => {
    const state = get()
    const docToDelete = state.documents.find((d) => d.id === id)
  
    if (!docToDelete) {
      console.warn("Document introuvable dans l'état local.")
      return
    }
  
    const acteId = docToDelete.acte_id
  
    // ✅ Suppression immédiate dans l’état local
    const remainingDocsLocal = assignOrdre(
      state.documents.filter((d) => d.id !== id && d.acte_id === acteId)
    )
  
    set({
      documents: [
        ...state.documents.filter((d) => d.acte_id !== acteId),
        ...remainingDocsLocal,
      ],
    })
  
    // 🗑️ Suppression dans Supabase
    const { error: deleteError } = await supabase
      .from("transcription_documents")
      .delete()
      .eq("id", id)
  
    if (deleteError) {
      console.error("Erreur suppression document:", deleteError.message)
      if (acteId) {
        await get().fetchDocuments(acteId) // 🔁 Fallback en cas d’échec
      }
      return
    }
  
    // 🆙 Mise à jour des ordres restants en base
    if (remainingDocsLocal.length > 0) {
      const updates = remainingDocsLocal.map((doc) => ({
        id: doc.id,
        ordre: doc.ordre,
      }))
  
      const { error: upsertError } = await supabase
        .from("transcription_documents")
        .upsert(updates, { onConflict: "id" })
  
      if (upsertError) {
        console.error("Erreur mise à jour des ordres:", upsertError.message)
        if (acteId) {
          await get().fetchDocuments(acteId) // 🔁 Fallback également
        }
        return
      }
    }
  
    // ✅ Tout s'est bien passé, pas besoin de fetch supplémentaire
  },

  duplicateDocument: async (id: string) => {
    const state = get()
    const original = state.documents.find((doc) => doc.id === id)
    if (!original) return
  
    const acteId = original.acte_id
    const siblings = state.documents.filter((d) => d.acte_id === acteId)
    const originalIndex = siblings.findIndex((d) => d.id === id)
    if (originalIndex === -1) return
  
    const newDocId = generateUUID()
  
    const newDoc: Document = {
      id: newDocId,
      acte_id: acteId,
      titre: `${original.titre} (copie)`,
      ordre: 0,
      statut: "brouillon",
      sections: original.sections.map((section, i): Section => {
        const newSectionId = generateUUID()
        const newBlocs = assignOrdre(section.blocs.map((b): Bloc => ({
          id: generateUUID(),
          sectionId: newSectionId,
          type: b.type,
          contenu: b.contenu,
          ordre: 0,
          statut: "brouillon",
        })))
  
        return {
          id: newSectionId,
          documentId: newDocId,
          titre: `${section.titre} (copie)`,
          ordre: i + 1,
          statut: "brouillon",
          blocs: newBlocs,
        }
      }),
    }
  
    const updatedDocs = assignOrdre([
      ...siblings.slice(0, originalIndex + 1),
      newDoc,
      ...siblings.slice(originalIndex + 1),
    ])
  
    set({
      documents: [
        ...state.documents.filter((d) => d.acte_id !== acteId),
        ...updatedDocs,
      ],
    })
  
    const upsertPayload = updatedDocs.map(buildDocumentUpsertPayload)
  
    const { error: docError } = await supabase
      .from("transcription_documents")
      .upsert(upsertPayload, { onConflict: "id" })
  
    if (docError) {
      console.error("Erreur upsert documents:", docError.message)
      await get().fetchDocuments(acteId)
      return
    }
  
    for (const section of newDoc.sections) {
      const sectionInsert = buildSectionInsertPayload(section)
  
      const { error: sectionError } = await supabase
        .from("transcription_sections")
        .insert(sectionInsert)
  
      if (sectionError) {
        console.error("Erreur insertion section:", sectionError.message)
        await get().fetchDocuments(acteId)
        return
      }
  
      if (section.blocs.length > 0) {
        const blocsInsert = section.blocs.map(buildBlocInsertPayload)
  
        const { error: blocError } = await supabase
          .from("transcription_blocs")
          .insert(blocsInsert)
  
        if (blocError) {
          console.error("Erreur insertion blocs:", blocError.message)
          await get().fetchDocuments(acteId)
          return
        }
      }
    }
  
    // ✅ Succès complet — aucun fetch nécessaire
  },    

  updateDocument: async (id: string, patch: Partial<Document>) => {
    const state = get()
  
    // ✅ Mise à jour locale immédiate (optimiste)
    set({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...patch } : doc
      ),
    })
  
    // 📤 Mise à jour distante
    const { error } = await supabase
      .from("transcription_documents")
      .update(patch)
      .eq("id", id)
  
    if (error) {
      console.error("Erreur updateDocument:", error.message)
  
      // 🔁 Fallback : on recharge le document complet
      const doc = get().documents.find((d) => d.id === id)
      if (doc?.acte_id) {
        await get().fetchDocuments(doc.acte_id)
      }
  
      return
    }
  
    // ✅ Succès — pas de fetch supplémentaire nécessaire
  },
  updateDocumentTitre: async (id: string, titre: string) => {
    const { error } = await supabase
      .from("transcription_documents")
      .update({ titre })
      .eq("id", id)
  
    if (error) {
      console.error("Erreur updateDocumentTitre:", error.message)
      const failedDoc = get().documents.find((d) => d.id === id)
      if (failedDoc?.acte_id) {
        await get().fetchDocuments(failedDoc.acte_id)
      }
    }
  },
  updateDocumentStatut: async (documentId, statut) => {
    const { error } = await supabase
      .from("transcription_documents")
      .update({ statut })
      .eq("id", documentId)
  
    if (error) {
      console.error("Erreur updateDocumentStatut:", error.message)
      return
    }
  
    const doc = get().documents.find(d => d.id === documentId)
    if (doc?.acte_id) {
      await get().fetchDocuments(doc.acte_id)
    }
  },
  
  recalculerStatutDocument: async (documentId: string) => {
    const state = get()
  
    const doc = state.documents.find((d) => d.id === documentId)
    if (!doc) return
  
    const statuts = doc.sections.map((s) => s.statut)
  
    // Cas 1 : statut actuel = "transcrit", on vérifie s'il peut être conservé
    if (doc.statut === "transcrit") {
      const toutesTranscrites = statuts.every((s) => s === "transcrit")

      if (toutesTranscrites) {
        // On ne touche pas au statut
        return
      }
      // Sinon, on continue le recalcul
    }

    // Cas 2 : recalcul standard
    let nouveauStatut: Statut = "brouillon"
    if (statuts.includes("transcrit") || statuts.includes("en cours de transcription")) {
      nouveauStatut = "en cours de transcription"
    }

    // Mise à jour si changement
    if (doc.statut !== nouveauStatut) {
      const { error } = await supabase
        .from("transcription_documents")
        .update({ statut: nouveauStatut })
        .eq("id", documentId)

      if (error) {
        console.error("Erreur recalculerStatutDocument:", error.message)
        if (doc.acte_id) {
          await get().fetchDocuments(doc.acte_id)
        }
        return
      }

      // Mise à jour locale
      doc.statut = nouveauStatut
      set({ documents: [...state.documents] })
    }
  },  

  addSection: async (
    documentId: string,
    withInitialBlock = true,
    titre = ""
  ): Promise<string> => {
    const sectionId = generateUUID()
    const blocId = generateUUID()
  
    const state = get()
    const document = state.documents.find((d) => d.id === documentId)
    if (!document) throw new Error("Document introuvable")
  
    const sections = document.sections ?? []
  
    const newSection: Section = {
      id: sectionId,
      documentId,
      titre,
      ordre: 0,
      statut: "brouillon",
      blocs: [],
    }
  
    const orderedSections = assignOrdre([...sections, newSection])
  
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? { ...doc, sections: orderedSections }
          : doc
      ),
    }))
  
    const insertPayload = buildSectionInsertPayload({
      ...newSection,
      ordre: orderedSections.find((s) => s.id === sectionId)?.ordre ?? 1,
    })
  
    const { error: sectionError } = await supabase
      .from("transcription_sections")
      .insert(insertPayload)
  
    if (sectionError) {
      console.error("Erreur ajout section:", sectionError.message)
      throw sectionError
    }
  
    const otherSections = orderedSections.filter((s) => s.id !== sectionId)
  
    if (otherSections.length > 0) {
      const upsertPayload = buildSectionUpsertPayload(otherSections)
  
      const { error: updateError } = await supabase
        .from("transcription_sections")
        .upsert(upsertPayload, { onConflict: "id" })
  
      if (updateError) {
        console.error("Erreur mise à jour des ordres sections:", updateError.message)
      }
    }
  
    if (withInitialBlock) {
      const bloc: Bloc = {
        id: blocId,
        sectionId,
        type: "texte",
        contenu: "",
        ordre: 1,
        statut: "brouillon",
      }
  
      const { error: blocError } = await supabase
        .from("transcription_blocs")
        .insert(buildBlocInsertPayload(bloc))
  
        if (blocError) {
          console.error("Erreur ajout bloc initial:", blocError.message)
        } else {
          // ✅ Mise à jour de l’état local pour inclure le bloc
          set((state) => ({
            documents: state.documents.map((doc) =>
              doc.id === documentId
                ? {
                    ...doc,
                    sections: doc.sections.map((sec) =>
                      sec.id === sectionId
                        ? { ...sec, blocs: [bloc] }
                        : sec
                    ),
                  }
                : doc
            ),
          }))
        }
    }
  
    return sectionId
  },

  deleteSection: async (sectionId: string) => {
    const state = get()

    const doc = state.documents.find((d) =>
      d.sections.some((s) => s.id === sectionId)
    )

    if (!doc) {
      console.warn("Document introuvable pour la section", sectionId)
      return
    }

    const remainingSections = doc.sections.filter((s) => s.id !== sectionId)
    const reorderedSections = assignOrdre(remainingSections)

    // ✅ Mise à jour locale immédiate
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === doc.id ? { ...d, sections: reorderedSections } : d
      ),
    }))

    // 🔁 Recalcul du statut du document parent
    await get().recalculerStatutDocument(doc.id)

    // 🗑️ Suppression distante
    const { error: deleteError } = await supabase
      .from("transcription_sections")
      .delete()
      .eq("id", sectionId)

    if (deleteError) {
      console.error("Erreur suppression section:", deleteError.message)
      if (doc.acte_id) await get().fetchDocuments(doc.acte_id)
      return
    }

    // 🆙 Mise à jour des ordres en base via utilitaire
    if (reorderedSections.length > 0) {
      const updates = buildSectionUpsertPayload(reorderedSections)

      const { error: updateError } = await supabase
        .from("transcription_sections")
        .upsert(updates, { onConflict: "id" })

      if (updateError) {
        console.error("Erreur mise à jour des ordres sections:", updateError.message)
      }
    }
  },

  duplicateSection: async (sectionId: string) => {
    const state = get()
  
    const doc = state.documents.find((d) =>
      d.sections.some((s) => s.id === sectionId)
    )
    if (!doc) {
      console.warn("Document non trouvé pour la section", sectionId)
      return
    }
  
    const originalIndex = doc.sections.findIndex((s) => s.id === sectionId)
    if (originalIndex === -1) {
      console.warn("Section originale introuvable")
      return
    }
  
    const original = doc.sections[originalIndex]
    const newSectionId = generateUUID()
  
    const newBlocs = assignOrdre(
      original.blocs.map((b) => ({
        id: generateUUID(),
        sectionId: newSectionId,
        type: b.type,
        contenu: b.contenu,
        ordre: 0,
        statut: "brouillon",
      }))
    )
  
    const newSection: Section = {
      id: newSectionId,
      documentId: doc.id,
      titre: `${original.titre} (copie)`,
      ordre: 0,
      statut: "brouillon",
      blocs: newBlocs,
    }
  
    const updatedSections = assignOrdre([
      ...doc.sections.slice(0, originalIndex + 1),
      newSection,
      ...doc.sections.slice(originalIndex + 1),
    ])
  
    set({
      documents: state.documents.map((d) =>
        d.id === doc.id ? { ...d, sections: updatedSections } : d
      ),
    })
  
    // ✅ Upsert sections via utilitaire
    const sectionPayload = buildSectionUpsertPayload(updatedSections)
    const { error: sectionError } = await supabase
      .from("transcription_sections")
      .upsert(sectionPayload, { onConflict: "id" })
  
    if (sectionError) {
      console.error("Erreur upsert sections:", sectionError.message)
      await get().fetchDocuments(doc.acte_id)
      return
    }
  
    // ✅ Insert blocs via utilitaire
    if (newBlocs.length > 0) {
      const blocsPayload = buildBlocsInsertPayload(newBlocs)
      const { error: blocsError } = await supabase
        .from("transcription_blocs")
        .insert(blocsPayload)
  
      if (blocsError) {
        console.error("Erreur duplication blocs:", blocsError.message)
        await get().fetchDocuments(doc.acte_id)
        return
      }
    }
  
    // ✅ Aucun fetch supplémentaire nécessaire
  },
  updateSectionTitre: async (id: string, titre: string) => {
    const { error } = await supabase
      .from("transcription_sections")
      .update({ titre })
      .eq("id", id)
  
    if (error) {
      console.error("Erreur mise à jour titre section:", error.message)
  
      const doc = get().documents.find((d) =>
        d.sections.some((s) => s.id === id)
      )
  
      if (doc?.acte_id) {
        await get().fetchDocuments(doc.acte_id)
      }
    }
  }
,  
  updateSectionStatut: async (sectionId: string, statut: Statut) => {
    const { error } = await supabase
      .from("transcription_sections")
      .update({ statut })
      .eq("id", sectionId)
  
    if (error) {
      console.error("Erreur mise à jour statut section:", error.message)
      return
    }
  
    // Mise à jour locale
    set((state) => ({
      documents: state.documents.map((doc) => ({
        ...doc,
        sections: doc.sections.map((section) =>
          section.id === sectionId ? { ...section, statut } : section
        ),
      })),
    }))
  
    // Propagation vers le document parent
    const documentId = get().documents.find(doc =>
      doc.sections.some(section => section.id === sectionId)
    )?.id
  
    if (documentId) {
      await get().recalculerStatutDocument(documentId)
    }
  },
  recalculerStatutSection: async (sectionId: string) => {
    const state = get()
  
    const doc = state.documents.find((d) =>
      d.sections.some((s) => s.id === sectionId)
    )
    if (!doc) return
  
    const section = doc.sections.find((s) => s.id === sectionId)
    if (!section) return
  
    const statuts = section.blocs.map((b) => b.statut)
  
    // Cas 1 : la section est "transcrit", on vérifie si tous les blocs le sont encore
    if (section.statut === "transcrit") {
      const tousTranscrits = statuts.every((s) => s === "transcrit")

      if (tousTranscrits) {
        // Rien à faire, on garde "transcrit"
        return
      }
      // Sinon on passe au recalcul
    }

    // Cas 2 : recalcul normal
    let nouveauStatut: Statut = "brouillon"
    if (statuts.includes("transcrit") || statuts.includes("en cours de transcription")) {
      nouveauStatut = "en cours de transcription"
    }

    if (section.statut !== nouveauStatut) {
      const { error } = await supabase
        .from("transcription_sections")
        .update({ statut: nouveauStatut })
        .eq("id", sectionId)

      if (error) {
        console.error("Erreur mise à jour statut section:", error.message)
        if (doc.acte_id) {
          await get().fetchDocuments(doc.acte_id)
        }
        return
      }

      // Mise à jour locale
      section.statut = nouveauStatut
      set({ documents: [...state.documents] })
    }

    // Propagation vers le document parent
    await get().recalculerStatutDocument(doc.id)
  },

  addBloc: async (
    sectionId: string,
    documentId: string,
    contenu = "",
    ordre?: number
  ): Promise<string> => {
    const blocId = generateUUID()
  
    const state = get()
    const section = state.documents
      .find((doc) => doc.id === documentId)
      ?.sections.find((s) => s.id === sectionId)
  
    if (!section) {
      console.error("Section introuvable pour l'ajout de bloc.")
      return blocId
    }
  
    const nouveauBloc: Bloc = {
      id: blocId,
      sectionId,
      type: "texte",
      contenu,
      ordre: 0, // assignOrdre fixera cela
      statut: "brouillon",
    }
  
    // 🧠 Insertion locale optimiste
    const nouveauxBlocs = assignOrdre([
      ...section.blocs.slice(0, ordre ?? section.blocs.length),
      nouveauBloc,
      ...section.blocs.slice(ordre ?? section.blocs.length),
    ])
  
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              sections: doc.sections.map((sec) =>
                sec.id === sectionId ? { ...sec, blocs: nouveauxBlocs } : sec
              ),
            }
          : doc
      ),
      activeBlocId: blocId,
    }))
  
    // 🔎 Bloc nouvellement inséré
    const blocASauver = nouveauxBlocs.find((b) => b.id === blocId)
    if (!blocASauver) {
      console.error("Bloc à insérer non trouvé après assignOrdre.")
      return blocId
    }
  
    // 📤 Insertion du bloc en base
    const { error: insertError } = await supabase
      .from("transcription_blocs")
      .insert(buildBlocInsertPayload(blocASauver))
  
    if (insertError) {
      console.error("Erreur insertion bloc:", insertError.message)
      // (Optionnel) rollback local ici si nécessaire
      return blocId
    }
  
    // 🔁 Mise à jour des ordres en un seul upsert
    const { error: upsertError } = await supabase
    .from("transcription_blocs")
    .upsert(buildBlocUpsertPayload(nouveauxBlocs), { onConflict: "id" })
  
    if (upsertError) {
      console.error("Erreur mise à jour des ordres blocs:", upsertError.message)
      return blocId
    }
  
    // 🔄 Rechargement final pour cohérence
    const acteId = state.documents.find((d) => d.id === documentId)?.acte_id
    if (acteId) {
      await get().fetchDocuments(acteId)
    }
  
    return blocId
  },

  deleteBloc: async (blocId: string) => {
    const state = get()
  
    // 1. Localiser la section et le document du bloc
    let documentId: string | undefined
    let sectionId: string | undefined
    let blocsRestants: Bloc[] = []
  
    const updatedDocuments = state.documents.map((doc) => {
      const updatedSections = doc.sections.map((section) => {
        if (section.blocs.some((b) => b.id === blocId)) {
          documentId = doc.id
          sectionId = section.id
  
          const nouveauxBlocs = assignOrdre(section.blocs.filter((b) => b.id !== blocId))
          blocsRestants = nouveauxBlocs
  
          return { ...section, blocs: nouveauxBlocs }
        }
        return section
      })
  
      return { ...doc, sections: updatedSections }
    })
  
    if (!sectionId || !documentId) {
      console.error("Bloc introuvable dans les documents")
      return
    }
  
    // 2. Mise à jour locale immédiate
    set({
      documents: updatedDocuments,
      activeBlocId: undefined,
    })
  
    // 3. Suppression en base
    const { error: deleteError } = await supabase
      .from("transcription_blocs")
      .delete()
      .eq("id", blocId)
  
    if (deleteError) {
      console.error("Erreur suppression bloc:", deleteError.message)
      await get().fetchDocuments(state.documents.find(d => d.id === documentId)?.acte_id || "")
      return
    }
  
    // 4. Mise à jour des ordres restants en base via upsert
    if (blocsRestants.length > 0) {
      const { error: updateError } = await supabase
        .from("transcription_blocs")
        .upsert(buildBlocUpsertPayload(blocsRestants), { onConflict: "id" })
  
      if (updateError) {
        console.error("Erreur mise à jour des ordres:", updateError.message)
      }
    }
  
    // 5. Recalcul du statut de la section (et du document)
    await get().recalculerStatutSection(sectionId)
  },

  duplicateBloc: async (blocId: string) => {
    const state = get()
  
    // 1. Trouver bloc, section et document concernés
    let found = false
    let updatedDocuments = [...state.documents]
    let reorderedBlocs: Bloc[] = []
    let newBlocId = generateUUID()
    let acteId = ""
  
    updatedDocuments = updatedDocuments.map((doc) => {
      const newSections = doc.sections.map((section) => {
        const index = section.blocs.findIndex((b) => b.id === blocId)
        if (index === -1) return section
  
        found = true
        acteId = doc.acte_id
  
        const original = section.blocs[index]
        const newBloc: Bloc = {
          ...structuredClone(original),
          id: newBlocId,
          sectionId: section.id,
          contenu: original.contenu,
          type: original.type,
          ordre: 0, // assignOrdre fera le tri
          statut: "brouillon",
        }
  
        reorderedBlocs = assignOrdre([
          ...section.blocs.slice(0, index + 1),
          newBloc,
          ...section.blocs.slice(index + 1),
        ])
  
        return { ...section, blocs: reorderedBlocs }
      })
  
      return { ...doc, sections: newSections }
    })
  
    if (!found) {
      console.warn("Bloc à dupliquer non trouvé.")
      return
    }
  
    // 2. Mise à jour immédiate de l'état local
    set({
      documents: updatedDocuments,
      activeBlocId: newBlocId,
    })
  
    // 3. Insertion du bloc dupliqué en base
    const blocASauver = reorderedBlocs.find((b) => b.id === newBlocId)
    if (!blocASauver) {
      console.error("Bloc dupliqué introuvable après assignOrdre")
      return
    }
  
    const { error: insertError } = await supabase
      .from("transcription_blocs")
      .insert(buildBlocInsertPayload(blocASauver))
  
    if (insertError) {
      console.error("Erreur insertion bloc dupliqué:", insertError.message)
      if (acteId) await get().fetchDocuments(acteId)
      return
    }
  
    // 4. Mise à jour des `ordre` restants via upsert
    const { error: upsertError } = await supabase
      .from("transcription_blocs")
      .upsert(buildBlocUpsertPayload(reorderedBlocs), { onConflict: "id" })
  
    if (upsertError) {
      console.error("Erreur mise à jour des ordres:", upsertError.message)
      if (acteId) await get().fetchDocuments(acteId)
    }
  
    // ✅ Tout est à jour, pas de fetch nécessaire si pas d'erreur
  },

  reorderEntities: async ({ entity, parentId, documentId, newOrder }: ReorderOptions) => {
    const state = get()
    let updatedItems: any[] = []
    let supabaseTable = ""
    let updatedDocuments: Document[] = []
    let updates: any[] = []
  
    try {
      if (entity === "documents") {
        const siblings = state.documents.filter((d) => d.acte_id === parentId)
        const reordered = assignOrdre(
          newOrder.map((id) => siblings.find((d) => d.id === id)).filter(Boolean) as Document[]
        )
  
        updatedDocuments = [
          ...state.documents.filter((d) => d.acte_id !== parentId),
          ...reordered,
        ]
  
        set({ documents: updatedDocuments })
        updatedItems = reordered
        supabaseTable = "transcription_documents"
        updates = buildDocumentsUpsertPayload(updatedItems)
      }
  
      if (entity === "sections") {
        const doc = state.documents.find((d) => d.id === parentId)
        if (!doc) throw new Error("Document introuvable")
  
        const reordered = assignOrdre(
          newOrder.map((id) => doc.sections.find((s) => s.id === id)).filter(Boolean) as Section[]
        )
  
        updatedDocuments = state.documents.map((d) =>
          d.id === parentId ? { ...d, sections: reordered } : d
        )
  
        set({ documents: updatedDocuments })
        updatedItems = reordered
        supabaseTable = "transcription_sections"
        updates = buildSectionUpsertPayload(updatedItems)
      }
  
      if (entity === "blocs") {
        if (!documentId) throw new Error("documentId requis pour les blocs")
        const doc = state.documents.find((d) => d.id === documentId)
        if (!doc) throw new Error("Document introuvable")
  
        const section = doc.sections.find((s) => s.id === parentId)
        if (!section) throw new Error("Section introuvable")
  
        const reordered = assignOrdre(
          newOrder.map((id) => section.blocs.find((b) => b.id === id)).filter(Boolean) as Bloc[]
        )
  
        updatedDocuments = state.documents.map((d) =>
          d.id === documentId
            ? {
                ...d,
                sections: d.sections.map((s) =>
                  s.id === parentId ? { ...s, blocs: reordered } : s
                ),
              }
            : d
        )
  
        set({ documents: updatedDocuments })
        updatedItems = reordered
        supabaseTable = "transcription_blocs"
        updates = buildBlocUpsertPayload(updatedItems)
      }
  
      const { error } = await supabase
        .from(supabaseTable)
        .upsert(updates, { onConflict: "id" })
  
      if (error) {
        console.error(`Erreur mise à jour des ordres dans ${supabaseTable}:`, error.message)
  
        const fallbackActeId = state.documents.find((d) =>
          d.id === parentId || d.id === documentId
        )?.acte_id
  
        if (fallbackActeId) {
          await get().fetchDocuments(fallbackActeId)
        }
      }
    } catch (e) {
      console.error("Erreur dans reorderEntities:", e)
    }
  },
  moveBlocToSection: async (
    blocId: string,
    fromSectionId: string,
    toSectionId: string,
    documentId: string,
    targetIndex: number
  ) => {
    const state = get()
    const documents = [...state.documents]
    let acteId = ""
  
    // 1. Mise à jour locale immédiate (optimiste)
    const updatedDocuments = documents.map((doc) => {
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
  
      acteId = doc.acte_id
  
      return {
        ...doc,
        sections: doc.sections.map((s) => {
          if (s.id === fromSectionId)
            return { ...s, blocs: assignOrdre(fromSection.blocs) }
          if (s.id === toSectionId)
            return { ...s, blocs: assignOrdre(updatedToBlocs) }
          return s
        }),
      }
    })
  
    set({
      documents: updatedDocuments,
      activeBlocId: blocId,
    })
  
    // 2. Mise à jour distante
  
    const { error: updateSectionError } = await supabase
      .from("transcription_blocs")
      .update({ section_id: toSectionId })
      .eq("id", blocId)
  
    if (updateSectionError) {
      console.error("Erreur changement section du bloc :", updateSectionError.message)
      if (acteId) await get().fetchDocuments(acteId)
      return
    }
  
    const updatedToSection = updatedDocuments
      .find((d) => d.id === documentId)
      ?.sections.find((s) => s.id === toSectionId)
  
    const updatedFromSection = updatedDocuments
      .find((d) => d.id === documentId)
      ?.sections.find((s) => s.id === fromSectionId)
  
    const allUpdatedBlocs = [
      ...(updatedToSection?.blocs || []),
      ...(updatedFromSection?.blocs || []),
    ]
  
    const { error: updateOrdreError } = await supabase
      .from("transcription_blocs")
      .upsert(buildBlocUpsertPayload(allUpdatedBlocs), { onConflict: "id" })
  
    if (updateOrdreError) {
      console.error("Erreur mise à jour des ordres des blocs :", updateOrdreError.message)
      if (acteId) await get().fetchDocuments(acteId)
      return
    }
  
    // 3. Recalcul des statuts
    await get().recalculerStatutSection(fromSectionId)
    await get().recalculerStatutSection(toSectionId)
  },

  updateBlocContent: async (blocId: string, contenu: string) => {
    const state = get()
  
    let statut: Statut | undefined
    if (contenu.trim() === "") {
      statut = undefined
    } else {
      statut = "brouillon"
    }
  
    // 1. Mise à jour locale immédiate (optimisme UI)
    set({
      documents: state.documents.map((doc) => ({
        ...doc,
        sections: doc.sections.map((section) => ({
          ...section,
          blocs: section.blocs.map((bloc) =>
            bloc.id === blocId
              ? { ...bloc, contenu, statut }
              : bloc
          ),
        })),
      })),
    })
  
    // 2. Persistance dans Supabase
    const { error } = await supabase
      .from("transcription_blocs")
      .update({ contenu, statut })
      .eq("id", blocId)
  
    if (error) {
      console.error("Erreur updateBlocContent:", error.message)
  
      // 3. Fallback : rechargement complet en cas d’échec
      const acteId = state.documents.find((d) =>
        d.sections.some((s) =>
          s.blocs.some((b) => b.id === blocId)
        )
      )?.acte_id
  
      if (acteId) {
        await get().fetchDocuments(acteId)
      }
  
      return
    }
  
    // 4. Recalcul du statut de la section parente
    const sectionId = get().documents
      .flatMap(doc => doc.sections)
      .find(section => section.blocs.some(b => b.id === blocId))?.id
  
    if (sectionId) {
      await get().recalculerStatutSection(sectionId)
    }
  },  
  updateBlocType: async (blocId: string, type: Bloc["type"]) => {
    // ✅ Mise à jour locale immédiate
    set((state) => ({
      documents: state.documents.map((doc) => ({
        ...doc,
        sections: doc.sections.map((section) => ({
          ...section,
          blocs: section.blocs.map((bloc) =>
            bloc.id === blocId ? { ...bloc, type } : bloc
          ),
        })),
      })),
    }))
  
    // 📤 Mise à jour persistante dans Supabase
    const { error } = await supabase
      .from("transcription_blocs")
      .update({ type })
      .eq("id", blocId)
  
    if (error) {
      console.error("Erreur updateBlocType:", error.message)
  
      // 🔁 Fallback : recharge le document en cas d’échec
      const acteId = get().documents.find(d =>
        d.sections.some(s => s.blocs.some(b => b.id === blocId))
      )?.acte_id
  
      if (acteId) {
        await get().fetchDocuments(acteId)
      }
  
      return
    }
  
    // ✅ Succès : aucun fetch nécessaire
  },
  updateBlocStatut: async (blocId: string, statut: Statut) => {
    // ✅ Mise à jour locale immédiate
    set((state) => ({
      documents: state.documents.map((doc) => ({
        ...doc,
        sections: doc.sections.map((section) => ({
          ...section,
          blocs: section.blocs.map((bloc) =>
            bloc.id === blocId ? { ...bloc, statut } : bloc
          ),
        })),
      })),
    }))
  
    // 📤 Mise à jour distante
    const { error } = await supabase
      .from("transcription_blocs")
      .update({ statut })
      .eq("id", blocId)
  
    if (error) {
      console.error("Erreur updateBlocStatut:", error.message)
      const acteId = get().documents.find((d) =>
        d.sections.some((s) => s.blocs.some((b) => b.id === blocId))
      )?.acte_id
  
      if (acteId) {
        await get().fetchDocuments(acteId) // fallback
      }
      return
    }
  
    // 🔁 Recalcul du statut section
    const sectionId = get().documents
      .flatMap((doc) => doc.sections)
      .find((section) => section.blocs.some((b) => b.id === blocId))?.id
  
    if (sectionId) {
      await get().recalculerStatutSection(sectionId)
    }
  },  
  
}))
