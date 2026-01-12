// src/features/player/pages/StandbyPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";
import { getLocalEvent } from "../../../lib/content/contentLoader";

type SessionCtx = {
  eventSlug: string;
  eventId: string;
  teamId: string;
  teamName: string;
  session_token: string;
};

type EventStateRow = {
  event_id: string;
  status: "standby" | "running" | "ended";
  updated_at?: string | null;
};

function readSession(slug: string): SessionCtx | null {
  const raw = localStorage.getItem(`connect:${slug}:session`);
  return raw ? (JSON.parse(raw) as SessionCtx) : null;
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 86,
        zIndex: 50,
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}

export function StandbyPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const nav = useNavigate();

  const local = useMemo(() => getLocalEvent(slug), [slug]);
  const fallbackFirstZoneId = useMemo(() => local?.zones?.[0]?.id ?? "z01", [local]);

  const [session, setSession] = useState<SessionCtx | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

  const [eventState, setEventState] = useState<EventStateRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);
  const toastRef = useRef<number | null>(null);

  function showToast(msg: string, ms = 1800) {
    setToast(msg);
    if (toastRef.current) window.clearTimeout(toastRef.current);
    toastRef.current = window.setTimeout(() => setToast(null), ms);
  }

  // ✅ dérivés stables : plus besoin d’utiliser "session" dans les effects
  const eventId = session?.eventId ?? null;
  const teamId = session?.teamId ?? null;
  const teamName = session?.teamName ?? null;

  // 1) session
  useEffect(() => {
    setSession(readSession(slug));
  }, [slug]);

  // 2) selfie miniature
  useEffect(() => {
    let cancelled = false;

    async function run(tid: string) {
      setSelfieUrl(null);

      const res = await supabase.from("teams").select("selfie_path").eq("id", tid).single();
      if (cancelled) return;

      if (res.error) {
        console.warn("[standby] selfie load error", res.error);
        return;
      }

      const path = (res.data?.selfie_path as string | null) ?? null;
      if (!path) return;

      // Bucket public => URL directe
      const pub = supabase.storage.from("connect-public").getPublicUrl(path);
      if (pub?.data?.publicUrl) {
        setSelfieUrl(pub.data.publicUrl);
        return;
      }

      // Fallback signed URL (si bucket privé un jour)
      const signed = await supabase.storage.from("connect-public").createSignedUrl(path, 60 * 30);
      if (!cancelled) setSelfieUrl(signed.data?.signedUrl ?? null);
    }

    if (!teamId) return;
    run(teamId);

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  async function fetchEventState(eid: string) {
    const st = await supabase
      .from("event_state")
      .select("event_id,status,updated_at")
      .eq("event_id", eid)
      .maybeSingle();

    if (st.error) {
      console.warn("[standby] event_state fetch error", st.error);
      return null;
    }
    return (st.data as EventStateRow | null) ?? null;
  }

  // 3) listen event_state : realtime + polling fallback
  useEffect(() => {
    if (!eventId) return;

    let unsubscribed = false;

    async function start(eid: string) {
      showToast("En attente du lancement…");

      const first = await fetchEventState(eid);
      if (unsubscribed) return;
      if (first) setEventState(first);

      const ch = supabase
        .channel(`player:event_state:${eid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "event_state", filter: `event_id=eq.${eid}` },
          (payload) => {
            const next = payload.new as EventStateRow;
            setEventState(next);
            showToast(`Statut jeu: ${next.status}`);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") showToast("Connecté au live ✅");
        });

      pollingRef.current = window.setInterval(async () => {
        const st = await fetchEventState(eid);
        if (!st || unsubscribed) return;

        setEventState((prev) => {
          if (!prev || prev.status !== st.status || prev.updated_at !== st.updated_at) {
            showToast(`Statut jeu: ${st.status}`);
            return st;
          }
          return prev;
        });
      }, 3000);

      return () => {
        supabase.removeChannel(ch);
      };
    }

    let cleanupRealtime: (() => void) | undefined;
    start(eventId).then((cleanup) => {
      cleanupRealtime = cleanup;
    });

    return () => {
      unsubscribed = true;
      if (pollingRef.current) window.clearInterval(pollingRef.current);
      if (cleanupRealtime) cleanupRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // 4) auto navigate quand running
  useEffect(() => {
    if (!eventId) return;
    if (!eventState) return;

    if (eventState.status === "running") {
      const targetZoneId = fallbackFirstZoneId;
      showToast("C’est parti ! 🎉");
      nav(`/e/${slug}/z/${targetZoneId}/play`, { replace: true });
    }

    if (eventState.status === "ended") {
      showToast("Jeu terminé.");
    }
  }, [eventId, eventState, fallbackFirstZoneId, nav, slug]);

  // ---- UI ----
  if (!session) {
    return (
      <div className="screen">
        <h1 className="h1">Aucune équipe active</h1>
        <p className="muted">Crée une équipe pour continuer.</p>
        <div className="stack">
          <Link className="btn btn--primary" to={`/e/${slug}/team/create`}>
            Créer une équipe
          </Link>
          <Link className="btn" to={`/e/${slug}/team/resume`}>
            Reprendre une équipe
          </Link>
        </div>
      </div>
    );
  }

  const status = eventState?.status ?? "standby";

  return (
    <div className="screen">
      <Toast message={toast} />

      <h1 className="h1">En attente…</h1>
      <p className="muted">
        Équipe : <strong>{teamName}</strong>
      </p>

      <div className="muted" style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ opacity: 0.9 }}>Statut :</span>
        <strong>{status}</strong>
      </div>

      <p className="muted" style={{ marginTop: 10 }}>
        Le jeu n’a pas encore commencé. Reste sur cet écran : dès que l’organisateur lance, tu bascules automatiquement.
      </p>

      <div className="stack" style={{ marginTop: 14 }}>
        {selfieUrl ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <img
              src={selfieUrl}
              alt="Selfie équipe"
              style={{
                width: 72,
                height: 72,
                objectFit: "cover",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
            <div style={{ display: "grid", gap: 6 }}>
              <div className="muted">Selfie enregistré ✅</div>
              <Link className="btn" to={`/e/${slug}/team/selfie`}>
                Modifier le selfie
              </Link>
            </div>
          </div>
        ) : (
          <Link className="btn btn--primary" to={`/e/${slug}/team/selfie`}>
            Prendre le selfie d’équipe
          </Link>
        )}

        {/* debug optionnel */}
        <Link className="btn" to={`/e/${slug}/z/${fallbackFirstZoneId}/play`}>
          Tester la zone 1 (debug)
        </Link>

        <button
          className="btn"
          type="button"
          onClick={() => {
            localStorage.removeItem(`connect:${slug}:session`);
            window.location.href = `/e/${slug}`;
          }}
        >
          Quitter l’équipe (local)
        </button>
      </div>
    </div>
  );
}
