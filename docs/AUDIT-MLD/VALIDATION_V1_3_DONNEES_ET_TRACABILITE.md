# Revue indépendante — données scientifiques et traçabilité V1.3

Date : 12 octobre 2026. Dictionnaire V1.3 candidat, MLD V1.1-f candidat. Revue par un agent séparé, autorisée par le porteur. Aucun gel ni arbitrage métier prononcé par ce rapport.

## Méthode et résultat

Lecture des instructions AC-01 à AC-32, du contre-audit NC-01 à NC-15, des décisions D1 à D9, des fiches scientifiques du dictionnaire et des DDL/CP correspondants. Un scénario initial et une variante sont raisonnés contre les contraintes rédigées. « Conforme documentaire » signifie que le modèle logique porte la règle ; cela ne prouve ni une implémentation SQL, ni une transaction concurrente réelle. Les tables d'autorisation de remplacement relèvent de l'autre revue.

**Avis initial : validation globale prématurée.** Les constats AC-24, AC-25, AC-28 et NC-06 restent ouverts ; AC-09, AC-10, NC-10, NC-13, NC-15 restent partiels. Les corrections V1.1-e apportent plusieurs réalisations effectives, détaillées ci-dessous. Les titres de constat ne constituent pas des preuves : seules les colonnes, CK, UQ ou CP citées comptent.

## Matrice des constats dans le périmètre

Statuts : **C** conforme documentaire ; **P** partiel ; **O** ouvert ; **A** autre revue (aucun verdict ici). Les numéros de sections désignent le document canonique `GENIIUS_MLD_V1_0.md` sauf indication.

