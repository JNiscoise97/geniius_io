import { ArrowLeft, Eye, Send } from "lucide-react";

type PersonVisibilityRequestFormPanelProps = {
  hasLegitimateFamilyLink: boolean;
  personCannotRequestByThemself: boolean;
  hasConsent: boolean;
  justification: string;
  isSubmitting: boolean;
  onBack: () => void;
  onChangeHasLegitimateFamilyLink: (value: boolean) => void;
  onChangePersonCannotRequestByThemself: (value: boolean) => void;
  onChangeHasConsent: (value: boolean) => void;
  onChangeJustification: (value: string) => void;
  onSubmit: () => void;
};

export function PersonVisibilityRequestFormPanel({
  hasLegitimateFamilyLink,
  personCannotRequestByThemself,
  hasConsent,
  justification,
  isSubmitting,
  onBack,
  onChangeHasLegitimateFamilyLink,
  onChangePersonCannotRequestByThemself,
  onChangeHasConsent,
  onChangeJustification,
  onSubmit,
}: PersonVisibilityRequestFormPanelProps) {
  const canSubmit =
    !isSubmitting &&
    hasLegitimateFamilyLink &&
    personCannotRequestByThemself &&
    hasConsent &&
    justification.trim().length > 0;

  return (
    <div className="min-h-full">
      <section className="space-y-4 pb-28">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft size={14} />
            Retour
          </button>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <Eye size={16} />
            <div className="text-sm font-black">
              Demander l’affichage de cette fiche
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={hasLegitimateFamilyLink}
                onChange={(e) =>
                  onChangeHasLegitimateFamilyLink(e.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold">
                  Cette personne fait partie de ma famille proche
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={personCannotRequestByThemself}
                onChange={(e) =>
                  onChangePersonCannotRequestByThemself(e.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold">
                  Cette personne ne peut pas faire la demande elle-même
                </div>
                <div className="mt-1 text-xs leading-5">
                  Par exemple parce qu’elle n’a pas accès à l’application,
                  n’est pas en mesure de faire la démarche, ou t’a explicitement
                  demandé de la faire pour elle.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => onChangeHasConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold">
                  J’ai son consentement pour demander l’affichage de cette fiche
                </div>
              </div>
            </label>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Pourquoi demandes-tu l’affichage de cette fiche ?
            </label>
            <textarea
              value={justification}
              onChange={(e) => onChangeJustification(e.target.value)}
              placeholder="Explique le contexte de ta demande."
              className="min-h-[160px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                !canSubmit
                  ? "bg-[color:var(--blue)] text-white opacity-50"
                  : isSubmitting
                    ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                    : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
            >
              <Send size={18} />
              {isSubmitting ? "Envoi..." : "Envoyer ma demande"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}