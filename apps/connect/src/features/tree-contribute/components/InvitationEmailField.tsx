// components/tree-contribute/InvitationEmailField.tsx

import { Mail } from "lucide-react";

type InvitationEmailFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helpText?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function InvitationEmailField({
  value,
  onChange,
  label = "Adresse email",
  helpText = "Cette personne recevra une invitation pour gérer elle-même sa fiche.",
  placeholder = "prenom.nom@email.com",
  disabled = false,
}: InvitationEmailFieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 rounded-xl bg-indigo-50 p-2 text-indigo-700">
          <Mail size={16} />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-black text-slate-900">{label}</div>
          <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
            {helpText}
          </div>
        </div>
      </div>

      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        disabled={disabled}
        className={[
          "h-12 rounded-2xl border bg-white px-4 font-extrabold text-slate-900 outline-none",
          "focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100",
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-200",
        ].join(" ")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}