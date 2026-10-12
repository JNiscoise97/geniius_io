from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
cdc = ROOT / 'docs/GENIIUS_CDC_TECHNIQUE_V1_0.md'
s = cdc.read_text(encoding='utf-8').replace('MLD V1.2-g', 'MLD V1.1-g')
s = s.replace('dictionnaire/MLD V1.2', 'dictionnaire/MLD V1.1')
cdc.write_text(s, encoding='utf-8')
p = ROOT / 'spec/validation/generer_recettes_cdc.py'
s = p.read_text(encoding='utf-8').replace('V1.1', 'V1.2').replace('v1_1.json', 'v1_2.json').replace('V1_1.md', 'V1_2.md')
s = s.replace('CDCF V1.2', 'CDCF V1.3')
s = s.replace("('# 134.', None)", "('# 134.', '# 135.')")
s = s.replace('CR55 conserve l’écart hors ligne déclaré.', 'CR55 applique la règle hors ligne bornée alignée par DC-CDCF-01.')
s = s.replace("'version': 'CDC V1.2 candidat'", "'version': 'CDC V1.2 gelé documentairement', 'gel_documentaire': True")
s = s.replace('**Statut : spécifié, non exécuté.** Partie intégrante du CDC V1.2 candidat.', '**Statut : référentiel documentaire gelé le 13/10/2026, recettes non exécutées.** Partie intégrante du CDC V1.2 gelé ; procès-verbal dans `docs/AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md`.')
s = s.replace('Le besoin de régularisation AV-FONC-002 reste ouvert.', 'La ratification technique DC-CDCF-01 au CDCF § 135 clôt ECD-19 ; aucune origine fonctionnelle historique n’est inventée.')
s = s.replace("'integration': 'relue en revue finale V1.2 ; réserves du rapport applicables'", "'integration': 'relue en V1.1, réserves closes par DC-CDCF-01, baseline V1.2 gelée'" )
s = s.replace('CR-55 conserve', 'CR-55 applique')
p.write_text(s, encoding='utf-8')
p = ROOT / 'spec/validation/controler_cdc_technique.py'
s = p.read_text(encoding='utf-8').replace('cdc_recettes_v1_1.json', 'cdc_recettes_v1_2.json').replace('GENIIUS_CDC_TECHNIQUE_RECETTES_V1_1.md', 'GENIIUS_CDC_TECHNIQUE_RECETTES_V1_2.md').replace('CONTROLES_CDC_TECHNIQUE_V1_1.json', 'CONTROLES_CDC_TECHNIQUE_V1_2.json')
s = s.replace("'version': 'CDC V1.1 candidat'", "'version': 'CDC V1.2 gelé documentairement'")
s = s.replace("'gel_prononce': False", "'gel_prononce': model.get('gel_documentaire', False)")
s = s.replace("bilan = ROOT / 'docs/AUDIT-CDC-TECH/GENIIUS_BILAN_ACTUALISATION_CDC_V1_1.md'", "bilan = ROOT / 'docs/AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md'")
s = s.replace("'Réserves du bilan non levées.'", "'Reports R-CDC-04 à 06 encadrés, non dimensionnés dans ce contrôle.'")
s = s.replace("report = bilan.read_text(encoding='utf-8')", "report = bilan.read_text(encoding='utf-8')\n    check(model.get('gel_documentaire') is True and 'ok vas y' in report and 'Les huit conditions sont levées' in report, 'preuve documentaire de gel')\n    check('MLD V1.2-g' not in text, 'version MLD erronée')\n    check('**GELÉ le 13 octobre 2026' in text, 'statut CDC')")
p.write_text(s, encoding='utf-8')
p = ROOT / 'docs/GENIIUS_REGISTRE_VERSIONS_NORMATIVES.md'
s = p.read_text(encoding='utf-8')
lines = s.splitlines()
for i, line in enumerate(lines):
    if line.startswith('| 1 | Cahier des charges fonctionnel |'):
        lines[i] = '| 1 | Cahier des charges fonctionnel | [CDCF](geniius_io_CDCF_V1.md) | **V1.3** (13/10/2026) = V1.2 + DC-CDCF-01 | **RÉFÉRENCE — gel global non prononcé** | [Décision de cohérence et gel CDC](AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md) : § 122.2/critère 55 alignés V1.6, ratification technique § 135 ; [V1.2 archivée](archives/cdcf/geniius_io_CDCF_V1_2_AVANT_DC_CDCF_01.md) |'
    if line.startswith('| 5 | CDC technique |'):
        lines[i] = '| 5 | CDC technique | [CDC](GENIIUS_CDC_TECHNIQUE_V1_0.md) et [recettes](GENIIUS_CDC_TECHNIQUE_RECETTES_V1_2.md) | **V1.2** (13/10/2026) | **GELÉ DOCUMENTAIREMENT**, reports encadrés | [Procès-verbal](AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md), huit conditions levées, [contrôles](AUDIT-CDC-TECH/CONTROLES_CDC_TECHNIQUE_V1_2.json), [empreintes baseline](AUDIT-CDC-TECH/PREUVES_GEL_CDC_V1_2.json) |'
    if line.startswith('| CDC technique V1.1 |'):
        lines[i] = '| CDC technique V1.2 | **Gel documentaire prononcé le 13/10/2026** ; reports architecture/MPD/produit suivis au procès-verbal |'
    if line.startswith('| CDCF V1.1 |'):
        lines[i] = '| CDCF V1.3 | Maintien du statut référence ; gel global non prononcé. DC-CDCF-01 clôt ECD-19 et écart hors ligne ; AV-FONC-001 intégré. |'
lines += ['', '## 5. Clôture CDC et entrée architecture — 13 octobre 2026', '',
          'DC-CDCF-01 clôt R-CDC-02/03 sur autorisation du porteur. Les mentions d’écart CDCF § 122.2 dans les preuves gelées V1.6 concernent la V1.2 historique ; le contrat reste inchangé. Le CDC V1.2 et ses recettes sont gelés documentairement ; les statuts propres du dictionnaire et du MLD ne sont pas modifiés.', '',
          '[Cadrage architecture V0.1](architecture/GENIIUS_CADRAGE_ARCHITECTURE_V0_1.md) : candidat, non gelé ; aucun nouveau fournisseur ni technologie choisi.']
p.write_text('\n'.join(lines) + '\n', encoding='utf-8')
