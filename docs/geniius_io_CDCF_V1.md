# GENIIUS --- CDCF V1.2

## Référentiel fonctionnel, conceptuel et explicatif --- version développée

**Statut :** référentiel maître de cadrage — **V1.2** = V1.1 + avenant AV-FONC-001 (Partie XXI, §§ 119–134 ; CU-26 à CU-31 ; critères 51 à 64)\
**Date :** 7 octobre 2026 (V1.1) ; 9 octobre 2026 (V1.2)\
**Objet :** développer le CDCF V1 en explicitant les intentions, les
problèmes résolus, les règles, les conséquences fonctionnelles, les
limites et les cas de vérification.

------------------------------------------------------------------------

# Comment lire ce document

Cette version n'est volontairement pas un « cahier des charges court ».
Elle doit pouvoir servir, plus tard, à plusieurs personnes qui n'auront
pas participé aux échanges de cadrage : product designer, développeur,
data engineer, historien, généalogiste, archiviste, juriste,
association, partenaire patrimonial ou futur collaborateur.

Pour cette raison, une règle n'est pas seulement énoncée. Chaque fois
que nécessaire, le document cherche à répondre à six questions :

1.  **Quel problème réel cherchons-nous à éviter ou résoudre ?**
2.  **Quelle décision GENIIUS prend-il ?**
3.  **Comment cela doit-il se traduire fonctionnellement ?**
4.  **Qu'est-ce que GENIIUS ne doit surtout pas faire ?**
5.  **Quel exemple permet de comprendre la règle ?**
6.  **Comment vérifier plus tard que le produit respecte réellement la
    décision ?**

Le but n'est pas d'enfermer l'implémentation technique. Deux
architectures logicielles différentes pourront satisfaire la même
exigence. En revanche, une architecture qui détruit la provenance,
écrase l'incertitude ou transforme le Core en arbre généalogique mondial
ne respectera pas GENIIUS, même si son interface est séduisante.

------------------------------------------------------------------------

# PARTIE I --- Pourquoi GENIIUS doit exister

## 1. Le problème de départ

La recherche généalogique et historique produit une masse de
connaissances qui ne rentre pas correctement dans les outils classiques.

Un arbre généalogique sait généralement très bien représenter que Pierre
est le père de Marie. Il sait beaucoup moins bien représenter :

-   qu'un document de 1793 mentionne une « Marguerite » dont l'identité
    avec une Marguerite de 1802 est seulement probable ;
-   que trois chercheurs ont proposé trois lectures différentes d'un
    patronyme ;
-   qu'une personne apparaît dans une habitation sans que l'on sache
    encore à quelle famille la rattacher ;
-   qu'un registre aujourd'hui disparu peut être partiellement
    reconstruit à partir d'actes postérieurs ;
-   qu'une tante se souvient d'un surnom sans savoir à qui il correspond
    exactement ;
-   qu'une recherche a déjà été menée dans une série d'archives et n'a
    rien donné ;
-   qu'une carte historique repose sur des limites seulement relatives ;
-   qu'une conclusion considérée solide en 2028 doit être réexaminée en
    2031 après correction d'une identification.

GENIIUS part de ce constat : **la connaissance historique est plus riche
que la somme des fiches individuelles d'un arbre**.

## 2. Ce que l'on cherche réellement à préserver

Le patrimoine à préserver n'est pas seulement la conclusion finale.

Il comprend également : - les documents ; - les reproductions ; - les
lectures ; - les mentions ; - les témoignages ; - les incertitudes ; -
les raisonnements ; - les questions ; - les recherches négatives ; - les
variantes ; - les désaccords ; - les méthodes ; - les états successifs
de la connaissance.

Si l'on conserve uniquement « Charles TANCRÈDE est mort le 2 février
1890 », on perd la manière dont cette information a été établie, la
source précise, les autres étapes de sa trajectoire et les questions
encore ouvertes.

GENIIUS doit donc préserver **la connaissance et sa généalogie
intellectuelle**.

## 3. Une ambition patrimoniale

Le projet porte une ambition particulière pour les personnes
historiquement sous-documentées.

Une personne connue par une seule ligne d'inventaire a existé autant
qu'un gouverneur documenté par des centaines de dossiers. Le logiciel ne
doit pas confondre abondance documentaire et importance humaine.

Cette exigence devient particulièrement forte pour : - personnes
réduites en esclavage ; - populations colonisées ; - personnes pauvres
; - femmes peu présentes dans certaines archives ; - enfants ; -
migrants ; - personnes sans descendance connue ; - lignées interrompues
; - individus connus seulement sous un prénom ou une désignation.

GENIIUS doit être capable de préserver leur trace sans attendre qu'elles
puissent être raccordées à un arbre moderne.

------------------------------------------------------------------------

# PARTIE II --- Doctrine épistémique expliquée

## 4. Pourquoi « source », « mention », « assertion » et « preuve » doivent être séparées

### Le problème

Un logiciel classique transforme souvent directement un document en
champ de base de données.

Exemple : un acte indique « Charles, âgé de 30 ans ».

Le logiciel pourrait stocker : `birth_year = 1851`.

Ce raccourci est dangereux. La source n'a pas déclaré 1851. Elle a
déclaré un âge à une date donnée. L'année de naissance est un calcul.

### Décision GENIIUS

GENIIUS doit conserver plusieurs couches :

**Source** --- le document existe.

**Zone de source** --- l'information se trouve précisément à tel
endroit.

**Transcription/observation** --- ce que l'on lit ou observe.

**Mention** --- une occurrence de quelque chose dans cette source.

**Identification** --- l'hypothèse selon laquelle cette mention
correspond à une entité historique.

**Assertion** --- proposition structurée sur le monde historique.

**Dérivation** --- résultat calculé à partir d'autres informations.

**Conclusion** --- interprétation raisonnée pouvant agréger plusieurs
assertions.

### Exemple

Document : \> « Charles TANCRÈDE, âgé de 30 ans... »

GENIIUS peut représenter :

-   transcription : « âgé de 30 ans » ;
-   assertion : Charles a un âge déclaré de 30 ans à la date de l'acte ;
-   dérivation : intervalle théorique de naissance compatible ;
-   autre source : naissance au 27 août, si trouvée ;
-   comparaison : compatibilité ou contradiction.

La dérivation ne réécrit jamais la source.

### Ce que cela évite

Cela évite qu'une estimation devienne, au fil des exports et recopies,
une fausse date de naissance « sourcée ».

### Critère de vérification

À partir d'un âge déclaré, l'utilisateur doit toujours pouvoir savoir
: - ce que disait exactement le document ; - quel calcul a été fait ; -
selon quelle méthode ; - quelles hypothèses ont été utilisées.

------------------------------------------------------------------------

## 5. Pourquoi une mention n'est pas automatiquement une personne

### Le problème

Un recensement, un acte notarié ou une liste peut contenir des centaines
de noms, surnoms, rôles ou descriptions. Créer automatiquement une
entité Personne pour chaque chaîne de caractères produit des doublons et
de fausses individualisations.

À l'inverse, exiger nom + prénom + date de naissance avant de créer une
personne ferait disparaître précisément les individus les moins
documentés.

### Décision

Toute occurrence documentaire peut exister d'abord comme **Mention**.

Une entité Personne est créée lorsqu'un chercheur estime qu'il existe
assez d'éléments pour individualiser un être humain, même de manière
très incomplète.

Il n'existe pas de seuil universel.

### Cas A --- personne individualisable sans nom

Une source décrit : \> « la mère des quatre enfants logés dans la case
n°7 »

Si cette femme est clairement un individu distinct, elle peut devenir
une Personne historique même sans nom.

### Cas B --- position relationnelle non individualisée

Une source dit : \> « l'un des fils de Jean DUPONT »

On connaît Pierre, Louis et François comme fils possibles.

GENIIUS ne crée pas un quatrième fils « Inconnu DUPONT ». Il conserve
une structure non résolue et des candidats.

### Cas C --- liste de 24 personnes dont une seule identifiée

GENIIUS peut représenter le collectif de 24 personnes et progressivement
individualiser ses membres, sans fabriquer immédiatement 23 entités
fictivement précises.

### Conséquence majeure

Le Core peut accueillir l'incomplétude comme état normal de la
connaissance historique.

------------------------------------------------------------------------

## 6. Pourquoi l'identification doit rester une hypothèse

### Le problème

Le même prénom, le même nom, le même métier ou le même village ne
suffisent pas à démontrer qu'il s'agit de la même personne.

Une erreur de rapprochement est particulièrement dangereuse : elle peut
contaminer une famille entière, une chronologie, une carte, des
statistiques et des publications.

### Décision

Le lien : `Mention documentaire → Personne historique` est une
**proposition d'identification**.

Elle peut avoir : - auteur ; - date ; - arguments pour ; - arguments
contre ; - état de validation ; - historique.

### Exemple

Deux actes mentionnent Jean CARMEN.

Arguments favorables : - même habitation ; - même métier ; - mêmes
proches.

Arguments défavorables : - âges incompatibles ; - deux signatures
simultanées ; - événements contemporains en lieux incompatibles.

GENIIUS doit permettre de conclure : - même personne ; - personnes
distinctes ; - indéterminé ; - ancienne identification rejetée.

### Garde-fou

Un nom rare ne constitue pas une preuve suffisante.

------------------------------------------------------------------------

## 7. Pourquoi le doublon historique peut être préférable à la fusion

Une base de données classique considère le doublon comme une erreur
technique.

En histoire, deux fiches similaires peuvent représenter : - un doublon
réel ; - deux homonymes ; - une personne ayant changé de nom ; - deux
personnes que l'on ne sait pas encore distinguer.

GENIIUS distingue donc :

**Doublon technique** : même fichier importé deux fois, même identifiant
stable, même objet numérique certain. Peut être dédupliqué
techniquement.

**Doublon historique possible** : deux entités qui pourraient être la
même personne. Doit être traité comme question de recherche.

Règle : \> Le doublon historique incertain est préférable à la fausse
identité certaine.

------------------------------------------------------------------------

## 8. Pourquoi les contradictions doivent survivre

### Le mauvais modèle

Une fiche : `profession = cultivateur`

Puis nouvelle source : `profession = charpentier`

Si le second champ remplace le premier, on perd l'histoire.

### Le modèle GENIIUS

On conserve : - cultivateur, attesté à telle date/source ; -
charpentier, attesté à telle date/source.

Peut-être : - changement de métier ; - activités simultanées ; - erreur
d'une source ; - homonymie.

La contradiction est parfois une information de recherche.

------------------------------------------------------------------------

## 9. Deux temps : histoire et connaissance

GENIIUS manipule simultanément :

### Temps historique

Quand l'événement s'est produit.

### Temps épistémique

Quand nous l'avons appris, proposé, validé, contesté ou corrigé.

Exemple : - décès : 1890 ; - document découvert : 2027 ; -
identification proposée : 2028 ; - contestée : 2030 ; - nouvelle
conclusion : 2031.

Le système doit pouvoir répondre : \> « Que pensions-nous en 2029 ? »

et pas seulement : \> « Quelle est la synthèse actuelle ? »

------------------------------------------------------------------------

# PARTIE III --- Le Core expliqué

## 10. Pourquoi le Core n'est pas un arbre mondial

Un arbre généalogique impose une logique centrée sur les personnes et
les liens familiaux.

Or un projet peut commencer par : - l'habitation Dolé ; - un navire ; -
une étude notariale ; - un quartier ; - un convoi ; - une prison ; - un
registre disparu.

Le Core est donc un **graphe de connaissance historique**, pas un arbre
généalogique universel.

Les Personnes sont importantes, mais elles coexistent avec : - lieux ; -
organisations ; - événements ; - situations ; - collectifs ; - documents
; - objets ; - fonctions ; - phénomènes ; - concepts.

## 11. Pourquoi le Core doit pouvoir exister sans Tree

Prenons un inventaire d'habitation en 1793 contenant 200 personnes.

Certaines : - ne seront jamais reliées à un descendant ; - mourront
avant 1848 ; - n'auront qu'un prénom ; - n'apparaîtront dans aucun Tree
contemporain.

Si le Core dépend du Tree, ces vies deviennent invisibles.

Décision : \> l'existence historique d'une personne dans GENIIUS ne
dépend jamais de son utilité généalogique contemporaine.

## 12. Pourquoi le Core peut être privé

« Core » décrit une manière de modéliser la connaissance, pas
automatiquement une base publique.

Une famille doit pouvoir utiliser : - assertions ; - sources ; -
hypothèses ; - événements ; - provenance ;

dans un espace totalement privé.

Ainsi : \> utiliser GENIIUS ≠ contribuer au Core partagé.

## 13. Contribution et import sont deux actes opposés

### Contribution

Tree/espace privé → Core partagé.

L'utilisateur décide de mettre une connaissance dans l'espace commun.

### Import

Core partagé → Tree/espace privé.

L'utilisateur décide d'utiliser une connaissance commune dans son propre
contexte.

### Comparaison

Tree A ↔ Tree B.

Deux utilisateurs collaborent sans devoir publier leurs informations
dans le Core.

Ces trois flux doivent être séparés dans l'interface, les permissions et
l'audit.

------------------------------------------------------------------------

# PARTIE IV --- Rebond expliqué

## 14. Pourquoi Rebond est plus qu'un OCR

OCR/HTR peut produire du texte.

Mais le problème scientifique est ensuite : - où ce texte se trouve-t-il
exactement ? - qui est mentionné ? - à quelle entité cela correspond-il
? - quelle assertion peut-on en tirer ? - avec quel degré de certitude
? - qui a fait cette interprétation ?

La valeur de Rebond réside dans le **chemin de connaissance**.

## 15. Le principe du rebond

Un chercheur part d'un document.

Il rencontre : - Charles ; - une habitation ; - un témoin ; - une
profession ; - un navire.

Il peut « rebondir » vers chacun de ces objets et explorer leurs propres
traces.

Le document devient une porte d'entrée dans le graphe.

## 16. Exploiter une source sans la « fermer »

L'ambition est de capitaliser une lecture déjà effectuée.

Un acte notarié peut contenir : - personnes ; - biens ; - lieux ; -
montants ; - témoins ; - relations ; - signatures.

Une exploitation complète évite à dix chercheurs de recommencer
exactement le même travail.

Mais le mot « complet » est dangereux.

On doit dire : \> « exploitation exhaustive selon le protocole X »

car une future question peut révéler une dimension non extraite.

## 17. Lecture indépendante

Capitaliser le travail collectif peut créer un biais.

Si je vois que trois personnes ont lu « CHARBONNÉ », je risque de lire
la même chose.

Rebond doit donc permettre : - lecture assistée ; - lecture
indépendante/aveugle ; - comparaison après saisie.

------------------------------------------------------------------------

# PARTIE V --- Journal expliqué

## 18. Pourquoi la mémoire personnelle est une source

La mémoire familiale disparaît souvent sans jamais entrer dans les
archives.

Une personne peut savoir : - qui était surnommé Ti-René ; - pourquoi une
branche ne se parlait plus ; - où se trouvait une maison ; - qui
apparaît sur une photo ; - quelle langue parlait un grand-parent ; -
quel récit circulait dans la famille.

Journal considère cette mémoire comme une source humaine qui doit être
préservée avec son contexte.

## 19. Pourquoi Journal doit interroger aussi son propre utilisateur

La mémoire n'est pas seulement quelque chose que l'on « collecte chez
les anciens ».

Une personne peut elle-même être le principal détenteur d'une mémoire
familiale.

Le problème est qu'elle ne sait pas nécessairement ce qui sera précieux
dans 30 ans.

Journal peut l'aider à faire émerger : - souvenirs ; - noms ; -
anecdotes ; - lieux ; - questions ; - incertitudes.

## 20. Pourquoi la première réponse doit rester intacte

Si Journal demande : \> « Comment s'appelait le frère de ta mère ? »

puis affiche : \> « Tree contient peut-être Marcel »

la réponse donnée après l'indice n'a pas le même statut que le souvenir
spontané.

Le système doit conserver : 1. réponse spontanée ; 2. indice montré ; 3.
réaction après indice.

Cela permet de mesurer le contexte d'élicitation sans prétendre lire
l'esprit du témoin.

## 21. Pourquoi « je ne sais pas » est une donnée

« Je ne sais pas » peut signifier : - jamais su ; - oublié ; - hésite
; - refuse ; - sujet non abordé ; - ne veut pas répondre maintenant.

Ces états ont des conséquences différentes.

Une personne qui dit : \> « Je savais son nom, mais je l'ai oublié »

peut retrouver le souvenir six mois plus tard.

Journal doit pouvoir revenir sur cette question sans effacer l'ancienne
réponse.

## 22. Mémoire collective et versions

Trois cousins peuvent raconter différemment la même histoire.

GENIIUS ne doit pas choisir immédiatement le récit majoritaire.

Il peut conserver : - récits indépendants ; - points communs ; -
divergences ; - discussion collective ultérieure ; - confrontation aux
archives.

La discussion collective est une nouvelle source, car elle peut modifier
les souvenirs exprimés.

------------------------------------------------------------------------

# PARTIE VI --- Echo expliqué

## 23. Pourquoi l'échec de recherche doit être mémorisé

Un chercheur peut passer une journée à vérifier : - trois cotes ; - cinq
variantes de nom ; - deux index ;

sans trouver Charles.

Si ce travail n'est pas enregistré, lui-même ou un autre recommencera
plus tard.

Echo doit conserver : - ce qui a été cherché ; - où ; - comment ; -
jusqu'où ; - avec quel résultat.

Mais il ne doit pas transformer : \> « je n'ai pas trouvé Charles »

en : \> « Charles n'est pas présent ».

## 24. Pourquoi une question de recherche est un objet

« Qui sont les parents de Charles TANCRÈDE ? » n'est pas une simple
note.

Elle peut avoir : - hypothèses ; - pistes ; - recherches ; - résultats
négatifs ; - preuves ; - sous-questions ; - conclusion ; - réouverture.

En faire un objet permet de transmettre la recherche elle-même.

## 25. Quand une recherche est-elle terminée ?

GENIIUS ne peut jamais calculer : \> « 82 % de l'Histoire découverte ».

En revanche, un chercheur peut définir un protocole : - état civil
vérifié ; - matricule vérifié ; - dossiers judiciaires vérifiés ; -
variantes recherchées.

Lorsque ces actions sont accomplies : \> la question est suffisamment
traitée **selon ce protocole**.

Cela ne signifie pas qu'aucun document inconnu ne pourra apparaître.

## 26. Pourquoi les impasses sont transmissibles

Une future génération de chercheurs a besoin de savoir : - ce qui a été
tenté ; - ce qui a échoué ; - pourquoi une hypothèse a été abandonnée
; - quelle piste reste prometteuse.

Un projet transmis sans ces éléments transmet seulement ses résultats,
pas son intelligence de recherche.

------------------------------------------------------------------------

# PARTIE VII --- Atlas expliqué

## 27. Pourquoi un lieu n'est pas un point GPS

Un lieu historique peut : - avoir changé de nom ; - avoir disparu ; -
avoir changé de limites ; - être connu seulement relativement à d'autres
lieux.

Réduire un lieu à latitude/longitude détruit son histoire.

## 28. Reconstruire un lieu sans coordonnées

Supposons : - habitation A jouxte B ; - rivière R traverse A ; - A est
au nord de C ; - une vente mentionne une limite commune avec D.

Même sans coordonnées précises, ces relations forment un graphe spatial.

GENIIUS peut progressivement réduire les zones possibles.

La carte devient alors **un résultat de recherche**.

## 29. Pourquoi il ne faut pas dessiner de faux itinéraires

Si Charles est attesté à Deshaies en janvier puis à Pointe-à-Pitre en
mars, une ligne droite ou une route calculée entre les deux peut donner
l'illusion que GENIIUS connaît son trajet.

Atlas doit distinguer : - présence attestée ; - déplacement attesté ; -
trajet reconstruit ; - simple connexion graphique.

------------------------------------------------------------------------

# PARTIE VIII --- Reconstruction historique expliquée

## 30. Pourquoi reconstruire un document disparu

Le registre des nouveaux libres de Deshaies peut être perdu, mais des
actes ultérieurs peuvent citer : - numéro d'inscription ; - nom ; -
parenté ; - information issue du registre.

Ces citations sont des traces du document disparu.

GENIIUS doit permettre de représenter le registre perdu lui-même comme
objet historique, puis de reconstruire ce que l'on peut de sa structure
et de son contenu.

## 31. Ce qu'une reconstruction ne doit jamais faire

Elle ne doit pas : - fabriquer les cases inconnues ; - présenter une
hypothèse comme ligne originale ; - donner une mise en page moderne
comme forme historique certaine ; - cacher les sources de chaque
élément.

## 32. Dépendances de reconstruction

Si : - acte A soutient l'entrée 8 ; - entrée 8 soutient l'identification
de Rose ; - Rose soutient une statistique ;

