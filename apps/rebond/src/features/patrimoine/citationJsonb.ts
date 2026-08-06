// citationJsonb.ts
// Pack/unpack partagés pour les colonnes jsonb citations.marginalia et
// citations.writing — utilisés à l'identique par DocumentDetailPage et la
// sheet "Décrire" de PatrimoineDocumentairePage (même formulaire, deux
// points d'entrée : édition continue vs workflow pas-à-pas).

// citations.locating a deux formes en usage dans le code actuel, non
// unifiées (voir audit patrimoine documentaire) :
//   - { systems: [{ raw }] } — écrite par DecrireDocumentSheet/DocumentDetailPage/ReferenceWizardPage
//   - { raw, systems: [{ start, end, kind }] } — écrite par EnrichirExemplaireActePage (packLocating)
// Le type reflète les deux formes telles quelles plutôt que d'en choisir une
// arbitrairement ; unifier le schéma jsonb est un changement de comportement
// à valider séparément.
export type LocatingSystem = {
  raw?: string
  start?: number
  end?: number
  kind?: string
}

export type LocatingJson = {
  systems?: LocatingSystem[]
  raw?: string
  missing_ranges?: unknown[]
}

export type MarginaliaJson = {
  present?: {
    signatures?: boolean | null
    marginal_mentions?: boolean | null
    marginal_crossouts?: boolean | null
  }
  count?: {
    signatures?: number | null
    marginal_mentions?: number | null
    marginal_crossouts?: number | null
  }
}

export type MarginaliaFields = {
  signatures_present: boolean | null
  signatures_count: number | null
  marginal_mentions_present: boolean | null
  marginal_mentions_count: number | null
  marginal_crossouts_present: boolean | null
  marginal_crossouts_count: number | null
}

export type WritingJson = {
  ecriture_ref?: string
  legibility_ref?: string
  damage_notes?: string
  repro_notes?: string
}

export type WritingFields = {
  ecriture_ref: string | null
  handwriting_legibility_ref: string | null
  damage_notes: string
  repro_notes: string
}

export function unpackMarginalia(mar: MarginaliaJson | null): MarginaliaFields {
  const present = mar?.present ?? {}
  const count = mar?.count ?? {}
  return {
    signatures_present: present.signatures ?? null,
    signatures_count: count.signatures ?? null,
    marginal_mentions_present: present.marginal_mentions ?? null,
    marginal_mentions_count: count.marginal_mentions ?? null,
    marginal_crossouts_present: present.marginal_crossouts ?? null,
    marginal_crossouts_count: count.marginal_crossouts ?? null,
  }
}

export function packMarginalia(c: MarginaliaFields): MarginaliaJson {
  return {
    present: {
      signatures: c.signatures_present,
      marginal_mentions: c.marginal_mentions_present,
      marginal_crossouts: c.marginal_crossouts_present,
    },
    count: {
      signatures: c.signatures_present === true ? c.signatures_count : null,
      marginal_mentions: c.marginal_mentions_present === true ? c.marginal_mentions_count : null,
      marginal_crossouts: c.marginal_crossouts_present === true ? c.marginal_crossouts_count : null,
    },
  }
}

export function unpackWriting(wr: WritingJson | null): WritingFields {
  return {
    ecriture_ref: wr?.ecriture_ref ?? null,
    handwriting_legibility_ref: wr?.legibility_ref ?? null,
    damage_notes: wr?.damage_notes ?? '',
    repro_notes: wr?.repro_notes ?? '',
  }
}

export function packWriting(c: WritingFields): WritingJson {
  const wr: WritingJson = {}
  if (c.ecriture_ref) wr.ecriture_ref = c.ecriture_ref
  if (c.handwriting_legibility_ref) wr.legibility_ref = c.handwriting_legibility_ref
  if (c.damage_notes.trim()) wr.damage_notes = c.damage_notes.trim()
  if (c.repro_notes.trim()) wr.repro_notes = c.repro_notes.trim()
  return wr
}

export function toIntOrNull(v: string): number | null {
  const s = v.trim()
  if (!s || !/^\d+$/.test(s)) return null
  return Number(s)
}
