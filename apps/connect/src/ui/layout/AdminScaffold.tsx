import { Link, Outlet } from "react-router-dom";

export function AdminScaffold() {
  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <strong>Connect Admin</strong>
        <Link to="/" style={{ fontSize: 14 }}>
          Retour joueur
        </Link>
      </header>

      <div style={{ marginTop: 16 }}>
        <Outlet />
      </div>
    </div>
  );
}
