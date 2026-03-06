// src/features/player/pages/TeamZonesPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";
import {
  Map as MapIcon,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Flag,
  Users,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

/**
 * TeamZonesPage (DB)
 * Route: /e/:eventSlug/zones
 *
 * Objectifs:
 * - Liste des zones du slug courant (event.yaml + MD)
 * - Statut par zone: À faire / En cours / Terminé
 * - Zone recommandée non choisie par l'utilisateur:
 *   -> calculée selon l'affluence (zone_presence ACTIVE) + règle de reprise
 * - Poll toutes les 10s
 *
 * Notes:
 * - L'avancement (answeredQuestions) vient de answers_current (pas answers)
 * - Une photo "pending" compte comme "répondue" (soumise) pour l'avancement.
 */

type ZoneStatus = "todo" | "in_progress" | "done";
type Tone = "ok" | "warn" | "neutral";

type SessionCtx = {
  eventSlug: string;
  eventId: string;
  teamId: string;
  teamName: string;
  session_token: string;
};

type ZoneUi = {
  id: string;
  title: string;
  theme?: string;
  totalQuestions: number;
  answeredQuestions: number;
  status: ZoneStatus;
  crowd: number; // nb d'équipes en active (TTL)
};

type EventYaml = {
  slug: string;
  title?: string;
  zones: Array<{ file: string; title: string }>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pct(done: number, total: number) {
  if (!total) return 0;
  return clamp(Math.round((done / total) * 100), 0, 100);
}

function statusLabel(s: ZoneStatus) {
  if (s === "todo") return "À faire";
  if (s === "in_progress") return "En cours";
  return "Terminé";
}

function statusTone(s: ZoneStatus): Tone {
  if (s === "done") return "ok";
  if (s === "in_progress") return "warn";
  return "neutral";
}

function pillClass(tone: Tone) {
  if (tone === "ok") return "bg-emerald-50 border-emerald-200 text-emerald-900";
  if (tone === "warn") return "bg-amber-50 border-amber-200 text-amber-900";
  return "bg-slate-50 border-slate-200 text-slate-900";
}

function getSession(slug: string): SessionCtx | null {
  const raw = localStorage.getItem(`connect:${slug}:session`);
  return raw ? (JSON.parse(raw) as SessionCtx) : null;
}

/**
 * Parse très simple du frontmatter YAML des zones MD
 * Objectif: compter les questions via occurrences de "- id:" dans "questions:"
 */
function countQuestionsFromZoneMarkdown(raw: string): number {
  const m = raw.match(/---\s*([\s\S]*?)\s*---/);
  if (!m) return 0;

  const fm = m[1];
  const lines = fm.split("\n");

  let inQuestions = false;
  let questionsIndent = 0;
  let count = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inQuestions) {
      if (/^questions\s*:/.test(trimmed)) {
        inQuestions = true;
        questionsIndent = line.search(/\S|$/);
      }
      continue;
    }

    const indent = line.search(/\S|$/);
    if (trimmed && indent <= questionsIndent) break;

    if (/^-\s*id\s*:/.test(trimmed)) count += 1;
  }

  return count;
}

/**
 * Recommandation:
 * 1) si une zone est "en cours" -> celle-là
 * 2) sinon: parmi les zones non terminées, choisir crowd minimal
 * 3) si toutes done -> première zone
 */
function pickRecommendedZone(zones: ZoneUi[]): ZoneUi | null {
  const inProgress = zones.find((z) => z.status === "in_progress");
  if (inProgress) return inProgress;

  const candidates = zones.filter((z) => z.status !== "done");
  if (candidates.length > 0) {
    const sorted = [...candidates].sort(
      (a, b) => a.crowd - b.crowd || a.title.localeCompare(b.title)
    );
    return sorted[0];
  }

  return zones.length > 0 ? zones[0] : null;
}

