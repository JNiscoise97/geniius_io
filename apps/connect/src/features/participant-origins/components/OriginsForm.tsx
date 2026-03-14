import { ArrowRight } from "lucide-react";
import type { FormEvent } from "react";
import type { OriginsFormConfig } from "../config/originsFormConfig";
import { HeardAboutField } from "./HeardAboutField";
import { BranchesField } from "./BranchesField";
import { PreviousEditionsField } from "./PreviousEditionsField";

export type OriginsFormValues = {
  heardAboutInitiative: string;
  heardAboutInitiativeOther: string;
  branchKeys: string[];
  attendedEditionKeys: string[];
  cousinadeExpectation: string;
};

type OriginsFormProps = {
  config: OriginsFormConfig;
  value: OriginsFormValues;
  loading?: boolean;
  error?: string | null;
  onChange: (patch: Partial<OriginsFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

export function OriginsForm({
  config,
  value,
  loading = false,
  error = null,
  onChange,
  onSubmit,
}: OriginsFormProps) {
  return (
    <form id="origins-form" onSubmit={onSubmit} className="mt-3">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm space-y-5">
        <HeardAboutField
          label={config.fields.heardAbout.label}
          helpText={config.fields.heardAbout.helpText}
          options={config.fields.heardAbout.options}
          value={value.heardAboutInitiative}
          otherValue={value.heardAboutInitiativeOther}
          otherPlaceholder={config.fields.heardAbout.otherPlaceholder}
          disabled={loading}
          onChange={(next) =>
            onChange({
              heardAboutInitiative: next,
              heardAboutInitiativeOther:
                next === "other" ? value.heardAboutInitiativeOther : "",
            })
          }
          onChangeOther={(next) =>
            onChange({ heardAboutInitiativeOther: next })
          }
        />

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
          value={value.attendedEditionKeys}
          disabled={loading}
          onChange={(next) => onChange({ attendedEditionKeys: next })}
        />

        <div className="grid gap-1">
          <span className="text-xs font-extrabold text-slate-800">
            {config.fields.cousinadeExpectation.label}
          </span>

          <textarea
            value={value.cousinadeExpectation}
            onChange={(e) =>
              onChange({
                cousinadeExpectation: config.fields.cousinadeExpectation.maxLength
                  ? e.target.value.slice(
                      0,
                      config.fields.cousinadeExpectation.maxLength,
                    )
                  : e.target.value,
              })
            }
            placeholder={config.fields.cousinadeExpectation.placeholder}
            disabled={loading}
            className="min-h-[140px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 placeholder:text-slate-400 outline-none resize-y focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />

          {config.fields.cousinadeExpectation.helpText ? (
            <div className="text-xs font-bold leading-5 text-slate-600">
              {config.fields.cousinadeExpectation.helpText}
            </div>
          ) : null}

          {config.fields.cousinadeExpectation.maxLength ? (
            <div className="text-[11px] font-extrabold text-slate-400 text-right">
              {value.cousinadeExpectation.length}/
              {config.fields.cousinadeExpectation.maxLength}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="text-sm font-bold text-[color:var(--bad)]">
            {error}
          </div>
        ) : null}
      </section>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="submit"
              form="origins-form"
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
          </div>
        </div>
      </footer>
    </form>
  );
}