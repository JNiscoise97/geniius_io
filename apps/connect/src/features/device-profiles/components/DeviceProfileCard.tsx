import { UserCircle2, CheckCircle2, ArrowRight, Trash2 } from "lucide-react";
import type { DeviceStoredProfile } from "../api/getStoredProfiles";

type Props = {
  profile: DeviceStoredProfile;
  isActive?: boolean;
  onOpen?: () => void;
  onRemove?: () => void;
};

export function DeviceProfileCard({
  profile,
  isActive = false,
  onOpen,
  onRemove,
}: Props) {
  const displayName =
    profile.label ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
          <UserCircle2 size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[16px] font-black text-slate-900 truncate">
              {displayName || "Profil"}
            </div>

            {isActive ? (
              <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700">
                <CheckCircle2 size={14} />
                Actif
              </div>
            ) : null}
          </div>

          {profile.birthYear ? (
            <div className="mt-1 text-xs font-bold text-slate-600">
              Né(e) en {profile.birthYear}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          onClick={onOpen}
          className="text-[12px] font-black text-[color:var(--blue)] inline-flex items-center gap-1"
        >
          Ouvrir
          <ArrowRight size={14} />
        </button>

        <button
          onClick={onRemove}
          className="text-[12px] font-black text-slate-500 inline-flex items-center gap-1"
        >
          <Trash2 size={14} />
          Retirer
        </button>
      </div>
    </div>
  );
}