"""Batterie de scénarios V1.6, automatisée.

Chaque test porte un scénario. Sa docstring contient les champs du tableau de la
batterie (Pré, Op, Attendu, Fondement) : le fichier
AUDIT-MLD/GENIIUS_BATTERIE_SCENARIOS_AUTORISATION_V1_6.md en est généré par
generer_batterie.py. On ne modifie jamais la batterie à la main.
"""
import copy
import unittest

from base import Base
from outils import jumeau_sans


class S01_Gouvernance(Base):
    """1. Auto-habilitation et gouvernance"""

    def setUp(self):
        super().setUp()
        self.projet()

    def test_S_01(self):
        """S-01
        Pré : TIT titulaire de l'objet `privé` priv ; LEC membre de P, sans droit sur priv.
        Op : LEC crée sur priv une habilitation à son profit.
        Attendu : **Refus** : LEC ne détient rien sur priv (A3 est isolé par S-273 et S-291).
        Fondement : A1 ; § 6.3"""
        self.refus(self.s.deleguer('LEC', ('acteur', 'LEC'), ['voir', 'editer'], ('objet', self.priv)))

    def test_S_02(self):
        """S-02
        Pré : RS de P ; TIT titulaire de l'objet `privé` priv.
        Op : RS crée sur priv une habilitation à son profit.
        Attendu : **Refus** : l'autorité de RS ne porte pas sur l'objet personnel d'autrui.
        Fondement : A1 ; § 2.5 ; § 6.3 ; § 7.1"""
        self.refus(self.s.deleguer('RS', ('acteur', 'RS'), ['voir'], ('objet', self.priv)))

    def test_S_69(self):
        """S-69
        Pré : RS de P ; TIT titulaire de priv, sans habilitation au profit de RS.
        Op : RS crée une habilitation `voir` sur priv au profit de LEC.
        Attendu : **Refus.**
        Fondement : A1 ; § 7.1"""
        self.refus(self.s.deleguer('RS', ('acteur', 'LEC'), ['voir'], ('objet', self.priv)))

    def test_S_03(self):
        """S-03
        Pré : ADM administrateur de P ; Y sans droit.
        Op : ADM crée une habilitation `voir` sur le contenu de P au profit de Y.
        Attendu : **Refus.**
        Fondement : A1 ; A2"""
        self.refus(self.s.deleguer('ADM', ('acteur', 'Y'), ['voir'], ('contenu', 'P')))

    def test_S_04(self):
        """S-04
        Pré : ADM administrateur de P.
        Op : ADM se nomme `lecteur` de P.
        Attendu : **Refus** : un administrateur ne nomme pas (l'interdit de se nommer est isolé par a17-6).
        Fondement : § 7.1 ; § 10.2"""
        self.refus(self.s.nommer('ADM', 'P', 'ADM', 'lecteur'))

    def test_S_05(self):
        """S-05
        Pré : ADM administrateur de P.
        Op : ADM crée une habilitation `voir` sur le contenu de P à son profit.
        Attendu : **Refus** : la gouvernance ne confère aucun droit à partager.
        Fondement : A1 ; A2"""
        self.refus(self.s.deleguer('ADM', ('acteur', 'ADM'), ['voir'], ('contenu', 'P')))

    def test_S_06(self):
        """S-06
        Pré : ADM gestionnaire du groupe G de P, qui n'a aucun droit.
        Op : ADM s'ajoute à G.
        Attendu : **Refus** : s'ajouter soi-même à un groupe est interdit, quel que soit le groupe.
        Fondement : A3 ; § 9.1"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        self.refus(self.s.ajouter_membre('ADM', 'G', 'ADM'))

    def test_S_07(self):
        """S-07
        Pré : ADM administrateur de P ; TIT titulaire de priv.
        Op : ADM crée une habilitation `voir` sur priv au profit du rôle `lecteur` de P.
        Attendu : **Refus.**
        Fondement : A1 ; A2 ; § 13.1"""
        self.refus(self.s.deleguer('ADM', ('role', 'P', 'lecteur'), ['voir'], ('objet', self.priv)))

    def test_S_08(self):
        """S-08
        Pré : programme PRG ; XA administrateur de PRG, sans rôle dans le sous-projet SP.
        Op : XA crée une habilitation `voir` sur le contenu de SP au profit du groupe « Coordination ».
        Attendu : **Refus.**
        Fondement : A1 ; A2"""
        self.programme()
        self.refus(self.s.deleguer('XA', ('groupe', 'Coordination'), ['voir'], ('contenu', 'SP')))

    def test_S_09(self):
        """S-09
        Pré : LEC lecteur de P, sans `repartager` ; groupe H de P.
        Op : LEC crée une habilitation `voir` sur le contenu de P au profit de H.
        Attendu : **Refus.**
        Fondement : A1 ; § 8.1 (1)"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'H'))
        self.refus(self.s.deleguer('LEC', ('groupe', 'H'), ['voir'], ('contenu', 'P')))

    def test_S_10(self):
        """S-10
        Pré : le propriétaire R0 a nommé Z administrateur de P ; Z n'a aucun rôle scientifique.
        Op : Z nomme ADM `lecteur` de P.
        Attendu : **Refus.**
        Fondement : A2 ; § 7.1"""
        self.ok(self.s.nommer_administrateur('R0', 'P', 'Z'))
        self.refus(self.s.nommer('Z', 'P', 'ADM', 'lecteur'))

    def test_S_11(self):
        """S-11
        Pré : ADM administrateur de P ; l'objet O sous embargo d'existence dont ADM n'est pas bénéficiaire, avec une habilitation R' sur O ; une habilitation R sur l'objet non protégé Q1.
        Op : ADM affiche la liste des habilitations de P, avec son total.
        Attendu : La liste et le total sont identiques à ceux de l'état où O n'existe pas ; R y figure, désignée par identifiant et type, sans titre.
        Fondement : § 10.3 ; § 15"""
        s = self.s
        O = self.obj('RS', titre='O')
        Q1 = self.obj('RS', titre='Q1')
        self.ok(s.creer_protection('RS', 'embargo_existence', O))
        R = self.deleg('RS', ('acteur', 'V'), ['voir'], ('objet', Q1))
        self.deleg('RS', ('acteur', 'W'), ['voir'], ('objet', O))
        liste = self.ok(s.lister_habilitations('ADM', 'P'))
        jumeau = jumeau_sans(s, O)
        self.assertEqual(liste, jumeau.lister_habilitations('ADM', 'P').valeur)
        ligne = next(l for l in liste['lignes'] if l['id'] == R)
        self.assertEqual(ligne['cible'], ('objet', Q1))
        self.assertTrue(all('titre' not in l for l in liste['lignes']))

    def test_S_12(self):
        """S-12
        Pré : ADM administrateur de P ; une lettre publiée et diffusée par courriel ; ADM sans droit de lecture sur son contenu.
        Op : ADM consulte les diffusions de P.
        Attendu : Visibles : date, canal, audience déclarée, nombre de destinataires, résultat. Le contenu de la lettre n'est pas visible.
        Fondement : § 10.3"""
        lettre = self.obj('RS', titre='lettre')
        self.ok(self.s.diffuser('RS', lettre, canal='courriel', audience='abonnés', destinataires=40,
                                contenu='Chers cousins'))
        d = self.ok(self.s.lister_diffusions('ADM', 'P'))
        self.assertEqual(set(d[0]), {'date', 'canal', 'audience', 'nombre', 'resultat'})
        self.absent('ADM', lettre)


