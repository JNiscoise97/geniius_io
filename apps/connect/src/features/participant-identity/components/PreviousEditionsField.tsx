import type { IdentityOption } from "../config/identityFormConfig";

type PreviousEditionsFieldProps = {
  label: string;
  helpText?: string;
  options: IdentityOption[];
  value: string[];
  disabled?: boolean;
  onChange: (next: string[]) => void;
};

export function PreviousEditionsField({
  label,
  helpText,
  options,
  value,
  disabled = false,
  onChange,
}: PreviousEditionsFieldProps) {
  if (!options.length) return null;

  function toggle(optionKey: string) {
    if (value.includes(optionKey)) {
      onChange(value.filter((v) => v !== optionKey));
      return;
    }
    onChange([...value, optionKey]);
  }

  return (
    <div className="grid gap-2">
      <div className="text-xs font-extrabold text-slate-800">{label}</div>

      {helpText ? (
        <div className="text-xs font-bold leading-5 text-slate-600">
          {helpText}
        </div>
      ) : null}

      <div className="grid gap-2">
        {options.map((option) => {
          const checked = value.includes(option.key);

          return (
            <label
              key={option.key}
              className={[
                "flex items-start gap-3 rounded-2xl border p-3 transition",
                checked
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-200 bg-white",
                disabled ? "opacity-70" : "",
              ].join(" ")}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={checked}
                onChange={() => toggle(option.key)}
                disabled={disabled}
              />

              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900">
                  {option.label}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}