"""Registre documentaire unifié ; aucune décision ouverte n'est ratifiée par extraction."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ARCH = ROOT / 'docs/07_ARCHITECTURE'
ALIASES = {
 'DEC-ARCH-01':['SEC-01','SEC-02','SEC-04','SEC-05','DEP-01'],
 'DEC-ARCH-02':['PER-01'], 'DEC-ARCH-03':['SYN-02','SYN-07'], 'DEC-ARCH-04':[],
 'DEC-ARCH-05':['SEC-03','SEC-04','SEC-05'], 'DEC-ARCH-06':['PER-01','PER-06'],
 'DEC-ARCH-07':['ASY-02','ASY-04','ASY-06','SEC-02'], 'DEC-ARCH-08':[],
 'DEC-ARCH-09':['SYN-05','DEP-02'], 'DEC-ARCH-10':['DEP-03','ASY-04'],
 'DEC-ARCH-11':['ASY-01','SYN-04','PER-02','PER-05','DEP-04'],
 'DEC-ARCH-12':['SYN-07','DEP-03'], 'DEC-ARCH-13':['ASY-05'],
 'DEC-ARCH-14':['PER-01','PER-03','PER-07'], 'DEC-ARCH-15':['PER-02','PER-07'],
 'DEC-ARCH-16':['DEP-01','DEP-02','DEP-04'], 'DEC-ARCH-17':[],
 'PAR-CDC-01':['ASY-04'], 'PAR-CDC-02':['ASY-04','SYN-06'], 'PAR-CDC-03':['SYN-02'],
 'PAR-CDC-04':['SEC-01','SEC-05'], 'PAR-CDC-05':['SYN-01','SYN-04'],
 'PAR-CDC-06':['ASY-03','ASY-06'], 'PAR-CDC-07':['ASY-03','DEP-04'],
 'PAR-CDC-08':['DEP-02'], 'PAR-CDC-09':['ASY-07','DEP-02'],
 'PAR-CDC-10':['DEP-02'], 'PAR-CDC-11':['PER-01','PER-03','PER-06'],
 'MPD-01':['SEC-04','ASY-04'], 'MPD-02':['SEC-01','SEC-05'], 'MPD-03':['SEC-04'],
 'MPD-04':['ASY-02','ASY-06'], 'MPD-05':['PER-05','SYN-04'], 'MPD-06':['SEC-01','SEC-04'],
}
OWNERS_DEC = ['Architecture/sécurité','Architecture/données','Architecture/Core/clients',
 'Architecture/Core','Architecture/sécurité','Données/exploitation','Architecture/exploitation/qualité',
 'Produit','Identité/produit/juridique','Qualité/Core','Architecture avec propriétaires concernés',
 'Architecture/API','Données/sécurité/architecture','Exploitation/sécurité','Stockage/exploitation',
 'Architecture/exploitation/porteur','Produit/sécurité (hors V1)']
OWNERS_PAR = ['Produit/données/qualité','Architecture/données','Produit/architecture','Core/sécurité',
 'Produit/gouvernance/sécurité','Architecture/exploitation','Produit/exploitation','Exploitation/qualité',
 'Exploitation/sécurité/juridique','Sécurité/exploitation','Produit/juridique/données']
POINT_DOCS = {
 'SEC':'GENIIUS_ARCHITECTURE_04_AUTORISATIONS_ISOLATION_CONCURRENCE.md',
 'SYN':'GENIIUS_ARCHITECTURE_05_SYNCHRONISATION_COMPATIBILITE_HORLOGE.md',
 'PER':'GENIIUS_ARCHITECTURE_06_PERSISTANCE_CONSERVATION_RESTAURATION.md',
 'ASY':'GENIIUS_ARCHITECTURE_07_ASYNCHRONE_PROPAGATION_DIMENSIONNEMENT.md',
 'DEP':'GENIIUS_ARCHITECTURE_08_DEPLOIEMENT.md',
}


def main():
    cdc_path = ROOT / 'docs/06_CDC_TECHNIQUE/GENIIUS_CDC_TECHNIQUE.md'
    cdc = cdc_path.read_text(encoding='utf-8')
    sources = [cdc_path] + [ARCH / name for name in POINT_DOCS.values()]
    decisions = {}
    for line_no, line in enumerate(cdc.splitlines(), 1):
        if not line.startswith('| '):
            continue
        cells = [cell.strip() for cell in line.split('|')[1:-1]]
        match = re.match(r'\*\*((?:DEC-ARCH|PAR-CDC)-\d{2})\*\* — (.+)', cells[0])
        mpd = re.fullmatch(r'MPD-\d{2}', cells[0])
        if not match and not mpd:
            continue
        ident = match[1] if match else cells[0]
        if ident in decisions:
            continue
        title = match[2] if match else cells[1]
        number = int(ident[-2:])
        owner = OWNERS_DEC[number-1] if ident.startswith('DEC') else OWNERS_PAR[number-1] if ident.startswith('PAR') else 'Architecture/MPD avec sécurité et propriétaire métier'
        stage = cells[1] if match and ident.startswith('DEC') else cells[2] if match else 'MPD ; MPD-04 avant validation capacité/délai'
        proof = cells[2] if match and ident.startswith('DEC') else cells[1] if match else cells[2]
        state = 'Actée en amont — ECD-05, emplacement logique seulement' if ident == 'DEC-ARCH-04' else 'Hors V1 — capacité préparée, décision ultérieure' if ident == 'DEC-ARCH-17' else 'Ouverte — instruction et preuve nécessaires'
        decisions[ident] = {'objet': title, 'responsable': owner, 'etape': stage,
                            'contrat_preuve': proof, 'statut': state, 'dossiers_lies': ALIASES[ident],
                            'source': str(cdc_path.relative_to(ROOT)).replace('\\','/'), 'ligne': line_no}
    assert len(decisions) == 34
    for prefix, filename in POINT_DOCS.items():
        for line_no, line in enumerate((ARCH / filename).read_text(encoding='utf-8').splitlines(), 1):
            match = re.match(r'^\| (' + prefix + r'-\d{2})(?: — ([^|]+))? \| ([^|]+) \| ([^|]+) \|', line)
            if not match:
                continue
            ident, title, owner, proof = match.groups()
            assert ident not in decisions
            decisions[ident] = {'objet': title.strip() if title else proof.strip(),
                                'responsable': owner.strip(), 'etape': 'Avant validation du mécanisme / campagne et livraison concernés',
                                'contrat_preuve': proof.strip(), 'statut': 'Ouverte — contrat rédigé, mécanisme/valeur/preuve à arrêter',
                                'dossiers_lies': [], 'source': 'docs/07_ARCHITECTURE/' + filename, 'ligne': line_no}
    assert len(decisions) == 64
    for item in decisions.values():
        assert set(item['dossiers_lies']) <= set(decisions)
    result = {'date':'2026-10-13', 'version':'Registre architecture V0.1 candidat',
              'contrainte_porteur':'100 €/mois avant abonnements ; décembre 2026 souhaité ; six prototypes avant lancement. Langage/hébergeur ouverts.',
              'decisions': decisions, 'gel_architecture':False, 'tests_executes':False,
              'sha256_sources':{str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in sources}}
    (ROOT / 'spec/validation/registre_architecture_v0_1.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
    out = ['# GENIIUS — Registre consolidé des décisions d’architecture V0.1','',
           '**13 octobre 2026 — candidat, non gelé.** Le porteur impose 100 €/mois avant abonnements et souhaite les premiers abonnements en décembre 2026 ; les six prototypes passent avant lancement. Langage/hébergeur restent ouverts. Ce registre conserve les identifiants et relie les travaux ; il ne ratifie aucune valeur ou technologie ouverte.','',
           '64 entrées : 34 références du CDC (17 DEC-ARCH, 11 PAR-CDC, 6 MPD), 26 points SEC/SYN/PER/ASY et 4 DEP. Ces références se recouvrent : elles ne sont pas 64 décisions techniques indépendantes. DEC-ARCH-04 est actée en amont sur l’emplacement logique ; DEC-ARCH-17 est hors V1. Les 62 autres entrées demeurent ouvertes, même si un contrat est déjà rédigé.','',
           '## Baselines et propositions','',
           '- Arrêté en amont : monolithe modulaire, base relationnelle canonique initialement unifiée, stockage objet distinct, serveur d’autorisation, versions/provenance et règles hors ligne du CDC.',
           '- Candidat : ADR-CORE-001 à 016, découpage des modules, garde globale, mécanismes de réception/horloge, registres, baux et topologie. Un ADR rédigé ne signifie pas décision ratifiée ni preuve exécutée.',
           '- À démontrer : toutes les preuves et valeurs de ce tableau avant leur étape ; aucun seuil P0 abandonné pour passer un budget ou une latence.','',
           '## Registre unique','', '| Identifiant | Objet / contrat | Responsable | Étape | Statut | Dossiers associés | Source |','|---|---|---|---|---|---|---|']
    for ident,item in decisions.items():
        relative = '../' + item['source'].removeprefix('docs/')
        if item['source'].startswith('docs/07_ARCHITECTURE/'):
            relative = Path(item['source']).name
        out.append('| '+ ' | '.join([ident,item['objet'].replace('|','/'),item['responsable'],item['etape'],item['statut'],', '.join(item['dossiers_lies']) or 'Contrat et preuve dans la source',f'[{item["source"]}:{item["ligne"]}]({relative})'])+' |')
    out += ['', '## Ordre de résolution et dépendances', '',
            '| Lot | Décisions et dépendances | Sortie requise |', '|---|---|---|',
            '| L01 — Concurrence/autorité | SEC-01/03/05, MPD-02/06 ; avant sorties protégées, sync et stockage | PT01, ordre droits/commit/échéance et remise au transport démontrés. |',
            '| L02 — Client/temps | SYN-01/02/04/05/07, PAR-CDC-03/05 ; dépend de L01 | PT03, capacités par OS, durée et fenêtre produit explicites. |',
            '| L03 — Durabilité/PRA | PER-01 à 07, SYN-03, MPD-05 ; dépend d’autorité et identités d’effets | PT04, intention/commit/accusé et restauration sans résurrection. |',
            '| L04 — Propagation/capacité | ASY-01 à 07, MPD-04, PAR-CDC-01/02/06/07 ; coût et contexte de L01/L03 | PT05, générations/baux, profil et délai maximal fixés après mesure. |',
            '| L05 — Recherche/diffusion | SEC-04, MPD-01/03 ; mêmes graphes/autorité de L01, profils de L04 | PT02, facettes/rangs/UQ/délais sans oracle. |',
            '| L06 — Pile/déploiement/produit | DEC-ARCH-08/09/10/11/12/13/16, DEP-01 à 04 ; verdicts des prototypes | PT06, alternatives/coût/compétences, nomination et procédure de livraison. |', '',
            'Les lots décrivent des dépendances logiques, pas un calendrier chiffré. Les prototypes peuvent préparer leurs bancs en parallèle ; ils ne déclarent pas une garantie validée en l’absence de leur prérequis.', '',
            '## Règle de clôture', '',
            'Chaque fermeture précise décision et alternatives, auteur habilité à décider, date, versions exactes, preuves/corpus/traces, conséquences, contraintes et point de réexamen. Une valeur de durée/coût n’est pas reprise d’un exemple. Un échec reste un constat avec disposition ; une preuve documentaire ne ferme pas une preuve d’infrastructure. Les nominations sont à faire avant décision/campagne.', '',
            'DEC-ARCH-02 exige aussi une épreuve d’identifiants pérennes/résolution/tombstones filtrés ; DEC-ARCH-08 la liste des langues V1 (au moins deux dont français) ; DEC-ARCH-09 les procédures d’identité/récupération/succession ; PAR-CDC-09/10/11 les politiques opérationnelles/juridiques. Ces sujets ne sont pas clos par leurs liens vers un dossier technique.', '',
            '## Liens et preuves documentaires', '',
            '- [Vues de déploiement](GENIIUS_ARCHITECTURE_08_DEPLOIEMENT.md).',
            '- [Alternatives et prototypes](GENIIUS_ARCHITECTURE_09_ALTERNATIVES_TECHNOLOGIQUES.md) : PT01 à PT06, sources officielles consultées.',
            '- [Contrôles consolidés](preuves/CONTROLES_CONSOLIDATION_V0_1.json) ; source `spec/validation/registre_architecture_v0_1.json`, génération `consolider_decisions_architecture.py`, contrôle `controler_consolidation_architecture.py`.', '',
            'L’architecture reste candidate ; aucun prototype/deploiement/benchmark n’a été exécuté pour ce jalon et aucune technologie n’est gelée.']
    (ARCH / 'GENIIUS_ARCHITECTURE_10_REGISTRE_DECISIONS.md').write_text('\n'.join(out)+'\n',encoding='utf-8')
    print('64 références consolidées : 62 ouvertes, une actée amont, une hors V1 ; aucun choix technologique gelé.')


if __name__ == '__main__':
    main()
