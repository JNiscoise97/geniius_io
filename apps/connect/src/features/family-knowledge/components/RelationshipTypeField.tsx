export type RelationshipTypeValue =
  | ""
  | "both_parents"
  | "father_only"
  | "mother_only"
  | "cousin"
  | "aunt"
  | "uncle"
  | "other";

type RelationshipOption = {
  value: RelationshipTypeValue;
  label: string;
};

type RelationshipTypeFieldProps = {
  value: RelationshipTypeValue;
  onChange: (value: RelationshipTypeValue) => void;
  label?: string;
  options?: RelationshipOption[];
  chooseLabel?: string;
  disabled?: boolean;
};

const defaultOptions: RelationshipOption[] = [
  { value: "both_parents", label: "Enfant des deux parents" },
  { value: "father_only", label: "Enfant du père seulement" },
  { value: "mother_only", label: "Enfant de la mère seulement" },
  { value: "cousin", label: "Cousin / cousine" },
  { value: "aunt", label: "Tante" },
  { value: "uncle", label: "Oncle" },
  { value: "other", label: "Autre" },
];

export function RelationshipTypeField({
  value,
  onChange,
  label = "Lien",
  options = defaultOptions,
  chooseLabel = "Choisir",
  disabled = false,
}: RelationshipTypeFieldProps) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-extrabold text-slate-800">{label}</span>
      <select
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
        value={value}
        onChange={(e) => onChange(e.target.value as RelationshipTypeValue)}
        disabled={disabled}
      >
        <option value="">{chooseLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}