"""PT01 réel : plusieurs processus psql, PostgreSQL isolé, résultats traçables."""
import contextlib
import argparse
import hashlib
import json
import queue
import subprocess
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
OUTPUT = ROOT / 'docs/architecture/prototypes/PT01_RESULTATS.json'
NAME = 'geniius-pt01-' + uuid.uuid4().hex[:12]
TRACE = []


def docker(*args, check=True, timeout=40):
    result = subprocess.run(['docker', *args], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=timeout)
    if check and result.returncode:
        raise RuntimeError('docker ' + args[0] + ': ' + result.stderr.strip()[:1200])
    return result


class DBError(RuntimeError):
    pass


class Session:
    def __init__(self, role='postgres', label=None):
        self.label = label or ('pt01_' + uuid.uuid4().hex[:10])
        self.process = subprocess.Popen(['docker','exec','-i',NAME,'psql','-X','-qAt','-v','ON_ERROR_STOP=1',
                                         '-U',role,'-d','pt01'], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                        stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace', bufsize=1)
        self.lines = queue.Queue()
        self.pending = None
        def pump():
            for line in self.process.stdout:
                self.lines.put(line.rstrip('\r\n'))
            self.lines.put(None)
        threading.Thread(target=pump, daemon=True).start()
        self.pid = int(self.query("SET application_name='" + self.label + "'; SELECT pg_backend_pid()")[-1])

    def start(self, sql):
        assert self.pending is None
        self.pending = '__PT01_END_' + uuid.uuid4().hex
        self.process.stdin.write(sql.rstrip(';\n') + ';\n\\echo ' + self.pending + '\n')
        self.process.stdin.flush()
        TRACE.append({'t_monotone':time.monotonic(), 'session':self.label, 'pid':self.pid if hasattr(self,'pid') else None,
                      'phase':'envoyé', 'sql':sql})

    def finish(self, timeout=15):
        deadline = time.monotonic() + timeout
        result = []
        while True:
            try:
                line = self.lines.get(timeout=max(0.001,deadline-time.monotonic()))
            except queue.Empty as exc:
                raise TimeoutError(self.label + ' attend une réponse SQL') from exc
            if line is None:
                self.pending = None
                raise DBError('\n'.join(result))
            if line == self.pending:
                self.pending = None
                TRACE.append({'t_monotone':time.monotonic(),'session':self.label,'pid':self.pid if hasattr(self,'pid') else None,
                              'phase':'réponse','lignes':result})
                return result
            result.append(line)

    def query(self, sql):
        self.start(sql)
        return self.finish()

    def close(self):
        if self.process.poll() is None:
            with contextlib.suppress(Exception):
                self.process.stdin.write('ROLLBACK;\n\\q\n')
                self.process.stdin.flush()
            with contextlib.suppress(subprocess.TimeoutExpired):
                self.process.wait(timeout=3)
            if self.process.poll() is None:
                self.process.terminate()
                self.process.wait(timeout=3)

    def __enter__(self):
        return self

    def __exit__(self,*args):
        self.close()


def reset(admin):
    admin.query("TRUNCATE pt01.version_fixture,pt01.activity_fixture,pt01.outbox_fixture,pt01.receipt_fixture,pt01.final_check_fixture; "
                "UPDATE pt01.authority SET epoch=1; UPDATE pt01.grant_fixture SET active=true,expires_at='infinity'; "
                "UPDATE pt01.object_fixture SET version=0,value='initial'; UPDATE pt01.dependency_fixture SET impacted=false")


def state(admin):
    return json.loads(admin.query("SELECT json_build_object('epoch',(SELECT epoch FROM pt01.authority),"
      "'active',(SELECT active FROM pt01.grant_fixture WHERE object_id=1),'versions',(SELECT count(*) FROM pt01.version_fixture),"
      "'activities',(SELECT count(*) FROM pt01.activity_fixture),'outbox',(SELECT count(*) FROM pt01.outbox_fixture),"
      "'receipts',(SELECT count(*) FROM pt01.receipt_fixture),'impacted',(SELECT impacted FROM pt01.dependency_fixture WHERE amont=1),"
      "'object_version',(SELECT version FROM pt01.object_fixture WHERE id=1))")[-1])


def wait_lock(admin, session):
    deadline = time.monotonic()+10
    while time.monotonic()<deadline:
        rows = admin.query(f"SELECT count(*) FROM pg_stat_activity WHERE pid={session.pid} AND wait_event_type='Lock'")
        if rows[-1] == '1':
            TRACE.append({'t_monotone':time.monotonic(),'phase':'blocage_SQL_observé','pid':session.pid})
            return
        time.sleep(0.025)
    raise AssertionError('Blocage PostgreSQL non observé : ' + session.label)


def write(s, command='c1', expected=0, obj=1):
    return s.query(f"SELECT pt01.write_fixture({obj},{expected},'synthetic','{command}')")[-1]


def verify_zero(admin):
    current = state(admin)
    assert all(current[k]==0 for k in ('versions','activities','outbox','receipts','object_version')), current
    assert not current['impacted'], current


def scenario_1(admin):
    with Session('pt01_writer') as w, Session('pt01_revoker') as r:
        assert w.pid!=r.pid
        w.query('BEGIN ISOLATION LEVEL READ COMMITTED')
        assert write(w)=='integre'
        r.start('SELECT pt01.revoke_fixture(1)')
        wait_lock(admin,r)
        w.query('COMMIT')
        assert r.finish()[-1]=='2'
    current=state(admin)
    assert current['versions']==1 and current['impacted'] and not current['active'] and current['epoch']==2,current


def scenario_2(admin):
    with Session('pt01_revoker') as r, Session('pt01_writer') as w:
        r.query('BEGIN ISOLATION LEVEL READ COMMITTED; SELECT pt01.revoke_fixture(1)')
        w.start("SELECT pt01.write_fixture(1,0,'synthetic','late')")
        wait_lock(admin,w)
        r.query('COMMIT')
        assert w.finish()[-1]=='introuvable'
    verify_zero(admin)


def scenario_3(admin):
    with Session('pt01_writer') as w:
        admin.query("UPDATE pt01.grant_fixture SET expires_at=clock_timestamp()+interval '2 seconds' WHERE object_id=1")
        w.query('BEGIN ISOLATION LEVEL READ COMMITTED')
        assert write(w)=='integre'
        admin.query("SELECT pg_sleep(GREATEST(0,EXTRACT(EPOCH FROM ((SELECT expires_at FROM pt01.grant_fixture WHERE object_id=1)-clock_timestamp())))+0.05)")
        try:
            w.query('COMMIT')
        except DBError as exc:
            assert 'introuvable' in str(exc),str(exc)
        else:
            raise AssertionError('Commit après expiration non refusé')
    verify_zero(admin)


def scenario_4(admin):
    with Session('pt01_revoker') as r:
        r.query('BEGIN; SELECT pt01.revoke_fixture(1); ROLLBACK')
    current=state(admin)
    assert current['active'] and current['epoch']==1,current
    with Session('pt01_writer') as w:
        assert write(w)=='integre'


def scenario_5(admin):
    with Session('pt01_writer') as w:
        w.query('BEGIN')
        assert write(w)=='integre'
        try:
            w.query('SELECT 1/0')
        except DBError:
            pass
        else:
            raise AssertionError('Faute SQL non levée')
    verify_zero(admin)


def scenario_6(admin):
    with Session('pt01_writer') as a,Session('pt01_writer') as b:
        a.query('BEGIN')
        assert write(a,'first')=='integre'
        b.start("SELECT pt01.write_fixture(1,0,'other','second')")
        wait_lock(admin,b)
        a.query('COMMIT')
        assert b.finish()[-1]=='conflit_version'
    current=state(admin)
    assert all(current[k]==1 for k in ('versions','activities','outbox','receipts','object_version')),current


def scenario_7(admin):
    with Session('pt01_writer') as a,Session('pt01_writer') as b:
        a.query('BEGIN')
        assert write(a,'obj1')=='integre'
        assert write(b,'obj2',obj=2)=='integre'
        a.query('COMMIT')
    assert state(admin)['versions']==2


def scenario_8(admin):
    for sql in ("UPDATE pt01.grant_fixture SET active=true", "SELECT pt01.revoke_fixture(1)",
                "INSERT INTO pt01.version_fixture VALUES(1,99,'bypass','bad',1,clock_timestamp())"):
        with Session('pt01_writer') as w:
            try:
                w.query(sql)
            except DBError as exc:
                assert 'permission denied' in str(exc),str(exc)
            else:
                raise AssertionError('Accès direct permis : '+sql)
    verify_zero(admin)
    assert admin.query("SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname='pt01_writer'")[-1]=='f'


def scenario_9(admin):
    with Session('pt01_writer') as w,Session('pt01_revoker') as r:
        assert write(w)=='integre'
        assert write(w)=='deja_integre'
        assert w.query('SELECT pt01.current_view(1)')[-1]=='synthetic'
        r.query('SELECT pt01.revoke_fixture(1)')
        assert w.query('SELECT pt01.current_view(1)')[-1]=='introuvable'
        assert write(w)=='introuvable'
    assert state(admin)['versions']==1


def scenario_10(admin):
    with Session('pt01_writer') as w,Session('pt01_revoker') as r:
        w.query('BEGIN')
        assert write(w)=='integre'
        r.start('SELECT pt01.revoke_fixture(1)')
        wait_lock(admin,r)
        assert admin.query(f'SELECT pg_terminate_backend({w.pid})')[-1]=='t'
        assert r.finish()[-1]=='2'
    verify_zero(admin)
    assert not state(admin)['active']


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--image',default='postgres:18',choices=['postgres:18','postgres:18-alpine'])
    options=parser.parse_args()
    started=datetime.now(timezone.utc).isoformat()
    created=False
    cases=[]
    metadata={}
    fatal=None
    negative_control=None
    try:
        image=json.loads(docker('image','inspect',options.image).stdout)[0]
        metadata={'image_reference':options.image,'image_id':image['Id'],'repo_digests':image.get('RepoDigests',[]),
                  'architecture':image['Architecture'],'memory_bytes':536870912,'cpu_limit':1,
                  'network':'none','published_ports':[],'host_mounts':[],'cloud_cost_euros':0}
        docker('run','--detach','--rm','--name',NAME,'--network','none','--memory','512m','--cpus','1',
               '--env','POSTGRES_HOST_AUTH_METHOD=trust','--env','POSTGRES_DB=pt01',image['Id'],
               'postgres','-c','track_commit_timestamp=on')
        created=True
        actual=json.loads(docker('inspect',NAME).stdout)[0]
        metadata['container_name']=NAME
        metadata['verified_network']=actual['HostConfig']['NetworkMode']
        metadata['verified_memory_bytes']=actual['HostConfig']['Memory']
        metadata['verified_cpu_limit']=actual['HostConfig']['NanoCpus']/1_000_000_000
        metadata['host_bind_mounts']=[m['Destination'] for m in actual['Mounts'] if m['Type']=='bind']
        metadata['verified_port_bindings']=actual['HostConfig'].get('PortBindings') or {}
        assert metadata['verified_network']=='none' and not metadata['host_bind_mounts'] and not metadata['verified_port_bindings']
        deadline=time.monotonic()+45
        while time.monotonic()<deadline:
            logs=docker('logs',NAME,check=False)
            initialized='PostgreSQL init process complete' in logs.stdout+logs.stderr
            if initialized and docker('exec',NAME,'pg_isready','-U','postgres','-d','pt01',check=False).returncode==0:
                break
            time.sleep(0.3)
        else:
            raise RuntimeError('PostgreSQL non prêt')
        docker('cp',str(HERE/'schema.sql'),NAME+':/tmp/pt01.sql')
        docker('exec',NAME,'psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d','pt01','-f','/tmp/pt01.sql')
        with Session() as admin:
            metadata['postgresql_version']=admin.query('SELECT version()')[-1]
            metadata['default_isolation']=admin.query('SHOW default_transaction_isolation')[-1]
            functions=[scenario_1,scenario_2,scenario_3,scenario_4,scenario_5,scenario_6,scenario_7,scenario_8,scenario_9,scenario_10]
            labels=['Écriture avant révocation','Révocation avant écriture','Expiration avant validation différée de commit',
                    'Rollback révocation/époque','Rollback version/activité/impact/outbox/reçu',
                    'Conflit de version concurrent','Écritures indépendantes concurrentes','Rôle applicatif sans contournement direct',
                    'Idempotence et refus de réponse ancienne','Perte de connexion et libération de garde']
            for number,(function,label) in enumerate(zip(functions,labels),1):
                reset(admin)
                begin=len(TRACE)
                try:
                    function(admin)
                    status='PASS'
                    error=None
                except Exception as exc:
                    status='FAIL'
                    error=f'{type(exc).__name__}: {exc}'
                cases.append({'id':f'PT01-{number:02d}','objet':label,'statut':status,'erreur':error,
                              'etat_final':state(admin),'traces':TRACE[begin:]})
                print(f'PT01-{number:02d} {status} {label}',flush=True)
            # Contre-épreuve : forcer la validation différée avant de retarder COMMIT.
            # Elle démontre une limite ; elle n'est pas comptée comme conformité A6.
            reset(admin)
            begin=len(TRACE)
            with Session('pt01_writer') as w:
                admin.query("UPDATE pt01.grant_fixture SET expires_at=clock_timestamp()+interval '2 seconds' WHERE object_id=1")
                w.query('BEGIN')
                assert write(w,'earlycheck')=='integre'
                w.query('SET CONSTRAINTS ALL IMMEDIATE')
                admin.query("SELECT pg_sleep(GREATEST(0,EXTRACT(EPOCH FROM ((SELECT expires_at FROM pt01.grant_fixture WHERE object_id=1)-clock_timestamp())))+0.05)")
                w.query('COMMIT')
            observation=json.loads(admin.query("SELECT json_build_object('checked_at',c.checked_at,'expires_at',g.expires_at,"
                "'commit_timestamp',pg_xact_commit_timestamp(v.xmin),'validation_before_expiry',c.checked_at<g.expires_at,"
                "'commit_after_expiry',pg_xact_commit_timestamp(v.xmin)>=g.expires_at) "
                "FROM pt01.version_fixture v JOIN pt01.final_check_fixture c USING(command_id) "
                "JOIN pt01.grant_fixture g ON g.object_id=v.object_id WHERE v.command_id='earlycheck'")[-1])
            assert observation['validation_before_expiry'] and observation['commit_after_expiry'],observation
            negative_control={'id':'PT01-CE01','statut':'CONTRE_EXEMPLE_OBSERVE',
                              'objet':'SET CONSTRAINTS IMMEDIATE autorisé au rôle applicatif puis commit après échéance',
                              'observation':observation,'traces':TRACE[begin:]}
            print('PT01-CE01 CONTRE_EXEMPLE_OBSERVE contrôle différé insuffisant pour borner le commit',flush=True)
    except Exception as exc:
        fatal=f'{type(exc).__name__}: {exc}'
    finally:
        if created:
            try:
                cleanup=docker('rm','--force',NAME,check=False)
                metadata['container_removed']=cleanup.returncode==0
                if not metadata['container_removed']:
                    fatal=fatal or 'Nettoyage du conteneur de ce banc non confirmé'
            except Exception as exc:
                metadata['container_removed']=False
                fatal=fatal or f'Nettoyage : {exc}'
    result={'started_utc':started,'ended_utc':datetime.now(timezone.utc).isoformat(),'prototype':'PT01',
            'nature':'Transactions PostgreSQL réelles avec processus psql/connexions distincts, corpus synthétique réduit',
            'metadata':metadata,'cases':cases,'contre_epreuve':negative_control,'fatal':fatal,'SQL_execute':bool(cases),
            'verdict':'PARTIEL_EXPIRATION_NON_RESOLUE' if not fatal and len(cases)==10 and all(c['statut']=='PASS' for c in cases) and negative_control else 'FAIL',
            'PT01_clos_integralement':False,'architecture_gelee':False,'pile_ratifiee':False,
            'limites':['Pas tout V1.6 ni le MLD complet ; identité limitée à des rôles PostgreSQL synthétiques.',
                       ('Contrôle différé insuffisant : validation forcée avant échéance puis commit après échéance observés ; SEC-01 non clos.' if negative_control else
                        'Borne temporelle de commit non prouvée ; contre-épreuve prévue mais non exécutée.'),
                       'Aucune preuve HTTP/point de divulgation, de non-divulgation temporelle ou de famine (SEC-03/04/02).',
                       'Rôle applicatif restreint, fonctions SECURITY DEFINER à durcir/revoir en production ; pas politiques RLS de production.',
                       'Deux connexions/processus prouvent une garde commune à la base, pas une topologie multi-hôte déployée.',
                       'Aucun benchmark, PRA, délai MPD-04, chiffre de capacité ou totalité des prototypes exécutés.'],
            'sha256_sources':{str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in [HERE/'schema.sql',HERE/'run.py']}}
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(result['verdict'],fatal or '',flush=True)
    raise SystemExit(result['verdict']=='FAIL')


if __name__=='__main__':
    main()