class S02_Delegation(Base):
    """2. Habilitations institutionnelles et personnelles, chaînes, départs"""

    def setUp(self):
        super().setUp()
        self.projet()

    def test_S_13(self):
        """S-13
        Pré : RS de P.
        Op : RS confère à M l'appartenance `collaborateur` ; puis M consulte un objet du contenu de P.
        Attendu : **Accordé.**
        Fondement : § 7.1 ; § 7.2"""
        self.nomme('RS', 'P', 'M', 'collaborateur')
        self.accorde('M', self.o)

    def test_S_149(self):
        """S-149
        Pré : comme S-13.
        Op : M édite un objet du contenu de P.
        Attendu : **Accordé.**
        Fondement : § 7.1"""
        self.nomme('RS', 'P', 'M', 'collaborateur')
        self.accorde('M', self.o, 'editer')

    def test_S_14(self):
        """S-14
        Pré : TIT titulaire de priv ; V extérieur.
        Op : TIT crée une habilitation `voir` sur priv au profit de V ; puis V consulte priv.
        Attendu : **Accordé.**
        Fondement : § 6.1 ; § 8.1"""
        self.deleg('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv))
        self.accorde('V', self.priv)

    def test_S_15(self):
        """S-15
        Pré : RS1 nommé RS par R0 ; RS1 a nommé RS2, qui a accepté ; TIT titulaire de priv.
        Op : RS2 consulte priv.
        Attendu : **Introuvable.**
        Fondement : § 7.2 ; § 6.3"""
        self.nomme('R0', 'P', 'RS1', 'RS')
        self.ok(self.s.clore('R0', self.h_RS2))
        self.nomme('RS1', 'P', 'RS2', 'RS')
        self.absent('RS2', self.priv)

    def test_S_150(self):
        """S-150
        Pré : comme S-15.
        Op : RS2 consulte un objet du contenu de P.
        Attendu : **Accordé.**
        Fondement : § 7.1"""
        self.nomme('R0', 'P', 'RS1', 'RS')
        self.ok(self.s.clore('R0', self.h_RS2))
        self.nomme('RS1', 'P', 'RS2', 'RS')
        self.accorde('RS2', self.o)

    def test_S_16(self):
        """S-16
        Pré : RS, nommé par R0, a signé l'HI R (`voir`, contenu de P) au profit de V ; R0 révoque ensuite la nomination de RS.
        Op : V consulte un objet du contenu de P.
        Attendu : **Accordé** : l'HI survit à la révocation de son signataire (F-1).
        Fondement : § 2.1 ; § 7.3"""
        self.deleg('RS', ('acteur', 'V'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.clore('R0', self.h_RS))
        self.accorde('V', self.o)

    def test_S_17(self):
        """S-17
        Pré : TIT a accordé `voir` + `repartager` sur priv à V1 et à V2 ; V1 a délégué `voir` sur priv à T ; V2 a confirmé cette HP ; TIT clôt l'habilitation de V1.
        Op : T consulte priv.
        Attendu : **Accordé** : V2 reste fondateur valide.
        Fondement : § 8.2"""
        h1 = self.deleg('TIT', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True)
        self.deleg('TIT', ('acteur', 'V2'), ['voir'], ('objet', self.priv), repartager=True)
        h3 = self.deleg('V1', ('acteur', 'T'), ['voir'], ('objet', self.priv))
        self.ok(self.s.confirmer('V2', h3))
        self.ok(self.s.clore('TIT', h1))
        self.accorde('T', self.priv)

    def test_S_18(self):
        """S-18
        Pré : HI R signée par RS ; ADM n'a pas `voir`.
        Op : ADM prolonge R.
        Attendu : **Refus.**
        Fondement : T-04 ; A2"""
        R = self.deleg('RS', ('acteur', 'V'), ['voir'], ('contenu', 'P'), echeance=10)
        self.refus(self.s.prolonger('ADM', R, 20))

    def test_S_19(self):
        """S-19
        Pré : HI R au profit du groupe extérieur « Coordination », en `approbation préalable`, signée par RS ; RS2 RS de P ; AD2 membre de la Coordination, non admis.
        Op : RS2 admet AD2 ; puis AD2 consulte un objet du contenu de P.
        Attendu : **Accordé.**
        Fondement : § 9.3"""
        self.programme()
        self.ok(self.s.ajouter_membre('RG', 'Coordination', 'AD2'))
        R = self.deleg('RS', ('groupe', 'Coordination'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.admettre('RS2', R, 'AD2'))
        self.accorde('AD2', self.o)

    def test_S_20(self):
        """S-20
        Pré : HI R au profit de la Coordination, close la veille.
        Op : RS admet un membre au titre de R.
        Attendu : **Refus.**
        Fondement : A4"""
        self.programme()
        self.ok(self.s.ajouter_membre('RG', 'Coordination', 'AD2'))
        R = self.deleg('RS', ('groupe', 'Coordination'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.clore('RS', R))
        self.s.avancer(1)
        self.refus(self.s.admettre('RS', R, 'AD2'))

    def test_S_21(self):
        """S-21
        Pré : COL détient `voir` sur le contenu de P, sans `repartager`.
        Op : COL crée une habilitation `voir` sur le contenu de P au profit de T.
        Attendu : **Refus.**
        Fondement : A1 ; § 8.1 (1)"""
        self.refus(self.s.deleguer('COL', ('acteur', 'T'), ['voir'], ('contenu', 'P')))

    def test_S_22(self):
        """S-22
        Pré : RS a délégué `voir` + `repartager` sur o à COL (HI) ; COL a délégué `voir` sur o à T (HP).
        Op : RS clôt l'HI de COL ; puis T consulte o.
        Attendu : **Introuvable** (rupture de la chaîne).
        Fondement : § 8.2 ; T-11"""
        h1 = self.deleg('RS', ('acteur', 'COL'), ['voir'], ('objet', self.o), repartager=True)
        self.deleg('COL', ('acteur', 'T'), ['voir'], ('objet', self.o))
        self.ok(self.s.clore('RS', h1))
        self.absent('T', self.o)

    def test_S_23(self):
        """S-23
        Pré : TIT a délégué `voir` + `repartager` sur priv à VA ; VA a délégué `voir` + `repartager` sur priv à VB.
        Op : VB délègue `voir` + `repartager` sur priv à VA.
        Attendu : **Refus** (cycle).
        Fondement : § 8.2 (cycles)"""
        self.deleg('TIT', ('acteur', 'VA'), ['voir'], ('objet', self.priv), repartager=True)
        self.deleg('VA', ('acteur', 'VB'), ['voir'], ('objet', self.priv), repartager=True)
        self.refus(self.s.deleguer('VB', ('acteur', 'VA'), ['voir'], ('objet', self.priv), repartager=True))

    def test_S_108(self):
        """S-108
        Pré : RS (non racine) a nommé COL2 collaborateur.
        Op : RS quitte P ; puis COL2 consulte un objet du contenu de P.
        Attendu : **Accordé** : l'HI survit au départ de son signataire.
        Fondement : § 7.6 ; § 2.1"""
        self.nomme('RS', 'P', 'COL2', 'collaborateur')
        self.ok(self.s.quitter('RS', 'P'))
        self.accorde('COL2', self.o)

    def test_S_109(self):
        """S-109
        Pré : R0 racine de P ; RS2 existe.
        Op : R0 quitte P sans transfert.
        Attendu : **Refus.**
        Fondement : § 7.6"""
        self.refus(self.s.quitter('R0', 'P'))

    def test_S_110(self):
        """S-110
        Pré : TIT a délégué `voir` + `repartager` sur priv à V1 ; V1 à V2 ; V2 à V3, chaque fois avec `repartager`.
        Op : V3 confirme l'HP de V1 vers V2.
        Attendu : **Refus** : le droit de V3 passe par l'HP qu'il confirmerait.
        Fondement : § 8.2 (cycles) ; T-06"""
        self.deleg('TIT', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True)
        h2 = self.deleg('V1', ('acteur', 'V2'), ['voir'], ('objet', self.priv), repartager=True)
        self.deleg('V2', ('acteur', 'V3'), ['voir'], ('objet', self.priv), repartager=True)
        self.refus(self.s.confirmer('V3', h2))

    def test_S_111(self):
        """S-111
        Pré : RS1 a nommé RS2 ; RS3, nommé par R0, n'est pas signataire de cette nomination.
        Op : RS3 clôt la nomination de RS2.
        Attendu : **Refus.**
        Fondement : § 7.4"""
        self.nomme('R0', 'P', 'RS1', 'RS')
        self.nomme('R0', 'P', 'RS3', 'RS')
        self.ok(self.s.clore('R0', self.h_RS2))
        h = self.nomme('RS1', 'P', 'RS2', 'RS')
        self.refus(self.s.clore('RS3', h))

    def test_S_112(self):
        """S-112
        Pré : RS1 nommé RS jusqu'à D1 = 10.
        Op : RS1 délègue `voir` sur le contenu de P à V jusqu'à D2 = 20.
        Attendu : **Refus.**
        Fondement : A1 ; § 7.2"""
        self.nomme('R0', 'P', 'RS1', 'RS', echeance=10)
        self.refus(self.s.deleguer('RS1', ('acteur', 'V'), ['voir'], ('contenu', 'P'), echeance=20))

    def test_S_113(self):
        """S-113
        Pré : RS de P seulement ; l'espace Q a un objet oq.
        Op : RS délègue `voir` sur oq à V.
        Attendu : **Refus.**
        Fondement : A1 ; § 8.1"""
        self.ok(self.s.creer_espace('QQ', 'Q'))
        oq = self.obj('QQ', 'Q')
        self.refus(self.s.deleguer('RS', ('acteur', 'V'), ['voir'], ('objet', oq)))

    def test_S_114(self):
        """S-114
        Pré : RS1 nommé RS sur un périmètre limité à l'objet o.
        Op : RS1 nomme RS3 sur tout P.
        Attendu : **Refus.**
        Fondement : § 7.2 ; A1"""
        self.nomme('R0', 'P', 'RS1', 'RS', perimetre={self.o})
        self.refus(self.s.nommer('RS1', 'P', 'RS3', 'RS'))

    def test_S_151(self):
        """S-151
        Pré : RS1 a nommé RS3, qui a accepté.
        Op : la racine R0 clôt la nomination de RS3.
        Attendu : **Accepté.**
        Fondement : § 7.4 (CD-02)"""
        self.nomme('R0', 'P', 'RS1', 'RS')
        h = self.nomme('RS1', 'P', 'RS3', 'RS')
        self.ok(self.s.clore('R0', h))

    def test_S_152(self):
        """S-152
        Pré : RS1 a nommé RS3 ; R0 révoque ensuite la nomination de RS1.
        Op : RS3 consulte un objet du contenu de P.
        Attendu : **Accordé.**
        Fondement : § 2.1 ; § 7.3"""
        h1 = self.nomme('R0', 'P', 'RS1', 'RS')
        self.nomme('RS1', 'P', 'RS3', 'RS')
        self.ok(self.s.clore('R0', h1))
        self.accorde('RS3', self.o)

    def test_S_153(self):
        """S-153
        Pré : RS a signé l'HI R au profit de V ; R0 a révoqué RS.
        Op : R0 met R en examen ; puis V consulte un objet du contenu de P.
        Attendu : **Introuvable** (suspension immédiate).
        Fondement : § 7.5 ; T-07"""
        R = self.deleg('RS', ('acteur', 'V'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.clore('R0', self.h_RS))
        self.ok(self.s.mettre_en_examen('R0', R))
        self.absent('V', self.o)

    def test_S_154(self):
        """S-154
        Pré : comme S-153, R en examen.
        Op : R0 lève l'examen ; puis V consulte un objet du contenu de P.
        Attendu : **Accordé.**
        Fondement : § 7.5 ; T-08 ; A4"""
        R = self.deleg('RS', ('acteur', 'V'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.clore('R0', self.h_RS))
        self.ok(self.s.mettre_en_examen('R0', R))
        self.ok(self.s.lever_examen('R0', R))
        self.accorde('V', self.o)

    def test_S_155(self):
        """S-155
        Pré : HI R signée par RS.
        Op : RS2, qui n'est pas la racine, met R en examen.
        Attendu : **Refus.**
        Fondement : § 7.5"""
        R = self.deleg('RS', ('acteur', 'V'), ['voir'], ('contenu', 'P'))
        self.refus(self.s.mettre_en_examen('RS2', R))

    def test_S_156(self):
        """S-156
        Pré : RS a signé l'HI R ; R0 a révoqué RS.
        Op : R0 demande la liste des HI signées par RS.
        Attendu : La liste contient R.
        Fondement : § 7.5 ; A7"""
        R = self.deleg('RS', ('acteur', 'V'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.clore('R0', self.h_RS))
        self.assertIn(R, self.ok(self.s.habs_signees_par('R0', 'P', 'RS')))

    def test_S_157(self):
        """S-157
        Pré : TIT a délégué `voir` + `repartager` sur priv à V1 jusqu'à 20 et à V2 jusqu'à 30 ; V1 a délégué `voir` à T jusqu'à 10 ; V2 a prolongé cette HP jusqu'à 25 ; il est 15.
        Op : T consulte priv.
        Attendu : **Accordé** : la portée effective est l'union des fondateurs valides.
        Fondement : § 8.2 (CD-16)"""
        self.deleg('TIT', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True, echeance=20)
        self.deleg('TIT', ('acteur', 'V2'), ['voir'], ('objet', self.priv), repartager=True, echeance=30)
        h3 = self.deleg('V1', ('acteur', 'T'), ['voir'], ('objet', self.priv), echeance=10)
        self.ok(self.s.prolonger('V2', h3, 25))
        self.s.avancer(15)
        self.accorde('T', self.priv)

    def test_S_158(self):
        """S-158
        Pré : RS a délégué `voir` + `commenter` sur o à V ; RS restreint ensuite l'habilitation à `voir`.
        Op : V commente o.
        Attendu : **Refus.**
        Fondement : T-05"""
        R = self.deleg('RS', ('acteur', 'V'), ['voir', 'commenter'], ('objet', self.o))
        self.ok(self.s.restreindre('RS', R, actions=['voir']))
        self.refuse('V', self.o, 'commenter')

    def test_S_159(self):
        """S-159
        Pré : comme S-17 avant la clôture : l'HP de T a pour fondateurs V1 et V2.
        Op : V1 retire son fondement ; puis T consulte priv.
        Attendu : **Accordé.**
        Fondement : T-12 ; § 8.2"""
        self.deleg('TIT', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True)
        self.deleg('TIT', ('acteur', 'V2'), ['voir'], ('objet', self.priv), repartager=True)
        h3 = self.deleg('V1', ('acteur', 'T'), ['voir'], ('objet', self.priv))
        self.ok(self.s.confirmer('V2', h3))
        self.ok(self.s.retirer_fondement('V1', h3))
        self.accorde('T', self.priv)

    def test_S_160(self):
        """S-160
        Pré : comme S-159, avant le retrait.
        Op : V2, cofondateur mais ni auteur ni titulaire, clôt l'HP.
        Attendu : **Refus** : il ne peut que retirer son fondement.
        Fondement : § 8.3"""
        self.deleg('TIT', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True)
        self.deleg('TIT', ('acteur', 'V2'), ['voir'], ('objet', self.priv), repartager=True)
        h3 = self.deleg('V1', ('acteur', 'T'), ['voir'], ('objet', self.priv))
        self.ok(self.s.confirmer('V2', h3))
        self.refus(self.s.clore('V2', h3))


class S03_Ensembles(Base):
    """3. Groupes, rôles, programmes, rattachements"""

    def setUp(self):
        super().setUp()
        self.projet()
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))

    def test_S_24(self):
        """S-24
        Pré : le groupe G de P est bénéficiaire d'une habilitation `voir` sur le contenu de P ; LEC membre de P, non membre de G.
        Op : LEC s'ajoute à G.
        Attendu : **Refus** : LEC n'est pas gestionnaire de G (A3 est isolé par S-06 et S-44).
        Fondement : § 9.1"""
        self.deleg('RS', ('groupe', 'G'), ['voir'], ('contenu', 'P'))
        self.refus(self.s.ajouter_membre('LEC', 'G', 'LEC'))

    def test_S_25(self):
        """S-25
        Pré : G géré par ADM ; RS a délégué `voir` sur le contenu de P à G en `approbation préalable` ; ADM a ajouté M à G.
        Op : RS admet M ; puis M consulte un objet du contenu de P.
        Attendu : **Accordé.**
        Fondement : § 9.3"""
        R = self.deleg('RS', ('groupe', 'G'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        self.ok(self.s.admettre('RS', R, 'M'))
        self.accorde('M', self.o)

    def test_S_26(self):
        """S-26
        Pré : comme S-25, avant l'admission.
        Op : M consulte un objet du contenu de P.
        Attendu : **Introuvable** : l'appartenance seule ne confère rien.
        Fondement : § 9.1 ; A2"""
        self.deleg('RS', ('groupe', 'G'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        self.absent('M', self.o)

    def test_S_27(self):
        """S-27
        Pré : programme PRG ; groupe « Coordination » géré par PRG, dont AC est membre ; RSP, racine de SP, a délégué `voir` sur osp à la Coordination en `approbation préalable`.
        Op : RSP admet AC ; puis AC consulte osp.
        Attendu : **Accordé.**
        Fondement : § 9.3"""
        self.programme()
        self.ok(self.s.ajouter_membre('RG', 'Coordination', 'AC'))
        R = self.deleg('RSP', ('groupe', 'Coordination'), ['voir'], ('objet', self.osp))
        self.ok(self.s.admettre('RSP', R, 'AC'))
        self.accorde('AC', self.osp)

    def test_S_94(self):
        """S-94
        Pré : comme S-27 ; B ajouté à la Coordination par RG, non admis.
        Op : B consulte osp.
        Attendu : **Introuvable.**
        Fondement : § 9.3"""
        self.programme()
        self.deleg('RSP', ('groupe', 'Coordination'), ['voir'], ('objet', self.osp))
        self.ok(self.s.ajouter_membre('RG', 'Coordination', 'B'))
        self.absent('B', self.osp)

    def test_S_95(self):
        """S-95
        Pré : RSP a délégué `voir` sur osp à la Coordination en mode `notification`.
        Op : RG ajoute Y à la Coordination ; puis Y consulte osp.
        Attendu : **Accordé** ; RSP, RS de SP, est notifié de l'entrée de Y, et personne d'autre.
        Fondement : § 9.3 (notification)"""
        self.programme()
        h = self.deleg('RSP', ('groupe', 'Coordination'), ['voir'], ('objet', self.osp), mode='notification')
        avant = copy.deepcopy(self.s.notifications)
        self.ok(self.s.ajouter_membre('RG', 'Coordination', 'Y'))
        self.accorde('Y', self.osp)
        nouvelles = {a: ms[len(avant.get(a, [])):] for a, ms in self.s.notifications.items()}
        self.assertEqual({a: ms for a, ms in nouvelles.items() if ms}, {'RSP': [('admission_automatique', h, 'Y')]})

    def test_S_96(self):
        """S-96
        Pré : TIT titulaire de priv.
        Op : TIT délègue `voir` sur priv à la Coordination en mode `notification`.
        Attendu : **Refus** : seule l'`approbation préalable` est admise pour un objet personnel non public.
        Fondement : § 9.3"""
        self.programme()
        self.refus(self.s.deleguer('TIT', ('groupe', 'Coordination'), ['voir'], ('objet', self.priv),
                                   mode='notification'))

    def test_S_28(self):
        """S-28
        Pré : XA administrateur de PRG, sans rôle dans SP.
        Op : XA consulte osp.
        Attendu : **Introuvable.**
        Fondement : A2"""
        self.programme()
        self.absent('XA', self.osp)

    def test_S_29(self):
        """S-29
        Pré : RSP a délégué `voir` sur osp à V, conditionné par le rattachement SP → PRG.
        Op : le rattachement prend fin ; puis V consulte osp.
        Attendu : **Introuvable.**
        Fondement : § 13.13 ; T-13"""
        self.programme()
        self.ok(self.s.rattacher('RSP', 'RG', 'SP', 'PRG'))
        self.deleg('RSP', ('acteur', 'V'), ['voir'], ('objet', self.osp), condition_rattachement=('SP', 'PRG'))
        self.ok(self.s.fin_rattachement('RG', 'SP', 'PRG'))
        self.absent('V', self.osp)

    def test_S_97(self):
        """S-97
        Pré : comme S-29 ; un nouveau rattachement SP → PRG est ensuite établi.
        Op : V consulte osp.
        Attendu : **Introuvable** : aucune réactivation.
        Fondement : § 13.13 ; A4"""
        self.programme()
        self.ok(self.s.rattacher('RSP', 'RG', 'SP', 'PRG'))
        self.deleg('RSP', ('acteur', 'V'), ['voir'], ('objet', self.osp), condition_rattachement=('SP', 'PRG'))
        self.ok(self.s.fin_rattachement('RG', 'SP', 'PRG'))
        self.ok(self.s.rattacher('RSP', 'RG', 'SP', 'PRG'))
        self.absent('V', self.osp)

    def test_S_115(self):
        """S-115
        Pré : HI de P au profit du rôle `collaborateur` de l'espace F, en `approbation préalable`.
        Op : RF, RS de F, nomme Z collaborateur de F ; puis Z consulte un objet du contenu de P.
        Attendu : **Introuvable** : Z n'est pas admis par P.
        Fondement : § 9.1 ; § 9.3"""
        self.ok(self.s.creer_espace('RF', 'F'))
        self.deleg('RS', ('role', 'F', 'collaborateur'), ['voir'], ('contenu', 'P'))
        self.nomme('RF', 'F', 'Z', 'collaborateur')
        self.absent('Z', self.o)

    def test_S_116(self):
        """S-116
        Pré : RS a délégué `voir` au groupe G de P ; ADM gère G.
        Op : ADM ajoute M à G ; puis M consulte o.
        Attendu : L'ajout est **accepté** (le groupe n'est pas gelé), et M reçoit « introuvable » tant qu'il n'est pas admis.
        Fondement : § 9.1"""
        self.deleg('RS', ('groupe', 'G'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        self.absent('M', self.o)

    def test_S_117(self):
        """S-117
        Pré : TIT titulaire de priv, membre du groupe « Équipe » de P.
        Op : TIT délègue `voir` sur priv à « Équipe ».
        Attendu : **Accepté.**
        Fondement : A3 (permis)"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'Equipe'))
        self.ok(self.s.ajouter_membre('ADM', 'Equipe', 'TIT'))
        self.ok(self.s.deleguer('TIT', ('groupe', 'Equipe'), ['voir'], ('objet', self.priv)))

    def test_S_161(self):
        """S-161
        Pré : RS a délégué `voir` sur le contenu de P au groupe G en mode `notification` ; ADM1 et ADM2 administrateurs de P.
        Op : ADM1 ajoute ADM2 à G, ADM2 ajoute ADM1 à G ; puis ADM1 consulte un objet du contenu de P.
        Attendu : **Introuvable** : un gestionnaire n'est jamais admis automatiquement.
        Fondement : § 9.4 (F-2) ; I-3"""
        self.ok(self.s.nommer_administrateur('R0', 'P', 'ADM1'))
        self.ok(self.s.nommer_administrateur('R0', 'P', 'ADM2'))
        self.deleg('RS', ('groupe', 'G'), ['voir'], ('contenu', 'P'), mode='notification')
        self.ok(self.s.ajouter_membre('ADM1', 'G', 'ADM2'))
        self.ok(self.s.ajouter_membre('ADM2', 'G', 'ADM1'))
        self.absent('ADM1', self.o)

    def test_S_162(self):
        """S-162
        Pré : TIT a délégué `voir` sur priv au rôle `collaborateur` de P (son propre espace).
        Op : RS nomme N collaborateur ; puis N consulte priv.
        Attendu : **Introuvable** : une HP au profit d'un rôle exige une admission.
        Fondement : § 9.2 (CD-13)"""
        self.deleg('TIT', ('role', 'P', 'collaborateur'), ['voir'], ('objet', self.priv))
        self.nomme('RS', 'P', 'N', 'collaborateur')
        self.absent('N', self.priv)

    def test_S_163(self):
        """S-163
        Pré : RS a délégué `exporter` sur le contenu de P au rôle `lecteur` de P (HI).
        Op : RS nomme N2 lecteur ; N2 exporte o ; RS2 admet N2 ; N2 exporte o.
        Attendu : **Refus**, puis **accordé** : même au profit d'un rôle de son propre espace, une habilitation
        exige une admission (V1.6, H-2a).
        Fondement : § 9.2 (H-2a)"""
        h = self.deleg('RS', ('role', 'P', 'lecteur'), ['exporter'], ('contenu', 'P'))
        self.nomme('RS', 'P', 'N2', 'lecteur')
        self.refuse('N2', self.o, 'exporter')
        self.ok(self.s.admettre('RS2', h, 'N2'))
        self.accorde('N2', self.o, 'exporter')

    def test_S_164(self):
        """S-164
        Pré : comme S-95, Y admis automatiquement.
        Op : RSP retire l'admission de Y ; puis Y consulte osp.
        Attendu : **Introuvable.**
        Fondement : § 9.3 ; § 5.3"""
        self.programme()
        R = self.deleg('RSP', ('groupe', 'Coordination'), ['voir'], ('objet', self.osp), mode='notification')
        self.ok(self.s.ajouter_membre('RG', 'Coordination', 'Y'))
        self.ok(self.s.retirer_admission('RSP', R, 'Y'))
        self.absent('Y', self.osp)

    def test_S_165(self):
        """S-165
        Pré : comme S-164, admission de Y retirée.
        Op : RG retire Y de la Coordination puis l'y ajoute de nouveau ; puis Y consulte osp.
        Attendu : **Introuvable** : le retrait exclut l'admission automatique.
        Fondement : § 9.4"""
        self.programme()
        R = self.deleg('RSP', ('groupe', 'Coordination'), ['voir'], ('objet', self.osp), mode='notification')
        self.ok(self.s.ajouter_membre('RG', 'Coordination', 'Y'))
        self.ok(self.s.retirer_admission('RSP', R, 'Y'))
        self.ok(self.s.retirer_membre('RG', 'Coordination', 'Y'))
        self.ok(self.s.ajouter_membre('RG', 'Coordination', 'Y'))
        self.absent('Y', self.osp)

    def test_S_166(self):
        """S-166
        Pré : RS a délégué `voir` + `repartager` sur o à COL (HI) ; COL a délégué `voir` sur o au groupe G en `notification` (HP) ; ADM a ajouté M à G.
        Op : RS clôt l'HI de COL ; puis M consulte o.
        Attendu : **Introuvable** : l'autorisation anticipée tombe avec les droits de l'habilitant.
        Fondement : § 9.3 ; § 8.2"""
        h1 = self.deleg('RS', ('acteur', 'COL'), ['voir'], ('objet', self.o), repartager=True)
        self.deleg('COL', ('groupe', 'G'), ['voir'], ('objet', self.o), mode='notification')
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        self.accorde('M', self.o)
        self.ok(self.s.clore('RS', h1))
        self.absent('M', self.o)


class S04_Transfert(Base):
    """4. Propriété et transfert"""

    def setUp(self):
        super().setUp()
        self.espace_transfere()

    def test_S_30(self):
        """S-30
        Pré : C propriétaire et racine de ESP ; transfert à K préparé.
        Op : K accepte ; puis C consulte un objet du contenu de ESP.
        Attendu : **Introuvable.**
        Fondement : § 10.7"""
        self.transferer()
        self.absent('C', self.ot)

    def test_S_31(self):
        """S-31
        Pré : comme S-30 ; C membre du groupe « Famille » de ESP, bénéficiaire d'une HI `voir` signée par RS2, et admis par RS2.
        Op : K accepte ; puis C consulte un objet ouvert à « Famille ».
        Attendu : **Introuvable.**
        Fondement : § 10.7"""
        self.ok(self.s.creer_groupe('C', 'ESP', 'Famille'))
        R = self.deleg('RS2', ('groupe', 'Famille'), ['voir'], ('contenu', 'ESP'))
        self.ok(self.s.ajouter_membre('ADME', 'Famille', 'C'))
        self.ok(self.s.admettre('RS2', R, 'C'))
        self.accorde('C', self.ot)
        self.transferer()
        self.absent('C', self.ot)

    def test_S_32(self):
        """S-32
        Pré : comme S-30 ; T objet public de ESP ; C est le seul bénéficiaire et gardien d'un embargo d'existence sur T.
        Op : K accepte ; puis C cherche T.
        Attendu : Aucun résultat : C a perdu sa qualité de bénéficiaire, alors que T est public.
        Fondement : § 10.7"""
        T = self.obj('C', 'ESP', titre='témoignage T', diffusable=True)
        self.ok(self.s.modifier_visibilite('C', T, 'public'))
        self.ok(self.s.creer_protection('C', 'embargo_existence', T))
        self.assertEqual(self.s.rechercher('C', 'témoignage'), [T])
        self.transferer()
        self.assertEqual(self.s.rechercher('C', 'témoignage'), [])

    def test_S_33(self):
        """S-33
        Pré : comme S-30 ; TIT2, collaborateur de ESP, a accordé à C `voir` sur son journal `privé` J.
        Op : K accepte ; puis K consulte J ; puis C consulte J.
        Attendu : K : **introuvable** ; C : **accordé** : le cédant conserve les HP qu'un titulaire tiers lui a
        accordées sur ses objets personnels (CT-28).
        Fondement : § 10.7 (CT-28) ; A2"""
        self.nomme('C', 'ESP', 'TIT2', 'collaborateur')
        J = self.obj('TIT2', 'ESP', perso=True, titre='journal')
        self.deleg('TIT2', ('acteur', 'C'), ['voir'], ('objet', J))
        self.transferer()
        self.absent('K', J)
        self.accorde('C', J)

    def test_S_34(self):
        """S-34
        Pré : comme S-30 ; T objet du contenu de ESP ; une interdiction d'existence, posée par RS2, avait C pour seul destinataire.
        Op : K accepte ; puis K consulte T.
        Attendu : **Accordé** : l'interdiction vise C, pas K.
        Fondement : § 10.7 (CD-21)"""
        T = self.obj('C', 'ESP', titre='T')
        self.ok(self.s.creer_protection('RS2', 'interdiction_existence', T, destinataires={'C'}))
        self.transferer()
        self.accorde('K', T)

    def test_S_35(self):
        """S-35
        Pré : C (comme RS) a signé l'HI G1, règle de sélection sur le contenu de ESP au profit du rôle `collaborateur` de CLM, en `approbation préalable`, et a admis CC.
        Op : K accepte sans réémission ; puis CC consulte un objet de la sélection.
        Attendu : **Accordé** : l'HI et son admission institutionnelle survivent.
        Fondement : § 2.1 ; § 10.7 (F-1)"""
        self.colimacons()
        sel = self.ok(self.s.creer_selection('C', 'ESP', {self.ot}))
        G1 = self.deleg('C', ('role', 'CLM', 'collaborateur'), ['voir'], ('selection', sel))
        self.ok(self.s.admettre('C', G1, 'CC'))
        self.transferer()
        self.accorde('CC', self.ot)

    def test_S_36(self):
        """S-36
        Pré : HI de C au profit du groupe « Cousins » de ESP ; transfert présenté (fenêtre ouverte).
        Op : C ajoute ZZ au groupe « Cousins ».
        Attendu : **Refus** (« espace en cours de transfert »).
        Fondement : § 10.6 (gel)"""
        self.ok(self.s.creer_groupe('C', 'ESP', 'Cousins'))
        self.deleg('C', ('groupe', 'Cousins'), ['voir'], ('contenu', 'ESP'))
        self.presenter()
        r = self.s.ajouter_membre('C', 'Cousins', 'ZZ')
        self.assertEqual(r.code, 'gel')

    def test_S_37(self):
        """S-37
        Pré : RS2 a délégué à C `voir` sur ot ; transfert accepté de C à K (l'habilitation est close) ; ESP archivé
        puis rouvert par K.
        Op : C consulte ot.
        Attendu : **Introuvable** : la réouverture ne réactive pas une habilitation close.
        Fondement : A4 ; § 5.1"""
        self.deleg('RS2', ('acteur', 'C'), ['voir'], ('objet', self.ot))
        self.transferer()
        self.ok(self.s.archiver('K', 'ESP'))
        self.ok(self.s.rouvrir('K', 'ESP'))
        self.absent('C', self.ot)

    def test_S_38(self):
        """S-38
        Pré : comme S-30.
        Op : K accepte ; puis K consulte un objet du contenu de ESP.
        Attendu : **Accordé.**
        Fondement : § 10.7"""
        self.transferer()
        self.accorde('K', self.ot)

    def test_S_39(self):
        """S-39
        Pré : C titulaire de trois objets `privé` dans ESP ; aucune voie retenue pour l'un d'eux.
        Op : C présente le transfert.
        Attendu : **Refus** ; la cause est signalée au cédant seulement.
        Fondement : § 10.5 (blocage)"""
        p1, p2, p3 = (self.obj('C', 'ESP', perso=True, titre=f'p{i}') for i in range(3))
        self.ok(self.s.choisir_voie('C', self.tid, p1, 'a'))
        self.ok(self.s.choisir_voie('C', self.tid, p2, 'a'))
        r = self.s.presenter('C', self.tid)
        self.refus(r)
        self.assertIn(('blocage', self.tid, (p3,)), self.s.notifications['C'])
        self.assertNotIn('K', self.s.notifications)

    def test_S_118(self):
        """S-118
        Pré : RS2 administrateur et RS de ESP, non propriétaire ; C propriétaire.
        Op : RS2 lance le transfert de ESP à K.
        Attendu : **Refus.**
        Fondement : § 10.4"""
        self.ok(self.s.annuler_transfert('C', self.tid))
        self.ok(self.s.nommer_administrateur('C', 'ESP', 'RS2'))
        self.refus(self.s.preparer_transfert('RS2', 'ESP', 'K'))

    def test_S_119(self):
        """S-119
        Pré : ESP2 préparé pour un tiers par C (désignation de garde au profit de K) ; transfert accepté par K.
        Op : C, ancien propriétaire, lance un nouveau transfert de ESP2.
        Attendu : **Refus** : seul le propriétaire transfère (la garde est exercée par S-247 et S-248).
        Fondement : § 10.4"""
        self.ok(self.s.creer_espace('C', 'ESP2', designation_garde='K'))
        tid = self.ok(self.s.preparer_transfert('C', 'ESP2', 'K'))
        emp = self.ok(self.s.presenter('C', tid))
        self.ok(self.s.accepter_transfert('K', tid, emp))
        self.refus(self.s.preparer_transfert('C', 'ESP2', 'Z'))

    def test_S_120(self):
        """S-120
        Pré : après le transfert de C à K, RS2, nommé par C, est resté RS de ESP (F-1).
        Op : RS2 nomme C collaborateur de ESP, sans le consentement de K.
        Attendu : **Refus.**
        Fondement : § 10.8"""
        self.transferer()
        self.refus(self.s.nommer('RS2', 'ESP', 'C', 'collaborateur'))

    def test_S_121(self):
        """S-121
        Pré : comme S-120, avec le consentement explicite de K, donné pour une nomination de C.
        Op : RS2 nomme C collaborateur de ESP ; puis RS2 nomme C lecteur d'un autre périmètre.
        Attendu : **Accepté**, puis **refus** : le consentement vaut pour un seul acte (H-6c).
        Fondement : § 10.8 (H-6c)"""
        self.transferer()
        self.ok(self.s.consentir_reintegration('K', 'ESP', 'C', 'nomination'))
        h = self.ok(self.s.nommer('RS2', 'ESP', 'C', 'collaborateur'))
        self.ok(self.s.quitter('C', 'ESP'))
        self.assertEqual(self.s.habs[h].etat, 'close')
        self.refus(self.s.nommer('RS2', 'ESP', 'C', 'lecteur'))

    def test_S_122(self):
        """S-122
        Pré : transfert présenté ; l'objet T de ESP est sous embargo d'existence posé par RS2, dont K n'est pas bénéficiaire ; RS2 a délégué `voir` sur T à V.
        Op : K affiche la présentation et ses totaux.
        Attendu : Elle est identique à celle qu'il verrait si T n'existait pas : ni T, ni l'embargo, ni l'habilitation sur T, ni aucun total ne les révèle.
        Fondement : § 10.6 ; I-5 (F-4)"""
        T = self.obj('C', 'ESP', titre='T')
        self.ok(self.s.creer_protection('RS2', 'embargo_existence', T))
        self.deleg('RS2', ('acteur', 'V'), ['voir'], ('objet', T))
        self.presenter()
        vue = self.ok(self.s.vue_transfert('K', self.tid))
        jumeau = jumeau_sans(self.s, T)
        vue_j = jumeau.vue_transfert('K', self.tid).valeur
        self.assertEqual(vue['engagements'], vue_j['engagements'])
        self.assertEqual(vue['total_engagements'], vue_j['total_engagements'])
        self.assertEqual(vue['apercu'], vue_j['apercu'])
        self.assertNotIn(T, repr(vue))

    def test_S_167(self):
        """S-167
        Pré : comme S-122.
        Op : contrôle d'audit du scellé de la présentation.
        Attendu : Le scellé d'audit contient l'embargo sur T ; la présentation de K ne le contient pas.
        Fondement : § 10.6 (scellé d'audit)"""
        T = self.obj('C', 'ESP', titre='T')
        pid = self.ok(self.s.creer_protection('RS2', 'embargo_existence', T))
        self.presenter()
        self.assertIn(('prot', pid), self.s.scelles[(self.tid, 0)])
        self.assertNotIn(('prot', pid), self.s.transferts[self.tid].presente)

    def test_S_123(self):
        """S-123
        Pré : le propriétaire C, aussi racine, est décédé ; aucune désignation de garde ; aucun fondement légal enregistré.
        Op : SUP1 et SUP2 ouvrent une succession de ESP.
        Attendu : **Refus.**
        Fondement : § 10.4 (succession)"""
        self.ok(self.s.constater_deces(('SUP1', 'SUP2'), 'C'))
        self.refus(self.s.ouvrir_succession(('SUP3', 'SUP4'), 'ESP'))

    def test_S_125(self):
        """S-125
        Pré : ADME administrateur de ESP ; C propriétaire.
        Op : ADME consulte un objet du contenu de ESP.
        Attendu : **Introuvable.**
        Fondement : A2 ; § 10.1"""
        self.absent('ADME', self.ot)

    def test_S_168(self):
        """S-168
        Pré : C a nommé RS2 ; RS2 a nommé RS3.
        Op : K accepte ; puis K clôt la nomination de RS3.
        Attendu : **Accepté.**
        Fondement : § 7.4 ; § 10.7 (CD-02)"""
        h3 = self.nomme('RS2', 'ESP', 'RS3', 'RS')
        self.transferer()
        self.ok(self.s.clore('K', h3))

    def test_S_169(self):
        """S-169
        Pré : transfert accepté ; RS2 resté RS.
        Op : RS2 crée une habilitation `voir` sur tout le contenu de ESP au profit de C.
        Attendu : **Refus.**
        Fondement : § 10.8 (CD-03)"""
        self.transferer()
        self.refus(self.s.deleguer('RS2', ('acteur', 'C'), ['voir'], ('contenu', 'ESP')))

    def test_S_170(self):
        """S-170
        Pré : C avait délégué `voir` sur le contenu de ESP au rôle `collaborateur` de F en mode `notification` ; C est collaborateur de F ; transfert accepté ; C quitte F.
        Op : RF nomme de nouveau C collaborateur de F ; puis C consulte un objet du contenu de ESP.
        Attendu : **Introuvable** : C, signataire de l'habilitation, n'y est jamais admis (le cédant est isolé par
        S-277).
        Fondement : § 9.4 (signataire) ; § 10.8"""
        self.ok(self.s.creer_espace('RF', 'F'))
        self.nomme('RF', 'F', 'C', 'collaborateur')
        self.deleg('C', ('role', 'F', 'collaborateur'), ['voir'], ('contenu', 'ESP'), mode='notification')
        self.transferer()
        self.ok(self.s.quitter('C', 'F'))
        self.nomme('RF', 'F', 'C', 'collaborateur')
        self.absent('C', self.ot)

    def test_S_171(self):
        """S-171
        Pré : HI de RS2 au profit du groupe « Famille » ; transfert accepté ; ADME ajoute C à « Famille ».
        Op : RS2 admet C.
        Attendu : **Refus.**
        Fondement : § 10.8 (CD-03)"""
        self.ok(self.s.creer_groupe('C', 'ESP', 'Famille'))
        R = self.deleg('RS2', ('groupe', 'Famille'), ['voir'], ('contenu', 'ESP'))
        self.transferer()
        self.ok(self.s.ajouter_membre('ADME', 'Famille', 'C'))
        self.refus(self.s.admettre('RS2', R, 'C'))

    def test_S_172(self):
        """S-172
        Pré : ESP3 porte une désignation de garde au profit de K ; son propriétaire C est indisponible durablement ; SUP1 et SUP2 ont ouvert la succession.
        Op : K accepte la présentation.
        Attendu : **Accepté** ; K devient propriétaire.
        Fondement : § 10.4 (succession)"""
        self.ok(self.s.creer_espace('C', 'ESP3', designation_garde='K'))
        self.s.acteurs['C'].actif = False
        tid = self.ok(self.s.ouvrir_succession(('SUP1', 'SUP2'), 'ESP3'))
        emp = self.s.vue_transfert('K', tid).valeur['empreinte']
        self.ok(self.s.accepter_transfert('K', tid, emp))
        self.assertEqual(self.s.espaces['ESP3'].proprietaire, 'K')

    def test_S_173(self):
        """S-173
        Pré : HI de C au profit du rôle `collaborateur` de F, en `approbation préalable` ; transfert présenté.
        Op : RF nomme N collaborateur de F ; puis K accepte avec l'empreinte présentée.
        Attendu : **Accepté** : la composition d'un rôle d'un autre espace n'est pas un engagement.
        Fondement : § 10.6 (F-4)"""
        self.ok(self.s.creer_espace('RF', 'F'))
        self.deleg('C', ('role', 'F', 'collaborateur'), ['voir'], ('contenu', 'ESP'))
        emp = self.presenter()
        self.nomme('RF', 'F', 'N', 'collaborateur')
        self.ok(self.accepter(emp))

    def test_S_174(self):
        """S-174
        Pré : HI R de RS2 sur le contenu de ESP ; transfert présenté ; RS2 clôt ensuite R.
        Op : K accepte avec l'empreinte présentée.
        Attendu : **Accepté** : un retrait ne bloque pas ; K est notifié du retrait après l'acceptation.
        Fondement : § 10.6 (inclusion, G-3) ; § 10.7"""
        R = self.deleg('RS2', ('acteur', 'V'), ['voir'], ('contenu', 'ESP'))
        emp = self.presenter()
        self.ok(self.s.clore('RS2', R))
        self.ok(self.accepter(emp))
        self.assertTrue(any(n[0] == 'retraits_depuis_presentation' and ('hab', R) in n[2]
                            for n in self.s.notifications.get('K', [])))

    def test_S_175(self):
        """S-175
        Pré : transfert présenté ; le délai de présentation est écoulé.
        Op : K accepte.
        Attendu : **Refus** « présentation expirée » ; K ne peut rien relancer.
        Fondement : § 5.6 ; § 10.6 (CT-16)"""
        emp = self.presenter()
        self.s.avancer(15)
        self.assertEqual(self.accepter(emp).code, 'expiree')
        self.refus(self.s.presenter('K', self.tid))

    def test_S_176(self):
        """S-176
        Pré : transfert présenté ; RS2 pose ensuite un embargo d'existence sur l'objet T2, qui ne porte aucune habilitation, et dont K n'est pas bénéficiaire.
        Op : K accepte avec l'empreinte présentée.
        Attendu : **Accepté** : une modification invisible à K n'a aucun effet observable.
        Fondement : § 10.6 ; I-5"""
        T2 = self.obj('C', 'ESP', titre='T2')
        emp = self.presenter()
        self.ok(self.s.creer_protection('RS2', 'embargo_existence', T2))
        self.ok(self.accepter(emp))

    def test_S_177(self):
        """S-177
        Pré : l'objet T de ESP est sous embargo d'existence posé par RS2, dont K n'est pas bénéficiaire.
        Op : K accepte ; puis K consulte T.
        Attendu : **Introuvable** : le propriétaire ne lève pas la protection d'un tiers.
        Fondement : § 10.7 ; F-1"""
        T = self.obj('C', 'ESP', titre='T')
        self.ok(self.s.creer_protection('RS2', 'embargo_existence', T))
        self.transferer()
        self.absent('K', T)

    def test_S_178(self):
        """S-178
        Pré : C est le seul gardien et bénéficiaire d'un embargo d'existence sur l'objet T de ESP ; K n'en est pas bénéficiaire.
        Op : K accepte ; puis K cherche T.
        Attendu : Aucun résultat : la protection devient orpheline, sans révélation au cessionnaire.
        Fondement : § 10.7 ; § 11.2 (F-4)"""
        T = self.obj('C', 'ESP', titre='témoignage T')
        self.ok(self.s.creer_protection('C', 'embargo_existence', T))
        self.transferer()
        self.assertEqual(self.s.rechercher('K', 'témoignage'), [])

    def test_S_179(self):
        """S-179
        Pré : C a nommé COL2 collaborateur de ESP.
        Op : K accepte ; puis COL2 édite un objet du contenu de ESP.
        Attendu : **Accordé.**
        Fondement : I-8 ; § 10.7"""
        self.nomme('C', 'ESP', 'COL2', 'collaborateur')
        self.transferer()
        self.accorde('COL2', self.ot, 'editer')

    def test_S_180(self):
        """S-180
        Pré : transfert présenté (fenêtre ouverte).
        Op : RS2 crée une habilitation `voir` sur un objet du contenu de ESP au profit de V.
        Attendu : **Refus** (« espace en cours de transfert »).
        Fondement : § 10.6 (gel)"""
        self.presenter()
        self.assertEqual(self.s.deleguer('RS2', ('acteur', 'V'), ['voir'], ('objet', self.ot)).code, 'gel')

    def test_S_181(self):
        """S-181
        Pré : HI de C au profit du rôle `collaborateur` de F en `notification` ; transfert présenté ; RF nomme N2 collaborateur de F pendant la fenêtre.
        Op : K accepte ; puis N2 consulte un objet du contenu de ESP.
        Attendu : **Accordé** : l'admission automatique, différée pendant la fenêtre, est traitée à sa fin.
        Fondement : § 10.6 (admission différée)"""
        self.ok(self.s.creer_espace('RF', 'F'))
        self.deleg('C', ('role', 'F', 'collaborateur'), ['voir'], ('contenu', 'ESP'), mode='notification')
        emp = self.presenter()
        self.nomme('RF', 'F', 'N2', 'collaborateur')
        self.ok(self.accepter(emp))
        self.accorde('N2', self.ot)


class S05_Titulaire(Base):
    """5. Titulaire, création, renonciation"""

    def setUp(self):
        super().setUp()
        self.projet()

    def test_S_40(self):
        """S-40
        Pré : tâche automatique de la plateforme, sans déposant identifiable.
        Op : la tâche importe des objets personnels dans P.
        Attendu : **Refus** : un objet personnel exige un titulaire.
        Fondement : § 6.2"""
        avant = len(self.s.objets)
        self.refus(self.s.importer('ADM', 'P', None))
        self.assertEqual(len(self.s.objets), avant)

    def test_S_41(self):
        """S-41
        Pré : ADM administrateur de P, sans rôle scientifique, détenteur d'un fichier GEDCOM sur lequel il n'a pas de droits.
        Op : ADM importe ce fichier comme déposant.
        Attendu : **Refus.**
        Fondement : § 6.2"""
        self.refus(self.s.importer('ADM', 'P', 'ADM', droits_declares=False))

    def test_S_72(self):
        """S-72
        Pré : M collaborateur de P dépose son GEDCOM, dont il déclare détenir les droits, et donne mandat à ADM.
        Op : ADM lance l'import pour M ; puis M consulte un objet créé.
        Attendu : **Accordé** (M titulaire).
        Fondement : § 6.2"""
        self.nomme('RS', 'P', 'M', 'collaborateur')
        self.ok(self.s.donner_mandat('M', 'ADM', 'P'))
        ids = self.ok(self.s.importer('ADM', 'P', 'M'))
        self.accorde('M', ids[0])
        self.assertEqual(self.s.objets[ids[0]].titulaire, 'M')

    def test_S_42(self):
        """S-42
        Pré : référentiel commun en amorçage.
        Op : l'acteur institutionnel d'amorçage crée un concept ; puis un lecteur anonyme le consulte.
        Attendu : **Accordé** (visibilité publique) ; aucun droit de titulaire n'existe.
        Fondement : § 6.1"""
        self.ok(self.s.creer_espace('AMORCE', 'CORE'))
        c = self.ok(self.s.creer_amorcage('AMORCE', 'CORE', 'concept'))
        self.accorde(None, c)
        self.assertIsNone(self.s.objets[c].titulaire)

    def test_S_126(self):
        """S-126
        Pré : TIT titulaire de priv.
        Op : TIT valide scientifiquement priv (`valider`).
        Attendu : **Refus.**
        Fondement : § 6.1 (CC-20)"""
        self.refus(self.s.agir('TIT', self.priv, 'valider'))

    def test_S_127(self):
        """S-127
        Pré : TIT titulaire de priv, soumis à une obligation de conservation ; aucun RS ne consent au versement.
        Op : TIT renonce à son droit de titulaire par la purge.
        Attendu : **Refus** : aucun sort possible.
        Fondement : § 6.3"""
        self.s.objets[self.priv].conservation_obligatoire = True
        self.refus(self.s.renoncer('TIT', self.priv, sort='purge'))

    def test_S_128(self):
        """S-128
        Pré : LEC lecteur de P.
        Op : LEC crée un objet dans P.
        Attendu : **Refus.**
        Fondement : § 6.2"""
        self.refus(self.s.creer_objet('LEC', 'P'))

    def test_S_182(self):
        """S-182
        Pré : RS exclut COL, titulaire de l'objet `privé` pc dans P.
        Op : COL consulte pc.
        Attendu : **Accordé** : le droit de titulaire ne dépend d'aucune appartenance.
        Fondement : § 6.3 (CD-12)"""
        pc = self.obj('COL', perso=True)
        self.ok(self.s.clore('RS', self.h_COL))
        self.accorde('COL', pc)

    def test_S_183(self):
        """S-183
        Pré : comme S-182.
        Op : COL crée un objet dans P.
        Attendu : **Refus.**
        Fondement : § 6.3 ; § 6.2"""
        self.ok(self.s.clore('RS', self.h_COL))
        self.refus(self.s.creer_objet('COL', 'P', personnel=True))

    def test_S_184(self):
        """S-184
        Pré : TIT titulaire de priv ; RS consent au versement.
        Op : TIT renonce par versement.
        Attendu : **Accepté** ; priv devient du contenu de P, paternité conservée.
        Fondement : § 6.3"""
        self.ok(self.s.renoncer('TIT', self.priv, sort='versement', rs='RS'))
        self.assertIsNone(self.s.objets[self.priv].titulaire)
        self.assertEqual(self.s.objets[self.priv].paternite, 'TIT')

    def test_S_185(self):
        """S-185
        Pré : INV invité de P ; RS lui a délégué `proposer` sur le contenu de P.
        Op : INV crée un objet dans P.
        Attendu : Une **proposition** est créée, et non un objet.
        Fondement : § 6.2"""
        self.nomme('RS', 'P', 'INV', 'invite')
        self.deleg('RS', ('acteur', 'INV'), ['proposer'], ('contenu', 'P'))
        oid = self.ok(self.s.creer_objet('INV', 'P'))
        self.assertTrue(self.s.objets[oid].est_proposition)

    def test_S_186(self):
        """S-186
        Pré : TIT titulaire de priv.
        Op : TIT marque une validation personnelle de priv.
        Attendu : **Accepté.**
        Fondement : § 6.1"""
        self.ok(self.s.valider_personnellement('TIT', self.priv))


class S06_Protections(Base):
    """6. Restrictions, protections d'existence, dérogations"""

    def setUp(self):
        super().setUp()
        self.projet()
        self.O = self.obj('RS', titre='objet O')

    def embargo(self, par='RS', **kw):
        return self.ok(self.s.creer_protection(par, 'embargo_existence', self.O, **kw))

    def test_S_43(self):
        """S-43
        Pré : le témoignage T sous embargo d'existence ; bénéficiaires TIT et RS ; RS2, RS de P, non bénéficiaire.
        Op : RS2 recherche « témoignage » dans P.
        Attendu : Aucun résultat.
        Fondement : A5 ; § 14 (étape 3)"""
        T = self.obj('RS', titre='témoignage T')
        self.assertEqual(self.s.rechercher('RS2', 'témoignage'), [T])
        self.ok(self.s.creer_protection('RS', 'embargo_existence', T, beneficiaires={('acteur', 'TIT')}))
        self.assertEqual(self.s.rechercher('RS2', 'témoignage'), [])

    def test_S_98(self):
        """S-98
        Pré : deux témoignages publics de P, T et T2 ; T sous embargo d'existence.
        Op : un lecteur anonyme demande le total des témoignages de P.
        Attendu : Le total vaut 1 : il exclut T.
        Fondement : A5 ; § 15"""
        T = self.obj('RS', titre='T', type_='temoignage', diffusable=True)
        T2 = self.obj('RS', titre='T2', type_='temoignage', diffusable=True)
        for x in (T, T2):
            self.ok(self.s.modifier_visibilite('RS', x, 'public'))
        self.ok(self.s.creer_protection('RS', 'embargo_existence', T))
        self.assertEqual(self.s.compter(None, espace='P', type_='temoignage'), 1)

    def test_S_99(self):
        """S-99
        Pré : comme S-43.
        Op : ADM consulte les journaux de gouvernance de P.
        Attendu : Aucune entrée ne mentionne T ni son embargo.
        Fondement : § 10.3"""
        T = self.obj('RS', titre='témoignage T')
        self.ok(self.s.creer_protection('RS', 'embargo_existence', T))
        journaux = self.ok(self.s.journaux('ADM', 'P'))
        self.assertEqual(journaux, jumeau_sans(self.s, T).journaux('ADM', 'P').valeur)
        self.assertFalse(any('protection' in l[1] for l in journaux['lignes']))

    def test_S_44(self):
        """S-44
        Pré : embargo d'existence dont le groupe « Proches » est bénéficiaire ; ADM non membre.
        Op : ADM s'ajoute à « Proches ».
        Attendu : **Refus.**
        Fondement : A3"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'Proches'))
        self.embargo(beneficiaires={('groupe', 'Proches')})
        self.refus(self.s.ajouter_membre('ADM', 'Proches', 'ADM'))

    def test_S_129(self):
        """S-129
        Pré : embargo d'existence sur O, dont le groupe « Proches » est bénéficiaire ; Z détient une HI `voir` sur O ; ADM ajoute Z à « Proches ».
        Op : Z consulte O.
        Attendu : **Introuvable** : Z n'est pas bénéficiaire sans l'agrément d'un gardien.
        Fondement : § 9.5"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'Proches'))
        self.deleg('RS', ('acteur', 'Z'), ['voir'], ('objet', self.O))
        self.embargo(beneficiaires={('groupe', 'Proches')})
        self.ok(self.s.ajouter_membre('ADM', 'Proches', 'Z'))
        self.absent('Z', self.O)

    def test_S_130(self):
        """S-130
        Pré : RS gardien de l'embargo d'existence sur O ; V détient une habilitation `voir` sur O.
        Op : RS ajoute V comme bénéficiaire ; puis V consulte O.
        Attendu : **Accordé.**
        Fondement : § 11.3"""
        pid = self.embargo()
        self.deleg('RS', ('acteur', 'V'), ['voir'], ('objet', self.O))
        self.ok(self.s.ajouter_beneficiaire('RS', pid, ('acteur', 'V')))
        self.accorde('V', self.O)

    def test_S_45(self):
        """S-45
        Pré : RS1 et RS2, RS de P ; RS1 a posé sur O un embargo d'existence dont il est le seul bénéficiaire et gardien ; RS1 quitte P.
        Op : RS2 lève l'embargo.
        Attendu : **Refus**, indistinguable d'une absence : il n'y a pas de gardien d'office.
        Fondement : § 11.2 ; § 11.5"""
        self.nomme('R0', 'P', 'RS1', 'RS')
        pid = self.embargo(par='RS1')
        self.ok(self.s.quitter('RS1', 'P'))
        self.assertEqual(self.s.lever_protection('RS2', pid).code, 'introuvable')

    def test_S_76(self):
        """S-76
        Pré : COL collaborateur de P ; O objet du contenu.
        Op : COL pose un embargo d'existence sur O.
        Attendu : **Refus.**
        Fondement : § 11.1"""
        self.refus(self.s.creer_protection('COL', 'embargo_existence', self.O))

    def test_S_131(self):
        """S-131
        Pré : ADM administrateur de P ; O objet du contenu.
        Op : ADM pose sur O une interdiction d'existence visant RS.
        Attendu : **Refus.**
        Fondement : § 11.1"""
        self.refus(self.s.creer_protection('ADM', 'interdiction_existence', self.O, destinataires={'RS'}))

    def derog_existence(self, **kw):
        pid = self.embargo(par='RS')
        return pid, self.s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.O], ['voir'], 'vérification d’intégrité',
                                               'contrôle', 2, accords_gardiens={pid: 'RS'}, **kw)

    def test_S_46(self):
        """S-46
        Pré : O sous embargo d'existence (gardien RS) ; A demande un accès exceptionnel en lecture, finalité « vérification d'intégrité », 2 jours ; SUP1 et SUP2 indépendants approuvent ; RS, gardien, donne son accord.
        Op : A consulte O pour cette finalité.
        Attendu : **Accordé** ; l'embargo reste en place.
        Fondement : § 12.3 (F-3)"""
        pid, r = self.derog_existence()
        self.ok(r)
        self.accorde('A', self.O, finalite='vérification d’intégrité')
        self.assertEqual(self.s.protections[pid].etat, 'active')

    def test_S_187(self):
        """S-187
        Pré : comme S-46.
        Op : A consulte O ; contrôle du journal d'audit.
        Attendu : L'usage est journalisé avec le marqueur « renforcé ».
        Fondement : § 12.4"""
        self.derog_existence()
        self.s.acces('A', self.O, 'voir', finalite='vérification d’intégrité')
        self.assertTrue(any(e['type'] == 'usage_derogation' and e['renforce'] for e in self.s.audit))

    def test_S_188(self):
        """S-188
        Pré : comme S-46, sans l'accord du gardien.
        Op : SUP1 et SUP2 accordent la dérogation.
        Attendu : **Refus.**
        Fondement : § 12.3 (F-3)"""
        self.embargo()
        self.refus(self.s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.O], ['voir'],
                                              'vérification d’intégrité', 'contrôle', 2))

    def test_S_80(self):
        """S-80
        Pré : comme S-46, mais la seconde approbation vient de SUP1 sous un autre compte (SUP1b).
        Op : la dérogation est demandée ; puis A consulte O.
        Attendu : **Refus.**
        Fondement : § 12.7"""
        pid = self.embargo()
        self.refus(self.s.accorder_derogation(('SUP1', 'SUP1b'), 'A', [self.O], ['voir'],
                                              'vérification d’intégrité', 'contrôle', 2, accords_gardiens={pid: 'RS'}))
        self.absent('A', self.O, finalite='vérification d’intégrité')

    def test_S_81(self):
        """S-81
        Pré : comme S-46, mais le bénéficiaire de l'accès est SUP2 lui-même.
        Op : SUP1 et SUP2 accordent la dérogation à SUP2.
        Attendu : **Refus.**
        Fondement : § 12.4 ; § 12.7"""
        pid = self.embargo()
        self.refus(self.s.accorder_derogation(('SUP1', 'SUP2'), 'SUP2', [self.O], ['voir'],
                                              'vérification d’intégrité', 'contrôle', 2, accords_gardiens={pid: 'RS'}))

    def test_S_82(self):
        """S-82
        Pré : comme S-46, mais seul SUP1 approuve.
        Op : la dérogation est demandée ; puis A consulte O.
        Attendu : **Refus.**
        Fondement : § 12.3"""
        pid = self.embargo()
        self.refus(self.s.accorder_derogation(('SUP1',), 'A', [self.O], ['voir'], 'vérification d’intégrité',
                                              'contrôle', 2, accords_gardiens={pid: 'RS'}))
        self.absent('A', self.O, finalite='vérification d’intégrité')

    def test_S_132(self):
        """S-132
        Pré : comme S-46, pour une durée égale au plafond plus un jour (31 jours).
        Op : SUP1 et SUP2 accordent la dérogation.
        Attendu : **Refus.**
        Fondement : § 12.4 ; § 16"""
        pid = self.embargo()
        self.refus(self.s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.O], ['voir'], 'vérification d’intégrité',
                                              'contrôle', 31, accords_gardiens={pid: 'RS'}))

    def test_S_133(self):
        """S-133
        Pré : O sous embargo **de contenu** ; finalité « diagnostic technique » ; un seul approbateur.
        Op : SUP1 accorde à A un accès exceptionnel à O ; puis A consulte O.
        Attendu : **Refus** de la dérogation ; A reçoit « introuvable ».
        Fondement : § 12.3"""
        self.ok(self.s.creer_protection('RS', 'embargo_contenu', self.O))
        self.refus(self.s.accorder_derogation(('SUP1',), 'A', [self.O], ['voir'], 'diagnostic technique', 'j', 2))
        self.absent('A', self.O, finalite='diagnostic technique')

    def test_S_134(self):
        """S-134
        Pré : dérogation valide en `voir` sur O accordée à A (S-46).
        Op : A exporte O.
        Attendu : **Introuvable.**
        Fondement : § 12.4"""
        self.derog_existence()
        self.absent('A', self.O, 'exporter', finalite='vérification d’intégrité')

    def test_S_135(self):
        """S-135
        Pré : dérogation valide en `voir` sur O accordée à A (S-46).
        Op : A délègue `voir` sur O à B.
        Attendu : **Refus.**
        Fondement : § 12.4"""
        self.derog_existence()
        self.refus(self.s.deleguer('A', ('acteur', 'B'), ['voir'], ('objet', self.O)))

    def test_S_77(self):
        """S-77
        Pré : O sous embargo d'existence devenu orphelin (son seul gardien RS1 a quitté P).
        Op : SUP1, membre de l'autorité de dérogation, lève l'embargo.
        Attendu : **Refus** : aucune dérogation ne lève une protection.
        Fondement : § 11.5 ; § 12"""
        self.nomme('R0', 'P', 'RS1', 'RS')
        pid = self.embargo(par='RS1')
        self.ok(self.s.quitter('RS1', 'P'))
        self.refus(self.s.lever_protection('SUP1', pid))
        self.assertEqual(self.s.protections[pid].etat, 'active')

    def test_S_78(self):
        """S-78
        Pré : O, objet du contenu de P, sous embargo d'existence posé par RS1, seul gardien ; R0 a révoqué RS1 : l'embargo est orphelin ; R0 détient un droit de contenu sur O.
        Op : à la demande de RS2, SUP1 et SUP2 désignent R0 gardien.
        Attendu : **Accepté**, journalisé à l'audit.
        Fondement : § 11.2"""
        h1 = self.nomme('R0', 'P', 'RS1', 'RS')
        pid = self.embargo(par='RS1')
        self.ok(self.s.clore('R0', h1))
        self.assertEqual(self.s.protections[pid].gardiens, set())
        self.ok(self.s.designer_gardien_orphelin(('SUP1', 'SUP2'), pid, 'R0', 'RS2'))
        self.assertTrue(any(e['type'] == 'designation_gardien_orphelin' and e['protection'] == pid
                            for e in self.s.audit))

    def test_S_79(self):
        """S-79
        Pré : R0 désigné gardien selon S-78.
        Op : R0 lève l'embargo.
        Attendu : **Accepté.**
        Fondement : § 11.5"""
        h1 = self.nomme('R0', 'P', 'RS1', 'RS')
        pid = self.embargo(par='RS1')
        self.ok(self.s.clore('R0', h1))
        self.ok(self.s.designer_gardien_orphelin(('SUP1', 'SUP2'), pid, 'R0', 'RS2'))
        self.ok(self.s.lever_protection('R0', pid))

    def test_S_70(self):
        """S-70
        Pré : O objet du contenu sans protection ; A sans droit ; SUP1 seul, non bénéficiaire ; finalité « diagnostic technique » ; 7 jours.
        Op : SUP1 accorde l'accès ; puis A consulte O pour cette finalité.
        Attendu : **Accordé**, et l'usage est journalisé.
        Fondement : § 12.3 ; § 12.4"""
        d = self.ok(self.s.accorder_derogation(('SUP1',), 'A', [self.O], ['voir'], 'diagnostic technique',
                                               'ticket', 7))
        self.accorde('A', self.O, finalite='diagnostic technique')
        self.assertTrue(any(e['type'] == 'usage_derogation' and e['derogation'] == d for e in self.s.audit))

    def test_S_71(self):
        """S-71
        Pré : comme S-70 ; l'accès a expiré.
        Op : A consulte O.
        Attendu : **Introuvable.**
        Fondement : § 12.4 ; A4"""
        self.ok(self.s.accorder_derogation(('SUP1',), 'A', [self.O], ['voir'], 'diagnostic technique', 'ticket', 7))
        self.s.avancer(8)
        self.absent('A', self.O, finalite='diagnostic technique')

    def legale(self, cible):
        return self.ok(self.s.creer_restriction_legale(('SUP1', 'SUP2'), cible, autorite_levee='AUT',
                                                       nature='décision', fondement='ordonnance', portee='objet'))

    def test_S_47(self):
        """S-47
        Pré : restriction légale sur l'objet `privé` D de TIT.
        Op : SUP1 et SUP2 accordent à A un accès exceptionnel à D ; puis A consulte D.
        Attendu : **Refus.**
        Fondement : § 14 (étape 1) ; § 11.6"""
        self.legale(self.priv)
        self.refus(self.s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.priv], ['voir'], 'enquête', 'j', 2))
        self.absent('A', self.priv, finalite='enquête')

    def test_S_100(self):
        """S-100
        Pré : comme S-47 ; créateurs SUP1 et SUP2 ; autorité compétente désignée : AUT.
        Op : SUP1 lève la restriction.
        Attendu : **Refus.**
        Fondement : § 11.6"""
        pid = self.legale(self.priv)
        self.refus(self.s.lever_restriction_legale('SUP1', pid))

    def test_S_101(self):
        """S-101
        Pré : comme S-100.
        Op : AUT enregistre la levée ; puis TIT consulte D.
        Attendu : **Accordé.**
        Fondement : § 11.6"""
        pid = self.legale(self.priv)
        self.ok(self.s.lever_restriction_legale('AUT', pid))
        self.accorde('TIT', self.priv)

    def test_S_136(self):
        """S-136
        Pré : RS et RS2 de P ; O objet du contenu.
        Op : RS et RS2 créent une restriction légale sur O.
        Attendu : **Refus.**
        Fondement : § 11.6"""
        self.refus(self.s.creer_restriction_legale(('RS', 'RS2'), self.O, autorite_levee='AUT'))

    def test_S_137(self):
        """S-137
        Pré : SUP1 et SUP2 créent une restriction légale sur O.
        Op : ils se désignent autorité compétente pour la lever.
        Attendu : **Refus.**
        Fondement : § 11.6 ; A3"""
        self.refus(self.s.creer_restriction_legale(('SUP1', 'SUP2'), self.O, autorite_levee='SUP1'))

    def test_S_48(self):
        """S-48
        Pré : EXP détient `voir` et `exporter` sur le contenu de P ; O sous embargo d'existence dont EXP n'est pas bénéficiaire.
        Op : EXP exporte l'espace.
        Attendu : L'export, objets et total, est identique à celui de l'état où O n'existe pas.
        Fondement : A5 ; § 15"""
        self.deleg('RS', ('acteur', 'EXP'), ['voir', 'exporter'], ('contenu', 'P'))
        self.embargo()
        ex = self.ok(self.s.exporter_espace('EXP', 'P'))
        jumeau = jumeau_sans(self.s, self.O)
        self.assertEqual(ex, jumeau.exporter_espace('EXP', 'P').valeur)
        self.assertNotIn(self.O, [x['id'] for x in ex['objets']])

    def test_S_189(self):
        """S-189
        Pré : O sans protection ; SUP1 seul accorde à A un accès « diagnostic technique » ; RS pose ensuite un embargo d'existence sur O.
        Op : A consulte O pour cette finalité.
        Attendu : **Introuvable** : le niveau d'approbation se calcule à l'évaluation.
        Fondement : § 12.3 (CD-08)"""
        self.ok(self.s.accorder_derogation(('SUP1',), 'A', [self.O], ['voir'], 'diagnostic technique', 'ticket', 7))
        self.embargo()
        self.assertEqual(self.s.acces('A', self.O, 'voir', 'diagnostic technique').code, 'introuvable')

    def test_S_190(self):
        """S-190
        Pré : TIT titulaire du journal `privé` priv, sans protection.
        Op : SUP1 seul accorde à A un accès « diagnostic technique » à priv.
        Attendu : **Refus** : un objet personnel non public exige deux approbateurs.
        Fondement : § 12.3 (F-3)"""
        self.refus(self.s.accorder_derogation(('SUP1',), 'A', [self.priv], ['voir'], 'diagnostic technique', 'j', 2))

    def test_S_191(self):
        """S-191
        Pré : comme S-190.
        Op : SUP1 et SUP2 accordent l'accès ; puis A consulte priv pour cette finalité.
        Attendu : **Accordé.**
        Fondement : § 12.3"""
        self.ok(self.s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.priv], ['voir'], 'diagnostic technique',
                                           'j', 2))
        self.accorde('A', self.priv, finalite='diagnostic technique')

    def test_S_192(self):
        """S-192
        Pré : objet du contenu sensible (DI-E05), sans protection.
        Op : SUP1 seul accorde à A un accès « diagnostic technique ».
        Attendu : **Refus.**
        Fondement : § 12.3"""
        sens = self.obj('RS', sensible=True)
        self.refus(self.s.accorder_derogation(('SUP1',), 'A', [sens], ['voir'], 'diagnostic technique', 'j', 2))

    def renouvellements(self, n):
        res = []
        for i in range(n):
            res.append(self.s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.priv], ['voir'], 'enquête',
                                                  f'justification {i}', 10))
            self.s.avancer(10)
        return res

    def test_S_193(self):
        """S-193
        Pré : une dérogation à A sur priv, puis deux renouvellements consécutifs, chacun justifié et doublement approuvé.
        Op : un troisième renouvellement consécutif est demandé.
        Attendu : **Refus** (plafond de deux renouvellements, à tester, non gelé).
        Fondement : § 12.6 (F-3)"""
        r = self.renouvellements(4)
        for x in r[:3]:
            self.ok(x)
        self.refus(r[3])

    def test_S_194(self):
        """S-194
        Pré : une dérogation à A sur priv, justification « j ».
        Op : un renouvellement consécutif est demandé avec la même justification.
        Attendu : **Refus.**
        Fondement : § 12.6"""
        self.ok(self.s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.priv], ['voir'], 'enquête', 'j', 10))
        self.s.avancer(10)
        self.refus(self.s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.priv], ['voir'], 'enquête', 'j', 10))

    def test_S_195(self):
        """S-195
        Pré : une dérogation à A sur priv, puis un renouvellement.
        Op : un second renouvellement consécutif, justifié et doublement approuvé, est demandé.
        Attendu : **Accepté.**
        Fondement : § 12.6"""
        r = self.renouvellements(3)
        self.ok(r[2])

    def test_S_196(self):
        """S-196
        Pré : une dérogation et deux renouvellements ; le délai de carence s'est ensuite écoulé.
        Op : une nouvelle dérogation est demandée.
        Attendu : **Accepté** : ce n'est plus un renouvellement consécutif.
        Fondement : § 12.6"""
        self.renouvellements(3)
        self.s.avancer(30)
        self.ok(self.s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.priv], ['voir'], 'enquête', 'nouvelle', 10))

    def test_S_197(self):
        """S-197
        Pré : dérogation valide à A sur O, finalité « vérification d'intégrité ».
        Op : A consulte O pour une autre finalité.
        Attendu : **Introuvable**, journalisé comme usage hors finalité.
        Fondement : § 12.4"""
        self.derog_existence()
        self.absent('A', self.O, finalite='curiosité')
        self.assertTrue(any(e['type'] == 'hors_finalite' for e in self.s.audit))

    def test_S_198(self):
        """S-198
        Pré : RS a posé un embargo de contenu sur O ; RS2 n'en est pas gardien.
        Op : RS2 lève l'embargo.
        Attendu : **Refus.**
        Fondement : § 11.5 (CD-06)"""
        pid = self.ok(self.s.creer_protection('RS', 'embargo_contenu', self.O))
        self.refus(self.s.lever_protection('RS2', pid))

    def test_S_199(self):
        """S-199
        Pré : comme S-198.
        Op : RS, gardien, lève l'embargo de contenu.
        Attendu : **Accepté.**
        Fondement : § 11.5"""
        pid = self.ok(self.s.creer_protection('RS', 'embargo_contenu', self.O))
        self.ok(self.s.lever_protection('RS', pid))

    def test_S_200(self):
        """S-200
        Pré : RS1 a posé un embargo d'existence sur O et a désigné RS2 co-gardien ; RS1 quitte ensuite P.
        Op : RS2 lève l'embargo.
        Attendu : **Accepté.**
        Fondement : § 11.2 (CD-17)"""
        self.nomme('R0', 'P', 'RS1', 'RS')
        pid = self.embargo(par='RS1')
        self.ok(self.s.designer_gardien('RS1', pid, 'RS2'))
        self.ok(self.s.quitter('RS1', 'P'))
        self.ok(self.s.lever_protection('RS2', pid))

    def test_S_201(self):
        """S-201
        Pré : RS gardien de l'embargo d'existence sur O ; V n'a aucun droit sur O.
        Op : RS désigne V gardien.
        Attendu : **Refus.**
        Fondement : § 11.2"""
        pid = self.embargo()
        self.refus(self.s.designer_gardien('RS', pid, 'V'))

    def test_S_202(self):
        """S-202
        Pré : TIT a délégué `voir` + `repartager` sur priv à V1 ; V1 a délégué `voir` sur priv à T (HP) ; TIT pose ensuite une interdiction d'action `voir` sur priv visant V1.
        Op : T consulte priv.
        Attendu : **Accordé** : une protection qui frappe un fondateur ne fait pas tomber une HP existante.
        Fondement : § 2.5"""
        self.deleg('TIT', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True)
        h = self.deleg('V1', ('acteur', 'T'), ['voir'], ('objet', self.priv))
        self.ok(self.s.creer_protection('TIT', 'interdiction_action', self.priv, destinataires={'V1'},
                                        actions={'voir'}))
        self.accorde('T', self.priv)
        self.assertEqual(self.s.habs[h].etat, 'active')

    def test_S_203(self):
        """S-203
        Pré : restriction légale sur priv ; TIT la conteste ; la contestation est en examen.
        Op : TIT consulte priv.
        Attendu : **Refus** : la restriction reste en vigueur pendant l'examen.
        Fondement : § 11.6"""
        pid = self.legale(self.priv)
        self.ok(self.s.contester('TIT', pid))
        self.refuse('TIT', self.priv)

    def test_S_204(self):
        """S-204
        Pré : comme S-203.
        Op : SUP3 et SUP4, distincts des créateurs, annulent la restriction ; puis TIT consulte priv.
        Attendu : **Accordé.**
        Fondement : § 11.6"""
        pid = self.legale(self.priv)
        self.ok(self.s.contester('TIT', pid))
        self.ok(self.s.examiner_contestation(('SUP3', 'SUP4'), pid, 'annulation'))
        self.accorde('TIT', self.priv)

    def test_S_205(self):
        """S-205
        Pré : comme S-203.
        Op : SUP1 (créateur) et SUP3 examinent la contestation.
        Attendu : **Refus.**
        Fondement : § 11.6"""
        pid = self.legale(self.priv)
        self.ok(self.s.contester('TIT', pid))
        self.refus(self.s.examiner_contestation(('SUP1', 'SUP3'), pid, 'annulation'))

    def test_S_206(self):
        """S-206
        Pré : R0 propriétaire et racine de P ; TIT titulaire de priv.
        Op : R0 consulte priv.
        Attendu : **Introuvable.**
        Fondement : I-4 ; § 10.1"""
        self.absent('R0', self.priv)

    def test_S_207(self):
        """S-207
        Pré : RS pose sur O une interdiction d'existence visant RS2.
        Op : RS2 consulte O.
        Attendu : **Introuvable.**
        Fondement : § 11.1 ; § 14 (étape 3)"""
        self.ok(self.s.creer_protection('RS', 'interdiction_existence', self.O, destinataires={'RS2'}))
        self.absent('RS2', self.O)


