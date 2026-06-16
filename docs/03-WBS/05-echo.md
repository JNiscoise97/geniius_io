[← Sommaire](README.md) · [← Précédent : Connect](04-connect.md)

# 5. ECHO — Prototype offline-first multi-plateforme

**Description** : Squelette d'application offline-first (web PWA, desktop Tauri, mobile Capacitor) avec couches domaine/data/platform/ui séparées, actuellement non intégré à la suite.

**Définition** : Une architecture de référence pour une app fonctionnant sans connexion, avec synchronisation différée, testée sur un cas d'usage minimal ("Contacts").

**À quoi ça sert** : *(à déterminer — c'est précisément le premier livrable)*. Hypothèses raisonnables compte tenu du reste de la suite : version mobile/offline de Journal ([2.10](02-journal.md#210-multi-plateforme-mobile)) pour les interviews en zone blanche, ou client mobile de Connect pour un événement sans réseau fiable.

**Pour qui** : Indéterminé tant que [5.1](#51-cadrage-stratégique-préalable-obligatoire) n'est pas traité — potentiellement les mêmes utilisateurs que Journal ([2.10](02-journal.md#210-multi-plateforme-mobile)) ou Connect en contexte de faible connectivité.

**Pourquoi c'est innovant** : *(conditionnel)* Si Echo devient le socle offline de Journal/Connect, l'innovation est de pouvoir mener une interview généalogique ou participer à un événement familial dans un lieu reculé (maison de famille en zone rurale, par exemple) sans perte de données.

**Definition of Done du projet Echo** : **Avant tout, une décision de cadrage est prise et documentée** ([5.1](#51-cadrage-stratégique-préalable-obligatoire)). Si la décision est "poursuivre", Echo est Done quand il fournit une couche offline réutilisable par Journal et/ou Connect, avec synchronisation fiable vers Supabase, démontrée sur un cas d'usage réel de la suite (pas seulement "Contacts").

---

## 5.1 Cadrage stratégique (préalable obligatoire)

**DoD** : Une décision écrite existe : Echo est (a) le socle mobile/offline de Journal, (b) le socle mobile/offline de Connect, (c) un produit autonome, ou (d) abandonné — avec justification.

### 5.1.1 Analyse de redondance avec l'existant
- 5.1.1.1 Comparaison Echo vs besoin mobile Journal ([2.10](02-journal.md#210-multi-plateforme-mobile)) — **DoD** : note de décision tranchant si [2.10](02-journal.md#210-multi-plateforme-mobile) doit être bâti sur Echo ou indépendamment
- 5.1.1.2 Comparaison Echo vs besoin offline Connect (terrain d'événement sans réseau) — **DoD** : note de décision équivalente pour Connect

### 5.1.2 Décision finale et plan de bascule
- 5.1.2.1 Choix d'orientation documenté et communiqué — **DoD** : décision actée, impact sur le WBS de Journal/Connect répercuté si applicable
- 5.1.2.2 Critère d'arrêt si "abandon" — **DoD** : si abandonné, code archivé proprement (pas supprimé silencieusement, pas laissé en l'état comme dette ambiguë)

---

## 5.2 Couche domaine partagée *(si décision = poursuivre)*

**DoD** : Les types et règles métier nécessaires au cas d'usage retenu ([5.1.2](#512-décision-finale-et-plan-de-bascule)) sont définis dans `packages/domain`, alignés sur le schéma pivot [0.1](00-geniius-io-transverse.md#01-modèle-de-données-pivot--identité-généalogique).

### 5.2.1 Modèle de domaine offline
- 5.2.1.1 Types métier du cas d'usage retenu (ex : session Journal simplifiée, ou profil participant Connect) — **DoD** : compatible avec une conversion sans perte vers/depuis le schéma pivot [0.1](00-geniius-io-transverse.md#01-modèle-de-données-pivot--identité-généalogique)
- 5.2.1.2 Règles de validation locales (avant synchronisation) — **DoD** : une donnée invalide est rejetée localement, pas seulement au moment de la synchro

---

## 5.3 Stockage local offline-first

**DoD** : Les données du cas d'usage retenu sont persistées localement de façon fiable sur les 3 plateformes cibles.

### 5.3.1 Adaptateurs de stockage
- 5.3.1.1 Remplacement de `MemoryStorage` par SQLite (web : sql.js/wa-sqlite ; desktop : Tauri + sqlite-native ; mobile : Capacitor SQLite) — **DoD** : redémarrage de l'app ne perd aucune donnée sur les 3 plateformes
- 5.3.1.2 Gestion des fichiers/médias offline (audio, photos) — **DoD** : un média capturé hors-ligne est conservé et synchronisable

### 5.3.2 Interfaces Storage/Files communes
- 5.3.2.1 Contrat d'interface unique implémenté par chaque adaptateur — **DoD** : la couche UI ne dépend d'aucune implémentation spécifique de plateforme

---

## 5.4 Applications shells multi-plateformes

**DoD** : Le cas d'usage retenu ([5.1.2](#512-décision-finale-et-plan-de-bascule)) est utilisable de bout en bout sur web, desktop et mobile.

### 5.4.1 Web (PWA)
- 5.4.1.1 App installable, fonctionnement hors-ligne complet — **DoD** : audit PWA (Lighthouse ou équivalent) validé

### 5.4.2 Desktop (Tauri)
- 5.4.2.1 Remplacement du placeholder par une intégration réelle — **DoD** : build desktop installable, fonctionnel hors-ligne

### 5.4.3 Mobile (Capacitor)
- 5.4.3.1 Remplacement du placeholder par une intégration réelle — **DoD** : build mobile installable (au moins en interne/TestFlight équivalent), fonctionnel hors-ligne

---

## 5.5 Synchronisation avec le backend central

**DoD** : Les données capturées hors-ligne dans Echo arrivent dans Supabase et, le cas échéant, dans les files de proposition de Tree ([0.2](00-geniius-io-transverse.md#02-intégration-inter-applications-flux-de-données)), sans duplication ni perte en cas de synchro partielle/interrompue.

### 5.5.1 Client de synchronisation
- 5.5.1.1 SyncClient (queue d'opérations, rejouabilité) — **DoD** : une synchro interrompue en cours de route reprend sans doublon
- 5.5.1.2 Résolution de conflits (donnée modifiée localement et côté serveur entre deux synchros) — **DoD** : politique de résolution documentée et testée

### 5.5.2 Intégration avec le flux applicatif cible
- 5.5.2.1 Si Journal : les sessions/messages capturés offline rejoignent [2.1](02-journal.md#21-gestion-des-sessions-dinterview)/[2.3](02-journal.md#23-capture--transcription-audio) — **DoD** : une session menée hors-ligne est indistinguable d'une session en ligne une fois synchronisée
- 5.5.2.2 Si Connect : les contributions offline rejoignent [4.12](04-connect.md#412-export-vers-tree--journal) — **DoD** : idem pour les contributions Connect

---

[← Sommaire](README.md) · [← Précédent : Connect](04-connect.md) · [Suivant : Annexe — Risques →](99-annexe-risques.md)
