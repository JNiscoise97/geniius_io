import { useState } from "react";
import { FileText, Home, Users, StickyNote } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import type { Storage as DataStorage } from "@echo/data"


type UpperTab = "Overview" | "Activities";

export function App({
  storage,
  showTopbar = false,
}: {
  storage: DataStorage;
  showTopbar?: boolean;
}) {
  const [upper, setUpper] = useState<UpperTab>("Overview");

  return (
    // ⬇️ ne pas utiliser 100vh ici : on remplit l'espace donné par Layout
    <div className="container" style={{ height: "100%", minHeight: 0 }}>
      {/* Sidebar */}
      <aside
        className="sidebar"
        aria-label="Navigation principale"
        style={{
          display: "flex",
          flexDirection: "column",
          // ⬇️ idem : height 100% au lieu de 100vh
          height: "100%",
          borderRight: "1px solid var(--border)",
          background: "#fff",
        }}
      >
        <NavIcon to="/" title="Home" end>
          <Home size={18} />
        </NavIcon>
        <NavIcon to="/contacts" title="Contacts">
          <Users size={18} />
        </NavIcon>
        <NavIcon to="/notes" title="Notes">
          <StickyNote size={18} />
        </NavIcon>
        <div style={{ flex: 1 }} />
      </aside>

      {/* Colonne principale : .main est une grille (topbar 56px + 1fr) via ton CSS */}
      <section
        className="main"
        style={{
          minHeight: 0,
          minWidth: 0,
          // ⬅️ override le template quand la topbar est cachée
          gridTemplateRows: showTopbar ? undefined : "1fr",
        }}
      >
        {showTopbar && (
          <div className="topbar">
            <div className="hstack" style={{ gap: 12 }}>
              <strong>Echo</strong>
              <span className="small muted">PWA • Offline-first</span>
            </div>
            <div className="hstack small">
              <span>Customize records</span>
              <div className="toggle" style={{ marginLeft: 12 }}>
                <button
                  className={upper === "Overview" ? "active" : ""}
                  onClick={() => setUpper("Overview")}
                >
                  Overview
                </button>
                <button
                  className={upper === "Activities" ? "active" : ""}
                  onClick={() => setUpper("Activities")}
                >
                  Activities
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ⬇️ une seule zone scroll : ici */}
        <div className="content" style={{ overflow: "auto", minHeight: 0, minWidth: 0 }}>
          <Outlet context={{ storage, upper }} />
        </div>
      </section>
    </div>
  );
}

function NavIcon({
  to,
  title,
  end,
  children,
}: {
  to: string;
  title: string;
  end?: boolean;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      title={title}
      end={end}
      className={(args: { isActive: boolean }) =>
        `nav-btn ${args.isActive ? "active" : ""}`
      }
    >
      {children}
    </NavLink>
  );
}

export default App;
