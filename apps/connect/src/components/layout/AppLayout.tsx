import { Outlet, Link } from "react-router-dom";

export function AppLayout() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/" style={{ fontWeight: 700, textDecoration: "none" }}>
          Geniius Connect
        </Link>

        <nav style={{ display: "flex", gap: 10 }}>
          <Link to="/game/start">Jeu</Link>
          <Link to="/admin/dashboard-config">Config dashboard</Link>
          <Link to="/admin/secure-access-config">Accès sécurisé</Link>
        </nav>
      </header>

      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
