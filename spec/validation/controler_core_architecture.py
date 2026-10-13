"""Vérifie les matrices d'architecture ; aucune transaction SQL n'est exécutée."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main():
    source = ROOT / 'spec/validation/core_architecture_v0_1.json'
    spec = json.loads(source.read_text(encoding='utf-8'))
    mld = (ROOT / 'docs/05_MLD/GENIIUS_MLD.md').read_text(encoding='utf-8')
    auth = json.loads((ROOT / 'spec/validation/schema_autorisations.json').read_text(encoding='utf-8'))
    doc_path = ROOT / 'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_02_CORE_MODULES_TRANSACTIONS.md'
    doc = doc_path.read_text(encoding='utf-8')
    matrix_path = ROOT / 'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_03_CORE_MATRICES.md'
    matrix = matrix_path.read_text(encoding='utf-8')
    errors = []
    def check(ok, label):
        if not ok:
            errors.append(label)
    expected_tables = set(re.findall(r'^([a-z][a-z0-9_]*)\s{2,}\[[^]]+\]', mld[mld.index('# 4. Domaine A'):mld.index('# 21.')], re.M)) | set(auth['tables'])
    check(set(spec['tables']) == expected_tables, 'inventaire des tables différent du MLD/catalogue')
    module_ids = {f'M{n:02d}' for n in range(1,15)}
    check(set(spec['modules']) == module_ids, 'inventaire des modules')
    check(set(re.findall(r'^\| (M\d{2}) —', doc, re.M)) == module_ids, 'modules dans document')
    for table, item in spec['tables'].items():
        check(item['module'] in module_ids, table + ' propriétaire absent')
        check(matrix.count(f'| `{table}` |') == 1, table + ' attribution répétée/manquante')
    check(spec['tables']['autorisation_identite']['module'] == 'M01', 'identité opératrice')
    for table in ('reception_differee', 'contribution_differee'):
        check(spec['tables'][table]['module'] == 'M13', table + ' propriétaire')
    expected_cp = set(re.findall(r'^\| (CP-\d{2}) \|', mld, re.M))
    check(set(spec['contraintes_procedurales']) == expected_cp, 'couverture CP')
    expected_details = set(re.findall(r'^### CP-13/(DI-[A-Z]\d{2})', mld, re.M))
    check(set(spec['obligations_CP13']) == expected_details, 'couverture des obligations CP-13')
    expected_tx = {f'T{n:02d}' for n in range(1,18)}
    check(set(spec['transactions']) == expected_tx, 'inventaire transactions')
    for cp, item in spec['contraintes_procedurales'].items():
        check(item['module_responsable'] in module_ids, cp + ' responsable')
        check(bool(item['transactions']) and set(item['transactions']) <= expected_tx, cp + ' référence transaction')
        check(bool(item['verification']) and item['statut_preuve'] == 'spécifiée, non exécutée', cp + ' méthode/statut')
    for di, item in spec['obligations_CP13'].items():
        check(item['module_responsable'] in module_ids and item['contrat'] in mld, di + ' énoncé/responsable')
    for tid, item in spec['transactions'].items():
        check(all(item.values()), tid + ' contrat incomplet')
    check(set(re.findall(r'^\| (C\d{2}) —', doc, re.M)) == {f'C{n:02d}' for n in range(1,14)}, 'scénarios de crash-test')
    check(spec['tests_logiciel_executes'] is False and spec['technologies_choisies'] is False, 'statut de preuve/technologie')
    for name, expected in spec['sources_sha256'].items():
        check(hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == expected, 'source modifiée depuis génération : ' + name)
    seal = json.loads((ROOT / 'docs/06_CDC_TECHNIQUE/preuves/PREUVES_GEL_CDC_V1_2.json').read_text(encoding='utf-8'))
    for name in seal['perimetre_gelee']:
        check(hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == seal['sha256_baseline'][name], 'document CDC gelé modifié : ' + name)
    for path in (doc_path, matrix_path):
        content = path.read_text(encoding='utf-8')
        check(len(re.findall(r'^```', content, re.M)) % 2 == 0, 'bloc non fermé : ' + path.name)
        for ref in re.findall(r'\]\(([^)]+)\)', content):
            if not ref.startswith(('https:', 'http:', '#')):
                check((path.parent / ref.split('#')[0]).exists(), 'lien absent : ' + ref)
    files = [source, doc_path, matrix_path, ROOT / 'spec/validation/generer_core_architecture.py', Path(__file__).resolve()]
    result = {'date': '2026-10-13', 'version': spec['version'],
              'modules': 14, 'tables_nominees': len(expected_tables), 'CP': len(expected_cp),
              'obligations_CP13': len(expected_details), 'transactions': 17, 'scenarios_crash_test': 13,
              'tests_logiciel_executes': False, 'architecture_gelee': False, 'erreurs': errors,
              'limites': ['Inventaire, attribution et références documentaires seulement.',
                         'Sérialisation/concurrence, stockage réel, délais, sécurité temporelle et performance à démontrer.',
                         'M14 introduit des contrats techniques ; tables physiques à concevoir au MPD.'],
              'sha256': {str(p.relative_to(ROOT)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
    (ROOT / 'docs/07_ARCHITECTURE/preuves/CONTROLES_CORE_V0_1.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('sha256','limites')}, ensure_ascii=False))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