| Constat | Scénario origine puis variante | Preuve actuelle et résultat |
|---|---|---|
| AC-05 / NC-06 | Deux bases projet en vigueur d'auteurs différents ; variante base projet privée et choix d'espace visant assertion privée | **O**. §4.4 CK exige auteur pour privée, mais ne l'interdit pas hors privée ; UQ inclut auteur pour toute portée. Deux bases projet passent. CP-49 impose visibilité d'espace sans assurer visibilité uniforme des objets visés ; CP-12 impose simultanément visibilité ≤ cible. Fixer équivalence privée/auteur, visibilité selon portée, visibilité des cibles pour tous les membres habilités au choix. |
| AC-07 | Assertion présence révélant un exclu ; variante source mentionnant l'exclu | **C pour règle scientifique**, CP-33 extension toute assertion exige sujet/cible inclus. La représentation de provenance masquée et les droits effectifs sont renvoyés à l'autre revue ; ne pas conclure fermeture globale ici. |
| AC-09 | Numéro d'autre espace occupant rang d'une série ; variante acceptation administrative | **P**. CP-35 exige même espace ou acceptation, mais `paraitre_dans` ne porte que série, publication, rang et versions : aucun acte d'acceptation étranger identifiable. UQ rang sur liens actifs, sans statut accepté. Il faut une preuve relationnelle de l'acceptation ou interdire le cas hors espace. |
| AC-10 / NC-07 | Version proposée changeant accès ; variante réduction issue de proposition ajoutant X ; variante accord révoqué après deux acceptations | **P**. MLD-16, CP-36/39 distinguent versions active/en vigueur. CP-33 dit encore «figées à sa confirmation» après règle insertion seule. Réduction non explicitement calculée depuis active. CP-36 `active ⇔ existe version acceptée` force active même après suspension/révocation conservant acceptations historiques. Remplacer biconditionnelle et préciser cycle et base de réduction. Accès révocation sélection : autre revue. |
| AC-14 | Contribution refusée réexposant base retirée ; variante delta contenant création personnelle | **C**, CP-27 impose delta/identifiants seuls, le DDL §5.6 décrit le delta ; auteur seul conserve contribution refusée. Pas de preuve réelle de sérialiseur. |
| AC-15 | Invalidation par traitement IA ; variante décision approuvée automatique | **C pour origine automatique**, CK `decision_editoriale` et complément CP-35 distinguent invalidation et relue/approuvée/refusée humaine. Métadonnées gouvernance : autre revue. |
| AC-17 | Deux membres déposent même binaire ; variante purge premier puis second | **C**, CP-41 : fichier logique par dépôt, envoi/délai/quota indépendants, binaire retiré quand aucune référence légitime ; aucune UQ empreinte dans fichier. Les délais restent obligation technique, pas test DB. |
| AC-18 | Export listant existence protégée ; variante motif embargo utilisé pour même objet | **C documentaire sous CP explicite**, §18 `export_exclusion` interdit tout listage/nommage des objets à existence protégée, quel que soit le code motif. Domaine seul ne suffirait pas ; le commentaire normatif ferme aussi la variante. |
| AC-19 | Participation valable de 1790 à 1810 ; variante période 1810→1790 | **P**, §10.1 ajoute temps_fin et discriminant, donc représentation fidèle. Mais dictionnaire §1.2 exige début ≤ fin lorsque bornés ; la macro ph et les deux groupes temps/temps_fin n'ont pas de CK inter-groupes. La période inversée passe. Ajouter contrainte générique de cohérence des bornes, sans convertir une incertitude en dates exactes. NC-15 demeure partiel ci-dessous. |
| AC-20 | Acquisition information amont justification ; variante acquisition documentaire | **C**, §4.3 `dependance.amont_type`, FK composite et CK excluent les deux acquisitions, badge, narration et lien exploratoire pour justification. |
| AC-21 | Base en vigueur vide ; variante transcription sans segment au premier jalon | **C documentaire**, CP-05 énonce les quinze minima et leur jalon. La preuve opérationnelle différée reste à exécuter au MPD. |
| AC-22 | Ancienne cote purgée redevient actuelle par date NULL ; variante candidature retenue purgée/nœud purgé | **C pour contre-exemples audités**, UQ cote, candidature, nœud contiennent NOT est_purge. Attention : autres UQ d'objets, notamment référentiel/concept et référence inter-espace, n'ont pas toutes ce filtre ; exigence globale «toute UQ objet» à formaliser ou exceptions à justifier. |
| AC-23 | Association ajoutée à snapshot existant ; variante clôture association existante | **C**, CP-01/22 exigent nouvelle version propriétaire pour insertion/clôture [A:p], v_debut/v_fin nouveaux, aucun rattachement rétroactif. |
| AC-24 | Purger consentement biométrie ; variante purge export/fichier/concept | **P**, NN* consentement, protection personne, mémoire réponse et textes signalés corrigés. MLD-15 préserve toujours globalement codes/horodatages, alors DD-27 exige trace minimale. `fichier.format text NN`, `fichier.empreinte hash NN`, `export.version_format text NN`, `export.empreinte_paquet hash NN` restent contenu non purgeable ; pas de liste exhaustive explicite des codes retenus. Revoir CK couplés et toutes hiérarchies/historiques avec une politique explicite. |
| AC-25 | Effacer résolution témoignage créé manuellement ; variante activité ayant plusieurs sorties et entrées liées | **O**, version_objet nullable sous résolution effacée et UUIDv4 corrigés. Mais `activite.date_debut NN`, CK manuel ⇒ acteur non NULL, équivalence acteur/role : CP-16 vide acteur mais pas role et peut vouloir vider date. `activite_perimetre_transmis`, `activite_entree`, `activite_methode`, `activite_referentiel` restent référents résolutifs sans neutralisation explicite. Définir exceptions de CK et politique activités partagées sans détruire traçabilité d'autres sorties. |
| AC-26 / NC-13 | Supprimer compte conservé en tombstone ; variante notification/blocage de ce compte | **P global**, email/identité nullable et registre pseudonyme corrigés ; CP-16 supprime explicitement données techniques. MLD-15 affirme encore cascade depuis compte (soft delete ne la déclenche pas). Aligner procédure, clôture des liens compte et exceptions de rétention justifiées. |
| AC-27 | Changer espace objet via nouvelle version ; variante format fichier ou nature assertion | **C documentaire**, CP-52 règle générale générée marques F ; purge/effacement exceptions explicites. Aucune preuve automatisée de génération n'est produite ici. |
| AC-28 | DI-C01 revendiquée vérifiée via simple mention CP-13 ; variante DI-O06 méthode IA générative | **O**, CP-13 n'énonce pas ces règles, les liste. Voir inventaire ci-dessous. Les CK/CP spécifiques ajoutées ferment DI-A10, A12, A27, A37, C15, K11, K12, K18 ; cela ne ferme pas les 207 lignes collectivement. |
| AC-29 | Trois décisions rattachement ; variante nouveaux refus/terminaison historisés | **C**, dictionnaire DECIDER_RATTACHEMENT (0,n), CP-31 journal et transitions. |
| AC-32 | Indicateur de sous-projet publié ; variante calcul direct données sources privées | **C**, CP-34 voie résultat figé évalué, aucune action agréger, aucun droit sur sources. |
| NC-09 | Cousin familial hors ligne indéfiniment ; variante objet personnel non public | **A**, CP-28 remplacement V1.6 traite échéance ; vérification schéma réplique par autre revue. |
| NC-10 | Pseudonyme d'autre objet/contexte ; variante évaluation ancienne hors audience actuelle | **P**, CP-33 exige masquage même objet/type propre sélection. L'audience/version de l'évaluation n'est pas explicitée par ce paragraphe ; vérifier règle complète autorisation dans autre revue. |
| NC-11 | Structure non reportée dictionnaire ; variante statut DI-P13 et colonne portée CP01 | **P**, annexe L.6 reporte structures scientifiques mais matrice §25.4 garde preuves anciennes et CP-01 portée n'inclut pas [A:p] malgré énoncé. Corriger synchronisation documentaire complète. |
| NC-12 | Commentateur externe légitime synchronise ; variante espace inexistant | **A / résidu explicite**, CP-50 dit toujours «jamais eu appartenance», alors droit commentaire peut exister sans appartenance. Signalé à l'autre revue. |
| NC-15 | Situation portant période différente en temps ; variante date temps 1900 et extension début/fin 1790–1810 | **P**, CK profil situation ⇒ temps_forme=date ferme double période mais admet date contradictoire sans contrainte. Dictionnaire §9.1 dit utiliser date_debut/date_fin. Exiger groupe temps entièrement vide pour situation, ou cohérence explicite de toute date résiduelle. |

