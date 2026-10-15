"""Consolidation A–E sans décision de clôture."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    errors=[];files=[];summary=[]
    lots=[('A','RESULTATS_PROTOTYPE_PT05.json','PREUVES_PROTOTYPE_PT05.json',9)]
    lots += [(x,f'RESULTATS_PT05_LOT_{x}.json',f'PREUVES_PT05_LOT_{x}.json',n) for x,n in [('B',6),('C',6),('D',6),('E',7)]]
    def check(ok,label):
        if not ok:errors.append(label)
    for lot,raw,proof,count in lots:
        path=DIR/raw;data=json.loads(path.read_text(encoding='utf-8'));files.append(path)
        check(data['fatal'] is None and len(data['cases'])==count and all(c['status']=='PASS' for c in data['cases']),lot+' incomplet')
        check(not data['PT05_clos'] and data['metadata']['temporary_files_removed'],lot+' statut/nettoyage')
        check([c['id'] for c in data['cases']]==[f'PT05-{lot}{n:02d}' for n in range(1,count+1)],lot+' inventaire')
        for name,h in data['sha256_sources'].items():
            check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name);files.append(ROOT/name)
        pp=DIR/proof;files.append(pp);p=json.loads(pp.read_text(encoding='utf-8'))
        check(not p['PT05_clos'],lot+' clôture abusive')
        for name,h in p['sha256'].items():
            check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name);files.append(ROOT/name)
        if lot=='C':check(not data['prestataire_reel_qualifie'],'prestataire qualifié abusivement')
        if lot=='E':
            check(not any(data[k] for k in ('MPD04_fixe','capacite_production_qualifiee','budget_mensuel_estime')),'qualification de capacité abusive')
            check(sum(len(c.get('samples',[])) for c in data['cases'])==30,'mesures manquantes')
        summary.append(dict(lot=lot,cas=count,verdict=data['verdict']))
    decision_path=DIR/'DECISION_CLOTURE_PT05.json';decision=json.loads(decision_path.read_text(encoding='utf-8'))
    check(decision['PT05_clos_perimetre_reduit'] and not decision['capacite_production_qualifiee'] and not decision['MPD04_fixe'],'portée de clôture abusive')
    check(decision['accord_porteur']=='poursuis' and decision['criteres_retenus']==[f'C{n}' for n in range(1,9)],'décision non rattachée aux critères')
    check(decision['reserves_maintenues']==[f'PT05-R{n:02d}' for n in range(1,6)],'réserves perdues')
    for name,h in decision['sha256_preuves'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve de clôture modifiée '+name)
    files += [ROOT/'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT05_CRITERES_CLOTURE.md',Path(__file__).resolve(),decision_path]
    result=dict(prototype='PT05',cas=34,lots=summary,PT05_clos=True,PT05_clos_perimetre_reduit=True,MPD04_fixe=False,capacite_production_qualifiee=False,
                architecture_gelee=False,reserves=[f'PT05-R{n:02d}' for n in range(1,6)],erreurs=errors,
                sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(set(files))})
    (DIR/'CONTROLES_PT05_CONSOLIDES.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k!='sha256'},ensure_ascii=False))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
