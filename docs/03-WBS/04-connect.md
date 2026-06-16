[← Sommaire](README.md) · [← Précédent : Rebond](03-rebond.md)

# 4. CONNECT — Plateforme événementielle et de collecte familiale

**Description** : Application double-usage : animation ludique lors d'événements familiaux (réunions, rallyes) et collecte structurée de connaissances familiales auprès des participants.

**Définition** : Un ensemble de parcours participant (accès, jeu, connaissance familiale, arbre, documents, communication) et un back-office d'administration d'événement, avec contribution vers Tree.

**À quoi ça sert** : Profiter d'un moment de rassemblement familial pour engager les participants dans la transmission de leur mémoire et la complétion de l'arbre, tout en créant une expérience festive.

**Pour qui** : Participants à un événement familial (tous âges), organisateurs/administrateurs d'événement, modérateurs de contenu.

**Pourquoi c'est innovant** : Connect transforme un événement social ponctuel en **point de collecte de données généalogiques** sans que cela soit perçu comme une corvée — le jeu et la convivialité sont le vecteur d'engagement, la collecte de connaissances familiales en est la conséquence.

**Definition of Done du projet Connect** : Un organisateur peut créer et piloter un événement de bout en bout (inscriptions, jeu, communication, modération), un participant peut s'inscrire, jouer, explorer l'arbre familial, déclarer ses connaissances familiales et proposer des corrections — et toutes ces contributions arrivent dans la file de modération vers Tree, conformément au cadre RGPD.

---

## 4.1 Administration d'événement

**DoD** : Un organisateur pilote l'intégralité du cycle de vie d'un événement depuis un back-office unique.

