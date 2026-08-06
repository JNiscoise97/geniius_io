import type { ActeTypeOperation } from "@/constants/acteTypeOperations"

export interface MentionLieu {
    nom: string // "Habitation Destine", "case en aissantes", "Deshaies"
    type: "commune" | "habitation" | "terrain" | "maison" | "rivière" | "secteur" | "bâtiment" | "indéfini"
    précision?: "exacte" | "approx" | "indéterminée"
    position?: {
      lat: string
      lng: string
    }
    bornage?: {
      nord?: string
      sud?: string
      est?: string
      ouest?: string
    }
    description?: string // extrait textuel du document ou résumé
    lienVersCarte?: string // si tu veux intégrer un lien externe (OpenStreetMap, IGN, etc.)
  }
  
  
  export interface MentionIndividu {
    id?: string // ID interne s'il est lié à ton arbre ou à une autre base
    nom: string
    rôle?: string // vendeur, héritier, notaire, témoin…
    age?: string
    profession_brut?: string
    domicile?: string
    qualite?: string // "affranchi", "libre de couleur", etc.
    lien?: string // "mère", "épouse", etc.
    origine?: "texte" | "arbre" | "interprétation"
    observations?: string
  }

  export interface OrigineActe {
    date?: DateHistorique;
    lieu?: MentionLieu;
    type?: "notarié" | "sous seing privé";
    statut?: "original" | "copie" | "annexe" | "transcription";
    forme?: "minute" | "dépôt" | "autre";
    description?: string;
  }
  
  
  export interface BienImmeuble {
    type: "terrain" | "habitation" | "maison" | "bâtiment" | "culture" | "indéfini"
    description: string
    superficie?: string
    localisation?: MentionLieu
    valeurEstimee?: string
    bornage?: {
      nord?: string
      sud?: string
      est?: string
      ouest?: string
    }
  }

  export interface BienMeuble {
    type: "esclave" | "meuble" | "bijou" | "bétail" | "outil" | "papier" | "numéraire" | "stock" | "indéfini"
    description: string
    quantité?: string
    valeurEstimee?: string
    remarques?: string
  }

  export interface Engagement {
    type: "dette" | "créance"
    montant?: string
    créancierOuDébiteur: string
    nature?: string // "obligation", "vente à crédit", "dot", etc.
    description?: string
  }  

export type HistoriqueAction =
  | "création"
  | "modification"
  | "ajout_transcription"
  | "ajout_rebond"
  | "changement_structure_juridique"
  | "changement_type_operation"
  | "annoté"
  | "archivé"

export interface ÉvénementHistorique {
  date: string
  action: HistoriqueAction
  auteur?: string
  commentaire?: string
}

export interface RéférenceSource {
    institution:
      | "archives_nationales_outre_mer"
      | "archives_nationales"
      | "archives_departementales_guadeloupe"
      | "archives_personnelles"
      | "autre"
    description?: string
    cote: string
    lien?: string
    estSourceAnalysee?: boolean
  }
  
  export interface Notaire {
    id: string
    nom: string
    prenom?: string
    titre?: string
    etude?: string
    lieu_exercice?: string
    notes?: string
    registres?: NotaireRegistre[];
  }

  export interface NotaireRegistre {
      id: string;
      annee: number;
      actes_estimes: number;
      actes_transcrits: number;
      actes_a_transcrire: number;
      actes_releves: number
      actes_a_relever: number
      complet: boolean;
      actes?: ActeBase[];
      nombre_actes?: number;
    };

  export interface ActeNotaire {
    acte_id: string
    notaire_id: string
    role: "principal" | "associé"
    notaire?: Notaire // jointure facultative côté frontend
  }
  

  
  export interface Enregistrement {
    date: DateHistorique
    lieu: MentionLieu
    reference?: string
  }

  export interface Transcription {
    type: "brute" | "annotée"
    contenu: string // texte brut ou texte enrichi (avec balises personnalisées ou HTML/Markdown/XML)
    format: "texte" | "markdown" | "xml" | "json" // ou "html"
    auteur?: string
    date?: string
    partageable?: boolean
    note?: string
  }
  export interface DateHistorique {
    exact?: string // format ISO 8601 si connu : "1843-10-02"
    approximative?: string // texte libre : "vers 1840", "fin 19e siècle"
    intervalle?: {
      debut: string // "1878-04-01"
      fin: string   // "1878-04-04"
    }
    commentaire?: string // facultatif
  }
  
  
  export interface ActeBase {
    id: string
    origineActe?: OrigineActe
    numero_acte?: string
    
    typeOperation?: ActeTypeOperation[]
    
    seances?: {
        date: DateHistorique
        lieu?: MentionLieu
        lieuRedaction?: MentionLieu
        objets?: string
        comparants?: MentionIndividu[]
      }[]
  
    notaires?: ActeNotaire[]
    parties?: MentionIndividu[]

    label: string
  
    biensImmeubles?: BienImmeuble[]
    biensMeubles?: BienMeuble[]
    engagements?: Engagement[]

    originePropriete?: string
    clauses?: string[]
  
    enregistrement?: Enregistrement
    transcriptionHypothecaire?: Enregistrement
  
    mentionsLieuxAnnexes?: MentionLieu[]
    mentionsIndividusAnnexes?: MentionIndividu[]
    tags?: string[]
    liens?: string[] // ids des actes liés (rebonds)
  
    transcriptions?: Transcription[]

    statut?: string
  
    référencesSource?: RéférenceSource[]
    
    historique?: ÉvénementHistorique[]

    registre?: NotaireRegistre
  }
  
  