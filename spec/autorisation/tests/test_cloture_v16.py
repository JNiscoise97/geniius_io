"""Contrôle B de clôture : attendus publics du contrat V1.6 et arbitrages P-1 à P-3.

Les assertions ne prennent aucun attendu dans une fonction interne du modèle.
Les notifications sont le canal observable livré au destinataire par le modèle.
"""
from base import Base


class ClotureV16(Base):
    def test_p1_nomination_autre_rs_sans_gain_par_ensemble_gere(self):
        """P-1, A3, § 9.4 : nomination croisée limitée au périmètre ; aucune admission du gestionnaire."""
        s = self.s
        self.ok(s.creer_espace('R0', 'P'))
        o1, o2 = self.obj('R0'), self.obj('R0')
        self.nomme('R0', 'P', 'RS1', 'RS', perimetre=[o1])
        self.nomme('R0', 'P', 'RS2', 'RS', perimetre=[o2])
        s.ajouter_acteur('RS2bis', personne='RS2')
        h = self.ok(s.deleguer('R0', ('role', 'P', 'lecteur'), ['exporter'], ('contenu', 'P'),
                              mode='notification'))
        self.ok(s.nommer('RS1', 'P', 'RS2bis', 'lecteur', perimetre=[o1]))
        self.accorde('RS2bis', o1, 'commenter')
        self.refuse('RS2bis', o1, 'exporter')
        self.refus(s.admettre('RS2', h, 'RS2bis'))
        self.absent('RS2bis', o2)

    def test_p2_versement_accord_autre_personne(self):
        """P-2, § 6.3 : versement autorisé par un autre RS, puis droits scientifiques ordinaires sur le contenu."""
        self.projet()
        s = self.s
        p = self.obj('RS', perso=True)
        s.ajouter_acteur('RSbis', personne='RS')
        self.nomme('R0', 'P', 'RSbis', 'RS')
        self.refus(s.verser('RS', p, 'RSbis'))
        self.absent('RS2', p)
        self.ok(s.verser('RS', p, 'RS2'))
        self.accorde('RS2', p, 'editer')
        self.accorde('RS', p, 'editer')

    def test_p3_signalement_minimal_sans_cible_ni_titre(self):
        """P-3, § 11.2 : seul un identifiant de protection est notifié à l'autorité ; la cible reste cachée."""
        self.projet()
        s = self.s
        h = self.nomme('R0', 'P', 'X', 'RS')
        p = self.ok(s.creer_protection('X', 'embargo_existence', self.o))
        self.ok(s.clore('R0', h))
        for a in ('SUP1', 'SUP2', 'SUP3', 'SUP4'):
            self.assertEqual(s.notifications.get(a, []), [('protection_orpheline', p)])
            self.absent(a, self.o)
            self.assertEqual(s.lever_protection(a, p).code, 'introuvable')
            self.assertEqual(s.ajouter_beneficiaire(a, p, ('acteur', 'V')).code, 'introuvable')
            self.assertEqual(s.expliquer_acces(a, 'RS2', self.o).code, 'introuvable')
            self.refus(s.journaux(a, 'P'))
            self.refus(s.lister_habilitations(a, 'P'))
        self.assertFalse(any(m[0] == 'protection_orpheline' for m in s.notifications.get('V', [])))
        self.ok(s.designer_gardien_orphelin(('SUP1', 'SUP2'), p, 'RS2'))

    def test_p2_versement_active_hi_preexistante_du_contenu(self):
        """P-2, § 6.3 : une HI préexistante du contenu devient applicable au seul objet versé."""
        self.projet()
        s = self.s
        self.ok(s.deleguer('RS', ('acteur', 'TIT'), ['valider'], ('contenu', 'P')))
        self.refuse('TIT', self.priv, 'valider')
        self.ok(s.verser('TIT', self.priv, 'RS'))
        self.accorde('TIT', self.priv, 'valider')

    def test_m312_purge_ascendant_ne_libere_pas_copie_sensible(self):
        """M312, § 13.11 : la purge logique de l'original ne supprime pas la sensibilité héritée."""
        self.projet()
        s = self.s
        p = self.obj('TIT', perso=True, sensible=True)
        self.nomme('R0', 'P', 'A', 'collaborateur')
        self.ok(s.deleguer('TIT', ('acteur', 'A'), ['voir', 'reutiliser'], ('objet', p)))
        c = self.ok(s.reutiliser('A', p, 'P'))
        self.ok(s.renoncer('TIT', p, sort='purge'))
        self.refus(s.deleguer('A', ('acteur', 'B'), ['voir'], ('objet', c)))
        self.refus(s.accorder_derogation(('SUP1',), 'B', [c], ['voir'], 'diagnostic technique', 'j', 5))

    def test_m033_m330_prolongation_gelee_et_restriction_admise(self):
        """§ 10.6 : prolonger pendant la fenêtre est gelé ; retirer des actions conserve une présentation valable."""
        self.espace_transfere()
        s = self.s
        h = self.ok(s.deleguer('C', ('acteur', 'B'), ['voir', 'commenter'], ('objet', self.ot), echeance=50))
        empreinte = self.presenter()
        self.assertEqual(s.prolonger('RS2', h, 100).code, 'gel')
        self.ok(s.restreindre('C', h, actions=['voir']))
        self.ok(self.accepter(empreinte))
        self.accorde('B', self.ot)
        self.refuse('B', self.ot, 'commenter')
