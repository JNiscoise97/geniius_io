import { ArrowRight, Heart, UserCircle2 } from "lucide-react";

type Props = {
  centerId: string;
  rootHonoredPersonId: string;
  rootFirstName: string;
  sourcePersonId: string | null;
  onRecenterOnRoot: () => void;
  onRecenterOnSource: () => void;
};

export function FamilyTreeBrowseNavigationSection({
  centerId,
  rootHonoredPersonId,
  rootFirstName,
  sourcePersonId,
  onRecenterOnRoot,
  onRecenterOnSource,
}: Props) {
  const showRootButton = centerId !== rootHonoredPersonId;
  const showSourceButton = Boolean(sourcePersonId && centerId !== sourcePersonId);

  if (!showRootButton && !showSourceButton) {
    return null;
  }

  return (
    <section className="mb-4 mt-3 rounded-[24px] border border-slate-300 bg-slate-900 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <div className="px-2 pb-1 pt-1">
        <div className="text-[18px] font-black text-white">Navigation</div>
      </div>

      <div className="mt-3 grid gap-3">
        {showRootButton ? (
          <button
            type="button"
            onClick={onRecenterOnRoot}
            className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:shadow-none"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                <Heart size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-black text-slate-900">
                  Centrer sur Gromèr {rootFirstName}
                </div>
              </div>

              <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
                <ArrowRight size={18} />
              </div>
            </div>
          </button>
        ) : null}

        {showSourceButton ? (
          <button
            type="button"
            onClick={onRecenterOnSource}
            className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:shadow-none"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <UserCircle2 size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-black text-slate-900">
                  Centrer sur moi
                </div>
              </div>

              <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
                <ArrowRight size={18} />
              </div>
            </div>
          </button>
        ) : null}
      </div>
    </section>
  );
}