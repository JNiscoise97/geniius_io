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
    <div className="screen">
      <h1 className="h1">{title}</h1>
      {introText ? <p className="muted">{introText}</p> : null}
      <button className="btn btn--primary" onClick={onStart}>
        Commencer la zone
      </button>
    </div>
  );
}
