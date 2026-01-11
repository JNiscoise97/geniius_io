import { Link } from "react-router-dom";

export function GameStart() {
  return (
    <div>
      <h2>GameStart</h2>
      <p>Écran de démarrage (placeholder).</p>
      <Link to="/game/auth">Continuer</Link>
    </div>
  );
}
