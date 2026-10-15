"""PT04 D : purge finie de corpus, dérivés, fichiers et restauration ancienne."""
import argparse
from contextlib import closing
import hashlib
import json
import shutil
import platform
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
import run as base

ROOT=base.ROOT;HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT04_LOT_D.json'
TARGETS=('root','copy1','copy2')

def initialize(folder):
    with closing(base.connect(folder/'app.sqlite')) as c:
        c.executescript('CREATE TABLE gate(open INTEGER); INSERT INTO gate VALUES(0); CREATE TABLE object(id TEXT PRIMARY KEY,parent TEXT); CREATE TABLE derived(id TEXT PRIMARY KEY,target TEXT); CREATE TABLE task(id TEXT PRIMARY KEY,target TEXT);')
        c.executemany('INSERT INTO object VALUES(?,?)',[('root',None),('copy1','root'),('copy2','copy1'),('other',None)])
        for oid in (*TARGETS,'other'):
            c.execute('INSERT INTO derived VALUES(?,?)',('index-'+oid,oid))
            c.execute('INSERT INTO task VALUES(?,?)',('job-'+oid,oid))
            (folder/(oid+'.bin')).write_bytes(('SYNTHETIC-'+oid).encode())
    base.backup(folder/'app.sqlite',folder/'backup.sqlite')
    for oid in (*TARGETS,'other'):shutil.copyfile(folder/(oid+'.bin'),folder/('backup-'+oid+'.bin'))
    with closing(base.connect(folder/'authority.sqlite')) as c:
        c.execute('CREATE TABLE purge(target TEXT PRIMARY KEY,filename TEXT)')
        c.executemany('INSERT INTO purge VALUES(?,?)',[(oid,oid+'.bin') for oid in TARGETS])
    (folder/'inventory.json').write_text(json.dumps({'complete':True}),encoding='utf-8')

def state(folder):
    with closing(base.connect(folder/'app.sqlite')) as c:
        gate=c.execute('SELECT open FROM gate').fetchone()[0]
        return dict(gate=gate,objects=c.execute('SELECT * FROM object ORDER BY id').fetchall(),
                    derived=c.execute('SELECT * FROM derived ORDER BY id').fetchall(),tasks=c.execute('SELECT * FROM task ORDER BY id').fetchall(),
                    media=[oid for oid in TARGETS if (folder/(oid+'.bin')).exists()],
                    backups_present=(folder/'backup.sqlite').exists() or any((folder/('backup-'+oid+'.bin')).exists() for oid in TARGETS),
                    visible=[r[0] for r in c.execute('SELECT id FROM object')] if gate else [])

def worker(a):
    folder=Path(a.folder)
    with closing(base.connect(folder/'app.sqlite')) as app,closing(base.connect(folder/'authority.sqlite')) as authority:
        app.execute('UPDATE gate SET open=0')
        authority.execute('BEGIN IMMEDIATE')
        targets=authority.execute('SELECT * FROM purge ORDER BY target').fetchall()
        # Autorité de portée précalculée dans la fixture, indépendante de la base restaurée.
        app.execute('BEGIN IMMEDIATE')
        for oid,filename in targets:
            app.execute('DELETE FROM derived WHERE target=?',(oid,))
            app.execute('DELETE FROM task WHERE target=?',(oid,))
            app.execute('DELETE FROM object WHERE id=?',(oid,))
        base.crash('before_canonical_commit',a.fault)
        app.execute('COMMIT')
        base.crash('after_canonical_commit',a.fault)
        for oid,filename in targets:
            # Ce banc n'accepte que ses noms fixes, pas un chemin arbitraire du registre.
            if oid not in TARGETS or filename!=oid+'.bin':return {'status':'closed','reason':'invalid_scope'}
            (folder/filename).unlink(missing_ok=True)
        app.execute('UPDATE gate SET open=1');authority.execute('COMMIT')
        after=state(folder)
        inventory=json.loads((folder/'inventory.json').read_text(encoding='utf-8'))
        complete=not after['backups_present'] and inventory['complete']
        return dict(status='operational_purged',fixture_scope_complete=complete,
                    residue='none_in_declared_fixture' if complete else 'backup_or_inventory_pending')

def launch(folder,fault=''):
    r=subprocess.run([sys.executable,str(HERE/'run_d.py'),'--worker','--folder',str(folder),'--fault',fault],
                     capture_output=True,text=True,encoding='utf-8',timeout=20)
    assert r.returncode==(73 if fault else 0),r.stderr
    return dict(fault=fault,exit_code=r.returncode,output=json.loads(r.stdout),durable_after=state(folder))

def exercise(n,folder,traces):
    initialize(folder);before=state(folder)
    def call(**kw):
        t=launch(folder,**kw);traces.append(t);return t['output']
    if n in (2,3):
        call(fault='before_canonical_commit' if n==2 else 'after_canonical_commit')
        interrupted=state(folder)
        assert not interrupted['gate'] and not interrupted['visible']
        assert len(interrupted['media'])==3
    first=call();assert not first['fixture_scope_complete']
    if n==4:
        base.backup(folder/'backup.sqlite',folder/'app.sqlite')
        for oid in TARGETS:shutil.copyfile(folder/('backup-'+oid+'.bin'),folder/(oid+'.bin'))
        assert len(state(folder)['media'])==3 and not state(folder)['gate']
        assert not call()['fixture_scope_complete']
    if n in (5,6):
        # Retrait des seules sauvegardes synthétiques explicitement créées dans ce dossier temporaire.
        (folder/'backup.sqlite').unlink()
        for oid in (*TARGETS,'other'):(folder/('backup-'+oid+'.bin')).unlink()
        if n==6:(folder/'inventory.json').write_text(json.dumps({'complete':False}),encoding='utf-8')
        assert call()['fixture_scope_complete']==(n==5)
    after=state(folder)
    assert after['objects']==[('other',None)] and not after['media']
    assert after['derived']==[('index-other','other')] and after['tasks']==[('job-other','other')]
    assert (folder/'other.bin').read_bytes()==b'SYNTHETIC-other'
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Purge racine/copies, index/tâches/médias ; sauvegarde résiduelle déclarée',
            'Panne avant commit canonique : fermeture et reprise','Panne après commit : médias résiduels puis reprise',
            'Sauvegarde ancienne restaurée : purge réappliquée avant ouverture',
            'Sauvegardes synthétiques retirées : périmètre fini sans résidu déclaré',
            'Inventaire incomplet : pas de déclaration de purge complète']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt04-d-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT04-D{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT04-D{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_d.py',HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT04',lot='D',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_PURGE_CONSERVATION' if len(cases)==6 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT04_clos=False,NF05_qualifie=False,effacement_forensique_demontre=False,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Portée de purge et inventaire injectés, pas parcours générique de filiations ou preuve de complétude globale.',
                   'Suppression logique et unlink de fichiers connus, pas effacement forensique SQLite/WAL/disque.',
                   'Copies à fichiers distincts ; mutualisation physique, clés partagées et conservation légale non éprouvées.',
                   'Registre extérieur supposé courant ; retentions et domaine de panne indépendant réservés.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true');p.add_argument('--folder');p.add_argument('--fault')
    a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)))
    else:main()
