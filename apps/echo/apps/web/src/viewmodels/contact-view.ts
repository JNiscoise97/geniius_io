// apps/web/src/viewmodels/contact-view.ts
export type Canal = "email" | "téléphone" | "sms" | "whatsapp" | "réseaux sociaux" | string;

export interface IdentiteView {
  prenom: string;
  nom: string;
  role?: string;
  email?: string;
}

export interface IndividuView {
  email?: string;
  telephone?: string;
  statut?: string;
  profil?: string;
  canaux: Canal[];
  frequence?: string;
  dernierEchange?: string;
  premierContact?: string;
  lienGeneanet?: string;
  membreFamille?: boolean;
  tags: string[];
  notesContexte?: string;
}

export interface StructureView {
  nom?: string;
  poste?: string;
  emailPro?: string;
  telephonePro?: string;
  adresse?: string;
  site?: string;
  notesContexte?: string;
}

export interface ContactView {
  identite: IdentiteView;
  individu: IndividuView;
  structure: StructureView;
}