et que la lecture de A est corrigée, GENIIUS doit savoir quels éléments
sont potentiellement affectés.

------------------------------------------------------------------------

# PARTIE IX --- Validation, réputation et communauté expliquées

## 33. Pourquoi « trois validations = vrai » est insuffisant

Trois personnes peuvent : - se copier ; - travailler dans la même équipe
; - utiliser la même reproduction ; - partager le même biais.

Le nombre de validations est une information sociale, pas une preuve
absolue.

GENIIUS doit montrer : - validation ; - indépendance connue ou inconnue
; - preuves ; - contestations.

## 34. Pourquoi la réputation doit être contextuelle

Quelqu'un peut être excellent : - en paléographie du XIXe siècle ; - en
archives guadeloupéennes ; - en latin paroissial ;

sans être spécialiste : - de droit médiéval ; - d'histoire maritime.

Un score global masquerait cette différence.

## 35. Pourquoi l'argent doit être séparé de la crédibilité

Un abonnement peut acheter : - stockage ; - calcul ; - fonctionnalités
; - quotas.

Il ne doit jamais acheter : - validation scientifique ; - poids de vote
; - badge d'expertise.

------------------------------------------------------------------------

# PARTIE X --- Droits et transmission expliqués

## 36. Pourquoi privé, partagé et publié sont différents

Une photo peut être : - stockée dans un projet privé ; - visible par la
famille ; - partagée avec deux chercheurs ; - utilisée dans une
conclusion ; - interdite de publication publique.

Une seule case « privé/public » est insuffisante.

## 37. Pourquoi une conclusion peut être publique sans révéler toute sa preuve

Un témoignage familial privé peut aider un chercheur à comprendre une
situation.

Si la conclusion est aussi démontrable avec des sources publiques, elle
peut être publiable sans exposer le témoignage.

À l'inverse, si la conclusion révèle nécessairement le contenu sous
embargo, l'embargo doit être respecté.

Les droits doivent donc suivre les dépendances de manière intelligente,
pas mécanique.

## 38. Vérifiabilité relative

Un lecteur autorisé à voir trois preuves peut considérer une conclusion
très vérifiable.

Un lecteur public n'en voit qu'une.

L'interface doit distinguer : - « cette conclusion possède trois
éléments de preuve » de : - « vous pouvez examiner trois éléments de
preuve ».

------------------------------------------------------------------------

# PARTIE XI --- Pérennité expliquée

## 39. Pourquoi l'export est une fonction scientifique

Si GENIIUS disparaît, les utilisateurs ne doivent pas perdre : - leurs
données ; - leurs sources ; - leurs hypothèses ; - leurs relations ; -
leur provenance.

Un simple CSV ne suffit pas pour le modèle riche.

D'où un format patrimonial GENIIUS documenté.

## 40. Pourquoi l'ancien état doit rester citable

Une publication de 2028 doit pouvoir citer l'état 2028.

Si l'entité évolue en 2032, la citation ne doit pas afficher
silencieusement la version 2032 comme si elle avait été connue en 2028.

Il faut donc : - identifiants persistants ; - versions ; - liens
courants ; - liens figés.

------------------------------------------------------------------------

# PARTIE XII --- Sobriété et IA expliquées

## 41. Pourquoi GENIIUS ne doit pas devenir AI-first

Beaucoup d'opérations sont déterministes : - compter ; - filtrer ; -
joindre ; - chercher ; - appliquer une règle ; - comparer des dates.

Appeler un grand modèle pour cela : - consomme inutilement ; - augmente
les coûts ; - réduit la reproductibilité ; - introduit de l'opacité.

GENIIUS doit donc être **knowledge-first et provenance-first**, pas
AI-first.

## 42. Où l'IA peut être utile

Exemples : - OCR/HTR ; - suggestions d'entités ; - alignement de textes
; - proposition de rapprochements ; - résumé/narration ; - exploration
en langage naturel ; - analyse visuelle.

Mais : - proposition ≠ validation ; - résultat IA doit être identifiable
; - humain peut examiner/corriger ; - fonctionnement essentiel reste
disponible sans IA générative.

------------------------------------------------------------------------

# PARTIE XIII --- Doctrine produit

## 43. Pourquoi il ne faut pas créer une application pour chaque sujet

Si demain GENIIUS étudie des navires, cela ne justifie pas « GENIIUS
Ships ».

Le navire est une entité du Core.

On utilisera : - Rebond pour les documents ; - Atlas pour les voyages
; - Echo pour la recherche ; - Tree si des familles sont concernées.

Une application correspond à une **manière de travailler**, pas à une
catégorie d'objets.

## 44. Les applications comme portes d'entrée

Tree : « je pars de ma généalogie ».

Rebond : « je pars d'une source ».

Journal : « je pars d'une mémoire ».

Echo : « je pars d'une question de recherche ».

Atlas : « je pars d'un espace et d'un temps ».

Connect : « je pars d'un moment collectif de transmission ».

Le Core permet à ces portes d'entrée de communiquer.

------------------------------------------------------------------------

# PARTIE XIV --- Scénarios narratifs de bout en bout

## 45. Scénario A --- Charles TANCRÈDE

Un chercheur trouve un document judiciaire de 1882.

Dans Rebond : - il conserve la cote ; - la reproduction ; - la page ; -
la transcription ; - les mentions de Charles ; - les décisions.

Il lie la mention à une Personne Core, avec hypothèse d'identification.

Dans Echo : - il crée la question « que devient Charles entre 1884 et
1888 ? » ; - il enregistre les séries consultées ; - il conserve les
recherches négatives ; - il planifie de nouvelles pistes.

Dans Atlas : - il visualise les présences attestées ; - Deshaies ; -
Guyane ; - Îles du Salut ; - sans inventer les trajets.

Une nouvelle source modifie une date.

GENIIUS : - ne réécrit pas l'ancienne source ; - met à jour l'assertion
concernée ; - signale les conclusions dépendantes ; - conserve
l'ancienne version de la biographie.

Ce scénario vérifie que GENIIUS est bien un système de connaissance
historique, pas seulement une fiche personne.

## 46. Scénario B --- Dolé 1793

Le chercheur transcrit un inventaire recensant plus de 200 personnes.

Rebond peut extraire : - noms/prénoms ; - âges ; - groupes ; -
situations ; - relations ; - occupations ; - positions documentaires.

Certaines personnes ne seront jamais reliées à Tree.

Elles restent pourtant dans Core.

Un autre chercheur étudie Dolé en 1802.

GENIIUS propose des candidats entre 1793 et 1802 mais n'impose pas
l'identité.

Atlas permet d'observer l'évolution de la population.

Echo conserve les hypothèses et les recherches pour les individus
disparus du corpus.

## 47. Scénario C --- la mémoire de famille

Jordan dépose dans Journal : \> « Dans la famille, on parlait d'un
Ti-René qui vivait près de la rivière, mais je ne sais plus qui c'était.
»

Journal conserve : - déclaration ; - date ; - auteur ; - incertitude.

Une question est créée : \> « Qui était Ti-René ? »

Plus tard : - une tante répond ; - une photo est identifiée ; - Rebond
trouve un acte ; - plusieurs candidats apparaissent.

GENIIUS ne modifie pas la mémoire initiale.

Il relie progressivement les nouveaux éléments et permet d'expliquer
comment l'identification a émergé.

## 48. Scénario D --- reconstruction du registre perdu

Plusieurs mariages mentionnent des numéros du registre des nouveaux
libres.

Le chercheur crée : - le registre perdu ; - sa structure supposée ; -
les entrées attestées ; - les positions inconnues.

Une entrée est proposée pour Rose CARMEN.

Elle est affichée comme reconstruction.

Une nouvelle source révèle que le numéro appartenait à une autre
personne.

GENIIUS : - conserve l'ancienne hypothèse ; - la marque rejetée ; -
corrige la reconstruction courante ; - signale les statistiques et
conclusions dépendantes.

------------------------------------------------------------------------

# PARTIE XV --- Anti-patterns : ce qui ferait perdre l'identité de GENIIUS

## 49. Anti-pattern : la fiche « vérité »

Une Personne avec : - un nom ; - une date ; - un métier ; - un lieu ;

sans provenance ni variantes.

À éviter.

## 50. Anti-pattern : le score magique

> « Charles et cet acte correspondent à 92 %. »

Sans explication.

À éviter.

Préférer : - critères compatibles ; - critères incompatibles ; - indices
; - méthode.

## 51. Anti-pattern : l'arbre mondial fusionné

À éviter.

Tree reste souverain ; Core fédère de la connaissance.

## 52. Anti-pattern : « IA dit que »

L'IA n'est jamais une autorité documentaire.

## 53. Anti-pattern : la carte trop précise

Un point GPS exact pour un lieu connu seulement comme « près de la
rivière » est une fausse information.

## 54. Anti-pattern : le projet à 74 % terminé

L'Histoire inconnue n'est pas quantifiable ainsi.

## 55. Anti-pattern : l'effacement d'une erreur

Une erreur scientifique importante corrigée doit rester historisée.

## 56. Anti-pattern : la source privée aspirée dans le commun

Structurer dans GENIIUS ne constitue jamais un consentement à
contribuer.

------------------------------------------------------------------------

# PARTIE XVI --- Matrice conceptuelle des six applications

  -----------------------------------------------------------------------------------------------------------------
  Besoin       Tree                    Journal         Rebond       Echo          Connect        Atlas
  ------------ ----------------------- --------------- ------------ ------------- -------------- ------------------
  Structurer   principal               alimente        alimente     recherche     collecte       contexte
  parenté                                                                                        

  Mémoire      consulte                principal       peut         organise      collecte       localise
  orale                                                exploiter    campagne                     

  Source       consulte                contextualise   principal    organise      secondaire     spatialise
  d'archives                                                        recherche                    

  Question de  secondaire              fournit indices fournit      principal     peut           explore
  recherche                                            preuves                    solliciter     

  Événement    affiche                 collecte        peut         organise      principal      localise
  familial                             mémoire         documenter   recherche                    

  Géographie   consulte                souvenirs de    extrait      recherche     événement      principal
  historique                           lieux           lieux                                     

  Core partagé lie/importe/contribue   contribue selon contribue    produit       contribue      consomme/produit
                                       droits                       conclusions   selon          reconstructions
                                                                                  consentement   
  -----------------------------------------------------------------------------------------------------------------

Cette matrice ne signifie pas que les données sont dupliquées. Elle
indique quel mode de travail est principal.

------------------------------------------------------------------------

# PARTIE XVII --- Exigences de conception pour la prochaine phase

## 57. Avant de créer une table ou classe

Pour tout futur objet, demander : - est-ce une entité historique ? - une
trace documentaire ? - une assertion ? - une hypothèse ? - un objet
métier d'application ? - un objet de gouvernance ? - un résultat calculé
?

Ne pas mélanger ces catégories.

## 58. Avant de créer un champ « valeur »

Demander : - est-ce attesté ? - calculé ? - synthétique ? - choisi pour
affichage ? - temporel ? - contestable ? - multi-valué ?

## 59. Avant de créer un bouton « fusionner »

Demander : - fusion technique ? - identité historique ? - décision
réversible ? - quelles dépendances ?

## 60. Avant de publier

Vérifier : - droits ; - personnes vivantes ; - mineurs ; - licences ; -
embargos ; - provenance ; - indexation ; - réutilisation.

------------------------------------------------------------------------

------------------------------------------------------------------------

# PARTIE --- Spécification exhaustive consolidée

# 1. Contrat supérieur de GENIIUS

## 1.1 Mission

> **GENIIUS a pour vocation de préserver, rechercher, structurer, relier
> et transmettre la connaissance relative aux personnes et aux
> communautés humaines à travers leurs parcours, leurs relations, leurs
> lieux, leurs événements et les traces qu'elles ont laissées.**

GENIIUS ne se limite donc pas à la généalogie au sens classique, ni aux
liens familiaux, ni à l'état civil. Il doit permettre de reconstruire
des trajectoires humaines individuelles et collectives à partir de
traces documentaires, mémorielles, géographiques, relationnelles et
contextuelles.

Un projet peut commencer par : - une personne ; - une famille ; - une
communauté ; - un lieu ; - une habitation ou plantation ; - une
organisation ; - une institution ; - un navire ; - un groupe social ; -
un corpus documentaire ; - une question historique ; - un document perdu
à reconstruire.

Il n'est pas nécessaire qu'un projet parte d'un arbre généalogique.

## 1.2 Formulation synthétique

> **GENIIUS transforme les traces dispersées de vies humaines en
> connaissance structurée, vérifiable, navigable et transmissible.**

Formulation supérieure retenue à la clôture du cadrage :

> **GENIIUS aide à transformer les traces dispersées de vies humaines en
> connaissance structurée, vérifiable, navigable et transmissible, sans
> effacer l'incertitude, la provenance, les droits ni l'histoire de sa
> construction.**

## 1.3 Les cinq engagements supérieurs

### Engagement 1 --- Ne jamais transformer l'incertitude en certitude

GENIIUS peut aider à rechercher, rapprocher, calculer, comparer et
proposer. Il ne doit pas effacer la différence entre : - source ; -
trace ; - mention ; - transcription ; - identification ; - assertion ; -
calcul ; - hypothèse ; - interprétation ; - conclusion ; - synthèse.

### Engagement 2 --- Ne jamais détruire l'histoire de la connaissance

Une correction ne doit pas faire comme si l'ancienne lecture n'avait
jamais existé. Une contestation, une hypothèse abandonnée, une ancienne
conclusion ou une ancienne publication peuvent avoir une valeur pour
comprendre le chemin de recherche.

GENIIUS doit pouvoir répondre non seulement : - « que considérons-nous
aujourd'hui ? » mais aussi : - « que pensions-nous en 2028 ? » ; - «
pourquoi ? » ; - « qu'est-ce qui a changé ? » ; - « quelle découverte a
provoqué ce changement ? ».

### Engagement 3 --- Pouvoir revenir à la trace

Lorsque les droits le permettent, une synthèse doit pouvoir être
remontée :

`résultat → raisonnement → assertion → mention → transcription/observation → zone exacte → source → exemplaire/reproduction → cote/fonds/institution`

Une biographie, une carte ou une statistique ne doit pas devenir un
cul-de-sac documentaire.

### Engagement 4 --- Ne pas s'approprier silencieusement les données

> **collecter ≠ structurer ≠ valider ≠ rattacher ≠ partager ≠ contribuer
> ≠ publier**

Une donnée privée ne devient pas commune simplement parce qu'elle a été
structurée dans GENIIUS.

> **Utiliser GENIIUS ne signifie pas contribuer à GENIIUS.**

### Engagement 5 --- Transmettre davantage que des données

GENIIUS doit pouvoir transmettre : - les personnes et relations ; - les
sources ; - les témoignages ; - les méthodes ; - les questions ; - les
hypothèses ; - les recherches négatives ; - les impasses ; - les débats
; - les corrections ; - les raisons d'une conclusion ; - l'histoire de
la recherche elle-même.

## 1.4 Principe mémoriel

> **Une personne n'a pas besoin d'avoir laissé des descendants pour
> avoir laissé une histoire.**

Une personne attestée dans une source doit pouvoir être documentée même
si : - elle n'apparaît dans aucun Tree ; - aucun descendant contemporain
n'est connu ; - son nom est incomplet ; - elle n'est attestée qu'une
fois ; - sa lignée s'est interrompue ; - elle est historiquement
marginalisée ou sous-documentée.

Le nombre de documents disponibles ne doit jamais devenir une mesure
implicite de l'importance d'une vie humaine.

------------------------------------------------------------------------

# 2. Frontières du produit

GENIIUS ne doit pas devenir « tout logiciel manipulant de l'histoire ».

## 2.1 Ce que GENIIUS n'est pas

GENIIUS n'est pas : - un logiciel complet de gestion d'archives
institutionnelles ; - un réseau social généraliste ; - une encyclopédie
universelle ; - un Drive/Dropbox généraliste ; - un CRM généraliste ; -
un logiciel juridique ou comptable généraliste ; - une autorité de
vérité historique ; - un produit dont la valeur dépend de l'IA
générative ; - une base universelle de bateaux, bijoux, plantes, lois,
virus ou bâtiments indépendamment de leur rapport aux trajectoires
humaines.

## 2.2 Test de périmètre

Toute nouvelle fonctionnalité ou nouveau type d'objet doit passer le
test suivant :

> **Cet objet ou cette fonction aide-t-il à préserver, rechercher,
> structurer, relier, comprendre ou transmettre des trajectoires
> humaines et leurs traces ?**

Si la réponse est non, l'objet est probablement hors périmètre.

## 2.3 Principe architectural de clôture

> **Le Core modélise le monde historique ; les applications modélisent
> les manières de travailler avec cette connaissance.**

Un nouveau domaine historique ne justifie pas une nouvelle application.

Exemples : - navires ; - musiciens ; - immeubles ; - réfugiés ; - agents
d'une administration ; - objets familiaux ; - plantations ; - prisons.

Ces domaines doivent normalement être absorbés par le Core et les
applications existantes.

Une nouvelle application ne se justifie que si apparaît un **nouveau
mode de travail transversal**, cohérent et suffisamment important.

------------------------------------------------------------------------

# 3. Architecture fonctionnelle générale

GENIIUS est une suite, pas une application monolithique.

## 3.1 Tree

Tree structure et consulte des généalogies.

Responsabilités : - arbres ; - personnes ; - familles ; - liens ; -
navigation ; - collaboration ; - comparaison ; - partage de branche ; -
imports/exports adaptés ; - liens volontaires vers le Core.

Tree reste souverain et indépendant.

## 3.2 Journal

Journal préserve la mémoire humaine : - sa propre mémoire ; - la mémoire
d'un tiers ; - témoignages ; - souvenirs ; - traditions ; - questions
; - photos ; - audio ; - vidéo ; - mémoire encore incomplète.

## 3.3 Rebond

Rebond part des sources : - fac-similé ; - transcription ; - annotation
; - mention ; - identification ; - assertion ; - édition critique ; -
comparaison de témoins documentaires ; - exploitation structurée.

## 3.4 Echo

Echo est l'espace de travail du chercheur : - projets ; - questions ; -
pistes ; - hypothèses ; - missions ; - archives ; - contacts ; -
protocoles ; - résultats négatifs ; - conclusions ; - veille ; -
transmission de recherche.

## 3.5 Connect

Connect mobilise la famille ou une communauté autour d'événements : -
cousinades ; - rencontres ; - jeux ; - photo-identification ; - quiz ; -
anecdotes ; - campagnes de mémoire ; - collecte avant/pendant/après
événement.

## 3.6 Atlas

Atlas explore et reconstruit : - lieux ; - territoires ; - présences ; -
mouvements ; - propriétés ; - voisinages ; - usages du sol ; -
phénomènes ; - frontières ; - géographies historiques ; - temporalités.

## 3.7 Core

Le Core est le modèle transversal de connaissance.

Il ne doit pas être réduit à une table PERSON.

Le cœur conceptuel est plutôt :

> **ENTITÉS + RELATIONS + ÉVÉNEMENTS + SITUATIONS + ASSERTIONS +
> SOURCES + PROVENANCE + HYPOTHÈSES + VERSIONS + DROITS**

------------------------------------------------------------------------

# 4. Core privé, Core partagé et souveraineté des espaces

## 4.1 Le Core est d'abord un modèle

Décision structurante :

> **Le Core est d'abord un modèle de connaissance ; le Core partagé
> n'est qu'un espace particulier utilisant ce modèle.**

Un utilisateur ou un projet doit pouvoir utiliser toute la puissance du
modèle GENIIUS sans contribuer au commun.

Exemples : - Tree privé ; - Journal familial privé ; - Rebond sur des
archives personnelles ; - Echo sur une recherche confidentielle ; -
connaissance structurée interne à un projet.

## 4.2 Espaces possibles

Le modèle doit pouvoir exister dans des espaces : - personnels ; -
privés ; - familiaux ; - projet ; - organisation ; - communautaires ; -
Core partagé ; - publication publique.

## 4.3 Passage entre espaces

Un changement de régime de gouvernance crée généralement un nouvel
état/objet lié par provenance.

Exemple :

`Assertion privée P-128` → contribution explicite →
`Assertion partagée A-847`

avec :

`A-847 dérive de P-128, version du 12/05/2028`

L'objet privé ne devient pas soudainement public.

## 4.4 Filiation sans synchronisation forcée

Après contribution : - la version privée peut évoluer ; - la version
partagée peut évoluer ; - GENIIUS conserve leur filiation ; - GENIIUS
peut signaler une divergence ; - l'utilisateur peut comparer ; - il peut
proposer une mise à jour ; - il peut importer une évolution ; - aucune
synchronisation automatique n'est imposée.

> **Une contribution crée une filiation entre deux états de
> connaissance, pas une obligation de synchronisation future.**

