# Core V0.1 — Matrices de responsabilités et contraintes

**Proposition documentaire, non gelée ; aucune recette exécutée.** Génération : `python spec/validation/generer_core_architecture.py`. Source structurée : `spec/validation/core_architecture_v0_1.json`.

Chaque table nommée du MLD et du catalogue autorisation a un propriétaire unique. Les miroirs historiques générés ont le même propriétaire que leur courant. M14 porte des enregistrements techniques à définir au MPD, pas des tables scientifiques supplémentaires introduites silencieusement.

## Propriétaires de tables

| Table | Module propriétaire | Domaine / nature | Source |
|---|---|---|---|
| `abonnement` | M12 | B / T | docs/05_MLD/GENIIUS_MLD.md : 932 |
| `acquisition_documentaire` | M03 | A / V | docs/05_MLD/GENIIUS_MLD.md : 609 |
| `acquisition_documentaire_objet` | M03 | A / N | docs/05_MLD/GENIIUS_MLD.md : 620 |
| `acquisition_information` | M03 | A / V | docs/05_MLD/GENIIUS_MLD.md : 591 |
| `acquisition_objet` | M03 | A / N | docs/05_MLD/GENIIUS_MLD.md : 604 |
| `acte_evaluation` | M06 | H / F | docs/05_MLD/GENIIUS_MLD.md : 1835 |
| `acte_moderation` | M06 | H / N | docs/05_MLD/GENIIUS_MLD.md : 1912 |
| `acteur_geniius` | M01 | B / V | docs/05_MLD/GENIIUS_MLD.md : 711 |
| `activite` | M03 | A / N | docs/05_MLD/GENIIUS_MLD.md : 417 |
| `activite_connect` | M09 | M / V | docs/05_MLD/GENIIUS_MLD.md : 2657 |
| `activite_connect_objet` | M09 | M / A:activite_connect | docs/05_MLD/GENIIUS_MLD.md : 2665 |
| `activite_entree` | M03 | A / N | docs/05_MLD/GENIIUS_MLD.md : 459 |
| `activite_methode` | M03 | A / N | docs/05_MLD/GENIIUS_MLD.md : 467 |
| `activite_perimetre_transmis` | M03 | A / N | docs/05_MLD/GENIIUS_MLD.md : 445 |
| `activite_referentiel` | M03 | A / N | docs/05_MLD/GENIIUS_MLD.md : 451 |
| `alignement_reproduction` | M05 | C / A:vue | docs/05_MLD/GENIIUS_MLD.md : 1256 |
| `annotation` | M05 | D / V | docs/05_MLD/GENIIUS_MLD.md : 1365 |
| `annotation_ancrage` | M05 | D / A:annotation | docs/05_MLD/GENIIUS_MLD.md : 1373 |
| `anomalie_documentaire` | M05 | I / V | docs/05_MLD/GENIIUS_MLD.md : 2014 |
| `anomalie_explication` | M05 | I / A:anomalie_documentaire | docs/05_MLD/GENIIUS_MLD.md : 2024 |
| `appartenance_espace` | M02 | B / A:espace | docs/05_MLD/GENIIUS_MLD.md : 758 |
| `application_protocole` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2415 |
| `arbre` | M08 | L / V | docs/05_MLD/GENIIUS_MLD.md : 2531 |
| `arbre_lien` | M08 | L / A:arbre | docs/05_MLD/GENIIUS_MLD.md : 2549 |
| `argument` | M06 | H / V | docs/05_MLD/GENIIUS_MLD.md : 1850 |
| `argument_acte` | M06 | H / N | docs/05_MLD/GENIIUS_MLD.md : 1866 |
| `argument_preuve` | M06 | H / A:argument | docs/05_MLD/GENIIUS_MLD.md : 1858 |
| `assertion` | M06 | G / V | docs/05_MLD/GENIIUS_MLD.md : 1623 |
| `assertion_mention` | M06 | G / A:assertion | docs/05_MLD/GENIIUS_MLD.md : 1703 |
| `assertion_presence` | M06 | G / V | docs/05_MLD/GENIIUS_MLD.md : 1677 |
| `assertion_relation` | M06 | G / V | docs/05_MLD/GENIIUS_MLD.md : 1669 |
| `assertion_reponse` | M06 | G / A:assertion | docs/05_MLD/GENIIUS_MLD.md : 1710 |
| `assertion_situation` | M06 | G / V | docs/05_MLD/GENIIUS_MLD.md : 1681 |
| `assertion_source_externe` | M06 | G / A:assertion | docs/05_MLD/GENIIUS_MLD.md : 1716 |
| `assertion_zone` | M06 | G / A:assertion | docs/05_MLD/GENIIUS_MLD.md : 1695 |
| `attribution_role` | M02 | B / A:espace | docs/05_MLD/GENIIUS_MLD.md : 774 |
| `autorisation_accord_gardien` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_acte` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_action` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_admission` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_admission_differee` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_admission_exclusion` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_admission_fondement` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_agrement` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_approbation` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_beneficiaire` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_consentement_action` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_consentement_reintegration` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_contestation` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_deces` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_decision` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_decision_fondement` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_derogation` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_derogation_cible` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_derogation_predecesseur` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_designation_garde` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_dossier_espace` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_dossier_objet` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_engagement_action` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_engagement_fondement` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_engagement_objet` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_engagement_personne` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_epoque` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_evenement` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_exclusion` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_exclusion_personne` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_finalite` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_finalite_version` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_fondateur` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_fondement` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_habilitation` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_identite` | M01 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_interet` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_membre_autorite` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_membre_groupe` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_nomination_admin` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_passage_orphelin` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_perimetre` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_perimetre_objet` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_presentation` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_propriete` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_protection` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_protection_action` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_protection_ensemble` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_protection_personne` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_reemission` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_reemission_action` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_reemission_admission` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_subordination` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_succession` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_titularite` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_transfert` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_transfert_engagement` | M02 | B / N | spec/validation/schema_autorisations.json |
| `autorisation_transfert_objet` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `autorisation_verrou_reintegration` | M02 | B / HS | spec/validation/schema_autorisations.json |
| `badge` | M06 | H / V | docs/05_MLD/GENIIUS_MLD.md : 1942 |
| `base_justificative` | M03 | A / V | docs/05_MLD/GENIIUS_MLD.md : 572 |
| `base_justificative_preuve` | M03 | A / A:base_justificative | docs/05_MLD/GENIIUS_MLD.md : 584 |
| `bien` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1484 |
| `blocage` | M01 | B / T | docs/05_MLD/GENIIUS_MLD.md : 984 |
| `calcul` | M07 | O / F | docs/05_MLD/GENIIUS_MLD.md : 2811 |
| `calcul_referentiel` | M07 | O / N | docs/05_MLD/GENIIUS_MLD.md : 2832 |
| `campagne_memoire` | M09 | J / V | docs/05_MLD/GENIIUS_MLD.md : 2112 |
| `campagne_personne` | M09 | J / A:campagne_memoire | docs/05_MLD/GENIIUS_MLD.md : 2119 |
| `campagne_question` | M09 | J / A:campagne_memoire | docs/05_MLD/GENIIUS_MLD.md : 2128 |
| `candidature` | M06 | F / V | docs/05_MLD/GENIIUS_MLD.md : 1569 |
| `capsule` | M09 | J / V | docs/05_MLD/GENIIUS_MLD.md : 2135 |
| `capsule_contenu` | M09 | J / A:capsule | docs/05_MLD/GENIIUS_MLD.md : 2149 |
| `carte` | M10 | N / V | docs/05_MLD/GENIIUS_MLD.md : 2720 |
| `carte_couche` | M10 | N / A:carte | docs/05_MLD/GENIIUS_MLD.md : 2728 |
| `carte_geometrie` | M10 | N / A:carte | docs/05_MLD/GENIIUS_MLD.md : 2741 |
| `carte_objet` | M10 | N / A:carte | docs/05_MLD/GENIIUS_MLD.md : 2734 |
| `citation` | M11 | P / A:objet | docs/05_MLD/GENIIUS_MLD.md : 2957 |
| `citation_documentaire` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1283 |
| `citation_documentaire_zone` | M05 | C / A:citation_documentaire | docs/05_MLD/GENIIUS_MLD.md : 1292 |
| `classement_unite` | M05 | C / A:unite_archivistique | docs/05_MLD/GENIIUS_MLD.md : 1094 |
| `classification` | M02 | B / T | docs/05_MLD/GENIIUS_MLD.md : 842 |
| `cle_import` | M11 | P / N | docs/05_MLD/GENIIUS_MLD.md : 3033 |
| `cohorte_analytique` | M07 | O / V | docs/05_MLD/GENIIUS_MLD.md : 2779 |
| `collectif_historique` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1476 |
| `collection` | M07 | Q / V | docs/05_MLD/GENIIUS_MLD.md : 3085 |
| `collection_objet` | M07 | Q / A:collection | docs/05_MLD/GENIIUS_MLD.md : 3090 |
| `communaute` | M02 | B / V | docs/05_MLD/GENIIUS_MLD.md : 676 |
| `comparaison` | M08 | L / V | docs/05_MLD/GENIIUS_MLD.md : 2624 |
| `composition_documentaire` | M05 | C / A:objet | docs/05_MLD/GENIIUS_MLD.md : 1114 |
| `compte` | M01 | B / T | docs/05_MLD/GENIIUS_MLD.md : 692 |
| `compte_categorie_sollicitation` | M01 | B / T | docs/05_MLD/GENIIUS_MLD.md : 705 |
| `concept` | M04 | R / V | docs/05_MLD/GENIIUS_MLD.md : 3177 |
| `concept_libelle` | M04 | R / A:concept | docs/05_MLD/GENIIUS_MLD.md : 3194 |
| `concept_predicat` | M04 | R / V | docs/05_MLD/GENIIUS_MLD.md : 3204 |
| `concept_predicat_cible` | M04 | R / A:concept | docs/05_MLD/GENIIUS_MLD.md : 3219 |
| `concept_predicat_sujet` | M04 | R / A:concept | docs/05_MLD/GENIIUS_MLD.md : 3213 |
| `condition_pratique` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2367 |
| `conflit_edition` | M06 | H / V | docs/05_MLD/GENIIUS_MLD.md : 1883 |
| `conflit_proposition` | M06 | H / N | docs/05_MLD/GENIIUS_MLD.md : 1891 |
| `consentement` | M02 | B / V | docs/05_MLD/GENIIUS_MLD.md : 869 |
| `contact` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2377 |
| `contexte_evaluation` | M02 | B / N | spec/validation/schema_autorisations.json |
| `contribution_connect` | M09 | M / V | docs/05_MLD/GENIIUS_MLD.md : 2680 |
| `contribution_differee` | M13 | B / V | docs/05_MLD/GENIIUS_MLD.md : 1017 |
| `contribution_objet` | M09 | M / N | docs/05_MLD/GENIIUS_MLD.md : 2687 |
| `corpus` | M07 | O / V | docs/05_MLD/GENIIUS_MLD.md : 2759 |
| `corpus_inclusion` | M07 | O / A:corpus | docs/05_MLD/GENIIUS_MLD.md : 2768 |
| `correction_publication` | M11 | P / F | docs/05_MLD/GENIIUS_MLD.md : 2946 |
| `correspondance` | M04 | R / V | docs/05_MLD/GENIIUS_MLD.md : 3241 |
| `credit` | M06 | H / L | docs/05_MLD/GENIIUS_MLD.md : 1925 |
| `critere_protocole` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2406 |
| `decision_applicabilite_droit` | M02 | B / V | docs/05_MLD/GENIIUS_MLD.md : 797 |
| `decision_editoriale` | M11 | P / F | docs/05_MLD/GENIIUS_MLD.md : 2898 |
| `decision_rattachement` | M07 | K / N | docs/05_MLD/GENIIUS_MLD.md : 2188 |
| `declaration_profil` | M06 | H / V | docs/05_MLD/GENIIUS_MLD.md : 1952 |
| `decouverte` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2510 |
| `decouverte_version` | M07 | K / N | docs/05_MLD/GENIIUS_MLD.md : 2518 |
| `demande` | M06 | H / V | docs/05_MLD/GENIIUS_MLD.md : 1960 |
| `dependance` | M03 | A / L | docs/05_MLD/GENIIUS_MLD.md : 500 |
| `designation_garde` | M02 | B / V | docs/05_MLD/GENIIUS_MLD.md : 896 |
| `diff_connaissance` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2497 |
| `diffusion` | M11 | P / F | docs/05_MLD/GENIIUS_MLD.md : 2915 |
| `discussion` | M06 | H / V | docs/05_MLD/GENIIUS_MLD.md : 1897 |
| `document` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1058 |
| `document_langue` | M05 | C / A:document | docs/05_MLD/GENIIUS_MLD.md : 1071 |
| `domaine_expertise` | M06 | H / T | docs/05_MLD/GENIIUS_MLD.md : 1934 |
| `ecart` | M08 | L / V | docs/05_MLD/GENIIUS_MLD.md : 2633 |
| `echange` | M09 | J / V | docs/05_MLD/GENIIUS_MLD.md : 2064 |
| `echange_zone` | M09 | J / A:echange | docs/05_MLD/GENIIUS_MLD.md : 2074 |
| `element_appui` | M05 | I / A:element_reconstruit | docs/05_MLD/GENIIUS_MLD.md : 2005 |
| `element_reconstruit` | M05 | I / V | docs/05_MLD/GENIIUS_MLD.md : 1993 |
| `emplacement` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1298 |
| `entite_historique` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1441 |
| `epingle` | M07 | Q / A:workspace | docs/05_MLD/GENIIUS_MLD.md : 3067 |
| `erreur_propagee` | M06 | G / V | docs/05_MLD/GENIIUS_MLD.md : 1806 |
| `erreur_reprise` | M06 | G / A:erreur_propagee | docs/05_MLD/GENIIUS_MLD.md : 1812 |
| `espace` | M02 | B / V | docs/05_MLD/GENIIUS_MLD.md : 659 |
| `espace_organisation` | M02 | B / V | docs/05_MLD/GENIIUS_MLD.md : 681 |
| `etape_voyage` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1502 |
| `etat_critere` | M07 | K / A:application_protocole | docs/05_MLD/GENIIUS_MLD.md : 2427 |
| `etat_reference_externe` | M03 | A / N | docs/05_MLD/GENIIUS_MLD.md : 556 |
| `etudier` | M07 | K / L | docs/05_MLD/GENIIUS_MLD.md : 2197 |
| `evaluation_diffusabilite` | M02 | B / V | docs/05_MLD/GENIIUS_MLD.md : 812 |
| `evenement` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1492 |
| `evenement_connect` | M09 | M / V | docs/05_MLD/GENIIUS_MLD.md : 2647 |
| `exemplaire` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1077 |
| `export` | M11 | P / F | docs/05_MLD/GENIIUS_MLD.md : 2966 |
| `export_dependance_externe` | M11 | P / N | docs/05_MLD/GENIIUS_MLD.md : 2999 |
| `export_element` | M11 | P / N | docs/05_MLD/GENIIUS_MLD.md : 2986 |
| `export_exclusion` | M11 | P / N | docs/05_MLD/GENIIUS_MLD.md : 3004 |
| `export_referentiel` | M11 | P / N | docs/05_MLD/GENIIUS_MLD.md : 2978 |
| `expression_assertion` | M06 | G / V | docs/05_MLD/GENIIUS_MLD.md : 1728 |
| `expression_segment` | M06 | G / A:expression_assertion | docs/05_MLD/GENIIUS_MLD.md : 1738 |
| `famille` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1472 |
| `fichier` | M05 | C / T | docs/05_MLD/GENIIUS_MLD.md : 1191 |
| `filiation` | M03 | A / L | docs/05_MLD/GENIIUS_MLD.md : 525 |
| `financement` | M12 | B / V | docs/05_MLD/GENIIUS_MLD.md : 921 |
| `fonction` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1468 |
| `geometrie` | M10 | N / V | docs/05_MLD/GENIIUS_MLD.md : 2699 |
| `geometrie_assertion` | M10 | N / A:geometrie | docs/05_MLD/GENIIUS_MLD.md : 2714 |
| `groupe` | M02 | B / V | docs/05_MLD/GENIIUS_MLD.md : 745 |
| `historique_navigation` | M07 | Q / T | docs/05_MLD/GENIIUS_MLD.md : 3129 |
| `identifiant_documentaire` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1135 |
| `identifiant_externe` | M03 | A / A:objet | docs/05_MLD/GENIIUS_MLD.md : 640 |
| `import` | M11 | P / F | docs/05_MLD/GENIIUS_MLD.md : 3017 |
| `inbox_item` | M07 | Q / V | docs/05_MLD/GENIIUS_MLD.md : 3108 |
| `inbox_rattachement` | M07 | Q / A:inbox_item | docs/05_MLD/GENIIUS_MLD.md : 3118 |
| `indice` | M09 | J / V | docs/05_MLD/GENIIUS_MLD.md : 2095 |
| `interaction` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2386 |
| `interpretation` | M06 | G / V | docs/05_MLD/GENIIUS_MLD.md : 1745 |
| `interpretation_appui` | M06 | G / A:interpretation | docs/05_MLD/GENIIUS_MLD.md : 1771 |
| `interpretation_entite` | M06 | G / A:interpretation | docs/05_MLD/GENIIUS_MLD.md : 1779 |
| `interpretation_question` | M06 | G / A:interpretation | docs/05_MLD/GENIIUS_MLD.md : 1785 |
| `intervention_mission` | M07 | K / A:mission | docs/05_MLD/GENIIUS_MLD.md : 2322 |
| `intervention_perimetre` | M07 | K / A:mission | docs/05_MLD/GENIIUS_MLD.md : 2335 |
| `item_mission` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2310 |
| `lacune` | M06 | G / V | docs/05_MLD/GENIIUS_MLD.md : 1791 |
| `lacune_recherche` | M06 | G / A:lacune | docs/05_MLD/GENIIUS_MLD.md : 1800 |
| `licence` | M02 | B / T | docs/05_MLD/GENIIUS_MLD.md : 831 |
| `lien` | M03 | A / L | docs/05_MLD/GENIIUS_MLD.md : 479 |
| `lien_compte_acteur` | M01 | B / T | docs/05_MLD/GENIIUS_MLD.md : 726 |
| `lien_compte_personne` | M01 | B / V | docs/05_MLD/GENIIUS_MLD.md : 735 |
| `lien_exploratoire` | M07 | Q / V | docs/05_MLD/GENIIUS_MLD.md : 3077 |
| `lien_interet` | M02 | B / V | docs/05_MLD/GENIIUS_MLD.md : 910 |
| `lien_version` | M03 | A / N | docs/05_MLD/GENIIUS_MLD.md : 491 |
| `lieu` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1459 |
| `lignee_import` | M11 | P / T | docs/05_MLD/GENIIUS_MLD.md : 3011 |
| `localisation_en_ligne` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1149 |
| `localisation_exemplaire` | M05 | C / A:exemplaire | docs/05_MLD/GENIIUS_MLD.md : 1105 |
| `masquage` | M02 | B / V | docs/05_MLD/GENIIUS_MLD.md : 853 |
| `membre_groupe` | M02 | B / A:groupe | docs/05_MLD/GENIIUS_MLD.md : 750 |
| `mention` | M05 | D / V | docs/05_MLD/GENIIUS_MLD.md : 1383 |
| `mention_ancrage` | M05 | D / A:mention | docs/05_MLD/GENIIUS_MLD.md : 1394 |
| `mention_regroupement` | M05 | D / A:regroupement_traces | docs/05_MLD/GENIIUS_MLD.md : 1411 |
| `message` | M06 | H / N | docs/05_MLD/GENIIUS_MLD.md : 1903 |
| `methode` | M07 | O / V | docs/05_MLD/GENIIUS_MLD.md : 2787 |
| `micro_mission` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2359 |
| `mission` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2298 |
| `noeud_arbre` | M08 | L / V | docs/05_MLD/GENIIUS_MLD.md : 2540 |
| `norme` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1488 |
| `note` | M07 | Q / V | docs/05_MLD/GENIIUS_MLD.md : 3124 |
| `notification` | M07 | Q / T | docs/05_MLD/GENIIUS_MLD.md : 3153 |
| `objet` | M03 | A / V | docs/05_MLD/GENIIUS_MLD.md : 354 |
| `objet_classification` | M02 | B / A:objet | docs/05_MLD/GENIIUS_MLD.md : 846 |
| `objet_materiel` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1465 |
| `occupation_emplacement` | M05 | C / A:emplacement | docs/05_MLD/GENIIUS_MLD.md : 1305 |
| `offre_categorie` | M07 | K / A:offre_deplacement | docs/05_MLD/GENIIUS_MLD.md : 2353 |
| `offre_deplacement` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2345 |
| `operation_flux` | M08 | L / V | docs/05_MLD/GENIIUS_MLD.md : 2556 |
| `organisation` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1464 |
| `page` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1162 |
| `paraitre_dans` | M11 | P / A:publication | docs/05_MLD/GENIIUS_MLD.md : 2885 |
| `participation_connect` | M09 | M / V | docs/05_MLD/GENIIUS_MLD.md : 2671 |
| `parution_acceptation` | M11 | P / N | docs/05_MLD/GENIIUS_MLD.md : 2875 |
| `personne` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1449 |
| `phenomene` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1466 |
| `piste` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2247 |
| `piste_cible` | M07 | K / A:piste | docs/05_MLD/GENIIUS_MLD.md : 2260 |
| `position` | M06 | F / V | docs/05_MLD/GENIIUS_MLD.md : 1552 |
| `position_epistemique` | M06 | F / V | docs/05_MLD/GENIIUS_MLD.md : 1604 |
| `position_relationnelle` | M06 | F / V | docs/05_MLD/GENIIUS_MLD.md : 1559 |
| `prescription` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1313 |
| `prise_en_charge` | M12 | B / V | docs/05_MLD/GENIIUS_MLD.md : 944 |
| `prise_en_charge_acceptation` | M12 | B / N | docs/05_MLD/GENIIUS_MLD.md : 973 |
| `prise_en_charge_ressource` | M12 | B / A:prise_en_charge | docs/05_MLD/GENIIUS_MLD.md : 965 |
| `projet` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2163 |
| `proposition_identification` | M06 | F / V | docs/05_MLD/GENIIUS_MLD.md : 1539 |
| `proposition_modification` | M06 | H / V | docs/05_MLD/GENIIUS_MLD.md : 1871 |
| `protocole` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2400 |
| `pseudonyme_reserve` | M01 | B / T | docs/05_MLD/GENIIUS_MLD.md : 721 |
| `publication` | M11 | P / V | docs/05_MLD/GENIIUS_MLD.md : 2858 |
| `publication_exposition` | M11 | P / N | docs/05_MLD/GENIIUS_MLD.md : 2936 |
| `question` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2229 |
| `question_objet` | M07 | K / A:question | docs/05_MLD/GENIIUS_MLD.md : 2241 |
| `rapprochement` | M06 | F / V | docs/05_MLD/GENIIUS_MLD.md : 1580 |
| `reception_differee` | M13 | B / T | docs/05_MLD/GENIIUS_MLD.md : 999 |
| `recherche_effectuee` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2268 |
| `recherche_perimetre` | M07 | K / A:recherche_effectuee | docs/05_MLD/GENIIUS_MLD.md : 2285 |
| `recit` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1517 |
| `recit_assertion` | M06 | E / A:recit | docs/05_MLD/GENIIUS_MLD.md : 1525 |
| `reconciliation_import` | M11 | P / V | docs/05_MLD/GENIIUS_MLD.md : 3041 |
| `reconstruction` | M05 | I / V | docs/05_MLD/GENIIUS_MLD.md : 1979 |
| `reconstruction_concurrence` | M05 | I / N | docs/05_MLD/GENIIUS_MLD.md : 1986 |
| `reference_inter_espace` | M03 | A / L | docs/05_MLD/GENIIUS_MLD.md : 545 |
| `reference_persistante` | M03 | A / V | docs/05_MLD/GENIIUS_MLD.md : 628 |
| `referentiel` | M04 | R / V | docs/05_MLD/GENIIUS_MLD.md : 3169 |
| `regle_contexte` | M07 | K / A:regle_methodologique | docs/05_MLD/GENIIUS_MLD.md : 2445 |
| `regle_methodologique` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2436 |
| `regroupement_traces` | M05 | D / V | docs/05_MLD/GENIIUS_MLD.md : 1404 |
| `relance` | M09 | J / V | docs/05_MLD/GENIIUS_MLD.md : 2105 |
| `relation_projets` | M07 | K / L | docs/05_MLD/GENIIUS_MLD.md : 2172 |
| `reponse` | M09 | J / V | docs/05_MLD/GENIIUS_MLD.md : 2080 |
| `reproduction` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1176 |
| `reproduction_fichier` | M05 | C / A:reproduction | docs/05_MLD/GENIIUS_MLD.md : 1211 |
| `requete` | M07 | O / V | docs/05_MLD/GENIIUS_MLD.md : 2753 |
| `responsabilite` | M05 | C / L | docs/05_MLD/GENIIUS_MLD.md : 1272 |
| `resultat` | M07 | O / V | docs/05_MLD/GENIIUS_MLD.md : 2839 |
| `segment` | M05 | D / V | docs/05_MLD/GENIIUS_MLD.md : 1349 |
| `segment_zone` | M05 | D / A:segment | docs/05_MLD/GENIIUS_MLD.md : 1359 |
| `selection_contexte` | M06 | F / V | docs/05_MLD/GENIIUS_MLD.md : 1593 |
| `selection_exclusion` | M08 | L / A:selection_partage | docs/05_MLD/GENIIUS_MLD.md : 2602 |
| `selection_inclusion` | M08 | L / N | docs/05_MLD/GENIIUS_MLD.md : 2608 |
| `selection_partage` | M08 | L / V | docs/05_MLD/GENIIUS_MLD.md : 2574 |
| `session_memoire` | M09 | J / V | docs/05_MLD/GENIIUS_MLD.md : 2036 |
| `session_present` | M09 | J / A:session_memoire | docs/05_MLD/GENIIUS_MLD.md : 2057 |
| `session_temoin` | M09 | J / A:session_memoire | docs/05_MLD/GENIIUS_MLD.md : 2051 |
| `snapshot` | M07 | K / F | docs/05_MLD/GENIIUS_MLD.md : 2490 |
| `source_externe_declaree` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1321 |
| `tache` | M07 | K / V | docs/05_MLD/GENIIUS_MLD.md : 2451 |
| `tache_assignation` | M07 | K / A:tache | docs/05_MLD/GENIIUS_MLD.md : 2465 |
| `tache_dependance` | M07 | K / A:tache | docs/05_MLD/GENIIUS_MLD.md : 2475 |
| `tache_objet` | M07 | K / A:tache | docs/05_MLD/GENIIUS_MLD.md : 2483 |
| `tag` | M07 | Q / V | docs/05_MLD/GENIIUS_MLD.md : 3097 |
| `tag_objet` | M07 | Q / A:tag | docs/05_MLD/GENIIUS_MLD.md : 3102 |
| `terme_historique` | M04 | R / V | docs/05_MLD/GENIIUS_MLD.md : 3225 |
| `tradition` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1513 |
| `transcription` | M05 | D / V | docs/05_MLD/GENIIUS_MLD.md : 1335 |
| `transmission` | M06 | G / V | docs/05_MLD/GENIIUS_MLD.md : 1819 |
| `unite_archivistique` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1085 |
| `usage_terme` | M04 | R / A:terme_historique | docs/05_MLD/GENIIUS_MLD.md : 3231 |
| `utiliser` | M07 | K / L | docs/05_MLD/GENIIUS_MLD.md : 2212 |
| `utiliser_role` | M07 | K / A:utiliser | docs/05_MLD/GENIIUS_MLD.md : 2220 |
| `veille` | M07 | Q / V | docs/05_MLD/GENIIUS_MLD.md : 3136 |
| `version_composant` | M03 | A / N | docs/05_MLD/GENIIUS_MLD.md : 408 |
| `version_objet` | M03 | A / N | docs/05_MLD/GENIIUS_MLD.md : 387 |
| `volonte_numerique` | M02 | B / V | docs/05_MLD/GENIIUS_MLD.md : 884 |
| `voyage` | M06 | E / V | docs/05_MLD/GENIIUS_MLD.md : 1499 |
| `vue` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1219 |
| `vue_page` | M05 | C / A:vue | docs/05_MLD/GENIIUS_MLD.md : 1231 |
| `workspace` | M07 | Q / V | docs/05_MLD/GENIIUS_MLD.md : 3059 |
| `zone` | M05 | C / V | docs/05_MLD/GENIIUS_MLD.md : 1237 |

