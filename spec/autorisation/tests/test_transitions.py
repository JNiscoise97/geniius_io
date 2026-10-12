"""Tests de transitions d'état (§ 5) et de combinaisons, contrat V1.5.

Les oracles sont écrits à partir du texte du contrat, indépendamment du code du
modèle : chaque table cite la clause qu'elle transcrit, et aucun test n'appelle
une fonction interne du modèle pour obtenir le résultat attendu.
"""
import itertools
import unittest

from base import Base


class TransitionsHI(Base):
    """§ 5.2 : matrice état × transition d'une habilitation institutionnelle (auteur : la racine R0)."""

    ORACLE = {
        'proposee': dict(accepter=True, refuser=True, clore=True, prolonger=False, restreindre=False,
                         examen=False, lever=False),
        'active': dict(accepter=False, refuser=False, clore=True, prolonger=True, restreindre=True,
                       examen=True, lever=False),
        'suspendue': dict(accepter=False, refuser=False, clore=True, prolonger=False, restreindre=False,
                          examen=False, lever=True),
        'close': dict(accepter=False, refuser=False, clore=False, prolonger=False, restreindre=False,
                      examen=False, lever=False),
        'expiree': dict(accepter=False, refuser=False, clore=False, prolonger=False, restreindre=False,
                        examen=False, lever=False),
    }

    def preparer(self, etat):
        """Une nomination RS de X, dans l'état demandé (même type d'habilitation pour toute la matrice)."""
        self.projet()
        s = self.s
        h = self.ok(s.nommer('R0', 'P', 'X', 'RS', echeance=50))
        if etat == 'proposee':
            return h
        self.ok(s.accepter_nomination('X', h))
        if etat == 'suspendue':
            self.ok(s.mettre_en_examen('R0', h))
        elif etat == 'close':
            self.ok(s.clore('R0', h))
        elif etat == 'expiree':
            s.avancer(60)
        return h

    def tenter(self, h, transition):
        s = self.s
        return {
            'accepter': lambda: s.accepter_nomination('X', h),
            'refuser': lambda: s.refuser_nomination('X', h),
            'clore': lambda: s.clore('R0', h),
            'prolonger': lambda: s.prolonger('R0', h, s.now + 70),
            'restreindre': lambda: s.restreindre('R0', h, echeance=s.now + 20),
            'examen': lambda: s.mettre_en_examen('R0', h),
            'lever': lambda: s.lever_examen('R0', h),
        }[transition]()

    def test_matrice(self):
        for etat, attendus in self.ORACLE.items():
            for transition, permis in attendus.items():
                with self.subTest(etat=etat, transition=transition):
                    self.setUp()
                    h = self.preparer(etat)
                    self.assertEqual(self.s.habs[h].etat, etat)
                    self.assertEqual(bool(self.tenter(h, transition)), permis)


class TransitionsHP(Base):
    """§ 5.2 : T-04, T-05, T-06, T-09, T-11, T-12 sur une habilitation personnelle."""

    def setUp(self):
        super().setUp()
        self.projet()
        self.h1 = self.deleg('TIT', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True)
        self.h2 = self.deleg('TIT', ('acteur', 'V2'), ['voir'], ('objet', self.priv), repartager=True)
        self.hp = self.deleg('V1', ('acteur', 'T'), ['voir'], ('objet', self.priv), echeance=40)

    def test_T06_confirmation_puis_T12_retrait(self):
        s = self.s
        self.ok(s.confirmer('V2', self.hp))
        self.refus(s.confirmer('V2', self.hp))
        self.ok(s.retirer_fondement('V1', self.hp))
        self.accorde('T', self.priv)
        self.ok(s.retirer_fondement('V2', self.hp))
        self.assertEqual(s.habs[self.hp].etat, 'close')
        self.absent('T', self.priv)

    def test_T11_rupture_definitive(self):
        """T-11 et A4 : une HP rompue ne revit pas quand son fondateur retrouve un droit."""
        s = self.s
        self.ok(s.clore('TIT', self.h1))
        self.assertEqual(s.habs[self.hp].etat, 'close')
        self.deleg('TIT', ('acteur', 'V1'), ['voir'], ('objet', self.priv), repartager=True)
        self.absent('T', self.priv)
        self.refus(s.prolonger('V1', self.hp, 50))

    def test_T05_beneficiaire_ne_restreint_pas(self):
        """§ 8.3 (CT-15) : le bénéficiaire clôt, mais ne restreint pas."""
        s = self.s
        self.refus(s.restreindre('T', self.hp, echeance=5))
        self.ok(s.clore('T', self.hp))

    def test_T04_prolongation_bornee(self):
        """T-04 : un fondateur ne prolonge pas au-delà de ses propres droits."""
        s = self.s
        self.ok(s.restreindre('TIT', self.h2, echeance=30))
        self.refus(s.prolonger('V2', self.hp, 60))
        self.ok(s.prolonger('V2', self.hp, 30))

    def test_T09_auteurs_de_cloture(self):
        """§ 8.3 : clore par l'auteur ou le titulaire ; pas par un cofondateur."""
        s = self.s
        self.ok(s.confirmer('V2', self.hp))
        self.refus(s.clore('V2', self.hp))
        self.ok(s.clore('TIT', self.hp))


