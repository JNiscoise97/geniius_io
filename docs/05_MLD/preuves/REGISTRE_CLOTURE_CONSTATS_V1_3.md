# Registre de clôture documentaire des constats — V1.3 / MLD V1.1-g

**Date :** 12 octobre 2026. **Portée :** correction et représentation logique des constats instruits, avec recontrôles indépendants. « Clos documentaire » ne signifie ni logiciel exécuté ni preuve exhaustive de toute combinaison.

Preuves indépendantes : **D** = [revue données, seconde passe et avis final](VALIDATION_DONNEES_ET_TRACABILITE_V1_3.md) ; **A** = [revue autorisations, §§ 5–6](VALIDATION_AUTORISATIONS_RELATIONNELLES_V1_3.md). Scénarios initiaux : [audit AC](../travaux/AUDIT_CONTRADICTOIRE_MLD_V1_1.md), [contre-audit NC](../travaux/CONTRE_AUDIT_MLD_V1_1_D.md). Les variantes sont précisées dans les revues et résumées ci-dessous ; aucun PASS SQL n'est inventé.

## 1. AC-01 à AC-32

| ID | Correction et preuve de scénario/variante | Statut |
|---|---|---|
| AC-01 | A3, § 5.3 et catalogue : administrateur sans lecture ne peut se nommer, partager ou s'admettre par groupe ; programme ne reçoit rien sur enfant | Clos documentaire, A |
| AC-02 | Transfert atomique propriété/racine, droits de C par personne, verrou par acte ; second compte de C ne contourne pas | Clos documentaire, A |
| AC-03 | Titularité seulement procédures système, aucun repli administratif ; création sans déposant identifiable ne crée pas d'objet personnel | Clos documentaire, A |
| AC-04 | Protections/gardes/agréments explicites, autorité sans lecture ; orpheline signalée sans levée ni accès automatique | Clos documentaire, A |
| AC-05 | CP-49 et base privée⇔auteur, visibilité et contrôle avant UQ ; base projet avec deux auteurs non admise, choix caché ne révèle pas conflit | Clos documentaire, D+A |
| AC-06 | Modes d'inclusion DI-L21 et rendu filtré § 22.2 ; masqué/pseudonymisé ne remet pas cible en clair | Clos documentaire, A ; recette rendu MPD |
| AC-07 | CP-33 toute assertion/profil sujet et cible inclus ; frontières participation/présence/situation filtrées, pas seulement relations | Clos documentaire, D+A |
| AC-08 | CP-50 contrôle visibilité avant contraintes, absence/inaccessible indifférenciés ; réception sans FK cible avant résolution | Clos documentaire, A+D |
| AC-09 | parution_acceptation référencée avant insertion inter-espace ; acceptation seule n'occupe pas rang, rang caché non révélé | Clos documentaire, D+A |
| AC-10 | CP-33 manifeste figé à création, version active distincte, réduction sur active ; CP-36 acceptations anciennes ne réactivent pas accord | Clos documentaire, D+A |
| AC-11 | Signataire, auteur, fondateurs et actes persistés ; HI survit au signataire, admission HP a ses propres fondements | Clos documentaire, A |
| AC-12 | Présentations et clichés associatifs complets ; permutation d'exclusions entre fondateurs ou admission crée cliché distinct | Clos documentaire, A |
| AC-13 | Toute donnée protégée porte échéance opposable, minimum des plafonds ; copie personnelle/familiale ne peut rester hors ligne indéfiniment | Clos documentaire, A ; résidu amont réservé |
| AC-14 | Delta seul, jamais état de base ; refus conservé pour auteur sans réexposition de contenu retiré | Clos documentaire, D+A |
| AC-15 | CP-35 origine humaine/automatique distincte, autorisation gouvernance filtrée ; invalidation automatique n'est pas avis humain | Clos documentaire, D+A |
| AC-16 | CP-51/filiation/protections ascendantes ; copie survit à révocation mais licence seule ne blanchit pas redistribution | Clos documentaire, A |
| AC-17 | CP-41 dépôt logique distinct, aucune unicité d'empreinte ; fichier partagé physiquement ne bloque pas purge ni révèle autre dépôt | Clos documentaire, D |
| AC-18 | Export ne liste ni ne compte existence cachée, journal interne filtré ; motif d'exclusion ne nomme pas cible protégée | Clos documentaire, D+A |
| AC-19 | DATE_HIST/PERIODE_HIST, ordre des bornes et situation dans extension ; période 1810→1790 refusée | Clos documentaire, D |
| AC-20 | FK type de dépendance et exclusions des acquisitions/objets non probatoires ; acquisition documentaire n'entre pas comme justification | Clos documentaire, D |
| AC-21 | CP-05 cardinalités au jalon adéquat ; conditions de présence hors purge, garde/protection conforme au contrat | Clos documentaire, D ; recette transactions MPD |
| AC-22 | UQ non purgées, CK et codes neutralisables ; purge ne réserve pas cote/candidature/élément légitime | Clos documentaire, D |
| AC-23 | CP-22 association crée nouvelle version du propriétaire ; aucune insertion dans état déjà figé | Clos documentaire, D |
| AC-24 | Champs NN* et CK purge conditionnels ; effacement ne laisse pas codes/horodatages reconstructifs par défaut | Clos documentaire, D |
| AC-25 | NN† activité et relations neutralisées, versions effacées exclues UQ courant ; deux anciennes versions peuvent être neutralisées ensemble | Clos documentaire, D |
| AC-26 | Compte conservé avec contenu neutralisé, pseudonyme réservé ; effacement technique explicite sans cascade physique fictive | Clos documentaire, D |
| AC-27 | CP-52 attributs figés, auteur/acteur originels préservés ; changement d'espace ou paternité hors procédure refusé | Clos documentaire, D+A |
| AC-28 | CP-13/DI énoncées, 60 scénarios/variantes ; 304 correspondances identifiées sans preuve fictive des 207 | Clos documentaire, D ; exécution réservée |
| AC-29 | Décisions de rattachement 0,n, états et terminaisons CP-31 ; troisième acte de terminaison peut être conservé | Clos documentaire, D |
| AC-30 | Participant identifié obligatoire et personne concordante ; invitation technique n'est pas réponse ; phase indépendante exclut réponses des autres | Clos documentaire, D+A, § 13.14 du contrat |
| AC-31 | Procédure système d'amorçage public, acteur institutionnel sans titulaire ; aucune propriété privée administrative implicite | Observation traitée, A |
| AC-32 | CP-34/DD-24 indicateurs, agrégats calculés sur graphe autorisé ; rattachement seul ne remonte ni droits ni valeurs | Observation traitée, D |

