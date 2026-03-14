import type { PersonSheetData, PersonSheetRelative } from "../config/personSheets";

type PersonSheetFamilyProps = {
  person: PersonSheetData;
};

function RelativeList({
  title,
  items,
}: {
  title: string;
  items: PersonSheetRelative[];
}) {
  return (
    <div>
      <div className="text-sm font-black text-slate-900">{title}</div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.key} className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-sm font-black text-slate-900">{item.name}</div>
            {item.years ? (
              <div className="mt-1 text-xs font-bold text-slate-600">
                {item.years}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PersonSheetFamily({ person }: PersonSheetFamilyProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[16px] font-black text-slate-900">
        Généalogie proche
      </div>

      <div className="mt-4 space-y-5">
        <RelativeList title="Parents" items={person.parents} />
        <RelativeList title="Conjoint / compagnon" items={person.spouses} />
        <RelativeList title="Enfants" items={person.children} />
      </div>
    </section>
  );
}