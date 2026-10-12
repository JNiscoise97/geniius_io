"""Banc de mutations (modèle V1.6) : applique chaque mutation à une copie du modèle et lance les tests.

Usage (depuis la racine du dépôt) :
    python spec/autorisation/mutations/lancer.py --verifier      # contrôle que chaque cible existe une fois
    python spec/autorisation/mutations/lancer.py                 # toutes les mutations
    python spec/autorisation/mutations/lancer.py M010 M011       # certaines seulement

Volume des tests de propriétés pendant le banc : GENIIUS_GRAINES=6, GENIIUS_PAS=40 (ajustable).
Résultats : resultats.json et RESULTATS.md, à côté de ce fichier.
"""
import ast
import concurrent.futures
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ICI = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(ICI)
sys.path.insert(0, ICI)
from mutations import M  # noqa: E402

PY = sys.executable


def main():
    args = sys.argv[1:]
    verifier = '--verifier' in args
    seules = {a for a in args if not a.startswith('--')}
    modele = open(os.path.join(SRC, 'modele.py'), encoding='utf-8').read()
    erreurs = [(m[0], modele.count(m[3])) for m in M if modele.count(m[3]) != 1]
    # Un import impossible ne constitue pas une détection comportementale.
    # Vérifier tous les mutants avant les tests, y compris avec --verifier.
    syntaxes = []
    for mid, _, _, ancien, nouveau in M:
        try:
            ast.parse(modele.replace(ancien, nouveau), filename=mid)
        except SyntaxError as exc:
            syntaxes.append((mid, exc.lineno, exc.msg))
    for mid, ligne, message in syntaxes:
        print(mid, 'syntaxe invalide', ligne, message)
    for mid, n in erreurs:
        print(mid, 'cible trouvée', n, 'fois')
    if verifier or erreurs or syntaxes:
        print(len(M), 'mutations ;', len(erreurs), 'cibles invalides ;', len(syntaxes), 'syntaxes invalides')
        sys.exit(1 if erreurs or syntaxes else 0)
    chemin = os.path.join(ICI, 'resultats.json')
    res = json.load(open(chemin, encoding='utf-8')) if (seules and os.path.exists(chemin)) else {}
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE='1', PYTHONIOENCODING='utf-8', GENIIUS_SANS_COMPTAGE='1',
               GENIIUS_GRAINES=os.environ.get('GENIIUS_GRAINES', '6'),
               GENIIUS_PAS=os.environ.get('GENIIUS_PAS', '40'))
    # Instantané des tests au lancement : une modification pendant le banc ne le fausse pas.
    instantane = tempfile.mkdtemp(prefix='geniius_tests_')
    for f in os.listdir(os.path.join(SRC, 'tests')):
        if f.endswith('.py'):
            shutil.copy(os.path.join(SRC, 'tests', f), os.path.join(instantane, f))
    modules = sorted(f[:-3] for f in os.listdir(instantane) if f.startswith('test_'))
    modules.sort(key=lambda m: m == 'test_proprietes')            # les tests rapides d'abord (mode -f)

    def executer(mut):
        mid, clause, desc, ancien, nouveau = mut
        travail = tempfile.mkdtemp(prefix='geniius_mut_')
        try:
            shutil.copytree(instantane, os.path.join(travail, 'tests'))
            with open(os.path.join(travail, 'modele.py'), 'w', encoding='utf-8') as f:
                f.write(modele.replace(ancien, nouveau) if ancien else modele)
            try:
                p = subprocess.run([PY, '-B', '-m', 'unittest', '-f'] + modules, cwd=os.path.join(travail, 'tests'),
                                   capture_output=True, text=True, env=env, encoding='utf-8', errors='replace',
                                   timeout=1800)
                sortie, code = p.stderr + p.stdout, p.returncode
            except subprocess.TimeoutExpired:
                sortie, code = 'délai dépassé', 1
        finally:
            shutil.rmtree(travail, ignore_errors=True)
        echecs = sorted(set(re.findall(r'^(?:FAIL|ERROR): (\S+) \(([^)]+)\)', sortie, re.M)))
        noms = sorted({f'{cls.split(".")[-2] if cls.count(".") > 1 else cls}.{t}' for t, cls in echecs})
        return mid, clause, desc, code, noms

    try:
        # Passage de référence : sans mutation, la suite doit réussir, sinon le banc ne prouve rien.
        mid, _, _, code, noms = executer(('REFERENCE', '—', 'modèle non muté', '', ''))
        if code != 0:
            print('Le modèle non muté échoue : le banc est invalide.', noms[:5])
            sys.exit(2)
        print('REFERENCE ok', flush=True)
        a_faire = [m for m in M if not seules or m[0] in seules]
        travailleurs = int(os.environ.get('GENIIUS_TRAVAILLEURS', max(1, (os.cpu_count() or 2) - 1)))
        with concurrent.futures.ThreadPoolExecutor(travailleurs) as pool:
            for mid, clause, desc, code, noms in pool.map(executer, a_faire):
                res[mid] = dict(clause=clause, description=desc, statut='detectee' if code != 0 else 'SURVIT',
                                tests=noms[:5])
                print(mid, res[mid]['statut'], noms[:3], flush=True)
                json.dump(res, open(chemin, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    finally:
        shutil.rmtree(instantane, ignore_errors=True)
    ecrire_rapport(res)


ORIGINES = (('N', 'Mutations indépendantes du contrôle B (mesure de référence)'),
            ('M3', "Règles nouvelles de la V1.6 (banc de l'auteur)"),
            ('M', "Banc de l'auteur réciblé (M001 à M218)"))


def origine(mid):
    return next(nom for prefixe, nom in ORIGINES if mid.startswith(prefixe))


def ecrire_rapport(res):
    detectees = sum(r['statut'] == 'detectee' for r in res.values())
    lignes = ['# Banc de mutations — résultats', '',
              f'**{detectees} mutations détectées sur {len(res)}.** '
              'Une mutation détectée fait échouer au moins un test (mode `-f` : premier échec).', '',
              '| Origine | Détectées | Total | Survivantes |', '|---|---|---|---|']
    for _, nom in ORIGINES:
        ids = [m for m in res if origine(m) == nom]
        surv = sorted(m for m in ids if res[m]['statut'] != 'detectee')
        lignes.append(f"| {nom} | {len(ids) - len(surv)} | {len(ids)} | {', '.join(surv) or '—'} |")
    lignes += ['', '| Mutation | Clause | Description | Statut | Premier test en échec |', '|---|---|---|---|---|']
    for mid in sorted(res):
        r = res[mid]
        lignes.append(f"| {mid} | {r['clause']} | {r['description']} | {r['statut']} | "
                      f"{', '.join(r['tests'][:1])} |")
    lignes += ['', 'Les survivantes sont instruites dans `JUSTIFICATIONS.md`.']
    open(os.path.join(ICI, 'RESULTATS.md'), 'w', encoding='utf-8').write('\n'.join(lignes) + '\n')


if __name__ == '__main__':
    main()
