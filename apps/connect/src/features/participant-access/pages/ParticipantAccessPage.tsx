import { ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AccessChoiceCard } from "../components/AccessChoiceCard";
import { DeviceProfilesCard } from "../components/DeviceProfilesCard";
import { accessConfig } from "../config/accessConfig";
import {
  getStoredParticipantProfiles,
  type StoredParticipantProfile,
} from "../../../lib/participant-session/getStoredParticipantProfiles";
import { setActiveParticipant } from "../../../lib/participant-session/setActiveParticipant";

function syncLegacyParticipantStorage(
  slug: string,
  profile: StoredParticipantProfile | null,
) {
  if (!profile) return;

  localStorage.setItem(
    `connect:${slug}:participant`,
    JSON.stringify({
      participantId: profile.participantId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      birthYear: profile.birthYear,
      recoveryToken: profile.recoveryToken,
    }),
  );
}

export function ParticipantAccessPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const state = useMemo(() => getStoredParticipantProfiles(slug), [slug]);

  const activeProfile = useMemo(
    () =>
      state.profiles.find(
        (profile) => profile.participantId === state.activeParticipantId,
      ) ?? null,
    [state],
  );

  function openStoredProfile(participantId: string) {
    const ok = setActiveParticipant(slug, participantId);
    if (!ok) return;

    const nextActive =
      state.profiles.find((profile) => profile.participantId === participantId) ??
      null;

    syncLegacyParticipantStorage(slug, nextActive);
    nav(`/e/${slug}/welcome`);
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-24">
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <ShieldCheck size={14} />
            Accès au profil
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            {accessConfig.title}
          </h1>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            {accessConfig.subtitle}
          </p>
        </section>

        <div className="mt-4">
          <DeviceProfilesCard
            profiles={state.profiles}
            activeParticipantId={activeProfile?.participantId ?? null}
            onOpenProfile={openStoredProfile}
          />
        </div>

        <section className="mt-5 space-y-3">
          {accessConfig.choices
            .filter((choice) => choice.key !== "device")
            .map((choice) => (
              <AccessChoiceCard
                key={choice.key}
                title={choice.title}
                subtitle={choice.subtitle}
                ctaLabel={choice.ctaLabel}
                icon={choice.icon}
                onClick={() => {
                  if (choice.key === "recover") {
                    nav(`/e/${slug}/access/recover`);
                    return;
                  }

                  if (choice.key === "create") {
                    nav(`/e/${slug}/welcome/identity`);
                  }
                }}
              />
            ))}
        </section>
      </main>
    </div>
  );
}