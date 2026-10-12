"""Tests de propriétés : les invariants I-1 à I-14 du contrat V1.6 (§ 4), vérifiés sur des états atteints par des
suites d'opérations aléatoires, et sur les transitions qui peuvent les violer.

Règles (critère de gel) :
- les oracles n'appellent pas les fonctions internes du modèle : ils observent les opérations publiques
  (`outils.droits_de`, `outils.pouvoirs_de`), comparent à un état jumeau construit par `outils.py`, ou
  appliquent une transcription du texte (`outils.frappe_existence`, `frappe_restriction`, `non_levable`) ;
- les états visés sont effectivement atteints : les comptages, par état et par invariant, sont publiés dans
  `couverture_etats.json` (tearDownModule) et `ComptageEtats` échoue si l'un d'eux n'est jamais atteint.

Graines fixes : un échec est reproductible. Volume : GENIIUS_GRAINES, GENIIUS_PAS.
"""
import collections
import copy
import json
import os
import random
import unittest

from base import Base  # noqa: F401  (chemin d'import du modèle)
from modele import Systeme, PROTECTIONS_INTERNES, PROFONDEUR_MAX, RENOUVELLEMENTS_MAX, \
    DUREE_MAX_DEROGATION, FINALITES, FINALITES_VERSION, FINALITES_UN_APPROBATEUR
import outils
from outils import comptes, droits_de, droits_personne, pouvoirs_personne, frappe_existence, \
    frappe_restriction, non_levable, cache_a, jumeau_sans, ascendants

GRAINES = int(os.environ.get('GENIIUS_GRAINES', '40'))
PAS = int(os.environ.get('GENIIUS_PAS', '50'))
SANS_COMPTAGE = bool(os.environ.get('GENIIUS_SANS_COMPTAGE'))
ICI = os.path.dirname(os.path.abspath(__file__))

ACTEURS = ['R0', 'RS', 'RS2', 'COL', 'LEC', 'TIT', 'ADM1', 'ADM2', 'V', 'W', 'K', 'RF', 'FC', 'GA', 'M', 'N',
           'SUP1', 'SUP2', 'SUP3', 'ADM1_bis', 'V_bis']
OPS_LECTURE = ('voir', 'editer', 'exporter')
OPS_PRIMAUTE = ('voir', 'commenter', 'editer', 'exporter')
ECRITURE_TEST = {'commenter', 'proposer', 'transcrire', 'editer', 'valider', 'contribuer_core'}   # § 1
ACCEPTATIONS = {'accepter_nomination', 'accepter_transfert', 'accepter_objet', 'accepter_succession_objet'}
FINALITES_TIREES = sorted(FINALITES[FINALITES_VERSION]) + ['hors liste']

COMPTES = collections.Counter()


def monde():
    s = Systeme()
    for a in ACTEURS + ['SONDE', 'AUT']:
        if a.endswith('_bis'):
            continue
        s.ajouter_acteur(a)
    s.ajouter_acteur('ADM1_bis', personne='ADM1')         # seconds comptes (G-1, H-5)
    s.ajouter_acteur('V_bis', personne='V')
    s.autorite_derogation |= {'SUP1', 'SUP2', 'SUP3'}
    s.autorites_externes.add('AUT')
    s.creer_espace('R0', 'P')
    for x, role in (('RS', 'RS'), ('RS2', 'RS'), ('COL', 'collaborateur'), ('TIT', 'collaborateur'),
                    ('LEC', 'lecteur')):
        h = s.nommer('R0', 'P', x, role).valeur
        if role == 'RS':
            s.accepter_nomination(x, h)
    s.nommer_administrateur('R0', 'P', 'ADM1')
    s.nommer_administrateur('R0', 'P', 'ADM2')
    s.creer_espace('RF', 'F')
    s.nommer('RF', 'F', 'FC', 'collaborateur')
    s.creer_espace('GA', 'GS')
    s.creer_groupe('GA', 'GS', 'g2')
    for i in range(4):
        s.creer_objet('RS', 'P', titre=f'o{i}', diffusable=(i % 2 == 0), sensible=(i == 3))
    for i in range(2):
        s.creer_objet('TIT', 'P', personnel=True, titre=f'p{i}')
    s.creer_objet('R0', 'P', personnel=True, titre='c0')
    s.creer_groupe('ADM1', 'P', 'G')
    # Structures de départ, pour que les transitions aléatoires partent d'états riches.
    o = sorted(x.id for x in s.objets.values() if x.titulaire is None)
    p0 = sorted(x.id for x in s.objets.values() if x.titulaire == 'TIT')[0]
    s.deleguer('RS', ('groupe', 'G'), ['voir'], ('contenu', 'P'))                       # approbation préalable
    s.ajouter_membre('ADM1', 'G', 'M')
    s.deleguer('RS', ('role', 'F', 'lecteur'), ['voir'], ('objet', o[0]), mode='notification')
    s.nommer('RF', 'F', 'V', 'lecteur')                                                  # admission automatique
    s.deleguer('TIT', ('acteur', 'V'), ['voir', 'commenter'], ('objet', p0), repartager=True)
    s.deleguer('TIT', ('acteur', 'W'), ['voir', 'commenter'], ('objet', p0), repartager=True)
    s.deleguer('V', ('acteur', 'N'), ['voir'], ('objet', p0), repartager=True)
    sel = s.creer_selection('RS', 'P', {o[1]}).valeur
    s.deleguer('RS', ('acteur', 'V'), ['voir'], ('selection', sel))
    s.creer_protection('RS2', 'embargo_existence', o[2], beneficiaires={('acteur', 'COL')})
    s.deleguer('RS', ('acteur', 'COL'), ['voir', 'reutiliser'], ('objet', o[0]))
    c0 = next(x.id for x in s.objets.values() if x.titulaire == 'R0')
    s.deleguer('R0', ('acteur', 'W'), ['voir'], ('objet', c0))                          # réémissions (§ 10.5)
    return s


