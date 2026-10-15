"""PT04 E : sauvegarde DPAPI, secret de reprise injecté par stdin, porte extérieure."""
import argparse
import base64
from contextlib import closing
import hashlib
import importlib.util
import json
import os
import platform
import secrets
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
import run as base

ROOT=base.ROOT;HERE=Path(__file__).resolve().parent
source=HERE.parent/'pt03/run_e.py'
spec=importlib.util.spec_from_file_location('pt03_dpapi',source);dpapi=importlib.util.module_from_spec(spec);spec.loader.exec_module(dpapi)
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT04_LOT_E.json'

def sha(data):return hashlib.sha256(data).hexdigest()

def gate(folder,value):
    with closing(base.connect(folder/'supervisor.sqlite')) as c:c.execute('UPDATE gate SET open=?',(value,))

def state(folder):
    with closing(base.connect(folder/'supervisor.sqlite')) as c:opened=c.execute('SELECT open FROM gate').fetchone()[0]
    return dict(supervisor_open=opened,media_present=(folder/'media.bin').exists(),application=base.snapshot(folder))

def initialize(folder,secret):
    base.initialize(folder)
    with closing(base.connect(folder/'supervisor.sqlite')) as c:c.executescript('CREATE TABLE gate(open INTEGER); INSERT INTO gate VALUES(0);')
    media=b'SYNTHETIC_MEDIA_BACKUP_PT04_E'
    rawdb=(folder/'old_app.sqlite').read_bytes()
    envelope=json.dumps(dict(format=1,database=base64.b64encode(rawdb).decode(),media=base64.b64encode(media).decode()),sort_keys=True).encode()
    protected=dpapi.transform(envelope,'PT04/BACKUP/'+secret,True)
    (folder/'archive.bin').write_bytes(protected)
    manifest=dict(database_digest=sha(rawdb),media_digest=sha(media))
    (folder/'trusted_manifest.json').write_text(json.dumps(manifest),encoding='utf-8')
    assert media not in protected
    return envelope

def worker(a,secret):
    folder=Path(a.folder);gate(folder,0)
    if not secret:return {'status':'closed','reason':'secret_unavailable'}
    try:
        envelope=json.loads(dpapi.transform((folder/'archive.bin').read_bytes(),'PT04/BACKUP/'+secret,False))
        if set(envelope)!={'format','database','media'} or envelope['format']!=1:raise ValueError('format')
        database=base64.b64decode(envelope['database'],validate=True);media=base64.b64decode(envelope['media'],validate=True)
        expected=json.loads((folder/'trusted_manifest.json').read_text(encoding='utf-8'))
        if expected!={'database_digest':sha(database),'media_digest':sha(media)}:
            return {'status':'closed','reason':'manifest_mismatch'}
        staging=folder/'restore.sqlite';staging.write_bytes(database)
        with closing(base.connect(staging)) as c:
            if c.execute('PRAGMA quick_check').fetchone()[0]!='ok':raise ValueError('database')
        base.backup(staging,folder/'app.sqlite')
        base.crash('after_database_restore',a.fault)
        pending=folder/'media.pending'
        with pending.open('wb') as f:f.write(media);f.flush();os.fsync(f.fileno())
        os.replace(pending,folder/'media.bin')
        # Reprise d'autorité réutilisée réellement, avant ouverture extérieure.
        outcome=base.worker(argparse.Namespace(folder=str(folder),action='recover',fault=''))
        if outcome['status']!='open':return {'status':'closed','reason':'authority_unreconciled'}
        gate(folder,1)
        return {'status':'restored','media_digest':sha(media)}
    except (OSError,ValueError,KeyError):return {'status':'closed','reason':'backup_unverifiable'}

def launch(folder,secret,fault=''):
    # Le secret n'est ni dans argv, ni enregistré dans les preuves, ni dans un fichier de clés.
    r=subprocess.run([sys.executable,str(HERE/'run_e.py'),'--worker','--folder',str(folder),'--fault',fault],
                     input=json.dumps({'secret':secret}),capture_output=True,text=True,encoding='utf-8',timeout=25)
    assert r.returncode==(73 if fault else 0),r.stderr
    return dict(secret_supplied=bool(secret),fault=fault,exit_code=r.returncode,output=json.loads(r.stdout),durable_after=state(folder))

def exercise(n,folder,traces):
    secret=secrets.token_hex(32);envelope=initialize(folder,secret);before=state(folder)
    def call(secret_value=secret,**kw):
        t=launch(folder,secret_value,**kw);traces.append(t);return t['output']
    archive=(folder/'archive.bin').read_bytes()
    if n==1:assert call(None)=={'status':'closed','reason':'secret_unavailable'}
    elif n==2:assert call(secrets.token_hex(32))=={'status':'closed','reason':'backup_unverifiable'}
    elif n==3:
        broken=bytearray(archive);broken[-1]^=1;(folder/'archive.bin').write_bytes(broken)
        assert call()=={'status':'closed','reason':'backup_unverifiable'}
        (folder/'archive.bin').write_bytes(archive)
    elif n==4:
        manifest=(folder/'trusted_manifest.json').read_bytes()
        (folder/'trusted_manifest.json').write_text('{}',encoding='utf-8')
        assert call()=={'status':'closed','reason':'manifest_mismatch'}
        (folder/'trusted_manifest.json').write_bytes(manifest)
    elif n==5:
        call(fault='after_database_restore');assert not state(folder)['supervisor_open'] and not state(folder)['media_present']
    else:
        newsecret=secrets.token_hex(32)
        (folder/'archive.bin').write_bytes(dpapi.transform(envelope,'PT04/BACKUP/'+newsecret,True))
        assert call(secret)=={'status':'closed','reason':'backup_unverifiable'}
        # L'ancienne sauvegarde conserve son ancienne capacité de déchiffrement.
        assert dpapi.transform(archive,'PT04/BACKUP/'+secret,False)==envelope
        traces.append({'old_archive_still_decryptable':True})
        secret=newsecret
    result=call(secret)
    assert result=={'status':'restored','media_digest':sha(b'SYNTHETIC_MEDIA_BACKUP_PT04_E')}
    after=state(folder);assert after['supervisor_open'] and after['media_present']
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Secret indisponible : refus puis récupération','Mauvais secret : refus puis secret correct',
            'Sauvegarde altérée : refus puis copie saine','Manifeste extérieur incohérent : refus',
            'Panne entre base et média : porte fermée puis reprise','Reprotection sous nouveau secret : ancien secret refusé par nouvelle archive']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt04-e-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT04-E{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT04-E{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_e.py',HERE/'run.py',source,HERE/'PROTOCOL.md']
    d=dict(prototype='PT04',lot='E',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_SAUVEGARDE_PROTEGEE' if len(cases)==6 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT04_clos=False,NF05_qualifie=False,escrow_secret_qualifie=False,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['DPAPI utilisateur Windows plus entropie secrète ; même profil/machine, pas PRA multiplateforme.',
                   'Secrets en mémoire parent et stdin, pas magasin/escrow indépendant ni récupération après perte du profil.',
                   'Manifeste et checkpoint fiables injectés ; protection autorité extérieure non qualifiée.',
                   'Déchiffrement crée staging clair temporaire ; effacement forensique mémoire/fichiers non démontré.',
                   'Reprotection ne révoque pas anciennes archives/secrets ; NF05 et RPO/RTO non qualifiés.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true');p.add_argument('--folder');p.add_argument('--fault');a=p.parse_args()
    if a.worker:print(json.dumps(worker(a,json.loads(sys.stdin.read())['secret'])))
    else:main()
