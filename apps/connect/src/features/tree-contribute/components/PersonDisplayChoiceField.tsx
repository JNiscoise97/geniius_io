// components/tree-contribute/PersonDisplayChoiceField.tsx

import { Eye, EyeOff, HelpCircle } from "lucide-react";

export type PersonDisplayChoiceValue = "" | "yes" | "no" | "later";

type PersonDisplayChoiceFieldProps = {
  value: PersonDisplayChoiceValue;
  onChange: (value: PersonDisplayChoiceValue) => void;
  label?: string;
  helpText?: string;
  yesLabel?: string;
  noLabel?: string;
  laterLabel?: string;
  disabled?: boolean;
};

export function PersonDisplayChoiceField({
  value,
  onChange,
  label = "Souhaites-tu que cette personne soit visible dans l’arbre partagé ?",
  helpText = "Cette visibilité pourra rester limitée selon la situation et les validations nécessaires.",
  yesLabel = "Oui",
  noLabel = "Non",
  laterLabel = "Décider plus tard",
  disabled = false,
}: PersonDisplayChoiceFieldProps) {
  const options = [
    {
      value: "yes" as const,
      label: yesLabel,
      icon: Eye,
      activeClassName: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      value: "no" as const,
      label: noLabel,
      icon: EyeOff,
      activeClassName: "border-slate-300 bg-slate-100 text-slate-900",
    },
    {
      value: "later" as const,
      label: laterLabel,
      icon: HelpCircle,
      activeClassName: "border-amber-200 bg-amber-50 text-amber-900",
    },
  ];

  return (
    <div className="grid gap-2">
      <div>
        <div className="text-sm font-black text-slate-900">{label}</div>
        <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
          {helpText}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon;
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={[
                "rounded-[20px] border p-3 text-left transition",
                disabled
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 opacity-70"
                  : active
                    ? option.activeClassName
                    : "border-slate-200 bg-white text-slate-700",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "mt-0.5 rounded-xl p-2",
                    active ? "bg-white/80" : "bg-slate-100",
                  ].join(" ")}
                >
                  <Icon size={16} />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-black">{option.label}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}