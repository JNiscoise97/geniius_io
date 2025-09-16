// fichier: types/relations.ts

export type RelationPreview = {
  acte_id: string;
  source_table: string;
  acteur_source_id: string;
  acteur_source_role: string;
  acteur_cible_id: string | null;
  acteur_cible_role: string | null;
  relation_type: string | null;
  relation_mode: 'explicite' | 'implicite';
  relation_precision: string | null;
  source_mention: string;
  statut: 'unique' | 'ambigu' | 'introuvable' | 'erreur';
};

export type ActeurMinimal = {
  id: string;
  qualite: string | null;
  nom: string | null;
  prenom: string | null;
  acte_type: string | null;
  role: string | null;
};

export type RelationExtraction = {
  relationType: string | null;
  relationPrecision: string | null;
  roleCible: string | null;
  acteurCibleId: string | null;
  acteurCibleRole: string | null;
  statut: 'unique' | 'ambigu' | 'introuvable' | 'erreur';
};

export type RelationGraphe = {
  source: string;
  cible: string;
  type: string;
  mode: 'explicite' | 'implicite';
};

export type GrapheActe = {
  acteurs: Record<string, ActeurMinimal>;
  relations: RelationGraphe[];
};

export type VariableSymbole = 'X' | 'Y' | 'Z';

export type Condition = {
  source: VariableSymbole;
  type: string;
  cible: VariableSymbole;
  precision?: (string | undefined)[] | string;
};

export type Conclusion = {
  source: VariableSymbole;
  type: string;
  cible: VariableSymbole;
};

export type RelationImpliciteRule = {
  si: [Condition, Condition];
  alors: Conclusion[];
  description: string;
};

export const relationRules: RelationImpliciteRule[] = [
  // Règle mère + frère
  {
    si: [
      { source: 'X', type: 'mère', cible: 'Z' },
      {
        source: 'Y',
        type: 'frère',
        cible: 'Z',
        precision: ['utérin', 'jumeau', 'naturel', undefined],
      },
    ],
    alors: [
      { source: 'X', type: 'mère', cible: 'Y' },
      { source: 'Y', type: 'fils', cible: 'X' },
    ],
    description: 'La mère et le frère d’un acteur ⇒ la mère est aussi la mère du frère.',
  },
  // Règle père + frère
  {
    si: [
      { source: 'X', type: 'père', cible: 'Z' },
      {
        source: 'Y',
        type: 'frère',
        cible: 'Z',
        precision: ['consanguin', 'jumeau', 'naturel', 'adultérin', undefined],
      },
    ],
    alors: [
      { source: 'X', type: 'père', cible: 'Y' },
      { source: 'Y', type: 'fils', cible: 'X' },
    ],
    description: 'Le père et le frère d’un acteur ⇒ le père est aussi le père du frère.',
  },
  // Règle mère + sœur
  {
    si: [
      { source: 'X', type: 'mère', cible: 'Z' },
      {
        source: 'Y',
        type: 'sœur',
        cible: 'Z',
        precision: ['utérine', 'jumelle', 'naturelle', undefined],
      },
    ],
    alors: [
      { source: 'X', type: 'mère', cible: 'Y' },
      { source: 'Y', type: 'fille', cible: 'X' },
    ],
    description: 'La mère et la sœur d’un acteur ⇒ la mère est aussi la mère de la sœur.',
  },
  // Règle père + sœur
  {
    si: [
      { source: 'X', type: 'père', cible: 'Z' },
      {
        source: 'Y',
        type: 'sœur',
        cible: 'Z',
        precision: ['consanguine', 'jumelle', 'naturelle', 'adultérine', undefined],
      },
    ],
    alors: [
      { source: 'X', type: 'père', cible: 'Y' },
      { source: 'Y', type: 'fille', cible: 'X' },
    ],
    description: 'Le père et la sœur d’un acteur ⇒ le père est aussi le père de la sœur.',
  },
];
