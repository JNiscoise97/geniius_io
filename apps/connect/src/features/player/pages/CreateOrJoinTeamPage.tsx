// src/features/player/team/CreateOrJoinTeamPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";
import {
  Users,
  Plus,
  Trash2,
  Crown,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  LogIn,
  Sparkles,
} from "lucide-react";

type Color = "rouge" | "vert" | "blanc" | "bleu" | "jaune";

type MemberDraft = {
  first_name: string;
  last_name: string;
  color: Color;
  isCaptain: boolean;
  age: string; // string côté UI (input), converti en number|null pour DB
};

const COLORS: { value: Color; label: string }[] = [
  { value: "rouge", label: "Rouge" },
  { value: "vert", label: "Vert" },
  { value: "blanc", label: "Blanc" },
  { value: "bleu", label: "Bleu" },
  { value: "jaune", label: "Jaune" },
];

function uniqueColors(members: MemberDraft[]) {
  return new Set(members.map((m) => m.color)).size;
}

function randomToken(bytesLen = 16) {
  const bytes = new Uint8Array(bytesLen);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function toAgeOrNull(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (!/^\d{1,3}$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  // borne “safe” (à aligner avec ta contrainte DB si tu en as une)
  if (n < 0 || n > 120) return null;
  return n;
}

export function CreateOrJoinTeamPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const nav = useNavigate();

  const [tab, setTab] = useState<"create" | "join">("create");

  // create
  const [teamName, setTeamName] = useState("");
  const [accessCode, setAccessCode] = useState(""); // 4 digits

  const [members, setMembers] = useState<MemberDraft[]>([
    { first_name: "", last_name: "", color: "rouge", isCaptain: true, age: "" },
    { first_name: "", last_name: "", color: "vert", isCaptain: false, age: "" },
    { first_name: "", last_name: "", color: "bleu", isCaptain: false, age: "" },
  ]);

  // join
  const [joinTeamName, setJoinTeamName] = useState("");
  const [joinAccessCode, setJoinAccessCode] = useState(""); // 4 digits

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minMembers = 3;
  const maxMembers = 6;

  const colorsCount = useMemo(() => uniqueColors(members), [members]);

  const canAddMember = members.length < maxMembers;
  const canRemoveMember = members.length > 1;
  const hasCaptain = members.some((m) => m.isCaptain);

  const colorsOk = colorsCount >= 3;
  const sizeOk = members.length >= minMembers && members.length <= maxMembers;
  const accessOk = /^\d{4}$/.test(accessCode.trim());

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  function setMember(i: number, patch: Partial<MemberDraft>) {
    setMembers((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
    );
  }

  function addMember() {
    if (!canAddMember) return;
    setMembers((prev) => [
      ...prev,
      {
        first_name: "",
        last_name: "",
        color: "jaune",
        isCaptain: false,
        age: "",
      },
    ]);
  }

  function removeMember(i: number) {
    if (!canRemoveMember) return;
    setMembers((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      // garde-fou : toujours 1 capitaine
      if (!next.some((m) => m.isCaptain) && next.length > 0) {
        next[0] = { ...next[0], isCaptain: true };
      }
      return next;
    });
  }

  function setCaptain(i: number) {
    setMembers((prev) =>
      prev.map((m, idx) => ({ ...m, isCaptain: idx === i })),
    );
  }

  function validateCreate(): string | null {
    if (!teamName.trim()) return "Nom d’équipe requis.";
    if (!/^\d{4}$/.test(accessCode.trim()))
      return "Code d’accès requis : 4 chiffres exactement.";
    if (members.length < minMembers)
      return "Minimum 3 participants par équipe.";
    if (members.length > maxMembers)
      return "Maximum 6 participants par équipe.";
    if (colorsCount < 3)
      return "Au moins 3 couleurs différentes sont requises.";
    if (!hasCaptain) return "Choisis un capitaine.";

    for (const [idx, m] of members.entries()) {
      if (!m.first_name.trim() || !m.last_name.trim())
        return `Membre #${idx + 1} incomplet.`;

      // âge optionnel, mais si rempli il doit être valide
      if (m.age.trim() && toAgeOrNull(m.age) === null) {
        return `Âge invalide pour le membre #${idx + 1} (0–120).`;
      }
    }
    return null;
  }

  async function onCreate() {
    setError(null);
    const msg = validateCreate();
    if (msg) return setError(msg);

    setLoading(true);
    try {
      // 1) event
      const ev = await supabase
        .from("events")
        .select("id, slug")
        .eq("slug", slug)
        .single();
      if (ev.error) throw new Error(ev.error.message);
      const eventId = ev.data.id as string;

      // 2) team
      const teamRes = await supabase
        .from("teams")
        .insert({
          event_id: eventId,
          team_name: teamName.trim(),
          access_code: accessCode.trim(),
        })
        .select("id, team_name")
        .single();
      if (teamRes.error) throw new Error(teamRes.error.message);
      const teamId = teamRes.data.id as string;

      // 3) members (is_captain + age)
      const membersPayload = members.map((m) => ({
        team_id: teamId,
        first_name: m.first_name.trim(),
        last_name: m.last_name.trim(),
        color: m.color,
        is_captain: m.isCaptain,
        age: toAgeOrNull(m.age), // number | null
      }));

      const memRes = await supabase.from("team_members").insert(membersPayload);
      if (memRes.error) throw new Error(memRes.error.message);

      // 4) session token
      const session_token = randomToken(16);
      const sessRes = await supabase
        .from("team_sessions")
        .insert({ team_id: teamId, session_token })
        .select("id")
        .single();
      if (sessRes.error) throw new Error(sessRes.error.message);

      // 5) local context
      localStorage.setItem(
        `connect:${slug}:session`,
        JSON.stringify({
          eventSlug: slug,
          eventId,
          teamId,
          teamName: teamName.trim(),
          session_token,
        }),
      );

      // 6) nav
      nav(`/e/${slug}/team/selfie`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function onJoin() {
    setError(null);
    if (!joinTeamName.trim()) return setError("Nom d’équipe requis.");
    if (!/^\d{4}$/.test(joinAccessCode.trim()))
      return setError("Code d’accès requis : 4 chiffres exactement.");

    setLoading(true);
    try {
      const ev = await supabase
        .from("events")
        .select("id, slug")
        .eq("slug", slug)
        .single();
      if (ev.error) throw new Error(ev.error.message);
      const eventId = ev.data.id as string;

      const teamFind = await supabase
        .from("teams")
        .select("id, team_name")
        .eq("event_id", eventId)
        .eq("team_name", joinTeamName.trim())
        .eq("access_code", joinAccessCode.trim())
        .single();

      if (teamFind.error)
        throw new Error("Équipe introuvable (nom/code incorrect).");
      const teamId = teamFind.data.id as string;
      const teamNameResolved = teamFind.data.team_name as string;

      const session_token = randomToken(16);
      const sessRes = await supabase
        .from("team_sessions")
        .insert({ team_id: teamId, session_token })
        .select("id")
        .single();
      if (sessRes.error) throw new Error(sessRes.error.message);

      localStorage.setItem(
        `connect:${slug}:session`,
        JSON.stringify({
          eventSlug: slug,
          eventId,
          teamId,
          teamName: teamNameResolved,
          session_token,
        }),
      );

      nav(`/e/${slug}/team-dashboard`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        {/* Page title */}
        <div className="flex items-center gap-3 px-1">
          <div className="h-11 w-11 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
            <Users size={18} className="text-slate-800" />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-black tracking-tight text-slate-900">
              Créer / Rejoindre équipe
            </div>
            <div className="text-xs font-bold text-slate-700">
              3–6 membres • min 3 couleurs • 1 capitaine
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3">
          <div className="rounded-2xl bg-slate-100 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                className={[
                  "h-10 rounded-xl font-extrabold text-sm transition",
                  tab === "create"
                    ? "bg-white shadow-sm text-slate-900"
                    : "bg-transparent text-slate-700",
                ].join(" ")}
                onClick={() => {
                  setError(null);
                  setTab("create");
                }}
                disabled={loading}
              >
                Créer
              </button>

              <button
                className={[
                  "h-10 rounded-xl font-extrabold text-sm transition",
                  tab === "join"
                    ? "bg-white shadow-sm text-slate-900"
                    : "bg-transparent text-slate-700",
                ].join(" ")}
                onClick={() => {
                  setError(null);
                  setTab("join");
                }}
                disabled={loading}
              >
                Rejoindre
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
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

        {tab === "create" ? (
          <>
            {/* TEAM META */}
            <section className="mt-3 rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
              <div className="p-4">
                <div className="mt-4 grid gap-3">
                  <label className="grid gap-1">
                    <span className="text-xs font-extrabold text-slate-800">
                      Nom d’équipe
                    </span>
                    <input
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Ex: Les Flamboyants"
                      disabled={loading}
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs font-extrabold text-slate-800">
                      Code d’accès (4 chiffres)
                    </span>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                        <KeyRound size={16} />
                      </span>

                      <input
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                        value={accessCode}
                        onChange={(e) => {
                          const onlyDigits = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4);
                          setAccessCode(onlyDigits);
                        }}
                        placeholder="Ex: 1234"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={4}
                        autoComplete="one-time-code"
                        disabled={loading}
                      />
                    </div>

                    <div className="mt-1 text-[11px] font-bold text-slate-600">
                      Ce code à 4 chiffres te servira si tu souhaites te
                      reconnecter à ton équipe.
                    </div>
                  </label>

                  {/* Règles explicites */}
                  <div className="mt-1 grid gap-2">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                      <div className="text-xs font-black text-slate-900">
                        Règles d’équipe
                      </div>

                      <ul className="mt-2 grid gap-1.5 text-xs font-extrabold">
                        <li className="flex items-start justify-between gap-3">
                          <span className="text-slate-800">
                            Taille : 3–6 membres
                          </span>
                          <span
                            className={
                              sizeOk
                                ? "text-[color:var(--ok)]"
                                : "text-[color:var(--bad)]"
                            }
                          >
                            {members.length}/{maxMembers}
                          </span>
                        </li>
                        <li className="flex items-start justify-between gap-3">
                          <span className="text-slate-800">
                            Couleurs : min 3 uniques
                          </span>
                          <span
                            className={
                              colorsOk
                                ? "text-[color:var(--ok)]"
                                : "text-[color:var(--bad)]"
                            }
                          >
                            {colorsCount}/5
                          </span>
                        </li>
                        <li className="flex items-start justify-between gap-3">
                          <span className="text-slate-800">
                            Capitaine : 1 obligatoire
                          </span>
                          <span
                            className={
                              hasCaptain
                                ? "text-[color:var(--ok)]"
                                : "text-[color:var(--bad)]"
                            }
                          >
                            {hasCaptain ? "OK" : "À choisir"}
                          </span>
                        </li>
                        <li className="flex items-start justify-between gap-3">
                          <span className="text-slate-800">
                            Code d’accès : 4 chiffres
                          </span>
                          <span
                            className={
                              accessOk
                                ? "text-[color:var(--ok)]"
                                : "text-[color:var(--bad)]"
                            }
                          >
                            {accessOk ? "OK" : "Requis"}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* MEMBERS */}
            <section className="mt-3 rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[16px] font-black text-slate-900">
                    Membres
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    Un capitaine obligatoire (choisir sur une carte).
                  </div>
                </div>

                <button
                  className={[
                    "h-10 px-3 rounded-xl font-extrabold text-sm inline-flex items-center gap-2 transition border",
                    canAddMember
                      ? "bg-indigo-50 text-slate-900 border-indigo-100"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed",
                  ].join(" ")}
                  onClick={addMember}
                  disabled={!canAddMember || loading}
                  title={!canAddMember ? "Maximum 6 membres" : undefined}
                >
                  <Plus
                    size={16}
                    className={canAddMember ? "text-[color:var(--blue)]" : ""}
                  />
                  Ajouter
                </button>
              </div>

              <div className="px-4 pb-4 grid gap-3">
                {members.map((m, i) => {
                  const isCaptain = m.isCaptain;

                  return (
                    <div
                      key={i}
                      className="rounded-3xl p-3 bg-slate-50 border border-slate-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-extrabold text-slate-800">
                          Membre #{i + 1}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            className={[
                              "h-9 px-3 rounded-xl font-extrabold text-xs inline-flex items-center gap-2 transition border",
                              isCaptain
                                ? "bg-amber-100/70 border-amber-200 text-slate-900"
                                : "bg-white border-slate-200 text-slate-800",
                            ].join(" ")}
                            onClick={() => setCaptain(i)}
                            type="button"
                            title="Définir comme capitaine"
                            disabled={loading}
                          >
                            <Crown
                              size={16}
                              className={
                                isCaptain ? "text-amber-700" : "text-slate-700"
                              }
                            />
                            {isCaptain ? "Capitaine" : "Définir capitaine"}
                          </button>

                          <button
                            className={[
                              "h-9 w-9 rounded-xl inline-flex items-center justify-center transition border",
                              canRemoveMember
                                ? "bg-white border-slate-200 text-slate-700"
                                : "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed",
                            ].join(" ")}
                            onClick={() => removeMember(i)}
                            disabled={!canRemoveMember || loading}
                            type="button"
                            title={
                              !canRemoveMember ? "Minimum 1 membre" : "Retirer"
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="h-12 rounded-2xl border border-slate-200 bg-white px-3 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                            value={m.first_name}
                            onChange={(e) =>
                              setMember(i, { first_name: e.target.value })
                            }
                            placeholder="Prénom"
                            disabled={loading}
                          />
                          <input
                            className="h-12 rounded-2xl border border-slate-200 bg-white px-3 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                            value={m.last_name}
                            onChange={(e) =>
                              setMember(i, { last_name: e.target.value })
                            }
                            placeholder="Nom"
                            disabled={loading}
                          />
                        </div>

                        {/* ⬇️ NEW: Age + Color */}
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="h-12 rounded-2xl border border-slate-200 bg-white px-3 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                            value={m.age}
                            onChange={(e) => {
                              const digits = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 3);
                              setMember(i, { age: digits });
                            }}
                            placeholder="Âge (optionnel)"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={3}
                            disabled={loading}
                          />

                          <select
                            className="h-12 rounded-2xl border border-slate-200 bg-white px-3 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                            value={m.color}
                            onChange={(e) =>
                              setMember(i, { color: e.target.value as Color })
                            }
                            disabled={loading}
                          >
                            {COLORS.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* petit hint si âge rempli mais invalide (0–120) */}
                        {m.age.trim() && toAgeOrNull(m.age) === null ? (
                          <div className="text-[11px] font-extrabold text-[color:var(--bad)]">
                            Âge invalide (0–120).
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {!colorsOk ? (
                  <div className="text-xs font-extrabold text-[color:var(--bad)]">
                    Ajoute/ajuste des couleurs : min 3 couleurs uniques.
                  </div>
                ) : null}

                {members.length < minMembers ? (
                  <div className="text-xs font-extrabold text-[color:var(--bad)]">
                    Minimum {minMembers} membres requis.
                  </div>
                ) : null}

                {!hasCaptain ? (
                  <div className="text-xs font-extrabold text-[color:var(--bad)]">
                    Choisis un capitaine.
                  </div>
                ) : null}
              </div>
            </section>
          </>
        ) : (
          // JOIN
          <section className="mt-3 rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
            <div className="p-4">
              <div className="text-[16px] font-black text-slate-900">
                Rejoindre une équipe
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                Saisis le nom et le code de l’équipe.
              </div>

              <div className="mt-4 grid gap-2">
                <label className="grid gap-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    Nom d’équipe
                  </span>
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={joinTeamName}
                    onChange={(e) => setJoinTeamName(e.target.value)}
                    placeholder="Ex: Les Flamboyants"
                    disabled={loading}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    Code d’accès (4 chiffres)
                  </span>
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={joinAccessCode}
                    onChange={(e) => {
                      const onlyDigits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4);
                      setJoinAccessCode(onlyDigits);
                    }}
                    placeholder="Ex: 1234"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={4}
                    disabled={loading}
                  />
                  <div className="mt-1 text-[11px] font-bold text-slate-600">
                    Ce code à 4 chiffres te servira si tu souhaites te
                    reconnecter à ton équipe.
                  </div>
                </label>

                <div className="mt-2 rounded-2xl bg-indigo-50 border border-indigo-100 p-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 text-[color:var(--blue)]">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        1 équipe = 1 téléphone
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        Tu rejoins l’équipe, puis tu joues sur le téléphone du
                        capitaine.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Bottom CTA */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            {tab === "create" ? (
              <button
                className={[
                  "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                  loading
                    ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                    : "bg-[color:var(--blue)] text-white",
                ].join(" ")}
                onClick={onCreate}
                disabled={loading}
              >
                <ArrowRight size={18} />
                {loading ? "Création..." : "Créer l’équipe"}
              </button>
            ) : (
              <button
                className={[
                  "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                  loading
                    ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                    : "bg-[color:var(--blue)] text-white",
                ].join(" ")}
                onClick={onJoin}
                disabled={loading}
              >
                <LogIn size={18} />
                {loading ? "Connexion..." : "Rejoindre"}
              </button>
            )}

            <div className="mt-2 px-1 flex items-center justify-between text-[11px] font-extrabold text-slate-700">
              <span>
                {tab === "create" ? (
                  <>
                    Équipe :{" "}
                    <span
                      className={
                        sizeOk ? "text-slate-900" : "text-[color:var(--bad)]"
                      }
                    >
                      {members.length}/6
                    </span>{" "}
                    •{" "}
                    <span
                      className={
                        colorsOk ? "text-slate-900" : "text-[color:var(--bad)]"
                      }
                    >
                      {colorsCount} couleurs
                    </span>{" "}
                    •{" "}
                    <span
                      className={
                        hasCaptain
                          ? "text-slate-900"
                          : "text-[color:var(--bad)]"
                      }
                    >
                      {hasCaptain ? "capitaine OK" : "capitaine ?"}
                    </span>
                  </>
                ) : (
                  <>Demande le nom + code au capitaine</>
                )}
              </span>
              <span className="text-slate-900">{loading ? "…" : "Prêt"}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
