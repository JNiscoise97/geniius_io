"""Lot B : barrière locale, retraits durables et générations, SQLite synthétique."""
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
from run import connect, crash

ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT03_LOT_B.json'

def initialize(folder):
    server=folder/'server.sqlite';local=folder/'local.sqlite'
    with closing(connect(server)) as c:
        c.executescript('''
        CREATE TABLE authority(generation INTEGER,device_active INTEGER);
        INSERT INTO authority VALUES(1,1);
        CREATE TABLE object(id TEXT PRIMARY KEY,allowed INTEGER,content TEXT);
        INSERT INTO object VALUES('old',1,'canonical old'),('new',1,'canonical new'),('never',0,'secret never delivered');
        CREATE TABLE delivered(id TEXT PRIMARY KEY);
        INSERT INTO delivered VALUES('old');
        CREATE TABLE receipt(origin TEXT PRIMARY KEY,delta TEXT,status TEXT);
        CREATE TABLE effect(origin TEXT PRIMARY KEY);
        ''')
    with closing(connect(local)) as c:
        c.executescript('''
        CREATE TABLE context(gate INTEGER,generation INTEGER,pending TEXT);
        INSERT INTO context VALUES(1,1,NULL);
        CREATE TABLE replica(id TEXT PRIMARY KEY,content TEXT);
        INSERT INTO replica VALUES('old','canonical old');
        CREATE TABLE derived(id TEXT PRIMARY KEY,target TEXT,content TEXT);
        INSERT INTO derived VALUES('thumbnail','old','derived old'),('index','old','derived old');
        CREATE TABLE journal(origin TEXT PRIMARY KEY,delta TEXT);
        INSERT INTO journal VALUES('op1','author delta without canonical snapshot');
        ''')
    return server,local

def snapshot(server,local):
    with closing(connect(server)) as s,closing(connect(local)) as l:
        gate,gen,pending=l.execute('SELECT * FROM context').fetchone()
        return dict(authority=list(s.execute('SELECT * FROM authority').fetchone()),gate=gate,generation=gen,
                    pending=json.loads(pending) if pending else None,
                    replica=l.execute('SELECT * FROM replica ORDER BY id').fetchall(),
                    derived=l.execute('SELECT * FROM derived ORDER BY id').fetchall(),
                    journal=l.execute('SELECT * FROM journal').fetchall(),
                    receipts=s.execute('SELECT * FROM receipt').fetchall(),effects=s.execute('SELECT * FROM effect').fetchall(),
                    consultable=l.execute('SELECT * FROM replica ORDER BY id').fetchall() if gate else [])

def worker(a):
    with closing(connect(a.server)) as s,closing(connect(a.local)) as l:
        s.execute('BEGIN IMMEDIATE') # garde serveur de banc, conservée jusqu'au commit local
        generation,active=s.execute('SELECT * FROM authority').fetchone()
        if a.action in ('restrict','revoke'):
            s.execute('UPDATE authority SET generation=generation+1')
            if a.action=='restrict':s.execute("UPDATE object SET allowed=0 WHERE id='old'")
            else:s.execute('UPDATE authority SET device_active=0')
            s.execute('COMMIT');return {'status':'changed'}
        if a.action=='stage':
            # Fermeture persistée avant tout retrait ; journal indépendant.
            l.execute('BEGIN IMMEDIATE')
            l.execute('UPDATE context SET gate=0')
            removals=[r[0] for r in s.execute('SELECT d.id FROM delivered d JOIN object o ON o.id=d.id WHERE o.allowed=0 OR ?=0 ORDER BY d.id',(active,))]
            batch={'generation':generation,'removals':removals}
            l.execute('UPDATE context SET pending=?',(json.dumps(batch),))
            l.execute('COMMIT');s.execute('COMMIT')
            return {'status':'withdrawals_prepared','batch':batch}
        if a.action=='apply':
            gate,gen,pending=l.execute('SELECT * FROM context').fetchone()
            batch=json.loads(pending) if pending else None
            if not batch or batch['generation']!=generation:
                l.execute('UPDATE context SET gate=0');s.execute('COMMIT')
                return {'status':'reconcile_required'}
            l.execute('BEGIN IMMEDIATE')
            for target in batch['removals']:
                l.execute('DELETE FROM replica WHERE id=?',(target,))
                l.execute('DELETE FROM derived WHERE target=?',(target,))
            l.execute('UPDATE context SET gate=?,generation=?,pending=NULL',(int(bool(active)),generation))
            crash('before_withdrawal_commit',a.fault)
            l.execute('COMMIT')
            crash('after_withdrawal_commit',a.fault)
            s.execute('COMMIT');return {'status':'withdrawals_applied','generation':generation}
        if not active:
            l.execute('UPDATE context SET gate=0');s.execute('COMMIT')
            return {'status':'unavailable'}
        if a.action in ('receive','integrate'):
            if a.action=='receive':
                s.execute("INSERT OR IGNORE INTO receipt VALUES('op1','author delta','received')")
            else:
                receipt=s.execute("SELECT 1 FROM receipt WHERE origin='op1'").fetchone()
                if not receipt:s.execute('COMMIT');return {'status':'unavailable'}
                s.execute("INSERT OR IGNORE INTO effect VALUES('op1')")
                s.execute("UPDATE receipt SET status='integrated' WHERE origin='op1'")
            s.execute('COMMIT');return {'status':a.action+'d'}
        if a.action=='page':
            gate,gen,pending=l.execute('SELECT * FROM context').fetchone()
            if not gate or pending or gen!=generation or a.generation!=generation:
                l.execute('UPDATE context SET gate=0');s.execute('COMMIT')
                return {'status':'reconcile_required'}
            row=s.execute('SELECT id,content FROM object WHERE id=? AND allowed=1',(a.target,)).fetchone()
            if not row:s.execute('COMMIT');return {'status':'unavailable'}
            l.execute('BEGIN IMMEDIATE')
            l.execute('INSERT OR REPLACE INTO replica VALUES(?,?)',row)
            l.execute('COMMIT')
            # delivered est publié après commit local ; un replay répare une réponse perdue.
            s.execute('INSERT OR IGNORE INTO delivered VALUES(?)',(a.target,))
            s.execute('COMMIT');return {'status':'page_applied','generation':generation}
        raise ValueError(a.action)

