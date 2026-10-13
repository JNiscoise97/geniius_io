"""Contrôle documentaire ; aucune infrastructure ni mesure PRA exécutée."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main():
    path = ROOT / 'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_06_PERSISTANCE_CONSERVATION_RESTAURATION.md'
    text = path.read_text(encoding='utf-8')
    errors = []
    inventories = {}
    for key, pattern, expected in [
        ('phases_depot', r'^\| (P\d{2}) —', [f'P{n:02d}' for n in range(1,6)]),
        ('phases_restauration', r'^\| (R\d{2}) —', [f'R{n:02d}' for n in range(1,8)]),
        ('scenarios_specifies', r'^\| (PR\d{2}) \|', [f'PR{n:02d}' for n in range(1,13)]),
        ('decisions_ouvertes', r'^\| (PER-\d{2}) —', [f'PER-{n:02d}' for n in range(1,8)]),
    ]:
        inventories[key] = re.findall(pattern, text, re.M)
        if inventories[key] != expected:
            errors.append(key)
    for marker in ('ADR-CORE-008','ADR-CORE-009','ADR-CORE-010','ADR-CORE-011',
                   'ST-12','CP-16','CP-41','CP-43','SYN-03','RPO structuré ≤ 5 minutes',
                   'RTO ≤ 4 heures','non exécutés','Aucun SGBD',
                   'Une intention ne donne pas la preuve d’un commit','barrière reste fermée'):
        if marker not in text:
            errors.append('disposition absente : ' + marker)
    for link in re.findall(r'\]\(([^)]+)\)', text):
        if not link.startswith(('http:', 'https:', '#')) and not (path.parent / link.split('#')[0]).exists():
            errors.append('lien absent : ' + link)
    seal = json.loads((ROOT / 'docs/06_CDC_TECHNIQUE/preuves/PREUVES_GEL_CDC_V1_2.json').read_text(encoding='utf-8'))
    for name in seal['perimetre_gelee']:
        if hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != seal['sha256_baseline'][name]:
            errors.append('document gelé modifié : ' + name)
    files = [path, Path(__file__).resolve(), ROOT / 'docs/05_MLD/GENIIUS_MLD.md',
             ROOT / 'docs/04_CONTRAT_AUTORISATION/GENIIUS_CONTRAT_AUTORISATION.md',
             ROOT / 'docs/07_ARCHITECTURE/GENIIUS_ARCHITECTURE_05_SYNCHRONISATION_COMPATIBILITE_HORLOGE.md']
    result = {'date': '2026-10-13', 'dossier': 'Persistance/conservation/restauration V0.1 candidate',
              **inventories, 'architecture_gelee': False, 'tests_infrastructure_executes': False,
              'RPO_RTO_mesures': False, 'technologies_choisies': False, 'erreurs': errors,
              'limites': ['Présences, références et empreintes seulement.',
                         'Durabilité, registres indépendants, clés, mutualisation/effacement, idempotence après restauration et objectifs PRA à démontrer.'],
              'sha256': {str(p.relative_to(ROOT)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
    (ROOT / 'docs/07_ARCHITECTURE/preuves/CONTROLES_PERSISTANCE_V0_1.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('sha256','limites')}, ensure_ascii=False))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
