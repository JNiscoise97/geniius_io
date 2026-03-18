type KnownToggleFieldProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  helpText?: string;
};

export function KnownToggleField({
  checked,
  onChange,
  label = "Personne connue",
  helpText = "Décoche si tu ne connais pas encore cette personne.",
}: KnownToggleFieldProps) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <div className="text-sm font-black text-slate-900">{label}</div>
        <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
          {helpText}
        </div>
      </div>
    </label>
  );
}