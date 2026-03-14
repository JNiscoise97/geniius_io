import type { PersonSheetData } from "../config/personSheets";
import gromer from "../../../assets/images/gromer.jpg";

type PersonSheetPhotoProps = {
  person: PersonSheetData;
};

export function PersonSheetPhoto({ person }: PersonSheetPhotoProps) {
  if (!gromer) return null;

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[16px] font-black text-slate-900">
        Portrait
      </div>

      <div className="mt-4 aspect-square w-full overflow-hidden rounded-[20px] bg-slate-100">
        <img
          src={gromer}
          alt={person.displayName}
          className="h-full w-full object-contain"
        />
      </div>
    </section>
  );
}