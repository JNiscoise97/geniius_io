import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";

export function AdminLoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) return setError(error.message);

    nav("/admin/events/demo", { replace: true }); // adapte si besoin
  }

  return (
    <div className="screen">
      <h1 className="h1">Admin</h1>

      <div className="stack">
        <input className="btn" style={{ textAlign: "left" }} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="btn" style={{ textAlign: "left" }} placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn--primary" onClick={onLogin} disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </div>

      {error ? (
        <div style={{ border: "1px solid rgba(255,0,0,0.35)", padding: 12, borderRadius: 12, marginTop: 12 }}>
          <strong>Erreur :</strong> <span className="muted">{error}</span>
        </div>
      ) : null}
    </div>
  );
}
