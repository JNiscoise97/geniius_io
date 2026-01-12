// src/features/admin/pages/AdminEventDashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";
import { getLocalEvent } from "../../../lib/content/contentLoader";

type EventRow = {
  id: string;
  slug: string;
  title: string;
};

type EventStateRow = {
  event_id: string;
  status: "standby" | "running" | "ended";
  started_at: string | null;
  ended_at: string | null;
  updated_at?: string | null;
};

type TeamRow = {
  id: string;
  team_name: string;
  status: string;
  selfie_path: string | null;
  created_at: string;
};

type ToastKind = "info" | "success" | "error";
type Toast = { kind: ToastKind; message: string } | null;

function pillStyle(bg: string) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: bg,
    border: "1px solid rgba(255,255,255,0.10)",
    fontSize: 12,
  } as const;
}

function statusPill(status: string) {
  if (status === "running") return pillStyle("rgba(16,185,129,0.18)");
  if (status === "ended") return pillStyle("rgba(244,63,94,0.18)");
  return pillStyle("rgba(59,130,246,0.18)");
}

function toastStyle(kind: ToastKind) {
  const base = {
    borderRadius: 12,
    padding: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    marginTop: 12,
  } as const;
  if (kind === "success") return { ...base, border: "1px solid rgba(16,185,129,0.35)" };
  if (kind === "error") return { ...base, border: "1px solid rgba(255,0,0,0.35)" };
  return { ...base, border: "1px solid rgba(59,130,246,0.35)" };
}

