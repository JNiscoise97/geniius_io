# PT01 — Écritures, contrôle final et révocations concurrentes

Treize scénarios PostgreSQL réels sur corpus synthétique réduit. [Protocole Core](PROTOCOL.md), [amendement ratifié DC-AUTH-01](../../../docs/04_CONTRAT_AUTORISATION/GENIIUS_AMENDEMENT_TEMPOREL_DC_AUTH_01.md), [rapport et portée de clôture](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PROTOTYPE_PT01.md).

Depuis la racine, Docker Desktop démarré :

```powershell
python spec/prototypes/pt01/run.py --image postgres:16-alpine
python spec/prototypes/pt01/report.py
python spec/prototypes/pt01/check_results.py
```

Utilise l'image en cache, sans téléchargement automatique. PostgreSQL 16.14 exécuté ; aucune preuve PostgreSQL 18 ni pile de production ratifiée. Python standard sur l'hôte, psql dans le conteneur. Conteneur unique retiré en fin de banc, réseau none, aucun port publié ni montage hôte, 512 Mio et un CPU. Aucun autre service n'est modifié ; coût cloud 0 €. Authentification par socket sur données synthétiques, pas configuration de production.

Le contrôle final est une instruction explicite du Core sous les gardes conservées jusqu'au commit. Le trigger différé refuse un certificat absent ; il ne définit pas l'instant temporel. Un commit après expiration est admissible si le contrôle final a précédé l'échéance, selon l'arbitrage du porteur du 13/10/2026. Aucun succès client avant commit. Les contre-épreuves initiales sont conservées dans l'historique des preuves.

Les scénarios utilisent plusieurs processus psql et observent réellement les blocages PostgreSQL. La transposition au moteur complet et au MPD reste à effectuer ; API HTTP, famine, non-divulgation temporelle, capacité et PRA relèvent d'autres preuves.
