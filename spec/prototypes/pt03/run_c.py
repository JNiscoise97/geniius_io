"""PT03 C : migrations transactionnelles et conservation du delta original."""
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
from run import connect, crash

ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT03_LOT_C.json'

def initialize(path,payload):
    with closing(connect(path)) as c:
        c.executescript('''
        CREATE TABLE context(schema_version INTEGER,gate INTEGER,capable INTEGER);
        INSERT INTO context VALUES(1,1,1);
        CREATE TABLE journal(origin TEXT PRIMARY KEY,original TEXT NOT NULL);
        CREATE TRIGGER journal_immutable_update BEFORE UPDATE ON journal BEGIN SELECT RAISE(ABORT,'immutable'); END;
        CREATE TRIGGER journal_immutable_delete BEFORE DELETE ON journal BEGIN SELECT RAISE(ABORT,'immutable'); END;
        CREATE TABLE replica(id TEXT PRIMARY KEY,content TEXT);
        INSERT INTO replica VALUES('old','canonical replica');
        ''')
        c.execute('INSERT INTO journal VALUES(?,?)',('op1',json.dumps(payload,sort_keys=True)))

def convert(original):
    p=json.loads(original)
    known={'client','protocol','schema','referential','term','text'}
    if set(p)!=known or any(p[k]!=1 for k in ('client','protocol','schema','referential')):
        return 'awaiting',None,'unsupported_format_or_fields'
    if p['term']=='legacy_split':return 'awaiting',None,'ambiguous_referential'
    if p['term']!='legacy_known':return 'awaiting',None,'unknown_term'
    converted={'client':1,'protocol':2,'schema':2,'referential':2,'concept':'concept_known','text':p['text']}
    return 'converted',json.dumps(converted,sort_keys=True),'converter_1_to_2'

def worker(a):
    with closing(connect(a.database)) as c:
        if a.action=='incompatible':
            c.execute('UPDATE context SET capable=0,gate=0')
            return {'status':'update_required'}
        if a.action=='consult':
            gate,capable=c.execute('SELECT gate,capable FROM context').fetchone()
            return {'status':'visible','items':c.execute('SELECT * FROM replica').fetchall()} if gate and capable else {'status':'closed'}
        if a.action=='reconcile':
            version,capable=c.execute('SELECT schema_version,capable FROM context').fetchone()
            if version!=2 or not capable:return {'status':'closed'}
            # Fixture : droits actuels réconciliés par le banc, pas un protocole réseau.
            c.execute('UPDATE context SET gate=1');return {'status':'reconciled'}
        c.execute('UPDATE context SET gate=0') # persiste avant DDL/migration
        if a.fault=='full':
            pages=c.execute('PRAGMA page_count').fetchone()[0]
            c.execute('PRAGMA max_page_count='+str(pages))
        try:
            c.execute('BEGIN IMMEDIATE')
            c.execute('CREATE TABLE IF NOT EXISTS conversion(origin TEXT PRIMARY KEY REFERENCES journal(origin),status TEXT,converted TEXT,source_sha256 TEXT,converter TEXT,scientific_validated INTEGER CHECK(scientific_validated=0))')
            for origin,original in c.execute('SELECT * FROM journal').fetchall():
                status,converted,reason=convert(original)
                c.execute('INSERT OR IGNORE INTO conversion VALUES(?,?,?,?,?,0)',
                          (origin,status,converted,hashlib.sha256(original.encode()).hexdigest(),reason))
            c.execute('UPDATE context SET schema_version=2')
            if a.fault=='full':
                c.execute('CREATE TABLE pressure(content BLOB)')
                c.execute('INSERT INTO pressure VALUES(zeroblob(2097152))')
            crash('before_migration_commit',a.fault)
            c.execute('COMMIT')
            crash('after_migration_commit',a.fault)
            return {'status':'migrated'}
        except sqlite3.DatabaseError as exc:
            if c.in_transaction:c.execute('ROLLBACK')
            if getattr(exc,'sqlite_errorcode',None)!=sqlite3.SQLITE_FULL:raise
            return {'status':'storage_full','sqlite_errorcode':exc.sqlite_errorcode}

