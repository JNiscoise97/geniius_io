"""HTTP loopback réel + PostgreSQL isolé ; aucune pile de production choisie."""
import contextlib
import hashlib
import http.client
import importlib.util
import json
import queue
import random
import sys
import threading
import time
import uuid
from datetime import datetime,timezone
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('pt01_transport',HERE.parent/'pt01/run.py')
db=importlib.util.module_from_spec(spec)
spec.loader.exec_module(db)
db.NAME='geniius-pt02-'+uuid.uuid4().hex[:12]
OUTPUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT02.json'
EVENTS=[]
HOOK=None
CACHE=None
ERRORS=[]
MAX_PORTION_BYTES=4096  # Paramètre de banc, aucune valeur produit ratifiée.
sys.path.insert(0,str(ROOT/'spec/autorisation'))
sys.path.insert(0,str(ROOT/'spec/autorisation/tests'))
from base import Base
from statistics_probe import exercise as statistics_exercise
import relational_probe
import paired_worlds_probe
MODEL=None
POOL=None

class ReaderPool:
    def __init__(self,size=4):
        self.size=size;self.closed=False;self.sessions=queue.Queue()
        for _ in range(size):self.sessions.put(db.Session('pt02_reader'))
    @contextlib.contextmanager
    def connection(self):
        session=self.sessions.get(timeout=15)
        try:
            yield session
        except BaseException:
            if session.process.poll() is None:
                with contextlib.suppress(Exception):session.query('ROLLBACK')
            raise
        finally:
            if session.process.poll() is not None and not self.closed:
                session.close();session=db.Session('pt02_reader')
            self.sessions.put(session)
    def close(self):
        self.closed=True
        for _ in range(self.size):self.sessions.get(timeout=15).close()

@contextlib.contextmanager
def reader_connection():
    with POOL.connection() as session:yield session

def build_model():
    fixture=Base()
    fixture.setUp();fixture.projet()
    fixture.ok(fixture.s.creer_espace('RS2','Q'))
    fixture.extra=fixture.obj('RS2','Q',titre='objet autre espace')
    return fixture
def event(phase,**fields):
    EVENTS.append({'phase':phase,'monotone_ns':time.monotonic_ns(),**fields})
def hook(phase):
    if HOOK: HOOK(phase)
def render(s,ident=None,offset=0):
    raw=s.query(f'SELECT pt01.render_fixture({ident if ident is not None else "NULL"},{offset})')[-1]
    envelope=json.loads(raw)
    event('evaluation_sql',pid=s.pid,checked_at=envelope['checked_at'],expires_at=envelope['expires_at'],
          authorized=envelope['payload'] is not None)
    return envelope['payload']
