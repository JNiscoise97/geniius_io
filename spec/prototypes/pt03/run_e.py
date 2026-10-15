"""PT03 E : DPAPI utilisateur Windows réel, enregistrements synthétiques."""
import argparse
import ctypes
from ctypes import wintypes
import hashlib
import json
import os
import platform
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT03_LOT_E.json'

class Blob(ctypes.Structure):
    _fields_=[('size',wintypes.DWORD),('data',ctypes.POINTER(ctypes.c_ubyte))]

def transform(value,context,protect):
    if os.name!='nt':raise RuntimeError('Banc réservé à Windows')
    crypt=ctypes.WinDLL('crypt32',use_last_error=True)
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.LocalFree.argtypes=[ctypes.c_void_p];kernel.LocalFree.restype=ctypes.c_void_p
    input_buffer=ctypes.create_string_buffer(value)
    entropy_buffer=ctypes.create_string_buffer(context.encode('utf-8'))
    inp=Blob(len(value),ctypes.cast(input_buffer,ctypes.POINTER(ctypes.c_ubyte)))
    entropy=Blob(len(context.encode('utf-8')),ctypes.cast(entropy_buffer,ctypes.POINTER(ctypes.c_ubyte)))
    out=Blob()
    if protect:
        fn=crypt.CryptProtectData
        fn.argtypes=[ctypes.POINTER(Blob),wintypes.LPCWSTR,ctypes.POINTER(Blob),ctypes.c_void_p,ctypes.c_void_p,wintypes.DWORD,ctypes.POINTER(Blob)]
        second='GENIIUS PT03 synthetic'
    else:
        fn=crypt.CryptUnprotectData
        fn.argtypes=[ctypes.POINTER(Blob),ctypes.c_void_p,ctypes.POINTER(Blob),ctypes.c_void_p,ctypes.c_void_p,wintypes.DWORD,ctypes.POINTER(Blob)]
        second=None
    fn.restype=wintypes.BOOL
    # UI_FORBIDDEN=1 ; LOCAL_MACHINE n'est jamais utilisé.
    if not fn(ctypes.byref(inp),second,ctypes.byref(entropy),None,None,1,ctypes.byref(out)):
        raise OSError(ctypes.get_last_error(),'DPAPI operation refused')
    try:return ctypes.string_at(out.data,out.size)
    finally:kernel.LocalFree(ctypes.cast(out.data,ctypes.c_void_p))

def decode(path,context):
    try:
        data=transform(Path(path).read_bytes(),context,False)
        return dict(ok=True,payload_sha256=hashlib.sha256(data).hexdigest())
    except OSError as exc:return dict(ok=False,error_code=exc.errno)

def subprocess_decode(path,context):
    r=subprocess.run([sys.executable,str(HERE/'run_e.py'),'--decode',str(path),'--context',context],
                     capture_output=True,text=True,encoding='utf-8',timeout=20)
    assert r.returncode==0,r.stderr
    return json.loads(r.stdout)