## 4.5 Réutilisation sans duplication

Si un objet est déjà dans le même régime partagé, plusieurs projets le
référencent au lieu de le recopier.

Distinguer : - lieu de production ; - provenance intellectuelle ; -
contextes d'utilisation.

------------------------------------------------------------------------

# 5. Modèle épistémique fondamental

## 5.1 Chaîne de connaissance

GENIIUS doit pouvoir représenter :

`SOURCE` → `DOCUMENT / UNITÉ` → `PAGE / VUE / ZONE / SEGMENT` →
`TRANSCRIPTION / OBSERVATION` → `MENTION` → `HYPOTHÈSE D’IDENTIFICATION`
→ `ENTITÉ` → `ASSERTION` → `HYPOTHÈSE / CONCLUSION` →
`SYNTHÈSE / PUBLICATION`

Chaque couche peut évoluer.

## 5.2 Règle fondamentale

> **GENIIUS ne doit jamais confondre une information, une affirmation et
> une preuve.**

## 5.3 Localisation du désaccord

Un désaccord doit pouvoir porter précisément sur : 1. image/source ; 2.
lecture ; 3. transcription ; 4. segmentation ; 5. mention ; 6.
identification ; 7. normalisation conceptuelle ; 8. assertion ; 9.
calcul ; 10. interprétation ; 11. conclusion.

Contester une identification ne modifie pas la transcription.

Une nouvelle source utilisant un autre nom ne modifie pas la lecture
d'une source antérieure.

## 5.4 Dépendances

GENIIUS doit conserver un graphe de dépendances : - une conclusion
dépend d'assertions ; - une assertion dépend de mentions ; - une mention
dépend d'une lecture ; - une reconstruction dépend de traces ; - une
statistique dépend d'un corpus et d'une méthode ; - une carte dépend de
localisations ; - une publication dépend d'un état du Core.

Si un élément amont change, les éléments aval peuvent être : - inchangés
; - potentiellement affectés ; - à réexaminer ; - invalidés ; - à
recalculer.

------------------------------------------------------------------------

# 6. Entités historiques

## 6.1 Personne

Une Personne peut être : - nommée ; - prénom seulement ; - anonyme mais
individualisée ; - âge approximatif ; - sexe inconnu ; - lieu incertain
; - connue par une seule trace ; - sans descendant connu.

Le manque d'information n'est pas une erreur.

## 6.2 Seuil de création d'une Personne

Décision intermédiaire :

-   toute occurrence commence comme mention ;
-   une Personne peut être créée lorsque le chercheur estime qu'il
    existe suffisamment d'éléments pour individualiser un être humain ;
-   pas de seuil universel nom + date + lieu ;
-   pas de création automatique d'une Personne pour chaque mention
    vague.

## 6.3 Structures relationnelles non résolues

Le Core doit pouvoir représenter : - « un enfant de X » ; - « l'une des
trois sœurs » ; - « quatre enfants de la même mère inconnue » ; - « une
personne parmi A/B/C » ; - « un groupe domestique de N personnes ».

Sans créer de fausses personnes.

## 6.4 Autres entités

Types possibles : - Lieu ; - Organisation ; - Institution ; - Famille
; - Collectif historique ; - Navire ; - Objet matériel ; - Bien/Actif
; - Norme/Acte normatif ; - Événement ; - Fonction/Poste ; -
Concept/Référentiel ; - Phénomène historique.

L'ontologie doit être extensible.

## 6.5 Personnes réduites en esclavage

Règle éthique et ontologique absolue :

Une personne réduite en esclavage reste une **Personne**.

Si une source la traite comme : - propriété ; - marchandise ; - élément
d'inventaire ; - valeur financière ; - objet de vente ou transmission,

GENIIUS documente cette classification historique et cette relation
juridique sans adopter cette ontologie.

------------------------------------------------------------------------

# 7. Noms, variantes et identité

## 7.1 Pas de « vrai nom » automatique

Une personne peut être attestée sous plusieurs formes.

Exemples : - CHARBONNET ; - CHARBONNIER ; - BLUKER ; - BICLAIR ; -
surnom ; - nom d'usage ; - forme orale.

GENIIUS ne choisit pas automatiquement une forme comme vérité
définitive.

## 7.2 Fidélité locale

Si le document A porte CHARBONNET et le document B CHARBONNIER : - B ne
corrige pas A ; - A ne peut être corrigé que si la lecture de A est
remise en cause.

## 7.3 Valeur d'affichage

Une interface peut avoir besoin d'un nom principal d'affichage.

Ce nom est une convention UX, pas une vérité historique.

Il doit rester possible de voir : - toutes les formes ; - leurs dates
; - leurs sources ; - leurs contextes.

------------------------------------------------------------------------

# 8. Identité, homonymes et rapprochements

## 8.1 L'identification est une hypothèse historisée

> **Le rattachement d'une mention documentaire à une entité GENIIUS
> constitue une proposition d'identification.**

Elle conserve : - auteur ; - date ; - justification ; - éléments
favorables ; - éléments défavorables ; - état ; - validations ; -
contestations ; - révisions.

## 8.2 Plusieurs candidats

Si une mention peut correspondre à Pierre, Louis ou François : -
conserver les candidats ; - conserver les arguments ; - ne pas choisir
automatiquement ; - préférer des niveaux qualitatifs de plausibilité à
des pourcentages arbitraires.

## 8.3 Fusion logique et réversible

Deux entités peuvent être considérées comme la même personne.

GENIIUS ne détruit pas leurs identifiants historiques.

Après validation forte, l'interface peut les présenter ensemble, mais

:   -   la séparation initiale reste connue ; - la décision reste
        réversible ; - l'historique reste consultable.

> **GENIIUS ne détruit jamais l'histoire de deux entités lors de leur
> rapprochement.**

## 8.4 Core à grande échelle

Décision :

> **Le doublon historique incertain est préférable à la fausse identité
> certaine.**

Le Core peut contenir plusieurs entités représentant peut-être le même
individu.

La déduplication technique n'est pas la déduplication historique.

------------------------------------------------------------------------

# 9. Valeurs, dates et calculs

## 9.1 Dates

Supporter : - exacte ; - approximative ; - intervalle ; - avant ; -
après ; - vers ; - calculée ; - déduite ; - estimée ; - inconnue.

## 9.2 Attesté vs dérivé

Règle universelle :

> **Une valeur écrite dans une source et une valeur calculée à partir de
> cette source sont deux objets épistémiques différents.**

Exemple : - source : « âgé de 42 ans le 12 mars 1880 » ; - dérivation :
naissance théorique vers 1837--1838 selon méthode ; - jamais : « la
source dit qu'il est né en 1838 ».

## 9.3 Méthodes concurrentes

Plusieurs méthodes peuvent produire des résultats différents.

Conserver : - méthode ; - auteur ; - version ; - hypothèses ; -
paramètres ; - résultat ; - limites.

Le désaccord méthodologique est distinct du désaccord documentaire.

## 9.4 Mesures et monnaies

Toujours conserver : - valeur originale ; - unité originale ; - monnaie
originale ; - contexte.

Conversion moderne : - dérivée ; - documentée ; - réversible ; - datée
; - méthodologiquement explicitée.

------------------------------------------------------------------------

# 10. Événements, situations et trajectoires

## 10.1 Événement

Occurrence identifiable : - mariage ; - vente ; - condamnation ; -
traversée ; - cyclone ; - bataille ; - cérémonie ; - réunion familiale.

Un événement peut avoir : - participants ; - rôles ; - lieu ; - date ; -
sources ; - récits concurrents.

## 10.2 Situation / état / activité

Réalité qui dure : - résidence ; - emploi ; - statut ; - fonction ; -
appartenance ; - propriété ; - relation.

## 10.3 Attestations ponctuelles et continuité

Trois attestations d'emploi en 1834, 1837 et 1841 ne prouvent pas
automatiquement un emploi continu de 1834 à 1841.

GENIIUS doit pouvoir montrer : - points attestés ; - gaps ; - hypothèse
de continuité éventuelle.

## 10.4 Phases de trajectoire

Une « phase de vie » est une synthèse interprétative.

Elle peut être : - manuelle ; - proposée par GENIIUS ; - titrée ; -
datée avec incertitude ; - justifiée ; - versionnée.

Elle n'est pas un fait brut.

## 10.5 Comparaison de trajectoires

GENIIUS peut comparer : - individus ; - familles ; - collectifs.

Critères explicites : - événements ; - lieux ; - périodes ; - relations
; - statuts ; - changements ; - présence dans corpus.

Similarité ≠ causalité.

------------------------------------------------------------------------

# 11. Lacunes, absence et recherche négative

## 11.1 Types de vide

Distinguer : - non recherché ; - recherche partielle ; - recherche
exhaustive dans un périmètre défini sans résultat ; - non mentionné ; -
explicitement absent ; - illisible ; - lacune matérielle ; - inconnu ; -
non applicable ; - question non posée.

> **Le vide a un sens lorsqu'on sait pourquoi il est vide.**

## 11.2 Absence de preuve vs preuve d'absence

Ne pas trouver Charles dans une recherche partielle ne signifie pas «
Charles n'est pas là ».

Une recherche exhaustive documentée peut constituer une preuve limitée
de non-présence dans le périmètre examiné.

## 11.3 Résultats négatifs Echo

Un résultat négatif est un résultat de recherche : - qui a cherché ; -
quand ; - où ; - avec quelles variantes ; - dans quel corpus ; - avec
quelle couverture ; - avec quelles limites.

------------------------------------------------------------------------

# 12. Relations humaines

## 12.1 Trois niveaux

> **relation attestée ≠ relation normalisée ≠ relation interprétée**

Conserver le vocabulaire exact de la source.

## 12.2 Relation temporelle

Une relation peut : - commencer ; - finir ; - changer ; - coexister avec
d'autres relations ; - être incertaine.

Deux personnes peuvent être : - cousins ; - voisins ; - associés ; -
adversaires ;

simultanément ou à des périodes différentes.

## 12.3 Parenté

Ne pas réduire à un seul modèle : - biologique ; - légal ; - social ; -
déclaré ; - nourricier ; - élevé par ; - autre système de parenté.

------------------------------------------------------------------------

# 13. Groupes, cohortes et réseaux

## 13.1 Groupe historique

Collectif attesté historiquement : - convoi ; - foyer ; - équipage ; -
groupe de travailleurs ; - institution ; - association.

Peut avoir : - composition partielle ; - trajectoire ; - mouvements ; -
transformation ; - dissolution.

## 13.2 Cohorte analytique

Groupe construit par le chercheur selon des critères.

Conserver : - critères ; - auteur ; - version ; - corpus.

Ne jamais transformer une cohorte analytique en catégorie historique.

## 13.3 Foyer, famille, logement

Ce sont trois objets différents.

Un foyer est : - daté ; - sourcé ; - observé.

Sa continuité entre deux recensements est une hypothèse.

## 13.4 Cooccurrence

GENIIUS peut calculer : - personnes sur mêmes photos ; - mêmes documents
; - mêmes événements ; - mêmes lieux ; - mêmes organisations.

Mais : \> « A et B apparaissent ensemble 14 fois » ≠ « A et B sont amis
».

## 13.5 Entourage historique

GENIIUS peut calculer un entourage temporel et explicable.

Il doit montrer : - pourquoi une personne apparaît ; - quels liens sont
attestés ; - quels liens sont calculés ; - quels liens sont
hypothétiques.

------------------------------------------------------------------------

# 14. Causalité

Distinguer : - succession temporelle ; - corrélation ; - association ; -
causalité explicitement attestée ; - causalité proposée par un
chercheur.

Une épidémie et un décès au même moment ne suffisent pas à créer une
cause.

Une conclusion causale doit avoir : - source ou auteur ; - justification
; - statut.

------------------------------------------------------------------------

# 15. Sources et hiérarchie documentaire

## 15.1 Hiérarchie

Supporter :

`Institution` → `Fonds` → `Série / sous-série` → `Cote` →
`Registre / dossier` → `Pièce` → `Page / vue` → `Zone / fragment`

La granularité est progressive.

## 15.2 Quatre niveaux documentaires

Distinguer : 1. unité intellectuelle/documentaire ; 2. exemplaire
matériel ; 3. reproduction ; 4. fragment effectivement consulté.

## 15.3 Cote ≠ identité

Un document peut : - changer de cote ; - changer d'institution ; - être
dispersé ; - avoir des identifiants historiques.

GENIIUS conserve les identifiants successifs.

## 15.4 Organisation actuelle vs historique

Distinguer : - ordre actuel observé ; - ordre historique attesté ; -
ordre historique reconstruit.

Un fonds aujourd'hui dispersé peut être virtuellement reconstitué.

------------------------------------------------------------------------

# 16. Responsabilités documentaires et chaîne de production

Une source peut avoir : - rédacteur ; - auteur intellectuel ; -
signataire ; - informateur ; - autorité émettrice ; - destinataire ; -
collecteur ; - déposant ; - ancien détenteur ; - conservateur actuel ; -
numériseur ; - diffuseur.

Ces rôles ne doivent pas être écrasés dans « auteur ».

Exemple : dans un mariage : - l'âge peut être déclaré par l'époux ; -
l'identité des parents peut provenir d'une pièce produite ; - la
rédaction est faite par l'officier ; - une mention marginale peut venir
d'une décision ultérieure.

La provenance peut donc être assertion par assertion.

------------------------------------------------------------------------

# 17. Documents cités dans des documents

Distinguer : - présenté ; - cité ; - annexé ; - résumé ; - reproduit ; -
probablement utilisé ; - concordant.

Un document intermédiaire peut être : - perdu ; - non localisé ; -
seulement connu par citation.

Cinq documents reprenant le même registre perdu ne constituent pas
forcément cinq chaînes indépendantes.

------------------------------------------------------------------------

# 18. Reproductions et histoire numérique

## 18.1 Reproduction comme objet

Une reproduction peut avoir : - auteur ; - date ; - qualité ; - pages
manquantes ; - droits ; - support ; - provenance.

## 18.2 Lignée de reproduction

Exemple :

`registre original` → `photo Jordan 2027` → `copie transmise à X` →
`crop de Y` → `transcription Rebond`

Cette lignée doit être connue.

Dix utilisateurs utilisant la même photo ne produisent pas dix preuves
indépendantes.

## 18.3 Transformations

Historiser les transformations pouvant modifier l'interprétation : -
crop significatif ; - restauration ; - colorisation ; - débruitage ; -
generative fill ; - enhancement.

L'original doit rester récupérable.

Une colorisation IA n'est jamais une preuve des couleurs historiques.

------------------------------------------------------------------------

# 19. Fidélité documentaire et langage historique

## 19.1 Transcription fidèle

Rebond conserve : - mots ; - orthographe ; - formulations ; - catégories
; - termes offensants ou obsolètes.

Pas de censure silencieuse.

## 19.2 Contextualisation

GENIIUS peut afficher un avertissement ou une note de contexte.

Mais : - le texte original reste inchangé ; - la classification
historique reste attribuée à la source ; - elle ne devient pas
automatiquement un attribut intrinsèque de la personne.

## 19.3 Langues

Distinguer : - original ; - transcription ; - translittération ; -
traduction.

Une traduction : - a un auteur ; - une date ; - une version ; -
éventuellement une validation.

Elle ne remplace jamais l'original.

------------------------------------------------------------------------

# 20. Reconstruction de documents perdus

C'est une capacité majeure de GENIIUS.

## 20.1 Représenter le document absent

États possibles : - détruit ; - perdu ; - disparu ; - non localisé ; -
présumé détruit ; - inaccessible ; - lacunaire.

## 20.2 Reconstruction

GENIIUS peut reconstruire : - contenu ; - ordre ; - numérotation ; -
colonnes ; - sections ; - volumes ; - positions.

À partir de : - citations ; - copies ; - index ; - actes ultérieurs ; -
transcriptions ; - mentions ; - références ; - traces.

## 20.3 Règle

Une reconstruction n'est jamais confondue avec l'original.

Chaque élément reconstruit conserve : - preuve ; - raisonnement ; -
auteur ; - certitude ; - validation ; - dépendances.

## 20.4 Cas majeur --- registre des nouveaux libres de Deshaies

Objectif : reconstruire un registre disparu à partir d'actes de mariage
et autres actes ultérieurs citant : - numéros d'inscription ; - noms ; -
familles ; - relations ; - informations de statut.

Une proposition : \> « le n°8 pourrait être Rose CARMEN »

reste une hypothèse/reconstruction tant qu'elle n'est pas directement
attestée.

Une position inconnue reste inconnue.

GENIIUS ne complète pas artificiellement une série.

------------------------------------------------------------------------

# 21. Cohérence documentaire

Le moteur doit détecter : - numéro manquant ; - pages absentes ; -
années absentes ; - rupture de série ; - volume incomplet ; - obligation
documentaire attendue ; - copie divergente.

Mais une anomalie ne doit pas devenir une conclusion.

Exemple : actes 86 puis 88.

Hypothèses : - 87 jamais produit ; - 87 perdu ; - 87 dans autre cote ; -
erreur de numérotation ; - page absente ; - acte fusionné ; - acte mal
daté.

Echo peut créer une piste.

------------------------------------------------------------------------

# 22. Normes et obligations documentaires

Une loi, un décret, un règlement ou une décision peut être structuré
comme objet si utile.

GENIIUS ne devient pas une base juridique exhaustive.

Il peut documenter : - norme ; - institution émettrice ; - territoire
; - période ; - modification ; - abrogation ; - population concernée.

Une norme peut prescrire la production d'un registre.

Distinguer : 1. document prescrit ; 2. existence historiquement attestée
; 3. document localisé/conservé ; 4. document accessible.

« Normalement produit » ne signifie pas « a existé ».

------------------------------------------------------------------------

# 23. Rebond --- fonctionnement détaillé

## 23.1 De la source à la connaissance

Rebond doit permettre : - ouvrir source ; - naviguer ; - transcrire ; -
annoter ; - créer mentions ; - identifier entités ; - créer assertions
; - rebondir vers d'autres entités ; - conserver chemin exact vers
preuve.

## 23.2 Édition critique numérique

Rebond peut aller d'une simple transcription à une édition critique : -
fac-similé ; - transcription diplomatique ; - transcription de lecture
; - expansions ; - annotations ; - contextualisation ; - appareil
critique.

L'utilisateur peut afficher/masquer les couches.

## 23.3 Annotations sans transcription

On doit pouvoir annoter : - signature ; - tampon ; - rature ; -
changement d'encre ; - changement de main ; - dommage ; - marginalia ;

sans transcrire tout le document.

## 23.4 Ancrages multiples

Une assertion peut dépendre de plusieurs zones : - phrase principale ; -
marge ; - verso ; - page suivante.

Chaque zone peut avoir un rôle probatoire différent.

## 23.5 Couverture d'exploitation

Ne pas avoir un simple « traité/non traité ».

Dimensions possibles : - pages transcrites ; - personnes extraites ; -
lieux structurés ; - propriétés ; - signatures ; - marges ; -
professions ; - relations.

« Exhaustif » uniquement relativement à un protocole défini.

## 23.6 Réutilisation et lecture indépendante

Un chercheur peut : - réutiliser une exploitation existante ; - voir
attribution ; - choisir un mode de lecture indépendante/aveugle ; -
comparer ensuite.

Objectif : capitaliser le travail sans provoquer de biais de
confirmation.

## 23.7 Apprentissage à partir des corrections

Une correction peut servir : - occurrence seulement ; - préférence
personnelle ; - main/scribe ; - registre ; - corpus ; - territoire ; -
période.

Jamais devenir automatiquement une vérité universelle.

------------------------------------------------------------------------

# 24. Journal --- définition complète

> **Journal est l'espace de collecte, de préservation et de transmission
> de la mémoire humaine, qu'elle soit consignée directement par son
> détenteur ou recueillie auprès d'un tiers.**

## 24.1 Auto-mémoire

Journal doit permettre à une personne de s'interroger elle-même.

Cas : \> « On m'appelle la mémoire de la famille. Je veux que toute
cette mémoire soit conservée quelque part. Ce que je ne sais pas
aujourd'hui, peut-être que je le saurai demain. »

L'utilisateur doit pouvoir déposer : - anecdotes ; - surnoms ; -
relations ; - lieux ; - traditions ; - souvenirs incomplets ; -
questions ; - doutes.

## 24.2 Entretien d'un tiers

Journal doit aider à interviewer : - parent ; - grand-parent ; - témoin
; - voisin ; - membre d'une communauté.

## 24.3 Questions ouvertes d'abord

Règle : \> **Question ouverte d'abord, aide ensuite.**

Ne pas montrer immédiatement : - noms ; - Tree ; - hypothèses ; - photos
déjà identifiées.

Conserver : - réponse spontanée ; - puis réaction après exposition.

## 24.4 Contexte d'énonciation

