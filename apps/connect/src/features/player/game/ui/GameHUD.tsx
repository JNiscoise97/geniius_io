import { useMemo, type ReactNode } from "react";

type GameHUDProps = {
  zoneId: string;
  zoneTitle: string;
  theme?: string;

  stepLabel?: string; // ex: "Intro", "Question 2/10", "Feedback", "Fin"
  score: number;
  durationSec: number;

  rightHint?: ReactNode; // ex: points à gagner, retry, etc.
  children: ReactNode;
};

function zoneLabelFromId(id: string) {
  const m = /^z(\d+)$/i.exec(id.trim());
  if (!m) return `Zone ${id}`;
  return `Zone ${Number(m[1])}`;
}

function formatDuration(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0s";
  if (s < 60) return `${s}s`;
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}m${String(ss).padStart(2, "0")}s`;
}

export function GameHUD({
  zoneId,
  zoneTitle,
  theme,
  stepLabel,
  score,
  durationSec,
  rightHint,
  children,
}: GameHUDProps) {
  const zLabel = useMemo(() => zoneLabelFromId(zoneId), [zoneId]);
  const dur = useMemo(() => formatDuration(durationSec), [durationSec]);

  return (
    <div className="screen">
      {/* Header / HUD */}
      <div
        className="muted"
        style={{
          display: "grid",
          gap: 6,
          padding: "10px 12px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div style={{ display: "grid", gap: 2 }}>
            <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
              {zLabel} • {zoneTitle}
            </span>
            <span style={{ fontSize: 12, opacity: 0.9 }}>
              {theme ? `Thème : ${theme}` : " "}
            </span>
          </div>

          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{dur}</div>
            <div style={{ fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>Score {score}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, opacity: 0.9 }}>{stepLabel ?? ""}</span>
          <span style={{ fontSize: 12, opacity: 0.9 }}>{rightHint ?? null}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}
