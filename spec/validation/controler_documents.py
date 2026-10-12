"""Contrôles structurels documentaires, sans prétendre exécuter un MPD.

Python standard. Les textes sources, lignes et empreintes sont consignés.
Une référence nommée n'est pas une preuve d'exécution de sa règle.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
MLD = ROOT / 'docs/GENIIUS_MLD_V1_0.md'
DICT = ROOT / 'docs/geniius_io_DICTIONNAIRE_DONNEES_V1.md'
REPORT = ROOT / 'docs/AUDIT-MLD/REPORT_AUTORISATIONS_V1_6.md'

def definitions(text):
    result = {}
    pattern = re.compile(r'\*\*(DI-[A-Z]\d{2})\*\*[^\n]*?(?:—|–)\s*')
    for line_no, line in enumerate(text.splitlines(), 1):
        markers = list(pattern.finditer(line))
        for i, match in enumerate(markers):
            end = markers[i+1].start() if i+1 < len(markers) else len(line)
            result[match[1]] = {'ligne': line_no, 'texte': line[match.end():end].strip()}
    return result

def inspect():
    mld = MLD.read_text(encoding='utf-8')
    dictionary = DICT.read_text(encoding='utf-8')
    report = REPORT.read_text(encoding='utf-8')
    tables = {}
    foreign_keys = []
    current = None
    in_code = False
    for line_no, line in enumerate(mld.splitlines(), 1):
        if line.startswith('```'):
            in_code = not in_code
            current = None
            continue
        if not in_code:
            continue
        found = re.match(r'^([a-z][a-z0-9_]*)\s{2,}\[([^]]+)\]', line)
        if found:
            current = found[1]
            if current == 'nom_table':
                current = None
                continue
            tables[current] = {'ligne': line_no, 'nature': found[2], 'colonnes': []}
        if current:
            column = re.match(r'^  ([a-z][a-z0-9_]*)\s{2,}(?:uuid|text|code|int|ts|bool|hash|json|numeric|float|bytes|geom)\b', line)
            if column:
                tables[current]['colonnes'].append(column[1])
            for fk in re.finditer(r'(?:FK[^→\n]*→|(?<![\w])→)\s*([a-z][a-z0-9_]*)\(([^)]+)\)', line):
                foreign_keys.append({'table': current, 'ligne': line_no, 'cible': fk[1], 'colonnes': fk[2]})
    for name in re.findall(r'^\| `([a-z][a-z0-9_]*)` \|', report, re.M):
        tables.setdefault(name, {'ligne': None, 'source': str(REPORT.relative_to(ROOT)), 'nature': 'catalogue candidat'})
    schema_path = ROOT / 'spec/validation/schema_autorisations.json'
    auth_errors = []
    code_errors = []
    in_code = False
    current_name = None
    constraint = []
    constraint_start = 0

    def validate_constraint():
        if not constraint:
            return
        expression = ' '.join(constraint)
        # Retirer les littéraux avant de compter les délimiteurs logiques.
        clean = re.sub(r"'[^']*'", '', expression)
        if clean.count('(') != clean.count(')'):
            code_errors.append({'ligne': constraint_start, 'table': current_name, 'raison': 'parenthèses de contrainte déséquilibrées', 'texte': expression})
        if expression.count('WHERE') > 1:
            code_errors.append({'ligne': constraint_start, 'table': current_name, 'raison': 'plusieurs WHERE dans la même contrainte'})

    for line_no, line in enumerate(mld.splitlines(), 1):
        if line.startswith('```'):
            validate_constraint()
            constraint = []
            in_code = not in_code
            current_name = None
            continue
        if not in_code:
            continue
        found = re.match(r'^([a-z][a-z0-9_]*)\s{2,}\[([^]]+)\]', line)
        if found:
            validate_constraint()
            constraint = []
            current_name = found[1] if found[1] != 'nom_table' else None
        if not current_name:
            continue
        code = line.partition('--')[0].rstrip()
        if re.match(r'^  (CK |UQ |PK |FK )', code):
            validate_constraint()
            constraint = [code]
            constraint_start = line_no
        elif constraint and re.match(r'^\s{4,}\S', code):
            constraint.append(code)
        else:
            validate_constraint()
            constraint = []
    if schema_path.exists():
        auth = json.loads(schema_path.read_text(encoding='utf-8'))
        for name, table in auth['tables'].items():
            tables[name] = {'source': str(schema_path.relative_to(ROOT)), 'nature': table['nature'], 'colonnes': list(table['colonnes'])}
        for name, table in auth['tables'].items():
            columns = table['colonnes']
            for key in table['pk']:
                if key not in columns:
                    auth_errors.append(f'{name}: PK absente {key}')
            for fk in table.get('fk', []):
                target = fk['table']
                if target not in tables:
                    auth_errors.append(f'{name}: cible FK absente {target}')
                if any(c not in columns for c in fk['colonnes']):
                    auth_errors.append(f'{name}: colonne locale FK absente {fk}')
                if target in auth['tables']:
                    if any(c not in auth['tables'][target]['colonnes'] for c in fk['cible']):
                        auth_errors.append(f'{name}: colonne cible FK absente {fk}')
    missing_fk = [fk for fk in foreign_keys if fk['cible'] not in tables]
    mappings = {}
    for line_no, line in enumerate(mld.splitlines(), 1):
        if re.match(r'^\| DI-[A-Z]\d{2} \|', line):
            cells = line.split('|')
            mappings[cells[1].strip()] = {'ligne': line_no, 'realisation': cells[2].strip(), 'statut': cells[3].strip()}
    defs = definitions(dictionary)
    cp13 = next(line for line in mld.splitlines() if line.startswith('| CP-13 |'))
    required = sorted(set(re.findall(r'DI-[A-Z]\d{2}', cp13)))
    expanded = set(re.findall(r'^### CP-13/(DI-[A-Z]\d{2})', mld, re.M))
    undefined = [rule for rule in required if rule not in defs]
    unexpanded = [rule for rule in required if rule not in expanded]
    mismatched_cp13 = []
    for rule in expanded:
        match = re.search(rf'^### CP-13/{rule}[^\n]*\n\n(.*?)(?=\n### |\n# |\Z)', mld, re.M | re.S)
        if rule in defs and match and defs[rule]['texte'] not in match[1]:
            mismatched_cp13.append(rule)
    result = {
        'nature': 'contrôles documentaires, pas exécution SQL ni preuve sémantique exhaustive',
        'sources': {str(p.relative_to(ROOT)).replace('\\', '/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in (MLD, DICT, REPORT)},
        'inventaire_tables': tables, 'tables_total': len(tables), 'foreign_keys_lues': len(foreign_keys),
        'foreign_keys_cibles_absentes': missing_fk, 'schema_autorisations_erreurs': auth_errors,
        'contraintes_logiques_erreurs': code_errors,
        'matrice_DI': mappings, 'matrice_DI_nombre': len(mappings),
        'definitions_DI_nombre': len(defs), 'regles_DI_sans_matrice': sorted(set(defs) - set(mappings)),
        'matrice_DI_sans_definition': sorted(set(mappings) - set(defs)),
        'CP13_nombre': len(required), 'CP13_definitions_absentes': undefined,
        'CP13_enonces_absents': unexpanded, 'CP13_enonces_differents_du_dictionnaire': sorted(mismatched_cp13),
    }
    output = ROOT / 'docs/AUDIT-MLD/CONTROLES_STRUCTURELS_V1_3.json'
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in result.items() if key not in ('sources', 'inventaire_tables', 'matrice_DI')}, ensure_ascii=False, indent=2))
    return missing_fk or auth_errors or code_errors or unexpanded or undefined or mismatched_cp13 or (set(defs) ^ set(mappings))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--strict', action='store_true')
    args = parser.parse_args()
    errors = inspect()
    raise SystemExit(1 if args.strict and errors else 0)