Conserver : - question exacte ; - réponse ; - ordre ; - date ; - lieu
; - mode ; - interviewer ; - personnes présentes ; - caractère
ouvert/fermé/suggestif si connu.

Ne jamais reconstruire une question manquante comme certaine.

## 24.5 Mode de connaissance

Lorsque possible : - vécu ; - vu directement ; - entendu d'un témoin ; -
tradition familiale ; - déduction ; - souvenir incertain.

Question naturelle possible : \> « Tu l'as vu toi-même ou on te l'a
raconté ? »

## 24.6 États de mémoire

Distinguer : - jamais su ; - savait mais a oublié ; - souvenir partiel
; - incertain ; - refuse ; - à vérifier ; - non demandé.

Un oubli peut être reproposé plus tard avec délicatesse.

## 24.7 Révision d'un témoignage

Correction de transcription : - correction technique.

Changement de déclaration : - nouvelle version/déclaration.

Ne pas réécrire rétroactivement le témoignage initial.

## 24.8 Récits successifs

Une personne peut raconter différemment la même histoire au fil du
temps.

Variation ≠ mensonge.

GENIIUS peut étudier : - simplification ; - ajout ; - oubli ; -
reformulation ; - divergence ; - récit dominant.

## 24.9 Silence et refus

Distinguer : - inconnu ; - non demandé ; - ne se souvient pas ; - refuse
; - embargo ; - volontairement exclu.

Ne pas interpréter psychologiquement le silence.

## 24.10 Capture libre

Journal doit avoir une « inbox mémoire » : - texte ; - audio ; - photo
; - vidéo ; - note brute.

> **La structuration ne doit jamais devenir une condition préalable à la
> transmission.**

## 24.11 Carte de mémoire

Journal peut montrer ce qui a déjà été transmis : - personnes ; - lieux
; - périodes ; - traditions ; - événements ; - photos ; - sujets peu
explorés.

Pas de score « mémoire complétée ».

« Non documenté » ≠ « la personne ne sait pas ».

## 24.12 Questions ouvertes

Exemple : \> « Qui était Ti-René ? »

Cette question peut : - rester ouverte ; - être transmise à une autre
personne ; - recevoir plusieurs réponses ; - être résolue plus tard par
Rebond.

## 24.13 Campagnes de mémoire

Une campagne peut : - interroger plusieurs personnes ; - poser questions
communes ; - poser questions personnalisées ; - faire identifier photos
; - reprendre questions non résolues.

Les réponses indépendantes initiales doivent être conservées avant
confrontation collective.

Une discussion collective devient une nouvelle source.

## 24.14 Capsules de transmission

Une personne peut créer une capsule : - pour un enfant ; - une
génération future ; - une personne non encore née ; - un destinataire
futur.

Conditions : - date ; - âge ; - décès ; - autre condition.

Capsule ≠ embargo.

## 24.15 Custodiens et succession

Un dépositaire/custodien peut gérer certains contenus sans devenir
auteur ni parler au nom du défunt.

Distinguer : - auteur ; - dépositaire ; - destinataire ; - successeur
; - administrateur.

## 24.16 Consentement

Consentement explicite/versionné/horodaté pour : - audio ; -
transcription ; - usage familial ; - usage projet ; - publication ; -
posthume.

Embargo possible.

------------------------------------------------------------------------

# 25. Echo --- définition complète

> **Echo est l'espace de travail du généalogiste : il organise ses
> contacts, recherches, projets, déplacements, consultations d'archives,
> ressources et collaborations, tout en conservant la mémoire de ce qui
> a déjà été fait.**

Tree = ce que je sais.\
Rebond = ce que les sources disent.\
Journal = ce que les personnes savent.\
Echo = ce que je cherche, ce que j'ai fait, pourquoi, avec qui, où,
comment et ce qu'il reste à faire.

## 25.1 Contacts

Echo peut gérer : - institutions ; - archivistes ; - associations ; -
familles ; - chercheurs ; - interlocuteurs.

Avec : - historique ; - demandes ; - réponses ; - relances ; - notes
privées.

## 25.2 Missions d'archives

Avant : - centre ; - date ; - objectifs ; - cotes ; - questions ; -
contraintes ; - pages à refaire.

Pendant : - commandé ; - communiqué ; - consulté ; - refusé ; - absent
; - photographié ; - incomplet ; - nouvelle piste.

Après : - exploitation Rebond ; - résultat négatif ; - nouvelle question
; - coût ; - compte rendu.

## 25.3 Niveaux de consultation

Distinguer : - repéré au catalogue ; - commandé ; - communiqué ; -
consultation partielle ; - consultation exhaustive ; - reproduction ; -
exploitation.

Une recherche négative n'a pas la même valeur selon le niveau atteint.

## 25.4 Mission déléguée

Une mission peut être confiée : - à soi ; - à un tiers ; - à un
professionnel ; - à un bénévole.

Accès temporaire et limité possible.

Chaîne :
`commanditaire → consultant → photographe → transcripteur → interprète → validateur`

## 25.5 Mutualisation de déplacements

Un utilisateur allant aux archives peut accepter des micro-missions.

Privacy by default.

Pas d'exposition automatique des projets privés.

## 25.6 Trajectoire → stratégie d'archives

À partir : - fonctions ; - institutions ; - périodes ; - événements ; -
lieux,

Echo peut suggérer : - fonds ; - séries ; - types de documents.

Mais : \> suggérer une source possible ≠ affirmer qu'elle existe.

## 25.7 Protocoles

Un protocole peut être : - personnel ; - équipe ; - communauté ; - pays
; - période ; - type de problème.

Il est : - versionné ; - partageable ; - citable ; - conditionnel.

GENIIUS peut apprendre des résultats pour suggérer des améliorations.

Jamais de modification silencieuse.

## 25.8 Régularités

Trois niveaux : 1. pattern détecté automatiquement ; 2. règle
méthodologique proposée ; 3. règle adoptée humainement.

Exemple : une régularité observée dans un registre particulier ne
devient pas règle universelle.

## 25.9 Question de recherche

Objet autonome :
`Question → pistes → hypothèses → actions → résultats → nouvelles pistes → conclusions`

Branches : - réussies ; - suspendues ; - réfutées ; - bloquées.

## 25.10 Conclusion de recherche

Contient : - question ; - conclusion ; - arguments favorables ; -
arguments défavorables ; - assertions ; - sources ; - raisonnement ; -
auteur ; - date ; - version ; - certitude ; - questions ouvertes.

Elle peut être citée comme production secondaire tout en restant reliée
aux preuves.

## 25.11 Critères d'arrêt

Une question peut définir ce que signifie « suffisamment recherché ».

Exemple : parents de Charles TANCRÈDE : - état civil ; - fiche matricule
; - documents judiciaires ; - variantes nominales ; - certaines minutes.

Le protocole peut être accompli sans que l'Histoire soit « exhaustive ».

## 25.12 Recherchabilité

États possibles : - pistes disponibles ; - pistes potentielles ; -
bloqué actuellement ; - aucune piste connue ; - insolubilité fortement
documentée.

Cette dernière catégorie doit rester exceptionnelle.

Une question peut redevenir recherchable.

## 25.13 Santé de la recherche

Vue qualitative : - à vérifier ; - provenance à retrouver ; -
contradictions ; - sources non exploitées ; - hypothèses affectées ; -
questions bloquées.

Pas de : \> « projet complété à 63 % ».

> **GENIIUS mesure le travail connu restant à examiner, jamais le
> pourcentage d'Histoire restant à découvrir.**

## 25.14 Réouverture d'une question

Une question « résolue » peut devenir « à réexaminer » si : -
identification invalidée ; - transcription corrigée ; - source
dépendante ; - reconstruction modifiée ; - nouvelle contradiction.

Mais pas pour une correction sans incidence scientifique.

## 25.15 Snapshots

Echo peut figer : - état intellectuel ; - questions ; - hypothèses ; -
corpus ; - conclusions ; - méthodes.

Snapshot nommé, daté, citable.

## 25.16 Knowledge diff

Comparer deux états : - ce qui a changé ; - pourquoi ; - découverte
déclenchante ; - conséquences ; - technique vs scientifique.

## 25.17 Découverte

Une découverte peut être formalisée : - quoi ; - qui ; - quand ; -
projet ; - preuves ; - raisonnement ; - état antérieur modifié.

Distinguer : - nouveau pour projet ; - nouveau dans GENIIUS ; - priorité
scientifique externe.

GENIIUS ne revendique jamais automatiquement « première mondiale ».

## 25.18 Succession de recherche

Un projet peut être transmis avec : - questions ; - hypothèses ; -
impasses ; - recherches négatives ; - méthodes ; - tâches ; - pistes.

Distinguer : - dépositaire ; - successeur scientifique ; - successeur de
gouvernance ; - destinataire patrimonial.

Le successeur ne devient pas auteur rétroactif.

## 25.19 Cycle de vie du projet

États : - actif ; - en sommeil ; - bloqué ; - clôturé dans son périmètre
; - transmis ; - abandonné ; - archivé.

Réouverture historisée.

## 25.20 Graphe de projets

Relations : - issu de ; - prolonge ; - complète ; - réexamine ; -
conteste ; - réutilise corpus ; - parent/sous-projet ; - succède à.

*V1.2 : programmes, rattachement bilatéral et multiple, habilitations de groupe → § 120 et § 122.*

------------------------------------------------------------------------

# 26. Tree --- souveraineté et Core partagé

## 26.1 Indépendance

Chaque Tree : - est indépendant ; - appartient à son espace ; - peut
venir d'un GEDCOM ; - ne fusionne pas automatiquement avec un arbre
mondial.

## 26.2 Lien vers entité Core

Utilisateur A : - Arsène CHARBONNÉ dans son Tree.

Utilisateur B : - Arsène CHARBONNÉ dans son Tree.

Ils peuvent relier leurs personnes à la même entité Core.

Conséquences : - Trees restent distincts ; - A et B ne sont pas
automatiquement mis en relation ; - les données privées restent privées.

## 26.3 Trois flux

1.  **Tree → Core = contribuer**
2.  **Core → Tree = importer**
3.  **Tree ↔ Tree = comparer/collaborer**

Ne jamais les confondre.

## 26.4 Import Core → Tree

Sélectif.

Si le Core change : - notification ; - comparaison ; - mise à jour
volontaire ; - conservation locale possible.

Pas de modification silencieuse.

## 26.5 Comparaison Tree ↔ Tree

Deux utilisateurs autorisés peuvent comparer : - branches ; - individus
; - différences.

Ils peuvent importer entre eux sans nécessairement contribuer au Core.

------------------------------------------------------------------------

# 27. Atlas --- lieux et territoires

## 27.1 Le lieu comme entité historique

Un lieu possède : - identité ; - histoire ; - noms ; - rattachements ; -
fonctions ; - géométries successives.

Il peut exister même s'il n'existe plus aujourd'hui.

## 27.2 Chemin d'un lieu

Reconstituer : - commune ; - section ; - hameau ; - rue ; -
maison/habitation ; - occupants ; - voisins ; - limites ; - rivières ; -
lieux-dits.

## 27.3 Relations spatiales

Exemples : - contient ; - jouxte ; - au nord de ; - en amont ; - entre
; - traversé par ; - séparé par ; - proche de.

Relations : - temporelles ; - sourcées ; - contestables.

## 27.4 Localisation incertaine

Distinguer : - exacte ; - approximative ; - relative ; - zone possible
; - hypothèses concurrentes.

Absence de coordonnées ≠ absence de lieu.

## 27.5 Reconstruction spatiale

Une habitation : - jouxte A ; - est au nord de B ; - est traversée par
une rivière.

Ces relations peuvent réduire une zone plausible.

La carte devient résultat de recherche.

Ne jamais afficher un polygone précis si la preuve ne le permet pas.

## 27.6 Propriété et foncier

Distinguer : - lieu ; - bien/actif ; - droit sur bien ; - détenteur.

Droits : - propriété ; - usufruit ; - indivision ; - hypothèque ; - bail
; - concession.

Trajectoire : - vente ; - héritage ; - division ; - fusion ; -
changement de nom ; - correspondance cadastrale.

## 27.7 Couches spatiales distinctes

-   géographie physique ;
-   territoire historique ;
-   parcelle/propriété ;
-   division administrative/institutionnelle ;
-   occupation/usage du sol.

## 27.8 Rattachements multiples

Un lieu peut dépendre simultanément de géographies : - administrative
; - religieuse ; - judiciaire ; - cadastrale ; - électorale ; -
militaire ; - postale.

## 27.9 Environnement

Contexte : - rivière ; - relief ; - cyclone ; - sécheresse ; - éruption
; - littoral ; - routes ; - épidémie.

Proximité ≠ causalité.

## 27.10 Phénomène historique

Objet fédérateur : - épidémie ; - cyclone ; - guerre ; - famine ; -
crise ; - grève ; - révolte ; - incendie.

Relie : - événements locaux ; - institutions ; - populations ; -
décisions ; - trajectoires.

------------------------------------------------------------------------

# 28. Voyages et déplacements

Un voyage peut être un objet : - étapes ; - participants ; - transport
; - dates ; - contraintes ; - preuves par étape.

Atlas ne doit pas inventer un trajet entre deux présences attestées.

Exemple : présence Guadeloupe → présence Guyane ne suffit pas à
déterminer : - navire ; - route ; - escales ; - date précise.

------------------------------------------------------------------------

# 29. Organisations, fonctions et institutions

## 29.1 Organisation

Entité : - mairie ; - paroisse ; - tribunal ; - entreprise ; - prison
; - unité militaire ; - étude notariale ; - service d'archives.

Trajectoire : - nom ; - siège ; - dépendance ; - fusion ; - dissolution
; - remplacement.

## 29.2 Structures internes

Relations : - composante de ; - dépend de ; - établissement de ; -
succède à ; - absorbe ; - fusionne avec.

## 29.3 Fonction/Poste

Distinguer : - organisation ; - poste/fonction ; - personne ; -
mandat/tenure.

Un poste peut : - changer de nom ; - changer de compétence ; - être
supprimé ; - être remplacé.

------------------------------------------------------------------------

# 30. Biens, objets et moyens de transport

## 30.1 Bien/Actif

Séparé du lieu.

Un bien peut être : - vendu ; - transmis ; - hypothéqué ; - loué ; -
partagé.

## 30.2 Objet matériel

Exemples : - bague ; - médaille ; - tableau ; - meuble ; - machine ; -
instrument.

Ne pas créer une entité pour chaque chaise mentionnée dans un
inventaire.

Individualiser seulement lorsque historiquement utile.

## 30.3 Navire

Type spécialisé possible : `Objet > Moyen de transport > Navire`

Le navire a une trajectoire.

Un voyage est un événement.

Le navire peut servir de contexte spatial temporaire sans devenir un
lieu géographique.

------------------------------------------------------------------------

# 31. Concepts et référentiels

## 31.1 Historique vs normalisé

Le mot exact d'une source reste conservé.

Un concept normalisé peut être lié pour : - recherche ; - comparaison
; - statistiques.

## 31.2 Termes historiques

Distinguer : - terme ; - concept ; - usage historique.

Le sens d'un terme peut varier : - période ; - territoire ; - corpus.

## 31.3 Référentiels multi-niveaux

-   personnel/projet ;
-   communautaire ;
-   GENIIUS commun.

Une communauté peut proposer une promotion vers le commun.

Pas de promotion automatique par popularité.

## 31.4 Cadres incompatibles

Deux communautés peuvent avoir des modèles différents.

Correspondances possibles : - équivalent ; - plus large ; - plus
spécifique ; - proche ; - incompatible ; - contesté ; - inconnu.

> **GENIIUS recherche l'interopérabilité sans imposer artificiellement
> l'uniformité.**

------------------------------------------------------------------------

# 32. Photos comme sources

## 32.1 Objet photographique complet

Conserver : - recto ; - verso ; - inscriptions ; - tampons ; - numéro
; - mains ; - annotations ; - date approximative ; - histoire
matérielle.

## 32.2 Assertions concurrentes

Verso : \> « Joseph »

Annotation ultérieure : \> « non, Paul »

Témoin Journal : \> « c'est Henri »

Trois assertions possibles.

Aucune ne doit écraser silencieusement les autres.

## 32.3 Albums

Préserver : - album ; - pages ; - slots ; - ordre ; - photos ; -
emplacements vides.

Un emplacement vide peut avoir une valeur documentaire.

Un album dispersé peut être reconstruit virtuellement.

------------------------------------------------------------------------

# 33. Vision, voix, signatures et mains

## 33.1 Détection visuelle ≠ identification

GENIIUS peut détecter : \> individu visuel inconnu P-184

et le suivre sur plusieurs photos.

Cela ne signifie pas connaître son identité.

## 33.2 Biométrie

L'IA peut proposer des rapprochements de visage ou voix.

Jamais identifier automatiquement.

Pour personnes vivantes : - opt-in fort ; - protections spécifiques.

Pour mineurs : - régime encore plus restrictif.

## 33.3 Voix

`segment audio → cluster voix → hypothèse d’identité → Personne`

## 33.4 Signatures

Une signature est une trace : - image ; - zone ; - date ; - qualité ; -
signataire supposé ; - confiance.

Similarité de signatures ≠ identité prouvée.

« N'a pas signé » ≠ « illettré ».

## 33.5 Mains d'écriture

GENIIUS peut suivre : \> Main H-17

dans plusieurs documents.

Puis proposer : - même scribe ; - auteur possible.

Jamais imposer.

------------------------------------------------------------------------

# 34. Datation croisée et indices visuels

Une source peut aider à dater une autre.

Exemple : - vêtement ; - bâtiment ; - personne ; - objet ; - événement
; - inscription.

Conserver : - bornes ; - indices ; - raisonnement ; - dépendances.

Si un indice change, la datation dépendante est à réexaminer.

L'âge apparent : - intervalle large ; - interprétation ; - jamais date
de naissance.

------------------------------------------------------------------------

# 35. Récits concurrents et événements rapportés

## 35.1 Version/Récit d'événement

Peut provenir : - accusé ; - victime ; - témoin ; - police ; - tribunal
; - presse ; - chercheur.

Chaque récit peut avoir : - séquence ; - participants ; - causalité ; -
assertions.

La version judiciaire est une version institutionnelle, pas
automatiquement la réalité.

## 35.2 Déclaration vs fait

Distinguer : - « le témoin déclare X » ; - « X s'est produit ».

Le premier peut être certain même si le second est contesté.

------------------------------------------------------------------------

# 36. Décisions, effets et réalisation

Distinguer : 1. acte/décision ; 2. effet juridique/administratif ; 3.
réalisation effective.

Exemples : - autorisation de voyage ≠ voyage ; - permis ≠ bâtiment
construit ; - condamnation ≠ temps effectivement purgé.

------------------------------------------------------------------------

# 37. Intentions, projets et non-événements

Représenter : - intention ; - demande ; - projet ; - autorisation ; -
refus ; - abandon ; - commencement ; - réalisation ; - interruption.

Un projet abandonné ne doit pas devenir un événement réalisé.

------------------------------------------------------------------------

# 38. Statistiques historiques

Distinguer : 1. statistique écrite dans une source ; 2. statistique
calculée par GENIIUS ; 3. estimation du chercheur.

Toute statistique calculée conserve : - corpus ; - méthode ; -
couverture ; - version ; - date.

> « 146 décès dans le corpus GENIIUS » ≠ « 146 décès réels dans la
> population ».

------------------------------------------------------------------------

# 39. Corpus et jeux de recherche

Un corpus peut être : - manuel ; - basé sur critères ; - dynamique ; -
snapshot figé ; - privé ; - collaboratif ; - public.

Conserver : - définition ; - auteur ; - version ; - inclusion/exclusion
; - date.

Le corpus peut être cité.

------------------------------------------------------------------------

# 40. Reproductibilité

Un résultat doit pouvoir être relié à :

`Corpus versionné + Méthode versionnée + Concepts/référentiels + Algorithme/version + État de connaissance → Résultat`

## 40.1 Trois notions

-   **Reproduction** : mêmes données/état + même méthode → ancien
    résultat.
-   **Rerun** : même méthode sur état actuel/nouveau corpus.
-   **Nouvelle analyse** : méthode et/ou données intentionnellement
    changées.

Ne pas appeler « reproduction » un rerun sur un autre corpus.

------------------------------------------------------------------------

# 41. Résultats dynamiques et obsolescence

Trois types :

## 41.1 Dynamique

Recalcul selon état courant.

## 41.2 Figé/versionné

Reste lié à état/corpus historique.

## 41.3 Potentiellement obsolète

Dépendance modifiée mais résultat pas encore recalculé.

Afficher : - date dernier calcul ; - état utilisé ; - dépendances
changées ; - statut de fraîcheur.

> **GENIIUS doit savoir qu'un résultat peut être périmé sans être obligé
> de le recalculer immédiatement.**

