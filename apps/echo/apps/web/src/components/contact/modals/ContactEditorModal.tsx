// apps/web/src/components/contact/modals/ContactEditorModal.tsx

import React, { useMemo, useState } from "react";
import type { Contact as DomainContact } from "@echo/domain";
import { Modal } from "@echo/ui";

/** ======================
 *  Types & Lookups (RO)
 *  ====================== */
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
  personOrgRelations?: LkOption[]; // pour l’onglet "Liens" (à brancher plus tard)
};

type ContactKind = "person" | "org" | "service";

type Tab = "identite" | "coordonnees" | "profil" | "liens";

/** Coordonnées typées attendues par le domaine */
export type EmailItem = { value: string; type_id: string; primary?: boolean; note?: string; label?: string };
export type PhoneItem = { value: string; type_id: string; primary?: boolean; note?: string; label?: string };
export type AddressItem = {
  street?: string; zip?: string; city?: string; country?: string;
  type_id: string; primary?: boolean; note?: string; label?: string;
};

/** ======================
 *  Composant principal
 *  ====================== */
export function ContactEditorModal({
  open,
  initial,
  lookups,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: DomainContact;          // Contact (domaine), camelCase ou snake_case
  lookups: Lookups;                // lookups en lecture seule (déjà i18n)
  onClose: () => void;
  onSave: (updated: DomainContact) => void;
}) {
  const [tab, setTab] = useState<Tab>("identite");
  const [form, setForm] = useState<DomainContact>(() => normalize(initial));
  const [langs, setLangs] = useState<string[]>(
    // Tant qu’on n’a pas la table n-n branchée côté API, on garde temporairement dans extra
    ((form as any)?.extra?.languages as string[] | undefined) ?? []
  );
  const [tags, setTags] = useState<string[]>(
    ((form as any)?.extra?.tagsLabels as string[] | undefined) ?? []
  );

  /** ========= Validations ========= */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const isEmail = (v?: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    // Identité : prénom/nom pour person, sinon display_name pour org/service
    const kind = getKind(form);
    const given = getGivenName(form);
    const family = getFamilyName(form);
    const display = (form as any).displayName ?? (form as any).display_name;

    if (kind === "person") {
      if (!trim(given)) e["identite.given_name"] = "Prénom requis";
      if (!trim(family)) e["identite.family_name"] = "Nom requis";
    } else {
      if (!trim(display) && !trim(family) && !trim(given)) {
        e["identite.display_name"] = "Nom affiché requis";
      }
    }

    // Emails typés
    (form.emails as EmailItem[] | undefined)?.forEach((m, i) => {
      if (!trim(m.value)) e[`coordonnees.email.${i}.value`] = "Email requis";
      if (!isEmail(m.value)) e[`coordonnees.email.${i}.value`] = "Format email invalide";
      if (!trim(m.type_id)) e[`coordonnees.email.${i}.type`] = "Type requis";
    });

    // Phones typés
    (form.phones as PhoneItem[] | undefined)?.forEach((m, i) => {
      if (!trim(m.value)) e[`coordonnees.phone.${i}.value`] = "Téléphone requis";
      if (!trim(m.type_id)) e[`coordonnees.phone.${i}.type`] = "Type requis";
    });

    // Addresses typées
    (form.addresses as AddressItem[] | undefined)?.forEach((m, i) => {
      if (!trim(m.type_id)) e[`coordonnees.address.${i}.type`] = "Type requis";
    });

    return e;
  }, [form]);

  /** ========= Helpers MAJ (garde compat camelCase/snake_case) ========= */
  function update(patch: Partial<DomainContact>) {
    setForm((prev) => ({ ...prev, ...patch, updated_at: new Date().toISOString() } as DomainContact));
  }
  const upEmails = (next: EmailItem[]) => update({ emails: next as any });
  const upPhones = (next: PhoneItem[]) => update({ phones: next as any });
  const upAddresses = (next: AddressItem[]) => update({ addresses: next as any });

  function handleSubmit() {
    if (Object.keys(errors).length > 0) return;

    const updated: DomainContact = {
      ...form,
      // conserve extra pour l’UI (avatar, headerEmail, tags, langues tant que pas n-n branchée)
      extra: {
        ...(form as any).extra,
        languages: langs,
        tagsLabels: tags,
      },
      updated_at: new Date().toISOString(),
    } as DomainContact;

    // synchroniser camelCase/snake_case clés majeures
    setGivenName(updated, getGivenName(form));
    setFamilyName(updated, getFamilyName(form));
    setDisplayName(updated, getDisplayName(form));
    setKind(updated, getKind(form));

    onSave(updated);
  }

  const tabHasError = (ns: string) => Object.keys(errors).some((k) => k.startsWith(ns + "."));

  /** ========= Rendu ========= */
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifier le contact"
      size="xl"
      footer={
        <div className="hstack" style={{ justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={Object.keys(errors).length > 0}
            title={Object.keys(errors).length > 0 ? "Corrigez les erreurs" : "Enregistrer"}
          >
            Enregistrer
          </button>
        </div>
      }
    >
      {/* Onglets */}
      <div className="tabs-lite" role="tablist" aria-label="Édition contact" style={{ marginBottom: 12 }}>
        <button
          className={`tab-lite ${tab === "identite" ? "active" : ""} ${tabHasError("identite") ? "danger" : ""}`}
          onClick={() => setTab("identite")}
        >
          Identité
        </button>
        <button
          className={`tab-lite ${tab === "coordonnees" ? "active" : ""} ${tabHasError("coordonnees") ? "danger" : ""}`}
          onClick={() => setTab("coordonnees")}
        >
          Coordonnées
        </button>
        <button
          className={`tab-lite ${tab === "profil" ? "active" : ""} ${tabHasError("profil") ? "danger" : ""}`}
          onClick={() => setTab("profil")}
        >
          Profil & relation
        </button>
        <button
          className={`tab-lite ${tab === "liens" ? "active" : ""}`}
          onClick={() => setTab("liens")}
        >
          Liens
        </button>
      </div>

      {/* ====== IDENTITÉ ====== */}
      {tab === "identite" && (
        <section className="vstack" style={{ gap: 12 }}>
          <Row2>
            <Select
              label="Type"
              value={getKind(form)}
              onChange={(v) => {
                setKind(form, v as ContactKind);
                update({});
              }}
              options={[
                { id: "person", label: "Personne" },
                { id: "org", label: "Organisation" },
                { id: "service", label: "Service / Guichet" },
              ]}
            />
            <Select
              label="Civilité"
              value={(form as any).civilite_id ?? ""}
              onChange={(v) => update({ ...(v ? { civilite_id: v } : { civilite_id: null }) } as any)}
              options={lookups.civilites}
              allowEmpty
            />
          </Row2>

          <Row2>
            <FieldText
              label={getKind(form) === "person" ? "Prénom *" : "Nom d’affichage *"}
              value={getGivenName(form) ?? ""}
              onChange={(v) => { setGivenName(form, v); update({}); }}
              error={errors["identite.given_name"]}
            />
            <FieldText
              label={getKind(form) === "person" ? "Nom *" : "Organisation / Service"}
              value={getFamilyName(form) ?? ""}
              onChange={(v) => { setFamilyName(form, v); update({}); }}
              error={errors["identite.family_name"]}
            />
          </Row2>

          <FieldText
            label="Nom affiché"
            value={getDisplayName(form) ?? ""}
            onChange={(v) => { setDisplayName(form, v); update({}); }}
            error={errors["identite.display_name"]}
          />

          {/* Préférences d’affichage (UI) */}
          <Row2>
            <FieldText
              label="Rôle (en-tête)"
              value={(form as any)?.extra?.role ?? ""}
              onChange={(v) => update({ extra: { ...(form as any).extra, role: v } as any })}
            />
            <FieldText
              label="E-mail (en-tête)"
              value={(form as any)?.extra?.headerEmail ?? ""}
              onChange={(v) => update({ extra: { ...(form as any).extra, headerEmail: v } as any })}
              inputMode="email"
            />
          </Row2>

          <FieldText
            label="Avatar URL"
            value={(form as any)?.extra?.avatarUrl ?? ""}
            onChange={(v) => update({ extra: { ...(form as any).extra, avatarUrl: v } as any })}
            placeholder="https://..."
          />

          {/* Spécifiques org/service */}
          {getKind(form) !== "person" && (
            <Row2>
              <Select
                label="Type d’organisation"
                value={(form as any).org_type_id ?? ""}
                onChange={(v) => update({ ...(v ? { org_type_id: v } : { org_type_id: null }) } as any)}
                options={lookups.orgTypes}
                allowEmpty
              />
              <Select
                label="Secteur"
                value={(form as any).sector_id ?? ""}
                onChange={(v) => update({ ...(v ? { sector_id: v } : { sector_id: null }) } as any)}
                options={lookups.sectors}
                allowEmpty
              />
            </Row2>
          )}
        </section>
      )}

      {/* ====== COORDONNÉES ====== */}
      {tab === "coordonnees" && (
        <section className="vstack" style={{ gap: 16 }}>
          <ArrayEmails
            label="Emails"
            value={(form.emails as EmailItem[] | undefined) ?? []}
            onChange={upEmails}
            typeOptions={lookups.emailTypes}
            nsError="coordonnees.email"
            errors={errors}
          />
          <ArrayPhones
            label="Téléphones"
            value={(form.phones as PhoneItem[] | undefined) ?? []}
            onChange={upPhones}
            typeOptions={lookups.phoneTypes}
            nsError="coordonnees.phone"
            errors={errors}
          />
          <ArrayAddresses
            label="Adresses"
            value={(form.addresses as AddressItem[] | undefined) ?? []}
            onChange={upAddresses}
            typeOptions={lookups.addressTypes}
            nsError="coordonnees.address"
            errors={errors}
          />
        </section>
      )}

      {/* ====== PROFIL & RELATION ====== */}
      {tab === "profil" && (
        <section className="vstack" style={{ gap: 12 }}>
          {getKind(form) === "person" ? (
            <>
              <Row2>
                <Select label="Persona" value={(form as any).persona_id ?? ""} onChange={(v) => update({ persona_id: v || null } as any)} options={lookups.personas} allowEmpty />
                <Select label="Relation à moi" value={(form as any).relationship_to_me_id ?? ""} onChange={(v) => update({ relationship_to_me_id: v || null } as any)} options={lookups.relationships} allowEmpty />
              </Row2>
              <Row2>
                <Select label="Statut relation" value={(form as any).lifecycle_stage_id ?? ""} onChange={(v) => update({ lifecycle_stage_id: v || null } as any)} options={lookups.lifecycleStages} allowEmpty />
                <Select label="Source d’origine" value={(form as any).lead_source_id ?? ""} onChange={(v) => update({ lead_source_id: v || null } as any)} options={lookups.leadSources} allowEmpty />
              </Row2>
              <Row2>
                <Select label="Canal préféré" value={(form as any).preferred_channel_id ?? ""} onChange={(v) => update({ preferred_channel_id: v || null } as any)} options={lookups.channels} allowEmpty />
                <Select label="Consentement (opt-in)" value={(form as any).optin_status_id ?? ""} onChange={(v) => update({ optin_status_id: v || null } as any)} options={lookups.optins} allowEmpty />
              </Row2>
              <Row2>
                <Select label="Profil (affinité)" value={(form as any).profile_id ?? ""} onChange={(v) => update({ profile_id: v || null } as any)} options={lookups.profiles} allowEmpty />
                <Select label="Fiabilité informateur" value={(form as any).informant_trust_id ?? ""} onChange={(v) => update({ informant_trust_id: v || null } as any)} options={lookups.trusts} allowEmpty />
              </Row2>
              <Row2>
                <Select label="Ton de com préféré" value={(form as any).preferred_comm_tone_id ?? ""} onChange={(v) => update({ preferred_comm_tone_id: v || null } as any)} options={lookups.commTones} allowEmpty />
                <Select label="Méthode de partage préférée" value={(form as any).preferred_share_method_id ?? ""} onChange={(v) => update({ preferred_share_method_id: v || null } as any)} options={lookups.shareMethods} allowEmpty />
              </Row2>
              <Chips label="Langues" value={langs} onChange={setLangs} options={lookups.languages} />
              <Chips label="Tags (UI)" value={tags} onChange={setTags} freeSolo />
            </>
          ) : (
            <>
              <Row2>
                <Select label="Canal préféré" value={(form as any).preferred_channel_id ?? ""} onChange={(v) => update({ preferred_channel_id: v || null } as any)} options={lookups.channels} allowEmpty />
                <Select label="Consentement (opt-in)" value={(form as any).optin_status_id ?? ""} onChange={(v) => update({ optin_status_id: v || null } as any)} options={lookups.optins} allowEmpty />
              </Row2>
              <Chips label="Langues" value={langs} onChange={setLangs} options={lookups.languages} />
              <Chips label="Tags (UI)" value={tags} onChange={setTags} freeSolo />
            </>
          )}
        </section>
      )}

      {/* ====== LIENS (placeholder – à brancher) ====== */}
      {tab === "liens" && (
        <section className="vstack" style={{ gap: 12 }}>
          <p className="small muted">
            Lier ce contact à des organisations/services avec un rôle (ex. Employé, Contact de service…).
            Cette section utilisera les tables <code>person_org_links</code>, <code>person_service_links</code>, <code>service_org_links</code>.
          </p>
          <div className="hstack" style={{ gap: 8 }}>
            <button className="btn">Lier à une organisation…</button>
            <button className="btn">Lier à un service…</button>
          </div>
          <p className="small muted">
            (À implémenter : sous-modal de recherche + choix du rôle {lookups.personOrgRelations ? "" : "(pense à passer personOrgRelations dans lookups)"}.)
          </p>
        </section>
      )}
    </Modal>
  );
}