class Generateur:
    """Tire des opérations (auteur, nom, arguments) dans l'état courant, avec un biais vers les opérations
    qui atteignent les états intéressants. Le générateur lit l'état pour choisir des arguments plausibles ;
    il ne sert jamais d'oracle."""

    POIDS = dict(deleguer=10, deleguer_chaine=8, clore=5, prolonger=3, confirmer=5, restreindre=2,
                 mettre_en_examen=3, lever_examen=2, nommer=5, accepter_nomination=3, refuser_nomination=1,
                 quitter=2, ajouter_membre=5, retirer_membre=1, admettre=6, retirer_admission=2,
                 creer_protection=6, ajouter_beneficiaire=2, agreer_membre=1, designer_gardien=2, lever_protection=2,
                 ajouter_destinataire=1, designer_gardien_orphelin=1, modifier_visibilite=2, creer_objet=2, avancer=3,
                 archiver=1, rouvrir=1, transfert=2, derogation=3, restriction_legale=1, lever_legale=1,
                 contestation=1, selection=3, reutiliser=3, deces=0, succession=0, retirer_fondement=1,
                 administrateur=1, verser=1, purger=1, lot=1, consentir=1)

    def __init__(self, s, rng, poids=None):
        self.s, self.r = s, rng
        self.poids = dict(self.POIDS, **(poids or {}))

    def acteur(self):
        return self.r.choice(ACTEURS)

    def objet(self):
        ids = [o.id for o in self.s.objets.values() if not o.purge]
        return self.r.choice(ids) if ids else 'o-inexistant'

    def hab(self):
        ids = [h.id for h in self.s.habs.values() if h.nature != 'SYS']
        return self.r.choice(ids) if ids else 'h-inexistant'

    def protection(self):
        ids = list(self.s.protections)
        return self.r.choice(ids) if ids else 'p-inexistante'

    def beneficiaire(self):
        c = self.r.random()
        if c < 0.5:
            return ('acteur', self.acteur())
        if c < 0.68:
            return ('groupe', self.r.choice(['G', 'g2']))
        if c < 0.9:
            return ('role', self.r.choice(['P', 'F']), self.r.choice(['collaborateur', 'lecteur']))
        return ('public',)

    def actions(self):
        return self.r.sample(['voir', 'commenter', 'editer', 'exporter'], self.r.randint(1, 2))

    def perimetre(self):
        c = self.r.random()
        if c < 0.6:
            return ('objet', self.objet())
        if c < 0.75:
            return ('objets', frozenset({self.objet(), self.objet()}))
        if c < 0.88 and self.s.selections:
            return ('selection', self.r.choice(sorted(self.s.selections)))
        return ('contenu', 'P')

    def echeance(self):
        return None if self.r.random() < 0.6 else self.s.now + self.r.randint(1, 20)

    def membres(self, b):
        s = self.s
        if b[0] == 'groupe':
            return sorted(s.groupes[b[1]].membres)
        if b[0] == 'role':
            return sorted(h.beneficiaire[1] for h in s.habs.values() if h.type == 'appartenance'
                          and h.espace == b[1] and h.role == b[2] and h.etat == 'active')
        return []

    def operation(self):
        r, s = self.r, self.s
        a = self.acteur()
        noms = list(self.poids)
        choix = r.choices(noms, weights=[self.poids[n] for n in noms])[0]
        proprio = s.espaces['P'].proprietaire
        if choix == 'deleguer':
            return a, 'deleguer', (a, self.beneficiaire(), self.actions(), self.perimetre()), dict(
                repartager=r.random() < 0.5, echeance=self.echeance(),
                mode=r.choice([None, 'approbation', 'notification']))
        if choix == 'deleguer_chaine':
            porteurs = [h for h in s.habs.values() if h.type == 'delegation' and h.repartager
                        and h.beneficiaire[0] == 'acteur' and h.etat == 'active']
            if not porteurs:
                return None
            h = r.choice(porteurs)
            b = h.beneficiaire[1]
            return b, 'deleguer', (b, ('acteur', self.acteur()), sorted(h.actions)[:1], h.perimetre), dict(
                repartager=r.random() < 0.6, echeance=h.echeance)
        if choix in ('clore', 'mettre_en_examen', 'lever_examen', 'retirer_fondement'):
            hid = self.hab()
            h = s.habs.get(hid)
            auteur = r.choice([a, proprio] + ([h.auteur] * 2 if h and h.auteur else []))
            return auteur, choix, (auteur, hid), {}
        if choix == 'confirmer':
            hp = [h for h in s.habs.values() if h.nature == 'HP' and h.etat == 'active']
            if not hp:
                return None
            h = r.choice(hp)
            cand = [x.beneficiaire[1] for x in s.habs.values() if x.repartager and x.beneficiaire[0] == 'acteur'
                    and x.etat == 'active'] + [o.titulaire for o in s.objets.values() if o.titulaire]
            x = r.choice(cand) if cand and r.random() < 0.8 else a
            return x, 'confirmer', (x, h.id), {}
        if choix == 'prolonger':
            return a, choix, (a, self.hab(), self.echeance()), {}
        if choix == 'restreindre':
            hid = self.hab()
            kw = r.choice([dict(actions=['voir']), dict(echeance=s.now + 3), dict(perimetre=('objet', self.objet()))])
            return a, choix, (a, hid), kw
        if choix == 'nommer':
            E = r.choice(['P', 'P', 'F'])
            par = r.choice([a, s.espaces[E].proprietaire])
            return par, choix, (par, E, self.acteur(), r.choice(['RS', 'collaborateur', 'lecteur', 'invite'])), {}
        if choix in ('accepter_nomination', 'refuser_nomination'):
            props = [h for h in s.habs.values() if h.etat == 'proposee']
            if not props:
                return None
            h = r.choice(props)
            return h.beneficiaire[1], choix, (h.beneficiaire[1], h.id), {}
        if choix == 'quitter':
            x = r.choice([a, 'RS2', 'COL', 'TIT', 'RS'])
            return x, choix, (x, 'P'), {}
        if choix in ('ajouter_membre', 'retirer_membre'):
            g = r.choice(['G', 'g2'])
            gestion = r.choice(['ADM1', 'ADM1_bis', 'ADM2', proprio]) if g == 'G' else 'GA'
            return gestion, choix, (gestion, g, self.acteur()), {}
        if choix == 'administrateur':
            nom = r.choice(['nommer_administrateur', 'revoquer_administrateur'])
            return proprio, nom, (proprio, 'P', self.acteur()), {}
        if choix == 'admettre':
            ouvertes = [h for h in s.habs.values() if h.type == 'delegation' and h.etat == 'active'
                        and h.beneficiaire[0] in ('groupe', 'role')]
            if not ouvertes:
                return None
            h = r.choice(ouvertes)
            x = r.choice(self.membres(h.beneficiaire) or [self.acteur()])
            admetteur = r.choice(['RS', 'RS2', proprio, h.auteur, a])
            return admetteur, 'admettre', (admetteur, h.id, x), {}
        if choix == 'retirer_admission':
            adms = [x for x in s.admissions.values() if x.etat == 'active']
            if not adms:
                return None
            adm = r.choice(adms)
            auteur = r.choice(['RS', s.habs[adm.hab].auteur, a])
            return auteur, choix, (auteur, adm.hab, adm.acteur), {}
        if choix == 'creer_protection':
            t = r.choice(sorted(PROTECTIONS_INTERNES))
            kw = {}
            if t.startswith('embargo'):
                kw['beneficiaires'] = {('acteur', self.acteur())} if r.random() < 0.5 else set()
                if r.random() < 0.2:
                    kw['beneficiaires'] = {('groupe', 'G')}
            else:
                kw['destinataires'] = {self.acteur()}
                if t == 'interdiction_action':
                    kw['actions'] = {r.choice(['voir', 'editer'])}
            createur = r.choice(['RS', 'RS2', 'TIT', a])
            return createur, choix, (createur, t, self.objet()), kw
        if choix in ('ajouter_beneficiaire', 'designer_gardien', 'ajouter_destinataire', 'lever_protection',
                     'agreer_membre'):
            p = s.protections.get(self.protection())
            auteur = r.choice(sorted(p.gardiens)) if p and p.gardiens and r.random() < 0.7 else a
            pid = p.id if p else 'p-inexistante'
            if choix == 'ajouter_beneficiaire':
                return auteur, choix, (auteur, pid, ('acteur', self.acteur())), {}
            if choix == 'agreer_membre':
                return auteur, choix, (auteur, pid, 'G', r.choice(sorted(s.groupes['G'].membres) or ['M'])), {}
            if choix == 'lever_protection':
                return auteur, choix, (auteur, pid), {}
            return auteur, choix, (auteur, pid, self.acteur()), {}
        if choix == 'designer_gardien_orphelin':
            orph = [p for p in s.protections.values() if p.etat == 'active' and not p.gardiens
                    and p.type in PROTECTIONS_INTERNES]
            if not orph:
                return None
            p = r.choice(orph)
            return None, choix, (r.choice([('SUP1', 'SUP2'), ('SUP2', 'SUP3')]), p.id, self.acteur()), dict(
                demandeur=r.choice([None, 'RS', 'TIT']))
        if choix == 'modifier_visibilite':
            return a, choix, (a, self.objet(), r.choice(['prive', 'projet', 'communaute', 'public'])), {}
        if choix == 'creer_objet':
            return a, choix, (a, 'P'), dict(personnel=r.random() < 0.5, titre='nouveau')
        if choix == 'avancer':
            return None, 'avancer', (r.randint(1, 5),), {}
        if choix in ('archiver', 'rouvrir'):
            return proprio, choix, (proprio, 'P'), {}
        if choix == 'derogation':
            appro = r.choice([('SUP1', 'SUP2'), ('SUP1',), ('SUP2', 'SUP3'), ('SUP1', 'SUP1')])
            gardiens = {p.id: sorted(p.gardiens)[0] for p in s.protections.values() if p.gardiens}
            if s.derogations and r.random() < 0.5:                 # renouvellements (§ 12.6)
                d = s.derogations[r.choice(sorted(s.derogations))]
                return None, 'accorder_derogation', (appro, r.choice([d.beneficiaire, 'V_bis']), sorted(d.cibles),
                                                     ['voir'], d.finalite, f'j{r.random()}', r.randint(1, 30)), dict(
                    accords_gardiens=gardiens)
            return None, 'accorder_derogation', (appro, self.acteur(), [self.objet()],
                                                 r.choice([['voir'], ['voir', 'exporter'], ['editer']]),
                                                 r.choice(FINALITES_TIREES), f'j{r.random()}',
                                                 r.randint(1, 35)), dict(accords_gardiens=gardiens)
        if choix == 'restriction_legale':
            if r.random() < 0.5:
                return None, 'creer_restriction_legale', (('SUP2', 'SUP3'), self.objet()), dict(autorite_levee='AUT')
            return None, 'enregistrer_restriction_externe', ('AUT', self.objet()), {}
        if choix == 'lever_legale':
            leg = [p for p in s.protections.values() if p.type == 'restriction_legale' and p.etat == 'active']
            if not leg:
                return None
            return None, 'lever_restriction_legale', ('AUT', r.choice(leg).id), {}
        if choix == 'contestation':
            leg = [p for p in s.protections.values() if p.type == 'restriction_legale' and p.etat == 'active']
            if not leg:
                return None
            p = r.choice(leg)
            if p.contestation == 'en_examen':
                return None, 'examiner_contestation', (('SUP1', 'SUP3'), p.id, r.choice(['maintien', 'annulation'])), {}
            auteur = r.choice(['TIT', 'RS', a])
            return auteur, 'contester', (auteur, p.id), {}
        if choix == 'selection':
            sels = sorted(s.selections)
            c = r.random()
            if not sels or c < 0.25:
                auteur = r.choice(['RS', 'TIT', a])
                return auteur, 'creer_selection', (auteur, 'P', {self.objet()}), {}
            sid = r.choice(sels)
            if c < 0.55:
                auteur = s.selections[sid].auteur
                return auteur, 'ajouter_a_selection', (auteur, sid, self.objet()), {}
            if c < 0.7:
                x = r.choice(['RS', proprio, s.selections[sid].auteur, a])
                nom = r.choice(['reduire_selection', 'revoquer_selection'])
                return x, nom, (x, sid, {self.objet()}) if nom == 'reduire_selection' else (x, sid), {}
            props = sorted(s.selections[sid].proposition)
            if not props:
                return None
            x = r.choice(['RS', proprio, s.selections[sid].auteur, a])
            return x, 'activer_proposition', (x, sid, r.choice(props)), {}
        if choix == 'reutiliser':
            return a, 'reutiliser', (a, self.objet(), 'P'), {}
        if choix == 'deces':
            return None, 'constater_deces', (('SUP1', 'SUP2'), r.choice(['TIT', 'COL', 'V', 'RS2'])), {}
        if choix == 'succession':
            gels = [p for p in s.protections.values() if p.type == 'gel_succession' and p.etat == 'active']
            if not gels:
                return None
            p = r.choice(gels)
            sort = r.choice(['maintien', 'purge', 'versement', 'titulaire'])
            return None, 'decider_succession', (('SUP2', 'SUP3'), p.cible, sort), dict(
                ayant_droit=r.choice(['W', 'N']), rs='RS', fondement='volontés')
        if choix == 'verser':
            perso = [o for o in s.objets.values() if o.titulaire and not o.purge]
            if not perso:
                return None
            o = r.choice(perso)
            return o.titulaire, 'verser', (o.titulaire, o.id, r.choice(['RS', 'RS2', a])), {}
        if choix == 'purger':
            perso = [o for o in s.objets.values() if o.titulaire and not o.purge]
            if not perso:
                return None
            o = r.choice(perso)
            return o.titulaire, 'renoncer', (o.titulaire, o.id), dict(sort='purge')
        if choix == 'lot':
            lots = sorted(s.lots)
            if not lots or r.random() < 0.4:
                auteur = r.choice(['RS', 'RS', 'TIT', a])
                contenu = [o.id for o in s.objets.values() if o.titulaire is None and o.espace == 'P' and not o.purge]
                objets = set(r.sample(contenu, min(2, len(contenu)))) if auteur == 'RS' and contenu else {self.objet()}
                return auteur, 'creer_lot', (auteur, 'P', objets), {}
            lid = r.choice(lots)
            auteur = s.lots[lid].auteur
            nom = r.choice(['deleguer_lot', 'deleguer_lot', 'clore_lot', 'rouvrir_lot'])
            if nom == 'deleguer_lot':
                return auteur, nom, (auteur, lid, ('acteur', self.acteur()), ['voir']), dict(echeance=s.now + 10)
            return auteur, nom, (auteur, lid), {}
        if choix == 'consentir':
            verrous = [(E, c) for E, e in s.espaces.items() for c in e.verrou]
            if not verrous:
                return None
            E, c = r.choice(verrous)
            p = s.espaces[E].proprietaire
            return p, 'consentir_reintegration', (p, E, c, r.choice(['HI', 'HP', 'admission', 'nomination'])), {}
        if choix == 'transfert':
            return self.transfert()
        return None

    def transfert(self):
        s, r = self.s, self.r
        tr = [t for t in s.transferts.values() if t.etat in ('prepare', 'presente', 'expire')]
        if not tr:
            proprio = s.espaces['P'].proprietaire
            cible = r.choice([x for x in ('K', 'RS2', 'V') if x != proprio])
            return proprio, 'preparer_transfert', (proprio, 'P', cible), {}
        t = tr[0]
        if t.etat in ('prepare', 'expire'):
            if r.random() < 0.08:
                return t.cedant, 'annuler_transfert', (t.cedant, t.id), {}
            for o in s.objets.values():
                if o.titulaire in comptes(s, t.cedant) and o.espace == t.espace and not o.purge \
                        and o.id not in t.voies:
                    voie = r.choice(['a', 'a', 'b', 'purge'])
                    return t.cedant, 'choisir_voie', (t.cedant, t.id, o.id, voie), dict(copie=r.random() < 0.3)
            hps = [h for h in s.habs.values() if h.nature == 'HP' and h.auteur == t.cedant and h.etat == 'active'
                   and h.id not in t.reemissions]
            if hps and r.random() < 0.5:
                return t.cedant, 'annoncer_reemission', (t.cedant, t.id, r.choice(hps).id), {}
            return t.cedant, 'presenter', (t.cedant, t.id), {}
        for oid, v in t.voies.items():
            if v == 'b' and oid not in t.acceptes_b:
                return t.cessionnaire, 'accepter_objet', (t.cessionnaire, t.id, oid), {}
        vue = s.vue_transfert(t.cessionnaire, t.id)
        emp = vue.valeur['empreinte'] if vue else ''
        return t.cessionnaire, 'accepter_transfert', (t.cessionnaire, t.id, emp), {}


