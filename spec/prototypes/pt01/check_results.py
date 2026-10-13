"""Contrôle des résultats enregistrés, sans rejouer ni transformer le verdict."""
import hashlib
import json
from datetime import datetime
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
DIRECTORY=ROOT/'docs/07_ARCHITECTURE/preuves'


def main():
    data=json.loads((DIRECTORY/'RESULTATS_PROTOTYPE_PT01.json').read_text(encoding='utf-8'))
    proof=json.loads((DIRECTORY/'PREUVES_PROTOTYPE_PT01.json').read_text(encoding='utf-8'))
    errors=[]
    def check(ok,label):
        if not ok:
            errors.append(label)
    check(data.get('SQL_execute') is True,'SQL non exécuté')
    check([case['id'] for case in data['cases']]==[f'PT01-{n:02d}' for n in range(1,14)],'treize scénarios manquants')
    check(all(case['statut']=='PASS' for case in data['cases']),'scénario échoué')
    check(data['fatal'] is None,'incident de banc')
    check(data['metadata'].get('container_removed') is True,'conteneur de banc non retiré')
    check(data['metadata']['verified_network']=='none' and not data['metadata']['host_bind_mounts'] and not data['metadata']['verified_port_bindings'],'isolation du banc')
    observations=[t['observation'] for t in data['cases'][11]['traces'] if t['phase']=='borne_logique_observee']
    check(len(observations)==1,'borne logique absente')
    for obs in observations:
        check(datetime.fromisoformat(obs['checked_at'])<datetime.fromisoformat(obs['expires_at'])<=datetime.fromisoformat(obs['commit_timestamp']),'chronologie logique')
    check(any('SET CONSTRAINTS ALL IMMEDIATE' in t.get('sql','') for t in data['cases'][10]['traces']),'validation anticipée non éprouvée')
    for n in (2,4,9,10,12):
        current=data['cases'][n]['etat_final']
        check(all(current[k]==0 for k in ('versions','activities','outbox','receipts','object_version')) and not current['impacted'],'rollback complet '+data['cases'][n]['id'])
    history=json.loads((DIRECTORY/'historique/PT01_AVANT_ARBITRAGE/RESULTATS_PROTOTYPE_PT01.json').read_text(encoding='utf-8'))
    check(history['contre_epreuve']['statut']=='CONTRE_EXEMPLE_OBSERVE' and history['contre_epreuve']['autocommit_control']['statut']=='CONTRE_EXEMPLE_OBSERVE','contre-épreuves perdues')
    for case in data['cases']:
        check(bool(case['traces']),'traces absentes '+case['id'])
    for case in (data['cases'][0],data['cases'][1],data['cases'][5],data['cases'][9],data['cases'][11]):
        check(any(t['phase']=='blocage_SQL_observé' for t in case['traces']),'blocage réel non observé '+case['id'])
        check(len({t['pid'] for t in case['traces'] if t.get('pid')})>=2,'connexions distinctes '+case['id'])
    for name,expected in {**data['sha256_sources'],**proof['sha256']}.items():
        check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,'source/preuve modifiée '+name)
    check(data['verdict']=='PASS_PERIMETRE_PT01' and data['PT01_clos_integralement'] and proof['PT01_clos'],'clôture incohérente')
    check(all(proof['sources_conformes_execution'].values()),'provenance incorrecte')
    check(not data['architecture_gelee'] and not data['pile_ratifiee'],'gel implicite')
    print(json.dumps({'prototype':'PT01','scenarios_reussis':sum(c['statut']=='PASS' for c in data['cases']), 'PT01_clos':proof['PT01_clos'],'erreurs':errors},ensure_ascii=False))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
