"""PT06 B : primitives password/TOTP et sessions de banc, pas IdP de production."""
import concurrent.futures
from contextlib import closing
import hashlib
import hmac
import json
import platform
import secrets
import sqlite3
import struct
import tempfile
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT06_LOT_B.json'
ITERATIONS=200000

def connect(path):
    c=sqlite3.connect(path,timeout=15,isolation_level=None);c.execute('PRAGMA journal_mode=WAL');c.execute('PRAGMA synchronous=FULL');return c
def sha(value):return hashlib.sha256(value.encode()).hexdigest()
def totp(seed,now,digits=6):
    mac=hmac.new(seed,struct.pack('>Q',now//30),hashlib.sha1).digest();offset=mac[-1]&15
    code=(int.from_bytes(mac[offset:offset+4],'big')&0x7fffffff)%10**digits
    return str(code).zfill(digits)
def password_hash(password,salt):return hashlib.pbkdf2_hmac('sha256',password.encode(),salt,ITERATIONS)

def initialize(path):
    seed=secrets.token_bytes(20);salt=secrets.token_bytes(16);password=secrets.token_urlsafe(24);recovery=secrets.token_urlsafe(24)
    with closing(connect(path)) as c:
        c.executescript('CREATE TABLE clock(now INTEGER); INSERT INTO clock VALUES(300); CREATE TABLE account(id TEXT PRIMARY KEY,salt BLOB,verifier BLOB,seed BLOB,last_counter INTEGER,active INTEGER); CREATE TABLE challenge(hash TEXT PRIMARY KEY,actor TEXT,device TEXT,deadline INTEGER,used INTEGER); CREATE TABLE session(hash TEXT PRIMARY KEY,actor TEXT,device TEXT,deadline INTEGER,fresh_until INTEGER,active INTEGER); CREATE TABLE recovery(actor TEXT,hash TEXT PRIMARY KEY,used INTEGER);')
        c.execute('INSERT INTO account VALUES(?,?,?,?,?,1)',('A',salt,password_hash(password,salt),seed,-1))
        c.execute('INSERT INTO recovery VALUES(?,?,0)',('A',sha(recovery)))
    return dict(seed=seed,password=password,recovery=recovery)

def challenge(path,actor='A',device='D'):
    token=secrets.token_urlsafe(32)
    with closing(connect(path)) as c:
        now=c.execute('SELECT now FROM clock').fetchone()[0]
        c.execute('INSERT INTO challenge VALUES(?,?,?,?,0)',(sha(token),actor,device,now+60))
    return token

def authenticate(path,token,password,code,actor='A',device='D',recover=False):
    with closing(connect(path)) as c:
        c.execute('BEGIN IMMEDIATE');now=c.execute('SELECT now FROM clock').fetchone()[0]
        ch=c.execute('SELECT actor,device,deadline,used FROM challenge WHERE hash=?',(sha(token),)).fetchone()
        account=c.execute('SELECT salt,verifier,seed,last_counter,active FROM account WHERE id=?',(actor,)).fetchone()
        if not ch or ch[:2]!=(actor,device) or ch[3] or now>=ch[2] or not account or not account[4]:
            c.execute('ROLLBACK');return {'status':'refused'}
        salt,verifier,seed,last_counter,active=account
        if not hmac.compare_digest(verifier,password_hash(password,salt)):
            c.execute('ROLLBACK');return {'status':'refused'}
        if recover:
            recovery=c.execute('SELECT used FROM recovery WHERE actor=? AND hash=?',(actor,sha(code))).fetchone()
            if not recovery or recovery[0]:c.execute('ROLLBACK');return {'status':'refused'}
            c.execute('UPDATE recovery SET used=1 WHERE hash=?',(sha(code),))
        else:
            counter=now//30
            if counter<=last_counter or not hmac.compare_digest(totp(seed,now),code):
                c.execute('ROLLBACK');return {'status':'refused'}
            c.execute('UPDATE account SET last_counter=? WHERE id=?',(counter,actor))
        c.execute('UPDATE challenge SET used=1 WHERE hash=?',(sha(token),))
        session=secrets.token_urlsafe(32)
        # Recovery ouvre un contexte restreint ; pas une élévation sensible automatique.
        c.execute('INSERT INTO session VALUES(?,?,?,?,?,1)',(sha(session),actor,device,now+300,now if recover else now+60))
        c.execute('COMMIT');return {'status':'authenticated','session':session}

def consult(path,session,device='D',sensitive=False):
    with closing(connect(path)) as c:
        now=c.execute('SELECT now FROM clock').fetchone()[0]
        row=c.execute('SELECT actor,device,deadline,fresh_until,active FROM session WHERE hash=?',(sha(session),)).fetchone()
        if not row or row[1]!=device or not row[4] or now>=row[2]:return {'status':'refused'}
        active=c.execute('SELECT active FROM account WHERE id=?',(row[0],)).fetchone()[0]
        if not active:return {'status':'refused'}
        if sensitive and now>=row[3]:return {'status':'reauth_required'}
        return {'status':'allowed'}

def state(path):
    with closing(connect(path)) as c:
        return dict(sessions=c.execute('SELECT count(*) FROM session').fetchone()[0],
                    used_challenges=c.execute('SELECT count(*) FROM challenge WHERE used=1').fetchone()[0],
                    used_recovery=c.execute('SELECT count(*) FROM recovery WHERE used=1').fetchone()[0])

def exercise(n,path,traces):
    data=initialize(path)
    def auth(token,**kw):
        result=authenticate(path,token,kw.pop('password',data['password']),kw.pop('code',totp(data['seed'],300)),**kw)
        # Tokens et secrets ne sont jamais écrits dans les preuves.
        traces.append({'authentication_status':result['status'],'state':state(path)});return result
    if n==1:
        seed=b'12345678901234567890'
        vectors=[(59,'94287082'),(1111111109,'07081804'),(1111111111,'14050471'),(1234567890,'89005924'),(2000000000,'69279037'),(20000000000,'65353130')]
        assert all(totp(seed,t,8)==expected for t,expected in vectors)
        traces.append({'RFC6238_SHA1_vectors_passed':6})
    elif n==2:
        token=challenge(path)
        assert auth(token,code='')=={'status':'refused'}
        assert auth(token,password='wrong')=={'status':'refused'}
        result=auth(token);assert result['status']=='authenticated'
        assert consult(path,result['session'],sensitive=True)=={'status':'allowed'}
    elif n==3:
        result=auth(challenge(path));assert result['status']=='authenticated'
        assert auth(challenge(path))=={'status':'refused'} # même compteur malgré autre challenge
        assert state(path)['sessions']==1
    elif n==4:
        token=challenge(path)
        assert auth(token,device='E')=={'status':'refused'}
        assert auth(token,actor='B')=={'status':'refused'}
        result=auth(token);assert result['status']=='authenticated'
        assert consult(path,result['session'],device='E')=={'status':'refused'}
    elif n==5:
        token=challenge(path)
        with closing(connect(path)) as c:c.execute('UPDATE clock SET now=360')
        assert auth(token,code=totp(data['seed'],360))=={'status':'refused'}
    elif n==6:
        tokens=[challenge(path),challenge(path)]
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(lambda token:authenticate(path,token,data['password'],data['recovery'],recover=True),tokens))
        assert sorted(r['status'] for r in results)==['authenticated','refused']
        result=next(r for r in results if r['status']=='authenticated')
        assert consult(path,result['session'],sensitive=True)=={'status':'reauth_required'}
        traces.append({'recovery_results':sorted(r['status'] for r in results),'state':state(path)})
    else:
        result=auth(challenge(path));session=result['session']
        with closing(connect(path)) as c:c.execute('UPDATE clock SET now=360')
        assert consult(path,session,sensitive=True)=={'status':'reauth_required'}
        assert consult(path,session)=={'status':'allowed'}
        with closing(connect(path)) as c:c.execute('UPDATE session SET active=0')
        assert consult(path,session)=={'status':'refused'}
        traces.append({'freshness_expired':True,'revoked_session_refused':True})
    return state(path)

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    labels=['Six vecteurs TOTP SHA1 RFC6238, y compris après 2038','Mot de passe et TOTP requis avant session',
            'Compteur TOTP déjà utilisé refusé sur nouveau challenge','Challenge et session liés compte/appareil',
            'Challenge expiré à égalité : refus','Code recovery concurrent : usage unique et contexte restreint',
            'Fraîcheur sensible expirée et session révoquée : refus/re-auth']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt06-b-') as temp:
            for n,label in enumerate(labels,1):
                traces=[]
                try:
                    after=exercise(n,Path(temp)/f'{n}.sqlite',traces)
                    cases.append(dict(id=f'PT06-B{n:02d}',label=label,status='PASS',after=after,traces=traces))
                except Exception as exc:cases.append(dict(id=f'PT06-B{n:02d}',label=label,status='FAIL',error=repr(exc),traces=traces))
    except Exception as exc:fatal=repr(exc)
    sources=[HERE/'run_b.py',HERE/'PROTOCOL.md']
    d=dict(prototype='PT06',lot='B',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
           verdict='PARTIEL_PRIMITIVES_IDENTITE' if len(cases)==7 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
           PT06_clos=False,IdP_production_qualifie=False,
           metadata=dict(os=platform.platform(),temporary_files_removed=not fatal,cloud_cost_euros=0),
           parameters=dict(PBKDF2_iterations=ITERATIONS,TOTP_step=30,challenge_ttl=60,sensitive_freshness=60,session_ttl=300),
           limits=['Temps injecté et secrets générés par le banc, pas authenticator/appareil physique ni enrollment réel.',
                   'Seed TOTP en clair dans DB temporaire, magasin de secrets/rotation/récupération non qualifiés.',
                   'Paramètres de fixture, pas politique de mot de passe/MFA ratifiée ni calibration KDF.',
                   'Pas TLS, HTTP, phishing-resistance, anti-bruteforce/rate-limit, CSRF ou workflow opérateur.',
                   'Compteurs/codes single-use durables localement, pas preuve après restauration/PRA.'],
           sources_officielles=['https://www.rfc-editor.org/rfc/rfc6238','https://docs.python.org/3/library/hashlib.html'],
           sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sources})
    OUT.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=d['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(d['verdict']=='FAIL')

if __name__=='__main__':main()
