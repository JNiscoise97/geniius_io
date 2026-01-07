import React from "react";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";

export type EntityListMode = "idle" | "create" | "edit";

export function EntityListCard<T>({
  title,
  items,
  disabled,
  mode,
  onNew,
  renderItem,
  emptyTitle = "Rien pour l’instant",
  emptyHint,
  countLabel,
}: {
  title: string;
  items: T[];
  disabled: boolean;
  mode: EntityListMode;
  onNew: () => void;
  renderItem: (item: T) => React.ReactNode;
  emptyTitle?: string;
  emptyHint?: React.ReactNode;
  countLabel?: (count: number) => string;
}) {
  const count = items?.length ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-600">
            {countLabel
              ? countLabel(count)
              : count === 0
                ? "Aucun élément."
                : `${count} élément(s).`}
          </div>

          {mode !== "idle" ? (
            <div className="mt-1 text-[11px] text-slate-600">
              {mode === "edit"
                ? "Mode édition : modification en cours."
                : "Mode création : nouvel élément."}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onNew}
          disabled={disabled || mode !== "idle"}
          className={[
            "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium shadow-sm",
            "border-slate-200 bg-white hover:bg-slate-50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
          title={
            mode !== "idle"
              ? "Termine ou annule le formulaire en cours"
              : `Ajouter : ${title}`
          }
        >
          <Plus className="h-4 w-4" />
          Nouvelle
        </button>
      </div>

      <Separator />

      {/* Content */}
      <div className="p-4">
        {count === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">{emptyTitle}</div>
            {emptyHint ? (
              <div className="mt-1 text-xs text-slate-600">{emptyHint}</div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">{items.map(renderItem)}</div>
        )}
      </div>
    </div>
  );
}