## CP → module → transaction → vérification

Le responsable porte le contrat de validation ; les propriétaires des tables concernées exécutent leurs règles dans la même unité de travail. Un CP transversal n’est pas supposé local à la seule table du responsable. Les scénarios C01–C13 du dossier complètent cette matrice ; la preuve de chaque CP reste exigée.

| CP | Responsable | Transactions principales | Vérification |
|---|---|---|---|
| CP-01 | M03 | T02 | ARCH-CP-01 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-02 | M03 | T02 | ARCH-CP-02 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-03 | M03 | T02 | ARCH-CP-03 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-04 | M03 | T02 | ARCH-CP-04 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-05 | M03 | T02 | ARCH-CP-05 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-06 | M02 | T01, T03, T11, T17 | ARCH-CP-06 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-07 | M06 | T02 | ARCH-CP-07 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-08 | M04 | T02 | ARCH-CP-08 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-09 | M03 | T02 | ARCH-CP-09 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-10 | M03 | T02 | ARCH-CP-10 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-11 | M02 | T02 | ARCH-CP-11 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-12 | M02 | T02 | ARCH-CP-12 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-13 | M03 | T02 | ARCH-CP-13 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-14 | M03 | T02 | ARCH-CP-14 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-15 | M03 | T02 | ARCH-CP-15 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-16 | M03 | T14, T16 | ARCH-CP-16 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-17 | M03 | T02 | ARCH-CP-17 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-18 | M03 | T02 | ARCH-CP-18 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-19 | M05 | T02 | ARCH-CP-19 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-20 | M07 | T04 | ARCH-CP-20 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-21 | M03 | T02, T11, T12 | ARCH-CP-21 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-22 | M03 | T02 | ARCH-CP-22 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-23 | M02 | T01, T02, T05 | ARCH-CP-23 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-24 | M02 | T03, T06 | ARCH-CP-24 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-25 | M02 | T01, T03, T06 | ARCH-CP-25 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-26 | M02 | T02 | ARCH-CP-26 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-27 | M13 | T08, T09 | ARCH-CP-27 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-28 | M13 | T03, T08, T09 | ARCH-CP-28 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-29 | M02 | T03, T05 | ARCH-CP-29 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-30 | M02 | T03, T04 | ARCH-CP-30 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-31 | M07 | T04 | ARCH-CP-31 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-32 | M07 | T04 | ARCH-CP-32 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-33 | M08 | T05 | ARCH-CP-33 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-34 | M07 | T12 | ARCH-CP-34 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-35 | M11 | T07 | ARCH-CP-35 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-36 | M12 | T13 | ARCH-CP-36 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-37 | M02 | T06 | ARCH-CP-37 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-38 | M07 | T04 | ARCH-CP-38 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-39 | M12 | T13 | ARCH-CP-39 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-40 | M02 | T03 | ARCH-CP-40 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-41 | M05 | T10, T12 | ARCH-CP-41 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-42 | M02 | T12 | ARCH-CP-42 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-43 | M03 | T14, T16 | ARCH-CP-43 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-44 | M03 | T02, T03 | ARCH-CP-44 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-45 | M06 | T02, T05, T07 | ARCH-CP-45 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-46 | M02 | T03, T05, T06 | ARCH-CP-46 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-47 | M02 | T03, T11 | ARCH-CP-47 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-48 | M02 | T03 | ARCH-CP-48 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-49 | M03 | T02, T05 | ARCH-CP-49 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-50 | M02 | T02, T05, T09 | ARCH-CP-50 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-51 | M02 | T05 | ARCH-CP-51 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-52 | M03 | T02, T14 | ARCH-CP-52 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |
| CP-53 | M03 | T02, T12 | ARCH-CP-53 : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel |

