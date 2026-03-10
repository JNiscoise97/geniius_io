// src/features/player/game/pages/ZonePlayPage.tsx
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ScanLine,
  CheckCircle2,
  Hash,
  TextCursorInput,
  Image as ImageIcon,
} from "lucide-react";

import { GameHUD } from "../ui/GameHUD";
import { QuestionRenderer } from "../questions/QuestionRenderer";
import type { QuestionHandle } from "../questions/types";

import { ZoneIntroScreen } from "../screens/ZoneIntroScreen";
import { FeedbackScreen } from "../screens/FeedbackScreen";
import { ZoneEndScreen } from "../screens/ZoneEndScreen";

import { createInitialState, gameReducer } from "../engine/reducer";
import type { ZoneContent, AnyQuestion } from "../engine/types";
import { getLocalEvent } from "../../../../lib/content/contentLoader";
import { supabase } from "../../../../lib/supabase/client";

function toZoneContent(eventSlug: string, zoneId: string): ZoneContent {
  const data = getLocalEvent(eventSlug);
  if (!data) throw new Error("Event not found");

  const zone = data.zones.find((z) => z.id === zoneId);
  if (!zone) throw new Error("Zone not found");

  const questions = (zone.rawFrontmatter?.questions ?? []) as AnyQuestion[];
  return {
    id: zone.id,
    title: zone.title,
    introText: zone.body?.slice(0, 240) || undefined,
    questions,
  };
}

function getTypePill(type: AnyQuestion["type"]) {
  switch (type) {
    case "qcu":
      return { label: "Question à choix unique", icon: <ScanLine size={14} /> };
    case "qcm":
      return {
        label: "Question à choix multiple",
        icon: <ScanLine size={14} />,
      };
    case "truefalse":
      return { label: "Vrai/Faux", icon: <CheckCircle2 size={14} /> };
    case "numeric":
      return { label: "Nombre", icon: <Hash size={14} /> };
    case "short":
      return { label: "Réponse", icon: <TextCursorInput size={14} /> };
    case "fill":
      return { label: "Compléter", icon: <TextCursorInput size={14} /> };
    case "photo":
      return { label: "Photo", icon: <ImageIcon size={14} /> };
    default:
      return { label: "Question", icon: <ScanLine size={14} /> };
  }
}

type SessionCtx = { eventId: string; teamId: string };

function getSession(slug: string): SessionCtx {
  const raw = localStorage.getItem(`connect:${slug}:session`);
  if (!raw) throw new Error("Session missing");
  const s = JSON.parse(raw);

  const eventId = s.eventId ?? s.event_id;
  const teamId = s.teamId ?? s.team_id;

  if (!eventId || !teamId) throw new Error("Session invalid");
  return { eventId, teamId };
}

function toAnswerJson(q: AnyQuestion, answer: any) {
  switch (q.type) {
    case "qcm":
      return { values: answer };
    case "photo":
      return { ...answer };
    default:
      return { value: answer };
  }
}

