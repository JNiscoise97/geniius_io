"""Migration documentaire ponctuelle autorisée par le porteur le 13/10/2026."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
cdc = ROOT / 'docs/GENIIUS_CDC_TECHNIQUE_V1_0.md'
cdcf = ROOT / 'docs/geniius_io_CDCF_V1.md'
archive = ROOT / 'docs/archives/cdc-technique/GENIIUS_CDC_TECHNIQUE_V1_1_APRES_REVUE_FINALE.md'
archive.write_bytes(cdc.read_bytes())
farchive = ROOT / 'docs/archives/cdcf'
farchive.mkdir(exist_ok=True)
(farchive / 'geniius_io_CDCF_V1_2_AVANT_DC_CDCF_01.md').write_bytes(cdcf.read_bytes())
model = json.loads((ROOT / 'spec/validation/cdc_recettes_v1_1.json').read_text(encoding='utf-8'))
technical = {k: v for k, v in model['tech'].items() if 'Justification technique' in v['nature']}
s = cdcf.read_text(encoding='utf-8')
s = s.replace('CDCF V1.2', 'CDCF V1.3', 1)
s = s.replace('**V1.2** =', '**V1.3** = V1.2 + DC-CDCF-01 (13/10/2026, alignement hors ligne et ratification technique) ; V1.2 =', 1)
s = s.replace('9 octobre 2026 (V1.2)', '9 octobre 2026 (V1.2) ; 13 octobre 2026 (V1.3, DC-CDCF-01)', 1)
old = 'un départ du groupe retire immédiatement les droits dérivés, répliques hors ligne comprises ; aucune approbation ne retarde une révocation ;'
assert old in s
s = s.replace(old, 'un départ du groupe retire immédiatement les droits dérivés côté serveur, dès sa prise d’effet ; aucune approbation ne retarde une révocation. Sur un appareil déconnecté, les objets protégés deviennent inaccessibles dès la première des deux occurrences : reconnexion avec application des retraits avant ajouts, ou échéance locale opposable. Cette échéance est le minimum des plafonds plateforme/espace/habilitant, y compris pour les objets personnels ; aucune réplication par dérogation. Les deltas personnels non synchronisés restent conservés pour leur auteur et leur intégration exige les droits actuels. Une copie sortie du contrôle de GENIIUS ne peut pas être rappelée automatiquement ;', 1)
old = '55. Une habilitation de groupe n’élargit pas les droits quand le groupe change, sauf mode accepté ; un départ révoque immédiatement.'
if old not in s:
    old = old.replace('n’élargit', "n'élargit")
assert old in s
s = s.replace(old, '55. Une habilitation de groupe n’élargit pas les droits quand le groupe change, sauf mode accepté ; un départ révoque immédiatement côté serveur. Hors ligne, les objets protégés deviennent inaccessibles à la reconnexion ou à l’échéance opposable, selon ce qui arrive d’abord (§ 122.2) ; les deltas personnels sont conservés sans droit d’intégration implicite.', 1)
s += '\n\n# 135. Décision de cohérence DC-CDCF-01 (13 octobre 2026)\n\n'
s += 'Le porteur a autorisé la clôture des deux réserves de la revue finale et le gel du CDC technique : proposition de ratifier les exigences techniques déjà retenues avec leurs justifications et d’aligner le hors ligne sur le contrat V1.6, puis réponse « ok vas y ». Voir le [procès-verbal](AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md).\n\n'
s += 'L’amendement de § 122.2 et du critère 55 clôt l’écart de formulation avec V1.6, sans changer son comportement gelé ni adopter ses valeurs d’exemple. Le résidu déconnecté reste une limite effective du système ; il cesse d’être une contradiction de la référence fonctionnelle actuelle.\n\n'
s += 'Les exigences techniques ci-dessous sont ratifiées par décision du porteur, dans leurs clauses du CDC V1.2. Leur origine reste une décision technique justifiée ; aucune exigence fonctionnelle historique n’est inventée. La régularisation directe clôt ECD-19 / R-CDC-02 sur ce périmètre et remplace la proposition AV-FONC-002 par cette décision, sans prétendre qu’un dossier AV-FONC-002 a été rédigé ou gelé.\n\n| TECH | Justification ratifiée |\n|---|---|\n'
justifications = {1: 'Usages Web, Desktop et Mobile complémentaires autour du même Core.', 2: 'Consultation et collecte terrain déconnectées, sous contrôle d’échéance.', 4: 'Fichiers locaux, imports massifs et capacités matérielles avec permissions OS.', 5: 'Continuité entre appareils, contributions versionnées et conflits non destructifs.', 9: 'Patrimoines anciens et migrations collectives ; profils chiffrés indicatifs restent à valider.', 13: 'Reprise, idempotence et refus prudent préservent patrimoine et confidentialité.', 14: 'Objectifs interactifs mesurables ; conditions de mesure distinctes et encadrées.', 22: 'Isolation des environnements pour protéger le patrimoine réel.', 23: 'Livraisons/migrations reproductibles et retour arrière sans corruption.', 28: 'Qualité de service mesurable ; objectif initial après stabilisation, distinct du PRA.'}
for tid, item in technical.items():
    s += f'| {tid} — {item["titre"]} | {justifications[int(tid.split("-")[1])]} |\n'
cdcf.write_text(s, encoding='utf-8')
s = cdc.read_text(encoding='utf-8')
s = s.replace('V1.1', 'V1.2').replace('1.1 — actualisation', '1.2 — clôture des réserves et gel documentaire')
s = s.replace('CDCF V1.2', 'CDCF V1.3')
s = s.replace('GENIIUS_CDC_TECHNIQUE_RECETTES_V1_1.md', 'GENIIUS_CDC_TECHNIQUE_RECETTES_V1_2.md')
s = s.replace('cdc_recettes_v1_1.json', 'cdc_recettes_v1_2.json')
s = s.replace('revu et corrigé documentairement, réserves ouvertes — **CANDIDAT, NON GELÉ**', '**GELÉ le 13 octobre 2026 — baseline documentaire avec reports encadrés**')
s = s.replace('GENIIUS_BILAN_ACTUALISATION_CDC_V1_1.md', 'PROCES_VERBAL_GEL_CDC_V1_2.md')
s = s.replace('V1.2 actualisée, candidate ; gel non prononcé.', 'V1.2 gelée documentairement sur décision du porteur.')
s = s.replace('Six conditions sont satisfaites documentairement, deux restent sous réserve ; aucun gel n’est prononcé.', 'Les huit conditions sont closes documentairement ; reports à architecture/MPD/produit acceptés et encadrés dans le procès-verbal.')
s = s.replace('Sous réserve R-CDC-02', 'Close — DC-CDCF-01').replace('Sous réserve R-CDC-03', 'Close — DC-CDCF-01')
s = s.replace('Régularisation ECD-19 / AV-FONC-002 à décider par le porteur.', 'Ratification technique du porteur consignée au CDCF § 135 ; ECD-19 clos sans origine fonctionnelle inventée.')
s = s.replace('contradiction amont CDCF § 122.2 / critère 55 maintenue et doit recevoir une disposition explicite.', 'CDCF V1.3 § 122.2 / critère 55 alignés ; résidu physique hors ligne demeure une limite déclarée.')
s = s.replace('réserves ECD-19 et hors ligne maintenues (rapport de revue).', 'réserves ECD-19 et hors ligne closes par DC-CDCF-01 après le rapport de revue.')
s = s.replace('| Réserve ECD-19 |', '| Clos — DC-CDCF-01 |')
s = s.replace('leur origine est à régulariser (avenant AV-FONC-002 proposé, ECD-19).', 'leur ratification technique est consignée au CDCF V1.3 § 135 (DC-CDCF-01) ; ECD-19 est clos. Leurs origines historiques sont conservées.')
s = s.replace('écart CDCF § 122.2 conservé au registre.', 'CDCF V1.3 § 122.2 désormais aligné par DC-CDCF-01 ; résidu conservé comme limite effective.')
s = s.replace('CR-55 conserve l’écart hors ligne du CDCF, sans le réécrire.', 'CR-55 reprend l’amendement hors ligne du CDCF V1.3, versionné par DC-CDCF-01.')
s = s.replace('Le critère 55 et CU-29 restent sous la réserve hors ligne déclarée.', 'Le critère 55 et CU-29 appliquent le résidu hors ligne borné, désormais aligné dans le CDCF V1.3.')
s = s.replace('La revue finale est consignée dans le rapport lié au § 11 ; ses réserves restent distinctes du contrôle structurel.', 'La revue finale historique et la clôture de ses réserves par le procès-verbal sont distinctes du contrôle structurel.')
s = s.replace('**aucun gel du CDC n’est prononcé**.', '**gel documentaire prononcé le 13/10/2026**, voir procès-verbal ; aucune recette logiciel exécutée.')
s = s.replace('**CDC technique — gel définitif** : après clôture documentée de GEL-01 à GEL-08 et traitement explicite des réserves.', '**CDC technique V1.2 — gel documentaire** : prononcé après clôture documentée de GEL-01 à GEL-08 et traitement explicite des réserves.')
s += '\n\n## 14.6 Décision de gel du 13 octobre 2026\n\nLe [procès-verbal](AUDIT-CDC-TECH/PROCES_VERBAL_GEL_CDC_V1_2.md) consigne l’autorisation du porteur, la clôture R-CDC-02/03 par DC-CDCF-01, la levée documentaire GEL-01 à GEL-08 et les reports R-CDC-04/05/06. Cette baseline V1.2 et son référentiel de recettes sont gelés ; toute évolution suit § 13. Les durées, profils complémentaires, valeurs commerciales et décisions MPD restent à arrêter à leurs étapes avant campagne ou livraison. Le dictionnaire V1.3 et le MLD V1.1-g gardent leurs statuts propres, sans gel implicite.\n'
cdc.write_text(s, encoding='utf-8')
