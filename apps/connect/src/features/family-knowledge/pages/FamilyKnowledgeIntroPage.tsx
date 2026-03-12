import { ArrowRight, BookOpenText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IntroQuoteCard } from "../components/IntroQuoteCard";
import { KnownToggleField } from "../components/KnownToggleField";
import { familyKnowledgeIntroConfig } from "../config/familyKnowledgeIntroConfig";
import {
  getFamilyKnowledgeIntroPrefs,
  type FamilyKnowledgeIntroPrefs,
} from "../api/getFamilyKnowledgeIntroPrefs";
import { saveFamilyKnowledgeIntroPrefs } from "../api/saveFamilyKnowledgeIntroPrefs";

export function FamilyKnowledgeIntroPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<FamilyKnowledgeIntroPrefs>({
    hideNextTime: false,
  });

  const config = familyKnowledgeIntroConfig;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setValues(getFamilyKnowledgeIntroPrefs(slug));
  }, [slug]);

  function onContinue() {
    saveFamilyKnowledgeIntroPrefs({
      slug,
      values,
    });

    localStorage.setItem(`connect:${slug}:family-knowledge:intro`, "done");
    nav(`/e/${slug}/family-knowledge/close-family`);
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-4 pb-28">
        <section className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-5">
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
                setValues((prev) => ({
                  ...prev,
                  hideNextTime: checked,
                }))
              }
              label={config.hideNextTimeLabel}
              helpText={config.hideNextTimeHelp}
            />
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="button"
              onClick={onContinue}
              className="w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 bg-[color:var(--blue)] text-white"
            >
              <ArrowRight size={18} />
              {config.footer.submitLabel}
            </button>

            <div className="mt-2 px-1 text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
              <span>{config.footer.stepLabel}</span>
              <span className="text-slate-900">{config.footer.readyLabel}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}