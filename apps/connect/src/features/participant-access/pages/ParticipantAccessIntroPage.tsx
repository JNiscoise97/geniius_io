import { ArrowRight, ShieldCheck, TreePine, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getParticipantAccessCreatePath } from "../config/participantAccessRoutes";
import cousinade from "../../../assets/images/cousinade.jpg";

export function ParticipantAccessIntroPage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  function handleStart() {
    navigate(getParticipantAccessCreatePath(slug));
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-4 pb-28">
        <section className="animate-[fadeInUp_500ms_ease-out] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="relative h-[240px] w-full overflow-hidden">
            <img
              src={cousinade}
              alt="Famille réunie lors de la cousinade"
              className="h-full w-full scale-105 object-cover blur-[1px]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.82)] via-[rgba(49,46,129,0.42)] to-[rgba(255,255,255,0.08)]" />

            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold backdrop-blur-sm">
                Cousinade TANJAMA 2026
              </div>

              <h1 className="mt-4 text-[30px] leading-[1.02] font-black tracking-tight">
                La famille se retrouve en 2026
              </h1>

              <p className="mt-3 max-w-[28ch] text-sm font-bold leading-6 text-white/90">
                Une même racine.
                <br/>Plusieurs générations.
                <br/>Un seul rendez-vous.
              </p>
            </div>
          </div>

          <div className="p-5">
            <p className="text-sm font-bold leading-6 text-slate-700">
              Après plus de 400 cousins réunis en 2023 et 2024, la famille
              TANJAMA se prépare à se retrouver à nouveau. Cet espace te permet
              d’entrer dans la cousinade, retrouver ta place dans la famille et
              découvrir les cousins de ta branche.
            </p>
          </div>
        </section>

        <section className="mt-4 animate-[fadeInUp_650ms_ease-out] rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Descendance
          </div>

          <div className="mt-2 text-xl font-black text-slate-900">
            COVINDOU TANDIEMAIN
          </div>

          <div className="mt-1 text-sm font-bold text-slate-600">
            1868 – 1955
          </div>
        </section>

        <section className="mt-4 space-y-4">
          <article className="animate-[fadeInUp_800ms_ease-out] rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
                <TreePine size={20} />
              </div>

              <div className="min-w-0">
                <div className="text-lg font-black text-slate-900">
                  Retrouve ta place dans la famille
                </div>

                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  Découvre ta branche dans l’arbre familial et comprends plus
                  facilement ton lien avec les autres cousins.
                </p>
              </div>
            </div>
          </article>

          <article className="animate-[fadeInUp_950ms_ease-out] rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
                <Users size={20} />
              </div>

              <div className="min-w-0">
                <div className="text-lg font-black text-slate-900">
                  Prépare la cousinade
                </div>

                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  Accède aux informations utiles, découvre les profils de la
                  famille et participe plus facilement à la journée.
                </p>
              </div>
            </div>
          </article>

          <article className="animate-[fadeInUp_1100ms_ease-out] rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
                <ShieldCheck size={20} />
              </div>

              <div className="min-w-0">
                <div className="text-lg font-black text-slate-900">
                  Un accès simple et personnel
                </div>

                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  Ton profil restera enregistré sur ce téléphone. Nous
                  t’enverrons aussi un lien personnel pour y revenir plus tard
                  si besoin.
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur">
            <button
              type="button"
              onClick={handleStart}
              className="w-full h-12 rounded-2xl bg-[color:var(--blue)] text-white font-black inline-flex items-center justify-center gap-2 transition active:scale-[0.995]"
            >
              <ArrowRight size={18} />
              Entrer dans l’espace famille
            </button>
          </div>
        </div>
      </footer>

      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}