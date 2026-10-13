"""Empreintes et périmètres de preuve de la validation documentaire."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
baseline_path = ROOT / 'docs/04_CONTRAT_AUTORISATION/preuves/PREUVES_CLOTURE_AUTORISATIONS_V1_6.json'
baseline = json.loads(baseline_path.read_text(encoding='utf-8'))
checks = {}
for name, expected in {**baseline['sha256'], **baseline['sha256_documents_geles']}.items():
    actual = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
    checks[name] = actual == expected
assert all(checks.values()), [name for name, same in checks.items() if not same]

sources = [
    'docs/03_DICTIONNAIRE/GENIIUS_DICTIONNAIRE_DONNEES.md',
    'docs/05_MLD/GENIIUS_MLD.md',
    'docs/05_MLD/GENIIUS_MLD_AUTORISATIONS.md',
    'docs/GENIIUS_REGISTRE_VERSIONS_NORMATIVES.md',
    'docs/05_MLD/preuves/REPORT_AUTORISATIONS_V1_6.md',
    'docs/05_MLD/preuves/VALIDATION_DONNEES_ET_TRACABILITE_V1_3.md',
    'docs/05_MLD/preuves/VALIDATION_AUTORISATIONS_RELATIONNELLES_V1_3.md',
    'docs/03_DICTIONNAIRE/preuves/DOSSIER_VALIDATION_DICTIONNAIRE_MLD_V1_3.md',
    'docs/05_MLD/preuves/REGISTRE_CLOTURE_CONSTATS_V1_3.md',
    'docs/05_MLD/preuves/CONTROLES_STRUCTURELS_V1_3.json',
    'spec/validation/schema_autorisations.json',
    'spec/validation/expliciter_schema_autorisations.py',
    'spec/validation/controler_documents.py',
]
broken = []
for name in sources:
    p = ROOT / name
    if p.suffix != '.md':
        continue
    text = p.read_text(encoding='utf-8')
    assert text.count('```') % 2 == 0, ('bloc Markdown non fermé', name)
    for target in re.findall(r'\[[^\]\n]+\]\(([^)\n]+)\)', text):
        target = target.split('#')[0]
        if not target or target.startswith(('http:', 'https:', '/')):
            continue
        if not (p.parent / target).resolve().exists():
            broken.append({'document': name, 'cible': target})
assert not broken, broken
controls = json.loads((ROOT / 'docs/05_MLD/preuves/CONTROLES_STRUCTURELS_V1_3.json').read_text(encoding='utf-8'))
proof = {
    'date': '2026-10-12',
    'statuts': {'dictionnaire': 'V1.3 validé documentairement', 'MLD': 'V1.1-g stabilisé, candidat au gel'},
    'gel_formel_nouveau': False,
    'execution_SQL': False,
    'semantic_exhaustif_304_DI': False,
    'population_DI': controls['matrice_DI_nombre'],
    'CP13_enoncees_et_recomparees': controls['CP13_nombre'],
    'baseline_V1_6_inchangee': checks,
    'liens_locaux_manquants': broken,
    'sha256': {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in sources},
}
path = ROOT / 'docs/03_DICTIONNAIRE/preuves/PREUVES_VALIDATION_DICTIONNAIRE_MLD_V1_3.json'
path.write_text(json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Baseline V1.6 inchangée ; liens et blocs valides ;', len(sources), 'sources consignées.')
