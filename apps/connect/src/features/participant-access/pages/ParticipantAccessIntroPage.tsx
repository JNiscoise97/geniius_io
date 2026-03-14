import { ArrowRight, ShieldCheck, Smartphone, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getParticipantAccessCreatePath } from "../config/participantAccessRoutes";

export function ParticipantAccessIntroPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <ShieldCheck size={14} />
            Bienvenue
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            Entre dans l’espace famille
          </h1>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            En quelques étapes, tu vas créer ton profil pour retrouver facilement
            ta branche, ton lien avec la famille et les informations utiles pour
            la cousinade.
          </p>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
              <Smartphone size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-black text-slate-900">
                Un profil enregistré sur ce téléphone
              </div>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                Une fois créé, ton profil restera disponible sur cet appareil pour
                revenir plus facilement plus tard.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
              <Users size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-black text-slate-900">
                Un lien personnel pour te retrouver
              </div>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                Nous t’enverrons aussi un lien personnel pour rouvrir ton profil
                sur un autre téléphone ou si cet appareil est réinitialisé.
              </p>
            </div>
          </div>
        </section>

        <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
          <div className="c-container">
            <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
              <button
                type="button"
                onClick={() => nav(getParticipantAccessCreatePath(slug))}
                className="w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 bg-[color:var(--blue)] text-white"
              >
                <ArrowRight size={18} />
                Commencer
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}