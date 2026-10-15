"""PT04 C : dépôt fichier/base, sans transaction atomique entre les supports."""
import argparse
from contextlib import closing
import hashlib
import json
import os
import platform
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
import run as base

ROOT=base.ROOT;HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT04_LOT_C.json'
PAYLOAD=b'SYNTHETIC_DOCUMENT_SOURCE_PT04_C'*100
def sha(data):return hashlib.sha256(data).hexdigest()

def initialize(folder):
    with closing(base.connect(folder/'metadata.sqlite')) as c:
        c.executescript('CREATE TABLE manifest(id TEXT PRIMARY KEY,digest TEXT,size INTEGER); CREATE TABLE document(id TEXT PRIMARY KEY,digest TEXT,size INTEGER);')
        c.execute('INSERT INTO manifest VALUES(?,?,?)',('doc1',sha(PAYLOAD),len(PAYLOAD)))

def availability(folder):
    with closing(base.connect(folder/'metadata.sqlite')) as c:row=c.execute("SELECT digest,size FROM document WHERE id='doc1'").fetchone()
    path=folder/'doc1.bin'
    return bool(row and path.exists() and row==(sha(path.read_bytes()),path.stat().st_size))

def snapshot(folder):
    with closing(base.connect(folder/'metadata.sqlite')) as c:rows=c.execute('SELECT * FROM document').fetchall()
    return dict(metadata=rows,available=availability(folder),files=sorted(p.name for p in folder.glob('*.bin')),
                media_digest=sha((folder/'doc1.bin').read_bytes()) if (folder/'doc1.bin').exists() else None)

def worker(a):
    folder=Path(a.folder)
    if a.action=='consult':return {'status':'available' if availability(folder) else 'unavailable'}
    payload=PAYLOAD+(b'CONFLICT' if a.conflict else b'')
    with closing(base.connect(folder/'metadata.sqlite')) as c:
        expected=c.execute("SELECT digest,size FROM manifest WHERE id='doc1'").fetchone()
        if expected!=(sha(payload),len(payload)):return {'status':'conflict'}
        media=folder/'doc1.bin';staging=folder/'staging.bin'
        if media.exists():
            if (sha(media.read_bytes()),media.stat().st_size)!=expected:return {'status':'integrity_refused'}
        else:
            with staging.open('wb') as f:
                f.write(payload[:len(payload)//2]);f.flush()
                base.crash('partial_staging',a.fault)
                f.write(payload[len(payload)//2:]);f.flush();os.fsync(f.fileno())
            if (sha(staging.read_bytes()),staging.stat().st_size)!=expected:return {'status':'integrity_refused'}
            os.replace(staging,media)
        base.crash('after_media_publish',a.fault)
        c.execute('BEGIN IMMEDIATE')
        row=c.execute("SELECT digest,size FROM document WHERE id='doc1'").fetchone()
        if row and row!=expected:
            c.execute('ROLLBACK');return {'status':'conflict'}
        c.execute('INSERT OR IGNORE INTO document VALUES(?,?,?)',('doc1',expected[0],expected[1]))
        base.crash('before_metadata_commit',a.fault)
        c.execute('COMMIT')
        base.crash('after_metadata_commit',a.fault)
        return {'status':'confirmed','digest':expected[0]}

def launch(folder,action='deposit',fault='',conflict=False):
    cmd=[sys.executable,str(HERE/'run_c.py'),'--worker','--folder',str(folder),'--action',action,'--fault',fault]
    if conflict:cmd.append('--conflict')
    r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',timeout=20)
    assert r.returncode==(73 if fault else 0),r.stderr
    return dict(action=action,fault=fault,conflict=conflict,exit_code=r.returncode,output=json.loads(r.stdout),durable_after=snapshot(folder))

def exercise(n,folder,traces):
    initialize(folder);before=snapshot(folder)
    def call(**kw):
        t=launch(folder,**kw);traces.append(t);return t['output']
    if n<=4:
        call(fault=['partial_staging','after_media_publish','before_metadata_commit','after_metadata_commit'][n-1])
        interrupted=snapshot(folder)
        assert interrupted['available']==(n==4)
        assert bool(interrupted['metadata'])==(n==4)
        assert call()=={'status':'confirmed','digest':sha(PAYLOAD)}
        assert call()=={'status':'confirmed','digest':sha(PAYLOAD)}
    else:
        call()
        if n==5:
            (folder/'doc1.bin').write_bytes(b'CORRUPTED')
            assert call(action='consult')=={'status':'unavailable'}
            assert call()=={'status':'integrity_refused'}
        elif n==6:
            (folder/'doc1.bin').unlink()
            assert call(action='consult')=={'status':'unavailable'}
            assert call()=={'status':'confirmed','digest':sha(PAYLOAD)}
        else:
            assert call(conflict=True)=={'status':'conflict'}
            assert snapshot(folder)['media_digest']==sha(PAYLOAD)
    after=snapshot(folder)
    assert len(after['metadata'])==1 and after['available']==(n!=5)
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Fichier partiel : aucune confirmation puis reprise','Média publié avant base : orphelin repris',
            'Panne avant commit métadonnées : reprise unique','Commit base puis accusé perdu : rejeu',
            'Média corrompu : consultation et dépôt refusés','Média perdu : indisponibilité détectée puis réparation',
            'Identifiant réutilisé avec contenu différent : conflit sans écrasement']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt04-c-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT04-C{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT04-C{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_c.py',HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT04',lot='C',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_DEPOT_DOCUMENTAIRE' if len(cases)==7 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT04_clos=False,NF05_qualifie=False,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['fsync fichier et remplacement local, pas preuve de persistance matérielle du renommage sur coupure électrique.',
                   'Pas transaction atomique fichier/base ; états intermédiaires et réparation explicitement testés.',
                   'Manifeste et autorisation supposés fiables, pas moteur complet ni transport.',
                   'Pas concurrence entre dépôts, stockage objet, chiffrement ou gros volumes ; RPO médias non qualifié.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true');p.add_argument('--conflict',action='store_true')
    for key in ('folder','action','fault'):p.add_argument('--'+key)
    a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)))
    else:main()