------------------------------------------------------------------------

# 42. Recherche globale

GENIIUS doit proposer : - recherche globale transversale ; - recherches
spécialisées.

Résultats regroupés : - personnes ; - lieux ; - sources ; - mentions ; -
projets ; - publications ; - médias ; - etc.

Distinguer : - recherche textuelle ; - recherche d'entité.

------------------------------------------------------------------------

# 43. Requêtes complexes

Une requête peut être : - sauvegardée ; - versionnée ; - partagée ; -
citée.

Distinguer : - requête dynamique ; - résultat figé.

Modes : - **Strict** ; - **Recherche** ; - **Exploratoire**.

Les modes définissent les niveaux d'incertitude/validation acceptés.

------------------------------------------------------------------------

# 44. Page transversale d'entité

Une entité importante peut avoir un espace transversal montrant selon
droits : - formes d'identité ; - chronologie ; - relations ; - lieux ; -
sources ; - mentions ; - médias ; - Journal ; - hypothèses ; -
controverses ; - Echo ; - Tree links ; - questions ouvertes.

Ce n'est pas un dossier de « vérité ».

C'est l'interface vers ce que GENIIUS : - sait ; - suppose ; - conteste
; - recherche.

------------------------------------------------------------------------

# 45. Synthèses multiples

Une même entité peut avoir : - synthèse documentaire stricte ; -
synthèse projet ; - synthèse communautaire ; - synthèse Tree ; -
synthèse chercheur.

Chaque synthèse conserve : - auteur/règle ; - contexte ; - date ; -
version ; - assertions sous-jacentes.

Pas de valeur maître universelle.

------------------------------------------------------------------------

# 46. Exploration du graphe

GENIIUS doit permettre : - exploration libre ; - filtres temporels ; -
filtres documentaires ; - filtres de confiance ; - chemins entre
entités.

Visuellement/conceptuellement distinguer : - attesté ; - hypothétique
; - calculé ; - cooccurrence.

------------------------------------------------------------------------

# 47. Workspaces privés

Un espace temporaire permet : - épingler ; - déplacer ; - grouper ; -
noter ; - tracer des liens exploratoires.

Sans modifier le Core.

> **Penser dans GENIIUS ne doit pas nécessairement publier dans
> GENIIUS.**

Un workspace peut devenir : - dossier privé ; - projet Echo ; - snapshot
; - espace partagé ; - archive ; - supprimé.

La position visuelle d'un objet sur la table n'est pas une assertion
historique.

------------------------------------------------------------------------

# 48. Collections, tags et Inbox

## 48.1 Collections

Collection = organisation légère.

Distincte de : - workspace ; - corpus ; - projet Echo.

## 48.2 Tags

Tags libres : - personnels ; - collaboratifs.

Distincts de : - concept contrôlé ; - assertion historique.

## 48.3 Inbox

Capture rapide : - fichier ; - lien ; - note ; - photo ; - audio ; -
document reçu.

Puis : `capturé → qualifier → rattacher → traiter → archiver`

Pas d'analyse IA lourde automatique à l'entrée.

------------------------------------------------------------------------

# 49. Gouvernance du Core partagé

## 49.1 Rôles

-   contributeur ;
-   validateur ;
-   référent communautaire ;
-   modérateur ;
-   administrateur technique.

## 49.2 Séparation

Modération ≠ expertise scientifique.

Administration technique ≠ autorité historique.

> **GENIIUS gouverne les processus de contribution ; il ne décrète pas
> administrativement la vérité historique.**

## 49.3 Désaccord

Préférer : - coexistence ; - arguments ; - état du débat ;

à un bouton « version vraie ».

------------------------------------------------------------------------

# 50. Validation et contestation

Cycle possible :

`Proposée → En vérification → Validée → Contestée → Réexamen → Confirmée / Corrigée / Indéterminée`

> **Dans GENIIUS, "validé" ne veut jamais dire "figé".**

« Vérifié » signifie : le processus applicable a été satisfait à cet
instant.

Pas : - vérité absolue ; - impossibilité de révision.

------------------------------------------------------------------------

# 51. Réexamen et appel scientifique

Une décision scientifique peut être réexaminée si : - nouvelle preuve
; - nouvel argument ; - erreur de méthode ; - nouvelle lecture.

Réexamen ≠ appel de modération.

Une majorité ne suffit pas.

15 votes ne battent pas nécessairement une preuve décisive.

------------------------------------------------------------------------

# 52. Consensus et vérité

Distinguer : - force documentaire ; - état de validation ; - état du
débat.

Consensus = état social de la connaissance.

Il ne remplace pas la preuve.

Une contestation solide peut rouvrir 50 validations antérieures.

------------------------------------------------------------------------

# 53. Réputation

Distinguer : - expertise scientifique ; - qualité contributive ; -
responsabilités ; - état de modération.

Pas de score global : \> « 8 742 points GENIIUS »

Pas de classement public général.

## 53.1 Badges

Deux familles : - badges d'expérience ; - qualifications/rôles.

Exemple : - 500 actes transcrits = expérience constatée ; - référent
paléographie = rôle attribué selon procédure.

Aucun badge n'est une preuve.

------------------------------------------------------------------------

# 54. Crédits et auteurs

Distinguer : - auteur ; - coauteur ; - contributeur intellectuel ; -
transcripteur ; - identificateur ; - vérificateur ; - photographe ; -
logisticien ; - relecteur ; - personne remerciée.

Exemple : - A signale la cote ; - B photographie ; - C déchiffre trois
mots ; - D établit la conclusion.

Ne pas transformer tout le monde en coauteur.

------------------------------------------------------------------------

# 55. Financement et conflits d'intérêts

Un projet peut documenter : - autofinancement ; - association ; -
université ; - collectivité ; - subvention ; - mécénat ; - crowdfunding.

Distinguer : - source de financement ; - coût Echo ; - obligation
associée.

Financement par X ne signifie pas automatiquement biais par X.

## 55.1 Liens pertinents

Exemples : - valide sa propre famille ; - propriétaire du fonds ; -
membre du projet évalué ; - participant à l'événement.

Un lien contextualise.

Il n'invalide ni ne valide automatiquement.

## 55.2 Indépendance des validations

Trois validateurs de la même équipe ne doivent pas être présentés comme
trois validations entièrement indépendantes.

------------------------------------------------------------------------

# 56. Identité publique des contributeurs

GENIIUS peut connaître l'identité en interne tout en affichant : - nom
réel ; - pseudonyme stable ; - identité masquée.

Pour certains rôles de confiance : - vérification d'identité plus forte
possible.

Mais pas nécessairement affichage public de l'identité civile.

Pas de validations scientifiques structurantes par comptes anonymes
jetables.

------------------------------------------------------------------------

# 57. Communautés

Une communauté GENIIUS est : \> un espace de coopération autour d'un
objet historique, documentaire ou méthodologique.

Pas : - fil algorithmique ; - followers ; - likes ; - engagement
maximal.

Peut partager : - protocoles ; - corpus ; - questions ; - ressources ; -
campagnes ; - discussions ; - référentiels.

Les discussions devraient être autant que possible rattachées à des
objets de travail.

------------------------------------------------------------------------

# 58. Compétences et intérêts

Distinguer : - centres d'intérêt déclarés ; - compétences déclarées ; -
expérience observable ; - réputation contextuelle.

GENIIUS ne doit pas fabriquer publiquement : \> « expert de l'esclavage
en Guadeloupe »

simplement en observant l'activité.

L'utilisateur choisit : - visibilité ; - disponibilité pour
sollicitations.

------------------------------------------------------------------------

# 59. Demandes entre utilisateurs

GENIIUS peut permettre : - demande de source ; - vérification ; -
photo-identification ; - avis ; - mission d'archives ; - collaboration.

Sans : - exposer adresse mail ; - exposer collection privée ; -
messagerie ouverte par défaut.

Options : - désactiver ; - limiter catégories ; - anti-spam ; - bloquer
; - répondre sans révéler identité.

------------------------------------------------------------------------

# 60. Communautés concernées par l'histoire

Une personne ou communauté peut déclarer une relation : - descendant ; -
membre ; - habitant ; - détenteur de tradition ; - association
mémorielle.

Cette position peut donner : - capacité de contextualiser ; - contribuer
; - signaler ; - dialoguer.

Mais : - proximité ≠ vérité automatique ; - distance académique ≠ vérité
automatique.

Cas important : les communautés concernées peuvent signaler qu'un terme
historiquement exact nécessite un contexte public.

La transcription originale reste intacte.

------------------------------------------------------------------------

# 61. Droits et visibilité

## 61.1 Niveaux possibles

-   privé ;
-   projet ;
-   famille ;
-   cercle invité ;
-   communauté GENIIUS ;
-   public non indexé ;
-   public indexable.

## 61.2 Trois dimensions

Distinguer : 1. visibilité --- qui voit ? 2. découvrabilité --- qui
trouve ? 3. réutilisation --- que peut-on faire ?

*V1.2 : consultation ou réutilisation d'une branche partagée → § 126.2 ; révocation → § 132.*

Publicement visible ≠ librement téléchargeable/réutilisable.

------------------------------------------------------------------------

# 62. Permissions granulaires

Permissions par : - portée ; - action ; - durée ; - sensibilité.

Actions : - voir ; - commenter ; - proposer ; - transcrire ; - valider
; - éditer ; - administrer ; - exporter ; - repartager ; - contribuer au
Core.

Des rôles simples peuvent masquer cette complexité dans l'UX.

------------------------------------------------------------------------

# 63. Propositions de modification

Une personne peut : - proposer une correction ; - justifier ; - joindre
preuve.

Le propriétaire/responsable peut : - accepter ; - refuser ; - discuter.

Le crédit du proposant reste conservé.

Pas besoin d'une revue formelle pour chaque virgule.

------------------------------------------------------------------------

# 64. Conflits d'édition

Auto-merge seulement pour modifications compatibles et non sémantiques.

Pour conflit scientifique : - état précédent ; - proposition A ; -
proposition B ; - auteurs ; - dates ; - raisons ; - source.

Pas de « last write wins ».

Une troisième lecture ou une indétermination peut être conservée.

------------------------------------------------------------------------

# 65. Organisations et gouvernance de projet

Espaces organisationnels : - association ; - laboratoire ; - service
d'archives ; - collectivité ; - entreprise ; - cabinet professionnel.

Un projet peut survivre au départ d'un membre.

Distinguer : - gouvernance ; - administration ; - responsabilité
scientifique ; - collaboration.

## 65.1 Transfert de gouvernance

Conserver : - autorisation ; - date ; - périmètre ; - exclusions ; -
conditions.

> **Le transfert d'un contenant ne doit jamais outrepasser les droits
> attachés à son contenu.**

------------------------------------------------------------------------

# 66. Personnes vivantes

Distinguer : - vivant attesté/raisonnablement traité comme vivant ; -
décédé attesté ; - statut vital inconnu.

La règle de confidentialité ne doit pas fabriquer un fait historique.

Décès ≠ publication automatique de données privées.

------------------------------------------------------------------------

# 67. Revendiquer sa propre entité

Distinguer : - compte utilisateur ; - Personne Core ; - lien vérifié «
je suis cette personne ».

Ce lien peut permettre : - mémoire autobiographique ; - consentement ; -
signalement de correction ; - volontés numériques.

Il ne donne pas propriété sur l'entité.

------------------------------------------------------------------------

# 68. Version de la personne concernée

Une personne vivante peut déposer : - son témoignage ; - sa contestation
; - sa version.

Cela a une valeur documentaire particulière : - témoignage direct ; -
autobiographique.

Mais cela n'efface pas automatiquement : - archives ; - autres
témoignages ; - autres interprétations.

------------------------------------------------------------------------

# 69. Contenus concernant plusieurs personnes

Un témoignage ou une photo peut concerner plusieurs personnes.

Les droits du déposant ne règlent pas automatiquement les droits de
tous.

Le système peut : - signaler vivants ; - masquer ; - pseudonymiser ; -
mettre embargo ; - demander autorisation.

Sans exiger bureaucratiquement une signature pour chaque anecdote.

------------------------------------------------------------------------

# 70. Masquage, pseudonymisation, anonymisation

Distinguer strictement : - masquage ; - pseudonymisation ; -
anonymisation réelle.

Supprimer le nom ne garantit pas l'anonymat.

Une version publique pseudonymisée peut rester reliée en interne à
l'original pour les utilisateurs autorisés.

------------------------------------------------------------------------

# 71. Mineurs

Protection renforcée : - publication ; - indexation ; - médias ; -
biométrie.

Présence dans Tree ≠ permission de publication.

Réévaluation possible à la majorité.

------------------------------------------------------------------------

# 72. Consentement Journal et volontés numériques

Consentements : - versionnés ; - horodatés ; - granulaires.

Volontés : - conserver ; - transmettre ; - publier ; - remettre ; -
supprimer ; - transmettre enregistrements.

Par catégorie/projet.

Pas forcément tout le compte.

------------------------------------------------------------------------

# 73. Droits par dépendance

Une production dérivée ne doit pas contourner les droits de sa source.

Mais une dépendance privée ne rend pas automatiquement tout le résultat
privé.

Questions : - le résultat révèle-t-il le contenu protégé ? - existe-t-il
des preuves publiques indépendantes ? - l'existence même de la source
est-elle confidentielle ? - l'embargo porte-t-il sur média,
transcription, information ou usage ?

Résultats : - publiable ; - publiable avec provenance masquée ; -
autorisation requise ; - publication interdite pendant embargo.

------------------------------------------------------------------------

# 74. Vérifiabilité relative aux droits

Distinguer : - état de connaissance ; - accessibilité des preuves ; -
vérifiabilité pour l'utilisateur.

Deux utilisateurs peuvent voir la même assertion avec des possibilités
de vérification différentes.

GENIIUS ne doit pas afficher : \> « 3 preuves vérifiées »

à quelqu'un qui ne peut en examiner qu'une.

------------------------------------------------------------------------

# 75. Validation passée et preuve devenue inaccessible

Distinguer :

### Historique de validation

> vérifiée en 2028 par A/B/C à partir de R.

### Vérifiabilité actuelle

-   accessible ;
-   partielle ;
-   inaccessible ;
-   disparue ;
-   inconnue.

Une validation passée n'est pas effacée.

Mais elle ne doit pas être présentée comme reproductible aujourd'hui si
elle ne l'est plus.

------------------------------------------------------------------------

# 76. Publication

Une publication est : - volontaire ; - sélectionnée ; - versionnée.

*V1.2 : séries, circuit éditorial, diffusions et abonnements → § 130.*

Elle ne rend pas tout le projet public.

On peut publier : - entités ; - chronologie ; - carte ; - corpus ; -
conclusion ; - article.

En gardant : - notes ; - témoignages ; - sources privées ; - brouillons
;

privés.

------------------------------------------------------------------------

# 77. Corrections de publication

Distinguer : - correction éditoriale mineure ; - erratum/corrigendum
scientifique ; - nouvelle édition ; - version superseded ; - retrait
motivé.

> **GENIIUS corrige la connaissance sans réécrire rétrospectivement
> l'histoire de ce qui a été publié.**

------------------------------------------------------------------------

# 78. Couche publique Web

Une personne non connectée peut consulter des contenus explicitement
publiés.

Exemple : recherche Web « Charles TANCRÈDE Deshaies ».

Une page publique peut montrer : - formes attestées ; - chronologie ; -
lieux ; - sources publiques ; - publications ; - citations.

Mais : accessible dans GENIIUS ≠ public Web ≠ indexable.

------------------------------------------------------------------------

# 79. API et réutilisation externe

Prévoir architecturalement : - API privée ; - API partenaire/projet ; -
API publique patrimoniale.

Pas nécessairement au MVP.

L'API doit préserver : - IDs ; - provenance ; - version ; - incertitude
; - droits.

Ne pas aplatir : `birthDate = 1857-08-27` si la date est hypothétique.

------------------------------------------------------------------------

# 80. Licences

Pas de licence universelle GENIIUS.

Distinguer : - fait historique ; - reproduction ; - transcription ; -
annotation ; - reconstruction ; - corpus/base ; - publication.

GENIIUS peut vérifier compatibilité des licences avant publication.

Exemple : image non redistribuable : - transcription publiable ; -
analyse publiable ; - image bloquée.

Les règles juridiques précises devront être étudiées par pays.

------------------------------------------------------------------------

# 81. Propriété des contributions

Décision de principe : - travail privé reste contrôlé ; - contribution
explicite au Core partagé devient durable ; - attribution/provenance
reste ; - retrait arbitraire d'une connaissance intégrée/réutilisée
n'est pas garanti ; - suppression possible selon droits, vie privée,
erreur, obligations légales.

Traduction juridique à faire plus tard.

------------------------------------------------------------------------

# 82. Export et portabilité

GENIIUS ne doit pas être une prison.

Formats standards lorsque adaptés : - GEDCOM ; - CSV ; - JSON ; -
GeoJSON ; - bibliographique ; - médias originaux autorisés.

Plus : \> **format patrimonial GENIIUS**

Documenté et versionné.

Il doit préserver autant que possible : - IDs ; - relations ; -
assertions ; - sources ; - hypothèses ; - provenance ; - versions ; -
droits ; - embargos ; - médias autorisés.

------------------------------------------------------------------------

# 83. Réimport et restauration

Le format patrimonial doit pouvoir être réimporté.

Si Core a évolué : - identique → reconnecter ; - local modifié →
comparer ; - Core évolué → proposer lien ; - incompatible → résolution
isolée.

Restaurer un espace privé ≠ republier automatiquement dans Core partagé.

------------------------------------------------------------------------

# 84. Import externe

L'import lui-même est une provenance.

Conserver : - logiciel ; - format ; - fichier original ; - date ; -
auteur/fournisseur ; - version ; - avertissements.

Une donnée importée sans source reste non sourcée.

Pas d'amélioration artificielle de qualité documentaire.

------------------------------------------------------------------------

# 85. Synchronisation externe

Décision : **hors périmètre pour l'instant.**

Import + export + restauration suffisent.

À revisiter plus tard.

------------------------------------------------------------------------

# 86. Identifiants externes

Une entité peut conserver : - identifiant officiel ; - lien externe
déclaré ; - correspondance candidate.

Lien externe ≠ identité prouvée.

Pas besoin d'interroger continuellement le service externe.

------------------------------------------------------------------------

# 87. Liens profonds

Liens persistants vers : - entité ; - assertion ; - mention ; - ligne
; - zone image ; - minute audio ; - hypothèse ; - conclusion versionnée
; - carte Atlas.

Lien courant ≠ citation figée.

Les droits s'appliquent toujours.

------------------------------------------------------------------------

# 88. Pérennité patrimoniale

Principe fondateur :

> **GENIIUS doit minimiser la dépendance du patrimoine scientifique et
> familial à l'existence future de la plateforme elle-même.**

Conséquences : - formats documentés ; - migrations ; - IDs stables ; -
exports ; - documentation ; - sauvegardes ; - restauration testée ; -
possibilité de dépôt institutionnel/patrimonial.

Pérenniser ≠ publier.

Un embargo doit survivre à la conservation.

Pas de promesse actuelle « 100 ans ».

------------------------------------------------------------------------

# 89. Succession d'un projet

Un projet peut désigner : - successeur de gouvernance ; - successeur
scientifique ; - dépositaire patrimonial ; - destinataires.

Ils peuvent être différents.

La succession ne : - change pas les auteurs ; - n'ouvre pas les embargos
; - ne donne pas de droits non possédés.

------------------------------------------------------------------------

# 90. Historique personnel et sessions

GENIIUS peut conserver : - historique de navigation ; - session de
travail ; - éléments récents.

Distinguer : - historique personnel ; - action Echo ; - logs techniques
; - Core.

La navigation ne nourrit pas le Core.

L'utilisateur peut désactiver/purger selon règles.

------------------------------------------------------------------------

# 91. Veille

Distinguer :

### Suivre

Objet d'intérêt durable.

### Surveiller

Être alerté si une condition survient.

Exemples : - nouvelle source liée à Charles ; - identification contestée
; - nouvelle mention CHARBONNÉ à Deshaies ; - nouvelle personne liée à
Dolé 1790--1810 ; - source devenue accessible ; - élément pertinent pour
question Echo.

Une requête dynamique peut devenir veille.

------------------------------------------------------------------------

# 92. Notifications

Caractéristiques : - hiérarchisées ; - groupables ; - explicables ; -
configurables.

Modes : - immédiat ; - digest ; - in-app ; - silencieux/historique.

Pas de notifications d'engagement : \> « Vous n'êtes pas venu depuis 5
jours ».

> **La notification GENIIUS sert la continuité de la recherche et de la
> transmission, pas la captation de l'attention.**

------------------------------------------------------------------------

# 93. Sobriété numérique et IA

## 93.1 Principe

GENIIUS doit fonctionner pleinement sans IA générative.

