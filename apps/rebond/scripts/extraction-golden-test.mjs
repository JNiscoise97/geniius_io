// scripts/extraction-golden-test.mjs
//
// Golden test du module Extraction : appelle la fonction Edge déployée
// `extract-assertions` sur un texte de référence et compare le résultat à
// une liste d'assertions attendues, fixée manuellement une fois qu'un acte a
// été jugé stable après relecture humaine (cf. scripts/golden/README.md).
//
// Ce n'est PAS un test CI strict (Claude n'est pas déterministe : le
// libellé exact d'un value_text ou le découpage d'un source_text peut
// varier légèrement d'un run à l'autre sans que ce soit une régression) —
// c'est un outil de diff pour revue humaine, à lancer manuellement après
// tout changement du prompt ou du modèle, pour repérer vite un vrai écart
// (un fait attendu qui disparaît, un prédicat halluciné qui apparaît).
//
// Usage :
//   node scripts/extraction-golden-test.mjs                  (toutes les fixtures)
//   node scripts/extraction-golden-test.mjs acte-naissance-1875-blaise-gustave
//
// Nécessite .env.local (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) à la
// racine de apps/rebond, comme le reste de l'app.

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GOLDEN_DIR = path.join(__dirname, 'golden')

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const supabaseRebond = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  db: { schema: 'rebond' },
  auth: { persistSession: false, autoRefreshToken: false },
})

// Dupliqué depuis src/features/atelier/tiptap/tiptapText.ts — un script Node
// autonome ne peut pas facilement importer du TS applicatif ; garder en sync
// si ce convertisseur évolue (même logique, testée en usage réel).
const BLOCK_TYPES = new Set(['paragraph', 'heading', 'blockquote', 'listItem', 'codeBlock'])
function tiptapJsonToPlainText(doc) {
  const parts = []
  function walk(node) {
    if (node.type === 'text') { parts.push(node.text ?? ''); return }
    if (node.type === 'hardBreak') { parts.push('\n'); return }
    if (node.content) for (const child of node.content) walk(child)
    if (BLOCK_TYPES.has(node.type)) parts.push('\n\n')
  }
  if (doc?.content) for (const child of doc.content) walk(child)
  return parts.join('').replace(/\n{3,}/g, '\n\n').trim()
}

async function resolveText(fixture) {
  if (fixture.text) return fixture.text
  if (fixture.versionId) {
    const { data, error } = await supabaseRebond.from('transcription_versions')
      .select('contenu').eq('id', fixture.versionId).maybeSingle()
    if (error) throw error
    if (!data) throw new Error(`transcription_version_id introuvable : ${fixture.versionId}`)
    return tiptapJsonToPlainText(data.contenu)
  }
  throw new Error('Fixture sans "text" ni "versionId"')
}

// Normalise une liste (entities, assertions) en un ensemble de tuples
// lisibles, indépendants des local_key (P1/P2... peuvent varier d'un run à
// l'autre) — on résout chaque subject/object vers son label humain.
function toTupleSet({ entities, assertions }) {
  const labelByKey = new Map(entities.map(e => [e.local_key, (e.label ?? '').trim().toLowerCase()]))
  const set = new Set()
  for (const a of assertions) {
    const subject = labelByKey.get(a.subject) ?? a.subject
    const object = a.object ? (labelByKey.get(a.object) ?? a.object) : ''
    const value = a.value_text ?? a.value_number ?? a.value_date ?? ''
    const rawRelation = a.raw_relation ?? ''
    set.add(`${subject} | ${a.predicate} | ${rawRelation} | ${object || value}`.toLowerCase().trim())
  }
  return set
}

async function runFixture(file) {
  const fixture = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, file), 'utf8'))
  console.log(`\n=== ${fixture.label ?? file} ===`)

  const text = await resolveText(fixture)
  const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/extract-assertions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    console.error(`  ERREUR HTTP ${res.status} : ${await res.text()}`)
    return false
  }
  const actual = await res.json()

  if (!fixture.expected) {
    console.log('  (pas de "expected" figé — capture brute uniquement, rien à comparer)')
    console.log(`  ${actual.entities.length} entités, ${actual.assertions.length} assertions reçues.`)
    console.log(JSON.stringify(actual, null, 2))
    return true
  }

  const expectedSet = toTupleSet(fixture.expected)
  const actualSet = toTupleSet(actual)

  const missing = [...expectedSet].filter(t => !actualSet.has(t))
  const extra = [...actualSet].filter(t => !expectedSet.has(t))

  console.log(`  attendu : ${expectedSet.size} · obtenu : ${actualSet.size} · manquant : ${missing.length} · nouveau/inattendu : ${extra.length}`)
  if (missing.length) {
    console.log('  -- MANQUANT (régression probable) --')
    for (const t of missing) console.log(`    - ${t}`)
  }
  if (extra.length) {
    console.log('  -- NOUVEAU / INATTENDU (à revoir : amélioration ou nouvelle hallucination ?) --')
    for (const t of extra) console.log(`    + ${t}`)
  }
  return missing.length === 0
}

const requested = process.argv[2]
const files = requested
  ? [`${requested.replace(/\.json$/, '')}.json`]
  : fs.readdirSync(GOLDEN_DIR).filter(f => f.endsWith('.json'))

if (files.length === 0) {
  console.log('Aucune fixture dans scripts/golden/.')
  process.exit(0)
}

let allOk = true
for (const file of files) {
  try {
    const ok = await runFixture(file)
    allOk = allOk && ok
  } catch (err) {
    console.error(`  ERREUR sur ${file} :`, err.message)
    allOk = false
  }
}
process.exit(allOk ? 0 : 1)
