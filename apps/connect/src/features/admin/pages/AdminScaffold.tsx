import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";

function navItemClass(isActive: boolean) {
    return [
        "rounded-xl px-3 py-2 text-sm transition",
        isActive
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    ].join(" ");
}

export function AdminScaffold() {
    const location = useLocation();
    const { eventSlug } = useParams<{ eventSlug: string }>();

    async function onLogout() {
        await supabase.auth.signOut();
        window.location.href = "/admin/login";
    }

    const currentEventSlug =
        eventSlug ||
        (location.pathname.match(/^\/admin\/events\/([^/]+)/)?.[1] ?? null);

    return (
        <div className="min-h-screen bg-slate-100 text-slate-950">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                    <div>
                        <Link to="/admin" className="text-lg font-semibold tracking-tight">
                            Admin cousinade
                        </Link>
                        <p className="text-sm text-slate-500">
                            {currentEventSlug
                                ? `Événement actif : ${currentEventSlug}`
                                : "Choisis un événement pour accéder aux outils"}
                        </p>
                    </div>

                    <button
                        onClick={onLogout}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                    >
                        Se déconnecter
                    </button>
                </div>
            </header>

            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Navigation
                        </p>
                    </div>

                    <nav className="space-y-1">
                        <NavLink to="/admin" end className={({ isActive }) => navItemClass(isActive)}>
                            Accueil admin
                        </NavLink>

                        {currentEventSlug ? (
                            <>
                                <NavLink
                                    to={`/admin/events/${currentEventSlug}`}
                                    end
                                    className={({ isActive }) => navItemClass(isActive)}
                                >
                                    Dashboard événement
                                </NavLink>

                                <NavLink
                                    to={`/e/${currentEventSlug}/admin/attendance`}
                                    className={({ isActive }) => navItemClass(isActive)}
                                >
                                    Présences (live app)
                                </NavLink>

                                <NavLink
                                    to={`/e/${currentEventSlug}/moderation`}
                                    className={({ isActive }) => navItemClass(isActive)}
                                >
                                    Modération
                                </NavLink>

                                <NavLink
                                    to={`/e/${currentEventSlug}/announcements/new`}
                                    className={({ isActive }) => navItemClass(isActive)}
                                >
                                    Annonces
                                </NavLink>

                                <NavLink
                                    to={`/admin/events/${currentEventSlug}/participants`}
                                    className={({ isActive }) => navItemClass(isActive)}
                                >
                                    Participants
                                </NavLink>

                                <NavLink
                                    to={`/admin/events/${currentEventSlug}/documents`}
                                    className={({ isActive }) => navItemClass(isActive)}
                                >
                                    Documents analytics
                                </NavLink>
                            </>
                        ) : null}
                    </nav>
                </aside>

                <main className="min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}