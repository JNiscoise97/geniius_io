// Unité matérielle
export const TYPE_UNITE_OPTIONS = [
  { value: 'registre', label: 'Registre' },
  { value: 'volume', label: 'Volume' },
  { value: 'liasse', label: 'Liasse' },
  { value: 'bobine', label: 'Bobine' },
  { value: 'microfilm', label: 'Microfilm' },
  { value: 'autre', label: 'Autre' },
] as const;

export type TypeUnite = typeof TYPE_UNITE_OPTIONS[number]['value'];

/* ------------------------------------------------------------------ */
/* État de conservation (physique)                                     */
/* ------------------------------------------------------------------ */

export const ETAT_CONSERVATION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'bon', label: 'Bon' },
  { value: 'correct', label: 'Correct' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'degrade', label: 'Dégradé' },
  { value: 'tres_degrade', label: 'Très dégradé' },
  { value: 'fragile', label: 'Fragile / à manipuler avec précaution' },
  { value: 'incomplet', label: 'Incomplet' },
  { value: 'inconnu', label: 'Inconnu' },
] as const;

export type EtatConservation =
  typeof ETAT_CONSERVATION_OPTIONS[number]['value'];

/* ------------------------------------------------------------------ */
/* Qualité (repro / numérique)                                         */
/* ------------------------------------------------------------------ */

export const QUALITE_OPTIONS = [
  { value: 'excellente', label: 'Excellente' },
  { value: 'bonne', label: 'Bonne' },
  { value: 'correcte', label: 'Correcte' },
  { value: 'faible', label: 'Faible' },
  { value: 'tres_faible', label: 'Très faible' },
  { value: 'hd', label: 'Haute définition (HD)' },
  { value: 'sd', label: 'Définition standard (SD)' },
  { value: 'lisible', label: 'Lisible' },
  { value: 'peu_lisible', label: 'Peu lisible' },
  { value: 'illisible', label: 'Illisible' },
  { value: 'inconnue', label: 'Inconnue' },
] as const;

export type Qualite = typeof QUALITE_OPTIONS[number]['value'];



export const PAGINATION_OPTIONS = [
  { value: '', label: '—' },
  { value: 'vues', label: 'Vues' },
  { value: 'pages', label: 'Pages' },
  { value: 'folios', label: 'Folios' },
  { value: 'images', label: 'Images' },
] as const;