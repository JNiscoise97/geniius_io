"""PT03 F : reconstruction sous registre de sécurité et chunks durables synthétiques."""
import argparse
from contextlib import closing
import hashlib
import json
import platform
import sqlite3
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from run import connect, crash

ROOT=Path(__file__).resolve().parents[3];HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT03_LOT_F.json'
PARTS=[b'SYNTHETIC_BINARY_PART_0',b'SYNTHETIC_BINARY_PART_1',b'SYNTHETIC_BINARY_PART_2']
def sha(b):return hashlib.sha256(b).hexdigest()

def initialize(folder):
    with closing(connect(folder/'server.sqlite')) as c:
        c.executescript("CREATE TABLE object(id TEXT PRIMARY KEY,content TEXT); INSERT INTO object VALUES('gone','old purged content'),('keep','allowed current');")
    with closing(connect(folder/'safety.sqlite')) as c:
        c.executescript("CREATE TABLE purge(id TEXT PRIMARY KEY); CREATE TABLE integrated(origin TEXT PRIMARY KEY); INSERT INTO integrated VALUES('op1'); CREATE TABLE effect(origin TEXT PRIMARY KEY); INSERT INTO effect VALUES('op1');")
    with closing(connect(folder/'local.sqlite')) as c:
        c.executescript("CREATE TABLE context(gate INTEGER,cursor INTEGER); INSERT INTO context VALUES(1,1); CREATE TABLE replica(id TEXT PRIMARY KEY,content TEXT); INSERT INTO replica VALUES('gone','old purged content'); CREATE TABLE journal(origin TEXT,delta TEXT); INSERT INTO journal VALUES('op1','author delta'); CREATE TABLE chunk(part INTEGER PRIMARY KEY,content BLOB); CREATE TABLE original(id INTEGER PRIMARY KEY,content BLOB); CREATE TABLE manifest(part INTEGER PRIMARY KEY,digest TEXT); CREATE TABLE file_manifest(digest TEXT);")
        c.executemany('INSERT INTO manifest VALUES(?,?)',[(i,sha(p)) for i,p in enumerate(PARTS)])
        c.execute('INSERT INTO file_manifest VALUES(?)',(sha(b''.join(PARTS)),))

def snapshot(folder):
    with closing(connect(folder/'local.sqlite')) as c,closing(connect(folder/'safety.sqlite')) as s:
        gate,cursor=c.execute('SELECT * FROM context').fetchone()
        return dict(gate=gate,cursor=cursor,replica=c.execute('SELECT * FROM replica ORDER BY id').fetchall(),
                    journal=c.execute('SELECT * FROM journal').fetchall(),
                    chunks=[(i,len(b),sha(b)) for i,b in c.execute('SELECT * FROM chunk ORDER BY part')],
                    originals=[(i,len(b),sha(b)) for i,b in c.execute('SELECT * FROM original')],
                    effects=s.execute('SELECT * FROM effect').fetchall(),
                    consultable=c.execute('SELECT * FROM replica ORDER BY id').fetchall() if gate else [])

def worker(a):
    folder=Path(a.folder)
    with closing(connect(folder/'local.sqlite')) as c,closing(connect(folder/'server.sqlite')) as server,closing(connect(folder/'safety.sqlite')) as safety:
        if a.action=='reconstruct':
            c.execute('UPDATE context SET gate=0')
            safety.execute('BEGIN IMMEDIATE')
            server.execute('BEGIN IMMEDIATE')
            purges={r[0] for r in safety.execute('SELECT id FROM purge')}
            # Registre de purge extérieur à la sauvegarde serveur restaurée.
            for oid in purges:server.execute('DELETE FROM object WHERE id=?',(oid,))
            server.execute('COMMIT')
            c.execute('BEGIN IMMEDIATE')
            c.execute('DELETE FROM replica')
            rows=server.execute('SELECT * FROM object ORDER BY id').fetchall()
            c.executemany('INSERT INTO replica VALUES(?,?)',rows)
            c.execute('UPDATE context SET gate=1,cursor=2')
            crash('before_reconstruction_commit',a.fault)
            c.execute('COMMIT');safety.execute('COMMIT')
            return {'status':'reconstructed'}
        if a.action=='integrate':
            safety.execute('BEGIN IMMEDIATE')
            if safety.execute("SELECT 1 FROM integrated WHERE origin='op1'").fetchone():
                safety.execute('COMMIT');return {'status':'already_integrated'}
            raise AssertionError('fixture missing durable receipt')
        if a.action=='chunk':
            if a.network!='wifi':return {'status':'network_deferred'}
            payload=PARTS[a.part]+(b'CORRUPT' if a.corrupt else b'')
            expected=c.execute('SELECT digest FROM manifest WHERE part=?',(a.part,)).fetchone()
            if not expected or expected[0]!=sha(payload):return {'status':'integrity_refused'}
            c.execute('BEGIN IMMEDIATE')
            c.execute('INSERT OR IGNORE INTO chunk VALUES(?,?)',(a.part,payload))
            crash('before_chunk_commit',a.fault)
            c.execute('COMMIT')
            crash('after_chunk_commit',a.fault)
            return {'status':'chunk_durable','part':a.part}
        if a.action=='finalize':
            c.execute('BEGIN IMMEDIATE')
            parts=c.execute('SELECT part,content FROM chunk ORDER BY part').fetchall()
            manifest=c.execute('SELECT part,digest FROM manifest ORDER BY part').fetchall()
            if [(i,sha(b)) for i,b in parts]!=manifest:
                c.execute('ROLLBACK');return {'status':'incomplete'}
            joined=b''.join(b for _,b in parts)
            if sha(joined)!=c.execute('SELECT digest FROM file_manifest').fetchone()[0]:
                c.execute('ROLLBACK');return {'status':'integrity_refused'}
            c.execute('INSERT OR IGNORE INTO original VALUES(1,?)',(joined,))
            c.execute('COMMIT');return {'status':'available','digest':sha(joined)}
        raise ValueError(a.action)