## Soixante obligations détaillées CP-13

| Obligation | Responsable spécialisé | Énoncé amont conservé |
|---|---|---|
| CP-13/DI-A28 | M03 | Une base de portée `publique` n'invoque que des éléments diffusables publiquement (sinon : `EVALUATION_DIFFUSABILITE` « provenance masquée » ou « existence seulement »). |
| CP-13/DI-A32 | M03 | Une donnée importée sans source reste `etat_provenance = non sourcée` ou `provenance perdue à l'import` (RG-L04). |
| CP-13/DI-A33 | M03 | Une acquisition documentaire ne crée ni ne modifie `DOCUMENT.statut_existence` ni la `RESPONSABILITE` historique. |
| CP-13/DI-B15 | M02 | Le dérivé a une dépendance (production ou justification) vers l'objet restreint. |
| CP-13/DI-B16 | M02 | Absence de décision = la restriction s'applique (prudence par défaut). |
| CP-13/DI-B22 | M02 | `anonymisation` n'est admis que si aucun chemin accessible publiquement ne relie la version publique à l'original (RG-B07) ; sinon, `pseudonymisation`. |
| CP-13/DI-B25 | M02 | `portee = biométrie` d'une personne vivante : `decision = accordé` exigé avant tout traitement (CDCF § 33.2). |
| CP-13/DI-C01 | M05 | `statut_existence = prescrit seulement` ne passe à `existence attestée` que par une `ASSERTION` d'existence documentaire ancrée sur une trace (RG-C05). |
| CP-13/DI-C02 | M05 | Un document peut n'avoir aucun `EXEMPLAIRE` (RG-C04) ; s'il a un exemplaire conservé, `statut_existence` ∈ {conservé et localisé, non localisé, inaccessible, lacunaire}. |
| CP-13/DI-C03 | M05 | Une `ANOMALIE_DOCUMENTAIRE` ne modifie jamais `statut_existence` (RG-I04). |
| CP-13/DI-C04 | M05 | `nature = témoignage` ⇔ le document est produit par une `SESSION_MEMOIRE`. |
| CP-13/DI-C07 | M05 | Un ordre `historique reconstruit` est une hypothèse : il doit être relié à une `INTERPRETATION`. |
| CP-13/DI-C12 | M05 | Les ancrages d'une reproduction ne sont pas réutilisés sur une autre sans `ALIGNEMENT_REPRODUCTION` † (MCD § 5.5). |
| CP-13/DI-C14 | M05 | La géométrie est contenue dans les dimensions de la vue (image) ou sa durée (piste). |
| CP-13/DI-C19 | M05 | Une source externe déclarée ne crée jamais automatiquement un `DOCUMENT` (test 16). |
| CP-13/DI-C21 | M05 | Une assertion fondée sur une source externe déclarée non identifiée garde `etat_provenance` ≠ `sourcée`. |
| CP-13/DI-D03 | M05 | `statut = achevée selon protocole` exige une `APPLICATION_PROTOCOLE` accomplie sur le document. |
| CP-13/DI-D06 | M05 | Une mention ne crée jamais automatiquement de `PERSONNE` (RG-D05). |
| CP-13/DI-E02 | M06 | Aucun nom, date, lieu, arbre ni descendant n'est exigé (RG-E02) ; dans le Core partagé, création soumise à DD-04 (une trace + `note_individualisation`). |
| CP-13/DI-E08 | M06 | `statut = attestée` ⇒ au moins une assertion ancrée sur l'étape. |
| CP-13/DI-E09 | M06 | Deux présences attestées ne créent ni voyage ni étape (RG-E07). |
| CP-13/DI-F03 | M06 | `plausibilite = forte` exige au moins un `ARGUMENT` `pour` (RG-F06) ; un nom rare, une similarité visuelle ou vocale ne suffisent jamais seuls. |
| CP-13/DI-F06 | M06 | Une position ne devient jamais une `PERSONNE` par transformation : on retient un candidat existant, ou l'on crée une personne qui devient candidate. |
| CP-13/DI-F09 | M06 | Les deux entités sont distinctes et de même spécialisation. |
| CP-13/DI-F10 | M06 | `presentation_fusionnee = vrai` exige `verdict = même entité` et `statut_validation` ∈ {validée, confirmée} ; elle n'agit que sur l'affichage et ne supprime aucun identifiant (RG-F04). |
| CP-13/DI-F11 | M06 | Un verdict `entités distinctes` est opposable : une nouvelle proposition contraire doit le citer en `ARGUMENT` (RG-F05). |
| CP-13/DI-G04 | M06 | Une assertion de `modalite = déclarée par un tiers dans la source` porte une `RESPONSABILITE` de rôle `déclarant` ou `informateur` (RG-G07). |
| CP-13/DI-G05 | M06 | `polarite = négative` (« explicitement absent ») exige une source (RG-G10) ; elle n'est jamais produite par une recherche négative (RG-K01). |
| CP-13/DI-G07 | M06 | `RELATION` de `famille_relation = causale` ⇒ `statut_causal` obligatoire et au moins une source ou un `ARGUMENT` (RG-G06) ; une cooccurrence calculée ne crée jamais de `RELATION`. |
| CP-13/DI-G08 | M06 | Une `SITUATION` ne couvre une période que si `continuite = continuité attestée` ; trois points attestés ne produisent pas de situation continue (RG-G05, CU-15). |
| CP-13/DI-G10 | M06 | Une traduction ne crée une nouvelle `ASSERTION` que si le sens propositionnel change ; sinon, c'est une nouvelle expression de la même assertion (MCD § 6.5). |
| CP-13/DI-G12 | M06 | Une `CONCLUSION` publiée ou partagée possède une `BASE_JUSTIFICATIVE` en vigueur (MCD § 9.6). |
| CP-13/DI-G15 | M06 | Une `PHASE_TRAJECTOIRE` de `mode = proposée` reste `etat_examen` automatique jusqu'à examen humain. |
| CP-13/DI-G17 | M06 | Un niveau n'est jamais promu sans trace (`exposition possible` ↛ `réception attestée`) (RG-G09). |
| CP-13/DI-H07 | M06 | Acceptée ⇒ une nouvelle version de l'objet cible, produite par une activité qui cite la proposition, et un `CREDIT` `proposant` conservé (RG-H08). |
| CP-13/DI-H09 | M06 | `résolu par fusion compatible` uniquement pour des modifications non sémantiques. |
| CP-13/DI-I01 | M05 | Le document cible a `statut_existence` ≠ `conservé et localisé`, ou `lacunaire` (RG-I01). |
| CP-13/DI-I04 | M05 | Aucun élément n'est créé pour « compléter » une série sans trace : une position inconnue entre deux numéros attestés n'est créée que si elle est explicitement utile, avec `statut_contenu = inconnu` (RG-I02, § 20.4). |
| CP-13/DI-I07 | M05 | Une anomalie ne modifie aucun `statut_existence` (RG-I04, CU-25). |
| CP-13/DI-J02 | M09 | Un enregistrement audio ou une transcription exige un `CONSENTEMENT` de portée correspondante du ou des témoins avant tout usage hors de l'espace (CDCF § 24.16). |
| CP-13/DI-J06 | M09 | `phase = après indice` ⇒ un `INDICE` existe dans le même échange, antérieur à la réponse (RG-J01). |
| CP-13/DI-J12 | M09 | La délivrance ne lève aucun embargo sur le contenu (RG-J06). |
| CP-13/DI-K02 | M07 | `transmis` exige une `DESIGNATION_GARDE` effective de rôle successeur. |
| CP-13/DI-K03 | M07 | `etat = suffisamment traitée selon protocole` exige une `APPLICATION_PROTOCOLE` accomplie sur la question (RG-K02). |
| CP-13/DI-K05 | M07 | `recherchabilite = insolubilité fortement documentée` exige au moins une `RECHERCHE_EFFECTUEE` exhaustive et une justification ; cette valeur doit rester exceptionnelle (CDCF § 25.12). |
| CP-13/DI-K07 | M07 | `source_suggeree` ne crée aucun document ni assertion d'existence (RG-K06). |
| CP-13/DI-K10 | M07 | `resultat = négatif` ne produit jamais d'assertion négative ni de lacune « explicitement absent » ; au mieux une `LACUNE` « recherche exhaustive sans résultat » si `niveau_consultation = consultation exhaustive` (RG-K01, critère 19). |
| CP-13/DI-K16 | M07 | `statut = accompli selon protocole` exige que chaque critère de la version appliquée soit `accompli` ou `non applicable` (ETAT_CRITERE). |
| CP-13/DI-K19 | M07 | Une règle de portée `main/scribe`, `registre` ou `corpus` est reliée à l'objet correspondant. |
| CP-13/DI-M01 | M09 | Une contribution ne sort de l'espace de l'événement qu'avec un `CONSENTEMENT` de portée adaptée ; la contribution au Core exige une `OPERATION_FLUX` séparée (RG-M01). |
| CP-13/DI-N01 | M10 | Une géométrie n'est jamais plus précise que ses fondements : `exacte` exige une source cartographique ou un relevé ancré ; un lieu connu seulement par relations ne peut avoir que `relative` ou `zone possible` (RG-N01, critère 12). |
| CP-13/DI-N03 | M10 | Une géométrie reconstruite est produite par un `CALCUL` (RECONSTRUIRE_GEOM) et fondée sur des assertions (FONDEE_SUR). |
| CP-13/DI-N05 | M10 | Une ligne entre deux présences n'est tracée que si une assertion `déplacement attesté` ou `trajet reconstruit` existe, avec une symbolisation distincte (RG-N02). |
| CP-13/DI-O06 | M07 | Une méthode déterministe (filtrer, compter, comparer des dates) ne recourt jamais à une IA générative (RG-O06). |
| CP-13/DI-O07 | M07 | `nature_execution = reproduction` exige mêmes versions de méthode, de corpus, de référentiels et même état de connaissance que le calcul d'origine (REPRODUIRE_CALCUL) ; sinon `rerun` ou `nouvelle analyse` (RG-O02). |
| CP-13/DI-O11 | M07 | Une cooccurrence ou un entourage calculé ne crée jamais de `RELATION` (RG-G06). |
| CP-13/DI-O12 | M07 | Un résultat d'agrégation exposé à une audience plus large que celle du calcul exige une `EVALUATION_DIFFUSABILITE` (DI-B18). |
| CP-13/DI-P01 | M11 | Avant `publiée`, chaque version exposée est vérifiée contre embargos, personnes vivantes et mineurs, consentements, licences par composant et masquages ; le résultat est consigné dans une `EVALUATION_DIFFUSABILITE` par version exposée, dans le `CONTEXTE_EVALUATION` de la publication (RG-P02). |
| CP-13/DI-P03 | M11 | `indexable = vrai` exige que toutes les versions exposées aient `decouvrabilite = indexable Web` (RG-P04). |
| CP-13/DI-P07 | M11 | Un export n'expose aucun attribut `I`. |

**Inventaire :** 14 modules, 327 tables nommées, 53 CP, 60 obligations CP-13, 17 transactions ; présence et attribution documentaire, pas conformité d’une implémentation.
