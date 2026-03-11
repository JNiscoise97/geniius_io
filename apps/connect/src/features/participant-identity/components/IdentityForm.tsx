import { ArrowRight } from "lucide-react";
import { BranchesField } from "./BranchesField";
import { PreviousEditionsField } from "./PreviousEditionsField";
import type { IdentityFormConfig } from "../config/identityFormConfig";
import type { FormEvent } from "react";

export type IdentityFormValues = {
  firstName: string;
  lastName: string;
  nickname: string;
  birthYear: string;
  branchKeys: string[];
  previousEditionKeys: string[];
};

type IdentityFormProps = {
  config: IdentityFormConfig;
  value: IdentityFormValues;
  loading?: boolean;
  onChange: (patch: Partial<IdentityFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

export function IdentityForm({
  config,
  value,
  loading = false,
  onChange,
  onSubmit,
}: IdentityFormProps) {
  return (
    <form id="identity-form" onSubmit={onSubmit} className="mt-3">
      <section className="rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
        <div className="p-4">

          <div className="mt-4 grid gap-3">
            
              <label className="grid gap-1">
                <span className="text-xs font-extrabold text-slate-800">
                  {config.fields.firstName.label}
                  {config.fields.firstName.required ? "*" : ""}
                </span>
                <input
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  value={value.firstName}
                  onChange={(e) => onChange({ firstName: e.target.value })}
                  placeholder={config.fields.firstName.placeholder}
                  disabled={loading}
                />
              </label>
            

            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                  {config.fields.lastName.label}
                  {config.fields.lastName.required ? "*" : ""}
                </span>
                <input
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  value={value.lastName}
                  onChange={(e) => onChange({ lastName: e.target.value })}
                  placeholder={config.fields.lastName.placeholder}
                  disabled={loading}
                />
            </label>
            
            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {config.fields.nickname.label}
                {config.fields.nickname.required ? "*" : ""}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.nickname}
                onChange={(e) => onChange({ nickname: e.target.value })}
                placeholder={config.fields.nickname.placeholder}
                disabled={loading}
              />
              {config.fields.nickname.helpText ? (
                <div className="text-xs font-bold leading-5 text-slate-600">
                  {config.fields.nickname.helpText}
                </div>
              ) : null}
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {config.fields.birthYear.label}
                {config.fields.birthYear.required ? "*" : ""}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.birthYear}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                  onChange({ birthYear: digits });
                }}
                inputMode="numeric"
                pattern="\d*"
                maxLength={4}
                placeholder={config.fields.birthYear.placeholder}
                disabled={loading}
              />
              {config.fields.birthYear.helpText ? (
                <div className="text-xs font-bold leading-5 text-slate-600">
                  {config.fields.birthYear.helpText}
                </div>
              ) : null}
            </label>

            <BranchesField
              label={config.fields.branches.label}
              helpText={config.fields.branches.helpText}
              options={config.fields.branches.options}
              value={value.branchKeys}
              disabled={loading}
              onChange={(next) => onChange({ branchKeys: next })}
            />

            <PreviousEditionsField
              label={config.fields.previousEditions.label}
              helpText={config.fields.previousEditions.helpText}
              options={config.fields.previousEditions.options}
              value={value.previousEditionKeys}
              disabled={loading}
              onChange={(next) => onChange({ previousEditionKeys: next })}
            />
          </div>
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="submit"
              form="identity-form"
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                loading
                  ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              disabled={loading}
            >
              <ArrowRight size={18} />
              {loading ? "Enregistrement..." : "Continuer"}
            </button>

            <div className="mt-2 px-1 text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
              <span>Étape 1 sur 3</span>
              <span className="text-slate-900">{loading ? "…" : "Prêt"}</span>
            </div>
          </div>
        </div>
      </footer>
    </form>
  );
}