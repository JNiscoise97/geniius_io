export type SessionMode = 'direct' | 'import' | 'import_multi' | 'thematic' | 'auto'
export type SessionIntent = 'confirm' | 'enrich' | 'discover' | 'free'
export type SessionStatus = 'active' | 'paused' | 'completed'
export type ThemeType = 'person' | 'place' | 'event' | 'legal' | 'family' | 'free'
export type MessageRole = 'user' | 'agent'
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'modified'
export type ProposalConfidence = 'certain' | 'probable' | 'uncertain'
export type ThreadPriority = 'high' | 'normal' | 'low'
export type ProposalField =
  | 'identity'
  | 'birth_date'
  | 'birth_place'
  | 'death_date'
  | 'profession'
  | 'location'
  | 'relation'
  | 'note'
  | 'event'
  | 'new_person'

export interface JournalSession {
  id: string
  user_id: string
  // Témoin
  interviewer_person_id: string | null
  interviewer_name: string | null
  interviewer_is_self: boolean
  // Sujet
  subject_person_id: string | null
  subject_raw: string | null
  theme_type: ThemeType | null
  theme_value: string | null
  // Mode et intention
  mode: SessionMode
  intent: SessionIntent | null
  // État
  status: SessionStatus
  // Contexte
  tree_context: Record<string, unknown>
  known_facts: Record<string, unknown> | null
  // Résultat
  summary: string | null
  created_at: string
  updated_at: string
}

export interface JournalMessage {
  id: string
  session_id: string
  role: MessageRole
  content: string
  audio_url: string | null
  entities_extracted: {
    persons_resolved?: string[]
    persons_unresolved?: { name: string; context: string }[]
    places?: string[]
    dates_explicit?: string[]
    dates_approximate?: string[]
  } | null
  created_at: string
}

export interface JournalProposal {
  id: string
  session_id: string
  person_id: string | null
  field: ProposalField
  current_value: unknown | null
  proposed_value: unknown
  source: string
  confidence: ProposalConfidence | null
  status: ProposalStatus
  created_at: string
}

export interface JournalThread {
  id: string
  session_id: string
  note: string
  person_id: string | null
  priority: ThreadPriority
  resolved: boolean
  created_at: string
}

// Input pour la création de session via /journal/new
export interface NewSessionInput {
  interviewer_name: string
  interviewer_is_self: boolean
  interviewer_person_id?: string
  subject_raw: string
  mode: SessionMode
  intent?: SessionIntent
  tree_context?: Record<string, unknown>
  known_facts?: Record<string, unknown>
}

// Réponse du generate_context
export interface ContextSummary {
  summary: string
  parsed: {
    interviewer_name: string
    subject_description: string
    intent: SessionIntent
    mode: SessionMode
    theme_type: ThemeType
  }
}
