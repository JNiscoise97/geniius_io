import { Check, ChevronDown, Smartphone, UserRoundCog, UserCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getActiveParticipant } from "../../lib/participant-session/getActiveParticipant";
import { getStoredParticipantProfiles } from "../../lib/participant-session/getStoredParticipantProfiles";
import { setActiveStoredProfile } from "../../features/device-profiles/api/setActiveStoredProfile";
import { getManagedProfiles } from "../../features/participant-delegations/api/getManagedProfiles";

function getProfileDisplayName(profile: {
  label?: string;
  firstName?: string;
  lastName?: string;
}) {
  if (profile.label?.trim()) return profile.label.trim();

  const parts = [profile.firstName?.trim(), profile.lastName?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");

  return "Profil";
}

export function ProfileSwitcher() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [open, setOpen] = useState(false);

  const activeProfile = useMemo(() => getActiveParticipant(slug), [slug]);
  const storedProfilesState = useMemo(() => getStoredParticipantProfiles(slug), [slug]);
  const managedProfilesState = useMemo(() => getManagedProfiles(slug), [slug]);

  const activeDisplayName = activeProfile
    ? getProfileDisplayName(activeProfile)
    : "Accéder";

  function handleOpenProfile(participantId: string) {
    const ok = setActiveStoredProfile(slug, participantId);
    if (!ok) return;

    setOpen(false);
    navigate(`/e/${slug}/welcome`);
  }

  if (!activeProfile) {
    return (
      <Link
        to={`/e/${slug}/access`}
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-800"
      >
        <UserCircle2 size={16} />
        Accéder
      </Link>
    );
  }

  const otherDeviceProfiles = storedProfilesState.profiles.filter(
    (profile) => profile.participantId !== activeProfile.participantId,
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex max-w-[180px] items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-900"
      >
        <UserCircle2 size={16} className="shrink-0" />
        <span className="truncate">{activeDisplayName}</span>
        <ChevronDown size={16} className="shrink-0" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Fermer le menu profil"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 z-50 mt-2 w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Profil actif
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-900">
                    {activeDisplayName}
                  </div>
                  {activeProfile.birthYear ? (
                    <div className="mt-1 text-[11px] font-bold text-slate-600">
                      {activeProfile.birthYear}
                    </div>
                  ) : null}
                </div>

                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-extrabold text-emerald-700">
                  <Check size={12} />
                  Actif
                </div>
              </div>
            </div>

            {otherDeviceProfiles.length > 0 ? (
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  Sur cet appareil
                </div>

                <div className="space-y-2">
                  {otherDeviceProfiles.map((profile) => (
                    <button
                      key={profile.participantId}
                      type="button"
                      onClick={() => handleOpenProfile(profile.participantId)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">
                          {getProfileDisplayName(profile)}
                        </div>
                        {profile.birthYear ? (
                          <div className="mt-1 text-[11px] font-bold text-slate-600">
                            {profile.birthYear}
                          </div>
                        ) : null}
                      </div>

                      <Smartphone size={15} className="shrink-0 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {managedProfilesState.managedProfiles.length > 0 ? (
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  Profils que je gère
                </div>

                <div className="space-y-2">
                  {managedProfilesState.managedProfiles.map((profile) => (
                    <Link
                      key={profile.participantId}
                      to={`/e/${slug}/managed-profiles`}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 transition hover:bg-slate-100"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">
                          {getProfileDisplayName(profile)}
                        </div>
                        {profile.birthYear ? (
                          <div className="mt-1 text-[11px] font-bold text-slate-600">
                            {profile.birthYear}
                          </div>
                        ) : null}
                      </div>

                      <UserRoundCog size={15} className="shrink-0 text-slate-500" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="p-3">
              <div className="grid gap-2">
                <Link
                  to={`/e/${slug}/device-profiles`}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl bg-slate-50 px-3 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-100"
                >
                  Gérer les profils sur cet appareil
                </Link>

                <Link
                  to={`/e/${slug}/managed-profiles`}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl bg-slate-50 px-3 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-100"
                >
                  Voir les profils que je gère
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}