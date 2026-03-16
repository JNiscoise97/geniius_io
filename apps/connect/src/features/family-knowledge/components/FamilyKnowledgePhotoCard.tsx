import { ImagePlus, Loader2, MailCheck, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FamilyPhotoTarget } from "../types/familyKnowledgePhotoTargets";

type UploadStatus = "idle" | "uploading" | "sent" | "error";

type FamilyPhotoCardProps = {
  target: FamilyPhotoTarget;
  status: UploadStatus;
  errorMessage?: string | null;
  onPickFile: (file: File) => void | Promise<void>;
};

export function FamilyKnowledgePhotoCard({
  target,
  status,
  errorMessage,
  onPickFile,
}: FamilyPhotoCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isBusy = status === "uploading";

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);

    try {
      await onPickFile(file);
    } finally {
      event.currentTarget.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {target.label}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            {target.displayName}
          </h3>
          {target.years ? (
            <p className="mt-1 text-sm text-slate-500">{target.years}</p>
          ) : null}
          <p className="mt-1 text-xs text-slate-400">
            {target.personType} · {target.sourceTable}
          </p>
        </div>

        <div className="shrink-0">
          {status === "sent" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <MailCheck className="h-4 w-4" />
              Envoyée
            </span>
          ) : status === "error" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
              <TriangleAlert className="h-4 w-4" />
              Erreur
            </span>
          ) : status === "uploading" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              À faire
            </span>
          )}
        </div>
      </div>

      {previewUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <img
            src={previewUrl}
            alt={`Photo de ${target.displayName}`}
            className="h-44 w-full object-cover"
          />
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isBusy}
          onChange={handleFileChange}
        />

        <button
          type="button"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {status === "sent" ? "Remplacer la photo" : "Ajouter une photo"}
        </button>
      </div>
    </div>
  );
}