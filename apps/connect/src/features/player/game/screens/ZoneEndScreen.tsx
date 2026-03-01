// src/features/player/game/screens/ZoneEndScreen.tsx
import { ArrowRight, Trophy } from "lucide-react";

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
    <div>
      <h1 className="qs-question">Zone terminée 🎉</h1>

      <div className="qs-body">
        <div className="qs-topmeta">
          <Trophy size={18} />
          <span className="qs-topmeta__item">
            Score : <b>{score}</b>
          </span>
          <span className="qs-topmeta__sep">•</span>
          <span className="qs-topmeta__item">
            Temps : <b>{durationSec}s</b>
          </span>
        </div>

        <button className="qs-primary" onClick={onBack}>
          <ArrowRight size={18} />
          Continuer
        </button>
      </div>
    </div>
  );
}