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

const versionId = 'a5c0168c-95ce-41cb-9743-e3b9cf769376'

const { data: entities } = await supabaseRebond.from('transcription_entities')
  .select('id, local_key, label, entity_type')
  .eq('transcription_version_id', versionId)
console.log('=== ENTITIES (' + entities.length + ') ===')
for (const e of entities) console.log(' ', e.local_key, e.entity_type, '-', e.label)
const labelById = new Map(entities.map(e => [e.id, e.label]))

const { data: assertions } = await supabaseRebond.from('transcription_assertions')
  .select('id, subject_entity_id, object_entity_id, value_text, value_number, value_date, raw_relation, source_text, status, origin, created_at, ref_assertion_predicates(code,label)')
  .eq('transcription_version_id', versionId)
  .order('source_start', { ascending: true, nullsFirst: false })

console.log('\ncreated_at:', assertions[0]?.created_at, '(now:', new Date().toISOString(), ')')

function fmt(a) {
  const subj = labelById.get(a.subject_entity_id) ?? a.subject_entity_id
  const obj = a.object_entity_id ? (labelById.get(a.object_entity_id) ?? a.object_entity_id) : null
  return `[${a.status}] ${subj} -- ${a.ref_assertion_predicates?.code} --> obj:${obj} val:${a.value_text ?? a.value_number ?? a.value_date ?? 'NULL'} raw:${a.raw_relation ?? ''} | src:"${(a.source_text||'').slice(0,90)}"`
}
console.log('\n=== ALL ASSERTIONS (' + assertions.length + ') ===')
for (const a of assertions) console.log(fmt(a))
