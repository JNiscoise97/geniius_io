# GENIIUS — Cahier des charges technique V1.0
## Version consolidée candidate — reconstitution contrôlée
**Date :** 9 octobre 2026  
**Statut :** candidat de consolidation, non gelé  
**Origine :** décisions TECH-001–033 et REV-03-M01 à M11 approuvées en discussion, CDCF et MLD disponibles. **Le fichier source initial du CDC technique n’a pas été retrouvé : ce document ne prétend pas en reproduire littéralement les formulations.**

## 0. Règles de lecture et de priorité
Les prescriptions « doit » ci-dessous constituent la rédaction consolidée candidate. Les références de recettes désignent des scénarios spécifiés, **non exécutés**. Une approbation en discussion ne prouve pas une intégration dans les versions normatives existantes.
En cas de conflit : préserver les invariants fonctionnels et scientifiques approuvés; ouvrir un écart documenté; ne pas résoudre silencieusement par interprétation. Le choix des technologies physiques et l’étude juridique détaillée restent des étapes distinctes.

## 1. Architecture et frontières
GENIIUS articule Tree, Journal, Echo, Rebond, Connect et Atlas autour de données, identités, droits, preuves, provenance et versions. L’architecture cible est un monolithe modulaire évolutif, avec base structurée et stockage d’objets, état canonique cloud et travail hors ligne maîtrisé. Les modules ne doivent pas accéder aux objets hors de leur graphe accessible.
La personne historique, l’acteur contributeur et le compte d’authentification sont distincts. Les espaces, audiences, missions et droits sont évalués selon le contexte. Les publications, exports, index, notifications et agrégations sont filtrés avant exposition.

## 2. Registre normatif des 33 exigences
### TECH-001 — Plateformes et expérience multi-support
**Exigence.** GENIIUS doit proposer des parcours cohérents sur ordinateur et mobile, adaptés aux capacités du support, sans créer de vérités scientifiques divergentes.
**Vérification.** Parcours fonctionnels multi-support; vérifier accessibilité et cohérence des droits..
**Traçabilité candidate.** CDCF; TECH-025.

### TECH-002 — Travail hors ligne
**Exigence.** Les opérations autorisées hors ligne doivent conserver les brouillons et contributions locales; l’état canonique demeure celui du service après synchronisation contrôlée.
**Vérification.** REC-X15, REC-X16, REC-X17.
**Traçabilité candidate.** L15.

### TECH-003 — État canonique et souveraineté
**Exigence.** Les états scientifiques partagés et les arbres personnels restent séparés; une contribution au Core est explicite, attribuée et soumise aux droits; aucune fusion silencieuse.
**Vérification.** REC-X13; REC-TR05 à REC-TR11.
**Traçabilité candidate.** L11.

### TECH-004 — Intégration aux fichiers
**Exigence.** Les médias et fichiers documentaires conservent identifiants, empreintes, métadonnées de provenance et références stables malgré renommage ou indisponibilité.
**Vérification.** REC-TECH04.
**Traçabilité candidate.** Stockage documentaire.

### TECH-005 — Synchronisation
**Exigence.** La synchronisation doit être reprise, idempotente, sensible aux conflits et aux révocations; elle ne transforme pas une divergence scientifique en arbitrage automatique.
**Vérification.** REC-X16, REC-X17.
**Traçabilité candidate.** L15.

### TECH-006 — Stockage structuré et objets
**Exigence.** Les données structurées et les binaires doivent être liés par des identifiants stables, contrôles d’intégrité, règles de droits et opérations de cycle de vie cohérentes.
**Vérification.** REC-RB04 à RB07; REC-J06 à J09.
**Traçabilité candidate.** L06, L07.

### TECH-007 — Authentification
**Exigence.** Authentification robuste, passkeys et MFA selon la politique retenue; récupération contrôlée, révocation des sessions et séparation identité de connexion/acteur/personne historique.
**Vérification.** REC-TECH07.
**Traçabilité candidate.** P16.

### TECH-008 — Architecture modulaire
**Exigence.** Architecture en modules aux contrats explicites, isolant les responsabilités sans accès direct contournant les autorisations ou les invariants scientifiques.
**Vérification.** REC-TECH08.
**Traçabilité candidate.** Décisions d’architecture.