def main():
    started=datetime.now(timezone.utc).isoformat();cases=[];fatal=None
    context='account-A/device-D/journal/v1'
    original=b'SYNTHETIC_PRIVATE_AUTHOR_DELTA_PT03_E'
    journal_hash=hashlib.sha256(original).hexdigest()
    labels=['DPAPI utilisateur : chiffrement et lecture dans un nouveau processus',
            'Deux protections du même contenu produisent des blobs distincts',
            'Blob corrompu : refus de déchiffrement',
            'Contexte différent : refus avec entropie attendue différente',
            'Blob tronqué : refus de déchiffrement',
            'Suppression de réplique chiffrée sans perte du journal chiffré',
            'Ancien blob valide rejoué : contre-exemple à la fraîcheur par DPAPI seule']
    try:
        with tempfile.TemporaryDirectory(prefix='geniius-pt03-e-') as temp:
            folder=Path(temp)
            for n,label in enumerate(labels,1):
                try:
                    path=folder/f'journal-{n}.bin'
                    protected=transform(original,context,True);path.write_bytes(protected)
                    assert original not in protected
                    evidence={'plaintext_marker_absent':True,'ciphertext_bytes':len(protected)}
                    if n==1:
                        result=subprocess_decode(path,context)
                        assert result=={'ok':True,'payload_sha256':journal_hash}
                        evidence['new_process_result']=result
                    elif n==2:
                        second=transform(original,context,True)
                        assert protected!=second
                        assert transform(second,context,False)==original
                        evidence['distinct_blobs']=True
                    elif n==3:
                        broken=bytearray(protected);broken[-1]^=1;path.write_bytes(broken)
                        result=subprocess_decode(path,context);assert not result['ok'];evidence['refusal']=result
                    elif n==4:
                        result=subprocess_decode(path,'account-B/device-D/journal/v1')
                        assert not result['ok'];evidence['refusal']=result
                    elif n==5:
                        path.write_bytes(protected[:len(protected)//2])
                        result=subprocess_decode(path,context);assert not result['ok'];evidence['refusal']=result
                    elif n==6:
                        replica=folder/'replica.bin'
                        replica.write_bytes(transform(b'SYNTHETIC_CANONICAL_REPLICA','account-A/device-D/replica/v1',True))
                        replica.unlink()
                        assert subprocess_decode(path,context)=={'ok':True,'payload_sha256':journal_hash}
                        evidence['replica_removed_journal_recoverable']=True
                    else:
                        old=protected
                        path.write_bytes(transform(b'SYNTHETIC_NEWER_DELTA',context,True))
                        path.write_bytes(old)
                        result=subprocess_decode(path,context)
                        assert result=={'ok':True,'payload_sha256':journal_hash}
                        evidence.update(old_valid_blob_accepted=True,constat='DPAPI_NE_PROUVE_PAS_LA_FRAICHEUR')
                    cases.append(dict(id=f'PT03-E{n:02d}',label=label,status='PASS',evidence=evidence))
                except Exception as exc:cases.append(dict(id=f'PT03-E{n:02d}',label=label,status='FAIL',error=repr(exc)))
    except Exception as exc:fatal=repr(exc)
    source=HERE/'run_e.py'
    data=dict(prototype='PT03',lot='E',started_utc=started,ended_utc=datetime.now(timezone.utc).isoformat(),cases=cases,fatal=fatal,
              verdict='PARTIEL_DPAPI_WINDOWS' if len(cases)==7 and all(c['status']=='PASS' for c in cases) and not fatal else 'FAIL',
              chiffrement_execute=True,DPAPI_utilisateur=True,autre_compte_OS_test=False,horloge_OS_qualifiee=False,
              anti_rollback_demontre=False,PT03_clos=False,
              metadata=dict(os=platform.platform(),python=sys.version,flags=1,scope='CurrentUser',temporary_files_removed=not fatal,cloud_cost_euros=0),
              limits=['DPAPI sur petits enregistrements, pas chiffrement complet des bases SQLite précédentes.',
                      'Autre contexte applicatif testé par entropie, pas autre compte Windows réel.',
                      'Même utilisateur Windows peut appeler DPAPI ; pas isolation entre processus de cet utilisateur.',
                      'Ancien blob valide accepté : aucun anti-rollback, aucune fraîcheur ni révocation cryptographique.',
                      'Pas de magasin de clés multiplateforme, veille/hibernation, TPM ou redémarrage OS testés.',
                      'Profil/clé maître gérés par Windows, récupération ou migration du profil non éprouvée.'],
              sources_officielles=['https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptprotectdata',
                                    'https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptunprotectdata'],
              sha256_sources={source.relative_to(ROOT).as_posix():hashlib.sha256(source.read_bytes()).hexdigest()})
    OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(verdict=data['verdict'],passed=sum(c['status']=='PASS' for c in cases),fatal=fatal)))
    raise SystemExit(data['verdict']=='FAIL')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--decode');p.add_argument('--context');a=p.parse_args()
    if a.decode:print(json.dumps(decode(a.decode,a.context)))
    else:main()
