import { ArrowRight, BookOpenText } from "lucide-react";
import { IntroQuoteCard } from "../components/IntroQuoteCard";
import { KnownToggleField } from "../components/KnownToggleField";
import { familyKnowledgeIntroConfig } from "../config/familyKnowledgeIntroConfig";
import type { FamilyKnowledgeIntroPrefs } from "../api/getFamilyKnowledgeIntroPrefs";

type FamilyKnowledgeIntroViewProps = {
  values: FamilyKnowledgeIntroPrefs;
  onChange: (values: FamilyKnowledgeIntroPrefs) => void;
  onContinue: () => void;
};

export function FamilyKnowledgeIntroView({
  values,
  onChange,
  onContinue,
}: FamilyKnowledgeIntroViewProps) {
  const config = familyKnowledgeIntroConfig;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-4 pb-28">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
            <BookOpenText size={14} />
            {config.pageTitle}
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            {config.pageTitle}
          </h1>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            {config.pageSubtitle}
          </p>

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
              onClick={onContinue}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--blue)] font-black text-white"
            >
              <ArrowRight size={18} />
              {config.footer.submitLabel}
            </button>

            <div className="mt-2 flex items-center justify-between px-1 text-[11px] font-extrabold text-slate-700">
              <span>{config.footer.stepLabel}</span>
              <span className="text-slate-900">{config.footer.readyLabel}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}