def executer(s, op):
    auteur, nom, args, kw = op
    r = getattr(s, nom)(*args, **kw)
    if r is not None and getattr(r, 'ok', False):
        COMPTES['op ok : ' + nom] += 1
    elif r is not None and getattr(r, 'code', '') == 'gel':
        COMPTES['op gelée : ' + nom] += 1
    return r


def compter_etats(s):
    """Comptage des états visés par les invariants (publié, et exigé > 0)."""
    COMPTES['admission active'] += sum(a.etat == 'active' for a in s.admissions.values())
    COMPTES['admission automatique'] += sum(a.auto for a in s.admissions.values())
    COMPTES['admission automatique sur cible exigeante'] += sum(
        a.auto and a.etat == 'active' and any(s._exigeante(s.objets[i]) for i in s._objets_du_perimetre(
            s.habs[a.hab].perimetre)) for a in s.admissions.values())
    COMPTES['HP active'] += sum(h.nature == 'HP' and h.etat == 'active' for h in s.habs.values())
    COMPTES['HP en chaîne (auteur non titulaire)'] += sum(
        h.nature == 'HP' and h.etat == 'active' and all(s.objets[i].titulaire != h.auteur
                                                        for i in s._ids_bruts(h.perimetre) if i in s.objets)
        for h in s.habs.values())
    COMPTES['HP rompue'] += sum(any(e[1] == 'rupture' for e in h.trace) for h in s.habs.values())
    COMPTES['confirmation'] += sum(any(e[1] == 'confirmation' for e in h.trace) for h in s.habs.values())
    COMPTES['HI suspendue'] += sum(h.etat == 'suspendue' for h in s.habs.values())
    COMPTES['exclusion figée'] += sum(bool(h.exclusions) or any(h.excl_fondateurs.values())
                                      for h in s.habs.values())
    COMPTES['dérogation'] += len(s.derogations)
    COMPTES['dérogation renouvelée'] += sum(d.rang > 0 for d in s.derogations.values())
    COMPTES['restriction légale'] += sum(p.type == 'restriction_legale' for p in s.protections.values())
    COMPTES["protection d'existence"] += sum(p.type in ('embargo_existence', 'interdiction_existence')
                                            for p in s.protections.values())
    COMPTES['protection héritée'] += sum(bool(p.herite_de) for p in s.protections.values())
    COMPTES['protection orpheline'] += sum(p.orpheline_signalee for p in s.protections.values())
    COMPTES['transfert accepté'] += sum(t.etat == 'accepte' for t in s.transferts.values())
    COMPTES['présentation renouvelée'] += sum(t.presentations > 1 for t in s.transferts.values())
    COMPTES['admission différée'] += len(s.differes_espace) + sum(len(t.differes) for t in s.transferts.values())
    COMPTES['consentement de réintégration'] += sum(len(v) for e in s.espaces.values() for v in e.verrou.values())
    COMPTES['sélection avec proposition'] += sum(bool(x.proposition) for x in s.selections.values())
    COMPTES['copie réutilisée'] += sum(o.reutilisee for o in s.objets.values())
    COMPTES['espace archivé'] += sum(e.etat == 'archive' for e in s.espaces.values())
    COMPTES['gel de succession'] += sum(p.type == 'gel_succession' for p in s.protections.values())