### TECH-009 — Capacité et montée en charge
**Exigence.** Les services doivent pouvoir évoluer en charge avec dégradation observable et sans perte de confidentialité ou de données; profils de charge et seuils de capacité documentés.
**Vérification.** REC-NF03.
**Traçabilité candidate.** L16.

### TECH-010 — Migrations
**Exigence.** Les migrations de schéma et de données doivent conserver identifiants, provenance, versions, droits et références persistantes; rollback ou reprise contrôlée.
**Vérification.** REC-X20.
**Traçabilité candidate.** Historisation.

### TECH-011 — Autorisations et graphe accessible
**Exigence.** Toutes opérations révélatrices utilisent le graphe accessible du contexte avant calcul; existence protégée, interdictions et embargos prévalent; administrer ne signifie pas lire les objets privés; création privée assortie de droits explicites pour l’auteur.
**Vérification.** REC-X09 à X14; CP-23 à CP-25.
**Traçabilité candidate.** L08, L10, L11, L13, L14; MLD §22.

### TECH-012 — Sauvegardes et restauration
**Exigence.** Sauvegardes cohérentes données/binaires et restauration vérifiable; RPO ≤5 min et RTO ≤4 h pour le périmètre de référence; pas de résurrection des données purgées.
**Vérification.** REC-X18, X19; REC-NF05.
**Traçabilité candidate.** L15.

### TECH-013 — Résilience et idempotence
**Exigence.** Toute opération rejouée ou interrompue doit éviter doublons, écrasements et effets scientifiques silencieux; échecs visibles et reprises sûres.
**Vérification.** REC-TECH13; REC-NF09.
**Traçabilité candidate.** Résilience.

### TECH-014 — Performances
**Exigence.** Objectifs de lecture p95 ≤1 s et recherche p95 ≤2 s dans des conditions de référence documentées, sans contourner les contrôles d’accès.
**Vérification.** REC-NF01, NF02, NF03.
**Traçabilité candidate.** L16.

### TECH-015 — Traitements asynchrones
**Exigence.** Les tâches asynchrones doivent avoir états, reprises et échecs observables; toute modification scientifique amont signale les dépendances et résultats potentiellement affectés.
**Vérification.** REC-X12; REC-NF09; CP-21.
**Traçabilité candidate.** L01, L12; MPD-04.

### TECH-016 — Index et vues dérivées
**Exigence.** Les index, caches, suggestions et vues sont dérivés, révocables et filtrés par contexte; aucun résultat dérivé ne devient une vérité scientifique ou un canal de fuite.
**Vérification.** REC-TECH16.
**Traçabilité candidate.** MLD §22.3; MPD-02, MPD-03.

### TECH-017 — Assistance IA
**Exigence.** Les sorties d’IA sont des propositions attribuées, vérifiables et soumises à validation humaine; elles ne créent aucune autorité scientifique automatique.
**Vérification.** REC-TECH17; REC-RB07.
**Traçabilité candidate.** Rebond, Echo.

### TECH-018 — API et fidélité scientifique
**Exigence.** APIs versionnées, contrats explicites et filtrage préalable; préserver distinction source/mention/assertion/identification/hypothèse/conclusion, incertitude, provenance et versions.
**Vérification.** REC-I04 à I07; REC-T04 à T07; REC-S04 à S11; REC-RB04 à RB07; REC-J06 à J09; REC-E06 à E09; REC-AT05 à AT09.
**Traçabilité candidate.** L01 à L07, L09, L11 à L13.

### TECH-019 — Chiffrement
**Exigence.** Données en transit et au repos protégées selon leur sensibilité, secrets gérés séparément, sauvegardes incluses; politique de clés et récupération documentées.
**Vérification.** REC-TECH19.
**Traçabilité candidate.** Sécurité.

### TECH-020 — Effacement et non-résurrection
**Exigence.** Purge conforme aux bases juridiques applicables, affectant contenus courants/historiques, binaires et dérivés; tombstones et sauvegardes empêchent la résurrection non autorisée.
**Vérification.** REC-X19; CP-16; REC-J13.
**Traçabilité candidate.** L08, L14, L15.

