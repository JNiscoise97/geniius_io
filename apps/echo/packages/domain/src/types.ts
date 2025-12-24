// packages/domain/src/types.ts

/** ===== IDs & timestamps ===== */
export type ID = string;

export type Timestamped = {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

/** ===== Threads / Notes / Tags (inchangés) ===== */
export type Tag = {
  id: ID;
  label: string;
  color?: string;
  createdAt: string;
};

export type ThreadStatus = "draft" | "active" | "done";

export type Thread = Timestamped & {
  id: ID;
  title: string;
  relatedContactIds?: ID[];
  status: ThreadStatus;
};

export type NoteType = "text" | "voice" | "photo" | "file";

export type Note = Timestamped & {
  id: ID;
  threadId: ID;
  type: NoteType;
  content?: string;
  localUri?: string;
  mime?: string;
  tags?: ID[];
};

/** ===== Lookups (IDs = strings ; valeurs en BD) =====
 * Tu peux raffiner en unions littérales si tu veux figer des ensembles.
 */
export type LkId = string;

export type CiviliteId = LkId;
export type PersonaId = LkId;
export type RelationshipToMeId = LkId;
export type LifecycleStageId = LkId;
export type LeadSourceId = LkId;
export type ChannelId = LkId;
export type OptinStatusId = LkId;
export type ProfileId = LkId;          // inclut "refractaire"
export type InformantTrustId = LkId;
export type CommToneId = LkId;
export type ShareMethodId = LkId;
export type OrgTypeId = LkId;
export type SectorId = LkId;
export type PersonOrgRelationId = LkId;

/** Types “coordonnées typées” (alignés SQL JSONB) */
export type EmailTypeId = "pro" | "perso" | "service" | "archives";
export type PhoneTypeId = "mobile" | "fixe" | "standard";
export type AddressTypeId =
  | "domicile"
  | "professionnelle"
  | "correspondance"
  | "site_archives";

export type EmailItem = {
  value: string;
  type_id: EmailTypeId | LkId;
  primary?: boolean;
  note?: string;
  /** legacy compat UI */
  label?: string;
};

export type PhoneItem = {
  value: string;
  type_id: PhoneTypeId | LkId;
  primary?: boolean;
  note?: string;
  label?: string;
};

export type AddressItem = {
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  type_id: AddressTypeId | LkId;
  primary?: boolean;
  note?: string;
  label?: string;
};

/** ===== Contact ===== */
export type ContactKind = "person" | "org" | "service";

/** Champs UI éditoriaux non structurants (on conserve) */
export type ContactExtra = {
  // En-tête
  role?: string;
  avatarUrl?: string;
  /** E-mail forcé en tête si différent du primary */
  headerEmail?: string;

  // Onglet "Individu"
  individu?: {
    statut?: string;
    profil?: string; // texte libre UI (différent de profile_id lookup)
    canaux?: string[];
    frequence?: string;
    dernierEchange?: string;
    premierContact?: string;
    lienGeneanet?: string;
    membreFamille?: string | boolean;
    tagsLabels?: string[];
    notesContexte?: string;
  };

  // Onglet "Structure"
  structure?: {
    poste?: string;
    site?: string;
    notesContexte?: string;
  };

  /** Temporaire tant que la table n-n n’est pas branchée dans l’app */
  languages?: string[]; // array d'ids lk_language
};

/** Contact normalisé (préféré dans l’app) */
export type Contact = Timestamped & {
  id: ID;

  // identité
  kind: ContactKind;
  displayName: string;
  givenName?: string;
  familyName?: string;

  // rattachement simple (affichage)
  org?: string;

  // coordonnées typées
  emails?: EmailItem[];
  phones?: PhoneItem[];
  addresses?: AddressItem[];

  // notes & tags (IDs techniques)
  tags?: ID[];
  notes?: string;

  // lookups (FK → lk_*)
  civilite_id?: CiviliteId | null;
  persona_id?: PersonaId | null;
  relationship_to_me_id?: RelationshipToMeId | null;
  lifecycle_stage_id?: LifecycleStageId | null;
  lead_source_id?: LeadSourceId | null;
  preferred_channel_id?: ChannelId | null;
  optin_status_id?: OptinStatusId | null;
  profile_id?: ProfileId | null;
  informant_trust_id?: InformantTrustId | null;
  preferred_comm_tone_id?: CommToneId | null;
  preferred_share_method_id?: ShareMethodId | null;

  // spécifiques org/service
  org_type_id?: OrgTypeId | null; // kind = org/service
  sector_id?: SectorId | null;    // kind = org

  // UI
  extra?: ContactExtra;
};

/** ===== Relations n-n (alignées tables) ===== */
export type PersonOrgLink = {
  id: ID;
  person_id: ID;
  org_id: ID;
  relation_id: PersonOrgRelationId;
  start_at?: string | null; // YYYY-MM-DD
  end_at?: string | null;
  notes?: string | null;
};

export type PersonServiceLink = {
  id: ID;
  person_id: ID;
  service_id: ID;
  relation_id: PersonOrgRelationId;
  start_at?: string | null;
  end_at?: string | null;
  notes?: string | null;
};

export type ServiceOrgLink = {
  id: ID;
  service_id: ID;
  org_id: ID;
  relation_id: PersonOrgRelationId;
  start_at?: string | null;
  end_at?: string | null;
  notes?: string | null;
};

/** n-n langues (si tu l’utilises côté front) */
export type ContactLanguage = {
  contact_id: ID;
  language_id: string; // lk_language.id
};

/** ===== Lookups (front) ===== */
export type LkOption = { id: string; label: string };

export type Lookups = {
  civilites: LkOption[];
  personas: LkOption[];
  relationships: LkOption[];
  lifecycleStages: LkOption[];
  leadSources: LkOption[];
  channels: LkOption[];
  optins: LkOption[];
  profiles: LkOption[];
  trusts: LkOption[];
  commTones: LkOption[];
  shareMethods: LkOption[];
  orgTypes: LkOption[];
  sectors: LkOption[];
  emailTypes: LkOption[];
  phoneTypes: LkOption[];
  addressTypes: LkOption[];
  languages: LkOption[];
  personOrgRelations?: LkOption[];
};

/** ===== LEGACY (lecture/compat) =====
 * Utile si tu dois encore accepter des contacts {label, value}.
 * À supprimer une fois la migration terminée.
 */
export type LegacyEmail = { label?: string; value: string };
export type LegacyPhone = { label?: string; value: string };
export type LegacyAddress = {
  label?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
};

export type LegacyContact = Timestamped & {
  id: ID;
  displayName: string;
  givenName?: string;
  familyName?: string;
  org?: string;
  emails?: LegacyEmail[];
  phones?: LegacyPhone[];
  addresses?: LegacyAddress[];
  tags?: ID[];
  notes?: string;
  extra?: ContactExtra;
};

export const __domain = true;
