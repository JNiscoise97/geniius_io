// apps/web/src/viewmodels/contact-adapter.ts
import type { Contact as DomainContact, Tag as DomainTag, ID } from "@echo/domain";
import type { ContactView } from "./contact-view";

// Petit util pour “l’étiquette” primaire
const findByLabel = (arr: {label?: string; value: string}[] | undefined, wanted: string[]) =>
  arr?.find(x => x.value && (x.label ? wanted.includes(x.label.toLowerCase()) : false))?.value
  ?? arr?.[0]?.value;

export function toContactView(
  c: DomainContact,
  tagsIndex?: Record<ID, DomainTag>
): ContactView {
  // Heuristiques simples depuis ton domaine (normalisé) → view
  const primaryEmail = findByLabel(c.emails, ["perso", "personnel", "privé", "home"]);
  const proEmail     = findByLabel(c.emails, ["pro", "travail", "work"]);
  const primaryPhone = findByLabel(c.phones, ["mobile", "perso"]);
  const proPhone     = findByLabel(c.phones, ["pro", "bureau"]);

  const addressStr   = c.addresses?.[0]
    ? [c.addresses[0].street, c.addresses[0].zip, c.addresses[0].city, c.addresses[0].country]
        .filter(Boolean).join(", ")
    : undefined;

  // tags du domaine → libellés
  const tagLabels = (c.tags ?? []).map(id => tagsIndex?.[id]?.label).filter(Boolean) as string[];

  // notes: tu peux décider d’y sérialiser des métadonnées plus tard (YAML/JSON) ; ici on les met en “Notes de contexte”
  return {
    identite: {
      prenom: c.givenName ?? "",
      nom: c.familyName ?? (c.displayName || ""),
      role: undefined,
      email: primaryEmail,
    },
    individu: {
      email: primaryEmail,
      telephone: primaryPhone,
      statut: undefined,
      profil: undefined,
      canaux: [],                 // si tu veux, dérive ça plus tard
      frequence: undefined,
      dernierEchange: undefined,
      premierContact: undefined,
      lienGeneanet: undefined,
      membreFamille: undefined,
      tags: tagLabels,
      notesContexte: c.notes ?? "",
    },
    structure: {
      nom: c.org,
      poste: undefined,
      emailPro: proEmail,
      telephonePro: proPhone,
      adresse: addressStr,
      site: undefined,
      notesContexte: undefined,
    },
  };
}

export function applyContactView(
  original: DomainContact,
  view: ContactView,
  resolveTagId?: (label: string) => ID
): DomainContact {
  const now = new Date().toISOString();

  // (1) recoller prénom/nom/affichage
  const givenName = view.identite.prenom?.trim() || undefined;
  const familyName = view.identite.nom?.trim() || undefined;
  const displayName = [givenName, familyName].filter(Boolean).join(" ") || original.displayName;

  // (2) emails/phones — on conserve l’existant si présent, sinon on remplace/ajoute
  const emails = [...(original.emails ?? [])];
  const upsertEmail = (value?: string, label?: string) => {
    if (!value) return;
    const i = emails.findIndex(e => e.value === value);
    if (i === -1) emails.unshift({ value, label });
    else emails[i] = { ...emails[i], value, label: label ?? emails[i].label };
  };
  upsertEmail(view.individu.email, "perso");
  upsertEmail(view.structure.emailPro, "pro");

  const phones = [...(original.phones ?? [])];
  const upsertPhone = (value?: string, label?: string) => {
    if (!value) return;
    const i = phones.findIndex(p => p.value === value);
    if (i === -1) phones.unshift({ value, label });
    else phones[i] = { ...phones[i], value, label: label ?? phones[i].label };
  };
  upsertPhone(view.individu.telephone, "mobile");
  upsertPhone(view.structure.telephonePro, "pro");

  // (3) adresse pro — mappe sur la première adresse
  const addresses = [...(original.addresses ?? [])];
  if (view.structure.adresse) {
    addresses[0] = addresses[0] ?? {};
    addresses[0].label = addresses[0].label ?? "pro";
    addresses[0].street = view.structure.adresse; // simplifié (tu peux parser si nécessaire)
  }

  // (4) tags — crée/associe via resolveTagId
  let tags = original.tags ?? [];
  if (resolveTagId) {
    const wanted = (view.individu.tags ?? []).map(t => resolveTagId(t)).filter(Boolean) as ID[];
    tags = Array.from(new Set(wanted)); // remplace (ou fusionne si souhaité)
  }

  // (5) notes — on écrase avec la vue (ou fusion “intelligente” si besoin)
  const notes = view.individu.notesContexte ?? original.notes;

  return {
    ...original,
    displayName,
    givenName,
    familyName,
    org: view.structure.nom ?? original.org,
    emails,
    phones,
    addresses,
    tags,
    notes,
    updatedAt: now,
  };
}