class Handler(BaseHTTPRequestHandler):
    protocol_version='HTTP/1.1'
    def log_message(self,*args): pass
    def response(self,body,status=200):
        data=json.dumps(body,separators=(',',':'),sort_keys=True).encode()
        if len(data)>MAX_PORTION_BYTES:raise RuntimeError('Portion de banc trop grande')
        self.send_response_only(status)
        self.send_header('Content-Type','application/json')
        self.send_header('Cache-Control','no-store')
        self.send_header('Content-Length',str(len(data)))
        self.send_header('Connection','close')
        self.end_headers()
        self.wfile.write(data)
        self.wfile.flush()
        event('remis_transport',path=self.path,status=status,body=body)
        self.close_connection=True
    def do_GET(self):
        try:
            if self.path.startswith('/rel/'):
                return self.relational_search()
            if self.path.startswith('/model/'):
                return self.model_search()
            if self.path=='/stream': return self.stream()
            ident=int(self.path.split('/')[-1]) if self.path.startswith(('/object/','/cached/')) else None
            offset=1 if self.path=='/page/1' else 0
            with reader_connection() as s:
                s.query('BEGIN ISOLATION LEVEL READ COMMITTED')
                prepared=CACHE if self.path.startswith('/cached/') else render(s,ident,offset)
                event('prepare',path=self.path,pid=s.pid,cached=self.path.startswith('/cached/'))
                hook('before_final')
                # Toute donnée préparée/cache est reconstruite depuis le graphe courant.
                final=render(s,ident,offset)
                event('controle_final',path=self.path,pid=s.pid,authorized=final is not None)
                hook('after_final')
                self.response(final if final is not None else {'error':'introuvable'},200 if final is not None else 404)
                s.query('COMMIT')
        except Exception as exc:
            ERRORS.append(type(exc).__name__+': '+str(exc))
            self.close_connection=True
    def stream(self):
        headers_sent=False
        for n in range(2):
            with reader_connection() as s:
                s.query('BEGIN')
                final=render(s,1)
                if final is None:
                    s.query('ROLLBACK')
                    event('portion_refusee',portion=n)
                    if not headers_sent:
                        self.response({'error':'introuvable'},404)
                        return
                    break
                payload=(final['title']+'\n').encode()
                if len(payload)>MAX_PORTION_BYTES:raise RuntimeError('Portion de banc trop grande')
                event('controle_portion',portion=n,pid=s.pid)
                hook('after_final_chunk')
                if not headers_sent:
                    self.send_response_only(200)
                    self.send_header('Transfer-Encoding','chunked')
                    self.send_header('Cache-Control','no-store')
                    self.send_header('Connection','close')
                    self.end_headers()
                    headers_sent=True
                self.wfile.write(f'{len(payload):x}\r\n'.encode()+payload+b'\r\n')
                self.wfile.flush()
                event('portion_remise',portion=n,pid=s.pid)
                s.query('COMMIT')
            hook('between_chunks')
        self.wfile.write(b'0\r\n\r\n')
        self.wfile.flush()
        self.close_connection=True
    def do_POST(self):
        try:
            if self.path.startswith('/link/'):
                return self.create_link()
            with db.Session('pt01_writer') as s:
                s.query('BEGIN')
                assert db.write(s,'http_command')=='integre'
                event('mutation_preparee',pid=s.pid)
                hook('before_commit')
                try: s.query('COMMIT')
                except db.DBError:
                    self.response({'error':'introuvable'},404)
                    return
                event('commit_confirme',pid=s.pid)
                self.response({'status':'integre'})
        except Exception as exc:
            ERRORS.append(type(exc).__name__+': '+str(exc))
            self.close_connection=True
    def create_link(self):
        source,target=map(int,self.path.split('/')[-2:])
        with reader_connection() as s:
            s.query('BEGIN')
            code=s.query(f'SELECT pt01.create_link_fixture({source},{target})')[-1]
            s.query('COMMIT')
            self.response({'status':code},404 if code=='introuvable' else 409 if code=='conflit_visible' else 201)
    def model_search(self):
        actor=self.path.split('/')[-1]
        if actor not in ('R0','RS','RS2','COL','TIT','LEC','ADM','SUP1','INV'):
            self.response({'error':'introuvable'},404);return
        with reader_connection() as s:
            s.query('BEGIN')
            if render(s,1) is None:
                self.response({'error':'introuvable'},404);s.query('COMMIT');return
            # Moteur de référence intégral exercé dans la frontière HTTP du banc.
            # État synthétique Python, pas transposition relationnelle du MLD.
            visible=[]
            for oid in (MODEL.o,MODEL.priv,MODEL.extra):
                if MODEL.s.acces(actor,oid,'voir').ok:visible.append(oid)
            event('graphe_modele',actor=actor,visible=visible)
            self.response({'items':visible,'count':len(visible)})
            s.query('COMMIT')
    def relational_search(self):
        parts=self.path.split('/')
        actor,oid=parts[2:4]
        purpose=parts[4].replace('_',' ') if len(parts)>4 else None
        with reader_connection() as s:
            s.query('BEGIN')
            raw=s.query('SELECT pt02_auth.render('+relational_probe.literal(actor)+','+
                        relational_probe.literal(oid)+','+(relational_probe.literal(purpose) if purpose else 'NULL')+')')[-1]
            payload=json.loads(raw) if raw else None
            event('rendu_relationnel',actor=actor,object_id=oid,pid=s.pid,authorized=payload is not None)
            self.response(payload if payload is not None else {'error':'introuvable'},200 if payload is not None else 404)
            s.query('COMMIT')
