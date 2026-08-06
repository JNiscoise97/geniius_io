import {
  type ActeurMinimal,
  type GrapheActe,
  type RelationExtraction,
  relationRules,
  type RelationPreview,
  type RelationGraphe,
  type Condition,
  type VariableSymbole,
} from '@/types/relations-acteurs';
import { supabase } from './supabase';
import { construireGraphePourActe } from './relationGraphe';

/** Extraction d'une relation à partir d'un champ lien */
function extraireRelationDepuisLien(
  lienBrut: string,
  acteId: string,
  sourceTable: string,
  indexActeurs: Record<
    string,
    {
      id: string;
      qualite: string | null;
      nom: string | null;
      prenom: string | null;
      acte_type: string | null;
      role: string | null;
    }[]
  >,
): RelationExtraction[] {
  let lienInterprete = lienBrut;

  const key = `${acteId}::${sourceTable}`;
  const acteurs = indexActeurs[key] || [];
  const type_acte = acteurs[0]?.acte_type;

  const typesPrincipaux = [

    // Parrainage / tutelle
    'filleule',
    'filleul',
    'parrain',
    'marraine',
    'tutrice',
    'tuteur',
    
    // Famille directe
    'frère',
    'sœur',
    'soeur',
    'fils',
    'fille',
    'père',
    'mère',
    'petit-fils',
    'petit fils',
    'petite-fille',
    'petite fille',
    'grand-père',
    'grand père',
    'grand-mère',
    'grand mère',
    'aïeule',
    'aïeul',

    // Famille par alliance
    'époux',
    'épouse',
    'mari',
    'femme',
    'veuf',
    'veuve',
    'gendre',
    'beau-fils',
    'beau fils',
    'belle-fille',
    'belle fille',
    'beau-père',
    'beau père',
    'belle-mère',
    'belle mère',
    'beau-frère',
    'beau frère',
    'belle-soeur',
    'belle soeur',

    // Famille collatérales
    'cousine',
    'cousin',
    'oncle',
    'tante',
    'neveu',
    'nièce',

    // Autres
    'parent',
    'non parent',
    'amie',
    'ami',
    'voisine',
    'voisin',
  ];

  const rolesCibles = [
    'époux',
    'épouse',
    'défunt',
    'défunte',
    'enfant',
    'père',
    'mère',
    'déclarante',
    'déclarant',
    'future épouse',
    'futur époux',
  ];
  const determinants = [" de l'", ' de la ', ' du ', ' de '];
  const titres = ['m.', 'mme', 'mlle', 'monsieur', 'madame', 'dame'];

  const relations: RelationExtraction[] = [];

  // ✅ Cas implicite à compléter : "type mariage" sans déterminant détecté
  if (!determinants.some((det) => lienInterprete.includes(det)) && type_acte === 'mariage') {
    lienInterprete += ' des époux';
  }

  // 🛠 Cas spécial : "des époux"
  if (lienInterprete.trim().toLowerCase().endsWith(' des époux')) {
    const tmpEpoux = lienInterprete.replace(/ des époux$/i, " de l'époux");
    const tmpEpouse = lienInterprete.replace(/ des époux$/i, " de l'épouse");
    lienInterprete = [tmpEpoux, tmpEpouse].join(' et ');
  }

  const morceaux = lienInterprete
    .split(/,| et /i)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const morceau of morceaux) {
    let lien = morceau?.trim()?.toLowerCase() || '';

    let foundDet = [...determinants]
      .sort((a, b) => b.length - a.length)
      .find((det) => {
        return lien.includes(det);
      });
    if (!foundDet) {
      if (type_acte == 'naissance') {
        lien += " de l'enfant";
        foundDet = " de l'";
      } else if (type_acte == 'décès') {
        lien += ' du défunt';
        foundDet = ' du ';
      } else {
        console.warn('[!foundDet1] type', type_acte);
        console.warn('[!foundDet1] lien', lien);
        relations.push({
          relationType: lien,
          relationPrecision: null,
          roleCible: null,
          acteurCibleId: null,
          acteurCibleRole: null,
          statut: 'erreur',
        });
        continue;
      }
    }

    const splitted = splitLienAvecContext(lien, type_acte, foundDet, determinants, titres);

    if (!splitted) {
      console.log(
        `http://localhost:5173/${sourceTable == 'etat_civil_actes' ? 'ec-acte' : 'ac-acte'}/${acteId}`,
      );
      console.warn('[!foundDet2]', type_acte);
      console.warn('[!foundDet2]', lien);
      relations.push({
        relationType: null,
        relationPrecision: null,
        roleCible: null,
        acteurCibleId: null,
        acteurCibleRole: null,
        statut: 'erreur',
      });
      continue;
    }

    const { avant, apres } = splitted;

    const originalRelationType = avant.trim().toLowerCase();
    let relationType = originalRelationType;
    let relationPrecision: string | null = null;

    for (const base of typesPrincipaux) {
      if (originalRelationType.startsWith(base)) {
        relationType = base;
        const precision = originalRelationType.slice(base.length).trim();
        if (precision && precision != 'des époux') {
          relationPrecision = precision;
        }
        break;
      }
    }
    const apresMots = apres
      .trim()
      .split(/\s+/)
      .map((w) => w.toLowerCase());

    // Supprimer les titres initiaux
    let idx = 0;
    while (titres.includes(apresMots[idx])) {
      idx++;
    }

    const possibleRole = apresMots.slice(idx).join(' ');

    let roleCible = rolesCibles.find((role) => possibleRole.startsWith(role));

    // Sinon chercher via nom/prénom
    let acteurCorrespondant = null;
    if (!roleCible) {
      const matches = acteurs.filter((acteur) => {
        const fullName = [
          acteur.nom && acteur.nom !== '? SANS NOM' ? acteur.nom : '',
          acteur.prenom ?? '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return fullName === possibleRole;
      });

      if (matches && matches.length === 1) {
        acteurCorrespondant = matches[0];
      } else if (matches && matches.length > 1) {
        if (titres.includes(apresMots[0])) {
          let tmpQualite = null;
          if (apresMots[0] == 'm.') {
            tmpQualite = 'sieur';
          } else if (apresMots[0] == 'mme') {
            tmpQualite = 'dame';
          } else if (apresMots[0] == 'mlle') {
            tmpQualite = 'demoiselle';
          } else if (apresMots[0] == 'dame') {
            tmpQualite = 'dame';
          } else if (apresMots[0] == 'monsieur') {
            tmpQualite = 'sieur';
          } else if (apresMots[0] == 'madame') {
            tmpQualite = 'dame';
          } else if (apresMots[0] == 'mademoiselle') {
            tmpQualite = 'demoiselle';
          }
          acteurCorrespondant = acteurs.filter((a) => a.qualite?.toLowerCase() === tmpQualite)[0];
        } else {
          console.warn(`[AMBIGUITE] Plusieurs acteurs ont le nom ${possibleRole}`, matches);
          relations.push({
            relationType,
            relationPrecision,
            roleCible: null,
            acteurCibleId: null,
            acteurCibleRole: null,
            statut: 'erreur',
          });
          continue;
        }
      }

      if (acteurCorrespondant && acteurCorrespondant.role) {
        roleCible = acteurCorrespondant.role.toLowerCase();
      } else {
        console.log(
          `http://localhost:5173/${sourceTable == 'etat_civil_actes' ? 'ec-acte' : 'ac-acte'}/${acteId}`,
        );
        console.warn('!roleCible, possibleRole:', possibleRole);
        console.error('!roleCible', lien);
        relations.push({
          relationType,
          relationPrecision,
          roleCible: null,
          acteurCibleId: null,
          acteurCibleRole: null,
          statut: 'erreur',
        });
        continue;
      }
    }

    let statut: RelationExtraction['statut'] = 'introuvable';
    let acteurCibleId: string | null = null;
    let acteurCibleRole: string | null = null;
    if (acteurCorrespondant) {
      statut = 'unique';
      acteurCibleId = acteurCorrespondant.id;
      acteurCibleRole = acteurCorrespondant.role;
    } else {
      const cibles = acteurs.filter(
        (a) =>
          a.role?.toLowerCase() === roleCible ||
          (roleCible === 'défunte' && a.role?.toLowerCase() === 'défunt') ||
          (roleCible === 'déclarante' && a.role?.toLowerCase() === 'déclarant'),
      );
      if (cibles.length === 1) {
        statut = 'unique';
        acteurCibleId = cibles[0].id;
        acteurCibleRole = cibles[0].role;
      } else if (cibles.length > 1) {
        statut = 'ambigu';
        console.log(cibles);
      }
    }
    relations.push({
      relationType,
      relationPrecision,
      roleCible,
      acteurCibleId,
      acteurCibleRole,
      statut,
    });
  }

  return relations;
}

