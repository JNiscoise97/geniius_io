"""Non-régression des contrôles en aveugle V1.5, rejoués contre le contrat V1.6.

- Classe `ControleA` : les 13 scripts d'attaque du contrôle A (contrat et modèle V1.5), a01 à a13.
- Classe `ControleB` : les témoins du contrôle B (couverture de la batterie V1.5), un par mutation N01 à N53
  qui avait survécu, et les sondes des justifications M010, M013 et M104.

L'attendu de chaque test est déduit du texte du contrat V1.6, cité en docstring. Les tests n'appellent aucune
fonction interne du modèle : ils observent les opérations publiques et leurs réponses ; l'état jumeau et les
transcriptions viennent de `outils.py`.
"""
import unittest

from base import Base
import modele  # noqa: E402  (chemin posé par base)
from outils import droits_personne, jumeau_sans


class Commun(Base):
    def systeme(self, *acteurs, **comptes):
        """Ajoute les acteurs manquants ; `comptes` : second compte -> personne."""
        for a in acteurs:
            if a not in self.s.acteurs:
                self.s.ajouter_acteur(a)
        for c, personne in comptes.items():
            self.s.ajouter_acteur(c, personne=personne)
        return self.s


class ControleA(Commun):

    # ------------------------------------------------------------------ a01
    def monde_a01(self, op, exister=True):
        s = self.systeme('R', 'X', 'B', 'G')
        self.ok(s.creer_espace('R', 'E'))
        o1 = self.ok(s.creer_objet('R', 'E'))
        o2 = self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'X', 'RS', perimetre=[o2])
        self.ok(s.creer_groupe('R', 'E', 'g'))
        self.ok(s.ajouter_membre('R', 'g', 'G'))
        hg = self.ok(s.deleguer('R', ('groupe', 'g'), {'voir'}, ('contenu', 'E')))
        hb = self.ok(s.deleguer('R', ('acteur', 'B'), {'voir', 'commenter'}, ('contenu', 'E'), echeance=50))
        self.ok(s.creer_protection('X', 'interdiction_existence', o2, destinataires=['R']))
        if not exister:
            s = self.s = jumeau_sans(s, o2)
        if op == 'deleguer_contenu':
            r = s.deleguer('R', ('acteur', 'B'), {'voir', 'editer'}, ('contenu', 'E'))
        elif op == 'admettre':
            r = s.admettre('R', hg, 'G')
        else:
            r = s.prolonger('R', hb, 100)
        return s, r, o1, o2

    def test_a01_g7_perimetre_dynamique(self):
        """a01 — § 2.5 (H-1a), I-5 : sur un périmètre dynamique, une cible cachée à l'habilitant ne fait pas refuser
        l'acte ; la réponse est celle d'un monde sans cette cible, et l'habilitation ne confère rien sur elle
        (exclusion figée)."""
        for op in ('deleguer_contenu', 'admettre', 'prolonger'):
            with self.subTest(op=op):
                self.setUp()
                s, r1, o1, o2 = self.monde_a01(op, True)
                self.setUp()
                _, r0, _, _ = self.monde_a01(op, False)
                self.assertEqual((r1.ok, r1.code), (r0.ok, r0.code))
                self.assertTrue(r1.ok, r1)
        self.setUp()
        s, r, o1, o2 = self.monde_a01('deleguer_contenu')
        self.ok(s.clore('R', next(h.id for h in s.habs.values() if h.beneficiaire == ('acteur', 'B')
                                   and h.echeance == 50)))
        self.accorde('B', o1, 'editer')
        self.absent('B', o2)

    # ------------------------------------------------------------------ a02
    def test_a02_role_propre_espace(self):
        """a02 — § 9.2 (H-2a), A3 : une HI au profit d'un rôle de son propre espace exige une admission. Deux RS à
        périmètre étroit qui se nomment l'un l'autre (seconds comptes) dans ce rôle n'en tirent que les actions du
        rôle sur le périmètre nommé (une nomination émane d'un autre acteur, A3) et rien par l'HI ; un tiers nommé
        sur un périmètre étroit n'obtient rien hors de lui.
        P-1 validé le 12/10/2026 : I-3 interdit le gain par les ensembles gérés, et permet cette nomination par autrui."""
        s = self.systeme('R', 'X1', 'Y1', X2='X1', Y2='Y1')
        self.ok(s.creer_espace('R', 'E'))
        o1, o2, o3 = (self.ok(s.creer_objet('R', 'E')) for _ in range(3))
        self.nomme('R', 'E', 'X1', 'RS', perimetre=[o1])
        self.nomme('R', 'E', 'Y1', 'RS', perimetre=[o2])
        self.ok(s.deleguer('R', ('role', 'E', 'lecteur'), {'voir', 'editer'}, ('contenu', 'E')))
        avant_x, avant_y = droits_personne(s, 'X1'), droits_personne(s, 'Y1')
        self.ok(s.nommer('X1', 'E', 'Y2', 'lecteur', perimetre=[o1]))
        self.ok(s.nommer('Y1', 'E', 'X2', 'lecteur', perimetre=[o2]))
        role = {'voir', 'commenter'}
        self.assertEqual(droits_personne(s, 'X1') - avant_x, {(o2, a) for a in role})
        self.assertEqual(droits_personne(s, 'Y1') - avant_y, {(o1, a) for a in role})
        self.setUp()
        s = self.systeme('R', 'X1', 'Z')
        self.ok(s.creer_espace('R', 'E'))
        p1, p2 = self.ok(s.creer_objet('R', 'E')), self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'X1', 'RS', perimetre=[p1])
        self.ok(s.deleguer('R', ('role', 'E', 'lecteur'), {'voir', 'editer'}, ('contenu', 'E')))
        self.ok(s.nommer('X1', 'E', 'Z', 'lecteur', perimetre=[p1]))
        self.absent('Z', p2, 'editer')

    # ------------------------------------------------------------------ a03
    def test_a03_prolonger_a_son_profit(self):
        """a03 — A3, T-04 (CT-03) : nul ne prolonge une habilitation dont il (sa personne) est bénéficiaire, HI ou
        nomination."""
        s = self.systeme('R', 'X1', X2='X1')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        hx = self.nomme('R', 'E', 'X1', 'RS')
        self.nomme('R', 'E', 'X2', 'invite')
        h = self.ok(s.deleguer('R', ('acteur', 'X2'), {'voir', 'editer'}, ('contenu', 'E'), echeance=10))
        self.refus(s.deleguer('X1', ('acteur', 'X2'), {'voir', 'editer'}, ('contenu', 'E')))
        self.refus(s.prolonger('X1', h, None))
        self.ok(s.clore('R', hx))
        s.avancer(20)
        self.assertFalse(s.acces('X2', o, 'editer').ok)
        self.setUp()
        s = self.systeme('R', 'X1', X2='X1')
        self.ok(s.creer_espace('R', 'E'))
        self.nomme('R', 'E', 'X1', 'RS')
        hn = self.nomme('R', 'E', 'X2', 'collaborateur', echeance=10)
        self.refus(s.prolonger('X1', hn, None))

    # ------------------------------------------------------------------ a04
    def test_a04_renouvellements(self):
        """a04 — § 12.6 (CT-16), I-13 : le rang d'une demande est 1 + le maximum des rangs de toutes les dérogations
        consécutives qu'elle recoupe ; intercaler une dérogation « fraîche » ne remet pas le compteur à zéro."""
        s = self.systeme('R', 'B')
        self.ok(s.creer_espace('R', 'E'))
        o1, o2 = self.ok(s.creer_objet('R', 'E')), self.ok(s.creer_objet('R', 'E'))
        A = ['SUP1', 'SUP2']
        codes = []
        for i, cibles in enumerate([[o1], [o1], [o1], [o1], [o2], [o1, o2], [o1]]):
            codes.append(s.accorder_derogation(A, 'B', cibles, ['voir'], 'enquête', f'j{i}', 30).code)
            s.avancer(1)
        self.assertEqual(codes, ['ok', 'ok', 'ok', 'refus', 'ok', 'refus', 'refus'])

    # ------------------------------------------------------------------ a05
    def test_a05_1_restriction_legale_posterieure(self):
        """a05-1 — § 11.6 (CT-05), § 13.11 (H-3b) : une restriction légale posée sur l'original après la copie
        frappe aussi la copie."""
        s = self.systeme('R', 'A', 'B', 'TRIB')
        s.autorites_externes.add('TRIB')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'A', 'collaborateur')
        self.ok(s.deleguer('R', ('acteur', 'A'), {'voir', 'reutiliser'}, ('objet', o)))
        c = self.ok(s.reutiliser('A', o, 'E'))
        self.ok(s.deleguer('A', ('acteur', 'B'), {'voir'}, ('objet', c)))
        self.accorde('B', c)
        self.ok(s.enregistrer_restriction_externe('TRIB', o))
        self.refuse('A', o)
        self.refuse('B', c)
        self.refuse('A', c)

    def test_a05_2_gardiens_herites(self):
        """a05-2 — § 11.2, § 13.11 (H-3b) : les gardiens d'une protection héritée sont ceux de l'ascendant, appréciés
        sur l'ascendant : la protection n'est pas orpheline, le copieur ne peut ni la lever ni se faire désigner, et
        la copie reste cachée au destinataire."""
        s = self.systeme('R', 'A', 'G', 'Y')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'A', 'collaborateur')
        self.nomme('R', 'E', 'G', 'RS')
        self.nomme('R', 'E', 'Y', 'lecteur')
        self.ok(s.deleguer('R', ('acteur', 'A'), {'voir', 'reutiliser'}, ('objet', o)))
        self.ok(s.creer_protection('G', 'interdiction_existence', o, destinataires=['Y']))
        c = self.ok(s.reutiliser('A', o, 'E'))
        ph = next(p.id for p in s.protections.values() if p.cible == c)
        self.assertEqual(s.notifications.get('SUP1', []), [])
        self.refus(s.designer_gardien_orphelin(['SUP1', 'SUP2'], ph, 'A', demandeur='A'))
        self.refus(s.lever_protection('A', ph))
        self.refus(s.deleguer('A', ('acteur', 'Y'), {'voir'}, ('objet', c)))
        self.absent('Y', c)
        self.ok(s.lever_protection('G', ph))
        self.ok(s.deleguer('A', ('acteur', 'Y'), {'voir'}, ('objet', c)))
        self.accorde('Y', c)
        self.absent('Y', o)

    def test_a05_3_sensibilite_heritee(self):
        """a05-3 — § 13.11 (H-3b), § 12.3 : la sensibilité est héritée : la copie n'est pas redistribuable et une
        dérogation à un approbateur ne la couvre pas."""
        s = self.systeme('R', 'A', 'Z')
        self.ok(s.creer_espace('R', 'E'))
        self.nomme('R', 'E', 'A', 'collaborateur')
        o = self.ok(s.creer_objet('R', 'E', sensible=True))
        self.ok(s.deleguer('R', ('acteur', 'A'), {'voir', 'reutiliser'}, ('objet', o)))
        c = self.ok(s.reutiliser('A', o, 'E'))
        self.refus(s.deleguer('A', ('acteur', 'Z'), {'voir'}, ('objet', c)))
        self.refus(s.accorder_derogation(['SUP1'], 'Z', [c], ['voir'], 'diagnostic technique', 'j', 5))

    # ------------------------------------------------------------------ a06
    def test_a06_espace_archive(self):
        """a06 — § 5.1 (CM-03, CM-04) : dans un espace archivé ou clos, écritures, HP et confirmations sur un objet
        personnel au titulaire seulement ; sur le contenu, fermées."""
        s = self.systeme('R', 'T', 'B', 'Z', 'Q')
        self.ok(s.creer_espace('R', 'E'))
        self.nomme('R', 'E', 'T', 'collaborateur')
        p = self.ok(s.creer_objet('T', 'E', personnel=True))
        self.ok(s.creer_objet('R', 'E'))
        self.ok(s.deleguer('T', ('acteur', 'B'), {'voir', 'editer'}, ('objet', p), repartager=True))
        self.ok(s.deleguer('R', ('acteur', 'Q'), {'voir'}, ('contenu', 'E'), repartager=True))
        hc = self.ok(s.deleguer('Q', ('acteur', 'Z'), {'voir'}, ('contenu', 'E')))
        self.ok(s.archiver('R', 'E'))
        self.refuse('B', p, 'editer')
        self.accorde('T', p, 'editer')
        self.refus(s.deleguer('B', ('acteur', 'Z'), {'voir'}, ('objet', p)))
        self.ok(s.deleguer('T', ('acteur', 'Z'), {'voir'}, ('objet', p)))
        self.ok(s.clore_espace('R', 'E'))
        self.refuse('B', p, 'editer')
        self.refus(s.confirmer('R', hc))

    # ------------------------------------------------------------------ a07
    def test_a07_1_gel_par_personne(self):
        """a07-1 — § 10.4 (H-5) : le gel de succession porte sur les objets de tous les comptes de la personne."""
        s = self.systeme('R', 'T', 'B', T2='T')
        self.ok(s.creer_espace('R', 'E'))
        self.nomme('R', 'E', 'T', 'collaborateur')
        self.nomme('R', 'E', 'T2', 'collaborateur')
        p1 = self.ok(s.creer_objet('T', 'E', personnel=True))
        p2 = self.ok(s.creer_objet('T2', 'E', personnel=True))
        self.ok(s.deleguer('T', ('acteur', 'B'), {'voir'}, ('objet', p1)))
        self.ok(s.deleguer('T2', ('acteur', 'B'), {'voir'}, ('objet', p2)))
        self.ok(s.constater_deces(['SUP1', 'SUP2'], 'T'))
        self.absent('B', p1)
        self.absent('B', p2)
        self.assertEqual(s.deleguer('T2', ('acteur', 'R'), {'voir'}, ('objet', p2)).code, 'introuvable')

    def test_a07_2_gardien_decede(self):
        """a07-2 — § 10.4 (CT-14), § 11.2, § 12.3 : le défunt perd la qualité de gardien ; la protection devient
        orpheline et est signalée ; aucune dérogation ne la franchit tant qu'un gardien n'est pas désigné ; la
        désignation contrôlée est possible."""
        s = self.systeme('R', 'G', 'Y')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'G', 'RS')
        self.nomme('R', 'E', 'Y', 'lecteur')
        pid = self.ok(s.creer_protection('G', 'embargo_existence', o))
        self.ok(s.constater_deces(['SUP1', 'SUP2'], 'G'))
        self.assertIn(('protection_orpheline', pid), s.notifications.get('SUP3', []))
        self.refus(s.accorder_derogation(['SUP3', 'SUP4'], 'Y', [o], ['voir'], 'enquête', 'j', 10,
                                         accords_gardiens={}))
        self.ok(s.designer_gardien_orphelin(['SUP3', 'SUP4'], pid, 'R', demandeur='R'))
        self.ok(s.accorder_derogation(['SUP3', 'SUP4'], 'Y', [o], ['voir'], 'enquête', 'j', 10,
                                      accords_gardiens={pid: 'R'}))
        self.accorde('Y', o, finalite='enquête')

    def test_a07_3_derogation_sur_objet_gele(self):
        """a07-3 — § 12.3 (CT-15) : une dérogation sur un objet gelé exige la finalité `succession`."""
        s = self.systeme('R', 'T', 'Y')
        self.ok(s.creer_espace('R', 'E'))
        self.nomme('R', 'E', 'T', 'collaborateur')
        p = self.ok(s.creer_objet('T', 'E', personnel=True))
        self.ok(s.constater_deces(['SUP1', 'SUP2'], 'T'))
        self.refus(s.accorder_derogation(['SUP3', 'SUP4'], 'Y', [p], ['voir', 'exporter'], 'enquête', 'curiosité', 10))
        self.absent('Y', p, 'exporter', finalite='enquête')
        self.ok(s.accorder_derogation(['SUP3', 'SUP4'], 'Y', [p], ['voir'], 'succession', 'inventaire', 10))
        self.accorde('Y', p, finalite='succession')

    # ------------------------------------------------------------------ a08
    def test_a08_2_protections_hors_journaux(self):
        """a08-2 — § 10.3 (CT-20) : les actes sur les protections ne figurent pas dans les journaux de gouvernance."""
        s = self.systeme('R', 'ADM', 'X', 'Y')
        self.ok(s.creer_espace('R', 'E'))
        self.ok(s.nommer_administrateur('R', 'E', 'ADM'))
        self.nomme('R', 'E', 'X', 'RS')
        self.nomme('R', 'E', 'Y', 'lecteur')
        o = self.ok(s.creer_objet('R', 'E'))
        avant = self.ok(s.journaux('ADM', 'E'))
        p = self.ok(s.creer_protection('X', 'interdiction_action', o, destinataires=['Y'], actions=['commenter']))
        self.ok(s.ajouter_destinataire('X', p, 'ADM'))
        self.ok(s.lever_protection('X', p))
        self.assertEqual(self.ok(s.journaux('ADM', 'E')), avant)
        self.assertEqual(self.ok(s.journaux('R', 'E')), self.ok(s.journaux('R', 'E')))

    def test_a08_3_interdiction_par_personne(self):
        """a08-3 — § 11.4 (H-5) : une interdiction qui vise un compte vise tous les comptes de la personne."""
        s = self.systeme('R', 'Y1', 'G', Y2='Y1')
        self.ok(s.creer_espace('R', 'E'))
        self.nomme('R', 'E', 'G', 'RS')
        self.nomme('R', 'E', 'Y1', 'lecteur')
        self.nomme('R', 'E', 'Y2', 'lecteur')
        o = self.ok(s.creer_objet('R', 'E'))
        self.ok(s.creer_protection('G', 'interdiction_existence', o, destinataires=['Y1']))
        self.absent('Y1', o)
        self.absent('Y2', o)

    def test_a08b_rang_de_serie(self):
        """a08b — § 13.6 (H-6e), I-5 : un rang n'est occupé, pour un acteur, que par une publication qu'il voit ;
        la réponse est celle d'un monde sans la publication cachée."""
        reponses = []
        for exister in (True, False):
            self.setUp()
            s = self.systeme('R', 'X')
            self.ok(s.creer_espace('R', 'E'))
            self.nomme('R', 'E', 'X', 'RS')
            sr = self.ok(s.creer_serie('R', 'E'))
            cachee = self.ok(s.creer_objet('R', 'E'))
            visible = self.ok(s.creer_objet('R', 'E'))
            self.ok(s.inserer_serie('R', sr, cachee, 1))
            self.ok(s.creer_protection('R', 'interdiction_existence', cachee, destinataires=['X']))
            if not exister:
                s = self.s = jumeau_sans(s, cachee)
            reponses.append((s.inserer_serie('X', sr, visible, 1), s.lire_serie('X', sr)))
        self.assertEqual(reponses[0], reponses[1])
        self.assertTrue(reponses[0][0].ok)

    # ------------------------------------------------------------------ a09
    def test_a09_1_second_compte_du_cedant(self):
        """a09-1 — § 10.7 (H-5), § 10.8 : le cédant s'entend de la personne : son second compte perd ses
        appartenances et reste sous verrou."""
        s = self.systeme('C', 'K', 'X0', C2='C')
        self.ok(s.creer_espace('C', 'E'))
        o = self.ok(s.creer_objet('C', 'E'))
        self.nomme('C', 'E', 'X0', 'RS')
        self.nomme('X0', 'E', 'C2', 'collaborateur')
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        emp = self.ok(s.presenter('C', t))
        self.ok(s.accepter_transfert('K', t, emp))
        self.absent('C2', o, 'editer')
        self.refus(s.nommer('K', 'E', 'C2', 'lecteur'))

    def test_a09_2_espace_clos_pendant_la_fenetre(self):
        """a09-2 — § 10.7 (CT-19) : l'acceptation est refusée si l'espace a été clos pendant la fenêtre ; la clôture
        n'est pas gelée."""
        s = self.systeme('C', 'K')
        self.ok(s.creer_espace('C', 'E'))
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        emp = self.ok(s.presenter('C', t))
        self.ok(s.clore_espace('C', 'E'))
        self.refus(s.accepter_transfert('K', t, emp))
        self.assertEqual(self.ok(s.lister_habilitations('C', 'E')) is not None, True)

    def test_a09_3_autorite_legale_et_presentations(self):
        """a09-3 — § 10.6 (H-4a), § 5.6 (CT-09) : les actes de l'autorité légale ne sont jamais gelés ; un nouvel
        engagement fait renouveler la présentation ; un transfert compte au plus PRESENTATIONS_MAX présentations,
        après quoi le cédant l'annule et une carence s'ouvre."""
        s = self.systeme('C', 'K', 'X', 'TRIB')
        s.autorites_externes.add('TRIB')
        self.ok(s.creer_espace('C', 'E'))
        o = self.ok(s.creer_objet('C', 'E'))
        self.nomme('C', 'E', 'X', 'RS')
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        for i in range(modele.PRESENTATIONS_MAX):
            pid = self.ok(s.enregistrer_restriction_externe('TRIB', o))
            emp = self.ok(s.presenter('C', t))
            self.ok(s.lever_restriction_legale('TRIB', pid))
            self.assertEqual(s.nommer('X', 'E', 'K', 'lecteur').code, 'gel')
            self.assertEqual(s.accepter_transfert('K', t, emp).code, 'renouvelee')
        self.refus(s.presenter('C', t))
        self.ok(s.annuler_transfert('C', t))
        self.refus(s.preparer_transfert('C', 'E', 'K'))
        s.avancer(modele.CARENCE_TRANSFERT)
        self.ok(s.preparer_transfert('C', 'E', 'K'))

    def test_a09_4_gel_sans_sonde(self):
        """a09-4 — § 10.6 (CT-26) : la décision de geler ne dépend pas de ce que voit K ; un tiers n'apprend rien."""
        codes = []
        for cacher in (True, False):
            self.setUp()
            s = self.systeme('C', 'K', 'X', 'B')
            self.ok(s.creer_espace('C', 'E'))
            o = self.ok(s.creer_objet('C', 'E'))
            self.nomme('C', 'E', 'X', 'RS')
            self.nomme('C', 'E', 'B', 'lecteur')
            if cacher:
                self.ok(s.creer_protection('C', 'interdiction_existence', o, destinataires=['K']))
            t = self.ok(s.preparer_transfert('C', 'E', 'K'))
            self.ok(s.presenter('C', t))
            r = s.deleguer('X', ('acteur', 'B'), {'voir', 'editer'}, ('objet', o))
            codes.append((r.code, r.valeur))
        self.assertEqual(codes, [('gel', 'espace en cours de transfert')] * 2)

    # ------------------------------------------------------------------ a10
    def test_a10_1_portee_limitee_sans_bascule(self):
        """a10-1 — § 9.3 (H-6b) : une protection posée puis levée par un RS étroit ne change pas le mode de l'HI de
        la racine ; l'admission automatique ne vaut pas sur la cible tant qu'elle est exigeante, et vaut de nouveau
        après la levée."""
        s = self.systeme('R', 'X', 'ADM', 'B', 'D')
        self.ok(s.creer_espace('R', 'E'))
        self.ok(s.nommer_administrateur('R', 'E', 'ADM'))
        o1, o2 = self.ok(s.creer_objet('R', 'E')), self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'X', 'RS', perimetre=[o2])
        self.ok(s.creer_groupe('R', 'E', 'g'))
        self.ok(s.deleguer('R', ('groupe', 'g'), {'voir'}, ('contenu', 'E'), mode='notification'))
        pid = self.ok(s.creer_protection('X', 'embargo_contenu', o2))
        self.ok(s.ajouter_membre('ADM', 'g', 'B'))
        self.accorde('B', o1)
        self.absent('B', o2)
        self.ok(s.lever_protection('X', pid))
        self.accorde('B', o2)
        self.ok(s.ajouter_membre('ADM', 'g', 'D'))
        self.accorde('D', o1)

    def test_a10_2_nomination_proposee_par_un_partant(self):
        """a10-2 — § 7.6 (CT-17) : le départ clôt les nominations proposées que le partant a signées."""
        s = self.systeme('R', 'X', 'Y')
        self.ok(s.creer_espace('R', 'E'))
        self.nomme('R', 'E', 'X', 'RS')
        hy = self.ok(s.nommer('X', 'E', 'Y', 'RS'))
        self.ok(s.quitter('X', 'E'))
        self.refus(s.accepter_nomination('Y', hy))

    def test_a10_3_nomination_g7(self):
        """a10-3 — § 7.2 (CM-02), § 2.5 : une nomination ne confère pas une action que le signataire ne peut pas
        exécuter sur une cible qu'il connaît."""
        s = self.systeme('R', 'X', 'N')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'X', 'RS')
        self.ok(s.creer_protection('R', 'interdiction_action', o, destinataires=['X'], actions=['editer']))
        self.refus(s.deleguer('X', ('acteur', 'N'), {'voir', 'editer'}, ('objet', o)))
        self.refus(s.nommer('X', 'E', 'N', 'collaborateur', perimetre=[o]))
        self.absent('N', o, 'editer')

    def test_a10_4_consentement_par_acte(self):
        """a10-4 — § 10.8 (H-6c) : un consentement vaut pour un seul acte et devient caduc au transfert suivant."""
        s = self.systeme('C', 'K', 'K2', 'Z')
        self.ok(s.creer_espace('C', 'E'))
        self.ok(s.creer_objet('C', 'E'))
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        self.ok(s.accepter_transfert('K', t, self.ok(s.presenter('C', t))))
        self.ok(s.consentir_reintegration('K', 'E', 'C', 'nomination'))
        self.nomme('K', 'E', 'Z', 'RS')
        t2 = self.ok(s.preparer_transfert('K', 'E', 'K2'))
        self.ok(s.accepter_transfert('K2', t2, self.ok(s.presenter('K', t2))))
        self.refus(s.nommer('Z', 'E', 'C', 'collaborateur'))

    # ------------------------------------------------------------------ a11 – a13
    def test_a11_confirmation_gelee(self):
        """a11 — § 10.6 (H-4a) : la confirmation figure dans la liste gelée ; elle est refusée pendant la fenêtre
        quel qu'en soit l'effet ; l'aval de l'HI en examen reste inopérant."""
        s = self.systeme('C', 'K', 'X', 'Q', 'B')
        self.ok(s.creer_espace('C', 'E'))
        o = self.ok(s.creer_objet('C', 'E'))
        self.nomme('C', 'E', 'X', 'RS')
        hq = self.ok(s.deleguer('C', ('acteur', 'Q'), {'voir'}, ('contenu', 'E'), repartager=True))
        h = self.ok(s.deleguer('Q', ('acteur', 'B'), {'voir'}, ('contenu', 'E')))
        self.ok(s.mettre_en_examen('C', hq))
        self.absent('B', o)
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        emp = self.ok(s.presenter('C', t))
        self.assertEqual(s.confirmer('X', h).code, 'gel')
        self.ok(s.accepter_transfert('K', t, emp))
        self.absent('B', o)

    def test_a12_creation_de_protection_jamais_gelee(self):
        """a12 — § 10.6 : la création d'une protection n'est jamais gelée, même si elle cache à K une restriction
        présentée (une protection devenue invisible à K est un retrait, CT-18)."""
        s = self.systeme('C', 'K', 'X', 'Y')
        self.ok(s.creer_espace('C', 'E'))
        o = self.ok(s.creer_objet('C', 'E'))
        self.nomme('C', 'E', 'X', 'RS')
        self.nomme('C', 'E', 'Y', 'lecteur')
        self.ok(s.creer_protection('X', 'interdiction_action', o, destinataires=['Y'], actions=['commenter']))
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        emp = self.ok(s.presenter('C', t))
        self.ok(s.creer_protection('X', 'embargo_existence', o))
        self.ok(s.accepter_transfert('K', t, emp))

    def test_a13_1_selection_et_cible_sensible(self):
        """a13-1 — § 9.3 (H-6b) : un objet sensible activé dans une sélection servie en `notification` n'est jamais
        conféré par une admission automatique."""
        s = self.systeme('R', 'X', 'ADM', 'B')
        self.ok(s.creer_espace('R', 'E'))
        self.ok(s.nommer_administrateur('R', 'E', 'ADM'))
        o1, o2 = self.ok(s.creer_objet('R', 'E')), self.ok(s.creer_objet('R', 'E', sensible=True))
        self.nomme('R', 'E', 'X', 'RS')
        sid = self.ok(s.creer_selection('R', 'E', [o1]))
        self.ok(s.creer_groupe('R', 'E', 'g'))
        self.ok(s.deleguer('R', ('groupe', 'g'), {'voir'}, ('selection', sid), mode='notification'))
        self.assertEqual(self.ok(s.ajouter_a_selection('R', sid, o2)), 'proposition')
        self.ok(s.activer_proposition('X', sid, o2))
        self.ok(s.ajouter_membre('ADM', 'g', 'B'))
        self.accorde('B', o1)
        self.absent('B', o2)

    def test_a13_2_revocation_par_l_auteur_sans_autorite(self):
        """a13-2 — § 13.3 (CT-10) : l'auteur d'une sélection partagée qui ne peut pas restreindre chacune des
        habilitations qui la visent ne la révoque pas, ni ne la réduit."""
        s = self.systeme('R', 'L', 'B')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'L', 'lecteur')
        sid = self.ok(s.creer_selection('L', 'E', [o]))
        self.ok(s.deleguer('R', ('acteur', 'B'), {'voir', 'editer'}, ('selection', sid)))
        self.refus(s.revoquer_selection('L', sid))
        self.refus(s.reduire_selection('L', sid, {o}))
        self.accorde('B', o, 'editer')
        self.ok(s.reduire_selection('R', sid, {o}))
        self.absent('B', o)


