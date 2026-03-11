import type { ContactConsentOption } from "../config/contactFormConfig";

type ConsentFieldProps = {
  option: ContactConsentOption;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export function ConsentField({
  option,
  checked,
  disabled = false,
  onChange,
}: ConsentFieldProps) {
  return (
    <label
      className={[
        "flex items-start gap-3 rounded-2xl border p-3 transition",
        checked ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white",
        disabled ? "opacity-70" : "",
      ].join(" ")}
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />

      <div className="min-w-0">
        <div className="text-sm font-black text-slate-900">{option.label}</div>
        {option.helpText ? (
          <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
            {option.helpText}
          </div>
        ) : null}
      </div>
    </label>
  );
}