# GENIIUS — Alternatives technologiques et preuves de choix V0.1

**13 octobre 2026 — comparaison candidate, non gelée.** Le porteur fixe désormais 100 € par mois avant abonnements, premiers abonnements souhaités en décembre 2026, et achèvement des six prototypes avant lancement commercial. Le langage et l’hébergeur restent ouverts. Entrées : [déploiement](GENIIUS_DEPLOIEMENT_V0_1.md), [registre consolidé](GENIIUS_REGISTRE_DECISIONS_ARCHITECTURE_V0_1.md), dossiers SEC/SYN/PER/ASY et CDC V1.2. Les documentations officielles citées ont été consultées le 13/10/2026 ; versions finales, licences, contrats fournisseurs et coûts doivent être revérifiés à la sélection. Aucun produit n’est installé ou adopté par cette comparaison.

## 1. ADR-CORE-016 — Sélection par preuves, pas par score compensatoire

Une option qui échoue sur atomicité/versionnement, A6/non-divulgation, conservation/purge, récupération du patrimoine ou compatibilité est éliminée, même si moins chère ou plus rapide. Les autres critères comparent simplicité, compétences, exploitation, coût total, performances mesurées et réversibilité. Pas de note numérique ni de benchmark inventé. Les caractéristiques documentées ci-dessous ne prouvent pas la conformité de GENIIUS ; les priorités de prototype sont des inférences architecturales.

| Périmètre | Options candidates | Position de travail / preuve exigée |
|---|---|---|
| Base canonique | PostgreSQL géré ou exploité par l’équipe ; autre SGBD transactionnel avec démonstration du même MLD | **Prototyper PostgreSQL en premier**, cohérent avec la cible pressentie du MLD. Verrous, contraintes, CP et PRA à prouver ; ce n’est pas une décision de fournisseur ni de version. |
| Autorisations | M02 + défense données par politiques/vues/capacités ; couche données complémentaire plus étendue | Autorité M02 unique. Ne pas traduire V1.6 en simple filtre de tenant ; vérifier propriétaires techniques, chemins internes et sorties. |
| File de travail | Outbox/tâches dans base canonique + workers ; outbox + broker spécialisé | Commencer l’épreuve de durabilité/idempotence sur stockage relationnel, puis comparer isolation de charge/baux/équité ; un broker n’élimine ni outbox ni reçus métier. |
| Recherche | Recherche native de la base ; index spécialisé reconstructible | Prototyper graphe/filtrage et charge sur option native, ajouter moteur spécialisé uniquement si mesure/fonctions le justifient ; sécurité des facettes et rangs dans les deux cas. |
| Stockage documentaire | Service objet géré ; service objet compatible API exploité par l’équipe | Contrat de conservation, empreintes, purge, copies/clefs/PRA et domaines de panne ; compatibilité d’API n’implique pas garanties identiques. |
| Desktop | Tauri ; Electron | Deux candidats à éprouver sur Windows/macOS : fichiers/dossiers, gros imports, IPC, permissions, mise à jour, réplique chiffrée et horloge. Aucun vainqueur sans preuve SYN-04/06. |
| Persistance locale | SQLite avec mécanisme de chiffrement vérifié ; stockage local transactionnel alternatif | SQLite à éprouver pour réplique/journal séparés, migrations et durabilité ; nom SQLite/WAL seul ne prouve pas chiffrement ni anti-rollback. |
| Backend du monolithe | TypeScript, C#/.NET ou Python avec frontières/types/tests adaptés | Pas de priorité fondée sur les scripts Python de spécification. Comparer implémentation de T02/T03/T09, validation du MLD, migrations, outbox et exploitation avec compétences disponibles. |
| Web/Mobile | Web partagé avec couche Desktop dédiée ; Mobile natif ou framework multiplateforme | Parité non obligatoire ; les frameworks sont départagés par fonctions, accessibilité, mises à jour, stockage/temps et intégration OS. PWA seule ne satisfait pas l’exigence Desktop installé. |
| Identité/IA/observabilité/CI | Adaptateurs interchangeables et services gérés ou exploités | Passkeys/MFA, personne vs comptes, provenance/modèles, minimisation, secrets et exportabilité ; décisions explicites ultérieures, pas de dépendance propriétaire cachée. |

## 2. Faits techniques documentés et limites