/* ================= Helpers & champs ================= */

function normalize(c: DomainContact): DomainContact {
  // unifie structures, initialise arrays typés, garde extra
  const withNames = ensureNameShape(c);
  const emails: EmailItem[] = (withNames as any).emails ?? [];
  const phones: PhoneItem[] = (withNames as any).phones ?? [];
  const addresses: AddressItem[] = (withNames as any).addresses ?? [];

  // si aucune entrée "primary", marque la première pour le confort
  if (emails.length && !emails.some(e => e.primary)) emails[0].primary = true;
  if (phones.length && !phones.some(p => p.primary)) phones[0].primary = true;
  if (addresses.length && !addresses.some(a => a.primary)) addresses[0].primary = true;

  return {
    ...withNames,
    emails,
    phones,
    addresses,
    kind: getKind(withNames) ?? "person",
    extra: { ...(withNames as any).extra },
  } as DomainContact;
}

function ensureNameShape(c: any): any {
  // Support camelCase/snake_case en lecture/écriture
  const given = c.givenName ?? c.given_name ?? "";
  const family = c.familyName ?? c.family_name ?? "";
  const display = c.displayName ?? c.display_name ?? c.display ?? `${given} ${family}`.trim();
  return {
    ...c,
    givenName: given,
    given_name: given,
    familyName: family,
    family_name: family,
    displayName: display,
    display_name: display,
  };
}