def request(server,path='/search',method='GET'):
    started=time.monotonic_ns()
    with contextlib.closing(http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=15)) as c:
        c.request(method,path)
        r=c.getresponse()
        raw=r.read()
        result={'status':r.status,'headers':r.getheaders(),'body':raw.decode(),'duration_ns':time.monotonic_ns()-started}
        event('recu_client',path=path,**result)
        return result
def reset(admin):
    global HOOK,CACHE,MODEL
    HOOK=None
    CACHE=None
    db.reset(admin)
    admin.query('UPDATE pt01.search_fixture SET protected=(id=2)')
    admin.query('TRUNCATE pt01.link_fixture; INSERT INTO pt01.link_fixture VALUES(1,2)')
    MODEL=build_model()
def revoke():
    with db.Session('pt01_revoker') as r:
        r.query('SELECT pt01.revoke_fixture(1)')
        event('revocation_confirmee',pid=r.pid)
def expire(admin):
    admin.query("UPDATE pt01.grant_fixture SET expires_at=clock_timestamp()-interval '1 second' WHERE object_id=1")
def case_1(a,s):
    r=request(s)
    body=json.loads(r['body'])
    assert body=={'items':[{'id':1,'title':'alpha'}],'count':2,'facets':[{'facet':'science','count':2}],'suggestions':['alpha','beta']},body
def case_2(a,s):
    hidden=request(s,'/object/2'); absent=request(s,'/object/999')
    assert hidden['status']==absent['status']==404
    assert hidden['headers']==absent['headers'] and hidden['body']==absent['body']
def case_3(a,s):
    assert request(s,'/object/4')['status']==404
def case_4(a,s):
    assert json.loads(request(s)['body'])['items'][0]['title']=='alpha'
    revoke()
    assert json.loads(request(s,'/page/1')['body'])['items']==[]
def case_5(a,s):
    global CACHE
    CACHE=request(s,'/object/1')['body']
    assert 'alpha' in CACHE
    revoke()
    assert 'alpha' not in request(s,'/cached/1')['body']
def case_6(a,s):
    global HOOK
    # L'expiration ne modifie pas l'autorité pendant la garde : elle est déjà datée.
    a.query("UPDATE pt01.grant_fixture SET expires_at=clock_timestamp()+interval '2 seconds' WHERE object_id=1")
    def wait(phase):
        if phase=='before_final':
            a.query("SELECT pg_sleep(GREATEST(0,EXTRACT(EPOCH FROM ((SELECT expires_at FROM pt01.grant_fixture WHERE object_id=1)-clock_timestamp())))+0.05)")
    HOOK=wait
    assert request(s,'/object/1')['status']==404
def case_7(a,s):
    global HOOK
    arrived=threading.Event();release=threading.Event();responses=queue.Queue()
    def pause(phase):
        if phase=='after_final':
            arrived.set()
            assert release.wait(10),'barrière HTTP non libérée'
    HOOK=pause
    client=threading.Thread(target=lambda:responses.put(request(s,'/object/1')))
    client.start()
    try:
        assert arrived.wait(10)
        with db.Session('pt01_revoker') as r:
            r.start('SELECT pt01.revoke_fixture(1)')
            db.wait_lock(a,r)
            release.set()
            assert r.finish()[-1]=='2'
            event('revocation_confirmee',pid=r.pid)
        client.join(10)
        assert responses.get(timeout=1)['status']==200
    finally:
        release.set();client.join(10)
    HOOK=None
    assert request(s,'/object/1')['status']==404