/** Chargement paginé générique d'une table Supabase */
async function fetchAllFromTable<T>(
  table: string,
  selectClause: string,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  let done = false;

  while (!done) {
    const { data, error } = await supabase
      .from(table)
      .select(selectClause)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`[${table}] ${error.message}`);
      break;
    }

    if (Array.isArray(data)) {
      all.push(...(data as T[]));
      done = data.length < pageSize;
      from += pageSize;
    } else {
      console.error(`[${table}] Réponse inattendue :`, data);
      break;
    }
  }

  return all;
}

function splitLienAvecContext(
  lien: string,
  type_acte: string | null,
  foundDet: string,
  determinants: string[],
  titres: string[],
): { avant: string; apres: string } | null {
  // Expressions qui ne doivent pas être coupées
  const expressionsNonSeparables = ['issu de'];
  const formesDeterminants = determinants.map((det) => det.trim());

  // Trouver le bon index de séparation (celui du dernier foundDet qui n’est pas dans un bloc insécable)
  let indexDet = -1;
  for (let i = lien.length; i >= 0; i--) {
    const sub = lien.slice(0, i);
    if (sub.endsWith(foundDet)) {
      const possibleAvant = lien.slice(0, i).trim();
      const lowerAvant = possibleAvant.toLowerCase();

      const mots = lowerAvant.split(/\s+/);
      const last2 = mots.slice(-2);

      const isInseparableExpr = expressionsNonSeparables.some((expr) => lowerAvant.endsWith(expr));

      const isTitreEtParticule =
        last2.length === 2 && titres.includes(last2[0]) && formesDeterminants.includes(last2[1]);

      if (!isInseparableExpr && !isTitreEtParticule) {
        indexDet = i - foundDet.length;
        break;
      }
    }
  }

  if (indexDet === -1) {
    if (type_acte == 'naissance') {
      lien += " de l'enfant";
      foundDet = " de l'";
      return splitLienAvecContext(lien, null, foundDet, determinants, titres);
    } else if (type_acte == 'décès') {
      lien += ' du défunt';
      foundDet = ' du ';
      return splitLienAvecContext(lien, null, foundDet, determinants, titres);
    }
    return null;
  }

  return {
    avant: lien.slice(0, indexDet).trim(),
    apres: lien.slice(indexDet + foundDet.length).trim(),
  };
}

