"""Rapport des primitives PT06 B, sans qualifier un IdP réel."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT06_LOT_B.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_PRIMITIVES_IDENTITE','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT06-B{n:02d}' for n in range(1,8)],'inventaire')
    check(not d['PT06_clos'] and not d['IdP_production_qualifie'] and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        if n==1:check(c['traces'][0]['RFC6238_SHA1_vectors_passed']==6,'vecteurs manquants')
        if n==3:check(c['after']['sessions']==1 and c['traces'][-1]['authentication_status']=='refused','OTP rejoué')
        if n==5:check(c['after']['sessions']==0,'challenge expiré accepté')
        if n==6:check(c['after']['used_recovery']==1 and c['after']['sessions']==1 and c['traces'][0]['recovery_results']==['authenticated','refused'],'recovery dupliqué')
        if n==7:check(c['traces'][-1]['freshness_expired'] and c['traces'][-1]['revoked_session_refused'],'réauth/révocation absentes')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT06_LOT_B.md'
    lines=['# PT06 — Lot B : primitives identité et MFA','',
           '**14 octobre 2026 — sept essais réussis ; PT06 non clos, IdP de production non qualifié.**','',
           'Primitives réellement exécutées : PBKDF2-HMAC-SHA256 avec sel aléatoire, vérification par compare_digest ; TOTP HMAC-SHA1 et troncature dynamique ; challenges et sessions aléatoires dont seules les empreintes sont stockées ; consommation atomique SQLite des challenges/compteurs/codes de récupération. Secrets et tokens non écrits dans les preuves.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Les six vecteurs SHA1 à huit chiffres sont vérifiés contre [RFC 6238, annexe B](https://www.rfc-editor.org/rfc/rfc6238#appendix-B). Le chemin de connexion utilise six chiffres et un pas de 30 secondes, temps injecté ; même compteur accepté une seule fois par compte, même avec un nouveau challenge. Un mot de passe correct seul ou un TOTP correct avec mauvais mot de passe ne crée pas de session.','',
              'Deux threads avec connexions SQLite distinctes tentent le même code de récupération ; un seul réussit, la consommation et la session sont commises ensemble. Ce contexte de récupération n’accorde pas une fraîcheur MFA pour action sensible. Challenge/session liés compte et appareil, expiration stricte et révocation contrôlées. Les durées/200000 itérations sont des paramètres du banc, pas une politique ratifiée. PBKDF2 utilise [hashlib](https://docs.python.org/3/library/hashlib.html#hashlib.pbkdf2_hmac).','',
              'Ce lot atteste des primitives et états de contrôle, pas un service MFA complet. Le générateur/prover et le vérificateur sont sur le même poste de test ; aucune possession d’un second appareil physique n’est démontrée. Seed TOTP en clair dans la base temporaire : protection des facteurs/enrollment/rotation/récupération à qualifier. Temps fiable, fenêtre de dérive, calibration KDF, politique de mots de passe et procédures humaines non livrés.','',
              'Pas montage HTTP avec A, TLS, rate-limit/anti-bruteforce, CSRF, résistance au phishing, récupération après PRA des compteurs/codes ou biométrie. TOTP n’a pas été remplacé par un booléen de fixture, mais ses tests ne qualifient pas le système d’identité de production.','',
              'Total PT06 : 15 essais A/B. [Résultats](RESULTATS_PT06_LOT_B.json), [banc](../../../spec/prototypes/pt06/README.md). Coût cloud nul. Lots C–F et réserves antérieures ouverts.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT06',lot='B',PT06_clos=False,IdP_production_qualifie=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT06_LOT_B.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='B',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
