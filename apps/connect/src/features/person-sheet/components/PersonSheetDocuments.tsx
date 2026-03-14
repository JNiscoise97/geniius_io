import { Download, FileText, Image as ImageIcon } from "lucide-react";
import type { PersonSheetData } from "../config/personSheets";

type PersonSheetDocumentsProps = {
  person: PersonSheetData;
};

export function PersonSheetDocuments({ person }: PersonSheetDocumentsProps) {
  if (person.media.length === 0) return null;

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[16px] font-black text-slate-900">
        Médias et documents
      </div>

      <div className="mt-4 space-y-3">
        {person.media.map((media) => (
          <a
            key={media.key}
            href={media.src}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                {media.type === "image" ? (
                  <ImageIcon size={18} />
                ) : (
                  <FileText size={18} />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900">
                  {media.title}
                </div>
                {media.description ? (
                  <div className="mt-1 text-xs font-bold text-slate-600">
                    {media.description}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-100 p-2 text-slate-900">
              <Download size={16} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}