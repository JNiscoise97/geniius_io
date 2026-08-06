import { supabase } from './client'
import { supabaseRebond } from './rebondSchemaClient'

// RefSinglePickerSmart (et tout futur code générique adossé à
// src/types/referentiel.ts::REF_TABLES) interroge une table dont le nom lui
// est passé dynamiquement — impossible de savoir statiquement quel client
// utiliser. On maintient ici la liste des tables de ce catalogue déjà
// basculées vers le schéma `rebond` ; toutes les autres restent sur `public`
// par défaut. À compléter à chaque nouvelle table migrée.
const REBOND_SCHEMA_REF_TABLES = new Set([
  'ref_physical_condition',
  'ref_repro_quality',
  'ref_document_damage_kinds',
  'ref_langues',
  'ref_ecritures',
  'ref_handwriting_legibility',
  'ref_document_readability_features',
  'ref_etat_civil_type_acte',
  'ref_natures',
  'ref_supports',
  'ref_etat_civil_registre_fonction',
  'ref_etat_civil_registre_mode',
  'ref_etat_civil_registre_norme',
  'ref_etat_civil_registre_ordre_numerotation',
  'ref_etat_civil_registre_pagination',
  'ref_etat_civil_registre_regime_fiscal_support',
  'ref_etat_civil_registre_statut_juridique',
  'ref_etat_civil_registre_support',
  'ref_auteur_institutionnel',
  'ref_type_acces',
  'ref_etat_civil_transcription_status',
])

export function resolveRefTableClient(table: string) {
  return REBOND_SCHEMA_REF_TABLES.has(table) ? supabaseRebond : supabase
}
