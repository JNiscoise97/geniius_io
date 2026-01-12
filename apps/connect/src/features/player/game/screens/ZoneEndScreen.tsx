export function ZoneEndScreen({
  score,
  durationSec,
  onBack,
}: {
  score: number;
  durationSec: number;
  onBack: () => void;
}) {
  return (
    <div className="screen">
      <h1 className="h1">Zone terminée 🎉</h1>
      <p className="muted">Score : <strong>{score}</strong></p>
      <p className="muted">Temps : <strong>{durationSec}s</strong></p>
      <button className="btn btn--primary" onClick={onBack}>
        Revenir
      </button>
    </div>
  );
}
