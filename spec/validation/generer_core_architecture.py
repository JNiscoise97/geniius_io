"""Inventaire des propriétaires et CP depuis les références, sans MPD exécuté."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODULES = {
    'M01': 'Identité', 'M02': 'Accès et espaces', 'M03': 'Socle scientifique',
    'M04': 'Référentiels', 'M05': 'Sources et lecture', 'M06': 'Connaissance et validation',
    'M07': 'Recherche et pilotage', 'M08': 'Tree et circulation', 'M09': 'Mémoire et participation',
    'M10': 'Cartographie', 'M11': 'Publication et échanges', 'M12': 'Financement',
    'M13': 'Synchronisation', 'M14': 'Exécution durable',
}
DOMAIN = {'A': 'M03', 'B': 'M02', 'C': 'M05', 'D': 'M05', 'E': 'M06', 'F': 'M06',
          'G': 'M06', 'H': 'M06', 'I': 'M05', 'J': 'M09', 'K': 'M07', 'L': 'M08',
          'M': 'M09', 'N': 'M10', 'O': 'M07', 'P': 'M11', 'Q': 'M07', 'R': 'M04'}
B_IDENTITY = {'compte', 'compte_categorie_sollicitation', 'acteur_geniius', 'pseudonyme_reserve',
              'lien_compte_acteur', 'lien_compte_personne', 'blocage'}
B_FINANCE = {'financement', 'abonnement', 'prise_en_charge', 'prise_en_charge_ressource', 'prise_en_charge_acceptation'}
CP_MODULE = {
    1:'M03',2:'M03',3:'M03',4:'M03',5:'M03',6:'M02',7:'M06',8:'M04',9:'M03',10:'M03',
    11:'M02',12:'M02',13:'M03',14:'M03',15:'M03',16:'M03',17:'M03',18:'M03',19:'M05',20:'M07',
    21:'M03',22:'M03',23:'M02',24:'M02',25:'M02',26:'M02',27:'M13',28:'M13',29:'M02',30:'M02',
    31:'M07',32:'M07',33:'M08',34:'M07',35:'M11',36:'M12',37:'M02',38:'M07',39:'M12',40:'M02',
    41:'M05',42:'M02',43:'M03',44:'M03',45:'M06',46:'M02',47:'M02',48:'M02',49:'M03',50:'M02',
    51:'M02',52:'M03',53:'M03',
}
CP_TX = {
    6:['T01','T03','T11','T17'],
    16:['T14','T16'],19:['T02'],20:['T04'],21:['T02','T11','T12'],23:['T01','T02','T05'],
    24:['T03','T06'],25:['T01','T03','T06'],27:['T08','T09'],28:['T03','T08','T09'],
    29:['T03','T05'],30:['T03','T04'],31:['T04'],32:['T04'],33:['T05'],34:['T12'],35:['T07'],
    36:['T13'],37:['T06'],38:['T04'],39:['T13'],40:['T03'],41:['T10','T12'],42:['T12'],
    43:['T14','T16'],44:['T02','T03'],45:['T02','T05','T07'],46:['T03','T05','T06'],
    47:['T03','T11'],48:['T03'],49:['T02','T05'],50:['T02','T05','T09'],51:['T05'],
    52:['T02','T14'],53:['T02','T12'],
}


def generate():
    mld_path = ROOT / 'docs/GENIIUS_MLD_V1_0.md'
    auth_path = ROOT / 'spec/validation/schema_autorisations.json'
    doc_path = ROOT / 'docs/architecture/GENIIUS_CORE_MODULES_TRANSACTIONS_V0_1.md'
    text = mld_path.read_text(encoding='utf-8')
    tables = {}
    domain = None
    in_code = False
    for no, line in enumerate(text.splitlines(), 1):
        if line.startswith('# 21.'):
            break
        match = re.match(r'^# \d+\. Domaine ([A-R])', line)
        if match:
            domain = match[1]
        if line.startswith('# 20.') or line.startswith('## 20.1 '):
            domain = 'Q'
        if line.startswith('## 20.2 '):
            domain = 'R'
        if line.startswith('```'):
            in_code = not in_code
        match = re.match(r'^([a-z][a-z0-9_]*)\s{2,}\[([^]]+)\]', line) if in_code else None
        if match and domain:
            name, nature = match.groups()
            owner = DOMAIN[domain]
            if domain == 'B':
                owner = 'M01' if name in B_IDENTITY else 'M12' if name in B_FINANCE else 'M13' if name in {'reception_differee','contribution_differee'} else 'M02'
            if name in tables:
                raise ValueError('Définition concurrente de table : ' + name)
            tables[name] = {'module': owner, 'domaine': domain, 'nature': nature, 'source': str(mld_path.relative_to(ROOT)).replace('\\','/'), 'ligne': no}
    auth = json.loads(auth_path.read_text(encoding='utf-8'))
    for name, table in auth['tables'].items():
        assert name not in tables, name
        tables[name] = {'module': 'M01' if name == 'autorisation_identite' else 'M02',
                        'domaine': 'B', 'nature': table['nature'], 'source': 'spec/validation/schema_autorisations.json'}
    cp = {}
    for match in re.finditer(r'^\| (CP-\d{2}) \| ([^\n]+)', text, re.M):
        ident, row = match.groups()
        num = int(ident[-2:])
        cp[ident] = {'module_responsable': CP_MODULE[num], 'transactions': CP_TX.get(num, ['T02']),
                     'source': 'docs/GENIIUS_MLD_V1_0.md § 21.2', 'texte_normatif': row.split('|')[0].strip(),
                     'verification': f'ARCH-{ident} : corpus conforme et violation ciblée, commit/reprise et sorties sous droits ; preuve à réaliser au MPD/logiciel',
                     'participants': ['M02','M03','M04','propriétaires des tables touchées'],
                     'statut_preuve': 'spécifiée, non exécutée'}
    details = {}
    for match in re.finditer(r'^### CP-13/(DI-[A-Z]\d{2})\n\n(.+?)(?=\n\n)', text, re.M | re.S):
        ident, body = match.groups()
        details[ident] = {'module_responsable': DOMAIN[ident[3]], 'contrat': body,
                          'source': 'docs/GENIIUS_MLD_V1_0.md § 21.3', 'transaction': 'T02 avec validateurs CP-13, ou transaction spécialisée/purge si la règle le requiert',
                          'statut_preuve': 'spécifiée, non exécutée'}
    doc = doc_path.read_text(encoding='utf-8')
    transactions = {}
    for match in re.finditer(r'^\| (T\d{2}) — ([^|]+) \| ([^|]+) \| ([^|]+) \|', doc, re.M):
        ident, coordinator, atomic, after = match.groups()
        transactions[ident] = {'coordinateur': coordinator.strip(), 'atomique': atomic.strip(), 'apres_commit': after.strip()}
    assert len(cp) == 53 and len(details) == 60 and len(transactions) == 17
    result = {'version': 'Architecture Core V0.1 candidate', 'modules': MODULES,
              'tables': tables, 'contraintes_procedurales': cp, 'obligations_CP13': details,
              'transactions': transactions, 'tests_logiciel_executes': False, 'technologies_choisies': False,
              'sources_sha256': {str(p.relative_to(ROOT)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in [mld_path, auth_path, doc_path]}}
    (ROOT / 'spec/validation/core_architecture_v0_1.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    out = ['# Core V0.1 — Matrices de responsabilités et contraintes', '',
           '**Proposition documentaire, non gelée ; aucune recette exécutée.** Génération : `python spec/validation/generer_core_architecture.py`. Source structurée : `spec/validation/core_architecture_v0_1.json`.', '',
           'Chaque table nommée du MLD et du catalogue autorisation a un propriétaire unique. Les miroirs historiques générés ont le même propriétaire que leur courant. M14 porte des enregistrements techniques à définir au MPD, pas des tables scientifiques supplémentaires introduites silencieusement.', '',
           '## Propriétaires de tables', '', '| Table | Module propriétaire | Domaine / nature | Source |', '|---|---|---|---|']
    for name, item in sorted(tables.items()):
        out.append(f'| `{name}` | {item["module"]} | {item["domaine"]} / {item["nature"]} | {item["source"]}' + (f' : {item["ligne"]}' if 'ligne' in item else '') + ' |')
    out += ['', '## CP → module → transaction → vérification', '',
            'Le responsable porte le contrat de validation ; les propriétaires des tables concernées exécutent leurs règles dans la même unité de travail. Un CP transversal n’est pas supposé local à la seule table du responsable. Les scénarios C01–C13 du dossier complètent cette matrice ; la preuve de chaque CP reste exigée.', '',
            '| CP | Responsable | Transactions principales | Vérification |', '|---|---|---|---|']
    for ident, item in cp.items():
        out.append(f'| {ident} | {item["module_responsable"]} | {", ".join(item["transactions"])} | {item["verification"]} |')
    out += ['', '## Soixante obligations détaillées CP-13', '', '| Obligation | Responsable spécialisé | Énoncé amont conservé |', '|---|---|---|']
    for ident, item in details.items():
        out.append(f'| CP-13/{ident} | {item["module_responsable"]} | {item["contrat"].replace(chr(10), " ").replace("|", "/")} |')
    out += ['', f'**Inventaire :** {len(MODULES)} modules, {len(tables)} tables nommées, 53 CP, 60 obligations CP-13, 17 transactions ; présence et attribution documentaire, pas conformité d’une implémentation.', '']
    (ROOT / 'docs/architecture/GENIIUS_CORE_MATRICES_V0_1.md').write_text('\n'.join(out), encoding='utf-8')
    print(f'{len(MODULES)} modules, {len(tables)} tables, 53 CP, 60 obligations CP-13, 17 transactions.')


if __name__ == '__main__':
    generate()
