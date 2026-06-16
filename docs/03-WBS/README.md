# WBS — Geniius.io

Structure de découpage de projet (4 niveaux), périmètre complet, indépendant de l'avancement réel.

**Niveaux** : `0 Projet → 1 Programme/App → 2 Livrable → 3 Sous-livrable → 4 Composant`
Le programme global "Geniius.io" et chaque app sont traités comme des projets de niveau 1 ; leurs livrables sont en niveau 2.

Chaque maille porte une **Definition of Done (DoD)** propre — c'est la checklist à cocher au fil de l'avancement.

## Sommaire

| Fichier | Projet | Rôle dans la suite |
|---|---|---|
| [00-geniius-io-transverse.md](00-geniius-io-transverse.md) | Geniius.io (programme transverse) | Socle commun : modèle de données pivot, intégration inter-apps, infra, design system, RGPD, qualité, gouvernance |
| [01-tree.md](01-tree.md) | Tree | Arbre généalogique unifié — hub central de consultation |
| [02-journal.md](02-journal.md) | Journal | Agent de collecte de témoignages (personnes vivantes) |
| [03-rebond.md](03-rebond.md) | Rebond | Dépouillement d'archives historiques |
| [04-connect.md](04-connect.md) | Connect | Événementiel familial + collecte de connaissances familiales |
| [05-echo.md](05-echo.md) | Echo | Prototype offline-first — cadrage stratégique requis |
| [99-annexe-risques.md](99-annexe-risques.md) | — | Points critiques transverses / risques projet |

## Fil rouge des dépendances

```
ARCHIVES HISTORIQUES          PERSONNES VIVANTES
   (Rebond)                       (Connect, Journal)
        \                              /
         \                            /
          v                          v
              ARBRE FAMILIAL UNIFIÉ
                    (Tree)
```

Tout repose sur le socle transverse (00) : modèle pivot, identités sourcées, flux de propositions validées, RGPD.

## Comment lire ce WBS

- Chaque projet (00 à 05) commence par une **fiche projet** : description, définition, à quoi ça sert, pour qui, pourquoi c'est innovant, et la **DoD du projet**.
- Viennent ensuite les **livrables (niveau 2)**, chacun avec sa DoD.
- Chaque livrable se découpe en **sous-livrables (niveau 3)**, avec leur DoD.
- Chaque sous-livrable se découpe en **composants (niveau 4)**, chacun avec sa propre DoD — c'est la granularité actionnable.
- L'[annexe](99-annexe-risques.md) liste les risques transverses qui ne rentrent dans aucune app seule.
