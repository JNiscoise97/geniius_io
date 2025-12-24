// packages/data/src/supabaseStorage.ts
import type { Contact, ID, Note, Thread } from "@echo/domain";
import type { Storage, Query } from "./memoryStorage.js";
import type { SupabaseClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ *
 * Types BD minimalistes (mappés sur tables)
 * ------------------------------------------------------------------ */
type DbContactRow = {
  id: string;
  user_id: string;

  // identité
  kind: "person" | "org" | "service";
  display_name: string;
  given_name: string | null;
  family_name: string | null;
  org: string | null;

  // coordonnées JSONB
  emails: unknown | null;
  phones: unknown | null;
  addresses: unknown | null;

  // éditoriaux / méta
  notes: string | null;
  extra: unknown | null;

  // lookups (FK -> lk_*)
  civilite_id: string | null;
  persona_id: string | null;
  relationship_to_me_id: string | null;
  lifecycle_stage_id: string | null;
  lead_source_id: string | null;
  preferred_channel_id: string | null;
  optin_status_id: string | null;
  profile_id: string | null;
  informant_trust_id: string | null;
  preferred_comm_tone_id: string | null;
  preferred_share_method_id: string | null;

  // spécifiques org/service
  org_type_id: string | null; // kind = org/service
  sector_id: string | null;   // kind = org

  // timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type DbContactTagRow = { contact_id: string; tag_id: string };
type DbContactLanguageRow = { contact_id: string; language_id: string };

/* ------------------------------------------------------------------ *
 * Implémentation Storage
 * ------------------------------------------------------------------ */
export class SupabaseStorage implements Storage {
  constructor(private supabase: SupabaseClient) {}

  /* ============================= CONTACTS ============================= */

  async getContact(id: ID): Promise<Contact | undefined> {
    const { data, error } = await this.supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .maybeSingle<DbContactRow>();

    if (error) throw error;
    if (!data) return undefined;

    // Tags
    const { data: tagRows, error: tagsErr } = await this.supabase
      .from("contact_tags")
      .select("tag_id")
      .eq("contact_id", id);
    if (tagsErr) throw tagsErr;

    // Langues
    const { data: langRows, error: langsErr } = await this.supabase
      .from("contact_languages")
      .select("language_id")
      .eq("contact_id", id);
    if (langsErr) throw langsErr;

    return mapDbContactToDomain(data, {
      tagIds: (tagRows ?? []).map((r) => r.tag_id),
      languageIds: (langRows ?? []).map((r) => r.language_id),
    });
  }

  async listContacts(q?: Query): Promise<Contact[]> {
    // 1) Base query (soft-deleted exclus)
    let query = this.supabase
      .from("contacts")
      .select("*")
      .is("deleted_at", null) as any;

    // 2) Texte (sur display/given/family/org)
    if (q?.text) {
      const t = q.text.replace(/,/g, " "); // protège l'OR
      query = query.or(
        [
          `display_name.ilike.%${t}%`,
          `given_name.ilike.%${t}%`,
          `family_name.ilike.%${t}%`,
          `org.ilike.%${t}%`,
        ].join(",")
      );
    }

    // 3) Tri & pagination
    query = query.order("display_name", { ascending: true });
    if (typeof q?.limit === "number") {
      const from = q.offset ?? 0;
      const to = from + q.limit - 1;
      query = query.range(from, to);
    }

    // 4) Si filtre par tags, récupère d'abord les contact_ids éligibles
    let tagContactIds: string[] | null = null;
    if (q?.tagIds && q.tagIds.length > 0) {
      // contacts ayant TOUS les tags demandés
      const { data: ct, error: ctErr } = await this.supabase
        .from("contact_tags")
        .select("contact_id, tag_id")
        .in("tag_id", q.tagIds);
      if (ctErr) throw ctErr;

      const byContact = groupBy(ct ?? [], (r) => r.contact_id);
      tagContactIds = [];
      for (const [cid, arr] of byContact.entries()) {
        const found = new Set(arr.map((x) => x.tag_id));
        const allPresent = q.tagIds.every((wanted) => found.has(wanted));
        if (allPresent) tagContactIds.push(cid);
      }

      if (tagContactIds.length === 0) return [];
      query = query.in("id", tagContactIds);
    }

    // 5) Fetch rows
    const { data, error } = (await query) as { data: DbContactRow[] | null; error: any };
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);

    // 6) Tags groupés
    const { data: tagRows, error: tagsErr } = await this.supabase
      .from("contact_tags")
      .select("contact_id, tag_id")
      .in("contact_id", ids);
    if (tagsErr) throw tagsErr;
    const tagsByContact = groupBy(tagRows ?? [], (r) => r.contact_id);

    // 7) Langues groupées
    const { data: langRows, error: langsErr } = await this.supabase
      .from("contact_languages")
      .select("contact_id, language_id")
      .in("contact_id", ids);
    if (langsErr) throw langsErr;
    const langsByContact = groupBy(langRows ?? [], (r) => r.contact_id);

    // 8) Mapping
    return rows.map((r) =>
      mapDbContactToDomain(r, {
        tagIds: (tagsByContact.get(r.id) ?? []).map((x) => (x as DbContactTagRow).tag_id),
        languageIds: (langsByContact.get(r.id) ?? []).map((x) => (x as DbContactLanguageRow).language_id),
      })
    );
  }

  async upsertContact(c: Contact): Promise<void> {
    // RLS : user_id requis à l'insert
    const { data: userRes, error: userErr } = await this.supabase.auth.getUser();
    if (userErr) throw userErr;
    const userId = userRes.user?.id;
    if (!userId) throw new Error("Utilisateur non authentifié");

    // Existe ?
    const { data: existing, error: selErr } = await this.supabase
      .from("contacts")
      .select("id")
      .eq("id", c.id)
      .maybeSingle();
    if (selErr) throw selErr;

    // Map domaine -> BD
    const row = mapDomainContactToDb(c);

    if (!existing) {
      const { error: insErr } = await this.supabase
        .from("contacts")
        .insert({ ...row, user_id: userId });
      if (insErr) throw insErr;
    } else {
      const { error: updErr } = await this.supabase
        .from("contacts")
        .update(row)
        .eq("id", c.id);
      if (updErr) throw updErr;
    }

    // ---- Sync TAGS (delete + insert) ----
    if (Array.isArray(c.tags)) {
      const { error: delErr } = await this.supabase
        .from("contact_tags")
        .delete()
        .eq("contact_id", c.id);
      if (delErr) throw delErr;

      if (c.tags.length > 0) {
        const rows = c.tags.map((tagId) => ({ contact_id: c.id, tag_id: tagId }));
        const { error: insTagsErr } = await this.supabase.from("contact_tags").insert(rows);
        if (insTagsErr) throw insTagsErr;
      }
    }

    // ---- Sync LANGUAGES (delete + insert) via extra.languages (fallback UI) ----
    const languages = Array.isArray(c.extra?.languages) ? c.extra!.languages.filter(Boolean) : [];
    const { error: delLangsErr } = await this.supabase
      .from("contact_languages")
      .delete()
      .eq("contact_id", c.id);
    if (delLangsErr) throw delLangsErr;

    if (languages.length > 0) {
      const rows = languages.map((language_id) => ({ contact_id: c.id, language_id }));
      const { error: insLangsErr } = await this.supabase.from("contact_languages").insert(rows);
      if (insLangsErr) throw insLangsErr;
    }
  }

  async deleteContact(id: ID): Promise<void> {
    const { error } = await this.supabase
      .from("contacts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  /* ============================= THREADS ============================= */

  async getThread(id: ID) {
    const { data, error } = await this.supabase
      .from("threads")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as unknown as Thread | undefined;
  }

  async listThreads(q?: Query): Promise<Thread[]> {
    let query = this.supabase.from("threads").select("*").is("deleted_at", null) as any;
    if (q?.text) query = query.ilike("title", `%${q.text}%`);
    if (typeof q?.limit === "number") {
      const from = q.offset ?? 0;
      query = query.range(from, from + q.limit - 1);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Thread[];
  }

  async upsertThread(t: Thread): Promise<void> {
    const { data: userRes, error: userErr } = await this.supabase.auth.getUser();
    if (userErr) throw userErr;
    const userId = userRes.user?.id;
    if (!userId) throw new Error("Utilisateur non authentifié");

    const { error } = await this.supabase.from("threads").upsert({
      id: t.id,
      user_id: userId,
      title: t.title,
      status: t.status,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
      deleted_at: t.deletedAt ?? null,
    });
    if (error) throw error;
  }

  async deleteThread(id: ID): Promise<void> {
    const { error } = await this.supabase
      .from("threads")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  /* ============================== NOTES ============================== */

  async getNote(id: ID): Promise<Note | undefined> {
    const { data, error } = await this.supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as unknown as Note | undefined;
  }

  async listNotes(q: Query & { threadId?: ID }): Promise<Note[]> {
    let query = this.supabase.from("notes").select("*").is("deleted_at", null) as any;
    if (q.threadId) query = query.eq("thread_id", q.threadId);
    if (q.text) query = query.ilike("content", `%${q.text}%`);
    if (typeof q?.limit === "number") {
      const from = q.offset ?? 0;
      query = query.range(from, from + q.limit - 1);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Note[];
  }

  async upsertNote(n: Note): Promise<void> {
    const { data: userRes, error: userErr } = await this.supabase.auth.getUser();
    if (userErr) throw userErr;
    const userId = userRes.user?.id;
    if (!userId) throw new Error("Utilisateur non authentifié");

    const { error } = await this.supabase.from("notes").upsert({
      id: n.id,
      user_id: userId,
      thread_id: n.threadId,
      type: n.type,
      content: n.content ?? null,
      local_uri: n.localUri ?? null,
      mime: n.mime ?? null,
      created_at: n.createdAt,
      updated_at: n.updatedAt,
      deleted_at: n.deletedAt ?? null,
    });
    if (error) throw error;
  }

  async deleteNote(id: ID): Promise<void> {
    const { error } = await this.supabase
      .from("notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }
}

/* ------------------------------------------------------------------ *
 * Helpers mapping
 * ------------------------------------------------------------------ */

function toJsonb<T>(v: T): T { return v; }

/** DB -> Domain (+ tags & languages optionnels) */
function mapDbContactToDomain(
  row: DbContactRow,
  extras?: { tagIds?: string[]; languageIds?: string[] }
): Contact {
  const extra = (row.extra ?? undefined) as Contact["extra"];
  const mergedExtra: Contact["extra"] = {
    ...extra,
    ...(extras?.languageIds ? { languages: extras.languageIds } : {}),
  };

  return {
    id: row.id,

    // identité
    kind: row.kind,
    displayName: row.display_name,
    givenName: row.given_name ?? undefined,
    familyName: row.family_name ?? undefined,
    org: row.org ?? undefined,

    // coordonnées
    emails: (row.emails ?? undefined) as Contact["emails"],
    phones: (row.phones ?? undefined) as Contact["phones"],
    addresses: (row.addresses ?? undefined) as Contact["addresses"],

    // lookups
    civilite_id: row.civilite_id,
    persona_id: row.persona_id,
    relationship_to_me_id: row.relationship_to_me_id,
    lifecycle_stage_id: row.lifecycle_stage_id,
    lead_source_id: row.lead_source_id,
    preferred_channel_id: row.preferred_channel_id,
    optin_status_id: row.optin_status_id,
    profile_id: row.profile_id,
    informant_trust_id: row.informant_trust_id,
    preferred_comm_tone_id: row.preferred_comm_tone_id,
    preferred_share_method_id: row.preferred_share_method_id,
    org_type_id: row.org_type_id,
    sector_id: row.sector_id,

    // éditoriaux
    tags: extras?.tagIds ?? undefined,
    notes: row.notes ?? undefined,
    extra: mergedExtra,

    // timestamps
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

/** Domain -> DB (snake_case), sans user_id, sans tags/langues */
function mapDomainContactToDb(c: Contact): Partial<DbContactRow> {
  return {
    id: c.id,

    // identité
    kind: c.kind ?? "person",
    display_name: c.displayName,
    given_name: c.givenName ?? null,
    family_name: c.familyName ?? null,
    org: c.org ?? null,

    // coordonnées
    emails: c.emails ? toJsonb(c.emails) : null,
    phones: c.phones ? toJsonb(c.phones) : null,
    addresses: c.addresses ? toJsonb(c.addresses) : null,

    // lookups
    civilite_id: c.civilite_id ?? null,
    persona_id: c.persona_id ?? null,
    relationship_to_me_id: c.relationship_to_me_id ?? null,
    lifecycle_stage_id: c.lifecycle_stage_id ?? null,
    lead_source_id: c.lead_source_id ?? null,
    preferred_channel_id: c.preferred_channel_id ?? null,
    optin_status_id: c.optin_status_id ?? null,
    profile_id: c.profile_id ?? null,
    informant_trust_id: c.informant_trust_id ?? null,
    preferred_comm_tone_id: c.preferred_comm_tone_id ?? null,
    preferred_share_method_id: c.preferred_share_method_id ?? null,

    // spécifiques org/service
    org_type_id: c.org_type_id ?? null,
    sector_id: c.sector_id ?? null,

    // éditoriaux
    notes: c.notes ?? null,
    extra: c.extra ? toJsonb(c.extra) : null,
  } as Partial<DbContactRow>;
}

/** groupBy util */
function groupBy<T>(rows: T[], key: (r: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    const arr = m.get(k);
    if (arr) arr.push(r);
    else m.set(k, [r]);
  }
  return m;
}
