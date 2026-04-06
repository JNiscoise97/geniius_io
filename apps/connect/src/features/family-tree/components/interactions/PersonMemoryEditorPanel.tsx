import { ArrowLeft, Info, Save } from "lucide-react";

type MemoryStatus = "pending" | "approved" | "rejected" | null;

type PersonMemoryEditorPanelProps = {
  personDisplayName: string;
  isOwnProfile: boolean;
  initialValue: string;
  mode: "create" | "edit";
  moderationStatus: MemoryStatus;
  moderatorComment?: string | null;
  counts?: {
    pending: number;
    approved: number;
    rejected: number;
  };
  publishSuccessMessage?: string | null;
  isSaving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onBack: () => void;
};

export function PersonMemoryEditorPanel({
  personDisplayName,
  isOwnProfile,
  initialValue,
  mode,
  moderationStatus,
  moderatorComment,
  counts,
  publishSuccessMessage,
  isSaving,
  onChange,
  onSave,
  onBack,
}: PersonMemoryEditorPanelProps) {
  const sectionLabel = isOwnProfile
    ? "Mes souvenirs"
    : "Mes souvenirs pour cette personne";

  const moderationText =
    "Ton message sera soumis à modération avant d’apparaître dans les souvenirs visibles par la famille.";

  const placeholder =
    "Écris ici ton souvenir, une anecdote, un trait de caractère, un moment marquant…";

  const submitLabel = isSaving
    ? "Publication..."
    : mode === "edit"
      ? "Mettre à jour le souvenir"
      : "Publier un nouveau souvenir";

  const canSubmit = !isSaving && !!initialValue.trim();

  return (
    <div className="min-h-full">
      <section className="space-y-4 pb-28">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft size={14} />
            Retour
          </button>
        </div>

        {publishSuccessMessage ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="text-sm font-semibold text-emerald-900">
              {publishSuccessMessage}
            </div>
          </div>
        ) : null}

        {counts ? (
          <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
              {sectionLabel}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                En attente : {counts.pending}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">
                Acceptés : {counts.approved}
              </span>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-900">
                Refusés : {counts.rejected}
              </span>
            </div>
          </div>
        ) : null}

        <div className="rounded-[20px] border border-indigo-200 bg-indigo-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
            <div className="min-w-0">
              <div className="text-sm text-indigo-900">{moderationText}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm font-black text-slate-900">
            {mode === "edit"
              ? isOwnProfile
                ? "Modifier mon souvenir"
                : `Modifier un souvenir sur ${personDisplayName}`
              : isOwnProfile
                ? "Ajouter un souvenir"
                : `Ajouter un souvenir sur ${personDisplayName}`}
          </div>

          <textarea
            value={initialValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />

          {moderationStatus ? (
            <div className="mt-3 rounded-[20px] border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Statut
              </div>
              <div className="mt-1 text-sm font-black text-slate-900">
                {moderationStatus === "pending"
                  ? "En attente de modération"
                  : moderationStatus === "approved"
                    ? "Validé"
                    : "Refusé"}
              </div>

              {moderatorComment ? (
                <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
                  {moderatorComment}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="button"
              onClick={onSave}
              disabled={!canSubmit}
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                !canSubmit
                  ? "bg-[color:var(--blue)] text-white opacity-50"
                  : isSaving
                    ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                    : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
            >
              <Save size={18} />
              {submitLabel}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}