Constats réservés entièrement à l'autre revue : AC-01/02/03/04/06/08/11/12/13/16/30/31 ; NC-01/02/03/04/05/08/14. AC-05/07/10/15/18 et NC-06/07/10/11 sont transverses : leurs verdicts finaux doivent réunir les deux revues.

## Contrôle de la couverture DI

L'outil en lecture seule `spec/validation/controle_donnees.py` inventorie 304 lignes uniques dans §25.4. Au début de cette revue, 200 lignes portent encore la preuve «contrôle des 207 lignes» ; l'archive V1.1-e en porte 216. Le nombre 207 ne correspond donc plus à un ensemble reconstructible avec cette seule étiquette. Ne pas annoncer «207 indépendamment vérifiées» sans fixer une liste de population historique et traiter tous ses membres. Une couverture de toutes les 304 règles actuelles serait plus simple à maintenir.

28 lignes portant la preuve de contrôle historique renvoient à CP-13 : DI-B15, B22, B25, C01, C02, C04, C14, D03, E02, E08, F03, F09, F10, G04, G05, G12, I01, J02, J06, K03, K05, K10, K16, N01, O06, O07, P01, P03. Certaines autres contraintes corroborent une partie de leur règle, mais leur simple mention dans CP-13 ne prouve pas la condition métier intégrale. Le défaut invalide le bilan «0 partielle, 0 absente» de §25.4.

Pour clôturer AC-28, chaque ligne doit indiquer : énoncé normatif entier, table et colonnes porteuses, CK/FK/UQ ou procédure explicite (condition, opération, rejet/effet), scénario d'origine et variante, statut documentaire indépendant et réserve d'exécution MPD. CP-13 peut être décliné en CP-13/DI-xxx avec énoncé du dictionnaire et portée ; il ne faut pas transformer un simple nom de table en preuve de règle. La règle C de la nullabilité exige notamment une condition dans les deux sens, pas une implication affaiblie.

