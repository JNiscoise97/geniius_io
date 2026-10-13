# Banc de mutations — justifications des survivantes (V1.6)

**Règle** (contrat V1.6, en-tête, H-6f). Une mutation survivante qui affecte une règle de sécurité interdit le gel, sauf justification **recevable**, **acceptée par le porteur**. Trois justifications sont recevables :
- l'**équivalence démontrée**, dans tout état atteignable ;
- la **défense redondante déclarée** : une autre règle du contrat, testée, la double dans tout état atteignable ;
- le **hors sécurité**.

Ne sont jamais recevables : « difficile à tester », « peu probable », « couvert en pratique », ni une survie due à un oracle qui n'observe pas le canal concerné.

**État au 12/10/2026.** `RESULTATS.md` : **252 mutations détectées sur 260**.
- Les **33 mutations indépendantes du contrôle B (N01 à N53) sont toutes détectées**.
- Les 8 survivantes sont des mutations de l'auteur, proposées ci-dessous comme **défenses redondantes** ou **équivalences**.
- Chacune a une démonstration écrite et une sonde dans `tests/test_proprietes.py` (classe `SondesEquivalences`). Ces sondes vérifient, à chaque transition des suites générées, que la condition supprimée ne peut pas servir.

**Ce qui a changé depuis la V1.5.** Le contrôle B avait réfuté M010 et M013 par deux contre-exemples :
- M010 : une admission différée était traitée après la bascule en `approbation préalable` ;
- M013 : une HI au profit d'un rôle de son propre espace ne demandait pas d'admission.

La V1.6 supprime ces deux mécanismes :
- H-6b remplace la bascule par une portée limitée, et le mode d'une habilitation ne change plus après sa création ;
- H-2a exige l'admission pour tout ensemble ouvert.

Les sondes du contrôle B sont devenues des tests de non-régression (`test_controles_v15.py`, `test_M010_admission_differee`, `test_M013_signataire_jamais_beneficiaire`). Elles réussissent avec le modèle et avec les mutants : c'est précisément ce que l'équivalence affirme. La démonstration ci-dessous a été examinée par les contrôles indépendants A/B de clôture V1.6.

**Les huit justifications sont acceptées par le porteur le 12/10/2026**, après contrôles indépendants A/B et rejeu des tests et mutations. Toute évolution du modèle impose un réexamen. Voir le [procès-verbal](../../../docs/04_CONTRAT_AUTORISATION/preuves/DOSSIER_CLOTURE_AUTORISATIONS_V1_6.md).

