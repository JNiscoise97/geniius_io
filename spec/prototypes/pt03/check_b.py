"""Vérification et rapport de PT03 lot B."""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT03_LOT_B.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_LOT_B','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT03-B{n:02d}' for n in range(1,7)],'inventaire')
    check(d['SQL_execute'] and not any(d[k] for k in ('HTTP_execute','chiffrement_execute','PT03_clos')),'portée abusive')
    check(d['metadata']['temporary_files_removed'],'nettoyage incomplet')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(c['before']['journal']==c['after']['journal'],'journal altéré')
        check(not c['after']['derived'] and all(r[0]!='old' for r in c['after']['replica']),'retrait incomplet')
        check(not c['after']['effects'],'effet métier indu')
        for t in c['traces']:
            if t['action']=='stage':
                check(t['durable_after']['gate']==0,'barrière non durable')
                check(set(t['output']['batch']['removals'])<= {'old'},'retrait cible jamais délivrée')
                check(set(t['output']['batch'])=={'generation','removals'},'motif révélé')
            if t['output'].get('status')=='page_applied':
                check(not t['durable_after']['pending'] and t['durable_after']['generation']==t['output']['generation'],'ajout avant retraits durables')
        if n<=2:
            crashed=[t for t in c['traces'] if t['exit_code']==73]
            check(len(crashed)==1,'interruption absente')
            if crashed:
                state=crashed[0]['durable_after']
                check(not state['consultable'],'consultation après panne')
                check(bool(state['replica'])==(n==1) and bool(state['derived'])==(n==1),'frontière commit retraits')
        if n==5:
            denied=[t for t in c['traces'] if t['action'] in ('page','receive','integrate')]
            check(len(denied)==3 and all(t['output']=={'status':'unavailable'} for t in denied),'appareil révoqué admis')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT03_LOT_B.md'
    lines=['# PT03 — Lot B : retraits et appareil révoqué','',
           '**Six scénarios réussis ; PT03 reste partiel, non clos.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS : {d['metadata']['os']}. SQLite : {d['metadata']['sqlite']}.",'',
           'Chaque commande repart dans un nouveau processus. Fermeture du magasin consultable persistée avant application des retraits. Suppression de réplique, miniatures/index et accusé de génération dans une transaction locale ; journal privé indépendant. Interruptions os._exit avant/après commit, puis réouverture et rejeu.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Les retraits ne visent que le corpus déjà délivré et ne portent aucun motif. Un changement de génération invalide pages et retraits préparés ; une nouvelle réconciliation est exigée. Le canal de retrait peut fermer une réplique d’appareil révoqué, sans autoriser pages, réception ou intégration métier ; il est simulé, son authentification/anti-rejeu restent ouverts. Les deltas privés sont inchangés dans les six cas.','',
              'Limite de faisabilité : garde SQLite serveur conservée pendant le commit SQLite local, sans réseau. Deux bases distinctes ne forment pas une transaction distribuée ; aucun commit atomique entre serveur et client n’est revendiqué. Le registre des cibles déjà délivrées est préinitialisé ; perte de la connexion entre remise locale et publication du registre n’est pas qualifiée. Cette réserve devra être traitée par protocole de remise/accusé ou fermeture de périmètre avant SYN-07.','',
              'Pas de chiffrement, identité produit, test d’horloge, anti-rollback ou interruption électrique. SQLite est un outil de banc. SYN-01–07 restent ouverts. Lots C–F à exécuter ; [lot A](RAPPORT_PROTOTYPE_PT03.md) : huit cas passants, soit quatorze essais PT03 distincts au total.','',
              '[Résultats et traces](RESULTATS_PT03_LOT_B.json), [sources et commandes](../../../spec/prototypes/pt03/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT03',lot='B',PT03_clos=False,sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT03_LOT_B.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='B',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
