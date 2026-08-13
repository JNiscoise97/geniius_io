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

const versionId = '8c493aff-2db2-4c76-a2ab-6f953e513213'

const { data: entities } = await supabaseRebond.from('transcription_entities')
  .select('id, local_key, label, entity_type')
  .eq('transcription_version_id', versionId)
console.log('entities:')
for (const e of entities) console.log(' ', e.local_key, e.id, e.entity_type, '-', e.label)

const l1 = entities.find(e => e.local_key === 'L1')
console.log('\nL1 id:', l1?.id)

const { data: asSubject } = await supabaseRebond.from('transcription_assertions')
  .select('id, predicate_id, object_entity_id, value_text, source_text, status, ref_assertion_predicates(code,label)')
  .eq('subject_entity_id', l1.id)
console.log('\nassertions with L1 as SUBJECT:', asSubject.length)
for (const a of asSubject) console.log(' ', a.id, a.ref_assertion_predicates?.code, '| status:', a.status, '| value:', a.value_text, '| object:', a.object_entity_id, '| src:', a.source_text)

const { data: asObject } = await supabaseRebond.from('transcription_assertions')
  .select('id, predicate_id, subject_entity_id, value_text, source_text, status, ref_assertion_predicates(code,label)')
  .eq('object_entity_id', l1.id)
console.log('\nassertions with L1 as OBJECT:', asObject.length)
for (const a of asObject) console.log(' ', a.id, a.ref_assertion_predicates?.code, '| status:', a.status, '| subject:', a.subject_entity_id, '| src:', a.source_text)

// entity_links (canonical promotion) referencing L1
const { data: links } = await supabaseRebond.from('entity_links').select('id, entity_id, transcription_entity_id').eq('transcription_entity_id', l1.id)
console.log('\nentity_links referencing L1 (canonical promotion):', links.length)
console.log(links)
