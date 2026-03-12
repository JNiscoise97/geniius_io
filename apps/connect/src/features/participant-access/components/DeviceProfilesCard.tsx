import { ArrowRight, CheckCircle2, Smartphone } from "lucide-react";
import type { StoredParticipantProfile } from "../../../lib/participant-session/getStoredParticipantProfiles";

type DeviceProfilesCardProps = {
  profiles: StoredParticipantProfile[];
  activeParticipantId?: string | null;
  onOpenProfile?: (participantId: string) => void;
  onOpenAllProfiles?: () => void;
};

function getProfileDisplayName(profile: StoredParticipantProfile): string {
  if (profile.label?.trim()) return profile.label.trim();

  const parts = [profile.firstName?.trim(), profile.lastName?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");

  return "Profil familial";
}

export function DeviceProfilesCard({
  profiles,
  activeParticipantId = null,
  onOpenProfile,
  onOpenAllProfiles,
}: DeviceProfilesCardProps) {
  if (profiles.length === 0) {
    return (
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
            <Smartphone size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-black text-slate-900">
              Aucun profil enregistré sur cet appareil
            </div>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
              Tu pourras créer un nouveau profil ou retrouver un profil existant.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const previewProfiles = profiles.slice(0, 3);

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
          <Smartphone size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-black text-slate-900">
            Profils enregistrés sur cet appareil
          </div>
          <div className="mt-1 text-sm font-bold text-slate-700">
            {profiles.length} profil{profiles.length > 1 ? "s" : ""} disponible
            {profiles.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {previewProfiles.map((profile) => {
          const isActive = profile.participantId === activeParticipantId;

          return (
            <button
              key={profile.participantId}
              type="button"
              onClick={() => onOpenProfile?.(profile.participantId)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left transition-all active:scale-[0.995] active:shadow-none"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900">
                    {getProfileDisplayName(profile)}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-2">
                    {profile.birthYear ? (
                      <div className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-extrabold text-slate-700">
                        {profile.birthYear}
                      </div>
                    ) : null}

                    {isActive ? (
                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-extrabold text-emerald-700">
                        <CheckCircle2 size={12} />
                        Profil actif
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="shrink-0 rounded-xl bg-slate-100 p-2 text-slate-900">
                  <ArrowRight size={16} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onOpenAllProfiles}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-900 transition-all active:scale-[0.995]"
        >
          Voir tous les profils
        </button>
      </div>
    </section>
  );
}