class S07_Selection(Base):
    """7. Partage sélectif"""

    def setUp(self):
        super().setUp()
        self.projet()
        self.colimacons()
        s = self.s
        self.s31 = self.obj('RS', titre='Sosa 31 BOVALO', type_='personne')
        self.s16 = self.obj('RS', titre='Sosa 16', type_='personne')
        self.s32 = self.obj('RS', titre='Sosa 32', type_='personne')
        self.jean = self.obj('RS', titre='Jean BOVALO', type_='personne')
        self.ass = self.obj('RS', titre='baptême', type_='assertion')
        s.objets[self.ass].mentions.add(self.jean)
        s.objets[self.s31].relations |= {self.s16, self.ass}
        s.objets[self.s16].relations |= {self.s32, self.jean}
        self.sel = self.ok(s.creer_selection('RS', 'P', {self.s31, self.ass}))

    def partager(self, actions=('voir',)):
        R = self.deleg('RS', ('role', 'CLM', 'collaborateur'), list(actions), ('selection', self.sel))
        self.ok(self.s.admettre('RS', R, 'CC'))
        return R

    def test_S_49(self):
        """S-49
        Pré : sélection active « BOVALO depuis le Sosa 31 », branche du Sosa 16 exclue ; HI `voir` au profit des collaborateurs de CLM ; CC admis.
        Op : CC recherche « Sosa 16 ».
        Attendu : Aucun résultat.
        Fondement : P24 ; § 13.3"""
        self.partager()
        self.assertEqual(self.s.rechercher('CC', 'Sosa 16'), [])

    def test_S_102(self):
        """S-102
        Pré : comme S-49.
        Op : CC parcourt les relations du Sosa 31.
        Attendu : Aucune relation vers le Sosa 16.
        Fondement : P24 ; DI-L16"""
        self.partager()
        self.assertNotIn(self.s16, self.ok(self.s.relations('CC', self.s31)))

    def test_S_103(self):
        """S-103
        Pré : comme S-49.
        Op : CC demande le nombre de personnes de P.
        Attendu : Le total vaut 1 : il n'inclut ni le Sosa 16 ni sa branche.
        Fondement : P24 ; § 15"""
        self.partager()
        self.assertEqual(self.s.compter('CC', espace='P', type_='personne'), 1)

    def test_S_104(self):
        """S-104
        Pré : comme S-49 ; l'HI accorde aussi `exporter`.
        Op : CC exporte les objets de P.
        Attendu : L'export ne contient rien du Sosa 16 ni de sa branche.
        Fondement : P24 ; § 15"""
        self.partager(('voir', 'exporter'))
        ex = self.ok(self.s.exporter('CC', list(self.s.objets)))
        ids = {x['id'] for x in ex['objets']}
        self.assertEqual(ids, {self.s31, self.ass})

    def test_S_50(self):
        """S-50
        Pré : comme S-49 ; Jean BOVALO appartient à la branche exclue du Sosa 16 ; l'assertion incluse « baptême » a pour verbatim « parrain Jean BOVALO ».
        Op : CC consulte l'assertion.
        Attendu : La mention de Jean BOVALO n'est pas observable.
        Fondement : DI-L16 ; DI-L21 ; § 14 (étape 7)"""
        self.partager()
        self.assertEqual(self.ok(self.s.rendre('CC', self.ass))['mentions'], [])

    def test_S_51(self):
        """S-51
        Pré : comme S-49 ; la personne vivante VV figure dans la sélection en mode `masqué`, en relation avec le Sosa 31.
        Op : CC consulte la branche (le Sosa 31 et ses relations).
        Attendu : Ni le nom, ni les attributs, ni les relations de VV ne sont observables.
        Fondement : DI-L21"""
        vv = self.obj('RS', titre='VV vivant', type_='personne')
        s = self.s
        self.ok(s.ecrire_reference('RS', self.s31, vv))
        self.sel = self.ok(s.creer_selection('RS', 'P', {self.s31, self.ass, vv}, masques={vv}))
        self.partager()
        self.assertNotIn(vv, self.ok(s.rendre('CC', self.s31))['relations'])
        self.absent('CC', vv)

    def test_S_52(self):
        """S-52
        Pré : comme S-49 ; la sélection est `révoquée`.
        Op : CC consulte un objet du dernier manifeste.
        Attendu : **Introuvable.**
        Fondement : § 13.3"""
        self.partager()
        self.ok(self.s.revoquer_selection('RS', self.sel))
        self.absent('CC', self.s31)

    def test_S_53(self):
        """S-53
        Pré : comme S-49 ; une proposition d'ajout du Sosa 16 est en attente.
        Op : RS réduit la sélection (retrait de l'assertion) ; puis CC consulte le Sosa 16.
        Attendu : **Introuvable** : une proposition en attente n'est jamais servie.
        Fondement : § 13.3"""
        self.partager()
        self.assertEqual(self.ok(self.s.ajouter_a_selection(self.s.selections[self.sel].auteur, self.sel, self.s16)),
                         'proposition')
        self.ok(self.s.reduire_selection('RS', self.sel, {self.ass}))
        self.absent('CC', self.s16)

    def test_S_54(self):
        """S-54
        Pré : RS a créé une HI `voir` sur la sélection S au profit du rôle `collaborateur` de CLM, en `approbation préalable`.
        Op : RS admet CC ; puis CC consulte le Sosa 31.
        Attendu : **Accordé.**
        Fondement : § 13.3 ; § 9.3"""
        R = self.deleg('RS', ('role', 'CLM', 'collaborateur'), ['voir'], ('selection', self.sel))
        self.ok(self.s.admettre('RS', R, 'CC'))
        self.accorde('CC', self.s31)

    def test_S_55(self):
        """S-55
        Pré : comme S-54 ; RS2 pose sur le Sosa 31 un embargo d'existence dont ni RS ni CC ne sont bénéficiaires.
        Op : CC consulte le Sosa 31.
        Attendu : **Introuvable.**
        Fondement : § 14 (étape 3)"""
        self.partager()
        self.ok(self.s.creer_protection('RS2', 'embargo_existence', self.s31))
        self.absent('CC', self.s31)


