# Banc de mutations — résultats

**252 mutations détectées sur 260.** Une mutation détectée fait échouer au moins un test (mode `-f` : premier échec).

| Origine | Détectées | Total | Survivantes |
|---|---|---|---|
| Mutations indépendantes du contrôle B (mesure de référence) | 33 | 33 | — |
| Règles nouvelles de la V1.6 (banc de l'auteur) | 64 | 67 | M312, M330, M331 |
| Banc de l'auteur réciblé (M001 à M218) | 155 | 160 | M010, M013, M032, M033, M104 |

| Mutation | Clause | Description | Statut | Premier test en échec |
|---|---|---|---|---|
| M001 | A3 | deleguer : se créer une habilitation | detectee | ControleA.test_a03_prolonger_a_son_profit |
| M002 | A3 | nommer : se nommer | detectee | Attaques.test_a17_6_nommer_son_second_compte |
| M003 | A3, § 9.1 | ajouter_membre : s'ajouter soi-même | detectee | Attaques.test_a17_5_second_compte_dans_le_groupe |
| M004 | A3 | admettre : s'admettre ou admettre l'auteur | detectee | ControleB.test_M013_signataire_jamais_beneficiaire |
| M005 | § 9.4 | admettre : l'auteur peut être admis manuellement | detectee | ControleB.test_M013_signataire_jamais_beneficiaire |
| M006 | G-1 | « soi » = compte, non personne | detectee | Attaques.test_a16_derogation_par_second_compte |
| M007 | G-1 | identité établie non exigée | detectee | S11_V15.test_S_234 |
| M010 | § 9.4 | admission automatique d'un gestionnaire de l'ensemble | SURVIT |  |
| M011 | § 9.4 (G-2) | chaînes croisées : gestionnaires d'autres ensembles non exclus | detectee | Attaques.test_a01_elevation_croisee |
| M012 | § 9.4 (G-2) | admission automatique de l'auteur | detectee | S12_V16.test_S_318 |
| M013 | § 9.4 (G-2) | l'auteur bénéficie de sa propre habilitation à un ensemble | SURVIT |  |
| M014 | § 9.4/§ 10.8 | admission automatique du cédant sous verrou | detectee | S13_Mutations.test_S_277 |
| M015 | § 9.4 | admission automatique après retrait par l'habilitant | detectee | ControleB.test_N08_exclusion_par_personne |
| M016 | § 5.1 (CT-18) | admission automatique dans un espace archivé ou clos | detectee | Attaques.test_a12_admission_automatique_espace_clos |
| M017 | § 10.6 | admission automatique non différée pendant la fenêtre | detectee | ControleB.test_M010_admission_differee |
| M018 | § 9.3 (CM-32) | notification à un tiers | detectee | S03_Ensembles.test_S_95 |
| M019 | § 9.4 (CM-24) | exclusion préventive par retrait d'une admission inexistante | detectee | Attaques.test_a20_2_retrait_preventif |
| M020 | § 9.2 (H-2a) | rôle de son propre espace sans admission (exception V1.5 rétablie) | detectee | S03_Ensembles.test_S_163 |
| M021 | § 9.3 (H-6b) | notification permise sur un périmètre explicite tout exigeant | detectee | S03_Ensembles.test_S_96 |
| M022 | § 9.3 (H-6b) | admission automatique valant sur une cible exigeante | detectee | Attaques.test_a20_5_portee_limitee |
| M023 | § 5.3 | sortie de l'ensemble sans clôture de l'admission | detectee | TransitionsAutres.test_admission |
| M024 | § 5.3 (CM-10) | admetteur d'une HP non revérifié | detectee | S13_Mutations.test_S_278 |
| M025 | § 9.5 | membre d'un groupe bénéficiaire sans agrément | detectee | S06_Protections.test_S_129 |
| M030 | § 10.6 (H-4a) | gel désactivé | detectee | Attaques.test_a17_2_gardien_orphelin_pendant_le_gel |
| M031 | § 10.6 (H-4a) | admission manuelle non gelée | detectee | Combinaisons.test_gel_par_liste |
| M032 | § 10.6 (G-3) | inclusion : actions ou repartager ajoutés ignorés | SURVIT |  |
| M033 | § 10.6 (G-3) | inclusion : échéance, état ou mode élargis ignorés | SURVIT |  |
| M034 | § 10.6 (G-3) | inclusion : engagement nouveau ignoré | detectee | S12_V16.test_S_323 |
| M035 | § 10.6 (G-3) | inclusion : levée de protection ignorée | detectee | ControleA.test_a09_3_autorite_legale_et_presentations |
| M036 | § 10.6 (G-3) | inclusion : périmètre élargi ignoré | detectee | S12_V16.test_S_322 |
| M037 | § 10.7 (G-3) | acceptation sans contrôle d'inclusion | detectee | ControleA.test_a09_3_autorite_legale_et_presentations |
| M038 | § 10.7 | empreinte de la présentation non contrôlée | detectee | TransitionsAutres.test_transfert_empreinte_perimee |
| M039 | § 5.6 | présentation sans expiration | detectee | Attaques.test_a09_presentation_expiree |
| M040 | § 5.6 (CT-16) | présentation expirée relancée par K | detectee | Attaques.test_a09_presentation_expiree |
| M041 | § 5.6 | un autre que le cédant présente | detectee | S04_Transfert.test_S_175 |
| M042 | § 10.5 | présentation malgré un objet sans voie | detectee | S04_Transfert.test_S_39 |
| M043 | § 10.6 | engagements : éléments cachés à K inclus | detectee | Attaques.test_a17_2_gardien_orphelin_pendant_le_gel |
| M050 | § 10.5 (CT-09) | réémission invalide : échec au lieu d'abandon | detectee | Attaques.test_a18_1_reemission_cachee_invalide |
| M051 | § 10.5 | réémission plus large acceptée | detectee | S12_V16.test_S_319 |
| M052 | § 10.5 (CM-14) | admissions reprises non revérifiées | detectee | S13_Mutations.test_S_281 |
| M053 | § 10.5 (CM-14) | admissions annoncées arbitraires | detectee | Attaques.test_a18_3_admissions_arbitraires |
| M054 | § 10.7 | C conserve ses admissions | detectee | S13_Mutations.test_S_282 |
| M055 | § 10.7 | C conserve ses habilitations nominatives sur le contenu | detectee | S04_Transfert.test_S_37 |
| M056 | § 10.7 | C reste gardien et bénéficiaire | detectee | S13_Mutations.test_S_284 |
| M057 | § 10.7 (F-4) | K devient gardien de toutes les protections de C (révélation) | detectee | S04_Transfert.test_S_178 |
| M058 | § 10.8 | verrou de réintégration non posé | detectee | ControleA.test_a09_1_second_compte_du_cedant |
| M059 | § 10.5 (F-4) | voie (b) sur un objet caché à K | detectee | S10_TransfertObjets.test_S_231 |
| M060 | § 10.5 | voie (b) sans acceptation de K | detectee | S10_TransfertObjets.test_S_84 |
| M061 | § 10.5 | copie (c) sans licence ou sous protection | detectee | S10_TransfertObjets.test_S_75 |
| M062 | § 10.4 (CT-29) | désignation de garde ignorée | detectee | S11_V15.test_S_247 |
| M063 | § 2.1 (F-1) | le transfert clôt les HI signées par C | detectee | ClotureV16.test_m033_m330_prolongation_gelee_et_restriction_admise |
| M064 | § 10.4 | transfert par un RS non propriétaire | detectee | S04_Transfert.test_S_118 |
| M070 | § 10.8 | verrou ignoré pour une délégation | detectee | ControleB.test_N21_consentement_par_le_proprietaire |
| M071 | § 10.8 | verrou ignoré pour une nomination | detectee | ControleA.test_a09_1_second_compte_du_cedant |
| M072 | § 10.8 | verrou ignoré pour une admission | detectee | S04_Transfert.test_S_171 |
| M080 | § 12.3 | accord du gardien non exigé à l'octroi | detectee | ControleB.test_N12_copie_herite_des_destinataires |
| M081 | § 12.3 | niveau non recalculé à l'évaluation | detectee | S06_Protections.test_S_189 |
| M082 | § 12.3 | accord d'un gardien qui n'est plus en fonction | detectee | Combinaisons.test_derogation_gardien_change |
| M083 | § 12.3 (F-3) | objet personnel à un approbateur | detectee | S06_Protections.test_S_190 |
| M084 | § 12.3 | donnée sensible à un approbateur | detectee | S06_Protections.test_S_192 |
| M085 | § 12.4 (G-11) | finalité hors liste acceptée | detectee | Attaques.test_a19_5_replique_par_derogation |
| M086 | § 12.6 | renouvellements illimités | detectee | Attaques.test_a20_3_finalites_variees |
| M087 | § 12.6 | même justification acceptée | detectee | S06_Protections.test_S_194 |
| M088 | § 12.6 (G-11) | consécutivité appréciée par finalité | detectee | Attaques.test_a20_3_finalites_variees |
| M089 | § 12.4 | durée maximale ignorée | detectee | S06_Protections.test_S_132 |
| M090 | § 12.4 | opérations non fermées | detectee | InvariantsCibles.test_I13_derogation_bornee |
| M091 | § 12.3 | restriction non levable franchie | detectee | S06_Protections.test_S_47 |
| M092 | § 12.7 | subordination ignorée | detectee | S11_V15.test_S_232 |
| M093 | § 12.7 | lien d'intérêt ignoré | detectee | Attaques.test_a08_succession_sans_versement |
| M094 | § 12.7 | identité établie de l'approbateur non exigée | detectee | S11_V15.test_S_234 |
| M095 | § 12.4 | le bénéficiaire peut approuver | detectee | Attaques.test_a16_derogation_par_second_compte |
| M096 | § 12.7 (G-1) | deux comptes d'une même personne approuvent | detectee | S06_Protections.test_S_80 |
| M097 | § 13.9 (G-11) | réplication d'un accès par dérogation | detectee | Attaques.test_a19_5_replique_par_derogation |
| M098 | § 12.4 | usage hors finalité accepté | detectee | S06_Protections.test_S_197 |
| M100 | § 11.5 | levée ou gestion par un non-gardien | detectee | Attaques.test_a20_1_orpheline_signalee |
| M101 | § 11.2 | désigner un gardien sans droit de contenu | detectee | S06_Protections.test_S_201 |
| M102 | § 11.2 | gardien conservé sans droit de contenu | detectee | Attaques.test_a17_2_gardien_orphelin_pendant_le_gel |
| M103 | § 11.2 (G-10) | protection orpheline non signalée | detectee | Attaques.test_a17_2_gardien_orphelin_pendant_le_gel |
| M104 | § 11.2 (G-10, F-03) | désignation d'office sans signalement du passage en cours | SURVIT |  |
| M105 | § 11.1 | créateur destinataire de sa propre interdiction | detectee | S11_V15.test_S_243 |
| M106 | § 11.1 (E-4) | tout acteur crée une protection | detectee | ControleB.test_N22_protection_hors_perimetre |
| M107 | A3 | se rendre bénéficiaire par un second compte | detectee | S11_V15.test_S_244 |
| M108 | § 11.6 | créateur examine la contestation | detectee | S06_Protections.test_S_205 |
| M109 | § 11.6 | créateurs autorité compétente | detectee | S06_Protections.test_S_137 |
| M110 | § 11.6 | levée légale par quiconque | detectee | Attaques.test_a17_1_restriction_externe |
| M120 | § 13.11 (G-6) | pas d'héritage des protections à la copie | detectee | Attaques.test_a15_copie_blanchit |
| M121 | § 13.11 (G-6, H-3b) | non-levables d'un ascendant non étendues aux copies | detectee | Attaques.test_a15_copie_blanchit |
| M122 | § 13.11 | redistribution de copie sans contrôle | detectee | Attaques.test_a15_copie_blanchit |
| M123 | § 13.11 | le copieur devient gardien des protections héritées | detectee | ControleA.test_a05_2_gardiens_herites |
| M130 | § 8.1 (G-7, H-1a) | délégation d'une action interdite | detectee | Attaques.test_a14_interdiction_contournee |
| M131 | § 9.3 (G-7, H-1a) | admission au titre d'une action interdite | detectee | S12_V16.test_S_314 |
| M132 | § 1, § 8.1 (G-5) | périmètre mixte permis | detectee | Attaques.test_a07_perimetre_mixte |
| M133 | § 8.2 (G-8) | suspension traitée comme rupture | detectee | Attaques.test_a10_examen_ne_detruit_pas |
| M134 | § 13.3 (G-4) | ajout direct à une sélection partagée | detectee | Attaques.test_a03_selection_elargie_par_son_auteur |
| M135 | § 13.3 (G-4) | activation sans contrôle des habilitations | detectee | S13_Mutations.test_S_286 |
| M136 | A1, § 13.3 | HI de sélection hors du périmètre du signataire | detectee | Attaques.test_a03_selection_elargie_par_son_auteur |
| M137 | § 13.3 | proposition en attente servie | detectee | S07_Selection.test_S_53 |
| M138 | DI-L21 | objet masqué servi | detectee | S07_Selection.test_S_51 |
| M140 | § 2.4 (G-9) | gel de succession sans effet | detectee | ControleA.test_a07_1_gel_par_personne |
| M141 | § 10.4 | décision de succession sans fondement | detectee | S12_Succession.test_S_271 |
| M142 | § 10.4, § 12.7 | lien d'intérêt avec l'espace ignoré en succession | detectee | Attaques.test_a08_succession_sans_versement |
| M143 | § 10.4 (G-9) | objets du défunt versés en succession | detectee | Attaques.test_a08_succession_sans_versement |
| M144 | § 10.4 | constat de décès sans contrôle d'indépendance | detectee | S12_Succession.test_S_272 |
| M150 | § 10.3 | habilitation à cibles mixtes listée en entier | detectee | S11_V15.test_S_241 |
| M151 | § 10.3 | HP sur objet personnel listée | detectee | S09_Mecanismes.test_S_224 |
| M152 | § 10.3 | journaux non filtrés | detectee | S06_Protections.test_S_99 |
| M153 | § 10.3 | explication sur une cible cachée | detectee | S09_Mecanismes.test_S_223 |
| M154 | § 14 | étape 6 : refus au lieu d'introuvable | detectee | Attaques.test_a01_elevation_croisee |
| M155 | § 14 (CM-21) | connaître l'existence par `voir` seulement | detectee | Attaques.test_a19_2_connaitre_par_un_autre_droit |
| M156 | § 7.4, § 15 | l'auteur agit sur une habilitation dont la cible lui est cachée | detectee | Attaques.test_a17_3_lever_examen_cible_cachee |
| M157 | § 15 (CM-04) | nommer sur un identifiant inexistant | detectee | Attaques.test_a04_nommer_sonde_d_existence |
| M158 | § 13.6 (CM-05) | série : publication invisible acceptée | detectee | Attaques.test_a05_serie_sonde_d_existence |
| M159 | § 14 | étape 3 supprimée | detectee | ControleA.test_a05_2_gardiens_herites |
| M160 | § 14 | étape 4 supprimée | detectee | Attaques.test_a14_interdiction_contournee |
| M161 | § 14 | étape 1 supprimée | detectee | Attaques.test_a15_copie_blanchit |
| M162 | § 13.10 | cache servi sans contrôle d'époque | detectee | ControleB.test_N50_cache_et_echeance |
| M163 | § 14 étape 7 | mentions non filtrées | detectee | S07_Selection.test_S_50 |
| M164 | § 14 étape 7 | relations non filtrées | detectee | S07_Selection.test_S_102 |
| M165 | § 14 étape 7 | filiation révélée | detectee | S13_Mutations.test_S_287 |
| M166 | § 15 | compteur avant exclusion | detectee | S06_Protections.test_S_98 |
| M170 | § 8.2 | rupture désactivée | detectee | TransitionsAutres.test_examen_puis_cloture_ferme_l_aval |
| M171 | § 8.2 (cycles) | HP vers l'amont permise | detectee | ControleB.test_N40_cycle_a_toute_profondeur |
| M172 | § 8.2/T-06 | confirmation circulaire permise | detectee | S02_Delegation.test_S_110 |
| M173 | § 8.1 (4) | HP plus longue que les droits de l'auteur | detectee | S13_Mutations.test_S_288 |
| M174 | § 7.2 | HI plus longue que le RS signataire | detectee | S02_Delegation.test_S_112 |
| M175 | § 8.1 (5) | redélégation sans `repartager` | detectee | ControleB.test_N06_admission_hp_sans_a1 |
| M180 | § 7.4 | un RS clôt la nomination d'un pair | detectee | S02_Delegation.test_S_111 |
| M181 | § 7.4 (CD-02) | la racine ne clôt pas toute HI | detectee | S02_Delegation.test_S_151 |
| M182 | § 8.3 (CT-15) | le bénéficiaire restreint | detectee | Attaques.test_a02_blocage_par_restriction |
| M183 | § 7.5 | mise en examen par un RS non racine | detectee | S02_Delegation.test_S_155 |
| M184 | § 7.6 | la racine quitte l'espace | detectee | S02_Delegation.test_S_109 |
| M185 | § 7.6 (CT-17) | nomination proposée adressée au partant non close | detectee | S11_V15.test_S_259 |
| M186 | § 2.1 (F-1) | le départ du signataire ferme ses HI | detectee | S02_Delegation.test_S_108 |
| M187 | § 7.2 | HI sur une cible inconnue du signataire | detectee | ControleA.test_a07_1_gel_par_personne |
| M190 | § 6.1 (CC-20) | le titulaire valide | detectee | ClotureV16.test_p2_versement_active_hi_preexistante_du_contenu |
| M191 | § 6.2 | un lecteur crée | detectee | S05_Titulaire.test_S_128 |
| M192 | § 6.2 (CT-31) | import sans mandat | detectee | S11_V15.test_S_257 |
| M193 | § 6.3 (CT-30) | purge malgré une restriction légale ou un gel | detectee | S11_V15.test_S_256 |
| M194 | § 6.3 (A3) | reprise au profit du RS qui accepte | detectee | Attaques.test_a06b_reprise_au_profit_du_rs |
| M195 | § 6.3 (CM-06) | reprise élargie | detectee | Attaques.test_a06_reprise_elargie |
| M196 | § 6.3 | versement accepté par un RS hors périmètre | detectee | Attaques.test_a06_reprise_elargie |
| M200 | § 13.1 (CT-21) | public en écriture | detectee | Attaques.test_a17_4_public_en_ecriture |
| M201 | § 13.1 | public sans diffusabilité | detectee | S11_V15.test_S_242 |
| M202 | § 5.1 (CT-20) | élargissement dans un espace archivé | detectee | Attaques.test_a19_4_elargir_dans_un_espace_clos |
| M203 | § 13.2 | un non-RS change la visibilité du contenu | detectee | S09_Mecanismes.test_S_139 |
| M204 | § 13.7 (CM-22) | base de portée projet par un non-membre | detectee | Attaques.test_a19_3_base_par_un_non_membre |
| M205 | § 13.6 | insertion inter-espaces sans acceptation | detectee | S09_Mecanismes.test_S_65 |
| M206 | § 13.4 | lot étendu par ajout | detectee | S09_Mecanismes.test_S_218 |
| M207 | § 13.4 | lot en `valider` | detectee | S09_Mecanismes.test_S_219 |
| M208 | § 13.4 | réouverture du lot réactive | detectee | S09_Mecanismes.test_S_221 |
| M209 | § 13.13 | fin de rattachement sans clôture | detectee | S03_Ensembles.test_S_29 |
| M210 | § 13.9 | échéance locale au-delà du plafond | detectee | S08_HorsLigne.test_S_138 |
| M211 | § 13.9 | réplication sans échéance de données protégées | detectee | S08_HorsLigne.test_S_60 |
| M212 | § 13.8 | contribution intégrée sans réévaluation | detectee | S08_HorsLigne.test_S_107 |
| M213 | § 13.14 | cloisonnement de campagne levé | detectee | S09_Mecanismes.test_S_66 |
| M214 | § 7.1 | contribuer au Core sans diffusabilité | detectee | S09_Mecanismes.test_S_215 |
| M215 | § 5.1 | écriture dans un espace archivé | detectee | ControleA.test_a06_espace_archive |
| M216 | § 10.1 | un administrateur nomme un administrateur | detectee | Attaques.test_a17_6_nommer_son_second_compte |
| M217 | § 5.1 | un administrateur archive | detectee | S13_Mutations.test_S_290 |
| M218 | § 13.14 | acteur institutionnel en campagne | detectee | S11_V15.test_S_260 |
| M301 | § 2.5 (H-1a) | exclusions figées d'une habilitation ignorées | detectee | ControleA.test_a01_g7_perimetre_dynamique |
| M302 | § 2.5 (H-1a), I-5 | cible cachée d'un périmètre dynamique : refus (fuite) au lieu d'exclusion | detectee | ControleA.test_a01_g7_perimetre_dynamique |
| M303 | § 2.5 (H-1a) | cible connue non exécutable : exclusion au lieu de refus | detectee | S12_V16.test_S_312 |
| M304 | § 2.5 (H-1a) | exclusions figées d'une nomination ignorées | detectee | S12_V16.test_S_313 |
| M305 | § 2.5 (H-1a) | exclusions figées d'une admission ignorées | detectee | S12_V16.test_S_314 |
| M306 | § 2.5 (H-1a) | exclusions figées d'un fondateur ignorées | detectee | S12_V16.test_S_315 |
| M307 | § 9.2 (H-2a) | admission jamais requise | detectee | Attaques.test_a11_admission_par_fondateur_rompu |
| M310 | § 13.11 (H-3b) | protection postérieure non propagée aux copies | detectee | S12_V16.test_S_316 |
| M311 | § 11.2 (H-3b) | gardiens hérités appréciés sur la copie | detectee | ControleA.test_a05_2_gardiens_herites |
| M312 | § 13.11 (H-3b) | sensibilité non héritée à la copie | SURVIT |  |
| M313 | § 13.11 (H-3b) | sensibilité d'un ascendant ignorée | detectee | S12_V16.test_S_317 |
| M314 | § 13.11 (H-3b) | copie sensible redistribuable | detectee | ClotureV16.test_m312_purge_ascendant_ne_libere_pas_copie_sensible |
| M315 | § 11.6 (CT-05) | restriction légale d'un ascendant non appliquée à la copie | detectee | ControleA.test_a05_1_restriction_legale_posterieure |
| M320 | § 10.6 (H-4a) | délégation sur le contenu non gelée | detectee | ControleA.test_a09_4_gel_sans_sonde |
| M321 | § 10.6 (H-4a) | nomination non gelée | detectee | ControleA.test_a09_3_autorite_legale_et_presentations |
| M322 | § 10.6 (H-4a) | prolongation non gelée | detectee | ClotureV16.test_m033_m330_prolongation_gelee_et_restriction_admise |
| M323 | § 10.6 (H-4a) | confirmation non gelée | detectee | ControleA.test_a11_confirmation_gelee |
| M324 | § 10.6 (H-4a) | levée interne d'une protection non gelée | detectee | S13_Mutations.test_S_292 |
| M325 | § 10.6 (H-4a) | désignation d'un gardien par l'autorité non gelée | detectee | Attaques.test_a17_2_gardien_orphelin_pendant_le_gel |
| M326 | § 10.6 (H-4a) | ajout à un groupe non gelé | detectee | S04_Transfert.test_S_36 |
| M327 | § 10.6 (H-4a) | versement non gelé | detectee | Attaques.test_a18_4_versement_pendant_le_gel |
| M328 | § 10.6 (H-4a) | acte de l'autorité légale gelé (levée) | detectee | ControleA.test_a09_3_autorite_legale_et_presentations |
| M329 | § 10.6 (H-4a) | création de protection gelée | detectee | ControleA.test_a12_creation_de_protection_jamais_gelee |
| M330 | § 10.6 (H-4a) | inclusion : fondateurs ajoutés ignorés | SURVIT |  |
| M331 | § 10.6 (H-4a) | inclusion : effectivité accrue ignorée | SURVIT |  |
| M332 | § 10.6 (CT-18) | protection devenue invisible à K traitée comme une levée | detectee | ControleA.test_a12_creation_de_protection_jamais_gelee |
| M333 | § 5.6 (CT-09) | présentations illimitées | detectee | ControleA.test_a09_3_autorite_legale_et_presentations |
| M334 | § 5.6 (CT-09) | carence de transfert ignorée | detectee | ControleA.test_a09_3_autorite_legale_et_presentations |
| M335 | § 10.7 (CT-19) | acceptation d'un espace clos | detectee | ControleA.test_a09_2_espace_clos_pendant_la_fenetre |
| M336 | § 10.6 (H-6d) | création d'objet gelée | detectee | Combinaisons.test_gel_par_liste |
| M340 | § 2.4 (H-5) | interdiction d'existence par compte | detectee | ControleA.test_a08_3_interdiction_par_personne |
| M341 | § 2.3 (H-5) | interdiction d'action par compte | detectee | S12_V16.test_S_304 |
| M342 | § 2.4 (H-5) | bénéficiaire d'un embargo par compte | detectee | S12_V16.test_S_305 |
| M343 | § 11.2 (H-5) | gardien par compte | detectee | S12_V16.test_S_320 |
| M344 | § 10.4 (H-5) | défunt par compte | detectee | S12_V16.test_S_321 |
| M345 | § 10.7 (H-5) | cédant par compte | detectee | ControleA.test_a09_1_second_compte_du_cedant |
| M346 | § 10.5 (H-5) | objets du cédant par compte | detectee | S12_V16.test_S_307 |
| M347 | § 9.4 (H-5) | compte sans identité établie admis automatiquement | detectee | S12_V16.test_S_308 |
| M348 | § 11.1 (H-5) | compte sans identité établie crée une protection | detectee | S12_V16.test_S_309 |
| M349 | § 11.2 (H-5) | gardien sans identité établie | detectee | S12_V16.test_S_309 |
| M350 | § 9.4 (H-6a) | admission différée non réévaluée | detectee | ControleB.test_M010_admission_differee |
| M351 | § 10.8 (H-6c) | consentement non consommé | detectee | S04_Transfert.test_S_121 |
| M352 | § 10.8 (H-6c) | consentements non caducs au transfert suivant | detectee | ControleA.test_a10_4_consentement_par_acte |
| M353 | § 13.6 (H-6e) | rang occupé par une publication invisible | detectee | ControleA.test_a08b_rang_de_serie |
| M360 | A3 (CT-03) | prolonger à son profit | detectee | ControleA.test_a03_prolonger_a_son_profit |
| M361 | A3 (CT-03) | confirmer à son profit | detectee | S12_V16.test_S_310 |
| M362 | A3 (CT-03) | profit apprécié par compte | detectee | ControleA.test_a03_prolonger_a_son_profit |
| M363 | § 13.3 (CT-10) | l'auteur gère une sélection partagée | detectee | ControleA.test_a13_2_revocation_par_l_auteur_sans_autorite |
| M364 | § 13.3 (CT-10) | activation sur une sélection non partagée par un tiers | detectee | S12_V16.test_S_311 |
| M365 | § 10.4 (CT-14) | le défunt reste gardien | detectee | ControleA.test_a07_2_gardien_decede |
| M366 | § 12.3 (CT-15) | dérogation sur un objet gelé sans finalité `succession` | detectee | ControleA.test_a07_3_derogation_sur_objet_gele |
| M367 | § 12.6 (CT-16) | rang : dernière dérogation au lieu du maximum | detectee | ControleA.test_a04_renouvellements |
| M368 | § 7.6 (CT-17) | nomination proposée signée par le partant non close | detectee | ControleA.test_a10_2_nomination_proposee_par_un_partant |
| M369 | § 10.3 (CT-20) | actes sur les protections dans les journaux de gouvernance | detectee | ControleA.test_a08_2_protections_hors_journaux |
| M370 | § 10.5 (CT-22) | réémission sur des voies mêlées annoncée | detectee | S12_V16.test_S_293 |
| M371 | § 5.1 (CT-27) | acceptation de nomination dans un espace archivé | detectee | S12_V16.test_S_294 |
| M372 | § 5.1 (CM-03) | écriture d'un non-titulaire sur un objet personnel, espace archivé | detectee | ControleA.test_a06_espace_archive |
| M373 | § 5.1 (CM-04) | prolonger ou confirmer dans un espace archivé | detectee | ControleA.test_a06_espace_archive |
| M374 | § 8.3 (CM-19) | retrait d'une admission à une HI par un RS hors périmètre | detectee | S12_V16.test_S_295 |
| M375 | T-05 (CM-20) | restriction de périmètre élargissant | detectee | S12_V16.test_S_296 |
| M376 | § 11.2 (CM-23) | gardien désigné destinataire | detectee | S12_V16.test_S_297 |
| M377 | § 11.2 (F-03) | second passage orphelin non signalé | detectee | ControleB.test_M104_second_passage_orphelin |
| M378 | § 10.5 (F-04) | copie (c) avec une purge | detectee | Combinaisons.test_transfert_voies |
| M379 | § 8.2 (cycles) | amont sans les auteurs d'admission | detectee | S12_V16.test_S_298 |
| M380 | § 10.4 (CM-22) | succession présentée sans scellé d'audit | detectee | S12_V16.test_S_299 |
| M381 | § 10.4, § 12.7 (CM-22) | succession : dossier sans les objets et espaces du défunt | detectee | S12_V16.test_S_300 |
| M382 | § 10.4, § 12.7 (CM-22) | décision de succession : dossier limité à l'objet | detectee | S12_V16.test_S_301 |
| N01 | § 7.5, T-07 | mise en examen d'une HP (HI seulement) | detectee | ControleB.test_N01_examen_hi_seulement |
| N02 | T-04, § 7.2 | HI prolongée par un RS dont le périmètre ne la couvre pas | detectee | ControleB.test_N02_prolongation_hors_perimetre |
| N03 | § 2.5, T-04 (G-7) | prolongation sans exécution effective | detectee | ControleB.test_N03_prolongation_g7 |
| N04 | § 2.5, T-06 (G-7) | confirmation sans exécution effective | detectee | ControleB.test_N04_confirmation_g7 |
| N06 | § 9.3, § 8.1 | admission à une HP sans les conditions 1 (A1) | detectee | ControleB.test_N06_admission_hp_sans_a1 |
| N07 | § 8.3 (CM-19) | retrait d'une admission à une HP par quiconque connaît l'HP | detectee | ControleB.test_N07_retrait_d_admission_par_un_tiers |
| N08 | § 9.4 (G-1) | exclusion après retrait appréciée par compte | detectee | ControleB.test_N08_exclusion_par_personne |
| N09 | § 12.6 (G-1) | consécutivité des dérogations appréciée par compte | detectee | ControleB.test_N09_consecutivite_par_personne |
| N10 | A6, § 11.2 | un échec d'évaluation retire un gardien | detectee | ControleB.test_N10_echec_d_evaluation_et_gardien |
| N11 | A6, I-14 | un échec d'évaluation rompt une HP | detectee | ControleB.test_N10_echec_d_evaluation_et_gardien |
| N12 | § 13.11 (G-6) | copie : destinataires des interdictions non hérités | detectee | ControleB.test_N12_copie_herite_des_destinataires |
| N13 | § 13.11 | ascendants limités au premier rang | detectee | ControleB.test_N13_non_levable_d_un_ascendant_de_second_rang |
| N14 | § 10.3, A2 | métadonnées de gouvernance lisibles par tout membre | detectee | ControleB.test_N14_metadonnees_reservees |
| N15 | § 10.3 | journaux : HP sur objet personnel visibles hors titulaire | detectee | ControleB.test_N15_journaux_hp_objet_personnel |
| N16 | § 10.3 (OB-24) | explication des accès sur l'objet personnel d'autrui | detectee | ControleB.test_N16_explication_objet_personnel |
| N17 | § 10.6 (F-4) | présentation lisible par un autre que le cessionnaire | detectee | ControleB.test_N17_presentation_lisible_par_k_seul |
| N18 | § 12.5 | révocation d'une dérogation par un non-membre de l'autorité | detectee | ControleB.test_N18_revocation_de_derogation |
| N19 | § 11.6 | contestation d'une restriction légale par quiconque | detectee | ControleB.test_N19_contestation_reservee |
| N20 | § 11.6, § 12.7 | contestation examinée sans deux approbateurs indépendants | detectee | ControleB.test_N20_examen_par_deux_independants |
| N21 | § 10.8, § 10.1 | consentement à la réintégration par un non-propriétaire | detectee | ControleB.test_N21_consentement_par_le_proprietaire |
| N22 | § 11.1 | protection posée par un RS hors de son périmètre | detectee | ControleB.test_N22_protection_hors_perimetre |
| N23 | § 13.7 | base de portée projet sans action d'écriture | detectee | ControleB.test_N23_base_projet |
| N24 | § 13.6 | insertion en série sans être RS ni administrateur | detectee | ControleB.test_N24_insertion_reservee |
| N25 | § 13.9 | échéance hors ligne de l'habilitant ignorée | detectee | S08_HorsLigne.test_S_208 |
| N26 | § 13.8 | contribution refusée lisible par un autre que son auteur | detectee | S08_HorsLigne.test_S_107 |
| N27 | § 14 étape 1, § 15 | restriction non levable : « refus » révèle l'existence | detectee | S06_Protections.test_S_47 |
| N28 | § 14 étape 4, § 15 | restriction interne : « refus » révèle l'existence | detectee | ControleA.test_a10_1_portee_limitee_sans_bascule |
| N32 | § 10.6 (H-4a), rétargetée | levée d'une restriction légale gelée (le contrat V1.6 l'exclut du gel) | detectee | ControleA.test_a09_3_autorite_legale_et_presentations |
| N35 | § 8.3 | le titulaire de la cible ne peut plus clore une HP d'autrui | detectee | S12_V16.test_S_302 |
| N40 | § 8.2 (cycles) | amont limité aux fondateurs directs | detectee | ControleB.test_N40_cycle_a_toute_profondeur |
| N41 | § 13.1 | public désigné par un non-titulaire non-RS détenteur de repartager | detectee | S09_Mecanismes.test_S_216 |
| N50 | § 13.10 (CP-40) | cache servi au-delà de l'instant et de l'échéance | detectee | ControleB.test_N50_cache_et_echeance |
| N53 | § 12.3 | protection orpheline : dérogation sans gardien | detectee | ControleB.test_N53_orpheline_infranchissable |

Les survivantes sont instruites dans `JUSTIFICATIONS.md`.
