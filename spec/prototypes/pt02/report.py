"""Rapport PT02 depuis les seuls résultats effectivement enregistrés."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'
def main():
    path=DIR/'RESULTATS_PROTOTYPE_PT02.json'
    d=json.loads(path.read_text(encoding='utf-8'))
    decision_path=DIR/'DECISION_CLOTURE_PT02.json'
    decision=json.loads(decision_path.read_text(encoding='utf-8'))
    closed=decision['PT02_clos_perimetre_reduit']
    assert closed and not decision['NF10_qualifie'] and not decision['architecture_gelee']
    assert all(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest
               for name,digest in decision['sha256_preuves'].items()), 'Preuves de clôture modifiées'
    good=sum(c['statut']=='PASS' for c in d['cases'])
    source_matches={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h for name,h in d['sha256_sources'].items()}
    out=['# PT02 — Graphe visible, recherche et remise HTTP','',
         f'**Verdict expérimental : {d["verdict"]}. {good}/{len(d["cases"])} scénarios réussis ; PT02 clos sur son périmètre réduit.**','',
         'Décision du porteur du 13/10/2026 : [critères C1–C8](../GENIIUS_ARCHITECTURE_PT02_CRITERES_CLOTURE.md), [preuve de décision](DECISION_CLOTURE_PT02.json). Douze tests complémentaires du modèle réussis ; qualification globale NF10 et recette Core/MPD réservées. Les résultats bruts conservent leur verdict de campagne antérieur à cette décision.','',
         f'- Campagne UTC : {d["started_utc"]} → {d["ended_utc"]}.',
         f'- Serveur : {d["metadata"].get("postgresql_version")}.',
         f'- Image : {d["metadata"].get("image_id")}.',
         f'- HTTP réel sur {d["metadata"].get("http_bind")}:{d["metadata"].get("http_port")}, client standard Python.',
         f'- Conteneur retiré : {d["metadata"].get("container_removed")}. PostgreSQL sans réseau externe, port publié ni montage hôte.',
         '- Coût cloud engagé : 0 €. Budget de 100 €/mois avant abonnements conservé.',
         '- [Résultats HTTP/SQL et sources](RESULTATS_PROTOTYPE_PT02.json). [Banc](../../../spec/prototypes/pt02/README.md).','',
         'PT02 conserve le périmètre du registre (graphe/search/compteurs/caché-absent) et ajoute les essais de sortie annoncés : pages, flux, cache, URL et succès après commit. Les gardes et transactions sont réellement exécutées dans PostgreSQL ; les réponses passent par une socket HTTP loopback.','',
         '| Cas | Objet | Verdict |','|---|---|---|']
    for c in d['cases']:
        out.append(f'| {c["id"]} | {c["objet"]} | {c["statut"]} |')
        if c['erreur']:out.append('\nIncident : '+c['erreur'])
    if d['fatal']:out+=['','Incident de campagne : '+d['fatal']]
    out+=['','## Résolution temporelle ratifiée','',
          '[DC-AUTH-02](../../04_CONTRAT_AUTORISATION/GENIIUS_AMENDEMENT_LECTURES_DC_AUTH_02.md) définit l’engagement de chaque portion au contrôle final serveur sous garde jusqu’à remise. Le rendu et tous ses compteurs utilisent un instant canonique unique. Une portion déjà engagée peut être remise après échéance ; chaque nouvelle requête/portion est réévaluée. Aucune borne physique d’arrêt à échéance n’est revendiquée. Les en-têtes de succès du flux sont émis sous la garde de la première portion, après son contrôle.', '',
          'PT02-15 et PT02-16 injectent une pause après contrôle, constatent l’expiration côté PostgreSQL et la remise HTTP tardive, puis vérifient le refus de la requête/portion suivante. La pause est réservée au banc.']
    for c in d['cases']:
        if c['id'] not in ('PT02-15','PT02-16'):continue
        out+=['',c['id']+' :']
        for t in c['http_traces']:
            if t['phase']=='evaluation_sql':out.append(f'- Contrôle : {t["checked_at"]}, échéance : {t["expires_at"]}, autorisé : {t["authorized"]}.')
            if t['phase']=='echeance_depassee_avant_transport':out.append(f'- Horloge serveur avant remise tardive : {t["server_time"]}.')
    out+=['', '[CE01 historique](historique/RESULTATS_PROTOTYPE_PT02_AVANT_DC_AUTH_02.json) reste un échec de la borne physique remplacée, sans reclassement rétroactif. [Dossier temporel](../GENIIUS_ARCHITECTURE_PT02_SORTIE_TEMPORELLE.md). Le constat temporel est résolu selon la règle ratifiée ; SEC-03 garde ses réserves de transposition et de remise bloquée.']
    durations=[e['duration_ns']/1_000_000 for c in d['cases'] if c['id']=='PT02-14' for e in c['http_traces'] if e['phase']=='recu_client']
    out+=['','## Délais et non-divulgation','',
          f'{len(durations)} requêtes appariées, ordre mélangé avec graine 20261013 ; délais complets consignés dans les traces. Cette petite campagne explore les délais, sans seuil statistique de conformité NF10 ni inférence d’équivalence. Statut, corps et en-têtes identiques sont éprouvés ; les délais indistinguables restent à démontrer par le protocole MPD-03.', '',
          '## Mécanisme et portée','',
          'Le rendu SQL reconstruit le graphe admissible avant pagination, compteurs, facettes et suggestions. La protection du parent ferme sa copie. Un cache préparé est une donnée provisoire, jamais une permission : avant sortie, le rendu est recalculé depuis l’autorité canonique. Une protection nouvelle devient opposable malgré ce cache ancien. Chaque portion de flux utilise une nouvelle transaction et une nouvelle évaluation ; après révocation, la deuxième portion n’est pas émise. Une URL connue ne conserve aucun accès autonome.','',
          'La garde partagée est conservée jusqu’à wfile.write/flush puis commit. PT02-07 observe un révocateur réellement bloqué ; les octets antérieurs à sa prise d’effet restent reçus, la requête suivante est refusée. Ce point de remise est celui de l’appel socket serveur, pas l’instant de réception réseau ; les noyaux/proxies/CDN ne sont pas simulés. Les en-têtes puis le corps sont des remises distinctes ; la contre-épreuve ne les prétend pas atomiques.', '',
          'Le chemin mutation utilise le protocole PT01 : aucun effet visible depuis une autre connexion avant commit et aucun HTTP de succès avant sa confirmation. Un échec du contrôle final de commit annule tous les effets et répond introuvable.', '',
          *['- '+v for v in d['limites']], '',
          '## Suites nécessaires','',
          'Le choix temporel DC-AUTH-02 est ratifié et éprouvé sur ce banc. Compléter UQ, graphe complet, compteurs/rangs de production et campagne statistique NF10/MPD-03 avant clôture globale PT02. Dimensionnement des portions, traitement des remises bloquées, proxy/CDN/stockage et Core réel restent à éprouver. La borne de 4096 octets est seulement un paramètre de banc. Aucun gel d’architecture ni choix de pile.', '',
          '## Sources techniques','',
          '[Verrous PostgreSQL](https://www.postgresql.org/docs/16/explicit-locking.html), [serveur HTTP Python](https://docs.python.org/3/library/http.server.html). Le serveur standard sert seulement au banc ; sa documentation ne le recommande pas pour la production. Les preuves de ce rapport sont les résultats enregistrés.','']
    diagnostics=[t['result'] for c in d['cases'] for t in c['http_traces'] if t['phase']=='diagnostic_statistique']
    out+=['## Extension FK/UQ et moteur de référence','',
          'PT02-17 refuse une collision cachée réelle et une référence absente avant FK/UQ avec les mêmes sorties HTTP. PT02-18 crée un lien visible puis retourne un conflit visible ; PT02-19 soumet deux créations concurrentes et constate un seul lien, une création et un conflit. Le dernier contrôle temporel de la mutation suit sa préparation et précède le commit. Ce rôle SQL est technique ; les droits métier d’édition des liens ne sont pas modélisés par ce fixture.', '',
          'PT02-20 à 22 appellent le module de référence V1.6 sans le modifier, à travers une frontière HTTP sous garde SQL. Les attentes sont explicites : rôles scientifiques voient l’objet scientifique, administrateur/autorité/invité ne gagnent aucun droit implicite, le titulaire voit son objet personnel et RS2 voit l’objet de son autre espace. L’état métier est le fixture Python du modèle ; aucune transposition relationnelle complète du moteur n’est prétendue. Cette intégration ne remplace pas la batterie exhaustive amont.', '',
          '## Diagnostic statistique renforcé','',
          '| Concurrence | Paires | Médiane caché ms | Médiane absent ms | p permutation exploratoire | Classifieur test |',
          '|---|---|---|---|---|---|']
    for v in diagnostics:
        out.append(f'| {v["concurrency"]} | {v["pairs"]} | {v["hidden_median_ms"]:.3f} | {v["absent_median_ms"]:.3f} | {v["permutation_p_exploratory"]:.4f} | {v["classifier_correct"]}/{v["classifier_test_observations"]} |')
    out+=['', 'PT02-23 exécute 128 requêtes appariées sous concurrences 1 et 4. L’ordre est mélangé avec une graine publiée. Un classifieur de latence est appris sur 16 paires et évalué sur 16 autres par palier ; un test de permutation par changement de signe des différences utilise 1999 tirages. Aucun seuil produit ni tolérance de fuite n’est adopté. Un p élevé ne prouve pas équivalence ; ces petites séries, les dépendances sous charge et le coût de lancement psql/Docker ne représentent pas une API de production. Toute différence doit être examinée, sans conclure automatiquement à sa cause ni à une fuite exploitable.', '',
          '[Protocole et constats restants](../GENIIUS_ARCHITECTURE_PT02_UQ_GRAPHE_STATISTIQUES.md). [Principe des permutations appariées](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.permutation_test.html) : implémentation stdlib dans ce banc, sans dépendance SciPy.', '']
    out+=['## Traduction relationnelle ciblée','',
          'PT02-24 à 33 utilisent des tables PostgreSQL de faits (acteurs/personnes, objets, habilitations, fondateurs, membres, admissions, protections et dérogations), exportées depuis des états synthétiques du modèle. Aucune décision d’accès précalculée n’est stockée. Le SQL calcule les droits, dont les chaînes HP récursives, puis produit la sortie HTTP sous garde canonique. Chaque comparaison confronte un attendu explicite, le modèle de référence et le résultat SQL/HTTP.', '',
          'Les essais prouvent HI survivant au signataire, HP coupée malgré une projection dépendante active, admission requise pour un groupe, retrait/réentrée sans résurrection, échéance opposable malgré état actif, bénéficiaire par personne sur deux comptes, finalité/échéance/niveau actuel d’approbation de dérogation, protection héritée conservée après levée origine, non-levable sur ascendant purgé et refus sur ascendant manquant.', '',
          'Portée ciblée : action voir, périmètres objet/contenu et bénéficiaires acteur/groupe. Temps métier en jours du corpus canonique, distinct de la preuve d’horloge réelle PT02-15/16. Les commandes métier d’émission, gouvernance et modification ne sont pas réimplémentées : le modèle construit les fixtures et leur chargement atomique est protégé par la garde exclusive. Les dérogations de ce corpus ne franchissent aucune protection interne ; approbations multiples/accords de garde, restrictions légales, successions et autres surfaces non éprouvées restent réservées. Le MLD complet n’est pas livré par ce banc.', '',
          '## Campagne préspécifiée sur états jumeaux','',
          'Le [manifeste](../../../spec/prototypes/pt02/nf10_campaign.json) est fixé avant exécution. PT02-34 compare la même URL et le même acteur dans les états caché/absent construits par jumeau_sans du corpus V1.6. Trois familles : objet personnel caché, HP rompue et copie protégée ; concurrences 1 et 4 ; 32 paires par famille/palier, soit 384 requêtes supplémentaires. Statut/corps/en-têtes sont comparés ; ordre des deux états mélangé par bloc. Aucun critère de conformité statistique ni tolérance de fuite adopté.', '',
          '| Famille | Concurrence | Paires | p exploratoire | Classifieur test |', '|---|---|---|---|---|']
    for c in d['cases']:
        for t in c['http_traces']:
            if t['phase']=='diagnostic_jumeaux':
                v=t['result']
                out.append(f'| {v["family"]} | {v["concurrency"]} | {v["pairs"]} | {v["permutation_p_exploratory"]:.4f} | {v["classifier_correct"]}/{v["classifier_test_observations"]} |')
    out+=['', 'Les p exploratoires et classifications décrivent cette campagne ; une différence observée exige investigation et une absence détectée ne démontre pas équivalence. Les corrélations de blocs, dérives, création de processus et petits corpus sont documentés. [Protocole et clôtures ciblées](../GENIIUS_ARCHITECTURE_PT02_TRADUCTION_CAMPAGNE.md). Aucun verdict global NF10, PT02 ou architecture.', '']
    out+=['## Correction candidate des chemins de refus','',
          'Les résultats [avant projection admissible](historique/RESULTATS_PROTOTYPE_PT02_AVANT_PROJECTION_ADMISSIBLE.json) ont motivé un [diagnostic SQL séparé](historique/DIAGNOSTIC_SQL_LATENCE_PT02_AVANT_PROJECTION_ADMISSIBLE.json). La variante initiale quittait tôt sur une cible absente et parcourait davantage de fondements pour une cible cachée. Le diagnostic serveur constate un coût médian supérieur pour caché dans 12/12 blocs sur les deux familles étudiées ; ce constat ne démontre pas à lui seul une exploitation HTTP.', '',
          'La variante candidate compile les clés admissibles par le calcul SQL, sans importer les décisions Python. Faits, époque et génération sont publiés atomiquement sous garde exclusive. La lecture contrôle époque et jour canonique, puis consulte seulement la clé admissible avant toute lecture de contenu. Génération ou instant périmés : refus fermé. PT02-35/36 éprouvent ces refus, PT02-35 la restauration après compilation, PT02-37 les privilèges du lecteur.', '',
          'Cette projection exhaustive appartient au corpus de banc. Coût de compilation, dimensionnement, mises à jour incrémentales, qualification temporelle au MPD, chemins de mutation et autres surfaces restent à éprouver ; ce n’est ni une tolérance de fuite ni un mécanisme d’égalisation par délai. [Diagnostic SQL après correction](DIAGNOSTIC_SQL_LATENCE_PT02.json), lorsqu’exécuté. La campagne rejouée demeure diagnostique, sans qualification NF10.', '']
    diagnosis=json.loads((DIR/'DIAGNOSTIC_SQL_LATENCE_PT02.json').read_text(encoding='utf-8'))
    import statistics
    out+=['## Mesure SQL séparée après correction','',
          'Quatre connexions SQL sont réutilisées par HTTP ; le démarrage de Docker/psql ne fait plus partie de chaque requête. Le manifeste DIAGNOSTIC-03 consigne ce changement avant mesure. Résultats précédents conservés dans l’historique.', '',
          '| Famille | Médiane de blocs caché ms | Médiane de blocs absent ms |', '|---|---|---|']
    for family in ('personnel_cache','hp_rompue'):
        blocks=[v for v in diagnosis['results'] if v['family']==family]
        if blocks:out.append(f'| {family} | {statistics.median(v["hidden_median_ms"] for v in blocks):.6f} | {statistics.median(v["absent_median_ms"] for v in blocks):.6f} |')
    out+=['', 'Le diagnostic inclut trois contrôles du noyau à génération fraîche : HP sans fondement, HI expirée, ascendant absent ; calcul direct et rendu projeté refusent. Les différences initiales sont réduites sur ce corpus. Ces mesures ne démontrent pas l’équivalence ni la conformité NF10.', '']
    report=DIR/'RAPPORT_PROTOTYPE_PT02.md'
    report.write_text('\n'.join(out),encoding='utf-8')
    files=[path,report,HERE/'report.py',HERE/'check_results.py',DIR/'DIAGNOSTIC_SQL_LATENCE_PT02.json',ROOT/'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT02_SORTIE_TEMPORELLE.md',ROOT/'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT02_UQ_GRAPHE_STATISTIQUES.md',ROOT/'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT02_TRADUCTION_CAMPAGNE.md',ROOT/'docs/04_CONTRAT_AUTORISATION/GENIIUS_AMENDEMENT_LECTURES_DC_AUTH_02.md']
    files += [ROOT/'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT02_CRITERES_CLOTURE.md', DIR/'RESULTATS_PT02_VARIANTES_MODELE.json', HERE/'validate_scope.py', decision_path]
    proof={'prototype':'PT02','HTTP_execute':d['HTTP_execute'],'SQL_execute':d['SQL_execute'],'verdict':d['verdict'],
           'PT02_clos':closed,'PT02_clos_perimetre_reduit':closed,'NF10_qualifie':False,'architecture_gelee':False,'sources_conformes_execution':source_matches,
           'sha256':{str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
    (DIR/'PREUVES_PROTOTYPE_PT02.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(d['verdict'],f'{good}/{len(d["cases"])} scénarios ; PT02 clos sur périmètre réduit')
    raise SystemExit(not all(source_matches.values()) or d['verdict']=='FAIL')
if __name__=='__main__':main()