Préférer : - SQL ; - recherche structurée ; - règles ; - algorithmes
classiques ; - modèles légers.

IA lourde uniquement : - explicitement déclenchée ; - ou réellement
nécessaire.

## 93.2 Pas d'IA pour ce qui est déterministe

Ne pas appeler un LLM pour : - filtrer ; - joindre ; - compter ; -
appliquer règle ; - faire une recherche structurée.

## 93.3 Transparence

Indiquer : - utilisation IA ; - modèle/moteur important ; - version ; -
paramètres décisifs ; - date ; - intervention humaine.

## 93.4 Données sensibles

Ne pas envoyer aveuglément : - arbres ; - témoignages ; - médias privés
;

à un fournisseur externe.

Minimiser : - contexte ; - données ; - identifiants.

Étudier : - rétention ; - entraînement ; - sous-traitants ; - pays.

## 93.5 Biographie générée

Deux niveaux : 1. chronologie factuelle mécanique ; 2. narration
éventuellement IA.

La narration : - est une synthèse ; - n'est jamais une source ; - reste
traçable.

> **GENIIUS peut raconter une vie, mais le récit ne devient jamais la
> preuve.**

------------------------------------------------------------------------

# 94. Apprentissage automatique et examen humain

Distinguer : - détecté automatiquement ; - préstructuré automatiquement
; - examiné humainement ; - corrigé humainement ; - validé.

Le temps ne transforme jamais automatiquement une proposition IA en
connaissance validée.

Les utilisateurs doivent pouvoir filtrer/exclure les résultats non
examinés humainement.

------------------------------------------------------------------------

# 95. Sécurité

Exigences de principe : - TLS ; - chiffrement au repos ; - hachage
robuste ; - MFA ; - isolation des espaces ; - URLs signées ; - logs
d'audit ; - gestion sessions/appareils ; - rate limiting ; - politique
vulnérabilités ; - sauvegardes chiffrées ; - restauration testée ; -
export/suppression ; - incident response.

------------------------------------------------------------------------

# 96. Classification des données

Catégories : - public ; - partagé ; - famille ; - privé ; - confidentiel
; - vivant ; - décédé ; - source publique ; - source privée ; -
témoignage ; - sensible ; - note privée ; - média ; - embargo.

Cette classification doit alimenter : - droits ; - publication ; -
export ; - IA ; - partage.

------------------------------------------------------------------------

# 97. Suppression, archivage et dépendances

Distinguer : - actif ; - archivé ; - corbeille/demande suppression ; -
suppression effective ; - conservation nécessaire/légitime.

Archiver ne doit pas contourner un droit à suppression.

Si une preuve est : - supprimée ; - restreinte ; - sous embargo ; -
disparue,

les connaissances dépendantes peuvent être signalées.

Ne pas conserver secrètement une copie supprimée pour sauver une
conclusion.

Distinguer : - « preuve n'est plus disponible dans GENIIUS » ; - «
preuve n'a jamais existé ».

------------------------------------------------------------------------

# 98. Sources externes et liens morts

Distinguer : - identité intellectuelle de la source ; - identifiant/cote
; - URL ; - état d'accès.

Une URL morte ne détruit pas la provenance.

Historiser : - ancienne URL ; - nouvel ARK ; - nouvelle plateforme ; -
accessibilité observée.

Ne pas archiver automatiquement tout Internet.

------------------------------------------------------------------------

# 99. Internationalisation

Architecture mondiale dès le départ.

Support : - langues ; - scripts ; - translittérations ; - calendriers
; - dates incertaines ; - frontières historiques ; - juridictions ; -
fuseaux ; - systèmes de parenté ; - référentiels locaux.

Lancement possible : France/francophonie d'abord.

Mais ne pas coder une conception française comme vérité universelle.

------------------------------------------------------------------------

# 100. Monétisation --- principes compatibles

Pistes : - Tree freemium ; - Journal plan famille/campagne mémoire ; -
Echo SaaS pro/association ; - Rebond crédits de calcul ; - Connect
paiement événement ; - Atlas à définir ; - bundle GENIIUS+.

Principe : \> **L'argent peut acheter de l'usage. Il ne peut jamais
acheter de la crédibilité scientifique.**

Les crédits ne doivent pas acheter : - validation ; - badge scientifique
; - réputation.

------------------------------------------------------------------------

# 101. Cas d'usage de référence à conserver pour la recette

## CU-01 --- Charles TANCRÈDE

Reconstituer une trajectoire 1881--1890 : - assises ; - cassation ; -
nouveau procès ; - rejet pourvoi ; - commutation ; - condamnation
pénitentiaire ; - évasion ; - double chaîne ; - décès aux Îles du Salut.

Vérifier : - chronologie ; - décisions vs exécution ; - variantes ; -
sources ; - copies ; - hypothèses ; - lacunes 1884--1888 ; - Echo ; -
Atlas ; - conclusions versionnées.

## CU-02 --- Habitation Dolé, recensement 1793

Source de plus de 200 personnes.

Vérifier : - exploitation exhaustive relative à protocole ; - personnes
incomplètes ; - personnes sans descendants ; - groupes ; - relations ; -
lieu ; - population ; - réutilisation par plusieurs chercheurs ; -
absence de hiérarchie humaine par volume documentaire.

## CU-03 --- Registre perdu des nouveaux libres de Deshaies

Vérifier : - document perdu ; - structure reconstruite ; - positions ; -
numéros ; - actes ultérieurs ; - hypothèses ; - dépendances ; -
concurrence de reconstructions ; - citations versionnées.

## CU-04 --- Projet CHARBONNÉ

Vérifier : - Tree privé ; - Core partagé ; - Rebond ; - Echo ; - Atlas
; - publications ; - contribution/import ; - snapshots ; - découverte
; - succession ; - pérennité.

## CU-05 --- Photo familiale

Vérifier : - recto/verso ; - album ; - inscriptions ; - identification
concurrente ; - témoin ; - IA visuelle ; - personne vivante ; - droits
; - publication.

## CU-06 --- Mémoire familiale

Vérifier : - auto-entretien ; - entretien tiers ; - question ouverte ; -
oubli ; - correction ; - nouveau récit ; - embargo ; - capsule ; -
campagne ; - dépositaire.

## CU-07 --- Mission aux archives

Vérifier : - préparation ; - cotes ; - délégation ; - micro-mission ; -
consultation partielle ; - reproduction ; - transfert ; - Rebond ; -
résultat négatif.

## CU-08 --- Reconstruction territoriale

Vérifier : - commune ; - section ; - hameau ; - rue ; - habitation ; -
maison ; - voisins ; - rivière ; - hypothèque ; - culture ; - parcelle
; - division ; - fusion ; - géométrie incertaine.

## CU-09 --- Statistique historique

Vérifier : - corpus ; - méthode ; - couverture ; - identité modifiée ; -
recalcul ; - résultat figé ; - résultat obsolète ; - explication du
diff.

## CU-10 --- Désaccord scientifique

Vérifier : - proposition ; - validations ; - liens entre validateurs ; -
contestation ; - preuve nouvelle ; - réexamen ; - coexistence ; -
crédit.

## CU-11 --- Publication à droits mixtes

Vérifier : - source publique ; - image non redistribuable ; - témoignage
privé ; - carte ; - analyse ; - licences ; - masquage ; - indexation.

## CU-12 --- Pérennité

Vérifier : - export ; - format patrimonial ; - réimport ; - Core évolué
; - réconciliation ; - droits ; - succession.

------------------------------------------------------------------------

# 102. Cas d'usage additionnels issus des échanges

## CU-13 --- « Un des fils de Jean DUPONT »

Une source ne permet pas de savoir lequel.

Attendu : - mention non résolue ; - candidats ; - arguments ; - pas de
faux quatrième enfant.

## CU-14 --- CHARBONNET / CHARBONNIER

Deux sources donnent deux formes.

Attendu : - deux formes conservées ; - aucune correction croisée ; -
recherche via variantes.

## CU-15 --- Emploi 1834 / 1837 / 1841

Attendu : - trois attestations ; - pas de continuité automatique ; -
hypothèse éventuelle distincte.

## CU-16 --- Photo « Joseph / Paul »

Attendu : - deux annotations concurrentes ; - auteur/date si connus ; -
témoin Journal possible ; - pas d'écrasement.

## CU-17 --- Convoi de 24 personnes

Une personne identifiée, 23 inconnues.

Attendu : - collectif ; - positions non résolues ; - individualisation
progressive ; - pas de 23 faux individus.

## CU-18 --- Statistique « 47 personnes à Dolé »

Une identité est scindée.

Attendu : - résultat courant peut devenir 48 ; - publication 2028 reste
47 ; - diff explicable.

## CU-19 --- Témoignage sous embargo utilisé dans une conclusion

Attendu : - ne pas contourner embargo ; - publication possible seulement
si démonstration indépendante ou règles le permettent ; - provenance
masquée si nécessaire.

## CU-20 --- Validation 2028, preuve disparue 2035

Attendu : - validation historique conservée ; - vérifiabilité actuelle
dégradée ; - Echo peut créer tâche « retrouver fondement ».

## CU-21 --- Arsène CHARBONNÉ dans deux Trees

Attendu : - deux Trees souverains ; - même entité Core possible ; -
aucune mise en relation automatique des propriétaires ; -
imports/contributions séparés.

## CU-22 --- Recherche d'une personne sans nom

Profil : - femme ; - Deshaies ; - période ; - enfants ; - lieu ; -
relations.

Attendu : - recherche par contraintes ; - candidats ; - compatibilités
; - incompatibilités ; - prochaine preuve discriminante ; - pas de
Personne fictive créée pour le profil.

## CU-23 --- Première/dernière attestation

Attendu : - « première attestation connue » ; - « dernière attestation
connue » ; - pas « arrivée » ou « disparition » automatique.

## CU-24 --- Autorisation de voyage

Attendu : - intention/autorisation ; - pas de voyage créé sans preuve de
réalisation.

## CU-25 --- Série d'archives avec acte manquant

Attendu : - anomalie ; - pistes ; - pas de conclusion automatique «
détruit ».

------------------------------------------------------------------------

# 103. Critères de recette conceptuelle

Les futurs prototypes et développements devront pouvoir être testés
contre au moins les critères suivants.

1.  Une information affichée comme factuelle doit avoir un statut
    épistémique compréhensible.
2.  Une correction de transcription ne doit pas écraser l'image/source
    ni les anciennes versions scientifiques.
3.  Une autre source ne doit pas corriger silencieusement la lecture
    d'un document.
4.  Une fusion historique incertaine doit rester réversible.
5.  Une personne peut exister sans Tree.
6.  Une personne peut exister sans descendant connu.
7.  Une personne peut exister avec identité très incomplète.
8.  Une donnée privée ne rejoint pas le Core partagé sans action
    autorisée.
9.  Un import Core → Tree ne modifie pas silencieusement Tree.
10. Une comparaison Tree ↔ Tree n'alimente pas automatiquement Core.
11. Une publication ne contourne pas un embargo.
12. Une carte n'affiche pas plus de précision que les données.
13. Une statistique calculée conserve corpus et méthode.
14. Une proposition IA reste distincte d'une validation humaine.
15. Une citation versionnée reste résoluble.
16. Une preuve devenue inaccessible modifie la vérifiabilité, pas
    l'histoire de validation.
17. Des sources dépendantes ne sont pas comptées naïvement comme
    indépendantes.
18. Une mémoire peut être capturée avant structuration.
19. Une recherche négative conserve son périmètre.
20. Une question résolue peut être rouverte si ses fondements changent.
21. Un projet clôturé peut être réouvert sans perdre son état de
    clôture.
22. Une nouvelle catégorie historique ne force pas une nouvelle
    application.
23. Un projet privé peut utiliser tout le modèle Core sans contribuer au
    commun.
24. Une contribution crée une filiation et non une synchronisation.
25. Une suppression/restriction se propage honnêtement aux dépendances.
26. Un terme historique offensant peut être conservé fidèlement et
    contextualisé.
27. Une classification historique n'est pas automatiquement un attribut
    intrinsèque.
28. Un groupe analytique n'est pas un groupe historique.
29. Une cooccurrence n'est pas une relation sociale.
30. Une proximité spatio-temporelle n'est pas une causalité.
31. Une décision institutionnelle n'est pas la réalité automatique de
    son exécution.
32. Une autorisation n'est pas une réalisation.
33. Une source prescrite n'est pas une source existante.
34. Un URL mort n'efface pas l'identité documentaire.
35. Un badge ne remplace pas une preuve.
36. Une majorité de validateurs ne remplace pas une preuve décisive.
37. Une personne concernée peut témoigner sans devenir propriétaire de
    la vérité.
38. Une communauté concernée peut contextualiser sans réécrire la
    source.
39. Un financement déclaré ne devient pas automatiquement un biais.
40. Un contributeur pseudonyme reste traçable selon les règles internes.
41. Un résultat peut être marqué potentiellement obsolète sans recalcul
    immédiat.
42. Un workspace privé ne modifie pas le Core.
43. Une Inbox accepte du brut.
44. Une API ne doit pas aplatir l'incertitude.
45. Un export patrimonial doit rester intelligible hors de GENIIUS.
46. Une restauration privée ne republie pas automatiquement dans le
    Core.
47. Une nouvelle publication scientifique ne réécrit pas l'ancienne.
48. Un ancien état de connaissance doit pouvoir être reconstitué lorsque
    nécessaire.
49. Les personnes peu documentées ne sont pas considérées moins
    importantes.
50. Le système doit pouvoir dire « nous ne savons pas » sans fabriquer
    une réponse.

------------------------------------------------------------------------

# 104. Registre condensé des décisions Q113--Q245

Cette section sert de contrôle de non-perte. Les décisions déjà
détaillées ailleurs sont répétées volontairement sous forme compacte.

## Q113--Q120 --- transmission et circulation de la recherche

-   **Q113** : projet transmissible avec état intellectuel complet ;
    successeur de recherche distinct du custodian.
-   **Q114** : snapshots de recherche nommés, datés, citables.
-   **Q115** : knowledge diff explicable.
-   **Q116** : veille transversale sur objets de recherche.
-   **Q117** : distinguer nouveauté globale, utilisateur, projet,
    nouvelle preuve et évolution réelle.
-   **Q118** : conserver comment une information est entrée dans la
    connaissance d'un projet.
-   **Q119** : qualifier la provenance manquante au lieu de simple « non
    sourcé ».
-   **Q120** : reconstruire chaînes de circulation de la connaissance ;
    plusieurs détenteurs ≠ plusieurs chaînes indépendantes.

## Q121--Q123 --- mémoire et information

-   **Q121** : étudier évolution de la mémoire collective/familiale.
-   **Q122** : trajectoire d'information d'une personne uniquement via
    traces, jamais inférence mentale.
-   **Q123** : circulation de l'information : existence → accessibilité
    → exposition possible → réception attestée → connaissance attestée →
    croyance/adhésion.

## Q124--Q132 --- collectifs, espace, réseaux

-   **Q124** : voyage/déplacement structuré ; Atlas n'invente pas route.
-   **Q125** : collectif historique partiellement connu.
-   **Q126** : trajectoire propre d'un collectif.
-   **Q127** : foyer ≠ famille ≠ logement.
-   **Q128** : voisinage explicite ≠ contiguïté ≠ proximité documentaire
    ≠ proximité reconstruite.
-   **Q129** : entourage historique calculé et explicable.
-   **Q130** : comparer entourages et chemins de graphe ; chemin ≠
    relation.
-   **Q131** : détecter points communs/intermédiaires/patterns sans les
    transformer en conclusion.
-   **Q132** : recherche par motifs de trajectoire, limitée au corpus.

## Q133--Q144 --- moteur de recherche historique et Echo

-   **Q133** : rechercher continuations candidates de trajectoires
    interrompues.
-   **Q134** : rechercher antécédents possibles avant première
    attestation.
-   **Q135** : positions humaines manquantes impliquées par
    structure/compte.
-   **Q136** : bornes min/max documentaires compatibles.
-   **Q137** : historiser conclusions de non-identité.
-   **Q138** : conserver candidats rejetés/provisoirement écartés et
    raisons.
-   **Q139** : identifier preuve discriminante nécessaire.
-   **Q140** : prioriser pistes de recherche de façon explicable.
-   **Q141** : plan de séance de recherche adaptatif.
-   **Q142** : conditions pratiques des centres d'archives structurées
    et historisées.
-   **Q143** : micro-missions mutualisées.
-   **Q144** : niveaux de consultation et portée des résultats négatifs.

## Q145--Q156 --- Rebond, exploitation et méthodes

-   **Q145** : couverture d'exploitation multidimensionnelle liée à
    protocole.
-   **Q146** : réutilisation sélective + lecture indépendante/aveugle.
-   **Q147** : localiser exactement le niveau du désaccord.
-   **Q148** : représentations textuelles multiples.
-   **Q149** : annotations localisées sans transcription.
-   **Q150** : ancrages multi-zones.
-   **Q151** : rôle probatoire précis par assertion.
-   **Q152** : assertions composées avec sous-assertions.
-   **Q153** : valeur attestée ≠ valeur dérivée.
-   **Q154** : méthodes de dérivation concurrentes.
-   **Q155** : règles méthodologiques contextuelles.
-   **Q156** : patterns détectés → règles proposées → adoption humaine.

## Q157--Q165 --- apprentissage, recherche et IA

-   **Q157** : apprendre des corrections humaines avec portée explicite.
-   **Q158** : distinguer automatique, examiné, corrigé, validé.
-   **Q159** : modes Strict / Recherche / Exploratoire.
-   **Q160** : requêtes complexes sauvegardées/versionnées/citées.
-   **Q161** : recherche globale cross-suite + recherches spécialisées.
-   **Q162** : page transversale d'entité.
-   **Q163** : synthèses contextuelles multiples.
-   **Q164** : exploration libre du graphe.
-   **Q165** : IA optionnelle et sobre ; système complet sans IA
    générative.

## Q166--Q179 --- espaces de travail, collaboration, publication

-   **Q166** : historique privé de travail/navigation.
-   **Q167** : workspace temporaire privé.
-   **Q168** : cycle de vie du workspace.
-   **Q169** : permissions granulaires.
-   **Q170** : proposer modification ≠ éditer directement.
-   **Q171** : conflits d'édition sans last-write-wins scientifique.
-   **Q172** : délégation de rôles sans transfert de propriété.
-   **Q173** : espaces organisationnels.
-   **Q174** : transfert de gouvernance historisé.
-   **Q175** : publication sélective/versionnée.
-   **Q176** : corrections de publication sans réécrire le passé.
-   **Q177** : niveaux de diffusion +
    visibilité/découvrabilité/réutilisation.
-   **Q178** : citer preuve restreinte sans la révéler.
-   **Q179** : graphe bibliographique/intellectuel.

## Q180--Q191 --- vivants, droits, portabilité

-   **Q180** : protection spécifique des personnes vivantes.
-   **Q181** : lien vérifié entre utilisateur et sa Personne Core.
-   **Q182** : version/contestation de la personne concernée.
-   **Q183** : informations concernant plusieurs personnes.
-   **Q184** : masquer ≠ pseudonymiser ≠ anonymiser.
-   **Q185** : protection renforcée des mineurs.
-   **Q186** : portabilité ouverte et format patrimonial.
-   **Q187** : réimport/restauration.
-   **Q188** : import externe comme provenance.
-   **Q189** : synchronisation externe reportée.
-   **Q190** : identifiants/liens externes persistants.
-   **Q191** : liens profonds persistants.

## Q192--Q201 --- organisation, suppression, reproductibilité, notifications

-   **Q192** : collections transversales.
-   **Q193** : tags libres distincts des concepts.
-   **Q194** : Inbox globale.
-   **Q195** : archiver ≠ supprimer.
-   **Q196** : doublon technique ≠ identité historique.
-   **Q197** : suppression/perte d'accès affecte dépendances.
-   **Q198** : package de reproductibilité.
-   **Q199** : reproduction ≠ rerun ≠ nouvelle analyse.
-   **Q200** : expliquer pourquoi un résultat change.
-   **Q201** : notifications utiles à la recherche, pas à l'engagement.

## Q202--Q212 --- veille, communautés, gouvernance et crédit

-   **Q202** : suivre ≠ surveiller ; requêtes transformables en veille.
-   **Q203** : demandes ciblées entre chercheurs sans messagerie
    ouverte.
-   **Q204** : intérêts/compétences déclarés ≠ réputation/activité.
-   **Q205** : communautés thématiques de recherche, pas réseau social.
-   **Q206** : référentiels communautaires versionnés non imposés au
    global.
-   **Q207** : gouvernance par rôles ; technique/modération ≠
    scientifique.
