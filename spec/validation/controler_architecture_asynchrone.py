"""Contrôle documentaire de l'asynchronisme ; aucune file réelle ni charge exécutée."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main():
    path = ROOT / 'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_07_ASYNCHRONE_PROPAGATION_DIMENSIONNEMENT.md'
    content = path.read_text(encoding='utf-8')
    errors = []
    inventories = {}
    for key, regex, expected in [
        ('phases_execution', r'^\| (A\d{2}) —', [f'A{n:02d}' for n in range(1,7)]),
        ('scenarios_specifies', r'^\| (AS\d{2}) \|', [f'AS{n:02d}' for n in range(1,13)]),
        ('decisions_ouvertes', r'^\| (ASY-\d{2}) —', [f'ASY-{n:02d}' for n in range(1,8)]),
    ]:
        inventories[key] = re.findall(regex, content, re.M)
        if inventories[key] != expected:
            errors.append(key)
    for marker in ('ADR-CORE-012', 'ADR-CORE-013', 'ADR-CORE-014', 'CP-21', 'MPD-04',
                   'CP-09', 'CP-39', 'ST-13', '50 sous-projets, 500 contributeurs, un million d’objets',
                   'p95 ≤ 1 s', 'p95 ≤ 2 s', 'non exécutés',
                   'à fixer', 'frontier', 'ne remet jamais', 'même transaction'):
        if marker not in content:
            errors.append('disposition absente : ' + marker)
    for link in re.findall(r'\]\(([^)]+)\)', content):
        if not link.startswith(('http:', 'https:', '#')) and not (path.parent / link.split('#')[0]).exists():
            errors.append('lien absent : ' + link)
    seal = json.loads((ROOT / 'docs/06_CDC_TECHNIQUE/preuves/PREUVES_GEL_CDC_V1_2.json').read_text(encoding='utf-8'))
    for name in seal['perimetre_gelee']:
        if hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != seal['sha256_baseline'][name]:
            errors.append('baseline gelée modifiée : ' + name)
    files = [path, Path(__file__).resolve(), ROOT / 'docs/05_MLD/GENIIUS_MLD.md',
             ROOT / 'docs/06_CDC_TECHNIQUE/GENIIUS_CDC_TECHNIQUE.md',
             ROOT / 'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_06_PERSISTANCE_CONSERVATION_RESTAURATION.md']
    result = {'date': '2026-10-13', 'dossier': 'Asynchrone/propagation/dimensionnement V0.1 candidate',
              **inventories, 'architecture_gelee': False, 'tests_logiciel_charge_executes': False,
              'MPD04_fixe': False, 'capacite_production_mesuree': False, 'erreurs': errors,
              'limites': ['Présences, références et empreintes documentaires seulement.',
                         'Baux, génération/frontier, concurrence, sécurité, équité, débit/coût et délai maximal restent à démontrer.'],
              'sha256': {str(p.relative_to(ROOT)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
    (ROOT / 'docs/07_ARCHITECTURE/preuves/CONTROLES_ASYNCHRONE_V0_1.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('sha256','limites')}, ensure_ascii=False))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
