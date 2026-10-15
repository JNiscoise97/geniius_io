# PT04 — Lot E : sauvegarde protégée et récupération

**14 octobre 2026 — six essais réussis ; PT04 non clos ; escrow et NF05 non qualifiés.**

Campagne UTC : 2026-10-14T10:01:42.352122+00:00 → 2026-10-14T10:01:47.091031+00:00. OS : Windows-11-10.0.26200-SP0.

Archive contenant un snapshot SQLite et un média synthétique, protégée par DPAPI utilisateur Windows avec entropie secrète aléatoire de 256 bits. Les processus de reprise reçoivent le secret par stdin ; aucun secret dans argv, fichier de clés ou preuve. Le parent garde le secret en mémoire : cette séparation n’est pas un magasin de récupération indépendant.

| Cas | Expérience | Verdict |
|---|---|---|
| PT04-E01 | Secret indisponible : refus puis récupération | PASS |
| PT04-E02 | Mauvais secret : refus puis secret correct | PASS |
| PT04-E03 | Sauvegarde altérée : refus puis copie saine | PASS |
| PT04-E04 | Manifeste extérieur incohérent : refus | PASS |
| PT04-E05 | Panne entre base et média : porte fermée puis reprise | PASS |
| PT04-E06 | Reprotection sous nouveau secret : ancien secret refusé par nouvelle archive | PASS |

La porte du superviseur est fermée avant lecture de sauvegarde. Le secret, le format et les empreintes du manifeste extérieur sont vérifiés avant publication ; SQLite quick_check est exécuté. Base et média restaurés séparément, puis mécanisme d’autorité du lot A réellement invoqué avant ouverture du superviseur. Une panne après restauration de la base laisse la porte extérieure fermée ; le rejeu termine le média et la réconciliation.

E06 reprotège la même archive sous un nouveau secret : l’ancien secret échoue sur la nouvelle archive ; l’ancienne archive reste réellement déchiffrable avec l’ancien secret. Aucune révocation globale, rotation de clés de production ou effacement cryptographique prouvé.

Profil Windows courant, pas autre machine/profil ni récupération après perte des clés du profil. La possession du secret injecté et du profil actuel suffit dans ce banc ; pas de procédure d’approbation, escrow, HSM ou authentification opérateur implémentés. Manifeste et checkpoint actuels sont fiables par fixture. Staging SQLite/media en clair durant reprise, pas d’effacement forensique mémoire/disque.

Portée documentaire : [CryptProtectData](https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptprotectdata) décrit la portée utilisateur et l’entropie optionnelle ; [CryptUnprotectData](https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptunprotectdata) exige l’entropie correspondante. Ces primitives ne remplacent pas une stratégie de récupération indépendante du profil.

Total PT04 : 33 essais A–E. RPO/RTO représentatifs, indépendance de l’autorité, stockage final et PER-01–07 restent ouverts. [Résultats](RESULTATS_PT04_LOT_E.json), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul.
