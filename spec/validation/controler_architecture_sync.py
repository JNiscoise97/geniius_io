"""Contrôles documentaires de synchronisation, sans exécution de client/serveur."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main():
    path = ROOT / 'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_05_SYNCHRONISATION_COMPATIBILITE_HORLOGE.md'
    text = path.read_text(encoding='utf-8')
    errors = []
    def check(ok, label):
        if not ok:
            errors.append(label)
    scenarios = re.findall(r'^\| (SY\d{2}) \|', text, re.M)
    points = re.findall(r'^\| (SYN-\d{2}) —', text, re.M)
    phases = re.findall(r'^\| (S\d{2}) —', text, re.M)
    st = re.findall(r'^\| (ST-\d{2}) \|', text, re.M)
    check(scenarios == [f'SY{n:02d}' for n in range(1,13)], 'douze scénarios uniques')
    check(points == [f'SYN-{n:02d}' for n in range(1,8)], 'sept décisions responsables/étape')
    check(phases == [f'S{n:02d}' for n in range(1,8)], 'sept phases de session')
    check(set(st) == {f'ST-{n:02d}' for n in list(range(1,9))+[12,13,14]}, 'obligations ST couvertes')
    for marker in ('ADR-CORE-005', 'ADR-CORE-006', 'ADR-CORE-007', 'reception_differee',
                   'contribution_differee', 'T08', 'T09', 'T17', 'SYN-04',
                   'sans FK de cible', 'seul auteur', 'retraits précèdent les ajouts', 'non exécutés',
                   'U0 = Ts', 'U < échéance', 'anti-rejeu', 'aucun fournisseur'):
        check(marker in text, 'disposition absente : ' + marker)
    for link in re.findall(r'\]\(([^)]+)\)', text):
        if not link.startswith(('http:', 'https:', '#')):
            check((path.parent / link.split('#')[0]).exists(), 'lien absent : ' + link)
    seal = json.loads((ROOT / 'docs/06_CDC_TECHNIQUE/preuves/PREUVES_GEL_CDC_V1_2.json').read_text(encoding='utf-8'))
    for name in seal['perimetre_gelee']:
        check(hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == seal['sha256_baseline'][name], 'document gelé modifié : ' + name)
    files = [path, Path(__file__).resolve(), ROOT / 'docs/05_MLD/GENIIUS_MLD.md',
             ROOT / 'docs/04_CONTRAT_AUTORISATION/GENIIUS_CONTRAT_AUTORISATION.md',
             ROOT / 'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_04_AUTORISATIONS_ISOLATION_CONCURRENCE.md']
    result = {'date': '2026-10-13', 'dossier': 'Synchronisation/compatibilité/horloge V0.1 candidate',
              'phases': phases, 'scenarios_specifies': scenarios, 'decisions_ouvertes': points,
              'obligations_ST_referencees': st, 'architecture_gelee': False,
              'tests_logiciel_executes': False, 'durées_ouvertes': True, 'erreurs': errors,
              'limites': ['Présences/références/empreintes documentaires seulement.',
                         'Horloge OS, anti-rollback, appareil révoqué, accusés durables, rétention/idempotence et transport à démontrer.'],
              'sha256': {str(p.relative_to(ROOT)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
    (ROOT / 'docs/07_ARCHITECTURE/preuves/CONTROLES_SYNCHRONISATION_V0_1.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('sha256','limites')}, ensure_ascii=False))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
