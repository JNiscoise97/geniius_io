type PhotoPresenceFieldProps = {
  value: "" | "yes" | "no";
  onChange: (value: "" | "yes" | "no") => void;
  label?: string;
  chooseLabel?: string;
  yesLabel?: string;
  noLabel?: string;
  disabled?: boolean;
};

export function PhotoPresenceField({
  value,
  onChange,
  label = "As-tu une photo ?",
  yesLabel = "Oui",
  noLabel = "Non",
  disabled = false,
}: PhotoPresenceFieldProps) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-extrabold text-slate-800">{label}</span>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("yes")}
          className={[
            "h-12 rounded-2xl border font-extrabold transition",
            disabled && "opacity-50 cursor-not-allowed",
            value === "yes"
              ? "border-indigo-200 bg-indigo-50 text-slate-900"
              : "border-slate-200 bg-white text-slate-700",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {yesLabel}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("no")}
          className={[
            "h-12 rounded-2xl border font-extrabold transition",
            disabled && "opacity-50 cursor-not-allowed",
            value === "no"
              ? "border-indigo-200 bg-indigo-50 text-slate-900"
              : "border-slate-200 bg-white text-slate-700",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {noLabel}
        </button>
      </div>
    </div>
  );
}