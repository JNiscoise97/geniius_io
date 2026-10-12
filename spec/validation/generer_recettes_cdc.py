"""Catalogue unique de recettes/traçabilité : aucune exécution logicielle déclarée."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
CDC = ROOT / 'docs/GENIIUS_CDC_TECHNIQUE_V1_0.md'
CASES = {
1: ('Ouvrir un même espace autorisé sur Web, Desktop et Mobile ; comparer données et actions.', 'Surfaces conformes à TECH-001, mêmes objets et autorisations, aucune nouvelle vérité par application.', 'Produit / architecture'),
2: ('Synchroniser une base structurée autorisée, couper réseau, expirer une échéance et consulter.', 'Lecture hors ligne permise avant échéance, inaccessible après pour données protégées ; delta non synchronisé conservé ; aucune réplication dérogatoire.', 'Core / sécurité'),
3: ('Créer un delta hors ligne puis modifier sa base, retirer un droit, interrompre et rejouer synchronisation.', 'Réception privée conservée avant résolution ; intégration à droits courants et conflits explicites, aucun écrasement ni perte du delta.', 'Core / données scientifiques'),
4: ('Importer des fichiers locaux, renommer/déplacer un original et simuler indisponibilité.', 'Originaux inchangés par GENIIUS ; identité documentaire préservée et lien rompu explicitement détecté.', 'Applications / stockage'),
5: ('Deux appareils modifient le même objet ; révoquer un collaborateur avant la reprise.', 'Versions et conflits explicites ; retraits avant ajouts, réévaluation serveur, aucun doublon ni réactivation de droit clos.', 'Core / applications'),
6: ('Déposer deux fois un même binaire, corrompre une copie et restaurer un original.', 'Identités de dépôts distinctes, aucune révélation de déduplication ; original récupérable et integrity/state de fichier contrôlés avant usage scientifique.', 'Stockage / exploitation'),
7: ('Perdre un moyen d’authentification puis récupérer le compte ; tenter auto-approbation avec second compte.', 'Récupération contrôlée, aucun élargissement des habilitations ; personne identique reconnue pour interdits sensibles.', 'Sécurité / produit'),
8: ('Un module tente de contourner l’API/Core ou d’accéder directement à une donnée protégée.', 'Contrats entre modules respectés, vérification commune des autorisations, aucun accès implicite ni effet de module sur vérité d’un autre.', 'Architecture / Core'),
9: ('Charger le profil programme 50/500/1 million, puis profils patrimoniaux déclarés et montée de charge.', 'Volumes, capacité, saturation et dégradation mesurés selon manifeste ; aucune donnée perdue ni limite commerciale prise pour limite scientifique.', 'Architecture / exploitation'),
10: ('Inventorier plusieurs sources, interrompre migration à chaque étape, reprendre et réimporter à l’identique.', 'Migration non destructive, reprenable, provenance et bilan ; aucune double preuve ni validation scientifique d’un fait par import seul.', 'Core / données scientifiques'),
11: ('Comparer état où objet caché existe et état où il n’existe pas ; tenter administration et dérogation.', 'Sorties filtrées selon § 14/15, non-levables jamais franchies, dérogation seulement bornée ; variante P-3 minimale explicitement séparée.', 'Sécurité / Core'),
12: ('Sauvegarder, révoquer/purger ensuite, injecter catastrophe et restaurer.', 'Patrimoine cohérent et autorisations/purges courantes avant accès ; RPO structuré ≤ 5 min, RTO ≤ 4 h selon protocole ; aucun contenu/droit ressuscité.', 'Exploitation / sécurité'),
13: ('Interrompre une opération asynchrone durable et rejouer en concurrence.', 'Un effet logique, état observable, reprise sans perte, absence de validation automatique ou résultat partiel définitif.', 'Core / exploitation'),
14: ('Mesurer séparément temps serveur, retour perceptible client et premiers résultats de recherche aux profils/caches/réseaux déclarés.', 'p95 lecture serveur ≤ 1 s hors réseau ; retour perceptible client < 1 s nominal ; p95 premiers résultats recherche ≤ 2 s. Exactitude et autorisation conservées ; distributions et erreurs publiées.', 'Architecture / qualité'),
15: ('Corriger une preuve, interrompre propagation et consulter résultats aval avant/après reprise.', 'Direct marqué au commit, transitif visible et idempotent ; aucune fausse certitude ni disparition du signalement ; délai à comparer après fixation MPD-04.', 'Core / données scientifiques'),
16: ('Indexer une cible, retirer le droit, rechercher avec pagination, suggestion et agrégat.', 'Aucun résultat/compteur/indice protégé servi par cache/index ; échec de vérification fermé.', 'Sécurité / recherche'),
17: ('IA propose une identification ; demander envoi d’attribut sensible à un fournisseur.', 'Proposition traçable sans validation ni modification du Core automatique ; données interdites non transmises.', 'Données scientifiques / sécurité'),
18: ('Exécuter même opération par interface/API, inclure références invisibles et ancien client incompatible.', 'Contrat et erreurs d’accès cohérents ; compatibilité explicitement négociée, refus sans fuite ni état partiellement écrit.', 'Architecture / Core'),
19: ('Tenter lecture de données/fichiers/sauvegardes sans secrets, puis restauration autorisée.', 'Confidentialité au repos et séparation des secrets ; droits actuels également vérifiés, chiffrement ne remplaçant pas autorisation.', 'Sécurité / exploitation'),
20: ('Effacer un objet à plusieurs versions avec activités/références, restaurer ensuite et vérifier résidus.', 'Contenus, codes/dates reconstructifs neutralisés, traces minimales seulement ; aucun réimport/restauration ne reconstitue donnée effacée.', 'Sécurité / données / juridique'),
21: ('Créer, modifier et retirer un accès/conclusion puis lire journaux sous plusieurs rôles.', 'Auteur/acte/versions/fondements auditables sans contenu indiscret ni cible cachée ; événements obligatoires conservés.', 'Sécurité / exploitation'),
22: ('Lancer tests/migrations dans un environnement distinct avec corpus synthétique ou autorisé.', 'Isolation de production, secrets séparés et aucune donnée privée diffusée dans preuves de test.', 'Exploitation / qualité'),
23: ('Échouer un déploiement/migration et reprendre ou revenir à l’état compatible précédent.', 'Patrimoine cohérent, aucune migration partielle exposée, aucune corruption ni résurrection de permissions.', 'Exploitation / architecture'),
24: ('Modifier un composant de droits, synchronisation, purge ou propagation et préparer livraison.', 'Non-régression correspondante lancée et résultats/version conservés ; cas positifs, négatifs et variantes d’attaque présents.', 'Qualité / Core'),
25: ('Parcours clavier, technologie d’assistance, erreur et date historique incertaine sur toutes surfaces.', 'Information lisible et fidèle, état/interruption/reprise compréhensibles ; accessibilité et représentation scientifique conformes aux contrats.', 'Produit / qualité'),
26: ('Exporter puis réimporter patrimoine autorisé avec versions, provenance et divergences.', 'Distinctions scientifiques conservées, exclusions invisibles non listées ; aucun transfert de droit implicite ni perte de portabilité.', 'Core / données scientifiques'),
27: ('Support/exploitation tente accès scientifique sans habilitation ; répéter avec dérogation valide puis expirée.', 'Pas d’administration donnant lecture, accès borné et audité si admissible, expiration effective sur chaque étape et sortie.', 'Exploitation / sécurité'),
28: ('Sonder parcours essentiels pendant un mois civil et incidents déclarés.', 'SLI calculé sur durée/version/périmètre publiés, objectif 99,9 %, budget et exclusions explicites ; aucune sécurité sacrifiée.', 'Exploitation / qualité'),
29: ('Atteindre quotas/plafonds, rejouer imputations concurrentes et mesurer consommation par catégorie.', 'Aucune perte, aucune double imputation ni plafond dépassé, coût/unités documentés ; valeurs commerciales restent dimensionnées.', 'Produit / exploitation'),
30: ('Injecter incident sécurité/exploitation sur opération scientifique et exercer reprise.', 'Opérations incomplètes identifiées, protections maintenues, traces préservées sous droits, reprise/postmortem documentés.', 'Sécurité / exploitation'),
31: ('Changer un référentiel/concept, relire interprétation antérieure et réimporter ancienne version.', 'Versions de référentiels explicites et historique reproductible ; aucune réécriture silencieuse de la science.', 'Données scientifiques / Core'),
32: ('Instruire ADR et décision MPD différée avec alternatives et conséquences.', 'Origine, contraintes, critères, responsables et échéance explicites ; aucun abandon d’invariant P0 par décision technique.', 'Architecture / porteur'),
33: ('Changer préférence sur plusieurs clients, manipuler Unicode/textes longs/dates et langues livrées.', 'Au moins deux langues d’interface en V1, dont français ; préférence persistée/repli explicite, sources et contributions inchangées ; liste des langues validée avant livraison.', 'Produit / qualité'),
}

def generate():
    text = CDC.read_text(encoding='utf-8')
    lines = text.splitlines()
    in_recipes = False
    in_origins = False
    recipes = {}
    origins = {}
    for n, line in enumerate(lines, 1):
        if line.startswith('# 8. '):
            in_recipes = True
        elif line.startswith('# 9. '):
            in_recipes = False
        if line.startswith('## D.2 '):
            in_origins = True
        if in_origins and re.match(r'^\| \d{3} \|', line):
            cells = line.split('|')
            origins[int(cells[1])] = {'origine': cells[2].strip(), 'nature': cells[3].strip()}
        if not in_recipes or not line.startswith('| '):
            continue
        cells = line.split('|')
        ident = cells[1].strip().strip('*')
        if not re.fullmatch(r'(?:REC-)?[A-Z]+\d{2}(?:-\d{2})?', ident):
            continue
        canonical = ident if ident.startswith('REC-') else 'REC-' + ident
        if canonical == 'REC-TR08' and len(cells) == 4:
            cells = ['', ident, 'Famille projet collectif : exécuter TR08-01 à TR08-10', 'Tous les attendus TR08-01 à TR08-10 sont respectés ; ancienne variante conservée seulement en archive', '']
        assert canonical not in recipes, ('identifiant dupliqué', canonical)
        combined = line.startswith('| REC-X') and len(cells) == 5
        scenario = cells[2].strip()
        expected = scenario if combined else cells[3].strip()
        if canonical.startswith('REC-TECH'):
            scenario = cells[3].strip()
            expected = cells[3].strip()
        recipes[canonical] = {'id': canonical, 'alias': ident, 'ligne_CDC': n,
                              'scenario': scenario, 'attendu': expected,
                              'methode': 'recette observable avec préconditions/corpus/contexte versionnés, inspection des sorties et traces ; non exécutée',
                              'responsable': 'Qualité / recette, avec propriétaire TECH associé', 'statut': 'spécifiée, non exécutée'}
    # Famille projet : section 12, hors ancienne section 8.
    for n, line in enumerate(lines, 1):
        if re.match(r'^\| PR01-\d{2} \|', line):
            cells = line.split('|')
            ident = 'REC-' + cells[1].strip()
            assert ident not in recipes
            recipes[ident] = {'id': ident, 'alias': cells[1].strip(), 'ligne_CDC': n, 'scenario': cells[2].strip(),
                              'attendu': cells[3].strip(), 'methode': 'scénario et variante du § 12 ; recette logiciel à réaliser',
                              'responsable': 'Produit / Core / qualité', 'statut': 'spécifiée, non exécutée'}
    # Couverture inverse fidèle des cas et critères de recette amont.
    cdcf = (ROOT / 'docs/geniius_io_CDCF_V1.md').read_text(encoding='utf-8')
    inverse = {'CU': {}, 'criteres': {}}
    for match in re.finditer(r'^## (CU-\d{2}) --- ([^\n]+)\n(.*?)(?=\n(?:## |# |-{5,})|\Z)', cdcf, re.M | re.S):
        cu, title, body = match.groups()
        rid = 'REC-CDCF-' + cu.replace('-', '')
        expected = re.sub(r'\s+', ' ', body).strip()
        recipes[rid] = {'id': rid, 'alias': cu, 'source': 'CDCF V1.3 ' + cu,
                        'scenario': title + ' : ' + expected, 'attendu': expected,
                        'methode': 'Corpus du CU versionné ; parcours nominal et variante contraire aux attendus. Chaque item Vérifier/Attendu exige une observation et un verdict distincts sur les surfaces concernées selon CDC § 8.0.',
                        'responsable': 'Données scientifiques / produit / qualité', 'statut': 'spécifiée, non exécutée'}
        inverse['CU'][cu] = rid
    for start, end in [('# 103.', '# 104.'), ('# 134.', '# 135.')]:
        section = cdcf[cdcf.index(start):cdcf.index(end) if end else len(cdcf)]
        for match in re.finditer(r'^([0-9]+)\.\s+(.+?)(?=\n[0-9]+\.\s|\n-{5,}|\Z)', section, re.M | re.S):
            number, body = match.groups()
            expected = re.sub(r'\s+', ' ', body).strip()
            rid = f'REC-CDCF-CR{int(number):02d}'
            recipes[rid] = {'id': rid, 'alias': 'Critère ' + number, 'source': 'CDCF V1.3 § 103/134',
                            'scenario': 'Corpus illustrant le critère ' + number + ', puis variante contraire à l’attendu ; exercer le parcours métier et consulter API, affichage, historique et export autorisé.',
                            'attendu': expected,
                            'methode': 'Conserver corpus/versions/droits/événements et sorties ; vérifier chaque proposition de l’attendu. La variante ne doit pas être présentée comme conforme ni fabriquer une certitude. Surfaces selon CDC § 8.0 ; CR55 applique la règle hors ligne bornée alignée par DC-CDCF-01.',
                            'responsable': 'Données scientifiques / Core / qualité', 'statut': 'spécifiée, non exécutée'}
            inverse['criteres'][number] = rid
    assert len(inverse['CU']) == 31 and len(inverse['criteres']) == 64
    tech = {}
    for num in range(1, 34):
        tid = f'TECH-{num:03d}'
        head = re.search(rf'^## {tid} — (.+)$', text, re.M)
        assert head and num in origins, tid
        clauses = re.findall(rf'^- \*\*({tid}\.\d+)\*\*', text, re.M)
        assert clauses, tid
        rid = f'REC-CDC-TECH{num:03d}'
        scenario, expected, owner = CASES[num]
        recipes[rid] = {'id': rid, 'alias': None, 'source': tid, 'scenario': scenario, 'attendu': expected,
                        'methode': 'Inspection du contrat, scénario positif et variante négative avec manifeste § 14.3 ; comparer toutes les clauses ' + tid,
                        'responsable': owner, 'preuve': 'rapport versionné, état initial, événements et sorties filtrées, manifeste et résultat signé',
                        'statut': 'spécifiée, non exécutée'}
        tech[tid] = {'titre': head[1], **origins[num], 'contrat': clauses, 'recette_dediee': rid,
                     'responsable': owner, 'integration': 'relue en V1.1, réserves closes par DC-CDCF-01, baseline V1.2 gelée',
                     'statut_logiciel': 'non vérifié'}
    model = {'version': 'CDC V1.2 gelé documentairement', 'gel_documentaire': True, 'technologies_choisies': False, 'tests_executes': False,
             'tech': tech, 'recettes': recipes, 'couverture_inverse_CDCF': inverse,
             'relations_de_couverture': [['X01', 'X09'], ['J03', 'J05', 'J10', 'J11', 'J12', 'J13'],
                                        ['CN01', 'CN02', 'CN03', 'CN04', 'X14'], ['NF09', 'TECH13'], ['NF05', 'X18']]}
    path = ROOT / 'spec/validation/cdc_recettes_v1_2.json'
    path.write_text(json.dumps(model, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    out = ['# CDC technique V1.2 — Référentiel unique de traçabilité et recettes', '',
           '**Statut : référentiel documentaire gelé le 13/10/2026, recettes non exécutées.** Partie intégrante du CDC V1.2 gelé ; procès-verbal dans `docs/AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md`. Source structurée : `spec/validation/cdc_recettes_v1_2.json` ; génération reproductible `generer_recettes_cdc.py`.', '',
           'Chaque recette a un identifiant unique. Une responsabilité est un rôle fonctionnel, à affecter nominativement avant décision ou campagne ; elle ne confère aucun droit de contenu. Le protocole et le manifeste du CDC § 14.3 s’appliquent. Les résultats attendus constituent des critères de recette, jamais des résultats déjà obtenus.', '',
           '## Matrice des 33 exigences', '', '| TECH | Origine localisée / justification | Contrat | Recette dédiée | Rôle responsable |', '|---|---|---|---|---|']
    for tid, item in tech.items():
        out.append(f'| {tid} | {item["origine"]} ; {item["nature"]} | {len(item["contrat"])} clauses au § 3 du CDC ; liens § 10 et § 14 | {item["recette_dediee"]} | {item["responsable"]} |')
    out += ['', '## Recettes dédiées et critères de preuve', '']
    for num in range(1, 34):
        rid = f'REC-CDC-TECH{num:03d}'
        item = recipes[rid]
        out += [f'### {rid}', '', f'**Scénario :** {item["scenario"]}', f'**Attendu :** {item["attendu"]}',
                f'**Méthode :** {item["methode"]}. **Preuve :** {item["preuve"]}. **Responsable :** {item["responsable"]}.', '']
    out += ['## Recettes héritées et projets', '', '| Identifiant canonique | Alias historique | Scénario | Résultat attendu |', '|---|---|---|---|']
    for rid, item in recipes.items():
        if rid.startswith('REC-CDC-'):
            continue
        out.append('| ' + rid + ' | ' + item['alias'] + ' | ' + item['scenario'].replace('|', '/') + ' | ' + item['attendu'].replace('|', '/') + ' |')
    out += ['', f'**Bilan :** 33 TECH, {len(recipes)} recettes identifiées, dont 31 CU et 64 critères amont repris ; aucune exécution déclarée. Les recouvrements sont conservés comme cas complémentaires ; leur relecture et les réserves sont consignées dans le rapport de revue finale du 13/10/2026. Les fixtures et scripts de campagne restent à réaliser.', '',
            'Les exigences à justification technique ECD-19 ne sont pas faussement attribuées au CDCF. La ratification technique DC-CDCF-01 au CDCF § 135 clôt ECD-19 ; aucune origine fonctionnelle historique n’est inventée. Le protocole NF fixe les mesures et objectifs existants ; les paramètres explicitement différés doivent être signés avant campagne.']
    (ROOT / 'docs/GENIIUS_CDC_TECHNIQUE_RECETTES_V1_2.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
    print('33 TECH,', len(recipes), 'recettes identifiées ; aucune exécution déclarée.')

if __name__ == '__main__':
    generate()
