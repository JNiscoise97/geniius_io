// components/tree-contribute/ContributeIntroCard.tsx

import { ArrowRight, Info, TreePine } from "lucide-react";

type ContributeIntroCardProps = {
  title?: string;
  text?: string;
  ctaLabel?: string;
  onClick?: () => void;
};

export function ContributeIntroCard({
  title = "Aider à compléter l’arbre familial",
  text = "Compare les informations de ta famille proche avec l’arbre existant, puis aide-nous à confirmer, compléter ou créer les fiches manquantes.",
  ctaLabel = "Commencer",
  onClick,
}: ContributeIntroCardProps) {
  return (
    <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#312e81_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
      <div className="p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide">
          <TreePine size={14} />
          Contribution généalogique
        </div>

        <h1 className="mt-4 text-[28px] leading-[1.02] font-black tracking-tight">
          {title}
        </h1>

        <p className="mt-3 max-w-[44rem] text-sm font-bold leading-6 text-white/88">
          {text}
        </p>

        <div className="mt-4 flex flex-wrap items-start gap-3">
          <div className="inline-flex max-w-[34rem] items-start gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-xs font-bold leading-5 text-white/85">
            <Info size={15} className="mt-0.5 shrink-0" />
            <span>
              Les informations que tu proposes seront relues avant intégration.
              Certaines données concernant des personnes vivantes pourront
              rester masquées ou partiellement affichées.
            </span>
          </div>
        </div>

        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition active:scale-[0.99]"
          >
            {ctaLabel}
            <ArrowRight size={16} />
          </button>
        ) : null}
      </div>
    </section>
  );
}