class S08_HorsLigne(Base):
    """8. Réutilisation, révocation, hors ligne, contributions"""

    def setUp(self):
        super().setUp()
        self.projet()

    def copie(self, **attrs):
        s = self.s
        self.ok(s.creer_espace('QQ', 'Q'))
        self.nomme('QQ', 'Q', 'M', 'collaborateur')
        src = self.obj('RS', titre='source', **attrs)
        R = self.deleg('RS', ('acteur', 'M'), ['voir', 'reutiliser'], ('objet', src))
        cid = self.ok(s.reutiliser('M', src, 'Q'))
        return R, cid

    def selection_partagee(self):
        s = self.s
        self.ok(s.creer_espace('RT', 'TS'))
        m0 = self.obj('M', 'Q', perso=True, titre='m0')
        sel = self.ok(s.creer_selection('M', 'Q', {m0}))
        self.deleg('M', ('role', 'TS', 'collaborateur'), ['voir'], ('selection', sel))
        return sel

    def test_S_56(self):
        """S-56
        Pré : M, membre de Q, a repris une copie Q' grâce à une habilitation `réutiliser` active ; l'habilitation est ensuite close.
        Op : M consulte Q'.
        Attendu : **Accordé.**
        Fondement : DI-A38 ; § 13.11"""
        R, cid = self.copie()
        self.ok(self.s.clore('RS', R))
        self.accorde('M', cid)

    def test_S_57(self):
        """S-57
        Pré : comme S-56 ; licence de Q' autorisant la redistribution ; aucune protection ni droit de tiers ; M a
        partagé sa sélection avec le rôle collaborateur de TS, où N est collaborateur.
        Op : M inclut Q' dans sa sélection partagée, puis active la proposition ; M admet N ; N consulte Q'.
        Attendu : L'inclusion crée une **proposition**, sans effet sur l'accès (N : introuvable) ; après
        l'activation et l'admission, N **voit** Q'.
        Fondement : DI-A41 ; § 13.3 ; § 13.11"""
        R, cid = self.copie()
        sel = self.selection_partagee()
        h = next(x.id for x in self.s.habs.values() if x.perimetre == ('selection', sel))
        self.nomme('RT', 'TS', 'N', 'collaborateur')
        self.assertEqual(self.ok(self.s.ajouter_a_selection('M', sel, cid)), 'proposition')
        self.ok(self.s.admettre('M', h, 'N'))
        self.absent('N', cid)
        self.ok(self.s.activer_proposition('M', sel, cid))
        self.accorde('N', cid)

    def test_S_73(self):
        """S-73
        Pré : comme S-57, mais la licence interdit la redistribution.
        Op : même opération.
        Attendu : **Refus.**
        Fondement : DI-A41"""
        R, cid = self.copie(licence_redistribution=False)
        sel = self.selection_partagee()
        self.refus(self.s.ajouter_a_selection('M', sel, cid))

    def test_S_74(self):
        """S-74
        Pré : comme S-57, mais Q' est sous embargo de contenu.
        Op : même opération.
        Attendu : **Refus.**
        Fondement : DI-A41 ; A5"""
        R, cid = self.copie()
        self.ok(self.s.creer_protection('M', 'embargo_contenu', cid))
        sel = self.selection_partagee()
        self.refus(self.s.ajouter_a_selection('M', sel, cid))

    def test_S_105(self):
        """S-105
        Pré : comme S-57, mais un droit de tiers déclaré s'oppose à la diffusion de Q'.
        Op : même opération.
        Attendu : **Refus.**
        Fondement : DI-A41"""
        R, cid = self.copie(droit_tiers_oppose=True)
        sel = self.selection_partagee()
        self.refus(self.s.ajouter_a_selection('M', sel, cid))

    def test_S_58(self):
        """S-58
        Pré : décision positive en cache pour M2 sur o ; l'habilitation de M2 est close à T.
        Op : M2 demande o en ligne juste après T.
        Attendu : **Refus.**
        Fondement : A6 ; § 13.10"""
        R = self.deleg('RS', ('acteur', 'M2'), ['voir'], ('objet', self.o))
        self.ok(self.s.acces_en_ligne('M2', self.o, 'voir'))
        self.ok(self.s.clore('RS', R))
        self.refus(self.s.acces_en_ligne('M2', self.o, 'voir'))

    def hors_ligne(self, actions=('voir',), **kw):
        R = self.deleg('RS', ('acteur', 'M'), list(actions), ('objet', self.o), **kw)
        self.ok(self.s.activer_replication('M', 'app', 'P'))
        return R

    def test_S_59(self):
        """S-59
        Pré : appareil de M hors ligne, réplique avec échéance locale T0 + 30 ; révocation à T = 5.
        Op : M consulte o hors ligne à 10 (< T0 + 30).
        Attendu : **Accordé** localement (résidu reconnu).
        Fondement : § 13.9"""
        R = self.hors_ligne()
        self.s.avancer(5)
        self.ok(self.s.clore('RS', R))
        self.s.avancer(5)
        self.ok(self.s.consulter_hors_ligne('app', self.o))

    def test_S_106(self):
        """S-106
        Pré : comme S-59.
        Op : l'appareil se synchronise ; puis M consulte o hors ligne.
        Attendu : **Refus** : o a été retiré de l'appareil.
        Fondement : § 13.9 ; A6"""
        R = self.hors_ligne()
        self.ok(self.s.clore('RS', R))
        self.ok(self.s.synchroniser('app'))
        self.refus(self.s.consulter_hors_ligne('app', self.o))

    def test_S_107(self):
        """S-107
        Pré : comme S-59, l'habilitation portant aussi `commenter` ; M a annoté o hors ligne à t = 2, avant la révocation à T = 5.
        Op : l'appareil se synchronise à 6.
        Attendu : La contribution est reçue, réévaluée à l'intégration, **refusée**, et conservée.
        Fondement : § 13.8 (CP-27)"""
        R = self.hors_ligne(('voir', 'commenter'))
        self.s.avancer(2)
        k = self.ok(self.s.contribuer_hors_ligne('app', self.o, 'commenter', 'ma note'))
        self.s.avancer(3)
        self.ok(self.s.clore('RS', R))
        self.s.avancer(1)
        self.ok(self.s.synchroniser('app'))
        self.assertEqual(self.ok(self.s.lire_contribution('M', k)), dict(etat='refusee', delta='ma note'))
        self.assertEqual(self.s.lire_contribution('RS', k).code, 'introuvable')

    def test_S_61(self):
        """S-61
        Pré : comme S-107, après la synchronisation.
        Op : M relit sa contribution refusée.
        Attendu : M ne lit que son delta, sans rien du contenu retiré.
        Fondement : § 13.8 (CP-27)"""
        R = self.hors_ligne(('voir', 'commenter'))
        k = self.ok(self.s.contribuer_hors_ligne('app', self.o, 'commenter', 'ma note'))
        self.ok(self.s.clore('RS', R))
        self.ok(self.s.synchroniser('app'))
        self.assertEqual(self.ok(self.s.lire_contribution('M', k)), dict(etat='refusee', delta='ma note'))

    def test_S_60(self):
        """S-60
        Pré : espace personnel PM à membre unique M, qui contient un objet personnel de M.
        Op : M active la réplication sans échéance.
        Attendu : **Refus** : les objets personnels du titulaire sont des données protégées.
        Fondement : § 13.9"""
        self.ok(self.s.creer_espace('M', 'PM', personnel=True))
        self.obj('M', 'PM', perso=True)
        self.refus(self.s.activer_replication('M', 'app', 'PM', sans_echeance=True))

    def test_S_83(self):
        """S-83
        Pré : espace à membre unique qui ne contient que des objets publics librement redistribuables.
        Op : le membre active la réplication sans échéance.
        Attendu : **Accepté.**
        Fondement : § 13.9"""
        self.ok(self.s.creer_espace('M', 'PM2'))
        x = self.obj('M', 'PM2', diffusable=True)
        self.ok(self.s.modifier_visibilite('M', x, 'public'))
        self.ok(self.s.activer_replication('M', 'app', 'PM2', sans_echeance=True))

    def test_S_138(self):
        """S-138
        Pré : plafond de la plateforme : 30 jours.
        Op : ADM fixe une échéance locale de 100 jours pour P.
        Attendu : **Refus.**
        Fondement : § 13.9"""
        self.refus(self.s.fixer_echeance_locale('ADM', 'P', 100))

    def test_S_62(self):
        """S-62
        Pré : CC, collaborateur de CLM, admis au titre d'une HI `voir` + `commenter` sur la sélection S de P ; l'HI est active à l'intégration.
        Op : CC commente hors ligne un objet de S, puis se synchronise.
        Attendu : Commentaire **intégré**.
        Fondement : § 13.8 ; § 13.3"""
        self.colimacons()
        sel = self.ok(self.s.creer_selection('RS', 'P', {self.o}))
        R = self.deleg('RS', ('role', 'CLM', 'collaborateur'), ['voir', 'commenter'], ('selection', sel))
        self.ok(self.s.admettre('RS', R, 'CC'))
        self.ok(self.s.activer_replication('CC', 'appc', 'P'))
        k = self.ok(self.s.contribuer_hors_ligne('appc', self.o, 'commenter', 'note'))
        self.ok(self.s.synchroniser('appc'))
        self.assertEqual(self.s.contributions[k].etat, 'integree')

    def test_S_63(self):
        """S-63
        Pré : priv invisible pour COL, qui en connaît l'identifiant ; identifiant fictif F ; COL peut éditer o.
        Op : COL écrit dans o une référence vers priv, puis vers F.
        Attendu : Même erreur et même délai.
        Fondement : A5 ; TI-11 ; § 15"""
        self.assertEqual(self.s.ecrire_reference('COL', self.o, self.priv),
                         self.s.ecrire_reference('COL', self.o, 'o-fictif'))

    def test_S_208(self):
        """S-208
        Pré : RS a délégué `voir` sur o à M en imposant une échéance hors ligne de 5 jours ; M a répliqué P.
        Op : M consulte o hors ligne au 6e jour.
        Attendu : **Refus.**
        Fondement : § 13.9"""
        self.hors_ligne(echeance_hors_ligne=5)
        self.s.avancer(6)
        self.refus(self.s.consulter_hors_ligne('app', self.o))


