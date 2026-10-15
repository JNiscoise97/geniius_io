"""Rapport et vérification de DPAPI Windows, sans qualification anti-rollback."""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT03_LOT_E.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_DPAPI_WINDOWS','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT03-E{n:02d}' for n in range(1,8)],'inventaire')
    check(d['chiffrement_execute'] and d['DPAPI_utilisateur'] and not any(d[k] for k in ('autre_compte_OS_test','horloge_OS_qualifiee','anti_rollback_demontre','PT03_clos')),'portée abusive')
    check(d['metadata']['flags']==1 and d['metadata']['scope']=='CurrentUser','scope DPAPI')
    check(d['metadata']['temporary_files_removed'],'nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        e=c['evidence'];check(e['plaintext_marker_absent'] and e['ciphertext_bytes']>0,'chiffrement non enregistré')
        if n in (3,4,5):check(not e['refusal']['ok'],'corruption/contexte accepté')
        if n==7:check(e['old_valid_blob_accepted'] and e['constat']=='DPAPI_NE_PROUVE_PAS_LA_FRAICHEUR','contre-exemple rollback perdu')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT03_LOT_E.md'
    lines=['# PT03 — Lot E : chiffrement natif Windows','',
           '**Sept essais réussis, dont une contre-épreuve de fraîcheur ; PT03 non clos.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS : {d['metadata']['os']}.",'',
           'Appels réels CryptProtectData/CryptUnprotectData via ctypes, portée utilisateur (aucun flag LOCAL_MACHINE), interface interdite et allocation Windows libérée par LocalFree. Windows gère les clés ; aucun fichier de clé applicative en clair n’est créé. Les fichiers ne contiennent que des blobs protégés synthétiques. Lecture dans des processus Python distincts.','',
           '| Cas | Expérience | Verdict du banc |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'E07 est PASS parce que l’attendu est de constater la limite : restauration d’un ancien blob valide, acceptation et déchiffrement. **Ce n’est pas un succès anti-rollback.** Chiffrement et intégrité ne prouvent ni fraîcheur, ni échéance, ni retrait. L’ancrage temporel et la barrière du lot D restent nécessaires ; le montage complet D+E n’est pas encore éprouvé.','',
              'Le premier essai sous compte sandbox échouait avant chiffrement avec erreur Windows 2 ; [résultats conservés](historique/RESULTATS_PT03_LOT_E_SANDBOX_DPAPI_INDISPONIBLE.json). Le banc a ensuite été exécuté dans le profil Windows courant sur fichiers temporaires synthétiques, sans installation ou modification de configuration.','',
              'Autre contexte applicatif essayé par entropie différente : ce n’est pas une preuve d’isolation entre comptes Windows. Un processus du même utilisateur disposant du contexte peut appeler DPAPI. Aucun essai sous un deuxième compte OS, autre machine ou profil itinérant ; aucune récupération/migration du profil ou perte de clé éprouvée.','',
              'Petits enregistrements seulement : les bases SQLite des lots A–D ne sont pas devenues chiffrées. Pas de chiffrement global de base, rotation de clés, TPM, magasin multiplateforme, veille/hibernation ou redémarrage OS qualifiés. Les blobs corrompus choisis sont refusés ; ces essais ne constituent pas un audit exhaustif des entrées ou une preuve universelle d’intégrité.','',
              'Références primaires : [CryptProtectData](https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptprotectdata) précise la portée utilisateur, les flags et la gestion mémoire ; [CryptUnprotectData](https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptunprotectdata) décrit le contrôle d’intégrité et les limites des erreurs de corruption.','',
              'Total : 39 essais distincts A–E, incluant E07 comme contre-épreuve documentée. Lot F non exécuté ; qualifications E restantes et SYN-01–07 ouverts. Coût cloud nul. [Résultats](RESULTATS_PT03_LOT_E.json), [banc](../../../spec/prototypes/pt03/README.md).','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        history=DIR/'historique/RESULTATS_PT03_LOT_E_SANDBOX_DPAPI_INDISPONIBLE.json'
        files=[raw,report,Path(__file__).resolve(),history]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT03',lot='E',PT03_clos=False,anti_rollback_demontre=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT03_LOT_E.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='E',passed=sum(c['status']=='PASS' for c in d['cases']),anti_rollback_demontre=False,errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
