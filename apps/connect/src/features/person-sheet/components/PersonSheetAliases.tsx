import type { PersonSheetData } from "../config/personSheets";

type PersonSheetAliasesProps = {
  person: PersonSheetData;
};

export function PersonSheetAliases({ person }: PersonSheetAliasesProps) {
  if (person.aliases.length === 0) return null;

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[16px] font-black text-slate-900">
        Autres noms
      </div>

      <div className="mt-4 space-y-3">
        {person.aliases.map((alias) => (
          <div key={alias.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              {alias.label}
            </div>
            <div className="mt-2 text-sm font-black text-slate-900">
              {alias.givenNames} {alias.surname}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}