# PT03 — Lot E : chiffrement natif Windows

**Sept essais réussis, dont une contre-épreuve de fraîcheur ; PT03 non clos.**

Campagne UTC : 2026-10-13T13:05:34.788833+00:00 → 2026-10-13T13:05:35.566365+00:00. OS : Windows-11-10.0.26200-SP0.

Appels réels CryptProtectData/CryptUnprotectData via ctypes, portée utilisateur (aucun flag LOCAL_MACHINE), interface interdite et allocation Windows libérée par LocalFree. Windows gère les clés ; aucun fichier de clé applicative en clair n’est créé. Les fichiers ne contiennent que des blobs protégés synthétiques. Lecture dans des processus Python distincts.

| Cas | Expérience | Verdict du banc |
|---|---|---|
| PT03-E01 | DPAPI utilisateur : chiffrement et lecture dans un nouveau processus | PASS |
| PT03-E02 | Deux protections du même contenu produisent des blobs distincts | PASS |
| PT03-E03 | Blob corrompu : refus de déchiffrement | PASS |
| PT03-E04 | Contexte différent : refus avec entropie attendue différente | PASS |
| PT03-E05 | Blob tronqué : refus de déchiffrement | PASS |
| PT03-E06 | Suppression de réplique chiffrée sans perte du journal chiffré | PASS |
| PT03-E07 | Ancien blob valide rejoué : contre-exemple à la fraîcheur par DPAPI seule | PASS |

E07 est PASS parce que l’attendu est de constater la limite : restauration d’un ancien blob valide, acceptation et déchiffrement. **Ce n’est pas un succès anti-rollback.** Chiffrement et intégrité ne prouvent ni fraîcheur, ni échéance, ni retrait. L’ancrage temporel et la barrière du lot D restent nécessaires ; le montage complet D+E n’est pas encore éprouvé.

Le premier essai sous compte sandbox échouait avant chiffrement avec erreur Windows 2 ; [résultats conservés](historique/RESULTATS_PT03_LOT_E_SANDBOX_DPAPI_INDISPONIBLE.json). Le banc a ensuite été exécuté dans le profil Windows courant sur fichiers temporaires synthétiques, sans installation ou modification de configuration.

Autre contexte applicatif essayé par entropie différente : ce n’est pas une preuve d’isolation entre comptes Windows. Un processus du même utilisateur disposant du contexte peut appeler DPAPI. Aucun essai sous un deuxième compte OS, autre machine ou profil itinérant ; aucune récupération/migration du profil ou perte de clé éprouvée.

Petits enregistrements seulement : les bases SQLite des lots A–D ne sont pas devenues chiffrées. Pas de chiffrement global de base, rotation de clés, TPM, magasin multiplateforme, veille/hibernation ou redémarrage OS qualifiés. Les blobs corrompus choisis sont refusés ; ces essais ne constituent pas un audit exhaustif des entrées ou une preuve universelle d’intégrité.

Références primaires : [CryptProtectData](https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptprotectdata) précise la portée utilisateur, les flags et la gestion mémoire ; [CryptUnprotectData](https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptunprotectdata) décrit le contrôle d’intégrité et les limites des erreurs de corruption.

Total : 39 essais distincts A–E, incluant E07 comme contre-épreuve documentée. Lot F non exécuté ; qualifications E restantes et SYN-01–07 ouverts. Coût cloud nul. [Résultats](RESULTATS_PT03_LOT_E.json), [banc](../../../spec/prototypes/pt03/README.md).
