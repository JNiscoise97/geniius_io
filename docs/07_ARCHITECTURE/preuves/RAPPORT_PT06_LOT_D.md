# PT06 — Lot D : accessibilité d’un parcours réel de banc

**14 octobre 2026 — six essais navigateur réussis ; PT06 non clos ; conformité WCAG globale non qualifiée.**

Navigateur : Chrome/155.0.8059.40. OS : Windows-11-10.0.26200-SP0.

Page HTML réelle servie sur 127.0.0.1, Chromium headless avec profil temporaire dédié, clavier via CDP et arbre d’accessibilité du navigateur. Le formulaire poste réellement à l’API A et reçoit un accusé technique durable. Aucun framework de production choisi.

| Cas | Observation | Verdict |
|---|---|---|
| PT06-D01 | Noms et rôles dans arbre d’accessibilité | PASS |
| PT06-D02 | Ordre clavier et focus matérialisé | PASS |
| PT06-D03 | Erreur annoncée structurellement et focus sur résumé | PASS |
| PT06-D04 | Dépôt au clavier et statut de réception | PASS |
| PT06-D05 | Refus API : erreur et texte local conservé | PASS |
| PT06-D06 | Reflow à largeur 320 CSS px | PASS |

L’arbre AX expose noms/rôles des champs et du bouton. Tab suit le lien d’évitement, référence, texte et bouton ; outline calculé 3 px. Entrée valide puis envoie, erreur focus sur résumé role=alert, champs aria-invalid, réussite role=status/aria-live=polite. Après révocation de session, refus API et texte de l’auteur conservé dans localStorage de fixture. Reflow à largeur 320 CSS px sans débordement horizontal observé.

Le premier navigateur sandbox expirait sur Page.enable ; résultat conservé dans l’historique. Le deuxième essai révélait des événements Entrée incomplets dans le harnais ; correction rawKeyDown/char/keyUp et rejeu, sans modification du formulaire pour masquer l’échec. Résultats historiques conservés. Des connexions auxiliaires interrompues par le navigateur ont produit des resets serveur ; les requêtes du parcours ont été vérifiées par leur effet durable et leur affichage.

Aucun lecteur d’écran NVDA/JAWS/VoiceOver testé : rôle/live dans AX ne prouvent pas annonce sonore ou ordre de lecture effectif. Clavier injecté par CDP, pas observation utilisateur ; focus/contraste global, zoom, modalités mobiles, erreurs réseau complètes et toutes les pages non qualifiés. La règle CSS et ses styles calculés ne suffisent pas à certifier tous les critères WCAG.

Page locale unique, tokens et endpoint de révocation de test ; localStorage clair pour texte synthétique seulement. Ce stockage n’est pas une preuve du journal chiffré du client produit, et le parcours ne qualifie pas MFA/TLS. [Focus visible, W3C](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) et [messages de statut, W3C](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) expliquent les exigences prises comme référence ; aucune conformité globale déduite.

Total PT06 : 28 essais A–D. [Résultats et observations](RESULTATS_PT06_LOT_D.json), [page de banc](../../../spec/prototypes/pt06/accessibility.html), [commandes](../../../spec/prototypes/pt06/README.md). Profil navigateur et fichiers temporaires retirés ; coût cloud nul.
