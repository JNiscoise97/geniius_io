import type { GedcomEvent } from '@geniius/utils/family-graph'

export const EVENT_LABELS: Record<string, string> = {
  BIRT: 'Naissance',         DEAT: 'Décès',           BURI: 'Inhumation',
  CHR:  'Baptême',           CONF: 'Confirmation',    FCOM: 'Première communion',
  MARR: 'Mariage',           DIVO: 'Divorce',         ENGA: 'Fiançailles',
  ADOP: 'Adoption',          NATU: 'Naturalisation',  EMIG: 'Émigration',
  IMMI: 'Immigration',       CENS: 'Recensement',     RESI: 'Résidence',
  OCCU: 'Profession',        PROP: 'Propriété',       WILL: 'Testament',
  GRAD: 'Diplôme',           HEAL: 'Santé',           DSCR: 'Description',
  EVEN: 'Événement',         FACT: 'Fait',
}

/**
 * Retourne le libellé d'un événement GEDCOM.
 * Pour les tags génériques EVEN/FACT, préfère event.type (ex. "Recensement militaire").
 * Pour les autres, utilise le dictionnaire, puis event.type, puis le tag brut.
 */
export function getEventLabel(event: GedcomEvent): string {
  if (event.type && (event.tag === 'EVEN' || event.tag === 'FACT')) return event.type
  return EVENT_LABELS[event.tag] ?? event.type ?? event.tag
}
