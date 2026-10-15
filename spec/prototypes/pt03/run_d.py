"""PT03 D : logique de borne temporelle injectée, pas qualification d'horloge OS."""
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
from run import connect

ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT03_LOT_D.json'

class ClockFixture:
    def __init__(self,path):
        self.path=path
        self.anchor=None
        self.closed=True
        self.floor=None
        # La continuité n'est jamais reconstruite depuis les seules données persistées.
        with closing(connect(path)) as c:c.execute('UPDATE context SET gate=0')

    def close(self,reason):
        self.closed=True
        with closing(connect(self.path)) as c:c.execute('UPDATE context SET gate=0')
        return {'allowed':False,'reason':reason}

    def establish(self,*,trusted,server=1000,sent=100,received=120,uncertainty=5,
                  drift_per_thousand=1,max_elapsed=5000,expiry=2000,context=('A','D','manifest',1)):
        numbers=(server,sent,received,uncertainty,drift_per_thousand,max_elapsed,expiry)
        if not trusted or any(type(x)!=int or x<0 for x in numbers) or received<sent:
            return self.close('anchor_unverifiable')
        upper=server+(received-sent)+uncertainty
        self.anchor=dict(received=received,upper=upper,drift=drift_per_thousand,
                         max_elapsed=max_elapsed,expiry=expiry,context=context)
        self.floor=upper;self.closed=False
        return self.evaluate(mono=received,wall=0,context=context)

    def evaluate(self,*,mono,wall,context=('A','D','manifest',1),continuous=True):
        # wall n'intervient jamais dans la décision ; unités entières synthétiques.
        if self.closed or not self.anchor:return self.close('reanchor_required')
        a=self.anchor
        if not continuous or context!=a['context'] or type(mono)!=int:
            return self.close('continuity_or_context_unknown')
        elapsed=mono-a['received']
        if elapsed<0 or elapsed>a['max_elapsed']:return self.close('monotone_or_bound_invalid')
        drift=(elapsed*a['drift']+999)//1000
        upper=a['upper']+elapsed+drift
        if upper<self.floor:return self.close('monotone_rollback')
        self.floor=upper
        if upper>=a['expiry']:
            result=self.close('expired');result['upper']=upper;return result
        with closing(connect(self.path)) as c:c.execute('UPDATE context SET gate=1')
        return dict(allowed=True,upper=upper,expiry=a['expiry'])

def initialize(folder):
    replica=folder/'replica.sqlite';journal=folder/'journal.sqlite'
    with closing(connect(replica)) as c:
        c.executescript("CREATE TABLE context(gate INTEGER); INSERT INTO context VALUES(0); CREATE TABLE replica(id TEXT,content TEXT); INSERT INTO replica VALUES('old','canonical'); CREATE TABLE derived(content TEXT); INSERT INTO derived VALUES('thumbnail');")
    with closing(connect(journal)) as c:
        c.executescript("CREATE TABLE journal(origin TEXT,delta TEXT); INSERT INTO journal VALUES('op1','own delta');")
    return replica,journal

def state(replica,journal):
    with closing(connect(replica)) as c,closing(connect(journal)) as j:
        gate=c.execute('SELECT gate FROM context').fetchone()[0]
        return dict(gate=gate,journal=j.execute('SELECT * FROM journal').fetchall(),
                    consultable=c.execute('SELECT * FROM replica').fetchall() if gate else [],
                    derived_consultable=c.execute('SELECT * FROM derived').fetchall() if gate else [])

