"""Montage ciblé D/E : contrôle temporel avant déchiffrement de réplique."""
from contextlib import closing
import hashlib
import json
import platform
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from run import connect
from run_d import ClockFixture
from run_e import transform

ROOT=Path(__file__).resolve().parents[3];HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT03_ARTICULATION.json'

class Reader:
    def __init__(self,clock):self.clock=clock;self.decrypt_calls=0
    def read(self,path,mono,context=('A','D','manifest',1)):
        decision=self.clock.evaluate(mono=mono,wall=-10000,context=context)
        if not decision['allowed']:return {'status':'closed'}
        self.decrypt_calls+=1
        try:plain=transform(path.read_bytes(),'A/D/replica/v1',False)
        except OSError:
            self.clock.close('integrity_unknown');return {'status':'closed'}
        return {'status':'visible','digest':hashlib.sha256(plain).hexdigest()}

def main():
    cases=[];fatal=None;started=datetime.now(timezone.utc).isoformat()
    labels=['Contrôle avant déchiffrement et journal récupérable après expiration',
            'Ancien blob valide restauré après expiration : lecture refusée',
            'Nouveau contrôleur sans ancrage : déchiffrement jamais appelé',
            'Contexte compte différent : fermeture avant déchiffrement',
            'Blob altéré sous borne valide : refus puis barrière fermée']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt03-g-') as temp:
            for n,label in enumerate(labels,1):
                try:
                    folder=Path(temp)/str(n);folder.mkdir();db=folder/'context.sqlite'
                    with closing(connect(db)) as c:c.executescript('CREATE TABLE context(gate INTEGER); INSERT INTO context VALUES(0);')
                    clock=ClockFixture(db);clock.establish(trusted=True)
                    replica=folder/'replica.bin';journal=folder/'journal.bin'
                    old=transform(b'SYNTHETIC_REPLICA','A/D/replica/v1',True);replica.write_bytes(old)
                    journal.write_bytes(transform(b'SYNTHETIC_OWN_DELTA','A/D/journal/v1',True))
                    journal_digest=hashlib.sha256(journal.read_bytes()).hexdigest()
                    reader=Reader(clock);observations=[]
                    if n==1:
                        observations.append(reader.read(replica,220));assert observations[-1]['status']=='visible'
                        calls=reader.decrypt_calls
                        observations.append(reader.read(replica,1094));assert observations[-1]=={'status':'closed'}
                        assert reader.decrypt_calls==calls
                    elif n==2:
                        clock.evaluate(mono=1094,wall=0)
                        replica.write_bytes(transform(b'SYNTHETIC_NEW_REPLICA','A/D/replica/v1',True))
                        replica.write_bytes(old)
                        observations.append(reader.read(replica,120))
                    elif n==3:
                        reader=Reader(ClockFixture(db));observations.append(reader.read(replica,120))
                    elif n==4:observations.append(reader.read(replica,121,('B','D','manifest',1)))
                    else:
                        broken=bytearray(old);broken[-1]^=1;replica.write_bytes(broken)
                        observations.append(reader.read(replica,220))
                        calls=reader.decrypt_calls
                        observations.append(reader.read(replica,221))
                        assert reader.decrypt_calls==calls==1
                    if n!=1:assert all(r=={'status':'closed'} for r in observations)
                    if n in (2,3,4):assert reader.decrypt_calls==0
                    assert transform(journal.read_bytes(),'A/D/journal/v1',False)==b'SYNTHETIC_OWN_DELTA'
                    assert hashlib.sha256(journal.read_bytes()).hexdigest()==journal_digest
                    cases.append(dict(id=f'PT03-G{n:02d}',label=label,status='PASS',observations=observations,
                                      decrypt_calls=reader.decrypt_calls,journal_intact=True,journal_recoverable=True))
                except Exception as exc:cases.append(dict(id=f'PT03-G{n:02d}',label=label,status='FAIL',error=repr(exc)))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_g.py',HERE/'run_d.py',HERE/'run_e.py',HERE/'run.py']
    d=dict(prototype='PT03',lot='G',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_ARTICULATION_DE' if len(cases)==5 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT03_clos=False,horloge_OS_qualifiee=False,anti_rollback_materiel=False,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Borne temporelle et identité injectées ; montage ciblé D/E seulement.',
                   'Contrôle et déchiffrement synchrones, pas qualification de concurrence/remise locale.',
                   'Rollback après expiration ou sans ancrage, pas rollback permissif durant une lease encore valide.',
                   'Pas de snapshot mémoire complet, OS compromis ou accès direct DPAPI par même utilisateur.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':main()
