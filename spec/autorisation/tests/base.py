"""Socle commun des tests du modèle de référence (contrat d'autorisation V1.6)."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from modele import Systeme  # noqa: E402

ACTEURS = ['R0', 'RS', 'RS1', 'RS2', 'RS3', 'ADM', 'ADM1', 'ADM2', 'ADME', 'COL', 'COL2', 'LEC', 'TIT', 'TIT2',
           'M', 'M1', 'M2', 'N', 'N2', 'INV', 'V', 'V1', 'V2', 'V3', 'VA', 'VB', 'T', 'W', 'X', 'Y', 'Z', 'ZZ',
           'B', 'AC', 'AD2', 'EXP', 'K', 'C', 'RC', 'CC', 'RF', 'AF', 'RG', 'XA', 'RSP', 'QQ', 'RT', 'RA', 'RB',
           'A', 'SUP1', 'SUP2', 'SUP3', 'SUP4', 'AUT']


class Base(unittest.TestCase):
    def setUp(self):
        s = self.s = Systeme()
        for a in ACTEURS:
            s.ajouter_acteur(a)
        s.ajouter_acteur('SUP1b', personne='SUP1')        # second compte de la même personne
        s.ajouter_acteur('AMORCE', institutionnel=True)
        s.autorite_derogation |= {'SUP1', 'SUP1b', 'SUP2', 'SUP3', 'SUP4'}
        s.autorites_externes.add('AUT')

    # -- assertions
    def ok(self, r):
        self.assertTrue(r.ok, r)
        return r.valeur

    def refus(self, r):
        self.assertFalse(r.ok, r)

    def accorde(self, a, oid, op='voir', **kw):
        r = self.s.acces(a, oid, op, **kw)
        self.assertTrue(r.ok, r)

    def refuse(self, a, oid, op='voir', **kw):
        """Refus explicite : l'acteur connaît l'existence de la cible (§ 14)."""
        r = self.s.acces(a, oid, op, **kw)
        self.assertEqual(r.code, 'refus', r)

    def absent(self, a, oid, op='voir', **kw):
        """Introuvable : réponse indistinguable d'une absence (§ 14, § 15)."""
        r = self.s.acces(a, oid, op, **kw)
        self.assertEqual(r.code, 'introuvable', r)

    def instantane(self):
        """État du système hors canaux d'information (notifications, audit, cache) : « rien n'est appliqué »."""
        import copy
        return copy.deepcopy({k: v for k, v in self.s.__dict__.items()
                              if k not in ('notifications', 'audit', '_cache', 'diagnostic_cache')})

    # -- constructions
    def nomme(self, par, E, x, role, **kw):
        h = self.ok(self.s.nommer(par, E, x, role, **kw))
        if role == 'RS':
            self.ok(self.s.accepter_nomination(x, h))
        return h

    def obj(self, a, E='P', perso=False, **kw):
        return self.ok(self.s.creer_objet(a, E, personnel=perso, **kw))

    def deleg(self, a, ben, actions, perim, **kw):
        return self.ok(self.s.deleguer(a, ben, actions, perim, **kw))

    def projet(self):
        """Espace P : R0 propriétaire et racine ; RS et RS2 nommés RS par R0 ; COL et TIT collaborateurs ;
        LEC lecteur ; ADM administrateur ; o objet du contenu ; priv objet privé de TIT."""
        s = self.s
        self.ok(s.creer_espace('R0', 'P'))
        self.h_RS = self.nomme('R0', 'P', 'RS', 'RS')
        self.h_RS2 = self.nomme('R0', 'P', 'RS2', 'RS')
        self.h_COL = self.nomme('R0', 'P', 'COL', 'collaborateur')
        self.h_TIT = self.nomme('R0', 'P', 'TIT', 'collaborateur')
        self.h_LEC = self.nomme('R0', 'P', 'LEC', 'lecteur')
        self.ok(s.nommer_administrateur('R0', 'P', 'ADM'))
        self.o = self.obj('RS', titre='objet projet')
        self.priv = self.obj('TIT', perso=True, titre='note privée')

    def espace_transfere(self, preparer=True):
        """Espace ESP : C propriétaire et racine ; RS2 nommé RS par C ; ADME administrateur ;
        ot objet du contenu ; transfert préparé de C vers K."""
        s = self.s
        self.ok(s.creer_espace('C', 'ESP'))
        self.h_RS2e = self.nomme('C', 'ESP', 'RS2', 'RS')
        self.ok(s.nommer_administrateur('C', 'ESP', 'ADME'))
        self.ot = self.obj('C', 'ESP', titre='objet transfert')
        if preparer:
            self.tid = self.ok(s.preparer_transfert('C', 'ESP', 'K'))

    def presenter(self):
        self.ok(self.s.presenter('C', self.tid))
        return self.s.vue_transfert('K', self.tid).valeur['empreinte']

    def accepter(self, empreinte=None):
        if empreinte is None:
            empreinte = self.s.vue_transfert('K', self.tid).valeur['empreinte']
        return self.s.accepter_transfert('K', self.tid, empreinte)

    def transferer(self):
        self.presenter()
        self.ok(self.accepter())

    def colimacons(self):
        """Espace CLM (les Colimaçons) : RC racine ; CC collaborateur."""
        self.ok(self.s.creer_espace('RC', 'CLM'))
        self.nomme('RC', 'CLM', 'CC', 'collaborateur')

    def programme(self):
        """Programme PRG (RG racine, XA administrateur) avec le groupe « Coordination » ;
        sous-projet SP (RSP racine) avec l'objet osp."""
        s = self.s
        self.ok(s.creer_espace('RG', 'PRG'))
        self.ok(s.nommer_administrateur('RG', 'PRG', 'XA'))
        self.ok(s.creer_groupe('RG', 'PRG', 'Coordination'))
        self.ok(s.creer_espace('RSP', 'SP'))
        self.osp = self.obj('RSP', 'SP', titre='objet sous-projet')
