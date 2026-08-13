import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const supabaseRebond = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  db: { schema: 'rebond' },
  auth: { persistSession: false, autoRefreshToken: false },
})

const versionId = '5df99253-0702-4961-821e-25aab4594efe'

const { data: entities } = await supabaseRebond.from('transcription_entities')
  .select('id, local_key, label, entity_type')
  .eq('transcription_version_id', versionId)
const labelById = new Map(entities.map(e => [e.id, e.label]))

const { data: assertions } = await supabaseRebond.from('transcription_assertions')
  .select('id, subject_entity_id, object_entity_id, value_text, value_number, value_date, raw_relation, source_text, status, origin, ref_assertion_predicates(code,label)')
  .eq('transcription_version_id', versionId)
  .order('source_start', { ascending: true, nullsFirst: false })

function fmt(a) {
  const subj = labelById.get(a.subject_entity_id) ?? a.subject_entity_id
  const obj = a.object_entity_id ? (labelById.get(a.object_entity_id) ?? a.object_entity_id) : null
  return `[${a.status}] ${subj} -- ${a.ref_assertion_predicates?.code} --> obj:${obj} val:${a.value_text ?? a.value_number ?? a.value_date ?? 'NULL'} raw:${a.raw_relation ?? ''}`
}

console.log('=== SELLER/BUYER/DECEASED/HEIR/USUFRUCTUARY DETAIL ===')
for (const a of assertions) {
  const code = a.ref_assertion_predicates?.code
  if (['seller','buyer','deceased','heir','usufructuary'].includes(code)) console.log(fmt(a))
}

console.log('\n=== EVENTS ===')
for (const e of entities) if (e.entity_type === 'event') console.log(' ', e.local_key, '-', e.label)

console.log('\n=== JUSTIN/CASIMIR CHECK ===')
for (const e of entities) if (/justin|casimir/i.test(e.label)) console.log(' ', e.local_key, e.entity_type, '-', e.label)

console.log('\n=== "Mme Duhald" heir resolution check (subject Ernest succession event) ===')