class TransitionsAutres(Base):

    def test_espace(self):
        """§ 5.1 : actif ⇄ archivé ; → clos, définitif ; pas de transfert d'un espace clos."""
        self.projet()
        s = self.s
        self.refus(s.rouvrir('R0', 'P'))
        self.ok(s.archiver('R0', 'P'))
        self.refus(s.archiver('R0', 'P'))
        self.ok(s.clore_espace('R0', 'P'))
        self.refus(s.rouvrir('R0', 'P'))
        self.refus(s.clore_espace('R0', 'P'))
        self.refus(s.preparer_transfert('R0', 'P', 'K'))

    def test_espace_archive_table(self):
        """§ 5.1, table des effets de l'archivage."""
        self.projet()
        s = self.s
        R = self.deleg('RS', ('acteur', 'V'), ['voir'], ('objet', self.o), echeance=30)
        self.ok(s.archiver('R0', 'P'))
        self.accorde('V', self.o)
        self.refuse('COL', self.o, 'editer')
        self.accorde('TIT', self.priv, 'editer')
        self.refus(s.deleguer('RS', ('acteur', 'W'), ['voir'], ('objet', self.o)))
        self.ok(s.deleguer('TIT', ('acteur', 'W'), ['voir'], ('objet', self.priv)))
        self.refus(s.prolonger('RS', R, 40))
        self.ok(s.restreindre('RS', R, echeance=20))
        self.refus(s.creer_objet('COL', 'P'))
        self.s.objets[self.o].diffusable = True
        self.refus(s.modifier_visibilite('RS', self.o, 'communaute'))
        self.ok(s.creer_protection('RS', 'embargo_contenu', self.o))

    def test_admission(self):
        """§ 5.3 : la sortie de l'ensemble clôt l'admission ; le retour exige une nouvelle admission."""
        self.projet()
        s = self.s
        self.ok(s.creer_groupe('ADM', 'P', 'G'))
        R = self.deleg('RS', ('groupe', 'G'), ['voir'], ('contenu', 'P'))
        self.ok(s.ajouter_membre('ADM', 'G', 'M'))
        self.ok(s.admettre('RS', R, 'M'))
        self.accorde('M', self.o)
        self.ok(s.retirer_membre('ADM', 'G', 'M'))
        self.ok(s.ajouter_membre('ADM', 'G', 'M'))
        self.absent('M', self.o)
        self.ok(s.admettre('RS', R, 'M'))
        self.accorde('M', self.o)

    def test_admission_suspension_n_est_pas_sortie(self):
        """§ 5.3, G-8 : la suspension d'une appartenance rend l'admission inopérante, sans la clore."""
        self.projet()
        s = self.s
        self.ok(s.creer_espace('RF', 'F'))
        hN = self.nomme('RF', 'F', 'N', 'lecteur')
        self.deleg('RS', ('role', 'F', 'lecteur'), ['voir'], ('contenu', 'P'), mode='notification')
        self.accorde('N', self.o)
        self.ok(s.mettre_en_examen('RF', hN))
        self.absent('N', self.o)
        self.ok(s.lever_examen('RF', hN))
        self.accorde('N', self.o)

    def test_transfert(self):
        """§ 5.6 : préparé → présenté → accepté ; annulation ; fin du gel."""
        self.espace_transfere()
        s = self.s
        self.refus(s.accepter_transfert('K', self.tid, 'x'))
        self.presenter()
        self.assertEqual(s.deleguer('RS2', ('acteur', 'V'), ['voir'], ('objet', self.ot)).code, 'gel')
        self.ok(s.annuler_transfert('C', self.tid))
        self.ok(s.deleguer('RS2', ('acteur', 'V'), ['voir'], ('objet', self.ot)))
        self.refus(s.accepter_transfert('K', self.tid, 'x'))

    def test_transfert_expire(self):
        """§ 5.6 : une présentation expirée est refusée (« expirée ») ; seul le cédant présente de nouveau ;
        le gel cesse à l'expiration."""
        self.espace_transfere()
        s = self.s
        emp = self.presenter()
        s.avancer(15)
        self.assertEqual(self.accepter(emp).code, 'expiree')
        self.ok(s.deleguer('RS2', ('acteur', 'V'), ['voir'], ('objet', self.ot)))
        self.refus(s.presenter('K', self.tid))
        emp2 = self.ok(s.presenter('C', self.tid))
        self.ok(self.accepter(emp2))

    def test_transfert_empreinte_perimee(self):
        """§ 10.7 : K accepte la présentation en vigueur ; une empreinte périmée est refusée."""
        self.espace_transfere()
        self.presenter()
        self.assertEqual(self.accepter('empreinte-ancienne').code, 'renouvelee')

    def test_protection(self):
        """§ 5.4 : une protection levée ne se relève pas et ne reçoit plus de bénéficiaire."""
        self.projet()
        s = self.s
        pid = self.ok(s.creer_protection('RS', 'embargo_existence', self.o))
        self.ok(s.lever_protection('RS', pid))
        self.refus(s.lever_protection('RS', pid))
        self.refus(s.ajouter_beneficiaire('RS', pid, ('acteur', 'V')))

    def test_derogation(self):
        """§ 5.5 : une dérogation révoquée ou expirée ne donne plus rien."""
        self.projet()
        s = self.s
        d = self.ok(s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.priv], ['voir'], 'enquête', 'j', 5))
        self.accorde('A', self.priv, finalite='enquête')
        self.ok(s.revoquer_derogation('SUP1', d))
        self.absent('A', self.priv, finalite='enquête')
        self.refus(s.revoquer_derogation('SUP1', d))

    def test_examen_aval_inoperant_puis_retabli(self):
        """§ 7.5 (G-8) : la mise en examen rend l'aval inopérant sans le détruire ; la levée le rétablit."""
        self.projet()
        s = self.s
        hi = self.deleg('RS', ('acteur', 'A'), ['voir'], ('objet', self.o), repartager=True)
        hp = self.deleg('A', ('acteur', 'B'), ['voir'], ('objet', self.o))
        self.ok(s.mettre_en_examen('R0', hi))
        self.absent('B', self.o)
        self.assertEqual(s.habs[hp].etat, 'active')
        self.ok(s.lever_examen('R0', hi))
        self.accorde('B', self.o)

    def test_examen_puis_cloture_ferme_l_aval(self):
        """§ 7.5 : une clôture après examen ferme l'aval par rupture (A4)."""
        self.projet()
        s = self.s
        hi = self.deleg('RS', ('acteur', 'A'), ['voir'], ('objet', self.o), repartager=True)
        hp = self.deleg('A', ('acteur', 'B'), ['voir'], ('objet', self.o))
        self.ok(s.mettre_en_examen('R0', hi))
        self.ok(s.clore('R0', hi))
        self.assertEqual(s.habs[hp].etat, 'close')

    def test_examen_expiration_pendant_suspension(self):
        """A4 : une HI expirée pendant son examen ne revit pas à la levée."""
        self.projet()
        s = self.s
        hi = self.deleg('RS', ('acteur', 'A'), ['voir'], ('objet', self.o), echeance=5)
        self.ok(s.mettre_en_examen('R0', hi))
        s.avancer(6)
        self.refus(s.lever_examen('R0', hi))
        self.absent('A', self.o)


