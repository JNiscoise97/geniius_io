import { useParams, Link } from "react-router-dom";

export function GameStepZone() {
  const { zoneId } = useParams();

  return (
    <div>
      <h2>GameStepZone</h2>
      <p>Zone: {zoneId}</p>
      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/game/end">Fin</Link>
        <Link to="/game/zone/2">Zone 2</Link>
      </div>
    </div>
  );
}
