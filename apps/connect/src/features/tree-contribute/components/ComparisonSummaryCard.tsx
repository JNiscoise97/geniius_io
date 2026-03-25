// components/tree-contribute/ComparisonSummaryCard.tsx

import {
  AlertTriangle,
  CheckCircle2,
  Search,
  Sparkles,
} from "lucide-react";

type ComparisonSummaryCardProps = {
  matched: boolean;
  sameCount: number;
  missingInTreeCount: number;
  differentCount: number;
  missingInFamilyKnowledgeCount?: number;
  matchedPersonLabel?: string;
};

export function ComparisonSummaryCard({
  matched,
  sameCount,
  missingInTreeCount,
  differentCount,
  missingInFamilyKnowledgeCount = 0,
  matchedPersonLabel,
}: ComparisonSummaryCardProps) {
  const title = matched
    ? "Fiche trouvée dans l’arbre"
    : "Aucune fiche trouvée dans l’arbre";

  const text = matched
    ? matchedPersonLabel
      ? `Nous avons trouvé une fiche correspondante : ${matchedPersonLabel}.`
      : "Nous avons trouvé une fiche correspondante dans l’arbre."
    : "Les informations que tu as partagées peuvent servir à créer une nouvelle fiche.";

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 rounded-2xl p-3",
            matched
              ? "bg-emerald-50 text-emerald-700"
              : "bg-indigo-50 text-indigo-700",
          ].join(" ")}
        >
          {matched ? <Search size={20} /> : <Sparkles size={20} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-black text-slate-900">
            {title}
          </div>
          <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
            {text}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <SummaryPill
              icon={CheckCircle2}
              label={`${sameCount} identique${sameCount > 1 ? "s" : ""}`}
              tone="emerald"
            />

            <SummaryPill
              icon={Sparkles}
              label={`${missingInTreeCount} à compléter`}
              tone="indigo"
            />

            <SummaryPill
              icon={AlertTriangle}
              label={`${differentCount} différence${differentCount > 1 ? "s" : ""}`}
              tone="amber"
            />

            {missingInFamilyKnowledgeCount > 0 ? (
              <SummaryPill
                icon={Search}
                label={`${missingInFamilyKnowledgeCount} absent${missingInFamilyKnowledgeCount > 1 ? "s" : ""} de tes infos`}
                tone="slate"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  tone: "emerald" | "indigo" | "amber" | "slate";
}) {
  const className = {
    emerald: "bg-emerald-50 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone];

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
        className,
      ].join(" ")}
    >
      <Icon size={13} />
      {label}
    </span>
  );
}