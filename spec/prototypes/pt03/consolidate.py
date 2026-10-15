"""Vérifie A–G et génère une synthèse, sans décider la clôture."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    errors=[];files=[];summary=[]
    lots=[('A','RESULTATS_PROTOTYPE_PT03.json','PREUVES_PROTOTYPE_PT03.json',8)]
    lots += [(x,f'RESULTATS_PT03_LOT_{x}.json',f'PREUVES_PT03_LOT_{x}.json',n) for x,n in [('B',6),('C',7),('D',11),('E',7),('F',8)]]
    lots += [('G','RESULTATS_PT03_ARTICULATION.json',None,5)]
    def check(ok,label):
        if not ok:errors.append(label)
    for lot,raw,proof,count in lots:
        path=DIR/raw;data=json.loads(path.read_text(encoding='utf-8'));files.append(path)
        check(data['fatal'] is None and len(data['cases'])==count and all(c['status']=='PASS' for c in data['cases']),lot+' incomplet')
        check(not data['PT03_clos'] and data['metadata']['temporary_files_removed'],lot+' statut/nettoyage')
        check([c['id'] for c in data['cases']]==[f'PT03-{lot}{n:02d}' for n in range(1,count+1)],lot+' inventaire')
        for name,h in data['sha256_sources'].items():
            check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'source modifiée '+name)
            files.append(ROOT/name)
        if proof:
            pp=DIR/proof;files.append(pp);p=json.loads(pp.read_text(encoding='utf-8'))
            check(not p['PT03_clos'],lot+' clôture abusive')
            for name,h in p['sha256'].items():
                check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve modifiée '+name)
                files.append(ROOT/name)
        if lot=='E':check(data['cases'][-1]['evidence']['old_valid_blob_accepted'] and not data['anti_rollback_demontre'],'contre-épreuve E07 perdue')
        if lot=='G':
            check(not data['horloge_OS_qualifiee'] and not data['anti_rollback_materiel'],'montage qualifié abusivement')
            for n,c in enumerate(data['cases'],1):
                if c['status']!='PASS':continue
                check(c['journal_intact'] and c['journal_recoverable'],'journal G perdu')
                check(c['decrypt_calls']==(1 if n in (1,5) else 0),'décryptage G avant contrôle')
                check(c['observations'][-1]=={'status':'closed'},'barrière G permissive')
        summary.append(dict(lot=lot,essais=count,verdict=data['verdict']))
    scope=ROOT/'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT03_CRITERES_CLOTURE.md'
    decision_path=DIR/'DECISION_CLOTURE_PT03.json'
    decision=json.loads(decision_path.read_text(encoding='utf-8'))
    check(decision['PT03_clos_perimetre_reduit'] and not decision['qualification_globale'] and not decision['architecture_gelee'],'décision de portée abusive')
    check(decision['criteres_retenus']==[f'C{n}' for n in range(1,9)] and decision['accord_porteur']=='poursuis','décision non rattachée aux critères')
    check(decision['reserves_maintenues']==[f'PT03-R{n:02d}' for n in range(1,5)],'réserves perdues')
    for name,h in decision['sha256_preuves'].items():
        check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==h,'preuve de clôture modifiée '+name)
    files += [scope,Path(__file__).resolve(),decision_path]
    result=dict(prototype='PT03',essais=52,lots=summary,contre_epreuve='E07 : DPAPI accepte un ancien blob valide',
                PT03_clos=True,PT03_clos_perimetre_reduit=True,qualification_globale=False,architecture_gelee=False,horloge_OS_qualifiee=False,anti_rollback_materiel=False,
                reserves=['PT03-R01','PT03-R02','PT03-R03','PT03-R04'],erreurs=errors,
                sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(set(files))})
    (DIR/'CONTROLES_PT03_CONSOLIDES.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k!='sha256'},ensure_ascii=False))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