-   **Q208** : réexamen scientifique fondé sur preuves.
-   **Q209** : pseudonyme/masquage public + traçabilité interne.
-   **Q210** : réputation scientifique ≠ comportement communautaire.
-   **Q211** : badge d'expérience ≠ qualification ; aucun badge =
    preuve.
-   **Q212** : auteur/co-auteur ≠ aide/remerciement.

## Q213--Q227 --- financement, pérennité, santé de recherche et vérifiabilité

-   **Q213** : financement et obligations comme provenance.
-   **Q214** : liens/conflits d'intérêts contextualisés ; indépendance
    des validateurs.
-   **Q215** : historiser localisations/identifiants externes ; ne pas
    copier automatiquement.
-   **Q216** : pérennité au-delà de la plateforme.
-   **Q217** : succession globale du projet.
-   **Q218** : clôture/en sommeil/bloqué/transmis/abandonné/archivé +
    réouverture.
-   **Q219** : critères d'arrêt/suffisance de recherche.
-   **Q220** : santé de la recherche sans score global.
-   **Q221** : recherchabilité actuelle des inconnues.
-   **Q222** : question résolue peut redevenir « à réexaminer ».
-   **Q223** : formaliser découvertes sans revendiquer priorité
    mondiale.
-   **Q224** : connaissance produite dans un projet réutilisable
    ailleurs sans duplication.
-   **Q225** : graphe de relations entre projets.
-   **Q226** : vérifiabilité relative aux droits.
-   **Q227** : validation historique ≠ vérifiabilité actuelle.

## Q228--Q245 --- clôture architecturale

-   **Q228** : temps historique ≠ temps épistémique ; anciens états
    consultables.
-   **Q229** : profondeur progressive ; capture simple, rigueur
    croissante.
-   **Q230** : Core porte connaissance transversale ; applications
    gardent objets métier.
-   **Q231** : accepter plusieurs entités potentiellement identiques
    dans Core.
-   **Q232** : droits des dérivations évalués par dépendance, pas
    héritage aveugle.
-   **Q233** : patrimoine public sans compte, publication ≠ indexation.
-   **Q234** : architecture API-ready, droits distincts.
-   **Q235** : licences par composants, contrôle de compatibilité.
-   **Q236** : maturité scientifique multidimensionnelle, pas score
    qualité unique.
-   **Q237** : cadres de modélisation incompatibles peuvent coexister.
-   **Q238** : dynamique/figé/obsolète + recalcul ciblé.
-   **Q239** : rôle des communautés concernées sans monopole sur la
    preuve.
-   **Q240** : frontières explicites du produit + test des trajectoires
    humaines.
-   **Q241** : nouveau domaine historique ≠ nouvelle application.
-   **Q242** : Core privé possible ; utiliser ≠ contribuer.
-   **Q243** : versions privée/partagée évoluent indépendamment.
-   **Q244** : changement de gouvernance crée nouvel objet lié ;
    réutilisation conserve identité.
-   **Q245** : cinq engagements supérieurs et clôture du cadrage
    conceptuel.

------------------------------------------------------------------------

# 105. Décisions antérieures structurantes à ne pas perdre

Cette section rappelle les décisions majeures antérieures à Q113 qui
structurent tout le produit.

## 105.1 Core indépendant de Tree

Le Core peut vivre sans Tree.

Une personne n'a pas besoin : - d'un arbre ; - de descendants ; - d'une
famille connue.

## 105.2 Tree indépendant du Core partagé

Tree reste souverain.

Pas d'arbre mondial unique.

## 105.3 Core = connaissance historique, pas arbre global

Il agrège : - assertions ; - sources ; - relations ; - événements ; -
hypothèses.

## 105.4 Source → mention → identité

Ne jamais sauter directement de source à personne certaine.

## 105.5 Contradictions conservées

GENIIUS supporte plusieurs assertions incompatibles.

Il peut afficher la mieux étayée sans supprimer les autres.

## 105.6 Source exploitable une fois, interprétable plusieurs fois

Objectif : capitaliser l'exploitation structurée d'une source afin
d'éviter les relectures inutiles.

Mais : une source peut être réinterprétée à partir de nouvelles
questions.

## 105.7 Journal inclut la mémoire de soi

Pas seulement interviews de tiers.

## 105.8 Echo = mémoire de la recherche

Conserver : - ce qui a été fait ; - ce qui n'a rien donné ; - pourquoi
; - ce qu'il reste.

## 105.9 Atlas = reconstruction spatio-temporelle

Pas simple carte de points.

## 105.10 Langage historique fidèle

Pas de réécriture morale silencieuse des sources.

## 105.11 Validation révisable

Validé ≠ figé.

## 105.12 Réputation contextuelle

Expertise locale/domain-specific.

Pas de crédibilité achetable.

## 105.13 Historique de connaissance

GENIIUS conserve l'histoire de construction de la connaissance.

## 105.14 Reconstruction perdue

Un document disparu peut être un objet de recherche à reconstruire.

## 105.15 Indépendance des sources

Nombre de documents ≠ nombre de chaînes indépendantes.

## 105.16 Force probatoire par assertion

Pas de « fiabilité universelle » d'un type de source.

## 105.17 Tradition comme objet historique

Une tradition fausse factuellement peut avoir une histoire réelle de
transmission.

## 105.18 Histoire des erreurs

Une erreur propagée peut être étudiée.

## 105.19 Recherche négative

Un échec documenté est une connaissance méthodologique.

## 105.20 Citabilité

Les objets importants doivent pouvoir être cités durablement.

------------------------------------------------------------------------

# 106. Exigences UX transversales dérivées

Même si l'UX détaillée est reportée, le CDCF impose déjà des
contraintes.

## 106.1 Profondeur progressive

> **La complexité du modèle doit servir la rigueur de GENIIUS sans
> devenir la complexité obligatoire de son interface.**

Flux :
`capturer → structurer → approfondir → vérifier → contribuer/publier`

## 106.2 Ne pas fabriquer de précision

Si utilisateur saisit : \> « vers 1840 »

ne pas stocker/afficher : \> 01/01/1840

comme si exact.

## 106.3 Ne pas surcharger les novices

Les objets complexes : - rôle probatoire ; - dépendance ; - cadre
méthodologique ;

peuvent être disponibles en profondeur sans être exigés à chaque saisie.

## 106.4 Plus le statut monte, plus la rigueur augmente

Capture privée : - légère.

Contribution Core : - provenance minimale.

Validation : - exigences plus fortes.

Publication : - droits/licences/provenance vérifiés.

------------------------------------------------------------------------

# 107. Exigences de qualité du Core

Le Core peut contenir : - automatique non revu ; - humain non vérifié
; - examiné ; - corrigé ; - corroboré ; - contesté ; - conclusion
publiée.

Pas de score unique 87/100.

Axes : - provenance ; - qualité documentaire ; - examen humain ; -
indépendance ; - débat ; - couverture.

Les modes Strict/Recherche/Exploratoire exploitent ces dimensions.

------------------------------------------------------------------------

# 108. Histoire de l'information

GENIIUS peut étudier non seulement ce qui s'est passé, mais comment une
information a circulé.

Chaîne :

`existence d’une information` → `accessibilité` → `exposition possible`
→ `réception attestée` → `connaissance attestée` →
`adhésion/croyance éventuelle`

Ne jamais sauter automatiquement les étapes.

Exemple : un journal était disponible dans une ville ≠ une personne l'a
lu.

------------------------------------------------------------------------

# 109. Chaînes de transmission orale

Journal/Core peut représenter : - mémoire personnelle ; - récit reçu
directement ; - récit multigénérationnel ; - tradition familiale ; -
rumeur si ainsi qualifiée.

Exemple : A raconte à B, B à C, C à D.

Quatre détenteurs ≠ quatre témoignages indépendants sur l'événement
initial.

------------------------------------------------------------------------

# 110. Tradition et légende

Une tradition peut être un objet avec : - variantes ; - transmetteurs
; - branches ; - chronologie ; - transformations ; - éléments confirmés
; - éléments réfutés ; - origine inconnue.

Une correction archivistique ne doit pas effacer l'histoire de la
tradition.

------------------------------------------------------------------------

# 111. Erreurs propagées

Une erreur peut avoir : - origine connue/suspectée ; - reprises ; -
transformations ; - correction ; - preuve.

Objectif : éviter que 20 copies d'une erreur soient vues comme 20
confirmations.

------------------------------------------------------------------------

# 112. Sources indépendantes et validations indépendantes

Deux problèmes parallèles :

## Sources

5 documents peuvent dériver du même registre.

## Validateurs

3 validateurs peuvent appartenir à la même équipe.

GENIIUS doit qualifier l'indépendance sans prétendre toujours la
connaître.

« Aucune dépendance connue » ≠ « indépendant ».

------------------------------------------------------------------------

# 113. Cas éthique central --- esclavage et populations invisibilisées

GENIIUS doit pouvoir devenir un outil majeur de reconstruction de
trajectoires de personnes réduites en esclavage.

Implications : - Personne toujours Personne ; - existence sans
descendant ; - entités incomplètes ; - sources fragmentaires ; -
reconstructions ; - collectifs partiellement connus ; - registres perdus
; - noms changeants ; - statuts juridiques historiques contextualisés
; - communautés descendantes impliquées ; - pas de hiérarchie par
richesse documentaire.

Objectif : ne pas seulement enregistrer un acte d'émancipation en 1848,
mais reconstruire autant que possible : - avant ; - pendant ; - après
; - lieux ; - familles ; - relations ; - propriétaires historiques sans
ontologiser la personne comme propriété ; - déplacements ; - changements
de nom ; - trajectoires documentaires.

------------------------------------------------------------------------

# 114. Principe de non-hiérarchisation des vies

Un gouverneur avec 400 documents n'est pas « plus important » qu'une
personne réduite en esclavage connue par une seule mention.

GENIIUS peut mesurer : - densité documentaire ; - couverture ; -
confiance.

Mais pas valeur humaine.

------------------------------------------------------------------------

# 115. Questions à traiter après le CDCF

Le cadrage conceptuel est clos.

Phases suivantes :

1.  architecture fonctionnelle détaillée du Core ;
2.  architecture fonctionnelle de chaque application ;
3.  modèle conceptuel de données ;
4.  personas ;
5.  parcours utilisateurs ;
6.  matrices de permissions ;
7.  machines à états ;
8.  exigences non fonctionnelles chiffrées ;
9.  architecture technique/data ;
10. recherche/indexation/graphe ;
11. sobriété numérique ;
12. étude juridique ;
13. modèle économique détaillé ;
14. priorisation MVP ;
15. roadmap 2027 ;
16. backlog ;
17. maquettes ;
18. plan de tests dérivé des cas d'usage de ce document.

------------------------------------------------------------------------

# 116. Sujets explicitement reportés ou non figés

-   synchronisation bidirectionnelle externe continue ;
-   choix précis des technologies ;
-   SGBD/graph DB/search engine ;
-   modèle physique des tables ;
-   design UI ;
-   prix exacts ;
-   règles juridiques internationales détaillées ;
-   durée contractuelle de conservation ;
-   API publique au lancement ;
-   ontologie mondiale exhaustive ;
-   modalités exactes de biométrie ;
-   algorithmes précis de scoring/candidats ;
-   ordre exact de développement des six applications.

------------------------------------------------------------------------

# 117. Doctrine finale

> **GENIIUS ne cherche pas à fabriquer une vérité unique et figée. Il
> conserve les traces, les lectures, les preuves, les hypothèses, les
> désaccords et les transformations de la connaissance afin que les
> trajectoires humaines puissent être recherchées, comprises, discutées
> et transmises.**

> **Une personne n'a pas besoin d'avoir laissé des descendants pour
> avoir laissé une histoire.**

> **La structuration ne doit jamais devenir une condition préalable à la
> transmission.**

> **Dans GENIIUS, "validé" ne veut jamais dire "figé".**

> **L'argent peut acheter de l'usage. Il ne peut jamais acheter de la
> crédibilité scientifique.**

> **GENIIUS corrige la connaissance sans réécrire rétrospectivement
> l'histoire de ce qui a été publié.**

> **Le Core modélise le monde historique ; les applications modélisent
> les manières de travailler avec cette connaissance.**

> **Utiliser GENIIUS ne signifie pas contribuer à GENIIUS.**

> **GENIIUS peut raconter une vie, mais le récit ne devient jamais la
> preuve.**

> **GENIIUS doit savoir qu'un résultat peut être périmé sans être obligé
> de le recalculer immédiatement.**

> **La notification GENIIUS sert la continuité de la recherche et de la
> transmission, pas la captation de l'attention.**

> **GENIIUS recherche l'interopérabilité sans imposer artificiellement
> l'uniformité.**

------------------------------------------------------------------------

# 118. Formulation de référence pour les travaux futurs

Toute équipe travaillant sur GENIIUS devra pouvoir répondre, pour chaque
fonctionnalité proposée :

1.  Quelle trajectoire humaine ou quelle trace cette fonction
    aide-t-elle à préserver, rechercher, structurer, relier, comprendre
    ou transmettre ?
2.  Quel est le statut épistémique de l'information manipulée ?
3.  Quelle est sa provenance ?
4.  Quelles incertitudes doivent être conservées ?
5.  Quels droits s'appliquent ?
6.  L'utilisateur comprend-il la différence entre privé, partagé,
    contribué et publié ?
7.  Peut-on revenir à la preuve ?
8.  Une correction future restera-t-elle historisée ?
9.  Une IA est-elle réellement nécessaire ?
10. La fonction peut-elle fonctionner sans transformer une hypothèse en
    vérité ?
11. Que se passe-t-il si la source disparaît ?
12. Que se passe-t-il si l'identité change ?
13. Que se passe-t-il si un projet est transmis dans trente ans ?
14. Peut-on exporter le résultat de façon intelligible ?
15. Le système traite-t-il équitablement les personnes peu documentées ?
16. Cette fonction appartient-elle réellement à GENIIUS ou
    cherche-t-elle à transformer la suite en un autre produit ?

Si ces questions ne trouvent pas de réponse satisfaisante, la
fonctionnalité doit être revue avant développement.

------------------------------------------------------------------------

**FIN --- CDCF GENIIUS V1, version longue du cadrage conceptuel**

------------------------------------------------------------------------

# PARTIE XVIII --- Comment transformer ce référentiel en architecture sans perdre le sens

Le futur modèle de données ne devra pas être conçu en partant de «
quelles tables avons-nous l'habitude d'avoir dans un logiciel de
généalogie ? ».

Il devra être dérivé des invariants du présent référentiel.

Exemple : si l'on crée directement une table `person` avec des colonnes
`birth_date`, `occupation`, `residence`, on risque de perdre : - la
multiplicité ; - la temporalité ; - la provenance ; - l'incertitude ; -
les contradictions ; - les calculs.

Le modèle devra probablement distinguer la stabilité de l'identité de
l'entité et la variabilité des assertions qui la concernent.

De même, les relations ne devront pas toutes devenir des clés étrangères
fixes. Une relation peut être : - sourcée ; - datée ; - hypothétique ; -
contestée ; - qualifiée ; - multiple.

Le futur MCD devra donc être testé sur les cas d'usage avant d'être
validé.

------------------------------------------------------------------------

# PARTIE XIX --- Checklist de fidélité au projet

Une proposition technique, fonctionnelle ou UX peut être refusée même si
elle est pratique lorsqu'elle viole un principe supérieur.

### Test A --- Fidélité

Peut-on revenir à la trace exacte ?

### Test B --- Incertitude

Le système sait-il dire « peut-être », « indéterminé » ou « inconnu » ?

### Test C --- Temporalité

Peut-on représenter l'évolution dans le temps ?

### Test D --- Histoire de connaissance

Peut-on comprendre ce qui a changé et pourquoi ?

### Test E --- Souveraineté

Une donnée privée reste-t-elle privée tant qu'une contribution n'est pas
décidée ?

### Test F --- Réversibilité

Une hypothèse ou un rapprochement peut-il être réexaminé ?

### Test G --- Transmission

Un autre chercheur pourra-t-il comprendre le travail dans vingt ans ?

### Test H --- Équité documentaire

Le modèle fonctionne-t-il pour une personne connue par une seule trace ?

### Test I --- Sobriété

Utilise-t-on le mécanisme le plus simple et reproductible suffisant ?

### Test J --- Frontière produit

La fonction sert-elle réellement les trajectoires humaines et leurs
traces ?

------------------------------------------------------------------------

# PARTIE XX --- Conclusion générale

GENIIUS ne doit pas être conçu comme un arbre généalogique auquel on
ajouterait progressivement des modules.

Il doit être conçu comme une **infrastructure de connaissance historique
centrée sur les trajectoires humaines**, à laquelle plusieurs
applications donnent accès selon des gestes de travail différents :

-   construire une généalogie ;
-   préserver une mémoire ;
-   exploiter une source ;
-   conduire une recherche ;
-   organiser une transmission collective ;
-   reconstruire un espace historique.

Sa différence ne réside pas seulement dans la quantité de fonctions.
Elle réside dans le contrat intellectuel du système :

-   ne pas confondre trace et vérité ;
-   ne pas cacher l'incertitude ;
-   ne pas effacer les anciennes connaissances ;
-   ne pas fusionner ce qui n'est pas démontré ;
-   ne pas publier ce qui a seulement été collecté ;
-   ne pas privilégier les vies les mieux documentées ;
-   ne pas laisser une synthèse devenir impossible à vérifier ;
-   ne pas dépendre d'une IA pour accomplir ce qu'un système
    déterministe sait faire ;
-   ne pas enfermer le patrimoine produit dans la plateforme.

Le succès de GENIIUS ne se mesurera donc pas uniquement au nombre
d'arbres, de documents ou d'utilisateurs. Il se mesurera à sa capacité à
permettre à une personne, une famille, un chercheur ou une communauté de
dire :

> **Voici ce que nous savons. Voici pourquoi nous le pensons. Voici ce
> qui reste incertain. Voici d'où vient cette connaissance. Voici
> comment elle a évolué. Et voici comment elle pourra être transmise
> après nous.**

C'est cette capacité qui doit rester le fil directeur de toutes les
décisions futures.


------------------------------------------------------------------------

# PARTIE XXI --- Avenant V1.2 : projets, programmes et contributions collectives

**Origine.** Dossier [AV-FONC-001](AV-FONC/AV-FONC-001.md), figé le 9 octobre 2026. Arbitrages AV-1 à AV-12. Périmètre : intégration intégrale en V1.

**Règle de lecture.** Cette partie complète les sections existantes sans les remplacer. Lorsqu'une section antérieure traite déjà d'un sujet (§ 25.4, § 25.19, § 25.20, § 39, § 61–65, § 76, § 88–89), elle reste applicable, et la présente partie en précise les effets. En cas de divergence, la présente partie prévaut pour les projets, programmes et contributions collectives.

**Correspondance avec les exigences candidates du dossier.**

| AVF (dossier) | Section V1.2 | Recoupe |
|---|---|---|
| AVF-001 | § 119 | § 25.19 (cycle de vie), § 24 (questions) |
| AVF-002 | § 120 | § 25.20 (parent / sous-projet) |
| AVF-003 | § 121 | --- (nouveau) |
| AVF-004 | § 122 | § 62 (permissions), § 65 (gouvernance) |
| AVF-005 | § 123 | § 39 (corpus) |
| AVF-006 | § 124 | § 25.4 (mission déléguée) |
| AVF-007 | § 125 | --- (nouveau) |
| AVF-008, AVF-009 | § 126 | § 61.2 (réutilisation) |
| AVF-010 | § 128 | § 65.1, § 89 |
| AVF-011, AVF-012 | § 127 | § 84 (import), § 26.5 (comparaison), § 63 (propositions) |
| AVF-013 | § 130 | § 76–77 (publication) |
| AVF-014, AVF-015 | § 129 | § 38, § 40, § 54 (anti-pattern 74 %) |
| AVF-016 | § 131 | § 82, § 88–89 |

------------------------------------------------------------------------

# 119. Le projet comme espace de recherche gouverné

## 119.1 Définition

Un projet GENIIUS est un espace de recherche ou de mémoire, individuel ou collectif, durable ou borné. Il est doté d'un périmètre, d'objectifs, de règles de gouvernance et d'un cycle de vie (§ 25.19). Il relie questions de recherche, sources, activités, connaissances, contributeurs et résultats, sans confondre leurs statuts ni leurs droits.

Un projet n'est pas un arbre généalogique. Un arbre est une représentation scientifique indépendante, qui peut alimenter un projet sans être absorbée par lui (§ 26, § 125).

## 119.2 Contenu d'un projet

Un projet peut définir :

-   ses objectifs et questions de recherche (§ 25.9) ;
-   son périmètre et ses axes d'étude (§ 121) ;
-   ses ressources (§ 123) ;
-   ses travaux (§ 124) ;
-   sa reconstitution collective (§ 125) ;
-   ses livrables (§ 130) ;
-   ses indicateurs (§ 129) ;
-   sa gouvernance et ses habilitations (§ 122).

