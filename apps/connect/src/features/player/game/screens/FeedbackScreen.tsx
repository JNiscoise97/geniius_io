import type { FeedbackKind } from "../engine/reducer";

export function FeedbackScreen({
  kind,
  delta,
  onNext,
  onRetry,
}: {
  kind: FeedbackKind;
  delta: number;
  onNext: () => void;
  onRetry: () => void;
}) {
  const title =
    kind === "success"
      ? "✅ Bonne réponse !"
      : kind === "retry"
      ? "🔁 Essaie encore"
      : kind === "submitted"
      ? "📸 Photo envoyée"
      : "❌ Mauvaise réponse";

  const hint =
    kind === "success"
      ? `+${Math.abs(delta)} points`
      : kind === "retry"
      ? "Tu peux recommencer."
      : kind === "submitted"
      ? "Validation par l’organisateur en cours. Les points seront ajoutés plus tard."
      : delta < 0
      ? `${delta} points`
      : "Pas de points sur cette question.";

  return (
    <div className="screen">
      <h1 className="h1">{title}</h1>
      <p className="muted">{hint}</p>

      {kind === "retry" ? (
        <button className="btn btn--primary" onClick={onRetry}>
          Recommencer
        </button>
      ) : (
        <button className="btn btn--primary" onClick={onNext}>
          Continuer
        </button>
      )}
    </div>
  );
}
