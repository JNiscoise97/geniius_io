import type { PersonSheetData } from "../config/personSheets";

type PersonSheetStoryProps = {
  person: PersonSheetData;
};

export function PersonSheetStory({ person }: PersonSheetStoryProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
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