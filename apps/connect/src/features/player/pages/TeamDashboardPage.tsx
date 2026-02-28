// src/features/player/pages/TeamDashboardPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";
import {
  LayoutDashboard,
  WifiOff,
  Wifi,
  AlertTriangle,
  Camera,
  RotateCcw,
  Clock,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Flag,
  Play,
} from "lucide-react";

/**
 * TeamDashboardPage (branché DB)
 * - waiting: event_game_state.state !== 'started' => CTA disabled + poll 10s
 * - ready: event started + team pas commencé => "Commencer"
 * - resume: team déjà commencé => "Continuer" + progression + score
 * - finished: team fini => selfie grand + score final
 *
 * Routes (confirmées):
 * - selfie: /e/:eventSlug/team/selfie
 *
 * Progression:
 * - totalQuestions calculé depuis les MD de zones (frontmatter) du slug courant
 * - done = nombre de question_id DISTINCT dans answers pour l’équipe
 */

type GameState = "waiting" | "ready" | "resume" | "finished";
type Tone = "ok" | "warn" | "neutral";

type SessionCtx = {
  eventSlug: string;
  eventId: string;
  teamId: string;
  teamName: string;
  session_token: string;
};

type TeamRow = {
  id: string;
  team_name: string;
  status: "created" | "playing" | "finished" | "abandoned";
  score: number;
  elapsed_seconds: number;
  started_at: string | null;
  finished_at: string | null;
  selfie_path: string | null;
  selfie_path_preview: string | null;
};

type EventGameStateRow = {
  event_id: string;
  state: "draft" | "standby" | "started" | "ended";
  started_at: string | null;
  ended_at: string | null;
};

function getSession(slug: string): SessionCtx | null {
  const raw = localStorage.getItem(`connect:${slug}:session`);
  return raw ? (JSON.parse(raw) as SessionCtx) : null;
}

function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Parse très simple du frontmatter YAML de tes zones MD
 * Objectif: compter les questions via occurrences de "  - id:" sous "questions:"
 */
function countQuestionsFromZoneMarkdown(raw: string): number {
  const m = raw.match(/---\s*([\s\S]*?)\s*---/);
  if (!m) return 0;

  const fm = m[1];
  const lines = fm.split("\n");

  // trouve la section "questions:"
  let inQuestions = false;
  let questionsIndent = 0;
  let count = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inQuestions) {
      if (/^questions\s*:/.test(trimmed)) {
        inQuestions = true;
        questionsIndent = line.search(/\S|$/); // indent colonne
      }
      continue;
    }

    // si on sort du bloc questions (indent <= indent de "questions:" et ligne non vide)
    const indent = line.search(/\S|$/);
    if (trimmed && indent <= questionsIndent) break;

    // compte " - id:" (avec indent)
    if (/^-+\s*id\s*:/.test(trimmed) || /^-\s*id\s*:/.test(trimmed)) {
      count += 1;
    }
  }

  return count;
}

