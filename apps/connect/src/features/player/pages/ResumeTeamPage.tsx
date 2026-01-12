import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function ResumeTeamPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const nav = useNavigate();

  const [teamName, setTeamName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResume() {
    setError(null);
    if (!teamName.trim()) return setError("Nom d’équipe requis.");
    if (!accessCode.trim()) return setError("Code d’accès requis.");

    setLoading(true);
    try {
      // 1) event id
      const ev = await supabase.from("events").select("id, slug").eq("slug", slug).single();
      if (ev.error) throw new Error(ev.error.message);
      const eventId = ev.data.id as string;

      // 2) find team by name + hash
      const teamRes = await supabase
        .from("teams")
        .select("id, team_name")
        .eq("event_id", eventId)
        .eq("team_name", teamName.trim())
        .eq("access_code", accessCode.trim())
        .single();

      if (teamRes.error) {
        throw new Error("Équipe introuvable ou code incorrect.");
      }

      const teamId = teamRes.data.id as string;

      // 3) create new session token
      const session_token = randomToken(16);
      const sessRes = await supabase
        .from("team_sessions")
        .insert({ team_id: teamId, session_token })
        .select("id")
        .single();

      if (sessRes.error) throw new Error(sessRes.error.message);

      // 4) store local context
      localStorage.setItem(
        `connect:${slug}:session`,
        JSON.stringify({ eventSlug: slug, eventId, teamId, teamName: teamRes.data.team_name, session_token })
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
      <h1 className="h1">Reprendre une équipe</h1>
      <p className="muted">Entre le nom d’équipe et le code d’accès.</p>

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

        <button className="btn btn--primary" type="button" onClick={handleResume} disabled={loading}>
          {loading ? "Connexion..." : "Reprendre"}
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
