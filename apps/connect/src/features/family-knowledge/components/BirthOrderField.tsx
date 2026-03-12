type BirthOrderFieldProps = {
  label?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function BirthOrderField({
  label = "Rang dans la fratrie",
  value,
  placeholder = "Ex : 1",
  disabled = false,
  onChange,
}: BirthOrderFieldProps) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-extrabold text-slate-800">{label}</span>
      <input
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 2))}
        placeholder={placeholder}
        inputMode="numeric"
        pattern="\d*"
        maxLength={2}
        disabled={disabled}
      />
    </label>
  );
}