/** Fonction principale : détecte les relations à partir des liens */
export async function detectRelationsPreview(): Promise<RelationPreview[]> {
  // 1. Charger tous les candidats
  const candidats = await fetchAllFromTable<{
    id: string;
    acteur_source_id: string;
    acteur_source_role: string;
    acte_id: string;
    source_table: string;
    lien: string;
  }>('staging_relations_candidates', 'id, acteur_source_id, acteur_source_role, acte_id, source_table, lien');

  // 2. Charger tous les acteurs
  const acteurs = await fetchAllFromTable<{
    id: string;
    acte_id: string;
    nom: string;
    prenom: string;
    qualite: string;
    source_table: string;
    acte_type: string;
    role: string | null;
  }>('v_acteurs_enrichis', 'id, acte_id, qualite, nom, prenom, source_table, acte_type, role');

  // 3. Indexer les acteurs par acte_id + source_table
  const indexActeurs: Record<string, ActeurMinimal[]> = indexerActeurs(acteurs);

  // 4. Détection des relations
  const relations: RelationPreview[] = [];

  for (const candidat of candidats) {
    const extractions = extraireRelationDepuisLien(
      candidat.lien,
      candidat.acte_id,
      candidat.source_table,
      indexActeurs,
    );

    for (const extraction of extractions) {
      relations.push({
        acte_id: candidat.acte_id,
        source_table: candidat.source_table,
        acteur_source_id: candidat.acteur_source_id,
        acteur_source_role: candidat.acteur_source_role,
        acteur_cible_id: extraction.acteurCibleId,
        acteur_cible_role: extraction.acteurCibleRole,
        relation_type: extraction.relationType,
        relation_mode: 'explicite',
        relation_precision: extraction.relationPrecision,
        source_mention: candidat.lien,
        statut: extraction.statut,
      });
    }
  }
  // 5. Détection des relations implicites (à partir des relations explicites ET déduites par rôle)
  const relationsParActe = new Map<
    string,
    { acteurs: ActeurMinimal[]; relations: RelationPreview[] }
  >();

  for (const relation of relations) {
    const key = `${relation.acte_id}::${relation.source_table}`;
    if (!relationsParActe.has(key)) {
      const acteursPourActe = indexActeurs[key] || [];
      relationsParActe.set(key, { acteurs: acteursPourActe, relations: [] });
    }
    relationsParActe.get(key)!.relations.push(relation);
  }

  for (const [key, { acteurs, relations: relationsExplicites }] of relationsParActe.entries()) {
    const [acteId, sourceTable] = key.split('::');

    // 🆕 1. Ajouter les relations par rôle
    const relationsParRole = getRelationsParRole(acteurs, acteId, sourceTable);

    // 2. Construire graphe complet : explicites + rôle
    const graphe = construireGraphePourActe(acteId, sourceTable, acteurs, [
      ...relationsExplicites,
      ...relationsParRole,
    ]);

    // 3. Déduire les relations implicites
    const implicites = deduireRelationsImplicites(graphe, acteId, sourceTable, [
      ...relationsExplicites,
      ...relationsParRole,
    ], acteurs);

    if (implicites.length > 0) console.log('implicites', implicites);

    relations.push(...implicites);
  }

  return relations;
}

