"""Non-régression des attaques reproductibles du contrôle en aveugle A (V1.4) : 20 attaques, 39 tests.

Chaque test rejoue une attaque. L'attendu est déduit du texte du contrat V1.6,
cité en docstring, et n'appelle aucune fonction interne du modèle : seules les
opérations publiques et leurs réponses sont observées.
"""
import unittest

from base import Base
from outils import retirer_objet


class Attaques(Base):

    def systeme(self, *acteurs):
        for a in acteurs:
            if a not in self.s.acteurs:
                self.s.ajouter_acteur(a)
        return self.s

    def test_a01_elevation_croisee(self):
        """a01 — A3, § 9.4, I-3 : deux gestionnaires de groupes d'espaces différents s'ajoutent l'un l'autre ;
        aucun n'est admis automatiquement."""
        s = self.systeme('R', 'A1', 'A2')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.ok(s.creer_espace('A1', 'G1'))
        self.ok(s.creer_groupe('A1', 'G1', 'g1'))
        self.ok(s.creer_espace('A2', 'G2'))
        self.ok(s.creer_groupe('A2', 'G2', 'g2'))
        self.ok(s.deleguer('R', ('groupe', 'g1'), {'voir'}, ('contenu', 'E'), mode='notification'))
        self.ok(s.deleguer('R', ('groupe', 'g2'), {'voir'}, ('contenu', 'E'), mode='notification'))
        self.ok(s.ajouter_membre('A1', 'g1', 'A2'))
        self.ok(s.ajouter_membre('A2', 'g2', 'A1'))
        self.absent('A1', o)
        self.absent('A2', o)

    def test_a01b_roles_croises(self):
        """a01 (variante) — deux RS de deux espaces se nomment lecteurs l'un chez l'autre."""
        s = self.systeme('R', 'F1R', 'F2R')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.ok(s.creer_espace('F1R', 'F1'))
        self.ok(s.creer_espace('F2R', 'F2'))
        self.ok(s.deleguer('R', ('role', 'F1', 'lecteur'), {'voir'}, ('contenu', 'E'), mode='notification'))
        self.ok(s.deleguer('R', ('role', 'F2', 'lecteur'), {'voir'}, ('contenu', 'E'), mode='notification'))
        self.ok(s.nommer('F1R', 'F1', 'F2R', 'lecteur'))
        self.ok(s.nommer('F2R', 'F2', 'F1R', 'lecteur'))
        self.absent('F1R', o)
        self.absent('F2R', o)

    def test_a02_blocage_par_restriction(self):
        """a02 — § 10.6 (G-3), § 8.3 : le bénéficiaire ne restreint pas sa propre nomination ; un retrait ne bloque
        pas l'acceptation."""
        s = self.systeme('C', 'K', 'L')
        self.ok(s.creer_espace('C', 'E'))
        hL = self.nomme('C', 'E', 'L', 'lecteur')
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        emp = self.ok(s.presenter('C', t))
        self.refus(s.restreindre('L', hL, echeance=10_000))
        self.ok(s.restreindre('C', hL, echeance=10_000))          # un retrait par un habilitant
        self.ok(s.accepter_transfert('K', t, emp))

    def test_a03_selection_elargie_par_son_auteur(self):
        """a03 — § 13.3 (G-4), A1, I-2 : un ajout à une sélection partagée est une proposition ; une HI ne sert
        jamais un objet hors du périmètre du signataire."""
        s = self.systeme('R', 'X', 'B')
        self.ok(s.creer_espace('R', 'E'))
        o1 = self.ok(s.creer_objet('R', 'E'))
        o2 = self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'X', 'RS', perimetre=[o1])
        self.nomme('R', 'E', 'B', 'lecteur')
        sid = self.ok(s.creer_selection('B', 'E', [o1]))
        self.ok(s.deleguer('X', ('acteur', 'B'), {'voir', 'editer'}, ('selection', sid)))
        self.assertEqual(self.ok(s.ajouter_a_selection('B', sid, o2)), 'proposition')
        self.refuse('B', o2, 'editer')
        self.refus(s.activer_proposition('X', sid, o2))
        self.ok(s.activer_proposition('R', sid, o2))
        self.refuse('B', o2, 'editer')

    def test_a04_nommer_sonde_d_existence(self):
        """a04 — § 15 (CM-04) : nommer sur une cible cachée ou inexistante produit la même réponse."""
        codes = []
        for exister in (True, False):
            self.setUp()
            s = self.systeme('R', 'X', 'N')
            self.ok(s.creer_espace('R', 'E'))
            self.nomme('R', 'E', 'X', 'RS')
            o = self.ok(s.creer_objet('R', 'E'))
            if exister:
                self.ok(s.creer_protection('R', 'interdiction_existence', o, destinataires=['X']))
            else:
                retirer_objet(s, o)
            codes.append(s.nommer('X', 'E', 'N', 'lecteur', perimetre=[o]))
        self.assertEqual(codes[0], codes[1])
        self.assertEqual(codes[0].code, 'introuvable')

    def test_a05_serie_sonde_d_existence(self):
        """a05 — § 13.6, § 15 (CM-05) : insérer une publication cachée ou inexistante produit la même réponse."""
        reponses = []
        for exister in (True, False):
            self.setUp()
            s = self.systeme('R', 'ADM')
            self.ok(s.creer_espace('R', 'E'))
            self.ok(s.nommer_administrateur('R', 'E', 'ADM'))
            sr = self.ok(s.creer_serie('ADM', 'E'))
            o = self.ok(s.creer_objet('R', 'E'))
            self.ok(s.creer_protection('R', 'embargo_existence', o))
            if not exister:
                retirer_objet(s, o)
            reponses.append(s.inserer_serie('ADM', sr, o, 1))
        self.assertEqual(reponses[0], reponses[1])
        self.assertFalse(reponses[0].ok)

    def test_a06_reprise_elargie(self):
        """a06 — § 6.3 (CM-06) : une reprise au versement est à l'identique ou plus étroite, et signée par un RS
        dont le périmètre couvre l'objet."""
        s = self.systeme('R', 'T', 'X', 'Y')
        self.ok(s.creer_espace('R', 'E'))
        self.nomme('R', 'E', 'T', 'collaborateur')
        o9 = self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'X', 'RS', perimetre=[o9])
        p = self.ok(s.creer_objet('T', 'E', personnel=True))
        h = self.ok(s.deleguer('T', ('acteur', 'Y'), {'voir', 'editer'}, ('objet', p), echeance=10))
        self.refus(s.verser('T', p, 'X', reprises={h: {}}))                # X ne couvre pas p
        self.refus(s.verser('T', p, 'R', reprises={h: {'echeance': None}}))  # élargie
        self.ok(s.verser('T', p, 'R', reprises={h: {'echeance': 8}}))
        s.avancer(9)
        self.absent('Y', p, 'editer')

    def test_a06b_reprise_au_profit_du_rs(self):
        """a06 — A3 : le RS qui accepte le versement ne reprend pas une HP dont il est bénéficiaire."""
        s = self.systeme('R', 'T')
        self.ok(s.creer_espace('R', 'E'))
        self.nomme('R', 'E', 'T', 'collaborateur')
        p = self.ok(s.creer_objet('T', 'E', personnel=True))
        h = self.ok(s.deleguer('T', ('acteur', 'R'), {'voir'}, ('objet', p), echeance=10))
        self.refus(s.verser('T', p, 'R', reprises={h: {}}))

    def test_a07_perimetre_mixte(self):
        """a07 — § 1, § 8.1 (G-5) : une délégation ne mêle pas des cibles de deux régimes."""
        s = self.systeme('C', 'Y', 'Z')
        self.ok(s.creer_espace('C', 'E'))
        o = self.ok(s.creer_objet('C', 'E'))
        self.ok(s.creer_espace('Y', 'F'))
        f = self.ok(s.creer_objet('Y', 'F'))
        self.nomme('C', 'E', 'Y', 'RS')
        self.refus(s.deleguer('Y', ('acteur', 'Z'), {'voir'}, ('objets', [o, f])))
        pf = self.ok(s.creer_objet('Y', 'F', personnel=True))
        self.refus(s.deleguer('Y', ('acteur', 'Z'), {'voir'}, ('objets', [f, pf])))

    def test_a08_succession_sans_versement(self):
        """a08 — § 10.4, § 12.7 (G-9) : un administrateur de l'espace n'approuve pas la succession ; les objets
        personnels du défunt ne sont jamais versés implicitement."""
        s = self.systeme('C', 'H', 'RS')
        self.ok(s.creer_espace('C', 'E', designation_garde='H'))
        self.nomme('C', 'E', 'RS', 'RS')
        self.ok(s.nommer_administrateur('C', 'E', 'SUP1'))
        p = self.ok(s.creer_objet('C', 'E', personnel=True))
        s.acteurs['C'].actif = False
        self.refus(s.ouvrir_succession(['SUP1', 'SUP2'], 'E'))
        t = self.ok(s.ouvrir_succession(['SUP2', 'SUP3'], 'E'))
        emp = s.vue_transfert('H', t).valeur['empreinte']
        self.ok(s.accepter_transfert('H', t, emp))
        self.absent('RS', p)
        self.assertEqual(s.objets[p].titulaire, 'C')

    def test_a09_presentation_expiree(self):
        """a09 — § 5.6 (CT-16) : une présentation expirée n'est pas relancée par le cessionnaire."""
        s = self.systeme('C', 'K')
        self.ok(s.creer_espace('C', 'E'))
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        emp = self.ok(s.presenter('C', t))
        s.avancer(100)
        self.assertEqual(s.accepter_transfert('K', t, emp).code, 'expiree')
        self.assertFalse(s.accepter_transfert('K', t, emp).ok)
        self.assertEqual(s.espaces['E'].proprietaire, 'C')

    def test_a10_examen_ne_detruit_pas(self):
        """a10 — § 7.5, § 5.3 (G-8) : la mise en examen rend l'aval inopérant sans le détruire ; la suspension
        d'une appartenance n'est pas une sortie."""
        s = self.systeme('R', 'A', 'B', 'FR', 'L')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        hi = self.ok(s.deleguer('R', ('acteur', 'A'), {'voir'}, ('contenu', 'E'), repartager=True))
        self.ok(s.deleguer('A', ('acteur', 'B'), {'voir'}, ('objet', o)))
        self.ok(s.mettre_en_examen('R', hi))
        self.absent('B', o)
        self.ok(s.lever_examen('R', hi))
        self.accorde('B', o)
        self.ok(s.creer_espace('FR', 'F'))
        hL = self.nomme('FR', 'F', 'L', 'lecteur')
        self.ok(s.deleguer('R', ('role', 'F', 'lecteur'), {'voir'}, ('contenu', 'E'), mode='notification'))
        self.accorde('L', o)
        self.ok(s.mettre_en_examen('FR', hL))
        self.ok(s.lever_examen('FR', hL))
        self.accorde('L', o)

    def test_a11_admission_par_fondateur_rompu(self):
        """a11 — § 5.3 (CM-10) : l'admission prononcée par un acteur dont la chaîne est rompue est close, qu'il soit
        ou non fondateur."""
        s = self.systeme('T', 'A', 'M')
        self.ok(s.creer_espace('T', 'E'))
        self.ok(s.creer_groupe('T', 'E', 'g'))
        p = self.ok(s.creer_objet('T', 'E', personnel=True))
        h1 = self.ok(s.deleguer('T', ('acteur', 'A'), {'voir'}, ('objet', p), repartager=True))
        h = self.ok(s.deleguer('A', ('groupe', 'g'), {'voir'}, ('objet', p)))
        self.ok(s.confirmer('T', h))
        self.ok(s.ajouter_membre('T', 'g', 'M'))
        self.ok(s.admettre('A', h, 'M'))
        self.accorde('M', p)
        self.ok(s.clore('T', h1))
        self.absent('M', p)

    def test_a12_admission_automatique_espace_clos(self):
        """a12 — § 5.1 (CT-18) : aucune admission automatique dans un espace clos."""
        s = self.systeme('R', 'GA', 'M')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.ok(s.creer_espace('GA', 'G'))
        self.ok(s.creer_groupe('GA', 'G', 'g'))
        h = self.ok(s.deleguer('R', ('groupe', 'g'), {'voir'}, ('contenu', 'E'), mode='notification'))
        self.ok(s.clore_espace('R', 'E'))
        self.ok(s.ajouter_membre('GA', 'g', 'M'))
        self.absent('M', o)
        self.refus(s.admettre('R', h, 'M'))

    def test_a13_rs_perpetue(self):
        """a13 — A3, § 9.4 (G-2) : le signataire n'est jamais admis à sa propre habilitation ; révoqué, il ne garde
        rien."""
        s = self.systeme('R', 'X', 'Z')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        hX = self.nomme('R', 'E', 'X', 'RS')
        self.ok(s.creer_espace('Z', 'G'))
        self.ok(s.creer_groupe('Z', 'G', 'g'))
        self.ok(s.ajouter_membre('Z', 'g', 'X'))
        self.ok(s.deleguer('X', ('groupe', 'g'), {'voir', 'editer', 'exporter'}, ('contenu', 'E'),
                           mode='notification'))
        self.ok(s.clore('R', hX))
        self.absent('X', o, 'editer')
        self.absent('X', o, 'exporter')

    def test_a14_interdiction_contournee(self):
        """a14 — § 2.5, § 8.1 (G-7) : une interdiction effective empêche de déléguer l'action interdite."""
        s = self.systeme('R', 'A', 'B')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.ok(s.deleguer('R', ('acteur', 'A'), {'voir', 'editer'}, ('contenu', 'E'), repartager=True))
        self.ok(s.creer_protection('R', 'interdiction_action', o, destinataires=['A'], actions=['editer']))
        self.refuse('A', o, 'editer')
        self.refus(s.deleguer('A', ('acteur', 'B'), {'voir', 'editer'}, ('objet', o)))
        self.absent('B', o, 'editer')

    def test_a15_copie_blanchit(self):
        """a15 — § 13.11 (G-6) : la copie hérite des protections et des restrictions non levables de l'original."""
        s = self.systeme('R', 'A', 'X')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E', titre='secret'))
        self.nomme('R', 'E', 'A', 'collaborateur')
        self.ok(s.deleguer('R', ('acteur', 'A'), {'voir', 'reutiliser'}, ('objet', o)))
        self.ok(s.creer_protection('R', 'embargo_existence', o, beneficiaires=[('acteur', 'A')]))
        c = self.ok(s.reutiliser('A', o, 'E'))
        self.refus(s.deleguer('A', ('acteur', 'X'), {'voir'}, ('objet', c)))
        self.absent('X', c)
        self.accorde('A', c)
        s.objets[o].consentement_retire = True
        self.assertFalse(s.acces('A', c, 'voir').ok)

    def test_a16_derogation_par_second_compte(self):
        """a16 — § 12.4, § 12.7 (G-1) : un membre de l'autorité ne s'accorde pas une dérogation par un second
        compte."""
        s = self.s
        o = self.ok(s.creer_espace('R0', 'E')) and self.ok(s.creer_objet('R0', 'E'))
        self.refus(s.accorder_derogation(['SUP1'], 'SUP1b', [o], ['voir'], 'diagnostic technique', 'j', 5))
        self.absent('SUP1b', o, finalite='diagnostic technique')

    def test_a17_1_restriction_externe(self):
        """a17-1 — § 11.6 (CT-23) : une restriction externe est levée par son autorité émettrice."""
        s = self.s
        self.ok(s.creer_espace('R0', 'E'))
        o = self.ok(s.creer_objet('R0', 'E'))
        pid = self.ok(s.enregistrer_restriction_externe('AUT', o))
        self.refus(s.lever_restriction_legale('SUP1', pid))
        self.ok(s.lever_restriction_legale('AUT', pid))

    def test_a17_2_gardien_orphelin_pendant_le_gel(self):
        """a17-2 — § 10.6 (H-4a) : pendant la fenêtre, la désignation d'un gardien, y compris par l'autorité de
        dérogation, est gelée quel qu'en soit l'effet (gel par liste d'opérations). Après l'annulation, C est
        désignable ; K, sans droit de contenu, ne l'est pas (§ 11.2)."""
        s = self.systeme('C', 'K', 'X')
        self.ok(s.creer_espace('C', 'E'))
        o = self.ok(s.creer_objet('C', 'E'))
        self.nomme('C', 'E', 'X', 'RS')
        self.ok(s.deleguer('C', ('acteur', 'V'), {'voir'}, ('objet', o)))
        p = self.ok(s.creer_protection('X', 'embargo_existence', o))
        self.ok(s.quitter('X', 'E'))
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        self.ok(s.presenter('C', t))
        self.assertEqual(s.designer_gardien_orphelin(['SUP1', 'SUP2'], p, 'K', None).code, 'gel')
        self.assertEqual(s.designer_gardien_orphelin(['SUP3', 'SUP4'], p, 'C', None).code, 'gel')
        self.ok(s.annuler_transfert('C', t))
        self.assertEqual(s.designer_gardien_orphelin(['SUP1', 'SUP2'], p, 'K', None).code, 'refus')
        self.assertEqual(s.designer_gardien_orphelin(['SUP3', 'SUP4'], p, 'C', None).code, 'ok')

    def test_a17_3_lever_examen_cible_cachee(self):
        """a17-3 — § 7.4, § 15 (C-19) : la racine n'agit pas sur une HI dont la cible lui est cachée."""
        s = self.systeme('R', 'X', 'B')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'X', 'RS')
        h = self.ok(s.deleguer('R', ('acteur', 'B'), {'voir'}, ('objet', o)))
        self.ok(s.mettre_en_examen('R', h))
        self.ok(s.creer_protection('X', 'interdiction_existence', o, destinataires=['R']))
        self.assertEqual(s.lever_examen('R', h), s.lever_examen('R', 'h-inexistante'))
        self.assertEqual(s.habs[h].etat, 'suspendue')

    def test_a17_4_public_en_ecriture(self):
        """a17-4 — § 13.1 (CT-21) : le public ne reçoit que voir, exporter ou réutiliser."""
        s = self.s
        self.ok(s.creer_espace('R0', 'E'))
        o = self.ok(s.creer_objet('R0', 'E', diffusable=True))
        self.refus(s.deleguer('R0', ('public',), {'voir', 'editer'}, ('objet', o)))
        self.ok(s.deleguer('R0', ('public',), {'voir'}, ('objet', o)))
        self.refuse('Z', o, 'editer')

    def test_a17_5_second_compte_dans_le_groupe(self):
        """a17-5 — A3, § 9.4 (G-1) : un administrateur n'ajoute pas son second compte à un groupe."""
        s = self.s
        s.ajouter_acteur('ADM_bis', personne='ADM')
        self.ok(s.creer_espace('R0', 'E'))
        o = self.ok(s.creer_objet('R0', 'E'))
        self.ok(s.nommer_administrateur('R0', 'E', 'ADM'))
        self.ok(s.creer_groupe('ADM', 'E', 'g'))
        self.ok(s.deleguer('R0', ('groupe', 'g'), {'voir'}, ('contenu', 'E'), mode='notification'))
        self.refus(s.ajouter_membre('ADM', 'g', 'ADM_bis'))
        self.absent('ADM_bis', o)

    def test_a17_6_nommer_son_second_compte(self):
        """a17-6 — A3 (G-1) : nommer RS son second compte est refusé."""
        s = self.s
        s.ajouter_acteur('R0_bis', personne='R0')
        self.ok(s.creer_espace('R0', 'E'))
        self.refus(s.nommer('R0', 'E', 'R0_bis', 'RS'))
        self.refus(s.nommer_administrateur('R0', 'E', 'R0_bis'))

    def test_a18_1_reemission_cachee_invalide(self):
        """a18-1 — § 10.5 (CT-09), I-5 : une réémission invalide est abandonnée ; l'acceptation a la même issue
        avec ou sans l'objet caché à K."""
        issues = []
        for avec in (True, False):
            self.setUp()
            s = self.systeme('C', 'K', 'Y')
            self.ok(s.creer_espace('C', 'E'))
            if avec:
                p = self.ok(s.creer_objet('C', 'E', personnel=True))
                self.ok(s.creer_protection('C', 'interdiction_existence', p, destinataires=['K']))
                h = self.ok(s.deleguer('C', ('acteur', 'Y'), {'voir'}, ('objet', p), echeance=5))
            t = self.ok(s.preparer_transfert('C', 'E', 'K'))
            if avec:
                self.ok(s.choisir_voie('C', t, p, 'a'))
                self.ok(s.annoncer_reemission('C', t, h))
            emp = self.ok(s.presenter('C', t))
            vue = s.vue_transfert('K', t).valeur
            s.avancer(6)
            issues.append((vue['total_engagements'], vue['engagements'], s.accepter_transfert('K', t, emp)))
        self.assertEqual(issues[0], issues[1])
        self.assertTrue(issues[0][2].ok)

    def test_a18_2_beneficiaire_clot(self):
        """a18-2 — § 8.3 (CT-15), § 10.5 : le bénéficiaire clôt l'HP ; la réémission est abandonnée ; le transfert
        n'est pas bloqué."""
        s = self.systeme('C', 'K', 'Y')
        self.ok(s.creer_espace('C', 'E'))
        p = self.ok(s.creer_objet('C', 'E', personnel=True))
        h = self.ok(s.deleguer('C', ('acteur', 'Y'), {'voir'}, ('objet', p)))
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        self.ok(s.choisir_voie('C', t, p, 'b'))
        self.ok(s.annoncer_reemission('C', t, h))
        emp = self.ok(s.presenter('C', t))
        self.ok(s.accepter_objet('K', t, p))
        self.ok(s.clore('Y', h))
        self.ok(s.accepter_transfert('K', t, emp))
        self.absent('Y', p)

    def test_a18_3_admissions_arbitraires(self):
        """a18-3 — § 10.5 (CM-14) : seules les admissions actives de l'HP d'origine peuvent être annoncées."""
        s = self.systeme('C', 'K', 'Z')
        self.ok(s.creer_espace('C', 'E'))
        self.ok(s.creer_groupe('C', 'E', 'g'))
        self.ok(s.ajouter_membre('C', 'g', 'Z'))
        p = self.ok(s.creer_objet('C', 'E', personnel=True))
        h = self.ok(s.deleguer('C', ('groupe', 'g'), {'voir'}, ('objet', p)))
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        self.ok(s.choisir_voie('C', t, p, 'b'))
        self.refus(s.annoncer_reemission('C', t, h, admissions=['Z']))

    def test_a18_4_versement_pendant_le_gel(self):
        """a18-4 — § 10.6 (CT-17) : un versement avec reprise élargit les engagements et est gelé ; une HP d'un
        titulaire tiers sur son objet personnel ne l'est pas."""
        s = self.systeme('C', 'K', 'T', 'RS', 'Y')
        self.ok(s.creer_espace('C', 'E'))
        self.nomme('C', 'E', 'T', 'collaborateur')
        self.nomme('C', 'E', 'RS', 'RS')
        q = self.ok(s.creer_objet('T', 'E', personnel=True))
        hq = self.ok(s.deleguer('T', ('acteur', 'Y'), {'voir'}, ('objet', q)))
        t = self.ok(s.preparer_transfert('C', 'E', 'K'))
        emp = self.ok(s.presenter('C', t))
        self.ok(s.deleguer('T', ('acteur', 'K'), {'voir'}, ('objet', q)))
        self.assertEqual(s.verser('T', q, 'RS', reprises={hq: {}}).code, 'gel')
        self.ok(s.accepter_transfert('K', t, emp))

    def test_a19_1_hp_titulaire_espace_archive(self):
        """a19-1 — § 5.1 : le titulaire partage son objet personnel dans un espace archivé."""
        s = self.systeme('R', 'T', 'Y')
        self.ok(s.creer_espace('R', 'E'))
        self.nomme('R', 'E', 'T', 'collaborateur')
        p = self.ok(s.creer_objet('T', 'E', personnel=True))
        self.ok(s.archiver('R', 'E'))
        self.ok(s.deleguer('T', ('acteur', 'Y'), {'voir'}, ('objet', p)))

    def test_a19_2_connaitre_par_un_autre_droit(self):
        """a19-2 — § 14 (CM-21) : un acteur qui ne détient que `commenter` connaît l'existence : « refus »."""
        s = self.systeme('T', 'Y')
        self.ok(s.creer_espace('T', 'E'))
        p = self.ok(s.creer_objet('T', 'E', personnel=True))
        self.ok(s.deleguer('T', ('acteur', 'Y'), {'commenter'}, ('objet', p)))
        self.refuse('Y', p, 'voir')

    def test_a19_3_base_par_un_non_membre(self):
        """a19-3 — § 13.7 (CM-22) : un non-membre ne crée pas de base de portée `projet`."""
        s = self.systeme('R', 'OUT')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E', diffusable=True))
        self.ok(s.modifier_visibilite('R', o, 'public'))
        self.refus(s.creer_base('OUT', o, 'projet'))

    def test_a19_4_elargir_dans_un_espace_clos(self):
        """a19-4 — § 5.1 (CT-20) : aucun élargissement de visibilité dans un espace clos."""
        s = self.systeme('R')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E', diffusable=True))
        self.ok(s.clore_espace('R', 'E'))
        self.refus(s.modifier_visibilite('R', o, 'public'))

    def test_a19_5_replique_par_derogation(self):
        """a19-5 — § 12.4, § 13.9 (G-11) : un objet vu par dérogation n'entre jamais dans une réplique."""
        s = self.s
        self.ok(s.creer_espace('R0', 'E'))
        o = self.ok(s.creer_objet('R0', 'E'))
        self.refus(s.accorder_derogation(['SUP1', 'SUP2'], 'A', [o], ['voir'], None, 'j', 1))
        self.ok(s.accorder_derogation(['SUP1', 'SUP2'], 'A', [o], ['voir'], 'enquête', 'j', 1))
        self.assertEqual(self.ok(s.activer_replication('A', 'ap', 'E')), [])
        self.refus(s.consulter_hors_ligne('ap', o))

    def test_a19_6_beneficiaire_ne_restreint_pas(self):
        """a19-6 — § 8.3 (CT-15) : le bénéficiaire d'une HP la clôt, mais ne la restreint pas."""
        s = self.systeme('T', 'Y')
        self.ok(s.creer_espace('T', 'E'))
        p = self.ok(s.creer_objet('T', 'E', personnel=True))
        h = self.ok(s.deleguer('T', ('acteur', 'Y'), {'voir'}, ('objet', p)))
        self.refus(s.restreindre('Y', h, echeance=3))
        self.ok(s.clore('Y', h))

    def test_a20_1_orpheline_signalee(self):
        """a20-1 — § 11.2 (G-10) : une protection orpheline est signalée d'office à l'autorité de dérogation, et à
        elle seule ; le signalement ne donne aucun accès."""
        s = self.systeme('R', 'X')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'X', 'RS', perimetre=[o])
        p = self.ok(s.creer_protection('X', 'embargo_existence', o))
        self.ok(s.quitter('X', 'E'))
        recus = {a for a, ms in s.notifications.items() if ('protection_orpheline', p) in ms}
        self.assertEqual(recus, set(s.autorite_derogation))
        self.absent('SUP1', o)
        self.refus(s.lever_protection('SUP1', p))
        self.ok(s.designer_gardien_orphelin(['SUP1', 'SUP2'], p, 'R'))
        self.accorde('R', o)

    def test_a20_2_retrait_preventif(self):
        """a20-2 — § 5.3, § 9.4 (CM-24) : on ne retire qu'une admission existante ; aucune exclusion préventive."""
        s = self.systeme('R', 'RSx', 'GA', 'M')
        self.ok(s.creer_espace('R', 'E'))
        o = self.ok(s.creer_objet('R', 'E'))
        self.nomme('R', 'E', 'RSx', 'RS')
        self.ok(s.creer_espace('GA', 'G'))
        self.ok(s.creer_groupe('GA', 'G', 'g'))
        h = self.ok(s.deleguer('R', ('groupe', 'g'), {'voir'}, ('contenu', 'E'), mode='notification'))
        self.refus(s.retirer_admission('RSx', h, 'M'))
        self.ok(s.ajouter_membre('GA', 'g', 'M'))
        self.accorde('M', o)

    def test_a20_3_finalites_variees(self):
        """a20-3 — § 12.4, § 12.6 (G-11) : finalités en liste fermée ; consécutivité quelle que soit la finalité."""
        s = self.s
        self.ok(s.creer_espace('R0', 'E'))
        o = self.ok(s.creer_objet('R0', 'E'))
        self.refus(s.accorder_derogation(['SUP1', 'SUP2'], 'B', [o], ['voir'], 'audit 1', 'j', 10))
        finalites = ['enquête', 'demande légale', 'vérification d’intégrité', 'enquête']
        res = []
        for i, f in enumerate(finalites):
            res.append(bool(s.accorder_derogation(['SUP1', 'SUP2'], 'B', [o], ['voir'], f, f'j{i}', 10)))
            s.avancer(9)
        self.assertEqual(res, [True, True, True, False])

    def test_a20_4_visibilite_par_defaut(self):
        """a20-4 — I-4 : le propriétaire voit un objet personnel `communauté` par sa seule visibilité par défaut."""
        s = self.systeme('R', 'T')
        self.ok(s.creer_espace('R', 'E'))
        self.nomme('R', 'E', 'T', 'collaborateur')
        q = self.ok(s.creer_objet('T', 'E', personnel=True, diffusable=True))
        self.absent('R', q)
        self.ok(s.modifier_visibilite('T', q, 'communaute'))
        self.accorde('R', q)
        self.refuse('R', q, 'editer')

    def test_a20_5_portee_limitee(self):
        """a20-5 — § 9.3 (H-6b, remplace la bascule de CT-27) : une admission automatique ne confère rien sur une
        cible devenue exigeante, et continue de valoir sur les autres cibles du périmètre."""
        s = self.systeme('T', 'GA', 'M')
        self.ok(s.creer_espace('T', 'E'))
        self.ok(s.creer_espace('GA', 'G'))
        self.ok(s.creer_groupe('GA', 'G', 'g'))
        o = self.ok(s.creer_objet('T', 'E'))
        self.ok(s.deleguer('T', ('groupe', 'g'), {'voir'}, ('contenu', 'E'), mode='notification'))
        self.ok(s.creer_protection('T', 'interdiction_action', o, destinataires=['GA'], actions=['editer']))
        o2 = self.ok(s.creer_objet('T', 'E'))
        self.ok(s.ajouter_membre('GA', 'g', 'M'))
        self.absent('M', o)
        self.accorde('M', o2)


if __name__ == '__main__':
    unittest.main()