export function TeamDashboardPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const nav = useNavigate();

  const session = useMemo(() => getSession(slug), [slug]);

  // ---------- CONTENT: totalQuestions (depuis MD) ----------
  // Vite: charge tous les MD des zones en raw, puis filtre ceux du slug courant
  const zoneMdMap = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const all = import.meta.glob("../../../content/events/**/zones/*.md", {
      eager: true,
      as: "raw",
    }) as Record<string, string>;
    return all;
  }, []);

  const totalQuestions = useMemo(() => {
    const needle = `/content/events/${slug}/zones/`;
    const raws = Object.entries(zoneMdMap)
      .filter(([path]) => path.includes(needle))
      .map(([, raw]) => raw);

    return raws.reduce((acc, raw) => acc + countQuestionsFromZoneMarkdown(raw), 0);
  }, [zoneMdMap, slug]);

  // ---------- DB data ----------
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [membersCount, setMembersCount] = useState<number>(0);
  const [answersDistinctCount, setAnswersDistinctCount] = useState<number>(0);
  const [eventGame, setEventGame] = useState<EventGameStateRow | null>(null);

  // ---------- UI state ----------
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // network indicator (pas de toggle)
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null);

  const pollRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    function on() {
      setIsOnline(true);
    }
    function off() {
      setIsOnline(false);
    }
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function touchSessionLastSeen(ctx: SessionCtx) {
    // best-effort (si RLS bloque, on ignore)
    try {
      await supabase
        .from("team_sessions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("session_token", ctx.session_token);
    } catch {
      // ignore
    }
  }

  async function fetchDashboard(ctx: SessionCtx) {
    setError(null);

    const teamReq = supabase
      .from("teams")
      .select(
        "id, team_name, status, score, elapsed_seconds, started_at, finished_at, selfie_path, selfie_path_preview"
      )
      .eq("id", ctx.teamId)
      .single();

    const membersReq = supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", ctx.teamId);

    // distinct question_id (simple côté front)
    const answersReq = supabase
      .from("answers")
      .select("question_id")
      .eq("event_id", ctx.eventId)
      .eq("team_id", ctx.teamId);

    const eventGameReq = supabase
      .from("event_game_state")
      .select("event_id, state, started_at, ended_at")
      .eq("event_id", ctx.eventId)
      .single();

    const [t, m, a, eg] = await Promise.all([teamReq, membersReq, answersReq, eventGameReq]);

    if (t.error) throw new Error(t.error.message);

    // event_game_state peut ne pas exister -> on traite comme standby
    let egRow: EventGameStateRow | null = null;
    if (eg.error) {
      // PGRST116 = No rows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code = (eg.error as any).code;
      if (code !== "PGRST116") throw new Error(eg.error.message);
      egRow = { event_id: ctx.eventId, state: "standby", started_at: null, ended_at: null };
    } else {
      egRow = eg.data as EventGameStateRow;
    }

    const questionIds = (a.data ?? []).map((x) => x.question_id).filter(Boolean);
    const distinct = new Set(questionIds).size;

    setTeam(t.data as TeamRow);
    setMembersCount(m.count ?? 0);
    setAnswersDistinctCount(distinct);
    setEventGame(egRow);
    setLastFetchAt(Date.now());

    touchSessionLastSeen(ctx);
  }

  // initial + polling (10s)
  useEffect(() => {
    if (!session) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        await fetchDashboard(session);
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Erreur chargement");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      if (!mounted) return;
      try {
        await fetchDashboard(session);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur réseau");
      }
    }, 10_000);

    if (tickRef.current) window.clearInterval(tickRef.current);

    return () => {
      mounted = false;
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [session?.teamId, session?.eventId, session?.session_token]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------- derive game state (FULL union, no TS narrowing trap) --------
  const gameState: GameState = useMemo(() => {
    if (!team) return "waiting";
    const isFinished = team.status === "finished" || !!team.finished_at;
    if (isFinished) return "finished";

    const eventStarted = (eventGame?.state ?? "standby") === "started";
    if (!eventStarted) return "waiting";

    const isResume = team.status === "playing" || !!team.started_at;
    return isResume ? "resume" : "ready";
  }, [team, eventGame]);

  const headerBadge = useMemo((): { label: string; icon: React.ReactNode; tone: Tone } => {
    if (!isOnline) return { label: "Hors-ligne", icon: <WifiOff size={16} />, tone: "warn" };
    return { label: "En ligne", icon: <Wifi size={16} />, tone: "ok" };
  }, [isOnline]);

  const stateMeta = useMemo(() => {
    switch (gameState) {
      case "waiting":
        return {
          title: "En attente du lancement",
          desc:
            "L’organisateur n’a pas encore lancé le jeu. Le bouton s’activera automatiquement.",
          pill: { label: "Waiting", icon: <Clock size={16} />, tone: "neutral" as Tone },
          ctaLabel: "Commencer",
          ctaDisabled: true,
        };
      case "ready":
        return {
          title: "Le jeu est lancé",
          desc: "Vous pouvez démarrer quand vous êtes prêts.",
          pill: { label: "Prêt", icon: <CheckCircle2 size={16} />, tone: "ok" as Tone },
          ctaLabel: "Commencer",
          ctaDisabled: false,
        };
      case "resume":
        return {
          title: "Partie en cours",
          desc: "Reprenez là où vous vous étiez arrêtés.",
          pill: { label: "Resume", icon: <ArrowRight size={16} />, tone: "ok" as Tone },
          ctaLabel: "Continuer",
          ctaDisabled: false,
        };
      case "finished":
        return {
          title: "Partie terminée",
          desc: "Bravo ! Voici votre score final.",
          pill: { label: "Finished", icon: <Flag size={16} />, tone: "ok" as Tone },
          ctaLabel: "Revoir",
          ctaDisabled: false,
        };
    }
  }, [gameState]);

  const pillClass =
    stateMeta.pill.tone === "ok"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : stateMeta.pill.tone === "warn"
        ? "bg-amber-50 border-amber-200 text-amber-900"
        : "bg-slate-50 border-slate-200 text-slate-900";

  const onlineClass =
    headerBadge.tone === "ok"
      ? "bg-white border-slate-200 text-slate-900"
      : "bg-amber-50 border-amber-200 text-amber-900";

  const statusText = useMemo(() => {
    switch (gameState) {
      case "waiting":
        return "waiting";
      case "ready":
        return "ready";
      case "resume":
        return "resume";
      case "finished":
        return "finished";
    }
  }, [gameState]);

  const showResumeCard = gameState === "resume";
  const showFinishedCard = gameState === "finished";

  const selfieUrl = useMemo(() => {
    if (!team) return null;
    const path = team.selfie_path_preview ?? team.selfie_path;
    if (!path) return null;
    return getPublicUrl("connect-public", path);
  }, [team?.selfie_path, team?.selfie_path_preview]);

  async function onPrimaryCta() {
    if (!session || !team) return;

    if (gameState === "finished") {
      // adapte si besoin (écran résultats)
      nav(`/e/${slug}/results`, { replace: false });
      return;
    }

    if (gameState === "ready") {
      try {
        setLoading(true);
        setError(null);

        const now = new Date().toISOString();
        const upd = await supabase
          .from("teams")
          .update({ status: "playing", started_at: now })
          .eq("id", team.id)
          .select("id")
          .single();

        if (upd.error) throw new Error(upd.error.message);

        await fetchDashboard(session);

        // adapte route jeu
        nav(`/e/${slug}/zones`, { replace: true });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Impossible de démarrer");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (gameState === "resume") {
      nav(`/e/${slug}/zones`, { replace: true });
    }
  }

  const ctaDisabled = stateMeta.ctaDisabled || loading || !!error;

  if (!session) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pt-6 pb-10">
          <div className="rounded-3xl bg-white border border-slate-200 p-4">
            <div className="text-[18px] font-black text-slate-900">Aucune équipe</div>
            <div className="mt-1 text-sm font-bold text-slate-700">
              Crée ou rejoins une équipe avant d’accéder au tableau de bord.
            </div>
          </div>
        </main>
      </div>
    );
  }

  const teamName = team?.team_name ?? session.teamName ?? "—";

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="h-11 w-11 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
            <LayoutDashboard size={18} className="text-slate-800" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-black tracking-tight text-slate-900">Tableau de bord</div>
            <div className="mt-0.5 text-xs font-extrabold text-slate-700">
              Équipe : <span className="text-slate-900">{teamName}</span>
              <span className="mx-1.5 text-slate-400">•</span>
              <span className="text-slate-900">{membersCount}</span> membres
            </div>
          </div>

          {/* Compact online indicator */}
          <div
            className={[
              "shrink-0 h-10 px-3 rounded-2xl border font-extrabold text-xs inline-flex items-center gap-2",
              onlineClass,
            ].join(" ")}
            title={isOnline ? "Connexion OK" : "Hors-ligne"}
          >
            {headerBadge.icon}
            <span className="hidden xs:inline">{headerBadge.label}</span>
            <span className="xs:hidden">{isOnline ? "OK" : "OFF"}</span>
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

        {/* State card */}
        <section className="mt-3 rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[18px] font-black text-slate-900">{stateMeta.title}</div>
              </div>

              <div
                className={[
                  "h-10 px-3 rounded-2xl border font-extrabold text-sm inline-flex items-center gap-2",
                  pillClass,
                ].join(" ")}
              >
                {stateMeta.pill.icon}
                {stateMeta.pill.label}
              </div>
            </div>

            <div className="mt-1 text-sm font-bold text-slate-700">{stateMeta.desc}</div>

            {/* Selfie card */}
            <div className="mt-4 rounded-3xl bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-9 w-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                    <Camera size={18} className="text-slate-800" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900">Selfie d’équipe</div>

                    {!team?.selfie_path && (
                      <div className="text-xs font-extrabold text-slate-700">
                        Statut :{" "}
                        <span className="text-[color:var(--bad)]">À faire</span>
                      </div>
                    )}

                  </div>
                </div>

                {/* ✅ preview carré + bouton */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                    {selfieUrl ? (
                      <img
                        src={selfieUrl}
                        alt="Aperçu selfie d’équipe"
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-[10px] font-extrabold text-slate-500 px-2 text-center">
                        Pas de selfie
                      </div>
                    )}
                  </div>

                  <button
                    className="h-10 px-3 rounded-2xl border font-extrabold text-sm inline-flex items-center gap-2 transition bg-white border-slate-200 text-slate-900"
                    onClick={() => nav(`/e/${slug}/team/selfie`, { replace: false })}
                    title="Reprendre le selfie"
                  >
                    <RotateCcw size={18} />
                    Reprendre
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resume: progress + score */}
        {showResumeCard ? (
          <section className="mt-3 rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[16px] font-black text-slate-900">Progression</div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    Questions :{" "}
                    <span className="text-slate-900">
                      {answersDistinctCount}/{totalQuestions || "—"}
                    </span>
                  </div>
                </div>

                <div className="h-10 px-3 rounded-2xl bg-slate-50 border border-slate-200 inline-flex items-center gap-2">
                  <Trophy size={18} className="text-slate-800" />
                  <span className="text-sm font-black text-slate-900">{team?.score ?? 0}</span>
                </div>
              </div>

              <div className="mt-3 h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-[color:var(--blue)]"
                  style={{
                    width: `${totalQuestions > 0
                      ? Math.round((answersDistinctCount / totalQuestions) * 100)
                      : 0
                      }%`,
                  }}
                />
              </div>

              <div className="mt-2 text-[11px] font-extrabold text-slate-600">
                Progression basée sur les réponses enregistrées (question_id distinct).
              </div>
            </div>
          </section>
        ) : null}

        {/* Finished: big selfie + final score */}
        {showFinishedCard ? (
          <section className="mt-3 rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
            <div className="p-4">
              <div className="text-[16px] font-black text-slate-900">Selfie d’équipe</div>
              <div className="mt-1 text-sm font-bold text-slate-700">Souvenir de la partie ✨</div>

              <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                {selfieUrl ? (
                  <img
                    src={selfieUrl}
                    alt="Selfie d’équipe"
                    className="w-full aspect-[4/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] flex items-center justify-center text-sm font-extrabold text-slate-600">
                    Aucun selfie
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-3xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                    <Trophy size={18} className="text-slate-800" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">Score final</div>
                    <div className="text-xs font-extrabold text-slate-700">Merci d’avoir joué !</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[20px] leading-none font-black text-slate-900">
                    {team?.score ?? 0}
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-600">points</div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Small info line */}
        <div className="mt-3 px-1 text-[11px] font-extrabold text-slate-600 flex items-center justify-between">
          <span>
            Maj :{" "}
            <span className="text-slate-900">
              {lastFetchAt
                ? new Date(lastFetchAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "—"}
            </span>
          </span>
          <span className="text-slate-900">{loading ? "…" : "Prêt"}</span>
        </div>
      </main>

      {/* Bottom CTA */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                ctaDisabled ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              onClick={onPrimaryCta}
              disabled={ctaDisabled}
            >
              {gameState === "resume" ? (
                <ArrowRight size={18} />
              ) : gameState === "finished" ? (
                <Flag size={18} />
              ) : (
                <Play size={18} />
              )}
              {stateMeta.ctaLabel}
            </button>

            <div className="mt-2 px-1 flex items-center justify-between text-[11px] font-extrabold text-slate-700">
              <span>
                Statut : <span className="text-slate-900">{statusText}</span>
              </span>
              <span className="text-slate-900">{isOnline ? "OK" : "OFF"}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}