//ZonePlayPage.tsx

import { useMemo, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuestionRenderer } from "../questions/QuestionRenderer";
import { ZoneIntroScreen } from "../screens/ZoneIntroScreen";
import { FeedbackScreen } from "../screens/FeedbackScreen";
import { ZoneEndScreen } from "../screens/ZoneEndScreen";
import { createInitialState, gameReducer } from "../engine/reducer";
import type { ZoneContent, AnyQuestion } from "../engine/types";
import { getLocalEvent } from "../../../../lib/content/contentLoader";
import { GameHUD } from "../ui/GameHUD";

function toZoneContent(eventSlug: string, zoneId: string): ZoneContent {
  const data = getLocalEvent(eventSlug);
  if (!data) throw new Error("Event not found");

  const zone = data.zones.find((z) => z.id === zoneId);
  if (!zone) throw new Error("Zone not found");

  const questions = (zone.rawFrontmatter?.questions ?? []) as AnyQuestion[];
  return {
    id: zone.id,
    title: zone.title,
    theme: zone.theme,
    introText: zone.body?.slice(0, 240) || undefined,
    questions,
  };
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

  // Labels
  const stepLabel =
    state.step === "intro"
      ? "Intro"
      : state.step === "question"
      ? `Question ${Math.min(state.qIndex + 1, state.zone.questions.length)}/${state.zone.questions.length}`
      : state.step === "feedback"
      ? "Feedback"
      : "Fin";

  // “pour combien de points on joue” (affiché sur l’écran question)
  const rightHint =
    state.step === "question" && q ? (
      <>
        {q.points ?? 10} pts
        {q.penaltyEnabled ? ` • -${q.penalty ?? 0}` : ""}
        {q.retry ? " • retry" : ""}
      </>
    ) : null;

  if (state.step === "intro") {
    return (
      <GameHUD
        zoneId={state.zone.id}
        zoneTitle={state.zone.title}
        theme={state.zone.theme}
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
        theme={state.zone.theme}
        stepLabel={stepLabel}
        score={state.score}
        durationSec={durationSec}
        rightHint={rightHint}
      >
        <h1 className="h1" style={{ marginTop: 4 }}>
          {q.prompt}
        </h1>

        <QuestionRenderer question={q} onSubmit={(answer) => dispatch({ type: "ANSWER", answer })} />
      </GameHUD>
    );
  }

  if (state.step === "feedback" && state.feedback) {
    return (
      <GameHUD
        zoneId={state.zone.id}
        zoneTitle={state.zone.title}
        theme={state.zone.theme}
        stepLabel={stepLabel}
        score={state.score}
        durationSec={durationSec}
        rightHint={
          state.feedback.correct
            ? `+${Math.abs(state.feedback.delta)} pts`
            : state.feedback.delta < 0
            ? `${state.feedback.delta} pts`
            : "0 pt"
        }
      >
        <FeedbackScreen
          kind={state.feedback.kind}
          delta={state.feedback.delta}
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
        theme={state.zone.theme}
        stepLabel={stepLabel}
        score={state.score}
        durationSec={durationSec}
      >
        <ZoneEndScreen score={state.score} durationSec={durationSec} onBack={() => nav(`/e/${slug}/standby`)} />
      </GameHUD>
    );
  }

  return (
    <GameHUD
      zoneId={state.zone.id}
      zoneTitle={state.zone.title}
      theme={state.zone.theme}
      stepLabel="Erreur"
      score={state.score}
      durationSec={durationSec}
    >
      <p className="muted">État inattendu.</p>
    </GameHUD>
  );
}
