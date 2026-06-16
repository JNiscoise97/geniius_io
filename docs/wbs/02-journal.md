[← Sommaire](README.md) · [← Précédent : Tree](01-tree.md)

# 2. JOURNAL — L'agent de collecte de témoignages

**Description** : Application conversationnelle assistée par IA qui interviewe des membres de famille sur leurs souvenirs et transforme ces témoignages en propositions d'enrichissement pour Tree.

**Définition** : Un système de sessions de dialogue (texte/audio), un agent IA outillé pour interroger l'état de l'arbre, et une file de propositions validées par un humain avant intégration.

**À quoi ça sert** : Capturer la mémoire vivante (souvenirs, anecdotes, identités, liens) avant qu'elle ne disparaisse, et la transformer en données généalogiques structurées.

**Pour qui** : Personnes interviewées (souvent aînés de la famille), proches qui mènent/accompagnent l'interview, validateurs des propositions (souvent un référent familial).

**Pourquoi c'est innovant** : L'agent connaît l'état actuel de l'arbre et adapte ses questions (il ne redemande pas ce qu'il sait déjà, cible les lacunes identifiées en [1.7.2](01-tree.md#172-analyse-de-complétude--lacunes)), tout en garantissant qu'aucune mémoire orale ne devient "vérité" sans validation humaine — un compromis rare entre automatisation IA et rigueur généalogique.

**Definition of Done du projet Journal** : Une personne peut être interviewée (en direct ou via audio importé), l'agent pose des questions pertinentes basées sur les lacunes réelles de l'arbre, transcrit et extrait les informations, génère des propositions claires, un validateur les traite, et les sujets non résolus sont automatiquement proposés à la prochaine session — le tout consultable depuis mobile et partageable entre plusieurs membres de la famille.

---

## 2.1 Gestion des sessions d'interview

**DoD** : Toute interview, passée ou en cours, est retrouvable, reprenable et rattachée à une personne de l'arbre.

### 2.1.1 Cycle de vie d'une session
- 2.1.1.1 Création de session (thème libre, thème guidé, ou import audio) — **DoD** : 3 modes de création fonctionnels (JournalNewPage)
- 2.1.1.2 Reprise d'une session interrompue — **DoD** : une session "en pause" reprend avec le contexte complet (historique, propositions en cours)
- 2.1.1.3 Clôture et résumé de session — **DoD** : un résumé automatique de session généré et stocké (`summary`)

### 2.1.2 Liste & organisation des sessions
- 2.1.2.1 Liste des sessions avec statut et badge de propositions en attente — **DoD** : JournalListPage reflète en temps réel le nombre de propositions non traitées
- 2.1.2.2 Rattachement d'une session à une ou plusieurs personnes de l'arbre — **DoD** : une session est filtrable par personne interviewée

---

## 2.2 Agent conversationnel IA

**DoD** : L'agent mène une conversation cohérente, contextualisée, respectant les règles métier (max 2 questions, pas de répétition, résolution d'identité avant de continuer).