## Corrections minimales proposées avant seconde passe

1. Remplacer CP-13 nominal par énoncés normatifs individuels, requalifier et contrôler matrice DI entière.
2. Corriger visibilité/unicité bases et choix d'espace (NC-06).
3. Rendre effectivement exécutables purge et effacement de résolution (AC-24/25), y compris CK et tables enfants ; expliciter rétentions et activités partagées.
4. Stabiliser transitions version active/en vigueur, réductions, acceptation inter-espace série et anciennes phrases contradictoires.
5. Harmoniser soft suppression compte et sémantique temps situation.

Ces propositions ne changent pas les arbitrages V1.6 gelés. Une correction qui exige une nouvelle politique métier doit rester candidate jusqu'à décision du porteur. Une seconde passe contre les documents corrigés est nécessaire pour remplacer les statuts P/O par un avis de clôture étayé.

## Seconde passe — V1.1-g, 12 octobre 2026

Cette section prévaut sur les statuts initiaux ci-dessus. Les constats initiaux sont conservés pour permettre de suivre précisément la correction.

Contrôles relancés par le contrôleur indépendant : `python spec/validation/controler_documents.py --strict` et inventaire `controle_donnees.inventory()`. Résultat : 326 tables, 494 références FK sans cible absente, matrice 304 DI, 285 définitions DI actuelles, aucun DI défini sans ligne de matrice ; 60 CP-13 exigées, 60 présentes, aucun énoncé différent de sa source. L'étiquette de preuve historique «contrôle des 207 lignes» n'est plus utilisée dans la matrice. Le remplacement de ces étiquettes par «obligation documentaire candidate» est fidèle à la portée réelle du contrôle.

### Rejeu des corrections et nouveaux contre-exemples

| Constats | Origine et variante rejouées | Verdict documentaire seconde passe |
|---|---|---|
| AC-05 / NC-06 | Deux bases projet auteurs différents ; base privée / assertion inaccessible dans choix commun | Corrigé : CK privée ⇔ auteur non nul, auteur projet nul donc UQ commune ; CP-49 précontrôle droit d'écriture/visibilité cible avant unicité, représentation ≤ extrémités et perte visibilité filtrée. Vérifier aussi fusion des doubles WHERE ci-dessous. |
| AC-09 | Numéro autre espace sans autorité ; acceptation concernant une autre paire | Corrigé : `parution_acceptation` porte paire et signataire ; `paraitre_dans.acceptation_id` FK ; CP-35 impose décision acceptée, autorité sur espace série et identité des deux publications avant test rang. |
| AC-10 / NC-07 | Proposition v4 avec ajout puis réduction ; révocation sélection et suspension accord après acceptation | Corrigé : CP-33 réduit depuis version active, interdit accès révoquée/close et fige dès création ; CP-36 implication active ⇒ version acceptée, aucune réactivation par proposition. Les commentaires contradictoires du manifeste sont retirés. |
| AC-19 / NC-15 | Période 1810→1790 ; situation temps 1900 et extension 1790–1810 | Corrigé : macro ph et CK assertion excluent début_min > fin_max ; temps_type et temps_fin_type vides pour situation, DATE_HIST vide est tout vide selon règle générale de groupe. L'incertitude conservée n'est pas convertie en date exacte. |
| AC-22 / AC-24 | Cote purgée et fichier/export purgés ; associations historiques reconstructives | Les champs de sous-types sont NN*, CK dépendants dispensés sous est_purge et UQ d'objets excluent est_purge. MLD-15 et CP-16 retirent codes sensibles, historiques et références reconstructives ; présence minimale conditionnée à non-purge propriétaire. **Régression documentaire détectée** : doubles WHERE dans base_justificative, identifiant_documentaire et element_reconstruit. Un seul WHERE doit garder prédicat initial et non-purge. |
| AC-25 | Activité manuelle effacée ; activité partagée avec autre sortie ; objet de trois versions | NN† et CK sous resolution_effacee permettent désormais neutraliser acteur/role/dates, CP-16 couvre tables enfants et projection d'activité partagée. **Dernier contre-exemple ouvert à cette passe** : vider date_fin_validite des trois versions les fait entrer toutes dans UQ `(objet_id) WHERE date_fin_validite IS NULL`. Exclure les versions resolution_effacee de cette UQ et du calcul de version courante. |
| AC-26 / NC-13 | Suppression logique compte ; données techniques conservées par cascade absente | Corrigé : MLD-15/CP-16 explicitent effacement dans transaction logique, pas cascade depuis une ligne conservée ; registre pseudonyme demeure. |
| NC-10 | Pseudonyme d'autre objet ; évaluation autre audience/version | Corrigé : CP-33 exige même objet/type propre sélection et évaluation favorable pour audience et version active à l'instant d'accès. |
| NC-11 | CP-01 portée omettant A:p ; matrice prétendument vérifiée | Corrigé par portée étendue et matrice requalifiée ; les contraintes détaillées sont des obligations logiques à réaliser, pas des tests DB passés. |
| NC-12 | Commentateur externe sans appartenance ; espace inexistant | Corrigé : CP-50 distingue droits écriture/commentaire de l'appartenance et réception en espace personnel pour cible jamais autorisée. |
| AC-28 | Simple liste CP-13 ; méthode generative revendiquée statistique | Corrigé au niveau de l'énoncé et de la preuve documentaire : §21.3 contient 60 contraintes intégrales, portée, refus atomique/effet ; source identique. Scénarios complémentaires ci-dessous. L'intégralité sémantique des autres 244 DI n'est pas prouvée par le seul inventaire structurel. |

