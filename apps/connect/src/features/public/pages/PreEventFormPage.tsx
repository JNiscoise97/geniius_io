import { AlertTriangle, ArrowRight, CheckCircle2, Users } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";

type PresentFormConfig = {
  title: string;
  subtitle: string;
  branches: string[];
  previousEditions: string[];
};

const PRESENT_FORM_CONFIG: PresentFormConfig = {
  title: "Fais connaissance avec la famille",
  subtitle:
    "Présente-toi en quelques secondes pour que tout le monde sache qui tu es et d’où tu viens dans la famille.",
  branches: [
    "Branche TANJAMA",
    "Branche MAMMOSA",
    "Branche ITALIE",
    "Branche CHARBONNÉ",
  ],
  previousEditions: ["2022", "2023", "2024"],
};

export function PreEventFormPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const config = PRESENT_FORM_CONFIG;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedPreviousEditions, setSelectedPreviousEditions] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBranches = useMemo(() => config.branches.length > 0, [config.branches]);
  const hasPreviousEditions = useMemo(
    () => config.previousEditions.length > 0,
    [config.previousEditions],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function toggleArrayValue(
    value: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function validate(): string | null {
    if (!firstName.trim()) return "Prénom requis.";
    if (!lastName.trim()) return "Nom requis.";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      const insertRes = await supabase.from("pre_event_participants").insert({
        event_slug: slug,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nickname: nickname.trim() || null,
        family_branches: hasBranches ? selectedBranches : [],
        attended_editions: hasPreviousEditions ? selectedPreviousEditions : [],
      });

      if (insertRes.error) {
        throw new Error(insertRes.error.message);
      }

      nav(`/e/${slug}/welcome/confirmation`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        <div className="flex items-center gap-3 px-1">
          <div className="h-11 w-11 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
            <Users size={18} className="text-slate-800" />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-black tracking-tight text-slate-900">
              {config.title}
            </div>
            <div className="text-xs font-bold text-slate-700">{config.subtitle}</div>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-2xl bg-white shadow-sm border border-[rgba(220,38,38,0.22)] p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-[color:var(--bad)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="font-black text-slate-900">Erreur</div>
                <div className="text-sm font-bold text-slate-700">{error}</div>
              </div>
            </div>
          </div>
        ) : null}

        <form id="present-form" onSubmit={onSubmit} className="mt-3">
          <section className="rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
            <div className="p-4">
              <div className="text-[16px] font-black text-slate-900">Présentation</div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                Renseigne les informations suivantes pour te présenter à la famille.
              </div>

              <div className="mt-4 grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-extrabold text-slate-800">Prénom*</span>
                    <input
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      disabled={loading}
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs font-extrabold text-slate-800">Nom*</span>
                    <input
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      disabled={loading}
                    />
                  </label>
                </div>

                <label className="grid gap-1">
                  <span className="text-xs font-extrabold text-slate-800">Surnom</span>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Surnom"
                    disabled={loading}
                  />
                </label>

                {hasBranches ? (
                  <div className="grid gap-2">
                    <div className="text-xs font-extrabold text-slate-800">
                      Branche si connue
                    </div>

                    <div className="grid gap-2">
                      {config.branches.map((branch) => {
                        const checked = selectedBranches.includes(branch);

                        return (
                          <label
                            key={branch}
                            className={[
                              "flex items-start gap-3 rounded-2xl border p-3 transition",
                              checked
                                ? "border-indigo-200 bg-indigo-50"
                                : "border-slate-200 bg-white",
                            ].join(" ")}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              checked={checked}
                              onChange={() =>
                                toggleArrayValue(
                                  branch,
                                  selectedBranches,
                                  setSelectedBranches,
                                )
                              }
                              disabled={loading}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-black text-slate-900">
                                {branch}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {hasPreviousEditions ? (
                  <div className="grid gap-2">
                    <div className="text-xs font-extrabold text-slate-800">
                      Déjà venu ? Coche les précédentes éditions
                    </div>

                    <div className="grid gap-2">
                      {config.previousEditions.map((edition) => {
                        const checked = selectedPreviousEditions.includes(edition);

                        return (
                          <label
                            key={edition}
                            className={[
                              "flex items-start gap-3 rounded-2xl border p-3 transition",
                              checked
                                ? "border-indigo-200 bg-indigo-50"
                                : "border-slate-200 bg-white",
                            ].join(" ")}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              checked={checked}
                              onChange={() =>
                                toggleArrayValue(
                                  edition,
                                  selectedPreviousEditions,
                                  setSelectedPreviousEditions,
                                )
                              }
                              disabled={loading}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-black text-slate-900">
                                Édition {edition}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 text-[color:var(--ok)]">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        Présentation rapide
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        Cette première étape permet simplement de te présenter à la
                        famille dans l’application.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </form>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="submit"
              form="present-form"
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                loading
                  ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              disabled={loading}
            >
              <ArrowRight size={18} />
              {loading ? "Envoi..." : "Valider"}
            </button>

            <div className="mt-2 px-1 text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
              <span>Étape 2 sur 2</span>
              <span className="text-slate-900">{loading ? "…" : "Prêt"}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}