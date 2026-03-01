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
      return { label: "Question à choix multiple", icon: <ScanLine size={14} /> };
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

/**
 * IMPORTANT
 * ----------
 * Le bouton footer ne doit PAS dépendre de `qRef.current?.canSubmit()`
 * dans le render: React ne rerender pas quand la ref change.
 *
 * 👉 On pilote `disabled` via un state `canSubmit`, mis à jour
 * par `QuestionRenderer` (via `onCanSubmitChange`).
 */
export function ZonePlayPage() {
  const { eventSlug, zoneId } = useParams();
  const slug = eventSlug ?? "demo";
  const zid = zoneId ?? "z01";
  const nav = useNavigate();

  const zone = useMemo(() => toZoneContent(slug, zid), [slug, zid]);
  const [state, dispatch] = useReducer(gameReducer, zone, createInitialState);

  const q = state.zone.questions[state.qIndex] ?? null;

  // durée (simple)
  const durationSec = Math.floor((Date.now() - state.startedAt) / 1000);

  // ref vers le renderer (pour submit() imperatif)
  const qRef = useRef<QuestionHandle | null>(null);

  // ✅ état reactif pour activer/désactiver le CTA unique
  const [canSubmit, setCanSubmit] = useState(false);

  // reset du canSubmit à chaque nouvelle question
  useEffect(() => {
    setCanSubmit(false);
  }, [q?.id]);

  const stepLabel =
    state.step === "intro"
      ? "Intro"
      : state.step === "question"
      ? `Question ${Math.min(state.qIndex + 1, state.zone.questions.length)}/${state.zone.questions.length}`
      : state.step === "feedback"
      ? "Feedback"
      : "Fin";

  // Top meta — uniquement sur l’écran question
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
        <span className="qs-topmeta__item">{q.retry ? "2 essais max" : "1 essai"}</span>

        {q.penaltyEnabled ? (
          <>
            <span className="qs-topmeta__sep">•</span>
            <span className="qs-topmeta__item">pénalité -{q.penalty ?? 0}</span>
          </>
        ) : null}
      </div>
    ) : undefined;

  // Footer CTA unique — uniquement sur l’écran question
  const footer =
    state.step === "question" && q ? (
      <button
        className="qs-primary"
        type="button"
        onClick={() => qRef.current?.submit()}
        disabled={!canSubmit}
      >
        <CheckCircle2 size={18} />
        <span>Valider</span>
      </button>
    ) : undefined;

  // -------------------------
  // RENDERS PAR STEP
  // -------------------------

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

        <QuestionRenderer
          ref={qRef}
          question={q}
          onSubmit={(answer) => dispatch({ type: "ANSWER", answer })}
          // ✅ rend le footer réactif
          onCanSubmitChange={setCanSubmit}
        />
      </GameHUD>
    );
  }

  if (state.step === "feedback" && state.feedback) {
    // ici, on laisse encore le composant actuel (overlay viendra ensuite)
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