### Scénarios des obligations détaillées CP-13

Chaque ligne renvoie au sous-paragraphe `CP-13/DI-xxx` du §21.3 et à la fiche DI correspondante du dictionnaire. La règle générale du §21.3 impose le contrôle après toute modification des faits, avec refus atomique ou effet prescrit : les deux opérations ci-dessous qui violent l'énoncé doivent donc être refusées ou ne produire aucun fait scientifique interdit. **Verdict commun : conforme documentaire, recette logicielle non exécutée.** Les variantes de confidentialité doivent être croisées avec l'autre revue.

| DI | Scénario d'origine | Variante indépendante |
|---|---|---|
| A28 | Base publique invoque preuve privée brute | Ajouter après coup preuve non diffusable à base publique existante |
| A32 | Import sans source marqué sourcé | Réimport corrige texte mais demeure sans provenance et conserve sourcé |
| A33 | Acquisition achat affirme existence documentaire | Acquisition photographie ajoute responsabilité historique du donateur |
| B15 | Applicabilité sur dérivé sans dépendance au restreint | Retirer dernière dépendance d'un dérivé ayant décision persistante |
| B16 | Absence décision permet diffusion dérivé restreint | Supprimer décision favorable et conserver autorisation du dérivé |
| B22 | Masquage qualifié anonymisation avec lien public original | Ajouter un chemin public indirect après anonymisation |
| B25 | Traiter biométrie vivant sans accord | Continuer après retrait du consentement correspondant |
| C01 | Prescription seule promue existence attestée | Assertion existence sans ancre utilisée pour promotion |
| C02 | Exemplaire conservé mais document prescrit seulement | Ajouter premier exemplaire conservé sans corriger état document |
| C03 | Anomalie affirme document disparu | Anomalie retirée restaure automatiquement statut ancien |
| C04 | Document témoignage sans session productrice | Session produit document classé acte administratif |
| C07 | Ordre historique reconstruit sans interprétation | Retirer l'interprétation du lien d'ordre existant |
| C12 | Ancrages recopiés sur autre reproduction sans alignement | Alignement retiré mais ancrage dérivé reste utilisable |
| C14 | Zone image dépasse largeur vue | Zone audio dépasse durée piste |
| C19 | Déclaration source externe crée document automatiquement | Déclaration modifiée crée document à la prochaine tâche automatique |
| C21 | Source déclarée non identifiée permet provenance sourcée | Source perd identification après assertion initialement sourcée |
| D03 | Transcription achevée sans protocole accompli | Protocole accompli porte autre document |
| D06 | Mention nominale crée automatiquement personne | Nouvelle lecture d'une mention déclenche création d'une autre personne |
| E02 | Personne Core créée sans trace | Trace présente mais note individualisation absente ; hors Core aucun nom requis |
| E08 | Étape attestée sans assertion ancrée | Dernier ancrage retiré d'étape déjà attestée |
| E09 | Deux présences créent automatiquement voyage | Traitement crée étapes intermédiaires entre présences |
| F03 | Plausibilité forte sans argument pour | Nom rare seul assimilé argument probant suffisant |
| F06 | Position transformée en personne même identifiant | Résolution supprime position au lieu de retenir candidate |
| F09 | Rapprochement personne/lieu | Rapprochement entité avec elle-même |
| F10 | Présentation fusionnée verdict incertain | Verdict même entité sans validation, ou suppression d'identifiant |
| F11 | Proposition même entité omet verdict distinct existant | Proposition contraire nouvelle version garde argument qui ne cite pas verdict |
| G04 | Assertion tiers sans responsabilité déclarant | Responsabilité simple copiste utilisée comme informateur |
| G05 | Assertion négative sans source | Recherche négative transformée automatiquement en assertion négative |
| G07 | Causalité sans statut/source/argument | Cooccurrence calculée génère relation causale |
| G08 | Points attestés représentés période continue | Trois observations interpolées en continuité attestée |
| G10 | Traduction même sens crée nouvelle assertion | Traduction sens différent reste expression de même assertion |
| G12 | Conclusion partagée sans base en vigueur | Dernière base passe insuffisante mais conclusion demeure diffusée |
| G15 | Phase proposée automatique marquée examinée | Nouvelle phase provenant IA reprend état examen d'une phase précédente |
| G17 | Exposition possible promue réception attestée sans trace | Nouvelle version change niveau après simple recalcul de proximité |
| H07 | Proposition acceptée sans nouvelle version/crédit | Nouvelle version créée mais activité ne cite pas proposition |
| H09 | Fusion automatique de deux interprétations contradictoires | Correction de date métier qualifiée non sémantique pour fusion |
| I01 | Reconstruction d'un document complet conservé/localisé | Changer cible de reconstruction vers document complet |
| I04 | Saut numérotation comblé automatiquement | Élément utile explicite créé comme attesté sans trace |
| I07 | Anomalie change existence document | Résolution d'anomalie change statut automatiquement |
| J02 | Audio témoignage diffusé sans consentement audio | Consentement audio sert à diffuser transcription sans portée correspondante |
| J06 | Réponse après indice sans indice | Indice autre échange ou chronologiquement postérieur |
| J12 | Délivrance capsule lève embargo | Délivrance crée habilitation implicite malgré protection |
| K02 | Projet transmis sans successeur effectif | Successeur désigné mais garde hors dates d'effet |
| K03 | Question suffisamment traitée sans application accomplie | Protocole accompli sur autre question |
| K05 | Insolubilité documentée sans recherche exhaustive | Recherche exhaustive sans justification utilisée pour insolubilité |
| K07 | Piste source suggérée crée document | Même suggestion crée assertion existence documentaire |
| K10 | Recherche négative produit assertion absence | Consultation partielle produit lacune exhaustive sans résultat |
| K16 | Application accomplie avec critère restant | Critères d'une autre version protocole servent accomplissement |
| K19 | Règle portée registre sans lien au registre | Règle portée corpus reliée seulement à une personne |
| M01 | Contribution Connect sort espace sans consentement adapté | Contribution au Core opérée sans opération de flux séparée |
| N01 | Géométrie plus précise que fondements | Ancienne précision fine conservée après fondement devenu approximatif |
| N03 | Géométrie reconstruite sans calcul/provenance | Retirer calcul en conservant représentation reconstruite |
| N05 | Ligne entre présences sans assertion déplacement | Trajet reconstruit affiché avec symbole de déplacement attesté |
| O06 | Méthode statistique fait appel IA générative | Changer code méthode existante en génératif sans requalifier résultats |
| O07 | Reproduction calcul emploie autre méthode version | Mêmes identifiants mais versions corpus/snapshot différentes |
| O11 | Indicateur produit relation historique | Cooccurrence exportée comme relation causale |
| O12 | Résultat exposé à audience plus large sans évaluation | Nouvelle diffusion élargit audience sans nouvelle évaluation |
| P01 | Publication expose version sans évaluation | Version suivante conserve évaluation de précédente |
| P03 | Publication indexable expose version découvrabilité interne | Ajouter version non indexable à publication déjà indexable |
| P07 | Export inclut champ de confidentialité I | Champ I imbriqué dans manifeste annexe ou métadonnée |