### TECH-021 — Journalisation et audit
**Exigence.** Écritures, décisions scientifiques, habilitations exceptionnelles, traitements et interventions sont traçables, horodatés et attribués sans exposer indûment les contenus protégés.
**Vérification.** REC-TECH21; CP-24.
**Traçabilité candidate.** Audit.

### TECH-022 — Environnements et compatibilité
**Exigence.** Environnements isolés, secrets distincts, compatibilité vérifiée et absence de circulation non autorisée de données de production.
**Vérification.** REC-TECH22.
**Traçabilité candidate.** Exploitation.

### TECH-023 — Intégration et déploiement continus
**Exigence.** Chaîne de livraison reproductible avec contrôles, migrations vérifiées et déploiements récupérables sans état scientifique partiellement migré.
**Vérification.** REC-TECH23.
**Traçabilité candidate.** M10-C01.

### TECH-024 — Stratégie de tests
**Exigence.** Tests unitaires, intégration, fonctionnels, sécurité, performance et non-régression couvrent les invariants et disposent de résultats attendus observables.
**Vérification.** REC-TECH24; registre REC.
**Traçabilité candidate.** M10-C02.

### TECH-025 — Accessibilité et UX
**Exigence.** Cible WCAG 2.2 AA; affichage des incertitudes, états, restrictions et erreurs sans précision fictive; tests automatiques et manuels.
**Vérification.** REC-NF06; REC-T04 à T07; REC-AT05 à AT09.
**Traçabilité candidate.** L03, L12, L16.

### TECH-026 — Export et portabilité
**Exigence.** Exports autorisés et manifestes contextuels conservent provenance, versions, hypothèses, références et droits; réimport sans extension implicite des permissions.
**Vérification.** REC-TECH26; REC-E10 à E13.
**Traçabilité candidate.** L10; MLD-14.

### TECH-027 — Administration à privilèges minimaux
**Exigence.** Séparer droits d’administration, lecture scientifique, publication et délégation; exceptions justifiées, temporaires, journalisées; fin de mission révoque les privilèges.
**Vérification.** REC-X09 à X11; REC-TECH27; REC-E10 à E13.
**Traçabilité candidate.** L08, L10, L13, L14.

### TECH-028 — Disponibilité
**Exigence.** Objectif de disponibilité 99,9 % mesuré sur un périmètre, une période et des exclusions publiés; incidents et maintenance distingués.
**Vérification.** REC-NF04.
**Traçabilité candidate.** L16.

### TECH-029 — Coûts et quotas
**Exigence.** Quotas et budgets de calcul observables; saturation ne doit ni perdre des données ni contourner les droits; traitements différables explicitement signalés.
**Vérification.** REC-NF08.
**Traçabilité candidate.** L16.

### TECH-030 — Gestion des incidents
**Exigence.** Détection, qualification, communication, restauration et retour d’expérience; traçabilité des opérations scientifiques incomplètes et accès d’urgence bornés.
**Vérification.** REC-TECH30.
**Traçabilité candidate.** Exploitation.

### TECH-031 — Versionnement scientifique et référentiels
**Exigence.** Versions immuables ou historiquement retraçables des assertions, identifications, interprétations et référentiels; changements et contradictions sans réécriture silencieuse.
**Vérification.** REC-TECH31; REC-I04 à I07; REC-S04 à S11; REC-X12.
**Traçabilité candidate.** L01, L02, L04 à L07, L09.

### TECH-032 — Décisions d’architecture
**Exigence.** ADR pour choix structurants, alternatives, risques, contraintes et critères de clôture; les décisions MPD différées restent bornées par les invariants.
**Vérification.** REC-TECH32.
**Traçabilité candidate.** MPD-02/03/04/06.

### TECH-033 — Internationalisation
**Exigence.** Conserver noms, écritures, accents, langues, dates et expressions historiques sans conversion destructrice; stratégie de lancement progressive autorisée.
**Vérification.** REC-NF07.
**Traçabilité candidate.** L16.

