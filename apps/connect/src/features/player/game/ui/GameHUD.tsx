// src/features/player/game/ui/GameHUD.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Wifi, WifiOff, Trophy, Timer } from "lucide-react";
import "../question-screen.css";

type GameHUDProps = {
  zoneId: string;
  zoneTitle: string;

  stepLabel?: string;
  score: number;
  durationSec: number;

  // ⬇️ NEW : meta “question” façon mock (pill + pts + essais + pénalité + attemptsLeft)
  topmeta?: ReactNode;

  children: ReactNode;
  footer?: ReactNode;
};

function formatDuration(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0s";
  if (s < 60) return `${s}s`;
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm} m ${String(ss).padStart(2, "0")} s`;
}

export function GameHUD({
  zoneId,
  zoneTitle,
  stepLabel,
  score,
  durationSec,
  topmeta,
  children,
  footer,
}: GameHUDProps) {

  console.log("zoneId", zoneId)

  const [elapsed, setElapsed] = useState<number>(() =>
    Number.isFinite(durationSec) && durationSec >= 0 ? durationSec : 0
  );

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Quand la base change (ex: reset zone / nouvelle zone), on resynchronise.
  useEffect(() => {
    setElapsed(Number.isFinite(durationSec) && durationSec >= 0 ? durationSec : 0);
  }, [durationSec]);

  // Tick
  useEffect(() => {
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const durLabel = useMemo(() => formatDuration(elapsed), [elapsed]);
  return (
    <div className="qs-root">
      <div className="qs-container">
        <header className="qs-header">
          <div className="qs-header__top">
            <div className="qs-titleblock">
              <div className="qs-zone">
                {zoneTitle}
              </div>
              <div className="qs-progress">
                {stepLabel ?? ""}
              </div>
            </div>

            <div className={`qs-online ${isOnline ? "is-online" : "is-offline"}`}>
              {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
              {isOnline ? "En ligne" : "Hors-ligne"}
            </div>
          </div>

          <div className="qs-header__bottom">
            <div className="qs-temps" aria-label="Temps écoulé">
              <Timer size={16} />
              <span>
                Temps :{" "}
                <b className="qs-time" aria-live="off">
                  {durLabel}
                </b>
              </span>
            </div>

            <div className="qs-score">
              <Trophy size={16} />
              <span>
                Score : <b>{score}</b>
              </span>
            </div>
          </div>
        </header>

        {/* ✅ Meta sous le header, au-dessus de la question (comme le mock) */}
        {topmeta ? <div style={{ marginTop: 10 }}>{topmeta}</div> : null}

        <main className="qs-card">{children}</main>

        {footer ? <div className="qs-spacer" /> : null}
        {footer ? (
          <footer className="qs-footer">
            <div className="qs-footer__wrap">
              <div className="qs-footer__inner">{footer}</div>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}