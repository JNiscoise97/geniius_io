import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase/client";

export function AdminGuard() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function init() {
      const { data, error } = await supabase.auth.getSession();

      if (!alive) return;

      if (error) {
        console.error("Erreur récupération session admin :", error);
        setIsAuthed(false);
        setLoading(false);
        return;
      }

      setIsAuthed(Boolean(data.session?.user));
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setIsAuthed(Boolean(session?.user));
      setLoading(false);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
          Chargement de l’espace admin…
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}