| Mutation | Règle | Justification proposée | Démonstration | Sonde | Décision du porteur |
|---|---|---|---|---|---|
| M010 | § 9.4 : pas d'admission automatique d'un gestionnaire de l'ensemble bénéficiaire | **Défense redondante déclarée** par le § 9.4 lui-même : la règle suivante (« gestionnaire de tout ensemble ouvert bénéficiaire d'une habilitation qui porte sur le même espace ») la contient. | Une admission automatique n'est prononcée que pour une habilitation active en `notification` (`_auto_admettre` le vérifie, différés compris). Cette habilitation figure donc parmi celles dont `_gestionnaires_exclus` réunit les gestionnaires. Le mode ne change plus après la création (V1.6 : plus de bascule), et l'exclusion est réévaluée au traitement d'un différé (H-6a). | `gestionnaires(h) ⊆ gestionnaires_exclus(E)` pour toute habilitation active en `notification` | Acceptée le 12/10/2026 |
| M013 | § 9.4 (G-2) : l'auteur ne bénéficie jamais de sa propre habilitation à un ensemble (contrôle à l'évaluation) | **Défense redondante déclarée** : le § 9.4 interdit aussi d'**admettre** l'auteur, « ni automatiquement ni manuellement ». | En V1.6, toute habilitation à un ensemble ouvert exige une admission (H-2a). Aucune voie ne crée d'admission de l'auteur (personne) : l'admission manuelle (`admettre`, M004/M005 détectées), l'automatique (`_auto_admettre`, M012 détectée par S-318) et la reprise au transfert (exclusion de K, auteur de la réémission). L'auteur d'une habilitation ne change jamais. | Aucune admission active dont l'acteur est l'auteur (personne) | Acceptée le 12/10/2026 |
| M032 | § 10.6 (G-3) : l'inclusion refuse les actions ou `repartager` ajoutés à un engagement | **Défense redondante déclarée** : le gel par liste du § 10.6 (H-4a). | Aucune opération n'ajoute d'action ni `repartager` à une habilitation existante. Seules la restriction (qui retire) et la clôture la modifient. | Pendant une fenêtre, les actions et `repartager` d'un engagement existant ne croissent pas | Acceptée le 12/10/2026 |
| M033 | § 10.6 (G-3) : l'inclusion refuse une échéance plus lointaine, un état plus fort, un mode plus ouvert | **Défense redondante déclarée** : le gel par liste. | Les seules opérations qui allongent une échéance (prolongation) ou renforcent un état (acceptation de nomination, levée d'examen) sont gelées pendant la fenêtre. Le mode ne change jamais (V1.6). L'expiration et la restriction ne font que réduire. | Pendant une fenêtre, échéance, état et mode d'un engagement existant ne croissent pas | Acceptée le 12/10/2026 |
| M104 | § 11.2 (G-10, F-03) : la désignation d'office exige le signalement du passage orphelin en cours | **Équivalence.** | Toute protection devient orpheline par la propagation, qui la signale dans la même écriture et à chaque passage (F-03, M377 détectée). Une protection orpheline est donc toujours signalée pour son passage en cours. La condition mutée (« signalée au moins une fois ») est alors toujours vraie quand l'originale l'est. | Toute protection orpheline porte le signalement de son passage | Acceptée le 12/10/2026 |
| M312 | § 13.11 (H-3b) : la copie reçoit, à sa création, la sensibilité de l'original | **Équivalence** (défense redondante interne). | La sensibilité d'une copie est évaluée dynamiquement sur tous ses ascendants (`_sensible`, M313 détectée). Un ascendant ne disparaît jamais de l'état : la purge le marque sans le retirer. L'attribut copié à la création n'ajoute donc rien. | Tout ascendant d'une copie reste présent dans l'état | Acceptée le 12/10/2026 |
| M330 | § 10.6 (H-4a) : l'inclusion refuse des fondateurs ajoutés | **Défense redondante déclarée** : le gel par liste. | On ne devient fondateur que par la prolongation ou la confirmation, toutes deux gelées pendant la fenêtre. Le retrait de fondement ne fait que réduire. | Pendant une fenêtre, les fondateurs d'un engagement existant ne croissent pas | Acceptée le 12/10/2026 |
| M331 | § 10.6 (H-4a) : l'inclusion refuse une effectivité accrue | **Défense redondante déclarée** : le gel par liste. | Une habilitation inopérante ne redevient effective que par : <br>• la levée d'un examen (gelée) ;<br>• un nouveau fondateur (gelé) ;<br>• une admission (manuelle gelée, automatique différée).<br>Aucune opération hors liste ne rend effective une HP inopérante. | Pendant une fenêtre, l'effectivité d'un engagement existant ne croît pas | Acceptée le 12/10/2026 |

**Remarque de méthode.** Les six défenses redondantes et les deux équivalences répètent dans le modèle ce que le contrat énonce deux fois (§ 9.4, § 10.6). Les retirer rendrait le banc « propre », mais affaiblirait la défense en profondeur si une opération future ouvrait l'un de ces cas. S-322 et S-323 en montrent un exemple réel : l'ajout de K à un groupe d'un **autre** espace n'est pas gelé, et seule l'inclusion le rattrape (M034 et M036, détectées grâce à eux). Le porteur a accepté ces justifications le 12/10/2026 pour la surface actuelle.
