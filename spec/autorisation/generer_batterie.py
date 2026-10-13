"""Génère la batterie V1.6 (Markdown) à partir des docstrings des tests.

Usage : python generer_batterie.py
La batterie ne se modifie jamais à la main : on modifie le test, puis on régénère.
"""
import ast
import pathlib
import re

ICI = pathlib.Path(__file__).parent
SOURCE = ICI / 'tests' / 'test_scenarios.py'
ATTAQUES = ICI / 'tests' / 'test_attaques.py'
CONTROLES = ICI / 'tests' / 'test_controles_v15.py'
CIBLE = ICI.parent.parent / 'docs' / '04_CONTRAT_AUTORISATION' / 'GENIIUS_BATTERIE_SCENARIOS_AUTORISATION.md'

# Scénarios modifiés en V1.6 (décisions H-1 à H-6, CT-28, et tableau A du contrôle B V1.5).
MODIFIES = {
    'S-01': 'Fondement corrigé : le refus vient de A1 (contrôle B, A-03).',
    'S-02': 'Fondement corrigé : A1, § 2.5 (contrôle B, A-03).',
    'S-04': 'Fondement corrigé : § 7.1, § 10.2 (contrôle B, A-04).',
    'S-05': 'Fondement corrigé : A1, A2 (contrôle B, A-03).',
    'S-09': 'Fondement « § 8.1 (1) » (contrôle B, A-08).',
    'S-11': 'Jumeau construit par `tests/outils.py` ; type de la cible vérifié (contrôle B, A-18, B-01).',
    'S-21': 'Fondement « § 8.1 (1) » (contrôle B, A-08).',
    'S-24': 'Fondement corrigé : § 9.1 (contrôle B, A-05).',
    'S-33': 'Le cédant conserve l’HP d’un titulaire tiers (CT-28).',
    'S-37': 'Porte sur une habilitation close au transfert (contrôle B, A-15).',
    'S-48': 'Jumeau construit par `tests/outils.py` (contrôle B, B-01).',
    'S-51': 'Masque et relation posés par des opérations publiques (contrôle B, A-21).',
    'S-53': 'L’ajout à une sélection partagée est une proposition (CM-21 : `proposer_ajout` retiré).',
    'S-57': 'Attendu : proposition, puis activation et accès du tiers (contrôle B, A-13).',
    'S-85': 'Réémission plus large refusée dès l’annonce.',
    'S-87': 'Attendu « introuvable » (contrôle B, A-01).',
    'S-95': 'Toutes les notifications comparées (contrôle B, A-12).',
    'S-99': 'Journaux comparés au jumeau ; aucune ligne de protection (CT-20, contrôle B, A-11).',
    'S-107': 'Conservation vérifiée par la lecture de l’auteur (contrôle B, A-19).',
    'S-119': 'Reformulé : un ancien propriétaire ne transfère pas (contrôle B, A-06).',
    'S-121': 'Consentement par acte (H-6c).',
    'S-122': 'Jumeau construit par `tests/outils.py` (contrôle B, B-01).',
    'S-123': 'Décès constaté par la voie contractuelle (contrôle B, A-14).',
    'S-163': 'Attendu inversé (H-2a) : admission requise, même pour un rôle de son propre espace.',
    'S-170': 'Fondement : exclusion du signataire (contrôle B, A-07).',
    'S-236': 'Fondement « § 2.1 ; § 7.2 ; § 9.3 » (contrôle B, A-09).',
    'S-251': 'Rangs lus par `lire_serie`, par acteur (H-6e).',
    'S-261': 'Effet observé : la copie protégée n’est pas redistribuable (contrôle B, A-16).',
    'S-276': 'Oracle observationnel : le droit lui-même (contrôle B, A-10).',
}

def champs(doc):
    sid = doc.strip().splitlines()[0].strip()
    res = {'id': sid}
    cle = None
    for ligne in doc.strip().splitlines()[1:]:
        ligne = ligne.strip()
        m = re.match(r'^(Pré|Op|Attendu|Fondement) : (.*)$', ligne)
        if m:
            cle = m.group(1)
            res[cle] = m.group(2)
        elif cle and ligne:
            res[cle] += ' ' + ligne
    return res


