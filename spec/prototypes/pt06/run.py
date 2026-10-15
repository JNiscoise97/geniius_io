"""PT06 A : API HTTP loopback et contrats de compatibilité synthétiques."""
from contextlib import closing
import hashlib
import http.client
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
import json
import platform
import sqlite3
import tempfile
import threading
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PROTOTYPE_PT06.json'
DATABASE=None

def connect():
    c=sqlite3.connect(DATABASE,timeout=15,isolation_level=None);c.execute('PRAGMA journal_mode=WAL');c.execute('PRAGMA synchronous=FULL');return c

def reset():
    with closing(connect()) as c:
        c.executescript("DROP TABLE IF EXISTS session; DROP TABLE IF EXISTS receipt; DROP TABLE IF EXISTS object; CREATE TABLE session(token TEXT PRIMARY KEY,actor TEXT,device TEXT,active INTEGER); INSERT INTO session VALUES('S1','A','D',1),('S2','B','E',1); CREATE TABLE object(id TEXT PRIMARY KEY,owner TEXT,title TEXT); INSERT INTO object VALUES('visible','A','visible synthetic'),('hidden','B','hidden synthetic'); CREATE TABLE receipt(actor TEXT,device TEXT,origin TEXT,digest TEXT,original TEXT,status TEXT,converted TEXT,PRIMARY KEY(actor,device,origin));")

class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):pass
    def response(self,status,payload):
        body=json.dumps(payload,sort_keys=True,separators=(',',':')).encode()
        self.send_response_only(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body);self.wfile.flush()
    def handle_api(self):
        with closing(connect()) as c:
            c.execute('BEGIN IMMEDIATE') # garde globale de banc jusqu'à remise GET
            token=self.headers.get('Authorization','').removeprefix('Bearer ')
            session=c.execute('SELECT actor,device FROM session WHERE token=? AND active=1',(token,)).fetchone()
            if not session:
                self.response(401,{'error':'session_unavailable'});c.execute('COMMIT');return
            actor,device=session
            if self.headers.get('X-Device')!=device:
                self.response(404,{'error':'introuvable'});c.execute('COMMIT');return
            if self.command=='GET':
                if self.path=='/replica':
                    if self.headers.get('X-Client-Version')!='2':
                        self.response(426,{'error':'update_required'});c.execute('COMMIT');return
                    rows=c.execute('SELECT id,title FROM object WHERE owner=? ORDER BY id',(actor,)).fetchall()
                    self.response(200,{'items':rows});c.execute('COMMIT');return
                row=c.execute('SELECT id,title FROM object WHERE id=? AND owner=?',(self.path.removeprefix('/object/'),actor)).fetchone() if self.path.startswith('/object/') else None
                self.response(200 if row else 404,{'id':row[0],'title':row[1]} if row else {'error':'introuvable'});c.execute('COMMIT');return
            if self.path!='/receive':
                self.response(400,{'error':'unsupported_operation'});c.execute('COMMIT');return
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0<length<=4096:raise ValueError('size')
                envelope=json.loads(self.rfile.read(length))
                if set(envelope)!={'origin','format','delta'} or not isinstance(envelope['origin'],str) or not envelope['origin']:raise ValueError('envelope')
                version=envelope['format'];delta=envelope['delta']
                if type(version)!=int or version not in (1,2) or not isinstance(delta,dict) or set(delta)!={'target','text','concept'} or any(not isinstance(v,str) for v in delta.values()):raise ValueError('format')
            except (ValueError,TypeError):
                self.response(400,{'error':'invalid_envelope'});c.execute('COMMIT');return
            original=json.dumps(envelope,sort_keys=True);digest=hashlib.sha256(original.encode()).hexdigest()
            key=(actor,device,envelope['origin'])
            old=c.execute('SELECT digest FROM receipt WHERE actor=? AND device=? AND origin=?',key).fetchone()
            if old and old[0]!=digest:
                self.response(409,{'error':'origin_conflict'});c.execute('COMMIT');return
            ambiguous=delta['concept']!='known'
            converted=None if ambiguous else json.dumps(dict(delta,format=2,converter='identity-v2' if version==2 else 'v1-to-v2'),sort_keys=True)
            c.execute('INSERT OR IGNORE INTO receipt VALUES(?,?,?,?,?,?,?)',key+(digest,original,'awaiting' if ambiguous else 'converted',converted))
            c.execute('COMMIT') # accusé technique après durabilité ; aucun effet canonique créé
            self.response(202,{'status':'received'})
    do_GET=handle_api
    do_POST=handle_api

