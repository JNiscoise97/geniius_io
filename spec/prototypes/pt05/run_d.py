"""PT05 D : quotas, places réservées et ordonnance équitable synthétique."""
import argparse
import concurrent.futures
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
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT05_LOT_D.json'

def initialize(folder):
    with closing(base.connect(folder/'queue.sqlite')) as c:
        c.executescript('CREATE TABLE clock(now INTEGER,turn INTEGER,seq INTEGER); INSERT INTO clock VALUES(0,0,0); CREATE TABLE job(id TEXT PRIMARY KEY,actor TEXT,class TEXT,size INTEGER,payload TEXT,status TEXT,attempts INTEGER,next INTEGER); CREATE TABLE fairness(actor TEXT,class TEXT,last INTEGER,PRIMARY KEY(actor,class)); CREATE TABLE effect(id TEXT PRIMARY KEY);')

def worker(a):
    with closing(base.connect(Path(a.folder)/'queue.sqlite')) as c:
        c.execute('BEGIN IMMEDIATE');now,turn,seq=c.execute('SELECT * FROM clock').fetchone()
        if a.action=='admit':
            row=c.execute('SELECT actor,class,size,payload FROM job WHERE id=?',(a.id,)).fetchone()
            values=(a.actor,a.category,a.size,a.payload)
            if row:c.execute('ROLLBACK');return {'status':'already_accepted' if row==values else 'conflict'}
            if a.category not in ('interactive','background') or a.size<=0:
                c.execute('ROLLBACK');return {'status':'invalid'}
            active="status IN ('pending','running')"
            count=c.execute('SELECT count(*) FROM job WHERE '+active).fetchone()[0]
            actor_count=c.execute('SELECT count(*) FROM job WHERE '+active+' AND actor=?',(a.actor,)).fetchone()[0]
            bg=c.execute("SELECT count(*) FROM job WHERE "+active+" AND class='background'").fetchone()[0]
            used=c.execute('SELECT coalesce(sum(size),0) FROM job WHERE '+active).fetchone()[0]
            if count>=12 or actor_count>=4 or used+a.size>100 or (a.category=='background' and bg>=8):
                c.execute('ROLLBACK');return {'status':'saturated'}
            c.execute('INSERT INTO job VALUES(?,?,?,?,?,\'pending\',0,0)',(a.id,*values))
            c.execute('INSERT OR IGNORE INTO fairness VALUES(?,?,0)',(a.actor,a.category));c.execute('COMMIT')
            return {'status':'accepted'}
        if a.action=='claim':
            if c.execute("SELECT count(*) FROM job WHERE status='running'").fetchone()[0]>=2:
                c.execute('ROLLBACK');return {'status':'busy'}
            preferred=('interactive','interactive','background')[turn%3]
            row=None
            for category in (preferred,'background' if preferred=='interactive' else 'interactive'):
                row=c.execute("SELECT j.id,j.actor,j.class FROM job j JOIN fairness f ON f.actor=j.actor AND f.class=j.class WHERE j.status='pending' AND j.next<=? AND j.class=? ORDER BY f.last,j.id LIMIT 1",(now,category)).fetchone()
                if row:break
            if not row:c.execute('ROLLBACK');return {'status':'idle'}
            jid,actor,category=row
            c.execute("UPDATE job SET status='running',attempts=attempts+1 WHERE id=?",(jid,))
            c.execute('UPDATE fairness SET last=? WHERE actor=? AND class=?',(seq+1,actor,category))
            c.execute('UPDATE clock SET turn=turn+1,seq=seq+1')
            c.execute('COMMIT');return {'status':'claimed','id':jid,'class':category,'actor':actor}
        row=c.execute('SELECT status,attempts FROM job WHERE id=?',(a.id,)).fetchone()
        if not row or row[0]!='running':c.execute('ROLLBACK');return {'status':'refused'}
        if a.action=='fail':
            attempts=row[1];status='isolated' if attempts>=3 else 'pending'
            c.execute('UPDATE job SET status=?,next=? WHERE id=?',(status,now+2**attempts,a.id))
            c.execute('COMMIT');return {'status':status}
        c.execute('INSERT OR IGNORE INTO effect VALUES(?)',(a.id,))
        c.execute("UPDATE job SET status='done' WHERE id=?",(a.id,));c.execute('COMMIT')
        return {'status':'done'}

def snapshot(folder):
    with closing(base.connect(folder/'queue.sqlite')) as c:
        return dict(jobs=c.execute('SELECT * FROM job ORDER BY id').fetchall(),effects=c.execute('SELECT * FROM effect ORDER BY id').fetchall(),clock=list(c.execute('SELECT * FROM clock').fetchone()))

def launch(folder,action,**kw):
    cmd=[sys.executable,str(HERE/'run_d.py'),'--worker','--folder',str(folder),'--action',action]
    for key,value in kw.items():cmd+=['--'+key,str(value)]
    r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',timeout=20);assert r.returncode==0,r.stderr
    return dict(action=action,parameters=kw,output=json.loads(r.stdout),durable_after=snapshot(folder))

