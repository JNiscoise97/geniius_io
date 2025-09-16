export type NoteTypeCode =
  | 'etat_civil_inscription'
  | 'administratif'
  | 'statut_familial'
  | 'transaction'
  | 'libre';

export type DatePrecision = 'jour' | 'mois' | 'annee' | 'inconnue';

export type TargetKind = 'acte_not' | 'acte_etat_civil' | 'texte';

export interface NoteDraft {
  id?: string;              // row id
  acteur_id?: string;       // pour confort lors du save
  // classification
  type_code: NoteTypeCode;
  texte?: string | null;

  // datation
  date_evenement?: string | null;     // ISO yyyy-mm-dd
  date_precision?: DatePrecision | null;

  // ancrages état-civil
  bureau_id?: string | null;
  registre_id?: string | null;
  acte_id?: string | null;

  // pattern inscription (facultatif)
  inscription_nature?: 'naissance'|'mariage'|'deces'|'affranchissement'|'nouveaux libres'|'autre'|null;
  annee_registre?: number | null;
  numero_acte?: number | null;

  // cible
  target_kind?: TargetKind | null;
  target_acte_ac_id?: string | null;
  target_acte_ec_id?: string | null;
  target_label?: string | null;

  position?: number | null;
}