def request(server,path,method='GET',payload=None,token='S1',device='D',version='2',raw=None):
    body=raw if raw is not None else (json.dumps(payload).encode() if payload is not None else b'')
    with closing(http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=15)) as c:
        c.request(method,path,body=body,headers={'Authorization':'Bearer '+token,'X-Device':device,'X-Client-Version':version})
        r=c.getresponse();return dict(status=r.status,headers=dict(r.getheaders()),body=r.read().decode())

def state():
    with closing(connect()) as c:return dict(receipts=c.execute('SELECT * FROM receipt ORDER BY origin').fetchall(),objects=c.execute('SELECT * FROM object ORDER BY id').fetchall())

def exercise(n,server,traces):
    reset();before=state()
    envelope={'origin':'op1','format':2,'delta':{'target':'hidden','text':'author delta','concept':'known'}}
    def call(path,**kw):
        result=request(server,path,**kw);traces.append(result);return result
    if n==1:assert call('/unknown',method='POST',payload=envelope)['status']==400
    elif n==2:
        assert call('/receive',method='POST',raw=b'{bad')['status']==400
        assert call('/receive',method='POST',payload=dict(envelope,future_semantic='unknown'))['status']==400
    elif n==3:
        for _ in range(2):assert call('/receive',method='POST',payload=envelope)['status']==202
        changed=json.loads(json.dumps(envelope));changed['delta']['text']='other'
        assert call('/receive',method='POST',payload=changed)['status']==409
        assert len(state()['receipts'])==1
    elif n==4:assert call('/object/hidden')==call('/object/absent')
    elif n==5:
        assert call('/object/visible',token='S2',device='E')==call('/object/visible',device='wrong')
    elif n==6:
        assert call('/replica',version='1')['status']==426
        assert call('/receive',method='POST',payload=envelope,version='1')['status']==202
        assert call('/replica')['status']==200
    elif n==7:
        envelope['format']=1;assert call('/receive',method='POST',payload=envelope)['status']==202
        ambiguous=json.loads(json.dumps(envelope));ambiguous['origin']='op2';ambiguous['delta']['concept']='split'
        assert call('/receive',method='POST',payload=ambiguous)['status']==202
        rows=state()['receipts'];assert rows[0][5]=='converted' and rows[1][5]=='awaiting' and rows[1][6] is None
    else:
        assert call('/object/visible')['status']==200
        with closing(connect()) as c:c.execute("UPDATE session SET active=0 WHERE token='S1'")
        assert call('/object/visible')['status']==401
        assert call('/receive',method='POST',payload=envelope)['status']==401
    after=state();assert before['objects']==after['objects']
    if n in (1,2,4,5,8):assert not after['receipts']
    return before,after

def main():
    global DATABASE
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None;server=None
    labels=['Opération inconnue : refus sans effet','Enveloppe/JSON/champ inconnu : refus',
            'Réception répétée et origine conflictuelle','Cible cachée/absente : mêmes sorties HTTP',
            'Mauvais compte/appareil : cible introuvable','Ancien client : ajouts refusés mais réception sûre',
            'Conversion versionnée ou ambiguïté en attente','Session révoquée entre requêtes : recontrôle']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt06-a-') as temp:
            DATABASE=Path(temp)/'api.sqlite';reset()
            journal=Path(temp)/'private-journal.txt';journal.write_text('synthetic own delta',encoding='utf-8');original=journal.read_bytes()
            server=ThreadingHTTPServer(('127.0.0.1',0),Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            try:
                for n,label in enumerate(labels,1):
                    traces=[]
                    try:
                        before,after=exercise(n,server,traces);assert journal.read_bytes()==original
                        cases.append(dict(id=f'PT06-A{n:02d}',label=label,status='PASS',before=before,after=after,http_traces=traces,journal_intact=True))
                    except Exception as exc:cases.append(dict(id=f'PT06-A{n:02d}',label=label,status='FAIL',error=repr(exc),http_traces=traces))
            finally:server.shutdown();server.server_close();thread.join(timeout=5)
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT06',lot='A',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_API_COMPATIBILITE' if len(cases)==8 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT06_clos=False,MFA_qualifie=False,
           metadata=dict(os=platform.platform(),HTTP_bind='127.0.0.1',temporary_files_removed=not fatal,cloud_cost_euros=0),
           limits=['Tokens, appareils et version/capacité clients de fixture, pas authentification réelle ni MFA.',
                   'Versions/convertisseur synthétiques, pas négociation sécurisée, fenêtre produit ou référentiels complets.',
                   'API SQLite réduite, pas Core/MLD complet, TLS/proxy, réseau hostile ou capacité.',
                   'Journal témoin conservé, pas récupération authentifiée complète ni migration du client local.',
                   'Caché/absent fonctionnel, pas qualification des canaux de latence NF10.'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':main()