### 4.1.1 Authentification & accès admin
- 4.1.1.1 AdminLoginPage / AdminGuard — **DoD** : accès admin protégé, conforme à la matrice de permissions transverse ([0.3.2.2](00-geniius-io-transverse.md#032-authentification--gestion-des-identités-utilisateurs))
- 4.1.1.2 AdminScaffold / AdminHomePage — point d'entrée unique vers tous les modules admin — **DoD** : tous les modules admin (4.1 à 4.10 côté admin) accessibles depuis ce hub

### 4.1.2 Tableau de bord événement
- 4.1.2.1 AdminEventDashboardPage — vue d'ensemble (inscriptions, participation, activité) — **DoD** : indicateurs clés visibles en temps réel le jour J
- 4.1.2.2 Configuration de l'événement (slug public, paramètres, dates) — **DoD** : un nouvel événement peut être configuré sans intervention dev (`PUBLIC_EVENT_SLUG` actuellement codé en dur à généraliser)

---

## 4.2 Accès & identité participant

**DoD** : Un participant peut créer/retrouver son accès de façon autonome, y compris pour un proche qu'il représente.

### 4.2.1 Création et récupération d'accès
- 4.2.1.1 Parcours de création d'accès (ParticipantAccessIntroPage, ParticipantAccessCreatePage, ParticipantAccessCreateForm) — **DoD** : un nouveau participant obtient un accès fonctionnel en < 5 minutes sans aide
- 4.2.1.2 Récupération d'accès perdu (ParticipantRecoverPage, RecoveryBirthYearForm, ParticipantRecoverConfirmPage) — **DoD** : un participant ayant perdu son accès le retrouve via une vérification fiable (année de naissance + autre facteur)
- 4.2.1.3 Confirmation par token / device (ParticipantConfirmTokenPage, ParticipantConfirmDevicePage) — **DoD** : confirmation sécurisée sans dépendre uniquement d'un email

### 4.2.2 Identité, profil et préférences
- 4.2.2.1 IdentityForm / ParticipantIdentityPage — identité de base — **DoD** : champs minimum nécessaires à l'identification dans l'arbre familial
- 4.2.2.2 ProfileForm / ParticipantProfilePage — profil étendu — **DoD** : profil complétable progressivement (pas tout requis à l'inscription)
- 4.2.2.3 ConsentsForm / ParticipantConsentsPage — consentements RGPD — **DoD** : conforme à [0.5.1.2](00-geniius-io-transverse.md#051-cadre-légal-généalogique), retraçable

### 4.2.3 Profils délégués
- 4.2.3.1 ManagedProfilesPage / ManagedProfilesList / ManagedProfileCard — gestion de profils pour des proches non autonomes — **DoD** : un participant peut créer/gérer le profil complet d'un proche, avec traçabilité du délégant
- 4.2.3.2 DeviceProfilesPage / DeviceProfilesList — profils multiples sur un même appareil (ex : tablette familiale partagée) — **DoD** : bascule entre profils sans perte de session

### 4.2.4 Origines du participant
- 4.2.4.1 OriginsForm (branche familiale, comment connu l'événement, éditions précédentes) — **DoD** : ces informations enrichissent le rattachement du participant dans l'arbre (lien avec [4.6](#46-contribution-généalogique-participant))

---

## 4.3 Animation événementielle (volet jeu)

**DoD** : Un événement peut être animé par un jeu d'équipe complet, du landing à la remise des résultats.

### 4.3.1 Landing et pré-inscription publique
- 4.3.1.1 LandingPage publique / EventLandingPage — **DoD** : page publique accessible sans compte, présentant l'événement
- 4.3.1.2 PreEventFormPage / PreEventConfirmationPage — pré-inscription avant l'événement — **DoD** : un visiteur peut s'inscrire à l'avance et reçoit une confirmation

### 4.3.2 Équipes
- 4.3.2.1 CreateOrJoinTeamPage / CreateTeamPage / ResumeTeamPage — **DoD** : un participant crée ou rejoint une équipe, et peut reprendre sa session équipe en cas de déconnexion
- 4.3.2.2 TeamSelfiePage — photo d'équipe — **DoD** : photo associée à l'équipe et visible dans le dashboard

### 4.3.3 Jeu par zones / quiz
- 4.3.3.1 TeamZonesPage / ZonePlayPage — déblocage et jeu par zones — **DoD** : progression d'équipe persistée, zones débloquées dans l'ordre prévu
- 4.3.3.2 QuestionScreenMock → écran de question final — **DoD** : le mock est remplacé par un moteur de questions configurable (banque de questions, types de réponses)
- 4.3.3.3 TeamDashboardPage / StandbyPage — état d'équipe entre les activités — **DoD** : une équipe sait toujours "quoi faire maintenant"

### 4.3.4 Activités et classement
- 4.3.4.1 ActivityHubPage — catalogue des activités de l'événement — **DoD** : toutes les activités (jeu, quiz, connaissance familiale...) accessibles depuis un hub unique
- 4.3.4.2 ActivityLeaderboardPage — classement — **DoD** : classement mis à jour en temps réel, affichable en mode TV (lien [4.5.4](#454-mode-tv-affichage-collectif))

---

## 4.4 Connaissance familiale guidée (Family Knowledge)

**DoD** : Un participant peut décrire son entourage familial proche selon un parcours guidé complet, sans rien manquer d'important pour Tree.

### 4.4.1 Parcours d'entrée
- 4.4.1.1 FamilyKnowledgeEntryPage / IntroPage / IntroView / HubPage — **DoD** : un participant comprend l'objectif avant de commencer, peut suspendre/reprendre

### 4.4.2 Modules de collecte
- 4.4.2.1 FamilyKnowledgeCloseFamilyPage + FamilyPeopleList + FamilyPersonForm — famille proche (parents, fratrie) — **DoD** : chaque personne déclarée porte les champs minimum du modèle pivot ([0.1.1](00-geniius-io-transverse.md#011-modèle-personne-et-identités-multiples-sourcées))
- 4.4.2.2 FamilyKnowledgeGrandparentsPage — grands-parents — **DoD** : rattachement explicite aux branches paternelle/maternelle
- 4.4.2.3 FamilyKnowledgeGodparentsPage — parrains/marraines — **DoD** : type de relation "parrainage" du modèle pivot ([0.1.2.1](00-geniius-io-transverse.md#012-modèle-relation)) utilisé
- 4.4.2.4 FamilyKnowledgeCurrentLinksPage — liens familiaux actuels (qui est en contact avec qui aujourd'hui) — **DoD** : distinction claire entre lien généalogique (passé) et lien social actuel
- 4.4.2.5 SiblingOrderField / RelationshipTypeField / LivingStatusField / PhotoPresenceField — champs structurés réutilisables — **DoD** : composants validés et réutilisés dans tous les modules 4.4.2

### 4.4.3 Photos et souvenirs associés
- 4.4.3.1 FamilyKnowledgePhotosPage / FamilyKnowledgePhotoCard — **DoD** : une photo déposée est rattachée à une/des personnes déclarées
- 4.4.3.2 FamilyKnowledgeMemoryPage — souvenir libre associé à une personne — **DoD** : un souvenir texte/audio court peut être attaché, potentiellement transmis à Journal (cf. [0.2.3](00-geniius-io-transverse.md#023-flux-connect--tree))

---

## 4.5 Arbre familial (consultation participant)

**DoD** : Un participant peut se situer dans l'arbre familial global et explorer ses proches sans comprendre la complexité du modèle pivot.

### 4.5.1 Découverte et navigation
- 4.5.1.1 FamilyTreeIntroPage / IntroView / HubPage / EntryPage — **DoD** : parcours d'entrée adapté à un public non technique
- 4.5.1.2 FamilyTreeBrowsePage — exploration de l'arbre — **DoD** : navigation cohérente avec [1.3](01-tree.md#13-navigation--visualisation-de-larbre) (même graphe, vue simplifiée)

### 4.5.2 Se retrouver / retrouver quelqu'un
- 4.5.2.1 FamilyTreeFindMePage — se localiser dans l'arbre — **DoD** : un participant retrouve sa propre position en repartant de son profil ([4.2.2](#422-identité-profil-et-préférences))
- 4.5.2.2 FamilyTreeFindPersonPage — rechercher une personne — **DoD** : recherche cohérente avec [1.3.3](01-tree.md#133-recherche-dans-larbre)

### 4.5.3 Fiches et histoires
- 4.5.3.1 FamilyTreePersonPage / FamilyTreeHandleProfilePage — fiche individu côté participant — **DoD** : cohérent avec [1.4](01-tree.md#14-fiche-individu), version simplifiée
- 4.5.3.2 FamilyRelationshipStoryPage — "histoire" narrative d'une relation (ex : comment untel est lié à untel) — **DoD** : récit généré à partir des faits/relations du graphe, pas saisi manuellement

### 4.5.4 Mode TV (affichage collectif)
- 4.5.4.1 FamilyTreeBrowseTvPage / FamilyRelationshipStoryTvPage — **DoD** : affichage adapté grand écran, navigable à distance (télécommande/mobile), utilisable pendant l'événement

---

## 4.6 Contribution généalogique participant

**DoD** : Un participant peut signaler une absence ou proposer une correction sur l'arbre, et cette contribution suit le flux [0.2.3](00-geniius-io-transverse.md#023-flux-connect--tree).

### 4.6.1 Signalement de personne manquante
- 4.6.1.1 MissingPersonRequestForm / FamilyTreeImproveBranchPage — **DoD** : un participant décrit une personne manquante avec ses liens connus, transmis en file de modération

### 4.6.2 Mise à jour de personne existante
- 4.6.2.1 ExistingPersonUpdateForm / GenealogyUpdateActionPicker — **DoD** : un participant propose une correction sur une personne existante (pas une création directe)
- 4.6.2.2 GenealogyPrivacyFields — déclaration de visibilité/consentement sur la donnée proposée — **DoD** : cohérent avec [0.5.1](00-geniius-io-transverse.md#051-cadre-légal-généalogique), appliqué dès la saisie

---

## 4.7 Documents familiaux

**DoD** : Les documents partagés pendant/autour de l'événement sont consultables, et leur consultation est mesurable côté admin.

### 4.7.1 Consultation
- 4.7.1.1 FamilyDocumentsPage — liste des documents — **DoD** : filtrage/catégorisation des documents
- 4.7.1.2 FamilyDocumentReaderPage — lecture d'un document — **DoD** : lecture fluide (PDF/image), suivi de progression de lecture

### 4.7.2 Analytique admin
- 4.7.2.1 AdminFamilyDocumentAnalyticsPage — **DoD** : un admin sait quels documents ont été lus, par qui, combien de temps

---

## 4.8 Communication & engagement

**DoD** : Les organisateurs peuvent communiquer avec les participants, et les participants peuvent réagir/contacter les organisateurs, dans les deux sens.

### 4.8.1 Annonces
- 4.8.1.1 AnnouncementComposerPage — **DoD** : un admin compose et diffuse une annonce à tout ou partie des participants

### 4.8.2 Réactions et fil familial
- 4.8.2.1 FamilyReactionFeedPage — **DoD** : un fil de réactions/contributions visible par les participants, modéré (lien [4.10](#410-modération))

### 4.8.3 Contact organisateur & feedback
- 4.8.3.1 ParticipantContactOrganizerPage / ContactOrganizerForm / ReplyChannelCheckboxGroup — **DoD** : un participant contacte un organisateur avec choix du canal de réponse, suivi de la réponse
- 4.8.3.2 ParticipantFeedbackPage — **DoD** : feedback structuré collecté et consultable côté admin

---

## 4.9 Présence & souvenirs d'événement

**DoD** : La présence des participants et les souvenirs créés pendant l'événement sont enregistrés et exploitables après l'événement.

### 4.9.1 Présence
- 4.9.1.1 ParticipantAttendancePage / AttendanceForm — **DoD** : un participant confirme sa présence (et éventuellement celle de ses profils délégués [4.2.3](#423-profils-délégués))
- 4.9.1.2 AdminEventAttendancePage — **DoD** : vue admin de la présence en temps réel le jour J

### 4.9.2 Souvenirs d'événement
- 4.9.2.1 ParticipantEventMemoryPage — dépôt de souvenir (photo/texte/audio) lié à l'événement — **DoD** : souvenir horodaté et rattaché au participant et à l'événement
- 4.9.2.2 AdminEventMemoriesPage — **DoD** : vue admin consolidée des souvenirs déposés, exploitable pour un récap post-événement

---

## 4.10 Modération

**DoD** : Aucun contenu généré par un participant (réaction, contribution généalogique, souvenir) n'est visible publiquement sans passage par la modération si la politique de l'événement l'exige.

### 4.10.1 File de modération
- 4.10.1.1 ModerationQueuePage — **DoD** : tous les contenus en attente, tous types confondus, dans une file unique
- 4.10.1.2 ModerationReviewPage — **DoD** : décision (approuver/rejeter/modifier) avec motif, traçable

---

## 4.11 Conformité & consentements

**DoD** : Connect respecte le cadre légal défini en [0.5](00-geniius-io-transverse.md#05-conformité-légale--protection-des-données) pour tous les participants, y compris mineurs et profils délégués.

### 4.11.1 Consentements spécifiques événementiels
- 4.11.1.1 Consentement image/photo (selfies, souvenirs) — **DoD** : un participant peut refuser l'utilisation de son image, appliqué à [4.3.2.2](#432-équipes)/[4.9.2](#492-souvenirs-dévénement)
- 4.11.1.2 Gestion du consentement pour profils délégués/mineurs — **DoD** : le délégant donne le consentement, traçable distinctement du consentement du délégué

---

## 4.12 Export vers Tree / Journal

**DoD** : Les contributions de Connect ([4.4](#44-connaissance-familiale-guidée-family-knowledge), [4.6](#46-contribution-généalogique-participant), [4.9.2](#492-souvenirs-dévénement)) arrivent dans les files de modération/proposition appropriées ([0.2.3](00-geniius-io-transverse.md#023-flux-connect--tree)) sans double saisie.

### 4.12.1 Passerelle Family Knowledge → Tree
- 4.12.1.1 Transformation des données [4.4](#44-connaissance-familiale-guidée-family-knowledge) en propositions Tree — **DoD** : une déclaration "famille proche" génère une proposition exploitable en [1.8](01-tree.md#18-réconciliation-multi-sources-réception-rebondjournalconnect)

### 4.12.2 Passerelle Souvenirs/Mémoire → Journal
- 4.12.2.1 Un souvenir audio/texte déposé ([4.4.3.2](#443-photos-et-souvenirs-associés), [4.9.2](#492-souvenirs-dévénement)) peut être traité comme une mini-session Journal — **DoD** : cohérent avec le flux d'ingestion externe [2.9.2](02-journal.md#292-autres-canaux-dimport)

---

[← Sommaire](README.md) · [← Précédent : Rebond](03-rebond.md) · [Suivant : Echo →](05-echo.md)
