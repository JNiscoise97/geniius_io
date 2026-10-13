"""Contrôle documentaire du dossier sécurité/concurrence, sans preuve SQL."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main():
    path = ROOT / 'docs/architecture/GENIIUS_AUTORISATIONS_ISOLATION_CONCURRENCE_V0_1.md'
    content = path.read_text(encoding='utf-8')
    errors = []
    def check(ok, message):
        if not ok:
            errors.append(message)
    scenarios = re.findall(r'^\| (AC\d{2}) \|', content, re.M)
    points = re.findall(r'^\| (SEC-\d{2}) \|', content, re.M)
    steps = re.findall(r'^\| ([0-7]) \|', content, re.M)
    check(scenarios == [f'AC{n:02d}' for n in range(1,13)], 'inventaire des douze scénarios')
    check(points == [f'SEC-{n:02d}' for n in range(1,6)], 'cinq preuves aval responsables/étape')
    check(steps == list('01234567'), 'ordre canonique V1.6')
    for marker in ('ADR-CORE-002', 'ADR-CORE-003', 'ADR-CORE-004', 'même instant de calcul',
                   'garde exclusive', 'garde partagée', 'point de linéarisation',
                   'sans mutation', 'P-3', 'non exécutés', 'MPD-02/06', 'famine'):
        check(marker in content, 'contrat absent : ' + marker)
    for reference in re.findall(r'\]\(([^)]+)\)', content):
        if not reference.startswith(('http:', 'https:', '#')):
            check((path.parent / reference.split('#')[0]).exists(), 'lien absent : ' + reference)
    check(len(re.findall(r'^```', content, re.M)) % 2 == 0, 'bloc non fermé')
    baseline = json.loads((ROOT / 'docs/AUDIT-CDC-TECH/PREUVES_GEL_CDC_V1_2.json').read_text(encoding='utf-8'))
    for name in baseline['perimetre_gelee']:
        check(hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == baseline['sha256_baseline'][name], 'baseline CDC modifiée : ' + name)
    sources = [path, Path(__file__).resolve(), ROOT / 'docs/GENIIUS_CONTRAT_AUTORISATION_V1.md',
               ROOT / 'docs/GENIIUS_MLD_V1_0.md', ROOT / 'docs/architecture/GENIIUS_CORE_MODULES_TRANSACTIONS_V0_1.md']
    output = {'date': '2026-10-13', 'dossier': 'Autorisations/isolation/concurrence V0.1 candidate',
              'ADR_instruits': ['ADR-CORE-002','ADR-CORE-003','ADR-CORE-004'],
              'scenarios_specifies': scenarios, 'points_de_preuve_ouverts': points,
              'architecture_gelee': False, 'tests_concurrence_SQL_executes': False, 'technologies_choisies': False,
              'erreurs': errors,
              'limites': ['Présences, références et empreintes documentaires seulement.',
                         'Garde physique, linéarisation/échéance, sortie transport, famine et non-divulgation temporelle restent à démontrer.'],
              'sha256': {str(p.relative_to(ROOT)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in sources}}
    (ROOT / 'docs/architecture/CONTROLES_SECURITE_V0_1.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k:v for k,v in output.items() if k not in ('sha256','limites')}, ensure_ascii=False))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