def suite(graine, pas=PAS, controle=None, poids=None):
    rng = random.Random(graine)
    s = monde()
    g = Generateur(s, rng, poids)
    for _ in range(pas):
        op = g.operation()
        if op is None:
            continue
        if controle:
            controle(s, op)
        else:
            executer(s, op)
    compter_etats(s)
    return s


def etats(s):
    return ({h.id: h.etat for h in s.habs.values()}, {a.id: a.etat for a in s.admissions.values()},
            {d.id: d.etat for d in s.derogations.values()})


def sondes(s, x, oid):
    """Réponses de x à des opérations qui visent l'identifiant oid (§ 15 : réponses d'opérations)."""
    res = {}
    for op in ('voir', 'editer', 'exporter', 'commenter'):
        res[('acces', op)] = s.acces(x, oid, op).code
    for nom, appel in (
            ('deleguer', lambda t: t.deleguer(x, ('acteur', 'W'), ['voir'], ('objet', oid))),
            ('deleguer contenu', lambda t: t.deleguer(x, ('acteur', 'W'), ['voir'], ('contenu', 'P'))),
            ('nommer', lambda t: t.nommer(x, 'P', 'W', 'lecteur', perimetre={oid})),
            ('nommer contenu', lambda t: t.nommer(x, 'P', 'K', 'lecteur')),
            ('protection', lambda t: t.creer_protection(x, 'embargo_contenu', oid)),
            ('visibilite', lambda t: t.modifier_visibilite(x, oid, 'public')),
            ('base', lambda t: t.creer_base(x, oid, 'projet')),
            ('reutiliser', lambda t: t.reutiliser(x, oid, 'P')),
            ('selection', lambda t: t.creer_selection(x, 'P', {oid})),
            ('explication', lambda t: t.expliquer_acces(x, 'V', oid)),
            ('rendu', lambda t: t.rendre(x, oid))):
        t = copy.deepcopy(s)
        r = appel(t)
        res[nom] = (r.code, r.valeur if not r.ok else None)
    return res


def observations(s, x):
    """Tout ce que x peut constater (§ 15)."""
    obs = {}
    vis = s.rechercher(x, '')
    obs['recherche'] = vis
    obs['compte'] = s.compter(x)
    obs['rendus'] = {o: s.rendre(x, o).valeur for o in vis}
    obs['export'] = s.exporter(x, list(s.objets)).valeur
    for E in sorted(s.espaces):
        for nom in ('lister_habilitations', 'journaux', 'lister_diffusions'):
            r = getattr(s, nom)(x, E)
            obs[(nom, E)] = r.valeur if r else r.code
    obs['explications'] = {(y, o): (s.expliquer_acces(x, y, o).code, s.expliquer_acces(x, y, o).valeur)
                           for y in ACTEURS for o in vis}
    obs['acces'] = {(o, op): s.acces(x, o, op).code for o in vis for op in OPS_LECTURE}
    # P-3 validé le 12/10/2026, § 11.2 : seul le signalement minimal d'orpheline est une exception
    # explicite à I-5. Son destinataire et son contenu exact sont vérifiés séparément ci-dessous.
    obs['notifications'] = [m for m in s.notifications.get(x, [])
                            if not (m[0] == 'protection_orpheline' and x in s.autorite_derogation)]
    obs['replique'] = s.activer_replication(x, f'sonde-{x}', 'P').valeur
    for t in s.transferts.values():
        if t.cessionnaire == x and t.etat == 'presente':
            v = s.vue_transfert(x, t.id).valeur
            obs[('vue', t.id)] = (v['engagements'], v['apercu'], v['total_engagements'])
    return obs


def echeances_futures(*etats_, n=2):
    """Instants futurs où un droit peut changer sans acte (échéances des habilitations, des fondateurs, des
    dérogations, des protections, des présentations)."""
    t0 = etats_[0].now
    echs = set()
    for s in etats_:
        for h in s.habs.values():
            echs.add(h.echeance)
            echs |= set(h.fondateurs.values())
        echs |= {d.fin for d in s.derogations.values()}
        echs |= {p.fin for p in s.protections.values()}
        echs |= {t.expire_le for t in s.transferts.values()}
    return sorted(e for e in echs if e is not None and e > t0)[:n]


def avance(s, t):
    c = copy.deepcopy(s)
    c.avancer(t - c.now)
    return c


