"""Outils de test du contrat d'autorisation V1.6 (en-tête du contrat : le modèle ne contient aucun outil de test).

Deux familles :
- **observation** : ce qu'un acteur peut constater, obtenu par les seules opérations publiques du modèle
  (`acces`, `deleguer`, `lister_habilitations`, `preparer_invitation`...), au besoin sur une copie jetable ;
- **transcriptions du texte** : les règles du contrat récrites ici, indépendamment du modèle, pour servir
  d'oracle (`frappe_existence`, `frappe_restriction`, `non_levable`) ;
- **état jumeau** : la copie d'un état où un objet n'a jamais existé (I-5). Le jumeau modifie les données de
  la copie ; il ne lit aucune règle du modèle.
"""
import copy

ACTIONS = ('voir', 'commenter', 'proposer', 'transcrire', 'editer', 'valider', 'exporter', 'reutiliser',
           'contribuer_core')
SONDE = 'SONDE-OUTILS'


# --------------------------------------------------------------------------------------------- personnes
def comptes(s, a):
    """Comptes de la personne de a (§ 1). Lecture des comptes déclarés, pas d'une règle du modèle."""
    act = s.acteurs.get(a)
    if act is None or act.personne is None:
        return [a]
    return sorted(c for c, x in s.acteurs.items() if x.personne == act.personne)


def meme(s, a, b):
    return a is not None and b is not None and b in comptes(s, a)


# ------------------------------------------------------------------------------------------- observation
def droits_de(s, a, actions=ACTIONS):
    """(objet, action) accordés à a par un accès ordinaire (étape 5 ou 6), dérogations exclues."""
    res = set()
    for oid, o in s.objets.items():
        if o.purge:
            continue
        for act in actions:
            r = s.acces(a, oid, act)
            if r.ok and not (isinstance(r.valeur, tuple) and r.valeur and r.valeur[0] == 'derogation'):
                res.add((oid, act))
    return res


def droits_personne(s, a, actions=ACTIONS):
    return set().union(*(droits_de(s, c, actions) for c in comptes(s, a)))


def _copie_neutre(s):
    """Copie jetable où aucune fenêtre de transfert n'est ouverte : le pouvoir de partage s'observe
    indépendamment du gel (§ 10.6), qui suspend un acte sans retirer le pouvoir."""
    t = copy.deepcopy(s)
    for e in t.espaces.values():
        e.transfert_en_cours = None
    if SONDE not in t.acteurs:
        t.ajouter_acteur(SONDE)
    return t


def pouvoirs_de(s, a):
    """Pouvoirs et qualités de a (I-2) :
    - ('repartager', objet, action) : a réussit l'opération publique `deleguer` de cette action sur cet objet ;
    - ('administrer', E) : a réussit `preparer_invitation` sur E ;
    - ('proprietaire', E) : la ligne racine des métadonnées de gouvernance de E le désigne ;
    - ('gardien', p), ('beneficiaire', p) : transcription des § 2.4, § 9.5, § 11.2 (personne)."""
    res = set()
    t = _copie_neutre(s)
    for oid, o in s.objets.items():
        if o.purge:
            continue
        for act in ACTIONS:
            if t.deleguer(a, ('acteur', SONDE), [act], ('objet', oid)).ok:
                res.add(('repartager', oid, act))
    t = copy.deepcopy(s)
    for E in s.espaces:
        if t.preparer_invitation(a, E, SONDE).ok:
            res.add(('administrer', E))
        r = s.lister_habilitations(a, E)
        if r.ok and any(l['nature'] == 'SYS' and l['etat'] == 'active' and l['beneficiaire'] == ('acteur', a)
                        for l in r.valeur['lignes']):
            res.add(('proprietaire', E))
    for p in s.protections.values():
        if p.etat != 'active':
            continue
        if any(g in comptes(s, a) for g in p.gardiens):
            res.add(('gardien', p.id))
        if beneficiaire_embargo(s, a, p):
            res.add(('beneficiaire', p.id))
    return res