class ControleB(Commun):
    """Témoins des mutations N01 à N53 du contrôle B : chaque test construit l'état où la mutation change une
    observation, et en fixe l'attendu selon le texte V1.6."""

    def setUp(self):
        super().setUp()
        self.systeme('V1', 'V2', 'V3', 'A', 'B', 'X', 'Y', 'RG', 'INV', 'GA', Y_bis='Y', A_bis='A')
        self.projet()

    def test_N01_examen_hi_seulement(self):
        """N01 — § 7.5, T-07 : une HP ne se met pas en examen."""
        s = self.s
        self.ok(s.deleguer('RS', ('acteur', 'COL'), ['voir'], ('objet', self.o), repartager=True))
        hp = self.ok(s.deleguer('COL', ('acteur', 'V'), ['voir'], ('objet', self.o)))
        self.refus(s.mettre_en_examen('R0', hp))
        self.accorde('V', self.o)

    def test_N02_prolongation_hors_perimetre(self):
        """N02 — T-04, § 7.2 : un RS dont le périmètre ne couvre pas l'HI ne la prolonge pas."""
        s = self.s
        self.nomme('R0', 'P', 'RS1', 'RS', perimetre={self.o})
        R = self.ok(s.deleguer('RS', ('acteur', 'V'), ['voir'], ('contenu', 'P'), echeance=10))
        self.refus(s.prolonger('RS1', R, 20))
        s.avancer(12)
        self.absent('V', self.o)

    def test_N03_prolongation_g7(self):
        """N03 — § 2.5, T-04 : une prolongation exige l'exécution effective des actions sur les cibles connues."""
        s = self.s
        self.ok(s.deleguer('RS', ('acteur', 'A'), ['voir'], ('objet', self.o), repartager=True))
        hp = self.ok(s.deleguer('A', ('acteur', 'B'), ['voir'], ('objet', self.o), echeance=10))
        self.ok(s.creer_protection('RS', 'interdiction_action', self.o, destinataires={'A'}, actions={'voir'}))
        self.refus(s.prolonger('A', hp, 20))
        s.avancer(12)
        self.absent('B', self.o)

    def test_N04_confirmation_g7(self):
        """N04 — § 2.5, T-06 : une confirmation exige l'exécution effective."""
        s = self.s
        self.ok(s.deleguer('TIT', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True))
        h2 = self.ok(s.deleguer('TIT', ('acteur', 'V2'), ['voir'], ('objet', self.priv), repartager=True))
        h1 = next(h.id for h in s.habs.values() if h.beneficiaire == ('acteur', 'V1'))
        hp = self.ok(s.deleguer('V1', ('acteur', 'T'), ['voir'], ('objet', self.priv)))
        self.ok(s.creer_protection('TIT', 'interdiction_action', self.priv, destinataires={'V2'}, actions={'voir'}))
        self.refus(s.confirmer('V2', hp))
        self.ok(s.clore('TIT', h1))
        self.absent('T', self.priv)
        self.assertTrue(h2)

    def test_N06_admission_hp_sans_a1(self):
        """N06 — § 8.3, § 9.3 : admettre au titre d'une HP exige les conditions 1 et 2 du § 8.1."""
        s = self.s
        self.ok(s.creer_groupe('ADM', 'P', 'G'))
        self.ok(s.ajouter_membre('ADM', 'G', 'M'))
        h = self.ok(s.deleguer('TIT', ('groupe', 'G'), ['voir'], ('objet', self.priv)))
        self.ok(s.deleguer('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv)))
        self.refus(s.admettre('V', h, 'M'))
        self.absent('M', self.priv)

    def test_N07_retrait_d_admission_par_un_tiers(self):
        """N07 — § 8.3 (CM-19) : seul l'habilitant retire une admission."""
        s = self.s
        self.ok(s.creer_groupe('ADM', 'P', 'G'))
        self.ok(s.ajouter_membre('ADM', 'G', 'M'))
        h = self.ok(s.deleguer('TIT', ('groupe', 'G'), ['voir'], ('objet', self.priv)))
        self.ok(s.admettre('TIT', h, 'M'))
        self.ok(s.deleguer('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv)))
        self.refus(s.retirer_admission('V', h, 'M'))
        self.accorde('M', self.priv)

    def test_N08_exclusion_par_personne(self):
        """N08 — § 9.4 (H-5) : l'exclusion après retrait s'apprécie par personne."""
        s = self.s
        self.ok(s.creer_espace('RG', 'PRG'))
        self.ok(s.creer_groupe('RG', 'PRG', 'Coord'))
        h = self.ok(s.deleguer('RS', ('groupe', 'Coord'), ['voir'], ('objet', self.o), mode='notification'))
        self.ok(s.ajouter_membre('RG', 'Coord', 'Y'))
        self.ok(s.retirer_admission('RS', h, 'Y'))
        self.ok(s.ajouter_membre('RG', 'Coord', 'Y_bis'))
        self.absent('Y_bis', self.o)

    def test_N09_consecutivite_par_personne(self):
        """N09 — § 12.6 (H-5) : la consécutivité des dérogations s'apprécie par personne."""
        s = self.s
        codes = []
        for i, b in enumerate(['A', 'A', 'A', 'A_bis']):
            codes.append(s.accorder_derogation(('SUP1', 'SUP2'), b, [self.priv], ['voir'], 'enquête', f'j{i}', 10).code)
            s.avancer(10)
        self.assertEqual(codes, ['ok', 'ok', 'ok', 'refus'])

    def test_N10_echec_d_evaluation_et_gardien(self):
        """N10 — A6, § 11.2 : un échec d'évaluation ne retire jamais un gardien."""
        s = self.s
        noms = [f'U{i}' for i in range(modele.PROFONDEUR_MAX + 4)]
        self.systeme(*noms)
        borne = modele.PROFONDEUR_MAX
        modele.PROFONDEUR_MAX = 10 * borne
        try:
            prec = 'TIT'
            for n in noms:
                self.ok(s.deleguer(prec, ('acteur', n), ['voir'], ('objet', self.priv), repartager=True))
                prec = n
            p = self.ok(s.creer_protection('TIT', 'embargo_contenu', self.priv))
            self.ok(s.designer_gardien('TIT', p, noms[-1]))
        finally:
            modele.PROFONDEUR_MAX = borne
        s.avancer(0)
        self.ok(s.designer_gardien(noms[-1], p, 'U0'))

    def test_N12_copie_herite_des_destinataires(self):
        """N12 — § 13.11 (G-6, H-3b) : une copie hérite des destinataires de l'interdiction ; une dérogation sans
        l'accord d'un gardien ne la franchit pas."""
        s = self.s
        self.ok(s.creer_espace('X', 'Q'))
        self.nomme('X', 'Q', 'A', 'collaborateur')
        self.ok(s.deleguer('RS', ('acteur', 'A'), ['voir', 'reutiliser'], ('objet', self.o)))
        self.ok(s.creer_protection('RS', 'interdiction_existence', self.o, destinataires={'B'}))
        cid = self.ok(s.reutiliser('A', self.o, 'Q'))
        self.refus(s.accorder_derogation(('SUP1', 'SUP2'), 'B', [cid], ['voir'], 'enquête', 'j', 3))
        self.absent('B', cid, finalite='enquête')

    def test_N13_non_levable_d_un_ascendant_de_second_rang(self):
        """N13 — § 13.11 (H-3b), § 2.3 : les non-levables d'un ascendant quelconque s'appliquent à la copie."""
        s = self.s
        self.ok(s.creer_espace('X', 'Q'))
        self.nomme('X', 'Q', 'A', 'collaborateur')
        self.nomme('X', 'Q', 'B', 'collaborateur')
        self.ok(s.deleguer('RS', ('acteur', 'A'), ['voir', 'reutiliser'], ('objet', self.o)))
        c1 = self.ok(s.reutiliser('A', self.o, 'Q'))
        self.ok(s.deleguer('A', ('acteur', 'B'), ['voir', 'reutiliser'], ('objet', c1)))
        c2 = self.ok(s.reutiliser('B', c1, 'Q'))
        s.objets[self.o].consentement_retire = True            # fait externe (consentement retiré)
        self.refuse('B', c2)

    def test_N14_metadonnees_reservees(self):
        """N14 — § 10.3, A2 : les métadonnées de gouvernance ne sont lues que par les administrateurs et les RS."""
        s = self.s
        self.ok(s.deleguer('RS', ('acteur', 'V'), ['voir'], ('objet', self.o)))
        self.refus(s.lister_habilitations('LEC', 'P'))
        self.refus(s.journaux('COL', 'P'))

    def test_N15_journaux_hp_objet_personnel(self):
        """N15 — § 10.3 : les HP sur un objet personnel ne figurent pas dans les journaux, sauf pour le titulaire."""
        s = self.s
        self.ok(s.deleguer('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv)))
        self.assertFalse(any(self.priv in l[3] for l in self.ok(s.journaux('ADM', 'P'))['lignes']))

    def test_N16_explication_objet_personnel(self):
        """N16 — § 10.3 (OB-24) : jamais d'explication des accès à l'objet personnel d'autrui."""
        s = self.s
        self.ok(s.deleguer('TIT', ('acteur', 'V'), ['voir'], ('objet', self.priv)))
        self.assertEqual(s.expliquer_acces('ADM', 'V', self.priv).code, 'introuvable')
        self.assertEqual(s.expliquer_acces('R0', 'V', self.priv).code, 'introuvable')

    def test_N17_presentation_lisible_par_k_seul(self):
        """N17 — § 10.6 : la présentation n'est lisible que par le cessionnaire."""
        s = self.s
        self.ok(s.creer_espace('C', 'ESP'))
        self.ok(s.creer_objet('C', 'ESP'))
        tid = self.ok(s.preparer_transfert('C', 'ESP', 'K'))
        self.ok(s.presenter('C', tid))
        self.assertEqual(s.vue_transfert('V', tid).code, 'introuvable')

    def test_N18_revocation_de_derogation(self):
        """N18 — § 12.5 : seul un membre de l'autorité de dérogation révoque une dérogation."""
        s = self.s
        d = self.ok(s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.priv], ['voir'], 'enquête', 'j', 5))
        self.refus(s.revoquer_derogation('V', d))
        self.accorde('A', self.priv, finalite='enquête')

    def test_N19_contestation_reservee(self):
        """N19 — § 11.6 : seul le titulaire (ou un RS pour le contenu) conteste une restriction légale."""
        s = self.s
        p = self.ok(s.creer_restriction_legale(('SUP1', 'SUP2'), self.priv, autorite_levee='AUT'))
        self.refus(s.contester('V', p))
        self.refus(s.examiner_contestation(('SUP3', 'SUP4'), p, 'annulation'))
        self.refuse('TIT', self.priv)

    def test_N20_examen_par_deux_independants(self):
        """N20 — § 11.6, § 12.7 : une contestation est examinée par deux approbateurs indépendants."""
        s = self.s
        p = self.ok(s.creer_restriction_legale(('SUP1', 'SUP2'), self.priv, autorite_levee='AUT'))
        self.ok(s.contester('TIT', p))
        self.refus(s.examiner_contestation(('SUP3',), p, 'annulation'))
        self.refuse('TIT', self.priv)

    def test_N21_consentement_par_le_proprietaire(self):
        """N21 — § 10.1, § 10.8 : seul le propriétaire consent à la réintégration du cédant."""
        s = self.s
        self.ok(s.creer_espace('C', 'ESP'))
        self.nomme('C', 'ESP', 'RS2', 'RS')
        ot = self.ok(s.creer_objet('C', 'ESP'))
        tid = self.ok(s.preparer_transfert('C', 'ESP', 'K'))
        self.ok(s.accepter_transfert('K', tid, self.ok(s.presenter('C', tid))))
        self.refus(s.consentir_reintegration('RS2', 'ESP', 'C', 'HI'))
        self.refus(s.deleguer('RS2', ('acteur', 'C'), ['voir'], ('objet', ot)))
        self.absent('C', ot)

    def test_N22_protection_hors_perimetre(self):
        """N22 — § 11.1 : un RS ne pose une protection que dans son périmètre."""
        s = self.s
        o2 = self.ok(s.creer_objet('RS', 'P', titre='o2'))
        self.nomme('R0', 'P', 'RS1', 'RS', perimetre={self.o})
        self.ok(s.deleguer('RS', ('acteur', 'RS1'), ['voir'], ('objet', o2)))
        self.refus(s.creer_protection('RS1', 'interdiction_existence', o2, destinataires={'RS2'}))
        self.accorde('RS2', o2)

    def test_N23_base_projet(self):
        """N23 — § 13.7 : une base de portée projet exige une action d'écriture sur l'assertion."""
        s = self.s
        self.nomme('RS', 'P', 'INV', 'invite')
        self.ok(s.deleguer('RS', ('acteur', 'INV'), ['voir'], ('objet', self.o)))
        self.refus(s.creer_base('INV', self.o, 'projet'))

    def test_N24_insertion_reservee(self):
        """N24 — § 13.6 : insérer exige d'être RS ou administrateur de l'espace de la publication."""
        s = self.s
        sr = self.ok(s.creer_serie('ADM', 'P'))
        self.refus(s.inserer_serie('COL', sr, self.o, 1))
        self.assertEqual(self.ok(s.lire_serie('RS', sr)), {})

    def test_N32_levee_legale_pendant_la_fenetre(self):
        """N32 — § 10.6 (H-4a) : la levée d'une restriction légale n'est jamais gelée ; elle élargit un engagement
        présenté, et l'acceptation est refusée pour présentation renouvelée."""
        s = self.s
        self.ok(s.creer_espace('C', 'ESP'))
        ot = self.ok(s.creer_objet('C', 'ESP'))
        p = self.ok(s.creer_restriction_legale(('SUP1', 'SUP2'), ot, autorite_levee='AUT'))
        tid = self.ok(s.preparer_transfert('C', 'ESP', 'K'))
        emp = self.ok(s.presenter('C', tid))
        self.ok(s.lever_restriction_legale('AUT', p))
        self.assertEqual(s.accepter_transfert('K', tid, emp).code, 'renouvelee')

    def test_N40_cycle_a_toute_profondeur(self):
        """N40 — § 8.2 : une HP au profit d'une personne en amont de la chaîne, à quelque profondeur que ce soit,
        est refusée."""
        s = self.s
        h1 = self.ok(s.deleguer('TIT', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True))
        self.ok(s.deleguer('V1', ('acteur', 'V2'), ['voir'], ('objet', self.priv), repartager=True))
        self.ok(s.deleguer('V2', ('acteur', 'V3'), ['voir'], ('objet', self.priv), repartager=True))
        self.refus(s.deleguer('V3', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True))
        self.ok(s.clore('TIT', h1))
        self.absent('V1', self.priv)
        self.absent('V3', self.priv)

    def test_N50_cache_et_echeance(self):
        """N50 — § 13.10 (CP-40) : une décision en cache n'est jamais servie au-delà de l'échéance."""
        s = self.s
        self.ok(s.deleguer('RS', ('acteur', 'M'), ['voir'], ('objet', self.o), echeance=5))
        self.assertTrue(s.acces_en_ligne('M', self.o, 'voir').ok)
        s.avancer(6)
        self.assertEqual(s.acces_en_ligne('M', self.o, 'voir').code, 'introuvable')

    def test_N53_orpheline_infranchissable(self):
        """N53 — § 12.3 : aucune dérogation ne franchit une protection orpheline."""
        s = self.s
        h = self.nomme('R0', 'P', 'RS1', 'RS')
        self.ok(s.creer_protection('RS1', 'embargo_existence', self.o))
        self.ok(s.clore('R0', h))
        self.refus(s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.o], ['voir'], 'enquête', 'j', 3))
        self.absent('A', self.o, finalite='enquête')
        o2 = self.ok(s.creer_objet('RS', 'P'))                    # restriction interne orpheline
        h2 = self.nomme('R0', 'P', 'RS3', 'RS')
        self.ok(s.creer_protection('RS3', 'embargo_contenu', o2))
        self.ok(s.clore('R0', h2))
        self.refus(s.accorder_derogation(('SUP1', 'SUP2'), 'A', [o2], ['voir'], 'enquête', 'j2', 3))

    # ------------------------------------------------------------ sondes des justifications
    def test_M010_admission_differee(self):
        """M010 (sonde du contrôle B) — § 9.4, § 10.6 (H-6a) : une admission automatique différée par la fenêtre
        de transfert est réévaluée à son traitement : le membre devenu gestionnaire pendant la fenêtre n'est pas
        admis ; l'autre l'est."""
        s = self.s
        self.ok(s.creer_espace('GA', 'GS'))
        self.ok(s.creer_groupe('GA', 'GS', 'g2'))
        self.ok(s.deleguer('RS', ('groupe', 'g2'), ['voir', 'editer'], ('objet', self.o), mode='notification'))
        tid = self.ok(s.preparer_transfert('R0', 'P', 'K'))
        self.ok(s.presenter('R0', tid))
        self.ok(s.ajouter_membre('GA', 'g2', 'X'))
        self.ok(s.ajouter_membre('GA', 'g2', 'Y'))
        self.ok(s.nommer_administrateur('GA', 'GS', 'X'))
        self.ok(s.accepter_transfert('K', tid, s.vue_transfert('K', tid).valeur['empreinte']))
        self.accorde('Y', self.o, 'editer')
        self.absent('X', self.o, 'editer')

    def test_M013_signataire_jamais_beneficiaire(self):
        """M013 (sonde du contrôle B) — § 9.4 (G-2), § 2.1 : le signataire n'est jamais admis à sa propre HI au
        profit d'un rôle de son espace, même après sa révocation et sa nomination dans ce rôle."""
        s = self.s
        h = self.nomme('R0', 'P', 'X', 'RS')
        hi = self.ok(s.deleguer('X', ('role', 'P', 'collaborateur'), ['exporter'], ('contenu', 'P'),
                                mode='notification'))
        self.ok(s.clore('R0', h))
        self.nomme('R0', 'P', 'X', 'collaborateur')
        self.refuse('X', self.o, 'exporter')
        self.refus(s.admettre('RS', hi, 'X'))
        self.refuse('X', self.o, 'exporter')

    def test_M104_second_passage_orphelin(self):
        """M104 (sonde du contrôle B) — § 11.2 (G-10, F-03) : chaque passage à l'état orphelin est signalé ; la
        désignation d'office n'est saisie que par le signalement du passage en cours."""
        s = self.s
        h1 = self.nomme('R0', 'P', 'RS1', 'RS')
        p = self.ok(s.creer_protection('RS1', 'embargo_existence', self.o))
        self.ok(s.clore('R0', h1))
        self.assertEqual(s.notifications.get('SUP1', []).count(('protection_orpheline', p)), 1)
        self.ok(s.designer_gardien_orphelin(('SUP1', 'SUP2'), p, 'RS2'))
        self.ok(s.clore('R0', self.h_RS2))
        self.assertEqual(s.notifications.get('SUP1', []).count(('protection_orpheline', p)), 2)
        self.ok(s.designer_gardien_orphelin(('SUP3', 'SUP4'), p, 'RS'))


if __name__ == '__main__':
    unittest.main()
