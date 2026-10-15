# PT06 — Lot B : primitives identité et MFA

**14 octobre 2026 — sept essais réussis ; PT06 non clos, IdP de production non qualifié.**

Primitives réellement exécutées : PBKDF2-HMAC-SHA256 avec sel aléatoire, vérification par compare_digest ; TOTP HMAC-SHA1 et troncature dynamique ; challenges et sessions aléatoires dont seules les empreintes sont stockées ; consommation atomique SQLite des challenges/compteurs/codes de récupération. Secrets et tokens non écrits dans les preuves.

| Cas | Expérience | Verdict |
|---|---|---|
| PT06-B01 | Six vecteurs TOTP SHA1 RFC6238, y compris après 2038 | PASS |
| PT06-B02 | Mot de passe et TOTP requis avant session | PASS |
| PT06-B03 | Compteur TOTP déjà utilisé refusé sur nouveau challenge | PASS |
| PT06-B04 | Challenge et session liés compte/appareil | PASS |
| PT06-B05 | Challenge expiré à égalité : refus | PASS |
| PT06-B06 | Code recovery concurrent : usage unique et contexte restreint | PASS |
| PT06-B07 | Fraîcheur sensible expirée et session révoquée : refus/re-auth | PASS |

Les six vecteurs SHA1 à huit chiffres sont vérifiés contre [RFC 6238, annexe B](https://www.rfc-editor.org/rfc/rfc6238#appendix-B). Le chemin de connexion utilise six chiffres et un pas de 30 secondes, temps injecté ; même compteur accepté une seule fois par compte, même avec un nouveau challenge. Un mot de passe correct seul ou un TOTP correct avec mauvais mot de passe ne crée pas de session.

Deux threads avec connexions SQLite distinctes tentent le même code de récupération ; un seul réussit, la consommation et la session sont commises ensemble. Ce contexte de récupération n’accorde pas une fraîcheur MFA pour action sensible. Challenge/session liés compte et appareil, expiration stricte et révocation contrôlées. Les durées/200000 itérations sont des paramètres du banc, pas une politique ratifiée. PBKDF2 utilise [hashlib](https://docs.python.org/3/library/hashlib.html#hashlib.pbkdf2_hmac).

Ce lot atteste des primitives et états de contrôle, pas un service MFA complet. Le générateur/prover et le vérificateur sont sur le même poste de test ; aucune possession d’un second appareil physique n’est démontrée. Seed TOTP en clair dans la base temporaire : protection des facteurs/enrollment/rotation/récupération à qualifier. Temps fiable, fenêtre de dérive, calibration KDF, politique de mots de passe et procédures humaines non livrés.

Pas montage HTTP avec A, TLS, rate-limit/anti-bruteforce, CSRF, résistance au phishing, récupération après PRA des compteurs/codes ou biométrie. TOTP n’a pas été remplacé par un booléen de fixture, mais ses tests ne qualifient pas le système d’identité de production.

Total PT06 : 15 essais A/B. [Résultats](RESULTATS_PT06_LOT_B.json), [banc](../../../spec/prototypes/pt06/README.md). Coût cloud nul. Lots C–F et réserves antérieures ouverts.