function getRelationsParRole(
  acteurs: ActeurMinimal[],
  acteId: string,
  sourceTable: string,
): RelationPreview[] {
  const mapping: [string, string, string][] = [
    ['enfant', 'père', 'enfant'],
    ['enfant', 'mère', 'enfant'],
    ['père', 'enfant', 'père'],
    ['mère', 'enfant', 'mère'],
    ['défunt', 'père', 'enfant'],
    ['défunt', 'mère', 'enfant'],
    ['père', 'défunt', 'père'],
    ['mère', 'défunt', 'mère'],
    ['enfant légitimé', 'époux', 'enfant'],
    ['enfant légitimé', 'épouse', 'enfant'],
    ['époux', 'enfant légitimé', 'père'],
    ['épouse', 'enfant légitimé', 'mère'],
    ['sujet', 'père', 'enfant'],
    ['sujet', 'mère', 'enfant'],
    ['père', 'sujet', 'père'],
    ['mère', 'sujet', 'mère'],
    ['époux', 'époux-père', 'enfant'],
    ['époux', 'époux-mère', 'enfant'],
    ['époux-père', 'époux', 'père'],
    ['époux-mère', 'époux', 'mère'],
    ['épouse', 'épouse-père', 'enfant'],
    ['épouse', 'épouse-mère', 'enfant'],
    ['épouse-père', 'épouse', 'père'],
    ['épouse-mère', 'épouse', 'mère'],
  ];

  const relations: RelationPreview[] = [];

  for (const [roleSource, roleCible, relationType] of mapping) {
    for (const source of acteurs) {
      if (source.role !== roleSource) continue;
      for (const cible of acteurs) {
        if (cible.role !== roleCible) continue;
        if (source.id === cible.id) continue;

        relations.push({
          acte_id: acteId,
          source_table: sourceTable,
          acteur_source_id: source.id,
          acteur_source_role: source.role,
          acteur_cible_id: cible.id,
          acteur_cible_role: cible.role,
          relation_type: relationType,
          relation_mode: 'explicite',
          relation_precision: null,
          source_mention: 'rôle',
          statut: 'unique',
        });
      }
    }
  }

  return relations;
}