## 3. Invariants scientifiques transversaux
**S1 — Provenance.** Distinguer provenance d’acquisition, source historique, mention, assertion, hypothèse, conclusion et décision de validation.
**S2 — Réversibilité.** Les identifications et fusions doivent pouvoir être remises en question sans détruire les traces ni les mentions sources.
**S3 — Incertitude.** Une date, localisation, limite ou identité approximative reste approximative dans l’interface, les calculs et les exports.
**S4 — Indépendance.** Plusieurs citations d’une même source première ne valent pas plusieurs preuves indépendantes.
**S5 — Lacunes.** Distinguer absence de recherche, recherche partielle, résultat négatif documenté et absence historiquement attestée.
**S6 — Propagation.** Une révision scientifique amont marque les dépendances aval à réexaminer; elle ne réécrit pas silencieusement les conclusions.
**S7 — Témoignages.** Conserver déclarations successives et conditions de collecte; consentements granulaires et transmission différée contrôlée.
**S8 — Délégation.** Participation, accès, responsabilité scientifique, validation et propriété intellectuelle ne sont pas synonymes.
**S9 — Tree.** L’arbre personnel n’est pas automatiquement absorbé par un projet ni par le Core; partage et réutilisation sont distincts.
**S10 — Connect.** Invitation, appartenance à un événement et accès scientifique sont distincts; aucune contribution familiale ne devient preuve sans examen.

## 4. Registre REV-03 des lacunes et ancrages
| Lacune | Domaine | TECH | Recettes complémentaires |
|---|---|---|---|
| L01 | Propagation scientifique | TECH-015, TECH-018, TECH-031 | REC-X12 |
| L02 | Identités réversibles | TECH-018, TECH-031 | REC-I04–I07 |
| L03 | Incertitude spatiotemporelle | TECH-018, TECH-025 | REC-T04–T07 |
| L04 | Indépendance des preuves | TECH-018, TECH-031 | REC-S04–S07 |
| L05 | Reconstructions et lacunes | TECH-018, TECH-031 | REC-S08–S11 |
| L06 | Workflows Rebond | TECH-006, TECH-018, TECH-031 | REC-RB04–RB07 |
| L07 | Témoignages Journal | TECH-006, TECH-018, TECH-031 | REC-J06–J09 |
| L08 | Consentement et transmission | TECH-011, TECH-020, TECH-027 | REC-J10–J13 |
| L09 | Recherche Echo | TECH-018, TECH-031 | REC-E06–E09 |
| L10 | Délégation scientifique | TECH-011, TECH-026, TECH-027 | REC-E10–E13 |
| L11 | Souveraineté Tree | TECH-003, TECH-011, TECH-018 | REC-X13; REC-TR05–TR11 |
| L12 | Cartographie incertaine | TECH-015, TECH-018, TECH-025 | REC-AT05–AT09 |
| L13 | Sécurité Connect | TECH-011, TECH-018, TECH-027 | REC-X14 |
| L14 | Autorisations | TECH-011, TECH-020, TECH-027 | REC-X09–X11 |
| L15 | Résilience patrimoniale | TECH-002, TECH-005, TECH-012, TECH-020 | REC-X15–X21 |
| L16 | Exigences non fonctionnelles | TECH-009, TECH-014, TECH-024, TECH-025, TECH-028, TECH-029, TECH-033 | REC-NF01–NF10 |

## 5. Contrat d’accès et gouvernance
La visibilité `privé` ne donne aucun droit implicite au propriétaire administratif, administrateur de projet ou administrateur technique. CP-23 : création atomique d’une règle explicite `voir`/`éditer` pour l’auteur d’un objet privé, sous réserve des interdictions. CP-24 : accès exceptionnel justifié, borné et audité. CP-25 : séparation des appartenances administratives et scientifiques, lecture scientifique explicite.
Ordre d’évaluation : existence protégée; interdictions; autorisations; visibilité contextuelle; autorisation des liens et extrémités; embargo/masquage. Recherche, suggestion, traversée, agrégation, export, notification et API s’exécutent sur le graphe accessible. Les réponses « absent » et « existence protégée » ne doivent pas constituer un canal de révélation.

