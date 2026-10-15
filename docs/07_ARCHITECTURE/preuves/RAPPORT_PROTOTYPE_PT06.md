# PT06 — Lot A : contrats API et compatibilité

**14 octobre 2026 — huit essais réussis ; PT06 partiel, non clos.**

Serveur HTTP standard sur 127.0.0.1/port éphémère, requêtes via socket et effets SQLite WAL/FULL. Garde globale conservée pour les GET jusqu’à remise des en-têtes/corps ; réception technique commise avant accusé 202. Aucun objet canonique intégré dans ce lot.

| Cas | Expérience | Verdict |
|---|---|---|
| PT06-A01 | Opération inconnue : refus sans effet | PASS |
| PT06-A02 | Enveloppe/JSON/champ inconnu : refus | PASS |
| PT06-A03 | Réception répétée et origine conflictuelle | PASS |
| PT06-A04 | Cible cachée/absente : mêmes sorties HTTP | PASS |
| PT06-A05 | Mauvais compte/appareil : cible introuvable | PASS |
| PT06-A06 | Ancien client : ajouts refusés mais réception sûre | PASS |
| PT06-A07 | Conversion versionnée ou ambiguïté en attente | PASS |
| PT06-A08 | Session révoquée entre requêtes : recontrôle | PASS |

Cible cachée et absente ont le même statut, les mêmes en-têtes et le même corps ; mauvais contexte compte/appareil ne révèle pas la cible. Les refus d’enveloppe/opération ne créent pas de reçu. Réception répétée garde un reçu ; même origine avec autre contenu retourne conflit sans remplacement. 202 confirme seulement la réception, jamais intégration ou validation scientifique.

Client version 1 : réplique refusée, dépôt de format sûr accepté ; fichier témoin du journal local conservé. Conversion synthétique v1→v2 trace le convertisseur et conserve l’enveloppe originale ; concept ambigu en attente sans décision automatique. Session active vérifiée à chaque requête.

Tokens, personnes/appareils et X-Client-Version de fixture : pas validation d’authentification, MFA ou négociation sécurisée. Ancien client prétendant une capacité fausse, TLS/proxy, attaques réseau, rôles/MLD complets et confidentialité temporelle NF10 restent réservés. Conservation d’un fichier témoin n’atteste pas une récupération authentifiée des deltas ou un client local implémenté. Valeurs 1/2/4096 sont réservées au banc.

[Résultats et sorties HTTP](RESULTATS_PROTOTYPE_PT06.json), [banc](../../../spec/prototypes/pt06/README.md). Coût cloud nul. Lots B–F non exécutés ; aucun gel ou choix de pile.
