"""Catalogue logique neutre : types, PK, FK, états, historiques et actes.

Les invariants d'autorisation restent ceux du contrat V1.6 gelé. Ce catalogue
représente les faits nécessaires à leur évaluation, pas un nouveau moteur.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
TABLES = {}

def table(name, fields, *, checks=(), unique=(), nature='HS', pk=('id',)):
    columns = {'id': {'type': 'uuid', 'nullable': False}} if 'id' in pk else {}
    fks = []
    for field in fields.split():
        col, typ = field.split(':', 1)
        nullable = typ.endswith('?')
        typ = typ.rstrip('?')
        target = None
        if typ.startswith('@'):
            target = typ[1:]
            typ = 'uuid'
        columns[col] = {'type': typ, 'nullable': nullable}
        if target:
            fks.append({'colonnes': [col], 'table': target, 'cible': ['id']})
    if nature == 'HS':
        columns['revision'] = {'type': 'int', 'nullable': False}
        columns['debut_validite'] = {'type': 'ts', 'nullable': False}
        columns['fin_validite'] = {'type': 'ts', 'nullable': True}
        columns['evenement_id'] = {'type': 'uuid', 'nullable': False}
        fks.append({'colonnes': ['evenement_id'], 'table': 'autorisation_evenement', 'cible': ['id']})
    TABLES[name] = {'nature': nature, 'colonnes': columns, 'pk': list(pk),
                    'fk': fks, 'uq': list(unique), 'ck': list(checks)}

table('autorisation_identite', 'acteur_id:@acteur_geniius personne_id:@personne? niveau:code statut:code depuis:ts fin:ts?',
      unique=['acteur_id WHERE statut = vérifiée AND fin IS NULL'],
      checks=['niveau ∈ {standard, renforcé}', 'statut ∈ {déclarée, vérifiée, révoquée}',
              'personne_id requis pour acteur personne vérifié ; nul pour acteur institutionnel',
              'aucune unicité sur personne_id : plusieurs comptes/acteurs de la même personne',
              'concordance avec liens compte-acteur et compte-personne, en fin de transaction'])
table('autorisation_propriete', 'espace_id:@espace proprietaire_id:@acteur_geniius racine_id:@autorisation_habilitation depuis:ts',
      unique=['espace_id'], checks=['racine système active bénéficiaire du propriétaire courant et couvrant cet espace',
                                  'un propriétaire et une racine par espace non clos ; transfert atomique'])
table('autorisation_titularite', 'objet_id:@objet titulaire_id:@acteur_geniius depuis:ts fin:ts?',
      unique=['objet_id WHERE fin IS NULL'], checks=['titularité créée seulement par procédures système § 6', 'objet personnel exige titularité ; aucune visibilité projet'])
table('autorisation_perimetre', 'genre:code espace_id:@espace titulaire_regime_id:@acteur_geniius? objet_id:@objet? lien_id:@lien? selection_id:@selection_partage?',
      checks=['genre ∈ {objet, lien, lot, contenu, sélection}', 'alternatives et jointures cohérentes avec genre',
              'un seul régime ; cible lien soumise aux droits des deux extrémités'])
table('autorisation_perimetre_objet', 'perimetre_id:@autorisation_perimetre objet_id:@objet', pk=('perimetre_id', 'objet_id'), nature='N',
      checks=['liste fermée figée ; toute évolution crée nouveau périmètre ; régime unique'])
table('autorisation_beneficiaire', 'genre:code acteur_id:@acteur_geniius? groupe_id:@groupe? espace_role_id:@espace? role:code?',
      checks=['genre ∈ {acteur, groupe, rôle, public}', 'acteur : seul acteur_id ; groupe : seul groupe_id ; rôle : espace_role_id et role ; public : aucun FK'])
table('autorisation_habilitation', 'nature:code forme:code espace_id:@espace auteur_id:@acteur_geniius? beneficiaire_id:@autorisation_beneficiaire perimetre_id:@autorisation_perimetre perimetre_signataire_id:@autorisation_perimetre? role:code? repartager:bool mode:code? etat:code debut:ts fin:ts? reemission_de_id:@autorisation_habilitation? rattachement_id:@relation_projets? lot_id:@tache? echeance_hors_ligne:ts?',
      checks=['nature ∈ {HI, HP, système}', 'forme ∈ {nomination, délégation, racine}',
              'etat ∈ {proposée, active, suspendue, close, expirée}', 'mode ∈ {notification, approbation préalable} ou nul hors ensemble ouvert',
              'auteur requis HI/HP, nul uniquement système ; signataire et périmètre à l’acte figés pour HI',
              'fin nulle ou fin > debut ; états close/expirée terminaux',
              'les opérations autorisées sont exclusivement celles du contrat ; aucun UPDATE libre du mode ou des actions'])
table('autorisation_action', 'habilitation_id:@autorisation_habilitation action:code', pk=('habilitation_id', 'action'), nature='HS',
      checks=['action ∈ {voir, commenter, proposer, transcrire, éditer, valider, exporter, réutiliser, contribuer au Core}'])
table('autorisation_fondateur', 'habilitation_id:@autorisation_habilitation fondateur_id:@acteur_geniius debut:ts fin:ts?',
      unique=['habilitation_id, fondateur_id WHERE fin IS NULL'], checks=['HP seulement ; auteur initial inclus, admetteur pas automatiquement fondateur global'])
table('autorisation_fondement', 'fondateur_id:@autorisation_fondateur action:code nature:code titularite_id:@autorisation_titularite? nomination_id:@autorisation_habilitation? habilitation_id:@autorisation_habilitation? perimetre_id:@autorisation_perimetre repartager:bool debut:ts fin:ts?',
      checks=['nature ∈ {titulaire, rôle, HI, HP}', 'exactement une référence : titulaire→titularite, rôle→nomination, HI/HP→habilitation de nature concordante',
              'chaîne enracinée acyclique, couverture action/partage/périmètre/durée à l’acte et évaluation, suspensions ≠ ruptures'])
table('autorisation_exclusion', 'habilitation_id:@autorisation_habilitation objet_id:@objet fondateur_id:@autorisation_fondateur?',
      unique=['habilitation_id, objet_id, fondateur_id avec null égal'], checks=['figée à l’acte ; accès audit seul'])
table('autorisation_admission', 'habilitation_id:@autorisation_habilitation personne_id:@personne admetteur_id:@acteur_geniius? nature:code automatique:bool etat:code debut:ts fin:ts?',
      checks=['nature ∈ {HI, HP}', 'etat ∈ {active, close}', 'automatique implique admetteur nul ; manuelle admetteur requis',
              'auteur jamais admis (personne) ; automatique exclut gestionnaires et cibles exigeantes à chaque accès',
              'HP manuelle : propres fondements de l’admetteur, ne dépend pas des seuls fondateurs globaux'])
table('autorisation_admission_fondement', 'admission_id:@autorisation_admission action:code nature:code titularite_id:@autorisation_titularite? nomination_id:@autorisation_habilitation? habilitation_id:@autorisation_habilitation? perimetre_id:@autorisation_perimetre repartager:bool debut:ts fin:ts?',
      checks=['exactement une FK typée conforme à nature, comme fondement HP', 'étendue jamais supérieure à celle de l’admetteur ; clôture admission si sa chaîne rompt'])
table('autorisation_admission_exclusion', 'admission_id:@autorisation_admission objet_id:@objet', pk=('admission_id', 'objet_id'), nature='N')
table('autorisation_exclusion_personne', 'habilitation_id:@autorisation_habilitation personne_id:@personne date:ts',
      unique=['habilitation_id, personne_id'], checks=['retrait préventif empêche auto-admission de tous comptes'])
table('autorisation_protection', 'genre:code cible_objet_id:@objet? cible_lien_id:@lien? createur_id:@acteur_geniius? etat:code debut:ts fin:ts? autorite_emettrice_id:@acteur_geniius? autorite_levee_id:@acteur_geniius? heritee_de_id:@autorisation_protection? origine:code portee:code base_legale:text? reference_legale:text?',
      checks=['exactement une cible ; genre ∈ {embargo contenu, interdiction action, restriction légale, consentement refusé ou retiré, effacement légal, embargo existence, interdiction existence, cloisonnement, gel succession}', 'etat ∈ {active, levée, expirée}', 'origine ∈ {interne, légale interne, externe, système, héritée}',
              'portee ∈ {cible et copies, cible seulement} ; limitation expresse seulement pour restriction légale',
              'héritée : ascendant et origine conservés ; levée origine ne lève pas copie ; sensibilité/non-levables de tous ascendants'])
table('autorisation_protection_action', 'protection_id:@autorisation_protection action:code', pk=('protection_id', 'action'), nature='HS')
table('autorisation_protection_personne', 'protection_id:@autorisation_protection personne_id:@personne qualite:code depuis:ts fin:ts?',
      checks=['qualite ∈ {destinataire, bénéficiaire, gardien}', 'garde valide exige identité renforcée et droit sur cible ou ascendant ; perte signalée avant exposition'])
table('autorisation_protection_ensemble', 'protection_id:@autorisation_protection beneficiaire_id:@autorisation_beneficiaire',
      unique=['protection_id, beneficiaire_id'], checks=['ensemble ouvert : agrément personne requis, jamais bénéficiaire par seule composition'])
table('autorisation_agrement', 'protection_id:@autorisation_protection personne_id:@personne gardien_id:@acteur_geniius debut:ts fin:ts?')
table('autorisation_passage_orphelin', 'protection_id:@autorisation_protection debut:ts fin:ts? signale_le:ts?',
      unique=['protection_id WHERE fin IS NULL'], checks=['à chaque passage signalement minimal P-3, dans même écriture que perte de garde'])
table('autorisation_acte', 'type:code acteur_id:@acteur_geniius? instant:ts espace_id:@espace? contexte_id:@contexte_evaluation? justification:text?', nature='N',
      checks=['actes sensibles ∈ {dérogation, décès, succession, garde, autorité légale, contestation, versement, nomination admin, transfert, réintégration} ; autres opérations contractuelles identifiées',
              'identité et indépendance vérifiées à l’acte puis à l’évaluation lorsque § 12 le demande'])
table('autorisation_dossier_objet', 'acte_id:@autorisation_acte objet_id:@objet', pk=('acte_id', 'objet_id'), nature='N')
table('autorisation_dossier_espace', 'acte_id:@autorisation_acte espace_id:@espace', pk=('acte_id', 'espace_id'), nature='N')
table('autorisation_approbation', 'acte_id:@autorisation_acte approbateur_id:@acteur_geniius identite_id:@autorisation_identite date:ts qualite_verifiee:bool', nature='N',
      unique=['acte_id, approbateur_id'], checks=['comptes même personne comptent une seule fois ; nombre/accords du § 12.3',
                                               'pas d’intérêt, subordination ou rôle interdit sur dossier ; absence identité vérifiée entraîne refus'])
table('autorisation_membre_autorite', 'acteur_id:@acteur_geniius autorite:code debut:ts fin:ts?',
      checks=['autorite ∈ {dérogation, externe} ; qualité sans droit de contenu'])
table('autorisation_subordination', 'subordonne_personne_id:@personne superieur_personne_id:@personne debut:ts fin:ts?',
      checks=['indépendance revérifiée à chaque accès dérogatoire'])
table('autorisation_interet', 'personne_id:@personne objet_id:@objet? espace_id:@espace? nature:code debut:ts fin:ts?',
      checks=['exactement une cible dossier ; personne commune à tous comptes ; interdits § 12.7'])
table('autorisation_nomination_admin', 'espace_id:@espace acteur_id:@acteur_geniius nomme_par_id:@acteur_geniius debut:ts fin:ts? etat:code',
      checks=['propriétaire seul nomme ; aucun droit de contenu ; etat ∈ {active, close, expirée}'])
table('autorisation_designation_garde', 'espace_id:@espace beneficiaire_personne_id:@personne acte_id:@autorisation_acte debut:ts fin:ts?',
      checks=['destination de gouvernance seulement ; ne confère aucune titularité ou lecture'])
table('autorisation_deces', 'personne_id:@personne acte_id:@autorisation_acte date_constat:ts', nature='N',
      checks=['deux approbateurs indépendants ; effet personne sur tous comptes et tous espaces'])
table('autorisation_succession', 'deces_id:@autorisation_deces objet_id:@objet acte_id:@autorisation_acte sort:code ayant_droit_id:@acteur_geniius? rs_id:@acteur_geniius? etat:code accepte_le:ts?',
      checks=['sort ∈ {transmission, versement, purge, maintien gel}', 'etat ∈ {en instruction, proposée, acceptée, refusée, exécutée}', 'transmission exige ayant droit vérifié et acceptation ; décision par objet, autres objets restent gelés'])
table('autorisation_contestation', 'protection_id:@autorisation_protection acte_id:@autorisation_acte resultat:code date_decision:ts?',
      checks=['resultat ∈ {en attente, maintenue, annulée} ; protection continue tant que non annulée selon autorité compétente'])
table('autorisation_finalite_version', 'version:int active:bool depuis:ts fin:ts?', nature='HS', unique=['version'])
table('autorisation_finalite', 'version_id:@autorisation_finalite_version code:code niveau:code', nature='N', unique=['version_id, code'],
      checks=['niveau ∈ {technique admissible à un approbateur, renforcé} ; liste fermée gouvernée'])
table('autorisation_derogation', 'beneficiaire_personne_id:@personne acte_id:@autorisation_acte finalite_id:@autorisation_finalite justification:text debut:ts fin:ts etat:code renouvellement_de_id:@autorisation_derogation? rang:int',
      checks=['etat ∈ {active, suspendue, close, expirée}', 'fin > debut ; durée ≤ paramètre gouverné',
              'rang calculé sur toutes demandes antérieures recoupant cibles/personne, sans partition par finalité ; carence § 12.6',
              'parent descriptif ne remplace pas ensemble des prédécesseurs ; protections orphelines et non-levables jamais franchies'])
table('autorisation_derogation_cible', 'derogation_id:@autorisation_derogation objet_id:@objet operation:code', pk=('derogation_id', 'objet_id', 'operation'), nature='N')
table('autorisation_derogation_predecesseur', 'derogation_id:@autorisation_derogation precedent_id:@autorisation_derogation', pk=('derogation_id', 'precedent_id'), nature='N')
table('autorisation_accord_gardien', 'derogation_id:@autorisation_derogation protection_id:@autorisation_protection gardien_id:@acteur_geniius date:ts', nature='N')
table('autorisation_transfert', 'espace_id:@espace cedant_id:@acteur_geniius cessionnaire_id:@acteur_geniius designation_id:@autorisation_designation_garde? etat:code presentation_courante_id:@autorisation_presentation? presentations:int debut:ts fin:ts? carence_fin:ts?',
      checks=['etat ∈ {préparé, présenté, accepté, expiré, refusé, annulé}', 'un transfert courant par espace ; personnes distinctes et identité établie',
              'expiration présentation interdit acceptation ; fin fenêtre réévalue différés ; compteur/plafond/carence § 5.6'])
table('autorisation_transfert_objet', 'transfert_id:@autorisation_transfert objet_id:@objet voie:code acceptation_b:bool copie_complementaire:bool copie_id:@objet?',
      unique=['transfert_id, objet_id'], checks=['voie ∈ {a, b, purge, g} ; copie c seulement complément de a/b, licence/protections requises'])
table('autorisation_presentation', 'transfert_id:@autorisation_transfert numero:int instant:ts expiration:ts empreinte:hash', nature='N', unique=['transfert_id, numero'])
table('autorisation_transfert_engagement', 'presentation_id:@autorisation_presentation genre:code habilitation_id:@autorisation_habilitation? admission_id:@autorisation_admission? membre_id:@autorisation_membre_groupe? administration_id:@autorisation_nomination_admin? protection_id:@autorisation_protection? voie_id:@autorisation_transfert_objet? reemission_id:@autorisation_reemission? beneficiaire_id:@autorisation_beneficiaire? beneficiaire_genre:code? beneficiaire_acteur_id:@acteur_geniius? beneficiaire_groupe_id:@groupe? beneficiaire_espace_role_id:@espace? beneficiaire_role:code? revision_beneficiaire:int? perimetre_id:@autorisation_perimetre? perimetre_genre:code? regime_espace_id:@espace? regime_titulaire_id:@acteur_geniius? echeance:ts? etat:code? mode:code? repartager:bool effectif:bool revision_source:int', nature='N',
      checks=['genre et exactement une FK cible concordants ; instantanés relationnels ci-dessous, pas référence à état mutable',
              'avant acceptation comparaison inclusion de tous engagements, pas simple égalité hash ; vue K filtrée distincte'])
table('autorisation_membre_groupe', 'groupe_id:@groupe acteur_id:@acteur_geniius ajoute_par_id:@acteur_geniius debut:ts fin:ts?',
      checks=['gestionnaire identité renforcée ; pas ajout de soi (personne) ; fin clôt admissions, pas résurrection'])
table('autorisation_engagement_action', 'engagement_id:@autorisation_transfert_engagement action:code', pk=('engagement_id', 'action'), nature='N')
table('autorisation_engagement_objet', 'engagement_id:@autorisation_transfert_engagement objet_id:@objet role:code fondateur_personne_id:@personne? admission_source_id:@autorisation_admission? fondement_snapshot_id:@autorisation_engagement_fondement?', nature='N',
      unique=['engagement_id, objet_id, role, fondateur_personne_id, admission_source_id, fondement_snapshot_id avec null égal'],
      checks=['role ∈ {cible, exclusion, exclusion fondateur, admission exclusion, aperçu} ; ensemble fermé présenté'])
table('autorisation_engagement_personne', 'engagement_id:@autorisation_transfert_engagement personne_id:@personne role:code admission_source_id:@autorisation_admission? fondateur_source_id:@autorisation_fondateur? debut:ts? fin:ts? etat:code? automatique:bool? revision_source:int?', nature='N',
      unique=['engagement_id, personne_id, role, admission_source_id, fondateur_source_id avec null égal'],
      checks=['role ∈ {bénéficiaire, fondateur, admis, membre, gardien, gestionnaire, destinataire}'])
table('autorisation_engagement_fondement', 'engagement_id:@autorisation_transfert_engagement fondateur_personne_id:@personne? admission_source_id:@autorisation_admission? action:code nature:code source_habilitation_id:@autorisation_habilitation? source_titularite_id:@autorisation_titularite? revision_source:int perimetre_id:@autorisation_perimetre debut:ts fin:ts? etat:code repartager:bool', nature='N',
      checks=['nature typée ; couvertures et objets du périmètre copiés dans engagement_objet ; état à présentation, pas jointure courante'])
table('autorisation_reemission', 'transfert_id:@autorisation_transfert origine_id:@autorisation_habilitation nouvelle_id:@autorisation_habilitation? perimetre_id:@autorisation_perimetre beneficiaire_id:@autorisation_beneficiaire repartager:bool fin:ts? etat:code',
      checks=['etat ∈ {annoncée, réalisée, abandonnée}', 'identique ou plus étroite ; source devenue invalide abandonnée sans bloquer acceptation', 'exclusion du nouveau signataire et permissions à acceptation'])
table('autorisation_reemission_action', 'reemission_id:@autorisation_reemission action:code', pk=('reemission_id', 'action'), nature='N')
table('autorisation_reemission_admission', 'reemission_id:@autorisation_reemission origine_admission_id:@autorisation_admission nouvelle_admission_id:@autorisation_admission? personne_id:@personne', nature='HS')
table('autorisation_admission_differee', 'espace_id:@espace origine:code transfert_id:@autorisation_transfert? habilitation_id:@autorisation_habilitation personne_id:@personne date:ts etat:code',
      checks=['origine ∈ {transfert, cycle espace} ; FK transfert requis seulement origine transfert', 'etat ∈ {en attente, traitée, abandonnée}', 'mode courant, membre, habilitant, identité/exclusions/protections réévalués ; aucune auto-admission si non notification'])
table('autorisation_verrou_reintegration', 'espace_id:@espace transfert_id:@autorisation_transfert cedant_personne_id:@personne depuis:ts fin:ts?',
      checks=['s’applique à tous comptes du cédant ; consentement pour chaque acte sensible de retour'])
table('autorisation_consentement_reintegration', 'verrou_id:@autorisation_verrou_reintegration signataire_id:@acteur_geniius propriete_id:@autorisation_propriete revision_propriete:int acte_id:@autorisation_acte beneficiaire_id:@autorisation_beneficiaire perimetre_id:@autorisation_perimetre fin:ts? empreinte_acte:hash consomme_le:ts?',
      checks=['propriétaire courant d’autre personne, acte couvert et consommation unique atomique', 'transfert suivant ou changement propriétaire invalide consentement antérieur'])
table('autorisation_consentement_action', 'consentement_id:@autorisation_consentement_reintegration action:code', pk=('consentement_id', 'action'), nature='N')
table('autorisation_epoque', 'espace_id:@espace valeur:int', unique=['espace_id'],
      checks=['incrément avant prise d’effet ; propagation interespaces atomique ou barrière de refus'])
table('autorisation_evenement', 'acte_id:@autorisation_acte instant:ts acteur_id:@acteur_geniius? operation:code', nature='N',
      checks=['état antérieur complet dans _hist ; événement ne réécrit jamais auteur/paternité/filiation'])
table('contexte_evaluation', 'acteur_id:@acteur_geniius? identite_id:@autorisation_identite? audience:code espace_id:@espace projet_id:@projet? instant:ts operation:code finalite_id:@autorisation_finalite? canal:code epoque_autorisation:int habilitation_id:@autorisation_habilitation? derogation_id:@autorisation_derogation? appareil_ref:uuid?', nature='N',
      checks=['dérogation implique finalité, opération et cible couverts à instant ; aucune donnée contenu dans journal', 'appareil du schéma technique requis réplication ; public peut avoir acteur nul'])
table('autorisation_decision', 'contexte_id:@contexte_evaluation cible_objet_id:@objet? cible_lien_id:@lien? action:code instant:ts epoque:int resultat:code', nature='N',
      checks=['exactement une cible ; trace ne constitue jamais un droit courant'])
table('autorisation_decision_fondement', 'decision_id:@autorisation_decision genre:code titulaire_id:@autorisation_titularite? habilitation_id:@autorisation_habilitation? admission_id:@autorisation_admission? fin:ts?', nature='N',
      checks=['genre ∈ {titulaire, rôle, HI, HP, visibilité, dérogation}', 'FK et genre concordants ; visibilité sans référence ; dérogation portée par contexte'])

def generate():
    model = {'version': 'V1.1-g candidat', 'source_normative': 'contrat V1.6 gelé',
             'conventions': {'HS': 'état de sécurité courant + miroir _hist, PK(id,revision), périodes continues, avant/après complets',
                            'N': 'insertion seule, hors neutralisation légalement autorisée',
                            'uuid': 'identifiant opaque, choix physique au MPD',
                            'reference': 'FK réelle vers colonne id ; aucune référence polymorphe libre'},
             'tables': TABLES}
    path = ROOT / 'spec/validation/schema_autorisations.json'
    path.write_text(json.dumps(model, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    out = ['# MLD — Catalogue relationnel des autorisations V1.6', '',
           '**Version : V1.1-g candidat — 12/10/2026.** Partie intégrante du MLD ; réalise le contrat comportemental V1.6 gelé sans le modifier.', '',
           'Source structurée reproductible : `spec/validation/schema_autorisations.json`, produite par `expliciter_schema_autorisations.py`. Ce catalogue est logique : aucune technologie de base n’est choisie et aucun SQL de production n’est déclaré exécuté.', '',
           '## Conventions et écriture atomique', '',
           '`HS` désigne un état d’autorisation courant, avec un miroir relationnel `_hist` de toutes les colonnes et associations, indexé par clé primaire et révision. Chaque transition crée un événement/acte, conserve avant et après, ferme la période précédente et ouvre la nouvelle dans la même transaction ; les périodes ne se chevauchent pas et ne laissent pas de trou. Pour une PK composite, `_hist` utilise cette PK plus révision. `N` désigne une insertion seule. Cette historisation de sécurité ne réécrit pas VERSION_OBJET scientifique et n’est jamais une source de droit courant. La neutralisation légale reste soumise à CP-16 et laisse seulement les traces minimales admissibles.', '',
           'Toutes les FK doivent exister en fin de transaction, y compris cycles de création propriété/racine et présentation/transfert ; leur mécanisme relève du MPD, pas leur résultat obligatoire. Les colonnes non marquées `?` sont obligatoires. Les états/actions sont fermés. Toute fin renseignée est postérieure au début. Toute mutation de droit incrémente l’époque avant qu’un accès puisse observer le nouvel état ; échec de vérification = introuvable sans mutation. Aucun accès direct ne peut modifier ces tables hors opérations du contrat.', '',
           '## Tables', '']
    for name, data in TABLES.items():
        out += [f'### {name} [{data["nature"]}]', '', '```text']
        for column, d in data['colonnes'].items():
            out.append(f'  {column}  {d["type"]}' + ('' if d['nullable'] else '  NN'))
        out.append('  PK (' + ', '.join(data['pk']) + ')')
        for fk in data['fk']:
            out.append('  FK (' + ', '.join(fk['colonnes']) + ') → ' + fk['table'] + '(' + ', '.join(fk['cible']) + ')')
        for unique in data['uq']:
            out.append('  UQ ' + unique)
        out += ['```', '']
        out += [f'- **Contrainte logique :** {check}.' for check in data['ck']]
        out += ['']
    out += ['## Réconciliation et périmètre', '',
            'Les appartenances scientifiques sont des projections des nominations HI actives ; les appartenances administratives reflètent propriété et nomination admin, les membres de groupe reflètent autorisation_membre_groupe. Les anciennes colonnes ne constituent aucun fondement autonome. Identité de sécurité : acteur→personne vérifiée, concordante avec les comptes ; elle est distincte d’un rapprochement historique scientifique. Les rôles plateforme sont des qualifications, jamais des droits de contenu.', '',
            'Les clichés de transfert sont indépendants de l’état courant : pour chaque engagement, les jointures figées conservent actions, cibles/exclusions, personnes, fondateurs/fondements, admissions, garde, rôle et régime, état/effectivité, partage et échéances. La liste d’objets de tout périmètre dynamique est copiée à la présentation ; une vue filtrée distincte ne livre à K que ce que § 10.6 lui permet. Toute propriété d’inclusion exigée par ce paragraphe constitue un invariant procédural en fin de transaction ; les seuls FK ne prouvent pas l’inclusion.', '',
            'Mode : la traduction n’ajoute aucune opération de changement de mode au contrat. Toute donnée de mode lue lors d’un différé est celle de l’habilitation courante, pas celle de sa mise en attente. Les paramètres de durée, carence, profondeur et finalité restent les réserves du contrat § 16 ; aucune constante du modèle Python n’est promue implicitement en engagement produit.']
    (ROOT / 'docs/05_MLD/GENIIUS_MLD_AUTORISATIONS.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
    print(len(TABLES), 'tables explicites ; historiques HS distincts')

if __name__ == '__main__':
    generate()
