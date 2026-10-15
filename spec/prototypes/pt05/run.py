"""PT05 A : outbox SQLite, livraison répétable et fencing sous horloge injectée."""
import argparse
import concurrent.futures
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
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT05.json'

def connect(path):
    c=sqlite3.connect(path,timeout=15,isolation_level=None);c.execute('PRAGMA journal_mode=WAL');c.execute('PRAGMA synchronous=FULL');return c
def crash(phase,fault):
    if phase==fault:print(json.dumps({'phase':phase}),flush=True);os._exit(73)

def initialize(folder):
    with closing(connect(folder/'app.sqlite')) as c:
        c.executescript("CREATE TABLE authority(now INTEGER,allowed INTEGER); INSERT INTO authority VALUES(0,1); CREATE TABLE business(id TEXT PRIMARY KEY); CREATE TABLE outbox(id TEXT PRIMARY KEY,payload TEXT,published INTEGER); CREATE TABLE task(id TEXT PRIMARY KEY,payload TEXT,status TEXT,token INTEGER,deadline INTEGER); CREATE TABLE effect(id TEXT PRIMARY KEY,payload TEXT); CREATE TABLE receipt(id TEXT PRIMARY KEY,payload TEXT);")
    with closing(connect(folder/'queue.sqlite')) as c:c.execute('CREATE TABLE delivery(id TEXT PRIMARY KEY,payload TEXT)')

def worker(a):
    folder=Path(a.folder)
    with closing(connect(folder/'app.sqlite')) as c:
        if a.action=='create':
            c.execute('BEGIN IMMEDIATE');c.execute("INSERT OR IGNORE INTO business VALUES('job1')")
            c.execute("INSERT OR IGNORE INTO outbox VALUES('job1','synthetic delta',0)")
            crash('before_business_commit',a.fault);c.execute('COMMIT');crash('after_business_commit',a.fault)
            return {'status':'accepted'}
        if a.action=='dispatch':
            row=c.execute("SELECT payload FROM outbox WHERE id='job1'").fetchone()
            if not row:return {'status':'empty'}
            with closing(connect(folder/'queue.sqlite')) as q:
                q.execute('BEGIN IMMEDIATE');old=q.execute("SELECT payload FROM delivery WHERE id='job1'").fetchone()
                if old and old!=row:q.execute('ROLLBACK');return {'status':'conflict'}
                q.execute('INSERT OR IGNORE INTO delivery VALUES(?,?)',('job1',row[0]));q.execute('COMMIT')
            crash('after_queue_commit',a.fault)
            c.execute("UPDATE outbox SET published=1 WHERE id='job1'");return {'status':'published'}
        if a.action=='consume':
            with closing(connect(folder/'queue.sqlite')) as q:row=q.execute("SELECT payload FROM delivery WHERE id='job1'").fetchone()
            if not row:return {'status':'empty'}
            c.execute('BEGIN IMMEDIATE');old=c.execute("SELECT payload FROM task WHERE id='job1'").fetchone()
            if old and old!=row:c.execute('ROLLBACK');return {'status':'conflict'}
            c.execute('INSERT OR IGNORE INTO task VALUES(?,?,?,0,0)',('job1',row[0],'pending'));c.execute('COMMIT')
            return {'status':'queued'}
        c.execute('BEGIN IMMEDIATE')
        now,allowed=c.execute('SELECT * FROM authority').fetchone()
        row=c.execute("SELECT payload,status,token,deadline FROM task WHERE id='job1'").fetchone()
        if not row:c.execute('ROLLBACK');return {'status':'unavailable'}
        payload,status,token,deadline=row
        if a.action=='claim':
            if status not in ('pending','running') or (status=='running' and now<deadline):
                c.execute('ROLLBACK');return {'status':'busy'}
            c.execute("UPDATE task SET status='running',token=token+1,deadline=? WHERE id='job1'",(now+10,))
            c.execute('COMMIT');return {'status':'claimed','token':token+1}
        if a.action=='cancel':
            c.execute("UPDATE task SET status='cancelled',token=token+1 WHERE id='job1'")
            c.execute('COMMIT');return {'status':'cancelled'}
        if a.token!=token or not allowed or status not in ('running','done'):
            c.execute('ROLLBACK');return {'status':'refused'}
        if status=='done':c.execute('COMMIT');return {'status':'already_finalized'}
        if now>=deadline:c.execute('ROLLBACK');return {'status':'refused'}
        c.execute('INSERT INTO effect VALUES(?,?)',('job1',payload))
        c.execute('INSERT INTO receipt VALUES(?,?)',('job1',payload))
        c.execute("UPDATE task SET status='done' WHERE id='job1'")
        c.execute('COMMIT');crash('after_effect_commit',a.fault)
        return {'status':'finalized'}

