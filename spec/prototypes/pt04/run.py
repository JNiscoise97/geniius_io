"""PT04 A : snapshots réels, autorité extérieure et réconciliation d'effets.

Checkpoint de confiance injecté par l'orchestrateur ; aucune durabilité indépendante prétendue.
"""
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
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3];HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT04.json'

def connect(path):
    c=sqlite3.connect(path,timeout=15,isolation_level=None)
    c.execute('PRAGMA journal_mode=WAL');c.execute('PRAGMA synchronous=FULL');return c

def crash(phase,requested):
    if phase==requested:
        print(json.dumps({'phase':phase}),flush=True);os._exit(73)

def authority_state(c):
    return dict(generation=c.execute('SELECT generation FROM meta').fetchone()[0],
                purges=c.execute('SELECT * FROM purge ORDER BY target').fetchall(),
                intents=c.execute('SELECT * FROM intent ORDER BY origin').fetchall())

def fingerprint(state):return hashlib.sha256(json.dumps(state,sort_keys=True).encode()).hexdigest()

def seal(folder):
    # Témoin courant de fixture, non restauré avec les snapshots testés.
    with closing(connect(folder/'authority.sqlite')) as c:state=authority_state(c)
    (folder/'trusted_checkpoint.json').write_text(json.dumps(dict(generation=state['generation'],digest=fingerprint(state))),encoding='utf-8')

def backup(source,destination):
    with closing(connect(source)) as s,closing(sqlite3.connect(destination)) as d:s.backup(d)

def initialize(folder):
    with closing(connect(folder/'app.sqlite')) as c:
        c.executescript("CREATE TABLE gate(open INTEGER,epoch INTEGER); INSERT INTO gate VALUES(0,1); CREATE TABLE object(id TEXT PRIMARY KEY,content TEXT,allowed INTEGER); INSERT INTO object VALUES('gone','old content',1),('keep','current content',1); CREATE TABLE derived(target TEXT PRIMARY KEY,content TEXT); INSERT INTO derived VALUES('gone','old index'); CREATE TABLE effect(origin TEXT PRIMARY KEY,target TEXT,delta TEXT);")
    with closing(connect(folder/'authority.sqlite')) as c:
        c.executescript('CREATE TABLE meta(generation INTEGER); INSERT INTO meta VALUES(1); CREATE TABLE purge(target TEXT PRIMARY KEY); CREATE TABLE intent(origin TEXT PRIMARY KEY,target TEXT,delta TEXT,ack INTEGER);')
    backup(folder/'app.sqlite',folder/'old_app.sqlite')
    backup(folder/'authority.sqlite',folder/'old_authority.sqlite')
    seal(folder)

def worker(a):
    folder=Path(a.folder)
    with closing(connect(folder/'app.sqlite')) as app:
        app.execute('UPDATE gate SET open=0')
        authority_path=folder/'authority.sqlite'
        if not authority_path.exists():return {'status':'closed','reason':'authority_missing'}
        try:
            with closing(connect(authority_path)) as authority:
                authority.execute('BEGIN IMMEDIATE')
                witness=json.loads((folder/'trusted_checkpoint.json').read_text(encoding='utf-8'))
                state=authority_state(authority)
                if witness!={'generation':state['generation'],'digest':fingerprint(state)}:
                    return {'status':'closed','reason':'authority_stale_or_corrupt'}
                if a.action=='write':
                    authority.execute("INSERT OR IGNORE INTO intent VALUES('op1','keep','author delta',0)")
                    authority.execute('UPDATE meta SET generation=generation+1')
                    authority.execute('COMMIT')
                    crash('after_intent_commit',a.fault)
                    app.execute('BEGIN IMMEDIATE')
                    app.execute("INSERT OR IGNORE INTO effect VALUES('op1','keep','author delta')")
                    app.execute('COMMIT')
                    crash('after_effect_commit',a.fault)
                    authority.execute("UPDATE intent SET ack=1 WHERE origin='op1'")
                    return {'status':'integrated'}
                app.execute('BEGIN IMMEDIATE')
                for (target,) in state['purges']:
                    app.execute('DELETE FROM object WHERE id=?',(target,))
                    app.execute('DELETE FROM derived WHERE target=?',(target,))
                    app.execute('DELETE FROM effect WHERE target=?',(target,))
                reconstructed=0
                for origin,target,delta,ack in state['intents']:
                    row=app.execute('SELECT target,delta FROM effect WHERE origin=?',(origin,)).fetchone()
                    if row:
                        if tuple(row)!=(target,delta):
                            app.execute('ROLLBACK');return {'status':'closed','reason':'effect_conflict'}
                        continue
                    if not app.execute('SELECT 1 FROM object WHERE id=? AND allowed=1',(target,)).fetchone():
                        app.execute('ROLLBACK');return {'status':'closed','reason':'effect_not_reconstructible'}
                    app.execute('INSERT INTO effect VALUES(?,?,?)',(origin,target,delta));reconstructed+=1
                app.execute('UPDATE gate SET open=1,epoch=epoch+1')
                crash('before_recovery_commit',a.fault)
                app.execute('COMMIT');authority.execute('COMMIT')
                return {'status':'open','reconstructed_effects':reconstructed}
        except (sqlite3.DatabaseError,OSError,ValueError,KeyError):
            return {'status':'closed','reason':'authority_unverifiable'}

