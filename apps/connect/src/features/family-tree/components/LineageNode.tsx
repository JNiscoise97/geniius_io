import { ArrowRight, GitCommitHorizontal } from "lucide-react";
import type { TreeLineageNode as TreeLineageNodeType } from "../api/getLineage";

type LineageNodeProps = {
  node: TreeLineageNodeType;
  isLast?: boolean;
  onClick?: () => void;
};

export function LineageNode({
  node,
  isLast = false,
  onClick,
}: LineageNodeProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.995] active:shadow-none"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
            <GitCommitHorizontal size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[16px] font-black text-slate-900">
                  {node.name}
                </div>

                <div className="mt-1 flex flex-wrap gap-2">
                  <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
                    {node.generation}
                  </div>

                  {node.relationLabel ? (
                    <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
                      {node.relationLabel}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
                <ArrowRight size={18} />
              </div>
            </div>
          </div>
        </div>
      </button>

      {!isLast ? (
        <div className="flex justify-center py-2">
          <div className="h-6 w-[2px] rounded-full bg-slate-200" />
        </div>
      ) : null}
    </div>
  );
}