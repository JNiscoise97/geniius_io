"""PT04 B : effets conflictuels et politiques actuelles avant réouverture."""
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
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT04_LOT_B.json'

def state_authority(c):
    state=base.authority_state(c)
    state['policies']=c.execute('SELECT target,active FROM policy ORDER BY target').fetchall()
    return state

def seal(folder):
    with closing(base.connect(folder/'authority.sqlite')) as c:state=state_authority(c)
    (folder/'trusted_checkpoint.json').write_text(json.dumps(dict(generation=state['generation'],digest=base.fingerprint(state))),encoding='utf-8')

def initialize(folder):
    base.initialize(folder)
    with closing(base.connect(folder/'authority.sqlite')) as c:c.execute('CREATE TABLE policy(target TEXT PRIMARY KEY,active INTEGER)')
    with closing(base.connect(folder/'app.sqlite')) as c:
        c.execute("INSERT INTO derived VALUES('keep','old permissive index')")
        c.execute('CREATE TABLE session(token TEXT PRIMARY KEY,epoch INTEGER)')
        c.execute("INSERT INTO session VALUES('old_session',1)")
    seal(folder)

def worker(a):
    folder=Path(a.folder)
    with closing(base.connect(folder/'app.sqlite')) as app:
        if a.action=='old_session':
            opened,epoch=app.execute('SELECT * FROM gate').fetchone()
            old=app.execute("SELECT epoch FROM session WHERE token='old_session'").fetchone()
            return {'status':'unavailable'} if not opened or not old or old[0]!=epoch else {'status':'accepted'}
        app.execute('UPDATE gate SET open=0')
        try:
            with closing(base.connect(folder/'authority.sqlite')) as authority:
                authority.execute('BEGIN IMMEDIATE')
                state=state_authority(authority)
                witness=json.loads((folder/'trusted_checkpoint.json').read_text(encoding='utf-8'))
                if witness!={'generation':state['generation'],'digest':base.fingerprint(state)}:
                    return {'status':'closed','reason':'authority_stale_or_corrupt'}
                app.execute('BEGIN IMMEDIATE')
                for (target,) in state['purges']:
                    for table in ('object','derived','effect'):
                        key='id' if table=='object' else 'target'
                        app.execute(f'DELETE FROM {table} WHERE {key}=?',(target,))
                for target,active in state['policies']:
                    if target=='*':
                        app.execute('UPDATE object SET allowed=?',(active,))
                        if not active:app.execute('DELETE FROM derived')
                    else:
                        app.execute('UPDATE object SET allowed=? WHERE id=?',(active,target))
                        if not active:app.execute('DELETE FROM derived WHERE target=?',(target,))
                reconstructed=0
                for origin,target,delta,ack in state['intents']:
                    existing=app.execute('SELECT target,delta FROM effect WHERE origin=?',(origin,)).fetchone()
                    if existing:
                        if existing!=(target,delta):
                            app.execute('ROLLBACK');return {'status':'closed','reason':'effect_conflict'}
                    else:
                        if not app.execute('SELECT 1 FROM object WHERE id=? AND allowed=1',(target,)).fetchone():
                            app.execute('ROLLBACK');return {'status':'closed','reason':'effect_not_reconstructible'}
                        app.execute('INSERT INTO effect VALUES(?,?,?)',(origin,target,delta));reconstructed+=1
                app.execute('UPDATE gate SET open=1,epoch=epoch+1')
                base.crash('before_policy_commit',a.fault)
                app.execute('COMMIT');authority.execute('COMMIT')
                return {'status':'open','reconstructed_effects':reconstructed}
        except Exception:
            return {'status':'closed','reason':'authority_unverifiable'}

def launch(folder,action='recover',fault=''):
    r=subprocess.run([sys.executable,str(HERE/'run_b.py'),'--worker','--folder',str(folder),'--action',action,'--fault',fault],
                     capture_output=True,text=True,encoding='utf-8',timeout=20)
    assert r.returncode==(73 if fault else 0),r.stderr
    return dict(action=action,fault=fault,exit_code=r.returncode,output=json.loads(r.stdout),durable_after=base.snapshot(folder))

def exercise(n,folder,traces):
    initialize(folder);before=base.snapshot(folder)
    def call(**kw):
        t=launch(folder,**kw);traces.append(t);return t['output']
    with closing(base.connect(folder/'authority.sqlite')) as c:
        c.execute('UPDATE meta SET generation=2')
        if n in (1,2):c.execute("INSERT INTO intent VALUES('op1','keep','expected delta',1)")
        if n in (2,3,5,6):c.execute("INSERT INTO policy VALUES('keep',0)")
        if n==4:c.execute("INSERT INTO policy VALUES('*',0)")
    seal(folder)
    if n==1:
        with closing(base.connect(folder/'app.sqlite')) as c:c.execute("INSERT INTO effect VALUES('op1','keep','contradictory delta')")
        assert call()=={'status':'closed','reason':'effect_conflict'}
        assert base.snapshot(folder)['effects']==[('op1','keep','contradictory delta')]
    elif n==2:
        assert call()=={'status':'closed','reason':'effect_not_reconstructible'}
        assert not base.snapshot(folder)['effects']
    elif n==5:
        with closing(base.connect(folder/'authority.sqlite')) as c:c.execute('DELETE FROM policy')
        assert call()=={'status':'closed','reason':'authority_stale_or_corrupt'}
    else:
        if n==6:
            call(fault='before_policy_commit')
            assert not base.snapshot(folder)['visible']
            assert base.snapshot(folder)['objects']==before['objects']
        assert call()=={'status':'open','reconstructed_effects':0}
        assert call(action='old_session')=={'status':'unavailable'}
        if n==4:
            assert not base.snapshot(folder)['visible'] and not base.snapshot(folder)['derived']
        else:
            assert base.snapshot(folder)['visible']==[('gone',)]
            assert all(row[0]!='keep' for row in base.snapshot(folder)['derived'])
    after=base.snapshot(folder)
    if n in (1,2,5):assert not after['open'] and not after['visible']
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Effet contradictoire : anomalie et service fermé','Effet perdu devenu inadmissible : pas de reconstruction',
            'Restriction actuelle appliquée avant ouverture et ancien index retiré','Fermeture globale : aucune cible visible et ancienne session refusée',
            'Politique omise à génération identique : refus de fraîcheur','Panne avant commit des politiques : barrière puis reprise']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt04-b-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT04-B{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT04-B{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_b.py',HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT04',lot='B',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_POLITIQUES_REPRISE' if len(cases)==6 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT04_clos=False,NF05_qualifie=False,checkpoint_fiable_injecte=True,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Policies allow/deny synthétiques, pas moteur complet de restrictions légales/fermeture.',
                   'Checkpoint fiable injecté, pas domaines de panne indépendants ni signature.',
                   'Anomalie récupérable signalée au banc, pas workflow opérateur implémenté.',
                   'Pas chiffrement, clés, médias volumineux ou qualification RPO/RTO.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true')
    for key in ('folder','action','fault'):p.add_argument('--'+key)
    a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)))
    else:main()