class Invariants(unittest.TestCase):

    def test_I01_proprietaire_unique_racine(self):
        """I-1 : tout espace non clos a un propriétaire unique, qui est sa racine (lecture des métadonnées)."""
        for g in range(GRAINES):
            s = suite(g)
            for E, esp in s.espaces.items():
                if esp.etat == 'clos':
                    continue
                lignes = s.lister_habilitations(esp.proprietaire, E).valeur['lignes']
                racines = [l for l in lignes if l['nature'] == 'SYS' and l['etat'] == 'active']
                self.assertEqual(len(racines), 1, (g, E))
                self.assertEqual(racines[0]['beneficiaire'], ('acteur', esp.proprietaire), (g, E))
                COMPTES['I-1 espaces vérifiés'] += 1

    def test_I02_pas_d_auto_elevation(self):
        """I-2 : aucun acte (hors acceptation) n'augmente l'union, sur tous les comptes de la personne de son auteur,
        des droits, pouvoirs de partage et de gouvernance et qualités de gardien ou de bénéficiaire, sur ce qui
        existait avant l'acte, ni maintenant ni aux échéances futures ; une réouverture ou une levée d'examen ne
        dépasse pas l'état d'avant la suspension."""

        def controle(s, op):
            auteur, nom, args, kw = op
            if auteur is None or nom in ACCEPTATIONS:
                executer(s, op)
                return
            objets = set(s.objets)
            prots = set(s.protections)
            espaces = set(s.espaces)
            avant = copy.deepcopy(s)
            avant_d = droits_personne(s, auteur)
            avant_p = pouvoirs_personne(s, auteur)
            r = executer(s, op)
            if r is None or not getattr(r, 'ok', False):
                COMPTES['I-2 actes refusés vérifiés'] += 1
            retabli = None
            if nom == 'lever_examen' and args[1] in avant.habs and avant.habs[args[1]].etat == 'suspendue':
                retabli = copy.deepcopy(avant)             # § 7.5 : jumeau où l'HI n'a jamais été suspendue
                retabli.habs[args[1]].etat = 'active'
                retabli.avancer(0)
            for t, apres_s, avant_s in [(None, s, avant)] + [(t, avance(s, t), avance(avant, t))
                                                           for t in echeances_futures(s, avant)]:
                gain = {x for x in droits_personne(apres_s, auteur) if x[0] in objets} - (
                    avant_d if t is None else droits_personne(avant_s, auteur))
                if nom == 'rouvrir':                      # § 5.1 : seules les écritures sur le contenu reviennent
                    gain = {(o, a) for o, a in gain
                            if not (a in ECRITURE_TEST and s.objets[o].titulaire is None and s.objets[o].espace == args[1])}
                if retabli is not None:                    # rétablir, sans dépasser l'état sans suspension
                    gain -= droits_personne(retabli if t is None else avance(retabli, t), auteur)
                if nom in ('verser', 'renoncer', 'decider_succession'):
                    # P-2 : uniquement les droits préexistants du contenu sur l'objet versé.
                    # Jumeau construit depuis l'état AVANT l'acte : aucune nouvelle habilitation,
                    # nomination ou admission n'est reprise depuis le résultat du versement.
                    # Les sondes publiques vérifient la borne de la transition ; les tests
                    # déterministes de clôture ont des attendus explicites indépendants.
                    verse = args[1]
                    jumeau = copy.deepcopy(avant_s)
                    if avant.objets[verse].titulaire is not None and s.objets[verse].titulaire is None:
                        jumeau.objets[verse].titulaire = None
                        if jumeau.objets[verse].visibilite == 'prive':
                            jumeau.objets[verse].visibilite = 'projet'
                        gain -= {x for x in droits_personne(jumeau, auteur) if x[0] == verse}
                self.assertEqual(gain, set(), (op, t))
                COMPTES['I-2 instants vérifiés'] += 1
            apres_p = {x for x in pouvoirs_personne(s, auteur)
                       if not (x[0] == 'repartager' and x[1] not in objets)
                       and not (x[0] in ('gardien', 'beneficiaire') and x[1] not in prots)
                       and not (x[0] in ('administrer', 'proprietaire') and x[1] not in espaces)}
            if nom in ('rouvrir', 'lever_examen', 'annuler_transfert'):
                return                                    # rétablissements (§ 5.1, § 7.5) ; fin du gel (§ 10.6)
            if nom in ('verser', 'renoncer', 'decider_succession'):
                verse = args[1]
                if avant.objets[verse].titulaire is not None and s.objets[verse].titulaire is None:
                    jumeau = copy.deepcopy(avant)
                    jumeau.objets[verse].titulaire = None
                    if jumeau.objets[verse].visibilite == 'prive':
                        jumeau.objets[verse].visibilite = 'projet'
                    permis = {x for x in pouvoirs_personne(jumeau, auteur)
                              if x[0] == 'repartager' and x[1] == verse}
                    apres_p -= permis
            self.assertLessEqual(apres_p, avant_p, (op, apres_p - avant_p))
            COMPTES['I-2 actes vérifiés'] += 1
        for g in range(GRAINES):
            suite(g, controle=controle)

    def test_I03_pas_d_elevation_reciproque(self):
        """I-3 : des actes de gestionnaires seuls, sur plusieurs ensembles et espaces (groupe de P, groupe d'un autre
        espace, rôle de F), n'augmentent les droits de contenu d'aucun d'eux, ni de leurs seconds comptes."""
        for g in range(GRAINES):
            rng = random.Random(1000 + g)
            s = monde()
            for b, acts in ((('groupe', 'G'), ['voir']), (('groupe', 'g2'), ['voir']),
                            (('role', 'F', 'lecteur'), ['voir', 'editer'])):
                libres = frozenset(o.id for o in s.objets.values() if o.titulaire is None and not o.sensible
                                   and not any(q.cible == o.id for q in s.protections.values()))
                self.assertTrue(s.deleguer('RS2', b, acts, ('objets', libres), mode='notification'), b)
            gest = {'ADM1': 'G', 'ADM1_bis': 'G', 'ADM2': 'G', 'GA': 'g2', 'RF': None}
            tous = list(gest)
            avant = set().union(*(droits_de(s, a) for a in tous))
            for _ in range(PAS):
                a = rng.choice(list(gest))
                x = rng.choice(tous + ['V', 'W'])
                if gest[a] is None:
                    if rng.random() < 0.7:
                        s.nommer(a, 'F', x, 'lecteur')
                    else:
                        s.quitter(x, 'F')
                else:
                    nom = rng.choice(['ajouter_membre', 'retirer_membre', 'preparer_invitation', 'admettre'])
                    if nom == 'preparer_invitation':
                        s.preparer_invitation(a, 'P', x)
                    elif nom == 'admettre':
                        for h in list(s.habs.values()):
                            if h.beneficiaire[0] in ('groupe', 'role'):
                                s.admettre(a, h.id, x)
                    else:
                        getattr(s, nom)(a, gest[a], x)
            apres = set().union(*(droits_de(s, a) for a in tous))
            self.assertLessEqual(apres, avant, g)
            COMPTES['I-3 suites vérifiées'] += 1

    def test_I04_propriete_sans_acces_implicite(self):
        """I-4 : propriétaire et administrateurs n'accèdent à aucun objet personnel d'autrui sans HP, admission,
        dérogation ou visibilité par défaut. Oracle : un jumeau où toutes les délégations sont closes."""
        for g in range(GRAINES):
            s = suite(g)
            jumeau = copy.deepcopy(s)
            for h in jumeau.habs.values():
                if h.type == 'delegation' and h.etat == 'active':
                    h.etat = 'close'
            for d in jumeau.derogations.values():
                d.etat = 'revoquee'
            for E, esp in s.espaces.items():
                for a in {esp.proprietaire} | esp.administrateurs:
                    for o in jumeau.objets.values():
                        if o.purge or o.titulaire is None or o.titulaire in comptes(s, a) \
                                or o.visibilite in ('communaute', 'public'):
                            continue
                        self.assertFalse(jumeau.acces(a, o.id, 'voir').ok, (g, a, o.id))
                        COMPTES['I-4 cas vérifiés'] += 1

    def test_I05_non_divulgation(self):
        """I-5 : observations et réponses d'opérations de x identiques avec ou sans un objet dont l'existence lui
        est protégée (jumeau construit par outils.py, transcription du § 2.4 par personne)."""
        cas = 0
        for g in range(GRAINES):
            s = suite(g, poids=dict(creer_protection=12, reutiliser=5))
            for x in ACTEURS:
                caches = [o.id for o in s.objets.values() if not o.purge and cache_a(s, x, o.id)]
                for oid in caches[:2]:
                    jumeau = jumeau_sans(s, oid)
                    self.assertEqual(observations(copy.deepcopy(s), x), observations(copy.deepcopy(jumeau), x),
                                     (g, x, oid))
                    self.assertEqual(sondes(s, x, oid), sondes(jumeau, x, oid), (g, x, oid))
                    cas += 1
        COMPTES['I-5 cas vérifiés'] += cas
        self.assertGreater(cas, 0, "aucun cas de protection d'existence généré")

    def test_I06_cache_coherent(self):
        """I-6 : après une clôture, une mise en examen, une restriction, une sortie de groupe, un retrait
        d'admission, un départ ou une expiration, une décision en cache n'est jamais servie si elle diffère de
        la décision recalculée."""
        declencheurs = {'clore', 'mettre_en_examen', 'restreindre', 'retirer_membre', 'retirer_admission',
                        'quitter', 'avancer', 'creer_protection', 'creer_restriction_legale'}

        def controle(s, op):
            auteur, nom, args, kw = op
            if nom not in declencheurs:
                executer(s, op)
                return
            for x in ACTEURS:
                for o in s.objets.values():
                    if not o.purge:
                        s.acces_en_ligne(x, o.id, 'voir')         # amorce le cache
            r = executer(s, op)
            if r is not None and not r:
                return
            for x in ACTEURS:
                for o in s.objets.values():
                    if not o.purge:
                        self.assertEqual(bool(s.acces_en_ligne(x, o.id, 'voir')), bool(s.acces(x, o.id, 'voir')),
                                         (op, x, o.id))
                        COMPTES['I-6 décisions vérifiées'] += 1
        for g in range(GRAINES):
            suite(g, controle=controle)

    def test_I06b_cloture_coupe_l_acces(self):
        """I-6 : un accès qui ne reposait que sur h disparaît à la clôture de h. Oracle : dans un jumeau où h est
        close d'avance, l'accès est refusé ; il doit l'être aussi, cache compris, après la clôture réelle."""
        verifies = 0
        for g in range(GRAINES):
            s = suite(g)
            for h in [h for h in s.habs.values() if h.type == 'delegation' and h.etat == 'active']:
                jumeau = copy.deepcopy(s)
                jumeau.habs[h.id].etat = 'close'
                jumeau.avancer(0)
                essai = copy.deepcopy(s)
                for x in ACTEURS:
                    for o in s.objets.values():
                        if not o.purge:
                            essai.acces_en_ligne(x, o.id, 'voir')
                auteur = essai.espaces[h.espace].proprietaire if h.nature == 'HI' else h.auteur
                if not essai.clore(auteur, h.id):
                    continue
                for x in ACTEURS:
                    for o in s.objets.values():
                        if not o.purge and not jumeau.acces(x, o.id, 'voir'):
                            self.assertFalse(essai.acces_en_ligne(x, o.id, 'voir'), (g, h.id, x, o.id))
                            verifies += 1
        COMPTES['I-6 clôtures vérifiées'] += verifies
        self.assertGreater(verifies, 0)

    def test_I07_pas_de_resurrection(self):
        """I-7 : aucune habilitation, admission ou dérogation close, expirée ou révoquée ne redevient active."""
        def controle(s, op):
            avant = etats(s)
            executer(s, op)
            apres = etats(s)
            for a, b in zip(avant, apres):
                for k, e in a.items():
                    if e in ('close', 'expiree', 'revoquee'):
                        self.assertEqual(b[k], e, (op, k))
                        COMPTES['I-7 états vérifiés'] += 1
        for g in range(GRAINES):
            suite(g, controle=controle)

    def test_I08_continuite_au_transfert(self):
        """I-8 : au transfert, une personne y distincte de C ne perd que des accès dépendant d'une HP dont la
        chaîne passait par C (personne) ou d'un objet purgé ; aucune HI d'un tiers, aucune nomination d'un tiers et
        aucune protection d'un tiers ne disparaît."""
        acceptes = [0]

        def controle(s, op):
            auteur, nom, args, kw = op
            if nom != 'accepter_transfert':
                executer(s, op)
                return
            tr = s.transferts[args[1]]
            C, K = tr.cedant, tr.cessionnaire
            cc = set(comptes(s, C))
            tiers = [x for x in ACTEURS if x not in cc]
            avant = {x: droits_de(s, x, OPS_LECTURE) for x in tiers}
            jumeau = copy.deepcopy(s)                     # oracle : C (personne) n'a plus rien
            for h in jumeau.habs.values():
                if h.etat == 'active' and ((h.nature == 'HP' and set(h.fondateurs) & cc)
                                           or (h.beneficiaire[0] == 'acteur' and h.beneficiaire[1] in cc)):
                    h.etat = 'close'
            for adm in jumeau.admissions.values():
                if adm.admis_par in cc:
                    adm.etat = 'close'
            jumeau.avancer(0)
            purges = {oid for oid, v in tr.voies.items() if v == 'purge'}
            hi_avant = {h.id: h.etat for h in s.habs.values() if h.nature == 'HI' and h.etat in ('active', 'suspendue')
                        and h.beneficiaire not in {('acteur', c) for c in cc | {K}}}
            prot_avant = {p.id for p in s.protections.values() if p.etat == 'active'
                          and p.createur is not None and p.createur not in cc}
            r = executer(s, op)
            if not r:
                return
            acceptes[0] += 1
            for x, d in avant.items():
                for oid, act in d - droits_de(s, x, OPS_LECTURE):
                    self.assertTrue(oid in purges or not jumeau.acces(x, oid, act), (x, oid, act))
                    COMPTES['I-8 pertes justifiées'] += 1
            for hid, e in hi_avant.items():
                self.assertEqual(s.habs[hid].etat, e, hid)
            for pid in prot_avant:
                self.assertEqual(s.protections[pid].etat, 'active', pid)
        for g in range(GRAINES * 2):
            suite(g, pas=PAS + 20, controle=controle, poids=dict(transfert=25))
        COMPTES['I-8 transferts vérifiés'] += acceptes[0]
        self.assertGreater(acceptes[0], 0, 'aucun transfert accepté dans les suites générées')
        if not SANS_COMPTAGE:
            self.assertGreater(COMPTES['I-8 pertes justifiées'], 0, "aucune perte d'accès examinée")

    def verifier_primaute(self, s, contexte):
        """I-9, oracle tiré du texte : frappe (§ 2.3, § 2.4), non-levables d'un ascendant (§ 13.11), niveau
        d'approbation des dérogations (§ 12.3), héritage des protections par les copies (§ 13.11)."""
        for o in s.objets.values():
            if o.purge:
                continue
            for c in [c for c in s.objets.values() if c.copie_de == o.id and not c.purge]:
                for p in s.protections.values():
                    if p.cible == o.id and p.etat == 'active' and p.type in PROTECTIONS_INTERNES:
                        self.assertTrue(any(q.cible == c.id and q.herite_de == p.id for q in s.protections.values()),
                                        (contexte, 'héritage', p.id, c.id))
                        COMPTES['I-9 héritages vérifiés'] += 1
            for x in ACTEURS:
                existence = [p for p in s.protections.values() if p.cible == o.id and frappe_existence(s, x, p)]
                finalites = {None} | {d.finalite for d in s.derogations.values()
                                      if d.etat == 'active' and d.beneficiaire in comptes(s, x)}
                for op, finalite in [(op, f) for op in OPS_PRIMAUTE for f in sorted(finalites, key=str)]:
                    r = s.acces(x, o.id, op, finalite)
                    COMPTES['I-9 décisions vérifiées'] += 1
                    restrictions = [p for p in s.protections.values()
                                    if p.cible == o.id and frappe_restriction(s, x, p, op)]
                    if not r.ok:
                        if existence:
                            self.assertEqual(r.code, 'introuvable', (contexte, x, o.id, op, finalite))
                        continue
                    self.assertFalse(non_levable(s, o.id), (contexte, 'non levable franchie', x, o.id, op))
                    if r.valeur[0] != 'derogation':
                        self.assertEqual(existence + restrictions, [], (contexte, 'protection franchie', x, o.id, op))
                        continue
                    COMPTES['I-9 dérogations vérifiées'] += 1
                    d = s.derogations[r.valeur[1]]
                    self.assertIn(op, ('voir', 'exporter'))
                    sensible = o.sensible or any(s.objets[a].sensible for a in ascendants(s, o.id))
                    frappe = existence + restrictions + [
                        p for p in s.protections.values() if p.cible == o.id and frappe_restriction(s, x, p, None)]
                    deux = ((o.titulaire is not None and o.visibilite != 'public') or sensible or bool(frappe)
                            or d.finalite not in FINALITES_UN_APPROBATEUR)
                    self.assertGreaterEqual(len(d.approbateurs), 2 if deux else 1, (contexte, d.id))
                    for p in existence + restrictions:
                        self.assertTrue(p.type == 'gel_succession' or p.gardiens, (contexte, 'orpheline', p.id))
                    for p in existence:
                        if p.type == 'gel_succession':
                            self.assertEqual(d.finalite, 'succession', (contexte, d.id))
                        else:
                            self.assertIn(d.accords_gardiens.get(p.id), [c for g in p.gardiens for c in comptes(s, g)],
                                          (contexte, d.id, p.id))

    def test_I09_primaute_des_protections(self):
        """I-9 : un acteur frappé par une protection d'existence ne connaît pas la cible ; frappé par une
        restriction pour une action, il ne l'exécute pas ; aucune restriction non levable n'est franchie ; seule
        une dérogation au niveau requis à l'instant de l'évaluation fait exception ; une copie n'est jamais
        accessible à qui une protection héritée ou une restriction non levable d'un ascendant l'interdit.
        Vérifié sur les états finaux et après chaque transition qui touche aux protections ou aux droits."""
        pertinentes = {'creer_protection', 'lever_protection', 'ajouter_beneficiaire', 'agreer_membre',
                       'ajouter_destinataire', 'designer_gardien', 'reutiliser', 'accorder_derogation',
                       'creer_restriction_legale', 'enregistrer_restriction_externe', 'lever_restriction_legale',
                       'examiner_contestation', 'constater_deces', 'decider_succession', 'avancer', 'deleguer',
                       'admettre', 'quitter', 'accepter_transfert', 'designer_gardien_orphelin'}

        def controle(s, op):
            r = executer(s, op)
            if op[1] in pertinentes and r is not None and getattr(r, 'ok', op[1] == 'avancer'):
                self.verifier_primaute(s, op)
                COMPTES['I-9 transitions vérifiées'] += 1
        for g in range(GRAINES):
            s = suite(g, controle=controle if g % 2 == 0 else None,
                      poids=dict(creer_protection=10, reutiliser=6, derogation=8, deces=1, succession=2))
            self.verifier_primaute(s, g)
        if not SANS_COMPTAGE:                                    # couverture (critère de gel), pas détection
            self.assertGreater(COMPTES['I-9 dérogations vérifiées'], 0, 'aucun accès par dérogation vérifié')
            self.assertGreater(COMPTES['I-9 héritages vérifiés'], 0, 'aucun héritage de protection vérifié')

    def test_I10_chaine_enracinee(self):
        """I-10 : toute HP active a un fondateur qui pourrait la recréer sans elle. Oracle : dans un jumeau où l'HP
        est close, un fondateur réussit l'opération publique `deleguer` des mêmes actions sur le même objet."""
        verifies = 0
        for g in range(GRAINES):
            s = suite(g, poids=dict(deleguer_chaine=15, confirmer=8))
            if any(h.etat == 'suspendue' for h in s.habs.values()):
                continue                                          # aval inopérant : I-10 vise les HP effectives
            for h in s.habs.values():
                if h.nature != 'HP' or h.etat != 'active' or h.perimetre[0] != 'objet':
                    continue
                o = h.perimetre[1]
                if o not in s.objets or s.objets[o].purge or any(p.cible == o and p.etat == 'active'
                                                                 for p in s.protections.values()):
                    continue
                if s.espaces[s.objets[o].espace].etat != 'actif' or non_levable(s, o):
                    continue
                if any(t.etat == 'presente' for t in s.transferts.values()):
                    continue                                      # gel (§ 10.6) : l'acte serait suspendu
                jumeau = copy.deepcopy(s)
                jumeau.habs[h.id].etat = 'close'
                fondateurs = [f for f, fe in h.fondateurs.items() if fe is None or s.now < fe]
                self.assertTrue(any(copy.deepcopy(jumeau).deleguer(f, ('acteur', 'SONDE'), sorted(h.actions),
                                                                   ('objet', o), echeance=fe)
                                    for f, fe in h.fondateurs.items() if f in fondateurs), (g, h.id))
                verifies += 1
        COMPTES['I-10 HP vérifiées'] += verifies
        self.assertGreater(verifies, 0)

    def test_I12_gardiens(self):
        """I-12 : un gardien d'embargo n'est pas frappé par lui ; aucun gardien n'apparaît hors des voies prévues,
        et un gardien désigné l'est par un gardien en fonction."""
        voies = {'creer_protection', 'designer_gardien', 'designer_gardien_orphelin', 'accepter_transfert',
                 'reutiliser'}

        def controle(s, op):
            auteur, nom, args, kw = op
            avant = {p.id: set(p.gardiens) for p in s.protections.values()}
            executer(s, op)
            for p in s.protections.values():
                nouveaux = p.gardiens - avant.get(p.id, set())
                if not nouveaux:
                    continue
                COMPTES['I-12 nouveaux gardiens vérifiés'] += 1
                self.assertIn(nom, voies, (op, p.id, nouveaux))
                if nom == 'designer_gardien':
                    self.assertIn(auteur, [c for g in avant.get(p.id, set()) for c in comptes(s, g)], (op, p.id))
                if p.herite_de and p.id not in avant:
                    origine = s.protections[p.herite_de]
                    self.assertLessEqual(p.gardiens, origine.gardiens | avant.get(p.herite_de, set()), (op, p.id))
            for p in s.protections.values():
                if p.type != 'embargo_existence' or p.etat != 'active' or len(
                        [q for q in s.protections.values() if q.cible == p.cible and q.etat == 'active']) != 1:
                    continue
                jumeau = copy.deepcopy(s)
                jumeau.protections[p.id].etat = 'levee'
                for gd in p.gardiens:
                    if jumeau.acces(gd, p.cible, 'voir'):
                        self.assertTrue(s.acces(gd, p.cible, 'voir'), (op, p.id, gd))
                        COMPTES['I-12 gardiens vérifiés'] += 1
        for g in range(GRAINES):
            suite(g, controle=controle, poids=dict(reutiliser=5, deces=1))


