"""Rapport et vérification PT03 F."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT03_LOT_F.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_LOT_F','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT03-F{n:02d}' for n in range(1,9)],'inventaire')
    check(d['SQL_execute'] and not any(d[k] for k in ('HTTP_execute','chiffrement_execute','PT03_clos')),'portée abusive')
    check(d['metadata']['temporary_files_removed'],'nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(c['before']['journal']==c['after']['journal'],'journal altéré')
        check(c['before']['effects']==c['after']['effects'],'double effet après restauration')
        if n<=3:check(c['after']['replica']==[['keep','allowed current']] and c['after']['cursor']==2,'purge/reconstruction incomplète')
        else:check(len(c['after']['chunks'])==3 and len(c['after']['originals'])==1,'transfert non finalisé ou dupliqué')
        for t in c['traces']:
            if t['output'].get('status') in ('incomplete','integrity_refused'):
                check(not t['durable_after']['originals'],'original exposé sans intégrité')
            if t['action']=='integrate':check(t['output']=={'status':'already_integrated'},'reçu ancien perdu')
        if n==2:
            first=c['traces'][0]
            check(first['exit_code']==73 and not first['durable_after']['consultable'],'barrière après panne absente')
        if n in (4,5):check(c['traces'][0]['exit_code']==73 and len(c['traces'][0]['durable_after']['chunks'])==(0 if n==4 else 1),'frontière commit chunk')
        if n==8:check(c['traces'][0]['output']=={'status':'network_deferred'} and not c['traces'][0]['durable_after']['chunks'],'politique réseau contournée')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT03_LOT_F.md'
    lines=['# PT03 — Lot F : reconstruction et reprise binaire','',
           '**Huit scénarios réussis ; PT03 partiel, non clos.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS : {d['metadata']['os']}.",'',
           'Transactions SQLite WAL/FULL dans des processus distincts ; snapshots SQLite réellement sauvegardés/restaurés. Barrière locale fermée durablement avant reconstruction, purge serveur réappliquée depuis un registre extérieur puis publication atomique de la réplique et du curseur. Journal propre conservé ; reçu durable extérieur évite un nouvel effet au rejeu.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Le banc ordonne explicitement une reconstruction depuis un curseur synthétique ancien ; il ne qualifie ni délai de rétention ni détection d’expiration de curseur signé. F03 restaure le serveur avant la purge mais conserve le registre de purge/reçus extérieur. Restaurer également ce registre n’est pas couvert : protection et restauration de l’autorité persistante relèvent de PT04. Droits et génération sont réduits aux fixtures, aucune orchestration distribuée complète n’est revendiquée.','',
              'Trois chunks synthétiques sont validés individuellement et stockés durablement avant accusé. Un rejeu ne duplique pas un chunk. L’original n’est publié qu’après présence de tous les chunks, validation de leurs empreintes et validation de l’empreinte globale. Pannes os._exit avant/après commit, reprise dans un nouveau processus ; corruption et manifeste global incohérent refusés.','',
              'Manifeste supposé fiable, authenticité non éprouvée. Réseau autorisé/inadmissible injecté, pas détection OS. Données minuscules stockées en BLOB SQLite, pas stockage objet, gros fichiers, débit ou reprise HTTP qualifiés. Pas de chiffrement dans ce lot ni qualification de coupure électrique.','',
              'Total : 47 essais A–F, incluant E07 comme contre-épreuve de fraîcheur. Tous les lots ont un périmètre exécuté, mais la qualification globale reste partielle : montage entre lots, chiffrement complet, identité/canal, horloge OS, magasin de clés multiplateforme et restauration du registre réservés. SYN-01–07 restent ouverts ; PT03 non clos.','',
              '[Résultats et traces](RESULTATS_PT03_LOT_F.json), [banc](../../../spec/prototypes/pt03/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT03',lot='F',PT03_clos=False,sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT03_LOT_F.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='F',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
