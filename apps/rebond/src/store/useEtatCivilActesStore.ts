import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { EtatCivilActe } from "@/types/etatcivil"



type Bureau = {
  id: string
  nom: string
  commune: string | null
  departement: string | null
  region: string | null
}
type LieuLite = { id: string; type: string | null; libelle: string };
type ToponymeWithLieu = { id: string; libelle: string; lieu: LieuLite | null };
type MentionToponyme = {
  id: string;
  toponyme_id: string;
  acte_id: string;
  source_table: string;
  fonction: string | null;
  forme_originale: string | null;
  note: string | null;
  path_toponyme_ids: string[];
  path_labels: string[];
  toponyme: ToponymeWithLieu | null;
};

interface Acteur {
  id: string
  role?: string
  nom?: string
  prenom?: string
  [key: string]: any
  mentions_toponymes: MentionToponyme[];
  individuId?: string
}


interface EtatCivilActesStore {
  actes: EtatCivilActe[]
  acte: EtatCivilActe | null
  bureau: Bureau | null
  entites: Acteur[]
  loading: boolean
  fetchActeById: (acteId: string) => Promise<EtatCivilActe | null>
  fetchActeDetail: (acteId: string) => Promise<void>
}

export const useEtatCivilActesStore = create<EtatCivilActesStore>((set) => ({
  actes: [],
  loading: false,
  acte: null,
  bureau: null,
  entites: [],

  fetchActeById: async (acteId: string) => {
    const { data, error } = await supabase
      .from("etat_civil_actes")
      .select("id, bureau_id, date, heure, annee, type_acte, source, numero_acte, label, statut, comparution_mairie, comparution_observations, contrat_mariage, enfants_legitimes, enfants_nombre, transcription, mentions_marginales")
      .eq("id", acteId)
      .single()
    console.log("data", data)
    if (error) {
      console.error("Erreur de chargement de l’acte :", error.message)
      return null
    }

    return data as EtatCivilActe
  },

  fetchActeDetail: async (acteId) => {
    set({ loading: true })

    const { data: acte, error: errActe } = await supabase
      .from('etat_civil_actes')
      .select('*')
      .eq('id', acteId)
      .single()

    if (errActe || !acte) {
      console.error('Erreur acte:', errActe)
      set({ loading: false })
      return
    }

    let bureau: Bureau | null = null
    if (acte.bureau_id) {
      const { data: bureauData, error: errorBureau } = await supabase
        .from('etat_civil_bureaux')
        .select('id, nom, commune, departement, region')
        .eq('id', acte.bureau_id)
        .single()
      if (!errorBureau) bureau = bureauData
    }

    // Récupérer les entités, mappings et acteurs
    const { data: entiteData, error: errEntites } = await supabase
      .from('transcription_entites')
      .select('id')
      .eq('acte_id', acteId)

    if (errEntites || !entiteData) {
      console.error('Erreur entites:', errEntites)
      set({ acte, bureau, loading: false })
      return
    }

    const entiteIds = entiteData.map((e) => e.id)

    const { data: mappings, error: errMappings } = await supabase
      .from('transcription_entites_mapping')
      .select('cible_id')
      .in('entite_id', entiteIds)

    const acteurIds = mappings?.map((m) => m.cible_id) || []
    if (!acteurIds?.length) {
      set({ acte, bureau, entites: [], loading: false });
      return;
    }

    const { data: acteurs, error: errActeurs } = await supabase
      .from('transcription_entites_acteurs')
      .select(`
        *,
         mentions_toponymes:mentions_toponymes!mentions_toponymes_acteur_id_fkey (
      id, toponyme_id, fonction, forme_originale, note,
      path_toponyme_ids, path_labels,
      toponyme:toponymes!mentions_toponymes_toponyme_id_fkey (
        id, libelle,
        lieu:lieux!toponymes_lieu_id_fkey ( id, type )
      )
    )
      `)
      .in('id', acteurIds)

    const { data: mappingsIndividus } = await supabase
      .from('rebond_individus_mapping')
      .select('acteur_id, id')
      .in('acteur_id', acteurIds)

    const mapIndividus = mappingsIndividus?.reduce((acc, m) => {
      acc[m.acteur_id] = m.id
      return acc
    }, {} as Record<string, string>)

    const enrichedActeurs = (acteurs || []).map((a) => ({
      ...a,
      individuId: mapIndividus?.[a.id] ?? undefined,
    }))

    set({ acte, bureau, entites: enrichedActeurs, loading: false })
  },


}))
