import { ArrowRight, UserRoundCog } from "lucide-react";
import type { ManagedProfile } from "../api/getManagedProfiles";
import { delegationsConfig } from "../config/delegationsConfig";

type ManagedProfileCardProps = {
  profile: ManagedProfile;
  onOpen?: () => void;
};

function getProfileDisplayName(profile: ManagedProfile): string {
  if (profile.label?.trim()) return profile.label.trim();

  const parts = [profile.firstName?.trim(), profile.lastName?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");

  return "Profil familial";
}

export function ManagedProfileCard({
  profile,
  onOpen,
}: ManagedProfileCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[26px] border border-slate-200 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.995] active:shadow-none"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
          <UserRoundCog size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[16px] font-black text-slate-900">
                {getProfileDisplayName(profile)}
              </div>

              <div className="mt-1 flex flex-wrap gap-2">
                <div className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-extrabold text-slate-700">
                  {delegationsConfig.managedByMeLabel}
                </div>

                {profile.birthYear ? (
                  <div className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-extrabold text-slate-700">
                    {profile.birthYear}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
              <ArrowRight size={18} />
            </div>
          </div>

          <div className="mt-4 text-[12px] font-black text-[color:var(--blue)]">
            {delegationsConfig.switchLabel}
          </div>
        </div>
      </div>
    </button>
  );
}