import { ArrowRight } from "lucide-react";
import type { FormEvent } from "react";

type RecoveryBirthYearFormProps = {
  value: string;
  loading?: boolean;
  error?: string | null;
  label: string;
  placeholder: string;
  submitLabel: string;
  onChange: (nextValue: string) => void;
  onSubmit: (e: FormEvent) => void;
};

export function RecoveryBirthYearForm({
  value,
  loading = false,
  error = null,
  label,
  placeholder,
  submitLabel,
  onChange,
  onSubmit,
}: RecoveryBirthYearFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-3">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <label className="grid gap-1">
          <span className="text-xs font-extrabold text-slate-800">{label}</span>

          <input
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            value={value}
            onChange={(e) =>
              onChange(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder={placeholder}
            inputMode="numeric"
            pattern="\d*"
            maxLength={4}
            disabled={loading}
          />
        </label>

        {error ? (
          <div className="mt-3 text-sm font-bold text-[color:var(--bad)]">
            {error}
          </div>
        ) : null}
      </section>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="submit"
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                loading
                  ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              disabled={loading}
            >
              <ArrowRight size={18} />
              {loading ? "Vérification..." : submitLabel}
            </button>
          </div>
        </div>
      </footer>
    </form>
  );
}