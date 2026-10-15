"""PT06 E : export fichiers/manifeste sous garde, reprise et réimport isolé."""
import argparse
import base64
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
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT06_LOT_E.json'

def connect(path):
    c=sqlite3.connect(path,timeout=15,isolation_level=None);c.execute('PRAGMA journal_mode=WAL');c.execute('PRAGMA synchronous=FULL');return c
def sha(data):return hashlib.sha256(data).hexdigest()
def publish(path,data):
    staging=path.with_suffix('.pending')
    with staging.open('wb') as f:f.write(data);f.flush();os.fsync(f.fileno())
    os.replace(staging,path)

def initialize(folder):
    with closing(connect(folder/'source.sqlite')) as c:
        c.executescript('CREATE TABLE authority(generation INTEGER,actor TEXT,device TEXT); INSERT INTO authority VALUES(1,\'A\',\'D\'); CREATE TABLE object(id TEXT PRIMARY KEY,allowed INTEGER,version INTEGER,provenance TEXT,protection TEXT,media BLOB);')
        c.executemany('INSERT INTO object VALUES(?, ?,1,?,?,?)',[(oid,allowed,'source:'+oid,'ordinary' if allowed else 'hidden',('SYNTHETIC_MEDIA_'+oid).encode()) for oid,allowed in [('o1',1),('o2',1),('hidden',0)]])
        manifest=dict(format=1,protocol=1,schema=1,referential=1,generation=1,actor='A',device='D',objects=[r[0] for r in c.execute('SELECT id FROM object WHERE allowed=1 ORDER BY id')])
    (folder/'request_manifest.json').write_text(json.dumps(manifest),encoding='utf-8')

def worker(a):
    folder=Path(a.folder);manifest=json.loads((folder/'request_manifest.json').read_text(encoding='utf-8'))
    hashes={}
    for oid in manifest['objects']:
        with closing(connect(folder/'source.sqlite')) as c:
            c.execute('BEGIN IMMEDIATE')
            generation,actor,device=c.execute('SELECT * FROM authority').fetchone()
            if (actor,device)!=(a.actor,a.device):return {'status':'refused'}
            if generation!=manifest['generation']:return {'status':'reconcile_required'}
            row=c.execute('SELECT version,provenance,protection,media FROM object WHERE id=? AND allowed=1',(oid,)).fetchone()
            if not row:return {'status':'refused'}
            version,provenance,protection,media=row
            exported=dict(id=oid,version=version,provenance=provenance,protection=protection,media=base64.b64encode(media).decode(),media_sha256=sha(media))
            data=json.dumps(exported,sort_keys=True).encode();publish(folder/(oid+'.json'),data)
            hashes[oid]=sha(data);c.execute('COMMIT') # garde conservée jusqu'à publication de la portion locale
        if a.fault and oid=='o1':print(json.dumps({'phase':'after_first_portion_publish'}),flush=True);os._exit(73)
    with closing(connect(folder/'source.sqlite')) as c:
        c.execute('BEGIN IMMEDIATE');generation,actor,device=c.execute('SELECT * FROM authority').fetchone()
        if generation!=manifest['generation'] or (actor,device)!=(a.actor,a.device):return {'status':'reconcile_required'}
        publish(folder/'completed_manifest.json',json.dumps(dict(manifest,hashes=hashes),sort_keys=True).encode());c.execute('COMMIT')
    return {'status':'export_complete','objects':len(hashes)}

def reimport(folder):
    try:
        manifest=json.loads((folder/'completed_manifest.json').read_text(encoding='utf-8'))
        if set(manifest)!={'format','protocol','schema','referential','generation','actor','device','objects','hashes'} or any(manifest[k]!=1 for k in ('format','protocol','schema','referential')):return {'status':'format_refused'}
        if not isinstance(manifest['objects'],list) or set(manifest['objects'])!=set(manifest['hashes']):return {'status':'format_refused'}
        rows=[]
        for oid in manifest['objects']:
            if not isinstance(oid,str) or not oid.isalnum() or len(oid)>32:return {'status':'format_refused'}
            raw=(folder/(oid+'.json')).read_bytes()
            if sha(raw)!=manifest['hashes'][oid]:return {'status':'integrity_refused'}
            obj=json.loads(raw)
            if set(obj)!={'id','version','provenance','protection','media','media_sha256'} or obj['id']!=oid:return {'status':'format_refused'}
            media=base64.b64decode(obj['media'],validate=True)
            if sha(media)!=obj['media_sha256']:return {'status':'integrity_refused'}
            rows.append((oid,obj['version'],obj['provenance'],obj['protection'],media))
        with closing(connect(folder/'control_import.sqlite')) as c:
            c.execute('BEGIN IMMEDIATE');c.execute('CREATE TABLE IF NOT EXISTS object(id TEXT PRIMARY KEY,version INTEGER,provenance TEXT,protection TEXT,media BLOB)')
            for row in rows:c.execute('INSERT OR REPLACE INTO object VALUES(?,?,?,?,?)',row)
            c.execute('COMMIT')
        return {'status':'control_imported','objects':len(rows),'authorization_granted':False}
    except (ValueError,OSError,TypeError):return {'status':'format_refused'}