def snapshot(folder):
    with closing(connect(folder/'app.sqlite')) as c:
        opened,epoch=c.execute('SELECT * FROM gate').fetchone()
        return dict(open=opened,epoch=epoch,objects=c.execute('SELECT * FROM object ORDER BY id').fetchall(),
                    derived=c.execute('SELECT * FROM derived').fetchall(),effects=c.execute('SELECT * FROM effect').fetchall(),
                    visible=c.execute('SELECT id FROM object WHERE allowed=1 ORDER BY id').fetchall() if opened else [])

def launch(folder,action='recover',fault=''):
    r=subprocess.run([sys.executable,str(HERE/'run.py'),'--worker','--folder',str(folder),'--action',action,'--fault',fault],
                     capture_output=True,text=True,encoding='utf-8',timeout=20)
    assert r.returncode==(73 if fault else 0),r.stderr
    return dict(action=action,fault=fault,exit_code=r.returncode,output=json.loads(r.stdout),durable_after=snapshot(folder))

def exercise(n,folder,traces):
    initialize(folder);before=snapshot(folder)
    def call(**kw):
        trace=launch(folder,**kw);traces.append(trace);return trace['output']
    if n in (1,2,3,4,8):
        with closing(connect(folder/'authority.sqlite')) as c:
            c.execute("INSERT INTO purge VALUES('gone')");c.execute('UPDATE meta SET generation=2')
        seal(folder)
        if n==2:(folder/'authority.sqlite').unlink()
        if n==3:backup(folder/'old_authority.sqlite',folder/'authority.sqlite')
        if n==4:
            with closing(connect(folder/'authority.sqlite')) as c:c.execute('DELETE FROM purge')
        if n==8:
            call(fault='before_recovery_commit');assert not snapshot(folder)['visible']
        result=call()
        if n in (2,3,4):assert result['status']=='closed'
        else:
            assert result=={'status':'open','reconstructed_effects':0}
            assert snapshot(folder)['objects']==[('keep','current content',1)] and not snapshot(folder)['derived']
    else:
        if n in (5,6):
            call(action='write',fault='after_intent_commit' if n==5 else 'after_effect_commit')
            assert len(snapshot(folder)['effects'])==(0 if n==5 else 1)
        else:
            assert call(action='write')=={'status':'integrated'}
            backup(folder/'old_app.sqlite',folder/'app.sqlite')
            assert not snapshot(folder)['effects']
        seal(folder) # publication de confiance simulée explicitement par le parent
        assert call()=={'status':'open','reconstructed_effects':0 if n==6 else 1}
        assert call()=={'status':'open','reconstructed_effects':0}
        assert snapshot(folder)['effects']==[('op1','keep','author delta')]
    after=snapshot(folder)
    if n in (2,3,4):assert not after['open'] and not after['visible']
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Purge actuelle avant ouverture du snapshot ancien','Autorité absente : fermeture',
            'Autorité restaurée ancienne : checkpoint courant refuse','Registre tronqué à génération identique : fermeture',
            'Intention durable sans effet : reconstruction unique','Effet commis sans accusé : effet reconnu sans doublon',
            'Effet perdu malgré reçu : reconstruction et rejeu','Panne de réconciliation : barrière puis reprise']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt04-a-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT04-A{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT04-A{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT04',lot='A',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_AUTORITE_RESTAURATION' if len(cases)==8 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT04_clos=False,NF05_qualifie=False,checkpoint_fiable_injecte=True,
           metadata=dict(os=platform.platform(),sqlite=sqlite3.sqlite_version,temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Checkpoint courant et droits injectés ; pas signature ni autorité matériellement indépendante.',
                   'Fichiers sur même poste, aucun domaine de panne indépendant.',
                   'Pas de perte simultanée du checkpoint ; sans autorité extérieure fiable, pas de fraîcheur prouvée.',
                   'Effet déterministe synthétique, pas paiements/notifications/effets externes.',
                   'Pas de chiffrement, perte de clé, médias volumineux, RPO/RTO représentatifs.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true')
    for name in ('folder','action','fault'):p.add_argument('--'+name)
    a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)))
    else:main()