## 6. Recettes complémentaires M10 — registre
| Recette | Objet | Statut |
|---|---|---|
| REC-TECH04 | Intégration et référence de fichiers | Approuvée en discussion; non exécutée |
| REC-TECH07 | Récupération d’authentification | Approuvée en discussion; non exécutée |
| REC-TECH08 | Isolation modulaire | Approuvée en discussion; non exécutée |
| REC-TECH13 | Rejeu idempotent | Approuvée en discussion; non exécutée |
| REC-TECH16 | Révocation dans index et caches | Approuvée en discussion; non exécutée |
| REC-TECH17 | IA sans validation automatique | Approuvée en discussion; non exécutée |
| REC-TECH19 | Chiffrement et secrets | Approuvée en discussion; non exécutée |
| REC-TECH21 | Historique et audit | Approuvée en discussion; non exécutée |
| REC-TECH22 | Isolation des environnements | Approuvée en discussion; non exécutée |
| REC-TECH23 | Déploiement récupérable | Approuvée en discussion; non exécutée |
| REC-TECH24 | Tests de non-régression des droits | Approuvée en discussion; non exécutée |
| REC-TECH26 | Export/réimport sans perte sémantique | Approuvée en discussion; non exécutée |
| REC-TECH27 | Administration sans lecture scientifique | Approuvée en discussion; non exécutée |
| REC-TECH30 | Incident scientifique et reprise | Approuvée en discussion; non exécutée |
| REC-TECH31 | Version des référentiels | Approuvée en discussion; non exécutée |
| REC-TECH32 | ADR et décision différée | Approuvée en discussion; non exécutée |

## 7. Exigences non fonctionnelles et protocole de mesure
Les cibles approuvées sont : lecture p95 ≤ 1 seconde; recherche p95 ≤ 2 secondes; disponibilité 99,9 %; RPO ≤ 5 minutes; RTO ≤ 4 heures; accessibilité WCAG 2.2 AA. Elles ne valent pas résultats mesurés. Avant exécution, définir jeu de données, volumes, charge, environnement, période, exclusions et mode de calcul.
L’accessibilité, les langues et écritures, les droits et la confidentialité restent obligatoires sous charge. Les traitements asynchrones ne doivent pas présenter comme définitifs des résultats incomplets.

## 8. Décisions différées et ADR
| Décision | Sujet | Invariant obligatoire |
|---|---|---|
| MPD-02 | Matérialisation des droits | Aucun contournement du graphe accessible |
| MPD-03 | Petits effectifs et révélations indirectes | Ne pas révéler de données protégées par agrégation |
| MPD-04 | Délai de propagation | États et impacts observables, sans réécriture silencieuse |
| MPD-06 | RLS ou moteur de politiques | Même sémantique d’autorisation pour toute opération |

## 9. Conditions de gel GEL-01 à GEL-08
| Condition | Vérification requise | Statut au 09/10/2026 |
|---|---|---|
| GEL-01 | Version normative unique du MLD, CP-23 à CP-25 | Non levée |
| GEL-02 | REV-03 intégré normativement | Non levée |
| GEL-03 | Traçabilité exacte des 33 TECH | Non levée |
| GEL-04 | Recettes dédoublonnées, identifiants uniques | Non levée |
| GEL-05 | Autorisations cohérentes partout | Non levée |
| GEL-06 | Propagation scientifique entièrement spécifiée | Non levée |
| GEL-07 | Sync, sauvegarde, restauration, purge cohérentes | Non levée |
| GEL-08 | Critères non fonctionnels mesurables | Non levée |

## 10. AV-FONC-001 — Réserve structurelle
L’avenant sur les projets et programmes de recherche (hiérarchies, corpus, fédération, missions, gouvernance, indicateurs et transmission) demeure hors intégration silencieuse. Son impact sur CDCF, MCD, dictionnaire, MLD et CDC technique doit être arbitré avant gel définitif.

## 11. Relecture documentaire prévue après cette consolidation
Ordre : (1) confronter le CDCF canonique et sa version explicative; (2) vérifier le MCD canonique et dictionnaire consolidé; (3) comparer les variantes du MLD et choisir explicitement la version normative; (4) relever les divergences contre chaque TECH, REV-03 et GEL; (5) publier un errata traçable et une version candidate corrigée.

## 12. Limites de preuve et statut final
Ce document est une **reconstitution consolidée candidate**, non une modification attestée du CDC technique original. Les formulations détaillées des 33 TECH n’ont pas été comparées à un original retrouvé. Les références précises de sections CDCF/MCD/dictionnaire doivent être complétées lors de la relecture. Aucun test logiciel n’a été exécuté. Aucun gel n’est prononcé.
