export type FamilyTreeRole =
  | "viewer"
  | "family_helper"
  | "tree_editor"
  | "organizer";

export type FamilyTreePermission =
  | "family_tree.view_masked_people"
  | "family_tree.assist_in_person"
  | "family_tree.collect_presence"
  | "family_tree.collect_consents"
  | "family_tree.add_photo_on_behalf"
  | "family_tree.create_participant_on_behalf"
  | "family_tree.create_person_override"
  | "family_tree.edit_person_override"
  | "family_tree.add_person"
  | "family_tree.manage_roles";

export type ParticipantRoleAssignment = {
  id: string;
  event_slug: string;
  participant_id: string;
  role: FamilyTreeRole;
  created_at?: string;
  updated_at?: string;
};

export type FamilyTreePermissionSet = Record<FamilyTreePermission, boolean>;