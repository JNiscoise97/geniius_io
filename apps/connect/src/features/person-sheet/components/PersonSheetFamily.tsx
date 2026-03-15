import { AlertTriangle } from "lucide-react";
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
          <div
            key={item.key}
            className="rounded-2xl bg-slate-50 px-4 py-3 flex items-start gap-3"
          >
            {/* photo de l'enfant */}
            {item.photo ? (
              <img
                src={item.photo}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : null}

            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900">
                {item.name}

                {item.childrenCount !== undefined && (
                  <span className="ml-1 text-xs font-bold text-slate-500">
                    ({item.childrenCount})
                  </span>
                )}
              </div>

              {item.years ? (
                <div className="mt-1 text-xs font-bold text-slate-600">
                  {item.years}
                </div>
              ) : null}

              {/* conjoints */}
              {item.spouses && item.spouses.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  {item.spouses.map((spouse, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200"
                    >
                      {spouse.photo ? (
                        <img
                          src={spouse.photo}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : null}

                      <span className="font-semibold">{spouse.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PersonSheetFamily({ person }: PersonSheetFamilyProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-700" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-amber-900">
                Chantiers en cours
              </div>
              <div className="mt-0.5 text-xs text-amber-800">
                <ol>
                  <li>Ajouter photo des enfants</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
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