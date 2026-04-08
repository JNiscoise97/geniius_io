import { ArrowLeft, ArrowRight, BookOpenText } from "lucide-react";
import { IntroQuoteCard } from "../../../shared/components/IntroQuoteCard";
import { KnownToggleField } from "../../../shared/components/KnownToggleField";
import { familyTreeIntroConfig } from "../config/familyTreeIntroConfig";
import { useNavigate, useParams } from "react-router-dom";
import type { FamilyTreeIntroPrefs } from "../data/preferences/getFamilyTreeIntroPrefs";

type FamilyTreeIntroViewProps = {
  values: FamilyTreeIntroPrefs;
  onChange: (values: FamilyTreeIntroPrefs) => void;
  onContinue: () => void | Promise<void>;
  loading?: boolean;
};

export function FamilyTreeIntroView({
  values,
  onChange,
  onContinue,
  loading = false,
}: FamilyTreeIntroViewProps) {
  const config = familyTreeIntroConfig;
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-4 pb-28">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
              <BookOpenText size={14} />
              Philosophie de la démarche
            </div>

            <button
              type="button"
              onClick={() => nav(`/e/${slug}/home`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Retour
              </span>
            </button>
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            {config.pageTitle}
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-700">
            {config.pageSubtitle}
          </p>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm mt-3">
          <div className="mt-5">
            <IntroQuoteCard quote={config.quote} text={config.text} />
          </div>

          <div className="mt-4">
            <KnownToggleField
              checked={values.hideNextTime}
              onChange={(checked) =>
                onChange({
                  ...values,
                  hideNextTime: checked,
                })
              }
              label={config.hideNextTimeLabel}
              helpText={config.hideNextTimeHelp}
            />
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="c-container">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur">
            <button
              type="button"
              onClick={() => void onContinue()}
              disabled={loading}
              className={[
                "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-black text-white",
                loading
                  ? "bg-[color:var(--blue)] opacity-70 cursor-wait"
                  : "bg-[color:var(--blue)]",
              ].join(" ")}
            >
              <ArrowRight size={18} />
              {config.footer.submitLabel}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}