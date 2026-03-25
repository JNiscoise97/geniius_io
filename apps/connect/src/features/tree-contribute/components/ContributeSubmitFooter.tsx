// components/tree-contribute/ContributeSubmitFooter.tsx

import { ArrowRight, Loader2 } from "lucide-react";

type ContributeSubmitFooterProps = {
  submitLabel?: string;
  loadingLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  secondaryLabel?: string;
  onSubmit: () => void;
  onSecondaryAction?: () => void;
};

export function ContributeSubmitFooter({
  submitLabel = "Envoyer mes propositions",
  loadingLabel = "Envoi en cours…",
  disabled = false,
  loading = false,
  secondaryLabel = "Relire encore",
  onSubmit,
  onSecondaryAction,
}: ContributeSubmitFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="c-container">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="grid gap-2">
            {onSecondaryAction ? (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition active:scale-[0.99]"
              >
                {secondaryLabel}
              </button>
            ) : null}

            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled || loading}
              className={[
                "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-black transition",
                disabled || loading
                  ? "cursor-not-allowed bg-[color:var(--blue)] text-white opacity-70"
                  : "bg-[color:var(--blue)] text-white active:scale-[0.99]",
              ].join(" ")}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {loadingLabel}
                </>
              ) : (
                <>
                  {submitLabel}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}