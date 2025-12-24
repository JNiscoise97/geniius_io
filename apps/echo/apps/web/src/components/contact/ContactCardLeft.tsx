import {
  ArrowLeft, ChevronDown, Copy, Link as LinkIcon, CircleDashed
} from "lucide-react";
import React, { useMemo, useState } from "react";
import type { Contact } from "@echo/domain";

/* ---------- Types minimalistes pour lookups ---------- */
type LookupItem = { id: string; label: string };
type Lookups = Partial<{
  civilite: LookupItem[];
  personas: LookupItem[];
  relationship_to_me: LookupItem[];
  lifecycle_stage: LookupItem[];
  lead_source: LookupItem[];
  preferred_channel: LookupItem[];
  optin_status: LookupItem[];
  profiles: LookupItem[];
  informant_trust: LookupItem[];
  comm_tone: LookupItem[];
  share_methods: LookupItem[];
  org_types: LookupItem[];
  sectors: LookupItem[];
  languages: LookupItem[]; // si nécessaire
}>;

/* ---------- Helpers coordonnées typées (avec fallback legacy) ---------- */
function getPrimaryEmail(c: Contact, preferTypeId?: string) {
  const arr = (c.emails ?? []) as Array<{ value: string; type_id?: string; label?: string; primary?: boolean }>;
  if (!arr.length) return undefined;
  // 1) prefer type_id si demandé
  if (preferTypeId) {
    const x = arr.find(e => e.type_id === preferTypeId && e.value);
    if (x?.value) return x.value;
  }
  // 2) primary
  const p = arr.find(e => e.primary);
  if (p?.value) return p.value;
  // 3) heuristique legacy par label
  const byLabel = arr.find(e => (e.label ?? "").toLowerCase().match(/perso|home/));
  if (byLabel?.value) return byLabel.value;
  // 4) default 1er
  return arr[0]?.value;
}

function getProEmail(c: Contact) {
  const arr = (c.emails ?? []) as Array<{ value: string; type_id?: string; label?: string; primary?: boolean }>;
  return arr.find(e => e.type_id === "pro")?.value
      ?? arr.find(e => (e.label ?? "").toLowerCase().match(/pro|work/))?.value;
}

function getPrimaryPhone(c: Contact, preferTypeId?: string) {
  const arr = (c.phones ?? []) as Array<{ value: string; type_id?: string; label?: string; primary?: boolean }>;
  if (!arr.length) return undefined;
  if (preferTypeId) {
    const x = arr.find(p => p.type_id === preferTypeId && p.value);
    if (x?.value) return x.value;
  }
  const p = arr.find(p => p.primary);
  if (p?.value) return p.value;
  const byLabel = arr.find(p => (p.label ?? "").toLowerCase().includes("mobile"));
  if (byLabel?.value) return byLabel.value;
  return arr[0]?.value;
}

function getProPhone(c: Contact) {
  const arr = (c.phones ?? []) as Array<{ value: string; type_id?: string; label?: string; primary?: boolean }>;
  return arr.find(p => p.type_id === "pro")?.value
      ?? arr.find(p => (p.label ?? "").toLowerCase().match(/pro|bureau/))?.value;
}

function getAddressLine(c: Contact) {
  const arr = (c.addresses ?? []) as Array<{ type_id?: string; label?: string; primary?: boolean; street?: string; zip?: string; city?: string; country?: string }>;
  if (!arr.length) return undefined;
  const chosen = arr.find(a => a.primary) ?? arr[0];
  if (!chosen) return undefined;
  return [chosen.street, chosen.zip, chosen.city, chosen.country].filter(Boolean).join(", ") || undefined;
}

/* ---------- Badge color utils ---------- */
function hueFromId(id: string) {
  // hash simple → 0..359
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}
function badgeStyle(id: string) {
  const h = hueFromId(id);
  const bg = `hsl(${h} 70% 92%)`;   // pastel
  const bd = `hsl(${h} 65% 75%)`;   // border
  const fg = `hsl(${h} 50% 25%)`;   // text
  return {
    backgroundColor: bg,
    border: `1px solid ${bd}`,
    color: fg,
  } as React.CSSProperties;
}

/* ---------- lookup helpers ---------- */
function findLabel(list: LookupItem[] | undefined, id?: string | null) {
  if (!id || !list?.length) return undefined;
  return list.find(x => x.id === id)?.label ?? id;
}

