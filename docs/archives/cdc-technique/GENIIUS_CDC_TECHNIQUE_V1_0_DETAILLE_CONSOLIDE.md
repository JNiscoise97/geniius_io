# GENIIUS — CAHIER DES CHARGES TECHNIQUE V1.0

**Version :** consolidée détaillée — candidate à vérification documentaire  
**Date :** 9 octobre 2026  
**Statut :** non gelé — aucune recette logicielle exécutée  
**Source principale :** « échanges_CDC technique.txt » fourni par l'utilisateur, contenant les discussions TECH-001 à TECH-033 et les audits ultérieurs.  
**Méthode :** rédaction normative consolidée suivie, pour chaque exigence, du cadrage explicatif détaillé extrait des échanges. Les options, exemples, questions et recommandations figurant dans le cadrage ne sont pas tous des exigences : en cas de divergence, les décisions explicitement validées et les arbitrages REV-03 prévalent.  

## 0. Portée et statut des exigences

GENIIUS est une plateforme patrimoniale et scientifique articulant Core, Tree, Journal, Echo, Rebond, Connect et Atlas. Le présent CDC exprime les obligations de comportement, de sécurité, de conservation et d'exploitation attendues **avant** les choix détaillés d'architecture et le MPD. Les références à des technologies (PostgreSQL, Supabase, S3, MinIO, Redis, etc.) dans les explications sont des options étudiées, non des obligations de fournisseur, sauf décision ultérieure explicite.

Le statut « validé en discussion » ne signifie ni modification automatique du MLD ou du CDCF, ni recette exécutée. L'état de gel demeure suspendu aux conditions GEL-01 à GEL-08. Les exigences liées aux programmes de recherche AV-FONC-001 ne sont pas incorporées silencieusement.

## 1. Table des exigences

- **TECH-001** — Plateformes et expérience multi-support
- **TECH-002** — Travail hors ligne
- **TECH-003** — État canonique et souveraineté
- **TECH-004** — Intégration aux fichiers
- **TECH-005** — Synchronisation
- **TECH-006** — Stockage structuré et objets
- **TECH-007** — Authentification
- **TECH-008** — Architecture modulaire
- **TECH-009** — Capacité et montée en charge
- **TECH-010** — Migrations
- **TECH-011** — Autorisations et graphe accessible
- **TECH-012** — Sauvegardes et restauration
- **TECH-013** — Résilience et idempotence
- **TECH-014** — Performances
- **TECH-015** — Traitements asynchrones
- **TECH-016** — Index et vues dérivées
- **TECH-017** — Assistance IA
- **TECH-018** — API et fidélité scientifique
- **TECH-019** — Chiffrement
- **TECH-020** — Effacement et non-résurrection
- **TECH-021** — Journalisation et audit
- **TECH-022** — Environnements et compatibilité
- **TECH-023** — Intégration et déploiement continus
- **TECH-024** — Stratégie de tests
- **TECH-025** — Accessibilité et UX
- **TECH-026** — Export et portabilité
- **TECH-027** — Administration à privilèges minimaux
- **TECH-028** — Disponibilité
- **TECH-029** — Coûts et quotas
- **TECH-030** — Gestion des incidents
- **TECH-031** — Versionnement scientifique et référentiels
- **TECH-032** — Décisions d’architecture
- **TECH-033** — Internationalisation


# PARTIE I — EXIGENCES TECHNIQUES ET CADRAGE DÉTAILLÉ


## TECH-001 — Plateformes et expérience multi-support

### 1. Contrat normatif consolidé

**Exigence.** GENIIUS doit proposer des parcours cohérents sur ordinateur et mobile, adaptés aux capacités du support, sans créer de vérités scientifiques divergentes.
**Vérification.** Parcours fonctionnels multi-support; vérifier accessibilité et cohérence des droits..
**Traçabilité candidate.** CDCF; TECH-025.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

## Question TECH-001 — Comment GENIIUS doit-il exister sur les appareils ?

Il faut distinguer quelque chose d'important.

Aujourd'hui, on peut proposer GENIIUS sous plusieurs formes :

**A — uniquement une application Web.**  
Tu vas sur `geniius.io` depuis Chrome/Safari/Firefox. Sur ordinateur et téléphone, tout passe par le navigateur.

C'est le plus simple à développer, mais pour GENIIUS je trouve ça trop limitant à terme. Par exemple, manipuler des milliers de photos ou des archives locales, travailler avec des dossiers de l'ordinateur, scanner/importer en masse ou faire certains traitements locaux est moins naturel depuis un navigateur.

**B — Web + application mobile.**  
GENIIUS existe dans le navigateur sur ordinateur, et comme véritable application iPhone/Android.

C'est déjà beaucoup mieux pour Echo, Journal, Connect, la consultation de Tree, la prise de photo d'un document, l'enregistrement audio d'un témoignage, les notifications, etc. Mais l'ordinateur reste essentiellement Web.

**C — Web + mobile + véritable application desktop.**  
GENIIUS possède alors trois surfaces :

> 🌐 **Web** — accès universel  
> 📱 **Mobile** — usage nomade  
> 🖥️ **Desktop** — travail intensif

Et je pense que c'est **la bonne cible pour GENIIUS**.

Attention : ça ne veut surtout pas dire développer trois GENIIUS indépendants. Le **Core, les données, les règles métier et les API restent communs**. Ce sont les interfaces et certaines capacités locales qui changent.

Exemple très concret :

| Besoin | Téléphone | Web ordinateur | Application desktop |
|---|---|---|---|
| Consulter Tree | ✅ | ✅ | ✅ |
| Ajouter une personne | ✅ | ✅ | ✅ |
| Journal | ✅ excellent usage | ✅ | ✅ |
| Echo / enregistrer grand-mère | ✅ **usage privilégié** | ⚠️ possible | ✅ |
| Prendre une photo d'une archive | ✅ **usage privilégié** | ❌/peu naturel | ⚠️ |
| Travailler sur 2 000 actes | ❌ | ✅ | ✅ **usage privilégié** |
| Glisser 500 fichiers depuis un dossier | ⚠️ | ✅ partiellement | ✅ |
| Double écran | ❌ | ✅ | ✅ |
| Import massif | ❌ | ⚠️ | ✅ |
| Traitement local lourd | ❌ | limité | ✅ |
| Notifications | ✅ | ⚠️ | ✅ |
| Utilisation hors connexion | possible | limitée | **possible et intéressante** |

C'est aussi ce qui permettrait de répondre à ce que certaines personnes t'ont demandé par « hardware + software ».

### Mais attention au mot hardware

Je veux vérifier ce que tu entends exactement, parce qu'il peut désigner **deux choses très différentes**.

**Cas 1 — utiliser le hardware de l'appareil.**

Par exemple GENIIUS Desktop peut utiliser le disque dur, le scanner, le micro, la webcam, éventuellement le GPU ; GENIIUS Mobile peut utiliser appareil photo, micro, GPS, biométrie, partage de fichiers, etc.

Ça, **je recommande clairement OUI**.

**Cas 2 — GENIIUS vend son propre matériel.**

Par exemple un jour :

> **GENIIUS Station**  
> petit ordinateur/boîtier domestique contenant la bibliothèque familiale, stockage local, sauvegarde, synchronisation avec GENIIUS Cloud…

Ou un NAS familial GENIIUS, un scanner dédié, etc.

Là, c'est une toute autre aventure industrielle. Ça implique fabrication ou OEM, mises à jour firmware, SAV, sécurité physique, cycle de vie matériel, remplacement, certification, logistique…

Je ne mettrais **surtout pas** ça dans le périmètre du produit initial. En revanche, je peux concevoir le CDC technique pour **ne pas empêcher cette évolution future**.

### Ma recommandation TECH-001

Je proposerais de fixer la cible suivante :

> **GENIIUS est une plateforme multi-device reposant sur un Core commun.**
>
> Elle doit pouvoir être utilisée depuis **le Web, une application desktop et une application mobile**, sans chercher une parité fonctionnelle artificielle entre les trois.
>
> Chaque surface privilégie les usages adaptés au terminal.
>
> Le desktop est la surface privilégiée pour la recherche et les traitements intensifs ; le mobile pour la consultation, la collecte terrain, Echo, Journal, Connect et les usages rapides ; le Web garantit l'accès universel.
>
> Les applications peuvent exploiter les capacités matérielles du terminal lorsque cela apporte une valeur fonctionnelle.
>
> **La fabrication d'un hardware GENIIUS n'entre pas dans le périmètre initial**, mais l'architecture ne doit pas empêcher à terme un nœud/serveur/boîtier GENIIUS local.

Et j'ajouterais une règle très importante :

> **Une fonctionnalité n'a pas l'obligation d'exister sur toutes les surfaces.**

Sinon on va se condamner à concevoir Tree ou Atlas en fonction d'un écran de 6 pouces, ce qui serait une mauvaise contrainte.

---

### À toi pour TECH-001

J'ai donc besoin de **deux décisions** :

**1.** Es-tu d'accord avec ma recommandation **Web + Desktop + Mobile**, avec des fonctionnalités adaptées à chaque support plutôt qu'une parité systématique ?

**2.** Quand on t'a parlé de **« hardware et software »**, est-ce qu'on te parlait simplement d'une **application installée qui exploite réellement l'ordinateur/téléphone**, ou bien de **GENIIUS qui proposerait un jour son propre appareil physique** ?

Après ta réponse, je consigne TECH-001 et on passe à **TECH-002 : jusqu'où GENIIUS doit pouvoir fonctionner sans Internet ?** C'est directement lié à cette décision.

Es-tu d'accord avec ma recommandation **Web + Desktop + Mobile**, avec des fonctionnalités adaptées à chaque support plutôt qu'une parité systématique ? Je suis d'accord
**2.** Quand on t'a parlé de **« hardware et software »**, est-ce qu'on te parlait simplement d'une **application installée qui exploite réellement l'ordinateur/téléphone**, ou bien de **GENIIUS qui proposerait un jour son propre appareil physique** ? **application installée qui exploite réellement l'ordinateur/téléphone**

Parfait. Je consigne donc **TECH-001 comme VALIDÉ**.

### TECH-001 — Surfaces d’accès à GENIIUS ✅

**Décision :** GENIIUS sera conçu comme une plateforme **Web + Desktop + Mobile**, reposant sur un Core commun, **sans obligation de parité fonctionnelle entre les trois surfaces**.

L'application installée n'est pas simplement « le site dans une fenêtre ». Elle doit pouvoir exploiter les capacités du terminal : fichiers et dossiers locaux, appareil photo, micro, notifications, partage de fichiers, scanner lorsqu'il est accessible, etc. En revanche, **aucun matériel physique propriétaire GENIIUS** n'est envisagé. 

Ça nous amène directement à une décision beaucoup plus structurante.


## TECH-002 — Travail hors ligne

### 1. Contrat normatif consolidé

**Exigence.** Les opérations autorisées hors ligne doivent conserver les brouillons et contributions locales; l’état canonique demeure celui du service après synchronisation contrôlée.
**Vérification.** REC-X15, REC-X16, REC-X17.
**Traçabilité candidate.** L15.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-002 — GENIIUS doit-il fonctionner sans Internet ?

Il y a plusieurs degrés de « hors connexion », et la différence est énorme techniquement.

Imagine que tu sois aux **ANOM**, avec ton ordinateur, et que le Wi-Fi soit mauvais ou absent. Tu as GENIIUS Desktop ouvert.

### Option A — Cloud obligatoire

Sans Internet, GENIIUS ne fonctionne pratiquement plus.

Tes données sont sur les serveurs GENIIUS. L'application installée est principalement une interface vers le Cloud.

C'est la solution la plus simple à construire et maintenir.

**Mais pour GENIIUS, je ne la recommande pas.**

Pour un outil de recherche historique, quelqu'un peut justement travailler dans des archives, chez un particulier, dans un cimetière, en déplacement, etc.

---

### Option B — Hors connexion limité

GENIIUS conserve localement certaines informations utiles.

Par exemple, avant d'aller aux archives tu pourrais télécharger ton dossier **Charles TANCRÈDE**. Sur place, sans réseau :

- consulter les personnes et documents téléchargés ;
- lire tes notes ;
- consulter les pistes de recherche ;
- ouvrir les images déjà disponibles ;
- éventuellement prendre de nouvelles notes.

Mais certaines opérations nécessiteraient Internet.

Lorsque tu retrouves une connexion, GENIIUS synchronise.

C'est déjà très intéressant.

---

### Option C — Véritable fonctionnement offline-first

L'application Desktop dispose d'une véritable base locale.

Tu pourrais continuer à faire pratiquement tout ton travail :

> créer une personne → importer 200 photos → créer des mentions → faire des assertions → modifier Tree → annoter → classer → travailler pendant 8 heures sans Internet.

Puis tu rentres chez toi.

GENIIUS doit alors fusionner ce travail avec le serveur.

Et là apparaît un problème très intéressant.

Sarah pourrait avoir modifié **la même information** depuis son ordinateur pendant que tu travaillais hors connexion.

On doit alors déterminer :

**Jordan version 14**  
vs  
**Sarah version 15**

Que devient la version 16 ?

GENIIUS ne peut surtout pas faire :

> « dernière sauvegarde gagnante ».

Ce serait contraire à toute notre philosophie de conservation de la connaissance.

Il faudrait un véritable mécanisme de **synchronisation, conflits, causalité et résolution**.

C'est puissant, mais techniquement beaucoup plus coûteux.

---

## Et le téléphone ?

Je ferais une distinction.

Sur mobile, je veux que certaines fonctions restent utilisables sans réseau :

📷 photographier des documents ;  
🎙️ enregistrer un témoignage Echo ;  
📝 prendre des notes Journal ;  
👤 consulter certaines informations préchargées ;  
📁 préparer une collecte.

Le téléphone stocke alors temporairement les données et les synchronise lorsqu'il retrouve Internet.

En revanche, je ne vois aucune nécessité à embarquer **l'intégralité d'une base généalogique de plusieurs centaines de Go** sur un téléphone.

---

## Ma recommandation

Je choisirais une approche **B+**, préparée architecturalement pour pouvoir évoluer vers C.

Autrement dit :

> **GENIIUS est cloud-first mais possède des capacités hors connexion explicites.**

L'utilisateur peut choisir certains **espaces, projets, dossiers ou contenus à rendre disponibles hors connexion**.

Sur Desktop, ces contenus peuvent être consultés **et modifiés** sans Internet.

Sur Mobile, certaines opérations de collecte doivent également fonctionner hors connexion : photo, audio, note, saisie simple, consultation préchargée.

Lors du retour du réseau, les changements sont synchronisés.

Et surtout :

> **GENIIUS ne doit jamais résoudre silencieusement un conflit scientifique.**

Si deux modifications concurrentes sont compatibles, la synchronisation peut être automatique.

Si elles sont contradictoires, GENIIUS doit conserver les deux traces et provoquer une résolution explicite plutôt que d'écraser une version.

### Pourquoi pas C immédiatement ?

Parce qu'un véritable système **offline-first intégral** change radicalement la complexité de GENIIUS.

Chaque objet, association, droit, version, fichier et dépendance devient potentiellement synchronisable entre plusieurs bases.

Notre MLD a heureusement déjà beaucoup de propriétés qui nous préparent bien à cela : identifiants stables, versions, activités, absence d'écrasement de l'histoire, etc. Mais je ne veux pas nous imposer immédiatement le coût d'un « Git distribué de la généalogie ».

Avec **B+**, on obtient probablement 80 % de la valeur pratique pour une fraction de la complexité.

Et je poserais dès maintenant une exigence importante :

> **L'architecture V1 ne doit pas rendre impossible une évolution future vers un fonctionnement offline-first plus complet.**

### TECH-002 — ma proposition

**Cloud-first + offline sélectif**, avec synchronisation différée.

Desktop : consultation **et modification** des contenus explicitement disponibles hors ligne.

Mobile : consultation préchargée + fonctions de collecte essentielles hors ligne.

Web : fonctionnement principalement connecté ; éventuellement cache technique, mais pas de véritable mode offline garanti.

Conflit : **aucun écrasement silencieux** ; conservation des versions concurrentes et résolution contrôlée.

Architecture : doit permettre d'étendre ultérieurement le périmètre offline.

**Tu es d'accord avec cette recommandation, tu veux aller jusqu'au vrai offline-first dès le départ, ou tu veux me challenger sur un point ?**

Alors, je vais te challenger. OK pour du hors-connexion limitée. J'entends tes points. J'aurais aimé que le C soit effectivement priorisé, mais OK, pour l'instant on va rester sur du offline, sur du online. On fera sur du hors-connexion limitée. Par contre le téléphone, tu me dis sur YouTube que certaines fonctions restent utilisables sans réseau. Accéder à son arbre généalogique, à l'intégralité de sa base généalogique, de tous les projets sur lesquels on travaille, c'est hyper important, même sans réseau. Parce que si je me retrouve, par exemple dans une zone sans réseau, et que j'ai besoin de, par exemple dans un cimetière, comme on disait plus tôt, et que je me trouve embarrassé parce que je ne sais pas qui est qui, j'ai besoin de mon application, j'ai besoin de pouvoir naviguer, j'ai besoin de savoir les projets sur lesquels je travaille, j'ai besoin de tout savoir. Et là tu me limites sur le téléphone, alors que c'est pas du tout ce que je veux.


Oui, et ton challenge change utilement la décision. J'avais fait une mauvaise assimilation entre **« hors connexion limité »** et **« petit sous-ensemble de données sur mobile »**. Ce ne sont pas la même chose.

Pour GENIIUS, je suis d'accord avec ton exigence : **le téléphone doit pouvoir servir de véritable compagnon généalogique hors connexion**, notamment précisément dans des situations comme un cimetière, des archives, une maison familiale ou une zone sans réseau.

### TECH-002 — proposition corrigée

Je conserverais **B : hors connexion limité**, mais le mot « limité » porterait sur **ce qu'on peut faire**, pas nécessairement sur **ce qu'on peut consulter**.

Sur mobile, je veux donc viser ceci :

| Sans Internet sur mobile | Exigence |
|---|---:|
| Voir ses arbres Tree | ✅ |
| Naviguer dans les personnes/familles | ✅ |
| Consulter ses projets | ✅ |
| Voir événements, lieux, relations | ✅ |
| Consulter ses recherches Echo | ✅ |
| Consulter Journal | ✅ |
| Rechercher une personne | ✅ |
| Naviguer entre les liens | ✅ |
| Consulter ses sources/références | ✅ |
| Voir les métadonnées des documents | ✅ |
| Prendre notes/photos/audio | ✅ |
| Créer des éléments simples | ✅ |
| Modifier massivement le graphe | ⚠️ |
| Import GEDCOM massif | ❌ |
| Gros traitements/analyse | ❌ |
| Certaines fonctions collaboratives | ❌ sans réseau |
| IA nécessitant un serveur | ❌ sans réseau |

Donc, si tu pars dans un cimetière sans aucune connexion, tu dois pouvoir sortir ton téléphone, taper **« Charles TANCRÈDE »**, retrouver sa fiche, remonter ses parents, voir ses enfants, naviguer dans ton arbre, retrouver le projet associé, tes recherches, tes sources connues, etc.

**C'est une exigence que je mettrais dans le CDC.**

### Mais « toute ma base » pose une deuxième question

Il faut distinguer **les données structurées** et **les fichiers lourds**.

Une énorme généalogie en données structurées peut rester relativement raisonnable : personnes, relations, assertions, événements, recherches, références, métadonnées, etc.

En revanche, imaginons que GENIIUS contienne :

- 50 000 photos d'archives ;
- 3 000 PDF ;
- 200 heures d'enregistrements Echo ;
- des vidéos familiales ;
- des scans TIFF de 100 Mo.

Là, « avoir l'intégralité de GENIIUS sur le téléphone » pourrait représenter **100, 300 ou 500 Go**.

Ce n'est probablement pas ce dont tu as besoin devant une tombe.

Je proposerais donc une distinction fondamentale :

> **Les données de connaissance doivent pouvoir être intégralement disponibles hors connexion. Les fichiers lourds sont gérés séparément.**

Ainsi, devant une tombe, même si le scan HD de 80 Mo de l'acte de naissance n'a pas été téléchargé, tu vois toujours :

**Charles TANCRÈDE**  
→ parents  
→ événements  
→ assertions  
→ sources  
→ recherches  
→ projets  
→ document « Acte de naissance… »  
→ transcription éventuelle  
→ métadonnées  
→ etc.

Et si le fichier original a été explicitement conservé hors ligne, tu peux également l'ouvrir.

Cela donne quelque chose d'assez puissant :

> **Base de connaissance locale complète + médiathèque locale sélective.**

Et là, oui, je pense que nous tenons quelque chose de beaucoup plus adapté à GENIIUS.

---

## TECH-002 — ma nouvelle recommandation

Je te propose de valider :

**GENIIUS reste cloud-first et n'est pas encore intégralement offline-first.**

Mais :

> **Desktop et Mobile doivent pouvoir conserver localement l'intégralité des données structurées auxquelles l'utilisateur a normalement accès et dont il souhaite disposer hors connexion.**

Cela comprend notamment Tree, personnes, relations, événements, assertions, sources et références, projets, recherches, Journal et les autres données nécessaires à la navigation.

Les **fichiers binaires lourds** — images originales, PDF, audio, vidéo, etc. — suivent une politique distincte : téléchargement à la demande, mise en cache et possibilité pour l'utilisateur de demander explicitement leur conservation hors ligne.

Et on peut même prévoir plus tard :

**Projet CHARBONNÉ → ☑ Toujours disponible hors connexion, documents compris.**

ou :

**Tout mon espace → ☑ Données hors connexion  
☐ Originaux photo/PDF  
☐ Audio  
☐ Vidéo**

Ça donne beaucoup de contrôle sans remplir automatiquement les 128 Go d'un téléphone.

Enfin, les **écritures hors ligne restent volontairement limitées en V1**. On peut collecter et créer certaines choses, mais nous ne prétendons pas encore permettre absolument toutes les opérations métier sans serveur. C'est cette partie qui nous évite pour l'instant la complexité du vrai offline-first C.

### Donc la vraie définition devient

**Lecture hors ligne : très large, jusqu'à la base structurée complète.**  
**Collecte hors ligne : importante.**  
**Modification métier hors ligne : partielle.**  
**Fichiers lourds hors ligne : configurable.**  
**Synchronisation complexe multi-utilisateur : pas encore offline-first intégrale.**

Ça correspond beaucoup mieux à ce que tu viens de décrire.

**Si tu es d'accord, je valide TECH-002 ainsi.**

Et ensuite il faudra faire **TECH-003 — où se trouve la donnée de référence : Cloud GENIIUS ou appareil ?** C'est subtil mais fondamental : même si ton téléphone possède toute ta généalogie hors connexion, il faut décider laquelle des copies fait juridiquement/techniquement autorité lorsqu'elles se retrouvent.


Parfait. **TECH-002 est VALIDÉ ✅** avec cette distinction essentielle : lecture hors ligne très large sur Desktop et Mobile, collecte hors ligne importante, modifications métier partiellement disponibles, fichiers lourds configurables, sans imposer dès V1 un système totalement offline-first.

On arrive maintenant à une décision structurante pour toute l’architecture.


## TECH-003 — État canonique et souveraineté

### 1. Contrat normatif consolidé

**Exigence.** Les états scientifiques partagés et les arbres personnels restent séparés; une contribution au Core est explicite, attribuée et soumise aux droits; aucune fusion silencieuse.
**Vérification.** REC-X13; REC-TR05 à REC-TR11.
**Traçabilité candidate.** L11.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-003 — Où se trouve la donnée de référence ?

Prenons un exemple.

Tu as GENIIUS sur :

- ton PC fixe ;
- ton MacBook ;
- ton téléphone ;
- le Web.

À 10 h, tout est synchronisé.

À 11 h, sans Internet, tu consultes ton téléphone dans un cimetière et ajoutes une note :

> « Tombe repérée allée 4, inscription difficilement lisible. »

Pendant ce temps, quelqu'un ayant accès au même projet travaille depuis GENIIUS Web.

À 14 h, ton téléphone retrouve Internet.

Il existe alors plusieurs copies de certaines informations : téléphone, éventuellement ordinateur, serveur GENIIUS.

Il faut définir **laquelle constitue la référence technique**.

## Option A — L'appareil est souverain

C'est le fonctionnement historique de beaucoup de logiciels de généalogie.

Ton fichier/base locale est **ta généalogie**.

Le Cloud sert éventuellement à synchroniser ou sauvegarder.

C'est un peu la logique :

> `mon-arbre.ged` sur mon ordinateur = ma donnée principale.

Avantage : très forte autonomie.

Mais pour GENIIUS, cela deviendrait extrêmement compliqué avec la collaboration, les espaces, les droits, les versions, les références entre projets, Connect, etc.

Je ne recommande pas cette solution.

---

## Option B — Le Cloud est souverain

Il existe une **source de vérité centrale GENIIUS**.

Téléphone et Desktop possèdent des copies locales permettant le hors connexion, mais celles-ci sont des **répliques**.

On pourrait être tenté de dire :

> Au retour d'Internet, le téléphone envoie ses changements au serveur et le serveur décide.

C'est beaucoup plus simple.

Mais je veux ajouter une nuance fondamentale à cause de notre modèle scientifique.

Le Cloud ne doit pas pouvoir répondre :

> « La version du serveur est plus récente, donc ta modification locale est supprimée. »

Ce serait incompatible avec ce qu'on construit depuis le MCD.

---

## Option C — Cloud canonique + contributions locales versionnées

C'est **ma recommandation**.

Le Cloud GENIIUS détient **l'état canonique synchronisé**.

Mais lorsqu'un appareil travaille hors ligne, ses nouvelles données ne sont pas considérées comme de simples modifications temporaires jetables.

Elles sont enregistrées localement comme des **opérations/contributions identifiées**.

Quand Internet revient :

**Téléphone**
→ « J'ai créé ceci hors ligne à 11 h 03 à partir de la version 17. »

**Serveur**
→ « Mon état actuel est toujours 17. »

Alors parfait : application → version 18.

Mais imaginons :

**Téléphone**
→ modification basée sur V17.

**Serveur**
→ quelqu'un a déjà produit V18.

GENIIUS sait alors qu'il y a potentiellement concurrence :

`V17 → modification A`  
`V17 → modification B`

Et surtout, il ne détruit ni A ni B.

Selon la nature de la modification, GENIIUS pourra :

**fusionner automatiquement** lorsqu'il n'y a aucun conflit ;

ou

**demander une résolution** lorsque les modifications portent sur le même élément incompatible.

### Exemple simple

Tu modifies hors ligne :

> note = « tombe photographiée »

Sarah ajoute en ligne :

> profession = boulanger

Aucun conflit réel.

GENIIUS peut probablement intégrer les deux.

En revanche :

Tu modifies :

> nom affiché = CHARBONNÉ

et quelqu'un modifie :

> nom affiché = CHARBONNET

Là, je ne veux pas qu'une règle informatique décide laquelle des deux personnes a raison.

---

# Et notre MLD nous aide énormément

Ce qu'on vient de construire était presque prédisposé à ce fonctionnement.

Nous avons déjà :

`OBJET`  
→ identité stable

`VERSION_OBJET`  
→ états successifs

`ACTIVITE`  
→ qui a fait quoi

historisation  
→ état antérieur conservé

et une doctrine de non-destruction de la connaissance.

Donc on n'a pas besoin d'inventer un deuxième modèle uniquement pour la synchronisation.

---

# Une conséquence importante

Si ton téléphone est hors ligne pendant trois jours, **le téléphone n'est pas devenu la nouvelle base GENIIUS souveraine**.

Il possède :

> dernière copie canonique connue  
> +  
> changements locaux en attente.

Quand il se reconnecte, GENIIUS réconcilie les deux.

C'est beaucoup plus sain.

Et cela permettra également un jour d'aller vers le véritable offline-first que tu aurais préféré en TECH-002 : nous n'aurons pas construit une architecture qui nous bloque.

---

## TECH-003 — ma recommandation

Je propose donc :

> **Le Cloud GENIIUS constitue la référence technique canonique des données synchronisées.**

Les applications Desktop et Mobile maintiennent une **réplique locale** des données nécessaires au fonctionnement hors connexion.

Toute opération réalisée hors connexion conserve au minimum son identité, son auteur/appareil, sa date, son contexte et **la version canonique connue sur laquelle elle a été effectuée**.

Lors de la reconnexion :

**pas de conflit →** synchronisation automatique ;

**conflit techniquement fusionnable →** fusion automatique traçable ;

**conflit susceptible de modifier le sens scientifique ou métier →** aucune décision silencieuse, conservation des contributions et résolution explicite.

Et surtout :

> **La synchronisation ne doit jamais être un mécanisme de destruction de provenance ou d'historique.**

### Petite subtilité

« Cloud canonique » ne veut **pas** dire que GENIIUS décide de la vérité historique.

Le serveur est **techniquement canonique** pour savoir *quel est l'état enregistré de GENIIUS*.

Une assertion du serveur disant « Charles est né en 1852 » peut parfaitement être contestée par une autre assertion. On ne confond toujours pas **vérité technique de l'état du système** et **vérité historique**.

**Ma recommandation est donc l'option C : Cloud canonique + répliques locales + contributions hors ligne versionnées + conflits non destructifs.**

Tu es d'accord avec **TECH-003** ?


Parfait. **TECH-003 est VALIDÉ ✅** : Cloud GENIIUS techniquement canonique, répliques locales, contributions hors connexion versionnées, synchronisation traçable et aucun écrasement silencieux en cas de conflit sémantique.

On continue dans la logique multi-device.


## TECH-004 — Intégration aux fichiers

### 1. Contrat normatif consolidé

**Exigence.** Les médias et fichiers documentaires conservent identifiants, empreintes, métadonnées de provenance et références stables malgré renommage ou indisponibilité.
**Vérification.** REC-TECH04.
**Traçabilité candidate.** Stockage documentaire.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-004 — Application Desktop : vraie application ou Web « emballé » ?

On a décidé en TECH-001 que GENIIUS aurait une **application installée sur ordinateur** et qu'elle devrait réellement exploiter l'ordinateur. Il faut maintenant préciser jusqu'où.

Il existe trois grandes façons de faire.

### Option A — Le site GENIIUS installé comme une PWA

Une **PWA** (*Progressive Web App*) est essentiellement le site Web auquel on donne certaines capacités d'application installée.

Tu peux avoir une icône GENIIUS dans Windows/macOS, lancer GENIIUS dans sa propre fenêtre et disposer de certaines fonctions hors connexion.

C'est économique parce qu'on réutilise énormément le Web.

Mais l'accès profond au système reste limité. Pour un logiciel destiné notamment à travailler avec des masses d'archives, je trouve cela insuffisant comme cible Desktop.