def pouvoirs_personne(s, a):
    return set().union(*(pouvoirs_de(s, c) for c in comptes(s, a)))


# ------------------------------------------------------------------------------- transcriptions du texte
def active(s, p):
    return p.etat == 'active' and (p.fin is None or s.now < p.fin)


def beneficiaire_embargo(s, x, p):
    """§ 2.4, § 9.5, § 11.2, § 11.3 : x (personne) est soustrait à l'embargo p."""
    cx = comptes(s, x)
    if any(g in cx for g in p.gardiens):
        return True
    for b in p.beneficiaires:
        if b[0] == 'acteur' and b[1] in cx:
            return True
        if b[0] == 'groupe' and any(m in cx for m in s.groupes[b[1]].membres) \
                and any(m in cx for m in p.agrees.get(b[1], set())):
            return True
    return False


def frappe_existence(s, x, p):
    """§ 2.4 : la protection p cache-t-elle sa cible à x (personne) ?"""
    if not active(s, p):
        return False
    if p.type == 'gel_succession':
        return True
    if p.type == 'interdiction_existence':
        return any(d in comptes(s, x) for d in p.destinataires)
    if p.type == 'embargo_existence':
        return not beneficiaire_embargo(s, x, p)
    return False


def frappe_restriction(s, x, p, op):
    """§ 2.3 : la restriction interne p retire-t-elle l'action op à x (personne) ?"""
    if not active(s, p):
        return False
    if p.type == 'embargo_contenu':
        return not beneficiaire_embargo(s, x, p)
    if p.type == 'interdiction_action':
        return op in p.actions and any(d in comptes(s, x) for d in p.destinataires)
    return False


def ascendants(s, oid):
    """§ 1 : original, original de l'original, etc."""
    res, vus = [], {oid}
    o = s.objets[oid]
    while o.copie_de and o.copie_de in s.objets and o.copie_de not in vus:
        vus.add(o.copie_de)
        o = s.objets[o.copie_de]
        res.append(o.id)
    return res


def non_levable(s, oid):
    """§ 2.3, § 11.6, § 13.11 : restriction non levable de la cible ou d'un ascendant quelconque."""
    for i in [oid] + ascendants(s, oid):
        o = s.objets[i]
        if o.consentement_retire or o.effacement_legal:
            return True
        for p in s.protections.values():
            if p.cible == i and p.type == 'restriction_legale' and active(s, p) \
                    and (i == oid or p.reference.get('portee') != 'cible'):
                return True
    return False


def cache_a(s, x, oid):
    """Une protection d'existence cache-t-elle oid à x ?"""
    return any(p.cible == oid and frappe_existence(s, x, p) for p in s.protections.values())