class InvariantsCibles(unittest.TestCase):
    """Invariants qui demandent une construction dédiée."""

    def test_I11_atomicite(self):
        """I-11 : une acceptation qui échoue en cours d'application ne laisse aucune trace."""
        s = monde()
        tid = s.preparer_transfert('R0', 'P', 'K').valeur
        for o in list(s.objets.values()):
            if o.titulaire == 'R0':
                s.choisir_voie('R0', tid, o.id, 'a')
        emp = s.presenter('R0', tid).valeur

        def etat():
            return copy.deepcopy({k: v for k, v in s.__dict__.items() if k != '_racine'})
        avant = etat()

        def panne(*a, **k):
            raise RuntimeError('panne simulée')
        s._racine = panne
        with self.assertRaises(RuntimeError):
            s.accepter_transfert('K', tid, emp)
        del s._racine
        self.assertEqual(s.espaces['P'].proprietaire, 'R0')
        self.assertEqual(etat(), avant)
        COMPTES['I-11 cas vérifiés'] += 1

    def test_I13_derogation_bornee(self):
        """I-13 : opérations fermées, durée maximale, finalités de la liste, renouvellements plafonnés. Oracle
        observationnel : le nombre de dérogations consécutives recoupées d'une même personne (§ 12.6) est recalculé
        ici, sans le chaînage du modèle."""
        rng = random.Random(7)
        s = monde()
        objets = [x.id for x in s.objets.values() if x.titulaire == 'TIT'] + \
            [x.id for x in s.objets.values() if x.titulaire is None][:2]
        accordees = []
        for _ in range(300):
            ops = rng.sample(['voir', 'exporter', 'editer', 'valider', 'repartager', 'administrer'],
                             rng.randint(1, 3))
            duree = rng.randint(1, 45)
            finalite = rng.choice(FINALITES_TIREES)
            cibles = set(rng.sample(objets, rng.randint(1, 2)))
            beneficiaire = rng.choice(['V', 'V_bis', 'W'])
            r = s.accorder_derogation(('SUP1', 'SUP2'), beneficiaire, cibles, ops, finalite, f'j{rng.random()}',
                                      duree)
            if r:
                self.assertLessEqual(set(ops), {'voir', 'exporter'})
                self.assertLessEqual(duree, DUREE_MAX_DEROGATION)
                self.assertIn(finalite, FINALITES[FINALITES_VERSION])
                rang = 0
                for (t, fin, cib, ben, rg) in accordees:
                    if set(cib) & cibles and comptes(s, ben) == comptes(s, beneficiaire) and s.now < fin + 30:
                        rang = max(rang, rg + 1)
                self.assertLessEqual(rang, RENOUVELLEMENTS_MAX)
                accordees.append((s.now, s.now + duree, cibles, beneficiaire, rang))
                COMPTES['I-13 dérogations vérifiées'] += 1
            s.avancer(rng.randint(0, 20))

    def test_I14_echec_ferme(self):
        """I-14 : une chaîne plus profonde que la borne donne un refus, sans modifier l'état."""
        import modele
        s = Systeme()
        noms = [f'U{i}' for i in range(PROFONDEUR_MAX + 4)]
        for n in ['TIT', 'R0'] + noms:
            s.ajouter_acteur(n)
        s.creer_espace('R0', 'P')
        s.nommer('R0', 'P', 'TIT', 'collaborateur')
        o = s.creer_objet('TIT', 'P', personnel=True).valeur
        borne = modele.PROFONDEUR_MAX
        modele.PROFONDEUR_MAX = 10 * borne
        try:
            precedent = 'TIT'
            for n in noms:
                self.assertTrue(s.deleguer(precedent, ('acteur', n), ['voir'], ('objet', o), repartager=True))
                precedent = n
        finally:
            modele.PROFONDEUR_MAX = borne
        etats_avant = {h.id: h.etat for h in s.habs.values()}
        self.assertEqual(s.acces(noms[-1], o, 'voir').code, 'introuvable')
        s.avancer(0)
        self.assertEqual({h.id: h.etat for h in s.habs.values()}, etats_avant)
        self.assertTrue(s.acces(noms[2], o, 'voir'))
        COMPTES['I-14 cas vérifiés'] += 1


