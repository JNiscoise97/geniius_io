"""Preuve complémentaire du modèle, distincte des 37 cas SQL/HTTP de PT02."""
import hashlib
import io
import json
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'spec/autorisation/tests'))
from base import Base

class GroupApproval(Base):
    def test_approval_and_removal(self):
        self.projet()
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        self.deleg('RS', ('acteur','V'), ['voir'], ('objet',self.o))
        protection = self.ok(self.s.creer_protection('RS', 'embargo_existence', self.o,
                                                    beneficiaires={('groupe','G')}))
        self.ok(self.s.ajouter_membre('ADM','G','V'))
        self.absent('V', self.o)
        self.ok(self.s.agreer_membre('RS', protection, 'G', 'V'))
        self.accorde('V', self.o)
        self.ok(self.s.retirer_membre('ADM','G','V'))
        self.absent('V', self.o)

TESTS = {
    'admissions_hp': [
        'test_controles_v15.ControleB.test_N06_admission_hp_sans_a1',
        'test_controles_v15.ControleB.test_N07_retrait_d_admission_par_un_tiers',
        'test_attaques.Attaques.test_a11_admission_par_fondateur_rompu'],
    'exclusions_personne': ['test_controles_v15.ControleB.test_N08_exclusion_par_personne'],
    'protections_groupes': [
        'test_scenarios.S06_Protections.test_S_44',
        'test_scenarios.S06_Protections.test_S_129',
        '__main__.GroupApproval.test_approval_and_removal'],
    'accords_garde': [
        'test_transitions.Combinaisons.test_derogation_niveaux',
        'test_transitions.Combinaisons.test_derogation_gardien_change'],
    'independance': [
        'test_scenarios.S11_V15.test_S_232',
        'test_scenarios.S11_V15.test_S_233',
        'test_attaques.Attaques.test_a16_derogation_par_second_compte'],
}

def main():
    path = ROOT/'docs/07_ARCHITECTURE/preuves/RESULTATS_PT02_VARIANTES_MODELE.json'
    if '--verifier' in sys.argv:
        data = json.loads(path.read_text(encoding='utf-8'))
        expected = [(family, name) for family, names in TESTS.items() for name in names]
        errors = []
        if [(r['family'],r['test']) for r in data['cases']] != expected:
            errors.append('inventaire des variantes')
        if not all(r['status']=='PASS' and r['tests_run']==1 for r in data['cases']):
            errors.append('tests incomplets ou en échec')
        if data['scope']!='MODELE_REFERENCE_SEULEMENT' or any(data[k] for k in
                       ('SQL_execute','HTTP_execute','PT02_clos','NF10_conforme')):
            errors.append('portée abusive')
        for name, digest in data['sha256_sources'].items():
            if hashlib.sha256((ROOT/name).read_bytes()).hexdigest()!=digest:
                errors.append('source modifiée '+name)
        print(json.dumps(dict(cases=len(data['cases']), errors=errors),ensure_ascii=False))
        raise SystemExit(bool(errors))
    rows = []
    for family, names in TESTS.items():
        for name in names:
            suite = unittest.defaultTestLoader.loadTestsFromName(name)
            output = io.StringIO()
            result = unittest.TextTestRunner(stream=output, verbosity=2).run(suite)
            rows.append(dict(family=family, test=name, tests_run=result.testsRun,
                             status='PASS' if result.wasSuccessful() else 'FAIL',
                             transcript=output.getvalue()))
    sources = [Path(__file__), ROOT/'spec/autorisation/modele.py']
    sources += [ROOT/'spec/autorisation/tests'/name for name in
                ('base.py', 'outils.py', 'test_controles_v15.py', 'test_attaques.py',
                 'test_transitions.py', 'test_scenarios.py')]
    data = dict(timestamp=datetime.now(timezone.utc).isoformat(),
                scope='MODELE_REFERENCE_SEULEMENT', SQL_execute=False, HTTP_execute=False,
                PT02_clos=False, NF10_conforme=False, cases=rows,
                sha256_sources={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
                                for p in sources})
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(dict(cases=len(rows), passed=sum(r['status']=='PASS' for r in rows)), ensure_ascii=False))
    raise SystemExit(any(r['status']!='PASS' for r in rows))

if __name__ == '__main__':
    main()
