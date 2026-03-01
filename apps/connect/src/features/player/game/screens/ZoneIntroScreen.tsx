// src/features/player/game/screens/ZoneIntroScreen.tsx
export function ZoneIntroScreen({
  title,
  introText,
  onStart,
}: {
  title: string;
  introText?: string;
  onStart: () => void;
}) {
  return (
    <div>
      <h1 className="qs-question">{title}</h1>

      {introText ? (
        <div className="qs-body">
          <p className="qs-hint" style={{ whiteSpace: "pre-wrap" }}>
            {introText}
          </p>
        </div>
      ) : null}

      <div className="qs-body">
        <button className="qs-primary" onClick={onStart}>
          Commencer la zone
        </button>
      </div>
    </div>
  );
}