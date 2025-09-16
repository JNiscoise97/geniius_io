// features/etat-civil/data/mappers.ts
// ♻️ Fonctions pures réutilisées par les deux stores

export const arr = <T>(v: T | T[] | null | undefined): T[] =>
  Array.isArray(v) ? v : v ? [v] : [];

export const one = <T>(v: T | T[] | null | undefined): T | undefined =>
  Array.isArray(v) ? v[0] : v || undefined;

export function enrichActorWithToponymesMentions(actor: any) {
  const pick = (f: string) => arr(actor?.mentions_toponymes).find((m: any) => m.fonction === f);
  const n = pick('naissance');
  const d = pick('deces');
  const h = pick('domicile');
  const r = pick('residence');
  const o = pick('origine');

  return {
    ...actor,
    naissance_mention_toponyme_id: n?.toponyme_id ?? null,
    naissance_path_labels: n?.path_labels ?? [],
    naissance_path_toponyme_ids: n?.path_toponyme_ids ?? [],
    deces_mention_toponyme_id: d?.toponyme_id ?? null,
    deces_path_labels: d?.path_labels ?? [],
    deces_path_toponyme_ids: d?.path_toponyme_ids ?? [],
    domicile_mention_toponyme_id: h?.toponyme_id ?? null,
    domicile_path_labels: h?.path_labels ?? [],
    domicile_path_toponyme_ids: h?.path_toponyme_ids ?? [],
    residence_mention_toponyme_id: r?.toponyme_id ?? null,
    residence_path_labels: r?.path_labels ?? [],
    residence_path_toponyme_ids: r?.path_toponyme_ids ?? [],
    origine_mention_toponyme_id: o?.toponyme_id ?? null,
    origine_path_labels: o?.path_labels ?? [],
    origine_path_toponyme_ids: o?.path_toponyme_ids ?? [],
  };
}

