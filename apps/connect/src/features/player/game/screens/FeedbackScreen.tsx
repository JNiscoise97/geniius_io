// src/features/player/game/screens/FeedbackScreen.tsx
import { useEffect, useMemo } from "react";
import {
  CheckCircle2,
  RotateCcw,
  XCircle,
  ArrowRight,
  Camera,
} from "lucide-react";
import type { FeedbackKind } from "../engine/reducer";
import "../question-screen.css";

export function FeedbackScreen({
  kind,
  delta,
  totalScore,
  onNext,
  onRetry,

  // ✅ tentatives (optionnel mais recommandé)
  triesLeft,
  maxAttempts,
}: {
  kind: FeedbackKind;
  delta: number;
  totalScore: number;
  onNext: () => void;
  onRetry: () => void;

  triesLeft?: number; // nb d'essais restants APRES la tentative qui a mené à ce feedback
  maxAttempts?: number; // ex: 1 ou 2 (info affichage)
}) {
  const isSuccess = kind === "success";
  const isRetryKind = kind === "retry";
  const isSubmitted = kind === "submitted";
  const isOk = isSuccess || isSubmitted;

  const triesLeftSafe =
    typeof triesLeft === "number" && Number.isFinite(triesLeft)
      ? Math.max(0, Math.floor(triesLeft))
      : undefined;

  const canRetry =
    isRetryKind && (triesLeftSafe === undefined ? true : triesLeftSafe > 0);

  const title = isSuccess
    ? "Bonne réponse !"
    : canRetry
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
    navigator.vibrate?.([18, 22, 18]);
  }, [isSuccess]);

  const attemptsLine = useMemo(() => {
    // ✅ Ne jamais afficher quand succès / photo / retry indisponible
    if (isSuccess) return null;
    if (isSubmitted) return null;
    if (!canRetry) return null; // donc pas en mode retry OU plus d'essais

    // à ce stade: kind === "retry" et retry possible
    if (triesLeftSafe === undefined && typeof maxAttempts !== "number") return null;

    const max =
      typeof maxAttempts === "number" && Number.isFinite(maxAttempts)
        ? Math.max(1, Math.floor(maxAttempts))
        : undefined;

    if (triesLeftSafe === undefined) {
      return (
        <div className="qs-overlay__meta">
          Essais max : <b>{max}</b>
        </div>
      );
    }

    return (
      <div className="qs-overlay__meta">
        Essais restants : <b>{triesLeftSafe}</b>
        {max ? <span style={{ opacity: 0.7 }}> / {max}</span> : null}
      </div>
    );
  }, [isSuccess, isSubmitted, canRetry, triesLeftSafe, maxAttempts]);

  return (
    <div className={`qs-overlay ${isOk ? "qs-overlay--ok" : "qs-overlay--bad"}`}>
      <div className="qs-overlay__card" role="dialog" aria-live="polite">
        <div className={`qs-overlay__icon ${isOk ? "is-ok" : "is-bad"}`}>
          <Icon size={34} />
        </div>

        <div className="qs-overlay__title">{title}</div>

        {/* ✅ Animation points : pop + montée */}
        <div className={`qs-overlay__earned ${isOk ? "is-ok" : "is-bad"}`}>
          <span className={isSuccess ? "qs-anim-earned" : undefined}>
            {earnedText}
          </span>
        </div>

        {attemptsLine}

        <div className="qs-overlay__total">
          Score total : <b>{totalScore}</b>
        </div>
      </div>

      <div className="qs-overlay__cta">
        {canRetry ? (
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