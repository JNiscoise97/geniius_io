import { Link, Outlet } from "react-router-dom";

export function MobileScaffold() {
  return (
    <div className="app">
      <header className="shrink-0 bg-white shadow p-4 flex items-center justify-between">
      <Link to="/">
        <h1 className="text-lg font-bold text-indigo-600">Geniius.io | Connect</h1>
      </Link>
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