export async function saveRelationsPreviewToSupabase(relations: RelationPreview[]) {
  if (relations.length === 0) {
    console.warn('Aucune relation à enregistrer.');
    return;
  }
  console.log('relations to insert in staging_transcription_acteurs_relations', relations);
  const { error } = await supabase
    .from('staging_transcription_acteurs_relations')
    .insert(relations);

  if (error) {
    console.error("[Supabase] Erreur d'insertion des relations :", error.message);
  } else {
    console.log(
      `[Supabase] ${relations.length} relations insérées dans staging_transcription_acteurs_relations.`,
    );
  }
}

export async function recalculerRelationsPourActe(
  acteId: string,
  sourceTable: string,
  acteurs: any,
) {
  for (const a of acteurs) {
    await recalculerRelationsPourActeur(a, acteId, sourceTable, acteurs);
  }
  await recalculerRelationsImplicitesPourActe(acteId, sourceTable, acteurs);
}

export async function recalculerRelationsPourActeur(
  acteur: any,
  acteId: string,
  sourceTable: string,
  acteurs: any,
) {
  if (!acteur?.id || !acteur?.lien) return;

  try {
    // 1. Supprimer les anciennes relations de cet acteur
    await supabase
      .from('staging_transcription_acteurs_relations')
      .delete()
      .match({ acteur_source_id: acteur.id });

    // 2. Construire un index minimal avec cet acteur
    const indexActeurs: Record<string, ActeurMinimal[]> = indexerActeurs(acteurs);

    // 3. Extraire les relations à partir du champ lien
    const extractions = extraireRelationDepuisLien(acteur.lien, acteId, sourceTable, indexActeurs);

    // 4. Mapper au format RelationPreview
    const relations = extractions.map((rel) => ({
      acte_id: acteId,
      source_table: sourceTable,
      acteur_source_id: acteur.id,
      acteur_source_role: acteur.role,
      acteur_cible_id: rel.acteurCibleId,
      acteur_cible_role: rel.acteurCibleRole,
      relation_type: rel.relationType,
      relation_mode: 'explicite' as const,
      relation_precision: rel.relationPrecision,
      source_mention: acteur.lien,
      statut: rel.statut,
    }));

    // 5. Enregistrer dans Supabase
    await saveRelationsPreviewToSupabase(relations);
  } catch (err) {
    console.error('[recalculerRelationsPourActeur] Erreur :', err);
  }
}
export async function recalculerRelationsImplicitesPourActe(
  acteId: string,
  sourceTable: string,
  acteurs: ActeurMinimal[],
) {
  try {
    const relationsExistantes = await fetchRelationsForActeId(acteId, sourceTable);

    const graphe: GrapheActe = construireGraphePourActe(
      acteId,
      sourceTable,
      acteurs,
      relationsExistantes,
    );

    const relationsImplicites = deduireRelationsImplicites(
      graphe,
      acteId,
      sourceTable,
      relationsExistantes,
      acteurs
    );

    if (relationsImplicites.length === 0) {
      console.log(
        `[recalculerRelationsImplicitesPourActe] Aucune relation implicite à insérer pour acte ${acteId}.`,
      );
      return;
    }

    await saveRelationsPreviewToSupabase(relationsImplicites);
  } catch (err) {
    console.error('[recalculerRelationsImplicitesPourActe] Erreur :', err);
  }
}

