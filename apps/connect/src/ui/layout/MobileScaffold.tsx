import { Link, Outlet, useParams } from "react-router-dom";
import { ProfileSwitcher } from "./ProfileSwitcher";

export function MobileScaffold() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  return (
    <div className="app min-h-screen bg-[color:var(--bg)]">
      <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="c-container flex items-center justify-between gap-3 p-4">
          <Link to={`/e/${slug}/home`} className="min-w-0">
            <h1 className="truncate text-lg font-bold text-indigo-600">
              Geniius.io | Connect
            </h1>
          </Link>

          <ProfileSwitcher />
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}