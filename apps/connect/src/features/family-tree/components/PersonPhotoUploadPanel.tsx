import { ArrowLeft, Camera, Upload } from "lucide-react";
import { useRef } from "react";

type PersonPhotoUploadPanelProps = {
  personDisplayName: string;
  isSubmitting: boolean;
  onBack: () => void;
  onSelectFile: (file: File) => void;
};

export function PersonPhotoUploadPanel({
  personDisplayName,
  isSubmitting,
  onBack,
  onSelectFile,
}: PersonPhotoUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              Ajouter une photo
            </div>
            <div className="mt-1 text-[22px] font-black tracking-tight text-slate-900">
              {personDisplayName}
            </div>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              Ta photo sera soumise à modération avant publication.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft size={14} />
            Retour
          </button>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900">
          <Camera size={16} />
          <div className="text-sm font-black">Choisir une photo</div>
        </div>

        <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
          Sélectionne une image nette si possible, avec quelques informations si nécessaire.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelectFile(file);
          }}
        />

        <div className="mt-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition disabled:opacity-50"
          >
            <Upload size={16} />
            {isSubmitting ? "Envoi en cours..." : "Choisir une photo"}
          </button>
        </div>
      </div>
    </section>
  );
}