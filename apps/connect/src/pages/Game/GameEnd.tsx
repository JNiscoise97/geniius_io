import { Link } from "react-router-dom";

export function GameEnd() {
  return (
    <div>
      <h2>GameEnd</h2>
      <p>Fin du jeu (placeholder).</p>
      <Link to="/game/start">Rejouer</Link>
    </div>
  );
}