class SondesEquivalences(unittest.TestCase):
    """Sondes des mutations déclarées équivalentes ou redondantes (mutations/JUSTIFICATIONS.md). Une sonde
    vérifie, sur les états générés et à chaque transition, que la condition supprimée par la mutation ne peut
    jamais servir. Elle lit l'état du modèle : c'est une sonde de justification, pas un oracle de sécurité."""

    def test_sondes(self):
        def proprietes(s):
            """Engagements présentés et en fenêtre : par clé, les attributs que comparent M032, M033, M330, M331."""
            res = {}
            for tr in s.transferts.values():
                if s._fenetre(tr):
                    for k, v in s._engagements(tr).items():
                        if k[0] in ('app', 'hab'):
                            res[(tr.id, k)] = v
            return res

        def controle(s, op):
            avant = {h.id: (h.actions, h.repartager) for h in s.habs.values()}
            engagements = proprietes(s)
            executer(s, op)
            for cle, w in proprietes(s).items():                  # M032, M033, M330, M331 : rien ne croît
                if cle not in engagements:
                    continue
                v = engagements[cle]
                self.assertLessEqual(w[6], v[6], (op, cle))                       # actions
                self.assertTrue(v[7] or not w[7], (op, cle))                      # repartager
                self.assertTrue(w[3] == v[3] or (v[3] is None or (w[3] is not None and w[3] <= v[3])), (op, cle))
                self.assertLessEqual(w[4], v[4], (op, cle))                       # état
                self.assertLessEqual(w[5] or 0, v[5] or 0, (op, cle))             # mode
                self.assertLessEqual(w[8], v[8], (op, cle))                       # fondateurs
                self.assertLessEqual(w[9], v[9], (op, cle))                       # effectivité
                COMPTES['sondes : engagements en fenêtre comparés'] += 1
            for o in s.objets.values():                            # M312 : tout ascendant reste dans l'état
                if o.copie_de:
                    self.assertIn(o.copie_de, s.objets, (op, o.id))
            for h in s.habs.values():
                if h.id in avant:                                  # M032 : aucune action ni repartager ajoutés
                    self.assertTrue(h.actions <= avant[h.id][0] and (avant[h.id][1] or not h.repartager), (op, h.id))
                if h.type == 'delegation' and h.mode == 'notification' and h.etat == 'active' \
                        and h.beneficiaire[0] in ('groupe', 'role'):  # M010 : gestionnaires ⊆ exclus de l'espace
                    self.assertLessEqual(s._gestionnaires(h.beneficiaire), s._gestionnaires_exclus(s._espace_hab(h)))
            for a in s.admissions.values():                        # M013 : l'auteur n'est jamais admis
                if a.etat == 'active':
                    self.assertFalse(s._meme(a.acteur, s.habs[a.hab].auteur), (op, a.id))
            for p in s.protections.values():                       # M104 : toute orpheline est signalée
                if p.etat == 'active' and p.type in PROTECTIONS_INTERNES and not p.gardiens \
                        and p.cible in s.objets and not s.objets[p.cible].purge:
                    self.assertTrue(p.orpheline_signalee, (op, p.id))
            COMPTES['sondes : transitions vérifiées'] += 1
        for g in range(GRAINES):
            suite(g, controle=controle, poids=dict(admettre=10, quitter=4, transfert=6, archiver=3, rouvrir=3))
            suite(g, controle=controle, poids=dict(transfert=25, confirmer=8, lever_examen=6, prolonger=6,
                                                   restreindre=4, reutiliser=4))


