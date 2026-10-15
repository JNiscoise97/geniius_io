"""Vérification et rapport PT05 A."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    raw=DIR/'RESULTATS_PROTOTYPE_PT05.json';d=json.loads(raw.read_text(encoding='utf-8'));errors=[]
    def check(ok,label):
        if not ok:errors.append(label)
    check(d['fatal'] is None and d['verdict']=='PARTIEL_OUTBOX_BAUX','campagne incomplète')
    check([c['id'] for c in d['cases']]==[f'PT05-A{n:02d}' for n in range(1,10)],'inventaire')
    check(not d['PT05_clos'] and not d['capacite_production_qualifiee'] and d['metadata']['temporary_files_removed'],'portée/nettoyage')
    for n,c in enumerate(d['cases'],1):
        check(c['status']=='PASS','cas en échec')
        if c['status']!='PASS':continue
        check(all(len(c['after'][key])==1 for key in ('business','outbox','task','delivery')),'duplication de travail')
        check(len(c['after']['effect'])==len(c['after']['receipt'])==(0 if n in (6,9) else 1),'effet indu ou dupliqué')
        if n<=4:check(any(t['exit_code']==73 for t in c['traces']),'interruption absente')
        if n==5:
            finished=[t['output']['status'] for t in c['traces'] if t['action']=='finish']
            check(finished==['refused','refused','finalized'],'fencing/échéance permissifs')
        if n==7:check(sorted(t['output']['status'] for t in c['traces'] if t['action']=='finish')==['already_finalized','finalized'],'concurrence incorrecte')
        if n==8:check(sum(t['output']['status']=='conflict' for t in c['traces'])==2,'origine réutilisée acceptée')
    for name,h in d['sha256_sources'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
    report=DIR/'RAPPORT_PROTOTYPE_PT05.md'
    lines=['# PT05 — Lot A : outbox, rejeux et baux','',
           '**14 octobre 2026 — neuf scénarios réussis ; PT05 partiel, non clos.**','',
           f"Campagne UTC : {d['started_utc']} → {d['ended_utc']}. OS : {d['metadata']['os']}. SQLite : {d['metadata']['sqlite']}.",'',
           'Commit métier/outbox dans une même transaction SQLite WAL/FULL ; file synthétique dans une autre base. Publication commise avant accusé d’outbox, consommation répétable, task/effect/receipt identifiés par origine. Commandes dans des processus distincts, os._exit aux frontières, deux processus finalisant concurremment.','',
           '| Cas | Expérience | Verdict |','|---|---|---|']
    lines += [f"| {c['id']} | {c['label']} | {c['status']} |" for c in d['cases']]
    lines += ['', 'Chaque prise de bail augmente un jeton de tentative ; finalisation contrôle atomiquement jeton, statut, échéance et autorité courante. À l’échéance exacte, ancienne tentative refusée ; reprise produit un jeton supérieur, ancienne tentative reste refusée. Effet, reçu et statut final sont commis ensemble. Le rejeu d’un résultat déjà finalisé ne crée pas un second effet. Annulation incrémente le jeton ; retrait d’autorité refuse aussi une finalisation.','',
              'Les origines sont comparées au contenu exact synthétique ; une même origine avec un contenu différent provoque conflit à publication/consommation. Aucun broker exactly-once revendiqué : la file est SQLite et la livraison répétable. La frontière annulée ne publie aucun travail ; le dispatcher retrouve l’outbox après commit ou perte de l’accusé.','',
              'Temps serveur injecté, bail de dix unités du banc ; pas durée produit ou mesure d’horloge matérielle. Autorité booléenne, pas moteur complet d’autorisations. Renouvellement, suspension, effets partiels, restauration des jetons et effets externes non qualifiés. Pas charge, quotas/équité ni capacité de production mesurés. ASY-01–07/MPD-04 restent ouverts.','',
              '[Résultats et traces](RESULTATS_PROTOTYPE_PT05.json), [banc](../../../spec/prototypes/pt05/README.md). Coût cloud nul.','']
    if not errors:
        report.write_text('\n'.join(lines),encoding='utf-8')
        files=[raw,report,Path(__file__).resolve()]+[ROOT/name for name in d['sha256_sources']]
        proof=dict(prototype='PT05',lot='A',PT05_clos=False,
                   sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files})
        path=DIR/'PREUVES_PROTOTYPE_PT05.json'
        if path.exists():
            old=json.loads(path.read_text(encoding='utf-8'))
            for name,h in old['sha256'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
        if not errors:path.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(prototype='PT05',passed=sum(c['status']=='PASS' for c in d['cases']),errors=errors)))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
