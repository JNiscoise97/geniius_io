"""Rapport et vérification PT04 B."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PT04_LOT_B.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_POLITIQUES_REPRISE','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT04-B{n:02d}' for n in range(1,7)],'inventaire')
    check(d['checkpoint_fiable_injecte'] and not d['PT04_clos'] and not d['NF05_qualifie'],'portée abusive')
    check(d['metadata']['temporary_files_removed'],'nettoyage')
    reasons={1:'effect_conflict',2:'effect_not_reconstructible',5:'authority_stale_or_corrupt'}
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        if n in reasons:
            check(c['traces'][0]['output']=={'status':'closed','reason':reasons[n]},'anomalie non signalée')
            check(not c['after']['open'] and not c['after']['visible'],'ouverture indue')
        else:
            check(c['traces'][-1]['output']=={'status':'unavailable'},'ancienne session acceptée')
            check(c['after']['epoch']>c['before']['epoch'],'époque non renouvelée')
            if n==4:check(not c['after']['visible'] and not c['after']['derived'],'fermeture globale permissive')
            else:check(c['after']['visible']==[['gone']] and all(r[0]!='keep' for r in c['after']['derived']),'restriction/index incohérents')
        if n==2:check(not c['after']['effects'],'effet inadmissible reconstruit')
        if n==6:check(c['traces'][0]['exit_code']==73 and not c['traces'][0]['durable_after']['visible'],'panne/barrière absente')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PT04_LOT_B.md'
    lines=['# PT04 — Lot B : anomalies et politiques avant reprise','',
           '**Six scénarios réussis ; PT04 partiel, non clos.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS : {d['metadata']['os']}.",'',
           'Transactions SQLite WAL/FULL et processus distincts. Checkpoint de fixture couvre intentions, purges et politiques actuelles ; une politique omise à génération identique invalide l’empreinte et refuse la reprise. Barrière fermée durablement avant toute réconciliation.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Effet contradictoire : la transaction est annulée, l’effet existant n’est pas écrasé, anomalie effect_conflict et service fermé. Effet perdu devenu inadmissible : aucun nouvel effet, anomalie effect_not_reconstructible et fermeture. Les données anciennes peuvent rester physiquement en base après rollback, mais la barrière interdit leur consultation. Aucun workflow de résolution opérateur n’est livré par ces essais.','',
              'Sans anomalie, restrictions/fermeture et retrait des index concernés sont publiés avec l’ouverture dans la même transaction applicative. Une nouvelle époque invalide l’ancienne session synthétique. Le service peut être ouvert tout en n’accordant aucune donnée après fermeture globale : open est une barrière de cohérence, pas une permission métier. Panne avant commit : anciennes données conservées sous barrière, puis reprise valide.','',
              'Politiques allow/deny et fermeture globale simplifiées, pas traduction exhaustive des actes légaux ou du contrat d’autorisation. Ordonnancement global des politiques, nouvelles protections et droits complets restent à qualifier. Checkpoint fiable injecté ; même poste et disque, aucune durabilité indépendante démontrée. Pas de transport, secrets/chiffrement, médias volumineux ou RPO/RTO représentatifs ; NF05 et PER-01–07 restent ouverts.','',
              'Total PT04 : 14 essais A/B. [Résultats](RESULTATS_PT04_LOT_B.json), [banc](../../../spec/prototypes/pt04/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT04',lot='B',PT04_clos=False,NF05_qualifie=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PT04_LOT_B.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(lot='B',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
