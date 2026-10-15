"""Vérification des preuves PT02 sans remplacer leur verdict partiel."""
import hashlib
import json
from datetime import datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'
def main():
    d=json.loads((DIR/'RESULTATS_PROTOTYPE_PT02.json').read_text(encoding='utf-8'))
    p=json.loads((DIR/'PREUVES_PROTOTYPE_PT02.json').read_text(encoding='utf-8'))
    errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['HTTP_execute'] and d['SQL_execute'] and d['fatal'] is None,'banc non achevé')
    check([c['id'] for c in d['cases']]==[f'PT02-{n:02d}' for n in range(1,38)],'trente-sept cas manquants')
    check(all(c['statut']=='PASS' and c['sql_traces'] for c in d['cases']),'échec/traces SQL absentes')
    check(d['metadata']['container_removed'] and d['metadata']['network']=='none' and not d['metadata']['ports'] and not d['metadata']['host_bind_mounts'],'isolation/nettoyage')
    check(d['metadata']['http_bind']=='127.0.0.1','HTTP exposé hors loopback')
    lock=d['cases'][6]
    check(any(t['phase']=='blocage_SQL_observé' for t in lock['sql_traces']),'garde SQL non observée')
    for n in (14,15):
        traces=d['cases'][n]['http_traces']
        expired=[t for t in traces if t['phase']=='echeance_depassee_avant_transport']
        evaluations=[t for t in traces if t['phase']=='evaluation_sql' and t['authorized']]
        sends=[t for t in traces if t['phase'] in ('remis_transport','portion_remise')]
        received=[t for t in traces if t['phase']=='recu_client']
        check(expired and evaluations and sends and received,'trace temporelle incomplète')
        if expired and evaluations and sends and received:
            check(datetime.fromisoformat(evaluations[0]['checked_at'])<datetime.fromisoformat(expired[0]['expires_at'])<=datetime.fromisoformat(expired[0]['server_time']),'horloges contrôle/échéance/remise')
            check(evaluations[0]['monotone_ns']<expired[0]['monotone_ns']<sends[0]['monotone_ns']<received[0]['monotone_ns'],'ordre temporel des portions')
            check('alpha' in received[0]['body'],'contenu engagé non reçu')
        if n==14:
            check([t['status'] for t in received]==[200,404,404],'requêtes suivantes non refusées')
        else:
            check(len(sends)==1 and any(t['phase']=='portion_refusee' and t['portion']==1 for t in traces),'portion suivante non refusée')
    history=json.loads((DIR/'historique/RESULTATS_PROTOTYPE_PT02_AVANT_DC_AUTH_02.json').read_text(encoding='utf-8'))
    check(history['contre_epreuve']['statut']=='CONTRE_EXEMPLE_OBSERVE','contre-épreuve historique perdue')
    mutation=d['cases'][9]['http_traces']
    commits=[t for t in mutation if t['phase']=='commit_confirme']
    sends=[t for t in mutation if t['phase']=='remis_transport']
    check(commits and sends and commits[0]['monotone_ns']<sends[0]['monotone_ns'],'succès avant commit')
    check(not any(t['phase']=='commit_confirme' for t in d['cases'][10]['http_traces']),'commit échoué annoncé')
    check(sum(t['phase']=='recu_client' for t in d['cases'][13]['http_traces'])==12,'paires temporelles manquantes')
    uq=d['cases'][16]['http_traces']
    denied=[t for t in uq if t['phase']=='recu_client']
    check(len(denied)==2 and denied[0]['body']==denied[1]['body'] and denied[0]['headers']==denied[1]['headers'] and all(t['status']==404 for t in denied),'FK/UQ oracle observable')
    concurrent=[t['status'] for t in d['cases'][18]['http_traces'] if t['phase']=='recu_client']
    check(sorted(concurrent)==[201,409],'unicité concurrente non éprouvée')
    for n in (19,20,21):
        check(any(t['phase']=='graphe_modele' for t in d['cases'][n]['http_traces']),'moteur de référence non appelé')
    diagnostics=[t['result'] for t in d['cases'][22]['http_traces'] if t['phase']=='diagnostic_statistique']
    check([v['concurrency'] for v in diagnostics]==[1,4],'paliers de diagnostic absents')
    for v in diagnostics:
        check(v['pairs']==len(v['samples'])==32 and v['classifier_train_pairs']==16 and v['classifier_test_observations']==32,'échantillons statistiques incomplets')
        check(not v['NF10_conforme'],'conformité statistique inventée')
    expected_comparisons={23:[True,True],24:[True,False],25:[False,True,False,False],
                          26:[False,True,False],27:[True,False,False],28:[True,False],
                          29:[True,True],30:[True,False],31:[True,False],32:[True]}
    for index,expected in expected_comparisons.items():
        comparisons=[t for t in d['cases'][index]['http_traces'] if t['phase']=='comparaison_relationnelle']
        check([t['expected'] for t in comparisons]==expected,'attendus relationnels incomplets '+d['cases'][index]['id'])
        check(all(t['expected']==t['oracle_ok']==(t['sql_http_status']==200) for t in comparisons),'divergence SQL/oracle/texte')
    twins=[t['result'] for t in d['cases'][33]['http_traces'] if t['phase']=='diagnostic_jumeaux']
    check({(v['family'],v['concurrency']) for v in twins}=={(f,c) for f in ('personnel_cache','hp_rompue','copie_protegee') for c in (1,4)},'corpus/paliers jumeaux manquants')
    check(len(twins)==6 and all(v['pairs']==len(v['samples'])==32 and not v['NF10_conforme'] for v in twins),'diagnostic jumeaux incomplet')
    requests=[t for t in d['cases'][33]['http_traces'] if t['phase']=='recu_client']
    check(len(requests)==384 and all(t['status']==404 for t in requests),'requêtes jumeaux incohérentes')
    stale=[t['status'] for t in d['cases'][34]['http_traces'] if t['phase']=='recu_client']
    check(stale==[200,404,200],'génération périmée ou recompilation incorrecte')
    time_changed=[t['status'] for t in d['cases'][35]['http_traces'] if t['phase']=='recu_client']
    check(time_changed==[200,404],'instant périmé sans époque non refusé')
    for n,h in {**d['sha256_sources'],**p['sha256']}.items():
        check(hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h,'source/preuve modifiée '+n)
    check(all(p['sources_conformes_execution'].values()),'sources exécutées différentes')
    diagnosis=json.loads((DIR/'DIAGNOSTIC_SQL_LATENCE_PT02.json').read_text(encoding='utf-8'))
    check(diagnosis['fatal'] is None and diagnosis['metadata']['container_removed'],'diagnostic SQL incomplet')
    check(len(diagnosis['results'])==24 and all(len(v['hidden_ms'])==len(v['absent_ms'])==200 for v in diagnosis['results']),'mesures SQL manquantes')
    check(len(diagnosis.get('kernel_checks',[]))==3 and all(not v['direct_allowed'] and not v['projection_allowed'] and v['generation_coherente'] for v in diagnosis.get('kernel_checks',[])),'fondements/ascendants non éprouvés avec génération cohérente')
    check(d['metadata'].get('reader_pool_size')==4 and d['metadata'].get('reader_pool_closed'),'connexions réutilisées non consignées/nettoyées')
    for n,h in diagnosis['sha256_sources'].items():
        check(hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h,'diagnostic SQL source modifiée '+n)
    decision=json.loads((DIR/'DECISION_CLOTURE_PT02.json').read_text(encoding='utf-8'))
    check(decision['PT02_clos_perimetre_reduit'] and not decision['NF10_qualifie'] and not decision['architecture_gelee'],'portée de décision abusive')
    check(decision['criteres_retenus']==[f'C{n}' for n in range(1,9)] and decision['accord_porteur']=='ok fais le','décision non rattachée aux critères/accord')
    for name,digest in decision['sha256_preuves'].items():
        check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest,'preuve de clôture modifiée '+name)
    check(d['verdict']=='PARTIEL_UQ_GRAPHE_NF10' and d['constat_temporel_resolu'] and not d['PT02_clos'],'résultat historique ou arbitrage altéré')
    check(p['PT02_clos'] and p['PT02_clos_perimetre_reduit'] and not p['NF10_qualifie'],'preuve de décision absente ou qualification abusive')
    print(json.dumps({'prototype':'PT02','scenarios_reussis':sum(c['statut']=='PASS' for c in d['cases']),'PT02_clos_perimetre_reduit':True,'NF10_qualifie':False,'erreurs':errors},ensure_ascii=False))
    raise SystemExit(bool(errors))
if __name__=='__main__':main()