def case_8(a,s):
    global HOOK
    def between(phase):
        if phase=='between_chunks':revoke()
    HOOK=between
    assert request(s,'/stream')['body']=='alpha\n'
    assert any(e['phase']=='portion_refusee' and e['portion']==1 for e in EVENTS)
def case_9(a,s):
    assert request(s,'/object/1')['status']==200
    revoke()
    assert request(s,'/object/1')['status']==404
def case_10(a,s):
    global HOOK
    def before(phase):
        if phase=='before_commit':db.verify_zero(a)
    HOOK=before
    assert request(s,'/mutation','POST')['body']=='{"status":"integre"}'
    dbstate=db.state(a)
    assert all(dbstate[k]==1 for k in ('versions','activities','receipts','outbox')),dbstate
def case_11(a,s):
    global HOOK
    def before(phase):
        if phase=='before_commit':expire(a)
    HOOK=before
    assert request(s,'/mutation','POST')['status']==404
    db.verify_zero(a)
def case_12(a,s):
    with db.Session('pt02_reader') as reader:
        try: reader.query('SELECT * FROM pt01.search_fixture')
        except db.DBError as exc:assert 'permission denied' in str(exc)
        else:raise AssertionError('lecture directe permise')
def case_13(a,s):
    global CACHE
    CACHE=request(s,'/object/1')['body']
    a.query('BEGIN; SELECT 1 FROM pt01.authority WHERE id=1 FOR UPDATE; '
            'UPDATE pt01.search_fixture SET protected=true WHERE id=1; '
            'UPDATE pt01.authority SET epoch=epoch+1; COMMIT')
    assert request(s,'/cached/1')['status']==404
    body=json.loads(request(s)['body'])
    assert body['count']==1 and body['suggestions']==['beta'] and body['items']==[{'id':3,'title':'beta'}],body
def case_14(a,s):
    # Mesure exploratoire, sans seuil statistique de conformité inventé.
    rng=random.Random(20261013)
    for _ in range(6):
        paths=['/object/2','/object/999'];rng.shuffle(paths)
        responses=[request(s,path) for path in paths]
        assert responses[0]['status']==responses[1]['status']==404
        assert responses[0]['body']==responses[1]['body'] and responses[0]['headers']==responses[1]['headers']
def counterexample(a,s):
    global HOOK
    a.query("UPDATE pt01.grant_fixture SET expires_at=clock_timestamp()+interval '2 seconds' WHERE object_id=1")
    def pause(phase):
        if phase=='after_final':
            a.query("SELECT pg_sleep(GREATEST(0,EXTRACT(EPOCH FROM ((SELECT expires_at FROM pt01.grant_fixture WHERE object_id=1)-clock_timestamp())))+0.05)")
            observation=json.loads(a.query("SELECT json_build_object('server_time',clock_timestamp(),'expires_at',expires_at,"
                "'expired',clock_timestamp()>=expires_at) FROM pt01.grant_fixture WHERE object_id=1")[-1])
            assert observation['expired'],observation
            event('echeance_depassee_avant_transport',**observation)
    HOOK=pause
    assert 'alpha' in request(s,'/object/1')['body']
    return {'id':'PT02-CE01','statut':'CONTRE_EXEMPLE_OBSERVE',
            'objet':'Pause injectée après contrôle final lecture : contenu remis au transport après échéance'}
def case_15(a,s):
    global HOOK
    counterexample(a,s)  # Même ordonnancement, évalué selon DC-AUTH-02 seulement.
    HOOK=None
    assert request(s,'/object/1')['status']==404
    assert request(s,'/stream')['status']==404  # Aucun en-tête de succès avant contrôle.