def snapshot(folder):
    with closing(connect(folder/'app.sqlite')) as c,closing(connect(folder/'queue.sqlite')) as q:
        return {**{table:c.execute('SELECT * FROM '+table).fetchall() for table in ('business','outbox','task','effect','receipt')},
                'delivery':q.execute('SELECT * FROM delivery').fetchall()}

def launch(folder,action,token=0,fault=''):
    r=subprocess.run([sys.executable,str(HERE/'run.py'),'--worker','--folder',str(folder),'--action',action,'--token',str(token),'--fault',fault],
                     capture_output=True,text=True,encoding='utf-8',timeout=20)
    assert r.returncode==(73 if fault else 0),r.stderr
    return dict(action=action,token=token,fault=fault,exit_code=r.returncode,output=json.loads(r.stdout),durable_after=snapshot(folder))

def exercise(n,folder,traces):
    initialize(folder);before=snapshot(folder)
    def call(action,**kw):
        t=launch(folder,action,**kw);traces.append(t);return t['output']
    if n==1:
        call('create',fault='before_business_commit')
        assert not snapshot(folder)['business'] and not snapshot(folder)['outbox']
        assert call('dispatch')=={'status':'empty'}
    call('create',**({'fault':'after_business_commit'} if n==2 else {}))
    if n==3:call('dispatch',fault='after_queue_commit')
    call('dispatch');call('dispatch');call('consume');call('consume')
    token=call('claim')['token']
    if n==4:
        call('finish',token=token,fault='after_effect_commit')
        assert call('finish',token=token)=={'status':'already_finalized'}
    elif n==5:
        with closing(connect(folder/'app.sqlite')) as c:c.execute('UPDATE authority SET now=10')
        assert call('finish',token=token)=={'status':'refused'}
        newtoken=call('claim')['token'];assert newtoken>token
        assert call('finish',token=token)=={'status':'refused'}
        assert call('finish',token=newtoken)=={'status':'finalized'}
    elif n in (6,9):
        if n==6:call('cancel')
        else:
            with closing(connect(folder/'app.sqlite')) as c:c.execute('UPDATE authority SET allowed=0')
        assert call('finish',token=token)=={'status':'refused'}
    elif n==7:
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:launch(folder,'finish',token),range(2)))
        traces.extend(results);assert sorted(t['output']['status'] for t in results)==['already_finalized','finalized']
    else:
        if n==8:
            with closing(connect(folder/'queue.sqlite')) as q:q.execute("UPDATE delivery SET payload='conflicting delta'")
            assert call('dispatch')=={'status':'conflict'}
            assert call('consume')=={'status':'conflict'}
        assert call('finish',token=token)=={'status':'finalized'}
    after=snapshot(folder)
    assert len(after['business'])==len(after['outbox'])==len(after['delivery'])==len(after['task'])==1
    assert len(after['effect'])==len(after['receipt'])==(0 if n in (6,9) else 1)
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Transaction métier/outbox annulée : aucun travail publié','Commit métier puis dispatcher perdu : travail retrouvé',
            'Publication durable et accusé perdu : livraison rejouée','Effet commis puis réponse perdue : checkpoint rejoué',
            'Bail expiré et reprise : ancienne tentative refusée','Annulation avant finalisation : succès ancien refusé',
            'Deux finalisations concurrentes : un effet','Origine répétée avec empreinte différente : conflit',
            'Autorité retirée pendant travail : finalisation refusée']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt05-a-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT05-A{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT05-A{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT05',lot='A',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_OUTBOX_BAUX' if len(cases)==9 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT05_clos=False,capacite_production_qualifiee=False,
           metadata=dict(os=platform.platform(),sqlite=sqlite3.sqlite_version,temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Queue SQLite de banc, pas broker réseau, transporte exactement une fois non revendiqué.',
                   'Temps serveur injecté, bail 10 unités synthétiques ; aucune durée produit ratifiée.',
                   'Autorité booléenne et un effet local, pas moteur complet ni prestataire externe.',
                   'Pas charge représentative, renouvellement/suspension/effets partiels ou restauration de tokens qualifiés.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true')
    for key in ('folder','action','fault'):p.add_argument('--'+key)
    p.add_argument('--token',type=int,default=0);a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)))
    else:main()
