import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";

type Color = "rouge" | "vert" | "blanc" | "bleu" | "jaune";

type MemberDraft = {
  first_name: string;
  last_name: string;
  color: Color;
};

const COLORS: Color[] = ["rouge", "vert", "blanc", "bleu", "jaune"];

function uniqueColors(members: MemberDraft[]) {
  return new Set(members.map((m) => m.color)).size;
}

function randomToken(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function CreateTeamPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const nav = useNavigate();

  const [teamName, setTeamName] = useState("");
  const [accessCode, setAccessCode] = useState(""); // DOB ou PIN
  const [members, setMembers] = useState<MemberDraft[]>([
    { first_name: "", last_name: "", color: "rouge" },
    { first_name: "", last_name: "", color: "vert" },
    { first_name: "", last_name: "", color: "bleu" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorsCount = useMemo(() => uniqueColors(members), [members]);

  function setMember(i: number, patch: Partial<MemberDraft>) {
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  function addMember() {
    if (members.length >= 6) return;
    setMembers((prev) => [...prev, { first_name: "", last_name: "", color: "jaune" }]);
  }

  function removeMember(i: number) {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, idx) => idx !== i));
  }

  function validate(): string | null {
    if (!teamName.trim()) return "Nom d’équipe requis.";
    if (!accessCode.trim()) return "Code d’accès requis (DOB ou PIN).";
    if (members.length > 6) return "Maximum 6 participants par équipe.";
    if (colorsCount < 3) return "Au moins 3 couleurs différentes sont requises.";
    for (const [idx, m] of members.entries()) {
      if (!m.first_name.trim() || !m.last_name.trim()) return `Membre #${idx + 1} incomplet.`;
    }
    return null;
  }

  async function handleSubmit() {
    setError(null);
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      // 1) récupérer event_id en DB via slug
      const ev = await supabase.from("events").select("id, slug").eq("slug", slug).single();
      if (ev.error) throw new Error(ev.error.message);
      const eventId = ev.data.id as string;

      const { data: authData } = await supabase.auth.getUser();
console.log("SUPABASE USER:", authData.user);

      // 2) insert team
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

      // 3) insert members
      const membersPayload = members.map((m) => ({
        team_id: teamId,
        first_name: m.first_name.trim(),
        last_name: m.last_name.trim(),
        color: m.color,
      }));

      const memRes = await supabase.from("team_members").insert(membersPayload);
      if (memRes.error) throw new Error(memRes.error.message);

      // 4) create session token
      const session_token = randomToken(16);
      const sessRes = await supabase
        .from("team_sessions")
        .insert({ team_id: teamId, session_token })
        .select("id")
        .single();
      if (sessRes.error) throw new Error(sessRes.error.message);

      // 5) store local context
      localStorage.setItem(
        `connect:${slug}:session`,
        JSON.stringify({ eventSlug: slug, eventId, teamId, teamName: teamName.trim(), session_token })
      );

      nav(`/e/${slug}/standby`, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="h1">Créer une équipe</h1>
      <p className="muted">≤ 6 personnes, au moins 3 couleurs différentes.</p>

      <div className="stack">
        <input
          className="btn"
          style={{ textAlign: "left" }}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Nom d’équipe"
        />

        <input
          className="btn"
          style={{ textAlign: "left" }}
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="Code d’accès (DOB ou PIN)"
        />

        <div className="muted">Couleurs uniques : {colorsCount}/5 (min 3)</div>

        {members.map((m, i) => (
          <div key={i} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12 }}>
            <div className="muted" style={{ marginBottom: 8 }}>
              Membre #{i + 1}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <input
                className="btn"
                style={{ textAlign: "left" }}
                value={m.first_name}
                onChange={(e) => setMember(i, { first_name: e.target.value })}
                placeholder="Prénom"
              />
              <input
                className="btn"
                style={{ textAlign: "left" }}
                value={m.last_name}
                onChange={(e) => setMember(i, { last_name: e.target.value })}
                placeholder="Nom"
              />

              <select
                className="btn"
                value={m.color}
                onChange={(e) => setMember(i, { color: e.target.value as Color })}
              >
                {COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button className="btn" type="button" onClick={() => removeMember(i)} disabled={members.length <= 1}>
                Retirer ce membre
              </button>
            </div>
          </div>
        ))}

        <button className="btn" type="button" onClick={addMember} disabled={members.length >= 6}>
          Ajouter un membre
        </button>

        <button className="btn btn--primary" type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Création..." : "Créer l’équipe"}
        </button>

        {error && (
          <div style={{ border: "1px solid rgba(255,0,0,0.35)", padding: 12, borderRadius: 12 }}>
            <strong>Erreur :</strong> <span className="muted">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
