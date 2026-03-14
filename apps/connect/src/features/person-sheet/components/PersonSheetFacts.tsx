import type { PersonSheetData } from "../config/personSheets";

type PersonSheetFactsProps = {
  person: PersonSheetData;
};

export function PersonSheetFacts({ person }: PersonSheetFactsProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[16px] font-black text-slate-900">
        Repères
      </div>

      <div className="mt-4 grid gap-3">
        {person.keyFacts.map((fact) => (
          <div key={fact.label} className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              {fact.label}
            </div>
            <div className="mt-1 text-sm font-black text-slate-900">
              {fact.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}