export function ZonePlayPage() {
  const { eventSlug, zoneId } = useParams();
  const slug = eventSlug ?? "demo";
  const zid = zoneId ?? "z01";
  const nav = useNavigate();

  const zone = useMemo(() => toZoneContent(slug, zid), [slug, zid]);
  const [state, dispatch] = useReducer(gameReducer, zone, createInitialState);

  const q = state.zone.questions[state.qIndex] ?? null;
  const durationSec = Math.floor((Date.now() - state.startedAt) / 1000);

  const qRef = useRef<QuestionHandle | null>(null);

  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // si la DB dit "max attempts", on lock l’UI localement tout de suite
  const [, setForceLocked] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.step, q?.id]);

  useEffect(() => {
    setCanSubmit(false);
    setForceLocked(false);
  }, [q?.id]);

  // Tentatives: source de vérité = reducer si exposé, sinon fallback
  const maxAttempts = q?.retry ? 2 : 1;
  const triesLeft = q ? state.triesLeft : 0;
  const attemptsLocked = state.step === "question" && !!q && triesLeft <= 0;

  const stepLabel =
    state.step === "intro"
      ? "Intro"
      : state.step === "question"
        ? `Question ${Math.min(state.qIndex + 1, state.zone.questions.length)}/${state.zone.questions.length}`
        : state.step === "feedback"
          ? "Feedback"
          : "Fin";

  const topmeta =
    state.step === "question" && q ? (
      <div className="qs-topmeta">
        <span className="qs-pill">
          {getTypePill(q.type).icon}
          {getTypePill(q.type).label}
        </span>

        <span className="qs-topmeta__sep">•</span>
        <span className="qs-topmeta__item">{q.points ?? 10} pts</span>

        <span className="qs-topmeta__sep">•</span>
        <span className="qs-topmeta__item">
          {q.retry ? "2 essais max" : "1 essai"}
        </span>

        {q.retry ? (
          <>
            <span className="qs-topmeta__sep">•</span>
            <span className="qs-topmeta__item">restant: {state.triesLeft}</span>
          </>
        ) : null}

        {q.penaltyEnabled ? (
          <>
            <span className="qs-topmeta__sep">•</span>
            <span className="qs-topmeta__item">pénalité -{q.penalty ?? 0}</span>
          </>
        ) : null}
      </div>
    ) : undefined;

  const footer =
    state.step === "question" && q ? (
      <button
        className="qs-primary"
        type="button"
        onClick={() => qRef.current?.submit()}
        disabled={!canSubmit || isSubmitting || attemptsLocked}
        title={attemptsLocked ? "Nombre d’essais atteint" : undefined}
      >
        <CheckCircle2 size={18} />
        <span>
          {attemptsLocked
            ? "Essais épuisés"
            : isSubmitting
              ? "Enregistrement..."
              : "Valider"}
        </span>
      </button>
    ) : undefined;

  if (state.step === "intro") {
    return (
      <GameHUD
        zoneId={state.zone.id}
        zoneTitle={state.zone.title}
        stepLabel={stepLabel}
        score={state.score}
        durationSec={durationSec}
      >
        <ZoneIntroScreen
          title={state.zone.title}
          introText={state.zone.introText}
          onStart={() => dispatch({ type: "START_ZONE" })}
        />
      </GameHUD>
    );
  }

  if (state.step === "question" && q) {
    return (
      <GameHUD
        zoneId={state.zone.id}
        zoneTitle={state.zone.title}
        stepLabel={stepLabel}
        score={state.score}
        durationSec={durationSec}
        topmeta={topmeta}
        footer={footer}
      >
        <h1 className="qs-question" style={{ marginTop: 10, marginBottom: 20 }}>
          {q.prompt}
        </h1>

        {attemptsLocked ? (
          <div className="qs-hint" style={{ marginTop: -10, marginBottom: 12 }}>
            Nombre d’essais atteint. Passe à la suite via l’écran de feedback.
          </div>
        ) : null}

        <QuestionRenderer
          ref={qRef}
          question={q}
          disabled={isSubmitting || attemptsLocked}
          onSubmit={async (answer) => {
            if (!q) return;

            // PHOTO => déjà persistée en pending dans QuestionPhoto, on avance juste le moteur
            if (q.type === "photo") {
              dispatch({ type: "ANSWER", answer });
              return;
            }

            if (isSubmitting) return;

            let session: SessionCtx;
            try {
              session = getSession(slug);
            } catch (e) {
              console.error(e);
              return;
            }

            setIsSubmitting(true);
            try {
              const payload: any = {
                p_event_id: session.eventId,
                p_team_id: session.teamId,
                p_zone_id: zid,
                p_question_id: q.id,
                p_question_type: q.type,
                p_answer_json: toAnswerJson(q, answer),
                p_status: "submitted",
                p_max_attempts: maxAttempts,
              };

              const { error } = await supabase.rpc("submit_answer", payload);
              if (error) throw error;

              dispatch({ type: "ANSWER", answer });
            } catch (e: any) {
              const msg = String(e?.message ?? "");
              if (msg.includes("MAX_ATTEMPTS_REACHED")) {
                setForceLocked(true);
                // Option: basculer direct en feedback si tu veux
                // dispatch({ type: "FORCE_FEEDBACK_MAX_ATTEMPTS" } as any);
                return;
              }
              console.error("submit_answer failed", e);
            } finally {
              setIsSubmitting(false);
            }
          }}
          onCanSubmitChange={setCanSubmit}
        />
      </GameHUD>
    );
  }

  if (state.step === "feedback" && state.feedback) {
    return (
      <GameHUD
        zoneId={state.zone.id}
        zoneTitle={state.zone.title}
        stepLabel={stepLabel}
        score={state.score}
        durationSec={durationSec}
      >
        <FeedbackScreen
          kind={state.feedback.kind}
          delta={state.feedback.delta}
          totalScore={state.score}
          onRetry={() => dispatch({ type: "RETRY" })}
          onNext={() => dispatch({ type: "NEXT" })}
          triesLeft={state.triesLeft}
          maxAttempts={state.maxAttempts}
        />
      </GameHUD>
    );
  }

  if (state.step === "zone_end") {
    return (
      <GameHUD
        zoneId={state.zone.id}
        zoneTitle={state.zone.title}
        stepLabel={stepLabel}
        score={state.score}
        durationSec={durationSec}
      >
        <ZoneEndScreen
          score={state.score}
          durationSec={durationSec}
          onBack={() => nav(`/e/${slug}/zones`)}
        />
      </GameHUD>
    );
  }

  return (
    <GameHUD
      zoneId={state.zone.id}
      zoneTitle={state.zone.title}
      stepLabel="Erreur"
      score={state.score}
      durationSec={durationSec}
    >
      <p className="qs-hint">État inattendu.</p>
    </GameHUD>
  );
}
