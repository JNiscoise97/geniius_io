"""PT05 B : générations de propagation, impact scientifique persistant et cycles."""
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
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT05_LOT_B.json'

def reach(edges,roots):
    seen=set();frontier=list(roots)
    while frontier:
        node=frontier.pop()
        if node in seen:continue
        seen.add(node);frontier.extend(b for a,b in edges if a==node)
    return sorted(seen)

def initialize(folder):
    with closing(base.connect(folder/'graph.sqlite')) as c:
        c.executescript('CREATE TABLE scope(generation INTEGER,pending INTEGER); INSERT INTO scope VALUES(0,0); CREATE TABLE node(id TEXT PRIMARY KEY,impact INTEGER); CREATE TABLE edge(source TEXT,target TEXT,PRIMARY KEY(source,target)); CREATE TABLE cause(root TEXT PRIMARY KEY,version INTEGER); CREATE TABLE signal(root TEXT,version INTEGER,target TEXT,PRIMARY KEY(root,version,target));')
        c.executemany('INSERT INTO node VALUES(?,0)',[(x,) for x in ('A','B','join','tail','extra')])
        c.executemany('INSERT INTO edge VALUES(?,?)',[('A','join'),('B','join'),('join','tail')])

def snapshot(folder):
    with closing(base.connect(folder/'graph.sqlite')) as c:
        return dict(scope=list(c.execute('SELECT * FROM scope').fetchone()),nodes=c.execute('SELECT * FROM node ORDER BY id').fetchall(),
                    causes=c.execute('SELECT * FROM cause ORDER BY root').fetchall(),signals=c.execute('SELECT * FROM signal ORDER BY root,version,target').fetchall(),
                    edges=c.execute('SELECT * FROM edge ORDER BY source,target').fetchall())

def worker(a):
    with closing(base.connect(Path(a.folder)/'graph.sqlite')) as c:
        c.execute('BEGIN IMMEDIATE');generation,pending=c.execute('SELECT * FROM scope').fetchone()
        edges=c.execute('SELECT * FROM edge').fetchall()
        if a.action=='read':
            impact=c.execute('SELECT impact FROM node WHERE id=?',(a.node,)).fetchone()
            c.execute('COMMIT')
            return {'status':'introuvable'} if not impact else {'status':'reexamen' if impact[0] else ('propagation_en_cours' if pending else 'inchange')}
        if a.action=='edit':
            c.execute('INSERT INTO cause VALUES(?,1) ON CONFLICT(root) DO UPDATE SET version=version+1',(a.node,))
            for source,target in edges:
                if source==a.node:c.execute('UPDATE node SET impact=1 WHERE id=?',(target,))
            c.execute('UPDATE scope SET generation=generation+1,pending=1');c.execute('COMMIT');return {'status':'marked'}
        if a.action=='edge':
            if a.production and a.source in reach(edges,[a.target]):
                c.execute('ROLLBACK');return {'status':'cycle_refused'}
            c.execute('INSERT OR IGNORE INTO edge VALUES(?,?)',(a.source,a.target))
            c.execute('UPDATE scope SET generation=generation+1,pending=1');c.execute('COMMIT');return {'status':'edge_added'}
        causes=c.execute('SELECT * FROM cause ORDER BY root').fetchall()
        if a.action=='prepare':
            work=dict(generation=generation,signals=[(root,version,target) for root,version in causes for target in reach(edges,[root]) if target!=root])
            c.execute('COMMIT');return work
        work=json.loads(a.work)
        if work['generation']!=generation:
            c.execute('ROLLBACK');return {'status':'stale_refused'}
        expected=[(root,version,target) for root,version in causes for target in reach(edges,[root]) if target!=root]
        if work['signals']!=[list(x) for x in expected]:
            c.execute('ROLLBACK');return {'status':'incomplete_refused'}
        for root,version,target in expected:
            c.execute('INSERT OR IGNORE INTO signal VALUES(?,?,?)',(root,version,target))
            c.execute('UPDATE node SET impact=1 WHERE id=?',(target,))
        c.execute('UPDATE scope SET pending=0') # ne remet jamais impact à zéro
        base.crash('before_propagation_commit',a.fault)
        c.execute('COMMIT');return {'status':'complete','generation':generation}

def launch(folder,action,**kw):
    cmd=[sys.executable,str(HERE/'run_b.py'),'--worker','--folder',str(folder),'--action',action]
    for key,value in kw.items():
        if key=='production':
            if value:cmd.append('--production')
        else:cmd+=['--'+key,json.dumps(value) if key=='work' else str(value)]
    r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',timeout=20)
    assert r.returncode==(73 if kw.get('fault') else 0),r.stderr
    return dict(action=action,exit_code=r.returncode,output=json.loads(r.stdout),durable_after=snapshot(folder))

def exercise(n,folder,traces):
    initialize(folder);before=snapshot(folder)
    def call(action,**kw):
        t=launch(folder,action,**kw);traces.append(t);return t['output']
    call('edit',node='A')
    assert dict(snapshot(folder)['nodes'])['join']==1
    assert call('read',node='tail')=={'status':'propagation_en_cours'}
    work=call('prepare')
    if n==2:
        call('edit',node='B');assert call('finish',work=work)=={'status':'stale_refused'};work=call('prepare')
    elif n==3:
        call('edge',source='tail',target='extra')
        assert call('finish',work=work)=={'status':'stale_refused'};work=call('prepare')
    elif n==4:
        call('edge',source='tail',target='join');work=call('prepare')
        assert len(work['signals'])==2 # visite bornée malgré cycle join/tail
    elif n==5:
        original=snapshot(folder)
        assert call('edge',source='tail',target='A',production=True)=={'status':'cycle_refused'}
        assert snapshot(folder)==original
    elif n==6:
        call('finish',work=work,fault='before_propagation_commit')
        assert snapshot(folder)['scope'][1]==1 and not snapshot(folder)['signals']
    assert call('finish',work=work)['status']=='complete'
    assert call('finish',work=work)['status']=='complete' # checkpoint rejouable
    assert call('read',node='tail')=={'status':'reexamen'}
    after=snapshot(folder);assert after['scope'][1]==0
    if n==2:assert len(after['causes'])==2 and len(after['signals'])==4
    if n==3:assert dict(after['nodes'])['extra']==1
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Worker perdu : barrière puis signalements sans validation scientifique',
            'Nouvelle cause : ancienne génération ne clôt pas l’impact récent',
            'Dépendance ajoutée après préparation : reprise couvre le nouvel aval',
            'Cycle de raisonnement : parcours termine sans indépendance fabriquée',
            'Cycle de production tenté : mutation refusée','Panne avant commit propagation : barrière puis rejeu']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt05-b-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT05-B{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT05-B{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_b.py',HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT05',lot='B',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_PROPAGATION_GENERATIONS' if len(cases)==6 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT05_clos=False,MPD04_fixe=False,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Petit graphe et barrière globale conservative, pas dimensionnement de périmètre produit.',
                   'Parcours entier et vérification finale recalculés sous verrou, pas frontier durable par unités bornées.',
                   'Causes ordonnancées entre subprocess, pas deux mutations réellement simultanées.',
                   'Sortie publique générique sans identité des causes ; pas qualification NF10 ou rôles complets.',
                   'Cycle marqué uniquement par impacts, indépendance scientifique non modélisée ni validée.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true');p.add_argument('--production',action='store_true')
    for key in ('folder','action','node','source','target','work','fault'):p.add_argument('--'+key)
    a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)))
    else:main()