def exercise(n,folder,traces):
    replica,journal=initialize(folder);before=state(replica,journal);clock=ClockFixture(replica)
    def record(result):traces.append(dict(result=result,durable_after=state(replica,journal)));return result
    assert record(clock.establish(trusted=True))=={'allowed':True,'upper':1025,'expiry':2000}
    if n==1:
        first=record(clock.evaluate(mono=220,wall=9000))
        second=record(clock.evaluate(mono=220,wall=-9000))
        assert first==second=={'allowed':True,'upper':1126,'expiry':2000}
    elif n==2:
        assert record(clock.evaluate(mono=1093,wall=0))['upper']==1999
        assert record(clock.evaluate(mono=1094,wall=-1000))=={'allowed':False,'reason':'expired','upper':2000}
    elif n==3:
        assert record(clock.evaluate(mono=1120,wall=0))=={'allowed':False,'reason':'expired','upper':2026}
    elif n==4:
        assert not record(clock.evaluate(mono=121,wall=0,continuous=False))['allowed']
        assert not record(clock.evaluate(mono=122,wall=0))['allowed']
    elif n==5:
        record(clock.evaluate(mono=220,wall=0))
        assert record(clock.evaluate(mono=219,wall=0))['reason']=='monotone_rollback'
    elif n==6:
        record(clock.evaluate(mono=1094,wall=0))
        assert not record(clock.establish(trusted=False,expiry=10000))['allowed']
        assert not record(clock.evaluate(mono=120,wall=-10000))['allowed']
    elif n==7:
        record(clock.establish(trusted=True,expiry=20000))
        assert record(clock.evaluate(mono=5121,wall=0))['reason']=='monotone_or_bound_invalid'
    elif n==8:
        # Processus réellement neuf : aucun ancrage mémoire disponible.
        r=subprocess.run([sys.executable,str(HERE/'run_d.py'),'--restart',str(replica)],
                         capture_output=True,text=True,encoding='utf-8',timeout=15)
        assert r.returncode==0,r.stderr
        result=json.loads(r.stdout);record(result)
        assert result=={'allowed':False,'reason':'reanchor_required'}
    elif n==9:
        backup=folder/'snapshot.sqlite'
        with closing(connect(replica)) as source,closing(sqlite3.connect(backup)) as target:source.backup(target)
        record(clock.evaluate(mono=1094,wall=0))
        with closing(sqlite3.connect(backup)) as source,closing(connect(replica)) as target:source.backup(target)
        # Le snapshot est réellement restauré, mais il ne recrée pas l'ancrage mémoire.
        restored=ClockFixture(replica)
        assert not record(restored.evaluate(mono=120,wall=0))['allowed']
    elif n==10:
        assert not record(clock.establish(trusted=True,drift_per_thousand=None))['allowed']
    elif n==11:
        assert not record(clock.evaluate(mono=121,wall=0,context=('B','D','manifest',1)))['allowed']
    after=state(replica,journal)
    assert before['journal']==after['journal']
    if n!=1:assert not after['consultable'] and not after['derived_consultable']
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Recul de l’heure murale sans prolongement','Borne stricte : dernière unité admise puis égalité refusée',
            'Pause couverte par monotone : échéance opposable','Veille de continuité inconnue : fermeture persistante',
            'Recul du monotone après lecture : fermeture','Renouvellement non authentifié après expiration refusé',
            'Validité de la borne de dérive dépassée : fermeture','Nouveau processus : ancrage mémoire absent',
            'Snapshot SQLite restauré : aucun ancrage recréé','Borne de dérive inconnue : ancrage refusé',
            'Ancrage d’un autre compte refusé']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt03-d-') as temp:
            for n,label in enumerate(labels,1):
                folder=Path(temp)/str(n);folder.mkdir();traces=[]
                try:
                    before,after=exercise(n,folder,traces)
                    cases.append(dict(id=f'PT03-D{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT03-D{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_d.py',HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT03',lot='D',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_LOT_D' if len(cases)==11 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           SQL_execute=True,HTTP_execute=False,chiffrement_execute=False,horloge_OS_qualifiee=False,PT03_clos=False,
           metadata=dict(os=platform.platform(),sqlite=sqlite3.sqlite_version,temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Temps, dérive, identité et authentification injectés ; pas de borne matérielle prouvée.',
                   'Pas de veille/hibernation ou redémarrage OS réel ; nouveau processus uniquement.',
                   'Snapshot de base restauré, pas snapshot mémoire de VM ; pas de terminal compromis.',
                   'Fermeture après nouveau processus : aucune consultation continue promise après redémarrage.',
                   'Pas de chiffrement, magasin de clés ni anti-rollback matériel ; lots E/F réservés.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--restart');a=p.parse_args()
    if a.restart:print(json.dumps(ClockFixture(a.restart).evaluate(mono=120,wall=0)))
    else:main()