def launch(folder,actor='A',device='D',fault=False):
    cmd=[sys.executable,str(HERE/'run_e.py'),'--worker','--folder',str(folder),'--actor',actor,'--device',device]
    if fault:cmd.append('--fault')
    r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',timeout=20);assert r.returncode==(73 if fault else 0),r.stderr
    return dict(exit_code=r.returncode,output=json.loads(r.stdout),published=sorted(p.name for p in folder.glob('o*.json')),completed=(folder/'completed_manifest.json').exists())

def exercise(n,folder,traces):
    initialize(folder)
    def call(**kw):
        t=launch(folder,**kw);traces.append(t);return t['output']
    if n in (2,3):
        call(fault=True);assert not (folder/'completed_manifest.json').exists()
    if n==3:
        with closing(connect(folder/'source.sqlite')) as c:
            c.execute("UPDATE object SET allowed=0 WHERE id='o2'");c.execute('UPDATE authority SET generation=2')
        assert call()=={'status':'reconcile_required'}
        assert not (folder/'o2.json').exists() and not (folder/'completed_manifest.json').exists()
        return {'completed':False,'old_portion_already_delivered':True}
    if n==6:
        assert call(actor='B')=={'status':'refused'}
        assert call(device='E')=={'status':'refused'}
        assert not list(folder.glob('o*.json'));return {'completed':False,'wrong_context_refused':True}
    assert call()=={'status':'export_complete','objects':2}
    assert not (folder/'hidden.json').exists()
    if n==4:(folder/'o2.json').write_bytes(b'CORRUPTED')
    if n==5:
        p=folder/'completed_manifest.json';manifest=json.loads(p.read_text(encoding='utf-8'));manifest['schema']=999;p.write_text(json.dumps(manifest),encoding='utf-8')
    result=reimport(folder);traces.append({'reimport':result})
    assert result['status']==({4:'integrity_refused',5:'format_refused'}.get(n,'control_imported'))
    if n in (1,2):
        with closing(connect(folder/'source.sqlite')) as source,closing(connect(folder/'control_import.sqlite')) as imported:
            expected=source.execute('SELECT id,version,provenance,protection,media FROM object WHERE allowed=1 ORDER BY id').fetchall()
            assert imported.execute('SELECT * FROM object ORDER BY id').fetchall()==expected
    else:assert not (folder/'control_import.sqlite').exists()
    return {'completed':True,'control_import_status':result['status'],'hidden_omitted':True}

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Export filtré avec provenance/médias et réimport identique',
            'Interruption après portion : reprise sans faux achèvement',
            'Révocation entre portions : ancienne génération refusée',
            'Portion corrompue : réimport atomique refusé','Version inconnue : pas réinterprétation silencieuse',
            'Mauvais compte/appareil : aucune portion publiée']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt06-e-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:cases.append(dict(id=f'PT06-E{n:02d}',label=label,status='PASS',after=exercise(n,folder,traces),traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT06-E{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_e.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT06',lot='E',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_EXPORT_RECUPERATION' if len(cases)==6 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT06_clos=False,reversibilite_patrimoine_complet_qualifiee=False,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Fichiers JSON/base64 locaux, pas réseau/stockage final, compression ou gros patrimoines.',
                   'Autorité booléenne/génération et compte/appareil injectés ; pas identité réelle ni contrat complet.',
                   'Manifestes/empreintes non signés, authenticité externe non qualifiée.',
                   'Réimport isolé de contrôle sans permission, pas import Core ou migration fournisseur complète.',
                   'Portion déjà délivrée avant révocation ne peut pas être retirée au destinataire ; pas effacement distant.',
                   'Format fixe et médias minuscules, quotas/zip-bomb/archives concurrentes non éprouvés.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true');p.add_argument('--fault',action='store_true');p.add_argument('--folder');p.add_argument('--actor',default='A');p.add_argument('--device',default='D');a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)))
    else:main()