> **Un projet relie le travail à réaliser, les documents étudiés, les résultats scientifiques et les livrables. Ce n'est pas un logiciel de gestion de tâches auquel on aurait ajouté un arbre.**

------------------------------------------------------------------------

# 120. Programmes et sous-projets (AV-1, AV-2)

## 120.1 Un programme est un projet coordinateur

Un programme est un projet qui exerce une fonction de coordination sur d'autres projets. Ce n'est ni un nouveau type d'espace, ni une catégorie figée : la qualification « programme » découle de ses relations, ou se choisit comme libellé de présentation.

Exemple : le programme « Reconstitution des parcours des personnes esclavisées aux Antilles » coordonne le projet « Guadeloupe ». Celui-ci coordonne à son tour « Pointe-Noire », qui coordonne « Habitation X ».

Règles :

-   un projet peut être à la fois sous-projet et coordinateur ;
-   un programme peut exister avant ses sous-projets ;
-   la hiérarchie est strictement organisationnelle : elle n'établit aucune hiérarchie entre entités historiques ;
-   une fédération de projets autonomes n'est pas une hiérarchie : les relations de § 25.20 (complète, réutilise le corpus de…) restent disponibles sans rattachement.

## 120.2 Rattachement bilatéral, multiple et non transitif

Un projet peut être rattaché à **plusieurs** coordinateurs. Chaque rattachement :

-   est proposé par l'une des parties et n'est **actif** qu'après acceptation explicite des deux, par des représentants habilités ; une invitation ne vaut pas acceptation ;
-   peut être rompu unilatéralement par chaque partie, sans effet rétroactif sur les travaux déjà produits ni sur les autres rattachements ;
-   permet seulement de présenter les métadonnées convenues du sous-projet, de faire remonter les indicateurs qu'il autorise, et de lui proposer des activités ;
-   ne transfère ni propriété, ni droit de lecture, ni droit d'administration, ni autorité scientifique ;
-   n'est pas transitif.

États : proposé, actif, refusé, terminé. La hiérarchie reste acyclique.

> **Être administrateur du programme ne donne pas accès aux données privées de ses sous-projets.**

------------------------------------------------------------------------

# 121. Axes de recherche (AV-4)

## 121.1 Principe

Un projet peut déclarer plusieurs axes : territoires, périodes historiques, personnes, familles, organisations, biens, habitations, thèmes ou autres objets compatibles avec le modèle.

Exemple, projet « Les Colimaçons » : territoire « Les Colimaçons, Saint-Leu » ; période 1793--1848 ; familles BOURBON, BOVALO, ANNAMALÉ ; habitations ; thèmes « affranchissements » et « trajectoires ».

## 121.2 Règles

-   **Un axe n'est jamais une assertion.** Déclarer qu'un projet étudie les BOVALO et l'habitation X n'établit aucune relation historique entre eux.
-   **Un axe n'est jamais un conteneur.** Il ne possède, ne déplace et ne duplique aucun objet. Il ne confère aucun droit.
-   **Un axe est structuré et relié.** Il référence une entité, une mention, un concept ou une autre référence existante. Les périodes conservent leur incertitude (§ 9.1).
-   **Un sujet peut rester incertain.** Une « famille non identifiée mentionnée dans l'inventaire de 1793 » se déclare sans créer de famille fictive.
-   **Axe déclaré ≠ correspondance calculée.** Le fait qu'un projet contienne des travaux sur un lieu ne fait pas de ce lieu un axe.
-   **Recherche protégée.** Une recherche du type « tous les projets qui étudient l'habitation X » ne révèle aucun projet ni axe inaccessible.

------------------------------------------------------------------------

# 122. Habilitations dans les programmes (AV-3)

## 122.1 Groupes de coordination

Un projet coordinateur peut constituer des groupes, par exemple « Coordination CM98 ». Chaque sous-projet peut accorder à un tel groupe une habilitation limitée : rôle, périmètre, durée et mode d'admission.

Il existe deux modes d'admission des nouveaux membres du groupe :

-   **notification** : le nouveau membre reçoit les droits accordés au groupe ; le sous-projet est informé et peut révoquer ;
-   **approbation préalable** : aucun droit tant que le sous-projet n'a pas approuvé nommément la personne. C'est le **comportement par défaut** pour les contenus privés ou sensibles.

## 122.2 Règles

-   un départ du groupe retire immédiatement les droits dérivés, répliques hors ligne comprises ; aucune approbation ne retarde une révocation ;
-   une approbation porte sur une identité, pas sur une place ;
-   le programme ne peut pas élargir unilatéralement les permissions accordées ;
-   la fin du rattachement (§ 120.2) désactive les habilitations accordées à ce titre, sans toucher aux droits acquis par un autre fondement ;
-   GENIIUS sait expliquer pourquoi une personne a accès à un objet, sans exposer cette explication à des personnes non habilitées.

------------------------------------------------------------------------

# 123. Ressources d'un projet (AV-5)

Un projet peut déclarer les ressources qu'il mobilise ou prévoit de mobiliser : référence, inventaire, source à exploiter, outil de travail, bibliographie, donnée de travail… Une même ressource peut avoir plusieurs rôles.

Règles :

-   la ressource conserve sa nature, sa provenance, son espace et ses droits ; la déclarer ne crée ni copie ni accès ;
-   les situations « référencée », « conservée » et « exploitée » se déduisent du modèle, sans statut saisi ;
-   « exploitée par ce projet » n'est affiché que si les travaux sont attribuables au projet ; l'absence de travaux visibles ne prouve pas l'absence d'exploitation ;
-   ce qu'un projet **utilise** (§ 123) est distinct de ce qu'il **étudie** (§ 121). Une fiche matricule peut être les deux à la fois.

------------------------------------------------------------------------

# 124. Pilotage des travaux (AV-6)

## 124.1 Tâches, lots et jalons

Le pilotage repose sur un concept unique, la tâche, qui peut être :

-   une **tâche** : « transcrire la fiche n° 42 » ;
-   un **lot** : « transcrire les fiches 1 à 100 », confié à une ou plusieurs personnes ou à un groupe ;
-   un **jalon** : « dépouillement de Saint-Leu terminé ».

Une tâche peut avoir des sous-tâches et des dépendances, sans cycle. Ses échéances sont des **dates de calendrier**, distinctes des dates historiques.

## 124.2 Délégation par lot

Un lot peut fonder une délégation temporaire, limitée à ses objets, aux opérations prévues (par exemple lire et transcrire, mais pas valider) et à une durée (§ 25.4).

-   Être assigné ne donne aucun droit par soi-même.
-   La délégation a son propre cycle de vie : la clôture du lot peut y mettre fin, mais **sa réouverture ne réactive aucun droit**.
-   Étendre le périmètre d'un lot n'étend jamais silencieusement les droits.
-   Déléguer une tâche ne transfère ni responsabilité scientifique, ni droit de publication, ni propriété.

## 124.3 Avancement

L'avancement se constate sur les objets : « 37 fiches sur 100 transcrites ». On le détaille par état réel : transcription présente, évaluée, identification proposée, validée. Aucun pourcentage global de complétude scientifique (§ 54). Une tâche « faite » n'est jamais une validation.

------------------------------------------------------------------------

# 125. Reconstitution collective (REC-TR08)

Un projet territorial ou thématique, comme Les Colimaçons, possède **sa propre reconstitution** : familles, personnes, filiations, unions, lieux, propriétés, événements et sources. Elle est alimentée par des contributions sélectionnées venant de plusieurs arbres, GENIIUS ou externes.

-   La reconstitution n'est pas une fusion des arbres participants.
-   Des familles sans parenté connue entre elles peuvent y figurer ; aucune parenté fictive n'est créée.
-   Le projet prend ses propres décisions scientifiques, sans les imposer aux arbres sources.
-   Les divergences entre contributeurs sont conservées comme positions distinctes.
-   Une découverte faite dans un arbre peut être **proposée** au projet ou à d'autres arbres. Chaque destinataire accepte, refuse ou diffère ; un refus est tracé.
-   Le projet ne peut jamais déduire une relation d'asservissement, de résidence, de propriété, de parenté ou d'identité sans assertion sourcée (§ 6.5).

------------------------------------------------------------------------

# 126. Partage sélectif d'une branche (REC-TR09)

## 126.1 Une branche est une sélection explicite

Le propriétaire, ou un responsable habilité, peut partager **une partie précisément délimitée** de son arbre : un point de départ (par exemple Sosa 31), une ascendance (paternelle, maternelle, les deux ou aucune), la descendance, les unions et les conjoints.

-   Partager un conjoint n'ouvre pas sa famille : le Sosa 30 apparaît sans ses parents ni ses grands-parents.
-   Les branches non sélectionnées (par exemple celle du Sosa 16) ne sont ni exposées ni **déductibles** par recherche, parcours, comptage ou export.
-   Les personnes vivantes et les données sensibles sont masquées ou exclues par défaut.
-   Une **prévisualisation exacte** des personnes, relations, sources et informations transmises est obligatoire avant de confirmer.
-   Chaque branche partagée a ses propres paramètres, par exemple BOURBON et BOVALO séparément.

## 126.2 Consultation ou réutilisation

Pour chaque branche partagée, le propriétaire choisit :

-   **consultation seule** (par défaut) : visible dans le projet, non reprenable ailleurs ;
-   **réutilisation autorisée** : les participants peuvent reprendre les éléments autorisés dans leurs propres arbres, avec provenance et crédits.

L'autorisation ne peut jamais dépasser les droits effectifs de celui qui partage. Il n'y a aucun partage transitif.

## 126.3 Évolution

La branche partagée est versionnée. Les modifications ultérieures de l'arbre source produisent des **propositions** de mise à jour, jamais un élargissement silencieux du périmètre.

------------------------------------------------------------------------

# 127. Contributions internes et externes (REC-TR11)

Un projet reçoit des contributions issues d'arbres GENIIUS ou d'imports externes (par exemple un GEDCOM issu de Geneanet), avec les mêmes exigences de provenance, de contrôle scientifique et de confidentialité (§ 84).

-   Une personne potentiellement déjà connue donne lieu à une proposition de rapprochement, jamais à une fusion automatique.
-   Les assertions contradictoires sont conservées.
-   Un réimport détecte les différences sans écraser les décisions du projet ; un import identique ne crée pas de doublon.
-   Aucune synchronisation continue avec une plateforme externe n'est présumée (§ 85).
-   La disparition d'une source externe est historisée, sans prétendre qu'elle reste accessible.

------------------------------------------------------------------------

# 128. Arbre préparé pour un tiers (REC-TR10, AV-11)

Un chercheur peut créer et administrer l'arbre d'une personne qui n'a pas encore de compte. Par exemple, l'arbre de son cousin BOVALO, en cadeau.

-   **Créateur, auteur des recherches et propriétaire administratif** sont trois qualités distinctes, qui peuvent changer indépendamment.
-   Le bénéficiaire futur est **désigné** sans création de compte ni de lien entre son identité de compte et sa fiche généalogique.
-   La remise se fait par une **invitation privée**, limitée dans le temps, révocable et à usage unique. Détenir le lien ne suffit pas : le bénéficiaire est vérifié.
-   Avant d'accepter, le bénéficiaire voit les **partages actifs** de l'arbre. Il accepte un état identifié de ces engagements ; toute modification impose une nouvelle présentation. Il peut refuser le transfert.
-   Le transfert de gouvernance est explicite, atomique, audité et non réversible unilatéralement (§ 65.1).
-   Après transfert, le nouveau propriétaire gère les habilitations et peut révoquer les partages (§ 132). Il ne peut ni s'attribuer les recherches, ni les réécrire. Ses désaccords prennent la forme d'assertions concurrentes. Il choisit ce qui est présenté dans son espace.
-   Aucun droit permanent ne découle de la qualité de créateur.
-   En l'absence de réponse ou en cas de refus, aucun compte ni transfert n'est forcé.

------------------------------------------------------------------------

# 129. Indicateurs et recherches transversales (AV-7, AV-9)

## 129.1 Indicateurs

Un indicateur est une **méthode** déterministe et versionnée. Elle précise l'unité comptée (fiches et personnes sont des unités distinctes), les critères, le dédoublonnage, le traitement des identifications incertaines, et le numérateur et le dénominateur d'un ratio (§ 40).

-   Le numérateur et le dénominateur sont toujours affichés : « 3 000 sur 5 000 personnes identifiées », jamais « 60 % » seul.
-   Les incertitudes s'expriment par des bornes **justifiées**, un résultat conditionnel ou une indétermination.
-   Chaque calcul conserve sa méthode, son corpus, l'état scientifique retenu, son périmètre d'autorisation, sa date, sa couverture et ses exclusions.
-   Un tableau de bord est calculé sur ce que le lecteur peut voir, et indique ce périmètre.
-   Un résultat publié est figé, évalué pour sa diffusabilité, et identique pour tous ses lecteurs. Il reste explicable après l'évolution des connaissances.
-   Les indicateurs d'un programme ne sont jamais la somme naïve de ceux de ses sous-projets : une même personne peut figurer dans plusieurs projets.
-   Aucun indicateur ne mesure une vérité ou une complétude scientifique.

## 129.2 Recherches transversales

Les recherches à l'échelle d'un programme respectent intégralement les droits de chaque projet, y compris dans les index, caches et agrégations. Elles doivent rester utilisables sur de grands programmes : profil de référence de 50 sous-projets, 500 contributeurs et un million d'objets.

## 129.3 Consommation et financement

-   La consommation des ressources est attribuée à l'espace qui conserve les objets.
-   Un programme peut proposer de **prendre en charge** tout ou partie de la consommation d'un projet, par un accord bilatéral, plafonné, borné dans le temps et révocable. Plusieurs financeurs sont possibles, sans double imputation.
-   Une prise en charge ne donne aucun droit, aucune propriété ni aucune autorité.
-   Sa fin n'entraîne aucune suppression. Les données restent récupérables et exportables ; seules les nouvelles consommations peuvent être limitées.

------------------------------------------------------------------------

# 130. Livrables éditoriaux (AV-8)

Les livrables destinés à une audience sont des **publications** (§ 76) : newsletter, rapport d'activité, rapport au financeur, catalogue, bulletin… L'audience peut être publique ou restreinte, sans dispense de contrôle.

-   Les publications peuvent former des **séries** (« Lettre des Colimaçons ») ; chaque numéro est figé, chiffres compris (§ 129.1).
-   **Circuit éditorial** : brouillon, relecture, approbation, publication. Les approbations sont nominatives et liées à la version approuvée. Une modification substantielle invalide l'approbation.
-   Une approbation éditoriale n'est **ni une validation scientifique, ni une autorisation de diffusion**. Les contrôles de diffusabilité s'appliquent toujours.
-   Chaque **diffusion** (web, e-mail, PDF, export) est tracée et contrôlée selon son audience réelle et son risque de redistribution. Un e-mail envoyé ne peut pas être rappelé : une correction se diffuse en erratum ou en nouvelle édition (§ 77).
-   S'**abonner** à une série ne donne aucun droit, dans le respect des règles sur les communications électroniques (consentement, désabonnement). L'abonnement éditorial est distinct de la veille scientifique (§ 91).
-   La rédaction assistée par IA ne produit que des propositions, soumises à approbation humaine (§ 93).
-   Un document de travail n'est pas une publication tant qu'il n'est pas constitué en édition destinée à une audience.

------------------------------------------------------------------------

# 131. Pérennité d'un projet

Un projet peut être archivé, transmis, rouvert et exporté avec ses dépendances, ses provenances et ses historiques autorisés (§ 82, § 88, § 89). La fin d'un programme ne détruit aucun de ses sous-projets. La dissolution d'une organisation n'entraîne aucune destruction automatique (REV-02-H).

------------------------------------------------------------------------

# 132. Révocation d'une contribution (AV-10)

Une révocation met fin aux autorisations encore actives. Elle n'annule pas automatiquement les actes légitimement accomplis.

| Usage | Après révocation |
|---|---|
| Consultation dans le projet | Accès supprimé, sans divulgation du motif ; copies hors ligne retirées à la synchronisation |
| Réutilisation **explicitement autorisée** et réalisée | Copie conservée dans les limites de l'autorisation, avec provenance ; plus aucune mise à jour |
| Copie faite sans droit de réutilisation | Aucun droit de conservation autonome |
| Conclusion du projet | Conservée ; vérifiabilité réévaluée ; jamais invalidée automatiquement |
| Publication déjà parue | Version historique conservée ; toute nouvelle diffusion est réévaluée |
| Export déjà remis | Non récupérable ; aucun nouvel export |
| Preuve indépendante, droits acquis à un autre titre | Non affectés |

Une révocation partielle suit les mêmes règles sur la partie retirée. Une obligation légale (effacement, retrait de consentement) prévaut sur ces règles, selon la procédure applicable (§ 97).

------------------------------------------------------------------------

# 133. Cas d'usage ajoutés (V1.2)

## CU-26 --- Les Colimaçons : familles, habitations et trajectoires

Un chercheur reconstitue le quartier des Colimaçons (Saint-Leu, La Réunion) : familles BOURBON, BOVALO, ANNAMALÉ, habitations, propriétaires, trajectoires. Il y contribue depuis son arbre uniquement BOURBON (Sosa 27) et BOVALO (Sosa 31). Pour BOVALO : ascendance paternelle, descendance et unions ; le Sosa 30 apparaît comme conjoint, sans son ascendance ; la branche du Sosa 16 est exclue.

Attendu : reconstitution propre au projet ; partage strictement limité ; aucune déduction possible des branches exclues ; aucune relation d'asservissement, de résidence ou de parenté sans assertion sourcée.

## CU-27 --- Arbre offert à un cousin

Le chercheur crée l'arbre de son cousin BOVALO, qui n'a pas de compte, y contribue au projet Les Colimaçons, puis le lui offre.

Attendu : aucun faux compte ; recherches attribuées au chercheur ; invitation privée vérifiée ; partages actifs présentés avant l'acceptation ; transfert explicite et audité ; refus possible sans conséquence.

## CU-28 --- Contribution externe

Un généalogiste importe son arbre Geneanet (GEDCOM) et propose certaines branches au projet.

Attendu : provenance conservée ; rapprochements proposés, jamais imposés ; réimport sans écrasement ; aucune synchronisation continue présumée.

## CU-29 --- Programme antillais fédéré

Un programme comprend des projets Guadeloupe et Martinique, organisés par commune ou par habitation. Un contributeur rejoint uniquement Pointe-Noire.

Attendu : accès limité à Pointe-Noire ; aucune lecture des projets frères ni du parent par le seul fait du programme ; l'administrateur du programme ne lit pas les sous-projets ; recherches transversales filtrées.

## CU-30 --- Militaires réunionnais de 1914--1918

Un projet inventorie 10 000 fiches matricules, répartit leur transcription en lots entre bénévoles, propose des identifications, les rapproche d'actes de naissance et d'arbres, puis publie des rapports.

Attendu : lots à accès limité et temporaire ; avancement constaté ; fiche recensée, consultée, transcrite, personne identifiée et personne reliée à un arbre distinguées ; indicateurs avec dénominateur, incertitudes et périmètre ; rapport figé et explicable.

## CU-31 --- Fédération des généalogies réunionnaises

Un programme durable rapproche des arbres et projets autonomes relatifs à La Réunion, sans les fusionner.

Attendu : recoupements signalés ; divergences et permissions propres conservées ; aucun « super-arbre » fusionné ; fédération sans hiérarchie imposée.

------------------------------------------------------------------------

# 134. Critères de recette ajoutés (V1.2)

51. Un programme est un projet ; être administrateur du programme ne donne aucun accès aux contenus privés de ses sous-projets.
52. Un rattachement de sous-projet exige l'accord des deux parties et n'est pas transitif.
53. Un axe de recherche n'établit aucune relation historique.
54. Un sujet incertain peut être un axe sans création d'entité fictive.
55. Une habilitation de groupe n'élargit pas les droits quand le groupe change, sauf mode accepté ; un départ révoque immédiatement.
56. Déclarer une ressource ne donne aucun accès à cette ressource.
57. La réouverture d'un lot ne rend aucun droit à un bénévole dont la délégation a expiré.
58. Un avancement est constaté sur les objets, jamais saisi en pourcentage global.
59. Un partage de branche n'ouvre pas les branches non sélectionnées, même indirectement.
60. Consultation et réutilisation sont deux autorisations distinctes ; la consultation est le défaut.
61. Un arbre peut être préparé pour un tiers sans compte et lui être transféré sans réattribuer les recherches.
62. Un indicateur affiche son unité, son dénominateur, ses incertitudes et son périmètre ; un chiffre publié reste figé et explicable.
63. Une approbation éditoriale n'est ni une validation scientifique ni une autorisation de diffusion.
64. Une révocation retire les accès sans détruire les réutilisations légitimes ni invalider les conclusions.
