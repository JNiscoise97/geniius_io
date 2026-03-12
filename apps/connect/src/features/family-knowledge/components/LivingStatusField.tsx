type LivingStatusFieldProps = {
  value: "" | "yes" | "no";
  onChange: (value: "" | "yes" | "no") => void;
  label?: string;
  chooseLabel?: string;
  yesLabel?: string;
  noLabel?: string;
  disabled?: boolean;
};

export function LivingStatusField({
  value,
  onChange,
  label = "Toujours en vie ?",
  chooseLabel = "Choisir",
  yesLabel = "Oui",
  noLabel = "Non",
  disabled = false,
}: LivingStatusFieldProps) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-extrabold text-slate-800">{label}</span>
      <select
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
        value={value}
        onChange={(e) => onChange(e.target.value as "" | "yes" | "no")}
        disabled={disabled}
      >
        <option value="">{chooseLabel}</option>
        <option value="yes">{yesLabel}</option>
        <option value="no">{noLabel}</option>
      </select>
    </label>
  );
}