# PT05 — Lot C : autorité et effet externe incertain

**14 octobre 2026 — six essais réussis ; PT05 non clos ; aucun prestataire réel qualifié.**

Prestataire synthétique dans une base SQLite distincte, appels dans des processus distincts. Aucun message ni paiement réel envoyé. Opération uncertain persistée avant sortie, effet prestataire commis avant perte simulée d’accusé par os._exit, réconciliation avant clôture locale.

| Cas | Expérience | Verdict |
|---|---|---|
| PT05-C01 | Autorité retirée avant sortie : aucun effet externe | PASS |
| PT05-C02 | Accusé perdu : recherche du résultat sans nouvelle exécution | PASS |
| PT05-C03 | Accusé perdu : même clé idempotente, un effet | PASS |
| PT05-C04 | Sans recherche/idempotence : état incertain, pas relance aveugle | PASS |
| PT05-C05 | Autorité retirée après effet externe : intégration locale refusée | PASS |
| PT05-C06 | Même clé avec autre contenu : conflit prestataire | PASS |

Mode search : retrouver le résultat existant sans réexécution. Mode idempotent : reprendre avec la même clé et le même contenu ; prestataire refuse un contenu différent. Résultat confirmé et rejeu local ne provoquent aucune sortie supplémentaire. Sans recherche/idempotence, l’état reste incertain et manual_required : un état privé récupérable, pas un succès ni une relance automatique.

Retrait avant sortie : aucun effet. Retrait après commit externe : le fait externe est conservé et confirmé en privé, mais l’intégration et la consultation locales sont refusées. Une révocation n’annule pas un effet déjà exécuté à l’extérieur. Compensation, récupération et finalité de prestataire sont des contrats supplémentaires.

Autorité booléenne et séquences déterministes : pas contrôle concurrent de remise réseau, moteur complet d’autorisations ou fournisseur réel. Résultat de recherche supposé fiable/durable ; eventual consistency, disparition du résultat, rétention/expiration des clés et workflow opérateur non qualifiés. Aucune promesse générale d’effet externe unique sans contrat prestataire. PR11/ASY-05 restent ouverts à recette.

Total PT05 : 21 essais A–C. [Résultats et traces](RESULTATS_PT05_LOT_C.json), [banc](../../../spec/prototypes/pt05/README.md). Coût cloud nul.
