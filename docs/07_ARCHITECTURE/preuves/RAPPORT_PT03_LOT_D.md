# PT03 — Lot D : borne temporelle et fermeture sûre

**Onze scénarios réussis ; PT03 partiel, non clos. Horloge OS non qualifiée.**

Campagne UTC : 2026-10-13T13:02:13.420400+00:00 → 2026-10-13T13:02:14.529952+00:00. OS hôte : Windows-11-10.0.26200-SP0.

Banc à temps injecté en unités entières synthétiques : U0 = Ts + aller-retour + incertitude ; U = U0 + temps monotone écoulé + dérive arrondie vers le haut. Accès seulement si U < échéance et continuité, contexte et bornes valides. L’heure murale ne participe pas au calcul. Ancrage en mémoire uniquement ; fermeture persistée à toute discontinuité ou reprise sans ancrage.

| Cas | Expérience | Verdict |
|---|---|---|
| PT03-D01 | Recul de l’heure murale sans prolongement | PASS |
| PT03-D02 | Borne stricte : dernière unité admise puis égalité refusée | PASS |
| PT03-D03 | Pause couverte par monotone : échéance opposable | PASS |
| PT03-D04 | Veille de continuité inconnue : fermeture persistante | PASS |
| PT03-D05 | Recul du monotone après lecture : fermeture | PASS |
| PT03-D06 | Renouvellement non authentifié après expiration refusé | PASS |
| PT03-D07 | Validité de la borne de dérive dépassée : fermeture | PASS |
| PT03-D08 | Nouveau processus : ancrage mémoire absent | PASS |
| PT03-D09 | Snapshot SQLite restauré : aucun ancrage recréé | PASS |
| PT03-D10 | Borne de dérive inconnue : ancrage refusé | PASS |
| PT03-D11 | Ancrage d’un autre compte refusé | PASS |

Le journal privé, dans un fichier distinct de la réplique, reste inchangé dans tous les cas. La barrière ferme aussi les lectures de dérivés. La réplique est conservée physiquement ; la preuve porte sur le refus de consultation par le client conforme, pas sur un effacement sécurisé.

D08 lance réellement un nouveau processus qui ne possède aucun ancrage mémoire et ferme une barrière précédemment ouverte. D09 restaure réellement un snapshot SQLite de réplique, puis démarre un nouvel évaluateur qui ne reconstruit pas un ancrage depuis cette base. Un snapshot complet de VM avec mémoire, un terminal compromis ou un accès direct au fichier ne sont pas couverts.

Veille, durée écoulée, bornes de dérive/incertitude, identité et authentification sont injectées. Aucun test de veille/hibernation ou de redémarrage OS réel, aucune preuve d’horloge sécurisée. Le choix prudent ferme après redémarrage du processus ; la consultation hors ligne continue après redémarrage n’est pas promise. La valeur numérique du banc ne fixe aucune durée ou précision produit.

Pas de chiffrement ni magasin de clés ; lots E/F et SYN-01–07 restent ouverts. Total : 32 essais PT03 distincts (A : 8 ; B : 6 ; C : 7 ; D : 11). Le résidu de révocation après déconnexion demeure déclaré.

[Résultats et traces](RESULTATS_PT03_LOT_D.json), [banc](../../../spec/prototypes/pt03/README.md). Coût cloud nul.
