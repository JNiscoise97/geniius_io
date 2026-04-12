

export type ParticipantTreeVisibilityPreferences = {
  allowNameInFamilyTree?: boolean | null;
  allowPhotoInFamilyTree?: boolean | null;
  allowInfoInFamilyTree?: boolean | null;
};

export type ParticipantVisibilityPreferenceMap = Record<
  string,
  ParticipantTreeVisibilityPreferences | undefined
>;

export type PersonVisibilityPreferenceMap = Record<
  string,
  ParticipantTreeVisibilityPreferences | undefined
>;

export type FamilyTreeViewMode = "standard" | "helper_extended";