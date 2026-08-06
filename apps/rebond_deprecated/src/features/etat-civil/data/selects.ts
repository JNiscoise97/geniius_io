// features/etat-civil/data/selects.ts
// 📦 Tous les fragments de SELECT au même endroit, réutilisables dans les stores

// Sélection "acteur enrichi" (equiv. à ce que tu fais déjà dans les deux stores)
export const ACTEUR_DEEP_SELECT = `
  *,
  mentions_toponymes:mentions_toponymes!mentions_toponymes_acteur_id_fkey (
    id, toponyme_id, fonction, forme_originale, note, path_toponyme_ids, path_labels,
    toponyme:toponymes!mentions_toponymes_toponyme_id_fkey (
      id, libelle,
      lieu:lieux!toponymes_lieu_id_fkey ( id, type )
    )
  ),

  categories_couleur:transcription_acteur_categorie_couleur!transcription_acteur_categories_couleur_acteur_id_fkey (
    categorie_couleur_id,
    ref:ref_categorie_couleur!transcription_acteur_categories_coule_categorie_couleur_id_fkey ( id, code, label, label_m, label_f, invariable )
  ),

  filiations:transcription_acteur_filiation!transcription_acteur_filiations_acteur_id_fkey (
    filiation_id,
    ref:ref_filiation!transcription_acteur_filiations_filiation_id_fkey ( id, code, label )
  ),

  professions:transcription_acteur_profession!transcription_acteur_profession_acteur_id_fkey (
    profession_id, position,
    ref:ref_profession!transcription_acteur_profession_profession_id_fkey ( id, code, label, label_m, label_f, invariable )
  ),

  qualites:transcription_acteur_qualite!transcription_acteur_qualites_acteur_id_fkey (
    qualite_id,
    ref:ref_qualite!transcription_acteur_qualites_qualite_id_fkey ( id, code, label, genre )
  ),

  situations_fiscales:transcription_acteur_situation_fiscale!transcription_acteur_situations_fiscales_acteur_id_fkey (
    situation_fiscale_id,
    ref:ref_situation_fiscale!transcription_acteur_situations_fisca_situation_fiscale_id_fkey ( id, code, label, label_m, label_f, invariable )
  ),

  situations_matrimoniales:transcription_acteur_situation_matrimoniale!transcription_acteur_situation_matrimoniale_acteur_id_fkey (
    situation_matrimoniale_id,
    ref:ref_situation_matrimoniale!transcription_acteur_situation_m_situation_matrimoniale_id_fkey ( id, code, label, label_m, label_f, invariable )
  ),

  statuts_juridiques:transcription_acteur_statut_juridique!transcription_acteur_statut_juridique_acteur_id_fkey (
    statut_juridique_id,
    ref:ref_statut_juridique!transcription_acteur_statut_juridique_statut_juridique_id_fkey ( id, code, label, label_m, label_f, invariable )
  ),

  statuts_proprietaires:transcription_acteur_statut_proprietaire!transcription_acteur_statut_proprietaire_acteur_id_fkey (
    statut_proprietaire_id,
    ref:ref_statut_proprietaire!transcription_acteur_statut_proprietaire_statut_proprietaire_id ( id, code, label, label_m, label_f, invariable )
  ),

  signatures:transcription_acteur_signature!transcription_acteur_signature_acteur_id_fkey (
    signature_id,
    ref:ref_signature!transcription_acteur_signature_signature_id_fkey ( id, code, label )
  ),

  liens:transcription_acteur_liens!transcription_acteur_liens_acteur_id_fkey (
    id, lien_id, position, cote, fratrie_qualif, cousin_degre, cousin_removal, cousin_double,
    ascend_n, descend_n, cible_type, cible_acteur_id, cible_role, cible_label,
    ref:ref_lien!transcription_acteur_liens_lien_id_fkey ( id, code, label, label_m, label_f, invariable, nature, degre ),
    cible_acteur:transcription_entites_acteurs!transcription_acteur_liens_cible_acteur_id_fkey ( id, nom, prenom, sexe, role )
  ),

  notes:transcription_acteur_notes!transcription_acteur_notes_acteur_id_fkey (
    id, type_code, texte, date_evenement, date_precision,
    bureau_id, registre_id, acte_id, inscription_nature, annee_registre, numero_acte,
    target_kind, target_acte_ac_id, target_acte_ec_id, target_label, position
  )
`;

// Sélection "entité" avec mapping + acteur enrichi
export const ENTITE_WITH_MAPPING_SELECT = `
  id,
  acte_id,
  label,
  categorie_id,
  categorie:transcription_entite_categories!transcription_entites_categorie_id_fkey (
    id, categorie, sous_categorie, code, ordre
  ),
  mapping:transcription_entites_mapping!transcription_entites_mapping_entite_id_fkey (
    cible_type,
    cible_id,
    acteur:transcription_entites_acteurs ( ${ACTEUR_DEEP_SELECT} )
  )
`;