### Option B — Une application Desktop utilisant les technologies Web

Visuellement, on peut réutiliser beaucoup de composants de GENIIUS Web, mais l'application possède une véritable couche locale capable de communiquer avec Windows/macOS.

C'est le principe d'applications comme [Visual Studio Code](https://code.visualstudio.com/?utm_source=chatgpt.com) ou [Slack](https://slack.com/?utm_source=chatgpt.com), même si les technologies exactes peuvent varier.

Cela permettrait par exemple à GENIIUS Desktop de faire :

> **Importer un dossier**

Tu sélectionnes :

`D:\Genealogie\ANOM\Guadeloupe\Deshaies\`

GENIIUS peut parcourir réellement les fichiers, calculer leurs empreintes, détecter les doublons, importer 2 000 images, suivre leur traitement, reprendre après interruption, etc.

Ou :

> **Surveiller ce dossier dans GENIIUS**

Tu ajoutes demain `IMG_9482.jpg` dans le dossier ; l'application peut détecter qu'un nouveau fichier est apparu et te proposer son intégration.

On pourrait également avoir du glisser-déposer système, des raccourcis clavier poussés, des notifications natives, une gestion locale importante, etc.

C'est **ma recommandation**.

### Option C — Application Desktop entièrement native

On développe spécifiquement une application Windows et une application macOS avec leurs technologies natives.

Cela offre une intégration maximale au système.

Mais le coût devient important : Web + iOS + Android + Windows + macOS commencent à devenir autant de produits à maintenir.

Je ne vois pas actuellement de justification suffisante.

---

# Et jusqu'où autoriser GENIIUS à toucher à l'ordinateur ?

Deuxième décision dans TECH-004.

Je ne veux pas qu'une application généalogique obtienne arbitrairement accès à tout ton disque.

Je recommande un fonctionnement basé sur **l'autorisation explicite de l'utilisateur**.

Par exemple :

> GENIIUS souhaite accéder au dossier  
> `Documents/Généalogie/Archives ANOM/`  
> **[Autoriser]**

À partir de là, GENIIUS peut travailler dans le périmètre autorisé.

Même logique pour le micro, la caméra, le scanner ou d'autres capacités matérielles.

Et il faut que l'utilisateur puisse retirer l'autorisation.

---

# Cas particulièrement intéressant : les scanners

C'est justement une des raisons pour lesquelles je veux conserver une vraie ambition Desktop.

À terme, tu pourrais imaginer :

**GENIIUS → Numériser un document**

Scanner connecté → acquisition → image originale → empreinte → métadonnées → document GENIIUS → traitement éventuel → transcription/OCR.

Mais je ne voudrais pas rendre le support direct de tous les scanners obligatoire dès V1. Les écosystèmes Windows/macOS et les pilotes rendent le sujet plus compliqué qu'un simple upload.

Je formulerais donc :

**accès fichiers/dossiers : obligatoire ;**  
**glisser-déposer massif : obligatoire ;**  
**stockage/base locale : obligatoire ;**  
**micro/caméra : lorsque disponibles et autorisés ;**  
**scanner : capacité cible, intégration progressive.**

---

# TECH-004 — ma recommandation

Je propose donc de fixer :

> **GENIIUS Desktop est une véritable application installable Windows et macOS, et non une simple PWA.**

Elle pourra partager une partie importante de sa technologie et de ses composants d'interface avec GENIIUS Web, mais possédera une **couche Desktop dédiée** lui permettant d'utiliser les capacités locales de l'ordinateur.

Elle devra notamment pouvoir accéder, avec autorisation explicite, aux fichiers et dossiers locaux, gérer des imports massifs, le glisser-déposer, le stockage hors connexion, les notifications et les capacités matérielles pertinentes.

L'accès au système respecte le **moindre privilège** : GENIIUS ne demande que les permissions nécessaires et l'utilisateur garde le contrôle.

Et je **ne choisirais pas encore la technologie** (Electron, Tauri, autre). Ce choix viendra dans l'architecture après le CDC. Ici, on fixe ce que la solution devra être capable de faire.

### Une question supplémentaire à trancher

Pour moi, **Windows + macOS doivent être officiellement supportés dès la cible initiale Desktop**.

Pour **Linux**, j'hésite davantage. Techniquement GENIIUS intéressera probablement une population où Linux existe, mais chaque OS officiellement supporté implique tests, packaging, mises à jour, bugs spécifiques, etc.

**Ma recommandation : Windows + macOS obligatoires ; Linux souhaitable et prévu architecturalement, mais pas obligatoire pour la première version.**

Tu es d'accord avec **TECH-004**, y compris cette position sur Linux ?


Parfait. **TECH-004 est VALIDÉ ✅** : vraie application Desktop, Windows + macOS comme cibles obligatoires, Linux prévu architecturalement mais non exigé en V1, accès au matériel/local uniquement avec permissions explicites.

On a maintenant posé le cadre des appareils. Il faut décider **comment l'utilisateur passe de l'un à l'autre**.


## TECH-005 — Synchronisation

### 1. Contrat normatif consolidé

**Exigence.** La synchronisation doit être reprise, idempotente, sensible aux conflits et aux révocations; elle ne transforme pas une divergence scientifique en arbitrage automatique.
**Vérification.** REC-X16, REC-X17.
**Traçabilité candidate.** L15.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-005 — Synchronisation entre appareils : automatique ou manuelle ?

Imaginons ton usage normal :

À 9 h, tu travailles sur GENIIUS Desktop et ajoutes plusieurs éléments au projet CHARBONNÉ.

À 12 h, tu fermes ton ordinateur.

À 15 h, tu ouvres GENIIUS sur ton téléphone.

Qu'attends-tu ?

Probablement que **tout soit déjà là**, sans bouton « Synchroniser ».

C'est ce que je recommande, mais il faut définir précisément le comportement.

### Option A — Synchronisation manuelle

GENIIUS affiche :

> 17 modifications non synchronisées  
> **[Synchroniser]**

C'est rassurant parce que l'utilisateur contrôle explicitement l'opération, mais assez archaïque pour un produit moderne. Et surtout, on finit par avoir des appareils avec des états différents parce que quelqu'un a oublié de synchroniser.

Je déconseille.

### Option B — Synchronisation automatique

Dès qu'Internet est disponible :

**appareil → GENIIUS Cloud → autres appareils**

Les modifications sont envoyées automatiquement.

L'utilisateur n'a normalement rien à faire.

Je recommande cette approche.

Mais il faut absolument rendre **l'état de synchronisation visible**.

Par exemple :

> ☁️ **Synchronisé**

ou

> ↻ **Synchronisation — 37 modifications restantes**

ou

> 📵 **Hors connexion — 12 modifications en attente**

ou

> ⚠️ **2 conflits nécessitent votre attention**

Cela évite le pire scénario : l'utilisateur pense que ses recherches sont sauvegardées alors qu'elles sont encore uniquement sur son ordinateur.

---

# TECH-005B — Et si la connexion est mauvaise ?

Imaginons que tu importes 200 photos dans un cimetière ou aux archives.

La connexion disparaît après la photo 73.

GENIIUS ne doit surtout pas recommencer les 200 uploads.

Il doit savoir :

> 72 transférées  
> 1 transfert incomplet  
> 127 en attente

Lorsque la connexion revient, il reprend.

Même principe pour une grosse synchronisation.

C'est ce qu'on appelle notamment la **reprise sur interruption**.

Je la rendrais obligatoire.

---

# TECH-005C — Téléphone : attention aux données mobiles

Autre cas concret.

Tu photographies 300 documents. Cela représente 4 Go.

Tu quittes les archives et ton téléphone retrouve la 5G.

Techniquement GENIIUS pourrait commencer immédiatement à envoyer 4 Go.

Ce n'est pas forcément souhaitable.

Je recommande donc que l'utilisateur puisse choisir :

**Synchronisation des fichiers lourds :**
- Wi-Fi uniquement ;
- Wi-Fi + données mobiles ;
- demander avant gros transfert.

En revanche, les petites données structurées — note, personne, relation, assertion, activité — peuvent généralement être synchronisées rapidement.

---

# TECH-005D — Synchronisation ≠ sauvegarde

C'est extrêmement important pour notre futur CDC.

Si tu supprimes accidentellement quelque chose et que GENIIUS synchronise parfaitement cette suppression sur quatre appareils...

...tu as quatre appareils parfaitement synchronisés avec ton erreur.

La synchronisation protège contre **la divergence entre appareils**.

La sauvegarde protège contre **la perte ou la corruption**.

Et l'historisation GENIIUS protège encore autre chose : **l'évolution de la connaissance**.

Nous traiterons donc les sauvegardes séparément.

---

# Ma recommandation TECH-005

Je propose :

> **La synchronisation GENIIUS est automatique par défaut dès qu'une connexion adaptée est disponible.**

Elle doit être **incrémentale** : seules les nouveautés/modifications nécessaires circulent, pas toute la base à chaque fois.

Elle doit être **interruptible et reprenable** sans duplication.

Elle doit distinguer les petites données structurées des fichiers lourds.

Elle doit afficher clairement à l'utilisateur l'état :

**synchronisé / en cours / hors connexion / éléments en attente / erreur / conflit.**

L'utilisateur peut définir les règles de transfert des fichiers lourds, notamment pour les données mobiles.

Une erreur réseau ne doit provoquer ni perte, ni duplication, ni obligation de recommencer toute une opération.

Et conformément à TECH-003, un conflit scientifique n'est jamais silencieusement écrasé.

---

Il reste cependant **une décision sur laquelle je veux ton avis**.

Supposons que tu crées une information hors ligne. Ton téléphone affiche :

> 📵 Hors connexion — 1 modification en attente.

Tu fermes GENIIUS et ne retrouves Internet que **trois semaines plus tard**.

### Option 1 — GENIIUS conserve indéfiniment la modification locale

Tant qu'elle n'a pas été synchronisée, GENIIUS **n'a pas le droit de la supprimer automatiquement**, même après plusieurs mois.

C'est ma recommandation.

Cela implique que désinstaller l'application ou supprimer les données locales devra déclencher un **avertissement très explicite** s'il existe des données non synchronisées.

Exemple :

> ⚠️ **12 éléments n'ont jamais été synchronisés avec GENIIUS.**
>
> Leur suppression entraînerait une perte définitive.

Je considère cela particulièrement important pour un produit où une photo ou une information collectée sur le terrain peut être **irremplaçable**.

### Option 2 — Expiration après un délai

Après X jours/mois, certaines données locales non synchronisées peuvent être nettoyées automatiquement.

Je déconseille fortement cela pour les créations utilisateur.

**Ma recommandation est donc : aucune donnée créée par l'utilisateur et non encore synchronisée ne peut être automatiquement supprimée pour des raisons de cache, de stockage ou d'ancienneté.**

Es-tu d'accord avec **TECH-005 dans son ensemble**, y compris cette règle de **non-expiration des données utilisateur non synchronisées** ?


Parfait. **TECH-005 est VALIDÉ ✅** dans son ensemble : synchronisation automatique et incrémentale, reprise après interruption, visibilité de l’état, politique spécifique pour les fichiers lourds, gestion non destructive des conflits et **aucune expiration automatique d’une création utilisateur non synchronisée**.

Nous avons maintenant suffisamment cadré le multi-device. La prochaine question touche à un sujet encore plus fondamental : **où GENIIUS conserve physiquement les différents types de données**.


## TECH-006 — Stockage structuré et objets

### 1. Contrat normatif consolidé

**Exigence.** Les données structurées et les binaires doivent être liés par des identifiants stables, contrôles d’intégrité, règles de droits et opérations de cycle de vie cohérentes.
**Vérification.** REC-RB04 à RB07; REC-J06 à J09.
**Traçabilité candidate.** L06, L07.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-006 — Base de données et fichiers : doit-on les séparer ?

Quand tu utilises GENIIUS, tout n'est pas de même nature.

Prenons une source généalogique.

GENIIUS peut connaître :

> Document : acte de naissance  
> Commune : Deshaies  
> Date : 12 mars 1848  
> Personnes mentionnées : X, Y, Z  
> Transcription : …  
> Assertions produites : …  
> Provenance : ANOM  
> Cote : …

Mais il peut également posséder :

> `FRANOM_....jpg` — scan original de 42 Mo.

Ces deux choses n'ont pas intérêt à être stockées de la même façon.

## Option A — Tout mettre dans la base de données

PostgreSQL pourrait techniquement stocker aussi les images, PDF, vidéos, etc.

On aurait alors :

**PostgreSQL**
→ personnes  
→ assertions  
→ relations  
→ textes  
→ ET fichiers binaires.

C'est séduisant : « tout est au même endroit ».

Mais pour GENIIUS, je le déconseille.

Imagine des millions de documents et des téraoctets de photos, scans, audio et vidéo. Cela ferait porter à la base relationnelle un travail pour lequel un stockage objet est généralement plus adapté.

---

# Option B — Séparer données structurées et fichiers

C'est **ma recommandation**.

On aurait conceptuellement :

**Base relationnelle**
→ personnes  
→ événements  
→ assertions  
→ relations  
→ sources  
→ métadonnées  
→ transcriptions  
→ droits  
→ versions  
→ projets  
→ Journal  
→ etc.

et :

**Stockage objet**
→ images  
→ PDF  
→ audio  
→ vidéo  
→ fichiers GEDCOM originaux  
→ exports  
→ autres fichiers binaires.

Le MLD reste alors le cerveau qui sait :

> Ce DOCUMENT possède tel fichier.

Le stockage objet contient physiquement les octets.

---

# Un exemple avec une photo

Tu importes :

`acte_naissance_charbonne_1842.jpg`

GENIIUS pourrait créer conceptuellement :

**Dans la base :**

> DOCUMENT #8392  
> type = acte de naissance  
> fichier original = #F672  
> empreinte = `abc123...`  
> taille = 48 292 103 octets  
> format = JPEG  
> etc.

**Dans le stockage objet :**

> les 48 Mo réels de l'image.

C'est une distinction importante :

**le fichier n'est pas la connaissance.**

Le fichier constitue une trace numérique à laquelle GENIIUS rattache de la connaissance.

---

# TECH-006B — L'original doit-il être sacré ?

Là, ma recommandation est très forte :

> **GENIIUS ne doit jamais modifier silencieusement un fichier source original importé.**

Supposons que tu importes un scan TIFF.

GENIIUS veut ensuite :

- le compresser ;
- corriger sa rotation ;
- augmenter le contraste ;
- produire une miniature ;
- générer une version WebP ;
- faire de l'OCR.

Je veux :

**ORIGINAL**

`scan_001.tif`

conservé tel qu'importé.

Puis :

**DÉRIVÉS**

`preview.webp`  
`thumbnail.webp`  
`ocr.json`  
etc.

Si tu fais pivoter visuellement le document de 90°, on peut créer une représentation corrigée ou enregistrer la transformation.

Mais l'original reste intact.

Pour un outil historique, c'est essentiel.

---

# TECH-006C — Comment vérifier que l'original n'a pas changé ?

Avec une **empreinte cryptographique**.

Exemple simplifié :

`scan.tif`  
→ SHA-256  
→ `8cf35...`

Si un seul octet du fichier change, son empreinte change.

GENIIUS peut donc savoir :

> « Le fichier actuellement stocké correspond exactement au fichier qui a été importé. »

Cela permet aussi d'aider à détecter des doublons.

Tu importes deux fois exactement le même fichier :

`acte.jpg`

puis six mois après :

`IMG_5842.jpg`

Les noms sont différents.

Mais :

`empreinte A = XYZ`  
`empreinte B = XYZ`

GENIIUS sait que les contenus binaires sont identiques.

---

# Attention : doublon ≠ même document historique

C'est important.

Si deux fichiers ont la même empreinte, GENIIUS peut affirmer :

> **les deux fichiers numériques sont identiques.**

Il ne doit pas automatiquement en conclure :

> **les deux références documentaires sont nécessairement le même objet scientifique.**

Encore une fois, on sépare constat technique et interprétation scientifique.

---

# TECH-006D — MinIO, S3, Supabase Storage ?

Tu connais déjà un peu [MinIO](https://www.min.io/?utm_source=chatgpt.com) et tu as travaillé avec des buckets.

Mais je ne veux toujours pas décider ici :

> « GENIIUS utilisera obligatoirement MinIO. »

Le CDC doit plutôt dire :

> GENIIUS nécessite un **stockage objet compatible avec les exigences définies**.

Lors de l'architecture, nous pourrons comparer par exemple une solution S3-compatible, un stockage managé ou autre.

Même raisonnement pour [Supabase](https://supabase.com/?utm_source=chatgpt.com) : ce sera une décision d'architecture, pas une exigence fonctionnelle déguisée.

---

# TECH-006E — Et les fichiers locaux Desktop ?

C'est là que TECH-004 devient intéressant.

Imaginons :

`D:\Genealogie\Archives\acte.tif`

Tu l'importes dans GENIIUS.

Deux philosophies sont possibles.

### Option 1 — GENIIUS référence simplement ton fichier

GENIIUS mémorise :

> le fichier est sur `D:\Genealogie\...`

Problème : tu renommes le dossier, changes d'ordinateur ou débranches le disque dur → GENIIUS ne trouve plus le fichier.

### Option 2 — GENIIUS ingère le fichier

Lors de l'import, GENIIUS en fait une **copie gérée par GENIIUS**, calcule son empreinte, l'enregistre et le synchronise vers le stockage GENIIUS.

Ton original personnel peut toujours rester dans ton dossier.

Mais GENIIUS possède sa propre copie maîtrisée.

**C'est ma recommandation par défaut.**

Cela garantit beaucoup mieux la pérennité.

---

# Mais il y a un cas particulier

Imagine quelqu'un avec :

**4 To d'archives généalogiques sur un NAS.**

L'obliger à envoyer immédiatement 4 To dans GENIIUS pourrait être problématique.

Je voudrais donc prévoir ultérieurement un mode avancé :

> **Référence externe / bibliothèque liée**

GENIIUS connaît le fichier, son empreinte et ses métadonnées, mais le fichier peut rester dans un stockage externe contrôlé par l'utilisateur.

Cependant, je n'en ferais **pas le fonctionnement normal** : cela introduit des risques de fichiers absents ou déplacés.

---

# Ma recommandation TECH-006

Je te propose donc de valider ces principes :

> **1.** Les données structurées et les fichiers binaires sont physiquement séparés.

> **2.** La base relationnelle conserve la connaissance structurée, les métadonnées et les références vers les fichiers.

> **3.** Les fichiers binaires sont conservés dans un stockage objet adapté.

> **4.** Tout fichier original ingéré par GENIIUS est **immuable**. Les transformations produisent des dérivés.

> **5.** Une empreinte cryptographique forte est calculée pour vérifier l'intégrité et permettre la détection d'identité binaire.

> **6.** Par défaut, importer signifie que GENIIUS prend en charge sa propre copie du fichier ; il ne dépend pas uniquement d'un chemin présent sur l'ordinateur de l'utilisateur.

> **7.** L'architecture devra néanmoins permettre à terme des bibliothèques externes/liées pour des volumes très importants.

> **8.** On ne choisit pas encore MinIO, S3 ou Supabase Storage : le CDC fixe les exigences ; l'architecture choisira la technologie.

Et j'ajouterais une dernière exigence : **perdre le stockage objet ne doit jamais laisser la base prétendre qu'un original est encore disponible**. GENIIUS doit être capable de contrôler l'intégrité entre métadonnées et fichiers réels.

**Je recommande l'ensemble de TECH-006 tel quel. Tu es d'accord ou tu veux challenger un des huit points ?**


Parfait. **TECH-006 est VALIDÉ ✅** avec les huit principes, notamment l’immutabilité des originaux, la séparation données/fichiers et l’ingestion par défaut.

On a maintenant une base assez solide pour aborder un sujet qui va profondément influencer l’expérience utilisateur, la sécurité et l’architecture : **l’identité et l’authentification**.


## TECH-007 — Authentification

### 1. Contrat normatif consolidé

**Exigence.** Authentification robuste, passkeys et MFA selon la politique retenue; récupération contrôlée, révocation des sessions et séparation identité de connexion/acteur/personne historique.
**Vérification.** REC-TECH07.
**Traçabilité candidate.** P16.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-007 — Comment se connecter à GENIIUS ?

Ça paraît banal — « un email et un mot de passe » — mais GENIIUS manipule potentiellement des arbres familiaux privés, des informations sur des personnes vivantes, des photos, des témoignages Echo, des documents personnels, etc. Je veux donc qu'on décide consciemment du niveau de sécurité.

## Option A — Email + mot de passe uniquement

Classique :

> Email  
> Mot de passe  
> **Se connecter**

Simple et universel.

Mais aujourd'hui, je trouve insuffisant d'en faire **l'unique mécanisme**.

Un mot de passe peut être réutilisé, volé ou obtenu par phishing.

---

## Option B — Plusieurs méthodes de connexion

C'est ce que je recommande.

GENIIUS pourrait accepter progressivement :

**email + mot de passe**,  
**passkey**,  
et éventuellement **connexion avec Google / Apple / Microsoft**.

Une **passkey** permet par exemple de se connecter avec Face ID, Touch ID, Windows Hello ou le mécanisme de déverrouillage de l'appareil.

L'utilisateur n'a alors pas forcément besoin de taper son mot de passe.

Sur ton téléphone :

> Ouvrir GENIIUS  
> Face ID  
> → connecté.

Sur ton ordinateur :

> Touch ID / Windows Hello  
> → connecté.

C'est à la fois plus confortable et généralement beaucoup plus résistant au phishing qu'un mot de passe classique.

---

# Mais je veux conserver l'indépendance du compte GENIIUS

Imaginons que quelqu'un utilise :

> « Continuer avec Google »

Je ne veux pas que, conceptuellement :

**compte Google = compte GENIIUS.**

Le compte GENIIUS doit exister indépendamment.

Google, Apple, Microsoft ou une passkey constituent simplement des **moyens permettant de prouver que tu es bien le titulaire du compte**.

Cela permet par exemple d'attacher plusieurs moyens d'authentification au même compte.

> Compte GENIIUS Jordan  
> ├── Passkey MacBook  
> ├── Passkey iPhone  
> ├── Google  
> └── mot de passe de secours

Cela correspond d'ailleurs très bien à la distinction que nous avions déjà imposée entre **COMPTE**, **ACTEUR_GENIIUS** et **PERSONNE historique**. On ne mélange pas identité technique et personne étudiée.

---

# TECH-007B — Double authentification

Autre décision.

Avec une authentification classique :

> email + mot de passe

GENIIUS pourrait proposer un second facteur :

> code d'une application d'authentification  
> ou validation sur un appareil déjà reconnu.

Je recommande que la **MFA/2FA soit disponible dès la V1**, mais pas nécessairement obligatoire pour tous les utilisateurs ordinaires.

En revanche, je la rendrais obligatoire pour certains comptes particulièrement puissants :

> administrateurs GENIIUS, comptes d'exploitation sensibles, éventuellement responsables d'espaces très sensibles selon ce que nous déciderons plus tard.

---

# TECH-007C — Biométrie

Attention à une subtilité.

Si GENIIUS affiche :

> « Déverrouiller avec Face ID »

je ne veux évidemment pas que GENIIUS stocke ton visage.

Le système d'exploitation vérifie la biométrie et dit simplement à l'application :

> authentification réussie.

Les données biométriques restent gérées par iOS, Android, Windows ou macOS.

Je poserais cela explicitement dans le CDC.

---

# TECH-007D — Appareil perdu

Supposons maintenant :

> téléphone perdu dans le train.

Or TECH-002 prévoit qu'il peut contenir une grande partie de ta base généalogique hors connexion.

Il faut donc pouvoir aller depuis ton ordinateur dans :

**Compte → Appareils**

et voir par exemple :

> iPhone 18 Pro — dernière activité aujourd'hui 17:42  
> MacBook Pro — actuellement connecté  
> PC Windows — dernière activité il y a 12 jours

Puis :

> **Révoquer cet appareil**

Le téléphone ne pourrait alors plus accéder au Cloud dès qu'il retrouve Internet.

Mais il reste un problème : **les données déjà présentes physiquement sur le téléphone**.

La révocation serveur ne les fait pas magiquement disparaître si le téléphone ne se reconnecte jamais.

C'est pourquoi je veux que les données locales sensibles de GENIIUS soient **chiffrées au repos**, en utilisant autant que possible les mécanismes sécurisés de l'appareil.

Ainsi, voler physiquement le téléphone ne devrait pas permettre de simplement extraire une base SQLite et de lire :

> noms, dates, relations, notes privées, témoignages, etc.

On approfondira le chiffrement dans le bloc Sécurité, mais TECH-007 doit déjà imposer cette conséquence.

---

# TECH-007E — Sessions

Je déconseille également le système :

> « Connecté pour toujours et aucune visibilité. »

GENIIUS doit permettre de voir et révoquer ses sessions/appareils.

Mais je ne veux pas non plus demander le mot de passe tous les matins.

Je recommande donc :

**appareil personnel reconnu → session durable sécurisée ;**

**opération particulièrement sensible → réauthentification.**

Par exemple, consulter Tree ne demande pas constamment Face ID.

Mais :

> supprimer le compte,  
> modifier certaines options de sécurité,  
> exporter massivement certaines données privées,  
> modifier les moyens d'authentification

peut demander :

> **Veuillez confirmer votre identité.**

---

# TECH-007 — Ma recommandation complète

Je propose donc :

> **1.** GENIIUS possède son propre modèle de compte, indépendant des fournisseurs d'identité externes.

> **2.** Plusieurs moyens d'authentification peuvent être associés à un même compte.

> **3.** Les **passkeys** sont supportées et privilégiées.

> **4.** Email + mot de passe reste disponible au moins initialement comme solution universelle/secours.

> **5.** Google, Apple et éventuellement Microsoft peuvent être proposés comme moyens de connexion, sans devenir propriétaires de l'identité GENIIUS.

> **6.** MFA disponible ; obligatoire pour les comptes techniques/administratifs sensibles.

> **7.** Biométrie déléguée exclusivement aux mécanismes sécurisés du système d'exploitation : GENIIUS ne stocke aucune donnée biométrique.

> **8.** L'utilisateur peut consulter et révoquer ses appareils/sessions.

> **9.** Les données locales doivent être protégées contre l'accès après vol de l'appareil ; les exigences précises de chiffrement seront définies dans le bloc Sécurité.

> **10.** Une session peut être durable sur un appareil de confiance, avec **réauthentification pour les opérations sensibles**.

---

## Il y a cependant un cas GENIIUS particulier

Imagine une personne âgée à qui tu veux faire utiliser **Echo** pour raconter son histoire familiale.

Elle n'a peut-être aucune envie de :

> créer un mot de passe de 14 caractères → confirmer son email → installer une application d'authentification → comprendre une passkey.

On aura probablement besoin d'un mécanisme beaucoup plus simple du type :

> **Sarah vous invite à contribuer à l'histoire familiale.**  
> [Participer]

avec un accès limité, temporaire ou encadré.

Mais je ne voudrais **pas appeler cela un compte GENIIUS simplifié**. Cela relève plutôt des **accès invités / contributions externes**, qu'on traitera séparément lorsque nous définirons les droits et collaborations.

**Ma recommandation est donc TECH-007 telle quelle. Tu es d'accord, ou tu souhaites modifier quelque chose concernant mot de passe, passkeys, Google/Apple/Microsoft ou MFA ?**



Parfait. **TECH-007 est VALIDÉ ✅**.

Nous avons maintenant cadré plateformes, offline, synchronisation, stockage et authentification. Avant de parler de droits/RLS, il y a une décision structurante : **comment le système technique GENIIUS doit être découpé**.


## TECH-008 — Architecture modulaire

### 1. Contrat normatif consolidé

**Exigence.** Architecture en modules aux contrats explicites, isolant les responsabilités sans accès direct contournant les autorisations ou les invariants scientifiques.
**Vérification.** REC-TECH08.
**Traçabilité candidate.** Décisions d’architecture.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-008 — Un seul gros système ou plusieurs services ?

Tu vas entendre trois termes assez souvent : **monolithe**, **monolithe modulaire** et **microservices**.

Ils ne décrivent pas les fonctionnalités de GENIIUS, mais la manière dont son backend est organisé.

Prenons une version extrêmement simplifiée de GENIIUS :

> Tree  
> Journal  
> Echo  
> Rebond  
> Connect  
> Atlas  
> Import  
> Recherche  
> Documents  
> Comptes  
> Notifications

## Option A — Le monolithe classique

On développe un gros backend :

**GENIIUS Backend**

Tout se trouve dedans.

Tree appelle directement du code de Journal ; Import peut utiliser n'importe quelle partie ; Connect accède directement aux composants internes d'Atlas, etc.

Au début, c'est très pratique.

Mais quelques années plus tard, tu peux arriver à :

> « Si je touche à cette fonction d'Import, pourquoi Echo ne fonctionne plus ? »

Parce que les frontières se sont progressivement mélangées.

Pour GENIIUS, je ne recommande pas cette absence de découpage.

---

## Option B — Les microservices

À l'autre extrême :

**Service Identity**  
**Service Tree**  
**Service Journal**  
**Service Documents**  
**Service Assertions**  
**Service Search**  
**Service Import**  
**Service Atlas**  
etc.

Chaque service peut avoir sa propre API, être déployé séparément, éventuellement disposer de ses propres données.

C'est séduisant sur un diagramme.

Mais ça ajoute énormément de complexité.

Une opération qui était :

> créer objet → assertion → source → activité

peut devenir :

> service A appelle B → B appelle C → message dans une queue → D répond → B tombe en panne → retry → A doit savoir si C a vraiment enregistré…

Et nous avons justement un modèle scientifique dans lequel **la cohérence transactionnelle est extrêmement importante**.

Je ne partirais surtout pas en microservices dès la V1 simplement parce que GENIIUS est ambitieux.

---

# Option C — Le monolithe modulaire

C'est **ma recommandation**.

Nous avons initialement **un backend GENIIUS principal**, mais son code est découpé en modules aux frontières strictes.

Conceptuellement :

```text
GENIIUS CORE
│
├── Identity & Access
├── Knowledge
├── Sources & Documents
├── Assertions
├── Historical Entities
├── Tree
├── Journal
├── Echo
├── Rebond
├── Connect
├── Atlas
├── Import / Export
├── Search
└── Publication
```

Attention : **ce découpage est illustratif**. On définira les bons domaines à partir du MLD et du CDC, pas à partir de cette liste improvisée.

La règle importante serait :

> Un module ne va pas bricoler directement dans les entrailles d'un autre module.

Il utilise un **contrat défini**.

---

# Pourquoi je préfère ça pour GENIIUS

Parce que nous obtenons deux avantages contradictoires.

### Simplicité au début

On peut déployer :

> `GENIIUS Backend`

plutôt que maintenir quinze systèmes distribués.

Et une transaction importante peut rester une véritable transaction de base de données.

### Possibilité d'évoluer

Imaginons qu'en 2030, **Echo explose**.

500 000 personnes utilisent simultanément la transcription audio et l'IA.

Nous pourrions alors décider :

> Echo Processing devient un service indépendant.

Si les frontières ont été correctement conçues dès le départ, on peut extraire ce morceau sans réécrire tout GENIIUS.

C'est ce qu'on appelle parfois un **monolithe modulaire extractible**.

---

# TECH-008B — Mais tout ne doit pas forcément rester dans ce monolithe

C'est important.

Certains traitements ont naturellement une vie différente.

Par exemple :

> génération de miniatures ;  
> OCR ;  
> transcription audio ;  
> gros imports ;  
> génération d'exports ;  
> indexation ;  
> certaines analyses ;  
> traitements IA.

Tu importes 5 000 images.

L'API ne doit pas rester bloquée pendant 40 minutes en disant :

> « veuillez patienter ».

Elle doit pouvoir répondre :

> Import accepté — traitement en cours.

Puis des **workers** effectuent le travail en arrière-plan.

Donc notre architecture pourrait plus tard ressembler conceptuellement à :

```text
Web / Desktop / Mobile
          │
          ▼
     GENIIUS API
          │
     GENIIUS Core
       │      │
       │      └──── tâches asynchrones
       │                    │
       ▼                    ▼
   données              Workers
```

Ce ne sont pas nécessairement des « microservices métier ».

Ce sont des composants techniques spécialisés dans l'exécution de travaux.

---

# Un exemple important avec Tree

Je ne veux pas :

> « Tree possède sa propre PERSONNE »

et :

> « Journal possède une autre PERSONNE ».

Nous avons justement construit tout le modèle pour éviter cela.

Les applications GENIIUS sont **des manières différentes de travailler avec un même univers de connaissance**.

Donc :

> Tree, Journal, Echo, Atlas...

ne signifient pas automatiquement :

> une base de données Tree, une base Journal, une base Echo...

C'est fondamental.

---

# TECH-008C — Une seule base PostgreSQL ?

Pour la V1, **je recommande également oui au niveau logique principal**.

Cela ne signifie pas :

> « une énorme soupe de 247 tables sans organisation ».

On pourra utiliser des schémas, conventions, permissions et frontières logiques.

Mais je ne recommande pas de découper immédiatement les données scientifiques entre dix bases différentes.

Notre MLD possède beaucoup de relations transversales. Une séparation prématurée rendrait les transactions, les contraintes d'intégrité et les requêtes scientifiques beaucoup plus difficiles.

Plus tard, certains systèmes techniques pourront évidemment avoir leur propre stockage : moteur de recherche, cache, files, observabilité, etc.

Mais **la connaissance canonique GENIIUS doit rester cohérente**.

---

# TECH-008 — Ma recommandation

Je propose de fixer :

> **1. GENIIUS adopte initialement une architecture de monolithe modulaire.**

> **2. Les domaines/modules possèdent des responsabilités et frontières explicites.**

> **3. Les modules ne doivent pas créer de dépendances anarchiques entre eux.**

> **4. Le Core scientifique reste commun aux différentes applications GENIIUS.**

> **5. Tree, Journal, Echo, Rebond, Connect et Atlas ne possèdent pas chacun une copie indépendante des entités historiques communes.**

> **6. La base relationnelle canonique est initialement unifiée, tout en étant organisée logiquement.**

> **7. Les traitements longs ou coûteux peuvent être exécutés par des workers asynchrones distincts.**

> **8. L'architecture doit permettre d'extraire ultérieurement un module en service indépendant si la charge ou l'organisation le justifie.**

> **9. Aucun microservice ne doit être créé simplement “pour faire microservices” : une séparation doit avoir une justification mesurable (charge, sécurité, isolation, cycle de déploiement, équipe, disponibilité…).**

### Et surtout

Cela **ne choisit toujours pas nos technologies**.

Nous ne décidons pas encore Python vs TypeScript, FastAPI vs autre, RabbitMQ vs autre, etc.

On dit à notre future architecture :

> « Voici les propriétés que tu dois respecter. Maintenant démontre-nous quelle solution technique les satisfait le mieux. »

**Ma recommandation est donc TECH-008 : monolithe modulaire + workers asynchrones + architecture préparée à l'extraction future.**

Tu es d'accord ?

Je suis d'accord
Et j'ai une question. Est-ce si difficile qu'imaginer tout de suite de gros volumes de données ? Parce qu'en fait, je communique déjà avec des utilisateurs cibles qui ont déjà des grosses bases de données. Et donc du coup, il est possible qu'ils veuillent importer tout leur travail, toutes leurs dizaines d'années de travail, assez vite pour pouvoir migrer rapidement sur Genius. Est-ce que ce serait techniquement possible ? Et j'aurais bien aimé aussi savoir quel coût.


**TECH-008 est donc VALIDÉ ✅.**

Et oui : **il faut absolument concevoir GENIIUS pour de gros volumes dès maintenant.** Ça ne veut pas dire acheter dès le lancement une infrastructure énorme. Ça veut dire éviter aujourd'hui les décisions qui nous obligeraient à tout reconstruire dès qu'un généalogiste arrive avec 30 ans de travail.

## Oui, on peut permettre une grosse migration

Prenons un utilisateur très avancé qui arrive avec :

- 150 000 personnes ;
- plusieurs centaines de milliers d'événements/relations/assertions ;
- 50 000 sources ;
- 200 000 images et PDF ;
- 500 Go de fichiers ;
- plusieurs dizaines d'années de recherches.

**Je veux que GENIIUS puisse accepter cet utilisateur.**

Ce n'est pas PostgreSQL qui m'inquiète particulièrement. Des centaines de milliers ou quelques millions de lignes ne constituent pas en soi un volume extraordinaire pour PostgreSQL correctement conçu. GENIIUS produira cependant beaucoup plus de lignes que le nombre de personnes : versions, assertions, liens, activités, mentions, dépendances, etc. Une généalogie de 150 000 personnes pourrait donc devenir plusieurs millions, voire dizaines de millions de lignes GENIIUS.

Ça reste techniquement tout à fait envisageable.

Le gros sujet sera plutôt **l'import massif et les médias**.

Imagine :

> `mon_travail_30_ans.ged` + dossier `Genealogie/` de 480 Go.

Je ne veux surtout pas faire :

**HTTP → attendre → timeout au bout de 30 minutes → import raté.**

On construirait plutôt une **pipeline d'import** :

`dépôt → inventaire → validation → staging → rapprochement → transformation → contrôles → intégration → indexation → rapport`

Et tout cela est **reprenable**.

L'utilisateur pourrait voir :

> **Migration de votre bibliothèque**
>
> GEDCOM : ✅ analysé  
> 183 482 personnes : ✅  
> 417 823 relations : ✅  
> 84 192 sources : ✅  
> Médias : 37 428 / 192 041  
> Indexation : 63 %  
> ⚠️ 742 éléments nécessitent votre attention

Il peut fermer son ordinateur. Le traitement continue.

C'est précisément une bonne justification de nos **workers asynchrones de TECH-008**.

### Et 500 Go n'ont pas besoin de transiter en une fois

Avec GENIIUS Desktop, on peut aller encore plus loin.

L'application peut inventorier le dossier local, calculer les empreintes et commencer l'upload progressivement.

Connexion coupée ?

Elle reprend.

Fichier déjà envoyé ?

Elle ne le renvoie pas inutilement.

C'est exactement pour cela que TECH-004/005/006 commencent à former un ensemble cohérent.

---

# Et combien cela coûterait ?

Il faut distinguer **le coût de stockage** du **coût complet d'un utilisateur**.

Les fichiers eux-mêmes ne sont pas nécessairement hors de prix.

À titre d'ordre de grandeur actuel, [Cloudflare R2](https://developers.cloudflare.com/r2/pricing/?ref=arabroot.io&utm_source=chatgpt.com) facture son stockage standard **0,015 $/Go/mois**, sans facturation de trafic sortant Internet. Donc, uniquement pour le stockage brut :

| Médias stockés | Ordre de grandeur R2 |
|---:|---:|
| 10 Go | ~0,15 $/mois |
| 100 Go | ~1,50 $/mois |
| 500 Go | ~7,50 $/mois |
| 1 To | ~15 $/mois |
| 10 To | ~150 $/mois |

Il existe d'autres modèles. [Hetzner Object Storage](https://www.hetzner.com/storage/object-storage/overview/?utm_source=chatgpt.com) annonce par exemple une offre incluant **1 To de stockage et 1 To de trafic sortant** dans son prix de base. Donc nous aurons réellement intérêt à comparer les fournisseurs au moment de l'architecture. [Hetzner](https://www.hetzner.com/storage/object-storage/overview/?utm_source=chatgpt.com)

Avec [Supabase](https://supabase.com/docs/guides/storage/pricing?utm_source=chatgpt.com), le stockage objet au-delà du quota Pro est actuellement annoncé autour de **0,0213 $/Go/mois** ; 100 Go sont inclus dans le quota indiqué pour Pro. [Supabase](https://supabase.com/docs/guides/storage/pricing?utm_source=chatgpt.com)

Mais ce calcul **n'est absolument pas le coût réel GENIIUS**.

Il faut ajouter :

**PostgreSQL + sauvegardes + copies de sécurité des fichiers + trafic réseau + miniatures + OCR + indexation + recherche + CPU des imports + logs + éventuelle IA + etc.**

Et il y a une énorme différence entre :

> utilisateur stockant 500 Go mais consultant occasionnellement ses archives

et :

> utilisateur stockant 500 Go et demandant chaque mois OCR, IA et analyse sur 300 000 documents.

Le second peut coûter beaucoup plus cher alors que leur stockage est identique.

---

# Cela me fait modifier notre CDC

Je pense que ta remarque justifie une exigence supplémentaire.


## TECH-009 — Capacité et montée en charge

### 1. Contrat normatif consolidé

**Exigence.** Les services doivent pouvoir évoluer en charge avec dégradation observable et sans perte de confidentialité ou de données; profils de charge et seuils de capacité documentés.
**Vérification.** REC-NF03.
**Traçabilité candidate.** L16.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

## TECH-009 — Volumétrie et migrations patrimoniales

Avant de continuer sur les droits, **je veux traiter ce bloc maintenant**.

Ma recommandation serait de poser un principe :

> **GENIIUS doit être conçu dès sa première architecture pour accueillir des patrimoines généalogiques constitués sur plusieurs décennies, sans imposer à leurs propriétaires une reconstruction manuelle de leur travail.**

Cela implique notamment que nous ne dimensionnions pas GENIIUS autour du cas :

> « utilisateur moyen = arbre de 800 personnes et 200 photos ».

On devra définir plusieurs **profils de volumétrie de référence** et les utiliser dans les tests techniques.

Par exemple, je pourrais proposer quelque chose comme :

**Profil courant**  
10 000 personnes / 20 Go.

**Profil avancé**  
100 000 personnes / 250 Go.

**Profil expert**  
500 000 personnes / 2 To.

**Profil exceptionnel / institutionnel**  
plusieurs millions d'entités / plusieurs To.

Attention : **je ne valide pas encore ces chiffres**. Il faut justement les travailler avec toi et avec ce que tu sais de tes utilisateurs cibles.

Et surtout, je poserais :

> **Un gros compte ne doit pas nécessiter une architecture GENIIUS différente.**

On peut évidemment lui attribuer davantage de stockage ou de ressources, mais je ne veux pas découvrir qu'au-delà de 100 000 personnes il faut changer complètement de produit.

### Et côté business

Ça nous apprend déjà quelque chose d'important : **un forfait illimité en stockage à prix fixe serait potentiellement dangereux.**

Si un utilisateur met 20 Go et un autre 4 To, leur coût n'est pas identique.

On pourra donc plus tard envisager quelque chose du genre :

**abonnement GENIIUS + enveloppe de stockage**, avec plusieurs niveaux ou du stockage additionnel.

Mais ça appartient au modèle économique, pas au CDC technique.

---

Pour **TECH-009**, avant de te faire ma recommandation définitive, j'ai donc une question où ton contact avec les utilisateurs cibles est précieux :

**Quand tu dis qu'ils ont de “grosses bases”, tu as une idée des ordres de grandeur réels ?** Par exemple nombre de personnes dans leurs arbres, taille du GEDCOM, nombre de photos/documents ou quantité totale en Go/To. Même si tu n'as que 2 ou 3 exemples approximatifs, ça nous permettra de définir des profils de charge GENIIUS réalistes plutôt que de les inventer.


Exact, mais voilà, tu me parles d'un utilisateur. Moi, j'ai en tête une association de moi 40 grands généalogistes qui sont déjà retraités et qui ont commencé la généalogie dans leur jeunesse, quoi. Donc c'est des personnes qui ont énormément de données aujourd'hui, qui sont très diffuses, qui sont stockées n'importe comment. Voilà, c'est plutôt ça. Mais sinon, sur ce que tu m'as dit, je suis d'accord pour le 009.


Oui, là je comprends mieux l'échelle. Ce n'est pas seulement « prévoir quelques power users » : **GENIIUS doit potentiellement absorber en peu de temps le patrimoine numérique de groupes entiers de généalogistes expérimentés**, chacun avec plusieurs décennies de travail et, surtout, des données hétérogènes et dispersées.

Donc **TECH-009 est VALIDÉ ✅**, et j'y inscris explicitement cette notion de **migration patrimoniale massive**. Le problème n'est pas seulement le volume : c'est aussi la dispersion — GEDCOM, logiciels anciens, Excel, Word, PDF, scans, photos, dossiers imbriqués, disques externes, conventions de nommage personnelles, doublons, etc. GENIIUS devra pouvoir ingérer progressivement tout cela sans exiger que l'utilisateur nettoie 30 ans de travail avant de commencer.

Et ça me conduit naturellement à la question suivante.


## TECH-010 — Migrations

### 1. Contrat normatif consolidé

**Exigence.** Les migrations de schéma et de données doivent conserver identifiants, provenance, versions, droits et références persistantes; rollback ou reprise contrôlée.
**Vérification.** REC-X20.
**Traçabilité candidate.** Historisation.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-010 — Comment doit fonctionner une migration massive ?

Prenons ton exemple : une association de **40 généalogistes** décide d'essayer GENIIUS.

Certains arrivent avec :

> Geneatique/Heredis/Gramps → GEDCOM  
> 80 000 personnes  
> 30 000 photos  
> 400 PDF  
> 25 dossiers Excel  
> des fichiers Word  
> 3 disques durs organisés « à leur façon ».

On pourrait adopter trois philosophies.

### Option A — « Mettez tout au bon format avant »

GENIIUS dit :

> Exportez un GEDCOM propre, organisez vos documents, puis importez-les.

Simple pour nous.

Très mauvais pour l'adoption. La personne qui a travaillé depuis 1987 n'a aucune envie de réorganiser trois décennies de recherches pour changer de logiciel.

Je rejette cette option.

### Option B — GENIIUS importe les formats officiellement supportés

On garantit par exemple GEDCOM + images + PDF + CSV, avec des assistants d'import.

C'est beaucoup mieux et il faudra de toute façon le faire.

Mais je pense que **GENIIUS peut aller plus loin**.

### Option C — Migration patrimoniale assistée

C'est ma recommandation.

GENIIUS Desktop pourrait proposer :

> **Migrer mes recherches vers GENIIUS**

Puis l'utilisateur sélectionne plusieurs sources :

`Export Heredis.ged`  
`D:\Genealogie\`  
`E:\Archives\`  
`Mes documents\Recherches\`

GENIIUS commence par **inventorier**, sans tout importer aveuglément.

Il pourrait présenter :

> **Analyse terminée**
>
> 78 421 personnes détectées  
> 124 831 relations  
> 16 284 sources GEDCOM  
> 83 419 images  
> 2 841 PDF  
> 317 documents bureautiques  
> 23 tableurs  
> 4 281 doublons binaires potentiels  
> 7 392 fichiers non rattachés  
> 214 Go au total

Et seulement ensuite préparer la migration.

---

## Je veux surtout séparer « importer » et « comprendre »

C'est crucial avec notre doctrine GENIIUS.

Un vieux GEDCOM dit :

> `BIRT 1842`

GENIIUS ne doit pas transformer cela silencieusement en :

> **fait historique certain : naissance en 1842.**

Il faut conserver :

> « Le fichier importé affirmait ceci. »

Puis appliquer notre modèle d'assertions, provenance, validation, rapprochement, etc.

Même chose pour un dossier :

`Photos/Charbonne/Actes/Naissances/`

Le nom du dossier est **un indice**, pas une vérité scientifique.

---

# TECH-010B — Migration non destructive

Je poserais une règle très forte :

> **Une migration GENIIUS ne modifie jamais les fichiers originaux de l'utilisateur.**

GENIIUS lit, inventorie, calcule les empreintes et ingère ce qui est choisi.

Mais il ne va jamais « ranger automatiquement » ton disque en déplaçant ou renommant 40 000 fichiers.

C'est beaucoup trop dangereux.

---

# TECH-010C — Migration interrompue

Pour ton association de 40 personnes, certaines migrations pourraient durer **des heures ou des jours**.

Ça doit être normal.

Une migration possède donc son propre état :

> préparée → en cours → suspendue → reprise → terminée / partiellement terminée / échouée.

Si le PC redémarre à 72 %, GENIIUS doit reprendre.

Si Internet disparaît, idem.

Et surtout :

> **réimporter la même chose ne doit pas tout dupliquer.**

Notre MLD a justement prévu `lignee_import` / `cle_import` pour la réconciliation des réimports.

---

# TECH-010D — Et l'IA ?

Elle pourrait devenir très intéressante ici.

Imagine les 7 392 fichiers non rattachés.

GENIIUS pourrait éventuellement proposer :

> « Ce fichier semble concerner Louis CHARBONNÉ. »  
> « Cette image ressemble à un acte d'état civil. »  
> « Ces 42 fichiers semblent appartenir au même dossier. »

Mais conformément à notre doctrine :

**suggestion ≠ décision.**

L'IA aide à remettre de l'ordre dans 30 ans de fichiers ; elle ne réécrit pas silencieusement le patrimoine documentaire.

---

# Ma recommandation TECH-010

Je proposerais donc que GENIIUS dispose d'un véritable **système de migration patrimoniale**, et pas simplement d'un bouton « Importer GEDCOM ».

Il devra pouvoir inventorier avant import, accepter plusieurs sources simultanément, traiter des migrations longues en arrière-plan, reprendre après interruption, produire un rapport détaillé, conserver la provenance de chaque élément, détecter les doublons techniques, réconcilier les réimports et ne jamais modifier les originaux.

Les formats seront classés en trois catégories :

**support natif garanti** → import maîtrisé et testé ;

**support assisté** → GENIIUS sait extraire certaines informations mais peut demander validation ;

**fichier conservable mais non interprété** → GENIIUS peut l'archiver et le rattacher sans prétendre comprendre son contenu.

Cette dernière catégorie est importante : **ne pas savoir interpréter un fichier ne doit pas obliger à le jeter.**

Et j'ajouterais une exigence assez ambitieuse :

> Une migration peut être **progressive**.

Ton généalogiste n'est pas obligé d'attendre que ses 500 Go soient intégralement traités pour commencer GENIIUS.

Son arbre peut devenir utilisable alors que les médias continuent à être transférés et indexés en arrière-plan.

C'est probablement déterminant pour réussir une migration réelle.

**Je recommande TECH-010 tel quel : véritable migration patrimoniale, progressive, reprenable, traçable et non destructive. Tu es d'accord ?**


Parfait. **TECH-010 est VALIDÉ ✅** : GENIIUS devra gérer de véritables migrations patrimoniales, y compris massives, hétérogènes, progressives, reprenables et non destructives.

On peut maintenant revenir au fonctionnement normal de la plateforme. Jusqu'ici nous avons beaucoup parlé des appareils et des données. Il faut maintenant traiter **qui peut voir et faire quoi**.


## TECH-011 — Autorisations et graphe accessible

### 1. Contrat normatif consolidé

**Exigence.** Toutes opérations révélatrices utilisent le graphe accessible du contexte avant calcul; existence protégée, interdictions et embargos prévalent; administrer ne signifie pas lire les objets privés; création privée assortie de droits explicites pour l’auteur.
**Vérification.** REC-X09 à X14; CP-23 à CP-25.
**Traçabilité candidate.** L08, L10, L11, L13, L14; MLD §22.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-011 — Où doit être appliquée la sécurité des accès ?

Tu pourrais penser que c'est essentiellement une question fonctionnelle : « Jordan peut voir cette personne, Sarah peut modifier ce projet ». Le CDC fonctionnel et notre modèle de données ont déjà beaucoup cadré cela.

La question technique est différente :

> **Qui est chargé d'empêcher réellement un utilisateur d'accéder à une donnée interdite ?**

Et c'est très important.

Imaginons qu'une information existe dans GENIIUS :

> PERSONNE X  
> information sensible  
> visibilité = privée

L'interface sait qu'elle est privée et ne l'affiche pas.

Est-ce suffisant ?

**Non.**

Quelqu'un pourrait contourner l'interface et appeler directement l'API.

---

## Option A — Sécurité principalement dans les interfaces

Mobile décide quoi afficher.

Desktop décide quoi afficher.

Web décide quoi afficher.

Je l'exclus.

La sécurité ne doit jamais dépendre de :

> « normalement le bouton n'est pas affiché ».

---

## Option B — Sécurité dans l'API

L'application demande :

> `Donne-moi PERSONNE X`

Le backend vérifie :

> Jordan a-t-il le droit ?

Puis répond ou refuse.

C'est déjà beaucoup plus sérieux.

Mais GENIIUS possède un modèle de confidentialité particulièrement complexe.

Une personne peut être accessible alors qu'un document ne l'est pas. Une relation peut elle-même être protégée. Et nous avons même décidé qu'il existe des cas où **l'existence d'un objet doit être cachée**.

Donc je veux aller plus loin.

---

# Option C — Défense en profondeur

C'est **ma recommandation**.

La sécurité est appliquée à plusieurs niveaux :

**Interface**
→ évite de proposer des opérations interdites.

**API / Core**
→ vérifie les autorisations métier.

**Couche données**
→ applique également des protections lorsque cela est techniquement pertinent.

On parle de **défense en profondeur**.

Si une couche possède un bug, une autre peut encore empêcher l'accès.

---

# Exemple GENIIUS

Imaginons un espace familial avec :

**Paul**  
**Marie**  
**Enfant X**

mais l'existence même de l'Enfant X est protégée pour certains utilisateurs.

Jordan effectue une recherche :

> « Dupont »

Le système ne doit pas faire :

> 3 résultats trouvés  
> mais vous n'avez accès qu'à 2.

Parce que cela révèle déjà :

> **un troisième résultat existe.**

Il doit simplement répondre :

> **2 résultats.**

Même problème avec :

- recherche ;
- Tree ;
- Atlas ;
- nombre d'enfants ;
- statistiques ;
- exports ;
- suggestions ;
- notifications ;
- API ;
- IA.

C'est précisément pourquoi notre dictionnaire avait posé la règle du **graphe accessible avant recherche/traversée/agrégation/calcul/export/etc.**

Le CDC technique doit rendre cette règle **incontournable architecturalement**.

---

# TECH-011B — Une erreur particulièrement dangereuse

Supposons que l'API renvoie :

```json
{
  "name": "Paul",
  "secret_note": "Enfant adopté...",
  "can_display_secret_note": false
}
```

et que l'interface masque `secret_note`.

C'est **interdit**.

La donnée confidentielle a déjà quitté le serveur.

Un utilisateur pourrait ouvrir les outils développeur et la lire.

GENIIUS doit plutôt renvoyer :

```json
{
  "name": "Paul"
}
```

La donnée inaccessible **ne doit jamais être envoyée au client**.

---

# TECH-011C — Et le hors connexion ?

Notre TECH-002 complique intelligemment le sujet.

Ton téléphone possède potentiellement une grande partie de ta base.

Imaginons ensuite qu'on te retire l'accès à un projet.

Le serveur sait immédiatement :

> Jordan n'a plus accès.

Mais ton téléphone hors ligne possède encore une copie.

On ne peut pas magiquement supprimer une donnée d'un appareil qui n'est pas connecté.

Je veux donc poser deux règles.

Lors de la prochaine synchronisation, GENIIUS doit **révoquer la copie locale devenue inaccessible**.

Et les données locales sont chiffrées/protégées conformément aux règles que nous définirons en sécurité.

Cela signifie néanmoins qu'une autorisation accordée à quelqu'un ayant téléchargé des données hors connexion crée nécessairement une **fenêtre de risque jusqu'à la prochaine connexion**.

C'est une réalité technique qu'il vaut mieux reconnaître plutôt que prétendre qu'elle n'existe pas.

---

# TECH-011D — Autorisations calculées côté serveur

Je veux également éviter que chaque application invente sa propre interprétation des droits.

On ne doit pas avoir :

> Web pense que Jordan peut voir X  
> Mobile pense que non  
> API pense que oui.

Le **moteur d'autorisation canonique est côté serveur**.

Les applications peuvent conserver suffisamment d'informations pour faire fonctionner le hors-ligne, mais elles ne redéfinissent pas les règles métier.

---

# Ma recommandation TECH-011

Je propose :

> **1. Défense en profondeur : client + Core/API + couche données lorsque pertinent.**

> **2. Le serveur constitue l'autorité canonique pour les autorisations.**

> **3. Une donnée inaccessible ne doit jamais être envoyée au client simplement pour y être masquée.**

> **4. Le graphe accessible est calculé avant recherche, navigation, agrégation, statistiques, export, notification, API et traitements IA.**

> **5. Une protection portant sur l'existence empêche également les fuites indirectes : compteurs, suggestions, messages d'erreur, résultats partiels, etc.**

> **6. Les applications hors ligne utilisent la dernière autorisation synchronisée connue ; toute révocation est propagée et les données locales correspondantes deviennent supprimables/inaccessibles à la reconnexion.**

> **7. Les règles d'autorisation ne sont pas réimplémentées indépendamment par Web, Desktop et Mobile.**

> **8. Les contrôles de sécurité devront être testés automatiquement, notamment contre les fuites indirectes.**

Et lorsque nous arriverons à l'architecture, nous déciderons **comment** cela se matérialise : RLS PostgreSQL, moteur d'autorisation dans le Core, combinaison des deux, etc. Je soupçonne déjà qu'une combinaison sera appropriée, mais je ne veux pas la figer avant l'analyse d'architecture.

**Je recommande TECH-011 tel quel. Tu es d'accord ?**


Parfait. **TECH-011 est VALIDÉ ✅.**

On a posé l’autorité des droits. La question suivante concerne maintenant un autre risque majeur : **les pannes et la perte de données**.


## TECH-012 — Sauvegardes et restauration

### 1. Contrat normatif consolidé

**Exigence.** Sauvegardes cohérentes données/binaires et restauration vérifiable; RPO ≤5 min et RTO ≤4 h pour le périmètre de référence; pas de résurrection des données purgées.
**Vérification.** REC-X18, X19; REC-NF05.
**Traçabilité candidate.** L15.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-012 — Jusqu’à quel point GENIIUS doit-il garantir qu’une donnée ne sera jamais perdue ?

Il faut distinguer trois mécanismes qu’on mélange souvent :

**Historisation** → « qu’est-ce qui a changé et quand ? »  
**Synchronisation** → « mes appareils ont-ils le même état ? »  
**Sauvegarde** → « si l’infrastructure casse, puis-je récupérer mes données ? »

GENIIUS a besoin des trois.

Prenons un scénario volontairement violent.

À 14 h :

> 40 généalogistes de ton association travaillent sur GENIIUS.

À 14 h 12 :

> panne majeure du centre de données.

La base principale devient irrécupérable.

Que sommes-nous prêts à perdre ?

Les modifications des dernières 24 heures ? Une heure ? Cinq minutes ? **Rien ?**

C'est ici qu'apparaissent deux notions importantes.

### RPO — combien de données peut-on perdre ?

Le **Recovery Point Objective** répond à :

> « Jusqu'où dans le passé suis-je obligé de revenir après une catastrophe ? »

RPO = 24 h signifie qu'une catastrophe peut faire perdre jusqu'à 24 heures de travail.

Pour GENIIUS, je trouve ça mauvais.

Imagine une journée entière passée aux archives.

RPO = 5 minutes signifie :

> dans un scénario catastrophique, au maximum quelques minutes de données serveur peuvent théoriquement être perdues.

Évidemment, plus on approche de **zéro perte garantie**, plus l'architecture devient complexe et coûteuse.

---

### RTO — combien de temps GENIIUS peut-il rester indisponible ?

Le **Recovery Time Objective** répond à une autre question :

> « Après une catastrophe, combien de temps avons-nous pour remettre GENIIUS en service ? »

RTO = 5 minutes coûte potentiellement très cher.

RTO = 24 h coûte beaucoup moins cher.

Et ici, je serais moins agressif.

GENIIUS n'est pas un système hospitalier où 20 minutes d'indisponibilité mettent des vies en danger.

Je préfère investir davantage dans **ne pas perdre le patrimoine** que dans une disponibilité absolument permanente.

---

# Ma philosophie pour GENIIUS

Je poserais :

> **Intégrité et durabilité > disponibilité immédiate.**

Si GENIIUS doit choisir entre :

**A — revenir vite mais avec un risque de corruption**

et

**B — rester indisponible deux heures supplémentaires pour restaurer proprement**

je veux **B**.

---

# TECH-012B — Plusieurs niveaux de protection

Je recommande de ne jamais dépendre d'une seule copie.

Conceptuellement :

**Base principale**  
↓  
**réplication / journalisation continue**  
↓  
**sauvegardes automatiques**  
↓  
**copie géographiquement séparée**

Et pour les fichiers :

**stockage objet principal**  
↓  
**protection contre suppression accidentelle**  
↓  
**copie/sauvegarde indépendante**

Pourquoi indépendante ?

Parce que :

> « J'ai trois copies dans le même compte Cloud »

n'est pas forcément une vraie stratégie de sauvegarde.

Une erreur de configuration, un compte compromis ou une suppression administrative pourrait toucher les trois.

---

# TECH-012C — Le ransomware / compte administrateur compromis

Supposons qu'un attaquant obtienne des droits puissants et dise :

> supprimer tous les fichiers GENIIUS.

Si nos sauvegardes sont accessibles exactement avec les mêmes droits :

> il supprime aussi les sauvegardes.

Catastrophe.

Je veux donc qu'au moins certaines sauvegardes soient **immutables pendant une durée définie**.

Même un administrateur compromis ne doit pas pouvoir immédiatement supprimer tout l'historique de sauvegarde.

---

# TECH-012D — Sauvegarder ne suffit pas

C'est un piège classique.

Une entreprise peut dire :

> « Nous faisons une sauvegarde chaque nuit. »

Puis le jour de la catastrophe :

> sauvegarde corrompue depuis six mois.

Donc le CDC doit exiger des **tests réguliers de restauration**.

GENIIUS doit démontrer :

> « Nous sommes capables de reconstruire effectivement le système à partir des sauvegardes. »

Pas seulement :

> « Un fichier backup existe quelque part. »

---

# TECH-012E — Base ET fichiers doivent rester cohérents

C'est particulièrement important à cause de TECH-006.

Imagine qu'on restaure PostgreSQL à :

> mardi 14:02

et les fichiers à :

> lundi 23:00.

La base pourrait dire :

> original #78429 existe.

Alors que le fichier correspondant n'existe pas encore dans la restauration.

Il faut donc prévoir une stratégie permettant de **contrôler et restaurer la cohérence entre données structurées et stockage objet**.

Nos empreintes cryptographiques nous aideront beaucoup.

---

# Mes objectifs initiaux

Je te proposerais de ne pas exiger dès le premier jour une infrastructure bancaire extrêmement coûteuse.

Mais de fixer une cible sérieuse.

Pour les **données structurées canonisées**, je proposerais :

> **RPO cible ≤ 5 minutes**

Pour le **rétablissement du service après catastrophe majeure** :

> **RTO cible ≤ 4 heures**

Et pour les fichiers originaux ingérés :

> **aucune perte silencieuse acceptable**.

Si un fichier est perdu ou corrompu, GENIIUS doit au minimum le détecter et le signaler. L'objectif d'exploitation reste évidemment de pouvoir le restaurer.

---

# TECH-012 — Ma recommandation

Je propose donc :

> **1.** GENIIUS possède une stratégie de sauvegarde distincte de la synchronisation et de l'historisation.

> **2.** Les données structurées visent un **RPO ≤ 5 minutes**.

> **3.** Le système vise un **RTO ≤ 4 heures** en cas de catastrophe majeure, avec possibilité d'objectifs plus ambitieux ultérieurement.

> **4.** Les sauvegardes comprennent base relationnelle **et** stockage documentaire.

> **5.** Au moins une copie de sauvegarde critique doit être isolée du système de production.

> **6.** Une partie de la chaîne de sauvegarde doit bénéficier d'une protection contre la suppression/modification malveillante ou accidentelle.

> **7.** Les sauvegardes sont chiffrées.

> **8.** Des restaurations complètes sont testées périodiquement.

> **9.** Après restauration, GENIIUS vérifie la cohérence BDD ↔ fichiers grâce notamment aux identifiants et empreintes.

> **10.** La priorité en situation de catastrophe est **intégrité/durabilité avant vitesse de remise en ligne**.

Il restera plus tard à déterminer la fréquence exacte des snapshots, la durée de rétention, le nombre de copies, les régions, le fournisseur, etc. Ce seront des décisions d'architecture/exploitation à partir de ces exigences.

**Je recommande TECH-012 comme cela. Tu es d'accord ?**


Parfait. **TECH-012 est VALIDÉ ✅**. On retient donc une vraie stratégie de résilience : RPO cible ≤ 5 min, RTO cible ≤ 4 h, sauvegardes indépendantes et protégées, tests de restauration et priorité à l’intégrité du patrimoine.

On poursuit avec un sujet très lié, mais différent.


## TECH-013 — Résilience et idempotence

### 1. Contrat normatif consolidé

**Exigence.** Toute opération rejouée ou interrompue doit éviter doublons, écrasements et effets scientifiques silencieux; échecs visibles et reprises sûres.
**Vérification.** REC-TECH13; REC-NF09.
**Traçabilité candidate.** Résilience.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-013 — Que doit-il se passer quand une partie de GENIIUS tombe en panne ?

Une application complexe n'est presque jamais simplement :

> 🟢 tout fonctionne  
> 🔴 tout est cassé.

Imaginons que GENIIUS fonctionne parfaitement, sauf le service chargé de l'OCR.

Est-ce que Tree doit devenir inaccessible ?

**Évidemment non.**

Ou que le fournisseur d'IA soit indisponible.

Est-ce que tu dois perdre l'accès à tes recherches ?

**Non.**

C'est ce qu'on appelle notamment la **dégradation gracieuse** : une panne d'une fonction non essentielle ne doit pas faire tomber inutilement tout le produit.

## Exemple : import de 20 000 documents

Tu importes une grosse bibliothèque.

GENIIUS effectue plusieurs opérations :

`réception du fichier → contrôle → stockage → miniature → OCR → indexation → éventuelle IA`

Supposons que l'OCR tombe au milieu.

Je ne veux surtout pas :

> ❌ Import échoué.

Si l'original a été correctement reçu et enregistré, GENIIUS devrait plutôt pouvoir dire :

> ✅ Original sécurisé  
> ✅ Métadonnées enregistrées  
> ✅ Miniature créée  
> ⏳ OCR en attente  
> ⏳ Indexation plein texte en attente

Puis reprendre automatiquement l'OCR plus tard.

C'est une distinction extrêmement importante :

**échec d'un traitement dérivé ≠ perte de la donnée source.**

---

# TECH-013B — Les opérations doivent être idempotentes

Mot technique important pour GENIIUS : **idempotence**.

Imagine :

> GENIIUS reçoit « créer cette assertion ».

Le serveur la crée.

Mais juste avant de répondre au téléphone, la connexion coupe.

Le téléphone ne sait pas si l'opération a réussi.

Il réessaie.

Sans protection :

> Assertion #1  
> Assertion #2

Deux fois la même création uniquement à cause d'un problème réseau.

Avec une opération idempotente, le téléphone peut dire en substance :

> « Je réessaie l'opération `ABC123`. »

Le serveur reconnaît :

> « Je l'ai déjà exécutée. »

et renvoie le résultat existant.

**Je veux cette propriété pour toutes les opérations où une répétition accidentelle pourrait produire un doublon ou un effet indésirable.**

C'est essentiel avec le mobile, le hors connexion et les migrations massives.

---

# TECH-013C — Retry automatique, mais pas éternellement

Quand quelque chose échoue temporairement :

> réseau indisponible ;  
> stockage momentanément inaccessible ;  
> OCR saturé ;

GENIIUS peut automatiquement réessayer.

Mais imaginons qu'un fichier soit réellement invalide.

Réessayer :

> 1 000 000 de fois

ne sert à rien.

Il faut donc distinguer :

**erreur temporaire** → retry automatique ;

**erreur permanente** → arrêt + diagnostic ;

**erreur inconnue répétée** → mise à l'écart pour investigation.

Pour les traitements asynchrones, on peut conceptuellement avoir une sorte de :

> **file des traitements en échec**

afin qu'un problème ne bloque pas les 50 000 tâches suivantes.

---

# TECH-013D — Un fournisseur externe ne doit pas contrôler GENIIUS

Supposons qu'un jour nous utilisions un fournisseur externe pour la transcription audio.

Il tombe pendant six heures.

Echo doit toujours pouvoir :

> enregistrer le témoignage ;  
> conserver l'audio ;  
> créer la séance ;  
> conserver les métadonnées.

Simplement :

> **Transcription automatique en attente.**

Même chose pour l'IA.

C'est particulièrement important pour GENIIUS :

> **aucun fournisseur IA ne doit être une dépendance nécessaire à l'accès à la connaissance.**

Si demain le fournisseur disparaît complètement, GENIIUS perd une capacité automatisée, **pas les données scientifiques**.

---

# TECH-013E — Qu'est-ce qui est critique ?

Je proposerais trois niveaux.

**Niveau 1 — Critique**

Par exemple :

> intégrité des données ;  
> authentification ;  
> autorisations ;  
> accès au Core ;  
> stockage des originaux.

Une panne peut nécessiter de bloquer certaines écritures plutôt que prendre le risque de corrompre la connaissance.

**Niveau 2 — Important**

Recherche, synchronisation, certaines fonctions applicatives.

GENIIUS peut éventuellement continuer partiellement.

**Niveau 3 — Différable**

OCR, génération de miniatures secondaires, certaines analyses, IA, notifications non urgentes...

Ces traitements peuvent attendre.

On déterminera précisément les composants plus tard ; ici je veux surtout imposer le principe.

---

# Un cas où je préfère que GENIIUS dise NON

Imaginons :

> base disponible  
> mais système d'autorisation indisponible.

Deux philosophies :

**fail open :**

> « Je ne peux pas vérifier les droits, donc j'autorise. »

**fail closed :**

> « Je ne peux pas vérifier les droits, donc je refuse temporairement. »

Pour GENIIUS, sur une opération protégée :

> **fail closed obligatoire.**

Je préfère :

> « Cette donnée est momentanément indisponible »

à :

> afficher accidentellement des informations familiales privées.

---

# TECH-013 — Ma recommandation

Je propose donc :

> **1. GENIIUS doit supporter la dégradation gracieuse : la panne d'un composant non critique ne doit pas provoquer inutilement une panne générale.**

> **2. La sécurisation d'une donnée source doit être distinguée de ses traitements dérivés.**

> **3. Les traitements dérivés échoués doivent pouvoir être repris sans réimporter la source.**

> **4. Les opérations sensibles aux répétitions doivent être idempotentes.**

> **5. Les erreurs temporaires font l'objet de retries contrôlés ; les erreurs persistantes sont isolées et diagnostiquables.**

> **6. Une tâche défectueuse ne doit pas bloquer toute une file de traitement.**

> **7. Les dépendances externes, notamment IA/OCR, ne doivent pas conditionner l'accès à la connaissance fondamentale.**

> **8. Les composants seront classés selon leur criticité afin d'adapter la stratégie de panne.**

> **9. Lorsque GENIIUS ne peut pas vérifier une autorisation, il adopte le principe `fail closed` : accès refusé plutôt qu'accès potentiellement indu.**

> **10. En cas de doute sur l'intégrité d'une écriture, GENIIUS doit pouvoir suspendre l'écriture plutôt que risquer une corruption silencieuse.**

Je recommande **TECH-013 tel quel**.

Tu es d'accord ?


Parfait. **TECH-013 est VALIDÉ ✅.**

On a traité la résistance aux pannes. Maintenant, je veux attaquer un sujet qui va être particulièrement important avec les volumes dont tu parlais : **la performance**. Et surtout, il faut éviter une mauvaise définition du type « GENIIUS doit être rapide ». Ça ne veut techniquement rien dire.


## TECH-014 — Performances

### 1. Contrat normatif consolidé

**Exigence.** Objectifs de lecture p95 ≤1 s et recherche p95 ≤2 s dans des conditions de référence documentées, sans contourner les contrôles d’accès.
**Vérification.** REC-NF01, NF02, NF03.
**Traçabilité candidate.** L16.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-014 — Quel niveau de performance doit-on garantir ?

Prenons Tree.

Tu ouvres une personne et GENIIUS met :

> 0,4 seconde → agréable  
> 2 secondes → acceptable ponctuellement  
> 8 secondes → pénible  
> 30 secondes → inutilisable

Mais on ne peut pas exiger la même vitesse pour :

> afficher une fiche

et :

> analyser 400 000 personnes et recalculer tout un corpus.

Il faut donc créer plusieurs catégories.

## 1. Les interactions immédiates

Ce sont les opérations où tu es devant l'écran et attends GENIIUS :

- ouvrir une fiche ;
- afficher un arbre ;
- passer d'une personne à une autre ;
- ouvrir Journal ;
- ajouter une note ;
- enregistrer une modification ;
- lancer une recherche simple.

Pour celles-ci, je veux que GENIIUS donne une impression de **réactivité immédiate**.

Ma cible serait :

> **retour perceptible < 1 seconde dans le fonctionnement normal.**

Attention : cela ne signifie pas nécessairement que toute l'opération est terminée en moins d'une seconde.

Tu cliques sur **Enregistrer**.

En 150 ms :

> ✓ Modification prise en compte

Puis certaines opérations secondaires continuent derrière :

> indexation ;  
> propagation ;  
> notifications ;  
> calculs dérivés.

C'est une architecture très différente d'une application qui attend que tout soit terminé avant de te rendre la main.

---

# 2. Recherche

C'est particulièrement important pour GENIIUS.

Tu tapes :

> `CHARBONNÉ Louis`

Je voudrais que les premiers résultats apparaissent typiquement en **moins de 2 secondes**, même sur une grosse base.

Mais attention à TECH-011 :

**on ne gagne jamais de performance en calculant d'abord sur des données interdites puis en les cachant.**

La sécurité reste prioritaire.

---

# 3. Navigation Tree

Il y a un piège.

Si quelqu'un possède 500 000 personnes, il ne faut surtout pas envoyer les 500 000 au téléphone pour afficher son arbre.

GENIIUS doit charger progressivement :

> personne centrale  
> + environnement nécessaire  
> + branches demandées au fur et à mesure.

C'est ce qu'on appelle notamment du **chargement paresseux / lazy loading**.

L'utilisateur peut posséder un arbre gigantesque sans que l'interface tente de tout dessiner en même temps.

---

# 4. Les traitements longs

Supposons :

> « Analyser les incohérences de mes 380 000 personnes. »

Je ne vais pas écrire dans le CDC :

> résultat en moins de 2 secondes.

Ce serait absurde.

GENIIUS doit plutôt répondre rapidement :

> **Analyse lancée.**

Puis :

> 23 %  
> 48 %  
> 81 %  
> terminée.

Et tu continues à travailler pendant ce temps.

Même logique pour :

- migration ;
- OCR ;
- gros export ;
- recalcul ;
- indexation massive ;
- IA ;
- traitement de médias.

---

# 5. Gros volume ≠ interface lente

Je veux poser une exigence particulièrement importante après TECH-009.

Un utilisateur avec :

> 400 000 personnes + 1 To d'archives

ne doit pas avoir une application **20 fois plus lente partout** qu'un utilisateur avec 2 000 personnes.

Certaines opérations globales seront forcément plus longues.

Mais :

> ouvrir Charles TANCRÈDE

ne devrait pas nécessiter de parcourir ses 400 000 personnes.

Ça implique de bonnes structures d'accès, index, pagination, cache, requêtes bornées, etc.

Le **comment** appartiendra au MPD et à l'architecture.

---

# TECH-014B — Performance hors connexion

Et là nous avons un avantage intéressant.

Si ta base structurée est disponible localement sur ton téléphone conformément à TECH-002, certaines consultations peuvent même être **plus rapides** localement.

Mais je veux éviter :

> application ouverte → synchronisation de 80 000 éléments → interface bloquée pendant 4 minutes.

La synchronisation doit fonctionner en arrière-plan et **ne pas bloquer l'usage normal** sauf lorsqu'une opération nécessite réellement une donnée non encore disponible.

---

# TECH-014C — 40 généalogistes n'est pas encore notre vraie limite

Ton association de 40 personnes est un excellent scénario de migration.

Mais je ne veux pas dimensionner GENIIUS en disant :

> maximum 40 utilisateurs simultanés.

Si le produit fonctionne, on peut rapidement avoir :

> 100 utilisateurs connectés ;  
> 1 000 ;  
> 10 000 ;  
> beaucoup plus.

Je ne recommande cependant pas de payer aujourd'hui une infrastructure dimensionnée pour un million d'utilisateurs.

Je veux distinguer :

**capacité architecturale à monter en charge**

et

**ressources réellement provisionnées aujourd'hui**.

GENIIUS doit pouvoir commencer relativement petit et augmenter les ressources progressivement.

---

# TECH-014D — Pas seulement la moyenne

Autre subtilité.

Supposons 100 ouvertures de fiche :

99 prennent 200 ms.  
1 prend 25 secondes.

La moyenne paraît encore raisonnable.

Mais cet utilisateur pense que GENIIUS bugue.

Nous devrons donc mesurer les performances avec des **percentiles**.

Par exemple `p95` :

> 95 % des requêtes respectent telle cible.

Je ne vais pas t'imposer tous les chiffres aujourd'hui, mais le CDC doit exiger qu'on mesure de cette manière plutôt qu'avec une simple moyenne.

---

# Ma recommandation TECH-014

Je propose :

> **1.** Les interactions ordinaires doivent donner un retour perceptible en **moins d'une seconde** dans les conditions nominales.

> **2.** Les consultations courantes côté serveur viseront généralement des temps de réponse **p95 ≤ 1 seconde**, hors latence réseau et opérations explicitement lourdes.

> **3.** Une recherche interactive standard doit viser l'apparition des premiers résultats en **≤ 2 secondes**.

> **4.** Les interfaces ne chargent jamais un corpus complet lorsque seul un sous-ensemble est nécessaire : pagination, chargement progressif et requêtes bornées sont obligatoires.

> **5.** La taille totale d'un patrimoine ne doit pas dégrader linéairement les opérations locales ordinaires.

> **6.** Les traitements longs sont asynchrones, suivables et non bloquants.

> **7.** Synchronisation, indexation et traitements de fond ne doivent pas rendre l'interface inutilisable.

> **8.** Les performances sont mesurées notamment en percentiles et non uniquement en moyenne.

> **9.** Les exigences doivent être testées sur plusieurs profils de volumétrie, dont les profils avancés/expert définis dans TECH-009.

> **10.** GENIIUS doit pouvoir augmenter progressivement sa capacité sans changement fondamental d'architecture.

Et j'ajoute une règle importante :

> **Une optimisation de performance ne peut jamais contourner les règles de confidentialité, d'intégrité scientifique ou de traçabilité pour gagner quelques millisecondes.**

Je recommande **TECH-014 tel quel**.

**Tu es d'accord ?**


Parfait. **TECH-014 est VALIDÉ ✅.**

Nous avons désormais cadré la performance perçue et la montée en charge. La question suivante est complémentaire : **comment GENIIUS exécute les travaux qui ne doivent justement pas bloquer l’utilisateur ?**


## TECH-015 — Traitements asynchrones

### 1. Contrat normatif consolidé

**Exigence.** Les tâches asynchrones doivent avoir états, reprises et échecs observables; toute modification scientifique amont signale les dépendances et résultats potentiellement affectés.
**Vérification.** REC-X12; REC-NF09; CP-21.
**Traçabilité candidate.** L01, L12; MPD-04.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-015 — Traitements asynchrones, files d’attente et tâches de fond

Nous avons déjà décidé plusieurs fois que certaines opérations doivent continuer « derrière » l'application :

> OCR, transcription Echo, miniatures, indexation, imports massifs, exports, analyses, IA, propagation de certains calculs…

Il faut maintenant transformer ce principe en véritable exigence technique.

Prenons un cas concret.

Tu déposes **5 000 actes numérisés** dans GENIIUS.

Pour chacun, GENIIUS pourrait devoir :

`stocker original → calculer empreinte → extraire métadonnées → miniature → OCR → indexation → analyses éventuelles`

Si l'application essaye de faire tout cela pendant ta requête :

> tu cliques sur Importer → navigateur qui tourne pendant 25 minutes → connexion coupée → on ne sait plus ce qui s'est passé.

Je l'exclus.

---

## Le modèle que je recommande

La requête utilisateur doit essentiellement permettre de **sécuriser et enregistrer le travail demandé**, puis le confier à un système de tâches.

GENIIUS peut rapidement répondre :

> **Import accepté — 5 000 fichiers à traiter.**

Ensuite, les traitements avancent indépendamment.

Tu peux fermer ton ordinateur.

Quand tu reviens :

> 4 716 terminés  
> 263 en cours/attente  
> 21 en erreur

C'est particulièrement important pour les migrations patrimoniales de TECH-010.

---

# TECH-015B — Une tâche doit avoir une véritable identité

Je ne veux pas simplement un processus invisible qui « tourne quelque part ».

Une tâche importante doit pouvoir être identifiée et suivie.

Par exemple :

> `IMPORT-2027-000184`

avec notamment :

> type de traitement ;  
> demandeur ;  
> date ;  
> état ;  
> progression lorsque mesurable ;  
> éléments réussis/échoués ;  
> erreurs ;  
> tentatives ;  
> résultat.

Cela devient très utile pour le support.

Un utilisateur dit :

> « Mon import s'est arrêté hier. »

On doit pouvoir retrouver **ce qui s'est réellement produit**, plutôt que lui répondre « réessayez ».

---

# TECH-015C — Ne pas mentir avec les pourcentages

Petite subtilité.

Pour :

> 800 fichiers à traiter,

on peut raisonnablement afficher :

> 437 / 800 — 55 %.

Mais pour une analyse dont GENIIUS ignore encore l'étendue réelle, afficher :

> 64 %

alors que le système n'en sait rien serait trompeur.

Donc :

**progression déterminable** → pourcentage/compteur ;

**progression indéterminable** → état du type « traitement en cours ».

---

# TECH-015D — Priorités

Imagine simultanément :

> 500 000 fichiers d'une migration associative

et :

> Sarah vient d'enregistrer un témoignage Echo de 10 minutes et attend sa transcription.

Si tout entre dans une seule file FIFO gigantesque :

> la transcription attend trois jours derrière la migration.

Mauvais système.

Je recommande donc que GENIIUS puisse gérer **des catégories et priorités de travaux**.

Une énorme migration ne doit pas monopoliser toutes les ressources au détriment des usages interactifs normaux.

Inversement, un utilisateur ne doit pas pouvoir lancer 200 000 traitements coûteux et saturer la plateforme pour tout le monde.

---

# TECH-015E — Annuler et suspendre

Certaines opérations doivent pouvoir être :

> suspendues ;  
> reprises ;  
> annulées.

Mais attention à « annuler ».

Si tu as importé 50 000 fichiers et que 38 000 originaux sont déjà sécurisés, cliquer sur Annuler ne devrait pas nécessairement signifier :

> **détruire les 38 000 fichiers déjà intégrés.**

Il faut distinguer :

> arrêter le traitement restant

de :

> revenir sur les effets déjà produits.

Le deuxième cas peut nécessiter une véritable opération métier de retrait/annulation, avec traçabilité.

---

# TECH-015F — Une tâche ne doit pas être attachée à ton ordinateur

C'est fondamental.

Tu lances un export depuis Desktop.

Puis tu fermes Desktop.

Le traitement serveur doit pouvoir continuer.

Tu pourrais même ensuite ouvrir GENIIUS sur ton téléphone et voir :

> **Export terminé.**

Les tâches serveur appartiennent donc à **GENIIUS et au compte/espace concerné**, pas à la session graphique qui les a déclenchées.

Naturellement, certaines tâches purement locales resteront locales. Par exemple une opération sur des fichiers qui n'ont jamais été transmis au serveur.

---

# TECH-015G — Attention aux doubles traitements

TECH-013 nous a donné l'idempotence.

Elle s'applique ici aussi.

Si un worker plante après avoir traité :

> document 4 572

mais avant d'avoir signalé :

> « document 4 572 terminé »,

un autre worker peut récupérer la tâche.

Il ne doit pas créer :

> deux OCR, deux documents, deux assertions ou deux notifications

simplement parce qu'une tâche a été exécutée deux fois.

Le système doit être conçu en considérant qu'une tâche peut exceptionnellement être **rejouée**.

---

# TECH-015H — L'IA ne bénéficie d'aucun passe-droit

Si une tâche utilise une IA externe, elle reste soumise à TECH-011.

Le worker ne peut pas dire :

> « J'ai besoin d'analyser tout le projet, donc envoyons tout au modèle. »

Il doit travailler uniquement sur les données auxquelles le traitement est autorisé à accéder et selon les règles IA/confidentialité que nous définirons plus loin.

C'est important parce que les tâches de fond constituent elles aussi une **surface d'accès aux données**.

---

# Ma recommandation TECH-015

Je propose de figer :

> **1.** Les traitements longs ou coûteux doivent être exécutables de manière asynchrone et ne pas bloquer les interactions ordinaires.

> **2.** Les tâches importantes possèdent une identité persistante, un état et une traçabilité.

> **3.** Les états minimaux doivent permettre de distinguer attente, exécution, suspension éventuelle, réussite, réussite partielle, annulation et échec.

> **4.** La progression n'est chiffrée que lorsqu'elle est réellement mesurable.

> **5.** GENIIUS doit permettre plusieurs catégories/priorités de traitements afin qu'une charge massive ne monopolise pas la plateforme.

> **6.** Des mécanismes de quotas/limitation pourront protéger les ressources communes contre une saturation par un utilisateur ou une opération.

> **7.** Les traitements appropriés doivent pouvoir être repris après interruption sans recommencer inutilement depuis zéro.

> **8.** Lorsque pertinent, suspension, reprise et annulation sont possibles ; arrêter une tâche ne signifie pas automatiquement détruire ce qui a déjà été valablement intégré.

> **9.** Les tâches serveur survivent à la fermeture du navigateur ou de l'application ayant déclenché le traitement.

> **10.** Leur exécution doit supporter le rejeu sans produire d'effets incohérents ou de duplications indésirables.

> **11.** Les workers et traitements de fond respectent exactement les mêmes principes d'autorisation, de confidentialité et de traçabilité que les opérations interactives.

> **12.** Le choix concret du système de queue, des workers et de leur infrastructure est réservé à l'architecture technique.

**Je recommande TECH-015 tel quel. Tu es d'accord ?**


Parfait. **TECH-015 est VALIDÉ ✅.**

On a désormais le socle pour les traitements longs. Je veux passer à un sujet différent mais fondamental pour GENIIUS : **la recherche**. Avec des centaines de milliers de personnes, des millions d’assertions et potentiellement des téraoctets de documents, un simple champ `LIKE '%Charles%'` dans la base ne suffira pas.


## TECH-016 — Index et vues dérivées

### 1. Contrat normatif consolidé

**Exigence.** Les index, caches, suggestions et vues sont dérivés, révocables et filtrés par contexte; aucun résultat dérivé ne devient une vérité scientifique ou un canal de fuite.
**Vérification.** REC-TECH16.
**Traçabilité candidate.** MLD §22.3; MPD-02, MPD-03.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-016 — Recherche, indexation et découverte

Il faut d'abord distinguer deux choses.

**La base canonique** contient la connaissance de GENIIUS.

**L'index de recherche** sert à la retrouver rapidement.

L'index ne doit donc jamais devenir une deuxième vérité.

Par exemple, tu corriges :

> `TANCRED` → `TANCRÈDE`

La modification est enregistrée dans le Core. L'index de recherche peut être mis à jour quelques secondes plus tard.

Si l'index tombe en panne, nous pouvons le **reconstruire à partir des données canoniques**.

C'est une règle que je trouve essentielle.

---

## 1. Une recherche GENIIUS ne peut pas être uniquement textuelle

Prenons tes propres recherches généalogiques comme exemple.

Tu pourrais chercher :

> Charles Tancrède

Mais également :

> TANCRÈDE à Deshaies entre 1880 et 1890

ou :

> personnes liées à Deshaies dont le prénom ressemble à Charles

ou encore :

> documents mentionnant TANCRÈDE sans qu'une identification certaine à Charles ait été établie.

Ces requêtes n'interrogent pas la même chose.

GENIIUS doit pouvoir combiner progressivement :

**texte + entités + relations + dates historiques + lieux + types + sources + assertions + états scientifiques + projets.**

---

# 2. Recherche approximative

Dans les documents historiques, l'orthographe est catastrophique pour une recherche strictement exacte.

On peut rencontrer :

> Tancrède  
> Tancrede  
> Tancrède Charles  
> Tancrède Ch.  
> TANCREDE

Sans parler des erreurs OCR.

GENIIUS doit donc permettre une recherche **tolérante** :

> accents ;  
> casse ;  
> variantes raisonnables ;  
> fautes ;  
> éventuellement proximité phonétique selon les contextes.

Mais attention.

Si GENIIUS retourne `TANCRED` pour `TANCRÈDE`, cela signifie :

> **résultat de recherche potentiellement pertinent**

et absolument pas :

> **GENIIUS affirme qu'il s'agit de la même personne.**

On retrouve encore notre doctrine scientifique.

---

# 3. Recherche documentaire

Imagine un PDF de 600 pages.

Le document est une SOURCE.

Son OCR contient :

> « ...le nommé Charles Tancrède... »

La recherche doit pouvoir retrouver ce passage.

Mais GENIIUS doit conserver la distinction :

**fichier original**  
→ **OCR dérivé**  
→ **mention potentielle**  
→ éventuellement **identification**  
→ éventuellement **assertion**.

Un résultat OCR n'est donc jamais automatiquement transformé en fait historique.

---

# 4. Recherche dans les médias

À terme, la même logique doit fonctionner avec Echo.

Une transcription audio contient :

> « Mon grand-père Joseph vivait à Deshaies... »

La recherche peut retrouver cette phrase.

Mais la transcription automatique reste un **dérivé** de l'enregistrement original.

Elle peut être corrigée et sa provenance doit rester connue.

Même philosophie pour des annotations d'images ou d'autres extractions automatiques.

---

# 5. L'index ne doit jamais contourner TECH-011

C'est probablement le point le plus important.

Supposons que l'index possède :

> 1 000 000 objets.

Jordan n'a le droit d'en consulter que :

> 600 000.

Je refuse une architecture faisant :

`recherche sur 1 000 000 → résultats → filtrage des interdits`

Pourquoi ?

Parce que cela peut produire des fuites :

> nombre de résultats ;  
> autocomplétion ;  
> facettes ;  
> temps de réponse ;  
> suggestions ;  
> extraits textuels.

Il faut appliquer notre principe :

> **accessible graph avant exposition des résultats et calculs associés.**

L'architecture exacte sera étudiée plus tard, mais le CDC doit rendre cette propriété obligatoire.

---

# 6. Et hors connexion ?

Très important avec TECH-002.

Tu es dans un cimetière sans réseau et tu recherches :

> `VULCAIN`

Je considère que la recherche sur les **données structurées disponibles localement** doit continuer à fonctionner.

Donc Mobile/Desktop devront disposer d'un mécanisme de recherche locale adapté aux données synchronisées.

Évidemment, certaines recherches très lourdes ou portant sur des contenus non téléchargés pourront nécessiter Internet.

Par exemple :

> rechercher un mot dans 800 Go de PDF dont ton téléphone ne possède pas les originaux/OCR.

Le téléphone ne peut pas inventer ce qu'il n'a pas.

---

# 7. Cohérence différée acceptable

Voici une question subtile.

Tu modifies :

> `Charle` → `Charles`.

Est-il acceptable que pendant **2 secondes**, une recherche retourne encore l'ancienne valeur ?

Pour moi : **oui**.

Je préfère autoriser une courte **cohérence éventuelle de l'index** plutôt que rendre chaque modification dépendante du bon fonctionnement du moteur de recherche.

La donnée canonique, elle, doit être correctement enregistrée immédiatement.

Si l'indexation tombe :

> donnée sauvegardée ✅  
> indexation en attente ⚠️

Puis TECH-015 prend le relais.

---

# 8. Reconstruction complète

Je veux enfin une propriété très forte :

> **on doit pouvoir supprimer intégralement l'index de recherche et le reconstruire sans perdre de connaissance scientifique.**

Ça nous force à ne jamais y mettre une information qui n'existerait nulle part ailleurs.

L'index est un **dérivé technique**.

Pas un patrimoine.

---

# Ma recommandation TECH-016

Je propose de figer :

> **1.** La recherche repose sur des index dérivés ; les index ne constituent jamais la source canonique de connaissance.

> **2.** Tout index doit être reconstructible à partir des données et dérivés canoniquement conservés.

> **3.** GENIIUS doit supporter recherche textuelle, structurée et combinaison multicritère.

> **4.** La recherche peut être tolérante aux accents, variantes, fautes et autres formes de rapprochement pertinentes, sans transformer une similarité en identité scientifique.

> **5.** Les contenus OCR, transcriptions et autres dérivés peuvent être indexés tout en conservant explicitement leur nature et leur provenance.

> **6.** Les résultats doivent permettre de revenir à leur objet et, lorsque pertinent, au passage ou fragment source correspondant.

> **7.** Les autorisations et protections d'existence s'appliquent également aux résultats, compteurs, facettes, suggestions et autocomplétions.

> **8.** Desktop et Mobile proposent une recherche locale sur les données effectivement disponibles hors connexion.

> **9.** Une courte cohérence éventuelle des index est acceptable : l'échec d'indexation ne doit pas faire échouer l'enregistrement canonique.

> **10.** Une indexation échouée doit être détectable, rejouable et supervisable via les mécanismes de TECH-015.

> **11.** La recherche doit respecter les objectifs de performance de TECH-014, y compris sur les patrimoines importants.

> **12.** Le choix entre capacités natives PostgreSQL, moteur spécialisé ou combinaison des deux sera une **décision d'architecture**, pas du CDC.

Je recommande **TECH-016 tel quel**.

**Tu es d'accord ?**

Parfait. **TECH-016 est VALIDÉ ✅.**

On a maintenant cadré la recherche classique. C’est le bon moment pour traiter une brique beaucoup plus sensible pour GENIIUS : **l’IA**. Je veux surtout éviter que « mettre de l’IA » conduise à mélanger aide algorithmique et connaissance scientifique.


## TECH-017 — Assistance IA

### 1. Contrat normatif consolidé

**Exigence.** Les sorties d’IA sont des propositions attribuées, vérifiables et soumises à validation humaine; elles ne créent aucune autorité scientifique automatique.
**Vérification.** REC-TECH17; REC-RB07.
**Traçabilité candidate.** Rebond, Echo.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-017 — IA : rôle, limites et traçabilité

Je partirais d’un principe très simple :

> **L’IA peut assister la recherche. Elle ne devient jamais l’autorité scientifique de GENIIUS.**

Prenons un acte numérisé de 1841.

Une IA pourrait proposer :

> « Je pense lire : Charles TANCRÈDE, domicilié à Deshaies. »

C’est extrêmement utile.

Mais GENIIUS ne doit pas transformer silencieusement cette proposition en :

> `PERSONNE Charles TANCRÈDE — domicile = Deshaies`

On doit conserver la chaîne scientifique :

**TRACE → extraction/proposition IA → validation/interprétation humaine → assertion éventuelle.**

---

## Trois usages différents

Je veux distinguer techniquement trois catégories.

**1. IA d'assistance**

Par exemple :

> résumer un document ; suggérer une transcription ; proposer des mots-clés ; expliquer un texte ancien ; suggérer des rapprochements.

Elle aide l'utilisateur, mais n'agit pas seule sur le patrimoine scientifique.

**2. IA de détection**

Par exemple :

> « Ces deux personnes pourraient être identiques. »  
> « Cette date semble incohérente. »  
> « Ce document pourrait concerner cette famille. »

GENIIUS produit alors une **proposition**, une alerte ou une piste.

Pas une vérité.

**3. IA générative avec action potentielle**

Plus sensible.

Imagine :

> « Analyse ces 600 actes et crée les personnes et relations que tu trouves. »

Je ne veux pas qu'un modèle puisse modifier directement le Core sans contrôle.

Il peut préparer un lot de propositions :

> 143 personnes potentielles ;  
> 291 mentions ;  
> 87 relations possibles ;  
> 34 ambiguïtés.

Puis GENIIUS applique un workflow contrôlé de validation.

---

# TECH-017B — Toujours savoir ce qui vient de l'IA

Supposons qu'en 2034 tu trouves cette information :

> « Joseph serait né vers 1772. »

Tu dois pouvoir déterminer :

> Qui a produit cette information ?  
> Était-ce Jordan ?  
> Une importation ?  
> Une IA ?  
> Quelle source avait-elle analysée ?  
> Quelle version du contenu ?  
> Cette proposition a-t-elle été validée ?

Notre dictionnaire avait déjà posé le principe de **traçabilité de l'usage IA**.

Le CDC technique doit le rendre opérationnel.

---

# TECH-017C — Modèle et version

Il ne suffit pas d'écrire :

> produit par IA.

Deux modèles peuvent produire des résultats différents.

Et un même fournisseur peut modifier son modèle.

Pour les opérations scientifiques significatives, GENIIUS doit donc pouvoir conserver les métadonnées nécessaires à la reproductibilité/audit :

> type de traitement ;  
> date ;  
> modèle/service utilisé ;  
> version lorsque disponible ;  
> paramètres pertinents ;  
> objets d'entrée ;  
> résultat/proposition produit.

Cela ne signifie pas nécessairement conserver éternellement **chaque prompt technique gigantesque**. Nous définirons le niveau de journalisation approprié en fonction des coûts, de la confidentialité et de l'intérêt scientifique.

---

# TECH-017D — Données privées envoyées à un fournisseur

C'est le point qui m'intéresse le plus côté sécurité.

Imaginons Echo avec le témoignage d'une personne vivante.

On ne doit pas pouvoir envoyer automatiquement l'enregistrement complet à n'importe quel fournisseur IA simplement parce que :

> « il faut faire la transcription ».

Les traitements IA externes doivent respecter :

**les droits + la confidentialité + la finalité + les catégories sensibles + les règles RGPD.**

Et notre DD avait déjà posé **OB-15 : restriction de l'IA sur les données sensibles**.

Je recommande donc que GENIIUS sache distinguer au minimum :

> traitement local/interne ;

et

> traitement impliquant la transmission de données à un prestataire externe.

L'utilisateur doit pouvoir savoir lorsqu'un traitement pertinent implique un tiers.

---

# TECH-017E — GENIIUS doit survivre sans IA

C'est une règle d'architecture extrêmement importante.

Supposons que demain :

> le fournisseur augmente ses prix ×10 ;

ou :

> le modèle disparaît ;

ou :

> nous décidons juridiquement que certaines données ne peuvent plus lui être transmises.

GENIIUS doit continuer à fonctionner.

Tree reste Tree.

Les sources restent accessibles.

Les assertions restent accessibles.

Journal fonctionne.

Echo conserve ses témoignages.

L'IA améliore donc GENIIUS mais **ne possède aucune donnée scientifique dont elle serait l'unique dépositaire**.

---

# TECH-017F — IA facultative

Je recommande également quelque chose d'assez fort :

> **les fonctions IA doivent pouvoir être désactivées lorsque leur usage n'est pas indispensable au service demandé.**

Un généalogiste peut très bien dire :

> « Je ne veux aucune analyse générative de mes archives. »

Il doit pouvoir continuer à utiliser GENIIUS.

Certaines fonctions explicitement demandées — par exemple « transcrire automatiquement cet audio » — nécessiteront naturellement un moteur de traitement approprié. Mais l'utilisateur sait alors ce qu'il déclenche.

---

# TECH-017G — Pas seulement les LLM

Enfin, dans le CDC, je ne veux pas réduire « IA » à ChatGPT ou à un LLM.

GENIIUS pourra utiliser différents systèmes :

> OCR ; reconnaissance d'écriture ; transcription ; rapprochement d'entités ; vision ; classification documentaire ; extraction structurée ; modèles linguistiques ; détection d'anomalies…

Certains seront probabilistes, d'autres beaucoup plus déterministes.

Notre doctrine devrait être :

> **déterministe lorsque cela suffit ; probabiliste lorsque cela apporte réellement quelque chose.**

On ne fait pas intervenir un modèle coûteux et imprévisible pour une règle qu'un algorithme classique peut établir correctement.

---

# TECH-017 — Ma recommandation

Je propose de figer :

> **1.** L'IA est une couche d'assistance et non une autorité scientifique.

> **2.** Une sortie probabiliste ne devient jamais silencieusement une assertion historique validée.

> **3.** Les suggestions, extractions et rapprochements IA doivent conserver leur statut jusqu'à validation selon les règles métier appropriées.

> **4.** Toute utilisation IA scientifiquement significative doit être traçable : traitement, date, service/modèle lorsque disponible, entrées pertinentes et résultat.

> **5.** Les actions de masse proposées par IA passent par une étape contrôlée avant intégration au Core.

> **6.** L'IA respecte intégralement TECH-011 : aucun accès supplémentaire n'est accordé parce qu'un traitement est automatisé.

> **7.** Les données sensibles et celles concernant des personnes vivantes font l'objet de règles renforcées avant tout traitement externe.

> **8.** GENIIUS doit distinguer techniquement les traitements internes/locaux des transmissions à un prestataire externe.

> **9.** Les fonctions IA doivent être désactivables lorsqu'elles ne sont pas indispensables à la fonction explicitement demandée.

> **10.** Aucune connaissance scientifique canonique ne doit dépendre exclusivement d'un fournisseur ou modèle IA.

> **11.** Une panne ou suppression de l'IA entraîne une dégradation fonctionnelle, pas une perte d'accès au patrimoine.

> **12.** GENIIUS privilégie les traitements déterministes lorsqu'ils répondent suffisamment au besoin.

> **13.** Les résultats IA importants doivent pouvoir être contestés, ignorés ou corrigés sans altérer la trace/source originale.

> **14.** Le choix des modèles, fournisseurs, modèles locaux ou distants, stratégie multi-fournisseurs, etc., sera effectué lors de l'architecture technique et pourra évoluer sans remettre en cause le Core.

Je recommande **TECH-017 tel quel**.

**Tu es d'accord ?**


Parfait. TECH-017 est VALIDÉ ✅.

Nous avons désormais défini le rôle de l'IA, ses limites scientifiques, sa traçabilité et ses contraintes de confidentialité.

Je te propose maintenant de traiter une question structurante pour GENIIUS : comment les différentes applications communiquent avec le Core, sans devenir dépendantes de son fonctionnement interne ?


## TECH-018 — API et fidélité scientifique

### 1. Contrat normatif consolidé

**Exigence.** APIs versionnées, contrats explicites et filtrage préalable; préserver distinction source/mention/assertion/identification/hypothèse/conclusion, incertitude, provenance et versions.
**Vérification.** REC-I04 à I07; REC-T04 à T07; REC-S04 à S11; REC-RB04 à RB07; REC-J06 à J09; REC-E06 à E09; REC-AT05 à AT09.
**Traçabilité candidate.** L01 à L07, L09, L11 à L13.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-018 — API, contrats d'échange et indépendance des applications

Nous avons déjà décidé que Tree, Journal, Echo, Rebond, Connect et Atlas partagent un Core commun.

Mais cela ne signifie pas que chaque application doit pouvoir accéder directement à toutes les tables de la base de données.

Au contraire, je recommande de poser une frontière claire :

Web · Desktop · Mobile

Tree · Journal · Echo · Rebond · Connect · Atlas

Contrats API sécurisés

GENIIUS Core

Règles métier · Autorisations · Versions · Provenance · Validation

Persistance et services techniques

Base relationnelle · Fichiers · Index · Files de tâches

Cette représentation est logique : nous ne décidons pas encore du nombre de serveurs ou des technologies.

## 1. Pourquoi ne pas laisser chaque application accéder directement à la base ?

Imaginons que Tree crée une assertion de filiation.

Cette opération peut nécessiter de vérifier les droits, les signatures de prédicats, les relations entre objets, les versions, la provenance et les règles de cohérence.

Si Tree écrit directement dans les tables, puis qu'Echo ou Atlas développent leurs propres règles, nous risquons d'avoir plusieurs interprétations concurrentes du modèle scientifique.

Je recommande donc que les opérations métier passent par des contrats contrôlés par le Core.

Cela ne signifie pas que tout doit être une requête réseau : Desktop et Mobile possèdent aussi leurs répliques locales conformément à TECH-002 et TECH-003.

## 2. Une API ne doit pas exposer directement le MLD

Supposons qu'une opération métier soit :

> « Ajouter une assertion selon laquelle Jeanne est la mère de Joseph, en citant cet acte. »

Je préfère une opération métier explicite plutôt qu'une application qui manipule elle-même six tables et leurs contraintes.

Le Core prend en charge les invariants et renvoie un résultat cohérent.

L'API représente les capacités métier de GENIIUS, pas simplement ses tables SQL.

## 3. Les API doivent évoluer sans casser les applications

Imaginons qu'un utilisateur conserve une ancienne version de GENIIUS Mobile pendant trois mois.

Entre-temps, nous faisons évoluer le Core.

Il serait problématique que son téléphone cesse brutalement de fonctionner à chaque modification interne.

Je recommande donc :

- des contrats d'API documentés et versionnés ;
- une compatibilité ascendante maîtrisée ;
- une politique explicite de dépréciation ;
- des messages clairs lorsqu'une mise à jour devient indispensable.

Nous ne devons pas promettre une compatibilité éternelle avec toutes les anciennes versions, mais les ruptures doivent être organisées.

## 4. Éviter les transferts gigantesques

Une API doit permettre de demander exactement ce qui est nécessaire.

Par exemple :

> « Donne-moi cette personne et son environnement familial immédiat. »

Pas :

> « Télécharge tout le patrimoine pour trouver cette personne. »

Pour les gros résultats, je recommande pagination, filtres, limites, téléchargements progressifs et opérations asynchrones lorsque nécessaire.

Les échanges doivent également conserver les nuances de notre modèle : une date historique incertaine ne doit pas devenir artificiellement une date exacte parce que le format API serait trop simpliste.

## 5. Séparer API interactives et synchronisation

C'est un point spécifique à GENIIUS.

Quand Desktop travaille hors connexion, il peut produire plusieurs centaines de modifications locales.

À la reconnexion, il ne doit pas nécessairement rejouer naïvement chaque clic comme s'il était effectué en direct.

Je recommande de distinguer conceptuellement :

API métier interactives — consulter, créer, modifier, rechercher, agir.

Protocole de synchronisation — échanger des changements versionnés, détecter les conflits, reprendre les transferts et réconcilier les états.

Les deux partagent les mêmes règles métier et d'autorisation, mais leurs contraintes techniques diffèrent.

## 6. Et les intégrations externes ?

À terme, des logiciels de généalogie, institutions patrimoniales ou partenaires pourraient vouloir interagir avec GENIIUS.

Je recommande de ne pas confondre :

> API internes nécessaires à nos applications

et

> API publiques accessibles à des tiers.

La seconde devra avoir des droits, quotas, périmètres et engagements spécifiques.

Nous préparons l'architecture à l'interopérabilité, sans rendre obligatoirement publique toute notre API dès la V1.

# Ma recommandation TECH-018

Je propose de figer les exigences suivantes :

1. Le Core est l'autorité métier commune aux applications GENIIUS.
2. Les applications ne contournent pas les règles du Core en écrivant directement dans les données canoniques.
3. Les API exposent des opérations et représentations métier, pas une simple copie des tables du MLD.
4. Les contrats sont documentés, testables et versionnés.
5. Les évolutions suivent une politique de compatibilité et de dépréciation explicite.
6. Les échanges préservent les identifiants, versions, provenances, incertitudes et distinctions scientifiques du modèle.
7. Les opérations volumineuses utilisent pagination, limites, transferts progressifs ou traitements asynchrones selon le besoin.
8. Le protocole de synchronisation est distingué des API interactives, tout en respectant les mêmes invariants métier.
9. Chaque appel est soumis aux autorisations de TECH-011, y compris les API internes et les traitements automatisés.
10. Les opérations susceptibles d'être rejouées disposent des garanties d'idempotence nécessaires.
11. L'architecture anticipe des API destinées à des partenaires externes, sans imposer leur ouverture dès la première version.
12. Le choix de REST, GraphQL, gRPC, événements ou d'une combinaison de mécanismes sera fait pendant l'architecture technique.

Je recommande TECH-018 tel quel. Tu es d'accord ?


Parfait. TECH-018 est VALIDÉ ✅.

Nous avons donc défini les frontières entre les applications, les API et le Core de GENIIUS.

Passons maintenant à un sujet particulièrement important pour une plateforme destinée à conserver des patrimoines familiaux et historiques pendant plusieurs décennies.


## TECH-019 — Chiffrement

### 1. Contrat normatif consolidé

**Exigence.** Données en transit et au repos protégées selon leur sensibilité, secrets gérés séparément, sauvegardes incluses; politique de clés et récupération documentées.
**Vérification.** REC-TECH19.
**Traçabilité candidate.** Sécurité.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-019 — Chiffrement et protection des données

Nous avons déjà validé les autorisations (TECH-011), les sauvegardes (TECH-012) et l'authentification (TECH-007).

Mais il manque une question essentielle :

> Si quelqu'un parvient à récupérer physiquement les fichiers ou les disques de GENIIUS, pourra-t-il lire leur contenu ?

C'est le rôle du chiffrement.

## 1. Trois situations différentes

Données stockées — chiffrement au repos

Les bases de données, fichiers, sauvegardes et copies locales doivent être protégés lorsque leurs supports sont compromis.

Données en circulation — chiffrement en transit

Lorsque Mobile communique avec le serveur, un tiers sur le réseau ne doit pas pouvoir lire les échanges.

Clés de chiffrement — gestion des secrets

Les clés permettant de déchiffrer les données doivent être protégées indépendamment des données elles-mêmes.

Ces trois protections sont complémentaires.

## 2. Un point délicat : le chiffrement de bout en bout

Il existe deux grandes philosophies.

### Option A — Chiffrement classique côté serveur

Les données sont chiffrées pendant leur transport et leur stockage.

Le serveur GENIIUS peut cependant les déchiffrer lorsqu'il doit exécuter une opération autorisée.

Cela permet notamment :

- recherche et indexation ;
- calculs sur le graphe ;
- synchronisation et collaboration ;
- OCR et transcription ;
- traitements scientifiques et IA autorisés.

C'est l'approche la plus simple à concilier avec les fonctionnalités prévues.

### Option B — Chiffrement de bout en bout généralisé

Les données sont chiffrées sur les appareils des utilisateurs et le serveur ne possède pas les clés nécessaires pour les lire.

C'est une protection très forte contre certaines compromissions du serveur.

Mais elle rend beaucoup plus complexes la recherche serveur, les traitements documentaires, les collaborations entre utilisateurs, la récupération de compte et certains mécanismes de synchronisation.

Elle n'est pas impossible, mais elle impose des compromis considérables.

### Option C — Chiffrement serveur robuste + protection renforcée pour certains contenus

C'est ma recommandation.

GENIIUS utilise par défaut un chiffrement solide en transit et au repos, avec une gestion rigoureuse des clés.

L'architecture doit aussi pouvoir accueillir ultérieurement des espaces ou contenus à confidentialité renforcée, éventuellement chiffrés de bout en bout, avec des limitations fonctionnelles explicitement assumées.

Je ne recommande pas de rendre le chiffrement de bout en bout obligatoire pour tout GENIIUS dès la V1.

## 3. Et les copies hors connexion ?

C'est ici que TECH-002 prend toute son importance.

Tu peux avoir sur ton ordinateur ou ton téléphone une réplique locale contenant des centaines de milliers de personnes et des informations privées.

Si l'appareil est volé, cette base ne doit pas être librement lisible.

Je recommande donc :

Mobile : protection de la base locale et des fichiers sensibles en s'appuyant notamment sur les mécanismes sécurisés du système d'exploitation.

Desktop : chiffrement des données locales sensibles, protection des clés et intégration aux mécanismes de sécurité Windows/macOS lorsque pertinent.

Un point important : une session GENIIUS verrouillée n'est pas, à elle seule, une garantie que les fichiers locaux sont chiffrés.

Les deux sujets doivent être traités séparément.

## 4. Les clés ne doivent pas être stockées n'importe où

Imaginons :

> base chiffrée sur un serveur ;

mais :

> clé de déchiffrement dans un fichier de configuration accessible sur le même serveur.

La protection devient beaucoup moins efficace en cas de compromission complète.

Je recommande donc une gestion centralisée et sécurisée des secrets, avec séparation des responsabilités, rotation lorsque nécessaire et journalisation des opérations sensibles.

Nous choisirons plus tard les mécanismes précis : KMS, coffre de secrets, clés gérées par le fournisseur ou solution adaptée.

## 5. Attention aux journaux techniques

Un dernier piège.

GENIIUS protège correctement sa base.

Mais un développeur active un journal de diagnostic qui enregistre :

> nom complet, date de naissance, informations familiales, contenu d'une requête IA, jeton d'authentification.

Nous venons de recréer une fuite potentielle.

Les logs, traces d'erreurs et outils de supervision doivent donc être soumis à une politique de minimisation et de masquage des données sensibles.

# Ma recommandation TECH-019

Je propose de figer :

1. Chiffrement en transit obligatoire pour les communications contenant des données ou opérations GENIIUS, avec des protocoles modernes.
2. Chiffrement au repos obligatoire pour les bases, fichiers, sauvegardes et supports persistants concernés.
3. Protection des répliques locales Desktop et Mobile, y compris les données structurées consultables hors connexion.
4. Gestion sécurisée et séparée des clés et secrets, avec contrôle d'accès, rotation et traçabilité adaptés.
5. Aucun secret sensible intégré en dur dans le code ou les applications distribuées.
6. Chiffrement serveur robuste par défaut, plutôt qu'un chiffrement de bout en bout généralisé dès la V1.
7. Possibilité architecturale d'une confidentialité renforcée, y compris de mécanismes de chiffrement de bout en bout pour des périmètres spécifiques, sous réserve d'en définir les compromis.
8. Minimisation des données sensibles dans les logs, traces et diagnostics.
9. Protection des clés de sauvegarde et capacité de restauration testée, pour éviter qu'une sauvegarde chiffrée devienne irrécupérable.
10. Choix des algorithmes, KMS, coffres de secrets et mécanismes locaux réservé à l'architecture et à la politique de sécurité, avec recours à des standards reconnus plutôt qu'à une cryptographie maison.

Une précision : le chiffrement protège la confidentialité, mais ne remplace ni les autorisations, ni les sauvegardes, ni la traçabilité.

Je recommande TECH-019 tel quel. Tu es d'accord ?


Parfait. TECH-019 est VALIDÉ ✅.

Nous retenons donc le chiffrement des données en transit, au repos et sur les appareils, la protection des clés, ainsi qu'une architecture pouvant accueillir ultérieurement des mécanismes de confidentialité renforcée.

Nous avons sécurisé les données sur le plan technique. Il faut maintenant traiter une question différente : quelles données GENIIUS a-t-il le droit de conserver, pendant combien de temps et comment garantir leur suppression lorsqu'elle est légitimement demandée ?


## TECH-020 — Effacement et non-résurrection

### 1. Contrat normatif consolidé

**Exigence.** Purge conforme aux bases juridiques applicables, affectant contenus courants/historiques, binaires et dérivés; tombstones et sauvegardes empêchent la résurrection non autorisée.
**Vérification.** REC-X19; CP-16; REC-J13.
**Traçabilité candidate.** L08, L14, L15.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-020 — Confidentialité, RGPD et cycle de vie des données

C'est un sujet particulièrement délicat pour GENIIUS.

Une plateforme généalogique contient des informations sur des personnes qui ne se sont pas nécessairement inscrites : ancêtres décédés, personnes vivantes, enfants, membres de familles, témoins interrogés dans Echo, etc.

Et GENIIUS a une ambition patrimoniale : conserver et transmettre la connaissance pendant des décennies.

Nous devons donc concilier deux exigences qui peuvent entrer en tension :

> Préserver durablement le patrimoine historique.

> Respecter les droits des personnes et les obligations légales applicables.

## 1. Supprimer son compte ne signifie pas nécessairement détruire toute la connaissance

Imaginons qu'un généalogiste contribue pendant quinze ans à un projet collectif.

Il décide ensuite de quitter GENIIUS.

Son compte doit pouvoir être fermé conformément aux règles applicables.

Mais doit-on automatiquement supprimer les 40 000 personnes, les sources et les assertions auxquelles il a contribué ?

Je ne le recommande pas.

Il faut distinguer plusieurs catégories :

| Catégorie                                                  | Traitement envisagé                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Compte, identifiants et préférences personnelles           | Suppression ou conservation limitée selon les obligations applicables           |
| Contributions scientifiques dans un projet collectif       | Conservation possible si une base juridique le permet, avec attribution adaptée |
| Documents privés appartenant exclusivement à l'utilisateur | Suppression ou restitution selon les droits et engagements applicables          |
| Données de personnes vivantes                              | Examen des droits, de la finalité et de la base juridique                       |
| Traces techniques et journaux                              | Durées de conservation définies et limitées                                     |

La règle essentielle : ne pas confondre fermeture de compte, retrait d'accès, effacement d'une donnée et suppression d'un objet scientifique.

## 2. Le droit à l'effacement et notre historisation

Nous avons déjà décidé que GENIIUS conserve des versions historiques des objets.

Supposons qu'une personne demande légitimement l'effacement d'une information personnelle.

Une mauvaise implémentation ferait :

> supprimer la valeur dans la version courante ;

mais laisserait :

> la même information dans quinze anciennes versions.

Ce ne serait pas un véritable effacement.

Il faut donc prévoir un mécanisme de purge contrôlée capable d'agir sur toutes les représentations concernées :

- état courant et versions historiques ;
- répliques et caches ;
- index de recherche ;
- dérivés documentaires ;
- copies hors connexion lors de leur prochaine connexion ;
- sauvegardes selon une politique de rétention et de purge adaptée.

Le dictionnaire et le MLD prévoient déjà les principes de purge et de tombstone : un marqueur permettant de conserver la cohérence des références sans nécessairement conserver les données effacées.

Attention : une sauvegarde immuable ne peut pas toujours être modifiée immédiatement. Il faudra donc définir une rétention bornée, empêcher la réintroduction de données effacées lors d'une restauration et documenter les délais techniques.

## 3. Personnes vivantes et personnes décédées

Le RGPD protège les données personnelles des personnes physiques vivantes. Il ne s'applique pas, en principe, aux données des personnes décédées, même si d'autres dispositions nationales et droits de tiers peuvent intervenir.

Mais GENIIUS ne peut pas simplement considérer :

> « Personne née en 1890 = décédée. »

Une date de naissance ne prouve pas un décès.

Nous devrons donc définir une politique prudente de qualification des personnes potentiellement vivantes, sans inventer une date de décès ni transformer une présomption technique en vérité historique.

Ce point est déjà identifié comme une décision à approfondir dans notre modèle.

## 4. Les données particulièrement sensibles

GENIIUS peut contenir des informations sur les origines, les convictions religieuses, la santé ou d'autres catégories sensibles.

Certaines sont historiques ; d'autres concernent des personnes vivantes.

Je recommande une protection renforcée, fondée sur la nature des données, les personnes concernées, la finalité et la base juridique du traitement.

Et surtout, une donnée accessible à un utilisateur n'est pas automatiquement autorisée pour tous les usages.

Par exemple, avoir le droit de consulter un témoignage Echo ne signifie pas nécessairement avoir le droit de l'envoyer à un prestataire IA externe.

## 5. Savoir où les données sont hébergées

Je recommande que GENIIUS puisse documenter :

> où sont stockées les données ; quels prestataires interviennent ; quels traitements impliquent un transfert hors Espace économique européen ; quelles garanties contractuelles et juridiques s'appliquent.

Pour une première exploitation destinée principalement à des utilisateurs européens, je privilégierais un hébergement principal dans l'Union européenne, sans prétendre que cela suffit à lui seul pour garantir la conformité RGPD.

## 6. Une demande RGPD ne doit pas être traitée à la main dans cinquante systèmes

Imaginons qu'une personne demande :

> « Quelles données personnelles détenez-vous sur moi ? »

GENIIUS doit pouvoir identifier les traitements et données concernés, instruire la demande, produire les informations pertinentes et appliquer les décisions autorisées.

Je recommande donc un workflow traçable de gestion des demandes relatives aux données personnelles.

Cela ne signifie pas que toute demande d'effacement doit être automatiquement acceptée : les droits comportent des conditions et exceptions. Certaines demandes nécessiteront un examen humain.

# Ma recommandation TECH-020

Je propose de figer les exigences suivantes :

1. Protection des données dès la conception et par défaut, avec minimisation des données et des accès.
2. Distinction technique entre compte, contributions scientifiques, documents privés, données de tiers et journaux techniques.
3. Gestion du cycle de vie des données avec des règles de conservation définies par catégorie et finalité.
4. Mécanisme de purge contrôlée, couvrant les versions, index, caches, dérivés et répliques concernés.
5. Gestion spécifique des sauvegardes, avec rétention bornée et mécanismes empêchant la réapparition de données légalement effacées après restauration.
6. Traitement prudent des personnes potentiellement vivantes, sans inférence présentée comme une certitude historique.
7. Protection renforcée des données sensibles, y compris lors des traitements IA et des transferts externes.
8. Hébergement principal privilégié dans l'Union européenne, avec contrôle des prestataires et transferts internationaux.
9. Workflow traçable pour les demandes relatives aux données personnelles : accès, rectification, effacement, opposition, portabilité lorsque applicable.
10. Conservation patrimoniale compatible avec les obligations légales : aucun principe d'immutabilité scientifique ne doit rendre impossible une purge juridiquement nécessaire.
11. Séparation entre suppression d'un compte et suppression des contributions, dont le sort dépend des droits, engagements et bases juridiques applicables.
12. Documentation des traitements, durées, responsabilités et sous-traitants, avec analyse d'impact lorsque nécessaire.
13. Tests de non-réapparition des données purgées, notamment après restauration et synchronisation d'un appareil longtemps hors ligne.

Le CDC fixe ici les exigences techniques. Les bases juridiques précises, les durées de conservation et les procédures devront être déterminées dans le cadre d'une analyse juridique et RGPD adaptée à GENIIUS.

Je recommande TECH-020 tel quel. Tu es d'accord ?


Parfait. TECH-020 est VALIDÉ ✅.

Nous avons maintenant cadré la protection des données personnelles, leur conservation, leur effacement et les exigences RGPD.

Je voudrais poursuivre avec un sujet indispensable pour une plateforme scientifique et collaborative : savoir ce qui s'est passé dans GENIIUS, sans transformer le système en une immense accumulation de journaux inutilisables.


## TECH-021 — Journalisation et audit

### 1. Contrat normatif consolidé

**Exigence.** Écritures, décisions scientifiques, habilitations exceptionnelles, traitements et interventions sont traçables, horodatés et attribués sans exposer indûment les contenus protégés.
**Vérification.** REC-TECH21; CP-24.
**Traçabilité candidate.** Audit.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-021 — Observabilité, supervision et audit technique

Il faut distinguer trois questions :

- Supervision : GENIIUS fonctionne-t-il correctement ?
- Diagnostic : pourquoi quelque chose ne fonctionne-t-il pas ?
- Audit : qui a effectué une opération sensible, quand et dans quel contexte ?

Ces trois besoins sont complémentaires, mais ne nécessitent pas exactement les mêmes données.

## 1. Un utilisateur signale une anomalie

Imaginons qu'un généalogiste dise :

> « Hier à 16 h, j'ai importé 8 000 documents. GENIIUS m'indique que 7 998 ont été intégrés, mais je ne sais pas ce qui est arrivé aux deux autres. »

Je ne veux pas que l'équipe technique doive fouiller manuellement dans des milliers de lignes de texte.

GENIIUS doit pouvoir retrouver le traitement, ses étapes et ses erreurs.

Pour cela, nous avons besoin de trois mécanismes.

Métriques

Combien d'opérations réussissent ? Combien échouent ? Quelle est la latence des API ? Combien de tâches attendent ?

Journaux techniques

Quels événements et erreurs ont été enregistrés ? Quel composant a rencontré un problème ?

Traces distribuées

Quel chemin une opération a-t-elle suivi entre l'API, le Core, le stockage et les workers ?

Je recommande les trois, même si nous pourrons commencer avec une infrastructure relativement simple.

## 2. Relier les opérations entre elles

Imaginons une action :

> Jordan importe un acte.

Cela déclenche :

`API → Core → stockage → worker OCR → index de recherche`

Si chaque composant possède ses propres journaux sans lien entre eux, comprendre un incident devient très difficile.

Je recommande donc que chaque opération significative dispose d'un identifiant de corrélation.

On pourrait ainsi retrouver toute sa chaîne technique sans avoir à deviner quels événements sont liés.

Cela sera particulièrement important pour TECH-015, notre système de traitements asynchrones.

## 3. L'audit n'est pas l'historisation scientifique

C'est une distinction fondamentale.

Notre modèle scientifique peut conserver :

> Assertion créée par Jordan, puis contestée par Sarah, puis révisée.

C'est l'histoire de la connaissance.

Le journal d'audit technique peut conserver :

> Le compte X a demandé une modification de l'objet Y à telle heure, avec tel résultat.

Ce sont deux choses différentes.

L'audit technique ne doit pas devenir la source canonique des faits historiques.

Et inversement, l'historisation scientifique ne remplace pas les journaux de sécurité.

## 4. Surveiller les incidents avant que les utilisateurs les découvrent

Supposons que l'indexation ne fonctionne plus depuis six heures.

Les utilisateurs continuent à enregistrer leurs données.

Grâce à TECH-016, elles ne sont pas perdues.

Mais si personne ne remarque que 200 000 documents attendent dans une file, nous avons tout de même un problème.

Je recommande donc des alertes automatiques sur les anomalies significatives :

> taux d'erreur inhabituel ; saturation ; accumulation de tâches ; échec de sauvegarde ; dérive de synchronisation ; stockage inaccessible ; anomalies de sécurité.

L'objectif n'est pas d'envoyer une notification à chaque petite erreur, mais de détecter rapidement les incidents nécessitant une intervention.

## 5. Attention à la confidentialité

TECH-019 et TECH-020 s'appliquent aussi ici.

Un journal ne doit pas contenir inutilement le texte intégral d'un témoignage Echo, un document familial confidentiel, un mot de passe ou un jeton d'authentification.

Je recommande de privilégier des identifiants techniques, des catégories d'erreurs et des informations strictement nécessaires au diagnostic.

Les accès aux journaux doivent eux-mêmes être contrôlés et audités.

## 6. Ne pas tout conserver éternellement

GENIIUS pourrait produire des millions d'événements techniques.

Conserver indéfiniment chaque requête et chaque trace serait coûteux et potentiellement problématique au regard de la confidentialité.

Il faut distinguer :

Journaux de diagnostic courants : rétention relativement courte.

Événements de sécurité et d'audit sensibles : rétention adaptée aux obligations et aux risques.

Historisation scientifique : règles patrimoniales propres au Core.

Nous fixerons les durées précises dans la politique d'exploitation et de conservation.

# Ma recommandation TECH-021

Je propose de figer :

1. GENIIUS doit disposer de métriques, journaux structurés et traces permettant de diagnostiquer son fonctionnement.
2. Les opérations significatives doivent posséder des identifiants de corrélation utilisables entre API, Core et traitements asynchrones.
3. Les traitements longs doivent être observables individuellement, conformément à TECH-015.
4. Des alertes doivent détecter les incidents importants avant qu'ils ne provoquent une dégradation prolongée.
5. La supervision doit couvrir au minimum les API, la base, le stockage documentaire, les synchronisations, les files de tâches, les index et les sauvegardes.
6. Les événements sensibles de sécurité et d'administration doivent être auditables, avec une protection contre leur altération non autorisée.
7. Les journaux techniques, l'audit de sécurité et l'historisation scientifique doivent rester conceptuellement distincts.
8. Les journaux et traces doivent minimiser les données personnelles, confidentielles et les secrets.
9. Les accès aux outils de supervision et d'audit doivent être strictement autorisés et traçables.
10. Les durées de conservation doivent être définies selon la catégorie des événements et leur finalité.
11. La supervision doit permettre de mesurer objectivement les engagements de performance et de disponibilité que nous définirons dans les SLO/SLA.
12. Les choix d'outils concrets — OpenTelemetry, Prometheus, Grafana, systèmes de logs ou autres — appartiendront à l'architecture technique.

Mon objectif : que GENIIUS soit capable d'expliquer ses propres incidents, sans compromettre les données qu'il protège.

Je recommande TECH-021 tel quel.

Tu es d'accord ?


Parfait. TECH-021 est VALIDÉ ✅.

Nous avons maintenant défini comment GENIIUS devra surveiller son fonctionnement, diagnostiquer ses incidents et conserver les traces nécessaires à l'audit.

Je voudrais poursuivre avec un sujet qui conditionne directement notre capacité à faire évoluer GENIIUS sans mettre en danger les données de ses utilisateurs.


## TECH-022 — Environnements et compatibilité

### 1. Contrat normatif consolidé

**Exigence.** Environnements isolés, secrets distincts, compatibilité vérifiée et absence de circulation non autorisée de données de production.
**Vérification.** REC-TECH22.
**Traçabilité candidate.** Exploitation.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-022 — Environnements de développement, de test et de production

Imagine la situation suivante.

GENIIUS est utilisé par plusieurs centaines de généalogistes. Nous préparons une nouvelle version de Tree qui améliore la gestion des filiations.

Un développeur modifie une règle du Core et veut vérifier qu'elle fonctionne.

Où doit-il effectuer son test ?

Certainement pas directement sur la base de production.

Une mauvaise modification pourrait affecter des millions d'assertions historiques.

C'est pourquoi je recommande de séparer strictement les environnements.

## 1. Trois environnements principaux

Développement — DEV

Les développeurs construisent et expérimentent. Les données sont fictives, synthétiques ou spécifiquement autorisées pour cet usage.

Préproduction — STAGING

Un environnement représentatif permet de tester une version avant sa publication, notamment les migrations, la synchronisation et les performances.

Production — PROD

Le véritable patrimoine des utilisateurs. Les changements y arrivent par une procédure de déploiement contrôlée.

Ce sont des environnements logiques distincts. Nous déciderons plus tard de leur infrastructure exacte.

## 2. Le problème des données réelles

Imaginons qu'un développeur ait besoin de reproduire un bug concernant une famille.

La solution facile serait :

> « Copions la base de production sur mon ordinateur. »

Je veux l'interdire comme pratique ordinaire.

Une copie de production peut contenir des témoignages privés, des données sensibles et des documents soumis à des restrictions.

Je recommande de privilégier les données synthétiques et les jeux de test contrôlés. Toute utilisation exceptionnelle de données réelles devra être justifiée, autorisée, minimisée et protégée.

Un environnement de test n'est pas une zone où les règles de confidentialité disparaissent.

## 3. Tester sur des patrimoines gigantesques

TECH-009 nous a donné une exigence très importante.

GENIIUS doit pouvoir accueillir des bases généalogiques de grande taille.

Mais si nous ne testons qu'avec :

> 150 personnes et 20 photographies,

nous risquons de découvrir les problèmes de performance au moment où une association importe son patrimoine.

Je recommande donc des jeux de test volumétriques, représentatifs de plusieurs profils d'utilisation.

Ils devront notamment contenir des relations complexes, des données contradictoires, des sources nombreuses, des documents volumineux et des cas de confidentialité.

Ces jeux pourront être synthétiques afin de ne pas exposer de véritables patrimoines.

## 4. Les migrations de base de données

C'est probablement le point le plus critique.

Supposons qu'une nouvelle version du Core nécessite de modifier plusieurs tables.

On ne doit pas simplement exécuter un script SQL en production en espérant que tout se passe bien.

Je veux une procédure de migration :

versionnée → testée → vérifiée → déployée → contrôlée.

Et attention : certaines migrations ne peuvent pas être annulées facilement.

Il faudra donc prévoir, selon le cas, des migrations progressives et compatibles avec les versions applicatives encore en fonctionnement.

C'est particulièrement important pour Mobile et Desktop, dont les utilisateurs ne mettent pas tous leur application à jour simultanément.

## 5. Une préproduction représentative, pas nécessairement aussi coûteuse

Je ne recommande pas de payer en permanence deux infrastructures gigantesques identiques.

La préproduction doit être suffisamment représentative pour détecter les problèmes importants.

Mais certains tests de charge pourront utiliser des ressources temporaires, dimensionnées pour la durée du test.

Nous devons chercher un équilibre entre fiabilité et coût d'exploitation.

## 6. Les fonctionnalités expérimentales

Imaginons que nous développions un nouveau moteur de rapprochement généalogique.

Il pourrait être intéressant de le tester avec un petit groupe volontaire sans l'activer immédiatement pour tout GENIIUS.

Je recommande donc la possibilité d'utiliser des feature flags, c'est-à-dire des mécanismes permettant d'activer ou désactiver certaines fonctionnalités de manière contrôlée.

Mais attention : un feature flag ne remplace pas une autorisation de sécurité et ne doit pas permettre de contourner les règles du Core.

# Ma recommandation TECH-022

Je propose de figer :

1. Séparation obligatoire des environnements de développement, de préproduction et de production, notamment pour les données, secrets et autorisations.
2. Aucun développement ni test destructif directement sur les données de production.
3. Utilisation prioritaire de données synthétiques ou spécifiquement autorisées dans les environnements non productifs.
4. Toute utilisation exceptionnelle de données réelles hors production doit être encadrée, minimisée et traçable.
5. Les jeux de test doivent couvrir les complexités scientifiques de GENIIUS, pas uniquement les cas simples.
6. Des jeux volumétriques doivent permettre de tester les profils avancés et experts de TECH-009.
7. Les migrations de schéma et de données doivent être versionnées, testées et exécutées par une procédure contrôlée.
8. Les évolutions doivent prendre en compte la coexistence temporaire de différentes versions de Web, Desktop, Mobile et API.
9. La préproduction doit être représentative des composants critiques, sans nécessairement dupliquer en permanence toute la capacité de production.
10. GENIIUS doit permettre des activations progressives et contrôlées de fonctionnalités lorsque pertinent.
11. Les secrets, comptes techniques et permissions de production ne doivent pas être réutilisés indistinctement dans les autres environnements.
12. Le choix des infrastructures, conteneurs, outils de migration et mécanismes de configuration sera décidé lors de l'architecture technique.

Le principe général est le suivant :

> On doit pouvoir expérimenter librement sur GENIIUS sans jamais expérimenter librement sur le patrimoine réel des utilisateurs.

Je recommande TECH-022 tel quel.

Tu es d'accord ?


Parfait. TECH-022 est VALIDÉ ✅.

Nous retenons donc la séparation DEV / STAGING / PROD, la protection des données réelles, les migrations contrôlées et les tests représentatifs des patrimoines volumineux.

Nous pouvons maintenant aborder la suite logique : comment faire passer une nouvelle version de GENIIUS du développement jusqu'aux utilisateurs, de manière fiable et répétable ?


## TECH-023 — Intégration et déploiement continus

### 1. Contrat normatif consolidé

**Exigence.** Chaîne de livraison reproductible avec contrôles, migrations vérifiées et déploiements récupérables sans état scientifique partiellement migré.
**Vérification.** REC-TECH23.
**Traçabilité candidate.** M10-C01.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-023 — CI/CD, déploiement et retour arrière

Deux termes à connaître :

- CI — intégration continue : vérifier automatiquement que les changements apportés au code ne cassent pas le système.
- CD — livraison ou déploiement continu : préparer et diffuser les nouvelles versions de manière contrôlée.

Pour GENIIUS, je veux éviter une situation où publier une nouvelle version revient à croiser les doigts.

## 1. Chaque modification doit être vérifiée

Imaginons qu'un développeur modifie la logique des filiations dans le Core.

Cette modification pourrait affecter Tree, mais aussi Atlas, les exports ou la synchronisation.

Je recommande donc une chaîne automatique :

Modification du code

Nouvelle fonctionnalité ou correction

Contrôles automatiques

Qualité · Tests · Sécurité · Compatibilité · Construction

Préproduction

Vérification de la version candidate

Déploiement progressif

Contrôles et supervision

Production GENIIUS

Version validée et traçable

Si un contrôle obligatoire échoue, la publication doit être bloquée.

## 2. Tous les changements ne présentent pas le même risque

Modifier la couleur d'un bouton n'est pas comparable à modifier le mécanisme de versionnement des assertions.

Je recommande donc une politique proportionnée :

| Type de changement | Contrôles particuliers                         |
| ------------------ | ---------------------------------------------- |
| Interface simple   | Tests UI et régression                         |
| API                | Contrats et compatibilité                      |
| Core scientifique  | Invariants métier et non-régression            |
| Autorisations      | Tests de confidentialité et de non-divulgation |
| Base de données    | Migration, intégrité et compatibilité          |
| Synchronisation    | Conflits, reprise, idempotence                 |
| Sécurité critique  | Revue renforcée avant publication              |

Notre modèle scientifique doit bénéficier d'une protection particulière : une modification ne peut pas passer uniquement parce que le code compile.

## 3. Déployer progressivement

Supposons que GENIIUS compte 10 000 utilisateurs.

Nous publions une nouvelle version du serveur.

Faut-il nécessairement l'activer pour tout le monde à la même seconde ?

Je recommande de pouvoir procéder progressivement lorsque cela est pertinent :

> environnement interne → petit périmètre → élargissement → généralisation.

Si des anomalies apparaissent, nous pouvons interrompre le déploiement avant qu'elles ne touchent tout le monde.

Cela suppose aussi des mécanismes permettant de mesurer l'état du système pendant la publication, conformément à TECH-021.

## 4. Revenir à la version précédente

C'est ici qu'il faut être particulièrement prudent.

Imaginons que la version 2.4 introduise un bug.

Nous voulons revenir à la version 2.3.

Pour le code applicatif, cela peut être relativement simple.

Mais si la version 2.4 a modifié la structure de la base, le retour arrière peut devenir dangereux.

Je recommande donc de distinguer :

Rollback applicatif : revenir à un exécutable ou service précédent.

Récupération des données : procédure spécifique, pouvant nécessiter une correction ou une restauration contrôlée.

Un rollback ne doit jamais écraser des contributions valablement enregistrées depuis le déploiement.

Pour les migrations de schéma, nous privilégierons les évolutions progressives et compatibles lorsque possible.

## 5. Web, Desktop et Mobile n'évoluent pas au même rythme

C'est un point très important.

Sur Web, une nouvelle version peut être diffusée rapidement.

Sur Desktop, un utilisateur peut différer sa mise à jour.

Sur Mobile, les boutiques d'applications et les préférences des utilisateurs peuvent retarder la diffusion.

Il faut donc accepter temporairement plusieurs versions clientes.

Le Core doit connaître les versions et capacités prises en charge.

Et lorsqu'une ancienne version n'est plus compatible, GENIIUS doit expliquer clairement la nécessité de mise à jour, sans provoquer une perte de données locales non synchronisées.

## 6. Une version doit être identifiable

Si un utilisateur signale :

> « Depuis la dernière mise à jour, je n'arrive plus à ouvrir mon projet. »

Nous devons pouvoir identifier précisément la version de son application, la version du Core, les changements déployés et les migrations effectuées.

Je recommande donc des versions identifiables, des artefacts de déploiement traçables et un historique des publications.

# Ma recommandation TECH-023

Je propose de figer :

1. Chaîne CI/CD automatisée pour construire, vérifier et préparer les versions de GENIIUS.
2. Contrôles obligatoires avant publication, adaptés à la nature et au risque des changements.
3. Blocage des déploiements lorsqu'un contrôle critique échoue.
4. Protection renforcée des invariants scientifiques, des autorisations, du versionnement et de la synchronisation.
5. Déploiements progressifs lorsque la criticité ou l'échelle le justifie.
6. Supervision des nouvelles versions et capacité d'interrompre une diffusion problématique.
7. Stratégie de rollback applicatif, distincte des procédures de récupération des données.
8. Aucune procédure de retour arrière ne doit détruire silencieusement des contributions valides.
9. Compatibilité temporaire entre plusieurs versions clientes et serveur, selon une politique documentée.
10. Protection des données locales non synchronisées lors des mises à jour, migrations et changements de compatibilité.
11. Traçabilité des versions, artefacts, migrations et déploiements, avec possibilité d'identifier précisément une version en exploitation.
12. Gestion sécurisée des secrets et droits de déploiement, sans exposition de clés sensibles dans les chaînes CI/CD.
13. Choix des outils et plateformes CI/CD réservé à l'architecture technique.

Le principe que je veux retenir :

> Chaque version de GENIIUS doit pouvoir être construite, vérifiée, publiée et diagnostiquée de manière reproductible, sans mettre en péril le patrimoine existant.

Je recommande TECH-023 tel quel.

Tu es d'accord ?


Parfait. TECH-023 est VALIDÉ ✅.

Nous avons donc acté une chaîne CI/CD automatisée, des déploiements contrôlés, une compatibilité maîtrisée entre les versions et des procédures de retour arrière qui ne compromettent jamais les contributions scientifiques.

Nous arrivons maintenant à un sujet que je considère comme l'un des plus importants du CDC technique de GENIIUS : les tests.


## TECH-024 — Stratégie de tests

### 1. Contrat normatif consolidé

**Exigence.** Tests unitaires, intégration, fonctionnels, sécurité, performance et non-régression couvrent les invariants et disposent de résultats attendus observables.
**Vérification.** REC-TECH24; registre REC.
**Traçabilité candidate.** M10-C02.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-024 — Stratégie de tests et garantie de non-régression

Nous avons déjà effectué des crash-tests conceptuels sur le MCD, le dictionnaire et le MLD.

Mais lorsque GENIIUS sera développé, il faudra traduire ces exigences en tests logiciels exécutables et reproductibles.

L'objectif n'est pas simplement de vérifier que l'application fonctionne.

C'est de garantir qu'une évolution de Tree ne casse pas Echo, qu'une optimisation de recherche ne révèle pas des données privées, et qu'une migration ne détruit pas trente années de recherches généalogiques.

## 1. Les différents niveaux de tests

Tests de bout en bout

Un parcours complet fonctionne-t-il réellement ?

Tests d'intégration

Les composants communiquent-ils correctement ?

Tests unitaires

Chaque règle ou fonction isolée est-elle correcte ?

Je recommande de combiner ces niveaux plutôt que de tout vérifier avec de longs scénarios d'interface.

Un test unitaire est généralement rapide et précis. Un test de bout en bout vérifie davantage de composants, mais il est plus coûteux à exécuter et à maintenir.

## 2. Tester les règles scientifiques

Prenons une assertion :

> « Jeanne est la mère de Joseph. »

GENIIUS doit vérifier notamment que l'assertion respecte la signature du prédicat, les types d'objets autorisés, les règles de versionnement et les obligations de provenance applicables.

Autre exemple : deux chercheurs soutiennent des conclusions contradictoires.

Un test doit vérifier que GENIIUS conserve ces deux contributions selon notre modèle scientifique, au lieu d'écraser silencieusement l'une d'elles.

Les invariants issus du MCD, du dictionnaire et du MLD doivent devenir un catalogue de tests.

C'est ce qui permettra de préserver les décisions que nous avons prises pendant la conception.

## 3. Tester les droits d'accès, y compris les fuites indirectes

C'est un domaine où je veux être particulièrement exigeant.

Imaginons qu'une personne soit protégée jusque dans son existence.

Nous devons vérifier qu'elle ne peut être découverte ni par une fiche, ni par une recherche, ni par Atlas, ni par une statistique, ni par une suggestion, ni par un export.

Le test ne doit pas seulement vérifier :

> « L'API renvoie une erreur d'accès. »

Il doit aussi vérifier qu'elle ne révèle pas un nom, un compteur, un fragment de document ou une information indirecte.

Je recommande une matrice de tests d'autorisation appliquée à toutes les surfaces concernées.

## 4. Tester le hors connexion et les conflits

Scénario :

Deux appareils possèdent la même version d'une assertion.

Desktop

Hors connexion

Modifie l'assertion A.

Mobile

Hors connexion

Modifie également A.

Reconnexion et synchronisation

GENIIUS détecte le conflit et préserve les contributions selon TECH-003.

Le test doit garantir qu'aucune contribution n'est silencieusement perdue.

Nous devons également simuler des coupures réseau, des synchronisations interrompues, des redémarrages et des appareils restés hors ligne longtemps.

## 5. Tester les migrations patrimoniales

C'est directement lié à ton association de généalogistes expérimentés.

Je recommande des tests avec des corpus complexes et volumineux : GEDCOM, fichiers médias, données hétérogènes, doublons binaires, erreurs d'encodage, importations répétées et interruptions.

Nous devons notamment vérifier :

> Un import identique répété ne crée pas artificiellement de nouvelles assertions.

> Une erreur sur 12 fichiers ne détruit pas les 8 000 autres.

> Une migration interrompue peut reprendre sans recommencer inutilement.

> Les fichiers non interprétés peuvent être conservés sans être présentés comme scientifiquement compris.

## 6. Tester les performances et la résilience

Les objectifs de TECH-014 doivent être mesurés sur des profils représentatifs.

Et les principes de TECH-012 et TECH-013 doivent être vérifiés par des simulations de panne.

Par exemple :

> stockage temporairement inaccessible ;

> worker OCR interrompu ;

> index de recherche indisponible ;

> sauvegarde à restaurer ;

> réseau coupé pendant un transfert.

Le système doit réagir conformément à nos décisions, pas seulement réussir lorsque tout fonctionne parfaitement.

## 7. Tester l'accessibilité

Je recommande d'intégrer également l'accessibilité numérique dans la stratégie de tests.

GENIIUS vise notamment des généalogistes expérimentés, parfois âgés, et des personnes qui pourront utiliser Echo ou Connect avec des capacités et équipements différents.

Les applications devront pouvoir être utilisées au clavier lorsque pertinent, fonctionner avec les technologies d'assistance compatibles et présenter des interfaces compréhensibles.

Les critères précis d'accessibilité seront définis dans le bloc frontend et les critères d'acceptation.

## 8. Les tests doivent être reliés aux exigences

C'est probablement ma recommandation la plus structurante.

Je ne veux pas un dossier contenant :

> « 4 500 tests réussis. »

sans savoir ce qu'ils garantissent.

Je veux pouvoir retrouver :

Exigence → règle métier → scénario de test → résultat → version testée.

Par exemple :

`TECH-003 → SYNC-CONFLIT-004 → PASS`

ou :

`OB-04 → SEC-EXISTENCE-012 → PASS`

Cela permettra de démontrer qu'une nouvelle version respecte toujours nos exigences.

# Ma recommandation TECH-024

Je propose de figer :

1. Stratégie de tests multiniveaux : unitaires, intégration, contrats, bout en bout et tests spécialisés.
2. Automatisation prioritaire des contrôles reproductibles, intégrés à la CI/CD de TECH-023.
3. Transformation des invariants scientifiques du MCD, dictionnaire et MLD en tests exécutables.
4. Tests systématiques d'autorisation et de non-divulgation, y compris les fuites indirectes.
5. Tests de synchronisation et de fonctionnement hors connexion, avec conflits, interruptions et reprises.
6. Tests d'import et de migration patrimoniale sur des corpus complexes, volumineux et imparfaits.
7. Tests de performance sur plusieurs profils de charge et de volumétrie.
8. Tests de résilience, incluant pannes partielles, rejeu de tâches et restauration de sauvegardes.
9. Tests de sécurité : analyse de dépendances, contrôles automatisés et audits approfondis selon les risques.
10. Tests d'accessibilité numérique, adaptés aux différentes surfaces.
11. Traçabilité entre exigences, scénarios de tests, résultats et versions logicielles.
12. Blocage d'une publication lorsqu'un test critique échoue, avec procédure d'exception formelle uniquement lorsque le risque est évalué et acceptable, jamais pour contourner un invariant essentiel.
13. Jeux de données synthétiques et corpus de référence versionnés, pour reproduire les résultats dans le temps.
14. Tests de non-régression obligatoires lors des évolutions du Core, des contrats API, des autorisations, du modèle de données et de la synchronisation.

Une précision : je ne recommande pas de fixer arbitrairement « 100 % de couverture de code ». Un tel chiffre ne garantit pas la qualité des tests. Je préfère une couverture des risques, invariants et scénarios critiques, complétée par des indicateurs de couverture de code adaptés.

Je recommande TECH-024 tel quel. Tu es d'accord ?


Parfait. TECH-024 est VALIDÉ ✅.

Nous avons maintenant établi une stratégie de tests qui protège non seulement le logiciel, mais aussi les invariants scientifiques, les données patrimoniales, les droits d'accès et la synchronisation.

Je souhaite maintenant aborder un sujet que nous avons volontairement laissé de côté jusqu'ici : les applications elles-mêmes et leur architecture frontend.


## TECH-025 — Accessibilité et UX

### 1. Contrat normatif consolidé

**Exigence.** Cible WCAG 2.2 AA; affichage des incertitudes, états, restrictions et erreurs sans précision fictive; tests automatiques et manuels.
**Vérification.** REC-NF06; REC-T04 à T07; REC-AT05 à AT09.
**Traçabilité candidate.** L03, L12, L16.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-025 — Architecture des interfaces Web, Desktop et Mobile

Nous avons déjà validé dans TECH-001 et TECH-004 que GENIIUS sera accessible sur trois surfaces :

- Web : accès universel depuis un navigateur.
- Desktop : véritable application installée sur Windows et macOS.
- Mobile : application adaptée au téléphone, notamment pour la recherche sur le terrain.

Mais nous n'avons pas encore déterminé comment organiser techniquement leurs interfaces.

La question est importante : faut-il développer trois applications entièrement indépendantes, ou partager une partie de leur code ?

## 1. Trois stratégies possibles

Option A — Trois applications indépendantes

Déconseillée

Chaque plateforme possède sa propre implémentation des interfaces et de leurs comportements.

Avantage : liberté maximale pour chaque appareil.

Inconvénient : beaucoup de duplication, des coûts de maintenance élevés et un risque de comportements divergents.

Option B — Une interface identique partout

On réutilise pratiquement la même interface sur Web, Desktop et Mobile.

Avantage : développement initial potentiellement plus rapide.

Inconvénient : les usages sont différents. Une interface adaptée à un écran de 27 pouces ne devient pas nécessairement agréable sur un téléphone.

Option C — Socle partagé, expériences adaptées

Recommandée

On mutualise ce qui peut l'être : composants, contrats API, logique de présentation, modèles de données, validations et principes ergonomiques.

Chaque surface conserve une expérience adaptée à son contexte et des capacités natives lorsque nécessaires.

C'est l'option C que je recommande.

## 2. Un exemple concret avec Tree

Sur Desktop, tu pourrais travailler avec :

> Un arbre étendu, plusieurs panneaux, des sources ouvertes côte à côte, des raccourcis clavier et du glisser-déposer.

Sur Mobile, tu pourrais plutôt avoir :

> Une fiche individuelle, une navigation familiale progressive, un accès rapide à l'appareil photo et à la prise de notes.

Ce sont deux interfaces différentes qui manipulent pourtant les mêmes objets scientifiques.

Je ne veux donc ni trois implémentations concurrentes de Tree, ni une interface Desktop simplement rétrécie sur Mobile.

## 3. Le partage de code ne doit pas créer une dépendance excessive

Imaginons qu'une nouvelle fonctionnalité d'Echo utilise le microphone du téléphone.

Nous devons pouvoir l'ajouter sans modifier inutilement l'application Web ou casser Desktop.

Je recommande de distinguer :

Composants communs : éléments visuels réutilisables, navigation conceptuelle, formats, modèles de présentation.

Adaptateurs de plateforme : fichiers locaux, caméra, microphone, notifications, stockage sécurisé, fonctionnement hors connexion.

Interfaces spécifiques : expériences conçues pour les caractéristiques de chaque appareil.

Le choix des frameworks sera fait lors de l'architecture technique.

## 4. Un système de design commun

GENIIUS rassemble six applications : Tree, Journal, Echo, Rebond, Connect et Atlas.

Je recommande qu'elles partagent un design system.

Cela signifie notamment des règles communes pour :

> typographie, couleurs, composants, navigation, formulaires, messages d'erreur, états de chargement, accessibilité et interactions.

L'objectif n'est pas que toutes les applications soient visuellement identiques.

L'objectif est qu'un utilisateur retrouve des comportements cohérents en passant de Tree à Journal ou d'Echo à Connect.

## 5. Les états de synchronisation doivent être visibles

C'est une exigence particulièrement importante pour Desktop et Mobile.

Supposons que tu ajoutes une note dans un cimetière sans connexion.

L'interface ne doit pas simplement afficher :

> Enregistré.

Ce serait ambigu.

Elle doit pouvoir distinguer :

> &#x20;Enregistré localement

> &#x20;Synchronisation en attente

> &#x20;Synchronisé avec GENIIUS Cloud

> &#x20;Conflit nécessitant une intervention

Je veux que l'utilisateur sache où se trouvent réellement ses données.

Une confirmation locale ne doit jamais être présentée comme une confirmation serveur.

## 6. Une interface qui résiste aux gros volumes

Imaginons une liste de 300 000 personnes.

L'interface ne doit pas tenter de créer simultanément 300 000 éléments visuels.

Nous devrons utiliser des mécanismes adaptés : virtualisation des listes, chargement progressif, pagination, recherche et filtres.

Même logique pour Atlas et ses grandes quantités d'objets géographiques.

Le frontend doit respecter les exigences de performance de TECH-014.

## 7. Accessibilité et publics différents

GENIIUS sera utilisé aussi bien par des chercheurs expérimentés que par des personnes contribuant occasionnellement à Echo ou Connect.

Je recommande une interface accessible, notamment avec :

- navigation clavier et technologies d'assistance ;
- contrastes et tailles de texte adaptés ;
- messages d'erreur compréhensibles ;
- zones tactiles suffisamment grandes ;
- absence de dépendance exclusive à la couleur ;
- prise en compte des préférences d'accessibilité du système.

Pour les interfaces Web, je recommande de viser WCAG 2.2 niveau AA comme référence de conception et de vérification, tout en examinant séparément les obligations réglementaires effectivement applicables.

## 8. L'interface ne porte pas la vérité scientifique

Dernier point essentiel.

L'interface peut aider à créer une assertion, présenter une source ou afficher une conclusion.

Mais elle ne doit pas réimplémenter de manière autonome les règles fondamentales du Core.

Par exemple, si une relation est interdite par le modèle scientifique, elle doit être refusée par le Core même si une ancienne version de l'interface tente de l'envoyer.

Cela rejoint TECH-018.

# Ma recommandation TECH-025

Je propose de figer :

1. Architecture frontend mutualisée lorsque pertinent, sans imposer une interface identique sur toutes les plateformes.
2. Expériences spécifiques Web, Desktop et Mobile, adaptées aux usages et capacités de chaque appareil.
3. Partage des composants, contrats et logiques de présentation lorsqu'il réduit réellement les divergences et la maintenance.
4. Séparation claire des capacités natives via des adaptateurs propres aux plateformes.
5. Design system commun à Tree, Journal, Echo, Rebond, Connect et Atlas.
6. États explicites pour les opérations locales, synchronisées, en attente, en erreur ou en conflit.
7. Aucune confusion entre enregistrement local et confirmation de synchronisation serveur.
8. Interfaces adaptées aux gros volumes, avec chargement progressif et virtualisation lorsque nécessaire.
9. Accessibilité intégrée dès la conception, avec WCAG 2.2 AA comme cible de référence pour le Web.
10. Respect des préférences de l'utilisateur et du système, notamment pour l'accessibilité.
11. Aucune duplication indépendante des invariants scientifiques et des autorisations dans les interfaces.
12. Choix des frameworks et outils frontend réservé à l'architecture technique, après comparaison des solutions possibles.

Je veux que GENIIUS donne le sentiment d'être une seule plateforme cohérente, sans sacrifier les avantages du Web, de l'ordinateur ou du téléphone.

Je recommande TECH-025 tel quel. Tu es d'accord ?


Parfait. TECH-025 est VALIDÉ ✅.

Nous retenons donc une architecture frontend mutualisée, des expériences adaptées à chaque appareil, un design system commun et une gestion explicite du hors connexion et de la synchronisation.

Passons maintenant à un sujet essentiel pour l'ambition patrimoniale de GENIIUS : l'interopérabilité.


## TECH-026 — Export et portabilité

### 1. Contrat normatif consolidé

**Exigence.** Exports autorisés et manifestes contextuels conservent provenance, versions, hypothèses, références et droits; réimport sans extension implicite des permissions.
**Vérification.** REC-TECH26; REC-E10 à E13.
**Traçabilité candidate.** L10; MLD-14.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-026 — Interopérabilité, standards et pérennité des données

Je veux partir d'un principe :

> Un utilisateur ne doit jamais être prisonnier de GENIIUS pour récupérer ou transmettre son patrimoine.

C'est particulièrement important pour les généalogistes expérimentés que tu souhaites attirer.

Certains ont travaillé pendant trente ou quarante ans avec plusieurs logiciels. Ils doivent pouvoir migrer vers GENIIUS, mais également conserver la possibilité d'en sortir.

Et nous devons anticiper une autre réalité : les formats et logiciels actuels ne seront pas nécessairement ceux utilisés dans cinquante ans.

## 1. Importer et exporter ne sont pas exactement symétriques

Imaginons un fichier GEDCOM provenant d'un logiciel de généalogie.

GENIIUS peut importer les personnes, les familles, les événements et certaines références.

Mais notre modèle scientifique est beaucoup plus riche : assertions contradictoires, raisonnements, mentions, versions, provenance, droits, etc.

Si nous exportons ensuite en GEDCOM, une partie de cette richesse risque de disparaître.

Il faut donc distinguer :

Formats d'échange standards

GEDCOM et autres formats pertinents pour communiquer avec des logiciels extérieurs. Ils peuvent ne représenter qu'une partie du modèle GENIIUS.

Export patrimonial complet GENIIUS

Un paquet documenté destiné à préserver les données structurées, les sources, les fichiers, les relations, les versions et les métadonnées nécessaires à leur réinterprétation.

Je recommande de prévoir les deux.

## 2. Un export ne doit pas inventer de certitudes

Prenons une date historique :

> naissance entre 1770 et 1775, d'après une estimation.

Si le format de destination ne sait représenter qu'une date exacte, GENIIUS ne doit pas produire arbitrairement :

> 01/01/1772.

Nous avons déjà défini dans le dictionnaire une représentation riche des dates historiques.

Je recommande donc que chaque convertisseur soit capable de signaler les informations qu'il ne peut pas représenter fidèlement.

Un export doit pouvoir produire un rapport de conversion :

> 2 430 personnes exportées ; 8 assertions non représentables ; 17 relations simplifiées ; 4 dates dont la précision ne peut pas être conservée.

Les chiffres sont illustratifs, mais le principe est important.

## 3. Un export patrimonial doit être réutilisable sans GENIIUS

Imaginons que GENIIUS cesse un jour son activité.

Un chercheur possède trente ans de travail dans la plateforme.

Il doit pouvoir récupérer autre chose qu'un fichier opaque que seul GENIIUS sait ouvrir.

Je recommande que l'export patrimonial complet repose sur des formats documentés, avec un manifeste décrivant les fichiers, les identifiants, les relations, les versions et les empreintes d'intégrité.

Il doit permettre à un tiers compétent de reconstruire et d'interpréter le patrimoine sans dépendre d'un service GENIIUS encore actif.

Cela ne signifie pas qu'un logiciel extérieur saura automatiquement reproduire toutes les fonctionnalités de GENIIUS.

Mais les données et leur signification doivent rester accessibles.

## 4. La stabilité des identifiants

Notre dictionnaire a déjà posé des principes forts : identifiants pérennes, références versionnées, tombstones et possibilité de publication avec ARK.

Le CDC technique doit exiger que les échanges conservent autant que possible ces identités.

Une même personne exportée puis réimportée ne doit pas systématiquement devenir une nouvelle personne sans lien avec son origine.

Cela rejoint les mécanismes de réconciliation de TECH-010.

## 5. Les standards documentaires

GENIIUS devra pouvoir échanger avec des environnements variés : logiciels généalogiques, institutions patrimoniales, bibliothèques numériques, services d'archives, outils de recherche.

Je recommande de prévoir une architecture capable d'accueillir plusieurs standards, par exemple :

GEDCOM pour les échanges généalogiques ;

IIIF pour certains usages de consultation et d'interopérabilité des images patrimoniales ;

standards de métadonnées et d'identifiants pérennes pour les échanges documentaires et scientifiques.

Ce sont des pistes de compatibilité, pas encore des engagements de prise en charge intégrale dès la V1.

Nous établirons une matrice des formats réellement supportés, avec leurs versions et limites.

## 6. L'interopérabilité ne doit pas contourner la confidentialité

Un export massif peut contenir des données particulièrement sensibles.

Je recommande que chaque export respecte les droits du demandeur, les restrictions de publication et les protections d'existence.

Un utilisateur ne doit pas pouvoir contourner TECH-011 en exportant des objets qu'il n'aurait pas le droit de consulter.

Et les données qui quittent GENIIUS ne peuvent plus bénéficier automatiquement des révocations ultérieures : l'utilisateur doit être informé de cette limite lorsque c'est pertinent.

# Ma recommandation TECH-026

Je propose de figer :

1. GENIIUS doit éviter l'enfermement propriétaire des données (vendor lock-in).
2. Import et export doivent être traités comme deux capacités distinctes, avec des garanties explicites.
3. Les formats standards sont utilisés lorsqu'ils sont pertinents, sans réduire artificiellement la richesse du modèle scientifique interne.
4. Un export patrimonial complet, documenté et réutilisable sans GENIIUS doit être prévu.
5. Les exports doivent préserver autant que possible identifiants, versions, provenance, assertions, relations, sources, incertitudes et fichiers.
6. Les conversions avec perte doivent être identifiées et documentées ; aucune précision historique ne doit être inventée.
7. Les exports importants doivent comporter un manifeste et des mécanismes de vérification d'intégrité.
8. Les identifiants et lignées d'import doivent permettre une réconciliation maîtrisée lors des échanges successifs.
9. Une matrice de compatibilité doit documenter les formats, versions, périmètres pris en charge et limitations.
10. L'architecture doit pouvoir accueillir progressivement des standards généalogiques, documentaires et patrimoniaux pertinents.
11. Les imports et exports respectent les autorisations, la confidentialité et les obligations légales.
12. Les échanges volumineux utilisent les mécanismes asynchrones et reprenables définis précédemment.
13. Les choix de formats prioritaires, bibliothèques et connecteurs seront précisés lors de l'architecture et de la planification des versions.

La doctrine que je propose est simple :

> GENIIUS peut enrichir considérablement un patrimoine, mais ne doit jamais en devenir le geôlier technique.

Je recommande TECH-026 tel quel.

Tu es d'accord ?


Parfait. TECH-026 est VALIDÉ ✅.

Nous retenons donc l'interopérabilité, la pérennité des identifiants, les exports patrimoniaux complets et la possibilité de quitter GENIIUS sans perdre la maîtrise de ses données.

Nous avons maintenant traité une grande partie des exigences techniques fondamentales. Je souhaite passer à un sujet indispensable pour transformer GENIIUS en un service réellement exploitable : l'administration et l'exploitation quotidienne.


## TECH-027 — Administration à privilèges minimaux

### 1. Contrat normatif consolidé

**Exigence.** Séparer droits d’administration, lecture scientifique, publication et délégation; exceptions justifiées, temporaires, journalisées; fin de mission révoque les privilèges.
**Vérification.** REC-X09 à X11; REC-TECH27; REC-E10 à E13.
**Traçabilité candidate.** L08, L10, L13, L14.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-027 — Administration, exploitation et maintenance de GENIIUS

Jusqu'ici, nous avons surtout raisonné du point de vue des utilisateurs et des développeurs.

Mais imaginons GENIIUS en production, avec plusieurs milliers d'utilisateurs, des millions d'objets scientifiques et des téraoctets de documents.

Il faudra gérer les incidents, les ressources, les comptes, les traitements bloqués, les mises à jour et les demandes d'assistance.

La question est :

> De quels pouvoirs l'équipe qui exploite GENIIUS doit-elle disposer, et quelles limites devons-nous lui imposer ?

C'est particulièrement important parce que GENIIUS contient des données privées.

## 1. Distinguer les rôles d'administration

Je ne recommande pas de créer un unique compte « super-administrateur » capable de tout faire sans contrôle.

Il faut distinguer plusieurs responsabilités.

| Rôle technique             | Responsabilités principales                                  |
| -------------------------- | ------------------------------------------------------------ |
| Exploitation               | Surveiller le service, gérer les incidents et les ressources |
| Support                    | Aider les utilisateurs et diagnostiquer les problèmes        |
| Sécurité                   | Examiner les événements de sécurité et gérer les incidents   |
| Administration des données | Exécuter certaines opérations exceptionnelles et contrôlées  |
| Gestion des déploiements   | Publier et maintenir les versions logicielles                |

Ce sont des responsabilités logiques, pas nécessairement cinq salariés ou cinq comptes distincts dès le lancement.

Une petite équipe pourra cumuler plusieurs responsabilités, mais les permissions devront rester explicites.

## 2. Le support ne doit pas pouvoir lire librement les données privées

Imaginons qu'un utilisateur contacte le support :

> « Mon projet familial ne se synchronise plus. »

La solution facile serait que le support ouvre son projet et regarde toutes ses données.

Je ne veux pas que ce soit le fonctionnement normal.

Le support doit d'abord pouvoir consulter les informations techniques nécessaires :

> état de synchronisation, identifiants de tâches, erreurs, version applicative, volumes, statut du stockage.

Sans accéder automatiquement au contenu scientifique ou aux documents privés.

Si un accès exceptionnel au contenu devient nécessaire, je recommande une procédure spécifique : justification, autorisation appropriée, périmètre limité, durée limitée et traçabilité.

Les situations d'urgence devront également être encadrées.

## 3. Administrer les traitements longs

Reprenons notre migration de 500 000 personnes.

Une tâche reste bloquée depuis plusieurs heures.

L'exploitation doit pouvoir :

> voir son état ; identifier la cause ; suspendre ou relancer un traitement autorisé ; ajuster certaines ressources ; isoler une tâche défectueuse.

Mais elle ne doit pas pouvoir modifier silencieusement les assertions scientifiques pour « réparer » le problème.

Il faut distinguer réparation technique et intervention sur la connaissance.

## 4. Maintenance sans surprise

Imaginons qu'une opération de maintenance rende temporairement une fonction indisponible.

GENIIUS devrait pouvoir communiquer clairement :

> Maintenance programmée de 23 h à minuit. Certaines synchronisations seront différées.

Je recommande des mécanismes permettant de prévenir les utilisateurs lorsque c'est pertinent, de limiter les opérations dangereuses pendant la maintenance et de reprendre proprement les traitements interrompus.

Nous chercherons évidemment à éviter les interruptions inutiles.

## 5. Les actions administratives doivent être auditables

Supposons qu'un administrateur effectue une purge exceptionnelle ou modifie un paramètre critique.

GENIIUS doit pouvoir déterminer :

> qui a effectué l'action ; quand ; dans quel contexte ; sur quel périmètre ; avec quel résultat.

Certaines actions particulièrement sensibles pourraient nécessiter une validation supplémentaire ou un contrôle par une seconde personne.

Ce n'est pas nécessairement obligatoire pour toutes les opérations, mais je recommande de prévoir cette capacité.

## 6. Éviter une exploitation entièrement manuelle

Si GENIIUS doit un jour accueillir des milliers d'utilisateurs, nous ne pouvons pas dépendre d'un administrateur qui exécute quotidiennement cinquante commandes à la main.

Je recommande d'automatiser les opérations répétitives et sûres :

> vérifications de santé ; sauvegardes ; contrôles d'intégrité ; alertes ; rotation de certains secrets ; nettoyage technique selon les règles de conservation.

Les opérations irréversibles ou scientifiquement sensibles restent soumises à des contrôles renforcés.

# Ma recommandation TECH-027

Je propose de figer :

1. GENIIUS doit disposer de capacités d'administration et d'exploitation adaptées à un service en production.
2. Les responsabilités d'exploitation, de support, de sécurité et d'administration sensible doivent être distinguées logiquement.
3. Principe du moindre privilège : chaque intervenant ne dispose que des permissions nécessaires à sa mission.
4. Le support ne doit pas avoir accès par défaut aux contenus scientifiques et documents privés.
5. Les accès exceptionnels aux données privées doivent être justifiés, limités, autorisés et audités.
6. Les opérations techniques sur les traitements asynchrones doivent être possibles sans altérer silencieusement les données scientifiques.
7. Les actions administratives sensibles doivent être traçables et, lorsque nécessaire, soumises à une validation renforcée.
8. GENIIUS doit prévoir des procédures de maintenance, de gestion des incidents et de communication aux utilisateurs.
9. Les opérations répétitives et sûres doivent être automatisables.
10. Les opérations destructives ou irréversibles doivent disposer de protections spécifiques.
11. Les outils d'administration doivent respecter les mêmes exigences de sécurité, de confidentialité et de supervision que le reste de GENIIUS.
12. Les procédures d'exploitation doivent être documentées afin que la continuité du service ne dépende pas exclusivement d'une seule personne.
13. Le choix des outils d'administration, d'orchestration et d'exploitation sera arrêté lors de l'architecture technique.

Le principe fondamental :

> Administrer GENIIUS ne doit pas signifier disposer d'un accès illimité au patrimoine privé de ses utilisateurs.

Je recommande TECH-027 tel quel.

Tu es d'accord ?


Parfait. TECH-027 est VALIDÉ ✅.

Nous retenons donc une administration fondée sur le moindre privilège, des accès exceptionnels contrôlés, une exploitation traçable et des procédures qui ne dépendent pas d'une seule personne.

Nous arrivons maintenant à un sujet que nous avons évoqué plusieurs fois sans encore le formaliser : la disponibilité réelle de GENIIUS et les engagements de qualité de service.


## TECH-028 — Disponibilité

### 1. Contrat normatif consolidé

**Exigence.** Objectif de disponibilité 99,9 % mesuré sur un périmètre, une période et des exclusions publiés; incidents et maintenance distingués.
**Vérification.** REC-NF04.
**Traçabilité candidate.** L16.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-028 — Disponibilité, SLO et SLA

Il faut distinguer trois notions.

- SLI (Service Level Indicator) : ce que nous mesurons, par exemple le pourcentage de requêtes réussies.
- SLO (Service Level Objective) : l'objectif interne que nous nous fixons.
- SLA (Service Level Agreement) : l'engagement contractuel éventuellement pris envers un client.

Je recommande de ne pas confondre ces trois éléments.

## 1. Quelle disponibilité viser ?

Voici ce que représentent différents niveaux de disponibilité sur une année de 365 jours, à titre indicatif.

| Disponibilité | Indisponibilité annuelle théorique |
| ------------- | ---------------------------------- |
| 99 %          | 3 j 15 h 36 min                    |
| 99,5 %        | 1 j 19 h 48 min                    |
| 99,9 %        | 8 h 45 min 36 s                    |
| 99,95 %       | 4 h 22 min 48 s                    |
| 99,99 %       | 52 min 34 s                        |

Ces durées sont des équivalents mathématiques, pas des prévisions de panne.

Je recommande 99,9 % de disponibilité mensuelle comme cible SLO initiale pour les fonctions essentielles côté serveur, après stabilisation du service.

Pourquoi pas 99,99 % ?

Parce que ce dernier niveau peut nécessiter des investissements importants en redondance, exploitation et automatisation.

Et nous avons déjà posé dans TECH-012 que la priorité de GENIIUS est l'intégrité du patrimoine plutôt que la disponibilité à tout prix.

## 2. Tout GENIIUS ne doit pas avoir le même objectif

Imaginons :

> Tree fonctionne. Journal fonctionne. Echo conserve les enregistrements. Mais la transcription automatique est indisponible.

Devons-nous considérer que GENIIUS est entièrement indisponible ?

Non.

Je recommande de définir des objectifs par catégorie de service.

Services essentiels

Authentification, accès autorisé aux données, consultation du Core et opérations métier principales.

SLO de disponibilité initial proposé : 99,9 % mensuel.

Services importants

Recherche, synchronisation, génération d'exports et autres capacités opérationnelles.

Objectifs spécifiques à définir selon les usages et dépendances.

Services différables

OCR, transcription automatique, certaines analyses IA et traitements secondaires.

Priorité à la reprise fiable et au délai de traitement plutôt qu'à une disponibilité permanente.

## 3. Mesurer la disponibilité du point de vue de l'utilisateur

Une infrastructure peut afficher :

> Serveur actif : oui.

Alors que toutes les requêtes utilisateurs échouent.

Ce n'est pas un service disponible.

Je recommande donc que les SLI portent sur des opérations réellement utilisables : authentification, consultation autorisée, enregistrement et récupération de données.

Nous devons aussi mesurer séparément les erreurs, les latences et les retards de synchronisation.

## 4. SLO et budget d'erreur

Un SLO de 99,9 % laisse un budget théorique de 0,1 % d'indisponibilité sur la période mesurée.

Pour un mois de 30 jours, cela représente environ 43 minutes et 12 secondes.

C'est ce qu'on appelle un budget d'erreur.

Il permet de prendre des décisions rationnelles.

Par exemple, si GENIIUS a connu plusieurs incidents importants ce mois-ci, je préférerais ralentir les nouvelles fonctionnalités pour corriger les causes des pannes.

Le budget d'erreur ne donne pas pour autant le droit de perdre des données : les exigences d'intégrité restent absolues dans notre doctrine de conception.

## 5. Attention aux engagements contractuels

Je ne recommande pas de promettre immédiatement :

> GENIIUS garantit contractuellement 99,99 % de disponibilité à tous ses utilisateurs.

Un SLA peut impliquer des obligations, des compensations ou des conséquences commerciales.

Nous devons d'abord démontrer notre capacité opérationnelle.

Je recommande donc :

SLO internes mesurables dès la mise en exploitation, puis SLA contractuels adaptés aux offres et aux engagements réellement soutenables.

## 6. Les sauvegardes ne remplacent pas la disponibilité

Nous avons validé dans TECH-012 :

- RPO cible ≤ 5 minutes ;
- RTO cible ≤ 4 heures après catastrophe majeure.

Ces objectifs ne signifient pas que GENIIUS peut être indisponible quatre heures chaque semaine.

Le RTO concerne la reprise après un scénario de catastrophe. Le SLO concerne la qualité du service sur une période définie.

Les deux doivent être cohérents, mais ils ne mesurent pas la même chose.

# Ma recommandation TECH-028

Je propose de figer :

1. GENIIUS doit définir des SLI mesurables, fondés sur des opérations réellement utilisables par les utilisateurs.
2. SLO initial cible de 99,9 % de disponibilité mensuelle pour les fonctions essentielles côté serveur, après stabilisation de la production.
3. Les fonctions importantes et différables doivent disposer d'objectifs adaptés à leur criticité.
4. Les performances, erreurs, retards de synchronisation et traitements asynchrones doivent être suivis séparément de la disponibilité générale.
5. Les SLO doivent être mesurés automatiquement grâce aux mécanismes de TECH-021.
6. GENIIUS doit utiliser les budgets d'erreur pour orienter les priorités de fiabilisation.
7. Les exigences d'intégrité, de confidentialité et de durabilité ne peuvent pas être sacrifiées pour respecter un indicateur de disponibilité.
8. Les objectifs RPO/RTO de TECH-012 restent distincts des SLO de disponibilité.
9. Les périodes de mesure, règles de calcul et éventuelles exclusions doivent être documentées.
10. Les SLA contractuels ne seront définis qu'en fonction de la maturité opérationnelle et des offres commerciales.
11. Les objectifs pourront être renforcés progressivement selon l'usage, les risques et les moyens disponibles.
12. Les engagements devront être régulièrement réévalués à partir des mesures réelles.

Je recommande donc TECH-028 tel quel, avec une cible initiale ambitieuse mais raisonnable de 99,9 % pour les fonctions essentielles, sans promettre prématurément une disponibilité quasi parfaite.

Tu es d'accord ?


Parfait. TECH-028 est VALIDÉ ✅.

Nous retenons donc une cible initiale de 99,9 % de disponibilité mensuelle pour les fonctions essentielles, des indicateurs adaptés aux différents services et une distinction claire entre objectifs internes et engagements contractuels.

Passons maintenant à un sujet particulièrement important pour la viabilité de GENIIUS : les coûts techniques et leur maîtrise à grande échelle.


## TECH-029 — Coûts et quotas

### 1. Contrat normatif consolidé

**Exigence.** Quotas et budgets de calcul observables; saturation ne doit ni perdre des données ni contourner les droits; traitements différables explicitement signalés.
**Vérification.** REC-NF08.
**Traçabilité candidate.** L16.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-029 — Coûts d'infrastructure, FinOps et maîtrise de la consommation

Nous avons conçu GENIIUS pour pouvoir accueillir aussi bien une personne qui construit un petit arbre familial qu'une association de généalogistes possédant plusieurs décennies d'archives.

Mais ces utilisateurs ne consommeront pas les mêmes ressources.

Un utilisateur peut conserver 500 documents. Un autre peut importer 300 000 photographies, des milliers de PDF et lancer des traitements OCR massifs.

Il faut donc éviter qu'une croissance des usages entraîne une croissance incontrôlée des dépenses.

## 1. Identifier les principales sources de coûts

Base de données et calcul

Stockage structuré, requêtes complexes, graphes de relations, traitements et index.

Documents et fichiers

Originaux, images, vidéos, dérivés, sauvegardes, réplication et transferts.

IA, OCR et transcription

Calcul local ou distant, appels aux fournisseurs, traitement des documents et des enregistrements.

Transferts et synchronisation

Téléchargements, réplication des données, diffusion des médias et échanges entre appareils.

Je recommande de suivre ces coûts séparément pour comprendre ce qui les fait évoluer.

## 2. Ne pas confondre nombre d'utilisateurs et consommation réelle

Imaginons deux comptes.

|                     | Utilisateur A | Utilisateur B |
| ------------------- | ------------- | ------------- |
| Personnes étudiées  | 2 000         | 500 000       |
| Fichiers            | 800           | 250 000       |
| Volume documentaire | 5 Go          | 2 To          |
| OCR mensuel         | 100 pages     | 50 000 pages  |

Exemple fictif destiné à illustrer les différences de consommation.

Un tarif technique uniforme fondé uniquement sur le nombre de comptes serait difficile à soutenir.

Je recommande donc que GENIIUS soit capable de mesurer les ressources consommées par utilisateur, espace, organisation ou projet lorsque cette attribution est pertinente.

Attention : cela ne signifie pas encore que nous décidons des prix commerciaux. Nous définissons seulement les capacités nécessaires pour maîtriser les coûts.

## 3. Des quotas, mais sans mettre le patrimoine en danger

Supposons qu'un utilisateur atteigne sa limite de stockage.

Je ne veux surtout pas que GENIIUS supprime automatiquement ses documents anciens.

Je recommande plutôt :

> Alerter l'utilisateur avant d'atteindre la limite.

> Lui permettre de consulter et d'exporter son patrimoine existant.

> Limiter éventuellement les nouveaux téléversements ou les traitements coûteux selon les règles de son offre.

> Ne jamais supprimer automatiquement les contributions scientifiques ou les originaux pour résoudre un dépassement de quota.

Les quotas doivent être prévisibles, explicites et non destructifs.

## 4. Les traitements coûteux doivent être pilotables

Prenons un import de 100 000 PDF.

Si GENIIUS lance immédiatement l'OCR de chaque page, la facture peut devenir importante.

Je recommande de séparer :

Conservation des originaux : priorité patrimoniale.

Extraction et indexation : traitements planifiés.

OCR, transcription et IA : traitements pouvant être priorisés, différés, limités ou soumis à confirmation selon leur coût.

Ainsi, l'utilisateur peut commencer à exploiter son patrimoine sans déclencher nécessairement toutes les dépenses possibles.

Cela rejoint TECH-015 sur les tâches asynchrones.

## 5. Prévoir des garde-fous automatiques

GENIIUS doit pouvoir détecter :

- une hausse anormale du stockage ;
- un nombre inhabituel d'appels IA ;
- des traitements qui tournent inutilement ;
- une augmentation importante des transferts ;
- une consommation qui dépasse les prévisions.

Je recommande des alertes et des mécanismes de limitation ciblés.

Mais ils ne doivent pas interrompre brutalement une écriture critique au point de créer une incohérence ou une perte de données.

## 6. Mesurer le coût des choix d'architecture

Lors de l'architecture technique, nous devrons comparer les solutions non seulement sur leurs fonctionnalités, mais également sur leur coût total de possession.

Par exemple, une solution peut être peu coûteuse à héberger mais demander beaucoup de maintenance.

Une autre peut coûter davantage chaque mois tout en économisant du temps de développement et d'exploitation.

Il faudra intégrer :

> infrastructure + stockage + transferts + sauvegardes + supervision + maintenance + licences + coûts de migration.

Je recommande également de prévoir des estimations pour plusieurs scénarios de croissance, sans figer aujourd'hui des chiffres qui ne seraient pas suffisamment fondés.

# Ma recommandation TECH-029

Je propose de figer :

1. GENIIUS doit intégrer une démarche FinOps, afin de mesurer, comprendre et maîtriser ses coûts techniques.
2. Les coûts de calcul, stockage, transferts, sauvegardes, recherche, OCR, transcription et IA doivent pouvoir être distingués.
3. La consommation doit pouvoir être attribuée aux périmètres pertinents : utilisateur, espace, organisation, projet ou traitement, sans exposer de données privées inutilement.
4. Des quotas et limites de consommation configurables doivent être prévus, notamment pour le stockage et les traitements coûteux.
5. Les quotas doivent être transparents, progressifs et non destructifs.
6. Un dépassement de quota ne doit jamais entraîner la suppression automatique du patrimoine existant.
7. Les opérations patrimoniales critiques doivent rester cohérentes même lorsqu'une limite de ressources est atteinte.
8. Les traitements lourds doivent pouvoir être planifiés, priorisés, différés et limités.
9. Les consommations inhabituelles doivent pouvoir déclencher des alertes et des garde-fous.
10. Les traitements IA et autres services facturés à l'usage doivent disposer de mécanismes spécifiques de contrôle des dépenses.
11. Les décisions d'architecture doivent considérer le coût total de possession, et pas uniquement le prix d'hébergement.
12. Des scénarios de croissance et de volumétrie doivent être établis pour dimensionner l'infrastructure.
13. Les choix techniques doivent permettre une optimisation progressive sans compromettre les invariants scientifiques, la sécurité ou la durabilité.
14. La politique tarifaire commerciale sera définie séparément : ce bloc concerne les capacités techniques de mesure et de maîtrise des coûts.

Le principe que je souhaite retenir est le suivant :

> GENIIUS doit pouvoir accueillir des patrimoines exceptionnels sans que leur conservation devienne économiquement incontrôlable, ni que les mécanismes de maîtrise des coûts menacent leur intégrité.

Je recommande TECH-029 tel quel.

Tu es d'accord ?


Parfait. TECH-029 est VALIDÉ ✅.

Nous actons donc la maîtrise des coûts techniques, le suivi des consommations, les quotas non destructifs et le pilotage des traitements coûteux.

Nous avons désormais validé 29 blocs du CDC technique de GENIIUS.

Je souhaite maintenant traiter un sujet particulièrement sensible pour une plateforme qui conserve des données personnelles, des documents historiques et des travaux scientifiques : la cybersécurité opérationnelle.


## TECH-030 — Gestion des incidents

### 1. Contrat normatif consolidé

**Exigence.** Détection, qualification, communication, restauration et retour d’expérience; traçabilité des opérations scientifiques incomplètes et accès d’urgence bornés.
**Vérification.** REC-TECH30.
**Traçabilité candidate.** Exploitation.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-030 — Gestion des vulnérabilités, incidents de sécurité et réponse aux attaques

Nous avons déjà défini les principes de sécurité de GENIIUS : authentification, autorisations, chiffrement, confidentialité, audit et sauvegardes.

Mais ces protections ne suffisent pas.

Une application peut être correctement conçue et néanmoins devenir vulnérable après une mise à jour, la découverte d'une faille dans une bibliothèque ou la compromission d'un compte administrateur.

Il faut donc définir comment GENIIUS détecte, traite et surmonte les incidents de sécurité.

## 1. Prévenir les vulnérabilités

Imaginons que GENIIUS utilise une bibliothèque pour lire les fichiers GEDCOM ou PDF.

Un chercheur découvre une vulnérabilité permettant à un fichier spécialement préparé d'exécuter du code malveillant.

Même si le Core scientifique est parfaitement conçu, le système peut être menacé.

Je recommande plusieurs protections complémentaires :

- inventaire des composants logiciels et de leurs versions ;
- surveillance des vulnérabilités connues ;
- analyse automatisée du code et des dépendances ;
- correction priorisée selon la gravité et l'exposition réelle ;
- isolation des traitements de fichiers non fiables ;
- vérifications de sécurité avant les déploiements.

L'objectif n'est pas de promettre l'absence totale de vulnérabilités, mais de réduire leur probabilité et leur durée d'exposition.

## 2. Les fichiers importés doivent être considérés comme non fiables

C'est particulièrement important pour GENIIUS.

Un utilisateur pourra importer des milliers de PDF, photographies, archives compressées, documents bureautiques ou fichiers généalogiques.

Un fichier peut être corrompu, malveillant ou conçu pour épuiser les ressources du serveur.

Je recommande donc un traitement sécurisé des importations.

Réception du fichier

Contrôles de taille, format et intégrité

Zone de traitement isolée

Analyse et extraction avec permissions limitées

Contrôles et qualification

Détection d'anomalies et décision de traitement

Intégration autorisée

Original préservé, traitements dérivés contrôlés

Un fichier suspect pourra être placé en quarantaine technique plutôt qu'exécuté ou interprété.

Cette quarantaine devra être compatible avec nos obligations de conservation, de confidentialité et de suppression légale.

## 3. Anticiper les attaques contre les comptes

Imaginons qu'un attaquant obtienne les identifiants d'un administrateur.

Les conséquences pourraient être importantes.

Je recommande notamment :

MFA obligatoire pour les comptes privilégiés, déjà acté dans TECH-007.

Mais également des alertes sur les connexions suspectes, la révocation rapide des sessions, la limitation des tentatives abusives et une procédure de reprise après compromission.

Pour les actions les plus sensibles, une nouvelle authentification ou une validation supplémentaire pourra être exigée.

## 4. Préparer une réponse aux incidents

Prenons un scénario concret :

> GENIIUS détecte une consultation anormale d'un grand nombre de documents privés.

Que doit-il se passer ?

Je recommande une procédure structurée :

1. Détecter et qualifier l'incident : identifier les signaux, le périmètre et la gravité.
2. Contenir : révoquer des sessions, bloquer une opération ou isoler un composant compromis.
3. Préserver les preuves : conserver les journaux et éléments techniques nécessaires, avec accès contrôlé.
4. Corriger : supprimer la cause de la compromission et vérifier l'intégrité des systèmes.
5. Rétablir : restaurer progressivement les fonctions et contrôler leur sécurité.
6. Notifier et améliorer : effectuer les notifications légalement requises, analyser les causes et renforcer les protections.

Les obligations de notification devront notamment respecter le RGPD lorsqu'une violation de données personnelles est caractérisée.

## 5. Séparer incident technique et incident scientifique

Il faut éviter une confusion importante.

Une panne d'index de recherche est un incident technique.

Une modification non autorisée d'une assertion scientifique peut être à la fois un incident de sécurité et un incident d'intégrité patrimoniale.

Je recommande que GENIIUS puisse examiner les deux dimensions :

> Le système est-il de nouveau sécurisé ?

Et :

> Les contributions, versions, sources et liens scientifiques sont-ils restés intègres ?

La remise en service ne doit pas masquer une altération des connaissances.

## 6. Tester régulièrement la sécurité

Je recommande des contrôles à plusieurs niveaux :

- analyses automatisées continues ;
- tests de sécurité ciblés sur les autorisations et les API ;
- exercices de réponse aux incidents ;
- audits indépendants ou tests d'intrusion selon la maturité et l'exposition du service.

Il ne sera pas nécessaire de financer un audit complet à chaque petite modification.

En revanche, les évolutions majeures touchant à l'authentification, aux autorisations, aux imports ou à l'exposition publique devront recevoir une attention renforcée.

## 7. Définir des délais de traitement selon les risques

Je ne recommande pas de traiter toutes les vulnérabilités de la même façon.

Une vulnérabilité critique exploitable depuis Internet nécessite une réaction beaucoup plus rapide qu'un défaut mineur dans une fonction interne inaccessible.

Je propose que GENIIUS adopte une politique documentée de classification et de correction, avec des délais cibles définis selon :

- gravité technique ;
- exploitabilité ;
- exposition ;
- sensibilité des données concernées ;
- existence d'une exploitation active ;
- possibilités de mitigation.

Les délais précis seront établis lors de la définition des procédures opérationnelles.

# Ma recommandation TECH-030

Je propose de figer :

1. Gestion continue des vulnérabilités sur le code, les dépendances, les composants et l'infrastructure.
2. Inventaire traçable des composants logiciels, de leurs versions et de leurs dépendances.
3. Analyses de sécurité automatisées intégrées aux processus de développement et de déploiement.
4. Traitement isolé et sécurisé des fichiers importés, considérés comme non fiables par défaut.
5. Protections contre les abus, notamment tentatives d'authentification, requêtes excessives et épuisement des ressources.
6. Surveillance des événements de sécurité et détection des comportements anormaux, dans le respect de la confidentialité.
7. Procédures documentées de réponse aux incidents : détection, qualification, confinement, investigation, correction et rétablissement.
8. Préservation contrôlée des preuves techniques nécessaires à l'analyse des incidents.
9. Vérification de l'intégrité scientifique et patrimoniale après tout incident susceptible d'avoir altéré des données.
10. Révocation et rotation des accès compromis, avec contrôles renforcés sur les comptes privilégiés.
11. Classification des vulnérabilités et délais de correction proportionnés aux risques.
12. Tests de sécurité réguliers, complétés par des audits indépendants lorsque le niveau de risque le justifie.
13. Gestion des notifications légales, notamment en cas de violation de données personnelles.
14. Retours d'expérience systématiques après les incidents significatifs, avec suivi des mesures correctives.
15. Choix des outils de sécurité et des procédures détaillées réservé à l'architecture et à l'exploitation, sans affaiblir ces exigences.

Le principe fondamental :

> GENIIUS doit non seulement protéger le patrimoine contre les attaques, mais aussi être capable de détecter une compromission, d'en limiter les conséquences et de démontrer ce qui a — ou n'a pas — été altéré.

Je recommande TECH-030 tel quel.

Tu es d'accord ?


Parfait. TECH-030 est VALIDÉ ✅.

Nous avons désormais validé 30 blocs du CDC technique de GENIIUS.

Nous retenons une cybersécurité active : prévention des vulnérabilités, isolation des fichiers importés, surveillance, réponse aux incidents et vérification de l'intégrité scientifique après une compromission.

Je souhaite maintenant aborder un sujet qui conditionnera la capacité de GENIIUS à évoluer pendant plusieurs décennies.


## TECH-031 — Versionnement scientifique et référentiels

### 1. Contrat normatif consolidé

**Exigence.** Versions immuables ou historiquement retraçables des assertions, identifications, interprétations et référentiels; changements et contradictions sans réécriture silencieuse.
**Vérification.** REC-TECH31; REC-I04 à I07; REC-S04 à S11; REC-X12.
**Traçabilité candidate.** L01, L02, L04 à L07, L09.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-031 — Évolutivité du modèle de données et migrations scientifiques

Nous avons déjà validé le versionnement des données, les migrations techniques et la compatibilité entre versions applicatives.

Mais GENIIUS présente une difficulté supplémentaire : son modèle scientifique lui-même va évoluer.

Aujourd'hui, nous disposons d'un MCD, d'un dictionnaire et d'un MLD très détaillés. Pourtant, dans cinq ou dix ans, de nouvelles recherches historiques pourraient nous conduire à enrichir certains concepts.

La question est donc :

> Comment faire évoluer le modèle scientifique de GENIIUS sans perdre, déformer ou réinterpréter silencieusement les connaissances déjà enregistrées ?

## 1. Une migration technique n'est pas nécessairement une migration scientifique

Imaginons que nous ajoutions une colonne à une table.

C'est une évolution technique relativement classique.

Mais imaginons maintenant que nous modifiions la définition d'une relation scientifique.

Par exemple, une ancienne catégorie de relation pourrait être divisée en deux catégories plus précises.

Dans ce cas, une simple modification SQL ne suffit pas.

Il faut déterminer ce que deviennent les assertions existantes, leurs sources, leurs versions et leurs éventuelles ambiguïtés.

Je recommande de distinguer trois types d'évolution.

Évolution technique

Changement d'index, optimisation de stockage, ajout d'une structure interne sans modification du sens scientifique.

Évolution structurelle

Ajout ou modification d'une entité, d'une association, d'un attribut ou d'une contrainte du modèle.

Évolution sémantique

Modification du sens d'un concept, d'un prédicat, d'une classification ou d'une règle d'interprétation.

Plus l'évolution touche au sens scientifique, plus les contrôles doivent être exigeants.

## 2. Ne jamais réinterpréter silencieusement les anciennes données

Prenons un exemple fictif.

Une relation enregistrée en 2028 possède un sens défini par le dictionnaire scientifique de cette époque.

En 2032, GENIIUS adopte une définition plus précise.

Je ne recommande pas que les millions d'anciennes relations soient automatiquement considérées comme ayant toujours eu le nouveau sens.

Il faut pouvoir distinguer :

- la définition utilisée lors de la création ;
- la définition actuellement en vigueur ;
- les éventuelles correspondances entre les deux ;
- les transformations réellement effectuées.

Autrement dit, l'évolution du vocabulaire scientifique doit être traçable.

## 3. Prévoir des migrations non destructives

Imaginons que nous remplacions une classification ancienne par une classification plus riche.

Une migration pourrait suivre ce processus :

1

Inventaire des données concernées

2

Analyse des correspondances et ambiguïtés

3

Simulation sur un corpus représentatif

4

Transformation contrôlée et traçable

5

Contrôles d'intégrité et rapport de migration

6

Activation du nouveau modèle

Si une correspondance est ambiguë, GENIIUS ne doit pas inventer une décision scientifique pour terminer la migration.

L'objet peut conserver son ancienne classification, être signalé comme nécessitant une réconciliation ou recevoir une représentation compatible documentée.

## 4. Le modèle scientifique doit posséder son propre versionnement

Nous avons déjà prévu des versions pour les objets scientifiques et pour les logiciels.

Je recommande d'ajouter une distinction explicite :

Version logicielle : version de GENIIUS déployée.

Version du schéma de données : structure physique ou logique attendue par le logiciel.

Version du référentiel scientifique : définitions, prédicats, classifications et règles sémantiques applicables.

Ces trois versions peuvent évoluer à des rythmes différents.

Cela facilitera également la réinterprétation future des exports patrimoniaux prévus dans TECH-026.

## 5. Les anciennes applications doivent rester compatibles pendant les transitions

Prenons une application Desktop restée hors ligne pendant trois mois.

Pendant cette période, GENIIUS Cloud a évolué.

À la reconnexion, il serait dangereux de synchroniser aveuglément des données structurées selon une ancienne définition.

Je recommande que le système détecte les incompatibilités et applique une procédure adaptée :

> synchronisation compatible ;

> conversion contrôlée ;

> mise à jour préalable nécessaire ;

> ou mise en attente sécurisée des contributions.

Les contributions locales non synchronisées doivent toujours être préservées, conformément à TECH-005.

## 6. Pouvoir expliquer ce qui a changé

Imaginons qu'un chercheur ouvre une assertion créée dix ans auparavant.

GENIIUS doit pouvoir lui expliquer, lorsque c'est pertinent :

> Cette assertion a été créée sous la version 2 du référentiel scientifique. Sa catégorie a été remplacée en version 4. Aucune réinterprétation automatique n'a été effectuée.

Cela renforce la transparence scientifique.

Je recommande également de produire des rapports de migration : objets concernés, transformations, ambiguïtés, échecs et contrôles réalisés.

# Ma recommandation TECH-031

Je propose de figer :

1. Distinguer les évolutions techniques, structurelles et sémantiques du modèle GENIIUS.
2. Versionner explicitement le référentiel scientifique, indépendamment des versions logicielles et du schéma de données.
3. Conserver la possibilité d'identifier les définitions et règles scientifiques applicables à une contribution historique.
4. Interdire toute réinterprétation scientifique silencieuse lors des migrations.
5. Prévoir des mécanismes de correspondance entre les anciennes et nouvelles définitions.
6. Traiter explicitement les correspondances ambiguës, sans fabriquer de certitude.
7. Privilégier les migrations non destructives, traçables et contrôlables.
8. Tester les transformations sur des corpus représentatifs avant leur application générale.
9. Préserver les identifiants, versions, sources, raisonnements et liens de provenance selon les règles du Core.
10. Produire des rapports de migration détaillant les transformations, anomalies et résultats.
11. Assurer une compatibilité maîtrisée avec les clients hors ligne, y compris après de longues périodes sans connexion.
12. Ne jamais perdre des contributions locales non synchronisées en raison d'une évolution du modèle.
13. Prévoir des procédures de reprise en cas de migration interrompue ou partiellement échouée.
14. Permettre aux exports patrimoniaux d'identifier les versions de référentiels nécessaires à leur interprétation.
15. Soumettre les changements sémantiques importants à une validation scientifique explicite, distincte de la seule validation technique.

Le principe fondamental :

> GENIIUS doit pouvoir améliorer sa manière de représenter l'histoire sans réécrire rétroactivement ce que les chercheurs avaient réellement affirmé.

Je recommande TECH-031 tel quel.

Tu es d'accord ?


Parfait. TECH-031 est VALIDÉ ✅.

Nous avons désormais validé 31 blocs du CDC technique de GENIIUS.

Nous actons notamment le versionnement indépendant du référentiel scientifique, la traçabilité des changements sémantiques et l'interdiction de réinterpréter silencieusement les contributions anciennes.

Je souhaite maintenant aborder un dernier sujet transversal avant de faire le bilan du CDC technique : comment gouverner les décisions d'architecture et démontrer que les exigences sont effectivement respectées ?


## TECH-032 — Décisions d’architecture

### 1. Contrat normatif consolidé

**Exigence.** ADR pour choix structurants, alternatives, risques, contraintes et critères de clôture; les décisions MPD différées restent bornées par les invariants.
**Vérification.** REC-TECH32.
**Traçabilité candidate.** MPD-02/03/04/06.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-032 — Gouvernance technique, traçabilité des décisions et critères de recette

Nous avons pris de nombreuses décisions structurantes.

Par exemple :

- TECH-002 autorise la réplication locale des connaissances accessibles.
- TECH-011 impose la protection de l'existence des données privées.
- TECH-012 fixe des objectifs de sauvegarde et de reprise.
- TECH-026 impose la portabilité patrimoniale.
- TECH-031 protège la signification historique des contributions.

Mais lorsqu'une équipe commencera à développer GENIIUS, elle devra choisir des technologies et faire des compromis.

Il faut éviter qu'une décision prise pour simplifier le développement contredise discrètement une exigence fondamentale.

## 1. Documenter les décisions d'architecture

Je recommande d'utiliser des ADR — Architecture Decision Records.

Ce sont de courts documents expliquant pourquoi une décision technique a été prise.

Par exemple :

ADR-001 — Choix du moteur de base de données

Exemple

Contexte

GENIIUS doit gérer un modèle relationnel riche, des versions scientifiques, des droits complexes et de grands volumes.

Solutions étudiées

Plusieurs moteurs compatibles avec les contraintes du projet.

Décision

Solution retenue après comparaison.

Justification

Intégrité, performances, coût, sécurité, compétences disponibles.

Conséquences

Avantages, limites, risques et conditions de réexamen.

Ce mécanisme évite les choix implicites et permet de comprendre, plusieurs années plus tard, pourquoi une technologie a été adoptée.

## 2. Relier chaque décision aux exigences

Je recommande une matrice de traçabilité.

| Exigence                   | Décision d'architecture | Vérification                    |
| -------------------------- | ----------------------- | ------------------------------- |
| TECH-003 — Synchronisation | ADR à définir           | Tests de conflits               |
| TECH-011 — Autorisations   | ADR à définir           | Tests de non-divulgation        |
| TECH-012 — Sauvegardes     | ADR à définir           | Exercices de restauration       |
| TECH-026 — Portabilité     | ADR à définir           | Export puis réimport            |
| TECH-031 — Sémantique      | ADR à définir           | Tests de migration scientifique |

Cela permettra de distinguer clairement :

Ce que GENIIUS doit garantir, défini dans le CDC.

Comment nous allons le garantir, défini dans l'architecture.

Comment nous vérifierons que cela fonctionne, défini dans les tests et la recette.

## 3. Définir des critères de recette mesurables

Une exigence comme « GENIIUS doit être performant » est trop vague pour être vérifiée.

Nous avons déjà fixé certains objectifs dans TECH-014 et TECH-028.

Je recommande de transformer chaque exigence importante en un ou plusieurs critères de recette.

Exemple :

> Une contribution créée hors connexion reste conservée après fermeture et redémarrage de l'application.

Autre exemple :

> Un utilisateur sans droit d'accès ne peut pas déduire l'existence d'un objet protégé par les résultats de recherche ou les compteurs.

Ces critères devront préciser les conditions de test, les résultats attendus et les preuves de validation.

## 4. Gérer les exceptions sans affaiblir le projet

Il arrivera qu'une exigence soit difficile à respecter immédiatement.

Je recommande de distinguer :

- Exigence impérative : sécurité, intégrité scientifique, absence de perte silencieuse, confidentialité.
- Exigence mesurable avec objectif : performances, disponibilité, délais de traitement.
- Capacité évolutive : fonctionnalité prévue architecturalement, mais pouvant être livrée dans une version ultérieure.

Une dérogation temporaire ne devra jamais être accordée implicitement.

Elle devra préciser le risque, les mesures compensatoires, la personne responsable et sa date de réexamen.

Certaines garanties fondamentales ne pourront pas faire l'objet d'une dérogation de mise en production.

## 5. Éviter que la documentation devienne obsolète

Un problème fréquent dans les projets informatiques est que les documents sont corrects au lancement, puis ne correspondent plus au logiciel.

Je recommande que toute évolution importante déclenche une vérification des éléments concernés :

> CDC → modèle de données → architecture → contrats API → tests → documentation.

Cela ne signifie pas qu'il faudra réécrire tous les documents à chaque modification.

Il faudra simplement identifier les impacts et mettre à jour les parties concernées.

## 6. Une recette technique avant chaque grande livraison

Avant une livraison majeure, je recommande de vérifier :

- les exigences critiques ;
- les résultats des tests automatisés ;
- les migrations et leur réversibilité ou leurs mesures de récupération ;
- les contrôles de sécurité ;
- les performances ;
- la sauvegarde et la restauration ;
- la compatibilité des clients ;
- les anomalies connues et leurs risques.

La livraison doit reposer sur des éléments vérifiables, pas seulement sur l'impression que « tout fonctionne ».

# Ma recommandation TECH-032

Je propose de figer :

1. Toute décision d'architecture structurante doit être documentée dans un ADR ou un mécanisme équivalent.
2. Chaque décision doit présenter son contexte, les solutions étudiées, les raisons du choix et ses conséquences.
3. Les exigences du CDC doivent être traçables jusqu'aux décisions d'architecture, implémentations et tests.
4. Les exigences critiques doivent disposer de critères de recette explicites et vérifiables.
5. Les objectifs quantitatifs doivent préciser leurs conditions de mesure.
6. Les invariants scientifiques, les garanties de confidentialité et l'absence de perte silencieuse ne peuvent pas être contournés par une décision technique ordinaire.
7. Les dérogations autorisées doivent être documentées, limitées, justifiées et réexaminées.
8. Les évolutions du système doivent faire l'objet d'une analyse d'impact documentaire et technique.
9. Les décisions obsolètes doivent rester consultables avec leur historique et leur remplacement.
10. Les grandes livraisons doivent être soumises à une recette technique documentée.
11. Les résultats des tests et les anomalies connues doivent être associés aux versions concernées.
12. Le CDC reste la référence des exigences, tandis que l'architecture décrit les solutions retenues pour y répondre.
13. Les choix technologiques seront évalués à partir de ces exigences, et non l'inverse.
14. Une matrice de conformité permettra de suivre les exigences satisfaites, partiellement satisfaites, non satisfaites ou non encore vérifiées.

## Ce que cette décision permettra

Une fois TECH-032 validé, nous disposerons d'un ensemble cohérent de 32 blocs techniques, couvrant les grandes contraintes de conception, de sécurité, d'exploitation, de pérennité et de qualité de GENIIUS.

Nous pourrons alors effectuer une revue transversale de complétude et de cohérence du CDC technique, identifier les éventuelles lacunes, puis préparer sa consolidation avant de passer à l'architecture technique.

Je ne considérerai donc pas automatiquement le CDC comme définitivement figé après ce bloc : il restera à vérifier que rien d'essentiel ne manque.

Je recommande TECH-032 tel quel. Tu es d'accord ?

Parfait. TECH-032 est VALIDÉ ✅.

Nous avons désormais validé les 32 blocs du CDC technique de GENIIUS.

La dernière décision établit notamment que chaque choix d'architecture devra être justifié, relié aux exigences et vérifié par des critères de recette mesurables.

## Où en sommes-nous ?

CDC technique — Phase de définition

32/32 validés

Les décisions individuelles sont validées. La revue transversale reste à effectuer avant le gel officiel du document.

# Prochaine étape — Audit transversal du CDC technique

Avant de figer une V1.0, je recommande un véritable audit, organisé autour de quatre questions :

1. Complétude : avons-nous couvert toutes les exigences techniques nécessaires aux six applications, au Core scientifique et à leur exploitation ?
2. Cohérence : certaines décisions parmi TECH-001 à TECH-032 se contredisent-elles ou créent-elles des tensions non résolues ?
3. Vérifiabilité : chaque exigence importante pourra-t-elle être démontrée par un test, une mesure ou une inspection ?
4. Frontière CDC / architecture : avons-nous correctement distingué les obligations techniques des choix de technologies à effectuer ensuite ?

Je veux notamment examiner les interactions les plus délicates : droits d'accès et recherche, fonctionnement hors connexion et révocation, conservation patrimoniale et RGPD, évolution scientifique et synchronisation, ainsi que performances et coûts.

Je recommande de ne pas passer directement à l'architecture. Nous devons d'abord produire une liste des éventuelles lacunes, contradictions, ambiguïtés et décisions encore ouvertes, puis les résoudre avant de déclarer le CDC technique V1.0 officiellement figé.

Es-tu d'accord pour lancer cette revue transversale des 32 blocs ?

Parfait. Nous lançons officiellement l'audit transversal du CDC technique de GENIIUS.

Les 32 décisions TECH-001 à TECH-032 restent validées individuellement. En revanche, le CDC technique V1.0 n'est pas encore figé : nous devons vérifier leur cohérence d'ensemble.


## TECH-033 — Internationalisation

### 1. Contrat normatif consolidé

**Exigence.** Conserver noms, écritures, accents, langues, dates et expressions historiques sans conversion destructrice; stratégie de lancement progressive autorisée.
**Vérification.** REC-NF07.
**Traçabilité candidate.** L16.

### 2. Cadrage détaillé, justifications, cas et arbitrages issus des échanges

> **Note de lecture :** cette section restitue les discussions ayant conduit aux décisions. Les questions et options non retenues ne constituent pas des prescriptions.

# TECH-033 — Internationalisation et préférences linguistiques

## 1. Le fonctionnement attendu

Chaque utilisateur possède une langue d'interface par défaut, enregistrée dans son profil.

Par exemple :

Langue de l'interface

Exemple interactif de préférence utilisateur

Français

Bienvenue dans GENIIUS

Explorez vos recherches

Rechercher

Les langues présentées illustrent le mécanisme. Leur disponibilité effective sera décidée dans la stratégie de traduction.

Le changement doit être possible sans recréer de compte ni perdre le travail en cours.

La préférence doit être retrouvée sur Web, Desktop et Mobile après synchronisation du profil.

## 2. Distinguer trois langues différentes

C'est particulièrement important pour GENIIUS.

| Type                     | Exemple                          | Règle                   |
| ------------------------ | -------------------------------- | ----------------------- |
| Langue d'interface       | Menus en anglais                 | Traduisible             |
| Langue des documents     | Acte notarié en français de 1820 | Original préservé       |
| Langue des contributions | Commentaire rédigé en espagnol   | Texte original préservé |

Changer la langue de GENIIUS ne doit jamais traduire automatiquement les sources historiques ni modifier les assertions scientifiques.

Une traduction de document ou de contribution pourra éventuellement être proposée comme une représentation supplémentaire, explicitement identifiée et reliée à l'original.

## 3. Un Core scientifique indépendant des langues

Prenons un prédicat scientifique représentant une relation de filiation.

Il ne doit pas être stocké uniquement sous la forme textuelle « est le père de ».

Il doit posséder un identifiant et une définition scientifique stables.

Son libellé peut ensuite être affiché différemment :

- Français : « est le père de »
- Anglais : « is the father of »
- Espagnol : « es el padre de »

Cela évite qu'une traduction modifie la signification des relations.

Le même principe doit s'appliquer aux statuts, catégories et concepts contrôlés.

## 4. Les règles que je recommande

Je propose de valider les exigences suivantes :

1. GENIIUS doit être conçu dès la V1 pour prendre en charge plusieurs langues d'interface.
2. Chaque utilisateur possède une langue préférée persistante dans son profil.
3. L'utilisateur peut changer de langue depuis les paramètres, sans perdre son travail.
4. La préférence est partagée entre Web, Desktop et Mobile ; une préférence locale temporaire peut être utilisée hors connexion.
5. Les visiteurs non connectés peuvent disposer d'une langue proposée selon leur navigateur, avec possibilité de la modifier.
6. La langue française est la langue initiale de référence de GENIIUS.
7. Les autres langues effectivement livrées en V1 seront définies séparément ; l'architecture ne doit pas supposer qu'il n'existe que deux langues.
8. Les textes d'interface, notifications, messages d'erreur et éléments d'accessibilité doivent être internationalisables.
9. Les formats de date, nombre et heure doivent respecter les préférences régionales, sans altérer les valeurs scientifiques stockées.
10. Les dates historiques incertaines doivent conserver leur précision et leur signification dans toutes les langues.
11. Les identifiants et définitions scientifiques doivent être indépendants de leurs libellés traduits.
12. Les documents originaux et contributions des chercheurs ne sont jamais modifiés automatiquement par un changement de langue.
13. Les traductions de contenus scientifiques, lorsqu'elles existent, doivent être distinguées des originaux et conserver leur provenance.
14. Une traduction manquante doit déclencher une langue de repli définie, sans afficher de contenu trompeur.
15. Les tests devront couvrir le changement de langue, les caractères Unicode, les textes longs, les dates historiques et la cohérence entre plateformes.

## 5. Une précision sur la langue par défaut

Je recommande le comportement suivant :

- Nouvel utilisateur : langue proposée selon le navigateur ou le système, si elle est disponible ; sinon français.
- Utilisateur connecté : sa préférence enregistrée prime sur la langue du système.
- Changement manuel : la nouvelle préférence est enregistrée et appliquée aux prochaines connexions.
- Hors connexion : la dernière langue disponible sur l'appareil reste utilisable.

Cela évite, par exemple, qu'un utilisateur ayant choisi l'anglais retrouve soudainement une interface française parce qu'il utilise un autre ordinateur.

Ma recommandation : valider TECH-033 — Internationalisation et préférences linguistiques, en gardant le choix des langues à livrer et des technologies de traduction pour les étapes suivantes.

Cela complète notre CDC technique sans modifier les principes scientifiques déjà validés.

Tu es d'accord ?


Parfait. TECH-033 — Internationalisation et préférences linguistiques est VALIDÉ ✅.

GENIIUS sera donc conçu dès la V1 pour fonctionner dans plusieurs langues, avec une préférence linguistique propre à chaque utilisateur, synchronisée entre Web, Desktop et Mobile.

Nous retenons également une distinction essentielle : traduire l'interface ne signifie jamais modifier ou traduire automatiquement les documents historiques et les contributions scientifiques.

Notre CDC technique comprend désormais 33 blocs validés et 10 clarifications transversales validées.

Poursuivons l'audit avec un sujet complémentaire à cette décision.


# PARTIE II — INVARIANTS, TRAÇABILITÉ, RECETTES ET CONDITIONS DE GEL

## 1. Invariants scientifiques transversaux
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


# PARTIE III — CADRE DE VÉRIFICATION ET SUITE DES TRAVAUX

## 1. Vérification documentaire à conduire

1. Identifier la version canonique du CDCF, du MCD, du dictionnaire et du MLD.
2. Vérifier chaque TECH contre les clauses précises des documents sources ; consigner les écarts.
3. Réconcilier la règle de visibilité `privé`, CP-23 à CP-25 et les conditions d'administration exceptionnelle.
4. Vérifier les contrats de propagation scientifique, de filtrage des index, de sauvegarde et de purge.
5. Qualifier chaque recette : spécifiée, implémentée, exécutée, réussie, échouée ou non applicable.
6. Instruire AV-FONC-001 avant toute décision de gel définitif.

## 2. Limites explicites

Ce document est une **consolidation détaillée des échanges fournis**, et non une reproduction d'un fichier CDC technique initial déjà gelé. Les passages de discussion sont volontairement conservés pour garantir le niveau de détail et la traçabilité. Le texte normatif doit faire l'objet d'une relecture croisée avec les modèles canoniques avant adoption formelle.