def main():
    arbre = ast.parse(SOURCE.read_text(encoding='utf-8'))
    sections = []
    for c in arbre.body:
        if isinstance(c, ast.ClassDef) and ast.get_docstring(c):
            lignes = []
            for f in c.body:
                if isinstance(f, ast.FunctionDef) and f.name.startswith('test_S_'):
                    lignes.append((f.name, champs(ast.get_docstring(f))))
            sections.append((ast.get_docstring(c), lignes))
    ids = [l['id'] for _, ls in sections for _, l in ls]
    nouveaux = sorted((i for i in ids if int(i[2:]) >= 149), key=lambda i: int(i[2:]))
    out = []
    w = out.append
    w('# GENIIUS — Batterie de scénarios du contrat d’autorisation')
    w('')
    w('**Version :** V1.6 — **baseline de régression du contrat comportemental gelé le 12/10/2026**. Elle remplace la V1.5 (291 scénarios).')
    w('')
    w('**Fichier généré** par `spec/autorisation/generer_batterie.py` à partir de '
      '`spec/autorisation/tests/` (scénarios, attaques, contrôles). Chaque ligne est un test automatisé : on modifie le test, '
      'puis on régénère ; on ne modifie jamais ce fichier à la main.')
    w('')
    w('**Référentiel :** [contrat d’autorisation V1.6](GENIIUS_CONTRAT_AUTORISATION.md). '
      'Les fondements citent ses clauses (§ n, A1 à A7, I-n, T-n).')
    w('')
    w('**Règles de la batterie**')
    w('- Chaque scénario a des préconditions atteignables, **une** opération (suivie, le cas échéant, '
      'de la consultation qui l’observe), un résultat binaire et observable, et un fondement qui existe dans le contrat.')
    w('- « **Refus** » : opération rejetée, rien n’est créé. « **Introuvable** » : réponse indistinguable d’une absence.')
    w('- Les identifiants V1.3 sont conservés ; les nouveaux commencent à S-149. S-124 n’est pas attribué.')
    w('- La batterie est une **base de régression**, pas une couverture exhaustive : elle est complétée par '
      '`test_proprietes.py` (invariants I-1 à I-14 sur des états aléatoires et sur les transitions qui peuvent les '
      'violer, comptages publiés par invariant dans `couverture_etats.json`) et `test_transitions.py` '
      '(matrices d’états et combinaisons).')
    w('- Les oracles n’appellent aucune fonction interne du modèle : observation par opérations publiques, état '
      'jumeau et transcriptions du texte dans `tests/outils.py`.')
    w('- Certaines préconditions sont des **faits externes** posés directement dans l’état (évaluation de '
      'diffusabilité, vérification d’identité, consentement retiré, effacement légal, obligation de conservation, '
      'subordination, liens d’intérêt) : le contrat ne leur donne pas d’opération (contrôle B, A-22).')
    w('')
    w('**Espaces types :** P (projet), ESP (espace transféré de C à K), CLM (les Colimaçons), F (autre espace), '
      'PRG (programme) et SP (sous-projet), Q et TS (réutilisation).')
    w('')
    w('**Acteurs types :** R0 racine et propriétaire de P ; RS, RS1, RS2, RS3 responsables scientifiques ; '
      'ADM, ADM1, ADM2, ADME administrateurs ; COL, TIT collaborateurs ; LEC lecteur ; INV invité ; '
      'C cédant ; K cessionnaire ; SUP1 à SUP4 membres indépendants de l’autorité de dérogation '
      '(SUP1b : second compte de SUP1) ; AUT autorité externe ; A bénéficiaire de dérogation ; '
      'V, W, X, Y, Z… tiers.')
    w('')
    for titre, lignes in sections:
        w(f'## {titre}')
        w('')
        w('| ID | Préconditions | Opération | Résultat attendu | Fondement |')
        w('|---|---|---|---|---|')
        for _, l in lignes:
            cellules = [l['id'], l.get('Pré', ''), l.get('Op', ''), l.get('Attendu', ''), l.get('Fondement', '')]
            w('| ' + ' | '.join(c.replace('|', '\\|') for c in cellules) + ' |')
        w('')
    arbre_a = ast.parse(ATTAQUES.read_text(encoding='utf-8'))
    w('## Non-régression des attaques du contrôle en aveugle A (V1.4)')
    w('')
    w('Chaque ligne est un test de `spec/autorisation/tests/test_attaques.py`. L’attendu est tiré du texte V1.6.')
    w('')
    w('| Attaque | Attendu et fondement |')
    w('|---|---|')
    n_att = 0
    for c in arbre_a.body:
        if isinstance(c, ast.ClassDef):
            for f in c.body:
                if isinstance(f, ast.FunctionDef) and f.name.startswith('test_a'):
                    doc = ' '.join(ast.get_docstring(f).split())
                    ident, _, reste = doc.partition(' — ')
                    w(f'| {ident} | {reste} |')
                    n_att += 1
    w('')
    arbre_c = ast.parse(CONTROLES.read_text(encoding='utf-8'))
    n_ctl = 0
    for c in arbre_c.body:
        if isinstance(c, ast.ClassDef) and c.name.startswith('Controle'):
            titre = {'ControleA': 'Attaques du contrôle en aveugle A (V1.5)',
                     'ControleB': 'Témoins des mutations survivantes du contrôle en aveugle B (V1.5)'}[c.name]
            w(f'## Non-régression : {titre}')
            w('')
            w('Chaque ligne est un test de `spec/autorisation/tests/test_controles_v15.py`. '
              'L’attendu est tiré du texte V1.6.')
            w('')
            w('| Test | Attendu et fondement |')
            w('|---|---|')
            for f in c.body:
                if isinstance(f, ast.FunctionDef) and f.name.startswith('test_'):
                    doc = ' '.join(ast.get_docstring(f).split())
                    ident, _, reste = doc.partition(' — ')
                    w(f'| {ident} | {reste.replace("|", "/")} |')
                    n_ctl += 1
            w('')
    w('## Contrôles indépendants de clôture V1.6')
    w('')
    w('| Test | Attendu et fondement |')
    w('|---|---|')
    n_cloture = 0
    arbre_cloture = ast.parse((ICI / 'tests' / 'test_cloture_v16.py').read_text(encoding='utf-8'))
    for c in arbre_cloture.body:
        if isinstance(c, ast.ClassDef):
            for f in c.body:
                if isinstance(f, ast.FunctionDef) and f.name.startswith('test_'):
                    doc = ' '.join((ast.get_docstring(f) or '').split()).replace('|', '/')
                    w(f'| {f.name} | {doc} |')
                    n_cloture += 1
    w('')
    w('## Bilan')
    w('')
    w(f'- **Scénarios : {len(ids)}**, dont {len(ids) - len(nouveaux)} repris de la V1.3 et {len(nouveaux)} '
      f'nouveaux depuis la V1.3 ({nouveaux[0]} à {nouveaux[-1]}).')
    w(f'- **Attaques de non-régression : {n_att}** (contrôle A V1.4).')
    w(f'- **Non-régression des contrôles V1.5 : {n_ctl}** (13 scripts du contrôle A, témoins du contrôle B).')
    w(f'- **Contrôles indépendants de clôture V1.6 : {n_cloture}** (P-1 à P-3 et défenses redondantes).')
    w('- **Tous automatisés** : `python -m unittest discover -s spec/autorisation/tests`.')
    w('')
    w('### Scénarios modifiés en V1.6')
    w('')
    w('| ID | Modification |')
    w('|---|---|')
    for k in sorted(MODIFIES, key=lambda i: int(i[2:]) if i[2:].isdigit() else 10**6):
        w(f'| {k} | {MODIFIES[k]} |')
    w('')
    w('- **Statut : baseline de régression du contrat V1.6 gelé le 12/10/2026 ; paramètres et limites réservés au contrat.**')
    CIBLE.write_text('\n'.join(out) + '\n', encoding='utf-8')
    print(f'{len(ids)} scénarios -> {CIBLE}')


if __name__ == '__main__':
    main()
