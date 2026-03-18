import { ArrowLeft, AlertTriangle, ShieldCheck, UserRoundCog } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getManagedProfiles,
  type GetManagedProfilesResult,
} from "../api/getManagedProfiles";
import { switchToManagedProfile } from "../api/switchToManagedProfile";
import { delegationsConfig } from "../config/delegationsConfig";
import { ManagedProfilesList } from "../components/ManagedProfilesList";

export function ManagedProfilesPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [data, setData] = useState<GetManagedProfilesResult>({
    activeParticipantId: null,
    managedProfiles: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadManagedProfiles();
  }, [slug]);

  function loadManagedProfiles() {
    setError(null);

    try {
      const result = getManagedProfiles(slug);
      setData(result);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger les profils gérés.");
    }
  }

  function handleOpenManagedProfile(participantId: string) {
    setError(null);

    const result = switchToManagedProfile(slug, participantId);

    if (!result.ok) {
      if (result.reason === "no-active-participant") {
        setError("Aucun profil actif n’a été retrouvé sur cet appareil.");
        return;
      }

      if (result.reason === "not-managed-profile") {
        setError("Ce profil n’est pas disponible dans la liste des profils gérés.");
        return;
      }

      setError("Impossible d’ouvrir ce profil pour le moment.");
      return;
    }

    nav(`/e/${slug}/welcome`);
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => nav(`/e/${slug}/access/intro`)}
              className="rounded-2xl bg-slate-100 p-2 text-slate-700"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="text-[18px] font-black text-slate-900">
                {delegationsConfig.title}
              </div>

              <div className="mt-1 text-xs font-bold text-slate-600">
                {delegationsConfig.subtitle}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-2xl bg-indigo-50 p-2 text-indigo-700">
              <ShieldCheck size={18} />
            </div>

            <div className="min-w-0">
              <div className="text-[15px] font-black text-slate-900">
                Bascule rapide
              </div>

              <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                Ouvre ici les profils que tu gères sans avoir à refaire toute la saisie.
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <section className="mt-4 rounded-[24px] border border-[rgba(220,38,38,0.18)] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-[color:var(--bad)]">
                <AlertTriangle size={18} />
              </div>

              <div>
                <div className="text-sm font-black text-slate-900">
                  Impossible de poursuivre
                </div>

                <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
                  {error}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-5">
          <ManagedProfilesList
            profiles={data.managedProfiles}
            onOpenProfile={handleOpenManagedProfile}
          />
        </section>

        <section className="mt-6">
          <button
            type="button"
            onClick={() => nav(`/e/${slug}/welcome/identity`)}
            className="w-full rounded-[26px] border border-slate-200 bg-white p-4 text-left shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                <UserRoundCog size={20} />
              </div>

              <div>
                <div className="text-[16px] font-black text-slate-900">
                  Créer un autre profil
                </div>

                <div className="mt-1 text-xs font-bold text-slate-600">
                  Pour renseigner les informations d’un proche sur cet appareil.
                </div>
              </div>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
}