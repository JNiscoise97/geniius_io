"""PT06 C : artefacts locaux, migration et rollback compatibles, sans déploiement réel."""
import argparse
from contextlib import closing
import hashlib
import json
import os
import platform
import sqlite3
import subprocess
import sys
import tempfile
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT06_LOT_C.json'

def connect(path):
    c=sqlite3.connect(path,timeout=15,isolation_level=None);c.execute('PRAGMA journal_mode=WAL');c.execute('PRAGMA synchronous=FULL');return c
def sha(data):return hashlib.sha256(data).hexdigest()
def crash(phase,fault):
    if phase==fault:print(json.dumps({'phase':phase}),flush=True);os._exit(73)

def initialize(folder):
    with closing(connect(folder/'app.sqlite')) as c:
        c.executescript("CREATE TABLE deployment(current TEXT,schema INTEGER,gate INTEGER); INSERT INTO deployment VALUES('v1',1,1); CREATE TABLE contribution(id TEXT PRIMARY KEY,delta TEXT); INSERT INTO contribution VALUES('op1','private author delta'); CREATE TABLE object(id TEXT PRIMARY KEY,content TEXT); INSERT INTO object VALUES('o1','canonical object');")
    with closing(connect(folder/'authority.sqlite')) as c:c.executescript('CREATE TABLE authority(allowed INTEGER,generation INTEGER); INSERT INTO authority VALUES(1,1);')
    manifest={}
    for version,max_schema,security in [('v1',1,False),('v2',2,True),('v1.1',2,True)]:
        artifact=json.dumps(dict(version=version,min_schema=1,max_schema=max_schema,current_protections=security),sort_keys=True).encode()
        (folder/(version+'.json')).write_bytes(artifact);manifest[version]=sha(artifact)
    (folder/'trusted_manifest.json').write_text(json.dumps(manifest),encoding='utf-8')

def state(folder):
    with closing(connect(folder/'app.sqlite')) as c,closing(connect(folder/'authority.sqlite')) as a:
        current,schema,gate=c.execute('SELECT * FROM deployment').fetchone()
        return dict(current=current,schema=schema,gate=gate,contributions=c.execute('SELECT * FROM contribution').fetchall(),
                    objects=c.execute('SELECT * FROM object').fetchall(),authority=list(a.execute('SELECT * FROM authority').fetchone()),
                    columns=[r[1] for r in c.execute('PRAGMA table_info(object)')])

def worker(a):
    folder=Path(a.folder)
    with closing(connect(folder/'app.sqlite')) as c:
        c.execute('UPDATE deployment SET gate=0')
        manifest=json.loads((folder/'trusted_manifest.json').read_text(encoding='utf-8'))
        if a.version not in manifest:return {'status':'closed','reason':'unknown_release'}
        data=(folder/(a.version+'.json')).read_bytes()
        if sha(data)!=manifest[a.version]:return {'status':'closed','reason':'artifact_integrity'}
        artifact=json.loads(data);schema=c.execute('SELECT schema FROM deployment').fetchone()[0]
        if not artifact['current_protections'] or not artifact['min_schema']<=schema<=artifact['max_schema']:
            return {'status':'closed','reason':'incompatible_release'}
        if a.version=='v2' and schema==1:
            c.execute('BEGIN IMMEDIATE')
            c.execute('ALTER TABLE object ADD COLUMN protection_generation INTEGER NOT NULL DEFAULT 0')
            c.execute('UPDATE deployment SET schema=2')
            crash('before_migration_commit',a.fault);c.execute('COMMIT')
            crash('after_migration_commit',a.fault)
        # L'autorité n'est jamais restaurée depuis l'artefact ; recontrôle pour ouvrir.
        with closing(connect(folder/'authority.sqlite')) as authority:
            authority.execute('BEGIN IMMEDIATE');allowed,generation=authority.execute('SELECT * FROM authority').fetchone()
            c.execute('BEGIN IMMEDIATE')
            c.execute('UPDATE object SET protection_generation=?',(generation,))
            c.execute('UPDATE deployment SET current=?,gate=1',(a.version,))
            c.execute('COMMIT');authority.execute('COMMIT')
        return {'status':'activated','version':a.version}

def launch(folder,version='v2',fault=''):
    r=subprocess.run([sys.executable,str(HERE/'run_c.py'),'--worker','--folder',str(folder),'--version',version,'--fault',fault],capture_output=True,text=True,encoding='utf-8',timeout=20)
    assert r.returncode==(73 if fault else 0),r.stderr
    return dict(version=version,fault=fault,exit_code=r.returncode,output=json.loads(r.stdout),durable_after=state(folder))

def exercise(n,folder,traces):
    initialize(folder);before=state(folder)
    def call(**kw):
        t=launch(folder,**kw);traces.append(t);return t['output']
    if n in (2,3):
        call(fault='before_migration_commit' if n==2 else 'after_migration_commit')
        interrupted=state(folder);assert not interrupted['gate'] and interrupted['current']=='v1'
        assert interrupted['schema']==(1 if n==2 else 2)
        assert ('protection_generation' in interrupted['columns'])==(n==3)
    assert call()=={'status':'activated','version':'v2'}
    if n==4:
        assert call(version='v1')=={'status':'closed','reason':'incompatible_release'}
        assert state(folder)['current']=='v2' and state(folder)['schema']==2 and not state(folder)['gate']
    elif n in (5,6):
        if n==6:
            with closing(connect(folder/'authority.sqlite')) as a:a.execute('UPDATE authority SET allowed=0,generation=2')
        assert call(version='v1.1')=={'status':'activated','version':'v1.1'}
        assert state(folder)['schema']==2
        if n==6:assert state(folder)['authority']==[0,2]
    elif n==7:
        (folder/'v1.1.json').write_bytes(b'UNTRUSTED_ARTIFACT')
        assert call(version='v1.1')=={'status':'closed','reason':'artifact_integrity'}
        assert state(folder)['current']=='v2' and not state(folder)['gate']
    after=state(folder)
    assert before['contributions']==after['contributions']
    assert after['objects'][0][0:2]==before['objects'][0]
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Activation versionnée et migration conservant données','Panne avant commit DDL : rollback et reprise',
            'Commit schéma puis panne avant activation : reprise','Rollback ancienne version incompatible refusé',
            'Rollback compatible sans downgrade/restauration des données','Autorité retirée : rollback conserve génération et refus',
            'Artefact altéré : activation refusée sans remplacement']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt06-c-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT06-C{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT06-C{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_c.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT06',lot='C',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_LIVRAISON_ROLLBACK' if len(cases)==7 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT06_clos=False,deploiement_production_qualifie=False,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Artefacts JSON et manifeste fiable injecté, pas binaires/signature/CI/CD/supply chain.',
                   'Compatibilité déclarée dans fixture ; pas preuve de comportement d’un vrai ancien logiciel.',
                   'Porte de cohérence ouverte ne vaut pas permission scientifique ; autorité booléenne et pas route de lecture.',
                   'Migration additive SQLite, pas MPD complet, migration online, trafic concurrent ou conteneurs.',
                   'Pas versions de support/rollback produit ratifiées ; paramètres du banc seulement.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true')
    for key in ('folder','version','fault'):p.add_argument('--'+key)
    a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)))
    else:main()
