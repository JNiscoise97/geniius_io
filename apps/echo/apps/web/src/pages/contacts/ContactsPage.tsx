// apps/web/src/pages/contacts/ContactsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useOutletContext, useNavigate } from "react-router-dom";
import type { Storage } from "@echo/data";
import type { Contact } from "@echo/domain";
import { ContactCardCenter } from "../../components/contact/ContactCardCenter";
import { FileText } from "lucide-react";
import { type ColumnDef, DataTable } from "@echo/ui";
import { ContactCardLeft } from "../../components/contact/ContactCardLeft";
import { ContactEditorModal } from "../../components/contact/modals/ContactEditorModal";
import { useLookups } from "../../lib/useLookups";

/* ---------------- Types & contexte ---------------- */
type UpperTab = "Overview" | "Activities";
type OutletCtx = { storage: Storage; upper: UpperTab };

type LookupItem = { id: string; label: string };

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string;
  org: string;
  createdAt: string;
};

/* ======================= MOCKS (legacy-friendly) ======================= */
const MOCKS: Contact[] = [
  {
    id: "mock-1",
    kind: "person",
    displayName: "Jacob Jones",
    givenName: "Jacob",
    familyName: "Jones",
    emails: [{ value: "jacobjons@gmail.com", label: "perso" } as any],
    phones: [{ value: "(239) 555-0108", label: "mobile" } as any],
    org: "Évêché de Pointe-à-Pitre",
    notes: "",
    tags: [],
    addresses: [
      { street: "15 rue de la Cathédrale", city: "Pointe-à-Pitre", zip: "97110", country: "FR", label: "pro" } as any,
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    extra: {
      role: "Marketer",
      headerEmail: "jacobjons@gmail.com",
      individu: {
        statut: "En contact",
        profil: "Amateur",
        canaux: ["E-mail", "Téléphone"],
        frequence: "Mensuelle",
        dernierEchange: "15 sept. 2025 — Appel",
        premierContact: "12 sept. 2025 — Geneanet",
        lienGeneanet: "https://www.geneanet.org/profil/jacobjones",
        membreFamille: "Oui (cousin au 3ᵉ degré)",
        tagsLabels: ["archives", "diocèse", "prioritaire"],
        notesContexte:
          "Préfère les échanges le matin. Demande un récap par e-mail après chaque échange.",
      },
      structure: {
        poste: "Conservateur d’archives",
        site: "https://eveche-pp.fr/archives",
        notesContexte:
          "Préfère les échanges le matin. Demande un récap par e-mail après chaque échange.",
      },
    },
  },
  {
    id: "mock-2",
    kind: "org",
    displayName: "Zeteha Studio",
    givenName: "Zeteha",
    familyName: "Studio",
    emails: [{ value: "hello@zeteha.io", label: "pro" } as any, { value: "contact@zeteha.io", label: "pro" } as any],
    phones: [{ value: "(202) 555-0199", label: "pro" } as any],
    org: "Zeteha",
    notes: "",
    tags: [],
    addresses: [{ street: "20 Market St", city: "San Francisco", zip: "94103", country: "US", label: "pro" } as any],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    extra: {
      role: "Agence créative",
      headerEmail: "hello@zeteha.io",
      individu: {
        statut: "Actif",
        profil: "Partenaire",
        canaux: ["E-mail"],
        frequence: "Trimestrielle",
        dernierEchange: "03 juil. 2025 — Meeting",
        premierContact: "2024-10-02",
        lienGeneanet: "",
        membreFamille: "Non",
        tagsLabels: ["partenaire", "studio"],
        notesContexte: "Aime les comptes-rendus concis avec actions claires.",
      },
      structure: {
        poste: "Agence",
        site: "https://zeteha.io",
        notesContexte: "Disponible plutôt l’après-midi (UTC-7).",
      },
    },
  },
  {
    id: "mock-3",
    kind: "person",
    displayName: "Élodie Martin",
    givenName: "Élodie",
    familyName: "Martin",
    emails: [{ value: "elodie.martin@example.com", label: "perso" } as any, { value: "emartin@biblio-paris.fr", label: "pro" } as any],
    phones: [{ value: "+33 6 12 34 56 78", label: "mobile" } as any, { value: "+33 1 44 00 00 00", label: "pro" } as any],
    org: "Bibliothèque historique de Paris",
    notes: "A déjà transmis 2 inventaires.",
    tags: [],
    addresses: [{ street: "24 rue Pavée", city: "Paris", zip: "75004", country: "FR", label: "pro" } as any],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    extra: {
      role: "Responsable fonds anciens",
      headerEmail: "elodie.martin@example.com",
      individu: {
        statut: "En attente",
        profil: "Experte",
        canaux: ["E-mail", "WhatsApp"],
        frequence: "Bimensuelle",
        dernierEchange: "28 août 2025 — WhatsApp",
        premierContact: "2023-11-05",
        lienGeneanet: "https://www.geneanet.org/profil/elodiem",
        membreFamille: "Non",
        tagsLabels: ["inventaire", "bibliothèque"],
        notesContexte: "Préférer WhatsApp pour les urgences.",
      },
      structure: {
        poste: "Responsable de collection",
        site: "https://bibliotheques.paris.fr",
        notesContexte: "Peut fournir un accès salle de lecture sur demande.",
      },
    },
  },
  {
    id: "mock-4",
    kind: "person",
    displayName: "Abdoulaye Ndiaye",
    givenName: "Abdoulaye",
    familyName: "Ndiaye",
    emails: [{ value: "a.ndiaye@archives.sn", label: "pro" } as any],
    phones: [{ value: "+221 77 000 00 00", label: "mobile" } as any],
    org: "Archives nationales du Sénégal",
    notes: "",
    tags: [],
    addresses: [
      { street: "Avenue Léopold Sédar Senghor", city: "Dakar", zip: "BP 12345", country: "SN", label: "pro" } as any,
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    extra: {
      role: "Chargé de mission",
      headerEmail: "a.ndiaye@archives.sn",
      individu: {
        statut: "En contact",
        profil: "Institutionnel",
        canaux: ["E-mail", "Téléphone"],
        frequence: "Trimestrielle",
        dernierEchange: "05 sept. 2025 — Appel",
        premierContact: "2022-06-15",
        lienGeneanet: "",
        membreFamille: "Non",
        tagsLabels: ["institution", "afrique de l’ouest"],
        notesContexte: "Très réactif par téléphone le matin (UTC).",
      },
      structure: {
        poste: "Chargé de mission",
        site: "https://www.archives.sn",
        notesContexte: "Peut faciliter des reproductions numériques.",
      },
    },
  },
  {
    id: "mock-5",
    kind: "person",
    displayName: "Sofia Rossi",
    givenName: "Sofia",
    familyName: "Rossi",
    emails: [{ value: "sofia.rossi@comune.fi.it", label: "pro" } as any],
    phones: [{ value: "+39 055 000000", label: "pro" } as any, { value: "+39 333 1112222", label: "mobile" } as any],
    org: "Comune di Firenze — Archivio Storico",
    notes: "Italienne, parle français et anglais.",
    tags: [],
    addresses: [{ street: "Via dell’Oriuolo 33", city: "Firenze", zip: "50122", country: "IT", label: "pro" } as any],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    extra: {
      role: "Archivista",
      headerEmail: "sofia.rossi@comune.fi.it",
      individu: {
        statut: "Actif",
        profil: "Contact clé",
        canaux: ["E-mail"],
        frequence: "Mensuelle",
        dernierEchange: "01 sept. 2025 — E-mail",
        premierContact: "2024-03-18",
        lienGeneanet: "",
        membreFamille: "Non",
        tagsLabels: ["italie", "inventaire", "prioritaire"],
        notesContexte: "Répond rapidement, préfère des messages structurés.",
      },
      structure: {
        poste: "Archivista",
        site: "https://archiviostorico.comune.fi.it",
        notesContexte: "Peut délivrer des attestations officielles.",
      },
    },
  },
];

/* ============================= Page racine ============================= */

const ENV_USE_MOCKS = String(import.meta.env.VITE_USE_MOCKS ?? "").toLowerCase() === "true";

export default function ContactsPage({ useMocks = ENV_USE_MOCKS }: { useMocks?: boolean }) {
  const { storage, upper } = useOutletContext<OutletCtx>();
  const { id } = useParams<{ id?: string }>();

  return id
    ? <ContactDetail contactId={id!} upper={upper} storage={storage} useMocks={useMocks} />
    : <ContactsList storage={storage} useMocks={useMocks} />;
}

/* =============================== LISTE =============================== */

function ContactsList({ storage, useMocks }: { storage: Storage; useMocks: boolean }) {
  const { lookups } = useLookups("fr"); // lecture seule
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const nav = useNavigate();

  async function load() {
    const listRaw: Contact[] = useMocks ? MOCKS : (await storage.listContacts());
    const list = listRaw.map(normalizeLegacyContact);
    const rows: Row[] = list.map((c) => ({
      id: c.id,
      name: displayName(c) || "(Sans nom)",
      email: getPrimaryEmail(c) ?? "—",
      phone: getPrimaryPhone(c) ?? "—",
      org: c.org ?? "—",
      createdAt: formatDate((c as any).createdAt ?? (c as any).created_at),
    }));
    setItems(rows);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { await load(); } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage, useMocks]);

  const columns: ColumnDef<Row>[] = [
    {
      key: "name",
      label: "Nom",
      columnWidth: "240px",
      render: (row) => (
        <div className="vstack" style={{ gap: 2 }}>
          <Link to={`/contacts/${row.id}`} className="link-like">
            <strong>{row.name}</strong>
          </Link>
          <span className="small muted">{row.email}</span>
        </div>
      ),
    },
    { key: "phone", label: "Téléphone", columnWidth: "150px" },
    { key: "org", label: "Organisation", columnWidth: "220px" },
    { key: "createdAt", label: "Créé le", columnWidth: "120px" },
  ];

  const emptyContact = (): Contact => {
    const now = new Date().toISOString();
    // @ts-ignore — fallback si crypto indispo
    const id = (globalThis.crypto?.randomUUID?.() ?? `tmp_${Math.random().toString(36).slice(2)}`) as string;
    return normalizeLegacyContact({
      id,
      kind: "person",
      displayName: "",
      givenName: "",
      familyName: "",
      org: "",
      emails: [],
      phones: [],
      addresses: [],
      tags: [],
      notes: "",
      createdAt: now,
      updatedAt: now,
      extra: {
        role: "",
        headerEmail: "",
        individu: { canaux: [], tagsLabels: [] },
        structure: {},
      },
    } as any);
  };

  async function handleCreateSave(updatedRaw: Contact) {
    const updated = normalizeLegacyContact(updatedRaw);
    const toSave: Contact = {
      ...updated,
      updatedAt: new Date().toISOString(),
      displayName: displayName(updated) || "Sans nom",
    };
    if (!useMocks) await storage.upsertContact(toSave);
    setOpenCreate(false);
    await load();
    nav(`/contacts/${toSave.id}`);
  }

  return (
    <div className="grid" style={{ alignContent: "start" }}>
      <div className="card">
        <div className="card-header hstack" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="hstack" style={{ gap: 8 }}>
            <strong>Contacts</strong>
          </div>
          <button className="btn small btn-primary" onClick={() => setOpenCreate(true)} disabled={!lookups}>
            Créer un contact
          </button>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="small muted">Chargement…</div>
          ) : (
            <DataTable<Row>
              title="Contacts"
              data={items}
              columns={columns}
              defaultVisibleColumns={columns.map((c) => c.key as keyof Row)}
              defaultSort={["name"]}
              pageSize={10}
              showMenu
            />
          )}
        </div>
      </div>

      {/* Modal de création */}
      {openCreate && lookups && (
        <ContactEditorModal
          open={openCreate}
          initial={emptyContact()}
          lookups={lookups}
          onClose={() => setOpenCreate(false)}
          onSave={handleCreateSave}
        />
      )}
    </div>
  );
}