def case_16(a,s):
    global HOOK
    a.query("UPDATE pt01.grant_fixture SET expires_at=clock_timestamp()+interval '2 seconds' WHERE object_id=1")
    def pause(phase):
        if phase=='after_final_chunk':
            a.query("SELECT pg_sleep(GREATEST(0,EXTRACT(EPOCH FROM ((SELECT expires_at FROM pt01.grant_fixture WHERE object_id=1)-clock_timestamp())))+0.05)")
            observation=json.loads(a.query("SELECT json_build_object('server_time',clock_timestamp(),'expires_at',expires_at,"
                "'expired',clock_timestamp()>=expires_at) FROM pt01.grant_fixture WHERE object_id=1")[-1])
            assert observation['expired']
            event('echeance_depassee_avant_transport',**observation)
    HOOK=pause
    assert request(s,'/stream')['body']=='alpha\n'
    assert any(e['phase']=='portion_refusee' and e['portion']==1 for e in EVENTS)
def case_17(a,s):
    hidden=request(s,'/link/1/2','POST');absent=request(s,'/link/1/999','POST')
    assert hidden['status']==absent['status']==404
    assert hidden['headers']==absent['headers'] and hidden['body']==absent['body']
    assert a.query('SELECT count(*) FROM pt01.link_fixture')[-1]=='1'
def case_18(a,s):
    assert request(s,'/link/1/3','POST')['status']==201
    assert request(s,'/link/1/3','POST')['status']==409
    assert a.query('SELECT count(*) FROM pt01.link_fixture WHERE source=1 AND target=3')[-1]=='1'
def case_19(a,s):
    answers=queue.Queue()
    clients=[threading.Thread(target=lambda:answers.put(request(s,'/link/1/3','POST'))) for _ in range(2)]
    for client in clients:client.start()
    for client in clients:client.join(15);assert not client.is_alive()
    assert sorted([answers.get(timeout=1)['status'] for _ in clients])==[201,409]
    assert a.query('SELECT count(*) FROM pt01.link_fixture WHERE source=1 AND target=3')[-1]=='1'
def case_20(a,s):
    for actor in ('R0','RS','COL','LEC'):
        body=json.loads(request(s,'/model/'+actor)['body'])
        assert body=={'items':[MODEL.o],'count':1},(actor,body)
def case_21(a,s):
    for actor in ('ADM','SUP1','INV'):
        assert json.loads(request(s,'/model/'+actor)['body'])=={'items':[],'count':0}
def case_22(a,s):
    assert json.loads(request(s,'/model/TIT')['body'])=={'items':[MODEL.o,MODEL.priv],'count':2}
    assert json.loads(request(s,'/model/RS2')['body'])=={'items':[MODEL.o,MODEL.extra],'count':2}
def case_23(a,s):
    statistics_exercise(a,s,sys.modules[__name__])
