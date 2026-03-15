import { AlertTriangle } from "lucide-react";
import type { PersonSheetData } from "../config/personSheets";

type PersonSheetStoryProps = {
  person: PersonSheetData;
};

export function PersonSheetStory({ person }: PersonSheetStoryProps) {
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
                  <li>Parler des établissements de CHATEAUVIEUX et de Grande Ravine</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      <div className="text-[16px] font-black text-slate-900">
        Son histoire
      </div>

      <div className="mt-4 space-y-4">
        {person.story.map((paragraph, index) => (
          <p
            key={index}
            className="text-sm font-bold leading-6 text-slate-700"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}