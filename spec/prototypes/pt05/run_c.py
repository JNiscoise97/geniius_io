"""PT05 C : prestataire synthétique local, résultat incertain et autorité actuelle."""
import argparse
from contextlib import closing
import hashlib
import json
import platform
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
import run as base
ROOT=base.ROOT;HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT05_LOT_C.json'

def initialize(folder):
    with closing(base.connect(folder/'client.sqlite')) as c:
        c.executescript("CREATE TABLE authority(allowed INTEGER); INSERT INTO authority VALUES(1); CREATE TABLE operation(id TEXT PRIMARY KEY,payload TEXT,phase TEXT,confirmed INTEGER); INSERT INTO operation VALUES('op1','synthetic operation','prepared',0);")
    with closing(base.connect(folder/'provider.sqlite')) as c:
        c.executescript('CREATE TABLE effect(seq INTEGER PRIMARY KEY AUTOINCREMENT,key TEXT,payload TEXT);')

def provider(folder,mode,payload,lookup=False):
    with closing(base.connect(folder/'provider.sqlite')) as c:
        c.execute('BEGIN IMMEDIATE')
        row=c.execute("SELECT payload FROM effect WHERE key='op1'").fetchone()
        if lookup:
            c.execute('COMMIT');return {'status':'found' if row else 'not_found'}
        if mode=='idempotent' and row:
            c.execute('COMMIT');return {'status':'existing' if row[0]==payload else 'conflict'}
        c.execute("INSERT INTO effect(key,payload) VALUES('op1',?)",(payload,));c.execute('COMMIT')
        return {'status':'performed'}

def remote(folder,mode,payload,lookup=False):
    cmd=[sys.executable,str(HERE/'run_c.py'),'--provider','--folder',str(folder),'--mode',mode,'--payload',payload]
    if lookup:cmd.append('--lookup')
    r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',timeout=20)
    assert r.returncode==0,r.stderr
    return json.loads(r.stdout)

def worker(a):
    folder=Path(a.folder)
    with closing(base.connect(folder/'client.sqlite')) as c:
        allowed=c.execute('SELECT allowed FROM authority').fetchone()[0]
        payload,phase,confirmed=c.execute("SELECT payload,phase,confirmed FROM operation WHERE id='op1'").fetchone()
        if a.action=='revoke':c.execute('UPDATE authority SET allowed=0');return {'status':'revoked'}
        if a.action=='consult':return {'status':'completed' if allowed and phase=='completed' else 'unavailable'}
        if confirmed:
            return {'status':'completed' if allowed and phase=='completed' else 'local_integration_refused'}
        if phase=='uncertain':
            if a.mode=='search':
                outcome=remote(folder,'plain',payload,lookup=True)
                if outcome['status']!='found':return {'status':'manual_required'}
            elif a.mode=='idempotent':
                if not allowed:return {'status':'manual_required'}
                outcome=remote(folder,a.mode,payload)
                if outcome['status'] not in ('existing','performed'):return {'status':'manual_required'}
            else:return {'status':'manual_required'}
        else:
            if not allowed:return {'status':'refused'}
            c.execute("UPDATE operation SET phase='uncertain' WHERE id='op1'") # persiste AVANT sortie
            outcome=remote(folder,'idempotent' if a.mode=='idempotent' else 'plain',payload)
            base.crash('after_external_commit',a.fault)
        if a.withdraw_after:c.execute('UPDATE authority SET allowed=0')
        # Recontrôle actuel à l'intégration locale, pas autorisation héritée du départ.
        c.execute('BEGIN IMMEDIATE')
        current=c.execute('SELECT allowed FROM authority').fetchone()[0]
        c.execute("UPDATE operation SET confirmed=1,phase=? WHERE id='op1'",('completed' if current else 'external_confirmed_blocked',))
        c.execute('COMMIT')
        return {'status':'completed' if current else 'local_integration_refused'}

def snapshot(folder):
    with closing(base.connect(folder/'client.sqlite')) as c,closing(base.connect(folder/'provider.sqlite')) as p:
        return dict(allowed=c.execute('SELECT allowed FROM authority').fetchone()[0],
                    operation=c.execute('SELECT * FROM operation').fetchall(),effects=p.execute('SELECT * FROM effect').fetchall())

def launch(folder,action='execute',mode='search',fault='',withdraw_after=False):
    cmd=[sys.executable,str(HERE/'run_c.py'),'--worker','--folder',str(folder),'--action',action,'--mode',mode,'--fault',fault]
    if withdraw_after:cmd.append('--withdraw-after')
    r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',timeout=20)
    assert r.returncode==(73 if fault else 0),r.stderr
    return dict(action=action,mode=mode,exit_code=r.returncode,output=json.loads(r.stdout),durable_after=snapshot(folder))

def exercise(n,folder,traces):
    initialize(folder);before=snapshot(folder)
    def call(**kw):
        t=launch(folder,**kw);traces.append(t);return t['output']
    if n==1:
        call(action='revoke');assert call()=={'status':'refused'}
    elif n in (2,3,4):
        mode={2:'search',3:'idempotent',4:'none'}[n]
        call(mode=mode,fault='after_external_commit')
        assert snapshot(folder)['operation'][0][2]=='uncertain'
        expected='manual_required' if n==4 else 'completed'
        assert call(mode=mode)=={'status':expected}
        if n in (2,3):assert call(mode=mode)=={'status':'completed'}
        if n==4:assert call(mode=mode)=={'status':'manual_required'}
    elif n==5:
        assert call(withdraw_after=True)=={'status':'local_integration_refused'}
        assert call(action='consult')=={'status':'unavailable'}
    else:
        assert call(mode='idempotent')=={'status':'completed'}
        result=remote(folder,'idempotent','conflicting operation')
        traces.append({'provider_conflict':result})
        assert result=={'status':'conflict'}
    after=snapshot(folder)
    assert len(after['effects'])==(0 if n==1 else 1)
    if n==4:assert after['operation'][0][2:]==('uncertain',0)
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Autorité retirée avant sortie : aucun effet externe',
            'Accusé perdu : recherche du résultat sans nouvelle exécution',
            'Accusé perdu : même clé idempotente, un effet',
            'Sans recherche/idempotence : état incertain, pas relance aveugle',
            'Autorité retirée après effet externe : intégration locale refusée',
            'Même clé avec autre contenu : conflit prestataire']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt05-c-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT05-C{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT05-C{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_c.py',HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT05',lot='C',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_EFFETS_EXTERNES' if len(cases)==6 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT05_clos=False,prestataire_reel_qualifie=False,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Prestataire SQLite/processus local, pas service réseau ou message réel envoyé.',
                   'Autorité booléenne, séquences déterministes ; pas garde concurrente lors de remise externe.',
                   'Recherche suppose résultat fiable et durable ; absence temporaire/eventual consistency non qualifiée.',
                   'Expiration/rétention de clés idempotentes, paiement externe, compensation et workflow opérateur réservés.',
                   'Effet externe déjà commis ne disparaît pas lors d’une révocation ; seulement intégration locale contrôlée.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true');p.add_argument('--provider',action='store_true');p.add_argument('--lookup',action='store_true');p.add_argument('--withdraw-after',action='store_true')
    for key in ('folder','action','mode','fault','payload'):p.add_argument('--'+key)
    a=p.parse_args()
    if a.provider:print(json.dumps(provider(Path(a.folder),a.mode,a.payload,a.lookup)))
    elif a.worker:print(json.dumps(worker(a)))
    else:main()
