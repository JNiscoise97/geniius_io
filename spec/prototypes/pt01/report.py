"""Rapport à partir des résultats effectivement enregistrés ; aucun PASS inventé."""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/architecture/prototypes'


def main():
    path=DIR/'PT01_RESULTATS.json'
    data=json.loads(path.read_text(encoding='utf-8'))
    cases=data['cases']
    negative=data.get('contre_epreuve')
    sql=bool(cases)
    good=sum(case['statut']=='PASS' for case in cases)
    out=['# PT01 — Rapport d’écritures et révocations concurrentes','',
         '**13 octobre 2026 — prototype de faisabilité, architecture non gelée.**', '',
         f'**Verdict : {data["verdict"]}.** {good}/{len(cases)} scénarios exécutés réussis. PT01 n’est pas clos intégralement.', '',
         'Le porteur impose un budget de 100 €/mois avant abonnements, souhaite décembre 2026 et demande les six prototypes avant lancement. Ce banc est local : aucun service cloud payant engagé. Il ne mesure ni coût électrique/matériel, ni coût d’exploitation de production.', '',
         '## Banc et preuves', '',
         f'- Exécution UTC : {data["started_utc"]} → {data["ended_utc"]}.',
         f'- SQL exécuté : {"oui" if sql else "non"}.',
         f'- PostgreSQL : {data["metadata"].get("postgresql_version","indisponible, banc non démarré")}.',
         f'- Image : {data["metadata"].get("image_reference","indisponible")}, identifiant {data["metadata"].get("image_id","indisponible")}.',
         '- [Résultats, traces et empreintes](PT01_RESULTATS.json).',
         '- [Schéma synthétique](../../../spec/prototypes/pt01/schema.sql) et runner : `spec/prototypes/pt01/run.py` ; commande dans `spec/prototypes/pt01/README.md`.', '',
         '## Scénarios et état final', '', '| Cas | Objet | Verdict | État observé |', '|---|---|---|---|']
    for case in cases:
        out.append('| '+ ' | '.join([case['id'],case['objet'],case['statut'],json.dumps(case['etat_final'],ensure_ascii=False)])+' |')
    if data['fatal']:
        out+=['', '**Incident de banc :** '+data['fatal'], 'Aucune conclusion de conformité ne découle de cet incident.']
    out+=['','## Expiration et contre-épreuve','']
    if negative:
        o=negative['observation']
        out += [f'**{negative["id"]} : {negative["statut"]}.** La connexion applicative force `SET CONSTRAINTS ALL IMMEDIATE`, attend l’échéance puis commite. Le contrôle différé a été effectué avant expiration, mais la version a été commise après.', '',
                f'- Validation : {o["checked_at"]}.', f'- Échéance : {o["expires_at"]}.',
                f'- Timestamp de commit PostgreSQL : {o["commit_timestamp"]}.', '',
                'Cette contre-épreuve est un échec de la garantie de borne de commit pour cette implémentation, et non un onzième test de conformité réussi. Le contrôle différé seul est écarté comme preuve suffisante de SEC-01. Les traces consignent les requêtes et l’ordre ; les timestamps proviennent du serveur.']
    else:
        out+=['La contre-épreuve est prévue mais n’a pas été exécutée. Aucune borne temporelle de commit n’est donc démontrée.']
    out += ['', '## Couverture et limites', '',
            'AC01/02 : ordre écriture/révocation sous garde relationnelle partagée/exclusive ; AC07 : effets et époque annulés avec leur transaction ; AC08 : connexions/processus distincts utilisant la même garde de base, sans preuve d’une topologie multi-hôte. AC03 : expiration avant validation différée testée, mais borne au commit non résolue. Le détail ne vaut couverture du modèle V1.6 complet.', '',
            'Le schéma utilise un droit binaire synthétique et des rôles SQL, pas tout le MLD ni le moteur complet d’identité/autorisation. Pas de preuve de réponse HTTP, de rendu/échéance pendant flux, de non-divulgation temporelle, de famine, de débit/capacité ou de PRA. Le rôle non propriétaire ne contourne pas les écritures directes testées ; les fonctions SECURITY DEFINER restent à durcir/revoir pour le produit.', '',
            'Les scénarios de panne et concurrence sont pertinents pour sélectionner une primitive transactionnelle ; ils ne suffisent pas à ratifier PostgreSQL, une pile ou les délais de production. Les autres prototypes PT02 à PT06 ne sont pas réputés exécutés.', '',
            '## Suite nécessaire', '',
            'PT01-L01 / SEC-01 : définir et démontrer le point de linéarisation temporel exact compatible avec le contrat gelé, éliminer le contournement de validation précoce et traiter le délai validation→commit/visibilité. Aucune tolérance de délai ni modification métier du contrat n’est adoptée. Une solution éventuelle doit être testée par contre-épreuves avant clôture de PT01.', '',
            'Les travaux indépendants PT02–PT06 peuvent se préparer, mais le gel d’architecture reste interdit tant qu’une garantie P0 demeure non démontrée. Le budget reste plafonné à 100 €/mois et l’échéance décembre est un objectif, sans promesse de lancement avant verdicts.', '',
            '## Sources techniques consultées', '',
            'PostgreSQL documente le déclenchement différé et la possibilité de forcer son exécution : [CREATE TRIGGER](https://www.postgresql.org/docs/current/sql-createtrigger.html). Le timestamp de commit utilisé par la contre-épreuve nécessite l’option `track_commit_timestamp`, activée sur ce seul banc : [fonctions de commit](https://www.postgresql.org/docs/current/functions-info.html). Ces sources expliquent les primitives ; la conclusion sur notre implémentation vient des résultats ci-dessus.', '']
    report=DIR/'PT01_RAPPORT.md'
    report.write_text('\n'.join(out),encoding='utf-8')
    expected={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h for name,h in data['sha256_sources'].items()}
    proof={'prototype':'PT01','SQL_execute':sql,'verdict':data['verdict'],'sources_conformes_execution':expected,
           'PT01_clos':False,'architecture_gelee':False,
           'sha256':{str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in [path,report,Path(__file__).resolve()]}}
    (DIR/'PT01_PREUVES.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(data['verdict'], f'{good}/{len(cases)} réussis ; PT01 non clos.')
    raise SystemExit(not all(expected.values()))


if __name__=='__main__':
    main()
