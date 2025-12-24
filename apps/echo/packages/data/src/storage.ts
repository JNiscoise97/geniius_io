// packages/data/src/storage.ts
import type { Contact, ID, Note, Thread } from "@echo/domain";
import type { Storage, Query } from "./memoryStorage.js";

const now = () => new Date().toISOString();

function contains(haystack: string | undefined, needle: string | undefined) {
  if (!haystack || !needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function createMemoryStorage(): Storage {
  const contacts = new Map<ID, Contact>();
  const threads = new Map<ID, Thread>();
  const notes = new Map<ID, Note>();

  return {
    // CONTACTS
    async getContact(id: ID): Promise<Contact | undefined> {
      return contacts.get(id);
    },

    async listContacts(q?: Query): Promise<Contact[]> {
      let arr = Array.from(contacts.values()).filter((c) => !c.deletedAt);

      // Texte
      if (q?.text) {
        arr = arr.filter((c) =>
          contains(c.displayName, q.text) ||
          contains(c.notes, q.text) ||
          contains(c.givenName, q.text) ||
          contains(c.familyName, q.text) ||
          contains(c.org, q.text)
        );
      }

      // TagIds (contacts ayant TOUS les tags demandés)
      if (q?.tagIds && q.tagIds.length > 0) {
        arr = arr.filter((c) => {
          const set = new Set(c.tags ?? []);
          return q.tagIds!.every((t) => set.has(t));
        });
      }

      // Tri (displayName)
      arr.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));

      // Pagination
      const start = q?.offset ?? 0;
      const end = start + (q?.limit ?? arr.length);
      return arr.slice(start, end);
    },

    async upsertContact(c: Contact): Promise<void> {
      contacts.set(c.id, { ...c, updatedAt: now() });
    },

    async deleteContact(id: ID): Promise<void> {
      const c = contacts.get(id);
      if (c) contacts.set(id, { ...c, deletedAt: now(), updatedAt: now() });
    },

    // THREADS
    async getThread(id: ID): Promise<Thread | undefined> {
      return threads.get(id);
    },

    async listThreads(q?: Query): Promise<Thread[]> {
      let arr = Array.from(threads.values()).filter((t) => !t.deletedAt);
      if (q?.text) arr = arr.filter((t) => contains(t.title, q.text));
      const start = q?.offset ?? 0;
      const end = start + (q?.limit ?? arr.length);
      return arr.slice(start, end);
    },

    async upsertThread(t: Thread): Promise<void> {
      threads.set(t.id, { ...t, updatedAt: now() });
    },

    async deleteThread(id: ID): Promise<void> {
      const t = threads.get(id);
      if (t) threads.set(id, { ...t, deletedAt: now(), updatedAt: now() });
    },

    // NOTES
    async getNote(id: ID): Promise<Note | undefined> {
      return notes.get(id);
    },

    async listNotes(q: Query & { threadId?: ID }): Promise<Note[]> {
      let arr = Array.from(notes.values()).filter((n) => !n.deletedAt);
      if (q?.threadId) arr = arr.filter((n) => n.threadId === q.threadId);
      if (q?.text) arr = arr.filter((n) => contains(n.content, q.text));
      const start = q?.offset ?? 0;
      const end = start + (q?.limit ?? arr.length);
      return arr.slice(start, end);
    },

    async upsertNote(n: Note): Promise<void> {
      notes.set(n.id, { ...n, updatedAt: now() });
    },

    async deleteNote(id: ID): Promise<void> {
      const n = notes.get(id);
      if (n) notes.set(id, { ...n, deletedAt: now(), updatedAt: now() });
    },
  };
}