class Combinaisons(Base):
    """Combinaisons de catégories, construites à partir des tables du contrat."""

    def test_protections_x_acteur(self):
        """§ 2.3, § 2.4, § 14 : effet de chaque protection sur `voir`, selon que l'acteur est frappé ou non.
        Oracle : existence → introuvable ; restriction → refus (l'acteur connaît l'objet) ; non frappé → accordé."""
        oracle = {
            ('embargo_existence', True): 'introuvable', ('embargo_existence', False): 'ok',
            ('interdiction_existence', True): 'introuvable', ('interdiction_existence', False): 'ok',
            ('embargo_contenu', True): 'refus', ('embargo_contenu', False): 'ok',
            ('interdiction_action', True): 'refus', ('interdiction_action', False): 'ok',
        }
        for (type_, frappe), attendu in oracle.items():
            with self.subTest(type=type_, frappe=frappe):
                self.setUp()
                self.projet()
                s = self.s
                kw = {}
                if type_.startswith('embargo'):
                    kw['beneficiaires'] = set() if frappe else {('acteur', 'COL')}
                else:
                    kw['destinataires'] = {'COL'} if frappe else {'LEC'}
                    if type_ == 'interdiction_action':
                        kw['actions'] = {'voir'}
                self.ok(s.creer_protection('RS', type_, self.o, **kw))
                self.assertEqual(s.acces('COL', self.o, 'voir').code, attendu)

    def test_protections_cumulees(self):
        """§ 14 : l'existence prime sur la restriction (étape 3 avant l'étape 4)."""
        self.projet()
        s = self.s
        self.ok(s.creer_protection('RS', 'embargo_contenu', self.o))
        self.refuse('COL', self.o)
        self.ok(s.creer_protection('RS', 'embargo_existence', self.o))
        self.absent('COL', self.o)

    def test_derogation_niveaux(self):
        """§ 12.3 : niveau d'approbation selon la cible, le nombre d'approbateurs, l'accord du gardien
        et la finalité. L'oracle transcrit la table du § 12.3."""
        cibles = ['contenu', 'prive', 'public_perso', 'sensible', 'embargo_contenu', 'interdiction_action',
                  'embargo_existence', 'interdiction_existence']
        for cible, n, accord, finalite in itertools.product(cibles, (1, 2), (False, True),
                                                            ('diagnostic technique', 'enquête')):
            protection = cible in ('embargo_contenu', 'interdiction_action', 'embargo_existence',
                                   'interdiction_existence')
            existence = cible in ('embargo_existence', 'interdiction_existence')
            deux = cible in ('prive', 'sensible') or protection or finalite != 'diagnostic technique'
            attendu = n >= (2 if deux else 1) and (accord or not existence)
            with self.subTest(cible=cible, n=n, accord=accord, finalite=finalite):
                self.setUp()
                self.projet()
                s = self.s
                if cible == 'prive':
                    oid = self.priv
                elif cible == 'public_perso':
                    oid = self.obj('TIT', perso=True, diffusable=True)
                    self.ok(s.modifier_visibilite('TIT', oid, 'public'))
                elif cible == 'sensible':
                    oid = self.obj('RS', sensible=True)
                else:
                    oid = self.o
                accords = {}
                if protection:
                    kw = {}
                    if cible.startswith('interdiction'):
                        kw['destinataires'] = {'A'}
                        if cible == 'interdiction_action':
                            kw['actions'] = {'voir'}
                    pid = self.ok(s.creer_protection('RS', cible, oid, **kw))
                    if accord:
                        accords = {pid: 'RS'}
                approbateurs = ('SUP1', 'SUP2')[:n]
                r = s.accorder_derogation(approbateurs, 'A', [oid], ['voir'], finalite, 'j', 3,
                                          accords_gardiens=accords)
                self.assertEqual(bool(r), attendu)
                if cible != 'public_perso':           # un objet public se voit par sa visibilité (§ 14 étape 6)
                    self.assertEqual(bool(s.acces('A', oid, 'voir', finalite)), attendu)

    def test_derogation_gardien_change(self):
        """§ 12.3 : l'accord doit émaner d'un gardien **en fonction** ; s'il cesse de l'être, la dérogation
        ne couvre plus la cible."""
        self.projet()
        s = self.s
        self.nomme('R0', 'P', 'RS1', 'RS')
        pid = self.ok(s.creer_protection('RS1', 'embargo_existence', self.o))
        self.ok(s.designer_gardien('RS1', pid, 'RS'))
        self.ok(s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.o], ['voir'], 'enquête', 'j', 10,
                                      accords_gardiens={pid: 'RS1'}))
        self.accorde('A', self.o, finalite='enquête')
        self.ok(s.quitter('RS1', 'P'))
        self.absent('A', self.o, finalite='enquête')

    def test_admission_x_beneficiaire(self):
        """§ 9.2 et § 9.3 : admission requise et mode `notification` admis, selon le bénéficiaire et la cible."""
        cas = {
            ('groupe', 'contenu'): (True, True),
            ('role_autre', 'contenu'): (True, True),
            ('role_propre', 'contenu'): (False, None),
            ('groupe', 'prive'): (True, False),
            ('role_propre', 'prive'): (True, False),
            ('groupe', 'sensible'): (True, False),
            ('groupe', 'protege'): (True, False),
        }
        for (ben, cible), (requise, notif) in cas.items():
            with self.subTest(beneficiaire=ben, cible=cible):
                self.setUp()
                self.projet()
                s = self.s
                self.ok(s.creer_espace('RF', 'F'))
                self.ok(s.creer_groupe('ADM', 'P', 'G'))
                if cible == 'prive':
                    auteur, oid = 'TIT', self.priv
                elif cible == 'sensible':
                    auteur, oid = 'RS', self.obj('RS', sensible=True)
                elif cible == 'protege':
                    auteur, oid = 'RS', self.o
                    self.ok(s.creer_protection('RS', 'interdiction_action', oid, destinataires={'LEC'},
                                               actions={'editer'}))
                else:
                    auteur, oid = 'RS', self.o
                b = {'groupe': ('groupe', 'G'), 'role_autre': ('role', 'F', 'collaborateur'),
                     'role_propre': ('role', 'P', 'collaborateur')}[ben]
                if notif is not None:
                    r = s.deleguer(auteur, b, ['voir'], ('objet', oid), mode='notification')
                    self.assertEqual(bool(r), notif)
                    if r:
                        self.ok(s.clore(auteur, r.valeur))
                h = self.deleg(auteur, b, ['voir'], ('objet', oid))
                if ben == 'groupe':
                    self.ok(s.ajouter_membre('ADM', 'G', 'N'))
                elif ben == 'role_autre':
                    self.nomme('RF', 'F', 'N', 'collaborateur')
                else:
                    self.nomme('RS', 'P', 'N', 'collaborateur')
                self.assertEqual(bool(s.acces('N', oid, 'voir')), not requise)
                if requise:
                    self.ok(s.admettre(auteur, h, 'N'))
                    self.accorde('N', oid)

    def test_transfert_voies(self):
        """§ 10.5 et § 10.7 : l'acceptation réussit si chaque voie retenue est possible.
        (b) exige l'acceptation de K et aucune restriction non levable ; (c) n'accompagne que (a) ou (b) (F-04), et
        exige la licence et aucune restriction ; la purge n'est empêchée que par une obligation de conservation,
        une restriction légale ou un gel (§ 6.3) ; un consentement retiré ne bloque ni (a) ni la purge."""
        for voie, copie, licence, accepte_b, consentement in itertools.product(
                ('a', 'b', 'purge'), (False, True), (True, False), (True, False), (False, True)):
            choix_possible = not (copie and voie == 'purge')
            attendu = True
            if voie == 'b' and (not accepte_b or consentement):
                attendu = False
            if copie and (not licence or consentement):
                attendu = False
            with self.subTest(voie=voie, copie=copie, licence=licence, accepte_b=accepte_b,
                              consentement=consentement):
                self.setUp()
                self.espace_transfere()
                s = self.s
                O = self.obj('C', 'ESP', perso=True, licence_copie=licence)
                r = s.choisir_voie('C', self.tid, O, voie, copie=copie)
                self.assertEqual(bool(r), choix_possible, r)
                if not choix_possible:
                    continue
                self.presenter()
                if voie == 'b' and accepte_b:
                    self.ok(s.accepter_objet('K', self.tid, O))
                if consentement:
                    s.objets[O].consentement_retire = True
                r = self.accepter()
                self.assertEqual(bool(r), attendu, r)
                self.assertEqual(s.espaces['ESP'].proprietaire, 'K' if attendu else 'C')

    def test_renouvellements(self):
        """§ 12.6 : une demande est refusée si elle serait le 3e renouvellement consécutif, quelle que soit la
        finalité ; un intervalle d'au moins la carence (30) remet le compteur à zéro."""
        finalites = ['enquête', 'demande légale', 'vérification d’intégrité', 'enquête', 'demande légale']
        for intervalles in itertools.product((0, 40), repeat=4):
            with self.subTest(intervalles=intervalles):
                self.setUp()
                self.projet()
                s = self.s
                fin_derniere, rang_dernier = None, None
                for i, ecart in enumerate((0,) + intervalles):
                    s.avancer(ecart)
                    t = s.now
                    consecutive = fin_derniere is not None and t < fin_derniere + 30
                    rang = rang_dernier + 1 if consecutive else 0
                    r = s.accorder_derogation(('SUP1', 'SUP2'), 'A', [self.priv], ['voir'], finalites[i],
                                              f'j{i}', 10)
                    self.assertEqual(bool(r), rang <= 2, (i, rang))
                    if r:
                        fin_derniere, rang_dernier = t + 10, rang
                    s.avancer(10)

    def test_gel_par_liste(self):
        """§ 10.6 (H-4a) : pendant la fenêtre, chaque opération de la liste est gelée, avec le motif unique, quel
        que soit son effet (même un acte qui n'ajouterait rien) ; les opérations hors liste restent permises."""
        actes = {
            'deleguer contenu': (lambda s, t: s.deleguer('RS2', ('acteur', 'V'), ['voir'], ('objet', t.ot)), True),
            'deleguer sans effet (déjà détenu)': (
                lambda s, t: s.deleguer('RS2', ('acteur', 'W'), ['voir'], ('objet', t.ot), echeance=10), True),
            'nommer': (lambda s, t: s.nommer('RS2', 'ESP', 'N', 'lecteur'), True),
            'nommer administrateur': (lambda s, t: s.nommer_administrateur('C', 'ESP', 'Z'), True),
            'ajouter membre': (lambda s, t: s.ajouter_membre('ADME', 'Gx', 'Z'), True),
            'prolonger': (lambda s, t: s.prolonger('RS2', t.hR, 90), True),
            'prolonger en raccourcissant': (lambda s, t: s.prolonger('RS2', t.hR, 45), True),
            'confirmer': (lambda s, t: s.confirmer('RS2', t.hP), True),
            'accepter nomination': (lambda s, t: s.accepter_nomination('RS3', t.hRS3), True),
            'lever examen': (lambda s, t: s.lever_examen('C', t.hS), True),
            'admettre': (lambda s, t: s.admettre('RS2', t.hG, 'M'), True),
            'lever protection': (lambda s, t: s.lever_protection('RS2', t.pV), True),
            'ajouter bénéficiaire': (lambda s, t: s.ajouter_beneficiaire('RS2', t.pV, ('acteur', 'W')), True),
            'désigner gardien': (lambda s, t: s.designer_gardien('RS2', t.pV, 'C'), True),
            'ajouter à une sélection': (lambda s, t: s.ajouter_a_selection('RS2', t.sel, t.od), True),
            'élargir la visibilité': (lambda s, t: s.modifier_visibilite('RS2', t.od, 'communaute'), True),
            'verser': (lambda s, t: s.verser('TIT2', t.q, 'RS2'), True),
            'changer de voie': (lambda s, t: s.choisir_voie('C', t.tid, t.p, 'purge'), True),
            'consentir à la réintégration': (lambda s, t: s.consentir_reintegration('C', 'ESP', 'X', 'HI'), None),
            'clore': (lambda s, t: s.clore('RS2', t.hR), False),
            'restreindre': (lambda s, t: s.restreindre('RS2', t.hR, echeance=40), False),
            'mettre en examen': (lambda s, t: s.mettre_en_examen('C', t.hR), False),
            'retirer membre': (lambda s, t: s.retirer_membre('ADME', 'Gx', 'M'), False),
            'retirer admission': (lambda s, t: s.retirer_admission('RS2', t.hG, 'M2'), False),
            'quitter': (lambda s, t: s.quitter('M2', 'ESP'), False),
            'creer protection': (lambda s, t: s.creer_protection('RS2', 'embargo_contenu', t.ot), False),
            'ajouter destinataire': (lambda s, t: s.ajouter_destinataire('RS2', t.pI, 'W'), False),
            'restriction légale': (lambda s, t: s.creer_restriction_legale(('SUP1', 'SUP2'), t.ot,
                                                                           autorite_levee='AUT'), False),
            'lever restriction légale': (lambda s, t: s.lever_restriction_legale('AUT', t.pL), False),
            'HP tiers sur objet personnel': (lambda s, t: s.deleguer('TIT2', ('acteur', 'V'), ['voir'],
                                                                     ('objet', t.q)), False),
            'creer objet': (lambda s, t: s.creer_objet('RS2', 'ESP'), False),
            'réduire la visibilité': (lambda s, t: s.modifier_visibilite('RS2', t.oc, 'projet'), False),
        }
        for nom, (acte, gele) in actes.items():
            with self.subTest(acte=nom):
                self.setUp()
                self.espace_transfere()
                s = self.s
                self.nomme('C', 'ESP', 'TIT2', 'collaborateur')
                self.nomme('C', 'ESP', 'M2', 'lecteur')
                self.q = self.obj('TIT2', 'ESP', perso=True)
                self.p = self.obj('C', 'ESP', perso=True)
                self.ot2 = self.obj('RS2', 'ESP')
                self.od = self.obj('RS2', 'ESP', diffusable=True)
                self.oc = self.obj('RS2', 'ESP', diffusable=True)
                self.ok(s.modifier_visibilite('RS2', self.oc, 'communaute'))
                self.ok(s.choisir_voie('C', self.tid, self.p, 'a'))
                self.hR = self.deleg('RS2', ('acteur', 'W'), ['voir'], ('objet', self.ot), echeance=50,
                                     repartager=True)
                self.hP = self.deleg('W', ('acteur', 'Y'), ['voir'], ('objet', self.ot), echeance=50)
                self.hS = self.deleg('C', ('acteur', 'X'), ['voir'], ('objet', self.ot))
                self.ok(s.mettre_en_examen('C', self.hS))
                self.hRS3 = self.ok(s.nommer('C', 'ESP', 'RS3', 'RS'))
                self.ok(s.creer_groupe('ADME', 'ESP', 'Gx'))
                self.ok(s.ajouter_membre('ADME', 'Gx', 'M'))
                self.ok(s.ajouter_membre('ADME', 'Gx', 'M2'))
                self.hG = self.deleg('RS2', ('groupe', 'Gx'), ['voir'], ('contenu', 'ESP'))
                self.ok(s.admettre('RS2', self.hG, 'M2'))
                self.sel = self.ok(s.creer_selection('RS2', 'ESP', {self.ot}))
                self.pV = self.ok(s.creer_protection('RS2', 'embargo_contenu', self.ot))
                self.pI = self.ok(s.creer_protection('RS2', 'interdiction_action', self.ot2, destinataires={'V'},
                                                     actions={'editer'}))
                self.pL = self.ok(s.creer_restriction_legale(('SUP3', 'SUP4'), self.ot2, autorite_levee='AUT'))
                self.presenter()
                r = acte(s, self)
                if gele is None or gele:
                    self.assertEqual((r.code, r.valeur), ('gel', 'espace en cours de transfert'), r)
                else:
                    self.assertTrue(r.ok, r)

if __name__ == '__main__':
    unittest.main()
