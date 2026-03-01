// src/features/player/game/screens/FeedbackScreen.tsx
import { useEffect, useMemo } from "react";
import { CheckCircle2, RotateCcw, XCircle, ArrowRight, Camera } from "lucide-react";
import type { FeedbackKind } from "../engine/reducer";
import "../question-screen.css";

export function FeedbackScreen({
  kind,
  delta,
  totalScore,
  onNext,
  onRetry,
}: {
  kind: FeedbackKind;
  delta: number;
  totalScore: number;
  onNext: () => void;
  onRetry: () => void;
}) {
  const isSuccess = kind === "success";
  const isRetry = kind === "retry";
  const isSubmitted = kind === "submitted";
  const isOk = isSuccess || isSubmitted;

  const title = isSuccess
    ? "Bonne réponse !"
    : isRetry
    ? "Essaie encore"
    : isSubmitted
    ? "Photo envoyée"
    : "Mauvaise réponse";

  const Icon = isSubmitted ? Camera : isOk ? CheckCircle2 : XCircle;

  const earnedText = useMemo(() => {
    if (isSubmitted) return "En attente";
    if (isSuccess) return `+ ${Math.abs(delta)} points`;
    if (delta < 0) return `${delta} points`;
    return "0 point";
  }, [delta, isSubmitted, isSuccess]);

  // ✅ Vibration courte (succès uniquement)
  useEffect(() => {
    if (!isSuccess) return;
    if (typeof navigator === "undefined") return;
    if (!("vibrate" in navigator)) return;

    // pattern court : "tap tap"
    // (certains navigateurs ignorent si pas d'interaction utilisateur récente — OK)
    navigator.vibrate?.([18, 22, 18]);
  }, [isSuccess, kind]);

  return (
    <div className={`qs-overlay ${isOk ? "qs-overlay--ok" : "qs-overlay--bad"}`}>
      <div className="qs-overlay__card" role="dialog" aria-live="polite">
        <div className={`qs-overlay__icon ${isOk ? "is-ok" : "is-bad"}`}>
          <Icon size={34} />
        </div>

        <div className="qs-overlay__title">{title}</div>

        {/* ✅ Animation points : pop + montée */}
        <div className={`qs-overlay__earned ${isOk ? "is-ok" : "is-bad"}`}>
          <span className={isSuccess ? "qs-anim-earned" : undefined}>{earnedText}</span>
        </div>

        <div className="qs-overlay__total">
          Score total : <b>{totalScore}</b>
        </div>
      </div>

      <div className="qs-overlay__cta">
        {isRetry ? (
          <button className="qs-primary qs-cta-lg" onClick={onRetry} type="button">
            <RotateCcw size={22} />
            Réessayer
          </button>
        ) : (
          <button className="qs-primary qs-cta-lg" onClick={onNext} type="button">
            Continuer
            <ArrowRight size={22} />
          </button>
        )}
      </div>
    </div>
  );
}