def call(folder,action,**kw):
    cmd=[sys.executable,str(HERE/'run_f.py'),'--worker','--folder',str(folder),'--action',action]
    for name,value in kw.items():
        if name=='corrupt':
            if value:cmd.append('--corrupt')
        else:cmd+=['--'+name,str(value)]
    r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',timeout=25)
    assert r.returncode==(73 if kw.get('fault') else 0),r.stderr
    return dict(action=action,parameters=kw,exit_code=r.returncode,output=json.loads(r.stdout),durable_after=snapshot(folder))

def exercise(n,folder,traces):
    initialize(folder);before=snapshot(folder)
    def invoke(action,**kw):
        t=call(folder,action,**kw);traces.append(t);return t['output']
    if n in (1,2,3):
        if n==3:
            backup=folder/'old_server.sqlite'
            with closing(connect(folder/'server.sqlite')) as s,closing(sqlite3.connect(backup)) as b:s.backup(b)
        with closing(connect(folder/'safety.sqlite')) as s:s.execute("INSERT INTO purge VALUES('gone')")
        if n==3:
            with closing(connect(folder/'server.sqlite')) as s:s.execute("DELETE FROM object WHERE id='gone'")
            with closing(sqlite3.connect(backup)) as b,closing(connect(folder/'server.sqlite')) as s:b.backup(s)
        if n==2:
            invoke('reconstruct',fault='before_reconstruction_commit')
            assert not snapshot(folder)['consultable']
            assert snapshot(folder)['replica']==before['replica']
        assert invoke('reconstruct')=={'status':'reconstructed'}
        assert invoke('integrate')=={'status':'already_integrated'}
        assert invoke('integrate')=={'status':'already_integrated'}
        assert snapshot(folder)['replica']==[['keep','allowed current']] or snapshot(folder)['replica']==[('keep','allowed current')]
    else:
        if n in (4,5):
            invoke('chunk',part=0,fault='before_chunk_commit' if n==4 else 'after_chunk_commit')
            assert len(snapshot(folder)['chunks'])==(0 if n==4 else 1)
        if n==6:
            assert invoke('chunk',part=1,corrupt=True)=={'status':'integrity_refused'}
            assert not snapshot(folder)['chunks']
        if n==8:
            assert invoke('chunk',part=0,network='cellular')=={'status':'network_deferred'}
            assert not snapshot(folder)['chunks']
        assert invoke('finalize')=={'status':'incomplete'}
        assert not snapshot(folder)['originals']
        for i in range(3):invoke('chunk',part=i)
        invoke('chunk',part=1) # rejeu sans doublon
        if n==7:
            with closing(connect(folder/'local.sqlite')) as c:c.execute("UPDATE file_manifest SET digest='invalid'")
            assert invoke('finalize')=={'status':'integrity_refused'}
            assert not snapshot(folder)['originals']
            with closing(connect(folder/'local.sqlite')) as c:c.execute('UPDATE file_manifest SET digest=?',(sha(b''.join(PARTS)),))
        assert invoke('finalize')=={'status':'available','digest':sha(b''.join(PARTS))}
        assert invoke('finalize')=={'status':'available','digest':sha(b''.join(PARTS))}
        assert len(snapshot(folder)['chunks'])==3 and len(snapshot(folder)['originals'])==1
    after=snapshot(folder)
    assert before['journal']==after['journal'] and before['effects']==after['effects']
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Curseur ancien : purge avant reconstruction','Panne de reconstruction : barrière puis reprise',
            'Serveur restauré avant purge : registre extérieur et reçu empêchent résurrection/double effet',
            'Panne avant commit chunk, reprise','Chunk durable et accusé perdu, rejeu',
            'Chunk corrompu refusé puis reprise saine','Manifeste global incohérent : disponibilité refusée',
            'Réseau non autorisé : transfert différé puis reprise']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt03-f-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT03-F{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT03-F{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_f.py',HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT03',lot='F',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_LOT_F' if len(cases)==8 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           SQL_execute=True,HTTP_execute=False,chiffrement_execute=False,PT03_clos=False,
           metadata=dict(os=platform.platform(),sqlite=sqlite3.sqlite_version,temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Chunks minuscules dans SQLite ; pas stockage objet, volume lourd ni débit réseau mesurés.',
                   'Politique réseau injectée ; aucune détection réseau OS ou transport authentifié.',
                   'Registre sécurité extérieur conservé, pas restauration simultanée de tous les magasins.',
                   'Droits et curseur synthétiques ; génération fixe, pas protocole complet de reconstruction.',
                   'Empreintes de manifeste supposées fiables ; authenticité à éprouver ; PT04 reste à exécuter.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true');p.add_argument('--corrupt',action='store_true')
    for key in ('folder','action','fault'):p.add_argument('--'+key)
    p.add_argument('--part',type=int);p.add_argument('--network',default='wifi')
    a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)))
    else:main()