# ---------------------------------------------------------------------------------------------- jumeau
def retirer_objet(s, oid):
    """Construit, en place, l'état où l'objet oid n'a jamais existé (I-5) : toutes les structures qui le
    mentionnent en sont purgées. Ses copies demeurent (elles sont d'autres objets), avec ce qu'elles tenaient
    de lui : les restrictions non levables de l'original sont portées par la copie elle-même."""
    o = s.objets.pop(oid, None)
    if o is None:
        return s
    legales = [p for p in s.protections.values() if p.cible == oid and p.type == 'restriction_legale'
               and p.etat == 'active' and p.reference.get('portee') != 'cible']
    for c in s.objets.values():
        if c.copie_de == oid:
            c.consentement_retire = c.consentement_retire or o.consentement_retire
            c.effacement_legal = c.effacement_legal or o.effacement_legal or bool(legales)
            c.sensible = c.sensible or o.sensible
            c.copie_de = o.copie_de
        c.mentions.discard(oid)
        c.relations.discard(oid)
    for h in list(s.habs.values()):
        if h.perimetre[0] == 'objet' and h.perimetre[1] == oid:
            del s.habs[h.id]
            continue
        if h.perimetre[0] == 'objets' and oid in h.perimetre[1]:
            reste = frozenset(h.perimetre[1]) - {oid}
            if not reste:
                del s.habs[h.id]
                continue
            h.perimetre = ('objets', reste)
        if h.perimetre_signataire and h.perimetre_signataire[0] == 'objets' and oid in h.perimetre_signataire[1]:
            h.perimetre_signataire = ('objets', frozenset(h.perimetre_signataire[1]) - {oid})
        h.exclusions = frozenset(h.exclusions) - {oid}
        h.excl_fondateurs = {f: frozenset(v) - {oid} for f, v in h.excl_fondateurs.items()}
    for adm in list(s.admissions.values()):
        if adm.hab not in s.habs:
            del s.admissions[adm.id]
        else:
            adm.exclusions = frozenset(adm.exclusions) - {oid}
    for sel in s.selections.values():
        sel.version_active.discard(oid)
        sel.masques.discard(oid)
        sel.proposition.discard(oid)
    for lot in s.lots.values():
        lot.objets.discard(oid)
    supprimees = {p.id for p in s.protections.values() if p.cible == oid}
    for pid in supprimees:
        del s.protections[pid]
    for p in s.protections.values():
        if p.herite_de in supprimees:
            p.herite_de = None
    s.signalements = [x for x in s.signalements if x not in supprimees]
    for acteur, msgs in s.notifications.items():
        s.notifications[acteur] = [m for m in msgs if oid not in m and not (set(m) & supprimees)]
    s.avis = [a for a in s.avis if oid not in a]
    journal = []
    for e in s.journal:
        if oid in e['cibles']:
            e = dict(e, cibles=e['cibles'] - {oid})
            if not e['cibles']:
                continue
        journal.append(e)
    s.journal = journal
    s.audit = [e for e in s.audit if e.get('cible') != oid and e.get('protection') not in supprimees]
    for tr in s.transferts.values():
        tr.voies.pop(oid, None)
        tr.copies.discard(oid)
        tr.acceptes_b.discard(oid)
        tr.differes = [(h, x) for h, x in tr.differes if h in s.habs]
        if tr.presente:
            tr.presente = {k: v for k, v in tr.presente.items() if not _mentionne(k, v, oid, supprimees, s)}
        for hid in list(tr.reemissions):
            if hid not in s.habs:
                del tr.reemissions[hid]
    s.differes_espace = [(h, x) for h, x in s.differes_espace if h in s.habs]
    for cle in list(s.scelles):
        s.scelles[cle] = {k: v for k, v in s.scelles[cle].items() if not _mentionne(k, v, oid, supprimees, s)}
    for d in s.derogations.values():
        d.cibles = d.cibles - {oid}
    s.diffusions = [d for d in s.diffusions if d['publication'] != oid]
    for serie in s.series.values():
        for rang in list(serie['rangs']):
            serie['rangs'][rang] = [p for p in serie['rangs'][rang] if p != oid]
            if not serie['rangs'][rang]:
                del serie['rangs'][rang]
    s.insertions = {k: v for k, v in s.insertions.items() if v['pub'] != oid}
    s.bases = {k: v for k, v in s.bases.items() if k[-1] != oid}
    for k, c in list(s.contributions.items()):
        if c.cible == oid:
            del s.contributions[k]
    for ap in s.appareils.values():
        ap.replique.pop(oid, None)
        ap.contributions = [c for c in ap.contributions if c in s.contributions]
    s._cache = {k: v for k, v in s._cache.items() if k[1] != oid}
    return s


def _mentionne(k, v, oid, supprimees, s):
    if k[0] in ('voie',) and k[1] == oid:
        return True
    if k[0] == 'prot' and k[1] in supprimees:
        return True
    if k[0] in ('hab', 'app', 'reem') and k[1] not in s.habs:
        return True
    if k[0] == 'adm' and k[1] not in s.admissions:
        return True
    return False


def jumeau_sans(s, oid):
    """Copie de s où oid n'a jamais existé."""
    return retirer_objet(copy.deepcopy(s), oid)
