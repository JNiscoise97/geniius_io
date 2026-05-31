import { type GedcomEventAssoc } from '@geniius/utils/family-graph'
import { getPerson } from '../../data'

// ── Tables de traduction ──────────────────────────────────────────────────────

/**
 * Rôles dont le libellé dépend du sexe de la personne liée.
 * Forme : [masculin, féminin]
 */
const GENDERED_ROLES: Record<string, [string, string]> = {
  godfather:   ['Parrain',    'Marraine'],
  godmother:   ['Parrain',    'Marraine'],  // alias → même résolution
  godparent:   ['Parrain',    'Marraine'],
  godchild:    ['Filleul',    'Filleule'],
  witness:     ['Témoin',     'Témoin'],
  householder: ['Propriétaire','Propriétaire'],
  attending:   ['Présent',    'Présente'],
  sibling:     ['Frère',      'Sœur'],
  grandchild:  ['Petit-fils', 'Petite-fille'],
  grandparent: ['Grand-père', 'Grand-mère'],
  cousin:      ['Cousin',     'Cousine'],
  guardian:    ['Tuteur',     'Tutrice'],
  adoptive:    ['Adoptant',   'Adoptante'],
  officiant:   ['Officiant',  'Officiante'],
  celebrant:   ['Célébrant',  'Célébrante'],
}

/** Rôles non genrés */
const NEUTRAL_ROLES: Record<string, string> = {
  father:            'Père',
  mother:            'Mère',
  child:             'Enfant',
  husband:           'Époux',
  wife:              'Épouse',
  spouse:            'Conjoint(e)',
  informant:         'Déclarant',
  priest:            'Prêtre',
  notary:            'Notaire',
  judge:             'Juge',
  doctor:            'Médecin',
  midwife:           'Sage-femme',
  'son-in-law':      'Gendre',
  'daughter-in-law': 'Belle-fille',
  'father-in-law':   'Beau-père',
  'mother-in-law':   'Belle-mère',
  'brother-in-law':  'Beau-frère',
  'sister-in-law':   'Belle-sœur',
  brother:           'Frère',
  sister:            'Sœur',
  uncle:             'Oncle',
  aunt:              'Tante',
  nephew:            'Neveu',
  niece:             'Nièce',
  grandfather:       'Grand-père',
  grandmother:       'Grand-mère',
  grandson:          'Petit-fils',
  granddaughter:     'Petite-fille',
  // Rôles flous → vides (on tombera sur title en fallback)
  other:       '',
  unknown:     '',
  participant: '',
  mentioned:   '',
}

// ── Résolution ────────────────────────────────────────────────────────────────

/**
 * Résout le libellé de rôle d'un ASSO en tenant compte du sexe.
 *
 * Priorité :
 *  1. role (traduit, gendré si besoin)
 *  2. rela (traduit, gendré si besoin) — seulement si apporte une info différente
 *  3. title (verbatim GEDCOM) comme fallback quand role/rela sont "Other"/vides
 */
export function resolveRoleLabel(assoc: GedcomEventAssoc): string {
  const sex = assoc.id ? (getPerson(assoc.id)?.sex ?? 'U') : 'U'

  const translate = (raw: string): string => {
    const key = raw.trim().toLowerCase()

    // Rôle gendré
    const gendered = GENDERED_ROLES[key]
    if (gendered) {
      return sex === 'F' ? gendered[1] : gendered[0]
    }

    // Rôle neutre
    if (key in NEUTRAL_ROLES) return NEUTRAL_ROLES[key]

    // Inconnu → conserve l'original (peut être un texte libre GEDCOM)
    return raw
  }

  const trRole = assoc.role ? translate(assoc.role) : ''
  const trRela = assoc.rela ? translate(assoc.rela) : ''

  // Si role est vide après traduction (Other…) → essaie rela, puis title
  const primary = trRole || trRela || assoc.title || ''

  // Ajoute rela seulement si elle apporte une info distincte du role
  const secondary =
    trRela && trRela !== primary && trRela !== trRole ? trRela : ''

  return [primary, secondary].filter(Boolean).join(' · ')
}