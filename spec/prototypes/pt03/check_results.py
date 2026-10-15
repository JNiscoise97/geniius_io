"""Contrôle et rapport du lot A ; ne clôture pas PT03."""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    path=DIR/'RESULTATS_PROTOTYPE_PT03.json'
    d=json.loads(path.read_text(encoding='utf-8'))
    errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_LOT_A','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT03-A{n:02d}' for n in range(1,9)],'inventaire')
    check(d['SQL_execute'] and not d['HTTP_execute'] and not d['chiffrement_execute'] and not d['PT03_clos'],'portée abusive')
    check(d['metadata']['temporary_files_removed'] and d['metadata']['cloud_cost_euros']==0,'nettoyage/coût')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','échec '+c['id'])
        if c['status']!='PASS':continue
        check(c['before']['journal']==c['after']['journal'],'journal altéré '+c['id'])
        check(c['after']['sqlite']=={'journal_mode':'wal','synchronous':2},'durabilité configurée')
        check(len(c['after']['receipts'])==(2 if n==8 else 1),'réception dupliquée')
        check(len(c['after']['effects'])==(0 if n==8 else 1),'effet dupliqué ou indu')
        if n<=4:
            crashed=[t for t in c['traces'] if t.get('exit_code')==73]
            check(len(crashed)==1 and crashed[0]['output']['phase']==crashed[0]['fault'],'crash non observé')
            states=[t['after_crash'] for t in c['traces'] if 'after_crash' in t]
            check(len(states)==1,'état après crash absent')
            if states:
                check(len(states[0]['effects'])==(1 if n==4 else 0),'atomicité après interruption')
                check(len(states[0]['receipts'])==(0 if n==1 else 1),'durabilité réception après interruption')
        if n==6:check(len(c['traces'])==8,'rejeux concurrents manquants')
        if n==7:
            check(sum(t.get('output',{}).get('status')=='unavailable' for t in c['traces'])==3,'ancien accusé/contexte non filtrés')
        if n==8:
            check([t['output']['status'] for t in c['traces']]==['received','unavailable','received','unavailable'],'oracle cible cachée/absente')
    for name,h in d['sha256_sources'].items():
        check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PROTOTYPE_PT03.md'
    lines=['# PT03 — Lot A : réception durable et rejeu','',
           '**Huit scénarios réussis ; PT03 partiel, non clos.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS : {d['metadata']['os']}. SQLite : {d['metadata']['sqlite']}.",'',
           'Journal privé et serveur synthétique dans deux fichiers distincts, WAL et synchronous FULL. Chaque commande métier est exécutée dans un nouveau processus Python. Les interruptions avant/après commit utilisent os._exit(73), sans fermeture normale de connexion. Les états sont relus par le parent puis les commandes rejouées. Quatre processus concurrents soumettent la même réception, puis la même intégration.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Les réceptions ne portent aucune FK de cible ; seules les intégrations admissibles créent un effet avec référence validée. Une origine à empreinte différente ne remplace pas le delta reçu. Le statut technique received ne confirme jamais une intégration ; le rejeu d’un résultat intégré est réévalué sous la permission courante. Le journal local de l’auteur reste identique dans les huit essais.','',
              'Le contrôle d’accès est une permission synthétique, les identités des paramètres de banc. Aucune authentification ni socket HTTP, aucun moteur complet d’autorisation n’est démontré. La séparation des fichiers est logique et non cryptographique.','',
              'Limites : crash de processus, pas coupure électrique ; disque matériel et système de fichiers non qualifiés. Aucun chiffrement, magasin de clés, test veille/hibernation, horloge ni anti-rollback. SQLite est un outil de banc, aucun choix de pile. Les lots B–F restent à exécuter ; SYN-01–07 restent ouverts.','',
              '[Résultats et traces](RESULTATS_PROTOTYPE_PT03.json), [protocole](../../../spec/prototypes/pt03/PROTOCOL.md). Coût cloud : 0 €.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[path,report,Path(__file__).resolve(),ROOT/'spec/prototypes/pt03/PROTOCOL.md',ROOT/'spec/prototypes/pt03/run.py']
        proof=dict(prototype='PT03',lot='A',PT03_clos=False,SQL_execute=True,HTTP_execute=False,chiffrement_execute=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        proof_path=DIR/'PREUVES_PROTOTYPE_PT03.json'
        if proof_path.exists():
            old=json.loads(proof_path.read_text(encoding='utf-8'))
            # Recontrôle de toutes les pièces courantes après génération du rapport déterministe.
            for name,h in old['sha256'].items():
                check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:proof_path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(prototype='PT03',passed=sum(c['status']=='PASS' for c in d['cases']),PT03_clos=False,errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
