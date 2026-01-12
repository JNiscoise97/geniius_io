import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../../lib/supabase/client";

export function AdminGuard() {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      setIsAuthed(Boolean(data.session?.user));
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user));
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="screen">
        <p className="muted">Chargement…</p>
      </div>
    );
  }

  if (!isAuthed) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}
