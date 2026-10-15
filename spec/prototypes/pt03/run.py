"""PT03 lot A : transactions SQLite réelles et interruptions de processus.

Fixture locale de mécanisme, sans transport, chiffrement ni authentification produit.
"""
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

ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT03.json'
SELF = Path(__file__).resolve()

def connect(path):
    conn = sqlite3.connect(path, timeout=15, isolation_level=None)
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA synchronous=FULL')
    conn.execute('PRAGMA foreign_keys=ON')
    return conn

def digest(payload):
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

def crash(at, requested):
    if at == requested:
        print(json.dumps({'phase':at, 'pid':os.getpid()}), flush=True)
        os._exit(73)

def worker(args):
    payload = json.loads(args.payload)
    key = (args.actor, args.device, args.origin)
    fingerprint = digest(payload)
    c = connect(args.database)
    try:
        c.execute('BEGIN IMMEDIATE')
        row = c.execute('SELECT fingerprint,status FROM receipt WHERE actor=? AND device=? AND origin=?', key).fetchone()
        if args.action == 'receive':
            if row and row[0] != fingerprint:
                c.execute('ROLLBACK')
                return {'status':'conflict'}
            if not row:
                c.execute('INSERT INTO receipt VALUES(?,?,?,?,?,?)', key+(fingerprint, json.dumps(payload), 'received'))
            crash('before_receipt_commit', args.crash)
            c.execute('COMMIT')
            crash('after_receipt_commit', args.crash)
            # Accusé technique privé, sans existence/résolution de cible.
            return {'status':'received'}
        if not row or row[0] != fingerprint:
            c.execute('ROLLBACK')
            return {'status':'unavailable'}
        permitted = c.execute('SELECT 1 FROM permission WHERE actor=? AND target=? AND active=1',
                             (args.actor, payload['target'])).fetchone()
        if not permitted:
            c.execute('COMMIT')
            return {'status':'unavailable'}
        if row[1] != 'integrated':
            c.execute('INSERT INTO effect(actor,device,origin,target,delta) VALUES(?,?,?,?,?)',
                      key+(payload['target'],payload['delta']))
            c.execute("UPDATE receipt SET status='integrated' WHERE actor=? AND device=? AND origin=?", key)
        crash('before_effect_commit', args.crash)
        c.execute('COMMIT')
        crash('after_effect_commit', args.crash)
        return {'status':'integrated'}
    finally:
        c.close()

def initialize(folder):
    server = folder/'server.sqlite'
    local = folder/'journal.sqlite'
    with closing(connect(server)) as c:
        c.executescript('''
        CREATE TABLE receipt(actor TEXT,device TEXT,origin TEXT,fingerprint TEXT,payload TEXT,status TEXT,
                             PRIMARY KEY(actor,device,origin));
        CREATE TABLE target(id TEXT PRIMARY KEY);
        CREATE TABLE permission(actor TEXT,target TEXT,active INTEGER,PRIMARY KEY(actor,target));
        CREATE TABLE effect(actor TEXT,device TEXT,origin TEXT,target TEXT REFERENCES target(id),delta TEXT,
                            PRIMARY KEY(actor,device,origin),
                            FOREIGN KEY(actor,device,origin) REFERENCES receipt(actor,device,origin));
        INSERT INTO target VALUES('visible'),('hidden');
        INSERT INTO permission VALUES('A','visible',1);
        ''')
    with closing(connect(local)) as c:
        c.execute('CREATE TABLE journal(origin TEXT PRIMARY KEY,payload TEXT)')
        c.execute('INSERT INTO journal VALUES(?,?)', ('op1',json.dumps({'target':'visible','delta':'new author text'})))
    return server, local

def launch(server, action='receive', fault='', payload=None, actor='A', device='D1', origin='op1'):
    payload = payload or {'target':'visible','delta':'new author text'}
    cmd = [sys.executable,str(SELF),'--worker','--database',str(server),'--action',action,
           '--crash',fault,'--payload',json.dumps(payload),'--actor',actor,'--device',device,'--origin',origin]
    result = subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',timeout=25)
    assert result.returncode == (73 if fault else 0), result.stderr
    return {'action':action,'fault':fault,'exit_code':result.returncode,
            'output':json.loads(result.stdout), 'actor':actor,'device':device,'origin':origin}

def state(server, local):
    with closing(connect(server)) as c:
        receipts = c.execute('SELECT actor,device,origin,fingerprint,status FROM receipt ORDER BY actor,device,origin').fetchall()
        effects = c.execute('SELECT actor,device,origin,target,delta FROM effect ORDER BY actor,device,origin').fetchall()
        durable = {'journal_mode':c.execute('PRAGMA journal_mode').fetchone()[0],
                   'synchronous':c.execute('PRAGMA synchronous').fetchone()[0]}
    with closing(connect(local)) as c:
        journal = c.execute('SELECT origin,payload FROM journal ORDER BY origin').fetchall()
    return dict(receipts=receipts,effects=effects,journal=journal,sqlite=durable)

