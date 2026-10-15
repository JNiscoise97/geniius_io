"""Contrôle PT04 E : sauvegarde protégée, sans qualification d'escrow/PRA."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT04_LOT_E.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_SAUVEGARDE_PROTEGEE','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT04-E{n:02d}' for n in range(1,7)],'inventaire')
    check(not any(d[k] for k in ('PT04_clos','NF05_qualifie','escrow_secret_qualifie')) and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(c['after']['supervisor_open'] and c['after']['media_present'] and c['after']['application']['open'],'reprise incomplète')
        first=c['traces'][0]
        check(not first['durable_after']['supervisor_open'],'porte ouverte avant récupération')
        if n==5:check(first['exit_code']==73 and not first['durable_after']['media_present'],'panne non observée')
        else:check(first['output']['status']=='closed','secret/backup/manifeste non vérifié')
        if n==6:check(any(t.get('old_archive_still_decryptable') for t in c['traces']),'limite anciennes archives perdue')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT04_LOT_E.md'
    lines=['# PT04 — Lot E : sauvegarde protégée et récupération','',
           '**14 octobre 2026 — six essais réussis ; PT04 non clos ; escrow et NF05 non qualifiés.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS : {d['metadata']['os']}.",'',
           'Archive contenant un snapshot SQLite et un média synthétique, protégée par DPAPI utilisateur Windows avec entropie secrète aléatoire de 256 bits. Les processus de reprise reçoivent le secret par stdin ; aucun secret dans argv, fichier de clés ou preuve. Le parent garde le secret en mémoire : cette séparation n’est pas un magasin de récupération indépendant.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'La porte du superviseur est fermée avant lecture de sauvegarde. Le secret, le format et les empreintes du manifeste extérieur sont vérifiés avant publication ; SQLite quick_check est exécuté. Base et média restaurés séparément, puis mécanisme d’autorité du lot A réellement invoqué avant ouverture du superviseur. Une panne après restauration de la base laisse la porte extérieure fermée ; le rejeu termine le média et la réconciliation.','',
              'E06 reprotège la même archive sous un nouveau secret : l’ancien secret échoue sur la nouvelle archive ; l’ancienne archive reste réellement déchiffrable avec l’ancien secret. Aucune révocation globale, rotation de clés de production ou effacement cryptographique prouvé.','',
              'Profil Windows courant, pas autre machine/profil ni récupération après perte des clés du profil. La possession du secret injecté et du profil actuel suffit dans ce banc ; pas de procédure d’approbation, escrow, HSM ou authentification opérateur implémentés. Manifeste et checkpoint actuels sont fiables par fixture. Staging SQLite/media en clair durant reprise, pas d’effacement forensique mémoire/disque.','',
              'Portée documentaire : [CryptProtectData](https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptprotectdata) décrit la portée utilisateur et l’entropie optionnelle ; [CryptUnprotectData](https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptunprotectdata) exige l’entropie correspondante. Ces primitives ne remplacent pas une stratégie de récupération indépendante du profil.','',
              'Total PT04 : 33 essais A–E. RPO/RTO représentatifs, indépendance de l’autorité, stockage final et PER-01–07 restent ouverts. [Résultats](RESULTATS_PT04_LOT_E.json), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT04',lot='E',PT04_clos=False,escrow_secret_qualifie=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT04_LOT_E.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='E',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