def launch(server,local,action,fault='',generation=1,target='new'):
    cmd=[sys.executable,str(HERE/'run_b.py'),'--worker','--server',str(server),'--local',str(local),
         '--action',action,'--fault',fault,'--generation',str(generation),'--target',target]
    r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',timeout=25)
    assert r.returncode==(73 if fault else 0),r.stderr
    return dict(action=action,fault=fault,exit_code=r.returncode,output=json.loads(r.stdout))

def exercise(n,server,local,traces):
    before=snapshot(server,local)
    def call(action,**kw):
        t=launch(server,local,action,**kw);t['durable_after']=snapshot(server,local);traces.append(t);return t['output']
    call('restrict')
    if n in (1,2):
        call('stage')
        assert call('page',generation=2)['status']=='reconcile_required'
        call('apply',fault='before_withdrawal_commit' if n==1 else 'after_withdrawal_commit')
        interrupted=snapshot(server,local)
        assert not interrupted['consultable']
        assert bool(interrupted['replica'])==(n==1)
        assert bool(interrupted['derived'])==(n==1)
        call('stage');call('apply')
        assert call('page',generation=2)['status']=='page_applied'
    elif n==3:
        call('stage');call('apply')
        assert call('page',generation=1)['status']=='reconcile_required'
        assert not snapshot(server,local)['consultable']
        call('stage');call('apply');call('page',generation=2)
    elif n==4:
        batch=call('stage')['batch']
        assert batch=={'generation':2,'removals':['old']}
        call('apply');call('stage');call('apply')
        assert call('page',generation=2,target='never')=={'status':'unavailable'}
        assert call('page',generation=2,target='absent')=={'status':'unavailable'}
    elif n==5:
        call('stage');call('revoke')
        assert call('apply')['status']=='reconcile_required'
        for action in ('page','receive','integrate'):
            assert call(action,generation=3)=={'status':'unavailable'}
        call('stage');call('apply')
    elif n==6:
        call('receive');call('revoke')
        assert call('integrate')=={'status':'unavailable'}
        call('stage');call('apply')
    after=snapshot(server,local)
    assert before['journal']==after['journal']
    assert not after['derived']
    assert all(r[0]!='old' for r in after['replica'])
    assert not after['effects']
    assert len(after['receipts'])==(1 if n==6 else 0)
    assert [r[0] for r in after['replica']]==(['new'] if n in (1,2,3) else [])
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Panne avant commit retraits, barrière fermée et reprise',
            'Commit retraits puis accusé perdu, rejeu sans résurrection',
            'Page ancienne après changement de génération refusée',
            'Retraits limités aux cibles délivrées, sans motif ni oracle',
            'Révocation entre préparation et application, métier refusé',
            'Delta reçu avant révocation, intégration refusée et journal intact']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt03-b-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();server,local=initialize(folder);traces=[]
                try:
                    before,after=exercise(n,server,local,traces)
                    cases.append(dict(id=f'PT03-B{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT03-B{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_b.py',HERE/'run.py',HERE/'PROTOCOL.md']
    data=dict(prototype='PT03',lot='B',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
              verdict='PARTIEL_LOT_B' if len(cases)==6 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
              SQL_execute=True,HTTP_execute=False,chiffrement_execute=False,PT03_clos=False,
              metadata=dict(os=platform.platform(),sqlite=sqlite3.sqlite_version,temporary_files_removed=not fatal,cloud_cost_euros=0),
              limits=['SQLite et permissions synthétiques ; aucune authentification réelle.',
                      'Garde serveur de banc durant commit local ; pas de réseau ni transaction distribuée réelle.',
                      'Retrait hors ligne immédiat non promis ; continuité horloge et chiffrement non éprouvés.',
                      'Registre delivered préexistant ; atomicité initiale de remise/registre non qualifiée.'],
              sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=data['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(data['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true')
    for key in ('server','local','action','fault','target'):p.add_argument('--'+key)
    p.add_argument('--generation',type=int)
    a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)),flush=True)
    else:main()
