import { ArrowLeft, Info, Save } from "lucide-react";

type MemoryStatus = "pending" | "approved" | "rejected" | null;

type PersonMemoryEditorPanelProps = {
  personDisplayName: string;
  initialValue: string;
  moderationStatus: MemoryStatus;
  moderatorComment?: string | null;
  isSaving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onBack: () => void;
};

export function PersonMemoryEditorPanel({
  initialValue,
  moderationStatus,
  moderatorComment,
  isSaving,
  onChange,
  onSave,
  onBack,
}: PersonMemoryEditorPanelProps) {
  return (
    <section className="space-y-4">
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
      <div className="rounded-[20px] border border-indigo-200 bg-indigo-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
          <div className="min-w-0">
            <div className="text-sm text-indigo-900">
              Ton message sera soumis à modération avant d’apparaître dans les
              souvenirs visibles par la famille.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <textarea
          value={initialValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Écris ici ton souvenir, une anecdote, un trait de caractère, un moment marquant…"
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

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !initialValue.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? "Enregistrement..." : "Enregistrer mon souvenir"}
          </button>
        </div>
      </div>
    </section>
  );
}