def exercise(number, server, local, traces):
    def call(**kw):
        trace=launch(server,**kw);traces.append(trace);return trace['output']
    before=state(server,local)
    if number in (1,2):
        call(fault='before_receipt_commit' if number==1 else 'after_receipt_commit')
        interrupted=state(server,local);traces.append({'after_crash':interrupted})
        assert len(interrupted['receipts'])==(0 if number==1 else 1) and not interrupted['effects']
        assert call()=={'status':'received'}
        assert call()=={'status':'received'}
        assert call(action='integrate')=={'status':'integrated'}
    elif number in (3,4):
        call();call(action='integrate',fault='before_effect_commit' if number==3 else 'after_effect_commit')
        interrupted=state(server,local);traces.append({'after_crash':interrupted})
        assert len(interrupted['effects'])==(0 if number==3 else 1)
        assert interrupted['receipts'][0][-1]==('received' if number==3 else 'integrated')
        assert call(action='integrate')=={'status':'integrated'}
        assert call(action='integrate')=={'status':'integrated'}
    elif number==5:
        call()
        original=state(server,local)
        assert call(payload={'target':'visible','delta':'changed'})=={'status':'conflict'}
        assert state(server,local)==original
        call(action='integrate')
    elif number==6:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            receipts=list(pool.map(lambda _:launch(server),range(4)))
            effects=list(pool.map(lambda _:launch(server,action='integrate'),range(4)))
        traces.extend(receipts+effects)
        assert all(t['output']['status']=='received' for t in receipts)
        assert all(t['output']['status']=='integrated' for t in effects)
    elif number==7:
        call();call(action='integrate')
        with closing(connect(server)) as c:c.execute("UPDATE permission SET active=0 WHERE actor='A'")
        assert call(action='integrate')=={'status':'unavailable'}
        assert call()=={'status':'received'}
        assert call(actor='B',action='integrate')=={'status':'unavailable'}
        assert call(device='D2',action='integrate')=={'status':'unavailable'}
    elif number==8:
        for target in ('hidden','absent'):
            payload={'target':target,'delta':'author delta only'}
            assert call(payload=payload,origin=target)=={'status':'received'}
            assert call(payload=payload,origin=target,action='integrate')=={'status':'unavailable'}
    after=state(server,local)
    assert after['journal']==before['journal'], 'journal privé altéré'
    assert after['sqlite']=={'journal_mode':'wal','synchronous':2}
    assert len(after['receipts'])==(2 if number==8 else 1)
    assert len(after['effects'])==(0 if number==8 else 1)
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat()
    cases=[];fatal=None
    labels=['Panne avant commit réception','Commit réception puis accusé perdu',
            'Panne avant commit effet','Commit effet puis réponse perdue',
            'Origine identique avec delta différent','Rejeux concurrents en quatre processus',
            'Accusé intégré réévalué après retrait et contexte distinct',
            'Réception sans FK cible ; cible cachée/absente générique']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt03-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir()
                server,local=initialize(folder);traces=[]
                try:
                    before,after=exercise(n,server,local,traces)
                    cases.append(dict(id=f'PT03-A{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:
                    cases.append(dict(id=f'PT03-A{n:02d}',label=label,status='FAIL',error=str(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    files=[SELF,SELF.parent/'PROTOCOL.md']
    data=dict(started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),
              prototype='PT03',lot='A',cases=cases,fatal=fatal,
              metadata=dict(os=platform.platform(),python=sys.version,sqlite=sqlite3.sqlite_version,
                            storage='SQLite WAL synchronous FULL',child_processes=True,temporary_files_removed=not fatal,
                            cloud_cost_euros=0),
              SQL_execute=True,HTTP_execute=False,chiffrement_execute=False,PT03_clos=False,
              verdict='PARTIEL_LOT_A' if len(cases)==8 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
              limits=['Crash de processus, pas coupure électrique ni crash OS.',
                      'SQLite de banc ; aucun choix de stockage serveur/client.',
                      'Acteurs/appareils de fixture, pas authentification réelle ni transport.',
                      'Pas de chiffrement, de preuve de veille/horloge ou anti-rollback.',
                      'Lots B à F réservés ; droits simplifiés, aucune transposition complète Core/MPD.'],
              sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
    OUTPUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'verdict':data['verdict'],'cases_pass':sum(c['status']=='PASS' for c in cases),'fatal':fatal}))
    raise SystemExit(data['verdict']=='FAIL')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--worker',action='store_true')
    for name in ('database','action','crash','payload','actor','device','origin'):parser.add_argument('--'+name)
    args=parser.parse_args()
    if args.worker:
        print(json.dumps(worker(args)),flush=True)
    else:main()
