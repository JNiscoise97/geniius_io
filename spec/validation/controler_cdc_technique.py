"""Contrôles documentaires reproductibles du CDC ; aucune recette logiciel."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main():
    source = ROOT / 'spec/validation/cdc_recettes_v1_2.json'
    model = json.loads(source.read_text(encoding='utf-8'))
    cdc = ROOT / 'docs/GENIIUS_CDC_TECHNIQUE_V1_0.md'
    bilan = ROOT / 'docs/AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md'
    text = cdc.read_text(encoding='utf-8')
    errors = []
    def check(ok, label):
        if not ok:
            errors.append(label)
    check(model['tests_executes'] is False, 'exécution indûment déclarée')
    check(model['technologies_choisies'] is False, 'choix technologique déclaré')
    check(set(model['tech']) == {f'TECH-{n:03d}' for n in range(1, 34)}, 'inventaire TECH')
    for tid, item in model['tech'].items():
        check(bool(item['origine'] and item['nature'] and item['responsable'] and item['contrat']), tid)
        check(item['recette_dediee'] in model['recettes'], tid + ' recette absente')
        for clause in item['contrat']:
            check('**' + clause + '**' in text, clause + ' absent')
    for rid, item in model['recettes'].items():
        check(rid == item['id'], rid + ' identifiant divergent')
        for field in ('scenario', 'attendu', 'methode', 'responsable'):
            check(bool(item.get(field)), rid + ' ' + field)
        check(item['statut'] == 'spécifiée, non exécutée', rid + ' statut')
    check(len([r for r in model['recettes'] if re.fullmatch(r'REC-PR01-\d{2}', r)]) == 12, 'douze cas projets')
    for group in model['relations_de_couverture']:
        for alias in group:
            prefix = 'REC-' + alias
            check(any(r == prefix or r.startswith(prefix + '-') for r in model['recettes']), 'relation ' + alias)
    report = bilan.read_text(encoding='utf-8')
    check(model.get('gel_documentaire') is True and 'ok vas y' in report and 'Les huit conditions sont levées' in report, 'preuve documentaire de gel')
    check('MLD V1.2-g' not in text, 'version MLD erronée')
    check('**GELÉ le 13 octobre 2026' in text, 'statut CDC')
    inverse = model.get('couverture_inverse_CDCF', {})
    check(set(inverse.get('CU', {})) == {f'CU-{n:02d}' for n in range(1, 32)}, 'couverture inverse CU')
    check(set(inverse.get('criteres', {})) == {str(n) for n in range(1, 65)}, 'couverture inverse critères')
    for entries in inverse.values():
        for rid in entries.values():
            check(rid in model['recettes'], 'référence inverse ' + rid)
    lines = text.splitlines()
    for rid, item in model['recettes'].items():
        if 'ligne_CDC' not in item or rid == 'REC-TR08':
            continue
        cells = [v.strip() for v in lines[item['ligne_CDC'] - 1].split('|')]
        expected = cells[2] if lines[item['ligne_CDC'] - 1].startswith('| REC-X') and len(cells) == 5 else cells[3]
        check(expected == item['attendu'], rid + ' attendu non fidèle à la source')
        check(item['attendu'] not in ('P0', 'P1', 'P2'), rid + ' priorité confondue avec attendu')
    final_review = ROOT / 'docs/AUDIT-CDC-TECH/REVUE_FINALE_CDC_V1_1.md'
    review_text = final_review.read_text(encoding='utf-8')
    for n in range(1, 34):
        check(f'| TECH-{n:03d} |' in review_text, 'relecture TECH absente')
    for n in range(1, 17):
        check(f'| L{n:02d} |' in review_text, 'relecture lacune absente')
    for prefix, count in [('DEC-ARCH', 17), ('PAR-CDC', 11)]:
        ids = re.findall(rf'^\| \*\*({prefix}-\d{{2}})\*\*', text, re.M)
        check(len(ids) == count and len(set(ids)) == count, prefix + ' identifiants')
    baseline = json.loads((ROOT / 'docs/AUDIT-MLD/PREUVES_CLOTURE_AUTORISATIONS_V1_6.json').read_text(encoding='utf-8'))
    frozen = {**baseline['sha256'], **baseline.get('sha256_documents_geles', {})}
    for name, expected in frozen.items():
        check(hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == expected, 'baseline gelée modifiée ' + name)
    for n in range(1, 9):
        check(f'GEL-{n:02d}' in report, 'condition de gel absente')
    for n in range(1, 11):
        check(f'| REC-NF{n:02d} |' in text[text.index('## 14.3'):], 'protocole NF absent')
    files = [cdc, bilan, source, ROOT / 'docs/GENIIUS_CDC_TECHNIQUE_RECETTES_V1_2.md',
             ROOT / 'docs/GENIIUS_REGISTRE_VERSIONS_NORMATIVES.md',
             ROOT / 'docs/GENIIUS_CONTRAT_AUTORISATION_V1.md',
             ROOT / 'docs/GENIIUS_MLD_V1_0.md',
             ROOT / 'docs/geniius_io_DICTIONNAIRE_DONNEES_V1.md', final_review,
             ROOT / 'docs/geniius_io_CDCF_V1.md',
             ROOT / 'spec/validation/generer_recettes_cdc.py', Path(__file__).resolve()]
    for path in files[:2] + files[3:4] + [final_review]:
        content = path.read_text(encoding='utf-8')
        check(len(re.findall(r'^```', content, re.M)) % 2 == 0, str(path) + ' clôture bloc')
        for link in re.findall(r'\]\(([^)]+)\)', content):
            if link.startswith(('http:', 'https:', '#', 'mailto:')):
                continue
            target = link.split('#')[0].strip('<>')
            if target:
                check((path.parent / target).exists(), str(path.relative_to(ROOT)) + ' lien ' + link)
    result = {'date_revue': '2026-10-13', 'version': 'CDC V1.2 gelé documentairement', 'nature': 'contrôles documentaires structurels',
              'TECH': len(model['tech']), 'identifiants_recettes': len(model['recettes']),
              'CU_repris': 31, 'criteres_repris': 64, 'baseline_gelee_fichiers_verifies': len(frozen),
              'cas_projets': 12, 'tests_logiciel_executes': False, 'gel_prononce': model.get('gel_documentaire', False),
              'erreurs': errors,
              'limites': ['Présence et cohérence structurelle seulement ; conclusions de relecture dans le rapport final.',
                         'Aucune mesure NF ni recette logiciel exécutée.', 'Reports R-CDC-04 à 06 encadrés, non dimensionnés dans ce contrôle.'],
              'sha256_sources': {str(p.relative_to(ROOT)).replace('\\', '/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
    output = ROOT / 'docs/AUDIT-CDC-TECH/CONTROLES_CDC_TECHNIQUE_V1_2.json'
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in result.items() if k not in ('sha256_sources', 'limites')}, ensure_ascii=False))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
