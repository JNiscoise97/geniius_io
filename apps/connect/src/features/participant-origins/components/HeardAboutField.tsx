import { Check } from "lucide-react";
import type { OriginsOption } from "../config/originsFormConfig";

type HeardAboutFieldProps = {
  label: string;
  helpText?: string;
  options: OriginsOption[];
  value: string;
  otherValue: string;
  otherPlaceholder: string;
  disabled?: boolean;
  onChange: (next: string) => void;
  onChangeOther: (next: string) => void;
};

export function HeardAboutField({
  label,
  helpText,
  options,
  value,
  otherValue,
  otherPlaceholder,
  disabled = false,
  onChange,
  onChangeOther,
}: HeardAboutFieldProps) {
  return (
    <div className="grid gap-3">
      <div>
        <div className="text-xs font-extrabold text-slate-800">{label}</div>
        {helpText ? (
          <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
            {helpText}
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        {options.map((option) => {
          const checked = value === option.key;

          return (
            <button
              key={option.key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.key)}
              className={[
                "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-black transition-all",
                disabled
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : checked
                    ? "border-[color:var(--blue)] bg-indigo-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  checked
                    ? "border-[color:var(--blue)] bg-[color:var(--blue)] text-white"
                    : "border-slate-300 bg-white text-transparent",
                ].join(" ")}
              >
                <Check size={12} />
              </span>

              <span className="min-w-0 flex-1">{option.label}</span>
            </button>
          );
        })}
      </div>

      {value === "other" ? (
        <input
          value={otherValue}
          onChange={(e) => onChangeOther(e.target.value)}
          placeholder={otherPlaceholder}
          disabled={disabled}
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
      ) : null}
    </div>
  );
}