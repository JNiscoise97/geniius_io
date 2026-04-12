import { Loader2, Shield, UserPlus, X } from "lucide-react";
import type { FamilyTreeRole } from "../../family-tree/types/permissions";

const FAMILY_TREE_ROLE_OPTIONS: Array<{
  value: FamilyTreeRole;
  label: string;
  description: string;
}> = [
  {
    value: "viewer",
    label: "Viewer",
    description: "Accès standard, sans droit d’administration d’arbre.",
  },
  {
    value: "family_helper",
    label: "Family helper",
    description: "Aide terrain : assistance, collecte de présence et consentements.",
  },
  {
    value: "tree_editor",
    label: "Tree editor",
    description: "Peut aussi éditer l’arbre et les overrides.",
  },
  {
    value: "organizer",
    label: "Organizer",
    description: "Accès complet à toutes les permissions arbre.",
  },
];

function RoleChip({
  role,
  onRemove,
  disabled = false,
}: {
  role: FamilyTreeRole;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800">
      <Shield size={14} />
      <span>{role}</span>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 disabled:opacity-50"
          aria-label={`Retirer le rôle ${role}`}
        >
          <X size={12} />
        </button>
      ) : null}
    </div>
  );
}

type Props = {
  roles: FamilyTreeRole[];
  selectedRole: FamilyTreeRole;
  isSaving: boolean;
  feedbackMessage?: string | null;
  errorMessage?: string | null;
  onChangeSelectedRole: (role: FamilyTreeRole) => void;
  onAddRole: () => void;
  onRemoveRole: (role: FamilyTreeRole) => void;
};

export function AdminParticipantRolesCard({
  roles,
  selectedRole,
  isSaving,
  feedbackMessage,
  errorMessage,
  onChangeSelectedRole,
  onAddRole,
  onRemoveRole,
}: Props) {
  const selectedRoleMeta = FAMILY_TREE_ROLE_OPTIONS.find(
    (option) => option.value === selectedRole,
  );

  const roleAlreadyAssigned = roles.includes(selectedRole);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
          <Shield size={20} />
        </div>
        <div>
          <div className="text-lg font-black text-slate-900">
            Rôles arbre familial
          </div>
          <div className="mt-1 text-sm font-medium text-slate-700">
            Octroie ou retire rapidement un rôle à ce participant pour les tests et l’administration.
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">
            Rôles actuels
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {roles.length > 0 ? (
              roles.map((role) => (
                <RoleChip
                  key={role}
                  role={role}
                  onRemove={() => onRemoveRole(role)}
                  disabled={isSaving}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                Aucun rôle attribué.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">
            Ajouter un rôle
          </div>

          <select
            value={selectedRole}
            onChange={(e) =>
              onChangeSelectedRole(e.target.value as FamilyTreeRole)
            }
            disabled={isSaving}
            className="mt-3 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-900 outline-none"
          >
            {FAMILY_TREE_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="mt-3 text-sm font-medium leading-6 text-slate-700">
            {selectedRoleMeta?.description}
          </div>

          <button
            type="button"
            onClick={onAddRole}
            disabled={isSaving || roleAlreadyAssigned}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-black text-white disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UserPlus size={16} />
            )}
            {roleAlreadyAssigned ? "Rôle déjà attribué" : "Ajouter ce rôle"}
          </button>

          {feedbackMessage ? (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800">
              {feedbackMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-800">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}