## 2. NC-01 à NC-15

| ID | Correction et variante | Statut |
|---|---|---|
| NC-01 | Aucune nature propriétaire librement créable ; titularité attribuée par système, portée/régime distincts | Clos documentaire, A |
| NC-02 | Administrer ne partage pas ; HP/HI bornées, admission et ensemble contrôlés par personne | Clos documentaire, A |
| NC-03 | Voies et réémissions explicites, pas transfert général des règles ; HP tierce sur objet personnel conservée par CT-28 | Clos documentaire, A |
| NC-04 | Historique des actes distinct de l'identité de l'habilitation ; admission HP n'ajoute pas fondateur global | Clos documentaire, A |
| NC-05 | Garde/autorité/agréments et dérogations indépendants de l'administration ; perte de garde ne rend pas protection libre | Clos documentaire, A |
| NC-06 | Base privée⇔auteur, projet auteur nul ; contrôles de visibilité avant UQ, lien jamais plus ouvert que extrémités | Clos documentaire, D+A |
| NC-07 | État révoquée/close ne fonde aucun accès ; réduction sur manifeste actif, pas proposition en attente | Clos documentaire, D+A |
| NC-08 | Engagements FK typées et clichés associatifs plutôt qu'UUID ambigu d'une clé composite ; audience et rôle figés | Clos documentaire, A |
| NC-09 | Échéance sur toute donnée protégée, quel que soit type d'espace ; résidu borné explicitement déclaré | Clos documentaire, A |
| NC-10 | Masquage même objet/type, propre sélection ; évaluation audience/version active au temps d'accès | Clos documentaire, D+A |
| NC-11 | Types/fiches et structures † réconciliés, contexte/campagne/parution explicites, 304 matrices requalifiées ; plus de preuves historiques reconduites | Clos documentaire, D+A |
| NC-12 | Réception technique personnelle avec références déclarées sans FK ; commentaire légitime extérieur conservé, cible inexistante ne bloque pas delta | Clos documentaire, D ; recontrôle ciblé final |
| NC-13 | Suppression logique compte efface explicitement données techniques ; pseudonyme reste réservé sans pointer vers contenu supprimé | Clos documentaire, D |
| NC-14 | Indépendance structurée sans prétendre empêcher collusion/fraude ; limite gouvernance du contrat § 17.3 maintenue | Observation réservée, pas anomalie prétendument résolue |
| NC-15 | Temps d'une situation seulement dans groupes début/fin ; date générique vide, pas double période contradictoire | Clos documentaire, D |

## 3. AR-01 à AR-15 et écarts amont

Les 15 constats de la revue relationnelle ont un recontrôle individuel aux §§ 5–6 de son rapport. AR-13 est retiré dans sa demande de nouvelle opération de mode : les justifications acceptées du contrat gelé confirment l'absence de bascule. Les autres écarts de représentation sont corrigés ; les obligations d'exécution restent à réaliser au MPD.

Les écarts ECD relevant du schéma technique/ST, des paramètres MPD, de l'origine fonctionnelle AV-FONC-002 ou du résidu hors ligne ne sont pas artificiellement clos par cette matrice. Leur disposition et leur réserve sont reprises dans le [dossier de validation](../../03_DICTIONNAIRE/preuves/DOSSIER_VALIDATION_DICTIONNAIRE_MLD_V1_3.md), § 5.
