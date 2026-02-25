//etatcivil.ts

export interface EtatCivilBureau {
    id: string
    nom: string
    commune: string
    departement?: string
    region?: string
    actes_estimes: number
    actes_a_transcrire: number
    actes_transcrits: number
    actes_a_relever: number
    actes_releves: number
    registres?: EtatCivilRegistre[];
    //nombre_registres?: number
  }

  export interface EtatCivilRegistre {
    id: string;
    annee: number;
    type_acte: string;
    registre_mode_ref: string | null;
    registre_ordre_numerotation_ref: string | null;
    registre_statut_juridique_ref: string | null;
    registre_support_ref: string | null;
    registre_pagination_ref: string | null;
    registre_langue_ref: string | null;
    registre_fonction_ref: string | null;
    registre_norme_ref: string | null;
    statut_juridique?: string;
    actes_estimes: number;
    actes_transcrits: number;
    actes_a_transcrire: number;
    actes_releves: number
    actes_a_relever: number
    actes?: EtatCivilActe[];
  };

  export interface EtatCivilActe {
    id: string
    bureau_id: string
    registre_id: string
    date: string
    heure: string
    annee: number
    source: string
    type_acte: string
    type_acte_ref: any
    type_acte_ref_obj: any
    auteur_institutionnel_ref: any
    numero_acte: string | null
    comparution_mairie: boolean | null
    comparution_observations?: string | null
    contrat_mariage?: string | null
    enfants_legitimes?: string | null
    enfants_nombre?: string | null
    mentions_marginales?: string | null
    label: string
    status: string | null
    transcription: string | null
  }
  
  export interface EtatCivilAnnee {
    id: string
    bureau_id: string
    annee: number
    nombre_actes?: number
    nb_actes_releves?: number
  } 