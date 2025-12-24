import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import LoginPage from "../../pages/LoginPage";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
      setLoading(false);
      const sub = supabase.auth.onAuthStateChange((_e, session) => {
        setHasSession(!!session);
      });
      // cleanup
      unsub = () => sub.data.subscription.unsubscribe();
    })();
    return () => unsub();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Chargement…</div>;
  return hasSession ? <>{children}</> : <LoginPage />;
}
