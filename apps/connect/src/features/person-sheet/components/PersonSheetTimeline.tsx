import type { PersonSheetData } from "../config/personSheets";

type PersonSheetTimelineProps = {
  person: PersonSheetData;
};

export function PersonSheetTimeline({ person }: PersonSheetTimelineProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[16px] font-black text-slate-900">
        Chronologie
      </div>

      <div className="mt-4 space-y-4">
        {person.timeline.map((event) => (
          <div key={event.key} className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-600" />
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900">
                {event.label}
              </div>
              <div className="mt-1 text-xs font-bold text-slate-600">
                {[event.date, event.place].filter(Boolean).join(" · ")}
              </div>
              {event.description ? (
                <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
                  {event.description}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}