export function TeamZonesPage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";
  const nav = useNavigate();

  const session = useMemo(() => getSession(slug), [slug]);

  // -------- Content loading (event.yaml + zones md) --------
  const eventYamlMap = useMemo(() => {
    const all = import.meta.glob("../../../content/events/**/event.yaml", {
      eager: true,
      as: "raw",
    }) as Record<string, string>;
    return all;
  }, []);

  const zoneMdMap = useMemo(() => {
    const all = import.meta.glob("../../../content/events/**/zones/*.md", {
      eager: true,
      as: "raw",
    }) as Record<string, string>;
    return all;
  }, []);

  function parseEventYaml(raw: string): EventYaml | null {
    const lines = raw.split("\n");

    let slugVal = "";
    let titleVal = "";
    const zones: Array<{ file: string; title: string }> = [];

    const stripQuotes = (s: string) => s.trim().replace(/^["']|["']$/g, "");
    const indentOf = (line: string) => line.match(/^\s*/)?.[0].length ?? 0;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const t = line.trim();

      if (t.startsWith("slug:")) {
        slugVal = stripQuotes(t.replace("slug:", ""));
        i += 1;
        continue;
      }

      if (t.startsWith("title:")) {
        titleVal = stripQuotes(t.replace("title:", ""));
        i += 1;
        continue;
      }

      if (t === "zones:" || t.startsWith("zones:")) {
        const zonesIndent = indentOf(line);
        i += 1;

        while (i < lines.length) {
          const l = lines[i];
          const tt = l.trim();

          if (tt && indentOf(l) <= zonesIndent) break;

          const mFile = tt.match(/^-+\s*file:\s*(.+)$/);
          if (mFile) {
            const file = stripQuotes(mFile[1]);
            let zTitle = file;

            const itemIndent = indentOf(l);
            i += 1;

            while (i < lines.length) {
              const l2 = lines[i];
              const t2 = l2.trim();

              if (t2 && indentOf(l2) <= zonesIndent) break;
              const maybeNextItem = t2.match(/^-+\s*file:\s*/);
              if (maybeNextItem && indentOf(l2) === itemIndent) break;

              const mTitle = t2.match(/^title:\s*(.+)$/);
              if (mTitle) zTitle = stripQuotes(mTitle[1]);

              i += 1;
            }

            zones.push({ file, title: zTitle });
            continue;
          }

          i += 1;
        }

        continue;
      }

      i += 1;
    }

    if (!slugVal) return null;
    return { slug: slugVal, title: titleVal, zones };
  }

  const eventDef = useMemo(() => {
    const needle = `/content/events/${slug}/event.yaml`;
    const raw = Object.entries(eventYamlMap).find(([p]) => p.includes(needle))?.[1];
    if (!raw) return null;
    return parseEventYaml(raw);
  }, [eventYamlMap, slug]);

  const zonesFromContent = useMemo(() => {
    if (!eventDef) return [];

    return eventDef.zones.map((z) => {
      const mdNeedle = `/content/events/${slug}/zones/${z.file}`;
      const raw =
        Object.entries(zoneMdMap).find(([p]) => p.includes(mdNeedle))?.[1] ?? "";
      const totalQuestions = raw ? countQuestionsFromZoneMarkdown(raw) : 0;

      let zoneId = z.file.replace(/\.md$/i, "");
      let theme: string | undefined = undefined;

      const fmMatch = raw.match(/---\s*([\s\S]*?)\s*---/);
      if (fmMatch) {
        const fm = fmMatch[1];
        const idLine = fm.split("\n").find((l) => l.trim().startsWith("id:"));
        if (idLine)
          zoneId = idLine
            .trim()
            .replace("id:", "")
            .trim()
            .replace(/^"|"$/g, "");

        const themeLine = fm.split("\n").find((l) => l.trim().startsWith("theme:"));
        if (themeLine)
          theme = themeLine
            .trim()
            .replace("theme:", "")
            .trim()
            .replace(/^"|"$/g, "");
      }

      return {
        id: zoneId,
        title: z.title,
        theme,
        totalQuestions,
      };
    });
  }, [eventDef, zoneMdMap, slug]);

  // -------- DB hydrated states --------
  const [zones, setZones] = useState<ZoneUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nextCheckIn, setNextCheckIn] = useState(10);
  const pollRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  async function fetchAnsweredByZone(eventId: string, teamId: string) {
    const { data, error } = await supabase
      .from("answers_current")
      .select("zone_id, question_id, status")
      .eq("event_id", eventId)
      .eq("team_id", teamId)
      .in("status", ["submitted", "pending", "graded", "rejected"]);

    if (error) throw new Error(error.message);

    const map = new globalThis.Map<string, Set<string>>();
    for (const row of data ?? []) {
      const z = (row as any).zone_id as string | null;
      const q = (row as any).question_id as string | null;
      if (!z || !q) continue;
      if (!map.has(z)) map.set(z, new Set());
      map.get(z)!.add(q);
    }

    const out = new globalThis.Map<string, number>();
    for (const [z, set] of map.entries()) out.set(z, set.size);
    return out;
  }

  async function fetchMyActiveZone(eventId: string, teamId: string) {
    const { data, error } = await supabase
      .from("zone_presence")
      .select("zone_id, last_seen_at")
      .eq("event_id", eventId)
      .eq("team_id", teamId)
      .eq("phase", "active")
      .is("exited_at", null)
      .order("last_seen_at", { ascending: false })
      .limit(1);

    if (error) throw new Error(error.message);
    return (data?.[0]?.zone_id as string | undefined) ?? null;
  }

  async function fetchCrowdByZone(eventId: string) {
    const activeSince = new Date(Date.now() - 90_000).toISOString();

    const { data, error } = await supabase
      .from("zone_presence")
      .select("zone_id, team_id, last_seen_at")
      .eq("event_id", eventId)
      .eq("phase", "active")
      .is("exited_at", null)
      .gte("last_seen_at", activeSince);

    if (error) throw new Error(error.message);

    const map = new globalThis.Map<string, Set<string>>();
    for (const r of data ?? []) {
      const z = (r as any).zone_id as string | null;
      const t = (r as any).team_id as string | null;
      if (!z || !t) continue;
      if (!map.has(z)) map.set(z, new Set());
      map.get(z)!.add(t);
    }

    const out = new globalThis.Map<string, number>();
    for (const [z, set] of map.entries()) out.set(z, set.size);
    return out;
  }

  async function hydrate(ctx: SessionCtx) {
    setError(null);

    if (!zonesFromContent.length) {
      setZones([]);
      return;
    }

    const [answeredMap, crowdMap, myActiveZoneId] = await Promise.all([
      fetchAnsweredByZone(ctx.eventId, ctx.teamId),
      fetchCrowdByZone(ctx.eventId),
      fetchMyActiveZone(ctx.eventId, ctx.teamId),
    ]);

    const ui: ZoneUi[] = zonesFromContent.map((z) => {
      const answered = answeredMap.get(z.id) ?? 0;
      const total = z.totalQuestions ?? 0;

      let status: ZoneStatus = "todo";
      if (total > 0 && answered >= total) {
        status = "done";
      } else if (myActiveZoneId === z.id) {
        status = "in_progress";
      } else if (answered > 0) {
        status = "in_progress";
      }

      const crowd = crowdMap.get(z.id) ?? 0;

      return {
        id: z.id,
        title: z.title,
        theme: z.theme,
        totalQuestions: total,
        answeredQuestions: answered,
        status,
        crowd,
      };
    });

    setZones(ui);
  }

  // initial + polling (10s)
  useEffect(() => {
    if (!session) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        await hydrate(session);
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
        await hydrate(session);
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Erreur réseau");
      }
    }, 10_000);

    if (tickRef.current) window.clearInterval(tickRef.current);
    setNextCheckIn(10);
    tickRef.current = window.setInterval(() => {
      setNextCheckIn((s) => (s <= 1 ? 10 : s - 1));
    }, 1000);

    return () => {
      mounted = false;
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.teamId, session?.eventId, session?.session_token, zonesFromContent.length]);

  // ✅ UNE SEULE DÉCLARATION
  const recommended = useMemo(() => pickRecommendedZone(zones), [zones]);

  // ✅ UNE SEULE DÉCLARATION
  const primaryCta = useMemo(() => {
    if (!recommended) return { label: "Commencer", mode: "start" as const, disabled: true };
    if (recommended.status === "in_progress")
      return { label: "Reprendre", mode: "resume" as const, disabled: false };
    if (recommended.status === "done")
      return { label: "Revoir", mode: "review" as const, disabled: false };
    return { label: "Commencer", mode: "start" as const, disabled: false };
  }, [recommended]);

  function onEnterZone() {
    if (!recommended) return;
    nav(`/e/${slug}/z/${recommended.id}/play`, { replace: true });
  }

  async function manualRecheck() {
    if (!session) return;
    try {
      setLoading(true);
      await hydrate(session);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur re-vérification");
    } finally {
      setLoading(false);
    }
  }

  function renderRecommendedCard() {
    if (!recommended) {
      return (
        <section className="mt-3 rounded-3xl bg-white border border-slate-200 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-[color:var(--bad)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="text-[16px] font-black text-slate-900">Aucune zone disponible</div>
                <div className="mt-1 text-sm font-bold text-slate-700">
                  Impossible de déterminer la prochaine zone.
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    const tone = statusTone(recommended.status);
    const pill = pillClass(tone);
    const isResume = recommended.status === "in_progress";
    const isDone = recommended.status === "done";

    return (
      <section className="mt-3 rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[18px] font-black text-slate-900">Zone à rejoindre</div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                Décidée automatiquement selon l’affluence.
              </div>
            </div>

            <div
              className={[
                "h-10 px-3 rounded-2xl border font-extrabold text-sm inline-flex items-center gap-2",
                pill,
              ].join(" ")}
              title={`Statut: ${statusLabel(recommended.status)}`}
            >
              {isDone ? (
                <CheckCircle2 size={16} />
              ) : isResume ? (
                <Clock size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              {statusLabel(recommended.status)}
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-slate-50 border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900 truncate">{recommended.title}</div>
                <div className="mt-1 text-xs font-extrabold text-slate-700 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <Users size={14} />
                    Affluence : <span className="text-slate-900">{recommended.crowd}</span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    {recommended.answeredQuestions}/{recommended.totalQuestions} répondues
                  </span>
                </div>
              </div>

              <button
                className="h-10 px-3 rounded-2xl border font-extrabold text-sm inline-flex items-center gap-2 transition bg-white border-slate-200 text-slate-900"
                onClick={onEnterZone}
                disabled={loading}
                title="Entrer dans la zone recommandée"
              >
                <ArrowRight size={18} />
                Entrer
              </button>
            </div>

            <div className="mt-3 h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className="h-full bg-[color:var(--blue)]"
                style={{
                  width: `${pct(recommended.answeredQuestions, recommended.totalQuestions)}%`,
                }}
              />
            </div>

            <div className="mt-2 text-[11px] font-extrabold text-slate-600">
              {recommended.status === "in_progress"
                ? "Vous reprenez la zone en cours."
                : "Suivez la recommandation pour éviter les embouteillages."}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                className="h-9 px-3 rounded-2xl border bg-white border-slate-200 text-slate-700 font-extrabold text-xs inline-flex items-center gap-2"
                onClick={manualRecheck}
                disabled={loading}
                title="Recalculer maintenant"
              >
                <RotateCcw size={16} />
                Recalculer
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderZoneRow(z: ZoneUi) {
    const tone = statusTone(z.status);
    const pill = pillClass(tone);

    return (
      <div key={z.id} className="rounded-3xl bg-slate-50 border border-slate-200 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 truncate">{z.title}</div>
            <div className="mt-1 text-xs font-extrabold text-slate-700 flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <Users size={14} />
                {z.crowd}
              </span>
              <span className="text-slate-300">•</span>
              <span>
                {z.answeredQuestions}/{z.totalQuestions}
              </span>
            </div>
          </div>

          <div
            className={[
              "shrink-0 h-9 px-3 rounded-2xl border font-extrabold text-xs inline-flex items-center gap-2",
              pill,
            ].join(" ")}
            title={`Statut: ${statusLabel(z.status)}`}
          >
            {z.status === "done" ? (
              <CheckCircle2 size={16} />
            ) : z.status === "in_progress" ? (
              <Clock size={16} />
            ) : (
              <Flag size={16} />
            )}
            {statusLabel(z.status)}
          </div>
        </div>

        <div className="mt-3 h-2.5 rounded-full bg-white overflow-hidden border border-slate-200">
          <div
            className="h-full bg-[color:var(--blue)]"
            style={{ width: `${pct(z.answeredQuestions, z.totalQuestions)}%` }}
          />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
        <main className="c-container pt-6 pb-10">
          <div className="rounded-3xl bg-white border border-slate-200 p-4">
            <div className="text-[18px] font-black text-slate-900">Aucune équipe</div>
            <div className="mt-1 text-sm font-bold text-slate-700">
              Crée ou rejoins une équipe avant d’accéder aux zones.
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="h-11 w-11 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
            <MapIcon size={18} className="text-slate-800" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-black tracking-tight text-slate-900">Zones</div>
            <div className="mt-0.5 text-xs font-extrabold text-slate-700">
              La prochaine zone est assignée automatiquement.
            </div>
          </div>

          <div className="shrink-0 h-10 px-3 rounded-2xl border bg-white border-slate-200 text-slate-700 font-extrabold text-xs inline-flex items-center gap-2">
            <Sparkles size={16} className="text-[color:var(--blue)]" />
            <span className="hidden xs:inline">Maj</span>
            <span className="text-slate-900">{nextCheckIn}s</span>
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

        {/* Recommended */}
        {renderRecommendedCard()}

        {/* Zones list */}
        <section className="mt-3 rounded-3xl bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
          <div className="p-4">
            <div>
              <div className="text-[16px] font-black text-slate-900">Liste des zones</div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                Statut et progression par zone (info).
              </div>
            </div>

            {loading && zones.length === 0 ? (
              <div className="mt-4 rounded-3xl bg-slate-50 border border-slate-200 p-4 text-sm font-extrabold text-slate-700">
                Chargement…
              </div>
            ) : (
              <div className="mt-4 grid gap-3">{zones.map(renderZoneRow)}</div>
            )}

            <div className="mt-3 text-[11px] font-extrabold text-slate-600">
              * L’utilisateur ne choisit pas la zone — la recommandation peut changer selon l’affluence.
            </div>
          </div>
        </section>
      </main>

      {/* Bottom CTA */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                !recommended || loading
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              onClick={onEnterZone}
              disabled={!recommended || loading}
            >
              {primaryCta.mode === "resume" ? (
                <ArrowRight size={18} />
              ) : primaryCta.mode === "review" ? (
                <Flag size={18} />
              ) : (
                <Play size={18} />
              )}
              {primaryCta.label}
            </button>

            <div className="mt-2 px-1 flex items-center justify-between text-[11px] font-extrabold text-slate-700">
              <span className="truncate">
                Zone recommandée :{" "}
                <span className="text-slate-900">{recommended ? recommended.id : "—"}</span>
              </span>
              <span className="text-slate-900">
                {recommended ? statusLabel(recommended.status) : "—"}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}