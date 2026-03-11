import { ChevronRight } from "lucide-react";

export type BreadcrumbNavItem = {
  label: string;
  to?: string;
};

type BreadcrumbNavProps = {
  items: BreadcrumbNavItem[];
  onNavigate?: (to: string) => void;
};

export function BreadcrumbNav({ items, onNavigate }: BreadcrumbNavProps) {
  return (
    <nav
      aria-label="Fil de navigation"
      className="overflow-x-auto rounded-[20px] border border-slate-200 bg-white px-3 py-2 shadow-sm"
    >
      <div className="flex min-w-max items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = !!item.to && !isLast;

          return (
            <div key={`${item.label}-${index}`} className="flex items-center gap-1">
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => item.to && onNavigate?.(item.to)}
                  className="rounded-xl px-2 py-1 text-xs font-extrabold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </button>
              ) : (
                <div
                  className={[
                    "rounded-xl px-2 py-1 text-xs font-extrabold",
                    isLast ? "bg-slate-100 text-slate-900" : "text-slate-500",
                  ].join(" ")}
                >
                  {item.label}
                </div>
              )}

              {!isLast ? (
                <div className="text-slate-400">
                  <ChevronRight size={14} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}