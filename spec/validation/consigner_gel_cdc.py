"""Scelle une seule fois les empreintes de gel, ou vérifie leur conservation."""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'docs/AUDIT-CDC-TECH/PREUVES_GEL_CDC_V1_2.json'


def digest(name):
    return hashlib.sha256((ROOT / name).read_bytes()).hexdigest()


def main():
    if '--verifier' in sys.argv:
        proof = json.loads(DEST.read_text(encoding='utf-8'))
        errors = [name for name, expected in proof['sha256_baseline'].items() if digest(name) != expected]
        print(json.dumps({'baseline': proof['version'], 'fichiers_verifies': len(proof['sha256_baseline']), 'erreurs': errors}, ensure_ascii=False))
        raise SystemExit(bool(errors))
    if DEST.exists():
        raise SystemExit('Baseline déjà scellée ; utiliser --verifier. Toute modification relève du CDC § 13.')
    checks_path = 'docs/AUDIT-CDC-TECH/CONTROLES_CDC_TECHNIQUE_V1_2.json'
    checks = json.loads((ROOT / checks_path).read_text(encoding='utf-8'))
    assert not checks['erreurs'] and checks['gel_prononce'] and not checks['tests_logiciel_executes']
    frozen = ['docs/GENIIUS_CDC_TECHNIQUE_V1_0.md', 'docs/GENIIUS_CDC_TECHNIQUE_RECETTES_V1_2.md',
              'spec/validation/cdc_recettes_v1_2.json', 'docs/AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md']
    upstream = json.loads((ROOT / 'docs/AUDIT-MLD/PREUVES_CLOTURE_AUTORISATIONS_V1_6.json').read_text(encoding='utf-8'))
    upstream_files = list(upstream['sha256']) + list(upstream['sha256_documents_geles'])
    sources = list(dict.fromkeys(frozen + list(checks['sha256_sources']) + upstream_files + [checks_path,
                    'docs/architecture/GENIIUS_CADRAGE_ARCHITECTURE_V0_1.md',
                    'spec/validation/consigner_gel_cdc.py']))
    proof = {'date': '2026-10-13', 'version': 'CDC V1.2 gelé documentairement',
             'autorisation': 'Réponse du porteur « ok vas y » après proposition de clore les deux réserves, consigner le gel et passer à architecture.',
             'conditions_GEL_closes': [f'GEL-{n:02d}' for n in range(1, 9)],
             'reports_acceptes': ['R-CDC-04', 'R-CDC-05', 'R-CDC-06'],
             'tests_logiciel_executes': False, 'technologies_nouvelles_choisies': False,
             'perimetre_gelee': frozen,
             'references_et_cadrage': 'Empreintes de constat ; aucun gel implicite du CDCF, dictionnaire, MLD ou cadrage architecture.',
             'baseline_autorisation': {'fichiers_verifies': checks['baseline_gelee_fichiers_verifies'],
                                     'equivalences_fins_de_ligne': checks['equivalences_fins_de_ligne']},
             'sha256_baseline': {name: digest(name) for name in sources}}
    DEST.write_text(json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Baseline CDC V1.2 scellée ; huit conditions closes documentairement, reports encadrés, aucune recette logiciel exécutée.')


if __name__ == '__main__':
    main()
