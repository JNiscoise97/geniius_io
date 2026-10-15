"""Consolidation fidèle des preuves A–F ; ne décide pas la clôture."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    errors=[];files=[];summary=[]
    lots=[('A','RESULTATS_PROTOTYPE_PT04.json','PREUVES_PROTOTYPE_PT04.json',8)]
    lots += [(x,f'RESULTATS_PT04_LOT_{x}.json',f'PREUVES_PT04_LOT_{x}.json',n) for x,n in [('B',6),('C',7),('D',6),('E',6),('F',4)]]
    def check(ok,label):
        if not ok:errors.append(label)
    for lot,raw,proof,count in lots:
        path=DIR/raw;data=json.loads(path.read_text(encoding='utf-8'));files.append(path)
        check(data['fatal'] is None and len(data['cases'])==count and all(c['status']=='PASS' for c in data['cases']),lot+' incomplet')
        check(not data['PT04_clos'] and data['metadata']['temporary_files_removed'],lot+' statut/nettoyage')
        check([c['id'] for c in data['cases']]==[f'PT04-{lot}{n:02d}' for n in range(1,count+1)],lot+' inventaire')
        for name,h in data['sha256_sources'].items():
            check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name);files.append(ROOT/name)
        pp=DIR/proof;files.append(pp);p=json.loads(pp.read_text(encoding='utf-8'))
        check(not p['PT04_clos'],lot+' clôture abusive')
        for name,h in p['sha256'].items():
            check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name);files.append(ROOT/name)
        if lot=='D':check(not data['effacement_forensique_demontre'],'forensic inventé')
        if lot=='E':check(not data['escrow_secret_qualifie'],'escrow inventé')
        if lot=='F':check(not data['RPO_RTO_qualifies'] and not data['NF05_qualifie'],'NF05 inventé')
        summary.append(dict(lot=lot,essais=count,verdict=data['verdict']))
    decision_path=DIR/'DECISION_CLOTURE_PT04.json'
    decision=json.loads(decision_path.read_text(encoding='utf-8'))
    check(decision['PT04_clos_perimetre_reduit'] and not decision['NF05_qualifie'] and not decision['architecture_gelee'],'portée de clôture abusive')
    check(decision['accord_porteur']=='poursuis' and decision['criteres_retenus']==[f'C{n}' for n in range(1,9)],'décision non rattachée aux critères')
    check(decision['reserves_maintenues']==[f'PT04-R{n:02d}' for n in range(1,6)],'réserves perdues')
    for name,h in decision['sha256_preuves'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve de clôture modifiée '+name)
    files += [ROOT/'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT04_CRITERES_CLOTURE.md',Path(__file__).resolve(),decision_path]
    result=dict(prototype='PT04',essais=37,lots=summary,PT04_clos=True,PT04_clos_perimetre_reduit=True,NF05_qualifie=False,architecture_gelee=False,
                reserves=[f'PT04-R{n:02d}' for n in range(1,6)],PR_non_executes_dans_montage=['PR03','PR04','PR09','PR11'],erreurs=errors,
                sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(set(files))})
    (DIR/'CONTROLES_PT04_CONSOLIDES.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k!='sha256'},ensure_ascii=False))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
