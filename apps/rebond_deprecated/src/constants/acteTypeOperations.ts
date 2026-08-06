export const ACTE_TYPE_OPERATIONS = [
    // 🏠 Actes de disposition / transfert de biens
    { value: "vente", label: "Vente" },
    { value: "vente_d_esclave", label: "Vente d’esclave" },
    { value: "donation", label: "Donation" },
    { value: "donation_d_esclave", label: "Donation d’esclave" },
    { value: "échange", label: "Échange" },
    { value: "cession", label: "Cession" },
    { value: "partage", label: "Partage" },
    { value: "licitation", label: "Licitation" },
    { value: "affermage", label: "Affermage" },
    { value: "bail", label: "Bail" },
    { value: "vente_en_remere", label: "Vente en réméré" },
  
    // ⚖️ Succession / transmission
    { value: "testament", label: "Testament" },
    { value: "déclaration_de_succession", label: "Déclaration de succession" },
    { value: "partage_de_succession", label: "Partage de succession" },
    { value: "inventaire", label: "Inventaire" },
    { value: "renonciation_a_succession", label: "Renonciation à succession" },
    { value: "acceptation_de_succession", label: "Acceptation de succession" },
    { value: "reconnaissance_d_heritier", label: "Reconnaissance d’héritier" },
    { value: "protestation_contre_testament", label: "Protestation contre testament" },
    { value: "liquidation_de_succession", label: "Liquidation de succession" },
  
    // 💍 Vie familiale
    { value: "contrat_de_mariage", label: "Contrat de mariage" },
    { value: "reconnaissance_d_enfant", label: "Reconnaissance d’enfant" },
    { value: "adoption", label: "Adoption" },
    { value: "établissement_de_filiation", label: "Établissement de filiation" },
    { value: "séparation_de_biens", label: "Séparation de biens" },
    { value: "acte_de_communauté", label: "Acte de communauté" },
    { value: "liquidation_de_communauté", label: "Liquidation de communauté" },
  
    // 📜 Affranchissement / statut personnel
    { value: "affranchissement", label: "Affranchissement" },
    { value: "preuve_de_liberté", label: "Preuve de liberté" },
    { value: "reconnaissance_de_liberté", label: "Reconnaissance de liberté" },
    { value: "demande_d_affranchissement", label: "Demande d’affranchissement" },
    { value: "acte_de_tutelle", label: "Acte de tutelle" },
    { value: "acte_d_émancipation", label: "Acte d’émancipation" },
  
    // 🧑‍💼 Pouvoir / administration
    { value: "procuration", label: "Procuration" },
    { value: "révocation_de_procuration", label: "Révocation de procuration" },
    { value: "mandat", label: "Mandat" },
    { value: "constitution_de_société", label: "Constitution de société" },
    { value: "dissolution_de_société", label: "Dissolution de société" },
    { value: "assemblée_d_associés", label: "Assemblée d’associés" },
  
    // 💰 Financier / dettes
    { value: "quittance", label: "Quittance" },
    { value: "reconnaissance_de_dette", label: "Reconnaissance de dette" },
    { value: "acte_d_obligation", label: "Acte d’obligation" },
    { value: "hypothèque", label: "Hypothèque" },
    { value: "mainlevée", label: "Mainlevée" },
    { value: "nantissement", label: "Acte de nantissement" },
  
    // 🔐 Judiciaire / autorité
    { value: "notification_de_jugement", label: "Notification de jugement" },
    { value: "acte_de_soumission", label: "Acte de soumission" },
    { value: "assignation", label: "Assignation" },
    { value: "retrait_litigieux", label: "Retrait litigieux" },
    { value: "désistement", label: "Acte de désistement" },
  
    // 🗃️ Techniques / documents d’archives
    { value: "copie_authentique", label: "Copie authentique" },
    { value: "transcription", label: "Transcription" },
    { value: "résumé_d_acte", label: "Résumé d’acte" },
    { value: "minute", label: "Minute d’acte" },
    { value: "certificat", label: "Certificat" },
    { value: "déclaration_sous_serment", label: "Déclaration sous serment" },
  
    // ❓ Autres
    { value: "autre", label: "Autre" },
    { value: "non_identifié", label: "Non identifié" },
    { value: "fragment", label: "Fragment d’acte" },
    { value: "mention_marginale", label: "Mention marginale" },
  ]
  
  export type ActeTypeOperation = typeof ACTE_TYPE_OPERATIONS[number]["value"]
