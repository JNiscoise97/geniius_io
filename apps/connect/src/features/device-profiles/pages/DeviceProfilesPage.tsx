import { ArrowLeft, UserPlus, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DeviceProfilesList } from "../components/DeviceProfilesList";

import {
  getStoredProfiles,
  type DeviceStoredProfilesState,
} from "../api/getStoredProfiles";

import { removeStoredProfile } from "../api/removeStoredProfile";
import { setActiveStoredProfile } from "../api/setActiveStoredProfile";

export function DeviceProfilesPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [state, setState] = useState<DeviceStoredProfilesState>({
    activeParticipantId: null,
    profiles: [],
  });

  useEffect(() => {
    loadProfiles();
  }, [slug]);

  function loadProfiles() {
    const profiles = getStoredProfiles(slug);
    setState(profiles);
  }

  function handleOpenProfile(participantId: string) {
    const ok = setActiveStoredProfile(slug, participantId);

    if (!ok) return;

    nav(`/e/${slug}/welcome`);
  }

  function handleRemoveProfile(participantId: string) {
    const next = removeStoredProfile(slug, participantId);
    setState(next);
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        {/* HEADER */}
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav(`/e/${slug}/access`)}
              className="rounded-2xl bg-slate-100 p-2 text-slate-700"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="text-[18px] font-black text-slate-900">
                Profils sur cet appareil
              </div>

              <div className="text-xs font-bold text-slate-600 mt-1">
                Tu peux accéder rapidement aux profils déjà utilisés sur ce téléphone.
              </div>
            </div>
          </div>
        </section>

        {/* LISTE */}
        <section className="mt-4">
          <DeviceProfilesList
            profiles={state.profiles}
            activeParticipantId={state.activeParticipantId}
            onOpenProfile={handleOpenProfile}
            onRemoveProfile={handleRemoveProfile}
          />
        </section>

        {/* ACTIONS */}
        <section className="mt-6 space-y-3">
          <button
            onClick={() => nav(`/e/${slug}/welcome/identity`)}
            className="w-full rounded-[26px] border border-slate-200 bg-white p-4 text-left shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                <UserPlus size={20} />
              </div>

              <div>
                <div className="text-[16px] font-black text-slate-900">
                  Créer un nouveau profil
                </div>

                <div className="text-xs font-bold text-slate-600 mt-1">
                  Si quelqu’un de ta famille souhaite participer.
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => nav(`/e/${slug}/access/recover`)}
            className="w-full rounded-[26px] border border-slate-200 bg-white p-4 text-left shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                <Link2 size={20} />
              </div>

              <div>
                <div className="text-[16px] font-black text-slate-900">
                  Récupérer un profil existant
                </div>

                <div className="text-xs font-bold text-slate-600 mt-1">
                  Si tu avais déjà commencé sur un autre appareil.
                </div>
              </div>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
}