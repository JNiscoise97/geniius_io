"""Consolidation PT06 et bilan de portée des six prototypes, sans clôture automatique."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    errors=[];files=[];summary=[]
    def check(ok,label):
        if not ok:errors.append(label)
    lots=[('A','RESULTATS_PROTOTYPE_PT06.json','PREUVES_PROTOTYPE_PT06.json',8)]
    lots += [(x,f'RESULTATS_PT06_LOT_{x}.json',f'PREUVES_PT06_LOT_{x}.json',n) for x,n in [('B',7),('C',7),('D',6),('E',6)]]
    for lot,raw,proof,count in lots:
        path=DIR/raw;d=json.loads(path.read_text(encoding='utf-8'));files.append(path)
        check(d['fatal'] is None and len(d['cases'])==count and all(c['status']=='PASS' for c in d['cases']),lot+' incomplet')
        check(not d['PT06_clos'] and d['metadata']['temporary_files_removed'],lot+' portée/nettoyage')
        check([c['id'] for c in d['cases']]==[f'PT06-{lot}{n:02d}' for n in range(1,count+1)],lot+' inventaire')
        for name,h in d['sha256_sources'].items():
            check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name);files.append(ROOT/name)
        pp=DIR/proof;p=json.loads(pp.read_text(encoding='utf-8'));files.append(pp)
        for name,h in p['sha256'].items():
            check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name);files.append(ROOT/name)
        if lot=='B':check(not d['IdP_production_qualifie'],'IdP qualifié abusivement')
        if lot=='D':check(not d['lecteur_ecran_test'] and not d['WCAG_conformite_globale'] and d['browser_closed'],'accessibilité surqualifiée/nettoyage navigateur')
        summary.append(dict(lot=lot,essais=count,verdict=d['verdict']))
    fpath=DIR/'CONTROLES_PT06_LOT_F.json';f=json.loads(fpath.read_text(encoding='utf-8'));files.append(fpath)
    check(not f['erreurs'] and not f['essais_infrastructure_executés'] and not f['budget_production_valide'] and not f['pile_ratifiee'],'F surqualifié ou incomplet')
    for name,h in f['sha256'].items():
        check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve F modifiée '+name);files.append(ROOT/name)
    states=[]
    paths=['PREUVES_PROTOTYPE_PT01.json','PREUVES_PROTOTYPE_PT02.json','CONTROLES_PT03_CONSOLIDES.json','CONTROLES_PT04_CONSOLIDES.json','CONTROLES_PT05_CONSOLIDES.json']
    for n,name in enumerate(paths,1):
        path=DIR/name;p=json.loads(path.read_text(encoding='utf-8'));files.append(path)
        check(p[f'PT{n:02d}_clos'],'clôture amont absente '+name)
        states.append(dict(prototype=f'PT{n:02d}',clos_perimetre_reduit=True))
    decision_path=DIR/'DECISION_CLOTURE_PT06.json';decision=json.loads(decision_path.read_text(encoding='utf-8'))
    check(decision['PT06_clos_perimetre_reduit'] and not decision['architecture_gelee'] and not decision['pile_ratifiee'],'portée de clôture abusive')
    check(decision['accord_porteur']=='ok poursuis' and decision['criteres_retenus']==[f'C{n}' for n in range(1,9)],'décision non rattachée aux critères')
    check(decision['reserves_maintenues']==[f'PT06-R{n:02d}' for n in range(1,8)],'réserves perdues')
    for name,h in decision['sha256_preuves'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve de clôture modifiée '+name)
    states.append(dict(prototype='PT06',clos_perimetre_reduit=True))
    files += [ROOT/'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT06_CRITERES_CLOTURE.md',Path(__file__).resolve(),decision_path]
    result=dict(date='2026-10-15',prototype='PT06',essais_runtime=34,lots=summary,lot_F='DOCUMENTAIRE',
                PT06_clos=True,PT06_clos_perimetre_reduit=True,pile_ratifiee=False,architecture_gelee=False,budget_production_valide=False,
                reserves=[f'PT06-R{n:02d}' for n in range(1,8)],bilan_prototypes=states,erreurs=errors,
                sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(set(files))})
    (DIR/'CONTROLES_PT06_CONSOLIDES.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k!='sha256'},ensure_ascii=False))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
