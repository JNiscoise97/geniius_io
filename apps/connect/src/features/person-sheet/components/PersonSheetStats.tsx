import type { PersonSheetData } from "../config/personSheets";

type PersonSheetStatsProps = {
  person: PersonSheetData;
};

export function PersonSheetStats({ person }: PersonSheetStatsProps) {
  if (!person.stats) return null;

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[16px] font-black text-slate-900">
        Descendance identifiée
      </div>

      {person.stats.identifiedDescendants ? (
        <div className="mt-4 rounded-2xl bg-indigo-50 px-4 py-4">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-700">
            À ce jour
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {person.stats.identifiedDescendants} descendants
          </div>
        </div>
      ) : null}

      
    </section>
  );
}