@unittest.skipIf(SANS_COMPTAGE, 'banc de mutations : le comptage ne détecte rien')
class ComptageEtats(unittest.TestCase):
    """Exige que chaque état visé soit atteint (critère de gel). Les comptages sont publiés par tearDownModule."""

    VISES = ['admission active', 'admission automatique', 'admission automatique sur cible exigeante', 'HP active',
             'HP en chaîne (auteur non titulaire)', 'HP rompue', 'confirmation', 'HI suspendue', 'exclusion figée',
             'dérogation', 'dérogation renouvelée', 'restriction légale', "protection d'existence",
             'protection héritée', 'protection orpheline', 'transfert accepté', 'présentation renouvelée',
             'admission différée', 'consentement de réintégration', 'sélection avec proposition', 'copie réutilisée',
             'espace archivé', 'gel de succession']

    TRANSITIONS = sorted({'deleguer', 'clore', 'prolonger', 'confirmer', 'restreindre', 'mettre_en_examen',
                          'lever_examen', 'retirer_fondement', 'nommer', 'accepter_nomination', 'refuser_nomination',
                          'quitter', 'ajouter_membre', 'retirer_membre', 'nommer_administrateur',
                          'revoquer_administrateur', 'admettre', 'retirer_admission', 'creer_protection',
                          'ajouter_beneficiaire', 'agreer_membre', 'designer_gardien', 'lever_protection',
                          'ajouter_destinataire', 'designer_gardien_orphelin', 'modifier_visibilite', 'creer_objet',
                          'archiver', 'rouvrir', 'accorder_derogation', 'creer_restriction_legale',
                          'enregistrer_restriction_externe', 'lever_restriction_legale', 'contester',
                          'examiner_contestation', 'creer_selection', 'ajouter_a_selection', 'reduire_selection',
                          'revoquer_selection', 'activer_proposition', 'reutiliser', 'constater_deces',
                          'decider_succession', 'verser', 'renoncer', 'creer_lot', 'deleguer_lot', 'clore_lot',
                          'consentir_reintegration', 'preparer_transfert', 'choisir_voie', 'annoncer_reemission',
                          'presenter', 'accepter_objet', 'accepter_transfert', 'annuler_transfert'})

    def test_zz_etats_atteints(self):
        for g in range(GRAINES):
            suite(g)
            suite(g, poids=dict(transfert=25, deces=1, consentir=4, avancer=12, derogation=8))
            suite(g, poids=dict(creer_protection=12, reutiliser=8, archiver=4, deleguer=14))
            suite(g, poids=dict(archiver=6, ajouter_membre=12, nommer=8, transfert=12, deleguer=14))
            suite(g, poids=dict(transfert=30, avancer=25))
            suite(g, poids=dict(lot=10, deces=3, succession=8, designer_gardien_orphelin=8, contestation=8,
                                restriction_legale=4, quitter=6))
        manquants = [v for v in self.VISES if COMPTES[v] == 0]
        self.assertEqual(manquants, [], 'états jamais atteints par le générateur')
        jamais = [t for t in self.TRANSITIONS if COMPTES['op ok : ' + t] == 0]
        self.assertEqual(jamais, [], 'transitions jamais réussies dans les suites générées')


def tearDownModule():
    """Publie les comptages d'états et, par invariant, le nombre de cas vérifiés (critère de gel)."""
    if os.environ.get('GENIIUS_SANS_COMPTAGE'):
        return
    par_invariant = {k: v for k, v in sorted(COMPTES.items()) if k.startswith('I-') or k.startswith('sondes')}
    etats_ = {k: v for k, v in sorted(COMPTES.items()) if k in ComptageEtats.VISES}
    operations = {k: v for k, v in sorted(COMPTES.items()) if k.startswith('op ')}
    with open(os.path.join(ICI, 'couverture_etats.json'), 'w', encoding='utf-8') as f:
        json.dump(dict(graines=GRAINES, pas=PAS, invariants=par_invariant, etats=etats_, operations=operations),
                  f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    unittest.main()
