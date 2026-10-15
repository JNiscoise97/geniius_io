"""PT06 F : contrôle documentaire et arithmétique, pas essai d'infrastructure."""
from decimal import Decimal,ROUND_HALF_UP
import hashlib
import json
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];HERE=Path(__file__).resolve().parent
DIR=ROOT/'docs/07_ARCHITECTURE/preuves'

def main():
    errors=[];files=[];checks=[]
    def check(ok,label):
        checks.append(dict(check=label,status='PASS' if ok else 'FAIL'))
        if not ok:errors.append(label)
    model_path=HERE/'budget_candidate.json';model=json.loads(model_path.read_text(encoding='utf-8'));files.append(model_path)
    total=sum(Decimal(e['monthly_ttc']) for e in model['envelopes'])
    reserve=sum(Decimal(e['monthly_ttc']) for e in model['envelopes'] if e['kind']=='reserve')
    check(total==Decimal('100.00') and reserve==Decimal('30.00') and total<=Decimal(model['monthly_cap']),'allocation cible 70 + réserve 30 = plafond 100 EUR')
    check(not model['production_budget_validated'] and not model['services_ordered'],'pas budget production validé ni commande')
    rate=Decimal(model['object_storage_rate_ht_per_GB_month']);vat=Decimal(model['vat_assumption'])
    quotes=sum(Decimal(p['monthly_ttc']) for p in model['price_observations'])
    storage=sum(Decimal(p['GB_month'])*rate*(1+vat) for p in model['storage_hypotheses'])
    subtotal=(quotes+storage).quantize(Decimal('.01'),rounding=ROUND_HALF_UP)
    check(subtotal==Decimal('20.93') and all(not p['free_allowance_used'] for p in model['storage_hypotheses']),'repères tarifaires 20,93 EUR TTC sans gratuité supposée')
    proof_names=['PREUVES_PROTOTYPE_PT01.json','PREUVES_PROTOTYPE_PT02.json','CONTROLES_PT03_CONSOLIDES.json','CONTROLES_PT04_CONSOLIDES.json','CONTROLES_PT05_CONSOLIDES.json','PREUVES_PROTOTYPE_PT06.json']
    proof_names += [f'PREUVES_PT06_LOT_{lot}.json' for lot in 'BCDE']
    for name in proof_names:
        path=DIR/name;p=json.loads(path.read_text(encoding='utf-8'));files.append(path)
        faithful=True
        for source,h in p['sha256'].items():
            sp=ROOT/source;files.append(sp)
            if not sp.exists() or hashlib.sha256(sp.read_bytes()).hexdigest()!=h:faithful=False;errors.append('preuve modifiée '+source)
        check(faithful,'empreintes '+name)
    document=ROOT/'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_PT06_ALTERNATIVES_BUDGET_EXPLOITATION.md'
    files.append(document);text=document.read_text(encoding='utf-8')
    broken=[]
    for ref in re.findall(r'\]\(([^)]+)\)',text):
        if ref.startswith(('http:','https:','#')):continue
        target=(document.parent/ref.split('#')[0]).resolve()
        if target==DIR/'CONTROLES_PT06_LOT_F.json':continue
        if not target.exists():broken.append(ref)
    check(not broken,'liens locaux du dossier')
    check(all(term in text for term in ('## Procédure de livraison','## Procédure de restauration','à nommer','Budget de production non validé')),'procédures, responsables et limites explicites')
    files.append(Path(__file__).resolve())
    result=dict(date='2026-10-15',prototype='PT06',lot='F',nature='CONTROLE_DOCUMENTAIRE_ARITHMETIQUE',
                essais_infrastructure_executés=False,PT06_runtime_cases_A_E=34,PT06_clos=False,pile_ratifiee=False,
                budget_production_valide=False,budget_cible_ttc=str(total),reserve_ttc=str(reserve),
                reperes_partiels_ttc=str(subtotal),checks=checks,erreurs=errors,
                sha256={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(set(files))})
    (DIR/'CONTROLES_PT06_LOT_F.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('sha256','checks')},ensure_ascii=False))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
