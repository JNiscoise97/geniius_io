import { ArrowLeft, User } from "lucide-react";
import type { PersonSheetData } from "../config/personSheets";
import { useNavigate, useParams } from "react-router-dom";

type PersonSheetHeroProps = {
  person: PersonSheetData;
};

export function PersonSheetHero({ person }: PersonSheetHeroProps) {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm p-5">
      
      {/* top bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
          <User size={14} />
          Fiche individu
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

      {/* name */}
      <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
        {person.displayName}
      </h1>

      {/* subtitle */}
      {person.subtitle && (
        <p className="mt-2 text-sm font-bold text-slate-600">
          {person.subtitle}
        </p>
      )}

      {/* summary */}
      {person.summary && (
        <p className="mt-4 text-sm font-bold leading-6 text-slate-700">
          {person.summary}
        </p>
      )}
    </section>
  );
}