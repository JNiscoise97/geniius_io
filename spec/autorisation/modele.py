"""Modèle de référence exécutable du contrat d'autorisation GENIIUS V1.6.

Ce module n'est pas le logiciel de production : c'est une spécification
exécutable. Chaque règle cite la clause du contrat qu'elle implémente
(docs/GENIIUS_CONTRAT_AUTORISATION_V1.md). En cas d'écart, le contrat prime et
l'écart est un constat.

Conventions :
- le temps est un entier (jours) ; `Systeme.now` est l'instant courant ;
- toute opération renvoie un `R` : `ok` vrai ou faux, `code` parmi
  'ok', 'refus', 'introuvable', 'gel', 'renouvelee', 'expiree', 'blocage',
  'invalide', 'conflit' ;
- 'gel' est le motif unique « espace en cours de transfert » (§ 10.6) ;
- 'introuvable' est la réponse indistinguable d'une absence (A6, § 15) ;
- « soi » s'entend de la personne (§ 1, G-1) : voir `_meme` ;
- les identifiants du modèle sont séquentiels pour la lisibilité ; ceux de la
  production sont opaques (§ 15) ;
- le modèle ne contient aucun outil de test (en-tête du contrat) : l'observation et la
  construction de l'état jumeau sont dans `tests/outils.py`.
"""
from __future__ import annotations

import copy
import hashlib
import json
from collections import namedtuple
from contextlib import contextmanager
from dataclasses import dataclass, field

# --- Paramètres (§ 16) -------------------------------------------------------
DUREE_MAX_DEROGATION = 30
RENOUVELLEMENTS_MAX = 2
CARENCE_RENOUVELLEMENT = 30
ECHEANCE_HORS_LIGNE_MAX = 30
EXPIRATION_PRESENTATION = 14
PRESENTATIONS_MAX = 3
CARENCE_TRANSFERT = 30
PROFONDEUR_MAX = 16
FINALITES = {1: frozenset({'diagnostic technique', 'vérification d’intégrité', 'enquête', 'demande légale',
                           'succession'})}
FINALITES_VERSION = 1
FINALITES_UN_APPROBATEUR = frozenset({'diagnostic technique', 'vérification d’intégrité'})

# --- Actions et rôles (§ 1, § 6.1, § 7.1) ------------------------------------
ACTIONS = ('voir', 'commenter', 'proposer', 'transcrire', 'editer', 'valider',
           'exporter', 'reutiliser', 'contribuer_core')
ECRITURE = frozenset({'commenter', 'proposer', 'transcrire', 'editer', 'valider', 'contribuer_core'})
ROLES = {
    'RS': frozenset(ACTIONS),
    'collaborateur': frozenset({'voir', 'commenter', 'proposer', 'transcrire', 'editer'}),
    'lecteur': frozenset({'voir', 'commenter'}),
    'invite': frozenset(),
}
ACTIONS_TITULAIRE = frozenset({'voir', 'commenter', 'proposer', 'transcrire', 'editer',
                               'exporter', 'reutiliser'})
ACTIONS_PUBLIC = frozenset({'voir', 'exporter', 'reutiliser'})
PROTECTIONS_INTERNES = frozenset({'embargo_contenu', 'interdiction_action',
                                  'embargo_existence', 'interdiction_existence'})
EXISTENCE = frozenset({'embargo_existence', 'interdiction_existence', 'gel_succession'})
RANG_ETAT = {'active': 1, 'suspendue': 0, 'proposee': 0}
RANG_MODE = {None: 0, 'approbation': 0, 'notification': 1}
NATURES_CONSENTEMENT = frozenset({'HI', 'HP', 'admission', 'nomination'})


class EchecEvaluation(Exception):
    """I-14 : l'évaluation ne peut conclure ; la décision est un refus."""


@dataclass(frozen=True)
class R:
    ok: bool
    code: str = 'ok'
    valeur: object = None

    def __bool__(self):
        return self.ok


def oui(valeur=None):
    return R(True, 'ok', valeur)


def non(code='refus', valeur=None):
    return R(False, code, valeur)


INTROUVABLE = R(False, 'introuvable')
GEL = R(False, 'gel', 'espace en cours de transfert')                 # § 10.6 : motif unique

# Fondement d'un droit : nature ('titulaire', 'role', 'HI', 'HP'), référence,
# repartager, échéance (None = sans échéance), admission éventuelle.
Fondement = namedtuple('Fondement', 'nature ref rep echeance admission')


def _ech_max(a, b):
    """Maximum de deux échéances, None valant l'infini ; False = aucune."""
    if a is False:
        return b
    if b is False:
        return a
    if a is None or b is None:
        return None
    return max(a, b)


def _ech_min(a, b):
    if a is None:
        return b
    if b is None:
        return a
    return min(a, b)


def _ech_le(a, b):
    """a ≤ b, None valant l'infini."""
    if b is None:
        return True
    return a is not None and a <= b


# --- Entités -----------------------------------------------------------------
@dataclass
class Acteur:
    id: str
    personne: str | None
    identite_renforcee: bool = True
    actif: bool = True
    decede: bool = False
    subordonnes: set = field(default_factory=set)
    liens_objets: set = field(default_factory=set)
    espace_personnel: str | None = None


@dataclass
class Espace:
    id: str
    proprietaire: str
    etat: str = 'actif'
    administrateurs: set = field(default_factory=set)
    designation_garde: str | None = None
    replication: str = 'limitee'
    echeance_locale: int = ECHEANCE_HORS_LIGNE_MAX
    transfert_en_cours: str | None = None
    verrou: dict = field(default_factory=dict)       # cédant -> consentements par acte non consommés (§ 10.8)
    personnel_de: str | None = None
    mandats: set = field(default_factory=set)        # (déposant, lanceur)
    carence_transfert: int | None = None             # § 5.6 : aucun transfert préparé avant cet instant


@dataclass
class Objet:
    id: str
    espace: str
    titulaire: str | None
    visibilite: str
    titre: str = ''
    type: str = 'objet'
    sensible: bool = False
    diffusable: bool = False
    licence_copie: bool = True
    licence_redistribution: bool = True
    droit_tiers_oppose: bool = False
    consentement_retire: bool = False
    effacement_legal: bool = False
    conservation_obligatoire: bool = False
    purge: bool = False
    mentions: set = field(default_factory=set)
    relations: set = field(default_factory=set)
    copie_de: str | None = None
    reutilisee: bool = False
    paternite: str | None = None
    est_proposition: bool = False
    validation_personnelle: bool = False
    ayant_droit_propose: str | None = None


@dataclass
class Habilitation:
    id: str
    nature: str                 # 'HI', 'HP', 'SYS' (racine)
    type: str                   # 'appartenance' | 'delegation'
    espace: str | None
    auteur: str | None
    beneficiaire: tuple
    actions: frozenset
    repartager: bool
    perimetre: tuple
    echeance: int | None
    role: str | None = None
    mode: str | None = None     # 'approbation' | 'notification' | None
    etat: str = 'active'
    fondateurs: dict = field(default_factory=dict)
    condition_rattachement: tuple | None = None
    reemission_de: str | None = None
    lot: str | None = None
    echeance_hors_ligne: int | None = None
    perimetre_signataire: tuple | None = None   # HI : périmètre du RS signataire à l'acte (A1, § 13.3)
    exclusions: frozenset = frozenset()         # exclusions figées (§ 2.5, H-1a)
    excl_fondateurs: dict = field(default_factory=dict)   # HP : exclusions figées propres à un fondateur
    trace: list = field(default_factory=list)


@dataclass
class Admission:
    id: str
    hab: str
    acteur: str
    admis_par: str | None
    nature: str
    auto: bool
    etat: str = 'active'
    exclusions: frozenset = frozenset()         # exclusions figées de l'admetteur (§ 2.5, H-1a)


@dataclass
class Groupe:
    id: str
    espace: str
    membres: dict = field(default_factory=dict)      # acteur -> ajouté par


@dataclass
class Protection:
    id: str
    type: str
    cible: str
    createur: str | None
    gardiens: set = field(default_factory=set)
    beneficiaires: set = field(default_factory=set)
    agrees: dict = field(default_factory=dict)
    destinataires: set = field(default_factory=set)
    actions: frozenset = frozenset()
    etat: str = 'active'
    createurs: frozenset = frozenset()
    autorite_levee: str | None = None
    externe: bool = False
    reference: dict = field(default_factory=dict)
    fin: int | None = None
    contestation: str | None = None
    herite_de: str | None = None
    orpheline_signalee: bool = False


@dataclass
class Derogation:
    id: str
    beneficiaire: str
    cibles: frozenset
    operations: frozenset
    finalite: str
    justification: str
    debut: int
    fin: int
    approbateurs: tuple
    accords_gardiens: dict
    etat: str = 'active'
    renouvellement_de: str | None = None
    rang: int = 0                               # § 12.6 (CT-16)


@dataclass
class Selection:
    id: str
    espace: str
    auteur: str
    version_active: set
    masques: set = field(default_factory=set)
    proposition: set = field(default_factory=set)
    etat: str = 'active'


@dataclass
class Lot:
    id: str
    espace: str
    auteur: str
    objets: set
    etat: str = 'ouvert'
    habs: set = field(default_factory=set)


@dataclass
class Transfert:
    id: str
    espace: str
    cedant: str
    cessionnaire: str
    voies: dict = field(default_factory=dict)
    copies: set = field(default_factory=set)
    acceptes_b: set = field(default_factory=set)
    reemissions: dict = field(default_factory=dict)
    etat: str = 'prepare'
    empreinte: str | None = None
    presente: dict | None = None
    expire_le: int | None = None
    presentations: int = 0
    differes: list = field(default_factory=list)


@dataclass
class Contribution:
    id: str
    auteur: str
    cible: str
    action: str
    delta: str
    t_locale: int
    etat: str = 'locale'


@dataclass
class Appareil:
    id: str
    acteur: str
    replique: dict = field(default_factory=dict)     # objet -> échéance locale (None : dispensé)
    contributions: list = field(default_factory=list)


