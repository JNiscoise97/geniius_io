import { AlertTriangle, ArrowRight, CheckCircle2, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";

export function PreEventFormPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [familyBranch, setFamilyBranch] = useState("");
  const [hasAttendedBefore, setHasAttendedBefore] = useState<"" | "yes" | "no">(
    "",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function validate(): string | null {
    if (!firstName.trim()) return "Prénom requis.";
    if (!lastName.trim()) return "Nom requis.";
    if (!/^\d{1,2}$/.test(partySize.trim())) return "Nombre invalide.";
    const n = Number(partySize);
    if (!Number.isFinite(n) || n < 1 || n > 20) {
      return "Le nombre doit être compris entre 1 et 20.";
    }
    if (!hasAttendedBefore) return "Merci d’indiquer si tu es déjà venu(e).";
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
        party_size: Number(partySize),
        family_branch: familyBranch.trim() || null,
        has_attended_before: hasAttendedBefore === "yes",
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
              Fais connaissance avec Connect
            </div>
            <div className="text-xs font-bold text-slate-700">
              Quelques infos simples avant l’événement
            </div>
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

        <form onSubmit={onSubmit} className="mt-3">
          <section className="rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
            <div className="p-4">
              <div className="text-[16px] font-black text-slate-900">
                Identification
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                Merci de renseigner les informations ci-dessous.
              </div>

              <div className="mt-4 grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-extrabold text-slate-800">
                      Prénom*
                    </span>
                    <input
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      disabled={loading}
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs font-extrabold text-slate-800">
                      Nom*
                    </span>
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
                  <span className="text-xs font-extrabold text-slate-800">
                    Nombre de personnes
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={partySize}
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 2);
                      setPartySize(digits);
                    }}
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={2}
                    placeholder="Ex : 1"
                    disabled={loading}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    Branche familiale (si connue)
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={familyBranch}
                    onChange={(e) => setFamilyBranch(e.target.value)}
                    placeholder="Ex : branche de ..."
                    disabled={loading}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    Déjà venu(e) à une précédente édition ?
                  </span>
                  <select
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={hasAttendedBefore}
                    onChange={(e) =>
                      setHasAttendedBefore(e.target.value as "" | "yes" | "no")
                    }
                    disabled={loading}
                  >
                    <option value="">Choisir</option>
                    <option value="yes">Oui</option>
                    <option value="no">Non</option>
                  </select>
                </label>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 text-[color:var(--ok)]">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        Formulaire très simple
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        Cette première version sert surtout à te faire entrer
                        dans l’application et à mieux préparer la cousinade.
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
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                loading
                  ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              onClick={(e) => {
                e.preventDefault();
                void onSubmit(e as any);
              }}
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
