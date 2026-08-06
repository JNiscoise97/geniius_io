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


export const PAGINATION_OPTIONS = [
  { value: '', label: '—' },
  { value: 'vues', label: 'Vues' },
  { value: 'pages', label: 'Pages' },
  { value: 'folios', label: 'Folios' },
  { value: 'images', label: 'Images' },
] as const;