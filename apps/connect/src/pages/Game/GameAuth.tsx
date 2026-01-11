import { Link } from "react-router-dom";

export function GameAuth() {
  return (
    <div>
      <h2>GameAuth</h2>
      <p>Authentification (placeholder).</p>
      <Link to="/game/zone/1">Aller à la zone 1</Link>
    </div>
  );
}
