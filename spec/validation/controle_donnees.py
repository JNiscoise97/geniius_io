"""Inventaire documentaire, sans écrire ni valider une base de données."""
from pathlib import Path
import re
import json
import sys

ROOT = Path(__file__).resolve().parents[2]


def inventory():
    mld = (ROOT / 'docs/05_MLD/GENIIUS_MLD.md').read_text(encoding='utf-8')
    rows = []
    in_matrix = False
    for line in mld.splitlines():
        if line.startswith('## 25.4'):
            in_matrix = True
        elif in_matrix and line.startswith('# ') and not line.startswith('##'):
            break
        if in_matrix and re.match(r'\| DI-[A-R]\d+ \|', line):
            fields = [x.strip() for x in line.split('|')[1:-1]]
            rows.append(dict(zip(('id', 'realisation', 'statut', 'preuve'), fields)))
    historical = [r for r in rows if 'contrôle des 207 lignes' in r['preuve']]
    nominal = [r['id'] for r in historical if 'CP-13' in r['realisation']]
    return {'total_matrice': len(rows), 'ensemble_historique_207': len(historical),
            'lignes_207_renvoyant_CP13': nominal, 'lignes': rows}


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(inventory(), ensure_ascii=False, indent=2))
