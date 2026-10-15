"""PT04 F : exercice combiné sauvegarde/base/média/purge/politiques/effets."""
import argparse
import base64
from contextlib import closing
import hashlib
import json
import os
import platform
import secrets
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
import run as base
import run_b as policies
import run_e as protected

ROOT=base.ROOT;HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT04_LOT_F.json'

def emit(phase):print(json.dumps(dict(phase=phase,monotone_ns=time.monotonic_ns())),flush=True)

def worker(a,secret):
    folder=Path(a.folder);protected.gate(folder,0);emit('barrier_closed')
    try:
        envelope=json.loads(protected.dpapi.transform((folder/'archive.bin').read_bytes(),'PT04/BACKUP/'+secret,False))
        database=base64.b64decode(envelope['database'],validate=True);media=base64.b64decode(envelope['media'],validate=True)
        manifest=json.loads((folder/'trusted_manifest.json').read_text(encoding='utf-8'))
        if manifest!={'database_digest':protected.sha(database),'media_digest':protected.sha(media)}:
            return {'status':'closed','reason':'manifest_mismatch'}
        emit('backup_verified')
        staging=folder/'restore.sqlite';staging.write_bytes(database)
        base.backup(staging,folder/'app.sqlite');emit('database_restored')
        outcome=policies.worker(argparse.Namespace(folder=str(folder),action='recover',fault=''))
        if outcome['status']!='open':return {'status':'closed','reason':outcome['reason']}
        emit('authority_reconciled')
        base.crash('after_authority_commit',a.fault)
        path=folder/'media.bin'
        with path.open('wb') as f:f.write(media);f.flush();os.fsync(f.fileno())
        if a.corrupt:path.write_bytes(b'CORRUPTED_AFTER_RESTORE')
        if protected.sha(path.read_bytes())!=manifest['media_digest']:
            return {'status':'closed','reason':'media_integrity_unknown'}
        emit('media_verified')
        protected.gate(folder,1);emit('service_opened')
        return {'status':'restored','reconstructed_effects':outcome['reconstructed_effects']}
    except (OSError,ValueError,KeyError):return {'status':'closed','reason':'restore_unverifiable'}

def launch(folder,secret,**kw):
    cmd=[sys.executable,str(HERE/'run_f.py'),'--worker','--folder',str(folder),'--fault',kw.get('fault','')]
    if kw.get('corrupt'):cmd.append('--corrupt')
    start=time.monotonic_ns()
    r=subprocess.run(cmd,input=json.dumps({'secret':secret}),capture_output=True,text=True,encoding='utf-8',timeout=25)
    assert r.returncode==(73 if kw.get('fault') else 0),r.stderr
    entries=[json.loads(line) for line in r.stdout.splitlines()]
    return dict(exit_code=r.returncode,elapsed_ms=(time.monotonic_ns()-start)/1e6,
                phases=[e for e in entries if 'monotone_ns' in e],output=entries[-1],durable_after=protected.state(folder))

def exercise(n,folder,traces):
    secret=secrets.token_hex(32);protected.initialize(folder,secret)
    with closing(base.connect(folder/'authority.sqlite')) as c:
        c.execute('CREATE TABLE policy(target TEXT PRIMARY KEY,active INTEGER)')
        c.execute("INSERT INTO purge VALUES('gone')")
        c.execute("INSERT INTO intent VALUES('op1','keep','author delta',1)")
        c.execute('UPDATE meta SET generation=2')
    policies.seal(folder)
    if n==2:
        with closing(base.connect(folder/'authority.sqlite')) as c:c.execute('DELETE FROM purge')
    before=protected.state(folder)
    def call(**kw):
        t=launch(folder,secret,**kw);traces.append(t);return t['output']
    if n==3:
        assert call(corrupt=True)=={'status':'closed','reason':'media_integrity_unknown'}
        assert not protected.state(folder)['supervisor_open']
    if n==4:
        call(fault='after_authority_commit');assert not protected.state(folder)['supervisor_open']
    outcome=call()
    if n==2:
        assert outcome=={'status':'closed','reason':'authority_stale_or_corrupt'}
        assert not protected.state(folder)['supervisor_open']
    else:
        assert outcome=={'status':'restored','reconstructed_effects':1}
        after=protected.state(folder)
        assert after['application']['objects']==[('keep','current content',1)]
        assert after['application']['effects']==[('op1','keep','author delta')]
        assert not after['application']['derived']
    return before,protected.state(folder)

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Archive ancienne protégée : purge actuelle et effet perdu réconciliés avant ouverture',
            'Archive saine mais autorité tronquée : service fermé','Média altéré après restauration : porte fermée puis reprise',
            'Panne après autorité avant média/ouverture : reprise complète']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt04-f-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT04-F{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT04-F{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/name for name in ('run_f.py','run_e.py','run_b.py','run.py','PROTOCOL.md')]+[protected.source]
    d=dict(prototype='PT04',lot='F',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_EXERCICE_COMBINE' if len(cases)==4 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT04_clos=False,NF05_qualifie=False,RPO_RTO_qualifies=False,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Corpus minuscule, chronométrage diagnostique incluant démarrage Python ; pas qualification RPO/RTO.',
                   'Checkpoint/manifeste/secret fiables injectés, même machine et profil ; pas PRA indépendant.',
                   'Base et média locaux, pas transport, stockage objet, charge ou domaines de panne indépendants.',
                   'Média de keep seulement ; copies/binaires purgés et sauvegardes du lot D non intégrés dans cet exercice.',
                   'Barrière extérieure de fixture, aucune preuve d’exposition concurrente ou de sessions après restaurations répétées.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true');p.add_argument('--corrupt',action='store_true');p.add_argument('--folder');p.add_argument('--fault');a=p.parse_args()
    if a.worker:print(json.dumps(worker(a,json.loads(sys.stdin.read())['secret'])))
    else:main()
