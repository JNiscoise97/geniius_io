# PT01 — Décision nécessaire sur la borne temporelle

13 octobre 2026. Option de contrôle final **ratifiée explicitement** par le porteur. [DC-AUTH-01](../04_CONTRAT_AUTORISATION/GENIIUS_AMENDEMENT_TEMPOREL_DC_AUTH_01.md) amende la référence V1.6/CDC V1.2 sans réécrire leurs baselines. PT01-L01 clos sur le périmètre réduit après treize scénarios SQL réussis ; SEC-01 reste à transposer au moteur complet et au MPD. Aucun gel d’architecture.

## Ce que les contre-épreuves établissent

La [campagne historique](preuves/historique/PT01_AVANT_ARBITRAGE/RESULTATS_PROTOTYPE_PT01.json) conserve dix scénarios réussis et deux contre-exemples. CE01 force le contrôle différé avec `SET CONSTRAINTS`, puis retarde le commit. CE02 laisse l'application en autocommit et injecte, par le propriétaire du banc, une pause après le contrôle. CE02 ne représente pas un privilège détenu par l'application : il éprouve l'intervalle où une pause serveur peut intervenir. La campagne de clôture selon l'arbitrage ratifié comprend treize scénarios.

Dans les deux cas, `contrôle < échéance <= horodatage du commit`. Enlever le contrôle transactionnel du client corrige un contournement explicite, mais ne suffit pas à garantir une échéance physique jusqu'à visibilité durable. Un timeout, un worker d'expiration ou une marge fixe ne constituent pas une preuve d'une borne dure sous pause du système.

Attention : `pg_xact_commit_timestamp` ne mesure pas l'instant de visibilité ni la fin du flush WAL. Dans le [code PostgreSQL 16, xact.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/access/transam/xact.c), le timestamp est établi lors de l'enregistrement du commit, avant la fin des opérations de durabilité et de libération transactionnelle. Le constat d'un timestamp déjà tardif suffit à réfuter le mécanisme testé ; un timestamp précoce ne prouverait pas à lui seul une visibilité précoce. Une certification après commit fondée sur ce timestamp ne résout donc pas automatiquement l'exigence actuelle.

## Option recommandée : instant logique d'autorisation finale

La rédaction ratifiée est :

> Pour une mutation, l'instant d'évaluation temporelle est l'instant serveur du contrôle final d'autorisation, effectué après acquisition de toutes les gardes et immédiatement avant la fin de la transaction. Tous les fondements nécessaires doivent être valides à cet instant. Les gardes d'autorité et d'agrégat restent détenues jusqu'au commit ou à l'abandon. La mutation ne produit aucun effet canonique ni résultat de succès avant commit. Une échéance survenant après ce contrôle final ne révoque pas rétroactivement cette mutation ; les opérations et divulgations suivantes réévaluent l'autorisation à leur propre instant. Une révocation concurrente est ordonnée par la garde canonique et devient effective à son commit.

Exemple déterminant : échéance 12:00:00, contrôle final 11:59:59.900, commit 12:00:00.100. La mutation peut être intégrée selon cette option ; une nouvelle lecture après 12:00:00 demeure refusée. Ce comportement est une modification explicite de la borne architecturelle actuelle, pas une garantie de commit avant échéance.

Le client HTTP ne pilote pas `BEGIN`, `SET CONSTRAINTS` ou `COMMIT`. Le Core possède la transaction et ne retourne un succès qu'après sa confirmation. Le contrôle final ne doit pas être une contrainte dont le client SQL peut déclencher prématurément l'exécution : l'interface d'écriture de production passe par le Core et son rôle technique n'est pas distribué aux clients. Le banc devra représenter ce propriétaire de transaction et séparer son rôle de celui du demandeur. Après conflit, rollback ou nouvelle tentative, reprendre toutes les validations et un nouvel instant ; aucune décision temporelle réutilisée.

Cette option ratifiée conserve l'atomicité version/activité/impact/outbox/reçu. Elle change le critère temporel ; elle exige donc une analyse de compatibilité avec A6/V1.6 et les documents gelés avant adoption. Elle est appliquée au banc par DC-AUTH-01 et son orchestrateur Core.

## Option alternative : conserver une borne physique stricte

Si aucune mutation ne doit devenir canonique après échéance, même validée avant, garder SEC-01 ouvert. Les primitives SQL testées ne satisfont pas cette garantie. Ne pas adopter une pseudo-correction par autocommit, trigger supplémentaire ou compensation après exposition.

Une architecture de préparation fermée puis publication contrôlée serait un autre chantier : tous les effets resteraient provisoires et inaccessibles, sans outbox exploitable ni reçu de succès, jusqu'à une preuve d'admissibilité. Il faudrait définir l'instant exact d'intégration, l'ordre des commandes et révocations, les conflits avec préparations pendantes, l'idempotence et la reprise après panne. Reporter le dernier contrôle avant un second commit déplace le même intervalle. Le timestamp PostgreSQL seul ne prouve pas la visibilité avant échéance. Cette piste n'est ni implémentée ni démontrée et ne permet pas de clore PT01 aujourd'hui.

## Conditions de clôture après décision

1. Ratifier le sens temporel retenu et identifier les clauses normatives à corriger, sans modification silencieuse des gels existants.
2. Adapter le protocole de transaction et les dix scénarios existants. Conserver CE01/CE02 dans l'historique des mécanismes rejetés.
3. Éprouver expiration avant/après le point retenu, client tentant une validation anticipée, rollback, perte de connexion, révocation concurrente, reprise et idempotence. Aucun état ou événement partiel ne doit être exposé.
4. Produire les résultats et empreintes de sources exécutées, puis reporter le verdict de portée réduite dans SEC-01 et le registre. Les autres garanties des prototypes PT02–PT06 restent distinctes.

Le porteur a approuvé l'exemple chiffré ci-dessus : « Oui, retenir l'instant du contrôle final et adapter le contrat et PT01 ». Le contrôle final est désormais explicite, exécuté par le Core avant COMMIT ; le trigger différé ne sert qu'à refuser un commit sans certificat. Le rôle technique SQL appartient au Core, pas au demandeur. Le test de pause après contrôle final est une injection de banc. Les quatre conditions de clôture ont été appliquées dans la portée réduite documentée par le rapport ; transposition MPD et preuves HTTP restent à réaliser.
