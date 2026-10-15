"""PT05 E : mesures diagnostiques locales du mécanisme de propagation B."""
import argparse
from contextlib import closing
import hashlib
import json
import platform
import statistics
import tempfile
import threading
import time
import tracemalloc
from datetime import datetime, timezone
from pathlib import Path
import run as base
import run_b as propagation
ROOT=base.ROOT;HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT05_LOT_E.json'

def invoke(folder,action,**kw):
    args=dict(folder=str(folder),action=action,node='n0',work=None,fault='',production=False,source=None,target=None)
    args.update(kw);return propagation.worker(argparse.Namespace(**args))

def initialize(folder,profile):
    propagation.initialize(folder);count=profile['nodes'];shape=profile['shape']
    with closing(base.connect(folder/'graph.sqlite')) as c:
        c.execute('BEGIN IMMEDIATE')
        c.execute('DELETE FROM edge');c.execute('DELETE FROM node')
        c.executemany('INSERT INTO node VALUES(?,0)',[(f'n{i}',) for i in range(count)])
        edges=[(f'n{i-1}' if shape=='chain' else ('n0' if shape=='star' else f'n{(i-1)//2}'),f'n{i}') for i in range(1,count)]
        c.executemany('INSERT INTO edge VALUES(?,?)',edges);c.execute('COMMIT')

def measure(folder,profile,load,manifest):
    initialize(folder,profile);errors=[];reads=[];stop=threading.Event();threads=[]
    def reader():
        try:
            for _ in range(manifest['reads_per_thread_max']):
                if stop.is_set():break
                started=time.perf_counter_ns()
                result=invoke(folder,'read',node=f"n{profile['nodes']-1}")
                reads.append(dict(duration_ms=(time.perf_counter_ns()-started)/1e6,status=result['status']))
        except Exception as exc:errors.append(repr(exc))
    tracemalloc.start();cpu_start=time.process_time_ns();started=time.perf_counter_ns()
    invoke(folder,'edit')
    # Le contrôle suivant est effectué avant ouverture des lectures concurrentes.
    with closing(base.connect(folder/'graph.sqlite')) as c:
        assert c.execute('SELECT pending FROM scope').fetchone()[0]==1
    if load=='concurrent_reads':
        for _ in range(manifest['concurrent_reader_threads']):
            thread=threading.Thread(target=reader);thread.start();threads.append(thread)
    work=invoke(folder,'prepare')
    result=invoke(folder,'finish',work=json.dumps(work))
    with closing(base.connect(folder/'graph.sqlite')) as c:
        count=c.execute('SELECT count(*) FROM signal').fetchone()[0]
        assert count==profile['nodes']-1 and c.execute('SELECT pending FROM scope').fetchone()[0]==0
    completed=time.perf_counter_ns();stop.set()
    for thread in threads:thread.join(timeout=20);assert not thread.is_alive()
    peak=tracemalloc.get_traced_memory()[1];tracemalloc.stop()
    assert not errors,errors
    assert result['status']=='complete'
    assert invoke(folder,'read',node=f"n{profile['nodes']-1}")=={'status':'reexamen'}
    assert all(r['status'] in ('propagation_en_cours','reexamen') for r in reads)
    elapsed=(completed-started)/1e6
    return dict(elapsed_ms=elapsed,signals=count,signals_per_second=count/(elapsed/1000),
                python_peak_tracemalloc_bytes=peak,cpu_process_ms=(time.process_time_ns()-cpu_start)/1e6,
                storage_bytes=sum(p.stat().st_size for p in folder.iterdir() if p.is_file()),reads=reads,
                pending_after=False,scientific_status='reexamen')

def main():
    manifest_path=HERE/'capacity_profile.json';manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt05-e-') as temp:
            number=0
            for profile in manifest['profiles']:
                for load in manifest['loads']:
                    number+=1;samples=[]
                    try:
                        for repeat in range(manifest['repetitions']):
                            folder=Path(temp)/f'{number}-{repeat}';folder.mkdir();samples.append(measure(folder,profile,load,manifest))
                        values=[s['elapsed_ms'] for s in samples]
                        cases.append(dict(id=f'PT05-E{number:02d}',profile=profile,load=load,status='PASS',samples=samples,
                                          maximum_ms=max(values),median_ms=statistics.median(values),
                                          p95_nearest_rank_ms=sorted(values)[-1]))
                    except Exception as exc:cases.append(dict(id=f'PT05-E{number:02d}',status='FAIL',error=repr(exc),samples=samples))
            folder=Path(temp)/'alert';folder.mkdir();initialize(folder,manifest['profiles'][0]);invoke(folder,'edit')
            # Dépassement volontaire d'un budget zéro du banc, pas délai produit.
            with closing(base.connect(folder/'graph.sqlite')) as c:pending=c.execute('SELECT pending FROM scope').fetchone()[0]
            assert manifest['alert_test_budget_ns']==0 and pending==1
            cases.append(dict(id='PT05-E07',status='PASS',alert='diagnostic_budget_exceeded',pending_preserved=True,
                              read_status=invoke(folder,'read',node='n63')['status']))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/name for name in ('run_e.py','run_b.py','run.py','capacity_profile.json','PROTOCOL.md')]
    d=dict(prototype='PT05',lot='E',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_MESURES_LOCALES' if len(cases)==7 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT05_clos=False,MPD04_fixe=False,capacite_production_qualifiee=False,budget_mensuel_estime=False,
           metadata=dict(os=platform.platform(),python=platform.python_version(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Temps mesuré avant correction à après commit/contrôle, inclut écriture directe et instrumentation.',
                   'Deux threads lecteurs fini, pas utilisateurs/appareils réseau ni garantie de chevauchement à chaque répétition.',
                   'tracemalloc allocations Python seulement, pas RSS mémoire native SQLite ni ressources machine complètes.',
                   'Cinq répétitions/profil, ordre fixe, petits graphes ; pas maximum contractuel ou percentile population estimé.',
                   'Alerte zero-budget de fixture : pas ordonnanceur de timeout ou supervision périodique implémentés.',
                   'Coût cloud réel nul, pas coût économique du poste ou devis de production ; pas MPD-04 ratifié.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':main()