/* ====== Champs de base ====== */

function Row2({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {children}
    </div>
  );
}

function FieldText({
  label, value, onChange, placeholder, error, inputMode,
}: {
  label: string;
  value?: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  inputMode?: "email" | "tel" | "url" | "text" | "numeric" | "search";
}) {
  return (
    <div className="vstack" style={{ gap: 6 }}>
      <label className="small muted">{label}</label>
      <input
        className={`input ${error ? "danger" : ""}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode ?? "text"}
      />
      {error ? <span className="small" style={{ color: "var(--danger)" }}>{error}</span> : null}
    </div>
  );
}

function Select({
  label, value, onChange, options, allowEmpty
}: {
  label: string;
  value?: string | null;
  onChange: (v: string) => void;
  options: LkOption[];
  allowEmpty?: boolean;
}) {
  return (
    <div className="vstack" style={{ gap: 6 }}>
      <label className="small muted">{label}</label>
      <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {allowEmpty && <option value="">—</option>}
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ====== Array editors ====== */

function ArraySection({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="vstack" style={{ gap: 8 }}>
      <div className="hstack" style={{ justifyContent: "space-between" }}>
        <label className="small muted">{title}</label>
        <button className="btn" onClick={onAdd}>Ajouter</button>
      </div>
      <div className="vstack" style={{ gap: 8 }}>{children}</div>
    </div>
  );
}

function ArrayEmails({
  label, value, onChange, typeOptions, nsError, errors
}: {
  label: string;
  value: EmailItem[];
  onChange: (v: EmailItem[]) => void;
  typeOptions: LkOption[];
  nsError: string;
  errors: Record<string, string>;
}) {
  function up(i: number, patch: Partial<EmailItem>) {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    if (patch.primary) next.forEach((e, j) => { if (j !== i) e.primary = false; });
    onChange(next);
  }
  return (
    <ArraySection title={label} onAdd={() => onChange([...(value ?? []), { value: "", type_id: "perso", primary: (value.length === 0) }])}>
      {value.map((m, i) => (
        <div key={i} className="grid" style={{ gridTemplateColumns: "2fr 1fr auto auto", gap: 8 }}>
          <div>
            <input className={`input ${errors[`${nsError}.${i}.value`] ? "danger" : ""}`} placeholder="email@exemple.org" value={m.value} onChange={(e) => up(i, { value: e.target.value })} />
            {errors[`${nsError}.${i}.value`] && <span className="small" style={{ color: "var(--danger)" }}>{errors[`${nsError}.${i}.value`]}</span>}
          </div>
          <div>
            <select className={`input ${errors[`${nsError}.${i}.type`] ? "danger" : ""}`} value={m.type_id} onChange={(e) => up(i, { type_id: e.target.value })}>
              {typeOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {errors[`${nsError}.${i}.type`] && <span className="small" style={{ color: "var(--danger)" }}>{errors[`${nsError}.${i}.type`]}</span>}
          </div>
          <label className="hstack small" style={{ gap: 6 }}>
            <input type="checkbox" checked={!!m.primary} onChange={(e) => up(i, { primary: e.target.checked })} />
            <span>Principal</span>
          </label>
          <button className="btn" onClick={() => onChange(value.filter((_, j) => j !== i))}>Suppr.</button>
        </div>
      ))}
    </ArraySection>
  );
}

function ArrayPhones({
  label, value, onChange, typeOptions, nsError, errors
}: {
  label: string;
  value: PhoneItem[];
  onChange: (v: PhoneItem[]) => void;
  typeOptions: LkOption[];
  nsError: string;
  errors: Record<string, string>;
}) {
  function up(i: number, patch: Partial<PhoneItem>) {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    if (patch.primary) next.forEach((e, j) => { if (j !== i) e.primary = false; });
    onChange(next);
  }
  return (
    <ArraySection title={label} onAdd={() => onChange([...(value ?? []), { value: "", type_id: "mobile", primary: (value.length === 0) }])}>
      {value.map((m, i) => (
        <div key={i} className="grid" style={{ gridTemplateColumns: "2fr 1fr auto auto", gap: 8 }}>
          <div>
            <input className={`input ${errors[`${nsError}.${i}.value`] ? "danger" : ""}`} placeholder="+33 ..." value={m.value} onChange={(e) => up(i, { value: e.target.value })} />
            {errors[`${nsError}.${i}.value`] && <span className="small" style={{ color: "var(--danger)" }}>{errors[`${nsError}.${i}.value`]}</span>}
          </div>
          <div>
            <select className={`input ${errors[`${nsError}.${i}.type`] ? "danger" : ""}`} value={m.type_id} onChange={(e) => up(i, { type_id: e.target.value })}>
              {typeOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {errors[`${nsError}.${i}.type`] && <span className="small" style={{ color: "var(--danger)" }}>{errors[`${nsError}.${i}.type`]}</span>}
          </div>
          <label className="hstack small" style={{ gap: 6 }}>
            <input type="checkbox" checked={!!m.primary} onChange={(e) => up(i, { primary: e.target.checked })} />
            <span>Principal</span>
          </label>
          <button className="btn" onClick={() => onChange(value.filter((_, j) => j !== i))}>Suppr.</button>
        </div>
      ))}
    </ArraySection>
  );
}

function ArrayAddresses({
  label, value, onChange, typeOptions, nsError, errors
}: {
  label: string;
  value: AddressItem[];
  onChange: (v: AddressItem[]) => void;
  typeOptions: LkOption[];
  nsError: string;
  errors: Record<string, string>;
}) {
  function up(i: number, patch: Partial<AddressItem>) {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    if (patch.primary) next.forEach((e, j) => { if (j !== i) e.primary = false; });
    onChange(next);
  }
  return (
    <ArraySection title={label} onAdd={() => onChange([...(value ?? []), { street: "", city: "", zip: "", country: "", type_id: "domicile", primary: (value.length === 0) }])}>
      {value.map((m, i) => (
        <div key={i} className="grid" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto auto", gap: 8 }}>
          <input className="input" placeholder="Rue…" value={m.street ?? ""} onChange={(e) => up(i, { street: e.target.value })} />
          <input className="input" placeholder="CP" value={m.zip ?? ""} onChange={(e) => up(i, { zip: e.target.value })} />
          <input className="input" placeholder="Ville" value={m.city ?? ""} onChange={(e) => up(i, { city: e.target.value })} />
          <input className="input" placeholder="Pays" value={m.country ?? ""} onChange={(e) => up(i, { country: e.target.value })} />
          <div>
            <select className={`input ${errors[`${nsError}.${i}.type`] ? "danger" : ""}`} value={m.type_id} onChange={(e) => up(i, { type_id: e.target.value })}>
              {typeOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {errors[`${nsError}.${i}.type`] && <span className="small" style={{ color: "var(--danger)" }}>{errors[`${nsError}.${i}.type`]}</span>}
          </div>
          <label className="hstack small" style={{ gap: 6 }}>
            <input type="checkbox" checked={!!m.primary} onChange={(e) => up(i, { primary: e.target.checked })} />
            <span>Principal</span>
          </label>
          <button className="btn" onClick={() => onChange(value.filter((_, j) => j !== i))}>Suppr.</button>
        </div>
      ))}
    </ArraySection>
  );
}

/* ====== Chips (multiselect) ====== */

function Chips({
  label, value, onChange, options, freeSolo
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  options?: LkOption[];
  freeSolo?: boolean;
}) {
  const [input, setInput] = useState("");
  const add = (v: string) => {
    const vv = v.trim();
    if (!vv) return;
    if (!value.includes(vv)) onChange([...value, vv]);
    setInput("");
  };
  const remove = (v: string) => onChange(value.filter(x => x !== v));
  return (
    <div className="vstack" style={{ gap: 6 }}>
      <label className="small muted">{label}</label>
      <div className="hstack" style={{ flexWrap: "wrap", gap: 6 }}>
        {value.map(v => (
          <span key={v} className="badge">
            {options ? (options.find(o => o.id === v)?.label ?? v) : v}
            <button className="icon-circle-sm" onClick={() => remove(v)} title="Supprimer">×</button>
          </span>
        ))}
      </div>
      <div className="hstack" style={{ gap: 8 }}>
        {options && !freeSolo ? (
          <select className="input" value="" onChange={(e) => add(e.target.value)}>
            <option value="">— Ajouter —</option>
            {options.filter(o => !value.includes(o.id)).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        ) : (
          <>
            <input className="input" placeholder="Ajouter…" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="btn" onClick={() => add(input)}>Ajouter</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ====== Utils noms/kind (compat camelCase/snake_case) ====== */

function getKind(c: any): ContactKind {
  return (c.kind as ContactKind) ?? "person";
}
function setKind(c: any, k: ContactKind) {
  c.kind = k;
}

function getGivenName(c: any): string { return c.givenName ?? c.given_name ?? ""; }
function setGivenName(c: any, v: string) { c.givenName = v; c.given_name = v; }

function getFamilyName(c: any): string { return c.familyName ?? c.family_name ?? ""; }
function setFamilyName(c: any, v: string) { c.familyName = v; c.family_name = v; }

function getDisplayName(c: any): string { return c.displayName ?? c.display_name ?? ""; }
function setDisplayName(c: any, v: string) { c.displayName = v; c.display_name = v; }

const trim = (s?: string | null) => (s ?? "").trim();