def case_24(a,s):relational_probe.hi(a,s,sys.modules[__name__],MODEL)
def case_25(a,s):relational_probe.hp(a,s,sys.modules[__name__],MODEL)
def case_26(a,s):relational_probe.group(a,s,sys.modules[__name__],MODEL)
def case_27(a,s):relational_probe.derogation(a,s,sys.modules[__name__],MODEL)
def case_28(a,s):relational_probe.copies(a,s,sys.modules[__name__],MODEL)
def case_29(a,s):relational_probe.expiry(a,s,sys.modules[__name__],MODEL)
def case_30(a,s):relational_probe.person(a,s,sys.modules[__name__],MODEL)
def case_31(a,s):relational_probe.current_level(a,s,sys.modules[__name__],MODEL)
def case_32(a,s):relational_probe.non_liftable(a,s,sys.modules[__name__],MODEL)
def case_33(a,s):relational_probe.missing_ancestor(a,s,sys.modules[__name__],MODEL)
def case_34(a,s):paired_worlds_probe.exercise(a,s,sys.modules[__name__])
def case_35(a,s):relational_probe.stale_projection(a,s,sys.modules[__name__],MODEL)
def case_36(a,s):relational_probe.time_projection(a,s,sys.modules[__name__],MODEL)
def case_37(a,s):relational_probe.projection_role(a,s,sys.modules[__name__],MODEL)
def main():
    global POOL
    cases=[];fatal=None;ce=None;metadata={};created=False;server=None
    started=datetime.now(timezone.utc).isoformat()
    try:
        image=json.loads(db.docker('image','inspect','postgres:16-alpine').stdout)[0]
        metadata={'image_id':image['Id'],'image_reference':'postgres:16-alpine','cloud_cost_euros':0}
        db.docker('run','--detach','--rm','--name',db.NAME,'--network','none','--memory','512m','--cpus','1',
                  '--env','POSTGRES_HOST_AUTH_METHOD=trust','--env','POSTGRES_DB=pt01',image['Id'],'postgres','-c','track_commit_timestamp=on')
        created=True
        actual=json.loads(db.docker('inspect',db.NAME).stdout)[0]
        metadata.update(network=actual['HostConfig']['NetworkMode'],memory_bytes=actual['HostConfig']['Memory'],
                        cpu_limit=actual['HostConfig']['NanoCpus'],host_bind_mounts=[m for m in actual['Mounts'] if m['Type']=='bind'],
                        ports=actual['HostConfig'].get('PortBindings') or {})
        assert metadata['network']=='none' and not metadata['host_bind_mounts'] and not metadata['ports']
        deadline=time.monotonic()+45
        while time.monotonic()<deadline:
            logs=db.docker('logs',db.NAME,check=False)
            if 'PostgreSQL init process complete' in logs.stdout+logs.stderr and db.docker('exec',db.NAME,'pg_isready','-U','postgres',check=False).returncode==0:break
            time.sleep(.3)
        else:raise RuntimeError('PostgreSQL non prêt')
        for path in [HERE.parent/'pt01/schema.sql',HERE/'schema.sql',HERE/'relational.sql']:
            db.docker('cp',str(path),db.NAME+':/tmp/schema.sql')
            db.docker('exec',db.NAME,'psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d','pt01','-f','/tmp/schema.sql')
        POOL=ReaderPool(4)
        metadata['reader_pool_size']=POOL.size
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        server.daemon_threads=True
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        metadata['http_bind']='127.0.0.1';metadata['http_port']=server.server_port
        with db.Session() as admin:
            metadata['postgresql_version']=admin.query('SELECT version()')[-1]
            labels=['Graphe filtré avant compte/facettes/suggestions/pagination','Cible cachée et absente : réponses HTTP identiques',
                'Protection ascendant opposable à la copie','Révocation entre deux pages','Cache préparé non réutilisé après révocation',
                'Expiration entre préparation et contrôle final','Garde conservée à la remise HTTP et révocation bloquée',
                'Révocation entre deux portions de flux HTTP','Ancienne URL réévaluée après révocation',
                'Succès HTTP après commit confirmé et effets atomiques','Échec de commit : aucun succès HTTP ni effet canonique',
                'Rôle lecture sans accès direct aux tables','Protection ajoutée : cache/projection ancienne non opposables',
                'Paires caché/absent répétées : sorties identiques, délais exploratoires',
                'Page engagée avant échéance, remise tardive admise ; requête suivante refusée',
                'Portion de flux engagée avant échéance, remise tardive admise ; portion suivante refusée',
                'FK/UQ : collision cachée et référence absente refusées avant insertion',
                'UQ sur lien visible : création puis conflit admissible',
                'UQ concurrente : un seul lien, création/conflit cohérents',
                'Moteur de référence V1.6 : rôles scientifiques, graphe filtré avant compte',
                'Moteur de référence V1.6 : administration/autorité/invitation sans droit implicite',
                'Moteur de référence V1.6 : titularité personnelle et isolation interespaces',
                'Diagnostic statistique caché/absent sous charges 1 et 4, sans clôture NF10',
                'SQL HI : survie au signataire avec comparaison à V1.6',
                'SQL HP : fondement récursif rompu, projection dépendante active refusée',
                'SQL groupe/admission : membre seul refusé, retrait et réentrée sans résurrection',
                'SQL dérogation : cible/finalité/échéance opposables',
                'SQL copies : protection héritée opposable, levée origine sans levée copie',
                'SQL expiration HI opposable malgré projection active',
                'SQL bénéficiaire par personne : deux comptes, mêmes droits',
                'SQL dérogation : cible devenue sensible, niveau actuel à deux approbateurs requis',
                'SQL copie : non-levable sur ascendant purgé reste opposable',
                'SQL copie : ascendant manquant, refus fermé',
                'Campagne préspécifiée : même URL, trois corpus jumeaux, deux paliers de charge',
                'Projection : génération ancienne refusée, recompilation restaure les droits canoniques',
                'Projection : temps changé sans nouvelle époque, refus fermé',
                'Projection : lecteur sans droit de compilation ni modification']
            for n,label in enumerate(labels,1):
                reset(admin);begin=len(EVENTS);sqlbegin=len(db.TRACE);errbegin=len(ERRORS)
                try:
                    globals()[f'case_{n}'](admin,server)
                    assert len(ERRORS)==errbegin,ERRORS[errbegin:]
                    status='PASS';error=None
                except Exception as exc:status='FAIL';error=type(exc).__name__+': '+str(exc)
                cases.append({'id':f'PT02-{n:02d}','objet':label,'statut':status,'erreur':error,
                              'http_traces':EVENTS[begin:],'sql_traces':db.TRACE[sqlbegin:]})
                print(f'PT02-{n:02d} {status} {label}',flush=True)
    except Exception as exc:fatal=type(exc).__name__+': '+str(exc)
    finally:
        if server:server.shutdown();server.server_close()
        if POOL:
            try:POOL.close();metadata['reader_pool_closed']=True
            except Exception as exc:fatal=fatal or 'Fermeture pool : '+str(exc)
        if created:
            with contextlib.suppress(Exception):metadata['container_removed']=db.docker('rm','--force',db.NAME,check=False).returncode==0
    success=not fatal and len(cases)==37 and all(c['statut']=='PASS' for c in cases) and metadata.get('container_removed')
    data={'prototype':'PT02','started_utc':started,'ended_utc':datetime.now(timezone.utc).isoformat(),'metadata':metadata,
          'HTTP_execute':bool(cases),'SQL_execute':bool(cases),'cases':cases,'contre_epreuve':ce,'fatal':fatal,
          'verdict':'PARTIEL_UQ_GRAPHE_NF10' if success else 'FAIL','PT02_clos':False,
          'constat_temporel_resolu':bool(success),'regle_temporelle':'DC-AUTH-02 ratifié le 13/10/2026',
          'architecture_gelee':False,'pile_ratifiee':False,
          'limites':['UQ/FK sur liens synthétiques éprouvées ; pas toutes contraintes MLD ni recherche spécialisée de production.',
                     'Moteur de référence V1.6 appelé dans HTTP sur état Python synthétique ; sa traduction relationnelle complète reste à éprouver.',
                     'Identité synthétique fixe ; aucune API authentifiée de production, TLS, proxy, CDN ou URL signée.',
                     'Pas de garantie statistique NF10 ni benchmark NF02 ; réponses identiques ne prouvent pas délais indistinguables.',
                     'Portion engagée au contrôle final selon DC-AUTH-02 ; aucune borne physique d arrêt à échéance.',
                     'Taille maximale 4096 octets uniquement pour le banc ; paramètres et traitement des remises bloquées à éprouver avant livraison.',
                     'HTTP local standard Python de banc ; aucune pile de production choisie.'],
          'sha256_sources':{str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest()
                            for p in [HERE/'run.py',HERE/'schema.sql',HERE/'relational.sql',HERE/'relational_probe.py',HERE/'statistics_probe.py',HERE/'paired_worlds_probe.py',HERE/'nf10_campaign.json',HERE.parent/'pt01/run.py',HERE.parent/'pt01/schema.sql',ROOT/'spec/autorisation/modele.py',ROOT/'spec/autorisation/tests/base.py',ROOT/'spec/autorisation/tests/outils.py']}}
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(data['verdict'],fatal or '',flush=True)
    raise SystemExit(not success)
if __name__=='__main__':main()