export function enrichActorWithRefs(actor: any) {
  const sex = actor?.sexe;

  // Catégories couleur
  const cats = arr(actor?.categories_couleur);
  const categorie_couleur_ids = cats.map(x => x?.categorie_couleur_id).filter(Boolean);
  const categorie_couleur_labels = cats.map(x => {
    const r = x?.ref || {};
    if (r.invariable) return r.label;
    if (sex === 'F' && r.label_f) return r.label_f;
    if (sex === 'M' && r.label_m) return r.label_m;
    return r.label;
  }).filter(Boolean);

  // Filiations
  const fils = arr(actor?.filiations);
  const filiation_ids = fils.map(x => x?.filiation_id).filter(Boolean);
  const filiation_labels = fils.map(x => x?.ref?.label).filter(Boolean);

  // Professions (ordre par position)
  const profs = arr(actor?.professions).slice()
    .sort((a: any, b: any) => (a?.position ?? 999) - (b?.position ?? 999));
  const profession_ids = profs.map(x => x?.profession_id).filter(Boolean);
  const profession_labels = profs.map(x => {
    const r = x?.ref || {};
    if (r.invariable) return r.label;
    if (sex === 'F' && r.label_f) return r.label_f;
    if (sex === 'M' && r.label_m) return r.label_m;
    return r.label;
  }).filter(Boolean);
  const profession_positions = profs.map(x => x?.position).filter((n: any) => typeof n === 'number');

  // Qualités
  const quals = arr(actor?.qualites);
  const qualite_ids = quals.map(x => x?.qualite_id).filter(Boolean);
  const qualite_labels = quals.map(x => x?.ref?.label).filter(Boolean);

  // Signatures
  const signs = arr(actor?.signatures);
  const signature_ids = signs.map(x => x?.signature_id).filter(Boolean);
  const signature_labels = signs.map(x => x?.ref?.label).filter(Boolean);

  // Situations fiscales / matrimoniales
  const sitf = arr(actor?.situations_fiscales);
  const situation_fiscale_ids = sitf.map(x => x?.situation_fiscale_id).filter(Boolean);
  const situation_fiscale_labels = sitf.map(x => {
    const r = x?.ref || {};
    if (r.invariable) return r.label;
    if (sex === 'F' && r.label_f) return r.label_f;
    if (sex === 'M' && r.label_m) return r.label_m;
    return r.label;
  }).filter(Boolean);

  const sitm = arr(actor?.situations_matrimoniales);
  const situation_matrimoniale_ids = sitm.map(x => x?.situation_matrimoniale_id).filter(Boolean);
  const situation_matrimoniale_labels = sitm.map(x => {
    const r = x?.ref || {};
    if (r.invariable) return r.label;
    if (sex === 'F' && r.label_f) return r.label_f;
    if (sex === 'M' && r.label_m) return r.label_m;
    return r.label;
  }).filter(Boolean);

  // Statuts juridiques / propriétaires
  const stj = arr(actor?.statuts_juridiques);
  const statut_juridique_ids = stj.map(x => x?.statut_juridique_id).filter(Boolean);
  const statut_juridique_labels = stj.map(x => {
    const r = x?.ref || {};
    if (r.invariable) return r.label;
    if (sex === 'F' && r.label_f) return r.label_f;
    if (sex === 'M' && r.label_m) return r.label_m;
    return r.label;
  }).filter(Boolean);

  const stp = arr(actor?.statuts_proprietaires);
  const statut_proprietaire_ids = stp.map(x => x?.statut_proprietaire_id).filter(Boolean);
  const statut_proprietaire_labels = stp.map(x => {
    const r = x?.ref || {};
    if (r.invariable) return r.label;
    if (sex === 'F' && r.label_f) return r.label_f;
    if (sex === 'M' && r.label_m) return r.label_m;
    return r.label;
  }).filter(Boolean);

  // Liens
  const liensRaw = arr(actor?.liens).map((x: any) => {
    const r = x?.ref || {};
    return {
      id: x?.id,
      lien_id: x?.lien_id,
      code: r?.code ?? null,
      nature: r?.nature ?? null,
      degre: r?.degre ?? null,
      label: r?.label ?? null,
      label_m: r?.label_m ?? null,
      label_f: r?.label_f ?? null,
      invariable: !!r?.invariable,
      cible_type: x?.cible_type,
      cible_role: x?.cible_role ?? null,
      cible_label: x?.cible_label ?? null,
      cible_acteur: x?.cible_acteur
        ? {
            id: x.cible_acteur.id,
            nom: x.cible_acteur.nom,
            prenom: x.cible_acteur.prenom,
            sexe: x.cible_acteur.sexe,
            role: x.cible_acteur.role ?? null,
          }
        : null,
      cote: x?.cote ?? null,
      fratrie_qualif: x?.fratrie_qualif ?? null,
      cousin_degre: x?.cousin_degre ?? null,
      cousin_removal: x?.cousin_removal ?? null,
      cousin_double: !!x?.cousin_double,
      ascend_n: x?.ascend_n ?? null,
      descend_n: x?.descend_n ?? null,
      position: typeof x?.position === 'number' ? x.position : 1,
    };
  }).sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

  const liens_matrimoniaux_ref = liensRaw.filter((l: any) => l.nature === 'mariage');
  const liens_non_matrimoniaux_ref = liensRaw.filter((l: any) => l.nature !== 'mariage');

  // Notes
  const notes_ref = arr(actor?.notes).map((x: any) => ({
    id: x?.id ?? null,
    type_code: x?.type_code ?? 'libre',
    texte: x?.texte ?? null,
    date_evenement: x?.date_evenement ?? null,
    date_precision: x?.date_precision ?? 'inconnue',
    bureau_id: x?.bureau_id ?? null,
    registre_id: x?.registre_id ?? null,
    acte_id: x?.acte_id ?? null,
    inscription_nature: x?.inscription_nature ?? null,
    annee_registre: Number.isFinite(x?.annee_registre) ? x.annee_registre : null,
    numero_acte: Number.isFinite(x?.numero_acte) ? x.numero_acte : null,
    target_kind: x?.target_kind ?? null,
    target_acte_ac_id: x?.target_acte_ac_id ?? null,
    target_acte_ec_id: x?.target_acte_ec_id ?? null,
    target_label: x?.target_label ?? null,
    position: typeof x?.position === 'number' ? x.position : 1,
  })).sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

  return {
    ...actor,
    // Catégories couleur
    categorie_couleur_ids,
    categorie_couleur_labels,
    // Filiations
    filiation_ids,
    filiation_labels,
    // Professions
    profession_ids,
    profession_labels,
    profession_positions,
    // Qualités
    qualite_ids,
    qualite_labels,
    // Signatures
    signature_ids,
    signature_labels,
    // Situations
    situation_fiscale_ids,
    situation_fiscale_labels,
    situation_matrimoniale_ids,
    situation_matrimoniale_labels,
    // Statuts
    statut_juridique_ids,
    statut_juridique_labels,
    statut_proprietaire_ids,
    statut_proprietaire_labels,
    // Liens / Notes
    liens_matrimoniaux_ref,
    liens_non_matrimoniaux_ref,
    notes_ref,
  };
}

/**
 * Normalise un acteur "raw" venant d’un mapping Supabase, lui ajoute individu_id si dispo,
 * puis applique les enrichissements (toponymes + refs).
 */
export function buildEnrichedActor(rawActor: any, individuByActeurId?: Map<string, string>) {
  if (!rawActor) return undefined;
  const individu_id = rawActor?.id ? individuByActeurId?.get(rawActor.id) : undefined;
  const base = { ...rawActor, individu_id };
  return enrichActorWithRefs(enrichActorWithToponymesMentions(base));
}

/**
 * Récupère l’acteur unique depuis un bloc "mapping" (gère array vs objet).
 */
export function getActorFromMapping(mapping: any) {
  const acteur = mapping?.acteur ? one(mapping.acteur) : undefined;
  return acteur;
}
