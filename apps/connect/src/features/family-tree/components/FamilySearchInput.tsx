import { Search, X } from "lucide-react";

export function FamilySearchInput({
  value,
  placeholder,
  onChange,
  onClear,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
        <Search size={18} className="shrink-0 text-slate-500" />

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />

        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700"
            aria-label="Effacer la recherche"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}