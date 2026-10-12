# Modèle de référence exécutable — contrat d'autorisation GENIIUS

Spécification exécutable du [contrat d'autorisation V1.6](../../docs/GENIIUS_CONTRAT_AUTORISATION_V1.md) (décision F-5). Ce n'est pas le logiciel de production. En cas d'écart entre le texte et le modèle, **le texte prime** et l'écart est un constat.

**Baseline comportementale gelée le 12/10/2026 par le porteur.** Les huit justifications ont été acceptées après contrôles indépendants ; paramètres et limites restent réservés. [Procès-verbal et preuves](../../docs/AUDIT-MLD/DOSSIER_CLOTURE_AUTORISATIONS_V1_6.md). Le dictionnaire et le MLD restent candidats.

## Contenu

| Fichier | Rôle |
|---|---|
| `modele.py` | Le modèle : état, opérations du contrat, évaluation du § 14, observations du § 15, gel par liste d'opérations du § 10.6. Python 3.13, bibliothèque standard seulement. **Aucun outil de test** (en-tête du contrat). |
| `tests/outils.py` | Outils de test : observation par opérations publiques (`droits_de`, `pouvoirs_de`), transcriptions du texte (`frappe_existence`, `frappe_restriction`, `non_levable`), état jumeau « l'objet n'a jamais existé » (`jumeau_sans`) sur toutes les surfaces du § 15. |
| `tests/test_scenarios.py` | La batterie V1.6 : un test par scénario (S-01 à S-323). |
| `tests/test_attaques.py` | Les 20 attaques reproductibles du contrôle en aveugle A (V1.4), en 39 tests de non-régression. |
| `tests/test_controles_v15.py` | Les 13 scripts d'attaque du contrôle A (V1.5) et les témoins des mutations survivantes du contrôle B (V1.5), avec les attendus du texte V1.6. |
| `tests/test_proprietes.py` | Les invariants I-1 à I-14 (§ 4), sur des états générés et sur les transitions qui peuvent les violer. Les oracles n'appellent pas le modèle : ils passent par `outils.py`. Publie `tests/couverture_etats.json` (comptages par état, par invariant et par opération) et échoue si un état visé ou une transition du générateur n'est jamais atteint. |
| `tests/test_transitions.py` | Matrices d'états (§ 5), HI et HP, combinaisons et gel par liste, avec des oracles transcrits du texte. |
| `mutations/` | Banc de mutations : `mutations.py` (mutations de l'auteur M001 à M382 et mutations **indépendantes** du contrôle B, N01 à N53), `lancer.py`, `RESULTATS.md` (détection par origine), `JUSTIFICATIONS.md`. |
| `generer_batterie.py` | Génère `docs/AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_6.md` à partir des docstrings. |

## Exécution

Depuis la racine du dépôt :

```
python -m unittest discover -s spec/autorisation/tests -t spec/autorisation/tests
python spec/autorisation/mutations/lancer.py
python spec/autorisation/generer_batterie.py
```

Volume des tests de propriétés : `GENIIUS_GRAINES` (40 par défaut) et `GENIIUS_PAS` (50 par défaut). Le banc de mutations les ramène à 6 et 40, et pose `GENIIUS_SANS_COMPTAGE` : les exigences de couverture (états atteints, comptages minimaux) ne s'appliquent qu'au passage de référence, aux valeurs par défaut.

## Règles

- On ne modifie jamais la batterie Markdown à la main : on modifie le test, puis on régénère.
- Un test ne déduit jamais son attendu d'une fonction interne du modèle (critère de gel). Les sondes de `SondesEquivalences` lisent le modèle : ce sont des sondes de justification, pas des oracles.
- Une mutation survivante sur une règle de sécurité interdit le gel, sauf justification recevable (contrat, en-tête, H-6f) acceptée par le porteur (`mutations/JUSTIFICATIONS.md`).
- Le taux de détection des mutations indépendantes (N) est la mesure de référence ; celui des mutations de l'auteur ne prouve rien seul.
- La réussite des tests ne remplace pas le contrôle indépendant du texte.
