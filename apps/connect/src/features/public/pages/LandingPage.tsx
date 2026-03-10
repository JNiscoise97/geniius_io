import { ArrowRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PUBLIC_EVENT_SLUG } from "../../../config/publicEvent";

export function LandingPage() {
  const nav = useNavigate();
  const slug = PUBLIC_EVENT_SLUG;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-4 pb-24">
        <section className="rounded-[28px] bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-[0_18px_40px_rgba(79,70,229,0.28)] overflow-hidden">
          <div className="p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold border border-white/15">
              <Sparkles size={14} />
              Connect · Cousinade TANJAMA
            </div>

            <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight">
              Bienvenue
            </h1>

            <p className="mt-3 text-sm font-bold text-white/90 leading-6">
              Cette application va te permettre de participer à la cousinade,
              de te faire connaître avant le jour J et de retrouver les infos
              utiles au même endroit.
            </p>

            <div className="mt-4 grid gap-2 text-sm font-extrabold">
              <div className="flex items-center gap-2 text-white/95">
                <CalendarDays size={16} />
                Avant l’événement, puis le jour J
              </div>
              <div className="flex items-center gap-2 text-white/95">
                <MapPin size={16} />
                Mobile-first, simple et rapide
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 c-card p-4">
          <div className="text-[17px] font-black text-slate-900">
            Première étape
          </div>
          <p className="mt-2 text-sm font-bold text-slate-700 leading-6">
            Merci de renseigner quelques informations simples pour que nous
            puissions mieux préparer l’événement.
          </p>

          <div className="mt-4 grid gap-2">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-xs font-black text-slate-900">
                Ce qu’on va te demander
              </div>
              <ul className="mt-2 grid gap-1 text-xs font-extrabold text-slate-700">
                <li>Prénom et nom</li>
                <li>Nombre de personnes</li>
                <li>Branche familiale si tu la connais</li>
                <li>Si tu es déjà venu(e)</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              className="w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 bg-[color:var(--blue)] text-white"
              onClick={() => nav(`/e/${slug}/welcome/form`)}
            >
              <ArrowRight size={18} />
              Commencer
            </button>

            <div className="mt-2 px-1 text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
              <span>Étape 1 sur 2</span>
              <span className="text-slate-900">Prêt</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}