class S09_Mecanismes(Base):
    """9. Visibilité, unicités, publications, campagnes, archivage, lots, gouvernance"""

    def setUp(self):
        super().setUp()
        self.projet()

    def test_S_139(self):
        """S-139
        Pré : COL détient `éditer` sur l'objet o du contenu de P ; o est diffusable.
        Op : COL passe o en visibilité `public`.
        Attendu : **Refus** : ni titulaire ni RS.
        Fondement : § 13.2"""
        self.s.objets[self.o].diffusable = True
        self.refus(self.s.modifier_visibilite('COL', self.o, 'public'))

    def test_S_140(self):
        """S-140
        Pré : RS de P ; évaluation de diffusabilité favorable sur o.
        Op : RS passe o en `public` ; puis un lecteur anonyme consulte o.
        Attendu : **Accordé.**
        Fondement : § 13.2 ; § 14 (étape 6)"""
        self.s.objets[self.o].diffusable = True
        self.ok(self.s.modifier_visibilite('RS', self.o, 'public'))
        self.accorde(None, self.o)

    def test_S_141(self):
        """S-141
        Pré : o, objet du contenu de P, est public et diffusable ; COL collaborateur.
        Op : COL réduit la visibilité de o à `projet`.
        Attendu : **Refus** : ni titulaire ni RS.
        Fondement : § 13.2"""
        self.s.objets[self.o].diffusable = True
        self.ok(self.s.modifier_visibilite('RS', self.o, 'public'))
        self.refus(self.s.modifier_visibilite('COL', self.o, 'projet'))

    def test_S_209(self):
        """S-209
        Pré : RS de P.
        Op : RS réduit la visibilité de o à `privé`.
        Attendu : **Refus** : le contenu ne descend jamais sous `projet`.
        Fondement : § 13.2"""
        self.refus(self.s.modifier_visibilite('RS', self.o, 'prive'))

    def test_S_142(self):
        """S-142
        Pré : o public ; V bénéficie d'une habilitation explicite `voir` sur o.
        Op : RS réduit la visibilité de o à `projet` ; puis V consulte o.
        Attendu : **Accordé** : l'habilitation explicite est maintenue.
        Fondement : § 13.2"""
        self.s.objets[self.o].diffusable = True
        self.ok(self.s.modifier_visibilite('RS', self.o, 'public'))
        self.deleg('RS', ('acteur', 'V'), ['voir'], ('objet', self.o))
        self.ok(self.s.modifier_visibilite('RS', self.o, 'projet'))
        self.accorde('V', self.o)

    def test_S_143(self):
        """S-143
        Pré : objet public o, sans protection.
        Op : un lecteur anonyme, sans aucun droit, consulte o.
        Attendu : **Accordé.**
        Fondement : § 14 (étape 6)"""
        self.s.objets[self.o].diffusable = True
        self.ok(self.s.modifier_visibilite('RS', self.o, 'public'))
        self.accorde(None, self.o)

    def test_S_64(self):
        """S-64
        Pré : M1 a une base justificative de portée `projet` sur l'assertion A.
        Op : M2 crée une base de portée `projet` sur A.
        Attendu : Conflit signalé ; M2 voit la base de M1.
        Fondement : § 13.7"""
        self.nomme('RS', 'P', 'M1', 'collaborateur')
        self.nomme('RS', 'P', 'M2', 'collaborateur')
        b1 = self.ok(self.s.creer_base('M1', self.o, 'projet'))
        r = self.s.creer_base('M2', self.o, 'projet')
        self.assertEqual((r.code, r.valeur), ('conflit', b1))

    def test_S_91(self):
        """S-91
        Pré : M1 a une base de portée `privée` sur A.
        Op : M2 crée sa base de portée `privée` sur A.
        Attendu : **Accepté**, sans conflit.
        Fondement : § 13.7"""
        self.nomme('RS', 'P', 'M1', 'collaborateur')
        self.nomme('RS', 'P', 'M2', 'collaborateur')
        self.ok(self.s.creer_base('M1', self.o, 'privee'))
        self.ok(self.s.creer_base('M2', self.o, 'privee'))

    def test_S_144(self):
        """S-144
        Pré : M1 a une base de portée `privée` sur A, invisible pour M2.
        Op : M2 crée une base de portée `projet` sur A.
        Attendu : **Accepté**, sans conflit.
        Fondement : § 13.7"""
        self.nomme('RS', 'P', 'M1', 'collaborateur')
        self.nomme('RS', 'P', 'M2', 'collaborateur')
        self.ok(self.s.creer_base('M1', self.o, 'privee'))
        self.ok(self.s.creer_base('M2', self.o, 'projet'))

    def test_S_217(self):
        """S-217
        Pré : ADM administrateur de P, sans `voir` sur l'assertion o.
        Op : ADM crée une base justificative de portée `projet` sur o.
        Attendu : **Refus**, indistinguable d'une absence.
        Fondement : § 13.7 (CD-22)"""
        self.assertEqual(self.s.creer_base('ADM', self.o, 'projet').code, 'introuvable')

    def test_S_65(self):
        """S-65
        Pré : série S de l'espace SA ; numéro N de l'espace SB ; aucune acceptation par un détenteur d'`administrer` sur SA.
        Op : RB, racine de SB, insère N dans S au rang 13.
        Attendu : **Refus** ; le rang 13 reste libre.
        Fondement : § 13.6"""
        self.ok(self.s.creer_espace('RA', 'SA'))
        self.ok(self.s.creer_espace('RB', 'SB'))
        serie = self.ok(self.s.creer_serie('RA', 'SA'))
        N = self.obj('RB', 'SB')
        self.refus(self.s.inserer_serie('RB', serie, N, 13))
        self.assertNotIn(13, self.s.series[serie]['rangs'])

    def test_S_66(self):
        """S-66
        Pré : campagne en phase indépendante ; les participants Y et W sont reliés à des acteurs ; W a répondu.
        Op : Y consulte les réponses des autres participants.
        Attendu : Rien n'est servi.
        Fondement : § 13.14 ; § 2.4"""
        cid = self.ok(self.s.creer_campagne('RS', 'P', {'Y': 'Y', 'W': 'W'}))
        self.ok(self.s.repondre('W', cid, 'réponse de W'))
        self.assertEqual(self.ok(self.s.consulter_reponses('Y', cid)), {})

    def test_S_92(self):
        """S-92
        Pré : campagne en phase indépendante ; la personne Yp n'est reliée à aucun acteur.
        Op : Yp répond.
        Attendu : **Refus.**
        Fondement : § 13.14"""
        cid = self.ok(self.s.creer_campagne('RS', 'P', {'Yp': None}))
        self.refus(self.s.repondre(None, cid, 'réponse'))

    def test_S_145(self):
        """S-145
        Pré : P archivé ; COL collaborateur.
        Op : COL édite un objet du contenu de P.
        Attendu : **Refus.**
        Fondement : § 5.1"""
        self.ok(self.s.archiver('R0', 'P'))
        self.refuse('COL', self.o, 'editer')

    def test_S_210(self):
        """S-210
        Pré : P archivé.
        Op : RS crée une habilitation `voir` sur o au profit de V.
        Attendu : **Refus.**
        Fondement : § 5.1"""
        self.ok(self.s.archiver('R0', 'P'))
        self.refus(self.s.deleguer('RS', ('acteur', 'V'), ['voir'], ('objet', self.o)))

    def test_S_211(self):
        """S-211
        Pré : P archivé ; RS2 n'est pas propriétaire.
        Op : RS2 rouvre P.
        Attendu : **Refus.**
        Fondement : § 5.1 ; § 10.1"""
        self.ok(self.s.archiver('R0', 'P'))
        self.refus(self.s.rouvrir('RS2', 'P'))

    def test_S_212(self):
        """S-212
        Pré : HI R `voir` sur o au profit de V ; P archivé ; RS clôt R pendant l'archivage ; R0 rouvre P.
        Op : V consulte o.
        Attendu : **Introuvable** : la réouverture ne réactive rien.
        Fondement : § 5.1 ; A4"""
        R = self.deleg('RS', ('acteur', 'V'), ['voir'], ('objet', self.o))
        self.ok(self.s.archiver('R0', 'P'))
        self.ok(self.s.clore('RS', R))
        self.ok(self.s.rouvrir('R0', 'P'))
        self.absent('V', self.o)

    def test_S_213(self):
        """S-213
        Pré : o diffusable ; COL collaborateur.
        Op : COL contribue o au Core.
        Attendu : **Refus.**
        Fondement : § 7.1"""
        self.s.objets[self.o].diffusable = True
        self.refus(self.s.contribuer_core('COL', self.o))

    def test_S_214(self):
        """S-214
        Pré : o diffusable.
        Op : RS contribue o au Core.
        Attendu : **Accordé.**
        Fondement : § 7.1"""
        self.s.objets[self.o].diffusable = True
        self.ok(self.s.contribuer_core('RS', self.o))

    def test_S_215(self):
        """S-215
        Pré : o non diffusable.
        Op : RS contribue o au Core.
        Attendu : **Refus.**
        Fondement : § 7.1"""
        self.refus(self.s.contribuer_core('RS', self.o))

    def test_S_216(self):
        """S-216
        Pré : RS a délégué `voir` + `repartager` sur o à COL ; o diffusable.
        Op : COL désigne le public bénéficiaire de `voir` sur o.
        Attendu : **Refus.**
        Fondement : § 13.1"""
        self.s.objets[self.o].diffusable = True
        self.deleg('RS', ('acteur', 'COL'), ['voir'], ('objet', self.o), repartager=True)
        self.refus(self.s.deleguer('COL', ('public',), ['voir'], ('objet', self.o)))

    def lot(self):
        self.o2 = self.obj('RS', titre='o2')
        self.o3 = self.obj('RS', titre='o3')
        return self.ok(self.s.creer_lot('RS', 'P', {self.o, self.o2}))

    def test_S_218(self):
        """S-218
        Pré : lot {o, o2} délégué en `voir` à V jusqu'à 10.
        Op : RS ajoute o3 au lot ; puis V consulte o3.
        Attendu : **Introuvable** : la liste est figée.
        Fondement : § 13.4"""
        lid = self.lot()
        self.ok(self.s.deleguer_lot('RS', lid, ('acteur', 'V'), ['voir'], echeance=10))
        self.ok(self.s.ajouter_au_lot('RS', lid, self.o3))
        self.absent('V', self.o3)

    def test_S_219(self):
        """S-219
        Pré : lot {o, o2}.
        Op : RS délègue le lot en `valider` à V.
        Attendu : **Refus.**
        Fondement : § 13.4"""
        lid = self.lot()
        self.refus(self.s.deleguer_lot('RS', lid, ('acteur', 'V'), ['valider'], echeance=10))

    def test_S_220(self):
        """S-220
        Pré : lot {o, o2}.
        Op : RS délègue le lot en `voir` à V sans échéance.
        Attendu : **Refus.**
        Fondement : § 13.4"""
        lid = self.lot()
        self.refus(self.s.deleguer_lot('RS', lid, ('acteur', 'V'), ['voir'], echeance=None))

    def test_S_221(self):
        """S-221
        Pré : lot {o, o2} délégué en `voir` à V ; le lot est clos, puis rouvert.
        Op : V consulte o.
        Attendu : **Introuvable.**
        Fondement : § 13.4 ; A4"""
        lid = self.lot()
        self.ok(self.s.deleguer_lot('RS', lid, ('acteur', 'V'), ['voir'], echeance=10))
        self.ok(self.s.clore_lot('RS', lid))
        self.ok(self.s.rouvrir_lot('RS', lid))
        self.absent('V', self.o)

    def test_S_222(self):
        """S-222
        Pré : RS a délégué `voir` sur o à V.
        Op : ADM demande l'explication des accès de V à o.
        Attendu : L'explication cite l'HI de RS.
        Fondement : § 10.3 (OB-24)"""
        R = self.deleg('RS', ('acteur', 'V'), ['voir'], ('objet', self.o))
        ex = self.ok(self.s.expliquer_acces('ADM', 'V', self.o))
        self.assertIn(('HI', R), ex['voir'])

    def test_S_223(self):
        """S-223
        Pré : T sous embargo d'existence dont ADM n'est pas bénéficiaire ; V a une habilitation sur T.
        Op : ADM demande l'explication des accès de V à T.
        Attendu : **Introuvable.**
        Fondement : § 10.3 ; § 15"""
        T = self.obj('RS', titre='T')
        self.ok(self.s.creer_protection('RS', 'embargo_existence', T))
        self.deleg('RS', ('acteur', 'V'), ['voir'], ('objet', T))
        self.assertEqual(self.s.expliquer_acces('ADM', 'V', T).code, 'introuvable')

    def test_S_224(self):
        """S-224
        Pré : TIT a partagé priv avec V.
        Op : ADM affiche la liste des habilitations de P.
        Attendu : Aucune ligne ne porte sur priv.
        Fondement : § 10.3 (CD-23)"""
        self.deleg('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv))
        lignes = self.ok(self.s.lister_habilitations('ADM', 'P'))['lignes']
        self.assertFalse(any(l['cible'] == ('objet', self.priv) for l in lignes))

    def test_S_225(self):
        """S-225
        Pré : ADM prépare une invitation de X dans P.
        Op : X consulte o.
        Attendu : **Introuvable** : préparer une invitation ne confère rien.
        Fondement : § 10.2"""
        self.ok(self.s.preparer_invitation('ADM', 'P', 'X'))
        self.absent('X', self.o)

    def test_S_226(self):
        """S-226
        Pré : ADM propose une prise en charge de P par l'espace F, dont AF est administrateur.
        Op : AF consulte o.
        Attendu : **Introuvable.**
        Fondement : § 10.2"""
        self.ok(self.s.creer_espace('RF', 'F'))
        self.ok(self.s.nommer_administrateur('RF', 'F', 'AF'))
        self.ok(self.s.proposer_prise_en_charge('ADM', 'P', 'F'))
        self.absent('AF', self.o)


class S10_TransfertObjets(Base):
    """10. Transfert : objets personnels, atomicité, réémission"""

    def setUp(self):
        super().setUp()
        self.espace_transfere()
        self.O1 = self.obj('C', 'ESP', perso=True, titre='O1')

    def voie_b(self):
        self.ok(self.s.choisir_voie('C', self.tid, self.O1, 'b'))

    def test_S_67(self):
        """S-67
        Pré : C titulaire de l'objet `privé` O1 (sans embargo) dans ESP ; voie (b) retenue ; K a accepté explicitement O1.
        Op : K accepte le transfert ; puis K consulte O1.
        Attendu : **Accordé** (K titulaire).
        Fondement : § 10.5 (b) ; § 10.7"""
        self.voie_b()
        self.presenter()
        self.ok(self.s.accepter_objet('K', self.tid, self.O1))
        self.ok(self.accepter())
        self.accorde('K', self.O1)

    def test_S_227(self):
        """S-227
        Pré : comme S-67.
        Op : contrôle de la paternité de O1 après le transfert.
        Attendu : La paternité de C reste attachée à O1.
        Fondement : § 10.5"""
        self.voie_b()
        self.presenter()
        self.ok(self.s.accepter_objet('K', self.tid, self.O1))
        self.ok(self.accepter())
        self.assertEqual(self.s.objets[self.O1].paternite, 'C')

    def test_S_93(self):
        """S-93
        Pré : comme S-67, mais K n'a pas accepté explicitement O1.
        Op : K accepte le transfert.
        Attendu : **Refus** ; rien n'est appliqué.
        Fondement : § 10.5 ; § 10.7 (I-11)"""
        self.voie_b()
        self.presenter()
        avant = self.instantane()
        self.refus(self.accepter())
        self.assertEqual(self.instantane(), avant)

    def test_S_68(self):
        """S-68
        Pré : C titulaire de O1 ; voie (a) avec copie (c), licence permettant la copie.
        Op : K accepte ; puis C consulte la copie dans son espace personnel.
        Attendu : **Accordé** ; la copie porte une `FILIATION` vers O1, resté dans ESP.
        Fondement : § 10.5 (c)"""
        self.ok(self.s.choisir_voie('C', self.tid, self.O1, 'a', copie=True))
        self.transferer()
        copie = [o for o in self.s.objets.values() if o.copie_de == self.O1][0]
        self.accorde('C', copie.id)
        self.assertEqual(self.s.objets[self.O1].espace, 'ESP')

    def test_S_75(self):
        """S-75
        Pré : comme S-68, mais la licence interdit la copie.
        Op : K accepte.
        Attendu : **Refus** ; rien n'est appliqué.
        Fondement : § 10.5 (blocage) ; § 10.7"""
        self.s.objets[self.O1].licence_copie = False
        self.ok(self.s.choisir_voie('C', self.tid, self.O1, 'a', copie=True))
        self.presenter()
        avant = self.instantane()
        self.refus(self.accepter())
        self.assertEqual(self.instantane(), avant)

    def test_S_84(self):
        """S-84
        Pré : voie (b) pour O1, acceptée par K ; voie (a) avec copie pour O2 ; un consentement couvrant O1 est retiré entre la présentation et l'acceptation.
        Op : K accepte.
        Attendu : **Refus** de toute l'acceptation.
        Fondement : § 10.7"""
        O2 = self.obj('C', 'ESP', perso=True, titre='O2')
        self.voie_b()
        self.ok(self.s.choisir_voie('C', self.tid, O2, 'a', copie=True))
        self.presenter()
        self.ok(self.s.accepter_objet('K', self.tid, self.O1))
        self.s.objets[self.O1].consentement_retire = True
        avant = self.instantane()
        self.refus(self.accepter())
        self.assertEqual(self.instantane(), avant)

    def hp_c(self, **kw):
        return self.deleg('C', ('acteur', 'V'), ['voir'], ('objet', self.O1), **kw)

    def test_S_85(self):
        """S-85
        Pré : O1 en voie (b) ; HP de C `voir` sur O1 au profit de V jusqu'à 20.
        Op : C annonce sa réémission jusqu'à 30.
        Attendu : **Refus** de l'annonce : une réémission est à l'identique ou plus étroite (V1.6 : contrôlé dès
        l'annonce).
        Fondement : § 10.5"""
        h = self.hp_c(echeance=20)
        self.voie_b()
        self.refus(self.s.annoncer_reemission('C', self.tid, h, echeance=30))
        self.ok(self.s.annoncer_reemission('C', self.tid, h, echeance=20))

    def test_S_86(self):
        """S-86
        Pré : O1 en voie (b), accepté par K ; HP de C sur O1 au profit de V, non réémise.
        Op : K accepte ; puis V consulte O1.
        Attendu : **Introuvable.**
        Fondement : § 10.5 ; § 10.7"""
        self.hp_c()
        self.voie_b()
        self.presenter()
        self.ok(self.s.accepter_objet('K', self.tid, self.O1))
        self.ok(self.accepter())
        self.absent('V', self.O1)

    def test_S_87(self):
        """S-87
        Pré : O1 en voie (b), accepté par K ; HP de C `voir` sur O1 au profit de V, qui expire à 5 ; réémission annoncée à l'identique.
        Op : K accepte à 6 ; puis V consulte O1.
        Attendu : L'acceptation **réussit**, la réémission est **abandonnée**, et V reçoit « introuvable » (il n'a
        plus aucun droit sur O1, devenu objet de K).
        Fondement : § 10.5 (CT-09) ; A4"""
        h = self.hp_c(echeance=5)
        self.voie_b()
        self.ok(self.s.annoncer_reemission('C', self.tid, h))
        self.presenter()
        self.ok(self.s.accepter_objet('K', self.tid, self.O1))
        self.s.avancer(6)
        self.ok(self.accepter())
        self.assertFalse(any(x.reemission_de == h for x in self.s.habs.values()))
        self.absent('V', self.O1)

    def test_S_88(self):
        """S-88
        Pré : HI de C au profit du rôle `collaborateur` de F ; transfert présenté ; F nomme ensuite de nouveaux collaborateurs.
        Op : K accepte avec l'empreinte présentée.
        Attendu : **Accepté** : aucun veto implicite d'un tiers.
        Fondement : § 10.6 (F-4)"""
        self.ok(self.s.creer_espace('RF', 'F'))
        self.deleg('C', ('role', 'F', 'collaborateur'), ['voir'], ('contenu', 'ESP'))
        self.ok(self.s.choisir_voie('C', self.tid, self.O1, 'a'))
        emp = self.presenter()
        self.nomme('RF', 'F', 'N', 'collaborateur')
        self.nomme('RF', 'F', 'N2', 'collaborateur')
        self.ok(self.accepter(emp))

    def test_S_89(self):
        """S-89
        Pré : ADME administrateur de ESP ; C titulaire de O1.
        Op : ADME crée une habilitation `voir` sur O1 au profit du `public`.
        Attendu : **Refus.**
        Fondement : A1 ; A2 ; § 13.1"""
        self.refus(self.s.deleguer('ADME', ('public',), ['voir'], ('objet', self.O1)))

    def test_S_90(self):
        """S-90
        Pré : RS2 a nommé RS3 RS de ESP ; RS3 n'a pas accepté.
        Op : RS3 consulte un objet du contenu de ESP.
        Attendu : **Introuvable.**
        Fondement : § 7.2"""
        self.ok(self.s.nommer('RS2', 'ESP', 'RS3', 'RS'))
        self.absent('RS3', self.ot)

    def test_S_146(self):
        """S-146
        Pré : C (comme RS) a signé l'HI D `voir` sur le contenu de ESP au profit de V.
        Op : K accepte sans réémission ; puis V consulte un objet du contenu de ESP.
        Attendu : **Accordé** : l'HI survit au transfert.
        Fondement : § 10.7 ; I-8 (F-1)"""
        self.deleg('C', ('acteur', 'V'), ['voir'], ('contenu', 'ESP'))
        self.ok(self.s.choisir_voie('C', self.tid, self.O1, 'a'))
        self.transferer()
        self.accorde('V', self.ot)

    def test_S_147(self):
        """S-147
        Pré : C a nommé RS2 (base de la section).
        Op : K accepte ; puis RS2 consulte le contenu de ESP, sans nouvelle acceptation.
        Attendu : **Accordé.**
        Fondement : § 10.7 (F-1)"""
        self.ok(self.s.choisir_voie('C', self.tid, self.O1, 'a'))
        self.transferer()
        self.accorde('RS2', self.ot)

    def test_S_148(self):
        """S-148
        Pré : comme S-147 ; RS2 avait délégué `voir` sur ot à V avant le transfert.
        Op : après l'acceptation, V consulte ot.
        Attendu : **Accordé.**
        Fondement : § 10.7 (F-1)"""
        self.deleg('RS2', ('acteur', 'V'), ['voir'], ('objet', self.ot))
        self.ok(self.s.choisir_voie('C', self.tid, self.O1, 'a'))
        self.transferer()
        self.accorde('V', self.ot)

    def test_S_228(self):
        """S-228
        Pré : O1 en voie (b), accepté par K ; HP de C `voir` sur O1 au profit de V, réémission annoncée à l'identique.
        Op : K accepte ; puis V consulte O1.
        Attendu : **Accordé** ; la nouvelle HP a K pour auteur et un lien « réémission de ».
        Fondement : § 10.5"""
        h = self.hp_c()
        self.voie_b()
        self.ok(self.s.annoncer_reemission('C', self.tid, h))
        self.presenter()
        self.ok(self.s.accepter_objet('K', self.tid, self.O1))
        self.ok(self.accepter())
        self.accorde('V', self.O1)
        nouvelle = [x for x in self.s.habs.values() if x.reemission_de == h][0]
        self.assertEqual(nouvelle.auteur, 'K')

    def hp_groupe(self, annoncer_m):
        self.ok(self.s.creer_groupe('C', 'ESP', 'GK'))
        self.ok(self.s.ajouter_membre('C', 'GK', 'M'))
        h = self.deleg('C', ('groupe', 'GK'), ['voir'], ('objet', self.O1))
        self.ok(self.s.admettre('C', h, 'M'))
        self.voie_b()
        self.ok(self.s.annoncer_reemission('C', self.tid, h, admissions={'M'} if annoncer_m else ()))
        self.presenter()
        self.ok(self.s.accepter_objet('K', self.tid, self.O1))
        self.ok(self.accepter())

    def test_S_229(self):
        """S-229
        Pré : HP de C `voir` sur O1 au profit du groupe GK, M admis par C ; O1 en voie (b) ; réémission annoncée avec l'admission de M.
        Op : K accepte ; puis M consulte O1.
        Attendu : **Accordé.**
        Fondement : § 10.5 (CD-14)"""
        self.hp_groupe(True)
        self.accorde('M', self.O1)

    def test_S_230(self):
        """S-230
        Pré : comme S-229, mais l'annonce ne liste pas l'admission de M.
        Op : K accepte ; puis M consulte O1.
        Attendu : **Introuvable.**
        Fondement : § 10.5 (CD-14)"""
        self.hp_groupe(False)
        self.absent('M', self.O1)

    def test_S_231(self):
        """S-231
        Pré : C a posé un embargo d'existence sur son objet O1, dont K n'est pas bénéficiaire.
        Op : C retient la voie (b) pour O1.
        Attendu : **Refus** : K doit voir l'objet.
        Fondement : § 10.5 (F-4)"""
        self.ok(self.s.creer_protection('C', 'embargo_existence', self.O1))
        self.refus(self.s.choisir_voie('C', self.tid, self.O1, 'b'))


class S11_V15(Base):
    """11. Arbitrages G-1 à G-11 et corrections V1.5"""

    def setUp(self):
        super().setUp()
        self.projet()

    def test_S_232(self):
        """S-232
        Pré : SUP1 et SUP3, membres de l'autorité ; SUP3 est déclaré subordonné de SUP1.
        Op : SUP1 et SUP3 accordent à A un accès « enquête » à priv.
        Attendu : **Refus.**
        Fondement : § 12.7"""
        self.s.acteurs['SUP1'].subordonnes.add('SUP3')
        self.refus(self.s.accorder_derogation(('SUP1', 'SUP3'), 'A', [self.priv], ['voir'], 'enquête', 'j', 3))

    def test_S_233(self):
        """S-233
        Pré : SUP2 est aussi lecteur de P.
        Op : SUP1 et SUP2 accordent à A un accès « enquête » à priv, objet de P.
        Attendu : **Refus** : lien d'intérêt avec le dossier.
        Fondement : § 12.7"""
        self.nomme('RS', 'P', 'SUP2', 'lecteur')
        self.refus(self.s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.priv], ['voir'], 'enquête', 'j', 3))

    def test_S_234(self):
        """S-234
        Pré : SUP3 est membre de l'autorité, mais son identité n'est pas établie.
        Op : SUP1 et SUP3 accordent à A un accès « enquête » à priv.
        Attendu : **Refus** : on refuse plutôt que de présumer l'indépendance.
        Fondement : A3 ; § 12.7 (G-1)"""
        self.s.acteurs['SUP3'].identite_renforcee = False
        self.refus(self.s.accorder_derogation(('SUP1', 'SUP3'), 'A', [self.priv], ['voir'], 'enquête', 'j', 3))

    def test_S_235(self):
        """S-235
        Pré : l'identité de N n'est pas établie.
        Op : R0 nomme N RS de P.
        Attendu : **Refus** (opération sensible).
        Fondement : A3 (G-1) ; § 7.2"""
        self.s.acteurs['N'].identite_renforcee = False
        self.refus(self.s.nommer('R0', 'P', 'N', 'RS'))

    def test_S_236(self):
        """S-236
        Pré : RS1 nommé RS sur le seul objet o ; HI de R0 au profit du groupe G de P, en `approbation préalable` ; ADM a ajouté M à G.
        Op : RS1 admet M.
        Attendu : **Refus** : le périmètre de RS1 ne couvre pas celui de l'habilitation.
        Fondement : § 2.1 ; § 7.2 ; § 9.3"""
        self.nomme('R0', 'P', 'RS1', 'RS', perimetre={self.o})
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        h = self.deleg('R0', ('groupe', 'G'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        self.refus(self.s.admettre('RS1', h, 'M'))

    def test_S_237(self):
        """S-237
        Pré : HP de TIT `voir` sur priv au profit du groupe G, en `approbation préalable` ; V n'a aucun droit sur priv.
        Op : V admet M.
        Attendu : **Introuvable** : V ne connaît pas priv.
        Fondement : § 9.3 ; § 15"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        h = self.deleg('TIT', ('groupe', 'G'), ['voir'], ('objet', self.priv))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        self.assertEqual(self.s.admettre('V', h, 'M').code, 'introuvable')

    def test_S_238(self):
        """S-238
        Pré : O sous embargo d'existence dont RS2 n'est pas bénéficiaire.
        Op : RS2 crée une HI `voir` sur O au profit de V.
        Attendu : **Introuvable.**
        Fondement : § 7.2 ; § 15"""
        O = self.obj('RS', titre='O')
        self.ok(self.s.creer_protection('RS', 'embargo_existence', O))
        self.assertEqual(self.s.deleguer('RS2', ('acteur', 'V'), ['voir'], ('objet', O)).code, 'introuvable')

    def test_S_239(self):
        """S-239
        Pré : P archivé ; HI de RS au profit du groupe G ; ADM a ajouté M à G.
        Op : RS admet M.
        Attendu : **Refus.**
        Fondement : § 5.1"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        h = self.deleg('RS', ('groupe', 'G'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        self.ok(self.s.archiver('R0', 'P'))
        self.refus(self.s.admettre('RS', h, 'M'))

    def test_S_240(self):
        """S-240
        Pré : HI de RS en `notification` au profit du groupe G2 de l'espace F (gestionnaire AF) ; P archivé ; AF ajoute M à G2.
        Op : R0 rouvre P ; puis M consulte o.
        Attendu : **Accordé** : l'admission automatique, différée pendant l'archivage, est traitée à la réouverture.
        Fondement : § 5.1 (CT-18)"""
        self.ok(self.s.creer_espace('AF', 'F'))
        self.ok(self.s.creer_groupe('AF', 'F', 'G2'))
        self.deleg('RS', ('groupe', 'G2'), ['voir'], ('contenu', 'P'), mode='notification')
        self.ok(self.s.archiver('R0', 'P'))
        self.ok(self.s.ajouter_membre('AF', 'G2', 'M'))
        self.absent('M', self.o)
        self.ok(self.s.rouvrir('R0', 'P'))
        self.accorde('M', self.o)

    def test_S_241(self):
        """S-241
        Pré : HI R `voir` sur {o, O} au profit de V ; O sous embargo d'existence dont ADM n'est pas bénéficiaire.
        Op : ADM affiche la liste des habilitations de P.
        Attendu : R y figure, réduite à la seule cible o.
        Fondement : § 10.3"""
        O = self.obj('RS', titre='O')
        R = self.deleg('RS', ('acteur', 'V'), ['voir'], ('objets', {self.o, O}))
        self.ok(self.s.creer_protection('RS', 'embargo_existence', O))
        lignes = self.ok(self.s.lister_habilitations('ADM', 'P'))['lignes']
        self.assertEqual([l['cible'] for l in lignes if l['id'] == R], [('objets', (self.o,))])

    def test_S_242(self):
        """S-242
        Pré : o, objet du contenu, n'est pas diffusable.
        Op : RS délègue `voir` sur o au public.
        Attendu : **Refus.**
        Fondement : § 13.1"""
        self.refus(self.s.deleguer('RS', ('public',), ['voir'], ('objet', self.o)))

    def test_S_243(self):
        """S-243
        Pré : RS crée une interdiction d'existence sur o.
        Op : RS s'y désigne destinataire.
        Attendu : **Refus.**
        Fondement : § 11.1"""
        self.refus(self.s.creer_protection('RS', 'interdiction_existence', self.o, destinataires={'RS'}))

    def test_S_244(self):
        """S-244
        Pré : RS gardien d'un embargo d'existence sur o ; RS_bis est un second compte de RS.
        Op : RS ajoute RS_bis comme bénéficiaire.
        Attendu : **Refus** (personne).
        Fondement : A3 (G-1) ; § 11.3"""
        self.s.ajouter_acteur('RS_bis', personne='RS')
        pid = self.ok(self.s.creer_protection('RS', 'embargo_existence', self.o))
        self.refus(self.s.ajouter_beneficiaire('RS', pid, ('acteur', 'RS_bis')))

    def test_S_245(self):
        """S-245
        Pré : M a annoté o hors ligne ; sa contribution a été refusée à l'intégration.
        Op : V lit la contribution de M.
        Attendu : **Introuvable.**
        Fondement : § 13.8"""
        R = self.deleg('RS', ('acteur', 'M'), ['voir', 'commenter'], ('objet', self.o))
        self.ok(self.s.activer_replication('M', 'app', 'P'))
        k = self.ok(self.s.contribuer_hors_ligne('app', self.o, 'commenter', 'note'))
        self.ok(self.s.clore('RS', R))
        self.ok(self.s.synchroniser('app'))
        self.assertEqual(self.s.lire_contribution('V', k).code, 'introuvable')

    def test_S_246(self):
        """S-246
        Pré : M détient `voir` sur le contenu de P ; O est sous embargo d'existence dont M n'est pas bénéficiaire.
        Op : M active la réplication de P.
        Attendu : La réplique ne contient pas O.
        Fondement : § 13.9"""
        self.deleg('RS', ('acteur', 'M'), ['voir'], ('contenu', 'P'))
        O = self.obj('RS', titre='O')
        self.ok(self.s.creer_protection('RS', 'embargo_existence', O))
        self.assertNotIn(O, self.ok(self.s.activer_replication('M', 'app', 'P')))

    def test_S_247(self):
        """S-247
        Pré : l'espace G2 porte une désignation de garde au profit de K.
        Op : son propriétaire R0 prépare un transfert à Z.
        Attendu : **Refus.**
        Fondement : § 10.4"""
        self.ok(self.s.creer_espace('R0', 'G2', designation_garde='K'))
        self.refus(self.s.preparer_transfert('R0', 'G2', 'Z'))

    def test_S_248(self):
        """S-248
        Pré : comme S-247 ; R0 modifie d'abord la désignation au profit de Z, par un acte tracé.
        Op : R0 prépare un transfert à Z.
        Attendu : **Accepté.**
        Fondement : § 10.4 (CT-29)"""
        self.ok(self.s.creer_espace('R0', 'G2', designation_garde='K'))
        self.ok(self.s.designer_garde('R0', 'G2', 'Z'))
        self.ok(self.s.preparer_transfert('R0', 'G2', 'Z'))

    def test_S_249(self):
        """S-249
        Pré : embargo d'existence sur o, dont le groupe « Proches » est bénéficiaire ; RS gardien ; Z membre de « Proches » et détenteur d'une HI `voir` sur o.
        Op : RS agrée Z ; puis Z consulte o.
        Attendu : **Accordé.**
        Fondement : § 9.5"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'Proches'))
        self.deleg('RS', ('acteur', 'Z'), ['voir'], ('objet', self.o))
        pid = self.ok(self.s.creer_protection('RS', 'embargo_existence', self.o,
                                              beneficiaires={('groupe', 'Proches')}))
        self.ok(self.s.ajouter_membre('ADM', 'Proches', 'Z'))
        self.absent('Z', self.o)
        self.ok(self.s.agreer_membre('RS', pid, 'Proches', 'Z'))
        self.accorde('Z', self.o)

    def test_S_250(self):
        """S-250
        Pré : RS gardien d'une interdiction d'action `éditer` et `commenter` sur o, visant COL.
        Op : RS ajoute LEC aux destinataires ; puis LEC commente o.
        Attendu : **Refus** : LEC, qui connaît o, est désormais destinataire.
        Fondement : § 11.4"""
        pid = self.ok(self.s.creer_protection('RS', 'interdiction_action', self.o, destinataires={'COL'},
                                              actions={'editer', 'commenter'}))
        self.ok(self.s.ajouter_destinataire('RS', pid, 'LEC'))
        self.refuse('LEC', self.o, 'commenter')

    def test_S_251(self):
        """S-251
        Pré : série S de l'espace SA ; numéro N de l'espace SB, inséré par RB au rang 13, en attente.
        Op : RA, administrateur de SA, accepte l'insertion.
        Attendu : **Accepté** ; N occupe le rang 13 pour RB, qui la voit ; RA, qui ne la voit pas, ne voit aucun rang occupé (H-6e).
        Fondement : § 13.6"""
        self.ok(self.s.creer_espace('RA', 'SA'))
        self.ok(self.s.creer_espace('RB', 'SB'))
        serie = self.ok(self.s.creer_serie('RA', 'SA'))
        N = self.obj('RB', 'SB')
        iid = self.s.inserer_serie('RB', serie, N, 13).valeur
        self.ok(self.s.accepter_insertion('RA', iid))
        self.assertEqual(self.ok(self.s.lire_serie('RB', serie)), {13: [N]})
        self.assertEqual(self.ok(self.s.lire_serie('RA', serie)), {})

    def test_S_252(self):
        """S-252
        Pré : ADM administrateur de P.
        Op : R0 révoque ADM ; puis ADM affiche la liste des habilitations de P.
        Attendu : **Refus.**
        Fondement : § 10.1 ; § 10.3"""
        self.ok(self.s.revoquer_administrateur('R0', 'P', 'ADM'))
        self.refus(self.s.lister_habilitations('ADM', 'P'))

    def test_S_253(self):
        """S-253
        Pré : restriction légale sur priv, contestée par TIT.
        Op : SUP3 et SUP4 maintiennent la restriction ; puis TIT consulte priv.
        Attendu : **Refus.**
        Fondement : § 11.6"""
        pid = self.ok(self.s.creer_restriction_legale(('SUP1', 'SUP2'), self.priv, autorite_levee='AUT'))
        self.ok(self.s.contester('TIT', pid))
        self.ok(self.s.examiner_contestation(('SUP3', 'SUP4'), pid, 'maintien'))
        self.refuse('TIT', self.priv)

    def test_S_254(self):
        """S-254
        Pré : effacement légal prononcé sur priv.
        Op : SUP1 et SUP2 accordent à A un accès « demande légale » à priv.
        Attendu : **Refus** : restriction non levable.
        Fondement : § 2.3 ; § 12.3"""
        self.s.objets[self.priv].effacement_legal = True
        self.refus(self.s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.priv], ['voir'], 'demande légale',
                                              'j', 3))

    def test_S_255(self):
        """S-255
        Pré : V détient une HI `voir` sur o ; P est clos.
        Op : V consulte o.
        Attendu : **Accordé** : la lecture est conservée.
        Fondement : § 5.1"""
        self.deleg('RS', ('acteur', 'V'), ['voir'], ('objet', self.o))
        self.ok(self.s.clore_espace('R0', 'P'))
        self.accorde('V', self.o)

    def test_S_256(self):
        """S-256
        Pré : TIT titulaire de priv, sous restriction légale.
        Op : TIT renonce à priv par la purge.
        Attendu : **Refus.**
        Fondement : § 6.3 (CT-30)"""
        self.ok(self.s.creer_restriction_legale(('SUP1', 'SUP2'), self.priv, autorite_levee='AUT'))
        self.refus(self.s.renoncer('TIT', self.priv, sort='purge'))

    def test_S_257(self):
        """S-257
        Pré : M collaborateur de P n'a donné aucun mandat.
        Op : ADM lance l'import du fichier de M, qui en déclare les droits.
        Attendu : **Refus.**
        Fondement : § 6.2 (CT-31)"""
        self.nomme('RS', 'P', 'M', 'collaborateur')
        self.refus(self.s.importer('ADM', 'P', 'M'))

    def test_S_258(self):
        """S-258
        Pré : TIT a partagé priv avec V.
        Op : COL, qui ne connaît pas priv, clôt cette HP.
        Attendu : **Introuvable.**
        Fondement : § 7.4 ; § 15 (CT-25)"""
        h = self.deleg('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv))
        self.assertEqual(self.s.clore('COL', h).code, 'introuvable')

    def test_S_259(self):
        """S-259
        Pré : RS a nommé RS3, qui n'a pas encore accepté.
        Op : RS3 quitte P ; puis RS3 accepte la nomination.
        Attendu : **Refus** : le départ clôt les nominations proposées.
        Fondement : § 7.6 (CM-34)"""
        h = self.ok(self.s.nommer('RS', 'P', 'RS3', 'RS'))
        self.ok(self.s.quitter('RS3', 'P'))
        self.refus(self.s.accepter_nomination('RS3', h))

    def test_S_260(self):
        """S-260
        Pré : campagne en phase indépendante dont un participant est l'acteur institutionnel AMORCE.
        Op : AMORCE répond.
        Attendu : **Refus** : une participation exige une personne.
        Fondement : § 13.14"""
        cid = self.ok(self.s.creer_campagne('RS', 'P', {'amorce': 'AMORCE'}))
        self.refus(self.s.repondre('AMORCE', cid, 'réponse'))

    def test_S_261(self):
        """S-261
        Pré : M, collaborateur de Q, a repris une copie c de l'objet src, sous embargo de contenu posé par RS dont M est bénéficiaire.
        Op : RS lève l'embargo sur src ; puis M partage c avec Z ; puis RS lève l'embargo hérité par c ; M partage c.
        Attendu : **Refus**, puis **accepté** : l'embargo hérité reste en vigueur après la levée sur l'original (une
        copie protégée n'est pas redistribuable) ; il est levé par ses propres gardiens.
        Fondement : § 13.11 ; § 11.5 (G-6, H-3b)"""
        self.ok(self.s.creer_espace('QQ', 'Q'))
        self.nomme('QQ', 'Q', 'M', 'collaborateur')
        src = self.obj('RS', titre='src')
        self.deleg('RS', ('acteur', 'M'), ['voir', 'reutiliser'], ('objet', src))
        pid = self.ok(self.s.creer_protection('RS', 'embargo_contenu', src, beneficiaires={('acteur', 'M')}))
        c = self.ok(self.s.reutiliser('M', src, 'Q'))
        self.ok(self.s.lever_protection('RS', pid))
        self.refus(self.s.deleguer('M', ('acteur', 'Z'), ['voir'], ('objet', c)))
        heritee = next(p.id for p in self.s.protections.values() if p.cible == c and p.etat == 'active')
        self.ok(self.s.lever_protection('RS', heritee))
        self.ok(self.s.deleguer('M', ('acteur', 'Z'), ['voir'], ('objet', c)))

    def test_S_262(self):
        """S-262
        Pré : comme S-261, avant la levée.
        Op : contrôle de la filiation de la copie.
        Attendu : La copie conserve un lien vérifiable vers src, et le copieur n'est pas gardien de la protection héritée.
        Fondement : § 13.11 ; A7"""
        self.ok(self.s.creer_espace('QQ', 'Q'))
        self.nomme('QQ', 'Q', 'M', 'collaborateur')
        src = self.obj('RS', titre='src')
        self.deleg('RS', ('acteur', 'M'), ['voir', 'reutiliser'], ('objet', src))
        self.ok(self.s.creer_protection('RS', 'embargo_contenu', src, beneficiaires={('acteur', 'M')}))
        c = self.ok(self.s.reutiliser('M', src, 'Q'))
        self.assertEqual(self.s.objets[c].copie_de, src)
        self.assertTrue(all('M' not in p.gardiens for p in self.s.protections.values() if p.cible == c))

    def test_S_263(self):
        """S-263
        Pré : sélection partagée S = {o} (HI de RS au profit de V) ; RS en retire o, puis l'auteur la propose de nouveau.
        Op : V consulte o.
        Attendu : **Introuvable** : un objet retiré n'est jamais rétabli implicitement.
        Fondement : § 13.3 (G-4)"""
        sel = self.ok(self.s.creer_selection('RS', 'P', {self.o}))
        self.deleg('RS', ('acteur', 'V'), ['voir'], ('selection', sel))
        self.ok(self.s.reduire_selection('RS', sel, {self.o}))
        self.assertEqual(self.ok(self.s.ajouter_a_selection('RS', sel, self.o)), 'proposition')
        self.absent('V', self.o)

    def test_S_264(self):
        """S-264
        Pré : comme S-263.
        Op : RS active la proposition ; puis V consulte o.
        Attendu : **Accordé.**
        Fondement : § 13.3"""
        sel = self.ok(self.s.creer_selection('RS', 'P', {self.o}))
        self.deleg('RS', ('acteur', 'V'), ['voir'], ('selection', sel))
        self.ok(self.s.reduire_selection('RS', sel, {self.o}))
        self.s.ajouter_a_selection('RS', sel, self.o)
        self.ok(self.s.activer_proposition('RS', sel, self.o))
        self.accorde('V', self.o)


class S12_Succession(Base):
    """12. Décès et succession (G-9)"""

    def setUp(self):
        super().setUp()
        self.projet()
        self.deleg('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv))
        self.pub = self.obj('TIT', perso=True, diffusable=True, titre='public de TIT')
        self.ok(self.s.modifier_visibilite('TIT', self.pub, 'public'))

    def deces(self):
        self.ok(self.s.constater_deces(('SUP1', 'SUP2'), 'TIT'))

    def test_S_265(self):
        """S-265
        Pré : TIT a partagé priv avec V ; deux approbateurs indépendants constatent le décès de TIT.
        Op : V consulte priv.
        Attendu : **Introuvable** : gel de succession.
        Fondement : § 10.4 ; § 2.4 (G-9)"""
        self.deces()
        self.absent('V', self.priv)

    def test_S_266(self):
        """S-266
        Pré : comme S-265.
        Op : un lecteur anonyme consulte l'objet public de TIT.
        Attendu : **Accordé** : le gel ne vise que les objets non publics.
        Fondement : § 10.4"""
        self.deces()
        self.accorde(None, self.pub)

    def test_S_267(self):
        """S-267
        Pré : comme S-265.
        Op : SUP3 seul accorde à A un accès « succession » à priv.
        Attendu : **Refus** : deux approbateurs sont requis.
        Fondement : § 12.3"""
        self.deces()
        self.refus(self.s.accorder_derogation(('SUP3',), 'A', [self.priv], ['voir'], 'succession', 'j', 3))

    def test_S_268(self):
        """S-268
        Pré : comme S-265.
        Op : SUP3 et SUP4 accordent à A un accès « succession » à priv ; puis A le consulte pour cette finalité.
        Attendu : **Accordé.**
        Fondement : § 12.3"""
        self.deces()
        self.ok(self.s.accorder_derogation(('SUP3', 'SUP4'), 'A', [self.priv], ['voir'], 'succession', 'j', 3))
        self.accorde('A', self.priv, finalite='succession')

    def test_S_269(self):
        """S-269
        Pré : comme S-265.
        Op : SUP3 et SUP4 décident le versement de priv à P, avec l'accord de RS, sur un fondement documenté ; puis RS consulte priv.
        Attendu : **Accordé** ; V reçoit « introuvable » (les HP du défunt sont closes).
        Fondement : § 10.4"""
        self.deces()
        self.ok(self.s.decider_succession(('SUP3', 'SUP4'), self.priv, 'versement', rs='RS', fondement='testament'))
        self.accorde('RS', self.priv)
        self.absent('V', self.priv)

    def test_S_270(self):
        """S-270
        Pré : comme S-265 ; SUP3 et SUP4 ont désigné X ayant droit de priv.
        Op : X accepte ; puis X consulte priv.
        Attendu : **Accordé** (X titulaire).
        Fondement : § 10.4"""
        self.deces()
        self.ok(self.s.decider_succession(('SUP3', 'SUP4'), self.priv, 'titulaire', ayant_droit='X',
                                          fondement='acte notarié'))
        self.ok(self.s.accepter_succession_objet('X', self.priv))
        self.accorde('X', self.priv)

    def test_S_271(self):
        """S-271
        Pré : comme S-265.
        Op : SUP3 et SUP4 décident un sort sans fondement documenté.
        Attendu : **Refus.**
        Fondement : § 10.4"""
        self.deces()
        self.refus(self.s.decider_succession(('SUP3', 'SUP4'), self.priv, 'versement', rs='RS'))

    def test_S_272(self):
        """S-272
        Pré : SUP2 est collaborateur de P, où TIT a ses objets.
        Op : SUP1 et SUP2 constatent le décès de TIT.
        Attendu : **Refus** : lien d'intérêt avec le dossier.
        Fondement : § 10.4 ; § 12.7"""
        self.nomme('RS', 'P', 'SUP2', 'collaborateur')
        self.refus(self.s.constater_deces(('SUP1', 'SUP2'), 'TIT'))

class S13_Mutations(Base):
    """13. Scénarios ajoutés après le banc de mutations V1.5"""

    def setUp(self):
        super().setUp()
        self.projet()

    def test_S_273(self):
        """S-273
        Pré : RS_bis est un second compte de RS.
        Op : RS délègue `voir` sur o à RS_bis.
        Attendu : **Refus** (A3, personne).
        Fondement : A3 (G-1)"""
        self.s.ajouter_acteur('RS_bis', personne='RS')
        self.refus(self.s.deleguer('RS', ('acteur', 'RS_bis'), ['voir'], ('objet', self.o)))

    def test_S_274(self):
        """S-274
        Pré : HI de RS2 au profit du groupe G de P, en `approbation préalable` ; ADM a ajouté RS à G.
        Op : RS s'admet lui-même.
        Attendu : **Refus.**
        Fondement : A3"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        h = self.deleg('RS2', ('groupe', 'G'), ['exporter'], ('contenu', 'P'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'RS'))
        self.refus(self.s.admettre('RS', h, 'RS'))

    def test_S_275(self):
        """S-275
        Pré : HI de RS au profit du groupe G de P, en `approbation préalable` ; ADM a ajouté RS, son signataire, à G.
        Op : RS2 admet RS.
        Attendu : **Refus** : le signataire n'est jamais admis à sa propre habilitation.
        Fondement : § 9.4 (G-2)"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        h = self.deleg('RS', ('groupe', 'G'), ['exporter'], ('contenu', 'P'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'RS'))
        self.refus(self.s.admettre('RS2', h, 'RS'))

    def test_S_276(self):
        """S-276
        Pré : RS, membre du groupe g de l'espace GS, signe une HI `exporter` sur le contenu de P au profit de g, en
        `notification` ; RS est ensuite révoqué comme RS, et nommé collaborateur (sans `exporter`).
        Op : RS exporte o.
        Attendu : **Refus** : le signataire n'est jamais admis à sa propre habilitation, qui survit à sa révocation.
        Fondement : § 9.4 (G-2) ; § 2.1"""
        self.ok(self.s.creer_espace('RG', 'GS'))
        self.ok(self.s.creer_groupe('RG', 'GS', 'g'))
        self.ok(self.s.ajouter_membre('RG', 'g', 'RS'))
        self.deleg('RS', ('groupe', 'g'), ['exporter'], ('contenu', 'P'), mode='notification')
        self.ok(self.s.clore('R0', self.h_RS))
        self.nomme('R0', 'P', 'RS', 'collaborateur')
        self.refuse('RS', self.o, 'exporter')
        self.accorde('RS', self.o, 'editer')

    def test_S_277(self):
        """S-277
        Pré : ESP transféré de C à K ; avant le transfert, RS2 avait délégué `voir` sur le contenu de ESP au rôle `collaborateur` de F, en `notification` ; C est collaborateur de F ; après le transfert, C quitte F.
        Op : RF nomme de nouveau C collaborateur de F ; puis C consulte un objet du contenu de ESP.
        Attendu : **Introuvable** : le cédant est exclu de l'admission automatique, même pour une HI d'un tiers.
        Fondement : § 9.4 ; § 10.8"""
        self.espace_transfere()
        self.ok(self.s.creer_espace('RF', 'F'))
        self.nomme('RF', 'F', 'C', 'collaborateur')
        self.deleg('RS2', ('role', 'F', 'collaborateur'), ['voir'], ('objets', {self.ot}), mode='notification')
        self.transferer()
        self.ok(self.s.quitter('C', 'F'))
        self.nomme('RF', 'F', 'C', 'collaborateur')
        self.absent('C', self.ot)

    def test_S_278(self):
        """S-278
        Pré : RS a délégué `voir` + `repartager` sur o à A (HI) ; A a délégué `voir` sur o au groupe G, en `approbation préalable` (HP), que RS a confirmée ; A a admis M ; R0 met l'HI de A en examen.
        Op : M consulte o.
        Attendu : **Introuvable** : l'admission prononcée par A est inopérante pendant l'examen.
        Fondement : § 5.3 ; § 7.5 (G-8)"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        hi = self.deleg('RS', ('acteur', 'A'), ['voir'], ('objet', self.o), repartager=True)
        hp = self.deleg('A', ('groupe', 'G'), ['voir'], ('objet', self.o))
        self.ok(self.s.confirmer('RS', hp))
        self.ok(self.s.admettre('A', hp, 'M'))
        self.accorde('M', self.o)
        self.ok(self.s.mettre_en_examen('R0', hi))
        self.absent('M', self.o)
        self.ok(self.s.lever_examen('R0', hi))
        self.accorde('M', self.o)

    def test_S_279(self):
        """S-279
        Pré : ESP : sélection S de C = {ot}, HI de C `voir` sur S au profit de V ; C propose d'ajouter o2 ; transfert présenté.
        Op : C active la proposition.
        Attendu : **Refus** (« espace en cours de transfert ») : l'activation élargit un engagement.
        Fondement : § 10.6 (G-3)"""
        self.espace_transfere()
        o2 = self.obj('C', 'ESP', titre='o2')
        sel = self.ok(self.s.creer_selection('C', 'ESP', {self.ot}))
        self.deleg('C', ('acteur', 'V'), ['voir'], ('selection', sel))
        self.assertEqual(self.ok(self.s.ajouter_a_selection('C', sel, o2)), 'proposition')
        self.presenter()
        self.assertEqual(self.s.activer_proposition('C', sel, o2).code, 'gel')

    def test_S_280(self):
        """S-280
        Pré : ESP : restriction légale sur ot, valable jusqu'à 5 ; transfert présenté à 0.
        Op : K accepte à 6, avec l'empreinte présentée.
        Attendu : **Refus** « présentation renouvelée » : la fin d'une restriction présentée élargit les engagements.
        Fondement : § 10.6 (G-3)"""
        self.espace_transfere()
        self.ok(self.s.creer_restriction_legale(('SUP1', 'SUP2'), self.ot, autorite_levee='AUT', fin=5))
        emp = self.presenter()
        self.s.avancer(6)
        self.assertEqual(self.accepter(emp).code, 'renouvelee')

    def test_S_281(self):
        """S-281
        Pré : HP de C `voir` sur son objet O1 au profit du groupe GK, M admis ; voie (b) ; réémission annoncée avec M ; transfert présenté ; C retire ensuite l'admission de M.
        Op : K accepte ; puis M consulte O1.
        Attendu : **Introuvable** : seules les admissions encore actives sont reprises.
        Fondement : § 10.5 (CM-14)"""
        self.espace_transfere()
        O1 = self.obj('C', 'ESP', perso=True)
        self.ok(self.s.creer_groupe('C', 'ESP', 'GK'))
        self.ok(self.s.ajouter_membre('C', 'GK', 'M'))
        h = self.deleg('C', ('groupe', 'GK'), ['voir'], ('objet', O1))
        self.ok(self.s.admettre('C', h, 'M'))
        self.ok(self.s.choisir_voie('C', self.tid, O1, 'b'))
        self.ok(self.s.annoncer_reemission('C', self.tid, h, admissions={'M'}))
        self.presenter()
        self.ok(self.s.accepter_objet('K', self.tid, O1))
        self.ok(self.s.retirer_admission('C', h, 'M'))
        self.ok(self.accepter())
        self.absent('M', O1)

    def test_S_282(self):
        """S-282
        Pré : HI de RS2 `voir` sur ot au profit du rôle `collaborateur` de F, en `approbation préalable` ; C est collaborateur de F et a été admis par RS2.
        Op : K accepte le transfert ; puis C consulte ot.
        Attendu : **Introuvable** : C perd ses admissions, même au titre d'un rôle d'un autre espace.
        Fondement : § 10.7"""
        self.espace_transfere()
        self.ok(self.s.creer_espace('RF', 'F'))
        self.nomme('RF', 'F', 'C', 'collaborateur')
        h = self.deleg('RS2', ('role', 'F', 'collaborateur'), ['voir'], ('objets', {self.ot}))
        self.ok(self.s.admettre('RS2', h, 'C'))
        self.transferer()
        self.absent('C', self.ot)

    def test_S_283(self):
        """S-283
        Pré : RS2 a délégué `voir` sur ot à C (HI nominative).
        Op : K accepte le transfert ; puis C consulte ot.
        Attendu : **Introuvable.**
        Fondement : § 10.7"""
        self.espace_transfere()
        self.deleg('RS2', ('acteur', 'C'), ['voir'], ('objet', self.ot))
        self.transferer()
        self.absent('C', self.ot)

    def test_S_284(self):
        """S-284
        Pré : T, objet public de ESP ; RS2 y a posé un embargo d'existence dont C est bénéficiaire explicite.
        Op : K accepte le transfert ; puis C cherche T.
        Attendu : Aucun résultat : C perd sa qualité de bénéficiaire.
        Fondement : § 10.7"""
        self.espace_transfere()
        T = self.obj('C', 'ESP', titre='témoignage T', diffusable=True)
        self.ok(self.s.modifier_visibilite('C', T, 'public'))
        self.ok(self.s.creer_protection('RS2', 'embargo_existence', T, beneficiaires={('acteur', 'C')}))
        self.assertEqual(self.s.rechercher('C', 'témoignage'), [T])
        self.transferer()
        self.assertEqual(self.s.rechercher('C', 'témoignage'), [])

    def test_S_285(self):
        """S-285
        Pré : RS interdit `voir` à RS2 sur o ; HI de RS `voir` sur o au profit du groupe G, en `approbation préalable` ; ADM a ajouté M à G.
        Op : RS2 admet M.
        Attendu : **Refus** : on n'admet pas au titre d'une action qu'on ne peut pas exécuter.
        Fondement : § 9.3 ; § 2.5 (G-7)"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        h = self.deleg('RS', ('groupe', 'G'), ['voir'], ('objet', self.o))
        self.ok(self.s.creer_protection('RS', 'interdiction_action', self.o, destinataires={'RS2'}, actions={'voir'}))
        self.refus(self.s.admettre('RS2', h, 'M'))

    def test_S_286(self):
        """S-286
        Pré : sélection partagée S = {o} (HI de RS au profit de V) ; RS propose d'y ajouter o2.
        Op : LEC, lecteur qui connaît o2 mais ne peut signer l'habilitation, active la proposition.
        Attendu : **Refus.**
        Fondement : § 13.3 (G-4)"""
        o2 = self.obj('RS', titre='o2')
        sel = self.ok(self.s.creer_selection('RS', 'P', {self.o}))
        self.deleg('RS', ('acteur', 'V'), ['voir'], ('selection', sel))
        self.s.ajouter_a_selection('RS', sel, o2)
        self.refus(self.s.activer_proposition('LEC', sel, o2))

    def test_S_287(self):
        """S-287
        Pré : M, collaborateur de Q, a repris une copie c de src (objet de P) ; M a délégué `voir` sur c à V, qui ne voit pas src.
        Op : V affiche c.
        Attendu : La filiation n'est pas révélée à V.
        Fondement : § 14 (étape 7) ; § 15"""
        self.ok(self.s.creer_espace('QQ', 'Q'))
        self.nomme('QQ', 'Q', 'M', 'collaborateur')
        src = self.obj('RS', titre='src')
        self.deleg('RS', ('acteur', 'M'), ['voir', 'reutiliser'], ('objet', src))
        c = self.ok(self.s.reutiliser('M', src, 'Q'))
        self.deleg('M', ('acteur', 'V'), ['voir'], ('objet', c))
        self.assertIsNone(self.ok(self.s.rendre('V', c))['filiation'])

    def test_S_288(self):
        """S-288
        Pré : TIT a délégué `voir` + `repartager` sur priv à V1 jusqu'à 20.
        Op : V1 délègue `voir` sur priv à T jusqu'à 30.
        Attendu : **Refus.**
        Fondement : § 8.1 (4)"""
        self.deleg('TIT', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True, echeance=20)
        self.refus(self.s.deleguer('V1', ('acteur', 'T'), ['voir'], ('objet', self.priv), echeance=30))

    def test_S_289(self):
        """S-289
        Pré : TIT a délégué `voir` sur priv à V, sans `repartager`.
        Op : V délègue `voir` sur priv à T.
        Attendu : **Refus.**
        Fondement : § 8.1 (5)"""
        self.deleg('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv))
        self.refus(self.s.deleguer('V', ('acteur', 'T'), ['voir'], ('objet', self.priv)))

    def test_S_290(self):
        """S-290
        Pré : ADM administrateur de P.
        Op : ADM archive P.
        Attendu : **Refus** : réservé au propriétaire.
        Fondement : § 5.1 ; § 10.1"""
        self.refus(self.s.archiver('ADM', 'P'))

    def test_S_291(self):
        """S-291
        Pré : TIT_bis est un second compte de TIT.
        Op : TIT délègue `voir` sur priv à TIT_bis.
        Attendu : **Refus** (A3, personne).
        Fondement : A3 (G-1)"""
        self.s.ajouter_acteur('TIT_bis', personne='TIT')
        self.refus(self.s.deleguer('TIT', ('acteur', 'TIT_bis'), ['voir'], ('objet', self.priv)))

    def test_S_292(self):
        """S-292
        Pré : ESP : T sous embargo d'existence posé par RS2, dont K n'est pas bénéficiaire ; HI de RS2 `voir` sur {ot, T} au profit de V, présentée à K réduite à ot ; transfert présenté.
        Op : RS2 lève l'embargo sur T.
        Attendu : **Refus** (« espace en cours de transfert ») : la levée élargirait, pour K, le périmètre d'un engagement.
        Fondement : § 10.6 (G-3)"""
        self.espace_transfere()
        T = self.obj('C', 'ESP', titre='T')
        pid = self.ok(self.s.creer_protection('RS2', 'embargo_existence', T))
        self.deleg('RS2', ('acteur', 'V'), ['voir'], ('objets', {self.ot, T}))
        self.presenter()
        self.assertEqual(self.s.lever_protection('RS2', pid).code, 'gel')

class S12_V16(Base):
    """14. Règles nouvelles ou corrigées de la V1.6 (décisions H-1 à H-6, corrections CT et CM)"""

    def setUp(self):
        super().setUp()
        self.projet()
        for a in ('X', 'Y', 'G', 'NV'):
            if a not in self.s.acteurs:
                self.s.ajouter_acteur(a)
        self.s.ajouter_acteur('V_bis', personne='V')
        self.s.ajouter_acteur('RS_bis', personne='RS')
        self.s.ajouter_acteur('C2', personne='C')
        self.s.ajouter_acteur('NONV', renforcee=False)

    def test_S_293(self):
        """S-293
        Pré : transfert de ESP préparé ; C a délégué à V `voir` sur ses objets O1 (voie a) et O2 (voie b), par une
        seule HP.
        Op : C annonce la réémission de cette HP.
        Attendu : **Refus** : une HP qui porte sur des objets de voies différentes ne peut pas être annoncée.
        Fondement : § 10.5 (CT-22)"""
        self.espace_transfere()
        O1 = self.obj('C', 'ESP', perso=True)
        O2 = self.obj('C', 'ESP', perso=True)
        h = self.deleg('C', ('acteur', 'V'), ['voir'], ('objets', {O1, O2}))
        self.ok(self.s.choisir_voie('C', self.tid, O1, 'a'))
        self.ok(self.s.choisir_voie('C', self.tid, O2, 'b'))
        self.refus(self.s.annoncer_reemission('C', self.tid, h))

    def test_S_294(self):
        """S-294
        Pré : R0 a nommé N RS de P (nomination proposée) ; R0 archive P.
        Op : N accepte la nomination ; puis R0 rouvre P et N accepte.
        Attendu : **Refus**, puis **accepté** : l'acceptation de nomination est fermée dans un espace archivé.
        Fondement : § 5.1 ; T-02 (CT-27)"""
        h = self.ok(self.s.nommer('R0', 'P', 'N', 'RS'))
        self.ok(self.s.archiver('R0', 'P'))
        self.refus(self.s.accepter_nomination('N', h))
        self.ok(self.s.rouvrir('R0', 'P'))
        self.ok(self.s.accepter_nomination('N', h))

    def test_S_295(self):
        """S-295
        Pré : RS1 nommé RS sur le seul objet o ; HI de R0 `voir` sur le contenu de P au profit du groupe G ; M admis.
        Op : RS1 retire l'admission de M ; puis RS le fait.
        Attendu : **Refus**, puis **accepté** : seul un RS dont le périmètre couvre l'habilitation la retire.
        Fondement : § 8.3 ; § 9.3 (CM-19)"""
        self.nomme('R0', 'P', 'RS1', 'RS', perimetre={self.o})
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        h = self.deleg('R0', ('groupe', 'G'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        self.ok(self.s.admettre('RS', h, 'M'))
        self.refus(self.s.retirer_admission('RS1', h, 'M'))
        self.accorde('M', self.o)
        self.ok(self.s.retirer_admission('RS', h, 'M'))
        self.absent('M', self.o)

    def test_S_296(self):
        """S-296
        Pré : RS a délégué à V `voir` sur les objets o et o2.
        Op : RS restreint le périmètre à {o, o3} ; puis à {o}.
        Attendu : **Invalide** (le périmètre n'est pas inclus), puis **accepté** : V voit o, plus o2.
        Fondement : T-05 (CM-20)"""
        o2 = self.obj('RS')
        o3 = self.obj('RS')
        h = self.deleg('RS', ('acteur', 'V'), ['voir'], ('objets', {self.o, o2}))
        self.assertEqual(self.s.restreindre('RS', h, perimetre=('objets', {self.o, o3})).code, 'invalide')
        self.ok(self.s.restreindre('RS', h, perimetre=('objet', self.o)))
        self.accorde('V', self.o)
        self.absent('V', o2)

    def test_S_297(self):
        """S-297
        Pré : RS gardien d'une interdiction d'action `editer` sur o, visant COL ; RS2 détient un droit sur o.
        Op : RS ajoute RS2 (personne) aux destinataires après l'avoir désigné gardien ; puis RS désigne COL gardien.
        Attendu : **Refus** dans les deux cas : gardien et destinataire s'excluent.
        Fondement : § 11.2 (CM-23)"""
        p = self.ok(self.s.creer_protection('RS', 'interdiction_action', self.o, destinataires={'COL'},
                                            actions={'editer'}))
        self.ok(self.s.designer_gardien('RS', p, 'RS2'))
        self.refus(self.s.ajouter_destinataire('RS', p, 'RS2'))
        self.refus(self.s.designer_gardien('RS', p, 'COL'))

    def test_S_298(self):
        """S-298
        Pré : TIT a délégué à V `voir` avec `repartager` sur priv, et `voir` avec `repartager` sur priv au groupe G ;
        V, qui remplit les conditions 1 et 2, a admis M (membre de G).
        Op : M délègue `voir` sur priv à V.
        Attendu : **Refus** : V, auteur de l'admission qui porte le droit de M, est en amont de sa chaîne.
        Fondement : § 8.2 (cycles, à toute profondeur)"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        self.deleg('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv), repartager=True)
        h = self.deleg('TIT', ('groupe', 'G'), ['voir'], ('objet', self.priv), repartager=True)
        self.ok(self.s.admettre('V', h, 'M'))
        self.accorde('M', self.priv)
        self.refus(self.s.deleguer('M', ('acteur', 'V'), ['voir'], ('objet', self.priv)))
        self.ok(self.s.deleguer('M', ('acteur', 'W'), ['voir'], ('objet', self.priv)))

    def succession(self):
        s = self.s
        self.ok(s.creer_espace('C', 'ESP', designation_garde='K'))
        self.ot = self.obj('C', 'ESP')
        self.ok(s.creer_espace('RF', 'F'))
        self.nomme('RF', 'F', 'C', 'collaborateur')
        self.nomme('RF', 'F', 'SUP3', 'lecteur')
        self.of = self.obj('C', 'F', perso=True)
        self.ok(s.constater_deces(('SUP1', 'SUP2'), 'C'))

    def test_S_299(self):
        """S-299
        Pré : C, propriétaire de ESP avec une désignation de garde au profit de K, est décédé.
        Op : SUP1 et SUP2 ouvrent la succession de ESP ; puis l'audit contrôle le scellé.
        Attendu : **Accepté** ; la présentation de la succession est scellée (scellé d'audit archivé).
        Fondement : § 10.4 ; § 10.6 (CM-22)"""
        self.succession()
        tid = self.ok(self.s.ouvrir_succession(('SUP1', 'SUP2'), 'ESP'))
        self.assertIn((tid, 0), self.s.scelles)

    def test_S_300(self):
        """S-300
        Pré : comme S-299 ; C avait aussi un objet personnel dans l'espace F, dont SUP3 est membre.
        Op : SUP3 et SUP4 ouvrent la succession de ESP.
        Attendu : **Refus** : le dossier comprend tous les objets et espaces du défunt ; SUP3 a un lien d'intérêt.
        Fondement : § 10.4 ; § 12.7 (CM-22)"""
        self.succession()
        self.refus(self.s.ouvrir_succession(('SUP3', 'SUP4'), 'ESP'))
        self.ok(self.s.ouvrir_succession(('SUP1', 'SUP4'), 'ESP'))

    def test_S_301(self):
        """S-301
        Pré : C, propriétaire de ESP, où SUP4 est lecteur, avait un objet personnel dans l'espace F ; C est décédé.
        Op : SUP4 et SUP1 décident le maintien du gel de l'objet de F ; puis SUP1 et SUP2.
        Attendu : **Refus**, puis **accepté** : le dossier d'une décision de succession comprend tous les espaces du
        défunt, et SUP4, membre de ESP, a un lien d'intérêt.
        Fondement : § 10.4 ; § 12.7 (CM-22)"""
        self.ok(self.s.creer_espace('C', 'ESP'))
        self.nomme('C', 'ESP', 'SUP4', 'lecteur')
        self.ok(self.s.creer_espace('RF', 'F'))
        self.nomme('RF', 'F', 'C', 'collaborateur')
        self.of = self.obj('C', 'F', perso=True)
        self.ok(self.s.constater_deces(('SUP1', 'SUP2'), 'C'))
        self.refus(self.s.decider_succession(('SUP4', 'SUP1'), self.of, 'maintien', fondement='volontés'))
        self.ok(self.s.decider_succession(('SUP1', 'SUP2'), self.of, 'maintien', fondement='volontés'))

    def test_S_302(self):
        """S-302
        Pré : TIT a délégué à V `voir` avec `repartager` sur priv ; V a délégué `voir` sur priv à W.
        Op : TIT clôt l'HP de V au profit de W ; puis W consulte priv.
        Attendu : **Accepté**, puis **introuvable** : le titulaire de la cible clôt toute HP qui la vise.
        Fondement : § 8.3"""
        self.deleg('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv), repartager=True)
        h = self.deleg('V', ('acteur', 'W'), ['voir'], ('objet', self.priv))
        self.ok(self.s.clore('TIT', h))
        self.absent('W', self.priv)

    def test_S_303(self):
        """S-303
        Pré : priv diffusable ; TIT a délégué à V `voir` avec `repartager` sur priv.
        Op : V désigne le public bénéficiaire de `voir` sur priv.
        Attendu : **Refus** : seul le titulaire (objet personnel) ou un RS (contenu) désigne le public.
        Fondement : § 13.1"""
        self.s.objets[self.priv].diffusable = True                 # fait externe : diffusabilité évaluée
        self.deleg('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv), repartager=True)
        self.refus(self.s.deleguer('V', ('public',), ['voir'], ('objet', self.priv)))
        self.ok(self.s.deleguer('TIT', ('public',), ['voir'], ('objet', self.priv)))

    def test_S_304(self):
        """S-304
        Pré : V lecteur de P ; RS pose une interdiction d'action `commenter` sur o visant V_bis, second compte de V.
        Op : V commente o.
        Attendu : **Refus** : une interdiction vise la personne.
        Fondement : § 2.3 ; § 11.4 (H-5)"""
        self.nomme('R0', 'P', 'V', 'lecteur')
        self.ok(self.s.creer_protection('RS', 'interdiction_action', self.o, destinataires={'V_bis'},
                                        actions={'commenter'}))
        self.refuse('V', self.o, 'commenter')

    def test_S_305(self):
        """S-305
        Pré : RS pose sur o un embargo d'existence dont V_bis, second compte de V, est bénéficiaire ; RS a délégué
        `voir` sur o à V.
        Op : V consulte o.
        Attendu : **Accordé** : le bénéficiaire s'entend de la personne.
        Fondement : § 2.4 (H-5)"""
        self.deleg('RS', ('acteur', 'V'), ['voir'], ('objet', self.o))
        self.ok(self.s.creer_protection('RS', 'embargo_existence', self.o, beneficiaires={('acteur', 'V_bis')}))
        self.accorde('V', self.o)

    def test_S_306(self):
        """S-306
        Pré : RS gardien d'un embargo de contenu sur o.
        Op : RS_bis, second compte de RS, lève l'embargo.
        Attendu : **Accepté** : le gardien s'entend de la personne.
        Fondement : § 11.2 ; § 11.5 (H-5)"""
        p = self.ok(self.s.creer_protection('RS', 'embargo_contenu', self.o))
        self.ok(self.s.lever_protection('RS_bis', p))

    def test_S_307(self):
        """S-307
        Pré : transfert de ESP préparé de C à K ; C2, second compte de C, collaborateur de ESP, y a un objet
        personnel O2 (nommé par RS2), sans voie retenue.
        Op : C présente le transfert.
        Attendu : **Blocage** : les objets personnels du cédant s'entendent de la personne.
        Fondement : § 10.5 (H-5)"""
        self.espace_transfere()
        self.nomme('RS2', 'ESP', 'C2', 'collaborateur')
        O2 = self.obj('C2', 'ESP', perso=True)
        self.assertEqual(self.s.presenter('C', self.tid).code, 'blocage')
        self.ok(self.s.choisir_voie('C', self.tid, O2, 'a'))
        self.ok(self.s.presenter('C', self.tid))

    def test_S_308(self):
        """S-308
        Pré : HI de RS `voir` sur o au groupe G, en `notification` ; ADM ajoute à G le compte NONV, sans identité
        établie.
        Op : NONV consulte o.
        Attendu : **Introuvable** : un compte sans identité établie n'est jamais admis automatiquement.
        Fondement : § 1 ; § 9.4 (H-5)"""
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        self.deleg('RS', ('groupe', 'G'), ['voir'], ('objet', self.o), mode='notification')
        self.ok(self.s.ajouter_membre('ADM', 'G', 'NONV'))
        self.absent('NONV', self.o)

    def test_S_309(self):
        """S-309
        Pré : NONV, compte sans identité établie, est collaborateur de P et titulaire de l'objet personnel q.
        Op : NONV pose un embargo de contenu sur q ; puis TIT, gardien d'un embargo sur priv, désigne NONV gardien.
        Attendu : **Refus** dans les deux cas : ni créateur de protection ni gardien sans identité établie.
        Fondement : § 1 ; § 11.1 ; § 11.2 (H-5)"""
        self.nomme('R0', 'P', 'NONV', 'collaborateur')
        q = self.obj('NONV', perso=True)
        self.refus(self.s.creer_protection('NONV', 'embargo_contenu', q))
        p = self.ok(self.s.creer_protection('TIT', 'embargo_contenu', self.priv))
        self.deleg('TIT', ('acteur', 'NONV'), ['voir'], ('objet', self.priv))
        self.refus(self.s.designer_gardien('TIT', p, 'NONV'))

    def test_S_310(self):
        """S-310
        Pré : TIT a délégué `voir` avec `repartager` sur priv à V et à W ; W a délégué `voir` sur priv à V_bis, second
        compte de V.
        Op : V confirme l'HP de W au profit de V_bis ; puis TIT la confirme.
        Attendu : **Refus**, puis **accepté** : nul ne confirme une habilitation dont sa personne est bénéficiaire.
        Fondement : A3 ; T-06 (CT-03)"""
        self.deleg('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv), repartager=True)
        self.deleg('TIT', ('acteur', 'W'), ['voir'], ('objet', self.priv), repartager=True)
        h = self.deleg('W', ('acteur', 'V_bis'), ['voir'], ('objet', self.priv))
        self.refus(self.s.confirmer('V', h))
        self.ok(self.s.confirmer('TIT', h))

    def test_S_311(self):
        """S-311
        Pré : sélection S de RS, non partagée, avec une proposition en attente de o2 (elle était partagée lors de
        l'ajout, puis l'habilitation a été close).
        Op : RS2 active la proposition ; puis RS, auteur, l'active.
        Attendu : **Refus**, puis **accepté** : une sélection non partagée est gérée par son auteur.
        Fondement : § 13.3 (CT-10)"""
        o2 = self.obj('RS')
        sel = self.ok(self.s.creer_selection('RS', 'P', {self.o}))
        h = self.deleg('RS', ('acteur', 'V'), ['voir'], ('selection', sel))
        self.assertEqual(self.ok(self.s.ajouter_a_selection('RS', sel, o2)), 'proposition')
        self.ok(self.s.clore('RS', h))
        self.refus(self.s.activer_proposition('RS2', sel, o2))
        self.ok(self.s.activer_proposition('RS', sel, o2))

    def test_S_312(self):
        """S-312
        Pré : RS2 est frappé par une interdiction d'action `voir` sur o, qu'il connaît (posée par RS).
        Op : RS2 délègue `voir` sur le contenu de P à V.
        Attendu : **Refus** : sur une cible connue, une action non exécutable fait refuser l'acte (pas d'exclusion
        figée).
        Fondement : § 2.5 (G-7, H-1a)"""
        self.ok(self.s.creer_protection('RS', 'interdiction_action', self.o, destinataires={'RS2'}, actions={'voir'}))
        self.refus(self.s.deleguer('RS2', ('acteur', 'V'), ['voir'], ('contenu', 'P')))

    def cachee_a_r0(self):
        """o2 est caché à R0 (interdiction d'existence posée par RS) ; R0 l'ignore."""
        self.o2 = self.obj('RS', titre='o2')
        self.ok(self.s.creer_protection('RS', 'interdiction_existence', self.o2, destinataires={'R0'}))

    def test_S_313(self):
        """S-313
        Pré : o2 est caché à R0 par une interdiction d'existence posée par RS.
        Op : R0 nomme N lecteur sur le contenu de P ; puis N consulte o et o2.
        Attendu : **Accepté** ; N voit o, et o2 est une exclusion figée de la nomination : **introuvable**.
        Fondement : § 2.5 (H-1a) ; § 7.2"""
        self.cachee_a_r0()
        self.nomme('R0', 'P', 'N', 'lecteur')
        self.accorde('N', self.o)
        self.absent('N', self.o2)

    def test_S_314(self):
        """S-314
        Pré : comme S-313 ; HI de RS `voir` sur le contenu de P au profit du groupe G ; M membre de G.
        Op : R0 admet M ; puis M consulte o et o2.
        Attendu : **Accepté** ; M voit o ; o2 est une exclusion figée de l'admission : **introuvable**.
        Fondement : § 2.5 (H-1a) ; § 8.3"""
        self.cachee_a_r0()
        self.ok(self.s.creer_groupe('ADM', 'P', 'G'))
        h = self.deleg('RS', ('groupe', 'G'), ['voir'], ('contenu', 'P'))
        self.ok(self.s.ajouter_membre('ADM', 'G', 'M'))
        self.ok(self.s.admettre('R0', h, 'M'))
        self.accorde('M', self.o)
        self.absent('M', self.o2)

    def test_S_315(self):
        """S-315
        Pré : comme S-313 ; RS a délégué à Q `voir` avec `repartager` sur le contenu de P ; Q a délégué `voir` sur
        le contenu de P à B (HP).
        Op : R0 confirme l'HP de Q ; RS clôt l'HI de Q ; puis B consulte o et o2.
        Attendu : B voit o (fondateur R0) ; o2 est une exclusion figée de R0 : **introuvable**.
        Fondement : § 2.5 (H-1a) ; § 8.2"""
        self.cachee_a_r0()
        for a in ('Q', 'B'):
            if a not in self.s.acteurs:
                self.s.ajouter_acteur(a)
        hq = self.deleg('RS', ('acteur', 'Q'), ['voir'], ('contenu', 'P'), repartager=True)
        hb = self.deleg('Q', ('acteur', 'B'), ['voir'], ('contenu', 'P'))
        self.accorde('B', self.o2)
        self.ok(self.s.confirmer('R0', hb))
        self.ok(self.s.clore('RS', hq))
        self.accorde('B', self.o)
        self.absent('B', self.o2)

    def test_S_316(self):
        """S-316
        Pré : M, collaborateur de Q, a repris une copie c de l'objet src ; Y lecteur de P ; M a délégué `voir` sur
        c à Y.
        Op : RS pose sur src une interdiction d'existence visant Y ; puis Y consulte c.
        Attendu : **Introuvable** : une protection créée plus tard sur un ascendant est propagée aux copies.
        Fondement : § 13.11 (H-3b)"""
        self.ok(self.s.creer_espace('QQ', 'Q'))
        self.nomme('QQ', 'Q', 'M', 'collaborateur')
        src = self.obj('RS', titre='src')
        self.deleg('RS', ('acteur', 'M'), ['voir', 'reutiliser'], ('objet', src))
        c = self.ok(self.s.reutiliser('M', src, 'Q'))
        self.deleg('M', ('acteur', 'Y'), ['voir'], ('objet', c))
        self.accorde('Y', c)
        self.ok(self.s.creer_protection('RS', 'interdiction_existence', src, destinataires={'Y'}))
        self.absent('Y', c)

    def test_S_317(self):
        """S-317
        Pré : M, collaborateur de Q, a repris une copie c de l'objet src ; src est ensuite évalué sensible (fait
        externe, DI-E05).
        Op : M délègue `voir` sur c à Y.
        Attendu : **Refus** : la sensibilité d'un ascendant est héritée ; une copie sensible n'est pas redistribuable.
        Fondement : § 13.11 (H-3b)"""
        self.ok(self.s.creer_espace('QQ', 'Q'))
        self.nomme('QQ', 'Q', 'M', 'collaborateur')
        src = self.obj('RS', titre='src')
        self.deleg('RS', ('acteur', 'M'), ['voir', 'reutiliser'], ('objet', src))
        c = self.ok(self.s.reutiliser('M', src, 'Q'))
        self.s.objets[src].sensible = True                          # fait externe
        self.refus(self.s.deleguer('M', ('acteur', 'Y'), ['voir'], ('objet', c)))

    def test_S_318(self):
        """S-318
        Pré : RS2, membre du groupe g de ESP, signe une HI `voir` sur le contenu de ESP au profit de g, en
        `notification` ; transfert de ESP présenté à K.
        Op : K lit les admissions des engagements présentés.
        Attendu : aucune admission de RS2 : le signataire n'est jamais admis, même automatiquement.
        Fondement : § 9.4 (G-2) ; § 10.6"""
        self.espace_transfere()
        self.ok(self.s.creer_groupe('ADME', 'ESP', 'g'))
        self.ok(self.s.ajouter_membre('ADME', 'g', 'RS2'))
        self.ok(self.s.ajouter_membre('ADME', 'g', 'V'))
        self.deleg('RS2', ('groupe', 'g'), ['voir'], ('contenu', 'ESP'), mode='notification')
        self.presenter()
        admis = [v[1] for k, v in self.ok(self.s.vue_transfert('K', self.tid))['engagements'] if k[0] == 'adm']
        self.assertEqual(admis, ['V'])

    def test_S_319(self):
        """S-319
        Pré : O1 en voie (b), accepté par K ; HP de C `voir` sur O1 au profit de V jusqu'à 30, annoncée en
        réémission à l'identique ; transfert présenté ; C restreint ensuite l'HP à l'échéance 20.
        Op : K accepte.
        Attendu : **Refus** de toute l'acceptation : la réémission maintenue serait plus large que l'HP d'origine.
        Fondement : § 10.5 ; § 10.7"""
        self.espace_transfere()
        O1 = self.obj('C', 'ESP', perso=True)
        h = self.deleg('C', ('acteur', 'V'), ['voir'], ('objet', O1), echeance=30)
        self.ok(self.s.choisir_voie('C', self.tid, O1, 'b'))
        self.ok(self.s.annoncer_reemission('C', self.tid, h))
        self.presenter()
        self.ok(self.s.accepter_objet('K', self.tid, O1))
        self.ok(self.s.restreindre('C', h, echeance=20))
        avant = self.instantane()
        self.refus(self.accepter())
        self.assertEqual(self.instantane(), avant)

    def test_S_320(self):
        """S-320
        Pré : RS pose un embargo d'existence sur o, dont il est gardien ; R0 a délégué `voir` sur o à RS_bis, second
        compte de RS.
        Op : RS_bis consulte o.
        Attendu : **Accordé** : le gardien d'un embargo en est bénéficiaire, par personne.
        Fondement : § 11.2 ; I-12 (H-5)"""
        self.deleg('R0', ('acteur', 'RS_bis'), ['voir'], ('objet', self.o))
        self.ok(self.s.creer_protection('RS', 'embargo_existence', self.o))
        self.accorde('RS_bis', self.o)

    def test_S_321(self):
        """S-321
        Pré : T2, second compte de la personne T, est RS de P et gardien unique d'un embargo d'existence sur o.
        Op : SUP1 et SUP2 constatent le décès de T (premier compte).
        Attendu : la protection devient orpheline et est signalée à l'autorité de dérogation : le défunt s'entend de
        la personne.
        Fondement : § 10.4 (CT-14, H-5) ; § 11.2"""
        self.s.ajouter_acteur('T2', personne='T')
        self.nomme('R0', 'P', 'T2', 'RS')
        p = self.ok(self.s.creer_protection('T2', 'embargo_existence', self.o))
        self.ok(self.s.constater_deces(('SUP1', 'SUP2'), 'T'))
        self.assertIn(('protection_orpheline', p), self.s.notifications.get('SUP3', []))

    def embargo_g2(self):
        """Embargo d'existence sur o1 (contenu de ESP) dont le groupe g2 de l'espace GS est bénéficiaire, K agréé."""
        self.espace_transfere()
        s = self.s
        self.ok(s.creer_espace('RG', 'GS'))
        self.ok(s.creer_groupe('RG', 'GS', 'g2'))
        self.ok(s.ajouter_membre('RG', 'g2', 'K'))
        self.o1 = self.obj('C', 'ESP')
        p = self.ok(s.creer_protection('RS2', 'embargo_existence', self.o1, beneficiaires={('groupe', 'g2')}))
        self.ok(s.agreer_membre('RS2', p, 'g2', 'K'))

    def test_S_322(self):
        """S-322
        Pré : embargo d'existence sur o1 (contenu de ESP) au profit du groupe g2 de l'espace GS, K agréé ; HI de RS2
        `voir` sur {o1, ot} au profit de V ; RG retire K de g2 ; transfert présenté (K ne voit pas o1).
        Op : RG, gestionnaire de g2, hors de l'espace transféré, rajoute K à g2 (non gelé) ; puis K accepte.
        Attendu : **Présentation renouvelée** : le périmètre réel d'un engagement présenté s'est élargi.
        Fondement : § 10.6 (G-3, H-4a)"""
        self.embargo_g2()
        self.deleg('RS2', ('acteur', 'V'), ['voir'], ('objets', {self.o1, self.ot}))
        self.ok(self.s.retirer_membre('RG', 'g2', 'K'))
        emp = self.presenter()
        self.ok(self.s.ajouter_membre('RG', 'g2', 'K'))
        self.assertEqual(self.accepter(emp).code, 'renouvelee')

    def test_S_323(self):
        """S-323
        Pré : comme S-322, l'HI de RS2 portant sur o1 seul (invisible à K à la présentation).
        Op : RG rajoute K à g2 ; puis K accepte.
        Attendu : **Présentation renouvelée** : un engagement nouveau pour K est apparu.
        Fondement : § 10.6 (G-3, H-4a)"""
        self.embargo_g2()
        self.deleg('RS2', ('acteur', 'V'), ['voir'], ('objet', self.o1))
        self.ok(self.s.retirer_membre('RG', 'g2', 'K'))
        emp = self.presenter()
        self.ok(self.s.ajouter_membre('RG', 'g2', 'K'))
        self.assertEqual(self.accepter(emp).code, 'renouvelee')


if __name__ == '__main__':
    unittest.main()
