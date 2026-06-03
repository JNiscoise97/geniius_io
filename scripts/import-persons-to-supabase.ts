/// <reference types="node" />
/**
 * Importe les personnes et familles du family-graph.generated.json
 * vers les tables Supabase `persons` et `families`.
 *
 * Usage :
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   tsx scripts/import-persons-to-supabase.ts
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Manque SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const GRAPH_PATH = path.resolve(
  process.cwd(),
  'apps/tree/src/features/family-tree/data/family-graph.generated.json'
)

// ─── Types GEDCOM ────────────────────────────────────────

interface GedcomDate {
  raw?: string
  start?: { year?: number }
}

interface GedcomEvent {
  tag: string
  date?: GedcomDate
  place?: { town?: string }
}

interface GedcomPerson {
  id: string
  firstName?: string
  lastName?: string
  nickname?: string
  sex?: string
  famcIds?: string[]
  famsIds?: string[]
  events?: GedcomEvent[]
  occupation?: string
  primaryMediaId?: string
}

interface GedcomFamily {
  id: string
  husbandId?: string
  wifeId?: string
  childIds?: string[]
  events?: GedcomEvent[]
}

interface FamilyGraph {
  people: Record<string, GedcomPerson>
  families: Record<string, GedcomFamily>
}

// ─── Helpers ─────────────────────────────────────────────

function getEvent(events: GedcomEvent[] = [], tag: string): GedcomEvent | undefined {
  return events.find(e => e.tag === tag)
}

function parseBirthYear(events: GedcomEvent[] = []): number | null {
  const birt = getEvent(events, 'BIRT')
  return birt?.date?.start?.year ?? null
}

function parseDeathYear(events: GedcomEvent[] = []): number | null {
  const deat = getEvent(events, 'DEAT')
  return deat?.date?.start?.year ?? null
}

// ─── Import par batch ────────────────────────────────────

const BATCH = 500

async function importPersons(graph: FamilyGraph) {
  const rows = Object.values(graph.people).map((p) => {
    const birth = getEvent(p.events, 'BIRT')
    const death = getEvent(p.events, 'DEAT')
    return {
      id:          p.id,
      first_name:  p.firstName  || null,
      last_name:   p.lastName   || null,
      nickname:    p.nickname   || null,
      sex:         (p.sex === 'M' || p.sex === 'F') ? p.sex : 'U',
      birth_date:  birth?.date?.raw  ?? null,
      birth_year:  birth?.date?.start?.year  ?? null,
      birth_place: birth?.place?.town ?? null,
      death_date:  death?.date?.raw  ?? null,
      death_year:  death?.date?.start?.year  ?? null,
      death_place: death?.place?.town ?? null,
      occupation:  p.occupation || null,
      famc_ids:    p.famcIds   ?? [],
      fams_ids:    p.famsIds   ?? [],
      raw:         p,
    }
  })

  console.log(`→ ${rows.length} personnes à importer`)

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('persons')
      .upsert(batch, { onConflict: 'id' })
    if (error) {
      console.error(`  ✗ Personnes batch ${i}–${i + BATCH}:`, error.message)
    } else {
      process.stdout.write(`  ✓ ${Math.min(i + BATCH, rows.length)}/${rows.length}\r`)
    }
  }
  console.log('\n  ✅ Personnes importées')
}

async function importFamilies(graph: FamilyGraph) {
  const rows = Object.values(graph.families).map((f) => ({
    id:         f.id,
    husband_id: f.husbandId ?? null,
    wife_id:    f.wifeId    ?? null,
    child_ids:  f.childIds  ?? [],
    raw:        f,
  }))

  console.log(`→ ${rows.length} familles à importer`)

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('families')
      .upsert(batch, { onConflict: 'id' })
    if (error) {
      console.error(`  ✗ Familles batch ${i}–${i + BATCH}:`, error.message)
    } else {
      process.stdout.write(`  ✓ ${Math.min(i + BATCH, rows.length)}/${rows.length}\r`)
    }
  }
  console.log('\n  ✅ Familles importées')
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(GRAPH_PATH)) {
    console.error(`❌  Fichier introuvable : ${GRAPH_PATH}`)
    console.error('   Lance d\'abord : pnpm generate:family-graph')
    process.exit(1)
  }

  console.log(`📂 Lecture de ${path.basename(GRAPH_PATH)}…`)
  const graph: FamilyGraph = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf-8'))

  console.log(`\n👥 Import des personnes…`)
  await importPersons(graph)

  console.log(`\n🏠 Import des familles…`)
  await importFamilies(graph)

  console.log('\n✅ Import terminé.')
}

main().catch((err) => {
  console.error('Erreur fatale:', err)
  process.exit(1)
})
