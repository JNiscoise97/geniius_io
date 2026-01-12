import { Outlet } from "react-router-dom";

export function MobileScaffold() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__title">Connect</div>
        <div className="topbar__meta">mobile</div>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <footer className="bottombar">
        <span className="bottombar__hint">Scan → équipe → standby</span>
      </footer>
    </div>
  );
}