# --- Le système ----------------------------------------------------------------
class Systeme:
    def __init__(self):
        self.now = 0
        self.epoque = 0
        self._n = 0
        self.acteurs: dict[str, Acteur] = {}
        self.espaces: dict[str, Espace] = {}
        self.objets: dict[str, Objet] = {}
        self.habs: dict[str, Habilitation] = {}
        self.admissions: dict[str, Admission] = {}
        self.exclusions: set = set()                 # (hab, personne) retirés par l'habilitant (§ 9.4)
        self.groupes: dict[str, Groupe] = {}
        self.protections: dict[str, Protection] = {}
        self.derogations: dict[str, Derogation] = {}
        self.selections: dict[str, Selection] = {}
        self.lots: dict[str, Lot] = {}
        self.transferts: dict[str, Transfert] = {}
        self.rattachements: set = set()
        self.prises_en_charge: set = set()
        self.invitations: list = []
        self.autorite_derogation: set = set()        # ST-15 (§ 12.2)
        self.autorites_externes: set = set()
        self.journal: list = []                      # journaux de gouvernance
        self.audit: list = []                        # journal d'audit de la plateforme
        self.notifications: dict = {}
        self.avis: list = []                         # avis généraux (réduction d'audience, § 13.2)
        self.signalements: list = []                 # protections orphelines (§ 11.2, G-10)
        self.diffusions: list = []
        self.bases: dict = {}
        self.series: dict = {}
        self.insertions: dict = {}
        self.campagnes: dict = {}
        self.appareils: dict[str, Appareil] = {}
        self.contributions: dict[str, Contribution] = {}
        self.scelles: dict = {}
        self.differes_espace: list = []              # admissions automatiques différées (§ 5.1)
        self._cache: dict = {}
        self.diagnostic_cache = []
        self._structurel = False

    # ---------------------------------------------------------------- outils
    def _id(self, prefixe):
        self._n += 1
        return f'{prefixe}{self._n}'

    def _ecrit(self):
        """Toute écriture qui peut affecter un droit incrémente l'époque (CP-40, § 13.10)."""
        self.epoque += 1
        self._propager()

    def _jrnl(self, type_, auteur, espace, cibles=(), prive_de=None, **details):
        self.journal.append(dict(id=self._id('j'), t=self.now, type=type_, auteur=auteur,
                                 espace=espace, cibles=frozenset(c for c in cibles if c),
                                 prive_de=prive_de, details=details))

    def _notifier(self, acteur, message):
        self.notifications.setdefault(acteur, []).append(message)

    def avancer(self, jours):
        self.now += jours
        self._propager()

    @contextmanager
    def _vue_structurelle(self):
        """Suspensions tenues pour levées : la rupture et la qualité de gardien ne dépendent
        jamais d'une suspension (§ 8.2, § 11.2, G-8)."""
        ancien, self._structurel = self._structurel, True
        try:
            yield
        finally:
            self._structurel = ancien

    # ------------------------------------------------------------ fixtures
    def ajouter_acteur(self, aid, personne=None, *, renforcee=True, institutionnel=False):
        """Création d'un compte (hors contrat). Un compte est relié à une personne (§ 1)."""
        if institutionnel:
            personne = None
        elif personne is None:
            personne = aid
        self.acteurs[aid] = Acteur(aid, personne, identite_renforcee=renforcee)
        return aid

    # ---------------------------------------------------- personnes (G-1)
    def _personne(self, a):
        act = self.acteurs.get(a)
        if act is None or act.personne is None:
            return ('compte', a)
        return ('personne', act.personne)

    def _meme(self, a, b):
        """« Soi » : deux comptes de la même personne (§ 1)."""
        return a is not None and b is not None and self._personne(a) == self._personne(b)

    def _meme_qu_un(self, a, ensemble):
        return any(self._meme(a, b) for b in ensemble)

    def _etablie(self, a):
        """Identité établie (§ 1) : personne physique, vérification renforcée."""
        act = self.acteurs.get(a)
        return bool(act) and act.personne is not None and act.identite_renforcee

    # ---------------------------------------------------- requêtes de base
    def _active(self, h, t=None):
        t = self.now if t is None else t
        etats = ('active', 'suspendue') if self._structurel else ('active',)
        return h.etat in etats and (h.echeance is None or t < h.echeance)

    def _appartenances(self, a, E, t=None):
        return [h for h in self.habs.values()
                if h.type == 'appartenance' and h.espace == E and h.beneficiaire == ('acteur', a)
                and self._active(h, t)]

    def _rs_membres(self, a, E, t=None):
        return [h for h in self._appartenances(a, E, t) if h.role == 'RS']

    def _rs_de(self, E):
        return {h.beneficiaire[1] for h in self.habs.values()
                if h.type == 'appartenance' and h.espace == E and h.role == 'RS' and self._active(h)}

    def _est_racine(self, a, E):
        esp = self.espaces.get(E)
        return bool(esp) and esp.etat != 'clos' and esp.proprietaire == a and any(
            h.nature == 'SYS' for h in self._rs_membres(a, E))

    def _administre(self, a, E):
        esp = self.espaces.get(E)
        return bool(esp) and a is not None and (esp.proprietaire == a or a in esp.administrateurs)

    def _membre_espace(self, a, E):
        return bool(self._appartenances(a, E)) or self._administre(a, E)

    def _gestionnaires(self, beneficiaire):
        """§ 1 : gestionnaires d'un ensemble ouvert."""
        if beneficiaire[0] == 'groupe':
            g = self.groupes[beneficiaire[1]]
            esp = self.espaces[g.espace]
            return {esp.proprietaire} | set(esp.administrateurs)
        if beneficiaire[0] == 'role':
            return self._rs_de(beneficiaire[1])
        return set()

    def _membres(self, beneficiaire, t=None):
        if beneficiaire[0] == 'groupe':
            return set(self.groupes[beneficiaire[1]].membres)
        if beneficiaire[0] == 'role':
            F, r = beneficiaire[1], beneficiaire[2]
            return {h.beneficiaire[1] for h in self.habs.values()
                    if h.type == 'appartenance' and h.espace == F and h.role == r and self._active(h, t)}
        return set()

    def _objets_du_perimetre(self, p):
        kind = p[0]
        if kind == 'objet':
            ids = {p[1]}
        elif kind == 'objets':
            ids = set(p[1])
        elif kind == 'contenu':
            ids = {o.id for o in self.objets.values() if o.espace == p[1] and o.titulaire is None}
        elif kind == 'selection':
            s = self.selections.get(p[1])
            ids = (s.version_active - s.masques) if s and s.etat == 'active' else set()
        else:
            ids = set()
        return {i for i in ids if i in self.objets and not self.objets[i].purge}

    def _perimetre_contient(self, p, o):
        if o.purge:
            return False
        kind = p[0]
        if kind == 'objet':
            return p[1] == o.id
        if kind == 'objets':
            return o.id in p[1]
        if kind == 'contenu':
            return o.espace == p[1] and o.titulaire is None
        if kind == 'selection':
            s = self.selections.get(p[1])
            return bool(s) and s.etat == 'active' and o.id in s.version_active and o.id not in s.masques
        return False

    def _espace_hab(self, h):
        if h.nature in ('HI', 'SYS'):
            return h.espace
        return self._espace_du_perimetre(h.perimetre)

    def _espace_du_perimetre(self, p):
        if p[0] == 'contenu':
            return p[1]
        if p[0] == 'selection':
            s = self.selections.get(p[1])
            return s.espace if s else None
        espaces = {self.objets[i].espace for i in self._ids_bruts(p) if i in self.objets}
        return espaces.pop() if len(espaces) == 1 else None

    def _ids_bruts(self, p):
        if p[0] == 'objet':
            return {p[1]}
        if p[0] == 'objets':
            return set(p[1])
        if p[0] == 'selection':
            s = self.selections.get(p[1])
            return set(s.version_active) if s else set()
        return set()

    def _perimetre_inclus(self, petit, grand):
        """Le périmètre `petit` est-il couvert par `grand` ? (A1, § 7.2)"""
        if grand[0] == 'contenu':
            if petit[0] == 'contenu':
                return petit[1] == grand[1]
            return all(self.objets[i].espace == grand[1] and self.objets[i].titulaire is None
                       for i in self._ids_bruts(petit) if i in self.objets)
        if grand[0] == 'objets':
            if petit[0] == 'contenu':
                return False
            return self._ids_bruts(petit) <= set(grand[1])
        if grand[0] == 'objet':
            return petit[0] != 'contenu' and self._ids_bruts(petit) <= {grand[1]}
        return False

    def _membre_couvre(self, m, o):
        return (o.titulaire is None and o.espace == m.espace and self._perimetre_contient(m.perimetre, o)
                and o.id not in m.exclusions)

    @staticmethod
    def _regime(o):
        """§ 1 : régime d'une cible."""
        return ('contenu', o.espace) if o.titulaire is None else ('perso', o.espace, o.titulaire)

    # ------------------------------------------------------- protections
    def _protections(self, o, t=None):
        t = self.now if t is None else t
        return [p for p in self.protections.values()
                if p.cible == o.id and p.etat == 'active' and (p.fin is None or t < p.fin)]

    def _beneficiaire_effectif(self, a, p):
        """§ 2.4, § 9.5 : bénéficiaire effectif d'un embargo (personne, H-5)."""
        if a is None:
            return False
        if self._meme_qu_un(a, p.gardiens):
            return True
        if any(b[0] == 'acteur' and self._meme(a, b[1]) for b in p.beneficiaires):
            return True
        for b in p.beneficiaires:
            if b[0] == 'groupe' and self._meme_qu_un(a, self.groupes[b[1]].membres) \
                     and self._meme_qu_un(a, p.agrees.get(b[1], set())):
                return True
        return False

    def _existence_protections(self, a, o, t=None):
        res = []
        for p in self._protections(o, t):
            if p.type == 'embargo_existence' and not self._beneficiaire_effectif(a, p):
                res.append(p)
            elif p.type == 'interdiction_existence' and self._meme_qu_un(a, p.destinataires):
                res.append(p)
            elif p.type == 'gel_succession':                       # § 2.4, G-9
                res.append(p)
        return res

    def _existence_cachee(self, a, o, t=None):
        """§ 2.4, § 14 étape 3."""
        return bool(self._existence_protections(a, o, t))

    def _restrictions_internes(self, a, o, op, t=None):
        """§ 2.3, § 14 étape 4 (destinataires : personnes, H-5)."""
        res = []
        for p in self._protections(o, t):
            if p.type == 'embargo_contenu' and not self._beneficiaire_effectif(a, p):
                res.append(p)
            elif p.type == 'interdiction_action' and self._meme_qu_un(a, p.destinataires) \
                     and (op is None or op in p.actions):
                res.append(p)
        return res

    def _ascendants(self, o):
        """§ 1 : l'original d'une copie, l'original de celui-ci, etc. (purgés compris)."""
        res, vus = [], {o.id}
        cur = o
        while cur.copie_de and cur.copie_de not in vus and cur.copie_de in self.objets:
            vus.add(cur.copie_de)
            cur = self.objets[cur.copie_de]
            res.append(cur)
        return res

    def _non_levable(self, o, t=None):
        """§ 2.3, § 11.6, § 13.11 (H-3b, CT-05) : restrictions non levables de la cible et de tout
        ascendant, y compris celles posées après la copie."""
        if o.consentement_retire or o.effacement_legal:
            return True
        if any(p.type == 'restriction_legale' for p in self._protections(o, t)):
            return True
        for anc in self._ascendants(o):
            if anc.consentement_retire or anc.effacement_legal:
                return True
            if any(p.type == 'restriction_legale' and p.reference.get('portee') != 'cible'
                   for p in self._protections(anc, t)):
                return True
        return False

    def _sensible(self, o):
        """§ 13.11 (H-3b) : la sensibilité d'un ascendant est héritée."""
        return o.sensible or any(anc.sensible for anc in self._ascendants(o))

    def _exigeante(self, o, t=None):
        """§ 1 : cible exigeante (n'admet que l'approbation préalable, § 9.3, H-6b)."""
        return ((o.titulaire is not None and o.visibilite != 'public') or self._sensible(o)
                or bool(self._protections(o, t)) or self._non_levable(o, t))

    def _executable(self, a, o, act):
        """§ 2.5, G-7 : l'action est-elle effectivement exécutable par a, protections comprises ?"""
        return (not self._existence_cachee(a, o) and not self._restrictions_internes(a, o, act)
                and not self._non_levable(o))

    def _exclusions_figees(self, a, p, actions):
        """§ 2.5 (H-1a) : sur un périmètre dynamique, cibles dont a ne connaît pas l'existence et sur
        lesquelles il ne pourrait pas exécuter les actions. Sur les cibles qu'il connaît, une action non
        exécutable fait refuser l'acte (None)."""
        exclusions = set()
        for i in self._objets_du_perimetre(p):
            o = self.objets[i]
            if all(self._executable(a, o, act) for act in actions):
                continue
            if self._connait(a, o) or p[0] not in ('contenu', 'selection'):
                return None
            exclusions.add(i)
        return frozenset(exclusions)

    # ------------------------------------------------------------- droits
    def _fondements(self, a, o, t=None, chemin=frozenset(), prof=0):
        """Droits effectifs de a sur o, abstraction faite des protections (§ 2.5).

        Renvoie {action: [Fondement]}. `chemin` contient les habilitations exclues
        (chaîne qui ne passe pas par l'habilitation évaluée, § 8.2)."""
        t = self.now if t is None else t
        if prof > PROFONDEUR_MAX:
            raise EchecEvaluation()
        res: dict = {}
        if a is None or o.purge:
            return res

        def add(actions, f):
            for x in actions:
                res.setdefault(x, []).append(f)

        if o.titulaire == a:                                         # § 6.1
            add(ACTIONS_TITULAIRE, Fondement('titulaire', o.id, True, None, None))
        if o.titulaire is None:                                      # § 7.1
            for m in self._appartenances(a, o.espace, t):
                if m.id not in chemin and self._membre_couvre(m, o):
                    add(ROLES[m.role], Fondement('role', m.id, m.role == 'RS', m.echeance, None))
        for h in list(self.habs.values()):
            if h.type != 'delegation' or h.id in chemin or not self._active(h, t):
                continue
            if not self._perimetre_contient(h.perimetre, o) or o.id in h.exclusions:
                continue                                             # § 2.5 (H-1a)
            adm = self._beneficie(a, h, t, chemin, prof, o)
            if adm is False:
                continue
            if h.nature == 'HI':                                     # § 7.3
                if not (o.titulaire is None and o.espace == h.espace):
                    continue
                if h.perimetre_signataire and not self._perimetre_contient(h.perimetre_signataire, o):
                    continue
                add(h.actions, Fondement('HI', h.id, h.repartager, h.echeance, adm))
            else:                                                    # § 8.2
                ech = self._hp_couverture(h, o, t, chemin | {h.id}, prof + 1)
                if ech is False:
                    continue
                add(h.actions, Fondement('HP', h.id, h.repartager, ech, adm))
        return res

    def _beneficie(self, a, h, t, chemin, prof, o=None):
        """§ 9.2 : le bénéficiaire (personne), et son admission, toujours requise pour un ensemble ouvert."""
        b = h.beneficiaire
        if b[0] == 'acteur':
            return None if self._meme(a, b[1]) else False
        if b[0] == 'public':
            return None
        if self._meme(a, h.auteur):                                    # § 9.4 : jamais admis à la sienne
            return False
        if not self._meme_qu_un(a, self._membres(b, t)):
            return False
        for adm in self.admissions.values():
            if adm.hab != h.id or adm.etat != 'active' or not self._meme(adm.acteur, a):
                continue
            if o is not None and adm.auto and self._exigeante(o, t):
                continue                                               # § 9.3 (H-6b) : portée limitée
            if o is not None and o.id in adm.exclusions:
                continue                                               # § 2.5 (H-1a)
            if adm.nature == 'HP' and not adm.auto:
                if self._couverture(adm.admis_par, h.perimetre, h.actions, t,
                                    chemin | {h.id}, prof + 1) is False:
                    continue                                           # § 5.3 (CM-10)
            return adm.id
        return False

    @staticmethod
    def _admission_requise(h):
        """§ 9.2 (H-2a) : toute habilitation à un ensemble ouvert exige une admission."""
        return h.beneficiaire[0] in ('groupe', 'role')

    def _hp_couverture(self, h, o, t, chemin, prof):
        """Couverture de l'HP h sur o : échéance du meilleur fondateur valide, ou False (§ 8.2)."""
        best = False
        for f, fe in h.fondateurs.items():
            if fe is not None and t >= fe:
                continue
            if o.id in h.excl_fondateurs.get(f, ()):
                continue                                             # § 2.5 (H-1a)
            fs = self._fondements(f, o, t, chemin, prof)
            if all(any(x.rep for x in fs.get(act, [])) for act in h.actions):
                best = _ech_max(best, fe)
        return best

    def _couverture(self, a, p, actions, t=None, chemin=frozenset(), prof=0):
        """a détient-il `actions` avec `repartager` sur tout le périmètre p ?
        Renvoie l'échéance de cette détention (None : sans échéance) ou False (A1)."""
        t = self.now if t is None else t
        if a is None:
            return False
        if p[0] == 'contenu':
            return self._couverture_contenu(a, p[1], actions, t, chemin, prof)
        objets = self._objets_du_perimetre(p)
        resultat = None
        for oid in objets:
            fs = self._fondements(a, self.objets[oid], t, chemin, prof)
            for act in actions:
                ech = False
                for f in fs.get(act, []):
                    if f.rep:
                        ech = _ech_max(ech, f.echeance)
                if ech is False:
                    return False
                resultat = _ech_min(resultat, ech)
        return resultat

    def _couverture_contenu(self, a, E, actions, t, chemin, prof):
        if prof > PROFONDEUR_MAX:
            raise EchecEvaluation()
        ech = False
        for m in self._rs_membres(a, E, t):
            if m.id not in chemin and m.perimetre == ('contenu', E) and actions <= ROLES['RS']:
                ech = _ech_max(ech, m.echeance)
        for h in self.habs.values():
            if (h.type != 'delegation' or h.id in chemin or not self._active(h, t)
                    or h.perimetre != ('contenu', E) or not h.repartager or not actions <= h.actions):
                continue
            if self._beneficie(a, h, t, chemin, prof) is False:
                continue
            if h.nature == 'HI':
                ech = _ech_max(ech, h.echeance)
            else:
                for f, fe in h.fondateurs.items():
                    if fe is not None and t >= fe:
                        continue
                    if self._couverture_contenu(f, E, h.actions, t, chemin | {h.id}, prof + 1) is not False:
                        ech = _ech_max(ech, fe)
        return ech

    def _peut_deleguer(self, a, objs, actions, chemin=frozenset()):
        """Conditions 1 et 2 du § 8.1 sur des objets explicites : A1 et exécution effective (G-7)."""
        for i in objs:
            o = self.objets[i]
            fs = self._fondements(a, o, chemin=chemin)
            for act in actions:
                if not any(f.rep for f in fs.get(act, [])) or not self._executable(a, o, act):
                    return False
        return True

    def _a_un_droit(self, a, o):
        """« Détenir un droit de contenu », abstraction faite des protections et des suspensions (§ 11.2).
        Renvoie None si l'évaluation échoue (A6 : l'état n'est alors pas modifié)."""
        try:
            with self._vue_structurelle():
                return bool(self._fondements(a, o))
        except EchecEvaluation:
            return None

    def _connait(self, a, o, t=None):
        """§ 14 : connaître l'existence d'une cible (un droit quelconque, ou la visibilité),
        abstraction faite des restrictions."""
        if self._existence_cachee(a, o, t):
            return False
        if self._fondements(a, o, t):
            return True
        return self._visibilite_accorde(a, o)

    def _visibilite_accorde(self, a, o):
        """§ 14 étape 6."""
        return o.visibilite == 'public' or (o.visibilite == 'communaute' and a is not None)

    # ------------------------------------------------------- évaluation
    def acces(self, a, oid, op, finalite=None):
        """§ 14 : évaluation d'un accès."""
        t = self.now
        o = self.objets.get(oid)
        if o is None or o.purge:                                        # étape 0
            return INTROUVABLE
        try:
            connu = self._connait(a, o, t)
            if self._non_levable(o, t):                                 # étape 1
                return non('refus') if connu else INTROUVABLE
            d = self._derogation_applicable(a, o, op, t, finalite)     # étape 2
            if d is not None:
                self.audit.append(dict(t=t, type='usage_derogation', derogation=d.id, acteur=a, cible=oid,
                                       op=op, renforce=bool(self._existence_protections(a, o, t))))
                return oui(('derogation', d.id))
            if self._existence_cachee(a, o, t):                         # étape 3
                return INTROUVABLE
            if self._restrictions_internes(a, o, op, t):                # étape 4
                return non('refus') if connu else INTROUVABLE
            fs = self._fondements(a, o, t).get(op, [])                  # étape 5
            ferme = (op in ECRITURE and self.espaces[o.espace].etat != 'actif'
                     and not (o.titulaire is not None and o.titulaire == a))           # § 5.1 (CM-03)
            if fs and not ferme:
                if op == 'contribuer_core' and not (o.diffusable and o.titulaire is None):
                    return non('refus')
                return oui(tuple(f.nature for f in fs))
            if op == 'voir' and self._visibilite_accorde(a, o):         # étape 6
                return oui(('visibilite',))
            return non('refus') if connu else INTROUVABLE
        except EchecEvaluation:                                          # I-14
            return INTROUVABLE

    def _acces_ordinaire(self, a, oid, op):
        r = self.acces(a, oid, op)
        return bool(r) and not (isinstance(r.valeur, tuple) and r.valeur and r.valeur[0] == 'derogation')

    def acces_en_ligne(self, a, oid, op):
        """§ 13.10 : décision servie par cache seulement à l'époque courante."""
        cle = (a, oid, op)
        c = self._cache.get(cle)
        if c and c[0] == self.epoque and (c[2] is None or self.now < c[2]) and c[3] == self.now:
            self.diagnostic_cache.append(cle)
            return c[1]
        r = self.acces(a, oid, op)
        self._cache[cle] = (self.epoque, r, self._prochaine_echeance(), self.now)
        return r

    def _prochaine_echeance(self):
        echs = [h.echeance for h in self.habs.values() if h.etat == 'active' and h.echeance is not None]
        echs += [d.fin for d in self.derogations.values() if d.etat == 'active']
        echs = [e for e in echs if e > self.now]
        return min(echs) if echs else None

    # --------------------------------------------------------- propagation
    def _propager(self):
        """Expirations, ruptures (T-10, T-11), admissions (§ 5.3), gardiens (§ 11.2).
        Les suspensions sont tenues pour levées (G-8) ; un échec d'évaluation ne modifie rien (A6)."""
        t = self.now
        for _ in range(50):
            change = False
            for h in self.habs.values():
                if h.etat in ('active', 'suspendue', 'proposee') and h.echeance is not None and t >= h.echeance:
                    h.etat = 'expiree'
                    h.trace.append((t, 'expiration', None))
                    change = True
            with self._vue_structurelle():
                for h in self.habs.values():
                    if h.nature != 'HP' or h.etat != 'active':
                        continue
                    if h.fondateurs and all(fe is not None and t >= fe for fe in h.fondateurs.values()):
                        h.etat = 'expiree'
                        h.trace.append((t, 'expiration', None))
                        change = True
                        continue
                    try:
                        vivante = self._hp_vivante(h, t)
                    except EchecEvaluation:
                        vivante = True
                    if not vivante:
                        h.etat = 'close'
                        h.trace.append((t, 'rupture', None))
                        change = True
                for adm in self.admissions.values():
                    if adm.etat != 'active':
                        continue
                    h = self.habs[adm.hab]
                    fin = h.etat in ('close', 'expiree') or adm.acteur not in self._membres(h.beneficiaire, t)
                    if not fin and adm.nature == 'HP' and not adm.auto:
                        try:
                            fin = self._couverture(adm.admis_par, h.perimetre, h.actions, t,
                                                   frozenset({h.id})) is False
                        except EchecEvaluation:
                            fin = False
                    if fin:
                        adm.etat = 'close'
                        change = True
            for p in self.protections.values():
                if p.etat != 'active' or p.type not in PROTECTIONS_INTERNES:
                    continue
                o = self.objets.get(p.cible)
                if o is None or o.purge:
                    continue
                ref = self._objet_de_reference(p)                        # § 11.2 (H-3b)
                for g in list(p.gardiens):
                    if ref is None or self._a_un_droit(g, ref) is False:   # None (échec) : rien ne change
                        p.gardiens.discard(g)
                        change = True
                if p.gardiens and p.orpheline_signalee:
                    p.orpheline_signalee = False                         # F-03 : prochain passage signalé
                    change = True
                if not p.gardiens and not p.orpheline_signalee:          # G-10, à chaque passage
                    p.orpheline_signalee = True
                    self.signalements.append(p.id)
                    for s in sorted(self.autorite_derogation):
                        self._notifier(s, ('protection_orpheline', p.id))
                    change = True
            for d in self.derogations.values():
                if d.etat == 'active' and t >= d.fin:
                    d.etat = 'expiree'
                    change = True
            for tr in self.transferts.values():
                if tr.etat == 'presente' and tr.expire_le is not None and t >= tr.expire_le:
                    tr.etat = 'expire'                                   # § 5.6
                    self.espaces[tr.espace].transfert_en_cours = None
                    change = True
                if tr.differes and not self._fenetre(tr):
                    self._traiter_differes(tr)
                    change = True
            if not change:
                break

    def _objet_de_reference(self, p):
        """§ 11.2 (H-3b) : la qualité de gardien d'une protection héritée s'apprécie sur l'ascendant qui
        porte la protection d'origine. None si cet ascendant est purgé : aucun droit n'y est détenu."""
        vus = set()
        while p.herite_de and p.herite_de in self.protections and p.id not in vus:
            vus.add(p.id)
            p = self.protections[p.herite_de]
        o = self.objets.get(p.cible)
        return None if o is None or o.purge else o

    def _hp_vivante(self, h, t):
        for f, fe in h.fondateurs.items():
            if fe is not None and t >= fe:
                continue
            if h.perimetre[0] == 'selection':
                objs = self._objets_du_perimetre(h.perimetre)
                if not objs:
                    return True
                if any(self._couverture(f, ('objet', i), h.actions, t, frozenset({h.id})) is not False
                       for i in objs):
                    return True
                continue
            if self._couverture(f, h.perimetre, h.actions, t, frozenset({h.id})) is not False:
                return True
        return False

    # ------------------------------------------------------------- espaces
    def creer_espace(self, createur, eid, *, designation_garde=None, personnel=False):
        """§ 6.1 : propriété et rôle de racine au créateur."""
        if createur not in self.acteurs or eid in self.espaces:
            return non('invalide')
        esp = Espace(eid, createur, designation_garde=designation_garde)
        if personnel:
            esp.personnel_de = createur
            self.acteurs[createur].espace_personnel = eid
        self.espaces[eid] = esp
        self._racine(eid, createur)
        self._jrnl('creation_espace', createur, eid)
        self._ecrit()
        return oui(eid)

    def _racine(self, E, a):
        hid = self._id('h')
        self.habs[hid] = Habilitation(hid, 'SYS', 'appartenance', E, None, ('acteur', a), ROLES['RS'],
                                      True, ('contenu', E), None, role='RS')
        return hid

    def nommer_administrateur(self, proprietaire, E, x):
        """§ 10.1 : réservé au propriétaire ; opération sensible (A3)."""
        esp = self.espaces.get(E)
        if not esp or esp.proprietaire != proprietaire or self._meme(x, proprietaire) or x not in self.acteurs:
            return non('refus')
        if self._gele(E):
            return GEL
        if not self._etablie(x):
            return non('refus')
        esp.administrateurs.add(x)
        self._jrnl('nomination_administrateur', proprietaire, E, beneficiaire=x)
        self._ecrit()
        return oui()

    def revoquer_administrateur(self, proprietaire, E, x):
        esp = self.espaces.get(E)
        if not esp or esp.proprietaire != proprietaire or x not in esp.administrateurs:
            return non('refus')
        esp.administrateurs.discard(x)
        self._jrnl('revocation_administrateur', proprietaire, E, beneficiaire=x)
        self._ecrit()
        return oui()

    def designer_garde(self, proprietaire, E, x):
        """§ 10.4 : modification tracée de la désignation de garde."""
        esp = self.espaces.get(E)
        if not esp or esp.proprietaire != proprietaire or self._meme(x, proprietaire):
            return non('refus')
        esp.designation_garde = x
        self._jrnl('designation_garde', proprietaire, E, beneficiaire=x)
        self._ecrit()
        return oui()

    def archiver(self, a, E):
        return self._cycle(a, E, 'actif', 'archive')

    def rouvrir(self, a, E):
        r = self._cycle(a, E, 'archive', 'actif')
        if r:
            differes, self.differes_espace = self.differes_espace, []
            for hid, x in differes:                                  # § 9.4 (H-6a) : réévaluées
                h = self.habs[hid]
                if self._active(h) and self._meme_qu_un(x, self._membres(h.beneficiaire)):
                    self._auto_admettre(h, x)
            self._ecrit()
        return r

    def clore_espace(self, a, E):
        esp = self.espaces.get(E)
        if not esp or esp.proprietaire != a or esp.etat == 'clos':
            return non('refus')
        esp.etat = 'clos'
        self._jrnl('cloture_espace', a, E)
        self._ecrit()
        return oui()

    def _cycle(self, a, E, de, vers):
        """§ 5.1 : archivage et réouverture par le propriétaire."""
        esp = self.espaces.get(E)
        if not esp or esp.proprietaire != a or esp.etat != de:
            return non('refus')
        esp.etat = vers
        self._jrnl('cycle_espace', a, E, etat=vers)
        self._ecrit()
        return oui()

    def _fenetre(self, tr):
        return tr.etat == 'presente' and tr.expire_le is not None and self.now < tr.expire_le

    def _fenetre_espace(self, E):
        esp = self.espaces.get(E)
        return bool(esp) and bool(esp.transfert_en_cours) and self._fenetre(self.transferts[esp.transfert_en_cours])

    def _gele(self, E):
        """§ 10.6 (H-4a) : gel par liste d'opérations. La décision ne dépend que de l'espace visé,
        jamais de l'effet de l'opération ni de ce que voit le cessionnaire (CT-26)."""
        return E is not None and self._fenetre_espace(E)

    def _hab_de_l_espace(self, h):
        """§ 10.6 : une habilitation « porte sur l'espace » si elle est institutionnelle, une appartenance,
        ou une HP sur le contenu. Les HP sur des objets personnels ne sont pas des engagements de K."""
        E = self._espace_hab(h)
        if E is None:
            return None
        if h.nature == 'HP' and any(self.objets[i].titulaire is not None
                                    for i in self._ids_bruts(h.perimetre) if i in self.objets):
            return None
        return E

    def _verrouille(self, E, x):
        """§ 10.8 : verrou de réintégration du cédant (personne)."""
        esp = self.espaces.get(E)
        return bool(esp) and any(self._meme(x, c) for c in esp.verrou)

    def _consentement(self, E, x, nature, consommer):
        """§ 10.8 (H-6c) : un consentement vaut pour un seul acte, désigné par sa nature et son
        bénéficiaire. Renvoie vrai si x n'est pas sous verrou, ou si un consentement est disponible."""
        esp = self.espaces.get(E)
        if not self._verrouille(E, x):
            return True
        for c, consentements in esp.verrou.items():
            if self._meme(x, c) and nature in consentements:
                if consommer:
                    consentements.remove(nature)
                return True
        return False

    def consentir_reintegration(self, proprietaire, E, C, nature):
        """§ 10.1, § 10.8 : consentement du propriétaire, pour un acte de la nature désignée."""
        esp = self.espaces.get(E)
        if not esp or esp.proprietaire != proprietaire or nature not in NATURES_CONSENTEMENT:
            return non('refus')
        if self._gele(E):
            return GEL
        cles = [c for c in esp.verrou if self._meme(C, c)]
        if not cles or self._meme(proprietaire, C):
            return non('refus')                                                  # A3
        esp.verrou[cles[0]].append(nature)
        self._jrnl('consentement_reintegration', proprietaire, E, beneficiaire=C, nature=nature)
        self._ecrit()
        return oui()

    # --------------------------------------------------------- nominations
    def _cibles_connues(self, a, ids, E=None, contenu=True):
        """Toutes les cibles existent, relèvent du régime attendu et sont connues de a (§ 7.2, § 15)."""
        for i in ids:
            o = self.objets.get(i)
            if o is None or o.purge or not self._connait(a, o):
                return False
            if E is not None and (o.espace != E or (contenu and o.titulaire is not None)):
                return False
        return True

    def nommer(self, signataire, E, x, role, *, perimetre=None, echeance=None):
        """§ 7.1, § 7.2 : nomination à un rôle scientifique (HI)."""
        esp = self.espaces.get(E)
        if not esp or role not in ROLES or x not in self.acteurs:
            return non('invalide')
        if self._meme(x, signataire):                                           # A3 (personne)
            return non('refus')
        if esp.etat != 'actif':
            return non('refus')
        p = ('objets', frozenset(perimetre)) if perimetre else ('contenu', E)
        if not self._cibles_connues(signataire, self._ids_bruts(p), E):
            return INTROUVABLE                                                  # CM-04
        if self._gele(E):
            return GEL
        ms = [m for m in self._rs_membres(signataire, E) if self._perimetre_inclus(p, m.perimetre)]
        if not ms or not self._etablie(signataire):
            return non('refus')                                                 # gestionnaire (H-5)
        if role == 'RS' and not self._etablie(x):
            return non('refus')                                                 # opération sensible
        borne = None if any(m.echeance is None for m in ms) else max(m.echeance for m in ms)
        if borne is not None and (echeance is None or echeance > borne):
            return non('refus')
        exclusions = self._exclusions_figees(signataire, p, ROLES[role])        # § 7.2 (CM-02, H-1a)
        if exclusions is None:
            return non('refus')
        if not self._consentement(E, x, 'nomination', consommer=False):
            return non('refus')                                                 # § 10.8
        if self._appartenances(x, E) or any(h for h in self.habs.values() if h.type == 'appartenance'
                                             and h.espace == E and h.beneficiaire == ('acteur', x)
                                             and h.etat == 'proposee'):
            return non('invalide')
        if role != 'RS':
            self._consentement(E, x, 'nomination', consommer=True)
        hid = self._id('h')
        self.habs[hid] = Habilitation(hid, 'HI', 'appartenance', E, signataire, ('acteur', x), ROLES[role],
                                      role == 'RS', p, echeance, role=role,
                                      etat='proposee' if role == 'RS' else 'active', exclusions=exclusions,
                                      trace=[(self.now, 'creation', signataire)])
        self._jrnl('nomination', signataire, E, cibles=self._ids_bruts(p), beneficiaire=x, role=role, hab=hid)
        if role != 'RS':
            self._auto_role(E, role, x)
        self._ecrit()
        return oui(hid)

    def accepter_nomination(self, x, hid):
        """T-02 : espace actif (CT-27), verrou (§ 10.8), gel (§ 10.6)."""
        h = self.habs.get(hid)
        if not h or h.beneficiaire != ('acteur', x) or h.etat != 'proposee':
            return non('refus')
        if self._gele(h.espace):
            return GEL
        if self.espaces[h.espace].etat != 'actif':
            return non('refus')
        if not self._consentement(h.espace, x, 'nomination', consommer=False):
            return non('refus')
        self._consentement(h.espace, x, 'nomination', consommer=True)
        h.etat = 'active'
        h.trace.append((self.now, 'acceptation', x))
        self._jrnl('acceptation_nomination', x, h.espace, hab=hid)
        self._auto_role(h.espace, h.role, x)
        self._ecrit()
        return oui()

    def refuser_nomination(self, x, hid):
        h = self.habs.get(hid)
        if not h or h.beneficiaire != ('acteur', x) or h.etat != 'proposee':
            return non('refus')
        h.etat = 'close'
        h.trace.append((self.now, 'refus', x))
        self._ecrit()
        return oui()

    def quitter(self, x, E):
        """§ 7.6 : départ d'un membre autre que la racine ; les nominations proposées qu'il a signées ou
        qui lui sont adressées sont closes (CT-17)."""
        esp = self.espaces.get(E)
        if not esp:
            return non('invalide')
        if esp.proprietaire == x:
            return non('refus')
        for h in self.habs.values():
            if h.type != 'appartenance' or h.espace != E:
                continue
            if (h.beneficiaire == ('acteur', x) and h.etat in ('active', 'suspendue', 'proposee')) or \
                     (h.auteur == x and h.etat == 'proposee'):
                h.etat = 'close'
                h.trace.append((self.now, 'depart', x))
        esp.administrateurs.discard(x)
        for g in self.groupes.values():
            if g.espace == E:
                g.membres.pop(x, None)
        for rs in self._rs_de(E):
            self._notifier(rs, ('depart', E, x))
        self._jrnl('depart', x, E)
        self._ecrit()
        return oui()

    # --------------------------------------------------------- objets
    def _droit_de_creer(self, a, E):
        """§ 6.2 : appartenance collaborateur ou RS ; invité avec `proposer`."""
        roles = {m.role for m in self._appartenances(a, E)}
        if roles & {'RS', 'collaborateur'}:
            return 'objet'
        if 'invite' in roles:
            for h in self.habs.values():
                if (h.type == 'delegation' and h.nature == 'HI' and h.espace == E and self._active(h)
                        and 'proposer' in h.actions and h.perimetre == ('contenu', E)
                        and self._beneficie(a, h, self.now, frozenset(), 0) is not False):
                    return 'proposition'
        return None

    def creer_objet(self, a, E, *, personnel=False, titre='', type_='objet', **attrs):
        esp = self.espaces.get(E)
        if not esp or esp.etat != 'actif':
            return non('refus')
        droit = self._droit_de_creer(a, E)
        if droit is None:
            return non('refus')
        oid = self._id('o')
        o = Objet(oid, E, a if personnel and droit == 'objet' else None,
                  'prive' if personnel and droit == 'objet' else 'projet', titre=titre, type=type_,
                  est_proposition=(droit == 'proposition'), paternite=a, **attrs)
        self.objets[oid] = o
        self._jrnl('creation_objet', a, E, cibles=[oid], prive_de=o.titulaire)
        self._ecrit()
        return oui(oid)

    def donner_mandat(self, deposant, lanceur, E):
        """§ 6.2 : mandat de lancement d'un import (CT-31)."""
        if E not in self.espaces or self._droit_de_creer(deposant, E) != 'objet':
            return non('refus')
        self.espaces[E].mandats.add((deposant, lanceur))
        return oui()

    def importer(self, lanceur, E, deposant, *, droits_declares=True, n=1, titre='import'):
        """§ 6.2 : le déposant est titulaire ; lancer n'est pas créer ; mandat requis."""
        if deposant is None:
            return non('refus')                     # pas d'objet personnel sans titulaire
        if E not in self.espaces:
            return non('refus')
        if lanceur != deposant and (deposant, lanceur) not in self.espaces[E].mandats:
            return non('refus')
        if not droits_declares or self._droit_de_creer(deposant, E) != 'objet':
            return non('refus')
        ids = []
        for i in range(n):
            r = self.creer_objet(deposant, E, personnel=True, titre=f'{titre} {i}')
            if not r:
                return r
            ids.append(r.valeur)
        self._jrnl('import', lanceur, E, cibles=ids, prive_de=deposant)
        return oui(ids)

    def creer_amorcage(self, acteur_institutionnel, E, titre):
        """§ 6.1 : amorçage du référentiel commun, visibilité publique, sans titulaire."""
        if self.acteurs[acteur_institutionnel].personne is not None or self.espaces[E].proprietaire != acteur_institutionnel:
            return non('refus')
        oid = self._id('o')
        self.objets[oid] = Objet(oid, E, None, 'public', titre=titre, diffusable=True)
        self._jrnl('amorcage', acteur_institutionnel, E, cibles=[oid])
        self._ecrit()
        return oui(oid)

    def agir(self, a, oid, action, finalite=None):
        """Exécuter une action sur une cible (§ 13.8)."""
        r = self.acces(a, oid, action, finalite)
        if r and action in ECRITURE:
            o = self.objets[oid]
            self._jrnl('action', a, o.espace, cibles=[oid], prive_de=o.titulaire, action=action)
        return r

    def valider_personnellement(self, a, oid):
        """§ 6.1 : validation personnelle du titulaire, sans effet scientifique."""
        o = self.objets.get(oid)
        if not o or o.purge or not self._connait(a, o):
            return INTROUVABLE
        if o.titulaire != a:
            return non('refus')
        o.validation_personnelle = True
        return oui()

    def contribuer_core(self, a, oid):
        return self.agir(a, oid, 'contribuer_core')

    def _redistribuable(self, o):
        """§ 13.11, DI-A41 : condition de redistribution d'une copie réutilisée."""
        return not o.reutilisee or (o.licence_redistribution and not o.droit_tiers_oppose
                                    and not self._protections(o) and not self._non_levable(o)
                                    and not self._sensible(o))

    def modifier_visibilite(self, a, oid, v):
        """§ 13.2 (E-5)."""
        o = self.objets.get(oid)
        if not o or o.purge or not self._connait(a, o):
            return INTROUVABLE
        ordre_perso = ['prive', 'communaute', 'public']
        ordre_cont = ['projet', 'communaute', 'public']
        if o.titulaire is not None:
            if o.titulaire != a:
                return non('refus')
            if v not in ordre_perso:
                return non('refus')                     # `projet` : versement (§ 6.3)
            ordre = ordre_perso
        else:
            if not any(self._membre_couvre(m, o) for m in self._rs_membres(a, o.espace)):
                return non('refus')
            if v not in ordre_cont:
                return non('refus')                     # jamais sous `projet`
            ordre = ordre_cont
        elargit = ordre.index(v) > ordre.index(o.visibilite)
        if elargit:
            if self._gele(o.espace):
                return GEL                                      # § 10.6
            if self.espaces[o.espace].etat != 'actif':
                return non('refus')                     # § 5.1 (CT-20)
            if v in ('communaute', 'public') and not o.diffusable:
                return non('refus')
            if not self._redistribuable(o) or not self._executable(a, o, 'voir'):
                return non('refus')
        ancienne = o.visibilite
        o.visibilite = v
        if not elargit and v != ancienne:
            self.avis.append(('audience_reduite', o.id, ancienne, v))   # § 13.2 (CM-23)
        self._jrnl('visibilite', a, o.espace, cibles=[oid], prive_de=o.titulaire, de=ancienne, vers=v)
        self._ecrit()
        return oui()

    def verser(self, titulaire, oid, rs, *, reprises=None):
        """§ 6.3 : versement au contenu de l'espace, avec l'accord d'un RS."""
        o = self.objets.get(oid)
        if not o or o.purge or o.titulaire != titulaire:
            return non('refus')
        if self._gele(o.espace):
            return GEL                                                  # § 10.6
        if self.espaces[o.espace].etat != 'actif' or self._meme(rs, titulaire):
            return non('refus')
        ms = [m for m in self._rs_membres(rs, o.espace)
              if m.perimetre[0] == 'contenu' or oid in m.perimetre[1]]
        if not ms:
            return non('refus')
        if any(p.type == 'gel_succession' for p in self._protections(o)):
            return non('refus')
        reprises = reprises or {}
        anciennes = {h.id: h for h in self.habs.values() if h.nature == 'HP' and h.auteur == titulaire
                     and h.etat == 'active' and oid in self._objets_du_perimetre(h.perimetre)}
        nouvelles = []
        for hid, spec in reprises.items():
            h = anciennes.get(hid)
            if h is None:
                return non('invalide')
            actions = frozenset(spec.get('actions', h.actions))
            echeance = spec.get('echeance', h.echeance)
            if not actions <= h.actions or not actions <= ROLES['RS'] or not _ech_le(echeance, h.echeance):
                return non('refus')                                     # CM-06 : à l'identique ou plus étroite
            if h.beneficiaire[0] == 'acteur' and self._meme(h.beneficiaire[1], rs):
                return non('refus')                                     # A3
            nouvelles.append((hid, h, actions, echeance))
        o.titulaire = None
        o.paternite = titulaire
        if o.visibilite == 'prive':
            o.visibilite = 'projet'
        for h in anciennes.values():
            h.etat = 'close'
            h.trace.append((self.now, 'versement', titulaire))
        for hid, h, actions, echeance in nouvelles:
            nh = self._id('h')
            self.habs[nh] = Habilitation(nh, 'HI', 'delegation', o.espace, rs, h.beneficiaire, actions,
                                         h.repartager, h.perimetre, echeance, mode=h.mode, reemission_de=hid,
                                         perimetre_signataire=ms[0].perimetre, trace=[(self.now, 'reprise', rs)])
        self._jrnl('versement', titulaire, o.espace, cibles=[oid], accord=rs)
        self._ecrit()
        return oui()

    def renoncer(self, titulaire, oid, *, sort, rs=None):
        """§ 6.3 : la renonciation impose un sort (versement ou purge)."""
        o = self.objets.get(oid)
        if not o or o.purge or o.titulaire != titulaire:
            return non('refus')
        if sort == 'versement' and rs is not None:
            return self.verser(titulaire, oid, rs)
        if sort == 'purge':
            return self._purger(titulaire, o)
        return non('refus')

    def _purge_autorisee(self, o):
        """§ 6.3 (CT-30)."""
        return not (o.conservation_obligatoire
                    or any(p.type in ('restriction_legale', 'gel_succession') for p in self._protections(o)))

    def _purger(self, auteur, o):
        if not self._purge_autorisee(o):
            return non('refus')
        o.purge = True
        self._jrnl('purge', auteur, o.espace, cibles=[o.id], prive_de=o.titulaire)
        self._ecrit()
        return oui()

    # --------------------------------------------------------- délégations
    def deleguer(self, auteur, beneficiaire, actions, perimetre, *, repartager=False, echeance=None,
                 mode=None, condition_rattachement=None, echeance_hors_ligne=None, _lot=None):
        """§ 2.1, § 7.2 (HI) et § 8.1 (HP) : créer une délégation (T-01)."""
        t = self.now
        actions = frozenset(actions)
        if not actions or not actions <= set(ACTIONS):
            return non('invalide')
        p = perimetre
        if p[0] == 'objets':
            p = ('objets', frozenset(p[1]))
        if p[0] == 'selection' and p[1] not in self.selections:
            return INTROUVABLE
        if p[0] == 'contenu' and p[1] not in self.espaces:
            return INTROUVABLE
        if not self._cibles_connues(auteur, self._ids_bruts(p) if p[0] != 'selection' else set()):
            return INTROUVABLE
        objs = self._objets_du_perimetre(p)
        if len({self._regime(self.objets[i]) for i in objs}) > 1:                   # G-5
            return non('refus')
        E = self._espace_du_perimetre(p)
        if E is None:
            return non('refus')
        contenu = all(self.objets[i].titulaire is None for i in objs)
        if contenu and self._gele(E):
            return GEL                                                              # § 10.6
        if beneficiaire[0] == 'acteur' and self._meme(beneficiaire[1], auteur):     # A3 (personne)
            return non('refus')
        if self.espaces[E].etat != 'actif':                                         # § 5.1, § 8.1.7
            if contenu or not all(self.objets[i].titulaire == auteur for i in objs):
                return non('refus')
        if condition_rattachement is not None and condition_rattachement not in self.rattachements:
            return non('refus')
        nature = 'HP'
        ms = []
        if contenu and actions <= ROLES['RS']:
            ms = [m for m in self._rs_membres(auteur, E) if self._perimetre_inclus(p, m.perimetre)]
            if ms:
                nature = 'HI'
        if _lot is not None and ('valider' in actions or repartager or echeance is None):
            return non('refus')                                                     # § 13.4
        exclusions = self._exclusions_figees(auteur, p, actions)                    # § 2.5 (G-7, H-1a)
        if exclusions is None:
            return non('refus')
        if nature == 'HI':
            borne = None if any(m.echeance is None for m in ms) else max(m.echeance for m in ms)
            if borne is not None and (echeance is None or echeance > borne):
                return non('refus')                                                 # A1 durée
        else:
            try:
                cov = self._couverture(auteur, p, actions, t)
            except EchecEvaluation:
                return INTROUVABLE
            if cov is False:
                return non('refus')
            if cov is not None and (echeance is None or echeance > cov):
                return non('refus')                                                 # condition 4
            if beneficiaire[0] == 'acteur' and self._meme_qu_un(beneficiaire[1], self._amont(auteur, objs)):
                return non('refus')                                                 # cycle (§ 8.2)
        if beneficiaire[0] == 'public':                                             # § 13.1
            titulaire_de_tout = objs and all(self.objets[i].titulaire == auteur for i in objs)
            if p[0] not in ('objet', 'objets') or not (nature == 'HI' or titulaire_de_tout):
                return non('refus')
            if not all(self.objets[i].diffusable for i in objs) or not actions <= ACTIONS_PUBLIC:
                return non('refus')
        if not all(self._redistribuable(self.objets[i]) for i in objs if self.objets[i].titulaire == auteur):
            return non('refus')                                                     # § 13.11
        consentir = beneficiaire[0] == 'acteur' and contenu
        if consentir and not self._consentement(E, beneficiaire[1], nature, consommer=False):
            return non('refus')                                                     # § 10.8
        ouvert = beneficiaire[0] in ('groupe', 'role')
        if ouvert:
            mode = mode or 'approbation'
            if mode not in ('approbation', 'notification'):
                return non('invalide')
            if mode == 'notification' and p[0] in ('objet', 'objets') and objs and \
                     all(self._exigeante(self.objets[i]) for i in objs):
                return non('refus')                                                 # § 9.3 (H-6b)
        else:
            mode = None
        if consentir:
            self._consentement(E, beneficiaire[1], nature, consommer=True)
        hid = self._id('h')
        h = Habilitation(hid, nature, 'delegation', E, auteur, beneficiaire, actions,
                         repartager, p, echeance, mode=mode, condition_rattachement=condition_rattachement,
                         lot=_lot, echeance_hors_ligne=echeance_hors_ligne,
                         perimetre_signataire=(ms[0].perimetre if nature == 'HI' else None),
                         exclusions=exclusions, trace=[(t, 'creation', auteur)])
        if nature == 'HP':
            h.fondateurs = {auteur: echeance}
        self.habs[hid] = h
        self._jrnl('delegation', auteur, E, cibles=self._ids_bruts(p), prive_de=self._prive_de(h),
                   hab=hid, nature=nature)
        if mode == 'notification':
            for x in self._membres(beneficiaire):
                self._auto_admettre(h, x)
        self._ecrit()
        return oui(hid)

    def _amont(self, a, objs, vus=None):
        """Acteurs situés en amont des droits de a sur objs, à toute profondeur (§ 8.2, cycles) :
        fondateurs des HP de sa chaîne, et auteurs des admissions qui la portent."""
        vus = set() if vus is None else vus
        res = set()
        for i in objs:
            for fs in self._fondements(a, self.objets[i]).values():
                for f in fs:
                    amont = set()
                    if f.admission is not None and ('adm', f.admission) not in vus:
                        vus.add(('adm', f.admission))
                        admetteur = self.admissions[f.admission].admis_par
                        if admetteur is not None:
                            amont.add(admetteur)
                    if f.nature == 'HP' and f.ref not in vus:
                        vus.add(f.ref)
                        amont |= set(self.habs[f.ref].fondateurs)
                    for g in amont:
                        res.add(g)
                        res |= self._amont(g, objs, vus)
        return res

    def _perimetre_visible(self, a, p):
        """Périmètre réduit aux cibles que a peut savoir exister (§ 10.3, § 15).
        None si toutes les cibles explicites sont cachées."""
        if p[0] not in ('objet', 'objets'):
            return p
        ids = {i for i in self._ids_bruts(p) if i in self.objets}
        vis = frozenset(i for i in ids if not self._existence_cachee(a, self.objets[i]))
        if ids and not vis:
            return None
        return ('objet', next(iter(vis))) if p[0] == 'objet' else ('objets', vis)

    def _ligne_listable(self, a, h):
        """L'habilitation figure-t-elle dans les métadonnées de gouvernance lues par a ? (§ 10.3)"""
        E = self._espace_hab(h)
        if E is None or not self._lecteur_gouvernance(a, E):
            return False
        if self._perimetre_visible(a, h.perimetre) is None:
            return False
        tit = {self.objets[i].titulaire for i in self._ids_bruts(h.perimetre) if i in self.objets} - {None}
        return not (h.nature == 'HP' and tit and tit != {a})

    def _hab_connue(self, a, h):
        """§ 7.4, § 15 : a connaît-il l'existence de l'habilitation ?"""
        if a is None:
            return False
        if self._ligne_listable(a, h):
            return True
        ids = [i for i in self._ids_bruts(h.perimetre) if i in self.objets]
        if ids:
            return any(self._connait(a, self.objets[i]) for i in ids)
        E = self._espace_hab(h)
        return E is not None and (self._membre_espace(a, E) or h.beneficiaire == ('acteur', a)
                                  or self._meme(a, h.auteur) or a in h.fondateurs)

    def _peut_clore(self, a, h, restreindre=False):
        """§ 7.4 (HI) et § 8.3 (HP) ; le bénéficiaire clôt mais ne restreint pas (CT-15)."""
        if h.nature == 'SYS':
            return False
        if h.beneficiaire == ('acteur', a) and not restreindre:
            return True
        E = h.espace
        if h.nature == 'HI':
            if self._est_racine(a, E):
                return True
            signataire_rs = h.auteur == a and bool(self._rs_membres(a, E))
            if h.type == 'appartenance' and h.role == 'RS':
                return signataire_rs
            return signataire_rs or any(self._perimetre_inclus(h.perimetre, m.perimetre)
                                        for m in self._rs_membres(a, E))
        if h.auteur == a:
            return True
        objs = self._objets_du_perimetre(h.perimetre)
        if objs and all(self.objets[i].titulaire == a for i in objs):
            return True
        if objs and all(self.objets[i].titulaire is None for i in objs) and E is not None:
            return any(self._perimetre_inclus(h.perimetre, m.perimetre) for m in self._rs_membres(a, E))
        if h.perimetre[0] == 'contenu':
            return any(m.perimetre == h.perimetre for m in self._rs_membres(a, h.perimetre[1]))
        return False

    def clore(self, a, hid):
        """T-09."""
        h = self.habs.get(hid)
        if not h or not self._hab_connue(a, h):
            return INTROUVABLE
        if h.etat not in ('active', 'suspendue', 'proposee'):
            return non('refus')
        if not self._peut_clore(a, h):
            return non('refus')
        h.etat = 'close'
        h.trace.append((self.now, 'cloture', a))
        self._jrnl('cloture', a, self._espace_hab(h), cibles=self._ids_bruts(h.perimetre), hab=hid,
                   prive_de=self._prive_de(h))
        self._ecrit()
        return oui()

    def _prive_de(self, h):
        tit = {self.objets[i].titulaire for i in self._ids_bruts(h.perimetre) if i in self.objets}
        tit.discard(None)
        return tit.pop() if tit else None

    def restreindre(self, a, hid, *, actions=None, echeance=None, perimetre=None):
        """T-05 : comme la clôture, sauf le bénéficiaire ; inclusion stricte (actions, périmètre,
        échéance) (CM-20)."""
        h = self.habs.get(hid)
        if not h or not self._hab_connue(a, h):
            return INTROUVABLE
        if not self._active(h) or not self._peut_clore(a, h, restreindre=True):
            return non('refus')
        if actions is not None and (not actions or not frozenset(actions) <= h.actions):
            return non('invalide')
        if echeance is not None and h.echeance is not None and echeance > h.echeance:
            return non('invalide')
        if perimetre is not None:
            if perimetre[0] not in ('objet', 'objets'):
                return non('invalide')
            ids = {perimetre[1]} if perimetre[0] == 'objet' else set(perimetre[1])
            servis = self._objets_du_perimetre(h.perimetre) - h.exclusions
            if not ids or not ids <= servis or not self._cibles_connues(a, ids):
                return non('invalide')
            perimetre = ('objet', next(iter(ids))) if len(ids) == 1 else ('objets', frozenset(ids))
        if actions is not None:
            h.actions = frozenset(actions)
        if echeance is not None:
            h.echeance = echeance
            for f in h.fondateurs:
                h.fondateurs[f] = _ech_min(h.fondateurs[f], echeance)
        if perimetre is not None:
            h.perimetre = perimetre
        h.trace.append((self.now, 'restriction', a))
        self._jrnl('restriction', a, self._espace_hab(h), cibles=self._ids_bruts(h.perimetre), hab=hid,
                   prive_de=self._prive_de(h))
        self._ecrit()
        return oui()

    def _profite(self, a, h):
        """CT-03 : a (personne) est bénéficiaire de h, ou membre admis de l'ensemble bénéficiaire."""
        b = h.beneficiaire
        if b[0] == 'acteur':
            return self._meme(a, b[1])
        return any(adm.hab == h.id and adm.etat == 'active' and self._meme(adm.acteur, a)
                   for adm in self.admissions.values())

    def _acte_ferme(self, a, h, objs):
        """§ 5.1 (CM-03, CM-04) : dans un espace archivé ou clos, prolongation et confirmation sont
        fermées sur le contenu, et réservées au titulaire sur ses objets personnels."""
        E = self._espace_hab(h)
        if E is None or self.espaces[E].etat == 'actif':
            return False
        return not objs or not all(self.objets[i].titulaire == a for i in objs)

    def prolonger(self, a, hid, echeance):
        """T-04 : jamais à son profit (CT-03) ; § 2.5 (H-1a) ; § 5.1 ; gel."""
        h = self.habs.get(hid)
        if not h or not self._hab_connue(a, h):
            return INTROUVABLE
        if self._gele(self._hab_de_l_espace(h)):
            return GEL
        if not self._active(h) or h.nature == 'SYS' or h.etat != 'active':
            return non('refus')                                                   # A4
        if self._profite(a, h):
            return non('refus')                                                   # A3 (CT-03)
        E = self._espace_hab(h)
        objs = self._objets_du_perimetre(h.perimetre) - h.exclusions
        if self._acte_ferme(a, h, objs):
            return non('refus')
        nouvelles = self._exclusions_figees(a, h.perimetre, h.actions)            # G-7, H-1a
        if nouvelles is None:
            return non('refus')
        if h.nature == 'HI':
            ms = [m for m in self._rs_membres(a, h.espace) if self._perimetre_inclus(h.perimetre, m.perimetre)]
            if not ms:
                return non('refus')
            borne = None if any(m.echeance is None for m in ms) else max(m.echeance for m in ms)
            if borne is not None and (echeance is None or echeance > borne):
                return non('refus')
            h.echeance = echeance
            h.exclusions = h.exclusions | nouvelles
        else:
            cov = self._couverture(a, h.perimetre, h.actions, self.now, frozenset({h.id}))
            if cov is False or (cov is not None and (echeance is None or echeance > cov)):
                return non('refus')
            h.fondateurs[a] = echeance
            h.excl_fondateurs[a] = frozenset(h.excl_fondateurs.get(a, frozenset()) | nouvelles)
            h.echeance = None if any(v is None for v in h.fondateurs.values()) else max(h.fondateurs.values())
        h.trace.append((self.now, 'prolongation', a))
        self._jrnl('prolongation', a, E, cibles=self._ids_bruts(h.perimetre), hab=hid, prive_de=self._prive_de(h))
        self._ecrit()
        return oui()

    def confirmer(self, a, hid):
        """T-06 : confirmation d'une HP, refusée si elle crée un cycle (§ 8.2), à son profit (CT-03), ou
        dans un espace archivé ou clos hors du titulaire (CM-04)."""
        h = self.habs.get(hid)
        if not h or not self._hab_connue(a, h):
            return INTROUVABLE
        if self._gele(self._hab_de_l_espace(h)):
            return GEL
        if h.nature != 'HP' or not self._active(h) or a in h.fondateurs:
            return non('refus')
        if self._profite(a, h):
            return non('refus')                                                   # A3 (CT-03)
        objs = self._objets_du_perimetre(h.perimetre) - h.exclusions
        if self._acte_ferme(a, h, objs):
            return non('refus')
        nouvelles = self._exclusions_figees(a, h.perimetre, h.actions)            # G-7, H-1a
        if nouvelles is None:
            return non('refus')
        cov = self._couverture(a, h.perimetre, h.actions, self.now, frozenset({h.id}))
        if cov is False:
            return non('refus')
        h.fondateurs[a] = _ech_min(cov, max((v for v in h.fondateurs.values() if v is not None), default=None)
                                   if all(v is not None for v in h.fondateurs.values()) else None)
        h.excl_fondateurs[a] = nouvelles
        h.trace.append((self.now, 'confirmation', a))
        self._jrnl('confirmation', a, self._espace_hab(h), cibles=self._ids_bruts(h.perimetre), hab=hid,
                   prive_de=self._prive_de(h))
        self._ecrit()
        return oui()

    def retirer_fondement(self, a, hid):
        """T-12."""
        h = self.habs.get(hid)
        if not h or not self._hab_connue(a, h):
            return INTROUVABLE
        if h.nature != 'HP' or a not in h.fondateurs or not self._active(h):
            return non('refus')
        del h.fondateurs[a]
        h.trace.append((self.now, 'retrait_fondement', a))
        if not h.fondateurs:
            h.etat = 'close'
        self._ecrit()
        return oui()

    def mettre_en_examen(self, a, hid):
        """§ 7.5, T-07 : suspension immédiate par la racine."""
        h = self.habs.get(hid)
        if not h or not self._hab_connue(a, h):
            return INTROUVABLE
        if h.nature != 'HI' or not self._active(h) or not self._est_racine(a, h.espace):
            return non('refus')
        h.etat = 'suspendue'
        h.trace.append((self.now, 'mise_en_examen', a))
        self._jrnl('mise_en_examen', a, h.espace, cibles=self._ids_bruts(h.perimetre), hab=hid)
        self._ecrit()
        return oui()

    def lever_examen(self, a, hid):
        """T-08 : confirmation par la racine ; ce n'est pas une résurrection (A4)."""
        h = self.habs.get(hid)
        if not h or not self._hab_connue(a, h):
            return INTROUVABLE                                                    # CM-16, C-19
        if self._gele(h.espace):
            return GEL
        if h.etat != 'suspendue' or not self._est_racine(a, h.espace):
            return non('refus')
        if h.echeance is not None and self.now >= h.echeance:
            return non('refus')
        h.etat = 'active'
        h.trace.append((self.now, 'confirmation_examen', a))
        self._jrnl('fin_examen', a, h.espace, cibles=self._ids_bruts(h.perimetre), hab=hid)
        self._ecrit()
        return oui()

    def habs_signees_par(self, racine, E, signataire):
        """§ 7.5 : liste remise à la racine à la révocation d'un RS (traçabilité, A7)."""
        if not self._est_racine(racine, E):
            return non('refus')
        return oui(sorted(h.id for h in self.habs.values() if h.nature == 'HI' and h.espace == E
                          and h.auteur == signataire and h.etat in ('active', 'suspendue')
                          and self._hab_connue(racine, h)))

    # ---------------------------------------------------------------- groupes
    def creer_groupe(self, a, E, gid):
        if not self._administre(a, E) or gid in self.groupes:
            return non('refus')
        self.groupes[gid] = Groupe(gid, E)
        self._jrnl('creation_groupe', a, E, groupe=gid)
        self._ecrit()
        return oui(gid)

    def ajouter_membre(self, a, gid, x):
        """§ 9.1 : par un gestionnaire d'identité établie (H-5), jamais soi-même (personne)."""
        g = self.groupes.get(gid)
        if not g or not self._administre(a, g.espace) or x not in self.acteurs:
            return non('refus')
        if self._gele(g.espace):
            return GEL
        if self._meme(x, a) or not self._etablie(a):
            return non('refus')
        g.membres[x] = a
        self._jrnl('ajout_membre', a, g.espace, groupe=gid, membre=x)
        for h in list(self.habs.values()):
            if h.beneficiaire == ('groupe', gid) and h.mode == 'notification' and self._active(h):
                self._auto_admettre(h, x)
        self._ecrit()
        return oui()

    def retirer_membre(self, a, gid, x):
        g = self.groupes.get(gid)
        if not g or x not in g.membres or not (self._administre(a, g.espace) or a == x):
            return non('refus')
        del g.membres[x]
        self._jrnl('retrait_membre', a, g.espace, groupe=gid, membre=x)
        self._ecrit()
        return oui()

    def _auto_role(self, F, role, x):
        for h in list(self.habs.values()):
            if h.beneficiaire == ('role', F, role) and h.mode == 'notification' and self._active(h):
                self._auto_admettre(h, x)

    def _gestionnaires_exclus(self, E):
        """§ 9.4 : gestionnaires de tout ensemble bénéficiaire, en `notification`, d'une habilitation
        qui porte sur l'espace E (chaînes croisées, G-2)."""
        res = set()
        for h2 in self.habs.values():
            if (h2.type == 'delegation' and h2.mode == 'notification' and h2.etat in ('active', 'suspendue')
                    and h2.beneficiaire[0] in ('groupe', 'role') and self._espace_hab(h2) == E):
                res |= self._gestionnaires(h2.beneficiaire)
        return res

    def _auto_admettre(self, h, x):
        """§ 9.3 et § 9.4 : admission automatique et ses exclusions (F-2, G-2, H-5), par personne.
        Une admission différée est réévaluée à son traitement, mode compris (H-6a)."""
        E = self._espace_hab(h)
        if h.mode != 'notification' or not self._active(h) or h.etat != 'active':
            return
        if not self._etablie(x):
            return
        if self._meme(x, h.auteur):
            return
        if self._meme_qu_un(x, self._gestionnaires(h.beneficiaire)):
            return
        if E is not None and self._meme_qu_un(x, self._gestionnaires_exclus(E)):
            return
        if E is not None and self._verrouille(E, x):
            return
        if (h.id, self._personne(x)) in self.exclusions:
            return
        if any(adm.hab == h.id and self._meme(adm.acteur, x) and adm.etat == 'active'
               for adm in self.admissions.values()):
            return
        if E is not None and self.espaces[E].etat != 'actif':
            self.differes_espace.append((h.id, x))                     # § 5.1 (CT-18)
            return
        if E is not None and self._fenetre_espace(E):
            self.transferts[self.espaces[E].transfert_en_cours].differes.append((h.id, x))
            return
        aid = self._id('a')
        self.admissions[aid] = Admission(aid, h.id, x, None, h.nature, True)
        destinataires = self._rs_de(h.espace) if h.nature == 'HI' else {h.auteur}
        for d in sorted(destinataires):                                    # § 9.3 (CM-32)
            self._notifier(d, ('admission_automatique', h.id, x))
        self._jrnl('admission_automatique', None, E, cibles=self._ids_bruts(h.perimetre), hab=h.id, membre=x,
                   prive_de=self._prive_de(h))

    def _traiter_differes(self, tr):
        differes, tr.differes = tr.differes, []
        for hid, x in differes:                                            # § 9.4 (H-6a) : réévaluées
            h = self.habs[hid]
            if self._active(h) and self._meme_qu_un(x, self._membres(h.beneficiaire)):
                self._auto_admettre(h, x)

    def admettre(self, a, hid, x):
        """§ 9.3 : admission nominative (conditions 1 et 2 du § 8.1, H-1a ; verrou, § 10.8)."""
        h = self.habs.get(hid)
        if not h or not self._hab_connue(a, h):
            return INTROUVABLE
        E = self._espace_hab(h)
        if self._gele(self._hab_de_l_espace(h)):
            return GEL
        if not self._active(h) or h.etat != 'active' or not self._admission_requise(h):
            return non('refus')
        if self._meme(x, a) or self._meme(x, h.auteur):                     # A3, § 9.4
            return non('refus')
        if not self._meme_qu_un(x, self._membres(h.beneficiaire)):
            return non('refus')
        if any(adm.hab == hid and self._meme(adm.acteur, x) and adm.etat == 'active'
               for adm in self.admissions.values()):
            return non('invalide')
        if E is not None and self.espaces[E].etat != 'actif':
            return non('refus')
        if h.nature == 'HI':
            if not any(self._perimetre_inclus(h.perimetre, m.perimetre) for m in self._rs_membres(a, h.espace)):
                return non('refus')
        elif self._couverture(a, h.perimetre, h.actions, self.now, frozenset({h.id})) is False:
            return non('refus')
        exclusions = self._exclusions_figees(a, h.perimetre, h.actions)          # G-7, H-1a
        if exclusions is None:
            return non('refus')
        contenu = self._hab_de_l_espace(h) is not None
        if contenu and not self._consentement(E, x, 'admission', consommer=False):
            return non('refus')                                                   # § 10.8
        if contenu:
            self._consentement(E, x, 'admission', consommer=True)
        aid = self._id('a')
        self.admissions[aid] = Admission(aid, hid, x, a, h.nature, False, exclusions=exclusions | h.exclusions)
        self._jrnl('admission', a, E, cibles=self._ids_bruts(h.perimetre), hab=hid, membre=x,
                   prive_de=self._prive_de(h))
        self._ecrit()
        return oui(aid)

    def _habilitant(self, a, h):
        """§ 8.3 (CM-19) : qui peut retirer une admission. HI : un RS dont le périmètre couvre
        l'habilitation. HP : l'auteur, un fondateur, le titulaire de la cible."""
        if h.nature == 'HI':
            return any(self._perimetre_inclus(h.perimetre, m.perimetre) for m in self._rs_membres(a, h.espace))
        objs = self._objets_du_perimetre(h.perimetre)
        return a == h.auteur or a in h.fondateurs or bool(objs and all(self.objets[i].titulaire == a
                                                                        for i in objs))

    def retirer_admission(self, a, hid, x):
        """§ 9.3 ; l'exclusion du § 9.4 suit le retrait d'une admission existante par l'habilitant."""
        h = self.habs.get(hid)
        if not h or not self._hab_connue(a, h):
            return INTROUVABLE
        if not self._habilitant(a, h):
            return non('refus')
        trouve = False
        for adm in self.admissions.values():
            if adm.hab == hid and self._meme(adm.acteur, x) and adm.etat == 'active':
                adm.etat = 'close'
                trouve = True
        if not trouve:
            return non('refus')
        self.exclusions.add((hid, self._personne(x)))
        self._jrnl('retrait_admission', a, self._espace_hab(h), cibles=self._ids_bruts(h.perimetre), hab=hid,
                   membre=x, prive_de=self._prive_de(h))
        self._ecrit()
        return oui()

    # ---------------------------------------------------- rattachements
    def rattacher(self, admin_sp, admin_g, sp, g):
        """§ 10.2 : décision des deux parties ; aucun droit conféré (§ 13.13)."""
        if not (self._administre(admin_sp, sp) and self._administre(admin_g, g)):
            return non('refus')
        self.rattachements.add((sp, g))
        self._jrnl('rattachement', admin_sp, sp, partie=g)
        self._ecrit()
        return oui()

    def fin_rattachement(self, a, sp, g):
        """T-13 : les habilitations conditionnées sont closes."""
        if (sp, g) not in self.rattachements or not (self._administre(a, sp) or self._administre(a, g)):
            return non('refus')
        self.rattachements.discard((sp, g))
        for h in self.habs.values():
            if h.condition_rattachement == (sp, g) and h.etat in ('active', 'suspendue'):
                h.etat = 'close'
                h.trace.append((self.now, 'fin_rattachement', a))
        self._jrnl('fin_rattachement', a, sp, partie=g)
        self._ecrit()
        return oui()

    def proposer_prise_en_charge(self, a, E, F):
        if not self._administre(a, E):
            return non('refus')
        self.prises_en_charge.add((E, F))
        self._jrnl('prise_en_charge', a, E, partie=F)
        self._ecrit()
        return oui()

    def preparer_invitation(self, a, E, x):
        """§ 10.2 : préparer, sans conférer."""
        if not self._administre(a, E):
            return non('refus')
        self.invitations.append((E, x, a))
        self._jrnl('invitation', a, E, invite=x)
        return oui()

    # ------------------------------------------------------- protections
    def _audit_protection(self, type_, auteur, p, **details):
        """§ 10.3 (CT-20) : les actes sur les protections vont au journal d'audit, jamais aux journaux de
        gouvernance."""
        self.audit.append(dict(t=self.now, type=type_, auteur=auteur, protection=p.id, cible=p.cible, **details))

    def _descendants(self, o):
        """Copies de o, à toute profondeur (§ 13.11)."""
        res, file = [], [o.id]
        vus = {o.id}
        while file:
            cur = file.pop()
            for c in self.objets.values():
                if c.copie_de == cur and c.id not in vus:
                    vus.add(c.id)
                    res.append(c)
                    file.append(c.id)
        return res

    def _heriter(self, p, cible):
        """§ 13.11 (H-3b) : copie d'une protection active sur une copie, mêmes bénéficiaires, agréments,
        destinataires et gardiens, avec le lien « héritée de »."""
        nid = self._id('p')
        self.protections[nid] = Protection(nid, p.type, cible, p.createur, gardiens=set(p.gardiens),
                                           beneficiaires=set(p.beneficiaires),
                                           agrees={g: set(v) for g, v in p.agrees.items()},
                                           destinataires=set(p.destinataires), actions=p.actions,
                                           createurs=p.createurs, autorite_levee=p.autorite_levee,
                                           externe=p.externe, reference=dict(p.reference), fin=p.fin,
                                           herite_de=p.id)
        self._audit_protection('heritage_protection', None, self.protections[nid], origine=p.id)
        return nid

    def creer_protection(self, a, type_, oid, *, beneficiaires=(), destinataires=(), actions=()):
        """§ 11.1 (E-4) ; jamais gelée (§ 10.6) ; propagée aux copies existantes (§ 13.11, H-3b)."""
        o = self.objets.get(oid)
        if not o or o.purge or not self._connait(a, o):
            return INTROUVABLE
        if type_ not in PROTECTIONS_INTERNES:
            return non('invalide')
        autorise = o.titulaire == a or (o.titulaire is None and any(
            self._membre_couvre(m, o) for m in self._rs_membres(a, o.espace)))
        if not autorise or not self._etablie(a):
            return non('refus')                                                   # § 11.1 (H-5)
        if self._meme_qu_un(a, destinataires):
            return non('refus')
        if any(b[0] == 'acteur' and not self._etablie(b[1]) for b in beneficiaires):
            return non('refus')                                                   # § 11.3
        if type_ == 'interdiction_action' and not actions:
            return non('invalide')
        pid = self._id('p')
        p = Protection(pid, type_, oid, a, gardiens={a}, beneficiaires=set(beneficiaires),
                       destinataires=set(destinataires), actions=frozenset(actions))
        self.protections[pid] = p
        self._audit_protection('creation_protection', a, p)
        for c in self._descendants(o):
            if not c.purge:
                self._heriter(p, c.id)
        self._ecrit()
        return oui(pid)

    def _protection_pour(self, a, pid):
        """Protection gérée par a (gardien, personne) ; sinon refus, ou introuvable si a n'en connaît pas
        la cible (§ 15)."""
        p = self.protections.get(pid)
        if not p or p.etat != 'active':
            return None, INTROUVABLE
        o = self.objets.get(p.cible)
        if not o or o.purge:
            return None, INTROUVABLE
        if not self._meme_qu_un(a, p.gardiens):
            return None, (non('refus') if self._connait(a, o) else INTROUVABLE)
        return p, None

    def ajouter_beneficiaire(self, a, pid, beneficiaire):
        p, err = self._protection_pour(a, pid)
        if err is not None:
            return err
        if self._gele(self.objets[p.cible].espace):
            return GEL
        if p.type not in ('embargo_existence', 'embargo_contenu'):
            return non('refus')
        if beneficiaire[0] == 'acteur' and (self._meme(beneficiaire[1], a) or not self._etablie(beneficiaire[1])):
            return non('refus')                                                   # A3, § 11.3
        p.beneficiaires.add(beneficiaire)
        self._audit_protection('beneficiaire_protection', a, p, beneficiaire=beneficiaire)
        self._ecrit()
        return oui()

    def agreer_membre(self, a, pid, gid, x):
        """§ 9.5."""
        p, err = self._protection_pour(a, pid)
        if err is not None:
            return err
        if self._gele(self.objets[p.cible].espace):
            return GEL
        if ('groupe', gid) not in p.beneficiaires or not self._meme_qu_un(x, self.groupes[gid].membres) \
                 or self._meme(x, a) or not self._etablie(x):
            return non('refus')
        p.agrees.setdefault(gid, set()).add(x)
        self._audit_protection('agrement_membre', a, p, groupe=gid, membre=x)
        self._ecrit()
        return oui()

    def ajouter_destinataire(self, a, pid, x):
        """§ 11.4 ; un gardien n'est pas destinataire (CM-23)."""
        p, err = self._protection_pour(a, pid)
        if err is not None:
            return err
        if p.type not in ('interdiction_existence', 'interdiction_action') or self._meme_qu_un(x, p.gardiens):
            return non('refus')
        p.destinataires.add(x)
        self._audit_protection('destinataire_protection', a, p, destinataire=x)
        self._ecrit()
        return oui()

    def designer_gardien(self, a, pid, x):
        """§ 11.2 : parmi les acteurs d'identité établie qui détiennent un droit de contenu sur la cible
        (sur l'ascendant, pour une protection héritée) ; jamais un destinataire (CM-23)."""
        p, err = self._protection_pour(a, pid)
        if err is not None:
            return err
        if self._gele(self.objets[p.cible].espace):
            return GEL
        ref = self._objet_de_reference(p)
        if self._meme(x, a) or not self._etablie(x) or ref is None or not self._a_un_droit(x, ref) \
                 or self._meme_qu_un(x, p.destinataires):
            return non('refus')
        p.gardiens.add(x)
        self._audit_protection('designation_gardien', a, p, gardien=x)
        self._ecrit()
        return oui()

    def lever_protection(self, a, pid):
        """§ 11.5 : par un gardien seulement ; la levée sur un ascendant ne lève pas les protections
        héritées (§ 13.11)."""
        p, err = self._protection_pour(a, pid)
        if err is not None:
            return err
        if self._gele(self.objets[p.cible].espace):
            return GEL
        if p.type not in PROTECTIONS_INTERNES:
            return non('refus')
        p.etat = 'levee'
        self._audit_protection('levee_protection', a, p)
        self._ecrit()
        return oui()

    def designer_gardien_orphelin(self, approbateurs, pid, x, demandeur=None):
        """§ 11.2 : protection orpheline ; deux approbateurs ; saisine par signalement ou par demande."""
        p = self.protections.get(pid)
        if not p or p.etat != 'active' or p.gardiens or p.type not in PROTECTIONS_INTERNES:
            return non('refus')
        o = self.objets[p.cible]
        if self._gele(o.espace):
            return GEL
        if demandeur is None:
            if not p.orpheline_signalee:
                return non('refus')                                               # passage en cours (F-03)
        elif not (o.titulaire == demandeur or (o.titulaire is None and self._rs_membres(demandeur, o.espace))):
            return non('refus')
        if not self._deux_independants(approbateurs, x, [o]):
            return non('refus')
        ref = self._objet_de_reference(p)
        if not self._etablie(x) or ref is None or not self._a_un_droit(x, ref) \
                 or self._meme_qu_un(x, p.destinataires):
            return non('refus')
        p.gardiens.add(x)
        self.audit.append(dict(t=self.now, type='designation_gardien_orphelin', protection=pid, gardien=x,
                               approbateurs=tuple(approbateurs), renforce=p.type in EXISTENCE))
        self._ecrit()
        return oui()

    # ------------------------------------------------ restrictions légales
    def creer_restriction_legale(self, approbateurs, oid, *, autorite_levee, nature='', fondement='',
                                 portee='', fin=None):
        """§ 11.6 : restriction interne."""
        o = self.objets.get(oid)
        if not o or o.purge:
            return non('refus')
        if not self._deux_independants(approbateurs, None, [o]):
            return non('refus')
        if autorite_levee is None or self._meme_qu_un(autorite_levee, approbateurs):
            return non('refus')                                                   # A3
        pid = self._id('p')
        self.protections[pid] = Protection(pid, 'restriction_legale', oid, None, createurs=frozenset(approbateurs),
                                           autorite_levee=autorite_levee, fin=fin,
                                           reference=dict(nature=nature, fondement=fondement, portee=portee,
                                                          fin=fin, autorite=autorite_levee))
        self.audit.append(dict(t=self.now, type='restriction_legale', protection=pid))
        self._ecrit()
        return oui(pid)

    def enregistrer_restriction_externe(self, autorite, oid, *, fin=None, reference=None):
        """§ 11.6 : restriction externe, levée par son émetteur (CT-23)."""
        o = self.objets.get(oid)
        if not o or autorite not in self.autorites_externes:
            return non('refus')
        pid = self._id('p')
        self.protections[pid] = Protection(pid, 'restriction_legale', oid, None, createurs=frozenset({autorite}),
                                           autorite_levee=autorite, externe=True, fin=fin,
                                           reference=dict(reference or {}))
        self._ecrit()
        return oui(pid)

    def lever_restriction_legale(self, a, pid):
        p = self.protections.get(pid)
        if not p or p.type != 'restriction_legale' or p.etat != 'active' or a != p.autorite_levee:
            return non('refus')
        p.etat = 'levee'
        self.audit.append(dict(t=self.now, type='levee_restriction_legale', protection=pid, par=a))
        self._ecrit()
        return oui()

    def contester(self, a, pid):
        p = self.protections.get(pid)
        if not p or p.type != 'restriction_legale' or p.etat != 'active':
            return non('refus')
        o = self.objets[p.cible]
        if not (o.titulaire == a or (o.titulaire is None and self._rs_membres(a, o.espace))):
            return non('refus')
        p.contestation = 'en_examen'
        self._ecrit()
        return oui()

    def examiner_contestation(self, approbateurs, pid, issue):
        p = self.protections.get(pid)
        if not p or p.contestation != 'en_examen' or issue not in ('maintien', 'annulation'):
            return non('refus')
        if any(self._meme_qu_un(s, p.createurs) for s in approbateurs):
            return non('refus')
        if not self._deux_independants(approbateurs, None, [self.objets[p.cible]]):
            return non('refus')
        p.contestation = 'maintenue' if issue == 'maintien' else 'annulee'
        if issue == 'annulation':
            p.etat = 'levee'
        self._ecrit()
        return oui()

    # ------------------------------------------------- décès et succession (G-9)
    def _comptes(self, x):
        """Comptes de la personne de x (§ 1)."""
        return [c for c in self.acteurs if self._meme(c, x)]

    def _dossier_defunt(self, x):
        """§ 10.4, § 12.7 : tous les objets et espaces de tous les comptes de la personne."""
        comptes = self._comptes(x)
        objets = [o for o in self.objets.values() if o.titulaire in comptes and not o.purge]
        espaces = {o.espace for o in objets} | {E for E, esp in self.espaces.items() if esp.proprietaire in comptes}
        return objets, espaces

    def constater_deces(self, approbateurs, x):
        """§ 10.4 (G-9, H-5) : constat pour une personne ; gel de ses objets personnels non publics dans
        tous les espaces ; perte de la qualité de gardien (CT-14)."""
        act = self.acteurs.get(x)
        if not act or act.decede or act.personne is None:
            return non('refus')
        objets, espaces = self._dossier_defunt(x)
        if not self._deux_independants(approbateurs, x, objets, espaces):
            return non('refus')
        comptes = self._comptes(x)
        for c in comptes:
            self.acteurs[c].decede = True
            self.acteurs[c].actif = False
        for o in objets:
            if o.visibilite != 'public':
                pid = self._id('p')
                self.protections[pid] = Protection(pid, 'gel_succession', o.id, None,
                                                   createurs=frozenset(approbateurs))
        for p in self.protections.values():
            if p.etat == 'active' and p.type in PROTECTIONS_INTERNES:
                p.gardiens -= set(comptes)
        self.audit.append(dict(t=self.now, type='constat_deces', acteur=x, approbateurs=tuple(approbateurs)))
        self._ecrit()
        return oui()

    def decider_succession(self, approbateurs, oid, sort, *, ayant_droit=None, rs=None, fondement=''):
        """§ 10.4 : sort d'un objet gelé : maintien, purge, versement, changement de titulaire. Le dossier
        est celui du défunt (CM-22)."""
        o = self.objets.get(oid)
        gels = [p for p in self.protections.values() if p.cible == oid and p.type == 'gel_succession'
                and p.etat == 'active']
        if not o or not gels or not fondement:
            return non('refus')
        objets, espaces = self._dossier_defunt(o.titulaire) if o.titulaire else ([o], {o.espace})
        if not self._deux_independants(approbateurs, ayant_droit, objets, espaces):
            return non('refus')
        if sort == 'maintien':
            return oui()
        if sort == 'purge':
            if o.conservation_obligatoire or any(p.type == 'restriction_legale' for p in self._protections(o)):
                return non('refus')
            for p in gels:
                p.etat = 'levee'
            o.purge = True
        elif sort == 'versement':
            if self._gele(o.espace):
                return GEL                                                        # § 10.6
            if not rs or not self._rs_membres(rs, o.espace):
                return non('refus')
            for p in gels:
                p.etat = 'levee'
            o.paternite = o.paternite or o.titulaire
            self._clore_hp_de(o.titulaire, oid, 'succession')
            o.titulaire = None
            if o.visibilite == 'prive':
                o.visibilite = 'projet'
        elif sort == 'titulaire':
            if ayant_droit is None or ayant_droit not in self.acteurs:
                return non('refus')
            o.ayant_droit_propose = ayant_droit
        else:
            return non('invalide')
        self.audit.append(dict(t=self.now, type='decision_succession', objet=oid, sort=sort))
        self._ecrit()
        return oui()

    def accepter_succession_objet(self, x, oid):
        o = self.objets.get(oid)
        if not o or o.ayant_droit_propose != x:
            return INTROUVABLE
        for p in self.protections.values():
            if p.cible == oid and p.type == 'gel_succession' and p.etat == 'active':
                p.etat = 'levee'
        self._clore_hp_de(o.titulaire, oid, 'succession')
        o.titulaire = x
        o.ayant_droit_propose = None
        self._ecrit()
        return oui()

    def _clore_hp_de(self, auteur, oid, motif):
        for h in self.habs.values():
            if h.nature == 'HP' and h.auteur == auteur and h.etat == 'active' and \
                    oid in self._objets_du_perimetre(h.perimetre):
                h.etat = 'close'
                h.trace.append((self.now, motif, None))

    # ---------------------------------------------------------- dérogation
    def _conflit(self, s, objets, espaces=()):
        concernes = {o.espace for o in objets} | set(espaces)
        for E in concernes:
            esp = self.espaces.get(E)
            if esp and (self._meme(esp.proprietaire, s) or self._meme_qu_un(s, esp.administrateurs)
                        or any(self._appartenances(c, E) for c in self.acteurs if self._meme(c, s))):
                return True
        return any(o.id in self.acteurs[c].liens_objets for o in objets for c in self.acteurs if self._meme(c, s))

    def _approbateur_valide(self, s, beneficiaire, objets, espaces=()):
        return (s in self.autorite_derogation and self._etablie(s)
                and not (beneficiaire is not None and self._meme(s, beneficiaire))
                and not self._conflit(s, objets, espaces))

    def _subordination(self, s1, s2):
        comptes1 = [c for c in self.acteurs if self._meme(c, s1)]
        comptes2 = [c for c in self.acteurs if self._meme(c, s2)]
        return any(c2 in self.acteurs[c1].subordonnes for c1 in comptes1 for c2 in comptes2) or \
            any(c1 in self.acteurs[c2].subordonnes for c1 in comptes1 for c2 in comptes2)

    def _deux_independants(self, approbateurs, beneficiaire, objets, espaces=()):
        """§ 12.7, pour toute approbation du contrat."""
        approbateurs = tuple(approbateurs)
        if len(approbateurs) != 2:
            return False
        s1, s2 = approbateurs
        if self._meme(s1, s2):
            return False
        if not all(self._approbateur_valide(s, beneficiaire, objets, espaces) for s in (s1, s2)):
            return False
        return not self._subordination(s1, s2)

    INFRANCHISSABLE = 99

    def _niveau_requis(self, a, o, t, finalite):
        """§ 12.3 : calculé à l'instant de l'évaluation. Renvoie (approbateurs requis, protections dont
        l'accord d'un gardien est requis). Un gel exige la finalité `succession` (CT-15) ; une protection
        orpheline qui frappe le bénéficiaire n'est franchie par aucune dérogation."""
        existence = self._existence_protections(a, o, t)
        internes = self._restrictions_internes(a, o, None, t)
        if any(p.type in PROTECTIONS_INTERNES and not p.gardiens for p in existence + internes):
            return self.INFRANCHISSABLE, []
        gel = any(p.type == 'gel_succession' for p in existence)
        if gel and finalite != 'succession':
            return self.INFRANCHISSABLE, []
        deux = ((o.titulaire is not None and o.visibilite != 'public') or self._sensible(o)
                or bool(internes) or bool(existence) or finalite not in FINALITES_UN_APPROBATEUR)
        return (2 if deux else 1), [p for p in existence if p.type != 'gel_succession']

    def _derogation_applicable(self, a, o, op, t, finalite):
        for d in self.derogations.values():
            if d.etat != 'active' or not self._meme(d.beneficiaire, a) or not (d.debut <= t < d.fin) \
                    or o.id not in d.cibles:
                continue
            if op not in d.operations:
                continue
            if finalite != d.finalite:
                if finalite is not None:                                  # CM-33
                    self.audit.append(dict(t=t, type='hors_finalite', derogation=d.id, acteur=a, cible=o.id))
                continue
            n, prots = self._niveau_requis(a, o, t, d.finalite)
            if len(d.approbateurs) >= n and all(self._meme_qu_un(d.accords_gardiens.get(p.id), p.gardiens)
                                                for p in prots):
                return d
        return None

    def _consecutives(self, beneficiaire, cibles, t):
        """§ 12.6 : dérogations consécutives recoupées, quelle que soit la finalité (G-11, personne)."""
        return [d for d in self.derogations.values() if self._meme(d.beneficiaire, beneficiaire)
                and d.cibles & cibles and t < d.fin + CARENCE_RENOUVELLEMENT]

    def accorder_derogation(self, approbateurs, beneficiaire, cibles, operations, finalite, justification,
                            duree, *, accords_gardiens=None):
        """§ 12."""
        t = self.now
        cibles = frozenset(cibles)
        ops = frozenset(operations)
        if finalite not in FINALITES[FINALITES_VERSION]:
            return non('refus')                                                   # G-11
        if 'voir' not in ops or not ops <= {'voir', 'exporter'}:
            return non('refus')                                                   # § 12.4, I-13
        if duree <= 0 or duree > DUREE_MAX_DEROGATION:
            return non('refus')
        objets = [self.objets.get(c) for c in cibles]
        if not objets or any(o is None or o.purge for o in objets):
            return non('refus')
        approbateurs = tuple(approbateurs)
        if len(approbateurs) == 1:
            if not self._approbateur_valide(approbateurs[0], beneficiaire, objets):
                return non('refus')
        elif not self._deux_independants(approbateurs, beneficiaire, objets):
            return non('refus')
        if any(self._non_levable(o) for o in objets):
            return non('refus')
        accords = dict(accords_gardiens or {})
        for pid, g in accords.items():
            p = self.protections.get(pid)
            if not p or not self._meme_qu_un(g, p.gardiens):
                return non('refus')
        for o in objets:
            n, prots = self._niveau_requis(beneficiaire, o, t, finalite)
            if len(approbateurs) < n or not all(self._meme_qu_un(accords.get(p.id), p.gardiens) for p in prots):
                return non('refus')
        cons = self._consecutives(beneficiaire, cibles, t)
        rang = 1 + max(d.rang for d in cons) if cons else 0                      # § 12.6 (CT-16)
        if rang > RENOUVELLEMENTS_MAX:
            return non('refus')
        if cons and (not justification or any(justification == d.justification for d in cons)):
            return non('refus')
        pred = max(cons, key=lambda d: (d.rang, d.debut)) if cons else None
        did = self._id('d')
        self.derogations[did] = Derogation(did, beneficiaire, cibles, ops, finalite, justification, t, t + duree,
                                           approbateurs, accords, renouvellement_de=pred.id if pred else None,
                                           rang=rang)
        self.audit.append(dict(t=t, type='derogation', derogation=did, approbateurs=approbateurs))
        self._ecrit()
        return oui(did)

    def revoquer_derogation(self, s, did):
        d = self.derogations.get(did)
        if not d or s not in self.autorite_derogation or d.etat != 'active':
            return non('refus')
        d.etat = 'revoquee'
        self._ecrit()
        return oui()

    # ------------------------------------------------------- sélections (G-4)
    def creer_selection(self, a, E, objets, *, masques=()):
        objets = set(objets)
        for i in objets:
            o = self.objets.get(i)
            if not o or o.purge or not self.acces(a, i, 'voir'):
                return INTROUVABLE
            if o.espace != E:
                return non('refus')
        sid = self._id('s')
        self.selections[sid] = Selection(sid, E, a, objets, masques=set(masques))
        self._jrnl('creation_selection', a, E, cibles=objets, selection=sid)
        self._ecrit()
        return oui(sid)

    def _habs_sur(self, sid):
        return [h for h in self.habs.values() if h.perimetre == ('selection', sid) and h.etat in ('active', 'suspendue')]

    def ajouter_a_selection(self, a, sid, oid):
        """§ 13.3 : par l'auteur ; un ajout à une sélection partagée est une proposition."""
        s = self.selections.get(sid)
        o = self.objets.get(oid)
        if not s or s.auteur != a:
            return non('refus')
        if not o or o.purge or not self.acces(a, oid, 'voir'):
            return INTROUVABLE
        if self._gele(s.espace):
            return GEL                                                            # § 10.6
        if o.espace != s.espace:
            return non('refus')
        if self._habs_sur(sid):
            if not self._redistribuable(o):
                return non('refus')                                               # § 13.11
            s.proposition.add(oid)
            self._jrnl('proposition_selection', a, s.espace, cibles=[oid], selection=sid, prive_de=o.titulaire)
            self._ecrit()
            return oui('proposition')
        s.version_active.add(oid)
        self._jrnl('ajout_selection', a, s.espace, cibles=[oid], selection=sid, prive_de=o.titulaire)
        self._ecrit()
        return oui('ajoute')

    def activer_proposition(self, a, sid, oid):
        """§ 13.3 : sur une sélection partagée, par un acteur qui pourrait signer chacune des habilitations
        actives ; sur une sélection non partagée, par son auteur (CT-10)."""
        s = self.selections.get(sid)
        if not s or oid not in s.proposition:
            return non('refus')
        o = self.objets.get(oid)
        if not o or o.purge or not self._connait(a, o):
            return INTROUVABLE
        if self._gele(s.espace):
            return GEL                                                            # § 10.6
        habs = self._habs_sur(sid)
        if not habs and s.auteur != a:
            return non('refus')
        for h in habs:
            if h.nature == 'HI':
                if o.titulaire is not None or o.espace != h.espace:
                    return non('refus')
                if not any(m.perimetre[0] == 'contenu' or oid in m.perimetre[1]
                           for m in self._rs_membres(a, h.espace)):
                    return non('refus')
                if not all(self._executable(a, o, act) for act in h.actions):
                    return non('refus')
            elif not self._peut_deleguer(a, [oid], h.actions):
                return non('refus')
        if not self._redistribuable(o):
            return non('refus')
        s.proposition.discard(oid)
        s.version_active.add(oid)
        self._jrnl('activation_selection', a, s.espace, cibles=[oid], selection=sid, prive_de=o.titulaire)
        self._ecrit()
        return oui()

    def _gere_selection(self, a, s):
        """§ 13.3 (CT-10) : une sélection partagée n'est réduite ou révoquée que par un acteur qui peut
        restreindre chacune des habilitations qui la visent ; une sélection non partagée, par son auteur."""
        habs = self._habs_sur(s.id)
        if not habs:
            return s.auteur == a
        return all(self._hab_connue(a, h) and self._peut_clore(a, h, restreindre=True) for h in habs)

    def reduire_selection(self, a, sid, retirer):
        s = self.selections.get(sid)
        if not s or s.etat != 'active':
            return non('refus')
        if not self._gere_selection(a, s):
            return non('refus')
        s.version_active = s.version_active - set(retirer)
        self._jrnl('reduction_selection', a, s.espace, cibles=set(retirer), selection=sid)
        self._ecrit()
        return oui()

    def revoquer_selection(self, a, sid):
        s = self.selections.get(sid)
        if not s or s.etat != 'active' or not self._gere_selection(a, s):
            return non('refus')
        s.etat = 'revoquee'
        self._jrnl('revocation_selection', a, s.espace, selection=sid)
        self._ecrit()
        return oui()

    # --------------------------------------------------------------- lots
    def creer_lot(self, a, E, objets):
        lid = self._id('l')
        self.lots[lid] = Lot(lid, E, a, set(objets))
        return oui(lid)

    def deleguer_lot(self, a, lid, beneficiaire, actions, *, echeance):
        """§ 13.4 : liste figée à la création."""
        lot = self.lots.get(lid)
        if not lot or lot.etat != 'ouvert' or lot.auteur != a:
            return non('refus')
        r = self.deleguer(a, beneficiaire, actions, ('objets', frozenset(lot.objets)), echeance=echeance,
                          repartager=False, _lot=lid)
        if r:
            lot.habs.add(r.valeur)
        return r

    def ajouter_au_lot(self, a, lid, oid):
        lot = self.lots.get(lid)
        if not lot or lot.auteur != a:
            return non('refus')
        lot.objets.add(oid)
        return oui()

    def clore_lot(self, a, lid):
        lot = self.lots.get(lid)
        if not lot or lot.auteur != a or lot.etat != 'ouvert':
            return non('refus')
        lot.etat = 'clos'
        for hid in lot.habs:
            h = self.habs[hid]
            if h.etat in ('active', 'suspendue'):
                h.etat = 'close'
                h.trace.append((self.now, 'cloture_lot', a))
        self._ecrit()
        return oui()

    def rouvrir_lot(self, a, lid):
        lot = self.lots.get(lid)
        if not lot or lot.auteur != a or lot.etat != 'clos':
            return non('refus')
        lot.etat = 'ouvert'
        self._ecrit()
        return oui()

    # ------------------------------------------------------------- transfert
    def preparer_transfert(self, C, E, K):
        """§ 10.4 : seul le propriétaire transfère ; désignation de garde respectée ; carence (§ 5.6)."""
        esp = self.espaces.get(E)
        if not esp or esp.proprietaire != C or esp.etat == 'clos' or self._meme(C, K) or K not in self.acteurs:
            return non('refus')
        if esp.designation_garde is not None and K != esp.designation_garde:
            return non('refus')
        if any(tr.espace == E and tr.etat in ('prepare', 'presente', 'expire') for tr in self.transferts.values()):
            return non('refus')
        if esp.carence_transfert is not None and self.now < esp.carence_transfert:
            return non('refus')                                                   # § 5.6 (CT-09)
        tid = self._id('t')
        self.transferts[tid] = Transfert(tid, E, C, K)
        return oui(tid)

    def choisir_voie(self, C, tid, oid, voie, *, copie=False):
        """§ 10.5 : voies (a), (b), purge, (g), et copie (c) en complément de (a) ou (b) seulement."""
        tr = self.transferts.get(tid)
        o = self.objets.get(oid)
        if not tr or tr.cedant != C or not o or o.purge or not self._meme(o.titulaire, C) \
                or o.espace != tr.espace:
            return non('refus')
        if voie not in ('a', 'b', 'purge', 'g'):
            return non('invalide')
        if self._fenetre(tr):
            return GEL                                                            # § 10.6
        if tr.etat not in ('prepare', 'expire'):
            return non('refus')
        if copie and voie not in ('a', 'b'):
            return non('refus')                                                   # § 10.5 (F-04)
        if voie == 'b' and self._existence_cachee(tr.cessionnaire, o):
            return non('refus')                                                   # K doit voir l'objet
        tr.voies[oid] = voie
        if copie:
            tr.copies.add(oid)
        else:
            tr.copies.discard(oid)
        return oui()

    def annoncer_reemission(self, C, tid, hid, *, actions=None, echeance='identique', admissions=()):
        """§ 10.5 : réémission annoncée nominativement, à l'identique ou plus étroite, sur des objets d'une
        même voie (a) ou (b) (CT-22) ; admissions ⊆ admissions actives d'origine."""
        tr = self.transferts.get(tid)
        h = self.habs.get(hid)
        if not tr or tr.cedant != C or not h or h.nature != 'HP' or not self._meme(h.auteur, C):
            return non('refus')
        if self._fenetre(tr):
            return GEL                                                            # § 10.6
        if tr.etat not in ('prepare', 'expire') or not self._active(h) or h.etat != 'active':
            return non('refus')
        voies = {tr.voies.get(i) for i in self._ids_bruts(h.perimetre)}
        if voies not in ({'a'}, {'b'}):
            return non('refus')                                                   # CT-22
        actions = frozenset(actions) if actions else h.actions
        echeance = h.echeance if echeance == 'identique' else echeance
        if not actions <= h.actions or not _ech_le(echeance, h.echeance):
            return non('refus')
        actives = {adm.acteur for adm in self.admissions.values() if adm.hab == hid and adm.etat == 'active'}
        if not set(admissions) <= actives:
            return non('refus')                                                   # CM-14
        tr.reemissions[hid] = dict(actions=actions, echeance=echeance, admissions=frozenset(admissions))
        return oui()

    def _objets_personnels(self, C, E):
        """Objets personnels du cédant (personne, H-5) dans l'espace."""
        return [o for o in self.objets.values() if o.titulaire is not None and self._meme(o.titulaire, C)
                and o.espace == E and not o.purge]

    def _effective(self, h):
        """§ 5.2 : une habilitation active est effective si elle n'est pas inopérante."""
        if h.etat != 'active' or not self._active(h):
            return 0
        if h.nature != 'HP':
            return 1
        try:
            return 1 if self._hp_vivante(h, self.now) else 0
        except EchecEvaluation:
            return 0

    def _engagements(self, tr, filtre=True):
        """§ 10.6 : engagements (vue de K) ou, sans filtre, scellé d'audit.
        Renvoie {clé : valeur comparable}."""
        E, K, C = tr.espace, tr.cessionnaire, tr.cedant

        def cache(ids):
            ids = [i for i in ids if i in self.objets]
            return filtre and bool(ids) and all(self._existence_cachee(K, self.objets[i]) for i in ids)

        def perim(h):
            p = h.perimetre
            if p[0] == 'selection':
                servis = {i for i in self._objets_du_perimetre(p) - h.exclusions
                          if not (filtre and self._existence_cachee(K, self.objets[i]))}
                if h.perimetre_signataire:
                    servis = {i for i in servis if self._perimetre_contient(h.perimetre_signataire, self.objets[i])}
                return ('selection', p[1], frozenset(servis))
            if p[0] == 'contenu':
                return p
            q = self._perimetre_visible(K, p) if filtre else p
            return frozenset(self._ids_bruts(q))

        items = {}
        for h in self.habs.values():
            if h.etat not in ('active', 'suspendue', 'proposee'):
                continue
            if h.type == 'appartenance' and h.espace == E:
                if (h.beneficiaire[0] == 'acteur' and self._meme(h.beneficiaire[1], C)) \
                        or cache(self._ids_bruts(h.perimetre)):
                    continue
                items[('app', h.id)] = (h.beneficiaire, h.role, perim(h), h.echeance, RANG_ETAT[h.etat], None,
                                        h.actions, h.repartager, frozenset(), self._effective(h))
            elif h.type == 'delegation':
                ids = self._ids_bruts(h.perimetre)
                if self._espace_hab(h) != E:
                    continue
                if any(self.objets[i].titulaire is not None for i in ids if i in self.objets):
                    continue                                    # HP sur objet personnel : hors vue
                if cache(ids):
                    continue
                items[('hab', h.id)] = ((h.nature, h.auteur), h.beneficiaire, perim(h), h.echeance,
                                        RANG_ETAT[h.etat], RANG_MODE[h.mode], h.actions, h.repartager,
                                        frozenset(h.fondateurs), self._effective(h))
                for adm in self.admissions.values():
                    if adm.hab == h.id and adm.etat == 'active':
                        items[('adm', adm.id)] = (h.id, adm.acteur)
        for g in self.groupes.values():
            if g.espace == E:
                for x in g.membres:
                    items[('membre', g.id, x)] = True
        for x in self.espaces[E].administrateurs:
            if not self._meme(x, C):
                items[('admin', x)] = True
        for oid, v in tr.voies.items():
            if not cache([oid]):
                items[('voie', oid)] = (v, oid in tr.copies)
        for hid, spec in tr.reemissions.items():
            if not cache(self._ids_bruts(self.habs[hid].perimetre)):
                items[('reem', hid)] = (spec['actions'], spec['echeance'], spec['admissions'])
        for p in self.protections.values():
            o = self.objets.get(p.cible)
            if o is None or o.espace != E or p not in self._protections(o) or o.titulaire is not None:
                continue
            if filtre and self._existence_cachee(K, o):
                continue
            items[('prot', p.id)] = (p.type, p.cible)
        return items

    def _couvert(self, courant, presente):
        """§ 10.6 (G-3, H-4a) : les engagements courants sont-ils couverts par ceux présentés ?
        Une protection présentée qui existe toujours mais n'est plus visible de K est un retrait (CT-18) ;
        une protection levée, échue ou annulée est un élargissement."""
        for k, v in courant.items():
            if k[0] == 'prot':
                continue
            if k not in presente:
                return False
            w = presente[k]
            if k[0] in ('app', 'hab'):
                ident_c, ben_c, per_c, ech_c, et_c, mo_c, act_c, rep_c, fond_c, eff_c = v
                ident_p, ben_p, per_p, ech_p, et_p, mo_p, act_p, rep_p, fond_p, eff_p = w
                if ident_c != ident_p or ben_c != ben_p:
                    return False
                if isinstance(per_c, frozenset) and isinstance(per_p, frozenset):
                    if not per_c <= per_p:
                        return False
                elif isinstance(per_c, tuple) and per_c[0] == 'selection' and isinstance(per_p, tuple) \
                        and per_p[0] == 'selection':
                    if per_c[1] != per_p[1] or not per_c[2] <= per_p[2]:
                        return False
                elif per_c != per_p:
                    return False
                if not _ech_le(ech_c, ech_p) or et_c > et_p or (mo_c or 0) > (mo_p or 0):
                    return False
                if not act_c <= act_p or (rep_c and not rep_p):
                    return False
                if not fond_c <= fond_p or eff_c > eff_p:
                    return False
            elif k[0] == 'reem':
                if not v[0] <= w[0] or not _ech_le(v[1], w[1]) or not v[2] <= w[2]:
                    return False
            elif v != w:
                return False
        for k in presente:
            if k[0] == 'prot' and k not in courant:
                p = self.protections.get(k[1])
                o = self.objets.get(p.cible) if p else None
                if p is None or o is None or o.purge or p not in self._protections(o):
                    return False                                          # une levée élargit
        return True

    @staticmethod
    def _empreinte(items):
        return hashlib.sha256(repr(sorted(items.items(), key=repr)).encode()).hexdigest()

    def _apercu(self, tr):
        K, E = tr.cessionnaire, tr.espace
        return sorted(o.id for o in self.objets.values() if o.espace == E and not o.purge
                      and (o.titulaire is None or tr.voies.get(o.id) in ('a', 'b'))
                      and not self._existence_cachee(K, o) and not self._restrictions_internes(K, o, 'voir'))

    def _sceller(self, tr):
        self.scelles[(tr.id, tr.presentations)] = self._engagements(tr, filtre=False)

    def presenter(self, C, tid):
        """§ 10.6 : seul le cédant présente (et présente de nouveau), dans la limite de PRESENTATIONS_MAX."""
        tr = self.transferts.get(tid)
        if not tr or tr.cedant != C or tr.etat not in ('prepare', 'expire'):
            return non('refus')
        if self.espaces[tr.espace].etat == 'clos':
            return non('refus')
        if tr.presentations >= PRESENTATIONS_MAX:
            return non('refus')                                                   # § 5.6 (CT-09)
        manquants = [o.id for o in self._objets_personnels(C, tr.espace) if o.id not in tr.voies]
        if manquants:
            self._notifier(C, ('blocage', tid, tuple(sorted(manquants))))
            return non('blocage', tuple(sorted(manquants)))     # cause donnée au cédant seulement
        tr.etat = 'presente'
        tr.presente = self._engagements(tr)
        tr.empreinte = self._empreinte(tr.presente)
        self._sceller(tr)
        tr.presentations += 1
        tr.expire_le = self.now + EXPIRATION_PRESENTATION
        self.espaces[tr.espace].transfert_en_cours = tr.id
        self._ecrit()
        return oui(tr.empreinte)

    def vue_transfert(self, K, tid):
        tr = self.transferts.get(tid)
        if not tr or tr.cessionnaire != K or tr.etat != 'presente':
            return INTROUVABLE
        return oui(dict(engagements=sorted(tr.presente.items(), key=repr), empreinte=tr.empreinte,
                        apercu=self._apercu(tr), total_engagements=len(tr.presente)))

    def accepter_objet(self, K, tid, oid):
        tr = self.transferts.get(tid)
        if not tr or tr.cessionnaire != K or tr.voies.get(oid) != 'b':
            return INTROUVABLE
        if self._existence_cachee(K, self.objets[oid]):
            return INTROUVABLE
        tr.acceptes_b.add(oid)
        return oui()

    def annuler_transfert(self, C, tid):
        """§ 5.6 : après PRESENTATIONS_MAX présentations, l'annulation ouvre la carence (CT-09)."""
        tr = self.transferts.get(tid)
        if not tr or tr.cedant != C or tr.etat not in ('prepare', 'presente', 'expire'):
            return non('refus')
        tr.etat = 'annule'
        esp = self.espaces[tr.espace]
        esp.transfert_en_cours = None
        if tr.presentations >= PRESENTATIONS_MAX:
            esp.carence_transfert = self.now + CARENCE_TRANSFERT
        self._ecrit()
        return oui()

    def accepter_transfert(self, K, tid, empreinte):
        """§ 10.7 : une seule transaction (I-11)."""
        tr = self.transferts.get(tid)
        if not tr or tr.cessionnaire != K:
            return INTROUVABLE
        if tr.etat == 'expire':
            return non('expiree')
        if tr.etat != 'presente':
            return non('refus')
        if self.espaces[tr.espace].etat == 'clos':
            return non('refus')                                                   # CT-19
        if empreinte != tr.empreinte:
            return non('renouvelee')
        if not self._couvert(self._engagements(tr), tr.presente):        # G-3
            tr.etat = 'expire'
            self.espaces[tr.espace].transfert_en_cours = None
            self._notifier(tr.cedant, ('presentation_a_renouveler', tid))
            self._ecrit()
            return non('renouvelee')
        E, C = tr.espace, tr.cedant
        for o in self._objets_personnels(C, E):
            v = tr.voies.get(o.id)
            ok_ = v is not None
            if v == 'b':
                ok_ = o.id in tr.acceptes_b and not self._existence_cachee(K, o) and not self._non_levable(o)
            elif v == 'purge':
                ok_ = self._purge_autorisee(o)
            if ok_ and o.id in tr.copies:
                ok_ = v in ('a', 'b') and o.licence_copie and not self._protections(o) and not self._non_levable(o)
            if not ok_:
                self._notifier(C, ('blocage', tid, o.id))           # cause signalée au cédant seulement
                return non('blocage')
        maintenues = {}
        for hid, spec in tr.reemissions.items():
            h = self.habs[hid]
            if not self._active(h) or h.etat != 'active':
                continue                                             # abandonnée (CT-09)
            if not spec['actions'] <= h.actions or not _ech_le(spec['echeance'], h.echeance):
                return non('refus')
            voies = {tr.voies.get(i) for i in self._ids_bruts(h.perimetre)}
            if voies == {'a'}:
                if not spec['actions'] <= ROLES['RS']:
                    return non('refus')
            elif voies == {'b'}:
                if not spec['actions'] <= ACTIONS_TITULAIRE:
                    return non('refus')
            else:
                return non('refus')
            maintenues[hid] = spec
        instantane = copy.deepcopy(self.__dict__)
        try:
            self._appliquer_transfert(tr, maintenues)
        except Exception:
            self.__dict__.clear()
            self.__dict__.update(instantane)
            raise
        return oui()

    def _appliquer_transfert(self, tr, maintenues):
        E, C, K = tr.espace, tr.cedant, tr.cessionnaire
        esp = self.espaces[E]
        t = self.now
        comptes_c = set(self._comptes(C))
        courant = self._engagements(tr)
        retraits = sorted(k for k in tr.presente if k not in courant)

        def est_c(b):
            return b[0] == 'acteur' and b[1] in comptes_c

        for h in self.habs.values():
            if h.etat not in ('active', 'suspendue', 'proposee'):
                continue
            if h.type == 'appartenance' and h.espace == E and (est_c(h.beneficiaire) or h.beneficiaire == ('acteur', K)):
                h.etat = 'close'
                h.trace.append((t, 'transfert', None))
            elif h.type == 'delegation' and est_c(h.beneficiaire) and self._hab_de_l_espace(h) == E:
                h.etat = 'close'                                     # contenu seulement (CT-28)
                h.trace.append((t, 'transfert', None))
        esp.proprietaire = K
        esp.administrateurs -= comptes_c
        esp.administrateurs.discard(K)
        self._racine(E, K)
        for g in self.groupes.values():
            if g.espace == E:
                for c in comptes_c:
                    g.membres.pop(c, None)
        for adm in self.admissions.values():
            if adm.acteur in comptes_c and adm.etat == 'active' and self._hab_de_l_espace(self.habs[adm.hab]) == E:
                adm.etat = 'close'
        voie_b = {oid for oid, v in tr.voies.items() if v == 'b'}
        for p in self.protections.values():
            o = self.objets.get(p.cible)
            if not o or o.espace != E or p.type not in PROTECTIONS_INTERNES:
                continue
            etait_gardien = bool(p.gardiens & comptes_c)
            p.gardiens -= comptes_c
            p.beneficiaires -= {('acteur', c) for c in comptes_c}
            for ens in p.agrees.values():
                ens -= comptes_c
            if etait_gardien and o.id in voie_b:
                p.gardiens.add(K)
        objets_c = self._objets_personnels(C, E)
        ids_c = {o.id for o in objets_c}
        anciennes_hp = [h for h in self.habs.values() if h.nature == 'HP' and h.auteur in comptes_c
                        and h.etat == 'active' and set(self._ids_bruts(h.perimetre)) & ids_c]
        for o in objets_c:
            v = tr.voies[o.id]
            if o.id in tr.copies:
                cid = self._copie(o, o.titulaire)
                self._jrnl('copie_autonome', C, self.objets[cid].espace, cibles=[cid], prive_de=o.titulaire,
                           origine=o.id)
            if v == 'a':
                o.paternite = o.paternite or o.titulaire
                o.titulaire = None
                if o.visibilite == 'prive':
                    o.visibilite = 'projet'
            elif v == 'b':
                o.paternite = o.paternite or o.titulaire
                o.titulaire = K
            elif v == 'purge':
                o.purge = True
        for h in anciennes_hp:
            if any(tr.voies.get(i) in ('a', 'b', 'purge') for i in self._ids_bruts(h.perimetre)):
                h.etat = 'close'
                h.trace.append((t, 'transfert', None))
        for hid, spec in maintenues.items():
            h = self.habs[hid]
            voies = {tr.voies.get(i) for i in self._ids_bruts(h.perimetre)}
            nature = 'HI' if voies == {'a'} else 'HP'
            nh = self._id('h')
            self.habs[nh] = Habilitation(nh, nature, 'delegation', E, K, h.beneficiaire, spec['actions'],
                                         h.repartager, h.perimetre, spec['echeance'], mode=h.mode,
                                         reemission_de=hid, perimetre_signataire=(('contenu', E) if nature == 'HI'
                                                                                  else None),
                                         trace=[(t, 'reemission', K)])
            if nature == 'HP':
                self.habs[nh].fondateurs = {K: spec['echeance']}
            actives = {adm.acteur for adm in self.admissions.values() if adm.hab == hid and adm.etat == 'active'}
            for x in spec['admissions']:
                if x not in actives or self._meme(x, K) or (hid, self._personne(x)) in self.exclusions:
                    continue
                if nature == 'HI' and (self._verrouille(E, x) or self._meme(x, C)):
                    continue                                         # § 10.5 : verrou (§ 10.8)
                aid = self._id('a')
                self.admissions[aid] = Admission(aid, nh, x, K, nature, False)
        for c in list(esp.verrou):
            esp.verrou[c] = []                                       # consentements caducs (H-6c)
        esp.verrou[C] = []
        tr.etat = 'accepte'
        esp.transfert_en_cours = None
        if retraits:
            self._notifier(K, ('retraits_depuis_presentation', tr.id, tuple(retraits)))
        self._traiter_differes(tr)
        self._jrnl('transfert', K, E, cedant=C)
        self._ecrit()

    def _copie(self, o, titulaire, *, reutilisee=False, E=None):
        """Copie liée par FILIATION (A7) ; la sensibilité est héritée (§ 13.11, H-3b)."""
        act = self.acteurs[titulaire]
        if E is None:
            if act.espace_personnel is None:
                self.creer_espace(titulaire, f'perso-{titulaire}', personnel=True)
            E = act.espace_personnel
        cid = self._id('o')
        self.objets[cid] = Objet(cid, E, titulaire, 'prive', titre=o.titre, type=o.type,
                                 licence_redistribution=o.licence_redistribution,
                                 droit_tiers_oppose=o.droit_tiers_oppose, copie_de=o.id, reutilisee=reutilisee,
                                 paternite=o.paternite, sensible=self._sensible(o))
        return cid

    # ------------------------------------------------------------ succession
    def ouvrir_succession(self, approbateurs, E, *, fondement_legal=None):
        """§ 10.4 : procédure distincte, qui aboutit à un transfert ordinaire, présenté avec son scellé
        d'audit (CM-22) ; voie (g) pour les objets du défunt ; dossier : l'espace et tous les objets et
        espaces du défunt."""
        esp = self.espaces.get(E)
        if not esp:
            return non('refus')
        C = esp.proprietaire
        if self.acteurs[C].actif:
            return non('refus')
        beneficiaire = esp.designation_garde or fondement_legal
        if beneficiaire is None or beneficiaire not in self.acteurs:
            return non('refus')
        if any(tr.espace == E and tr.etat in ('prepare', 'presente') for tr in self.transferts.values()):
            return non('refus')
        objets_defunt, espaces_defunt = self._dossier_defunt(C)
        objets = [o for o in self.objets.values() if o.espace == E] + objets_defunt
        if not self._deux_independants(approbateurs, beneficiaire, objets, {E} | espaces_defunt):
            return non('refus')
        tid = self._id('t')
        tr = Transfert(tid, E, C, beneficiaire)
        self.transferts[tid] = tr
        for o in self._objets_personnels(C, E):
            tr.voies[o.id] = 'g'
        tr.etat = 'presente'
        tr.presente = self._engagements(tr)
        tr.empreinte = self._empreinte(tr.presente)
        self._sceller(tr)
        tr.presentations += 1
        tr.expire_le = self.now + EXPIRATION_PRESENTATION
        esp.transfert_en_cours = tid
        self.audit.append(dict(t=self.now, type='ouverture_succession', espace=E, transfert=tid,
                               approbateurs=tuple(approbateurs)))
        self._ecrit()
        return oui(tid)

    # ------------------------------------------------------ observations (§ 15)
    def rechercher(self, a, terme=''):
        return sorted(o.id for o in self.objets.values()
                      if not o.purge and terme in o.titre and self.acces(a, o.id, 'voir'))

    def compter(self, a, *, espace=None, type_=None):
        return len([o for o in self.objets.values() if not o.purge and (espace is None or o.espace == espace)
                    and (type_ is None or o.type == type_) and self.acces(a, o.id, 'voir')])

    def rendre(self, a, oid):
        """§ 14 étape 7 : rendu filtré (DI-L16, DI-L21)."""
        r = self.acces(a, oid, 'voir')
        if not r:
            return r
        o = self.objets[oid]
        return oui(dict(id=o.id, titre=o.titre, type=o.type,
                        mentions=sorted(m for m in o.mentions if self.acces(a, m, 'voir')),
                        relations=sorted(m for m in o.relations if self.acces(a, m, 'voir')),
                        filiation=o.copie_de if o.copie_de and self.acces(a, o.copie_de, 'voir') else None))

    def relations(self, a, oid):
        r = self.rendre(a, oid)
        return oui(r.valeur['relations']) if r else r

    def exporter(self, a, oids):
        objs = sorted(i for i in oids if self.acces(a, i, 'exporter'))
        return oui(dict(objets=[self.rendre(a, i).valeur for i in objs if self.rendre(a, i)], total=len(objs)))

    def exporter_espace(self, a, E):
        return self.exporter(a, [o.id for o in self.objets.values() if o.espace == E and not o.purge])

    def ecrire_reference(self, a, src, cible):
        """§ 15 : même erreur pour une cible invisible ou inexistante (TI-11)."""
        r = self.acces(a, src, 'editer')
        if not r:
            return r
        if not self.acces(a, cible, 'voir'):
            return INTROUVABLE
        self.objets[src].relations.add(cible)
        self._ecrit()
        return oui()

    def _lecteur_gouvernance(self, a, E):
        return self._administre(a, E) or bool(self._rs_membres(a, E))

    def lister_habilitations(self, a, E):
        """§ 10.3 (liste fermée : les protections n'y figurent pas)."""
        if not self._lecteur_gouvernance(a, E):
            return non('refus')
        lignes = []
        for h in self.habs.values():
            if self._espace_hab(h) != E or not self._ligne_listable(a, h):
                continue
            pv = self._perimetre_visible(a, h.perimetre)
            cible = (pv[0], pv[1] if pv[0] != 'objets' else tuple(sorted(pv[1])))
            lignes.append(dict(id=h.id, nature=h.nature, auteur=h.auteur, beneficiaire=h.beneficiaire,
                               actions=tuple(sorted(h.actions)), etat=h.etat, echeance=h.echeance, cible=cible))
        return oui(dict(lignes=sorted(lignes, key=lambda x: x['id']), total=len(lignes)))

    def journaux(self, a, E):
        """§ 10.3 : journaux de gouvernance, après exclusion."""
        if not self._lecteur_gouvernance(a, E):
            return non('refus')
        lignes = []
        for e in self.journal:
            if e['espace'] != E or (e['prive_de'] is not None and e['prive_de'] != a):
                continue
            cibles = {i for i in e['cibles'] if i in self.objets}
            vis = tuple(sorted(i for i in cibles if not self._existence_cachee(a, self.objets[i])))
            if cibles and not vis:
                continue
            lignes.append((e['id'], e['type'], e['auteur'], vis))
        return oui(dict(lignes=lignes, total=len(lignes)))

    def expliquer_acces(self, lecteur, x, oid):
        """§ 10.3, OB-24 : jamais pour une cible dont l'existence est protégée pour le lecteur."""
        o = self.objets.get(oid)
        if not o or o.purge or self._existence_cachee(lecteur, o):
            return INTROUVABLE
        if o.titulaire is not None and o.titulaire != lecteur:
            return INTROUVABLE
        if not (self._lecteur_gouvernance(lecteur, o.espace) or lecteur == x):
            return INTROUVABLE if not self._connait(lecteur, o) else non('refus')
        fs = self._fondements(x, o)
        return oui({act: sorted((f.nature, f.ref) for f in v) for act, v in fs.items()})

    def diffuser(self, a, pub, *, canal, audience, destinataires, resultat='ok', contenu=''):
        o = self.objets.get(pub)
        if not o or not self.acces(a, pub, 'voir') or not self._rs_membres(a, o.espace):
            return non('refus')
        self.diffusions.append(dict(espace=o.espace, publication=pub, date=self.now, canal=canal,
                                    audience=audience, nombre=destinataires, resultat=resultat, contenu=contenu))
        return oui()

    def lister_diffusions(self, a, E):
        if not self._lecteur_gouvernance(a, E):
            return non('refus')
        return oui([dict(date=d['date'], canal=d['canal'], audience=d['audience'], nombre=d['nombre'],
                         resultat=d['resultat']) for d in self.diffusions if d['espace'] == E
                    and d['publication'] in self.objets
                    and not self._existence_cachee(a, self.objets[d['publication']])])

    # --------------------------------------------------------------- unicités
    def creer_base(self, a, assertion, portee):
        """§ 13.7."""
        if not self.acces(a, assertion, 'voir'):
            return INTROUVABLE
        o = self.objets[assertion]
        if portee == 'privee':
            cle = ('privee', a, assertion)
        elif portee == 'projet':
            if self.espaces[o.espace].etat != 'actif' or not self._membre_espace(a, o.espace) or \
                    not any(self.acces(a, assertion, act) for act in ECRITURE):
                return non('refus')                                               # CM-22
            cle = ('projet', o.espace, assertion)
        else:
            return non('invalide')
        if cle in self.bases:
            return non('conflit', self.bases[cle])
        bid = self._id('b')
        self.bases[cle] = bid
        return oui(bid)

    # ------------------------------------------------------------------ séries
    def creer_serie(self, a, E):
        if not self._administre(a, E):
            return non('refus')
        sid = self._id('sr')
        self.series[sid] = dict(espace=E, rangs={})
        return oui(sid)

    def _rang_occupe(self, a, s, rang):
        """§ 13.6 (H-6e) : un rang n'est occupé, pour a, que par une publication qu'il voit."""
        return any(self.acces(a, pub, 'voir') for pub in s['rangs'].get(rang, []))

    def inserer_serie(self, a, serie, pub, rang):
        """§ 13.6 : voir la publication ; réponse uniforme pour une publication invisible ou inexistante."""
        s = self.series.get(serie)
        if not s:
            return non('refus')
        o = self.objets.get(pub)
        if not o or not self.acces(a, pub, 'voir'):
            return INTROUVABLE
        if not (self._administre(a, o.espace) or self._rs_membres(a, o.espace)):
            return non('refus')
        if self._rang_occupe(a, s, rang):
            return non('refus')
        if o.espace == s['espace']:
            s['rangs'].setdefault(rang, []).append(pub)
            return oui('insere')
        if self._gele(s['espace']):
            return GEL                                                            # § 10.2, § 10.6
        iid = self._id('i')
        self.insertions[iid] = dict(serie=serie, pub=pub, rang=rang, etat='en_attente')
        return non('refus', iid)

    def accepter_insertion(self, a, iid):
        ins = self.insertions.get(iid)
        if not ins or ins['etat'] != 'en_attente':
            return non('refus')
        s = self.series[ins['serie']]
        if not self._administre(a, s['espace']) or self._rang_occupe(a, s, ins['rang']):
            return non('refus')
        s['rangs'].setdefault(ins['rang'], []).append(ins['pub'])
        ins['etat'] = 'acceptee'
        return oui()

    def lire_serie(self, a, serie):
        """§ 13.6 : chaque acteur ne voit que les publications qu'il connaît."""
        s = self.series.get(serie)
        if not s:
            return non('refus')
        return oui({r: sorted(p for p in pubs if self.acces(a, p, 'voir'))
                    for r, pubs in sorted(s['rangs'].items())
                    if any(self.acces(a, p, 'voir') for p in pubs)})

    # --------------------------------------------------------------- campagnes
    def creer_campagne(self, a, E, participants):
        """participants : {nom de la personne : acteur relié ou None}."""
        if not self._rs_membres(a, E):
            return non('refus')
        cid = self._id('c')
        self.campagnes[cid] = dict(espace=E, phase='independante', participants=dict(participants), reponses={})
        return oui(cid)

    def repondre(self, a, cid, texte):
        """§ 13.14 : une participation exige une personne reliée à un acteur identifié."""
        c = self.campagnes.get(cid)
        if not c or a is None or a not in c['participants'].values() or self.acteurs[a].personne is None:
            return non('refus')
        c['reponses'][a] = texte
        return oui()

    def consulter_reponses(self, a, cid):
        c = self.campagnes.get(cid)
        if not c or a not in c['participants'].values():
            return non('refus')
        if c['phase'] == 'independante':
            return oui({k: v for k, v in c['reponses'].items() if k == a})
        return oui(dict(c['reponses']))

    # --------------------------------------------------------------- hors ligne
    def fixer_echeance_locale(self, a, E, jours):
        """§ 13.9 : jamais au-delà du plafond de la plateforme."""
        if not self._administre(a, E) or jours > ECHEANCE_HORS_LIGNE_MAX or jours <= 0:
            return non('refus')
        self.espaces[E].echeance_locale = jours
        self._ecrit()
        return oui()

    def _donnee_protegee(self, o):
        return not (o.visibilite == 'public' and o.licence_redistribution and not o.droit_tiers_oppose
                    and not self._protections(o))

    def activer_replication(self, a, appareil, E, *, sans_echeance=False):
        """§ 13.9 : accès ordinaire seulement, jamais une dérogation (G-11)."""
        esp = self.espaces.get(E)
        if not esp or esp.replication == 'interdite':
            return non('refus')
        objs = [o for o in self.objets.values() if o.espace == E and not o.purge
                and self._acces_ordinaire(a, o.id, 'voir')]
        if sans_echeance and any(self._donnee_protegee(o) for o in objs):
            return non('refus')
        ap = self.appareils.setdefault(appareil, Appareil(appareil, a))
        if ap.acteur != a:
            return non('refus')
        for o in objs:
            ap.replique[o.id] = None if not self._donnee_protegee(o) else self.now + self._echeance_locale(a, o)
        return oui(sorted(ap.replique))

    def _echeance_locale(self, a, o):
        jours = min(ECHEANCE_HORS_LIGNE_MAX, self.espaces[o.espace].echeance_locale)
        for fs in self._fondements(a, o).values():
            for f in fs:
                if f.nature in ('HI', 'HP'):
                    ehl = self.habs[f.ref].echeance_hors_ligne
                    if ehl is not None:
                        jours = min(jours, ehl)
        return jours

    def consulter_hors_ligne(self, appareil, oid):
        """Résidu reconnu : aucune vérification serveur avant l'échéance (§ 13.9)."""
        ap = self.appareils.get(appareil)
        if not ap or oid not in ap.replique:
            return INTROUVABLE
        ech = ap.replique[oid]
        if ech is not None and self.now >= ech:
            return INTROUVABLE
        return oui()

    def contribuer_hors_ligne(self, appareil, oid, action, delta):
        ap = self.appareils.get(appareil)
        if not self.consulter_hors_ligne(appareil, oid):
            return INTROUVABLE
        cid = self._id('k')
        c = Contribution(cid, ap.acteur, oid, action, delta, self.now)
        ap.contributions.append(cid)
        self.contributions[cid] = c
        return oui(cid)

    def synchroniser(self, appareil):
        """§ 13.8, § 13.9 : retraits d'abord, puis réception et intégration réévaluée."""
        ap = self.appareils.get(appareil)
        if not ap:
            return non('refus')
        retraits = [oid for oid in ap.replique if not self._acces_ordinaire(ap.acteur, oid, 'voir')]
        for oid in retraits:
            del ap.replique[oid]
        for cid in ap.contributions:
            c = self.contributions[cid]
            if c.etat != 'locale':
                continue
            c.etat = 'recue'
            c.etat = 'integree' if self.acces(c.auteur, c.cible, c.action) else 'refusee'
        return oui(dict(retraits=len(retraits)))

    def lire_contribution(self, a, cid):
        """§ 13.8 : une contribution refusée reste lisible par son seul auteur, delta seulement."""
        c = self.contributions.get(cid)
        if not c or c.auteur != a:
            return INTROUVABLE
        return oui(dict(etat=c.etat, delta=c.delta))

    # ----------------------------------------------------------- réutilisation
    def reutiliser(self, a, oid, E):
        """§ 13.11 (G-6) : copie liée par FILIATION, qui hérite des protections opposables."""
        o = self.objets.get(oid)
        if not o or o.purge:
            return INTROUVABLE
        if not self._acces_ordinaire(a, oid, 'reutiliser') or not o.licence_copie:
            return non('refus') if self._connait(a, o) else INTROUVABLE
        if self._droit_de_creer(a, E) != 'objet' or self.espaces[E].etat != 'actif':
            return non('refus')
        cid = self._copie(o, a, reutilisee=True, E=E)
        for p in self._protections(o):                                   # § 13.11 (H-3b)
            if p.type in PROTECTIONS_INTERNES:
                self._heriter(p, cid)
        self._jrnl('reutilisation', a, E, cibles=[cid], prive_de=a, origine=oid)
        self._ecrit()
        return oui(cid)