function deduireRelationsImplicites(
  graphe: GrapheActe,
  acteId: string,
  sourceTable: string,
  relationsPreview: RelationPreview[],
  acteurs: ActeurMinimal[],
): RelationPreview[] {
  const nouvellesRelations: RelationPreview[] = [];

  for (const rule of relationRules) {
    for (const rel1 of graphe.relations) {
      for (const rel2 of graphe.relations) {
        // On cherche deux relations ayant la même cible (Z) mais des sources différentes (X et Y)
        if (rel1.cible !== rel2.cible || rel1.source === rel2.source) continue;

        const map = {
          X: rel1.source,
          Y: rel2.source,
          Z: rel1.cible,
        };

        const match1 = conditionMatch(rel1, rule.si[0], map, relationsPreview);
        const match2 = conditionMatch(rel2, rule.si[1], map, relationsPreview);

        if (match1 && match2) {
          for (const conclusion of rule.alors) {
            const source = map[conclusion.source];
            const cible = map[conclusion.cible];
            const type = conclusion.type;

            const alreadyExists = graphe.relations.some(
              (r) => r.source === source && r.cible === cible && r.type === type,
            );

            if (!alreadyExists) {
                const { sourceRole, cibleRole } = getRolesFromActeurs(source, cible, acteurs);
              nouvellesRelations.push({
                acte_id: acteId,
                source_table: sourceTable,
                acteur_source_id: source,
                acteur_source_role: sourceRole,
                acteur_cible_id: cible,
                acteur_cible_role: cibleRole,
                relation_type: type,
                relation_mode: 'implicite',
                relation_precision: null,
                source_mention: `Déduction implicite : ${rule.description}`,
                statut: 'unique',
              });
            }
          }
        }
      }
    }
  }

  return nouvellesRelations;
}
function getRolesFromActeurs(
  sourceId: string,
  cibleId: string,
  acteurs: ActeurMinimal[],
): { sourceRole: string; cibleRole: string } {
  const source = acteurs.find((a) => a.id === sourceId);
  const cible = acteurs.find((a) => a.id === cibleId);

  return {
    sourceRole: source?.role ?? 'inconnu',
    cibleRole: cible?.role ?? 'inconnu',
  };
}


function indexerActeurs(acteurs: any): Record<string, ActeurMinimal[]> {
  const indexActeurs: Record<string, ActeurMinimal[]> = {};
  for (const a of acteurs) {
    const key = `${a.acte_id}::${a.source_table}`;
    if (!indexActeurs[key]) indexActeurs[key] = [];
    indexActeurs[key].push({
      id: a.id,
      qualite: a.qualite,
      nom: a.nom,
      prenom: a.prenom,
      acte_type: a.acte_type,
      role: a.role?.toLowerCase?.() || '',
    });
  }
  return indexActeurs;
}

export async function fetchRelationsForActeId(
  acteId: string,
  sourceTable: string = 'etat_civil_actes',
): Promise<RelationPreview[]> {
  const { data, error } = await supabase
    .from('staging_transcription_acteurs_relations')
    .select(
      'acte_id, source_table, acteur_source_id, acteur_source_role, acteur_cible_id, acteur_cible_role, relation_type, relation_mode, relation_precision, source_mention, statut',
    )
    .eq('acte_id', acteId)
    .eq('source_table', sourceTable);

  if (error) {
    console.error(
      '[fetchRelationsForActeId] Erreur de récupération des relations :',
      error.message,
    );
    return [];
  }

  return (data ?? []) as RelationPreview[];
}
function conditionMatch(
  rel: RelationGraphe,
  condition: Condition,
  map: Record<VariableSymbole, string>,
  allRelations: RelationPreview[],
): boolean {
  const sourceMatch = rel.source === map[condition.source];
  const cibleMatch = rel.cible === map[condition.cible];
  const typeMatch = rel.type === condition.type;

  const relationPreview = allRelations.find(
    (r) =>
      r.acteur_source_id === rel.source &&
      r.acteur_cible_id === rel.cible &&
      r.relation_type === rel.type,
  );

  if (!sourceMatch || !cibleMatch || !typeMatch) return false;

  if (condition.precision) {
    const precisions = Array.isArray(condition.precision)
      ? condition.precision
      : [condition.precision];
    return precisions.includes(relationPreview?.relation_precision ?? undefined);
  }

  return true;
}
