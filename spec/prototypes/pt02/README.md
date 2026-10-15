# PT02 — Graphe visible, recherche et sorties HTTP

Banc synthétique réduit, Python standard + PostgreSQL en cache `postgres:16-alpine`. Réutilise les sessions/transactions de PT01 sans les modifier. HTTP limité à 127.0.0.1 sur port éphémère ; aucun déploiement, téléchargement d'image ou service payant. Conteneur unique PostgreSQL : réseau none, 512 Mio, un CPU, aucun port publié ni montage hôte, retrait à la fin sans toucher aux autres instances.

Depuis la racine, Docker Desktop actif :

```powershell
python spec/prototypes/pt02/run.py
python spec/prototypes/pt02/diagnose_latency.py
python spec/prototypes/pt02/report.py
python spec/prototypes/pt02/check_results.py
```

[Rapport](../../../docs/07_ARCHITECTURE/preuves/RAPPORT_PROTOTYPE_PT02.md), [résultats](../../../docs/07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT02.json). **37 scénarios** : FK/UQ, traduction SQL ciblée HI/HP/fondateurs/groupes/admissions/dérogations/protections de copies, comparaison à V1.6, projection admissible et fraîcheur. Le manifeste fixe avant mesure trois corpus jumeaux sur la même URL, avec concurrences 1 et 4, quatre connexions réutilisées et apprentissage/test séparés : 384 requêtes, en plus des 128 du diagnostic initial. Le diagnostic séparé SQL publie 24 blocs de 200 mesures par état, après chauffe, et trois contrôles de noyau à génération fraîche. [Portée des preuves](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT02_TRADUCTION_CAMPAGNE.md).

DC-AUTH-02 : portion engagée au contrôle final sous garde jusqu'à remise, suivante réévaluée. Borne de 4096 octets réservée au banc. La projection est compilée par le SQL depuis les faits sous garde exclusive, jamais depuis les décisions Python ; époque/instant/génération périmés entraînent un refus fermé. Le succès du runner signifie campagne achevée, **pas conformité globale NF10 ni clôture de PT02**.

Les pauses sont des injections de banc ; historique conservé. DC-AUTH-01 couvre les mutations, DC-AUTH-02 les lectures, sans borne physique d'arrêt à échéance. La traduction relationnelle porte sur voir, acteur/groupe et objet/contenu ; le MLD complet, accords de garde/indépendance complets, historique, identité HTTP, TLS/CDN/proxy, capacité, pannes du pool et remises bloquées restent réservés. Temps métier en jours du modèle, pas précision ratifiée pour la production. Le serveur HTTP standard et psql servent au banc ; aucune pile de production choisie.

## Variantes et clôture réduite

[Critères et protocole de recette NF10](../../../docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT02_CRITERES_CLOTURE.md). Douze tests complémentaires du modèle (sans SQL/HTTP) couvrent les variantes restantes ; leur preuve et leurs empreintes sont distinctes des 37 cas.

```powershell
python spec/prototypes/pt02/validate_scope.py
python spec/prototypes/pt02/validate_scope.py --verifier
```

La clôture réduite est actée le 13/10/2026 ; aucune qualification globale NF10 n’est déclarée.