export function AdminEventDashboardPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const nav = useNavigate();

  const local = useMemo(() => getLocalEvent(slug), [slug]);
  const firstZoneId = useMemo(() => local?.zones?.[0]?.id ?? "z01", [local]);

  const [event, setEvent] = useState<EventRow | null>(null);
  const [eventState, setEventState] = useState<EventStateRow | null>(null);
  const [teams, setTeams] = useState<TeamRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  function showToast(kind: ToastKind, message: string, autoHideMs = 2500) {
    setToast({ kind, message });
    if (autoHideMs > 0) {
      window.setTimeout(() => setToast(null), autoHideMs);
    }
  }

  async function load() {
    setError(null);
    setToast(null);
    setLoading(true);

    // sanity: session admin
    const sess = await supabase.auth.getSession();
    console.log("[admin] session?", Boolean(sess.data.session?.user));

    // 1) event
    const ev = await supabase.from("events").select("id,slug,title").eq("slug", slug).maybeSingle();
    if (ev.error) {
      setError(ev.error.message);
      setLoading(false);
      return;
    }
    if (!ev.data) {
      setError(`Event introuvable (slug: ${slug})`);
      setLoading(false);
      return;
    }
    setEvent(ev.data);

    // 2) event_state (create if missing)
    const st = await supabase.from("event_state").select("*").eq("event_id", ev.data.id).maybeSingle();
    if (st.error) {
      setError(st.error.message);
      setLoading(false);
      return;
    }

    if (!st.data) {
      const ins = await supabase
        .from("event_state")
        .insert({ event_id: ev.data.id, status: "standby", started_at: null, ended_at: null })
        .select("*")
        .single();

      if (ins.error) {
        setError(ins.error.message);
        setLoading(false);
        return;
      }
      setEventState(ins.data);
    } else {
      setEventState(st.data);
    }

    // 3) teams list
    const tm = await supabase
      .from("teams")
      .select("id,team_name,status,selfie_path,created_at")
      .eq("event_id", ev.data.id)
      .order("created_at", { ascending: false });

    if (tm.error) {
      setError(tm.error.message);
      setLoading(false);
      return;
    }

    setTeams(tm.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Realtime: optional. Si realtime pas activé côté Supabase, ça ne casse rien.
  useEffect(() => {
    if (!event?.id) return;

    const ch = supabase
      .channel(`admin:${event.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_state", filter: `event_id=eq.${event.id}` },
        (payload) => {
          console.log("[admin] event_state change", payload);
          setEventState(payload.new as any);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `event_id=eq.${event.id}` },
        () => load()
      )
      .subscribe((s) => console.log("[admin] realtime subscribe", s));

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  async function setStatus(next: "standby" | "running" | "ended") {
    // ✅ si tu cliques pendant le chargement, on te le dit
    if (!event?.id) {
      showToast("error", "Event pas encore chargé. Clique “Rafraîchir”.");
      return;
    }

    setError(null);
    setBusy(true);
    showToast("info", `Enregistrement: ${next}...`, 0);

    try {
      // sanity: session admin
      const sess = await supabase.auth.getSession();
      console.log("[admin] setStatus, authed?", Boolean(sess.data.session?.user), sess.data.session?.user?.id);

      const patch: Partial<EventStateRow> = { status: next };

      if (next === "running") {
        patch.started_at = new Date().toISOString();
        patch.ended_at = null;
      }
      if (next === "ended") {
        patch.ended_at = new Date().toISOString();
      }
      if (next === "standby") {
        patch.started_at = null;
        patch.ended_at = null;
      }

      console.log("[admin] updating event_state", { event_id: event.id, patch });

      // ⚠️ update + select single : si aucun row match => error "JSON object requested, multiple (or no) rows"
      const up = await supabase
        .from("event_state")
        .update(patch)
        .eq("event_id", event.id)
        .select("*");

      console.log("[admin] update result", up);

      if (up.error) {
        setError(up.error.message);
        showToast("error", up.error.message, 6000);
        return;
      }

      const row = up.data?.[0] as EventStateRow | undefined;
      if (!row) {
        const msg = "Update OK mais aucune ligne retournée (row introuvable ou RLS).";
        setError(msg);
        showToast("error", msg, 6000);
        return;
      }

      setEventState(row);
      showToast("success", `Statut: ${row.status}`);
    } catch (e: any) {
      const msg = e?.message ?? "Erreur inconnue";
      setError(msg);
      showToast("error", msg, 6000);
    } finally {
      setBusy(false);
      // si toast info persistant, on le remplace déjà par success/error
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    nav("/admin/login", { replace: true });
  }

  const status = eventState?.status ?? "standby";
  const canClick = !loading && !busy && Boolean(event?.id);

  return (
    <div className="screen">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div>
          <h1 className="h1" style={{ marginBottom: 6 }}>
            Admin — {event?.title ?? slug}
          </h1>
          <div className="muted" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={statusPill(status)}>
              <span style={{ opacity: 0.85 }}>Statut</span>
              <strong>{status}</strong>
            </span>
            <span className="muted" style={{ fontSize: 12, opacity: 0.85 }}>
              {eventState?.started_at ? `start: ${new Date(eventState.started_at).toLocaleTimeString()}` : null}
              {eventState?.ended_at ? ` • end: ${new Date(eventState.ended_at).toLocaleTimeString()}` : null}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" type="button" onClick={load} disabled={loading || busy}>
            Rafraîchir
          </button>
          <button className="btn" type="button" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </div>

      {loading ? <p className="muted" style={{ marginTop: 12 }}>Chargement…</p> : null}

      {toast ? (
        <div style={toastStyle(toast.kind)}>
          <strong>
            {toast.kind === "success" ? "OK" : toast.kind === "error" ? "Erreur" : "Info"} :
          </strong>{" "}
          <span className="muted">{toast.message}</span>
        </div>
      ) : null}

      {error ? (
        <div style={{ border: "1px solid rgba(255,0,0,0.35)", padding: 12, borderRadius: 12, marginTop: 12 }}>
          <strong>Erreur :</strong> <span className="muted">{error}</span>
        </div>
      ) : null}

      {/* Actions */}
      <div style={{ marginTop: 14, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12 }}>
        <div className="muted" style={{ marginBottom: 8 }}>
          Contrôle du jeu
        </div>

        <div className="stack">
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => setStatus("running")}
            disabled={!canClick || status === "running"}
          >
            {busy && status !== "running" ? "En cours..." : "Start game"}
          </button>

          <button
            className="btn"
            type="button"
            onClick={() => setStatus("ended")}
            disabled={!canClick || status === "ended"}
          >
            End game
          </button>

          <button
            className="btn"
            type="button"
            onClick={() => setStatus("standby")}
            disabled={!canClick || status === "standby"}
          >
            Reset standby
          </button>

          <Link className="btn" to={`/e/${slug}/z/${firstZoneId}/play`}>
            Tester côté joueur (zone 1)
          </Link>
        </div>

        <div className="muted" style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
          Debug : ouvre la console. Au clic “Start”, tu dois voir{" "}
          <code>update result</code> avec data ou une error.
        </div>
      </div>

      {/* Teams */}
      <div style={{ marginTop: 14 }}>
        <div className="muted" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span>Équipes ({teams.length})</span>
          <span style={{ fontSize: 12, opacity: 0.85 }}>
            📸 {teams.filter((t) => Boolean(t.selfie_path)).length} avec selfie
          </span>
        </div>

        <div className="stack" style={{ marginTop: 8 }}>
          {teams.map((t) => (
            <div key={t.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{t.team_name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {t.status || "—"} • {new Date(t.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div className="muted" style={{ fontSize: 12, textAlign: "right" }}>
                  {t.selfie_path ? "📸 selfie" : "—"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {teams.length === 0 ? <p className="muted" style={{ marginTop: 10 }}>Aucune équipe pour l’instant.</p> : null}
      </div>
    </div>
  );
}