**PostgreSQL.** La documentation décrit des verrous explicites, notamment `FOR SHARE` et `FOR UPDATE`, et leur durée transactionnelle ; elle décrit aussi les interblocages. Cela fournit des primitives candidates à SEC-01, sans prouver la garde de GENIIUS ni son point de divulgation. [Verrous explicites](https://www.postgresql.org/docs/current/explicit-locking.html).

Les politiques de sécurité de lignes nécessitent l’étude des propriétaires de tables, superutilisateurs et rôles de contournement ; leur présence ne démontre pas que toutes les voies de l’application sont protégées. La traduction M02 + défense données sera testée avec rôles applicatifs restreints et chemins de workers. [Politiques de lignes](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

L’archivage continu/PITR décrit une restauration de base dans le temps, pas la réconciliation automatique des purges et droits plus récents, ni la cohérence avec les médias. PER-03/07 demeure exigé. [Archivage/PITR](https://www.postgresql.org/docs/current/continuous-archiving.html). La recherche plein texte est documentée ; son adéquation aux langues, graphes et volumes de GENIIUS reste une mesure. [Recherche plein texte](https://www.postgresql.org/docs/current/textsearch.html).

**File/broker.** RabbitMQ est un exemple concret de broker candidat ; sa documentation distingue accusés consommateur et confirmations éditeur, qui ne prouvent pas le même événement. La transaction d’effet et le reçu d’idempotence restent donc des contrats de GENIIUS à démontrer. [Accusés et confirmations RabbitMQ](https://www.rabbitmq.com/docs/confirms).

**Stockage objet.** Amazon S3 est un exemple de service objet documenté, pas un fournisseur ratifié. Les contrats de chaque variante doivent préciser disponibilité, conservation, suppression, clés, restauration et coût des transferts ; une implémentation compatible API ne reçoit pas par analogie les garanties d’un autre service. [Présentation officielle S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html).

**Desktop.** Electron documente isolation de contexte, sandbox et validation des messages IPC, à intégrer au prototype. [Sécurité Electron](https://www.electronjs.org/docs/latest/tutorial/security). Tauri décrit des capacités et permissions pour les frontières de commandes ; le prototype doit configurer les périmètres réellement requis plutôt que donner un accès large. [Capacités Tauri](https://v2.tauri.app/security/capabilities/). Ces mécanismes ne démontrent pas une échéance hors ligne opposable ; SYN-04 demeure.

**Local.** SQLite WAL documente concurrence lecteurs/rédacteur mais un seul rédacteur à la fois ; WAL fait partie de l’état persistant à prendre en compte lors de sauvegarde/copie. Cela oriente la mesure et les procédures locales, sans preuve de performance pour nos volumes. [SQLite WAL](https://www.sqlite.org/wal.html). SQLite propose une extension de chiffrement distincte : la qualification du chiffrement et de sa licence fait partie du choix, et n’est pas obtenue par le seul choix de SQLite. [SQLite Encryption Extension](https://www.sqlite.org/see/doc/trunk/www/readme.wiki).

## 3. Ordre des prototypes de sélection

| ID | Prototype à produire | Conditions de verdict et options concernées |
|---|---|---|
| PT01 | Écriture/versionnement + révocation concurrente entre instances | T02/T03, AC01/02/03/07/08 ; droits/horloge/commit et rôle applicatif, sans garde locale. Base/autorisation/backend. |
| PT02 | Graphe/search/compteurs et cible cachée/absente | AC04/06/11, NF02/10 ; temps, facettes, UQ et cache. Recherche native puis spécialisée si justifiée. |
| PT03 | Réplique/journal chiffrés, panne et horloge | SY02/07/08/09/10 ; Windows/macOS et mobile cibles, migration/rollback/delta et échéance. Desktop/local/transport. |
| PT04 | Conservation + purge + reprise/PRA | PR01/02/05/06/07/08/10/12 ; base/médias/registres/secrets, RPO/RTO et récupération. Stockage/hébergement. |
| PT05 | Outbox/baux/générations et charge mixte | AS01/02/03/05/06/07/10/11/12 ; un effet, pas fausse complétude/famine, délai MPD-04 et coût. File/workers/capacité. |
| PT06 | Contrats API, livraison et récupération | API/compatibilité, ancien client, identité/MFA, déploiement/rollback, accessibilité et export patrimonial ; procédures et responsables. |

Les prototypes sont à réaliser, non exécutés. Chaque verdict est associé à version exacte des produits/libs, configuration, corpus et traces, incident/exclusion, compétences et coût. Les preuves des anciens scripts d’autorisation ne les remplacent pas. L’architecture ne sera pas gelée par la seule présence de cette liste.

## 4. Coût et compétences à expliciter

Comparer D01/D02 sur coût total : calcul API/workers + base/IO/historiques + médias/transferts + index + registres/reçus + sauvegardes/restaurations + clés/observabilité + licences + temps de maintenance/astreinte. Distinguer DEV/STAGING/PROD, nominal/pointe et exercice PRA. Les unités et hypothèses doivent être publiées ; aucune facture mensuelle fictive n’est donnée en l’absence de charge/capacité et contrat fournisseur.

L’absence de contrainte de langage/hébergeur ne décide pas les compétences d’une équipe future. Le budget limité rend prioritaire un banc local sans dépense cloud pour les prototypes ; un fournisseur payant ou un dépassement ne peut être engagé sans arbitrage explicite. La sélection du backend, du Mobile et du mode d’exploitation doit préciser qui peut livrer/maintenir/assurer la reprise. Le prototype peut être exploratoire sans engager tout le produit ; ses conclusions ne sont pas des nominations d’exploitation.

## 5. Bilan de sélection actuel

Les orientations de prototype sont explicites : base PostgreSQL et recherche native à éprouver en premier, outbox relationnelle de référence, comparaison Tauri/Electron et persistance locale chiffrée. Ce sont des préférences **candidates conditionnées aux preuves**, pas une pile gelée. Aucun hébergeur, version, framework ou file spécialisée n’est ratifié ; le plafond de 100 €/mois est imposé, sa ventilation et les coûts mesurés restent à définir. Les alternatives restent ouvertes lorsque les invariants échouent ou que les mesures/compétences justifient un autre choix.
