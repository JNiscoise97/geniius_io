import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { FormEvent } from "react";
import type {
  AttendanceFormConfig,
  AttendanceOption,
  HelpOption,
} from "../config/attendanceFormConfig";

export type AttendanceFormValues = {
  attendanceStatus: "" | "yes" | "no" | "maybe" | "definitive-no";
  partySize: string;
  canHelp: boolean;
  helpTypes: Array<HelpOption["key"]>;
  note: string;
};

type AttendanceFormProps = {
  config: AttendanceFormConfig;
  value: AttendanceFormValues;
  loading?: boolean;
  onChange: (patch: Partial<AttendanceFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
};

export function AttendanceForm({
  config,
  value,
  loading = false,
  onChange,
  onSubmit,
}: AttendanceFormProps) {
  const showAttendanceDetails =
    value.attendanceStatus !== "" &&
    value.attendanceStatus !== "no" &&
    value.attendanceStatus !== "definitive-no";

  const showHelpTypes = showAttendanceDetails && value.canHelp;

  function toggleHelpType(helpKey: HelpOption["key"]) {
    if (value.helpTypes.includes(helpKey)) {
      onChange({
        helpTypes: value.helpTypes.filter((k) => k !== helpKey),
      });
      return;
    }

    onChange({
      helpTypes: [...value.helpTypes, helpKey],
    });
  }

  return (
    <form id="attendance-form" onSubmit={onSubmit} className="mt-3">
      <section className="rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
        <div className="p-4">
          <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-[color:var(--ok)]">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">
                  {config.introTitle}
                </div>
                <div className="text-xs font-bold leading-5 text-slate-700">
                  {config.introText}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <div className="text-xs font-extrabold text-slate-800">
                {config.fields.attendanceStatus.label}
              </div>

              {config.fields.attendanceStatus.helpText ? (
                <div className="text-xs font-bold leading-5 text-slate-600">
                  {config.fields.attendanceStatus.helpText}
                </div>
              ) : null}

              <div className="grid gap-2">
                {config.attendanceOptions.map((option: AttendanceOption) => {
                  const checked = value.attendanceStatus === option.key;
                  const shouldResetDetails =
                    option.key === "no" || option.key === "definitive-no";

                  return (
                    <label
                      key={option.key}
                      className={[
                        "flex items-start gap-3 rounded-2xl border p-3 transition",
                        checked
                          ? "border-indigo-200 bg-indigo-50"
                          : "border-slate-200 bg-white",
                        loading ? "opacity-70" : "",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="attendance-status"
                        className="mt-1 h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={checked}
                        onChange={() => {
                          onChange({
                            attendanceStatus: option.key,
                            ...(shouldResetDetails
                              ? {
                                partySize: "",
                                canHelp: false,
                                helpTypes: [],
                              }
                              : {}),
                          });
                        }}
                        disabled={loading}
                      />

                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900">
                          {option.label}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {showAttendanceDetails ? (
              <label className="grid gap-1">
                <span className="text-xs font-extrabold text-slate-800">
                  {config.fields.partySize.label}
                </span>

                <input
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  value={value.partySize}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 2);
                    onChange({ partySize: digits });
                  }}
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={2}
                  placeholder={config.fields.partySize.placeholder}
                  disabled={loading}
                />

                {config.fields.partySize.helpText ? (
                  <div className="text-xs font-bold leading-5 text-slate-600">
                    {config.fields.partySize.helpText}
                  </div>
                ) : null}
              </label>
            ) : null}

            {showAttendanceDetails ? (
              <div className="grid gap-2">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={value.canHelp}
                    onChange={(e) =>
                      onChange({
                        canHelp: e.target.checked,
                        ...(e.target.checked ? {} : { helpTypes: [] }),
                      })
                    }
                    disabled={loading}
                  />

                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900">
                      {config.fields.canHelp.label}
                    </div>
                    {config.fields.canHelp.helpText ? (
                      <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                        {config.fields.canHelp.helpText}
                      </div>
                    ) : null}
                  </div>
                </label>
              </div>
            ) : null}

            {showHelpTypes ? (
              <div className="grid gap-2">
                <div className="text-xs font-extrabold text-slate-800">
                  {config.fields.helpTypes.label}
                </div>

                {config.fields.helpTypes.helpText ? (
                  <div className="text-xs font-bold leading-5 text-slate-600">
                    {config.fields.helpTypes.helpText}
                  </div>
                ) : null}

                <div className="grid gap-2">
                  {config.helpOptions.map((option) => {
                    const checked = value.helpTypes.includes(option.key);

                    return (
                      <label
                        key={option.key}
                        className={[
                          "flex items-start gap-3 rounded-2xl border p-3 transition",
                          checked
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-slate-200 bg-white",
                          loading ? "opacity-70" : "",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={checked}
                          onChange={() => toggleHelpType(option.key)}
                          disabled={loading}
                        />

                        <div className="min-w-0">
                          <div className="text-sm font-black text-slate-900">
                            {option.label}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                {config.fields.note.label}
              </span>

              <textarea
                className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 placeholder:text-slate-400 outline-none resize-y focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.note}
                onChange={(e) =>
                  onChange({
                    note: config.fields.note.maxLength
                      ? e.target.value.slice(0, config.fields.note.maxLength)
                      : e.target.value,
                  })
                }
                placeholder={config.fields.note.placeholder}
                disabled={loading}
              />

              {config.fields.note.helpText ? (
                <div className="text-xs font-bold leading-5 text-slate-600">
                  {config.fields.note.helpText}
                </div>
              ) : null}

              {config.fields.note.maxLength ? (
                <div className="text-[11px] font-extrabold text-slate-400 text-right">
                  {value.note.length}/{config.fields.note.maxLength}
                </div>
              ) : null}
            </label>
          </div>
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="submit"
              form="attendance-form"
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                loading
                  ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              disabled={loading}
            >
              <ArrowRight size={18} />
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </footer>
    </form>
  );
}