def exercise(n,folder,traces):
    initialize(folder);before=snapshot(folder)
    def call(action,**kw):
        t=launch(folder,action,**kw);traces.append(t);return t['output']
    def admit(jid,actor='A',category='background',size=1):return call('admit',id=jid,actor=actor,category=category,size=size)
    if n in (1,2):
        for actor in ('A','B'):
            for i in range(4 if n==1 else 3):assert admit(actor+str(i),actor)=={'status':'accepted'}
        if n==1:
            assert admit('excess','C')=={'status':'saturated'}
            for i in range(4):assert admit('I'+str(i),'I','interactive')=={'status':'accepted'}
        else:
            for actor in ('I','J'):
                for i in range(3):assert admit(actor+str(i),actor,'interactive')=={'status':'accepted'}
        order=[]
        for _ in range(12):
            result=call('claim');order.append(result);call('finish',id=result['id'])
        assert [r['class'] for r in order[:3]]==['interactive','interactive','background']
        assert all('background' in [r['class'] for r in order[i:i+3]] for i in (0,3))
        background=[r['actor'] for r in order if r['class']=='background']
        assert background==['A','B']*(4 if n==1 else 3)
    elif n==3:
        admit('B','B');b=call('claim')
        admit('I','I','interactive');i=call('claim')
        assert i['id']=='I' and b['id']=='B'
        assert call('claim')=={'status':'busy'}
        call('finish',id='I');call('finish',id='B')
    elif n==4:
        admit('bad');admit('good','B','interactive')
        first=call('claim');assert first['id']=='good';call('finish',id='good')
        for attempt in range(3):
            assert call('claim')['id']=='bad'
            assert call('fail',id='bad')['status']==('isolated' if attempt==2 else 'pending')
            assert call('claim')=={'status':'idle'}
            with closing(base.connect(folder/'queue.sqlite')) as c:c.execute('UPDATE clock SET now=now+8')
        assert call('claim')=={'status':'idle'}
    elif n==5:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            results=list(pool.map(lambda _:launch(folder,'admit',id='same',actor='A',category='interactive',size=1),range(4)))
        traces.extend(results)
        assert sorted(t['output']['status'] for t in results)==['accepted','already_accepted','already_accepted','already_accepted']
        assert call('admit',id='same',actor='A',category='interactive',size=1,payload='other')=={'status':'conflict'}
        call('claim');call('finish',id='same')
    else:
        assert admit('large','A',size=90)=={'status':'accepted'}
        assert admit('overflow','B',size=11)=={'status':'saturated'}
        assert admit('invalid','B',size=0)=={'status':'invalid'}
        original=snapshot(folder)
        assert admit('large','A',size=90)=={'status':'already_accepted'}
        assert snapshot(folder)==original
        call('claim');call('finish',id='large')
        assert admit('overflow','B',size=11)=={'status':'accepted'}
        call('claim');call('finish',id='overflow')
    after=snapshot(folder)
    assert all(row[5] in ('done','isolated') for row in after['jobs'])
    assert len(after['effects'])==sum(row[5]=='done' for row in after['jobs'])
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Saturation background : places interactives conservées et refus visible',
            'Charge mixte : partage de classes et alternance des acteurs',
            'Worker background lent : autre place pour interactif, concurrence bornée',
            'Retries avec attente puis isolement, autre travail terminé',
            'Admission concurrente/rejeu : un travail, conflit non destructif',
            'Budget octets : refus, rejeu puis récupération des ressources']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt05-d-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT05-D{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT05-D{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_d.py',HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT05',lot='D',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_ADMISSION_EQUITE' if len(cases)==6 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT05_clos=False,capacite_production_qualifiee=False,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           parameters=dict(global_jobs=12,background_jobs=8,actor_jobs=4,bytes_budget=100,concurrency=2,attempts_max=3,class_cycle=['interactive','interactive','background']),
           limits=['Charge finie et temps injecté, pas arrivées continues, délais réels ou preuve universelle d’absence de famine.',
                   'Budget size déclaratif et jobs synthétiques, pas octets RSS/média ou quotas produit ratifiés.',
                   'Deux workers background peuvent occuper les deux places : aucune préemption/garantie de latence interactive.',
                   'Équité sur tâches de poids égal, pas coût variable, classes sécurité ou modèle multi-tenant complet.',
                   'Pas renouvellement de bail, crash de worker ou charge prestataire dans ce lot ; mécanismes A/C séparés.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true')
    for key in ('folder','action','id'):p.add_argument('--'+key)
    p.add_argument('--actor',default='A');p.add_argument('--category',default='background');p.add_argument('--size',type=int,default=1);p.add_argument('--payload',default='synthetic work')
    a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)))
    else:main()