/* ============================ DÉTAIL + MODAL ============================ */

function ContactDetail({
  contactId,
  upper,
  storage,
  useMocks,
}: {
  contactId: string;
  upper: UpperTab;
  storage: Storage;
  useMocks: boolean;
}) {
  const nav = useNavigate();
  const { lookups } = useLookups("fr");
  const [contact, setContact] = useState<Contact | null>(null);
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = useMocks
        ? (MOCKS.find(m => m.id === contactId) ?? null)
        : (await storage.getContact(contactId) ?? null);
      const c = raw ? normalizeLegacyContact(raw) : null;
      if (!cancelled) setContact(c);
    })();
    return () => { cancelled = true; };
  }, [contactId, storage, useMocks]);

  const handleSave = async (updatedRaw: Contact) => {
    const updated = normalizeLegacyContact(updatedRaw);
    const toSave: Contact = { ...updated, updatedAt: new Date().toISOString() };
    if (!useMocks) await storage.upsertContact(toSave);
    setContact(toSave);
    setOpenEdit(false);
  };

  const lookupsForCard = useMemo(
    () => (lookups ? mapLookupsForCard(lookups) : undefined),
    [lookups]
  );

  if (!contact) {
    return (
      <div className="grid" style={{ gridColumn: "1 / -1", alignContent: "start" }}>
        <div className="card">
          <div className="card-body hstack" style={{ gap: 12 }}>
            <button className="btn outline small" onClick={() => nav("/contacts")}>← Retour à la liste</button>
            <span className="small muted">Contact introuvable</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ContactCardLeft
        contact={contact}
        onBack={() => nav("/contacts")}
        onEdit={() => setOpenEdit(true)}
        lookups={lookupsForCard}
      />
      <ContactCardCenter upper={upper} contactId={contactId} />
      <RightCards />

      {lookups && (
        <ContactEditorModal
          open={openEdit}
          initial={contact}
          lookups={lookups}
          onClose={() => setOpenEdit(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}

/* =============================== Right pane =============================== */

function RightCards() {
  return (
    <div className="grid" style={{ alignContent: "start" }}>
      <div className="card">
        <div className="card-header">
          Tâches <span className="badge">2</span>
        </div>
        <div className="card-body right-card-list">
          <div className="item">
            <div className="vstack">
              <strong>Zeteha Studio</strong>
              <span className="small muted">zeteha.io • zetehagrow@gmail.com</span>
            </div>
            <span className="pill">View</span>
          </div>
          <div className="item">
            <div className="vstack">
              <strong>Jaguar Company</strong>
              <span className="small muted">jaguar.com • jaguarcomp@gmail.com</span>
            </div>
            <span className="pill">View</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Dernier doc reçu</div>
        <div className="card-body">
          <a style={{ textDecoration: "none" }}>
            <div className="card-body hstack" style={{ gap: 8 }}>
              <FileText size={16} />
              <div style={{ fontSize: 14 }}>Doc</div>
            </div>
          </a>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          En attente <span className="badge">2</span>
        </div>
        <div className="card-body right-card-list">
          <div className="item">
            <div className="vstack">
              <strong>Web3 Landing Page</strong>
              <span className="small muted">$5,000 • Close date: Jun 20, 2024</span>
            </div>
            <span className="pill" style={{ color: "var(--success)" }}>Contract Signed</span>
          </div>
          <div className="item">
            <div className="vstack">
              <strong>CRM Product</strong>
              <span className="small muted">$16,000 • Close date: Jun 24, 2024</span>
            </div>
            <span className="pill">Contract Sent</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== helpers (compat + normalisation) ===================== */

function formatDate(ts?: string) {
  if (!ts) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" })
      .format(new Date(ts));
  } catch {
    return ts;
  }
}

/** Transforme les contacts legacy ({label}) en coord. typées ({type_id}) et unifie noms */
function normalizeLegacyContact(c0: Contact): Contact {
  const c = { ...c0 } as any;

  // noms / display
  const given = c.givenName ?? c.given_name ?? "";
  const family = c.familyName ?? c.family_name ?? "";
  const display = c.displayName ?? c.display_name ?? (given || family ? `${given} ${family}`.trim() : "");
  c.givenName = given; c.given_name = given;
  c.familyName = family; c.family_name = family;
  c.displayName = display; c.display_name = display;

  // kind défaut
  c.kind = (c.kind ?? "person");

  // emails -> type_id
  const emails = (c.emails ?? []).map((e: any) => ({
    value: e.value,
    type_id: e.type_id ?? labelToEmailTypeId(e.label),
    primary: e.primary ?? false,
    note: e.note,
  })).filter((e: any) => !!e.value);
  if (emails.length && !emails.some((e: any) => e.primary)) emails[0].primary = true;
  c.emails = emails;

  // phones -> type_id
  const phones = (c.phones ?? []).map((p: any) => ({
    value: p.value,
    type_id: p.type_id ?? labelToPhoneTypeId(p.label),
    primary: p.primary ?? false,
    note: p.note,
  })).filter((p: any) => !!p.value);
  if (phones.length && !phones.some((p: any) => p.primary)) phones[0].primary = true;
  c.phones = phones;

  // addresses -> type_id
  const addresses = (c.addresses ?? []).map((a: any) => ({
    street: a.street, zip: a.zip, city: a.city, country: a.country,
    type_id: a.type_id ?? labelToAddressTypeId(a.label),
    primary: a.primary ?? false,
    note: a.note,
  })).filter((a: any) => a.street || a.city || a.zip || a.country);
  if (addresses.length && !addresses.some((a: any) => a.primary)) addresses[0].primary = true;
  c.addresses = addresses;

  return c as Contact;
}

function labelToEmailTypeId(label?: string) {
  const L = (label ?? "").toLowerCase();
  if (/pro|work|bureau|admin/.test(L)) return "pro";
  if (/perso|home|priv|gmail|yahoo/.test(L)) return "perso";
  if (/archive/.test(L)) return "archives";
  return "service";
}
function labelToPhoneTypeId(label?: string) {
  const L = (label ?? "").toLowerCase();
  if (L.includes("mobile") || L.includes("cell")) return "mobile";
  if (L.includes("fixe") || L.includes("home")) return "fixe";
  return "standard";
}
function labelToAddressTypeId(label?: string) {
  const L = (label ?? "").toLowerCase();
  if (L.includes("pro")) return "professionnelle";
  if (L.includes("correspondance") || L.includes("mail")) return "correspondance";
  if (L.includes("site") || L.includes("archives")) return "site_archives";
  return "domicile";
}

function displayName(c: any) {
  return c.displayName ?? c.display_name ?? `${c.givenName ?? ""} ${c.familyName ?? ""}`.trim();
}

function getPrimaryEmail(c: any, preferTypeId?: string): string | undefined {
  const arr = (c.emails ?? []) as { value: string; type_id?: string; primary?: boolean }[];
  if (!arr.length) return undefined;
  if (preferTypeId) {
    const x = arr.find(e => (e.type_id ?? "") === preferTypeId && e.value);
    if (x?.value) return x.value;
  }
  return (arr.find(e => e.primary)?.value) ?? arr[0].value ?? undefined;
}
function getPrimaryPhone(c: any, preferTypeId?: string): string | undefined {
  const arr = (c.phones ?? []) as { value: string; type_id?: string; primary?: boolean }[];
  if (!arr.length) return undefined;
  if (preferTypeId) {
    const x = arr.find(e => (e.type_id ?? "") === preferTypeId && e.value);
    if (x?.value) return x.value;
  }
  return (arr.find(e => e.primary)?.value) ?? arr[0].value ?? undefined;
}
function mapLookupsForCard(lk: {
  civilites: LookupItem[]; personas: LookupItem[]; relationships: LookupItem[];
  lifecycleStages: LookupItem[]; leadSources: LookupItem[]; channels: LookupItem[];
  optins: LookupItem[]; profiles: LookupItem[]; trusts: LookupItem[];
  commTones: LookupItem[]; shareMethods: LookupItem[]; orgTypes: LookupItem[];
  sectors: LookupItem[]; languages: LookupItem[]; personOrgRelations: LookupItem[];
}) {
  return {
    civilite: lk.civilites,
    personas: lk.personas,
    relationship_to_me: lk.relationships,
    lifecycle_stage: lk.lifecycleStages,
    lead_source: lk.leadSources,
    preferred_channel: lk.channels,
    optin_status: lk.optins,
    profiles: lk.profiles,
    informant_trust: lk.trusts,
    comm_tone: lk.commTones,
    share_methods: lk.shareMethods,
    org_types: lk.orgTypes,
    sectors: lk.sectors,
    languages: lk.languages,
    // (tu peux ajouter person_org_relations si un jour ContactCardLeft l’attend)
  } as const;
}