**Limite de couverture indépendante.** Les 304 lignes ont été inventoriées, leurs énoncés CP-13 comparés et les constats anciens rejoués ; ce rapport n'annonce pas 304 règles testées sémantiquement sur une base. Le MPD doit exécuter les recettes sur les tables produites, y compris contraintes différées, concurrence, purge historique, visibilité et égalité des observations.

### Dernier contrôle des correctifs de seconde passe

Les dernières corrections rendent conforme documentaire AC-25 : UQ de version_objet exclut `resolution_effacee`, CP-02 dispense les versions neutralisées du courant et de la continuité temporelle ; les trois versions peuvent être neutralisées sans entrer en conflit entre elles. Les activités NN†, leurs CK et projections reconstructives sont couvertes par CP-16. Les 304 règles ont maintenant toutes une définition actuelle dans le dictionnaire (annexe L.9 réénonçant les 19 règles d'autorisation remplacées).

Une erreur de rédaction résiduelle a été signalée dans la fusion des trois WHERE : le commentaire `--` est placé avant la parenthèse fermante et l'ajout final `AND NOT est_purge`, ce qui masque cette fermeture dans la lecture DDL. La forme finale doit être `WHERE prédicat_original AND NOT est_purge -- commentaire`, avec aucune parenthèse fermante dans le commentaire. Ce point est purement documentaire mais doit être corrigé avant l'avis final.

**Avis à ce point :** les défauts métier/documentaires du périmètre données identifiés lors de la première passe ont une réalisation corrigée ; la clôture documentaire devient acceptable dès cette ultime correction de syntaxe. La clôture finale des constats transverses exige l'autre rapport. La validation/gel appartient au porteur et ce rapport ne la prononce pas.

**Avis final après relecture des trois UQ corrigées :** la syntaxe résiduelle est corrigée : base `WHERE statut = 'en vigueur' AND NOT est_purge`, cote `WHERE type = 'cote actuelle' AND date_fin_type IS NULL AND NOT est_purge`, élément `WHERE numero IS NOT NULL AND NOT est_purge`, commentaires après les prédicats complets. Aucun constat scientifique/purge de cette revue ne reste sans correction documentaire dans V1.1-g. **Avis favorable à la clôture documentaire dans ce périmètre**, avec limites d'exécution MPD ci-dessus et verdict transverse à réunir avec l'autre revue. Aucun gel décidé par le contrôleur.

### Complément ciblé NC-12 et DI-A12

Après approfondissement de NC-12, la conservation d'une cible inexistante ne doit pas tenter de remplir les FK métier de contribution_differee. La correction V1.1-g introduit `reception_differee [T]` : seuls auteur/espace personnel sont des FK ; espace cible, objet/numéro de base et référentiel/version déclarés restent valeurs client sans FK vers ces cibles. Le delta est privé de l'auteur, sans état de base ; succès réception ne prouve pas existence/autorisation. La contribution métier, conservée dans l'espace personnel et portant `reception_id`, n'est construite qu'après résolution autorisée. Scénario espace fictif et variante commentaire autorisé sans appartenance : delta conservable avant toute résolution, droits réévalués à l'intégration. **Verdict NC-12 conforme documentaire**, aucun test de transport/DB réel.

Le dictionnaire ACTIVITE définit désormais `perimetre_donnees_transmises` comme association contrôlée réalisée par `activite_perimetre_transmis`, sans liste textuelle libre ; annexe L.6, DI-A12 et CP-53 concordent. Une projection textuelle conservée dans le MLD ne doit pas être une seconde source de vérité : table enfant et contrôles R/I demeurent normatifs. Cette clarification ne change aucune autorisation métier.
