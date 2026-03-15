import { ArrowDown, ArrowUp, Lock } from "lucide-react";

export type SiblingOrderItem = {
  key: string;
  label: string;
  meta: string;
  readOnly?: boolean;
};

type SiblingOrderFieldProps = {
  label?: string;
  helpText?: string;
  items: SiblingOrderItem[];
  disabled?: boolean;
  onChange: (items: SiblingOrderItem[]) => void;
};

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to) return items;
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }

  const copy = [...items];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

export function SiblingOrderField({
  label = "Ordre dans la fratrie",
  helpText = "Place les personnes dans l’ordre de naissance à l’aide des boutons.",
  items,
  disabled = false,
  onChange,
}: SiblingOrderFieldProps) {
  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        <span className="text-xs font-extrabold text-slate-800">{label}</span>
        <p className="text-xs font-bold leading-5 text-slate-600">{helpText}</p>
      </div>

      <div className="grid gap-2">
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;

          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3"
            >
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                  Rang {index + 1}
                </div>

                <div className="truncate text-sm font-extrabold text-slate-900">
                  {item.label}
                </div>

                <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  {item.readOnly ? <Lock size={12} /> : null}
                  <span>{item.meta}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={disabled || isFirst}
                  onClick={() => onChange(moveItem(items, index, index - 1))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Monter ${item.label}`}
                >
                  <ArrowUp size={16} />
                </button>

                <button
                  type="button"
                  disabled={disabled || isLast}
                  onClick={() => onChange(moveItem(items, index, index + 1))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Descendre ${item.label}`}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}