def snapshot(path):
    with closing(connect(path)) as c:
        tables={r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        return dict(context=list(c.execute('SELECT * FROM context').fetchone()),
                    journal=c.execute('SELECT * FROM journal').fetchall(),replica=c.execute('SELECT * FROM replica').fetchall(),
                    conversion=c.execute('SELECT * FROM conversion').fetchall() if 'conversion' in tables else [],
                    conversion_table='conversion' in tables)

def launch(path,action='migrate',fault=''):
    r=subprocess.run([sys.executable,str(HERE/'run_c.py'),'--worker','--database',str(path),
                      '--action',action,'--fault',fault],capture_output=True,text=True,encoding='utf-8',timeout=25)
    assert r.returncode==(73 if fault in ('before_migration_commit','after_migration_commit') else 0),r.stderr
    return dict(action=action,fault=fault,exit_code=r.returncode,output=json.loads(r.stdout),durable_after=snapshot(path))

def exercise(n,path,traces):
    before=snapshot(path)
    def call(**kw):
        trace=launch(path,**kw);traces.append(trace);return trace['output']
    if n==4:
        assert call(action='incompatible')=={'status':'update_required'}
        assert call(action='consult')=={'status':'closed'}
        call();assert call(action='reconcile')=={'status':'closed'}
    elif n in (5,6,7):
        fault={5:'before_migration_commit',6:'after_migration_commit',7:'full'}[n]
        result=call(fault=fault);interrupted=snapshot(path)
        assert interrupted['context'][1]==0
        assert interrupted['context'][0]==(2 if n==6 else 1)
        assert interrupted['conversion_table']==(n==6)
        if n==7:assert result=={'status':'storage_full','sqlite_errorcode':sqlite3.SQLITE_FULL}
        assert call(action='consult')=={'status':'closed'}
        assert call()=={'status':'migrated'}
        assert call(action='reconcile')=={'status':'reconciled'}
    else:
        call();call() # rejeu ne duplique pas la conversion
        assert call(action='consult')=={'status':'closed'}
        call(action='reconcile')
    after=snapshot(path)
    assert before['journal']==after['journal'] and before['replica']==after['replica']
    assert len(after['conversion'])==1
    converted=after['conversion'][0]
    assert converted[1]==('awaiting' if n in (2,3) else 'converted')
    assert converted[3]==hashlib.sha256(before['journal'][0][1].encode()).hexdigest()
    assert converted[5]==0
    if n in (2,3):assert converted[2] is None
    else:assert json.loads(converted[2])['text']==json.loads(before['journal'][0][1])['text']
    return before,after

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Conversion déterministe avec original et provenance','Référentiel scindé laissé en attente',
            'Champ inconnu conservé sans conversion permissive','Client incapable : consultation fermée, journal conservé',
            'Panne avant commit DDL et conversion, reprise','Commit migration puis réponse perdue, rejeu',
            'SQLITE_FULL réel par plafond de pages, rollback puis reprise']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt03-c-') as temp:
            for n,label in enumerate(labels,1):
                path=Path(temp)/f'{n}.sqlite'
                payload=dict(client=1,protocol=1,schema=1,referential=1,term='legacy_known',text='author text')
                if n==2:payload['term']='legacy_split'
                if n==3:payload['future_semantics']={'value':'must survive'}
                initialize(path,payload);traces=[]
                try:
                    before,after=exercise(n,path,traces)
                    cases.append(dict(id=f'PT03-C{n:02d}',label=label,status='PASS',before=before,after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT03-C{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_c.py',HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT03',lot='C',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_LOT_C' if len(cases)==7 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           SQL_execute=True,HTTP_execute=False,chiffrement_execute=False,PT03_clos=False,
           metadata=dict(os=platform.platform(),sqlite=sqlite3.sqlite_version,temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Versions et termes synthétiques, aucune fenêtre produit ratifiée.',
                   'SQLITE_FULL obtenu par max_page_count, pas disque physique saturé.',
                   'Réconciliation et capacités de fixture, pas négociation authentifiée.',
                   'Pas de chiffrement, transport, horloge ni anti-rollback ; lots D à F réservés.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',action='store_true')
    for name in ('database','action','fault'):p.add_argument('--'+name)
    a=p.parse_args()
    if a.worker:print(json.dumps(worker(a)),flush=True)
    else:main()