function LabelsRow({
  title,
  items,
}: {
  title: string;
  items: { id: string; label: string }[];
}) {
  if (!items.length) return null;
  return (
    <div className="vstack" style={{ gap: 6 }}>
      <span className="small muted">{title}</span>
      <div className="hstack" style={{ gap: 6, flexWrap: "wrap" }}>
        {items.map(({ id, label }) => (
          <span key={`${title}-${id}`} className="pill" style={{ ...badgeStyle(id), fontSize: 12, padding: "2px 8px", borderRadius: 999 }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ===========================
   Composant principal
   =========================== */
export function ContactCardLeft({
  contact,
  onBack,
  onEdit,
  lookups, // optionnel : injecte les labels FR/EN depuis BD
}: {
  contact: Contact;
  onBack: () => void;
  onEdit: () => void;
  lookups?: Lookups;
}) {
  const [openActions, setOpenActions] = useState(false);
  const [tab, setTab] = useState<"individu" | "structure">("individu");

  async function copy(text?: string) {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch {}
  }

  // identité
  const prenom = contact.givenName ?? "";
  const nom = contact.familyName ?? contact.displayName ?? "";
  const role = contact.extra?.role;

  // emails/phones/adresse (nouveau modèle typé + fallback)
  const email = useMemo(() => {
    // headerEmail prioritaire pour l'entête
    return contact.extra?.headerEmail || getPrimaryEmail(contact);
  }, [contact]);
  const emailPro = getProEmail(contact);
  const tel = getPrimaryPhone(contact);
  const telPro = getProPhone(contact);
  const adresse = getAddressLine(contact);

  // individu (extra UI)
  const indiv = contact.extra?.individu ?? {};

  // structure (extra UI)
  const struct = contact.extra?.structure ?? {};
  const org = contact.org ?? "";
  const site = struct.site;

  // badges lk_* : construit les paires {id,label} seulement si présents
  const identityBadges = useMemo(() => {
    const items: { id: string; label: string }[] = [];
    if (contact.civilite_id) items.push({ id: contact.civilite_id, label: findLabel(lookups?.civilite, contact.civilite_id) ?? contact.civilite_id });
    if (contact.persona_id) items.push({ id: contact.persona_id, label: findLabel(lookups?.personas, contact.persona_id) ?? contact.persona_id });
    if (contact.profile_id) items.push({ id: contact.profile_id, label: findLabel(lookups?.profiles, contact.profile_id) ?? contact.profile_id });
    if (contact.relationship_to_me_id) items.push({ id: contact.relationship_to_me_id, label: findLabel(lookups?.relationship_to_me, contact.relationship_to_me_id) ?? contact.relationship_to_me_id });
    return items;
  }, [contact, lookups]);

  const commBadges = useMemo(() => {
    const items: { id: string; label: string }[] = [];
    if (contact.preferred_channel_id) items.push({ id: contact.preferred_channel_id, label: findLabel(lookups?.preferred_channel, contact.preferred_channel_id) ?? contact.preferred_channel_id });
    if (contact.optin_status_id) items.push({ id: contact.optin_status_id, label: findLabel(lookups?.optin_status, contact.optin_status_id) ?? contact.optin_status_id });
    if (contact.preferred_comm_tone_id) items.push({ id: contact.preferred_comm_tone_id, label: findLabel(lookups?.comm_tone, contact.preferred_comm_tone_id) ?? contact.preferred_comm_tone_id });
    if (contact.preferred_share_method_id) items.push({ id: contact.preferred_share_method_id, label: findLabel(lookups?.share_methods, contact.preferred_share_method_id) ?? contact.preferred_share_method_id });
    return items;
  }, [contact, lookups]);

  const crmBadges = useMemo(() => {
    const items: { id: string; label: string }[] = [];
    if (contact.lifecycle_stage_id) items.push({ id: contact.lifecycle_stage_id, label: findLabel(lookups?.lifecycle_stage, contact.lifecycle_stage_id) ?? contact.lifecycle_stage_id });
    if (contact.lead_source_id) items.push({ id: contact.lead_source_id, label: findLabel(lookups?.lead_source, contact.lead_source_id) ?? contact.lead_source_id });
    if (contact.informant_trust_id) items.push({ id: contact.informant_trust_id, label: findLabel(lookups?.informant_trust, contact.informant_trust_id) ?? contact.informant_trust_id });
    return items;
  }, [contact, lookups]);

  const orgBadges = useMemo(() => {
    const items: { id: string; label: string }[] = [];
    if (contact.org_type_id) items.push({ id: contact.org_type_id, label: findLabel(lookups?.org_types, contact.org_type_id) ?? contact.org_type_id });
    if (contact.sector_id) items.push({ id: contact.sector_id, label: findLabel(lookups?.sectors, contact.sector_id) ?? contact.sector_id });
    return items;
  }, [contact, lookups]);

  const languageBadges = useMemo(() => {
    const langs = Array.isArray(contact.extra?.languages) ? contact.extra!.languages : [];
    return langs.map((id) => ({ id, label: findLabel(lookups?.languages, id) ?? id }));
  }, [contact, lookups]);

  return (
    <aside id="left-account-panel" className="card" aria-label="Fiche contact">
      {/* Bandeau haut */}
      <div className="card-body" style={{ paddingBottom: 8, position: "relative" }}>
        <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <button className="link-like small hstack" title="Retour aux contacts" style={{ gap: 6 }} onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Retour aux contacts</span>
          </button>

          {/* Menu Actions */}
          <div className="hstack" style={{ gap: 8 }}>
            <div style={{ position: "relative" }}>
              <button
                className="link-like small hstack"
                title="Actions"
                onClick={() => { setOpenActions(v => !v); }}
                style={{ gap: 6 }}
                aria-haspopup="menu"
                aria-expanded={openActions}
              >
                <span>Actions</span>
                <ChevronDown size={16} />
              </button>
              {openActions && (
                <Menu onClose={() => setOpenActions(false)}>
                  <MenuItem label="Lier à un échange" onClick={() => setOpenActions(false)} />
                  <MenuItem label="Programmer un rappel" onClick={() => setOpenActions(false)} />
                  <MenuItem label="Ouvrir la fiche complète" onClick={() => setOpenActions(false)} />
                  <MenuSeparator />
                  <MenuItem label="Exporter vCard" onClick={() => setOpenActions(false)} />
                  <MenuItem
                    label="Copier toutes les coordonnées"
                    onClick={() => {
                      copy([
                        `${prenom} ${nom}`.trim(),
                        email,
                        tel,
                        indiv.lienGeneanet
                      ].filter(Boolean).join("\n"));
                      setOpenActions(false);
                    }}
                  />
                  <MenuSeparator />
                  <MenuItem label="Marquer en liste rouge" onClick={() => setOpenActions(false)} />
                  <MenuItem label="Modifier le contact" onClick={() => { setOpenActions(false); onEdit(); }} />
                  <MenuItem danger label="Supprimer le contact" onClick={() => setOpenActions(false)} />
                </Menu>
              )}
            </div>
          </div>
        </div>

        {/* Identité */}
        <div className="hstack" style={{ gap: 20, marginBottom: 8 }}>
          <span className="avatar rounded-full bg-muted w-10 h-10" aria-hidden="true" />
          <div className="vstack" style={{ gap: 6 }}>
            <div className="vstack" style={{ gap: 2 }}>
              <h3 style={{ margin: 0 }}>{prenom} {nom}</h3>
              {role ? <span className="small muted">{role}</span> : null}
              {email ? <span className="small muted">{email}</span> : null}
            </div>

            {/* Badges identité (civilité, persona, profil, lien avec moi) */}
            <LabelsRow title="Identité & relation" items={identityBadges} />
            {/* Langues */}
            <LabelsRow title="Langues" items={languageBadges} />
            {/* Communication */}
            <LabelsRow title="Communication & consentements" items={commBadges} />
            {/* CRM */}
            <LabelsRow title="CRM" items={crmBadges} />
          </div>
        </div>

        {/* Actions rapides placeholders */}
        <div className="hstack" style={{ gap: 16, marginTop: 8, marginBottom: 8, justifyContent: "space-around" }}>
          <Quick icon={<CircleDashed size={18} />} label="Action 1" onClick={() => { }} />
          <Quick icon={<CircleDashed size={18} />} label="Action 2" onClick={() => { }} />
          <Quick icon={<CircleDashed size={18} />} label="Action 3" onClick={() => { }} />
          <Quick icon={<CircleDashed size={18} />} label="Action 4" onClick={() => { }} />
        </div>

        {/* Onglets */}
        <div className="tabs-lite" role="tablist" aria-label="Sections">
          <button className={`tab-lite ${tab === "individu" ? "active" : ""}`} role="tab" aria-selected={tab === "individu"} onClick={() => setTab("individu")}>
            Individu
          </button>
          <button className={`tab-lite ${tab === "structure" ? "active" : ""}`} role="tab" aria-selected={tab === "structure"} onClick={() => setTab("structure")}>
            Structure
          </button>
        </div>
      </div>

      {/* Contenu */}
      {tab === "individu" ? (
        <div className="card-body vstack" style={{ gap: 14 }}>
          <Field label="E-mail" value={email} onCopy={() => copy(email)} />
          <Field label="Téléphone" value={tel} onCopy={() => copy(tel)} />
          <hr className="sep" />
          <Field label="Statut" value={indiv.statut} />
          <Field label="Profil (UI)" value={indiv.profil} />
          <Field label="Canaux privilégiés" value={(indiv.canaux ?? []).join(", ")} />
          <Field label="Fréquence souhaitée" value={indiv.frequence} />
          <hr className="sep" />
          <Field label="Dernier échange" value={indiv.dernierEchange} />
          <Field label="Premier contact" value={indiv.premierContact} />
          <hr className="sep" />
          <Field
            label="Lien Geneanet"
            value={
              indiv.lienGeneanet ? (
                <span className="hstack" style={{ gap: 8 }}>
                  <a href={indiv.lienGeneanet} target="_blank" rel="noreferrer" className="small">{indiv.lienGeneanet}</a>
                  <button className="icon-circle-sm" title="Copier" onClick={() => copy(indiv.lienGeneanet)}><Copy size={14} /></button>
                  <button className="icon-circle-sm" title="Ouvrir" onClick={() => window.open(indiv.lienGeneanet!, "_blank")}><LinkIcon size={14} /></button>
                </span>
              ) : "—"
            }
          />
          <Field label="Membre de la famille" value={typeof indiv.membreFamille === "boolean" ? (indiv.membreFamille ? "Oui" : "Non") : (indiv.membreFamille ?? "—")} />
          <Field label="Tags (UI)" value={(indiv.tagsLabels ?? []).join("; ")} />
          <Field label="Notes de contexte" value={indiv.notesContexte} />
        </div>
      ) : (
        <div className="card-body vstack" style={{ gap: 14 }}>
          {/* Badges org/service */}
          <LabelsRow title="Organisation / Secteur" items={orgBadges} />

          <Field label="Structure" value={org} />
          <Field label="Poste occupé" value={struct.poste} />
          <Field label="E-mail (pro)" value={emailPro} onCopy={() => copy(emailPro)} />
          <Field label="Téléphone (pro)" value={telPro} onCopy={() => copy(telPro)} />
          <Field label="Adresse (pro)" value={adresse} />
          <Field
            label="Site / Inventaire"
            value={
              site ? (
                <span className="hstack" style={{ gap: 8 }}>
                  <a href={site} target="_blank" rel="noreferrer" className="small">{site}</a>
                  <button className="icon-circle-sm" title="Copier" onClick={() => copy(site)}><Copy size={14} /></button>
                  <button className="icon-circle-sm" title="Ouvrir" onClick={() => window.open(site!, "_blank")}><LinkIcon size={14} /></button>
                </span>
              ) : "—"
            }
          />
          <Field label="Notes de contexte" value={struct.notesContexte} />
        </div>
      )}
    </aside>
  );
}

/* ===========================
   Sous-composants
   =========================== */
function Field({ label, value, dim, onCopy }: { label: string; value?: React.ReactNode; dim?: boolean; onCopy?: () => void }) {
  return (
    <div className="vstack" style={{ gap: 4 }}>
      <span className="muted small">{label}</span>
      <div className="hstack" style={{ fontSize: "14px", justifyContent: "space-between", gap: 8 }}>
        <span className={dim ? "small muted" : ""}>{value ?? "—"}</span>
        {onCopy && value ? (
          <button className="icon-circle-sm" title="Copier" onClick={onCopy} aria-label={`Copier ${label}`}>
            <Copy size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Menu({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  React.useEffect(() => {
    const fn = () => onClose();
    setTimeout(() => document.addEventListener("click", fn, { once: true }), 0);
    return () => document.removeEventListener("click", fn);
  }, [onClose]);
  return <div className="menu-popover" role="menu">{children}</div>;
}

function MenuItem({ label, danger, onClick }: { label: string; danger?: boolean; onClick: () => void }) {
  return <button className={`menu-item ${danger ? "danger" : ""}`} role="menuitem" onClick={onClick}>{label}</button>;
}
function MenuSeparator() { return <div className="menu-sep" aria-hidden="true" />; }

function Quick({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div className="vstack" style={{ alignItems: "center", gap: 4 }}>
      <button className="icon-circle" title={label} onClick={onClick}>{icon}</button>
      <span className="small muted">{label}</span>
    </div>
  );
}
