"""Contrôles de consolidation documentaire, sans prototype ni benchmark exécuté."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ARCH = ROOT / 'docs/07_ARCHITECTURE'


def main():
    source = ROOT / 'spec/validation/registre_architecture_v0_1.json'
    spec = json.loads(source.read_text(encoding='utf-8'))
    errors = []
    def check(ok, label):
        if not ok:
            errors.append(label)
    expected = {f'DEC-ARCH-{n:02d}' for n in range(1,18)} | {f'PAR-CDC-{n:02d}' for n in range(1,12)} | {f'MPD-{n:02d}' for n in range(1,7)}
    for prefix,count in [('SEC',5),('SYN',7),('PER',7),('ASY',7),('DEP',4)]:
        expected |= {f'{prefix}-{n:02d}' for n in range(1,count+1)}
    check(set(spec['decisions']) == expected, 'inventaire des 64 références')
    for ident,item in spec['decisions'].items():
        check(all(item[k] for k in ('objet','responsable','etape','contrat_preuve','statut','source')), ident + ' contrat incomplet')
        check(set(item['dossiers_lies']) <= expected, ident + ' lien de décision inconnu')
        check((ROOT / item['source']).exists(), ident + ' source absente')
        line = (ROOT / item['source']).read_text(encoding='utf-8').splitlines()[item['ligne']-1]
        check(ident in line, ident + ' localisation non fidèle')
    check(sum(item['statut'].startswith('Ouverte') for item in spec['decisions'].values()) == 62, 'statuts ouverts')
    check(spec['decisions']['DEC-ARCH-04']['statut'].startswith('Actée'), 'décision amont conservée')
    check(spec['decisions']['DEC-ARCH-17']['statut'].startswith('Hors V1'), 'capacité ultérieure conservée')
    for name,expected_hash in spec['sha256_sources'].items():
        check(hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == expected_hash, 'source modifiée depuis génération : ' + name)
    registry_path = ARCH / 'GENIIUS_ARCHITECTURE_10_REGISTRE_DECISIONS.md'
    deploy_path = ARCH / 'GENIIUS_ARCHITECTURE_08_DEPLOIEMENT.md'
    tech_path = ARCH / 'GENIIUS_ARCHITECTURE_09_ALTERNATIVES_TECHNOLOGIQUES.md'
    tech = tech_path.read_text(encoding='utf-8')
    deploy = deploy_path.read_text(encoding='utf-8')
    check(re.findall(r'^\| (PT\d{2}) \|',tech,re.M) == [f'PT{n:02d}' for n in range(1,7)], 'six prototypes à exécuter')
    check(set(re.findall(r'^\| (D0[12]) —',deploy,re.M)) == {'D01','D02'}, 'deux variantes exploitation')
    definitions = set()
    for path in ARCH.glob('*.md'):
        definitions |= set(re.findall(r'^## .*?(ADR-CORE-\d{3})',path.read_text(encoding='utf-8'),re.M))
    check(definitions == {f'ADR-CORE-{n:03d}' for n in range(1,17)}, 'seize ADR candidats définis')
    official = re.findall(r'\]\((https://[^)]+)\)',tech)
    check(len(official) == 10, 'dix références officielles de comparaison')
    check('non exécutés' in tech and 'Aucun produit' in tech, 'statut de comparaison/prototypes')
    closure = json.loads((ARCH/'preuves/DECISION_CLOTURE_PT02.json').read_text(encoding='utf-8'))
    check(closure['PT02_clos_perimetre_reduit'] and not closure['NF10_qualifie'], 'cl?ture PT02 r?duite distincte de NF10')
    for name, digest in closure['sha256_preuves'].items():
        check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest() == digest, 'preuve de cl?ture PT02 modifi?e : '+name)
    closure3 = json.loads((ARCH/'preuves/DECISION_CLOTURE_PT03.json').read_text(encoding='utf-8'))
    check(closure3['PT03_clos_perimetre_reduit'] and not closure3['qualification_globale'], 'PT03 closure scope')
    for name, digest in closure3['sha256_preuves'].items():
        check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest() == digest, 'PT03 changed closure evidence: '+name)
    closure4 = json.loads((ARCH/'preuves/DECISION_CLOTURE_PT04.json').read_text(encoding='utf-8'))
    check(closure4['PT04_clos_perimetre_reduit'] and not closure4['NF05_qualifie'], 'PT04 closure scope')
    for name,digest in closure4['sha256_preuves'].items():
        check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest() == digest, 'PT04 changed closure evidence: '+name)
    closure5=json.loads((ARCH/'preuves/DECISION_CLOTURE_PT05.json').read_text(encoding='utf-8'))
    check(closure5['PT05_clos_perimetre_reduit'] and not closure5['MPD04_fixe'] and not closure5['capacite_production_qualifiee'], 'PT05 closure scope')
    for name,digest in closure5['sha256_preuves'].items():
        check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest, 'PT05 changed closure evidence: '+name)
    closure6=json.loads((ARCH/'preuves/DECISION_CLOTURE_PT06.json').read_text(encoding='utf-8'))
    check(closure6['PT06_clos_perimetre_reduit'] and not closure6['architecture_gelee'] and not closure6['pile_ratifiee'], 'PT06 closure scope')
    for name,digest in closure6['sha256_preuves'].items():
        check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest, 'PT06 changed closure evidence: '+name)
    output_path = ARCH / 'preuves' / 'CONTROLES_CONSOLIDATION_V0_1.json'
    for path in (registry_path,deploy_path,tech_path):
        content = path.read_text(encoding='utf-8')
        check(len(re.findall(r'^```',content,re.M)) % 2 == 0, 'bloc non fermé : ' + path.name)
        for ref in re.findall(r'\]\(([^)]+)\)',content):
            if ref.startswith(('http:','https:','#')):
                continue
            target = (path.parent / ref.split('#')[0]).resolve()
            # Le rapport peut référencer la sortie que ce contrôle produit.
            check(target == output_path.resolve() or target.exists(), 'lien absent : ' + ref)
    seal = json.loads((ROOT / 'docs/06_CDC_TECHNIQUE/preuves/PREUVES_GEL_CDC_V1_2.json').read_text(encoding='utf-8'))
    for name in seal['perimetre_gelee']:
        check(hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == seal['sha256_baseline'][name], 'document gelé modifié : ' + name)
    files = [source,registry_path,deploy_path,tech_path,ROOT / 'spec/validation/consolider_decisions_architecture.py',Path(__file__).resolve()]
    result = {'date':'2026-10-13', 'dossier':'Consolidation/déploiement/alternatives V0.1 candidat',
              'references_decision':64,'ouvertes':62,'actee_amont':1,'hors_V1':1,
              'ADR_candidats':16,'variantes_deploiement':2,'prototypes_specifies':6,'sources_officielles':10,
              'architecture_gelee':False,'pile_ratifiee':False,'prototypes_executes':['PT01','PT02','PT03','PT04','PT05','PT06'],'prototypes_clos':['PT01','PT02','PT03','PT04','PT05','PT06'],'budget_mensuel_estime':False,
              'erreurs':errors,'limites':['Contrôle documentaire : inventaires, liens, statuts et empreintes.',
                                        'Aucune preuve physique de concurrence/OS/durabilité/capacité, aucun benchmark ni coût fournisseur acquis.'],
              'sha256':{str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
    output_path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('sha256','limites')},ensure_ascii=False))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
