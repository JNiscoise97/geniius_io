// packages/data/src/memoryStorage.ts
import type { Contact, ID, Note, Thread } from "@echo/domain";

export type Query = {
  text?: string;
  tagIds?: ID[];     // filtre : contact doit posséder TOUS ces tags
  limit?: number;
  offset?: number;
};

export interface Storage {
  // CONTACTS
  getContact(id: ID): Promise<Contact | undefined>;
  listContacts(q?: Query): Promise<Contact[]>;
  upsertContact(c: Contact): Promise<void>;
  deleteContact(id: ID): Promise<void>;

  // THREADS
  getThread(id: ID): Promise<Thread | undefined>;
  listThreads(q?: Query): Promise<Thread[]>;
  upsertThread(t: Thread): Promise<void>;
  deleteThread(id: ID): Promise<void>;

  // NOTES
  getNote(id: ID): Promise<Note | undefined>;
  listNotes(q?: Query & { threadId?: ID }): Promise<Note[]>;
  upsertNote(n: Note): Promise<void>;
  deleteNote(id: ID): Promise<void>;
}
