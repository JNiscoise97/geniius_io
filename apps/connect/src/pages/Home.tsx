import { Link } from "react-router-dom";

export function Home() {
  return (
    <div>
      <h1>Bienvenue</h1>
      <p>Refonte Vite + React + TS de Zarlor.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <Link to="/game/start">Démarrer le jeu</Link>
        <Link to="/admin/dashboard-config">Configurer</Link>
      </div>
    </div>
  );
}