### 2.2.1 Orchestration de la conversation
- 2.2.1.1 Boucle de dialogue (prompt système, gestion de l'historique, limites de tokens) — **DoD** : conversation de 50+ échanges sans dégradation de cohérence
- 2.2.1.2 Règle "max 2 questions à la fois" — **DoD** : vérifié automatiquement (test ou contrôle de sortie de l'agent)

### 2.2.2 Outils de l'agent (tool use)
- 2.2.2.1 `search_person` / `get_person_details` / `get_person_gaps` (lecture de Tree) — **DoD** : l'agent peut interroger l'état réel de l'arbre en cours de conversation
- 2.2.2.2 `propose_update` / `add_identity` / `create_unknown_person` (écriture vers la file de propositions) — **DoD** : chaque appel produit une entrée `journal_proposals` correctement formée
- 2.2.2.3 `flag_open_thread` (fils ouverts) — **DoD** : un sujet évoqué et non creusé est systématiquement enregistré, jamais perdu

### 2.2.3 Résolution d'identité en cours de conversation
- 2.2.3.1 Détection d'ambiguïté ("de quel oncle parlez-vous ?") — **DoD** : l'agent demande clarification avant de créer une nouvelle personne en cas d'ambiguïté
- 2.2.3.2 Création de "personne inconnue" provisoire — **DoD** : une personne créée par l'agent est marquée comme provisoire jusqu'à validation

---

## 2.3 Capture & transcription audio

**DoD** : Un témoignage oral, qu'il soit enregistré en direct ou importé, devient un texte exploitable par l'agent avec horodatage.

### 2.3.1 Enregistrement en direct
- 2.3.1.1 Capture audio depuis le navigateur pendant la session — **DoD** : enregistrement démarrable/arrêtable, sauvegardé et lié au message
- 2.3.1.2 Transcription en temps réel ou différée (Whisper) — **DoD** : texte transcrit affiché dans le fil de conversation avec lien vers l'audio source

### 2.3.2 Import d'audio externe
- 2.3.2.1 Import de fichiers audio (notes vocales WhatsApp, enregistrements) — **DoD** : un fichier audio externe peut être déposé et déclenche transcription + analyse
- 2.3.2.2 Gestion des métadonnées d'import (qui parle, date présumée) — **DoD** : un import permet de préciser le locuteur avant analyse

---

## 2.4 Extraction d'entités & enrichissement sémantique

**DoD** : Chaque information généalogique mentionnée dans une conversation est identifiée et qualifiée (type, confiance, personnes concernées).

### 2.4.1 Extraction d'entités
- 2.4.1.1 Détection de personnes, lieux, dates, événements, liens de parenté dans le texte — **DoD** : taux de rappel mesuré sur un corpus de test de conversations annotées
- 2.4.1.2 Association entité extraite ↔ personne existante de l'arbre (ou nouvelle) — **DoD** : ambiguïtés systématiquement soumises à l'agent ([2.2.3](#223-résolution-didentité-en-cours-de-conversation)) plutôt qu'auto-résolues

### 2.4.2 Stockage des extractions
- 2.4.2.1 `entities_extracted` rattaché à chaque message — **DoD** : champ structuré exploitable pour audit et ré-analyse ultérieure
- 2.4.2.2 Embeddings vectoriels des messages (`embedding vector(1536)`) — **DoD** : chaque message porte un vecteur exploitable par [2.7](#27-mémoire-sémantique-inter-sessions)

---

## 2.5 Système de propositions vers Tree

**DoD** : Toute information extraite suit un cycle proposition → décision → application, jamais une écriture directe.

### 2.5.1 Génération de propositions
- 2.5.1.1 Structure d'une proposition (champ, valeur actuelle, valeur proposée, source, statut) — **DoD** : conforme au modèle [0.2.2](00-geniius-io-transverse.md#022-flux-journal--tree)
- 2.5.1.2 Regroupement de propositions liées (une anecdote produit plusieurs propositions cohérentes) — **DoD** : propositions issues d'un même échange affichées groupées

### 2.5.2 Interface de validation
- 2.5.2.1 Page propositions (JournalProposalsPage) — accepter/rejeter/modifier avant application — **DoD** : un validateur traite une proposition en < 30 secondes en moyenne
- 2.5.2.2 Application effective sur Tree (lien avec [1.8.2](01-tree.md#182-arbitrage-et-application)) — **DoD** : proposition acceptée = fait créé dans Tree avec source "Journal", session, date

---

## 2.6 Fils ouverts & relances

**DoD** : Aucun sujet mentionné n'est définitivement perdu si non traité dans la session en cours.

### 2.6.1 Gestion des fils ouverts
- 2.6.1.1 Liste des fils ouverts par personne/famille — **DoD** : consultable indépendamment des sessions
- 2.6.1.2 Priorisation des fils ouverts (croisement avec les lacunes de l'arbre, [1.7.2](01-tree.md#172-analyse-de-complétude--lacunes)) — **DoD** : les fils les plus "structurants" sont proposés en premier

### 2.6.2 Relance en session suivante
- 2.6.2.1 L'agent propose de reprendre un fil ouvert au démarrage d'une nouvelle session — **DoD** : testé sur un scénario multi-sessions
- 2.6.2.2 Clôture d'un fil ouvert (résolu, abandonné) — **DoD** : statut traçable

---

## 2.7 Mémoire sémantique inter-sessions

**DoD** : L'agent peut retrouver "qui a déjà parlé de quoi" à travers toutes les sessions, pas seulement la session courante.

### 2.7.1 Recherche vectorielle (pgvector)
- 2.7.1.1 Index vectoriel sur les messages — **DoD** : recherche par similarité fonctionnelle et performante à l'échelle de centaines de sessions
- 2.7.1.2 Utilisation par l'agent pour éviter les répétitions inter-sessions — **DoD** : l'agent peut référencer "vous m'aviez parlé de..." dans une nouvelle session

---

## 2.8 Interface utilisateur Journal

**DoD** : L'interface permet à un utilisateur non technique de mener une interview de bout en bout sans aide.

### 2.8.1 Parcours de session
- 2.8.1.1 Interface de chat (bulles, saisie texte, audio) — **DoD** : ChatBubble/ChatInput fonctionnels avec gestion des états (envoi, transcription en cours)
- 2.8.1.2 Panneau latéral propositions/fils ouverts pendant la session — **DoD** : visibilité en temps réel de ce que l'agent a "compris" sans quitter la conversation

### 2.8.2 Landing & onboarding Journal
- 2.8.2.1 Page d'accueil avec actions principales — **DoD** : LandingPage présente les 4 actions clés (nouvelle interview, import, propositions, etc.)
- 2.8.2.2 Aide/tutoriel pour la première utilisation — **DoD** : un nouvel utilisateur comprend le principe "proposition → validation" avant sa première session

---

## 2.9 Canaux d'ingestion externes

**DoD** : Journal peut recevoir des témoignages sans que l'utilisateur ouvre l'application.

### 2.9.1 Intégration WhatsApp
- 2.9.1.1 Réception automatisée de messages/audios WhatsApp — **DoD** : un message vocal envoyé sur un numéro dédié devient une session Journal
- 2.9.1.2 Consentement et gestion des numéros autorisés — **DoD** : seuls les numéros enregistrés par un participant peuvent alimenter Journal (lien avec [0.5](00-geniius-io-transverse.md#05-conformité-légale--protection-des-données))

### 2.9.2 Autres canaux d'import
- 2.9.2.1 Import par email/lien partagé — **DoD** : un fichier audio/texte envoyé par email devient une session
- 2.9.2.2 Import en masse (archives familiales de témoignages existants) — **DoD** : traitement par lot avec suivi de progression

---

## 2.10 Multi-plateforme (mobile)

**DoD** : Une interview peut être menée depuis un téléphone, y compris par une personne âgée peu à l'aise avec la technologie.

### 2.10.1 Application mobile / PWA
- 2.10.1.1 Interface adaptée mobile (gros boutons, enregistrement audio simplifié) — **DoD** : testée avec un panel représentatif (utilisateurs âgés)
- 2.10.1.2 Mode hors-ligne (enregistrement sans connexion, synchronisation différée) — **DoD** : un enregistrement réalisé sans réseau n'est jamais perdu

---

## 2.11 Collaboration multi-utilisateurs / partage familial

**DoD** : Plusieurs membres d'une même famille peuvent contribuer à et superviser le même Journal sans conflit.

### 2.11.1 Partage de sessions
- 2.11.1.1 Visibilité des sessions par d'autres membres autorisés de la famille — **DoD** : droits de lecture configurables par session
- 2.11.1.2 Co-validation des propositions (plusieurs validateurs possibles) — **DoD** : règle de double-validation optionnelle pour les faits sensibles

### 2.11.2 Notifications
- 2.11.2.1 Notification de nouvelles propositions à valider — **DoD** : un validateur est notifié sans avoir à ouvrir l'app régulièrement
- 2.11.2.2 Notification de nouvelle session disponible (audio importé traité) — **DoD** : alerte dès que la transcription/extraction est terminée

---

[← Sommaire](README.md) · [← Précédent : Tree](01-tree.md) · [Suivant : Rebond →](03-rebond.md)
